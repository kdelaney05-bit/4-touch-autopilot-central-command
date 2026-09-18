// The customer file — the spine. One thread from the machine's first text to
// the final invoice, the asks with their clocks, the proof on the file, who
// touched it. Every seat writes on the same file; the database decides the
// lanes (090/091) and the line the text goes out on (306).
import { subOptions, subLock, subLockMark, state, isDemo, personName, firstName, mentionHandle, loadFile, textCustomer, cancelText, takeJob, handBack, assignJob, addDoc, adoptJob, postMessage, openAsk, ensureThread, seatName, linePreview, threadForJob, mentionSeen, invoiceRequest, markLost, reviveCustomer, createEstimate, estimateCatalog, parcelLookup, fillPaperwork, openPaperwork, openPacketFile, nocSend, nocStatus, materialSend, deedSend, filePermitSet, postPhoto, photoSrc, loadCrews, threadReceipts, receiptWords, nextWordFor, renderLine, mirrorMark, apptSet } from './book.js?v=122';
import { $, html, raw, esc, toast, openModal } from './ui.js?v=122';
import { enterPosts, micButton } from './dictate.js?v=122';
import { wireAtOn } from './village.js?v=122';   // Sam, 18 Sep: the Village's @ picker, on the note box too
import { quoteFileCard, wireQuotes } from './quotes.js?v=122';
import { STAGES, stageLabel, brandName, askLabel, ASK_LABEL } from './config.js?v=122';
const STAGE_CLS = Object.fromEntries(Object.entries(STAGES).map(([k, v]) => [k, v.cls]));   // the stage chip's color
import { say, thing, iconForAsk } from './words.js?v=122';
import { settleDialog } from './office.js?v=122';
import { reload } from './app.js?v=122';
import { relTime } from './production.js?v=122';
import { billsCards, billsNext, wireBills } from './bills.js?v=122';   // 365/369: the Bill landed and Invoice ready cards

let current = null;    // { customerId, data }
let peek = null;       // the drawer's own { customerId, data }
const money = (n) => n == null ? '' : '$' + Math.round(Number(n)).toLocaleString();
const mins = (m) => m == null ? '' : m >= 1440 ? (m / 1440).toFixed(1) + ' d' : m >= 60 ? (m / 60).toFixed(1) + ' h' : Math.round(m) + ' min';
const when = (iso) => { const d = new Date(iso); const today = new Date().toDateString() === d.toDateString(); return (today ? 'today' : d.toLocaleDateString([], { month: 'short', day: 'numeric' })) + ' · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
const chev = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"></path></svg>';

/* MY BOOK (Kevin, 16 Sep: "would be cool if they saw all their customers and current
   open tasks in this easier to read and understand UI"). Files opens on MINE: every
   customer this seat holds, sells, supervises, or has a task on — one card each, the
   open tasks as a checklist with who has them and how long, the last customer text
   and how long they have waited. EVERYONE is the whole list the seat can read. */
let filesView = 'mine';
export function renderFiles(root) {
  const me = state.me || {};
  const byCust = new Map();
  for (const q of state.queue || []) { if (!byCust.has(q.customer_id)) byCust.set(q.customer_id, []); byCust.get(q.customer_id).push(q); }
  const mineIds = new Set();
  for (const b of state.board || []) if (!b.stale && (b.owner_id === me.id || b.supervisor_id === me.id || b.rep_id === me.id)) mineIds.add(b.customer_id);
  for (const q of state.queue || []) if (q.assignee_id === me.id) mineIds.add(q.customer_id);
  for (const j of state.pipeline || []) if (j.rep_id === me.id && !j.contract_signed_at && j.customer_id) mineIds.add(j.customer_id);
  const boardBy = new Map((state.board || []).filter((b) => !b.stale).map((b) => [b.customer_id, b]));
  const pipeBy = new Map((state.pipeline || []).map((j) => [j.customer_id, j]));
  const mine = [...mineIds].map((id) => {
    const b = boardBy.get(id), j = pipeBy.get(id);
    const asks = (byCust.get(id) || []).filter((q) => q.state === 'OPEN' || !q.state);
    return { id, b, j, asks, name: b?.customer_name || j?.customers?.name || 'A customer', title: b?.title || j?.title || '', cc: b?.cc_company_id || j?.cc_company_id,
      waiting: b?.waiting_min || 0, lastBody: b?.last_inbound_body, lastAt: b?.last_inbound_at, stage: b?.stage || (j ? (j.appt_starts_at && new Date(j.appt_starts_at) > new Date() ? 'booked' : 'selling') : null), days: b?.days_in_stage || 0, hold: b?.owner_name || b?.rep_name || '' };
  }).sort((a, b) => (b.waiting - a.waiting) || (b.asks.length - a.asks.length) || (b.days - a.days));
  if (filesView === 'mine' && !mine.length) filesView = 'all';
  const B = (state.board || []).filter((b) => !b.stale).sort((a, b) => new Date(b.last_inbound_at || 0) - new Date(a.last_inbound_at || 0)).slice(0, 40);
  const waitWord = (m) => m >= 1440 ? Math.round(m / 1440) + ' d' : m >= 60 ? Math.round(m / 60) + ' h' : Math.round(m) + ' min';
  const askRow = (q) => `<div class="task ${q.assignee_id === me.id ? 'mine' : ''}"><span class="check"></span><span>${esc(askLabel(q))}</span><span class="who">${esc(firstName(q.assignee_name) || 'nobody')}</span><span class="mono ${q.open_min > 4320 ? 'red' : q.open_min > 1440 ? 'clock' : 'dimmer'}">${esc(waitWord(q.open_min || 0))}</span></div>`;
  root.innerHTML = html`
    <div class="head">
      <div><div class="kicker">Files · ${filesView === 'mine' ? 'your customers and what is open on each' : 'every customer the seat can read'}</div>
        <h1 class="serif">${filesView === 'mine' ? `${mine.length} customer${mine.length === 1 ? '' : 's'} on you, ${mine.reduce((a, c) => a + c.asks.length, 0)} open task${mine.reduce((a, c) => a + c.asks.length, 0) === 1 ? '' : 's'}.` : 'Find a customer above, or pick one who texted last.'}</h1></div>
      <div class="right subs"><button class="sub ${filesView === 'mine' ? 'on' : ''}" data-fv="mine">Mine · ${mine.length}</button><button class="sub ${filesView === 'all' ? 'on' : ''}" data-fv="all">Everyone</button></div>
    </div>
    ${filesView === 'mine' ? raw(`<div class="mybook">${mine.map((c) => `
      <div class="card mb" data-cust="${esc(c.id)}">
        <div class="mbhead"><div><b>${esc(personName(c.name))}</b><span class="small dimmer"> · ${esc(c.title)} · ${esc(brandName(c.cc))}</span></div>
          <div class="right">${c.stage ? `<span class="chip ${STAGE_CLS[c.stage] || ''}">${esc(stageLabel(c.stage))}${c.days ? ' · ' + Math.round(c.days) + ' d' : ''}</span>` : ''}</div></div>
        ${c.waiting >= 15 ? `<div class="mbwait"><span class="mono ${c.waiting > 240 ? 'red' : 'clock'}">Waiting ${esc(waitWord(c.waiting))}</span> "${esc(String(c.lastBody || '').slice(0, 90))}"</div>` : (c.lastBody ? `<div class="mblast small dimmer">Last from them: "${esc(String(c.lastBody).slice(0, 90))}"</div>` : '')}
        ${c.asks.length ? `<div class="tasks">${c.asks.sort((a, b) => (b.assignee_id === me.id) - (a.assignee_id === me.id) || b.open_min - a.open_min).map(askRow).join('')}</div>` : '<div class="small dimmer" style="margin-top:4px">Nothing open. Moving along.</div>'}
        <div class="mbfoot"><span class="small dimmer">${esc(c.hold ? 'Holds it: ' + firstName(c.hold) : '')}</span><button class="btn sm fill" data-open="${esc(c.id)}">Open the file</button></div>
      </div>`).join('')}</div>`) : raw(`
    <div class="card"><div class="wrap"><table><thead><tr><th>Customer</th><th>Brand</th><th>Stage</th><th>Who holds it</th><th>Last customer text</th></tr></thead><tbody>
      ${B.map((b) => `<tr class="link" onclick="__peek('${esc(b.customer_id)}')"><td><b>${esc(personName(b.customer_name))}</b> · ${esc(b.title || '')}</td><td><span class="chip">${esc(brandName(b.cc_company_id))}</span></td><td><span class="chip ${STAGE_CLS[b.stage] || ''}">${esc(stageLabel(b.stage))}</span></td><td>${esc(b.owner_name || b.rep_name || '—')}</td><td class="small">${b.last_inbound_body ? esc(String(b.last_inbound_body).slice(0, 70)) : '<span class="dimmer">—</span>'}</td></tr>`).join('')}
    </tbody></table></div></div>`)}`;
  root.querySelectorAll('[data-fv]').forEach((b) => (b.onclick = () => { filesView = b.dataset.fv; renderFiles(root); }));
  root.querySelectorAll('[data-open]').forEach((b) => (b.onclick = () => window.__peek(b.dataset.open)));
  root.querySelectorAll('.card.mb .mbhead').forEach((h) => (h.onclick = () => window.__peek(h.closest('.card').dataset.cust)));
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
  const photos = ctx.data.photos || [], photoByMsg = new Map(photos.filter((p) => p.message_id).map((p) => [p.message_id, p]));   // 351
  const rcByMsg = new Map(); for (const r of ctx.data.receipts || []) { if (!rcByMsg.has(r.message_id)) rcByMsg.set(r.message_id, []); rcByMsg.get(r.message_id).push(r); }   // 354

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
  messages.forEach((m) => items.push({ at: m.created_at, kind: m.is_system ? 'sys' : 'chat', pid: m.is_system ? null : m.author_id, who: m.is_system ? '' : (m.author_name || '') + ' · inside note · never sent to the customer', body: m.is_system ? say(m.body) : m.body, lane: m.lane, photo: photoByMsg.get(m.id), rcpt: rcByMsg.get(m.id) }));
  // the steps and the paper, as one line each, where they happened
  const ev = (at, cls, pid, body) => { if (at) items.push({ at, kind: 'ev', cls, pid, body }); };
  attachments.forEach((f) => ev(f.created_at, 'file', f.added_by, `${f.label || f.storage_path || f.source} · on the file`));
  (ctx.data.packet || []).forEach((p) => ev(p.uploaded_at, 'file', p.uploaded_by, `${PROOF_LABEL[p.kind] || p.kind}${p.signed ? ' · signed' : ''} · filed from the calculator`));
  (ctx.data.filled || []).forEach((f) => ev(f.filled_at, 'file', personByName(f.filled_by)?.id, `${FORM_LABEL[f.form_key] || f.form_key} · filled from the file${(f.blanks || []).length ? ' · ' + f.blanks.length + ' blanks for the office' : ''}`));
  estimates.forEach((d) => { ev(d.created_at, 'file', job.rep_id, `Estimate #${d.serial_number} · ${fmtMoney(d.total)} · one link`); ev(d.accepted_at, 'money', null, `ACCEPTED · estimate #${d.serial_number} · the customer tapped yes`); });
  if (ctx.data.fence) ev(ctx.data.fence.created_at, 'file', ctx.data.fence.rep_id, `The fence job · ${ctx.data.fence.linear_ft} ft · ${fmtMoney(ctx.data.fence.quote)} · Complete Quote in the calculator`);
  if (ctx.data.parcel) ev(ctx.data.parcel.fetched_at, ctx.data.parcel.signer_match === 'mismatch' ? 'bad' : 'file', null, `Owner of record · ${(ctx.data.parcel.owner_names || []).join(' & ') || '—'} · ${ctx.data.parcel.signer_match === 'match' ? 'matches the signer' : ctx.data.parcel.signer_match === 'mismatch' ? 'NOT the signer' : 'from the county'}`);
  // 401: every call on the file — answered, placed, or missed — from Uvoice's hourly call records; a missed one is red
  (ctx.data.calls || []).forEach((c) => { const p = personOf(c.rep_id); const who = p ? firstName(p.name) : (c.ext ? 'ext ' + c.ext : 'the office'); const secs = c.duration_s || 0; const len = secs >= 60 ? Math.round(secs / 60) + ' min' : secs + ' s';
    ev(c.began_at, c.call_type === 'missed' ? 'bad' : 'step', c.rep_id, c.call_type === 'missed' ? `📞 ${name} called ${who}'s line, nobody answered · rang ${len}` : c.call_type === 'inbound' ? `📞 ${name} called · ${c.answered_by === 'core' ? 'voicemail took it' : who + ' answered'} · ${len}` : `📞 ${who} called them · ${len}`); });
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
        ${raw(contactLine(customer, ctx))}
        ${raw(leadLine(job, ctx.data.appt, ctx.data.mirror))}
        <div class="stagebar" style="margin-top:8px">${raw(steps.join(chev))}</div>
        ${journey.length ? raw(`<div class="journey" title="Who moved through this file, in order">${journey.map((j) => { const p = j.pid === 'machine' ? { name: 'The machine' } : personOf(j.pid); const c = colorFor(j.pid); return `<span style="--c:${c.c};flex-grow:${j.n}" title="${esc((p?.name || 'someone') + ' · ' + new Date(j.from).toLocaleDateString([], { month: 'short', day: 'numeric' }) + (j.n > 1 ? ' · ' + j.n : ''))}"></span>`; }).join('')}</div><div class="journey-who">${[...new Set(journey.map((j) => j.pid))].map((pid) => { const p = pid === 'machine' ? { name: 'The machine', initials: 'AI' } : personOf(pid); const c = colorFor(pid); return `<span class="pill" style="--c:${c.c};--cs:${c.cs}"><i class="av">${esc(initialsOf(p))}</i>${esc(pid === 'machine' ? 'The machine' : firstName(p?.name || 'someone'))}</span>`; }).join('')}</div>`) : ''}
        ${raw((() => { const ownerBad = ctx.data.parcel?.signer_match === 'mismatch' || ctx.data.parcel?.confidential; const n = (!ownerBad && customer?.disposition !== 'lost' && billsNext(ctx)) || fileNext(job, openAsks, estimates, ctx.data.parcel, customer, canTake, ctx.data.subLocks || []); return `<div class="next ${n.tone}" style="margin-top:10px"><b>NEXT</b> ${esc(n.text)}</div>`; })())}
        ${unfiled ? raw(`<div class="adopt" style="margin-top:10px;padding:10px 12px;border:1px dashed var(--gold);border-radius:10px;background:var(--paper2, transparent)"><div class="kicker" style="color:var(--gold)">Still run in Contractors Cloud · where is it right now?</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${ADOPT.map(([k, l]) => `<button class="btn sm" data-adopt="${k}">${esc(l)}</button>`).join('')}</div><div class="small dimmer" style="margin-top:6px">One tap opens exactly that ask on the right seat, clock starting today. Nothing else opens.</div></div>`) : ''}
        ${optOut ? raw('<div class="red small" style="margin-top:6px">This customer said STOP — no texts go out.</div>') : ''}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${customer?.phone ? raw(`<a class="btn" href="tel:${esc(customer.phone)}">Call</a>`) : ''}
        ${customer?.email ? raw(`<a class="btn" href="mailto:${esc(customer.email)}">Email</a>`) : ''}
        <button class="btn" id="file-text" title="Text the customer from the main line">Text</button>
        <button class="btn" id="file-tag" title="Note to the team · tag the next person">Tag</button>
        ${customer ? raw('<button class="btn" id="file-estimate" title="Build the itemized estimate · one link · they tap ACCEPT">Estimate</button>') : ''}
        ${customer && job.job_id && job.contract_signed_at && (staff || (job.rep_id && job.rep_id === me?.id)) ? raw('<button class="btn" id="file-change-order" title="381: a change order is an estimate the customer signs on the same link. Signed, it is a line on the invoice; unsigned, the invoice waits.">Change order</button>') : ''}
        ${job.job_id ? raw('<button class="btn" id="file-doc" title="Put a document on the file">+ Document</button>') : ''}
        ${staff && job.job_id ? raw('<button class="btn" id="file-send" title="Hand this file to a seat">Send to…</button>') : ''}
        ${staff && job.job_id ? raw('<button class="btn" id="file-invoice" title="Queue this job\'s invoice for QuickBooks">Invoice</button>') : ''}
        ${staff && customer && !optOut ? raw('<button class="btn" id="file-collect" title="Text the customer the payment link">Collect</button>') : ''}
        ${canTake ? raw('<button class="btn fill" id="file-take">Take the job</button>') : ''}
        ${isSup && job.stage === 'production' ? raw('<button class="btn" id="file-back-job">Hand it back</button>') : ''}
        ${(staff || (job.rep_id && job.rep_id === me?.id)) && customer && job.job_id ? raw(customer.disposition === 'lost'
          ? `<span class="chip warn" style="align-self:center" title="A no clears the board (gospel 15)">NOT GOING WITH US${customer.disposition_at ? ' · ' + esc(new Date(customer.disposition_at).toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase()) : ''}</span><button class="btn sm" id="file-revive" title="Back on: the file returns to the boards">Revive</button>`
          : '<button class="btn" id="file-lost" title="A no clears the board: the customer is marked lost, the job comes off every board, the office is tagged to mark it lost in Contractors Cloud">Not going with us</button>') : ''}
      </div>
    </div>

    ${raw(billsCards(ctx))}
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
          <input id="note-to" list="note-to-list" autocomplete="off" placeholder="To: type a name — Eric, Sam, Obed… or @office, @sales" title="Type the first letters of a name and pick, the way Jetstreams work in CC. Leave it blank for nobody in particular." style="width:230px;padding:5px 8px;font-size:12px"/>
          <datalist id="note-to-list"><option value="@rep">the rep on this file (sold it, or is quoting it)</option><option value="@office">the office seat</option><option value="@sales">every rep</option><option value="@supers">every supervisor, every brand</option><option value="@production">the supervisor on this job</option><option value="@schedule">scheduling</option><option value="@invoice">billing</option><option value="@crew">the crew on this job, on their link</option>${raw(state.seats.map((s) => `<option value="${esc(mentionHandle(s))}">${esc(s.name)}</option>`).join(''))}</datalist>
          <select id="note-what" style="width:auto;padding:5px 8px;font-size:12px"><option value="">What: a note</option>${raw(Object.keys(ASK_LABEL).map((t) => `<option value="${t}">Task: ${esc(ASK_LABEL[t])}</option>`).join(''))}</select>
        </div>
        <div class="composer" style="background:var(--officesoft);position:relative">
          <textarea id="note" placeholder="permit is in, ready to schedule · take this one · customer asked for you · @ and two letters adds anyone"></textarea>
          <div class="line-find-pop at-pop" id="note-at-pop" hidden></div>
          <button class="btn" id="note-send">Post</button>
        </div>
        <div class="small">Type <b>@</b> and two letters in the box to add anyone, as many as you like; Enter picks, Enter posts. They get a push on the phone or an email with the link to this file, and it sits in their Tagged list until they open it. A task also opens an ask on them with the clock running.</div>
      </div>
    </div>

    <div class="grid-file cards">
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="card">
          <div class="head" style="margin-bottom:0"><div class="kicker">Asks on this file · the clock is the point</div>${thread ? raw('<button class="btn sm" id="new-ask">+ Ask</button>') : ''}</div>
          ${openAsks.length ? raw(openAsks.map((a) => askRow(a, me)).join('')) : raw('<div class="small">No open asks.</div>')}
          ${doneAsks.length ? raw('<div class="kicker" style="margin-top:8px">Settled</div>' + doneAsks.map((a) => `<div class="ask done" style="grid-template-columns:auto 1fr auto"><span class="check done"></span><span>${esc(askLabel(a))} · ${esc(a.assignee_name || '')}${a.proof?.value ? ' · ' + esc(a.proof.value) : ''}${a.proof?.waived ? ' · waived: ' + esc(a.proof.waived) : ''}</span><span class="mono">${esc(mins(a.minutes_to_close))}</span></div>`).join('')) : ''}
        </div>
        ${customer ? raw(propertyCard(ctx.data.parcel, customer, ctx.data.filled || [], ctx.data.counter, ctx.data.deed, ctx.data.permitRule)) : ''}
        ${raw(fenceCard(ctx.data.fence, ctx.data.packet || [], estimates))}
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${raw(photosCard(photos))}
        ${raw(subLockCard(ctx.data.subLocks || [], job, customer, me, photos))}
        ${raw(quoteFileCard(ctx.data.quotes, photos))}
        ${estimates.length ? raw(`<div class="card"><div class="kicker">Estimates · one link, they tap ACCEPT</div><div class="rows">${estimates.map((d) => { const tk = estLinks.find((l) => l.id === d.link_id)?.token; const url = tk ? ESTIMATE_VIEW + tk : null; const acc = d.status === 'accepted'; return `<div class="r"><span><b>#${esc(d.serial_number)}</b> · ${esc(d.title || 'Estimate')} · <span class="mono">${esc(fmtMoney(d.total))}</span> · <span class="chip ${acc ? 'ok' : ''}">${acc ? 'ACCEPTED · ' + esc(new Date(d.accepted_at).toLocaleDateString([], { month: 'short', day: 'numeric' })) : esc(String(d.status).toUpperCase()) + ' · valid to ' + esc(new Date(d.valid_until + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' }))}</span></span><span style="display:flex;gap:4px">${url ? `<button class="btn sm" data-estlink="${esc(url)}">Copy link</button><a class="btn sm" href="${esc(url)}" target="_blank" rel="noopener" title="Counts as a view">Open</a>` : ''}</span></div>`; }).join('')}</div></div>`) : ''}
        ${paperwork.length ? raw(`<div class="card" data-tour="paperwork"><div class="kicker">Paperwork · the crucial pieces</div>${paperwork.map((a) => a.doc_kind === 'noc' ? nocRow(a, ctx.data.noc, (ctx.data.filled || []).some((f) => f.kind === 'noc')) : a.doc_kind === 'deed' ? deedRow(a, ctx.data.deed) : `<div class="ask ${a.state === 'OPEN' ? '' : 'done'}" style="grid-template-columns:auto 1fr auto"><span class="check ${a.state === 'OPEN' ? '' : 'done'}"></span><span>${esc(askLabel(a))}${a.proof?.waived ? ' · <span class="dimmer">not required: ' + esc(a.proof.waived) + '</span>' : ''}</span>${a.state === 'OPEN' ? `<button class="btn sm ok" data-settle="${esc(a.id)}">Upload</button>` : '<span class="mono verify">on file</span>'}</div>`).join('')}</div>`) : ''}
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
  enterPosts(q('#compose'), () => send(ctx, q, compact));
  { const m = micButton(q('#compose')); const sb = q('#send'); if (m && sb) sb.parentElement.insertBefore(m, sb); }
  // the lines, readable and tappable (Kevin, 14 Sep: "you can't really see the pre-written things") — a tap fills the box, never sends
  linePreview(ctx.customerId).then((lines) => {
    const box = q('#lines'); if (!box) return;
    if (!lines.length) { box.innerHTML = '<div class="small">No pre-written lines for this brand yet. Kevin and Jess add them as rows in the Office room.</div>'; return; }
    box.innerHTML = lines.map((l) => `<button class="line" type="button" data-body="${esc(l.body)}"><b>${esc(l.label)}</b><span>${esc(l.body)}</span></button>`).join('');
    box.querySelectorAll('.line').forEach((b) => (b.onclick = () => { const c = q('#compose'); if (!c || c.disabled) return; c.value = b.dataset.body; c.focus(); box.querySelectorAll('.line').forEach((x) => x.classList.toggle('on', x === b)); }));
    applyNextWord(ctx, q, lines, box);
  }).catch(() => { const box = q('#lines'); if (box) box.innerHTML = '<div class="small">The lines could not load. Type it yourself on the left.</div>'; });
  root.querySelectorAll('[data-material-send]').forEach((b) => (b.onclick = async () => {
    b.disabled = true; const was = b.textContent; b.textContent = 'Sending…';
    try {
      const r = await materialSend(ctx.customerId);
      const went = (r?.sent || []).filter((s) => s.sent).map((s) => s.supplier);
      const held = (r?.sent || []).filter((s) => !s.sent).map((s) => `${s.supplier}: ${s.why}`);
      if (r?.ok) toast(`Order emailed to ${went.join(', ')}${held.length ? ' · ' + held.join(' · ') : ''}. The order number they reply with closes the ask.`);
      else toast(r?.why || held.join(' · ') || 'Nothing went out.', 'err');
      if (r?.ok) { await reload(true); (compact ? openFileDrawer(ctx.customerId) : openFile(ctx.customerId)); } else { b.disabled = false; b.textContent = was; }
    } catch (e) { toast(e.message, 'err'); b.disabled = false; b.textContent = was; }
  }));
  root.querySelectorAll('[data-settle]').forEach((b) => (b.onclick = () => { const a = asks.find((x) => x.id === b.dataset.settle); if (a) settleDialog(withQueueShape(a, job), (r, proof) => { state.nextWord = nextWordFor({ ...a, customer_id: ctx.customerId }, proof); (compact ? openFileDrawer(ctx.customerId) : openFile(ctx.customerId)); }); }));
  if (q('#file-take')) q('#file-take').onclick = async () => { try { await takeJob(job.job_id); toast(`You have ${name}.`); await reload(true); (compact ? openFileDrawer(ctx.customerId) : openFile(ctx.customerId)); } catch (e) { toast(e.message, 'err'); } };
  if (q('#file-back-job')) q('#file-back-job').onclick = () => openModal({ title: `Hand ${name} back`, submitLabel: 'Hand it back', body: '<div class="field"><label>Why</label><textarea name="note" required></textarea></div>', onSubmit: async (f) => { await handBack(job.job_id, f.note.value.trim()); toast('Handed back'); await reload(true); (compact ? openFileDrawer(ctx.customerId) : openFile(ctx.customerId)); } });
  if (q('#new-ask')) q('#new-ask').onclick = () => newAsk(thread, job, ctx, compact);
  const again = () => (compact ? openFileDrawer(ctx.customerId) : openFile(ctx.customerId));
  wireBills(root, { bills: ctx.data.bills || [], ctx, after: async () => { await reload(true); again(); } });   // 365/369: the money cards' taps
  // 380 (Kevin, 17 Sep, on Mike's "delete these three"): a no after the yes clears the board; nothing is deleted, the office is tagged to mark it in CC
  root.querySelectorAll('[data-copy]').forEach((b) => (b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.copy); toast('Copied'); } catch { prompt('Copy this', b.dataset.copy); } }));
  if (q('#file-lost')) q('#file-lost').onclick = () => openModal({ title: `${name} is not going with us`, submitLabel: 'Take it off the board', body: `
      <div class="field"><label>Why</label><select name="reason"><option value="price">Price</option><option value="financing">Financing</option><option value="competitor">Went with a competitor</option><option value="no_response">No response</option><option value="other" selected>Other · backed out after the fact</option></select></div>
      <div class="field"><label>A word for the office (optional)</label><input name="note" placeholder="backed out after signing · moving · wants to wait until spring"/></div>
      <div class="note">Nothing is deleted. ${esc(firstName(name))} is marked lost, the job comes off every board and every number, and the office is tagged on this file to mark it lost in Contractors Cloud. Revive brings it back.</div>`,
    onSubmit: async (f) => { await markLost(ctx.customerId, f.reason.value, f.note.value.trim() || null); toast('Off the board · the office was tagged to mark it in CC'); await reload(true); again(); } });
  if (q('#file-revive')) q('#file-revive').onclick = async () => { try { await reviveCustomer(ctx.customerId, null); toast(`${firstName(name)} is back on`); await reload(true); again(); } catch (e) { toast(e.message, 'err'); } };
  // 381 THE FIRST PIECE: the lead's copy for Contractors Cloud — the fields in CC's order, or the seat's word that it was typed / should go again
  if (q('#mirror-copy')) q('#mirror-copy').onclick = async () => { const t = mirrorCopyText(ctx.data.mirror, customer, job); try { await navigator.clipboard.writeText(t); toast('Copied — paste into Contractors Cloud, top to bottom'); } catch { prompt('For Contractors Cloud', t); } };
  if (q('#mirror-byhand')) q('#mirror-byhand').onclick = async () => { try { await mirrorMark(ctx.data.mirror.id, 'by_hand', null); toast('Noted: typed into Contractors Cloud'); again(); } catch (e) { toast(e.message, 'err'); } };
  // 397 THE SUB LOCKED IN: Lock the sub · Copy for CC · Typed into CC · Void — and the two doors the Ride-Along opens
  if (q('#sub-lock')) q('#sub-lock').onclick = () => subLockDialog(ctx, customer, job, again);
  root.querySelectorAll('[data-sub-frompic]').forEach((b) => b.onclick = () => { const p = (ctx.data.photos || []).find((x) => x.id === b.dataset.subFrompic); if (p) subLockDialog(ctx, customer, job, again, { name: p.crew, amount: Math.round(Number(p.amount)), photoId: p.id }); });
  root.querySelectorAll('[data-sub-copy]').forEach((b) => b.onclick = async () => { const l = (ctx.data.subLocks || []).find((x) => x.id === b.dataset.subCopy); const t = subCopyText(l, customer, job); try { await navigator.clipboard.writeText(t); toast('Copied — paste onto the project in Contractors Cloud'); } catch { prompt('For Contractors Cloud', t); } });
  root.querySelectorAll('[data-sub-typed]').forEach((b) => b.onclick = async () => { try { await subLockMark(b.dataset.subTyped, 'typed_into_cc', null); toast('Noted: typed into Contractors Cloud'); await reload(true); again(); } catch (e) { toast(e.message, 'err'); } });
  root.querySelectorAll('[data-sub-void]').forEach((b) => b.onclick = () => openModal({ title: 'Void this lock', submitLabel: 'Void it', body: '<div class="field"><label>Why</label><input name="note" placeholder="wrong sub · the price changed" required></div><div class="note">The line stays on the file. Lock the right one after.</div>', onSubmit: async (f) => { await subLockMark(b.dataset.subVoid, 'void', f.note.value.trim()); toast('Voided'); await reload(true); again(); } }));
  window.__subLockOpen = () => subLockDialog(ctx, customer, job, again);
  window.__photoSheetOpen = () => photoSheet([{ name: 'contract.jpg' }], ctx, customer, again);
  if (q('#mirror-again')) q('#mirror-again').onclick = async () => { try { await mirrorMark(ctx.data.mirror.id, 'queued', null); toast('Queued again — the machine tries within the hour'); again(); } catch (e) { toast(e.message, 'err'); } };
  // 384: move, book or cancel the estimate visit from the file — the rep is buzzed, the line goes on the file, the CC copy follows its switch (or Copy for CC)
  const apptDialog = (booked) => openModal({ title: booked ? `Move ${firstName(name)}'s estimate` : `Book ${firstName(name)}'s estimate`, submitLabel: booked ? 'Move it' : 'Book it', body: `
      <div class="two"><div class="field"><label>${booked ? 'New day and time' : 'Day and time'}</label><input name="at" type="datetime-local" required/></div><div class="field"><label>Length</label><select name="mins"><option value="30">30 min</option><option value="45">45 min</option><option value="60" selected>1 hour</option><option value="90">1½ h</option><option value="120">2 h</option></select></div></div>
      <div class="field"><label>Why, in a word (optional)</label><input name="note" placeholder="customer asked for Thursday · rain · rep sick"/></div>
      <div class="note">${esc(job.rep_name ? firstName(job.rep_name) + "'s phone buzzes with the " + (booked ? 'new ' : '') + 'time' : 'No rep on this file yet')}. The line goes on the file with your name. Contractors Cloud follows when its switch is on; until then, Copy for CC.</div>`,
    onSubmit: async (f) => { const r = await apptSet(job.job_id, new Date(f.at.value).toISOString(), Number(f.mins.value || 60), f.note.value.trim() || null); toast(`${booked ? 'Moved' : 'Booked'} · ${r?.when || ''}${r?.pushed_rep ? ' · ' + firstName(job.rep_name || 'the rep') + "'s phone buzzed" : ''}`); await reload(true); again(); } });
  if (q('#appt-change')) q('#appt-change').onclick = () => apptDialog(true);
  if (q('#appt-book')) q('#appt-book').onclick = () => apptDialog(false);
  if (q('#appt-cancel')) q('#appt-cancel').onclick = () => openModal({ title: `Cancel ${firstName(name)}'s estimate visit`, submitLabel: 'Cancel the visit', body: `<div class="field"><label>Why (optional)</label><input name="note" placeholder="moving in the spring · will call back"/></div><div class="note">The visit comes off the rep's day and his phone says so; the lead stays on the file. A real no is the Not going with us button.</div>`,
    onSubmit: async (f) => { await apptSet(job.job_id, null, null, f.note.value.trim() || null); toast('Visit cancelled · the rep was told'); await reload(true); again(); } });
  // 351: tap a picture for the full size; ＋ Photo takes one (phone) or picks one (laptop) and says it on the file
  root.querySelectorAll('.pthumb').forEach((im) => (im.onclick = () => { const p = (photos || []).find((x) => photoSrc(x) === (im.dataset.full || im.src)); lightbox(im.dataset.full || im.src, im.title || '', p, customer); }));
  wireQuotes(root);   // 353
  const pin = q('#photo-in');
  if (pin) pin.onchange = () => { const files = [...pin.files]; pin.value = ''; if (files.length) photoSheet(files, ctx, customer, again); };
  // the Estimate button opens pre-typed from the calculator when the rep drew one; the fence card's own button does the same
  const seed = estimateSeedFromTakeoff(ctx.data.fence);
  if (q('#file-estimate')) q('#file-estimate').onclick = () => estimateDialog(ctx, job, customer, name, again, seed);
  if (q('#fence-estimate')) q('#fence-estimate').onclick = () => estimateDialog(ctx, job, customer, name, again, seed);
  if (q('#file-change-order')) q('#file-change-order').onclick = () => estimateDialog(ctx, job, customer, name, again, null, { kind: 'change_order' });   // 381: signed on the same link, a line on the invoice
  // 367: hand the NOC to the customer — fill it first when the file has none, then the email (the trigger on the fill may already have sent it when the switch is ON)
  /* 386: the warranty deed — the customer is emailed a photo link, the texts run until the picture lands */
  root.querySelectorAll('#deed-send').forEach((b) => (b.onclick = async () => {
    b.disabled = true; b.textContent = 'Sending…';
    try {
      const h = await deedSend(ctx.customerId);
      toast(h?.emailed_at ? 'Deed request emailed to the customer, the rep and the office — the texts run until the picture lands' : 'Deed request opened on the file');
      await reload(true); (compact ? openFileDrawer(ctx.customerId) : openFile(ctx.customerId));
    } catch (e) { toast(e.message, 'err'); b.disabled = false; b.textContent = 'Request the deed'; }
  }));
  if (q('#noc-send')) q('#noc-send').onclick = async () => {
    const b = q('#noc-send'); b.disabled = true; b.textContent = 'Sending…';
    try {
      if (!(ctx.data.filled || []).some((f) => f.kind === 'noc')) {
        await fillPaperwork(ctx.customerId, null);
        const h = await nocStatus(ctx.customerId);
        if (h?.emailed_at) { toast('NOC filled and emailed to the customer, the rep and the office'); again(); return; }
      }
      await nocSend(ctx.customerId);
      toast('Emailed to the customer, the rep and the office · the photo link is in it'); again();
    } catch (e) { toast(e.message, 'err'); b.disabled = false; b.textContent = 'Email it'; }
  };
  root.querySelectorAll('[data-copy-link]').forEach((b) => (b.onclick = async () => {
    try { await navigator.clipboard.writeText(b.dataset.copyLink); toast('Photo link copied — paste it in a text'); } catch { prompt('The photo link', b.dataset.copyLink); }
  }));
  if (q('#permit-flip')) q('#permit-flip').onclick = () => {
    const b = q('#permit-flip'); const required = b.dataset.required === '1';
    openModal({ title: required ? 'A permit after all' : 'No permit on this job', submitLabel: required ? 'Open the permit ask' : 'Close it on this file',
      body: `<p class="small">${required ? 'The paperwork checklist comes back and PERMIT opens on the office (the contract is signed).' : 'The permit ask closes, the NOC and permit-signature asks are waived, the reminders stop. This file only — the brand and the county rules stay as they are.'}</p><div class="field"><label>Why (goes on the file)</label><input name="note" placeholder="${required ? 'e.g. the city wants one for the wall' : 'e.g. repair under the threshold'}"></div>`,
      onSubmit: async (f) => { const r = await filePermitSet(ctx.customerId, required, f.note.value.trim() || null); toast(r?.permit_required === false ? 'No permit on this job — closed on the file' : 'Permit ask is open'); await reload(true); (compact ? openFileDrawer(ctx.customerId) : openFile(ctx.customerId)); } });
  };
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
  // THE JETSTREAM (Sam, 18 Sep 10:02 AM: "the @ doesn't work in the 'Note to Team' section… in CC we start typing part of someone's
  // name and their name gets highlighted so we can hit Enter"; 10:28: "to reply, we have to go into the corner"). The Village's own
  // picker on this box: type @ and two letters, the people come up, Enter picks; Enter alone posts (Shift+Enter is a new line).
  // ↩ Reply on an inside note fills To with who wrote it and puts the cursor in the box, so the answer lands on the same file.
  enterPosts(q('#note'), () => q('#note-send')?.click(), () => { const p = q('#note-at-pop'); return !!(p && !p.hidden); });   // registered first: it sees the picker open and steps aside
  wireAtOn(q('#note'), q('#note-at-pop'), () => {});
  root.querySelectorAll('[data-reply-to]').forEach((b) => (b.onclick = () => { const s = personOf(b.dataset.replyTo); const to = q('#note-to'), n = q('#note'); if (to && s) to.value = mentionHandle(s); if (n) { n.scrollIntoView({ block: 'center', behavior: 'smooth' }); n.focus(); } }));
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
  // Sam, 18 Sep: "Eric" typed is Eric — a first name, a handle or a role resolves to the seat; nobody has to scroll a list
  const resolveTo = (typed) => {
    const t = String(typed || '').trim(); if (!t) return '';
    const roles = ['@office', '@sales', '@supers', '@schedule', '@production', '@rep', '@invoice', '@crew'];
    if (roles.includes(t.toLowerCase())) return t.toLowerCase();
    const k = t.replace(/^@/, '').toLowerCase();
    const seat = state.seats.find((s) => mentionHandle(s).toLowerCase() === '@' + k) || state.seats.find((s) => firstName(s.name).toLowerCase() === k) || state.seats.find((s) => String(s.name || '').toLowerCase().startsWith(k));
    return seat ? mentionHandle(seat) : (t.startsWith('@') ? t : '@' + t);
  };
  q('#note-send').onclick = async () => {
    const to = resolveTo(q('#note-to').value), what = q('#note-what').value;
    let body = q('#note').value.trim(); if (!body && !what) return;
    // @crew (16 Sep, Kevin: "anyone from the company can communicate in this chat thread"): the note goes to the crew's lane, whoever writes it,
    // and shows on the crew's link (crew_link_view reads the SUPER lane). No "@crew" in the words the crew reads.
    const toCrew = to === '@crew';
    if (to && !toCrew && !body.includes(to)) body = to + ' ' + body;
    q('#note-send').disabled = true;
    try {
      let tid = thread?.id;
      if (!tid) { if (!job.job_id) throw new Error('No job on this file yet'); tid = await threadForJob(job.job_id); }
      const lane = toCrew || ['manager'].includes(me?.role) ? 'SUPER' : 'OFFICE';
      let rcWords = '';
      if (body) { const posted = await postMessage(tid, lane, body); const mid = Array.isArray(posted) ? posted[0]?.id : posted?.id; const rc = mid ? (await threadReceipts(tid).catch(() => [])).filter((r) => r.message_id === mid) : []; if (rc.length) rcWords = ' · ' + receiptWords(rc); }
      if (what) {
        const roleWords = ['@office', '@schedule', '@production', '@rep', '@invoice', '@crew'];
        const seat = to.startsWith('@') && !roleWords.includes(to) ? (state.seats.find((s) => mentionHandle(s).toLowerCase() === to.toLowerCase()) || state.seats.find((s) => firstName(s.name).toLowerCase() === to.slice(1).toLowerCase())) : null;
        const toId = seat?.id || (to === '@production' && job.supervisor_id) || (to === '@rep' && job.rep_id) || job.owner_id || me.id;
        const laneFor = ['COMPLETION_SIGNOFF', 'MATERIAL_REQUEST', 'SITE_ISSUE', 'SUPERVISOR_PING', 'SAFETY_JHA'].includes(what) ? 'SUPER' : ['CUSTOMER_REQUEST', 'SCHEDULE_QUESTION'].includes(what) ? 'CHAT' : 'OFFICE';
        await openAsk(tid, laneFor, what, body || null, toId);
      }
      toast((what ? 'Posted · task opened with the clock running' : 'Posted') + rcWords);
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
function estimateDialog(ctx, job, customer, name, again, seed, opts = {}) {
  const cc = job.cc_company_id || state.me?.manages_company_id || '1461';
  const co = opts.kind === 'change_order';   // 381: the same builder, the same link; signed = a line on the invoice
  const rowHtml = (it) => `<div class="est-row">
      <div><input name="label" list="est-menu" autocomplete="off" placeholder="Pavers · 6' privacy fence · shingle roof" value="${esc(it?.label || '')}" required/><textarea name="desc" placeholder="Scope of work — what you'll do, what's included, what isn't" style="min-height:72px;margin-top:4px">${esc(it?.desc || '')}</textarea></div>
      <div class="est-cell"><span class="est-cl">Qty</span><input name="qty" type="number" step="0.01" min="0" value="${esc(String(it?.qty ?? 1))}" title="Qty"/></div>
      <div class="est-cell"><span class="est-cl">Unit</span><input name="unit" placeholder="job" value="${esc(it?.unit || '')}" title="Unit"/></div>
      <div class="est-cell"><span class="est-cl">Price each</span><input name="price" type="number" step="0.01" min="0" placeholder="0.00" value="${it && it.price != null ? esc(String(it.price)) : ''}" title="Unit price" required/></div>
      <button class="btn sm" type="button" data-del title="Remove this item">×</button>
    </div>`;
  openModal({ title: co ? `Change order for ${name}` : `Estimate for ${name}`, submitLabel: co ? 'Create the change order' : 'Create the estimate', wide: true, body: `
      ${co ? '<div class="next good" style="margin-bottom:6px"><b>CHANGE ORDER</b> Only what changed: the extra gate, the longer run, the credit. They sign it on the same link; signed, it is a line on the invoice; unsigned, the invoice waits and the card says so. A credit is a negative price.</div>' : ''}
      <div class="field"><label>Title · what ${co ? 'changed' : 'the job is'}</label><input name="title" placeholder="${co ? 'Add one 4\' gate on the east side' : 'Backyard paver installation'}" value="${esc(seed?.title || '')}"/></div>
      ${seed ? '<div class="next good" style="margin-bottom:6px"><b>FROM THE CALCULATOR</b> The items below are what the rep drew and priced. Read them, change what you want, then Create.</div>' : ''}
      <div class="kicker" style="margin-top:6px">Items · what it is and the scope · qty · unit · unit price</div>
      <div id="est-rows">${seed ? seed.items.map(rowHtml).join('') : rowHtml()}</div>
      <datalist id="est-menu"></datalist>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><button class="btn sm" type="button" id="est-add">+ Item</button><div>Total <b class="mono" id="est-total">$0.00</b></div></div>
      <div class="field" style="margin-top:8px"><label>Note under the items (optional)</label><textarea name="note" placeholder="50% deposit to schedule, balance on completion.">${esc(seed?.note || '')}</textarea></div>
      <div style="display:flex;gap:10px"><div class="field" style="flex:1"><label>Valid for</label><select name="valid"><option value="14">14 days</option><option value="7">7 days</option><option value="30">30 days</option></select></div><div class="field" style="flex:1"><label>Brand on it</label><select name="cc">${['1461', '1560', '1563', '1537'].map((c) => `<option value="${c}" ${c === String(cc) ? 'selected' : ''}>${esc(brandName(c))}</option>`).join('')}</select></div></div>
      <div class="note">Same shape as Mike's Billdu estimate: the items, the scope, the price, valid 14 days. One link goes to the customer; they tap ACCEPT; you get the push. Accepting is not selling — nothing lands on a board.</div>`,
    onOpen: (fm) => {
      /* 400: the menu as autocomplete — type whatever you want, or pick; the option names the unit and the last price */
      const fillMenu = async () => { try { const items = await estimateCatalog(fm.cc.value); const dl = fm.querySelector('#est-menu'); if (!dl) return; dl.innerHTML = (items || []).map((m) => `<option value="${esc(m.label)}">${esc(m.grp)}${m.unit ? ' · ' + esc(m.unit) : ''}${m.unit_price != null ? ' · ' + fmtMoney(m.unit_price) : ''}</option>`).join(''); } catch {} };
      fillMenu(); fm.cc.addEventListener('change', fillMenu);
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
      const r = await createEstimate({ customer_id: ctx.customerId, cc_company_id: fm.cc.value, title: fm.title.value.trim() || null, note: fm.note.value.trim() || null, valid_days: Number(fm.valid.value), channel: 'sms', items, ...(co ? { kind: 'change_order' } : {}) });
      toast(`${co ? 'Change order' : 'Estimate'} #${r.serial} · ${fmtMoney(r.total)}`);
      setTimeout(() => sendEstimateDialog(ctx, r, name, customer, fm.cc.value, again, co), 0);
    } });
}
function sendEstimateDialog(ctx, r, name, customer, cc, again, co = false) {
  const url = r.url;
  const tpl = co ? `Hi ${firstName(name)}, ${firstName(state.me?.name || '')} with ${brandName(cc)}. Here is the change order we talked about (#${r.serial}, ${fmtMoney(r.total)}) — tap to view and accept, and we keep moving: ${url}`
                 : `Hi ${firstName(name)}, ${firstName(state.me?.name || '')} with ${brandName(cc)}. Your estimate #${r.serial} is ready — tap to view and accept: ${url}`;
  openModal({ title: `${co ? 'Change order' : 'Estimate'} #${r.serial} · ${fmtMoney(r.total)} · send it`, submitLabel: customer?.phone ? `Text it to ${firstName(name)}` : 'Done', body: `
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
/* 378: what the counter asks for at intake, from permit_jurisdiction_rules — the fine print Kevin read on 16 Sep, as rows.
   By law the NOC is never a condition of the permit (713.135(1)(a)); what a counter lists on its own sheet is a separate fact. */
function counterLine(k) {
  if (!k || !k.found) return '';
  const where = k.municipality ? k.municipality.replace(/\b\w/g, (c) => c.toUpperCase()) : `${k.county} County (unincorporated)`;
  const bits = [];
  if (k.permit_required === false) bits.push('no permit for our work');
  else {
    if (k.hha_gates_issuance === 'always') bits.push('hold harmless before the permit issues, every job');
    else if (k.hha_gates_issuance === 'easement') bits.push(`hold harmless before the permit issues when the fence is in an easement${k.easement ? ' — THIS ONE IS' : ''}`);
    else if (k.hha_gates_issuance === 'never') bits.push('no hold harmless');
    else if (k.hha_notarized) bits.push('hold harmless (notarized; whether it gates issuance is not read yet)');
    if (k.permit_app_notarized) bits.push("owner's signature on the permit application, notarized");
    else if (k.permit_app_owner_signs) bits.push("owner signs the permit application");
    if (k.noc_asked_at_intake) bits.push('lists the recorded NOC at intake (the law does not require it — 713.135(1)(a))');
    else bits.push('NOC before the first inspection, not at intake');
  }
  return `<div class="r"><span class="small"><b>At the counter · ${esc(where)}:</b> ${esc(bits.join(' · '))}${k.read_at ? '' : ' <span class="dimmer">· from Sam\'s tree, not read from the city yet</span>'}</span></div>`;
}
/* 398: the file's permit answer (the file, then the brand, then the jurisdiction) and the office's flip */
function permitLine(r) {
  if (!r) return '';
  const can = ['office', 'owner', 'admin', 'manager'].includes(state.me?.role);
  const off = r.permit_required === false;
  return `<div class="r"><span class="small"><b>${off ? 'No permit on this job' : 'Permit needed'}</b>${r.note ? ' · ' + esc(r.note) : ''}</span>${can ? `<button class="btn sm" id="permit-flip" data-required="${off ? '1' : '0'}" title="${off ? 'Open the permit ask and the paperwork checklist on this file' : 'Close the permit ask, waive the NOC and permit-signature asks, stop the reminders — on this file only'}">${off ? 'A permit after all' : 'No permit needed'}</button>` : ''}</div>`;
}
function propertyCard(p, customer, filled = [], counter = null, deed = null, permitRule = null) {
  const addr = [customer?.street, customer?.city, customer?.zip].filter(Boolean).join(', ');
  if (!p) return `<div class="card">${permitLine(permitRule)}<div class="head" style="margin-bottom:0"><div class="kicker">Property · owner of record</div><span style="display:flex;gap:4px"><button class="btn sm fill" id="parcel-look">Ask the county</button><button class="btn sm" id="noc-fill" title="The statutory Notice of Commencement from the customer's own name and address — parcel and legal left as blanks for the office">Fill the NOC</button></span></div><div class="next"><b>NEXT</b> Ask the county who owns ${esc(addr || 'this address')}. It runs by itself when the customer accepts; when the county does not match the address, the NOC still fills from the file (Fill the NOC) and goes to the customer.</div></div>`;
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
    : p.signer_match === 'mismatch' ? (deed?.status === 'received' ? 'The signer was not the owner of record; the warranty deed is in (Paperwork card). Check the name on it: on the deed, the NOC and the permit go in their name; not on it, the owner of record signs.' : deed ? `The signer is not the owner of record. The warranty deed was requested${deed.emailed_at ? ' by email ' + new Date(deed.emailed_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}${deed.nudges_sent ? ' · ' + deed.nudges_sent + ' text' + (deed.nudges_sent === 1 ? '' : 's') : ''}; the texts run until the picture lands. Nothing waits on it.` : 'The person who signed is not the owner of record. Press Request the deed: the customer is emailed for a picture of the warranty deed (you and the rep copied) and texted until it lands.')
    : p.signer_match === 'entity' ? (deed?.status === 'received' ? 'Owned by a company or trust; the deed is in (Paperwork card). Fill the NOC with the officer who signs for it.' : deed ? 'Owned by a company or trust. The deed and the signer\'s name and title were requested from the customer; the texts run until they land.' : 'The owner is a company or trust. Press Request the deed: the customer is asked for the deed and the name and title of who signs for it.')
    : !hasNoc ? 'Owner checks out. Fill the NOC (it fills itself when the customer accepts online; the rep gets it signed before a notary).'
    : 'NOC is filled. It is the rep\'s: signed by the owner before a notary and uploaded on the Paperwork card. Office: record it at the Clerk when it lands. It holds nothing.';
  return `<div class="card">
    <div class="head" style="margin-bottom:4px"><div class="kicker">Property · owner of record · ${esc(p.county)} County</div>${chip}</div>
    <div class="next ${p.signer_match === 'mismatch' || p.confidential ? 'bad' : hasNoc && p.signer_match === 'match' ? 'good' : ''}"><b>NEXT</b> ${esc(next)}</div>
    <div class="rows">
      <div class="r"><span><b>${esc((p.owner_names || []).join(' & ') || '—')}</b>${p.signer_name ? ' · signed by ' + esc(p.signer_name) : ''}</span></div>
      <div class="r"><span>Owner's mail: ${esc(mail || '—')}${mail && !sameMail ? ' <span class="red">· not the job address</span>' : ''}</span></div>
      <div class="r"><span>Parcel ${esc(p.parcel_id || '—')}${p.jurisdiction ? ' · ' + esc(p.jurisdiction) : ''}${p.subdivision ? ' · ' + esc(p.subdivision) : ''}</span></div>
      ${permitLine(permitRule)}
      ${counterLine(counter)}
      ${p.legal_description ? `<div class="r"><span class="small">${esc(p.legal_description)}</span></div>` : ''}
      ${p.deed_book ? `<div class="r"><span class="small dimmer">Last deed OR ${esc(p.deed_book)} / ${esc(p.deed_page || '')}${p.sale_date ? ' · ' + esc(new Date(p.sale_date + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })) : ''}</span></div>` : ''}
      ${p.confidential ? '<div class="r"><span class="red">Protected address — the county withholds the owner. Nothing from this record prints.</span></div>' : ''}
      <div class="r"><span class="small dimmer">${esc(p.source)}${p.as_of ? ' · county data as of ' + esc(new Date(p.as_of + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })) : ''} · looked up ${esc(when)}</span><span style="display:flex;gap:4px"><button class="btn sm" id="parcel-look">Look again</button><button class="btn sm fill" id="noc-fill" title="The Notice of Commencement, filled from this record and the contractor block">Fill the NOC</button>${(p.signer_match === 'mismatch' || p.signer_match === 'entity') && deed?.status !== 'received' ? `<button class="btn sm ${deed ? '' : 'ok'}" id="deed-send" title="Emails the customer for a picture of the warranty deed (a photo link; you and the rep copied) and texts them until it lands. 386.">${deed?.emailed_at ? 'Resend the deed request' : 'Request the deed'}</button>` : ''}</span></div>
      ${filled.length ? `<div class="kicker" style="margin-top:8px">Filled from the file</div>` + filled.map((f) => `<div class="r"><span>${esc(FORM_LABEL[f.form_key] || f.form_key)} · ${esc(f.method === 'acroform' ? 'county form' : 'statutory form')}${f.county ? ' · ' + esc(f.county) : ''} · ${esc(new Date(f.filled_at).toLocaleDateString([], { month: 'short', day: 'numeric' }))}${f.filled_by ? ' · ' + esc(firstName(f.filled_by)) : ''}${(f.blanks || []).length ? ' · <span class="dimmer">' + esc(String((f.blanks || []).length)) + ' blanks for the office</span>' : ''}</span><button class="btn sm" data-open-doc="${esc(f.id)}">Open</button></div>`).join('') : ''}
    </div>
  </div>`;
}
/* ── THE NOC IS THE CUSTOMER'S ERRAND (367, CONTRACT SIGNING AND AUTO WORKFLOW) ──
   Kevin, 16 Sep (final, 9:30 PM): the customer signs everything on the link
   and is locked in. The county's notary forms (the NOC, the hold harmless,
   the permit application where the town notarizes it) are filled from the
   file, emailed to the customer as the "you're in" note, and the REP goes
   back once as the notary — or the customer signs at any notary and sends a
   picture from the link. The machine texts them until the forms are back;
   PERMIT and material open when they are. This row says where that stands. */
function nocRow(a, h, hasFilled) {
  const day = (iso) => new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
  const open = a.state === 'OPEN';
  const upload = open ? `<button class="btn sm" data-settle="${esc(a.id)}" title="The recorded copy, or a photo the customer sent another way">Upload</button>` : '<span class="mono verify">on file</span>';
  let line = '', next = '', btn = '';
  if (!open) {
    line = h?.received_by === 'customer' ? ` · <span class="verify">photo from the customer · ${esc(day(h.received_at))}</span>` : a.proof?.waived ? ' · <span class="dimmer">not required: ' + esc(a.proof.waived) + '</span>' : '';
  } else if (!h) {
    /* 385 (Kevin, 17 Sep): the NOC is the rep's — out of the customer's process, off the link, a condition of nothing */
    next = hasFilled ? 'The rep\'s: get it signed by the owner before a notary and upload the stamped copy here. It holds nothing — the county wants it before the first inspection on jobs over $5,000.' : 'Fill the NOC (Property card); then it is the rep\'s to get signed before a notary and upload here.';
    btn = hasFilled ? `<button class="btn sm" id="noc-send" title="Optional, not the process: email the filled NOC to the customer with a photo link. The rep still owns it.">Email it to the customer</button>` : '';
  } else if (h.status === 'waiting') {
    const texts = h.nudges_sent ? `${h.nudges_sent} text${h.nudges_sent === 1 ? '' : 's'} sent` : 'no texts yet';
    const coming = h.next ? (h.next.channel === 'text' ? `next text ${h.next.in_days === 0 ? 'today' : 'in ' + h.next.in_days + ' d'}` : `${h.next.channel === 'push_rep' ? 'the rep' : 'the office'} is pushed ${h.next.in_days === 0 ? 'today' : 'in ' + h.next.in_days + ' d'}`) : 'the plan ran out — call them';
    line = ` · <span class="dimmer">${h.emailed_at ? 'emailed ' + esc(day(h.emailed_at)) : 'not emailed yet'} · ${esc(texts)} · ${h.switch_on ? esc(coming) : 'texts OFF (Office room)'}${h.page_opened_at ? ' · they opened the link' : ''}</span>`;
    next = 'The rep\'s: get it signed before a notary and upload the stamped copy here. It holds nothing.' + (h.emailed_at ? ` The customer also has it by email with a photo link (sent ${day(h.emailed_at)}).` : '');
    btn = `<button class="btn sm" data-copy-link="${esc(h.link)}">Copy the photo link</button><button class="btn sm ${h.emailed_at ? '' : 'ok'}" id="noc-send">${h.emailed_at ? 'Resend' : 'Email it'}</button>`;
  } else if (h.status === 'stopped') {
    line = ` · <span class="dimmer">texts stopped · ${esc(h.stop_reason || '')}</span>`;
    btn = `<button class="btn sm" data-copy-link="${esc(h.link)}">Copy the photo link</button>`;
  }
  return `<div class="ask ${open ? '' : 'done'}" style="grid-template-columns:auto 1fr auto"><span class="check ${open ? '' : 'done'}"></span><span>${esc(askLabel(a))}${line}${next ? `<div class="next" style="margin-top:4px"><b>NEXT</b> ${esc(next)}</div>` : ''}</span><span style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">${btn}${upload}</span></div>`;
}
/* 386: the warranty deed ask — the county lists a different owner than the signer; the customer sends a picture from the link */
function deedRow(a, h) {
  const day = (iso) => new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
  const open = a.state === 'OPEN';
  const upload = open ? `<button class="btn sm" data-settle="${esc(a.id)}" title="The deed from the county's records, or a picture the customer sent another way">Upload</button>` : '<span class="mono verify">on file</span>';
  let line = '', next = '', btn = '';
  if (!open) {
    line = h?.received_by === 'customer' ? ` · <span class="verify">picture from the customer · ${esc(day(h.received_at))}</span>` : a.proof?.waived ? ' · <span class="dimmer">not required: ' + esc(a.proof.waived) + '</span>' : '';
  } else if (!h) {
    next = 'Press Request the deed on the Property card: the customer is emailed a photo link and texted until the picture lands.';
  } else if (h.status === 'waiting') {
    const texts = h.nudges_sent ? `${h.nudges_sent} text${h.nudges_sent === 1 ? '' : 's'} sent` : 'no texts yet';
    const coming = h.next ? (h.next.channel === 'text' ? `next text ${h.next.in_days === 0 ? 'today' : 'in ' + h.next.in_days + ' d'}` : `${h.next.channel === 'push_rep' ? 'the rep' : 'the office'} is pushed ${h.next.in_days === 0 ? 'today' : 'in ' + h.next.in_days + ' d'}`) : 'the plan ran out — pull it from the records or call them';
    line = ` · <span class="dimmer">${h.emailed_at ? 'emailed ' + esc(day(h.emailed_at)) : 'not emailed (no address on the customer)'} · ${esc(texts)} · ${h.switch_on ? esc(coming) : 'texts OFF (Office room)'}${h.page_opened_at ? ' · they opened the link' : ''}</span>`;
    next = 'Waiting on a picture of the deed from the customer. It holds nothing. When it lands: check the name against the signer.';
    btn = `<button class="btn sm" data-copy-link="${esc(h.link)}">Copy the photo link</button>`;
  } else if (h.status === 'stopped') {
    line = ` · <span class="dimmer">texts stopped · ${esc(h.stop_reason || '')}</span>`;
    btn = `<button class="btn sm" data-copy-link="${esc(h.link)}">Copy the photo link</button>`;
  }
  return `<div class="ask ${open ? '' : 'done'}" style="grid-template-columns:auto 1fr auto"><span class="check ${open ? '' : 'done'}"></span><span>${esc(askLabel(a))}${line}${next ? `<div class="next" style="margin-top:4px"><b>NEXT</b> ${esc(next)}</div>` : ''}</span><span style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">${btn}${upload}</span></div>`;
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
/* ── 381 THE FIRST PIECE: the booking, and where the lead stands in Contractors Cloud ──
   Kevin, 17 Sep: every new lead starts here from Mon 21 Sep. The line under the name says
   when the estimate is and with whom; the chip says whether the machine has carried it into
   CC yet (the cc_mirror switch), and OFF it hands the office the fields in CC's order. */
function leadLine(job, appt, mirror) {
  const at = job.appt_starts_at || appt?.appt_starts_at;
  const parts = [];
  if (at) { const d = new Date(at); const future = d > new Date(); parts.push(`<span class="chip ${future ? 'st-gold' : ''}" title="The estimate appointment">ESTIMATE · ${esc(d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase())} · ${esc(d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))}${job.rep_name ? ' · ' + esc(firstName(job.rep_name).toUpperCase()) : ''}</span>`); }
  // 384: move or cancel the visit from here (the rep is buzzed, the file says it, CC follows its switch); an unbooked lead gets Book the time
  if (job.job_id && !job.contract_signed_at) parts.push(at ? '<button class="btn sm" id="appt-change" title="A new day or time: the rep\'s phone buzzes, the line goes on the file">Change the time</button><button class="btn sm" id="appt-cancel" title="The visit comes off the rep\'s day; the lead stays">Cancel the visit</button>' : '<button class="btn sm fill" id="appt-book" title="Book the estimate: the rep\'s phone buzzes the moment you do">Book the time</button>');
  if (mirror) {
    const s = mirror.status, k = mirror.kind || 'lead';
    const what = k === 'cancel' ? 'THE CANCELLATION' : k === 'reschedule' ? 'THE NEW TIME' : '';
    parts.push(s === 'sent' ? `<span class="chip st-green" title="Contractors Cloud project ${esc(mirror.cc_project_id || '')}">${what ? what + ' IS IN' : 'IN'} CONTRACTORS CLOUD ✓</span>`
      : s === 'by_hand' ? `<span class="chip st-green">${what ? what + ' TYPED INTO CC' : 'TYPED INTO CONTRACTORS CLOUD'} ✓</span>`
      : s === 'failed' ? `<span class="chip warn" title="${esc(mirror.error || '')}">CONTRACTORS CLOUD REFUSED ${what || 'IT'}</span>`
      : s === 'skipped' ? '<span class="chip">NOT FOR CONTRACTORS CLOUD</span>'
      : s === 'sending' ? '<span class="chip st-gold">GOING INTO CONTRACTORS CLOUD…</span>'
      : `<span class="chip warn" title="The machine carries it across when the cc_mirror switch is on; until then, paste it">${what ? what + ' ' : ''}NOT IN CONTRACTORS CLOUD YET</span>`);
    if (!['sent', 'by_hand', 'skipped', 'sending'].includes(s)) parts.push('<button class="btn sm" id="mirror-copy" title="The fields, in CC\'s order">Copy for CC</button><button class="btn sm" id="mirror-byhand" title="I typed it into Contractors Cloud myself">Typed into CC</button>');
    if (s === 'failed') parts.push('<button class="btn sm" id="mirror-again">Queue it again</button>');
  }
  return parts.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:6px" id="lead-line">${parts.join('')}</div>` : '';
}
function mirrorCopyText(m, customer, job) {
  const p = m?.payload || {};
  const when = (m?.kind === 'cancel' ? 'CANCEL it (retitle CANCELLED, the way the office does)' : '') + (p.appt_starts_at ? `${m?.kind === 'reschedule' ? 'MOVE to ' : ''}${p.appt_starts_at} to ${String(p.appt_ends_at || '').slice(11, 16)} (Eastern)` : (m?.kind === 'cancel' ? '' : 'no appointment yet'));
  return [`Account (person): ${p.name || customer?.name || ''}`, `Phone: ${p.phone || customer?.phone || ''}`, `Email: ${p.email || customer?.email || ''}`,
    `Address: ${[p.street, p.city, p.state || 'FL', p.zip].filter(Boolean).join(', ')}`, `Company: ${brandName(String(p.company_id || job.cc_company_id || ''))}`,
    `Lead source: ${p.lead_source || ''}`, `Primary rep: ${p.rep_name || job.rep_name || ''}`, 'Project: Lead · Residential-Own · Standard Event',
    `Sales Appointment: ${when}`, `Description: ${p.appt_description || p.title || job.title || ''}`].join('\n');
}

function fileNext(job, openAsks, estimates, parcel, customer, canTake, subLocks = []) {
  const ageMin = (iso) => iso ? Math.max(0, (Date.now() - new Date(iso).getTime()) / 60000) : null;
  if (customer?.disposition === 'lost') return { tone: '', text: `Not going with us${customer.disposition_at ? ' since ' + new Date(customer.disposition_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}. Nothing opens on this file; the office marks it lost in Contractors Cloud. Revive brings it back.` };
  if (parcel?.signer_match === 'mismatch') return { tone: 'bad', text: 'The person who signed is not the owner of record. Get the owner of record to sign before any paperwork moves.' };
  if (parcel?.confidential) return { tone: 'bad', text: 'Protected address: the county withholds the owner. Get the deed from the customer before the NOC prints.' };
  // 397: a lock the office has not typed, or a signed Oasis job with no sub locked — the next step shouts (gospel 3)
  const locks = (subLocks || []).filter((l) => l.status !== 'void');
  const waiting = locks.find((l) => l.status === 'locked');
  if (waiting) return { tone: 'bad', text: `Sub locked in: ${waiting.sub_name} · ${money(waiting.amount)}. ${firstName(waiting.office_name || 'The office')}: type it into Contractors Cloud — Copy for CC on the card, then Typed into CC.` };
  if (!locks.length && job.contract_signed_at && String(job.cc_company_id) === '1560' && !['field_complete', 'invoiced', 'paid'].includes(job.stage)) return { tone: 'bad', text: `Signed, no sub locked in. ${firstName(job.rep_name || 'Mike')}: who is doing the work and for how much? 🔒 Lock the sub, on the card below.` };
  if (openAsks.length) {
    const a = openAsks.slice().sort((x, y) => new Date(x.opened_at) - new Date(y.opened_at))[0];
    const m = ageMin(a.opened_at);
    return { tone: m != null && m > 4320 ? 'bad' : '', text: `Waiting on ${(a.assignee_name || 'nobody').split(' ')[0]} for ${thing(a)} · open ${m != null ? mins(m) : ''}${openAsks.length > 1 ? ` · ${openAsks.length - 1} more below` : ''}. Settle it in the Asks card.` };
  }
  const est = (estimates || [])[0];
  if (est && est.status === 'sent') return { tone: '', text: `Estimate #${est.serial_number} is out, waiting on the customer since ${new Date(est.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}. Text a nudge from the Cockpit.` };
  if (est && est.status === 'accepted' && !job.contract_signed_at) return { tone: 'good', text: `Estimate #${est.serial_number} accepted. Office: the contract and the permit run. The owner of record is ${parcel ? 'on the file' : 'being looked up'}.` };
  if (!job.job_id) return { tone: '', text: 'No job on this file yet. + New lead puts it on the board with a clock.' };
  // 381: a lead born here — booked (the rep knows), or still to be booked (a person has to)
  const at = job.appt_starts_at ? new Date(job.appt_starts_at) : null;
  if (!job.contract_signed_at && at && at > new Date()) return { tone: 'good', text: `Estimate booked ${at.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}${job.rep_name ? ' with ' + firstName(job.rep_name) : ''}. ${job.rep_name ? firstName(job.rep_name) + ' shows up early, in the collared shirt.' : 'No rep on it yet — pick one.'} The confirmation text follows its switch.` };
  if (!job.contract_signed_at && !at && !['sold_office', 'production', 'field_complete', 'invoiced', 'paid'].includes(job.stage)) return { tone: 'bad', text: `No appointment yet. Call ${firstName(customer?.name || job.customer_name || 'the customer')} and book the estimate; the rep's phone buzzes the moment you do.` };
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

/* Sam, 18 Sep ("I am struggling to easily find their email and phone number… I also can't easily figure out the address"):
   the number, the email and the address sit under the name, each a tap to call / write / map and a word to copy.
   "↗ new tab" opens this same file in its own browser tab, so two back-to-back calls are two tabs, the way she works in CC. */
const fmtPhone = (p) => { const d = String(p || '').replace(/\D/g, ''); return d.length === 11 && d[0] === '1' ? `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : String(p || ''); };
function contactLine(customer, ctx) {
  if (!customer) return '';
  const addr = [customer.street, [customer.city, customer.state].filter(Boolean).join(' '), customer.zip].filter(Boolean).join(', ');
  const u = new URL(location.href); u.searchParams.set('file', ctx.customerId); u.hash = '';
  const copy = (v, t) => `<button type="button" class="lnk" data-copy="${esc(v)}" title="Copy ${esc(t)}">copy</button>`;
  return `<div class="contactline">
    ${customer.phone ? `<span>📞 <a class="mono" href="tel:${esc(customer.phone)}">${esc(fmtPhone(customer.phone))}</a> ${copy(customer.phone, 'the number')}</span>` : '<span class="dimmer">no phone on the file</span>'}
    ${customer.email ? `<span>✉ <a href="mailto:${esc(customer.email)}">${esc(customer.email)}</a> ${copy(customer.email, 'the email')}</span>` : '<span class="dimmer">no email on the file</span>'}
    ${addr ? `<span>🏠 <a href="https://www.google.com/maps/search/${encodeURIComponent(addr)}" target="_blank" rel="noopener">${esc(addr)}</a> ${copy(addr, 'the address')}</span>` : '<span class="dimmer">no address on the file</span>'}
    <a class="lnk" href="${esc(u.pathname + u.search)}" target="_blank" rel="noopener" title="This file in its own browser tab — keep as many open as you like">↗ new tab</a>
  </div>`;
}

function bubble(i) {
  const c = colorFor(i.pid);
  const sty = `style="--c:${c.c};--cs:${c.cs}"`;
  if (i.kind === 'env') return `<div class="env" ${sty}>✉ ${esc(i.body)} · ${esc(when(i.at))}</div>`;
  if (i.kind === 'sys') return `<div class="msg sys">${esc(i.who)} ${esc(i.body)} · ${esc(when(i.at))}</div>`;
  if (i.kind === 'ev') return `<div class="ev ${esc(i.cls || '')}" ${sty}>${esc(i.body)} · ${esc(when(i.at))}</div>`;
  if (i.kind === 'in') return `<div class="msg in"><div class="who">${esc(i.who)} · ${esc(when(i.at))}</div>${esc(i.body)}${i.media ? `<div><img class="pthumb" src="${esc(i.media)}" data-full="${esc(i.media)}" alt="photo"></div>` : ''}</div>`;
  const p = i.pid === 'machine' ? { name: 'The machine', initials: 'AI' } : personOf(i.pid);
  const cls = i.kind === 'machine' ? 'machine' : i.kind === 'chat' ? 'chat' : 'out';
  return `<div class="msg ${cls}" ${sty}><div class="who"><i class="av">${esc(i.pid === 'machine' ? 'AI' : initialsOf(p || { name: i.who }))}</i>${esc(i.who)}${i.line ? ' · ' + esc(i.line) : ''} · ${esc(when(i.at))}${i.kind === 'chat' && i.pid && i.pid !== 'machine' && i.pid !== state.me?.id ? ` <button class="btn sm" data-reply-to="${esc(i.pid)}" title="Answer on this file: To fills in with their name" style="margin-left:6px;padding:0 7px;font-size:11px;line-height:18px">↩ Reply</button>` : ''}</div>${esc(i.body)}${i.photo ? photoThumb(i.photo) : ''}${i.rcpt ? receiptLine(i.rcpt) : ''}${i.media ? `<div><img class="pthumb" src="${esc(i.media)}" data-full="${esc(i.media)}" alt="photo"></div>` : ''}</div>`;
}

function askRow(a, me) {
  const mine = a.assignee_id === me?.id;
  const cls = a.lane === 'SUPER' ? 'st-orange' : a.lane === 'CHAT' ? 'st-green' : 'st-blue';
  const openMin = (Date.now() - new Date(a.opened_at)) / 6e4;
  return `<div class="ask" style="grid-template-columns:1fr auto;row-gap:6px"><span><i class="ai">${iconForAsk(a)}</i><span class="chip ${cls}">${esc(askLabel(a))}</span> <span class="mono ${openMin > 2880 ? 'red' : 'dimmer'}">${esc(mins(openMin))}</span><div style="margin-top:4px">${esc(a.note || '')}</div><div class="who">${esc(a.assignee_name || 'unassigned')} holds it · opened by ${esc(a.opened_by_name || '')}</div></span>${a.ask_type === 'MATERIAL' && a.state === 'OPEN' && me && me.id ? `<button class="btn sm" data-material-send="${esc(a.id)}" title="Emails the order to the supplier the calculator's products point at, the material order attached; Gio and the watchers copied. Wood waits for the permit.">Send to supplier</button> ` : ''}<button class="btn sm ${mine ? 'ok' : ''}" data-settle="${esc(a.id)}">Done</button></div>`;
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

/* ── 351: THE PHOTOS on the file ──────────────────────────────────────────
   One strip, newest first, grouped by day: our pictures (job_photos) and the
   CompanyCam ones the 028 mirror matched to this job. ＋ Photo is the camera on
   a phone and a picker on a laptop; the caption is said on the thread, so
   "@Luis posts set" pings Luis the same as any note. Tap = full size. */
function photosCard(photos) {
  const n = photos.length;
  const days = []; let last = null;
  for (const p of photos.slice(0, 60)) {
    const d = new Date(p.taken_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
    if (d !== last) { days.push({ d, list: [] }); last = d; }
    days[days.length - 1].list.push(p);
  }
  const cam = photos.some((p) => p.kind === 'companycam');
  return `<div class="card" id="photos-card">
    <div class="head" style="margin-bottom:4px"><div class="kicker">Photos · ${n}${n ? (cam ? ' · ours and CompanyCam' : '') : ''}</div>
      <div class="right"><label class="btn sm fill" for="photo-in" title="Take one on the phone, or pick one on the laptop">＋ Photo</label><input id="photo-in" type="file" accept="image/*" capture="environment" multiple hidden></div></div>
    ${n ? days.map((g) => `<div class="kicker" style="margin:8px 0 4px">${esc(g.d)}</div><div class="photo-grid">${g.list.map((p) => `<div class="pt"><img class="pthumb grid" src="${esc(photoSrc(p, true))}" data-full="${esc(photoSrc(p))}" title="${esc([p.by_name, p.crew ? 'crew ' + p.crew : '', p.caption].filter(Boolean).join(' · '))}" loading="lazy" alt="">${p.amount ? `<span class="pbadge">$${esc(Number(p.amount).toLocaleString([], { maximumFractionDigits: 0 }))}</span>` : ''}${p.kind === 'companycam' ? '<span class="pbadge cc">CC</span>' : ''}</div>`).join('')}</div>`).join('') : '<div class="empty">No photos on this file yet. The first one goes here, and on the thread.</div>'}
    ${n > 60 ? `<div class="small dimmer" style="margin-top:6px">${n - 60} more, older</div>` : ''}
  </div>`;
}
function photoThumb(p) {
  return `<div><img class="pthumb" src="${esc(photoSrc(p, true))}" data-full="${esc(photoSrc(p))}" title="${esc([p.by_name, p.caption].filter(Boolean).join(' · '))}" alt=""></div>`;
}
function lightbox(url, caption, photo, customer) {
  let box = $('#lightbox');
  if (!box) { box = document.createElement('div'); box.id = 'lightbox'; box.className = 'lightbox'; document.body.appendChild(box); }
  const canCrew = photo && photo.kind === 'ours' && ['manager', 'owner', 'admin'].includes(state.me?.role || '');
  box.innerHTML = `<img src="${esc(url)}" alt=""><div class="cap">${esc(caption)} <span class="dimmer">· tap to close · <a href="${esc(url)}" target="_blank" rel="noopener">open the original</a></span>${canCrew ? ' <button class="btn sm fill" id="lb-crew">→ Send to a crew</button>' : ''}</div>`;
  box.hidden = false;
  box.onclick = (e) => { if (e.target.id === 'lb-crew') { box.hidden = true; window.__nuggetFromPhoto && window.__nuggetFromPhoto(photo, customer); return; } if (e.target.tagName !== 'A') box.hidden = true; };
}

/* 352: the sheet after the shutter — the words, who it is for, which crew, how much.
   Kevin, 15 Sep night: "can we tag people on each photo… if [Mike] could tag the
   crew and the dollar amount in each photo… he uses the app to manage the entire
   thing." Everyone named gets the push; the crew and the dollars ride the row. */
function photoSheet(files, ctx, customer, again) {
  const me = state.me || {};
  const people = (state.people || []).filter((p) => p.id !== me.id && !['crew', 'customer'].includes(p.role)).slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const n = files.length;
  openModal({
    title: `${n} photo${n > 1 ? 's' : ''} on ${personName(customer?.name || 'the file')}`,
    submitLabel: n > 1 ? `Post ${n} photos` : 'Post it',
    body: `
      <div class="field"><label>Say it with the picture</label><textarea name="caption" rows="2" placeholder="Posts set, ready for panels · Base rock in, 4 inches"></textarea></div>
      <div class="field"><label>Tag people · they get the buzz and it lands in their You're up</label>
        <div class="tagrow">${people.map((p) => `<label class="tagchip"><input type="checkbox" name="tag" value="${esc(p.id)}"> ${esc(p.name)}</label>`).join('')}</div></div>
      <div class="two-up">
        <div class="field"><label>Crew</label><input name="crew" list="crews-list" placeholder="Oasis · Nick" autocomplete="off"><datalist id="crews-list"></datalist></div>
        <div class="field"><label>Dollar amount on this picture</label><input name="amount" type="number" min="0" step="1" inputmode="decimal" placeholder="3400"></div>
      </div>
      <label class="tagchip" style="margin-top:6px"><input type="checkbox" name="contract" id="ps-contract"> <b>This picture is the signed contract</b> → lock the sub</label>
      <div id="ps-sub" hidden style="margin-top:6px">
        <div class="two-up">
          <div class="field"><label>Who is doing the work</label><input name="sub" list="sub-list2" placeholder="Nick's Lawn" autocomplete="off"><datalist id="sub-list2"></datalist></div>
          <div class="field"><label>Their price</label><input name="subamt" type="number" min="0" step="1" inputmode="decimal" placeholder="3400"></div>
        </div>
        <div class="field"><label>Their cell <span class="dimmer">· type it once, they get the text from then on</span></label><input name="subphone" inputmode="tel" placeholder="(321) 555-0171"></div>
        <div class="small dimmer" id="ps-sub-note">They get the text with this picture and the price, and tap RECIBIDO. The office is tagged to type it into Contractors Cloud. Nothing to remember.</div>
      </div>
      <div class="small dimmer">The customer never sees this. It goes on the file's thread in your name.</div>`,
    onOpen: async () => {
      const f = $('#modal-form');
      if (f && f.contract) f.contract.onchange = () => { const box = $('#ps-sub'); if (box) box.hidden = !f.contract.checked; if (f.contract.checked) { if (!f.caption.value.trim()) f.caption.value = 'Signed contract'; if (!f.sub.value.trim() && f.crew.value.trim()) f.sub.value = f.crew.value.trim(); if (!f.subamt.value && f.amount.value) f.subamt.value = f.amount.value; f.sub.dispatchEvent(new Event('input', { bubbles: true })); } };
      const [crews, subs] = await Promise.all([loadCrews().catch(() => []), subOptions(ctx.customerId).catch(() => [])]);
      const dl = $('#crews-list'); if (dl) dl.innerHTML = crews.map((c) => `<option value="${esc(c)}">`).join('');
      const sl = $('#sub-list2'); if (sl) sl.innerHTML = subs.map((o) => `<option value="${esc(o.name)}">${o.texts ? 'texts them' : 'no phone yet'}</option>`).join('');
      if (f && f.sub) { const sync = () => { const o = subs.find((x) => x.name.toLowerCase() === f.sub.value.trim().toLowerCase()); f.subphone.disabled = !!o?.texts; f.subphone.placeholder = o?.texts ? `on file · …${o.last4 || ''}` : '(321) 555-0171'; f.__subs = subs; }; f.sub.addEventListener('input', sync); sync(); }
    },
    onSubmit: async (f) => {
      const o = { caption: f.caption.value.trim(), tagged: [...f.querySelectorAll('input[name="tag"]:checked')].map((x) => x.value), crew: f.crew.value.trim(), amount: f.amount.value };
      const lock = f.contract && f.contract.checked ? { name: f.sub.value.trim(), amount: f.subamt.value, phone: f.subphone.disabled ? null : f.subphone.value.trim() || null, personId: ((f.__subs || []).find((x) => x.name.toLowerCase() === f.sub.value.trim().toLowerCase()) || {}).person_id || null } : null;
      if (lock && (!lock.name || lock.amount === '')) throw new Error('Who is doing the work, and for how much — both boxes, or untick the contract.');
      if (isDemo()) { toast(lock ? `Demo — nothing is saved. On live: the picture on the file, ${lock.name} texted the price, Jess tagged to type it into CC.` : 'Demo — nothing is saved. On live this lands on the file and buzzes everyone you tagged.'); return; }
      toast(`Sending ${n} photo${n > 1 ? 's' : ''}…`);
      const rows = []; for (const file of files) rows.push(await postPhoto(ctx.customerId, file, o));
      // 397: the contract picture locks the sub — the text to the sub with this picture, the office tagged
      if (lock) {
        try {
          const r = await subLock(ctx.customerId, { ...lock, photoId: rows[0]?.id || null, text: true });
          toast(r?.texted ? `On the file · locked in · ${lock.name} texted · ${firstName(r.office || 'the office')} tagged` : `On the file · locked in · ${firstName(r?.office || 'the office')} tagged${r?.why_not_texted ? ' · not texted: ' + r.why_not_texted : ''}`);
        } catch (e) { toast('The picture landed; the lock did not: ' + e.message + ' — press Lock the sub on the card.', 'err'); }
      } else toast(`On the file${o.tagged.length ? ' — ' + o.tagged.length + ' tagged' : ''}`);
      again();
    },
  });
}
window.__lightbox = lightbox;

/* ── 397 THE SUB LOCKED IN — who is doing the work, for how much ───────────
   Kevin + Jess, 17 Sep, the Billdu handoff meeting. Mike gets the sub's number
   before he prices the job and kept it in a CompanyCam picture; once it signed
   he emailed Jess the Billdu link, the sub and the amount, and she typed it into
   Contractors Cloud. Now it is one input on the contract picture (or the button
   here): the line on the file tags the office seat (her phone, her email — the
   email Mike used to write), the sub is texted the picture and the price and
   taps RECIBIDO, and the office presses Typed into CC. Nobody remembers anything.
   Oasis has no work orders in CC (2 ever, none with a labor cost), so what Jess
   types is her own entry; the card hands her the fields. */
function subLockCard(locks, job, customer, me, photos = []) {
  const canLock = ['manager', 'owner', 'admin'].includes(me?.role || '') || (job.rep_id && job.rep_id === me?.id);
  // Kevin, in the meeting: "Mike already puts the contractor cost in when he uploads the contract" — the crew and the $ on the picture (352). One tap makes it the lock.
  const seen = new Set(locks.filter((l) => l.status !== 'void').map((l) => (l.sub_name + '|' + Math.round(Number(l.amount))).toLowerCase()));
  const fromPics = canLock ? photos.filter((p) => p.kind === 'ours' && p.crew && p.amount != null && !seen.has((p.crew + '|' + Math.round(Number(p.amount))).toLowerCase()))
    .filter((p, i, a) => a.findIndex((x) => x.crew === p.crew && Number(x.amount) === Number(p.amount)) === i).slice(0, 4) : [];
  const canMark = ['manager', 'owner', 'admin', 'office'].includes(me?.role || '');
  const live = locks.filter((l) => l.status !== 'void');
  const rows = live.map((l) => {
    const rc = [];
    if (l.person_id) {
      rc.push(`<span class="chip ${l.sms_status === 'sent' ? 'st-green' : 'st-gold'}" title="${esc(l.sms_sent_at ? 'texted ' + when(l.sms_sent_at) : 'queued — goes at 8 AM inside quiet hours')}">${l.sms_status === 'sent' ? 'TEXTED ✓' : 'TEXT QUEUED'}</span>`);
      rc.push(l.received_at ? `<span class="chip st-green" title="${esc(when(l.received_at))}">RECIBIDO · ${esc((l.received_by || l.sub_name).toUpperCase())}</span>` : l.seen_at ? '<span class="chip st-gold">OPENED</span>' : '<span class="chip" title="Not opened yet — call before a truck rolls">NOT OPENED</span>');
      if (l.answer) rc.push(`<span class="chip ${/^(y|s)/i.test(l.answer) ? 'st-green' : 'warn'}">SAID ${esc(String(l.answer).toUpperCase())}</span>`);
    } else rc.push('<span class="chip" title="Type their cell on the next lock and they get the text">NO PHONE · NOT TEXTED</span>');
    const cc = l.status === 'typed_into_cc'
      ? `<span class="chip st-green" title="${esc((l.cc_marked_by_name || '') + (l.cc_marked_at ? ' · ' + when(l.cc_marked_at) : ''))}">TYPED INTO CC ✓ ${esc(firstName(l.cc_marked_by_name || '').toUpperCase())}</span>`
      : `<span class="chip warn" title="Oasis has no work orders in CC — the office types the sub and the price on the project">NOT IN CONTRACTORS CLOUD YET · ${esc(mins(l.open_min))}</span>`;
    return `<div class="r" style="flex-wrap:wrap;gap:6px;align-items:center">
      <span><b>🔒 ${esc(l.sub_name)}</b> · <b>${money(l.amount)}</b>${l.note ? ' · ' + esc(l.note) : ''} <span class="dimmer">· ${esc(firstName(l.locked_by_name || ''))} · ${esc(when(l.locked_at))}</span></span>
      <span style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">${rc.join('')}${cc}
        ${l.status === 'locked' && canMark ? `<button class="btn sm" data-sub-copy="${esc(l.id)}" title="The fields for Contractors Cloud, in order">Copy for CC</button><button class="btn sm" data-sub-typed="${esc(l.id)}" title="I typed it into Contractors Cloud myself">Typed into CC</button>` : ''}
        ${(canLock || canMark) ? `<button class="btn sm" data-sub-void="${esc(l.id)}" title="Wrong sub or wrong price: void it and lock the right one">Void</button>` : ''}
      </span></div>`;
  }).join('');
  const w = live.find((l) => l.status === 'locked');
  const next = !live.length
    ? (job.contract_signed_at ? 'NEXT: lock the sub — who is doing the work and for how much. One line, and the sub and the office both know.' : 'Locks the sub to the price the moment the contract is posted: the sub is texted the picture and the price, the office is tagged to type it into Contractors Cloud.')
    : w ? `NEXT: ${esc(firstName(w.office_name || 'the office'))} types it into Contractors Cloud — Copy for CC has the fields, Typed into CC turns it green.` : 'Locked and typed. Nothing to remember.';
  return `<div class="card" id="sub-card" data-tour="sublock">
    <div class="head" style="margin-bottom:4px"><div class="kicker">Sub locked in · who is doing the work, for how much${live.length ? ' · ' + live.length : ''}</div>
      <div class="right">${canLock ? '<button class="btn sm fill" id="sub-lock" title="Who is doing the work and for how much — texts the sub, tags the office">🔒 Lock the sub</button>' : ''}</div></div>
    ${rows ? `<div class="rows">${rows}</div>` : ''}
    ${fromPics.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${fromPics.map((p) => `<button class="btn sm" data-sub-frompic="${esc(p.id)}" title="The crew and the dollars already on this picture become the lock">🔒 Lock ${esc(p.crew)} · ${money(p.amount)} from the picture</button>`).join('')}</div>` : ''}
    <div class="small ${(!live.length && job.contract_signed_at) || w ? 'red' : 'dimmer'}" style="margin-top:6px">${next}</div>
    ${live.length && (live[0].fin_sold_amount || job.fin_sold_amount) ? `<div class="small dimmer" style="margin-top:4px">Sold ${money(live[0].fin_sold_amount || job.fin_sold_amount)} · subs ${money(live.reduce((a, l) => a + Number(l.amount || 0), 0))} · left ${money(Number(live[0].fin_sold_amount || job.fin_sold_amount) - live.reduce((a, l) => a + Number(l.amount || 0), 0))} <span title="Sold from Contractors Cloud's copy; subs from the locks on this file">· source: the file</span></div>` : ''}
  </div>`;
}
/* the fields Jess types, in her order */
function subCopyText(l, customer, job) {
  if (!l) return '';
  return [`Project: ${l.cc_job_number || job.cc_job_number || ''} · ${customer?.name || l.customer_name || ''} (${brandName(String(l.cc_company_id || job.cc_company_id || ''))})`,
    'Expense · type: Subcontractor', `Vendor: ${l.sub_name}`, 'Amount: $' + Math.round(Number(l.amount)).toLocaleString(), l.note ? `Description: ${l.note}` : '',
    `Locked by ${l.locked_by_name || ''} on ${new Date(l.locked_at).toLocaleDateString()}${l.received_at ? ' · sub confirmed RECIBIDO' + (l.answer ? ', said ' + l.answer : '') : ''}`].filter(Boolean).join('\n');
}
/* Lock the sub without a new picture: the same three boxes; the newest picture on the file rides the text when the box is ticked */
async function subLockDialog(ctx, customer, job, again, preset = {}) {
  const opts = await subOptions(ctx.customerId).catch(() => []);
  const newest = (preset.photoId && (ctx.data.photos || []).find((p) => p.id === preset.photoId)) || (ctx.data.photos || []).find((p) => p.kind === 'ours');
  openModal({
    title: `Lock the sub on ${personName(customer?.name || 'the file')}`,
    submitLabel: '🔒 Lock it in',
    body: `
      <div class="two-up">
        <div class="field"><label>Who is doing the work</label><input name="sub" list="sub-list" placeholder="Nick's Lawn" autocomplete="off" required value="${esc(preset.name || '')}"><datalist id="sub-list">${opts.map((o) => `<option value="${esc(o.name)}">${o.texts ? 'texts them' : 'no phone yet'}</option>`).join('')}</datalist></div>
        <div class="field"><label>Their price</label><input name="amount" type="number" min="0" step="1" inputmode="decimal" placeholder="3400" required value="${esc(preset.amount ?? '')}"></div>
      </div>
      <div class="two-up">
        <div class="field"><label>Their cell <span class="dimmer">· type it once, they get the text from then on</span></label><input name="phone" inputmode="tel" placeholder="(321) 555-0171"></div>
        <div class="field"><label>A word (optional)</label><input name="note" placeholder="pavers + sod · back yard only"></div>
      </div>
      <label class="tagchip"><input type="checkbox" name="text" checked> Text them the lock: the price, and "do you take it at this price? yes or no"</label>
      ${newest ? `<label class="tagchip" style="margin-top:6px"><input type="checkbox" name="photo" checked> Send the newest picture on the file with it (${esc(newest.caption || 'the contract')}, ${esc(new Date(newest.taken_at).toLocaleDateString([], { month: 'short', day: 'numeric' }))})</label>` : ''}
      <div class="note">The line goes on the file in your name and tags the office to type it into Contractors Cloud. The customer never sees it.</div>`,
    onOpen: () => { const f = $('#modal-form'); if (!f) return; const sync = () => { const o = opts.find((x) => x.name.toLowerCase() === f.sub.value.trim().toLowerCase()); f.phone.disabled = !!o?.texts; f.phone.placeholder = o?.texts ? `on file · …${o.last4 || ''}` : '(321) 555-0171'; }; f.sub.addEventListener('input', sync); sync(); },
    onSubmit: async (f) => {
      const o = opts.find((x) => x.name.toLowerCase() === f.sub.value.trim().toLowerCase());
      if (isDemo()) { toast(`Demo — nothing is saved. On live: ${f.sub.value.trim()} texted the price, Jess tagged to type it into CC.`); return; }
      const r = await subLock(ctx.customerId, { name: f.sub.value.trim(), amount: f.amount.value, personId: o?.person_id || null, phone: f.phone.disabled ? null : f.phone.value.trim() || null, note: f.note.value.trim() || null, text: f.text.checked, photoId: (f.photo && f.photo.checked && newest) ? newest.id : (preset.photoId || null) });
      toast(r?.texted ? `Locked in · ${f.sub.value.trim()} texted · ${firstName(r.office || 'the office')} tagged` : `Locked in · ${firstName(r?.office || 'the office')} tagged${r?.why_not_texted ? ' · not texted: ' + r.why_not_texted : ''}`);
      await reload(true); again();
    },
  });
}

/* 354: under a note — who it reached (📱 phone buzzed · 🖥 waits in You're up) and ✓ who has opened it */
function receiptLine(rows) {
  return `<div class="rcpt">→ ${rows.map((r) => `<span class="${r.seen_at ? 'seen' : ''}" title="${esc(r.seen_at ? 'opened ' + when(r.seen_at) : (r.has_phone ? 'buzzed on the phone' : 'waits in their You\'re up — no phone signed in'))}">${esc(firstName(r.name))}${r.seen_at ? ' ✓' : r.has_phone ? ' 📱' : ' 🖥'}</span>`).join(' · ')}</div>`;
}

/* THE NEXT WORD lands in the box: the right line, filled in, highlighted, the cursor on it — one tap left */
async function applyNextWord(ctx, q, lines, box) {
  const nw = state.nextWord; if (!nw || nw.customerId !== ctx.customerId) return;
  state.nextWord = null;
  const c = q('#compose'); if (!c || c.disabled) { toast('The words are ready but this file cannot be texted from here (no approved line for this brand yet).', 'err'); return; }
  const body = await renderLine(nw.key, ctx.customerId, nw.extra || {}).catch(() => '');
  if (!body) { toast('No approved line for that yet — type it yourself.', 'err'); return; }
  c.value = body; c.classList.add('hot'); c.focus();
  box?.querySelectorAll('.line').forEach((x) => x.classList.toggle('on', x.dataset.body === (lines.find((l) => l.key === nw.key) || {}).body));
  c.scrollIntoView({ block: 'center', behavior: 'smooth' });
  toast(`${nw.why ? nw.why[0].toUpperCase() + nw.why.slice(1) + ' — the' : 'The'} words are in the box. Read them, press Send.`);
  setTimeout(() => c.classList.remove('hot'), 6000);
}
