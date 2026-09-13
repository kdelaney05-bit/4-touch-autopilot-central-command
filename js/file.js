// The customer file — the spine. One thread from the machine's first text to
// the final invoice, the asks with their clocks, the proof on the file, who
// touched it. Every seat writes on the same file; the database decides the
// lanes (090/091) and the line the text goes out on (306).
import { state, isDemo, personName, firstName, loadFile, textCustomer, cancelText, takeJob, handBack, postMessage, openAsk, ensureThread, seatName, linePreview } from './book.js?v=5';
import { $, html, raw, esc, toast, openModal } from './ui.js?v=5';
import { STAGES, stageLabel, brandName, askLabel, ASK_LABEL } from './config.js?v=5';
import { settleDialog } from './office.js?v=5';
import { reload } from './app.js?v=5';
import { relTime } from './production.js?v=5';

let current = null;    // { customerId, data }
const money = (n) => n == null ? '' : '$' + Math.round(Number(n)).toLocaleString();
const mins = (m) => m == null ? '' : m >= 1440 ? (m / 1440).toFixed(1) + ' d' : m >= 60 ? (m / 60).toFixed(1) + ' h' : Math.round(m) + ' min';
const when = (iso) => { const d = new Date(iso); const today = new Date().toDateString() === d.toDateString(); return (today ? 'today' : d.toLocaleDateString([], { month: 'short', day: 'numeric' })) + ' · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
const chev = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"></path></svg>';

export function renderFiles(root) {
  const B = state.board.filter((b) => !b.stale).sort((a, b) => new Date(b.last_inbound_at || 0) - new Date(a.last_inbound_at || 0)).slice(0, 40);
  root.innerHTML = html`
    <div class="head"><div><div class="kicker">Files · every customer the seat can read</div><h1 class="serif">Find a customer above, or pick one who texted last.</h1></div></div>
    <div class="card"><div class="wrap"><table><thead><tr><th>Customer</th><th>Brand</th><th>Stage</th><th>Who holds it</th><th>Last customer text</th></tr></thead><tbody>
      ${raw(B.map((b) => `<tr class="link" onclick="__go('file','${esc(b.customer_id)}')"><td><b>${esc(personName(b.customer_name))}</b> · ${esc(b.title || '')}</td><td><span class="chip">${esc(brandName(b.cc_company_id))}</span></td><td><span class="chip ${STAGES[b.stage]?.cls || 'st-ink'}">${esc(stageLabel(b.stage))}</span></td><td>${esc(b.owner_name || 'nobody')}</td><td>${b.last_inbound_body ? '"' + esc(String(b.last_inbound_body).slice(0, 70)) + '" · ' + esc(relTime(b.last_inbound_at)) : '<span class="dimmer">—</span>'}</td></tr>`).join(''))}
    </tbody></table></div></div>`;
}

export async function openFile(customerId) {
  const root = $('#view-file');
  root.innerHTML = '<div class="empty">Opening the file…</div>';
  const data = await loadFile(customerId);
  current = { customerId, data };
  draw(root);
}

function draw(root) {
  const { job, customer, texts, emails, thread, messages, asks, attachments, handoffs, outbox } = current.data;
  const me = state.me;
  const name = personName(customer?.name || job.customer_name);
  const st = STAGES[job.stage] || {};
  const isSup = job.supervisor_id && job.supervisor_id === me?.id;
  const canTake = ['manager', 'office', 'admin', 'owner'].includes(me?.role) && job.job_id && job.stage === 'sold_office';
  const openAsks = asks.filter((a) => a.state === 'OPEN');
  const doneAsks = asks.filter((a) => a.state !== 'OPEN').slice(-6);
  const paperwork = asks.filter((a) => a.ask_type === 'CONTRACT_DOC');
  const line = state.lines.find((l) => l.cc_company_id === (job.cc_company_id || '1461')) || state.lines[0];
  const optOut = customer?.sms_opt_out_at || job.sms_opt_out_at;

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

  // the thread: texts + emails + system lines, in time order
  const items = [];
  texts.forEach((t) => items.push({ at: t.occurred_at, kind: t.direction === 'inbound' ? 'in' : (t.feed_source === 'machine' || /Reply STOP/.test(t.body || '')) ? 'machine' : 'out', who: t.direction === 'inbound' ? name : senderOf(t), body: t.body || (t.has_media ? '(photo)' : ''), media: t.media_url }));
  outbox.filter((o) => o.status !== 'cancelled' && !texts.some((t) => t.direction === 'outbound' && t.body === o.body)).forEach((o) => items.push({ at: o.sent_at || o.queued_at, kind: 'out', who: (seatName(o.rep_id) || 'you') + (o.status === 'sent' ? '' : ' · ' + o.status), body: o.body }));
  emails.forEach((e) => items.push({ at: e.occurred_at, kind: 'env', body: `${e.subject || 'Email'} · ${e.source === 'machine' ? 'the machine' : 'the rep'} · ${e.status}${e.opened ? ' · opened' : ''}` }));
  messages.forEach((m) => items.push({ at: m.created_at, kind: m.is_system ? 'sys' : 'chat', who: m.author_name || '', body: (m.is_system ? '' : `[${m.lane}] `) + m.body, lane: m.lane }));
  items.sort((a, b) => new Date(a.at) - new Date(b.at));

  root.innerHTML = html`
    <div class="head" style="margin-bottom:10px">
      <div class="small"><a href="#" id="file-back">← back</a></div>
      <div class="right">${isDemo() ? raw('<span class="chip demo">DEMO</span>') : ''}</div>
    </div>
    <div class="card" style="flex-direction:row;align-items:center;gap:18px;flex-wrap:wrap">
      <div style="flex-grow:1;min-width:0">
        <div class="kicker">The customer file · one file, every room writes on it</div>
        <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-top:4px"><h1 class="serif" style="margin:0">${name}</h1><span class="dim">${esc(job.title || '')}${job.fin_sold_amount ? ' · <span class="mono">' + esc(money(job.fin_sold_amount)) + '</span>' : ''}${job.contract_signed_at ? ' signed ' + esc(new Date(job.contract_signed_at).toLocaleDateString([], { month: 'short', day: 'numeric' })) : ''}${job.rep_name ? ' by ' + esc(firstName(job.rep_name)) : ''} · ${esc(brandName(job.cc_company_id))}</span></div>
        <div class="stagebar" style="margin-top:8px">${raw(steps.join(chev))}</div>
        ${optOut ? raw('<div class="red small" style="margin-top:6px">This customer said STOP — no texts go out.</div>') : ''}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${customer?.phone ? raw(`<a class="btn" href="tel:${esc(customer.phone)}">Call</a>`) : ''}
        ${customer?.email ? raw(`<a class="btn" href="mailto:${esc(customer.email)}">Email</a>`) : ''}
        ${canTake ? raw('<button class="btn fill" id="file-take">Take the job</button>') : ''}
        ${isSup && job.stage === 'production' ? raw('<button class="btn" id="file-back-job">Hand it back</button>') : ''}
      </div>
    </div>

    <div class="grid-file">
      <div class="card">
        <div class="head" style="margin-bottom:4px"><div class="kicker">The line · ${line ? esc(line.label + ' ' + line.line_e164) : 'no main line yet'} to ${esc(customer?.phone || 'no phone on file')}</div><span class="chip">TEXTS · EMAILS · THE FILE</span></div>
        <div class="thread" id="thread">
          ${items.length ? raw(items.map(bubble).join('')) : raw('<div class="empty">Nothing on the line yet. The first text from here starts the thread.</div>')}
        </div>
        <div class="subs" style="margin-top:6px"><span class="kicker">Lines</span><select id="lines" style="width:auto;padding:5px 8px;font-size:12px"><option value="">Pick a pre-written text…</option></select></div>
        <div class="composer">
          <textarea id="compose" placeholder="${optOut ? 'Customer said STOP' : `Text ${esc(firstName(name))} as ${esc(firstName(me?.name || ''))}, from ${esc(line?.label || 'the main line')}…`}" ${optOut ? 'disabled' : ''}></textarea>
          <button class="btn fill" id="send" ${optOut || !customer?.phone ? 'disabled' : ''}>Send</button>
        </div>
        <div class="small">Sent from the file on the brand's main line, credited to you. Six seconds to undo. A line fills in with this customer's name and brand; edit it before you send.</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="card">
          <div class="head" style="margin-bottom:0"><div class="kicker">Asks on this file · the clock is the point</div>${thread ? raw('<button class="btn sm" id="new-ask">+ Ask</button>') : ''}</div>
          ${openAsks.length ? raw(openAsks.map((a) => askRow(a, me)).join('')) : raw('<div class="small">No open asks.</div>')}
          ${doneAsks.length ? raw('<div class="kicker" style="margin-top:8px">Settled</div>' + doneAsks.map((a) => `<div class="ask done" style="grid-template-columns:auto 1fr auto"><span class="check done"></span><span>${esc(askLabel(a))} · ${esc(a.assignee_name || '')}${a.proof?.value ? ' · ' + esc(a.proof.value) : ''}${a.proof?.waived ? ' · waived: ' + esc(a.proof.waived) : ''}</span><span class="mono">${esc(mins(a.minutes_to_close))}</span></div>`).join('')) : ''}
        </div>
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

  $('#file-back').onclick = (e) => { e.preventDefault(); history.back(); window.__go(['manager'].includes(me?.role) ? 'production' : ['office'].includes(me?.role) ? 'office' : 'home'); };
  const th = $('#thread'); th.scrollTop = th.scrollHeight;
  $('#send').onclick = send;
  $('#compose').addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send(); });
  linePreview(current.customerId).then((lines) => {
    const sel = $('#lines'); if (!sel) return;
    lines.forEach((l) => { const o = document.createElement('option'); o.value = l.key; o.textContent = l.label; o.dataset.body = l.body; sel.appendChild(o); });
    sel.onchange = () => { const o = sel.selectedOptions[0]; if (o?.dataset.body) { $('#compose').value = o.dataset.body; $('#compose').focus(); } };
  }).catch(() => {});
  root.querySelectorAll('[data-settle]').forEach((b) => (b.onclick = () => { const a = asks.find((x) => x.id === b.dataset.settle); if (a) settleDialog(withQueueShape(a, job), () => openFile(current.customerId)); }));
  if ($('#file-take')) $('#file-take').onclick = async () => { try { await takeJob(job.job_id); toast(`You have ${name}.`); await reload(true); openFile(current.customerId); } catch (e) { toast(e.message, 'err'); } };
  if ($('#file-back-job')) $('#file-back-job').onclick = () => openModal({ title: `Hand ${name} back`, submitLabel: 'Hand it back', body: '<div class="field"><label>Why</label><textarea name="note" required></textarea></div>', onSubmit: async (f) => { await handBack(job.job_id, f.note.value.trim()); toast('Handed back'); await reload(true); openFile(current.customerId); } });
  if ($('#new-ask')) $('#new-ask').onclick = () => newAsk(thread, job);
}

function senderOf(t) {
  const ext = t.uvoice_ext;
  const m = state.seats.find((s) => false); // seats have no ext here; the name comes from the channel map on the phone
  if (t.feed_source === 'cloudmessage') return 'the file';
  if (ext >= 150 && ext <= 157) return 'the rep · ext ' + ext;
  if (ext >= 100 && ext <= 102) return 'the office · ext ' + ext;
  return 'Liberty';
}

function bubble(i) {
  if (i.kind === 'env') return `<div class="env">✉ ${esc(i.body)} · ${esc(when(i.at))}</div>`;
  if (i.kind === 'sys') return `<div class="msg sys">${esc(i.who)} ${esc(i.body)} · ${esc(when(i.at))}</div>`;
  const cls = i.kind === 'in' ? 'in' : i.kind === 'machine' ? 'machine' : i.kind === 'chat' ? 'chat' : 'out';
  return `<div class="msg ${cls}"><div class="who">${esc(i.who)} · ${esc(when(i.at))}</div>${esc(i.body)}${i.media ? `<div><a href="${esc(i.media)}" target="_blank" rel="noopener">photo</a></div>` : ''}</div>`;
}

function askRow(a, me) {
  const mine = a.assignee_id === me?.id;
  const cls = a.lane === 'SUPER' ? 'st-orange' : a.lane === 'CHAT' ? 'st-green' : 'st-blue';
  const openMin = (Date.now() - new Date(a.opened_at)) / 6e4;
  return `<div class="ask" style="grid-template-columns:1fr auto;row-gap:6px"><span><span class="chip ${cls}">${esc(askLabel(a))}</span> <span class="mono ${openMin > 2880 ? 'red' : 'dimmer'}">${esc(mins(openMin))}</span><div style="margin-top:4px">${esc(a.note || '')}</div><div class="who">${esc(a.assignee_name || 'unassigned')} holds it · opened by ${esc(a.opened_by_name || '')}</div></span><button class="btn sm ${mine ? 'ok' : ''}" data-settle="${esc(a.id)}">Done</button></div>`;
}

function withQueueShape(a, job) {
  const rule = { PERMIT: ['number', 'Permit number (attach the permit if you have it)', 1, false], SURVEY: ['text', 'Locate ticket number, or why none is needed', 1, true], SCHEDULE: ['date', 'Start date — and the crew, in the note', 1, false], MATERIAL: ['text', 'PO / order confirmation number', 1, false], COMPLETION_SIGNOFF: ['photos', 'Finished-work photos (3 or more)', 3, false], INVOICE: ['number', 'Billdu / QuickBooks invoice number', 1, false], PAYMENT: ['text', 'How it was paid (QuickBooks record)', 1, false], CHANGE_ORDER: ['file', 'The signed change order', 1, false], SAFETY_JHA: ['photos', 'The JHA photo', 1, false], CONTRACT_DOC: ['file', 'The document', 1, true] }[a.ask_type] || ['tap', 'Tap to close', 1, false];
  return { ...a, ask_id: a.id, customer_name: job.customer_name, cc_company_id: job.cc_company_id, cc_project_id: job.cc_project_id, proof_kind: rule[0], proof_label: rule[1], proof_min: rule[2], waivable: rule[3] };
}

async function send() {
  const box = $('#compose'); const body = box.value.trim();
  if (!body) return;
  $('#send').disabled = true;
  try {
    const r = await textCustomer(current.customerId, body);
    box.value = '';
    const root = $('#toast-root');
    root.innerHTML = `<div class="toast">Sent from ${esc(r.from || 'the main line')} · <button id="undo">Undo</button></div>`;
    let undone = false;
    $('#undo').onclick = async () => { undone = true; try { await cancelText(r.id); root.innerHTML = '<div class="toast">Not sent</div>'; setTimeout(() => (root.innerHTML = ''), 2000); } catch (e) { toast(e.message, 'err'); } };
    setTimeout(async () => { if (!undone) { root.innerHTML = ''; openFile(current.customerId); } }, 6500);
  } catch (e) { toast(e.message, 'err'); }
  finally { $('#send').disabled = false; }
}

function newAsk(thread, job) {
  const lanes = ['OFFICE', 'SUPER', 'CHAT'];
  const types = Object.keys(ASK_LABEL);
  const seats = state.seats;
  openModal({ title: 'Open an ask on this file', submitLabel: 'Open it', body: `
    <div class="field"><label>Lane</label><select name="lane">${lanes.map((l) => `<option>${l}</option>`).join('')}</select></div>
    <div class="field"><label>What</label><select name="type">${types.map((t) => `<option value="${t}">${esc(ASK_LABEL[t])}</option>`).join('')}</select></div>
    <div class="field"><label>Who</label><select name="to">${seats.map((s) => `<option value="${esc(s.id)}" ${s.id === state.me?.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
    <div class="field"><label>Note</label><input name="note" placeholder="what they need to do"/></div>`,
    onSubmit: async (f) => { await openAsk(thread.id, f.lane.value, f.type.value, f.note.value.trim() || null, f.to.value); toast('Opened'); await reload(true); openFile(current.customerId); } });
}
