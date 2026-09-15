// The customer file — the spine. One thread from the machine's first text to
// the final invoice, the asks with their clocks, the proof on the file, who
// touched it. Every seat writes on the same file; the database decides the
// lanes (090/091) and the line the text goes out on (306).
import { state, isDemo, personName, firstName, loadFile, textCustomer, cancelText, takeJob, handBack, assignJob, addDoc, adoptJob, postMessage, openAsk, ensureThread, seatName, linePreview, threadForJob, mentionSeen, invoiceRequest, createEstimate, parcelLookup, fillPaperwork, openPaperwork, openPacketFile } from './book.js?v=36';
import { $, html, raw, esc, toast, openModal } from './ui.js?v=36';
import { STAGES, stageLabel, brandName, askLabel, ASK_LABEL } from './config.js?v=36';
import { say, thing, iconForAsk } from './words.js?v=36';
import { settleDialog } from './office.js?v=36';
import { reload } from './app.js?v=36';
import { relTime } from './production.js?v=36';

let current = null;    // { customerId, data }
let peek = null;       // the drawer's own { customerId, data }
const money = (n) => n == null ? '' : '$' + Math.round(Number(n)).toLocaleString();
const mins = (m) => m == null ? '' : m >= 1440 ? (m / 1440).toFixed(1) + ' d' : m >= 60 ? (m / 60).toFixed(1) + ' h' : Math.round(m) + ' min';
const when = (iso) => { const d = new Date(iso); const today = new Date().toDateString() === d.toDateString(); return (today ? 'today' : d.toLocaleDateString([], { month: 'short', day: 'numeric' })) + ' · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
const chev = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"></path></svg>';

export function renderFiles(root) {
  const B = state.board.filter((b) => !b.stale).sort((a, b) => new Date(b.last_inbound_at || 0) - new Date(a.last_inbound_at || 0)).slice(0, 40);
  root.innerHTML = html`
    <div class="head"><div><div class="kicker">Files · every customer the seat can read</div><h1 class="serif">Find a customer above, or pick one who texted last.</h1></div></div>
    <div class="card"><div class="wrap"><table><thead><tr><th>Customer</th><th>Brand</th><th>Stage</th><th>Who holds it</th><th>Last customer text</th></tr></thead><tbody>
      ${raw(B.map((b) => `<tr class="link" onclick="__peek('${esc(b.customer_id)}')"><td><b>${esc(personName(b.customer_name))}</b> · ${esc(b.title || '')}</td><td><span class="chip">${esc(brandName(b.cc_company_id))}</span></td><td><span class="chip ${STAGES[b.stage]?.cls || 'st-ink'}">${esc(stageLabel(b.stage))}</span></td><td>${esc(b.owner_name || 'nobody')}</td><td>${b.last_inbound_body ? '"' + esc(String(b.last_inbound_body).slice(0, 70)) + '" · ' + esc(relTime(b.last_inbound_at)) : '<span class="dimmer">—</span>'}</td></tr>`).join(''))}
    </tbody></table></div></div>`;
}

export async function openFile(customerId) {
  const root = $('#view-file');
  root.innerHTML = '<div class="empty">Opening the file…</div>';
  const data = await loadFile(customerId);
  current = { customerId, data };
  draw(root, current, false);
}

/* The thread beside any room: same file, same composers, in the side panel. */
export async function openFileDrawer(customerId) {
  const aside = $('#drawer'), root = $('#drawer-body');
  aside.hidden = false;
  root.innerHTML = '<div class="empty">Opening the file…</div>';
  try {
    const data = await loadFile(customerId);
    peek = { customerId, data };
    draw(root, peek, true);
  } catch (e) { root.innerHTML = '<div class="empty">' + esc(e.message || 'Could not open the file') + '</div>'; }
}
export function closeDrawer() { $('#drawer').hidden = true; $('#drawer-body').innerHTML = ''; peek = null; }
window.__peek = openFileDrawer;
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#drawer').hidden) closeDrawer(); });

function draw(root, ctx, compact) {
  const q = (s) => root.querySelector(s);
  const { job, customer, texts, emails, thread, messages, asks, attachments, handoffs, outbox } = ctx.data;
  const me = state.me;
  const name = personName(customer?.name || job.customer_name);
  const st = STAGES[job.stage] || {};
  const isSup = job.supervisor_id && job.supervisor_id === me?.id;
  const canTake = ['manager', 'office', 'admin', 'owner'].includes(me?.role) && job.job_id && job.stage === 'sold_office';
  const staff = ['manager', 'office', 'admin', 'owner'].includes(me?.role);
  const openAsks = asks.filter((a) => a.state === 'OPEN');
  const doneAsks = asks.filter((a) => a.state !== 'OPEN').slice(-6);
  const paperwork = asks.filter((a) => a.ask_type === 'CONTRACT_DOC');
  // a signed job with no asks on it is still being run in Contractors Cloud: one question adopts it (317)
  const unfiled = !!job.job_id && !!job.contract_signed_at && openAsks.length === 0 && !['paid'].includes(job.stage) && ['manager', 'office', 'admin', 'owner'].includes(me?.role);
  const roofing = ['1537', '1563'].includes(String(job.cc_company_id));
  const ADOPT = [['paperwork', 'Paperwork'], ['permit', 'Permit'], ...(roofing ? [] : [['locate', 'Locate']]), ['schedule', 'Schedule'], ['production', 'In production'], ['inspection', 'Final inspection'], ['invoice', 'Invoice'], ['payment', 'Collecting'], ['closeout', 'Close-out']];
  const line = state.lines.find((l) => l.cc_company_id === (job.cc_company_id || '1461')) || state.lines[0];
  const optOut = customer?.sms_opt_out_at || job.sms_opt_out_at;
  const estimates = ctx.data.estimates || [], estLinks = ctx.data.estLinks || [];   // 322

  // the stage bar: what has happened on this file, in order
  const steps = [];
  if (job.stage) {
    const order = ['booked', 'selling', 'sold_office', 'production', 'field_complete', 'invoiced', 'paid'];
    const idx = order.indexOf(job.stage);
    order.slice(0, idx + 1).forEach((s) => {
      const holder = s === 'production' ? firstName(seatName(job.supervisor_id) || job.owner_name || '') : s === job.stage ? firstName(job.owner_name || '') : '';
      const stamp = s === 'sold_office' && job.contract_signed_at ? new Date(job.contract_signed_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : s === job.stage && job.days_in_stage != null ? 'day ' + Math.max(1, Math.ceil(job.days_in_stage)) : '';
      steps.push(`<span class="chip ${STAGES[s].cls}${s === job.stage ? '' : ''}">${esc(stageLabel(s).toUpperCase())}${holder ? ' · ' + esc(holder.toUpperCase()) : ''}${stamp ? ' · ' + esc(stamp.toUpperCase()) : ''}</span>`);
    });
  }

  // the thread: texts + emails + notes + every document and step, in time
  // order — each one saying WHO and from WHERE (Kevin, 14 Sep: "every rep is
  // color coded, every employee a different color… everyone can go in there
  // and know what's going on"). A person is a color; the line is a label.
  const items = [];
  texts.forEach((t) => {
    if (t.direction === 'inbound') { items.push({ at: t.occurred_at, kind: 'in', who: name, body: t.body || (t.has_media ? '(photo)' : ''), media: t.media_url }); return; }
    const machine = t.feed_source === 'machine' || /Reply STOP/.test(t.body || '');
    const s = machine ? { id: 'machine', name: 'The machine', line: lineLabel(t.from_number, job) } : senderOf(t, job);
    items.push({ at: t.occurred_at, kind: machine ? 'machine' : 'out', pid: s.id, who: s.name, line: s.line, body: t.body || (t.has_media ? '(photo)' : ''), media: t.media_url });
  });
  outbox.filter((o) => o.status !== 'cancelled' && !texts.some((t) => t.direction === 'outbound' && t.body === o.body)).forEach((o) => {
    const p = personOf(o.rep_id);
    items.push({ at: o.sent_at || o.queued_at, kind: 'out', pid: o.rep_id, who: (p?.name || 'you') + (o.status === 'sent' ? '' : ' · ' + o.status), line: lineLabel(o.from_number, job, p), body: o.body });
  });
  emails.forEach((e) => items.push({ at: e.occurred_at, kind: 'env', pid: e.source === 'machine' ? 'machine' : job.rep_id, body: `${e.subject || 'Email'} · ${e.source === 'machine' ? 'the machine' : (personOf(job.rep_id)?.name || 'the rep')} · ${e.status}${e.opened ? ' · opened' : ''}` }));
  messages.forEach((m) => items.push({ at: m.created_at, kind: m.is_system ? 'sys' : 'chat', pid: m.is_system ? null : m.author_id, who: m.is_system ? '' : (m.author_name || '') + ' · team note', body: m.is_system ? say(m.body) : m.body, lane: m.lane }));
  // the steps and the paper, as one line each, where they happened
  const ev = (at, cls, pid, body) => { if (at) items.push({ at, kind: 'ev', cls, pid, body }); };
  attachments.forEach((f) => ev(f.created_at, 'file', f.added_by, `${f.label || f.storage_path || f.source} · on the file`));
  (ctx.data.packet || []).forEach((p) => ev(p.uploaded_at, 'file', p.uploaded_by, `${PROOF_LABEL[p.kind] || p.kind}${p.signed ? ' · signed' : ''} · filed from the calculator`));
  (ctx.data.filled || []).forEach((f) => ev(f.filled_at, 'file', personByName(f.filled_by)?.id, `${FORM_LABEL[f.form_key] || f.form_key} · filled from the file${(f.blanks || []).length ? ' · ' + f.blanks.length + ' blanks for the office' : ''}`));
  estimates.forEach((d) => { ev(d.created_at, 'file', job.rep_id, `Estimate #${d.serial_number} · ${fmtMoney(d.total)} · one link`); ev(d.accepted_at, 'money', null, `ACCEPTED · estimate #${d.serial_number} · the customer tapped yes`); });
  if (ctx.data.fence) ev(ctx.data.fence.created_at, 'file', ctx.data.fence.rep_id, `The fence job · ${ctx.data.fence.linear_ft} ft · ${fmtMoney(ctx.data.fence.quote)} · Complete Quote in the calculator`);
  if (ctx.data.parcel) ev(ctx.data.parcel.fetched_at, ctx.data.parcel.signer_match === 'mismatch' ? 'bad' : 'file', null, `Owner of record · ${(ctx.data.parcel.owner_names || []).join(' & ') || '—'} · ${ctx.data.parcel.signer_match === 'match' ? 'matches the signer' : ctx.data.parcel.signer_match === 'mismatch' ? 'NOT the signer' : 'from the county'}`);
  handoffs.forEach((h) => ev(h.at, 'step', h.to_seat, `${seatName(h.to_seat) || 'nobody'} ${h.kind === 'handback' ? 'handed it back' : h.kind === 'assign' ? 'was assigned by ' + (seatName(h.by_id) || '') : 'took the job'}${h.note ? ' · ' + h.note : ''}`));
  asks.filter((a) => a.state !== 'OPEN' && a.closed_at).forEach((a) => ev(a.closed_at, 'step', a.assignee_id, a.state === 'VOID' ? `${(a.assignee_name || 'someone').split(' ')[0]} took ${thing(a)} off the list${a.void_reason ? ' — ' + a.void_reason : ''}` : a.proof?.waived ? `${(a.assignee_name || 'someone').split(' ')[0]} skipped ${thing(a)}: ${a.proof.waived}` : `${(a.assignee_name || 'someone').split(' ')[0]} turned in ${thing(a)}${a.proof?.value ? ': ' + a.proof.value : ''}`));
  if (job.contract_signed_at) ev(job.contract_signed_at, 'money', job.rep_id, `SOLD · ${money(job.fin_sold_amount)} · ${job.rep_name || ''}`);
  if (job.completed_at) ev(job.completed_at, 'step', job.supervisor_id, 'Field complete');
  items.sort((a, b) => new Date(a.at) - new Date(b.at));
  // who moved through this file, in order: one colored segment per run of the same person
  const journey = [];
  items.forEach((i) => { if (!i.pid || i.kind === 'sys') return; const last = journey[journey.length - 1]; if (last && last.pid === i.pid) { last.n++; last.to = i.at; } else journey.push({ pid: i.pid, n: 1, from: i.at, to: i.at }); });

  root.innerHTML = html`
    <div class="head drawer-top" style="margin-bottom:10px">
      <div class="small">${compact ? raw('<button class="btn sm" id="drawer-close">Close</button> <button class="btn sm fill" id="drawer-full">Open the full file</button>') : raw('<a href="#" id="file-back">← back</a>')}</div>
      <div class="right">${isDemo() ? raw('<span class="chip demo">DEMO</span>') : ''}</div>
    </div>
    <div class="card" style="flex-direction:row;align-items:center;gap:18px;flex-wrap:wrap">
      <div style="flex-grow:1;min-width:0">
        <div class="kicker">The customer file · one file, every room writes on it</div>
        <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-top:4px"><h1 class="serif" style="margin:0">${name}</h1><span class="dim">${raw(esc(job.title || '') + (job.fin_sold_amount ? ' · <span class="mono">' + esc(money(job.fin_sold_amount)) + '</span>' : ''))}${job.contract_signed_at ? ' signed ' + esc(new Date(job.contract_signed_at).toLocaleDateString([], { month: 'short', day: 'numeric' })) : ''}${job.rep_name ? ' by ' + esc(firstName(job.rep_name)) : ''} · ${esc(brandName(job.cc_company_id))}</span></div>
        <div class="stagebar" style="margin-top:8px">${raw(steps.join(chev))}</div>
        ${journey.length ? raw(`<div class="journey" title="Who moved through this file, in order">${journey.map((j) => { const p = j.pid === 'machine' ? { name: 'The machine' } : personOf(j.pid); const c = colorFor(j.pid); return `<span style="--c:${c.c};flex-grow:${j.n}" title="${esc((p?.name || 'someone') + ' · ' + new Date(j.from).toLocaleDateString([], { month: 'short', day: 'numeric' }) + (j.n > 1 ? ' · ' + j.n : ''))}"></span>`; }).join('')}</div><div class="journey-who">${[...new Set(journey.map((j) => j.pid))].map((pid) => { const p = pid === 'machine' ? { name: 'The machine', initials: 'AI' } : personOf(pid); const c = colorFor(pid); return `<span class="pill" style="--c:${c.c};--cs:${c.cs}"><i class="av">${esc(initialsOf(p))}</i>${esc(pid === 'machine' ? 'The machine' : firstName(p?.name || 'someone'))}</span>`; }).join('')}</div>`) : ''}
        ${raw((() => { const n = fileNext(job, openAsks, estimates, ctx.data.parcel, customer, canTake); return `<div class="next ${n.tone}" style="margin-top:10px"><b>NEXT</b> ${esc(n.text)}</div>`; })())}
        ${unfiled ? raw(`<div class="adopt" style="margin-top:10px;padding:10px 12px;border:1px dashed var(--gold);border-radius:10px;background:var(--paper2, transparent)"><div class="kicker" style="color:var(--gold)">Still run in Contractors Cloud · where is it right now?</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${ADOPT.map(([k, l]) => `<button class="btn sm" data-adopt="${k}">${esc(l)}</button>`).join('')}</div><div class="small dimmer" style="margin-top:6px">One tap opens exactly that ask on the right seat, clock starting today. Nothing else opens.</div></div>`) : ''}
        ${optOut ? raw('<div class="red small" style="margin-top:6px">This customer said STOP — no texts go out.</div>') : ''}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${customer?.phone ? raw(`<a class="btn" href="tel:${esc(customer.phone)}">Call</a>`) : ''}
        ${customer?.email ? raw(`<a class="btn" href="mailto:${esc(customer.email)}">Email</a>`) : ''}
        <button class="btn" id="file-text" title="Text the customer from the main line">Text</button>
        <button class="btn" id="file-tag" title="Note to the team · tag the next person">Tag</button>
        ${customer ? raw('<button class="btn" id="file-estimate" title="Build the itemized estimate · one link · they tap ACCEPT">Estimate</button>') : ''}
        ${job.job_id ? raw('<button class="btn" id="file-doc" title="Put a document on the file">+ Document</button>') : ''}
        ${staff && job.job_id ? raw('<button class="btn" id="file-send" title="Hand this file to a seat">Send to…</button>') : ''}
        ${staff && job.job_id ? raw('<button class="btn" id="file-invoice" title="Queue this job\'s invoice for QuickBooks">Invoice</button>') : ''}
        ${staff && customer && !optOut ? raw('<button class="btn" id="file-collect" title="Text the customer the payment link">Collect</button>') : ''}
        ${canTake ? raw('<button class="btn fill" id="file-take">Take the job</button>') : ''}
        ${isSup && job.stage === 'production' ? raw('<button class="btn" id="file-back-job">Hand it back</button>') : ''}
      </div>
    </div>

    <!-- THE CONVERSATION, HORIZONTAL (Kevin, 14 Sep: "you can't read any of the chat because it's too small… go horizontal:
         a way larger screen on one side with the texting box, and on the other side all the pre-written things to send").
         Left: the thread, big, and the box you type in. Right: the lines — tap one, it fills the box, edit, Send. -->
    <div class="card convo">
      <div class="convo-main">
        <div class="head" style="margin-bottom:4px"><div class="kicker" style="font-size:11px;color:var(--gold)">The customer's line · ${line ? esc(line.label + ' ' + line.line_e164) : 'no main line yet'} to ${esc(customer?.phone || 'no phone on file')}</div><span class="chip">TEXTS · EMAILS · THE FILE</span></div>
        <div class="thread" id="thread">
          ${items.length ? raw(items.map(bubble).join('')) : raw('<div class="empty">Nothing on the line yet. The first text from here starts the thread.</div>')}
        </div>
        <div class="composer">
          <textarea id="compose" placeholder="${optOut ? 'Customer said STOP' : `Text ${esc(firstName(name))} as ${esc(firstName(me?.name || ''))}, from ${esc(line?.label || 'the main line')}…`}" ${optOut ? 'disabled' : ''}></textarea>
          <button class="btn fill" id="send" ${optOut || !customer?.phone ? 'disabled' : ''}>Send</button>
        </div>
        <div class="small">Sent from the file on the brand's main line, credited to you. Six seconds to undo. A line fills in with this customer's name and brand; edit it before you send.</div>
      </div>
      <div class="convo-side">
        <div class="kicker">Things to say · tap one, it fills the box on the left · edit it · Send</div>
        <div class="lines" id="lines"><div class="small">Loading the lines…</div></div>
        <div class="kicker" style="margin-top:14px">Note to the team · the customer never sees this · tag the next person</div>
        <div class="subs" style="margin:4px 0 6px">
          <select id="note-to" style="width:auto;padding:5px 8px;font-size:12px"><option value="">To: nobody in particular</option><option value="@office">@office · the office seat</option><option value="@schedule">@schedule · scheduling</option><option value="@production">@production · the supervisor</option><option value="@rep">@rep · who sold it</option><option value="@invoice">@invoice · billing</option>${raw(state.seats.map((s) => `<option value="@${esc(firstName(s.name))}">@${esc(firstName(s.name))} · ${esc(s.name)}</option>`).join(''))}</select>
          <select id="note-what" style="width:auto;padding:5px 8px;font-size:12px"><option value="">What: a note</option>${raw(Object.keys(ASK_LABEL).map((t) => `<option value="${t}">Task: ${esc(ASK_LABEL[t])}</option>`).join(''))}</select>
        </div>
        <div class="composer" style="background:var(--officesoft)">
          <textarea id="note" placeholder="permit is in, ready to schedule · take this one · customer asked for you"></textarea>
          <button class="btn" id="note-send">Post</button>
        </div>
        <div class="small">They get a push, and it sits in their Tagged list until they open this file. A task also opens an ask on them with the clock running.</div>
      </div>
    </div>

    <div class="grid-file cards">
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="card">
          <div class="head" style="margin-bottom:0"><div class="kicker">Asks on this file · the clock is the point</div>${thread ? raw('<button class="btn sm" id="new-ask">+ Ask</button>') : ''}</div>
          ${openAsks.length ? raw(openAsks.map((a) => askRow(a, me)).join('')) : raw('<div class="small">No open asks.</div>')}
          ${doneAsks.length ? raw('<div class="kicker" style="margin-top:8px">Settled</div>' + doneAsks.map((a) => `<div class="ask done" style="grid-template-columns:auto 1fr auto"><span class="check done"></span><span>${esc(askLabel(a))} · ${esc(a.assignee_name || '')}${a.proof?.value ? ' · ' + esc(a.proof.value) : ''}${a.proof?.waived ? ' · waived: ' + esc(a.proof.waived) : ''}</span><span class="mono">${esc(mins(a.minutes_to_close))}</span></div>`).join('')) : ''}
        </div>
        ${customer ? raw(propertyCard(ctx.data.parcel, customer, ctx.data.filled || [])) : ''}
        ${raw(fenceCard(ctx.data.fence, ctx.data.packet || [], estimates))}
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${estimates.length ? raw(`<div class="card"><div class="kicker">Estimates · one link, they tap ACCEPT</div><div class="rows">${estimates.map((d) => { const tk = estLinks.find((l) => l.id === d.link_id)?.token; const url = tk ? ESTIMATE_VIEW + tk : null; const acc = d.status === 'accepted'; return `<div class="r"><span><b>#${esc(d.serial_number)}</b> · ${esc(d.title || 'Estimate')} · <span class="mono">${esc(fmtMoney(d.total))}</span> · <span class="chip ${acc ? 'ok' : ''}">${acc ? 'ACCEPTED · ' + esc(new Date(d.accepted_at).toLocaleDateString([], { month: 'short', day: 'numeric' })) : esc(String(d.status).toUpperCase()) + ' · valid to ' + esc(new Date(d.valid_until + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' }))}</span></span><span style="display:flex;gap:4px">${url ? `<button class="btn sm" data-estlink="${esc(url)}">Copy link</button><a class="btn sm" href="${esc(url)}" target="_blank" rel="noopener" title="Counts as a view">Open</a>` : ''}</span></div>`; }).join('')}</div></div>`) : ''}
        ${paperwork.length ? raw(`<div class="card"><div class="kicker">Paperwork · the crucial pieces</div>${paperwork.map((a) => `<div class="ask ${a.state === 'OPEN' ? '' : 'done'}" style="grid-template-columns:auto 1fr auto"><span class="check ${a.state === 'OPEN' ? '' : 'done'}"></span><span>${esc(askLabel(a))}${a.proof?.waived ? ' · <span class="dimmer">not required: ' + esc(a.proof.waived) + '</span>' : ''}</span>${a.state === 'OPEN' ? `<button class="btn sm ok" data-settle="${esc(a.id)}">Upload</button>` : '<span class="mono verify">on file</span>'}</div>`).join('')}</div>`) : ''}
        <div class="card">
          <div class="kicker">On the file</div>
          <div class="rows">
            ${attachments.length ? raw(attachments.slice(-12).map((f) => `<div class="r"><span>${esc(f.label || f.storage_path || f.source)}</span><span class="mono dimmer">${esc(new Date(f.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }))}</span></div>`).join('')) : raw('<div class="r"><span class="dimmer">No documents or photos yet.</span></div>')}
          </div>
        </div>
        <div class="card">
          <div class="kicker">Who has touched this file</div>
          <div class="rows">
            ${job.rep_name ? raw(`<div class="r"><span><b>${esc(job.rep_name)}</b> · sold it</span></div>`) : ''}
            ${raw([...new Set(asks.filter((a) => a.state !== 'OPEN').map((a) => a.assignee_name).filter(Boolean))].map((n) => `<div class="r"><span><b>${esc(n)}</b> · settled ${asks.filter((a) => a.state !== 'OPEN' && a.assignee_name === n).map((a) => askLabel(a).toLowerCase()).join(', ')}</span></div>`).join(''))}
            ${raw(handoffs.map((h) => `<div class="r"><span><b>${esc(seatName(h.to_seat) || 'nobody')}</b> · ${h.kind === 'handback' ? 'handed it back' : h.kind === 'assign' ? 'assigned by ' + esc(seatName(h.by_id) || '') : 'took the job'}${h.note ? ' · ' + esc(h.note) : ''}</span><span class="mono dimmer">${esc(new Date(h.at).toLocaleDateString([], { month: 'short', day: 'numeric' }))}</span></div>`).join(''))}
            ${job.owner_name && job.stage !== 'production' ? raw(`<div class="r"><span><b>${esc(job.owner_name)}</b> · holds it now</span></div>`) : ''}
          </div>
        </div>
      </div>
    </div>`;

  if (q('#file-back')) q('#file-back').onclick = (e) => { e.preventDefault(); window.__go(['manager'].includes(me?.role) ? 'production' : ['office'].includes(me?.role) ? 'office' : 'home'); };
  if (q('#drawer-close')) q('#drawer-close').onclick = closeDrawer;
  if (q('#drawer-full')) q('#drawer-full').onclick = () => { closeDrawer(); window.__go('file', ctx.customerId); };
  const th = q('#thread'); th.scrollTop = th.scrollHeight;
  q('#send').onclick = () => send(ctx, q, compact);
  q('#compose').addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send(ctx, q, compact); });
  // the lines, readable and tappable (Kevin, 14 Sep: "you can't really see the pre-written things") — a tap fills the box, never sends
  linePreview(ctx.customerId).then((lines) => {
    const box = q('#lines'); if (!box) return;
    if (!lines.length) { box.innerHTML = '<div class="small">No pre-written lines for this brand yet. Kevin and Jess add them as rows in the Office room.</div>'; return; }
    box.innerHTML = lines.map((l) => `<button class="line" type="button" data-body="${esc(l.body)}"><b>${esc(l.label)}</b><span>${esc(l.body)}</span></button>`).join('');
    box.querySelectorAll('.line').forEach((b) => (b.onclick = () => { const c = q('#compose'); if (!c || c.disabled) return; c.value = b.dataset.body; c.focus(); box.querySelectorAll('.line').forEach((x) => x.classList.toggle('on', x === b)); }));
  }).catch(() => { const box = q('#lines'); if (box) box.innerHTML = '<div class="small">The lines could not load. Type it yourself on the left.</div>'; });
  root.querySelectorAll('[data-settle]').forEach((b) => (b.onclick = () => { const a = asks.find((x) => x.id === b.dataset.settle); if (a) settleDialog(withQueueShape(a, job), () => (compact ? openFileDrawer(ctx.customerId) : openFile(ctx.customerId))); }));
  if (q('#file-take')) q('#file-take').onclick = async () => { try { await takeJob(job.job_id); toast(`You have ${name}.`); await reload(true); (compact ? openFileDrawer(ctx.customerId) : openFile(ctx.customerId)); } catch (e) { toast(e.message, 'err'); } };
  if (q('#file-back-job')) q('#file-back-job').onclick = () => openModal({ title: `Hand ${name} back`, submitLabel: 'Hand it back', body: '<div class="field"><label>Why</label><textarea name="note" required></textarea></div>', onSubmit: async (f) => { await handBack(job.job_id, f.note.value.trim()); toast('Handed back'); await reload(true); (compact ? openFileDrawer(ctx.customerId) : openFile(ctx.customerId)); } });
  if (q('#new-ask')) q('#new-ask').onclick = () => newAsk(thread, job, ctx, compact);
  const again = () => (compact ? openFileDrawer(ctx.customerId) : openFile(ctx.customerId));
  // the Estimate button opens pre-typed from the calculator when the rep drew one; the fence card's own button does the same
  const seed = estimateSeedFromTakeoff(ctx.data.fence);
  if (q('#file-estimate')) q('#file-estimate').onclick = () => estimateDialog(ctx, job, customer, name, again, seed);
  if (q('#fence-estimate')) q('#fence-estimate').onclick = () => estimateDialog(ctx, job, customer, name, again, seed);
  if (q('#noc-fill')) q('#noc-fill').onclick = async () => {
    const b = q('#noc-fill'); b.disabled = true; b.textContent = 'Filling…';
    // iPhone Safari blocks a popup opened after an await — open the tab now, point it at the PDF when it lands
    const tab = window.open('', '_blank');
    try {
      const r = await fillPaperwork(ctx.customerId, null);
      toast(`${FORM_LABEL[r.form_key] || r.form_key} filled · ${(r.blanks || []).length} blanks left for the office`);
      if (r.url) { if (tab) tab.location = r.url; else window.location.assign(r.url); } else if (tab) tab.close();
      again();
    } catch (e) { if (tab) tab.close(); toast(e.message, 'err'); b.disabled = false; b.textContent = 'Fill the NOC'; }
  };
  root.querySelectorAll('[data-open-proof]').forEach((b) => (b.onclick = async () => {
    b.disabled = true;
    const tab = window.open('', '_blank');
    try { const url = await openPacketFile(b.dataset.openProof); if (tab) tab.location = url; else window.location.assign(url); }
    catch (e) { if (tab) tab.close(); toast(e.message, 'err'); }
    b.disabled = false;
  }));
  root.querySelectorAll('[data-open-doc]').forEach((b) => (b.onclick = async () => {
    b.disabled = true;
    const tab = window.open('', '_blank');
    try { const r = await openPaperwork(b.dataset.openDoc); if (r.url) { if (tab) tab.location = r.url; else window.location.assign(r.url); } else if (tab) tab.close(); }
    catch (e) { if (tab) tab.close(); toast(e.message, 'err'); }
    b.disabled = false;
  }));
  if (q('#parcel-look')) q('#parcel-look').onclick = async () => {
    const b = q('#parcel-look'); b.disabled = true; b.textContent = 'Asking the county…';
    try {
      const r = await parcelLookup(ctx.customerId, null);
      if (!r.found) { toast(r.message || 'No parcel matched this address', 'err'); b.disabled = false; b.textContent = 'Try again'; return; }
      const m = r.saved?.signer_match;
      toast(m === 'match' ? 'Owner of record matches the signer' : m === 'mismatch' ? 'Signer is NOT the owner of record' : m === 'entity' ? 'Owned by a company or trust — authorized signer needed' : 'Owner of record is on the file', m === 'mismatch' ? 'err' : '');
      again();
    } catch (e) { toast(e.message, 'err'); b.disabled = false; b.textContent = 'Try again'; }
  };
  root.querySelectorAll('[data-estlink]').forEach((b) => (b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.estlink); toast('Link copied'); } catch { window.prompt('Copy the link', b.dataset.estlink); } }));
  root.querySelectorAll('[data-adopt]').forEach((btn) => (btn.onclick = async () => {
    btn.disabled = true;
    try { const r = await adoptJob(job.job_id, btn.dataset.adopt); const n = (r?.opened || []).length; toast(n ? `Adopted · ${n} ask${n === 1 ? '' : 's'} opened` : 'Adopted · the file is open'); await reload(true); again(); }
    catch (e) { toast(e.message, 'err'); btn.disabled = false; }
  }));
  if (q('#file-text')) q('#file-text').onclick = () => { const c = q('#compose'); if (c) { c.scrollIntoView({ block: 'center', behavior: 'smooth' }); c.focus(); } };
  if (q('#file-tag')) q('#file-tag').onclick = () => { const n = q('#note'); if (n) { n.scrollIntoView({ block: 'center', behavior: 'smooth' }); n.focus(); } };
  if (q('#file-send')) q('#file-send').onclick = () => {
    const seats = (state.seats || []).filter((s) => s.id !== me?.id);
    openModal({ title: `Send ${name}'s file to…`, submitLabel: 'Send it', body: `
      <div class="field"><label>Who</label><select name="to" required><option value="">— pick the seat —</option>${seats.map((s) => `<option value="${esc(s.id)}">${esc(s.name)} · ${esc(s.role)}</option>`).join('')}</select></div>
      <div class="field"><label>What they need to do</label><textarea name="note" placeholder="permit's in — schedule it · customer wants a call before 8"></textarea></div>
      <div class="note">They get a push and the file lands on their board. The stage moves with the seat.</div>`,
      onSubmit: async (fm) => { await assignJob(job.job_id, fm.to.value, fm.note.value.trim() || null); toast('Sent · they get a push'); await reload(true); again(); } });
  };
  if (q('#file-doc')) q('#file-doc').onclick = () => openModal({ title: 'Put a document on the file', submitLabel: 'Add it', body: `
      <div class="field"><label>File</label><input name="file" type="file" required/></div>
      <div class="field"><label>What it is</label><input name="label" placeholder="Permit · HOA approval · NOC · signed contract · photo"/></div>
      <div class="field"><label>Who sees it</label><select name="lane"><option value="OFFICE">Office and managers</option><option value="SUPER">Production</option></select></div>
      <div class="note">Goes on the file for everyone who can read it. If an open ask is waiting on this exact piece, settle the ask instead so its clock stops.</div>`,
    onSubmit: async (fm) => {
      const file = fm.file.files[0]; if (!file) throw new Error('Pick a file');
      let tid = thread?.id; if (!tid) tid = await threadForJob(job.job_id);
      await addDoc(job, tid, fm.lane.value, file, fm.label.value.trim() || file.name);
      toast('On the file'); again();
    } });
  if (q('#file-invoice')) q('#file-invoice').onclick = () => {
    const waiting = asks.filter((a) => a.ask_type === 'INVOICE' && a.state === 'OPEN');
    openModal({ title: `Invoice ${name}`, submitLabel: 'Queue it', body: `
      <div class="field"><label>Amount</label><input name="amount" type="number" step="0.01" min="0" value="${esc(job.fin_sold_amount ?? '')}" required/></div>
      <div class="field"><label>Memo · what the customer reads on it</label><input name="memo" placeholder="Final invoice · balance after deposit"/></div>
      ${waiting.length ? `<div class="field"><label>The ask this answers (optional)</label><select name="ask"><option value="">— none, just the invoice —</option>${waiting.map((a) => `<option value="${esc(a.id)}">${esc(askLabel(a))}${a.note ? ' · ' + esc(a.note) : ''} · ${esc(a.assignee_name || 'unassigned')} holds it</option>`).join('')}</select></div>` : ''}
      <div class="note">The row is written and the job's invoice line goes on the file. The qb_invoices switch is off, so nothing reaches QuickBooks until Kevin turns it on.</div>`,
      onSubmit: async (fm) => {
        const amount = Number(fm.amount.value);
        if (!Number.isFinite(amount) || amount <= 0) throw new Error('Put the amount in');
        await invoiceRequest(job.job_id, amount, fm.memo.value.trim() || null, fm.ask?.value || null);
        toast('Queued for QuickBooks — the qb_invoices switch is off, nothing leaves yet');
        again();
      } });
  };
  if (q('#file-collect')) q('#file-collect').onclick = async () => {
    let lines = [];
    try { lines = await linePreview(ctx.customerId); } catch {}
    const pay = (lines || []).find((l) => l.key === 'pay_link');
    // line_preview renders every token it knows and drops the ones it does not — {{link}} comes back empty. Put it back where it belongs.
    const withToken = (s) => /{{link}}/.test(s) ? s : (/online here:s*/i.test(s) ? s.replace(/online here:s*/i, 'online here: {{link}} ').replace(/s{2,}/g, ' ') : s.replace(/s*$/, ' {{link}}'));
    const tpl = pay?.body ? withToken(pay.body) : `Hi ${firstName(name)}, you can pay your invoice online here: {{link}} — thank you!`;
    const fill = (link) => String(tpl).replace(/\{\{link\}\}/g, link);
    openModal({ title: `Send ${firstName(name)} the payment link`, submitLabel: 'Send it', body: `
      <div class="field"><label>Payment link</label><input name="link" type="url" placeholder="https://…"/></div>
      <div class="field"><label>What goes out${pay ? ' · ' + esc(pay.label || 'the pay-link line') : ''}</label><textarea name="msg" style="min-height:110px">${esc(tpl)}</textarea></div>
      <div class="note">${pay ? 'Jess\'s pay-link line, filled in for this customer. Paste the link and it drops in; edit the wording before you send.' : 'No pay-link line on file yet, so this is the plain wording. Paste the link and it drops in.'} It goes out on the brand\'s main line, credited to you.</div>`,
      onOpen: (fm) => { fm.link.oninput = () => { fm.msg.value = fill(fm.link.value.trim() || '{{link}}'); }; },
      onSubmit: async (fm) => {
        const body = fm.msg.value.trim();
        if (!body) throw new Error('Nothing to send');
        if (/\{\{link\}\}/.test(body)) throw new Error('Paste the payment link first');
        await textCustomer(ctx.customerId, body);
        toast('Payment link sent from the main line');
        again();
      } });
  };
  q('#note-send').onclick = async () => {
    const to = q('#note-to').value, what = q('#note-what').value;
    let body = q('#note').value.trim(); if (!body && !what) return;
    if (to && !body.includes(to)) body = to + ' ' + body;
    q('#note-send').disabled = true;
    try {
      let tid = thread?.id;
      if (!tid) { if (!job.job_id) throw new Error('No job on this file yet'); tid = await threadForJob(job.job_id); }
      const lane = ['manager'].includes(me?.role) ? 'SUPER' : 'OFFICE';
      if (body) await postMessage(tid, lane, body);
      if (what) {
        const roleWords = ['@office', '@schedule', '@production', '@rep', '@invoice'];
        const seat = to.startsWith('@') && !roleWords.includes(to) ? state.seats.find((s) => firstName(s.name).toLowerCase() === to.slice(1).toLowerCase()) : null;
        const toId = seat?.id || (to === '@production' && job.supervisor_id) || (to === '@rep' && job.rep_id) || job.owner_id || me.id;
        const laneFor = ['COMPLETION_SIGNOFF', 'MATERIAL_REQUEST', 'SITE_ISSUE', 'SUPERVISOR_PING', 'SAFETY_JHA'].includes(what) ? 'SUPER' : ['CUSTOMER_REQUEST', 'SCHEDULE_QUESTION'].includes(what) ? 'CHAT' : 'OFFICE';
        await openAsk(tid, laneFor, what, body || null, toId);
      }
      toast(what ? 'Posted · task opened with the clock running' : to ? 'Posted · they get a push' : 'Posted');
      q('#note').value = '';
      (compact ? openFileDrawer(ctx.customerId) : openFile(ctx.customerId));
    } catch (e) { toast(e.message, 'err'); }
    finally { q('#note-send').disabled = false; }
  };
  if (thread?.id) mentionSeen(thread.id).then((n) => { if (n) state.mentions = state.mentions.map((m) => m.thread_id === thread.id ? { ...m, seen_at: new Date().toISOString() } : m); });
}

/* ── THE ITEMIZED ESTIMATE (322) — Mike's Billdu flow on our rails ──────────
   Items with a scope of work, a price, valid 14 days, one link; the customer
   taps ACCEPT on the page and the rep gets the push. estimate_doc_create
   mints the document, the amount fact (131) and the tracked link in one
   call. Accepting is not selling: nothing lands on a board (126/129). */
const ESTIMATE_VIEW = 'https://lzegjjbkfuecrhdvlvay.supabase.co/functions/v1/estimate-view/';
const fmtMoney = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/* ── THE ESTIMATE, PRE-TYPED FROM THE CALCULATOR (14 Sep) ───────────────────
   Kevin: "we have a fence calculator we built into the app, can we just use
   that and have it autopopulate." The takeoff (331) already carries what the
   rep drew: the styles with their feet, the gates, the site work and the
   calculator's quote. So the builder opens with those typed in: one line per
   style, the first one carrying the quote as a job price (exact — the
   calculator prices the whole yard, not a foot), gates and site work in the
   scope, the other styles marked included. The rep still reads it and taps
   Create: a rep vouches for every number on a file. Nothing here is
   invented; a takeoff with no feet seeds nothing. */
function estimateSeedFromTakeoff(f) {
  if (!f) return null;
  const styles = (f.styles || []).filter((s) => Number(s.linear_ft) > 0);
  if (!styles.length) return null;
  const quote = Number(f.quote || 0);
  const gates = f.gates || [];
  const gateText = gates.length ? `${gates.length} gate${gates.length > 1 ? 's' : ''}: ${gates.map((g) => (g.width_ft ? g.width_ft + "'" : (g.type || 'gate')) + (g.kind === 'double' ? ' double' : '')).join(', ')}` : '';
  const site = [f.tear_out_ft > 0 ? `${f.tear_out_ft} ft removal and disposal` : '', f.reinstall_ft > 0 ? `${f.reinstall_ft} ft removal and reinstall` : '', f.core_drill_holes > 0 ? `${f.core_drill_holes} core-drilled holes` : '', f.follow_grade == null ? '' : (f.follow_grade ? 'follows the grade' : 'flat on top')].filter(Boolean).join(' · ');
  const items = styles.map((s, i) => ({
    label: `${s.prod} · ${s.linear_ft} ft`,
    desc: i === 0 ? [`${s.linear_ft} linear ft, as drawn in the fence calculator.`, gateText, site].filter(Boolean).join('\n') : `${s.linear_ft} linear ft · included in the price above`,
    qty: 1, unit: 'job', price: i === 0 ? quote : 0,
  }));
  const mat = f.material ? f.material[0].toUpperCase() + f.material.slice(1) : 'Fence';
  return { title: `${mat} fence · ${f.linear_ft} ft${gates.length ? ' · ' + gates.length + ' gate' + (gates.length > 1 ? 's' : '') : ''}`, items,
           note: `Priced in the fence calculator${quote ? ' at ' + fmtMoney(quote) : ''}. Gates, hardware and site work are in the price.` };
}
function estimateDialog(ctx, job, customer, name, again, seed) {
  const cc = job.cc_company_id || state.me?.manages_company_id || '1461';
  const rowHtml = (it) => `<div class="est-row" style="display:grid;grid-template-columns:1.5fr 64px 70px 110px 32px;gap:6px;align-items:start;margin-top:6px">
      <div><input name="label" placeholder="Pavers · 6' privacy fence · shingle roof" value="${esc(it?.label || '')}" required/><textarea name="desc" placeholder="Scope of work — what you'll do, what's included, what isn't" style="min-height:72px;margin-top:4px">${esc(it?.desc || '')}</textarea></div>
      <input name="qty" type="number" step="0.01" min="0" value="${esc(String(it?.qty ?? 1))}" title="Qty"/>
      <input name="unit" placeholder="job" value="${esc(it?.unit || '')}" title="Unit"/>
      <input name="price" type="number" step="0.01" min="0" placeholder="0.00" value="${it && it.price != null ? esc(String(it.price)) : ''}" title="Unit price" required/>
      <button class="btn sm" type="button" data-del title="Remove this item">×</button>
    </div>`;
  openModal({ title: `Estimate for ${name}`, submitLabel: 'Create the estimate', wide: true, body: `
      <div class="field"><label>Title · what the job is</label><input name="title" placeholder="Backyard paver installation" value="${esc(seed?.title || '')}"/></div>
      ${seed ? '<div class="next good" style="margin-bottom:6px"><b>FROM THE CALCULATOR</b> The items below are what the rep drew and priced. Read them, change what you want, then Create.</div>' : ''}
      <div class="kicker" style="margin-top:6px">Items · what it is and the scope · qty · unit · unit price</div>
      <div id="est-rows">${seed ? seed.items.map(rowHtml).join('') : rowHtml()}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><button class="btn sm" type="button" id="est-add">+ Item</button><div>Total <b class="mono" id="est-total">$0.00</b></div></div>
      <div class="field" style="margin-top:8px"><label>Note under the items (optional)</label><textarea name="note" placeholder="50% deposit to schedule, balance on completion.">${esc(seed?.note || '')}</textarea></div>
      <div style="display:flex;gap:10px"><div class="field" style="flex:1"><label>Valid for</label><select name="valid"><option value="14">14 days</option><option value="7">7 days</option><option value="30">30 days</option></select></div><div class="field" style="flex:1"><label>Brand on it</label><select name="cc">${['1461', '1560', '1563', '1537'].map((c) => `<option value="${c}" ${c === String(cc) ? 'selected' : ''}>${esc(brandName(c))}</option>`).join('')}</select></div></div>
      <div class="note">Same shape as Mike's Billdu estimate: the items, the scope, the price, valid 14 days. One link goes to the customer; they tap ACCEPT; you get the push. Accepting is not selling — nothing lands on a board.</div>`,
    onOpen: (fm) => {
      const rows = fm.querySelector('#est-rows');
      const retotal = () => { let t = 0; rows.querySelectorAll('.est-row').forEach((r) => { t += Number(r.querySelector('[name=qty]').value || 0) * Number(r.querySelector('[name=price]').value || 0); }); fm.querySelector('#est-total').textContent = fmtMoney(t); };
      const wire = () => rows.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => { if (rows.querySelectorAll('.est-row').length > 1) { b.closest('.est-row').remove(); retotal(); } }));
      fm.querySelector('#est-add').onclick = () => { rows.insertAdjacentHTML('beforeend', rowHtml()); wire(); rows.lastElementChild.querySelector('[name=label]').focus(); };
      rows.addEventListener('input', retotal); wire(); retotal();
    },
    onSubmit: async (fm) => {
      const items = Array.from(fm.querySelectorAll('.est-row')).map((r) => ({
        label: r.querySelector('[name=label]').value.trim(), description: r.querySelector('[name=desc]').value.trim() || null,
        qty: Number(r.querySelector('[name=qty]').value || 1), unit: r.querySelector('[name=unit]').value.trim() || null, unit_price: Number(r.querySelector('[name=price]').value || 0),
      })).filter((i) => i.label);
      if (!items.length) throw new Error('Put at least one item in');
      if (!items.some((i) => i.unit_price > 0)) throw new Error('Put a price on it');
      const r = await createEstimate({ customer_id: ctx.customerId, cc_company_id: fm.cc.value, title: fm.title.value.trim() || null, note: fm.note.value.trim() || null, valid_days: Number(fm.valid.value), channel: 'sms', items });
      toast(`Estimate #${r.serial} · ${fmtMoney(r.total)}`);
      setTimeout(() => sendEstimateDialog(ctx, r, name, customer, fm.cc.value, again), 0);
    } });
}
function sendEstimateDialog(ctx, r, name, customer, cc, again) {
  const url = r.url;
  const tpl = `Hi ${firstName(name)}, ${firstName(state.me?.name || '')} with ${brandName(cc)}. Your estimate #${r.serial} is ready — tap to view and accept: ${url}`;
  openModal({ title: `Estimate #${r.serial} · ${fmtMoney(r.total)} · send it`, submitLabel: customer?.phone ? `Text it to ${firstName(name)}` : 'Done', body: `
      <div class="field"><label>The link</label><div style="display:flex;gap:6px"><input name="link" value="${esc(url)}" readonly style="flex:1"/><button class="btn sm" type="button" id="est-copy">Copy</button><a class="btn sm" href="${esc(url)}" target="_blank" rel="noopener">Open</a></div></div>
      <div class="field"><label>The text</label><textarea name="msg" style="min-height:90px">${esc(tpl)}</textarea></div>
      <div class="note">Goes out on the brand's main line, credited to you. Opening the link yourself counts as a view and pings your own phone.</div>`,
    onOpen: (fm) => { fm.querySelector('#est-copy').onclick = async () => { try { await navigator.clipboard.writeText(url); toast('Link copied'); } catch { fm.link.select(); } }; },
    onSubmit: async (fm) => {
      if (!customer?.phone) { again(); return; }
      const body = fm.msg.value.trim(); if (!body) throw new Error('Nothing to send');
      await textCustomer(ctx.customerId, body);
      toast('Estimate sent from the main line'); again();
    } });
}

/* ── THE OWNER OF RECORD (324, PERMIT lane) ─────────────────────────────────
   What the county appraiser holds for this address: who owns it, where they
   get mail, the parcel id and legal description the NOC needs. The chip says
   whether the person who signed the estimate is that owner. */
function propertyCard(p, customer, filled = []) {
  const addr = [customer?.street, customer?.city, customer?.zip].filter(Boolean).join(', ');
  if (!p) return `<div class="card"><div class="head" style="margin-bottom:0"><div class="kicker">Property · owner of record</div><button class="btn sm fill" id="parcel-look">Ask the county</button></div><div class="next"><b>NEXT</b> Ask the county who owns ${esc(addr || 'this address')}. It runs by itself when the customer accepts; tap the button if they signed on paper.</div></div>`;
  const chip = p.signer_match === 'match' ? '<span class="chip ok">SIGNER IS THE OWNER</span>'
    : p.signer_match === 'mismatch' ? '<span class="chip red">SIGNER IS NOT THE OWNER</span>'
    : p.signer_match === 'entity' ? '<span class="chip gold">OWNED BY AN ENTITY · AUTHORIZED SIGNER NEEDED</span>'
    : '<span class="chip">NOT SIGNED YET</span>';
  const mail = [p.mail_addr1, p.mail_addr2, [p.mail_city, p.mail_state, p.mail_zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const site = p.site_address || addr;
  const sameMail = mail && site && mail.toUpperCase().replace(/[^A-Z0-9]/g, '').startsWith(String(p.mail_addr1 || '').toUpperCase().replace(/[^A-Z0-9]/g, '')) && String(site).toUpperCase().replace(/[^A-Z0-9]/g, '').startsWith(String(p.mail_addr1 || '').toUpperCase().replace(/[^A-Z0-9]/g, ''));
  const when = new Date(p.fetched_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
  const hasNoc = filled.some((f) => f.kind === 'noc');
  const next = p.confidential ? 'Protected address: the county withholds the owner. Get the deed from the customer before anything prints.'
    : p.signer_match === 'mismatch' ? 'The person who signed is not the owner of record. Get the owner of record to sign before the NOC or the permit goes anywhere.'
    : p.signer_match === 'entity' ? 'The owner is a company or trust. Get the name and title of the officer who can sign, then fill the NOC with it.'
    : !hasNoc ? 'Owner checks out. Fill the NOC (it fills itself when the customer accepts online).'
    : 'NOC is on the file. Office: type the permit number and the blanks, notarize, record at the Clerk, upload to the permit portal.';
  return `<div class="card">
    <div class="head" style="margin-bottom:4px"><div class="kicker">Property · owner of record · ${esc(p.county)} County</div>${chip}</div>
    <div class="next ${p.signer_match === 'mismatch' || p.confidential ? 'bad' : hasNoc && p.signer_match === 'match' ? 'good' : ''}"><b>NEXT</b> ${esc(next)}</div>
    <div class="rows">
      <div class="r"><span><b>${esc((p.owner_names || []).join(' & ') || '—')}</b>${p.signer_name ? ' · signed by ' + esc(p.signer_name) : ''}</span></div>
      <div class="r"><span>Owner's mail: ${esc(mail || '—')}${mail && !sameMail ? ' <span class="red">· not the job address</span>' : ''}</span></div>
      <div class="r"><span>Parcel ${esc(p.parcel_id || '—')}${p.jurisdiction ? ' · ' + esc(p.jurisdiction) : ''}${p.subdivision ? ' · ' + esc(p.subdivision) : ''}</span></div>
      ${p.legal_description ? `<div class="r"><span class="small">${esc(p.legal_description)}</span></div>` : ''}
      ${p.deed_book ? `<div class="r"><span class="small dimmer">Last deed OR ${esc(p.deed_book)} / ${esc(p.deed_page || '')}${p.sale_date ? ' · ' + esc(new Date(p.sale_date + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })) : ''}</span></div>` : ''}
      ${p.confidential ? '<div class="r"><span class="red">Protected address — the county withholds the owner. Nothing from this record prints.</span></div>' : ''}
      <div class="r"><span class="small dimmer">${esc(p.source)}${p.as_of ? ' · county data as of ' + esc(new Date(p.as_of + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })) : ''} · looked up ${esc(when)}</span><span style="display:flex;gap:4px"><button class="btn sm" id="parcel-look">Look again</button><button class="btn sm fill" id="noc-fill" title="The Notice of Commencement, filled from this record and the contractor block">Fill the NOC</button></span></div>
      ${filled.length ? `<div class="kicker" style="margin-top:8px">Filled from the file</div>` + filled.map((f) => `<div class="r"><span>${esc(FORM_LABEL[f.form_key] || f.form_key)} · ${esc(f.method === 'acroform' ? 'county form' : 'statutory form')}${f.county ? ' · ' + esc(f.county) : ''} · ${esc(new Date(f.filled_at).toLocaleDateString([], { month: 'short', day: 'numeric' }))}${f.filled_by ? ' · ' + esc(firstName(f.filled_by)) : ''}${(f.blanks || []).length ? ' · <span class="dimmer">' + esc(String((f.blanks || []).length)) + ' blanks for the office</span>' : ''}</span><button class="btn sm" data-open-doc="${esc(f.id)}">Open</button></div>`).join('') : ''}
    </div>
  </div>`;
}
const FORM_LABEL = { 'noc-statutory': 'Notice of Commencement', 'noc-volusia': 'Notice of Commencement (Volusia)', 'noc-flagler': 'Notice of Commencement (Flagler)', 'noc-brevard': 'Notice of Commencement (Brevard)', 'noc-indian-river': 'Notice of Commencement (Indian River)' };

/* ── THE FENCE JOB (328/331, FENCE PACKET lane) ──────────────────────────────
   What the rep had in Gio's calculator when he tapped Complete Quote: the six
   numbers, the county's own description of work, the material order, and the
   files the calculator put on the customer (private estimates bucket, opened
   by a ten-minute signed link). Kevin, 14 Sep: "the salesman is the one who
   does it… nobody in the office ever needs to ask a question." Sam and Laura
   read the order off this card instead of decoding a sketch. The card only
   exists once the calculator has written something; nothing else on the file
   moves. Signing is not selling: the quote here is the calculator's number. */
const PROOF_LABEL = { material_order: 'Material order', proposal: 'Proposal', permit_packet: 'County forms packet', drawing: 'The drawing' };
function fenceCard(f, packet, estimates) {
  if (!f && !packet.length) return '';
  const day = (iso) => new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
  const signed = !!f?.proposal_signed || packet.some((p) => p.kind === 'proposal' && p.signed);
  // an estimate made after the takeoff means the calculator's numbers already became the customer's link
  const estimated = (estimates || []).some((e) => f && new Date(e.created_at) >= new Date(f.created_at));
  const canSeed = !!estimateSeedFromTakeoff(f);
  const next = !f ? 'The rep filed documents from the calculator but never tapped Complete Quote. The numbers are in the files below; ask the rep to tap Complete Quote so they land here.'
    : signed ? 'Sold. The packet went to Sam and Laura by email. Order the material off the list below; the permit runs off the Property card.'
    : estimated ? 'Priced and the estimate is out. Nothing goes to the office until the customer taps ACCEPT or signs the proposal.'
    : canSeed ? 'Priced in the calculator. Build the estimate from it: the items are already typed, the customer taps ACCEPT on their phone.'
    : 'Priced, not signed. Nothing goes to the office until the customer signs the proposal and the rep files it.';
  const styles = (f?.styles || []).map((s) => `<div class="r"><span><b>${esc(String(s.linear_ft))} ft</b> of ${esc(s.prod)}</span></div>`).join('');
  const gates = (f?.gates || []).map((g) => (g.width_ft ? g.width_ft + "'" : g.type || 'gate') + (g.kind === 'double' ? ' double' : ''));
  const mat = Array.isArray(f?.material_order) ? f.material_order : [];
  const matRows = mat.map((m) => m.group != null ? `<div class="r" style="border-top:0;padding-top:8px"><span class="kicker">${esc(m.group)}</span></div>` : `<div class="r"><span>${esc(m.item || '')}</span><span class="mono">${esc(m.qty || '')}</span></div>`).join('');
  const files = packet.map((p) => `<div class="r"><span>${esc(PROOF_LABEL[p.kind] || p.kind)}${p.signed ? ' · <span class="verify">signed</span>' : ''} · <span class="small dimmer">${esc(p.label || '')}</span></span><span style="display:flex;gap:6px;align-items:center"><span class="mono dimmer">${esc(day(p.uploaded_at))}</span><button class="btn sm" data-open-proof="${esc(p.storage_path)}">Open</button></span></div>`).join('');
  return `<div class="card">
    <div class="head" style="margin-bottom:4px"><div class="kicker">The fence job · from the calculator${f ? ' · ' + esc(day(f.created_at)) : ''}</div><span style="display:flex;gap:6px;align-items:center">${canSeed && !signed && !estimated ? '<button class="btn sm fill" id="fence-estimate" title="The estimate, pre-typed from what the rep drew">Estimate from this</button>' : ''}${signed ? '<span class="chip st-green">SIGNED · PACKET SENT</span>' : f ? '<span class="chip st-gold">PRICED</span>' : ''}</span></div>
    <div class="next ${signed || (canSeed && !estimated) ? 'good' : ''}"><b>NEXT</b> ${esc(next)}</div>
    ${f ? `<div class="rows">
      ${styles || '<div class="r"><span class="dimmer">No footage on the snapshot — open the drawing.</span></div>'}
      <div class="r"><span>Gates: <b>${esc(String(f.gate_count ?? 0))}</b>${gates.length ? ' · ' + esc(gates.join(', ')) : ''}</span></div>
      <div class="r"><span>Tear-out: ${esc(String(f.tear_out_ft ?? 0))} ft removal · ${esc(String(f.reinstall_ft ?? 0))} ft reinstall · core drill ${esc(String(f.core_drill_holes ?? 0))}${f.follow_grade == null ? '' : ' · ' + (f.follow_grade ? 'follow grade' : 'flat on top')}</span></div>
      <div class="r"><span>Quote <span class="mono">${esc(fmtMoney(f.quote))}</span> · calculator's number, not the sale</span></div>
      ${f.description_of_work ? `<div class="r"><span class="mono" style="font-size:12px">${esc(f.description_of_work)}</span></div>` : ''}
    </div>` : ''}
    ${files ? `<div class="kicker" style="margin-top:8px">On the file · from the calculator</div><div class="rows">${files}</div>` : ''}
    ${matRows ? `<details style="margin-top:8px"><summary class="kicker" style="cursor:pointer">Material order · ${esc(String(mat.filter((m) => m.item).length))} lines · what Jonathan orders</summary><div class="rows">${matRows}</div></details>` : ''}
  </div>`;
}

/* ── THE FILE'S NEXT LINE (gospel 3, 13 Sep) ─────────────────────────────────
   One line, the loudest thing on the file, for whoever is looking. Never a
   hint: either the machine is doing it, or a named human has to. First match
   wins, worst news first. */
function fileNext(job, openAsks, estimates, parcel, customer, canTake) {
  const ageMin = (iso) => iso ? Math.max(0, (Date.now() - new Date(iso).getTime()) / 60000) : null;
  if (parcel?.signer_match === 'mismatch') return { tone: 'bad', text: 'The person who signed is not the owner of record. Get the owner of record to sign before any paperwork moves.' };
  if (parcel?.confidential) return { tone: 'bad', text: 'Protected address: the county withholds the owner. Get the deed from the customer before the NOC prints.' };
  if (openAsks.length) {
    const a = openAsks.slice().sort((x, y) => new Date(x.opened_at) - new Date(y.opened_at))[0];
    const m = ageMin(a.opened_at);
    return { tone: m != null && m > 4320 ? 'bad' : '', text: `Waiting on ${(a.assignee_name || 'nobody').split(' ')[0]} for ${thing(a)} · open ${m != null ? mins(m) : ''}${openAsks.length > 1 ? ` · ${openAsks.length - 1} more below` : ''}. Settle it in the Asks card.` };
  }
  const est = (estimates || [])[0];
  if (est && est.status === 'sent') return { tone: '', text: `Estimate #${est.serial_number} is out, waiting on the customer since ${new Date(est.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}. Text a nudge from the Cockpit.` };
  if (est && est.status === 'accepted' && !job.contract_signed_at) return { tone: 'good', text: `Estimate #${est.serial_number} accepted. Office: the contract and the permit run. The owner of record is ${parcel ? 'on the file' : 'being looked up'}.` };
  if (!job.job_id) return { tone: '', text: 'No job on this file yet. + New job puts it on the board with a clock.' };
  if (job.stage === 'sold_office' && canTake) return { tone: 'bad', text: 'Sold and nobody holds it. Take the job.' };
  if (job.stage === 'sold_office') return { tone: '', text: 'Sold. The office runs paperwork, permit and schedule; asks open here as each one is due.' };
  if (job.stage === 'production') return { tone: '', text: `In production${job.supervisor_id ? ' with ' + (seatName(job.supervisor_id) || 'the supervisor') : ''}. Field complete ends this stage.` };
  if (job.stage === 'field_complete') return { tone: 'bad', text: 'Field complete, not invoiced. Invoice it from the button above.' };
  if (job.stage === 'invoiced') return { tone: '', text: 'Invoiced, not paid. Collect: text the payment link.' };
  if (job.stage === 'paid') return { tone: 'good', text: 'Paid. Ask for the review and the referral; the lines are ready.' };
  return { tone: '', text: 'Nothing due on this file. The thread is the record.' };
}

/* ── A COLOR PER PERSON (Kevin, 14 Sep) ──────────────────────────────────────
   Ten colors that read apart from each other and from the gold the machine
   owns. A person's color is derived from their id, so it is the same on
   every file and every board without a column anyone has to maintain; when
   two people collide it is the same collision everywhere, and a `color`
   column on reps can override this later. The machine is always gold. */
const PALETTE = [
  ['#1f6f4a', '#dff0e6'], ['#1d5fa8', '#e1e8f3'], ['#b45309', '#f6e3d6'], ['#0e7c86', '#dcf1f3'], ['#5b3a8f', '#ece5f6'],
  ['#a8323e', '#f8e2e4'], ['#6b6d0e', '#eef0d2'], ['#8a4b1f', '#f3e4d7'], ['#245e8f', '#dde9f2'], ['#7a2e6d', '#f2e0ee'],
];
const colorFor = (id) => {
  if (!id || id === 'machine') return { c: 'var(--gold)', cs: 'var(--goldsoft)' };
  let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [c, cs] = PALETTE[h % PALETTE.length]; return { c, cs };
};
const personOf = (id) => id ? (state.people.find((p) => p.id === id) || state.seats.find((s) => s.id === id) || null) : null;
const personByName = (n) => n ? (state.people.find((p) => p.name === n) || state.seats.find((s) => s.name === n) || null) : null;
const initialsOf = (p) => p?.initials || String(p?.name || '?').split(/[\s,]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const digits = (s) => String(s || '').replace(/\D/g, '').slice(-10);
/* The line a text went out on: a brand main line by its label, a rep's own
   number as "own line", else the extension the phone system stamped. */
function lineLabel(from, job, p) {
  const d = digits(from);
  const bl = d && state.lines.find((l) => digits(l.line_e164) === d);
  if (bl) return bl.label || 'main line';
  if (p?.sms_from && digits(p.sms_from) === d) return 'own line';
  const owner = d && state.people.find((x) => x.sms_from && digits(x.sms_from) === d);
  if (owner) return owner === p ? 'own line' : firstName(owner.name) + "'s line";
  return d ? '…' + d.slice(-4) : '';
}
/* Who sent an outbound text: the rep the file resolved it to, else the rep
   whose own number it left from, else the extension. Never a bare "Liberty". */
function senderOf(t, job) {
  let p = personOf(t.resolved_rep_id);
  const d = digits(t.from_number);
  if (!p && d) p = state.people.find((x) => x.sms_from && digits(x.sms_from) === d) || null;
  const ext = t.uvoice_ext;
  if (!p && ext >= 100 && ext <= 102) return { id: 'office-' + ext, name: 'The office', line: lineLabel(t.from_number, job) + ' · ext ' + ext };
  if (!p) return { id: ext ? 'ext-' + ext : 'liberty', name: ext ? 'A rep' : 'Liberty', line: lineLabel(t.from_number, job) + (ext ? ' · ext ' + ext : '') };
  return { id: p.id, name: p.name, line: lineLabel(t.from_number, job, p) };
}

function bubble(i) {
  const c = colorFor(i.pid);
  const sty = `style="--c:${c.c};--cs:${c.cs}"`;
  if (i.kind === 'env') return `<div class="env" ${sty}>✉ ${esc(i.body)} · ${esc(when(i.at))}</div>`;
  if (i.kind === 'sys') return `<div class="msg sys">${esc(i.who)} ${esc(i.body)} · ${esc(when(i.at))}</div>`;
  if (i.kind === 'ev') return `<div class="ev ${esc(i.cls || '')}" ${sty}>${esc(i.body)} · ${esc(when(i.at))}</div>`;
  if (i.kind === 'in') return `<div class="msg in"><div class="who">${esc(i.who)} · ${esc(when(i.at))}</div>${esc(i.body)}${i.media ? `<div><a href="${esc(i.media)}" target="_blank" rel="noopener">photo</a></div>` : ''}</div>`;
  const p = i.pid === 'machine' ? { name: 'The machine', initials: 'AI' } : personOf(i.pid);
  const cls = i.kind === 'machine' ? 'machine' : i.kind === 'chat' ? 'chat' : 'out';
  return `<div class="msg ${cls}" ${sty}><div class="who"><i class="av">${esc(i.pid === 'machine' ? 'AI' : initialsOf(p || { name: i.who }))}</i>${esc(i.who)}${i.line ? ' · ' + esc(i.line) : ''} · ${esc(when(i.at))}</div>${esc(i.body)}${i.media ? `<div><a href="${esc(i.media)}" target="_blank" rel="noopener">photo</a></div>` : ''}</div>`;
}

function askRow(a, me) {
  const mine = a.assignee_id === me?.id;
  const cls = a.lane === 'SUPER' ? 'st-orange' : a.lane === 'CHAT' ? 'st-green' : 'st-blue';
  const openMin = (Date.now() - new Date(a.opened_at)) / 6e4;
  return `<div class="ask" style="grid-template-columns:1fr auto;row-gap:6px"><span><i class="ai">${iconForAsk(a)}</i><span class="chip ${cls}">${esc(askLabel(a))}</span> <span class="mono ${openMin > 2880 ? 'red' : 'dimmer'}">${esc(mins(openMin))}</span><div style="margin-top:4px">${esc(a.note || '')}</div><div class="who">${esc(a.assignee_name || 'unassigned')} holds it · opened by ${esc(a.opened_by_name || '')}</div></span><button class="btn sm ${mine ? 'ok' : ''}" data-settle="${esc(a.id)}">Done</button></div>`;
}

function withQueueShape(a, job) {
  const rule = { PERMIT: ['number', 'Permit number (attach the permit if you have it)', 1, false], SURVEY: ['text', 'Locate ticket number, or why none is needed', 1, true], SCHEDULE: ['date', 'Start date — and the crew, in the note', 1, false], MATERIAL: ['text', 'PO / order confirmation number', 1, false], COMPLETION_SIGNOFF: ['photos', 'Finished-work photos (3 or more)', 3, false], INVOICE: ['number', 'Billdu / QuickBooks invoice number', 1, false], PAYMENT: ['text', 'How it was paid (QuickBooks record)', 1, false], CHANGE_ORDER: ['file', 'The signed change order', 1, false], SAFETY_JHA: ['photos', 'The JHA photo', 1, false], CONTRACT_DOC: ['file', 'The document', 1, true] }[a.ask_type] || ['tap', 'Tap to close', 1, false];
  const db = (state.proofRules || []).find((r) => r.ask_type === a.ask_type && r.doc_kind === (a.doc_kind || '')) || (state.proofRules || []).find((r) => r.ask_type === a.ask_type && r.doc_kind === '');
  if (db) return { ...a, ask_id: a.id, customer_name: job.customer_name, cc_company_id: job.cc_company_id, cc_project_id: job.cc_project_id, proof_kind: db.proof_kind, proof_label: db.label, proof_min: db.min_count ?? 1, waivable: !!db.waivable };
  return { ...a, ask_id: a.id, customer_name: job.customer_name, cc_company_id: job.cc_company_id, cc_project_id: job.cc_project_id, proof_kind: rule[0], proof_label: rule[1], proof_min: rule[2], waivable: rule[3] };
}

async function send(ctx, q, compact) {
  const box = q('#compose'); const body = box.value.trim();
  if (!body) return;
  q('#send').disabled = true;
  try {
    const r = await textCustomer(ctx.customerId, body);
    box.value = '';
    const root = $('#toast-root');
    root.innerHTML = `<div class="toast">Sent from ${esc(r.from || 'the main line')} · <button id="undo">Undo</button></div>`;
    let undone = false;
    $('#undo').onclick = async () => { undone = true; try { await cancelText(r.id); root.innerHTML = '<div class="toast">Not sent</div>'; setTimeout(() => (root.innerHTML = ''), 2000); } catch (e) { toast(e.message, 'err'); } };
    setTimeout(async () => { if (!undone) { root.innerHTML = ''; compact ? openFileDrawer(ctx.customerId) : openFile(ctx.customerId); } }, 6500);
  } catch (e) { toast(e.message, 'err'); }
  finally { q('#send').disabled = false; }
}

function newAsk(thread, job, ctx, compact) {
  const lanes = ['OFFICE', 'SUPER', 'CHAT'];
  const types = Object.keys(ASK_LABEL);
  const seats = state.seats;
  openModal({ title: 'Open an ask on this file', submitLabel: 'Open it', body: `
    <div class="field"><label>Lane</label><select name="lane">${lanes.map((l) => `<option>${l}</option>`).join('')}</select></div>
    <div class="field"><label>What</label><select name="type">${types.map((t) => `<option value="${t}">${esc(ASK_LABEL[t])}</option>`).join('')}</select></div>
    <div class="field"><label>Who</label><select name="to">${seats.map((s) => `<option value="${esc(s.id)}" ${s.id === state.me?.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
    <div class="field"><label>Note</label><input name="note" placeholder="what they need to do"/></div>`,
    onSubmit: async (f) => { await openAsk(thread.id, f.lane.value, f.type.value, f.note.value.trim() || null, f.to.value); toast('Opened'); await reload(true); (compact ? openFileDrawer(ctx.customerId) : openFile(ctx.customerId)); } });
}
