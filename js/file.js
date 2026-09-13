// The customer file — the spine. One thread from the machine's first text to
// the final invoice, the asks with their clocks, the proof on the file, who
// touched it. Every seat writes on the same file; the database decides the
// lanes (090/091) and the line the text goes out on (306).
import { state, isDemo, personName, firstName, loadFile, textCustomer, cancelText, takeJob, handBack, assignJob, addDoc, adoptJob, postMessage, openAsk, ensureThread, seatName, linePreview, threadForJob, mentionSeen, invoiceRequest } from './book.js?v=13';
import { $, html, raw, esc, toast, openModal } from './ui.js?v=13';
import { STAGES, stageLabel, brandName, askLabel, ASK_LABEL } from './config.js?v=13';
import { settleDialog } from './office.js?v=13';
import { reload } from './app.js?v=13';
import { relTime } from './production.js?v=13';

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
  messages.forEach((m) => items.push({ at: m.created_at, kind: m.is_system ? 'sys' : 'chat', who: m.is_system ? '' : (m.author_name || '') + ' · team note', body: m.body, lane: m.lane }));
  items.sort((a, b) => new Date(a.at) - new Date(b.at));

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
        ${unfiled ? raw(`<div class="adopt" style="margin-top:10px;padding:10px 12px;border:1px dashed var(--gold);border-radius:10px;background:var(--paper2, transparent)"><div class="kicker" style="color:var(--gold)">Still run in Contractors Cloud · where is it right now?</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${ADOPT.map(([k, l]) => `<button class="btn sm" data-adopt="${k}">${esc(l)}</button>`).join('')}</div><div class="small dimmer" style="margin-top:6px">One tap opens exactly that ask on the right seat, clock starting today. Nothing else opens.</div></div>`) : ''}
        ${optOut ? raw('<div class="red small" style="margin-top:6px">This customer said STOP — no texts go out.</div>') : ''}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${customer?.phone ? raw(`<a class="btn" href="tel:${esc(customer.phone)}">Call</a>`) : ''}
        ${customer?.email ? raw(`<a class="btn" href="mailto:${esc(customer.email)}">Email</a>`) : ''}
        <button class="btn" id="file-text" title="Text the customer from the main line">Text</button>
        <button class="btn" id="file-tag" title="Note to the team · tag the next person">Tag</button>
        ${job.job_id ? raw('<button class="btn" id="file-doc" title="Put a document on the file">+ Document</button>') : ''}
        ${staff && job.job_id ? raw('<button class="btn" id="file-send" title="Hand this file to a seat">Send to…</button>') : ''}
        ${staff && job.job_id ? raw('<button class="btn" id="file-invoice" title="Queue this job\'s invoice for QuickBooks">Invoice</button>') : ''}
        ${staff && customer && !optOut ? raw('<button class="btn" id="file-collect" title="Text the customer the payment link">Collect</button>') : ''}
        ${canTake ? raw('<button class="btn fill" id="file-take">Take the job</button>') : ''}
        ${isSup && job.stage === 'production' ? raw('<button class="btn" id="file-back-job">Hand it back</button>') : ''}
      </div>
    </div>

    <div class="grid-file">
      <div class="card">
        <div class="head" style="margin-bottom:4px"><div class="kicker" style="font-size:11px;color:var(--gold)">The customer's line · ${line ? esc(line.label + ' ' + line.line_e164) : 'no main line yet'} to ${esc(customer?.phone || 'no phone on file')}</div><span class="chip">TEXTS · EMAILS · THE FILE</span></div>
        <div class="thread" id="thread">
          ${items.length ? raw(items.map(bubble).join('')) : raw('<div class="empty">Nothing on the line yet. The first text from here starts the thread.</div>')}
        </div>
        <div class="subs" style="margin-top:6px"><span class="kicker">Lines</span><select id="lines" style="width:auto;padding:5px 8px;font-size:12px"><option value="">Pick a pre-written text…</option></select></div>
        <div class="composer">
          <textarea id="compose" placeholder="${optOut ? 'Customer said STOP' : `Text ${esc(firstName(name))} as ${esc(firstName(me?.name || ''))}, from ${esc(line?.label || 'the main line')}…`}" ${optOut ? 'disabled' : ''}></textarea>
          <button class="btn fill" id="send" ${optOut || !customer?.phone ? 'disabled' : ''}>Send</button>
        </div>
        <div class="small">Sent from the file on the brand's main line, credited to you. Six seconds to undo. A line fills in with this customer's name and brand; edit it before you send.</div>
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

  if (q('#file-back')) q('#file-back').onclick = (e) => { e.preventDefault(); window.__go(['manager'].includes(me?.role) ? 'production' : ['office'].includes(me?.role) ? 'office' : 'home'); };
  if (q('#drawer-close')) q('#drawer-close').onclick = closeDrawer;
  if (q('#drawer-full')) q('#drawer-full').onclick = () => { closeDrawer(); window.__go('file', ctx.customerId); };
  const th = q('#thread'); th.scrollTop = th.scrollHeight;
  q('#send').onclick = () => send(ctx, q, compact);
  q('#compose').addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send(ctx, q, compact); });
  linePreview(ctx.customerId).then((lines) => {
    const sel = q('#lines'); if (!sel) return;
    lines.forEach((l) => { const o = document.createElement('option'); o.value = l.key; o.textContent = l.label; o.dataset.body = l.body; sel.appendChild(o); });
    sel.onchange = () => { const o = sel.selectedOptions[0]; if (o?.dataset.body) { q('#compose').value = o.dataset.body; q('#compose').focus(); } };
  }).catch(() => {});
  root.querySelectorAll('[data-settle]').forEach((b) => (b.onclick = () => { const a = asks.find((x) => x.id === b.dataset.settle); if (a) settleDialog(withQueueShape(a, job), () => (compact ? openFileDrawer(ctx.customerId) : openFile(ctx.customerId))); }));
  if (q('#file-take')) q('#file-take').onclick = async () => { try { await takeJob(job.job_id); toast(`You have ${name}.`); await reload(true); (compact ? openFileDrawer(ctx.customerId) : openFile(ctx.customerId)); } catch (e) { toast(e.message, 'err'); } };
  if (q('#file-back-job')) q('#file-back-job').onclick = () => openModal({ title: `Hand ${name} back`, submitLabel: 'Hand it back', body: '<div class="field"><label>Why</label><textarea name="note" required></textarea></div>', onSubmit: async (f) => { await handBack(job.job_id, f.note.value.trim()); toast('Handed back'); await reload(true); (compact ? openFileDrawer(ctx.customerId) : openFile(ctx.customerId)); } });
  if (q('#new-ask')) q('#new-ask').onclick = () => newAsk(thread, job, ctx, compact);
  const again = () => (compact ? openFileDrawer(ctx.customerId) : openFile(ctx.customerId));
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
