// THE INVOICE (381 · docs/THE-INVOICE.md) — the customer's invoice on the file,
// from the sign-off to the money. Kevin, 17 Sep 2026: "is it going to be auto
// created when the guy says it's complete? So we remove that piece completely
// and then it's just going to send the invoice to the text number and the email
// and then we'll just politely bug them there. And if they don't within a few
// hours, we'll call them on the invoice."
//
// One read, invoice_state(job): what the file says (the build), the invoice's
// row and its diary, the next reminder, the open call card, the plan, the
// switches. The card is that read, drawn. Six states:
//
//   HELD     red · the build is not clean (photos short, a change order unsigned,
//            no sign-off, no signed amount). The seat fixes the file, or Approves
//            anyway with a reason, or Holds and tags the supervisor.
//   READY    green · clean. invoice_auto ON: the machine builds it on the next
//            sweep, nothing to press (Hold stops it). OFF: Approve, as before.
//   QUEUED   recorded, waiting on the QuickBooks pass (15 min). Hold pulls it back.
//   SENT     in QuickBooks, emailed and texted with the pay link; the reminders
//            run; a call card lands on the seat when the plan says call.
//   PAID     the balance hit 0 (the worker saw it) or a seat pressed Paid.
//   FAILED   QuickBooks refused it: the reason, Approve again.
//
// The math is on the card in full — the contract, the signed change orders, the
// deposit as a minus — because "we got to make sure it's right" (gospel 2).
// Every move sits in the diary with who and when (gospel 5). Nothing to learn;
// the card says what is happening and what, if anything, to press (gospel 33).
import { state, isDemo, firstName, personName, seatName, mentionHandle, invoiceApprove, invoiceHold, invoicePaidByHand, invoiceNudgesSet, textCustomer, openBillPdf } from './book.js?v=135';
import { esc, toast, openModal } from './ui.js?v=135';
import { brandName } from './config.js?v=135';

const ESTIMATE_VIEW = 'https://lzegjjbkfuecrhdvlvay.supabase.co/functions/v1/estimate-view/';
const fmt = (n) => (n == null || n === '' ? '—' : (Number(n) < 0 ? '−' : '') + '$' + Math.abs(Number(n)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const day = (v) => { if (!v) return '—'; const d = new Date(String(v).length <= 10 ? v + 'T12:00:00' : v); return isNaN(d) ? '—' : d.toLocaleDateString([], { month: 'short', day: 'numeric' }); };
const at = (v) => { if (!v) return ''; const d = new Date(v); return isNaN(d) ? '' : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
const clock = (iso) => { if (!iso) return ''; const m = Math.max(0, (Date.now() - new Date(iso)) / 6e4); return m >= 1440 ? (m / 1440).toFixed(1) + ' d' : m >= 60 ? (m / 60).toFixed(1) + ' h' : Math.round(m) + ' min'; };
const hoursWord = (h) => { h = Number(h); if (!Number.isFinite(h)) return ''; const a = Math.abs(h); return a < 1 ? Math.round(a * 60) + ' min' : a < 48 ? (Math.round(a * 10) / 10) + ' h' : (Math.round(a / 24 * 10) / 10) + ' d'; };
const planWord = (h) => (Number(h) < 24 ? '+' + Number(h) + ' h' : '+' + Math.round(Number(h) / 24) + ' d');
const num = (v) => { if (v == null || v === '') return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
const staffSeat = () => ['manager', 'office', 'admin', 'owner'].includes(state.me?.role);
const CHANNEL = { text: 'a reminder text', email: 'a reminder email', call: 'a call card', push_office: 'a nudge to the office' };
const KIND = { built: 'built by the machine', queued: 'approved', held: 'held', in_qb: 'in QuickBooks', emailed: 'emailed', texted: 'texted', nudge_text: 'reminder text', nudge_email: 'reminder email', call_opened: 'call card', nudge_push: 'nudge', paid: 'paid', stopped: 'reminders stopped', resumed: 'reminders on', failed: 'refused', nag: 'held, the seat told', cancelled: 'pulled back' };

/* ── the model: invoice_state, read for the screen ────────────────────────── */
export function invoiceModel(ctx) {
  const S = ctx.data.invoiceState; const { job, customer } = ctx.data;
  if (!S || !S.build || !job?.job_id) return null;
  const b = S.build, q = S.row || null, stage = job.stage;
  const show = !!q || !!b.ask_id || stage === 'field_complete' || stage === 'invoiced' || !!b.signoff_at;
  if (!show) return null;
  if (stage === 'paid' && !q) return null;
  const problems = Array.isArray(b.problems) ? b.problems : [];
  const status = q ? q.status : (b.ok ? 'ready' : 'held');
  const sw = S.switches || {};
  const name = personName(customer?.name || job.customer_name || b.customer?.name || 'the customer');
  const seat = b.ask_assignee || seatName(b.seat) || 'the office';
  const supervisor = job.supervisor_id ? (state.seats.find((s) => s.id === job.supervisor_id) || state.people.find((p) => p.id === job.supervisor_id) || null) : null;
  const rep = job.rep_id ? (state.people.find((p) => p.id === job.rep_id) || null) : null;
  const accepted = (ctx.data.estimates || []).filter((e) => e.status === 'accepted' && (e.kind || 'estimate') === 'estimate').sort((x, y) => new Date(y.accepted_at || 0) - new Date(x.accepted_at || 0))[0] || null;
  const estUrl = accepted?.link_id ? (ctx.data.estLinks || []).find((l) => l.id === accepted.link_id)?.token : null;
  const lines = (q?.lines && q.lines.length ? q.lines : b.lines) || [];
  const amount = q ? num(q.amount) : num(b.amount);
  const held = (S.log || []).filter((l) => l.kind === 'held').slice(-1)[0] || null;
  return { S, b, q, status, problems, name, seat, supervisor, rep, estUrl, lines, amount, auto: !!sw.invoice_auto, qbOn: !!sw.qb_invoices, textsOn: !!sw.office_machine_texts, next: S.next || null, call: S.call || null, log: S.log || [], plan: S.plan || [], held };
}

function chipFor(m) {
  const { q, status, problems, seat } = m;
  switch (status) {
    case 'held': return ['warn', (problems[0] || 'held').toUpperCase()];
    case 'ready': return ['st-green', m.auto ? 'CLEAN · THE MACHINE SENDS IT ON THE NEXT PASS' : 'READY · WAITING ON ' + firstName(seat).toUpperCase() + (m.b.ask_opened_at ? ' · ' + clock(m.b.ask_opened_at) : '')];
    case 'queued': return ['st-green', 'RECORDED ' + day(q.created_at).toUpperCase() + (m.qbOn ? ' · QUICKBOOKS WITHIN 15 MIN' : ' · QB SWITCH OFF')];
    case 'sending': return ['st-green', 'QUICKBOOKS IS MAKING IT'];
    case 'sent': return m.call ? ['warn', 'CALL ' + firstName(m.name).toUpperCase() + ' · CARD ON ' + firstName(m.call.assignee || seat).toUpperCase() + ' · ' + clock(m.call.opened_at)] : ['st-blue', 'SENT #' + (q.qb_doc_number || q.qb_invoice_id || '') + ' · ' + clock(q.sent_at) + ' AGO' + (q.nudges_stopped_at ? ' · REMINDERS OFF' : '')];
    case 'paid': return ['st-ink', 'PAID · ' + day(q.paid_at).toUpperCase()];
    case 'failed': return ['warn', 'QUICKBOOKS REFUSED IT'];
    default: return ['', status.toUpperCase()];
  }
}

function sentWords(m) {
  const q = m.q; const parts = [];
  parts.push(q.emailed_at ? 'email ✓ ' + (q.email_to || '') : 'no email');
  parts.push(q.texted_at ? 'text ✓' : 'no text');
  return parts.join(' · ') + ' · ' + clock(q.sent_at) + ' ago';
}

function nextFor(m) {
  const { q, status, problems, seat, name, next, call } = m;
  const first = firstName(name), sup = m.supervisor ? firstName(m.supervisor.name) : 'the supervisor';
  switch (status) {
    case 'held': return `${problems.join(' · ')}. Fix it on the file (the photos, the change order, the amount) and ${m.auto ? 'the machine sends it on the next pass' : firstName(seat) + ' approves it'} — or Approve anyway with a reason, or Hold and tag ${sup}.`;
    case 'ready': return m.auto
      ? `Nothing for you. The machine builds it on the next pass (within 15 minutes)${m.qbOn ? `, QuickBooks makes it, and it goes to ${first} by email and text with the pay link` : ' — the qb_invoices switch is OFF, so it waits in the queue for Kevin'}. Press Hold if anything is wrong.`
      : `${firstName(seat)} checks it: right amount, the work is done. Approve records it${m.qbOn ? `; QuickBooks makes it within 15 minutes and ${first} gets it by email and text with the pay link.` : ' — the qb_invoices switch is OFF: make it in QuickBooks as today and press Done on the ask with the number.'}`;
    case 'queued': return `Recorded${q.auto ? ' by the machine' : ''}. ${m.qbOn ? `QuickBooks makes it within 15 minutes, then ${first} gets it by email and text with the pay link. Hold pulls it back until then.` : 'The qb_invoices switch is OFF: make it in QuickBooks as today and press Done on the ask with the number; Kevin flips the switch when the first ones look right.'}`;
    case 'sending': return 'QuickBooks is making it right now. The next minute says the number.';
    case 'sent':
      if (call) return `Call ${first}. ${call.note ? call.note + ' ' : ''}The card is on ${firstName(call.assignee || seat)}; when you have talked, press Done on it with what they said, or Paid here.`;
      if (q.nudges_stopped_at) return `${first} has the invoice (${sentWords(m)}). The reminders are off${q.nudges_stop_reason ? ': ' + q.nudges_stop_reason : ''}. Paid when it lands, or Reminders back on.`;
      if (next) return `${first} has the invoice (${sentWords(m)}). The machine sends ${CHANNEL[next.channel] || 'a reminder'} ${Number(next.in_hours) <= 0 ? 'on the next pass' : 'in ' + hoursWord(next.in_hours)}${next.channel === 'call' ? ' to ' + firstName(seat) : ''}. Nothing for you unless they write back.`;
      return `${first} has the invoice (${sentWords(m)}). The plan is done; the past-due text goes at 30 days. Call them, or press Paid when it lands.`;
    case 'paid': return `Paid ${day(q.paid_at)} · ${q.paid_how || ''} · ${hoursWord((new Date(q.paid_at) - new Date(q.sent_at || q.created_at)) / 36e5)} after the invoice went out. Close-out opened by itself.`;
    case 'failed': return `QuickBooks refused it: ${q.error || 'no reason given'}. Fix the cause (the customer's email, the item on the company row) and Approve again, or tell Kevin.`;
    default: return '';
  }
}

/* ── the card ─────────────────────────────────────────────────────────────── */
export function invoiceCard(ctx) {
  const m = invoiceModel(ctx); if (!m) return '';
  const { job } = ctx.data; const { b, q, status } = m;
  const red = status === 'held' || status === 'failed' || (status === 'sent' && !!m.call);
  const tone = red ? 'red' : status === 'paid' ? 'done' : 'green';
  const [chipCls, chipText] = chipFor(m);
  const first = firstName(m.name);
  const openedBy = b.signoff_at ? `opened by ${firstName(b.signoff_by || 'the supervisor')}'s sign-off, ${day(b.signoff_at)}` : b.ask_opened_at ? `opened ${day(b.ask_opened_at)}` : 'field complete';
  const canAct = staffSeat();
  const lineRows = m.lines.map((l) => `<div class="r"><span>${esc(l.label || '')}${l.description ? ` <span class="small dimmer">· ${esc(l.description)}</span>` : ''}</span><span class="mono ${Number(l.amount) < 0 ? 'dimmer' : ''}">${esc(fmt(l.amount))}</span></div>`).join('');
  const coChip = b.change_orders_unsigned > 0 ? `<span class="chip warn">${esc(String(b.change_orders_unsigned))} UNSIGNED</span>` : b.change_orders_n > 0 ? `<span class="chip st-green">${esc(String(b.change_orders_n))} SIGNED</span>` : '<span class="small">· none</span>';
  const photosChip = !b.signoff_at ? '<span class="chip warn">NO SIGN-OFF YET</span>' : Number(b.photos) >= Number(b.rule) ? '<span class="chip st-green">ON THE FILE</span>' : `<span class="chip warn">${esc(String(Number(b.rule) - Number(b.photos)))} SHORT</span>`;
  const sentCell = q && (status === 'sent' || status === 'paid')
    ? `<div><div class="kicker">Sent</div><b>${esc(at(q.sent_at))}</b> <span class="small">· ${q.emailed_at ? 'email ✓' : 'no email'} · ${q.texted_at ? 'text ✓' : 'no text'}${q.pay_link ? ' · pay link' : ' · no pay link'}</span></div>
       <div><div class="kicker">${status === 'paid' ? 'Paid' : 'Balance'}</div><b>${status === 'paid' ? esc(at(q.paid_at)) : esc(fmt(q.balance ?? q.amount))}</b> <span class="small">· ${status === 'paid' ? esc(q.paid_how || '') : q.balance_checked_at ? 'QuickBooks, checked ' + esc(clock(q.balance_checked_at)) + ' ago' : 'not checked yet'}</span></div>
       <div><div class="kicker">${m.call ? 'Call card' : 'Next reminder'}</div><b>${m.call ? esc('on ' + firstName(m.call.assignee || m.seat) + ' · ' + clock(m.call.opened_at)) : status === 'paid' ? '—' : q.nudges_stopped_at ? 'off' : m.next ? esc((CHANNEL[m.next.channel] || m.next.channel) + (Number(m.next.in_hours) <= 0 ? ' · next pass' : ' · in ' + hoursWord(m.next.in_hours))) : 'plan done · past due at 30 d'}</b> <span class="small">· ${esc(String(q.nudges_sent || 0))} sent</span></div>`
    : `<div><div class="kicker">Finished photos</div><b>${esc(String(b.photos ?? 0))} of ${esc(String(b.rule ?? 3))}</b> ${photosChip}</div>
       <div><div class="kicker">Sign-off</div><b>${esc(b.signoff_by || '—')}</b>${b.signoff_at ? ` <span class="small">· ${esc(at(b.signoff_at))}</span>` : ''}</div>
       <div><div class="kicker">Goes to</div><b>${b.customer?.email ? esc(b.customer.email) : 'no email on file'}</b> <span class="small">· ${b.customer?.phone ? (b.customer.sms_opt_out ? 'said STOP, no text' : 'text ' + esc(b.customer.phone)) : 'no phone on file'}</span></div>`;
  const payLine = status === 'held' || status === 'ready' || status === 'queued' || status === 'failed'
    ? `<div class="bill-text small"><span class="kicker">The text that goes out · from the ${esc(brandName(job.cc_company_id))} line · with the pay link</span><div style="margin-top:3px">${m.S.pay_line ? esc(fillLine(m.S.pay_line, m, q?.pay_link || '{{pay link}}')) : 'No "invoice sent" line for this brand yet — Kevin and Jess add it as a row in the Office room.'}</div></div>` : '';
  const diary = m.log.length ? `<details class="small" style="margin-top:2px"><summary class="kicker" style="cursor:pointer">The invoice's diary · ${esc(String(m.log.length))} entr${m.log.length === 1 ? 'y' : 'ies'} · who, what, when</summary><div class="rows" style="margin-top:4px">${m.log.slice().reverse().map((l) => `<div class="r"><span><span class="mono dimmer">${esc(at(l.at))}</span> · <b>${esc(KIND[l.kind] || l.kind)}</b>${l.by ? ' · ' + esc(l.by) : ''}<div class="small dimmer">${esc(l.body || '')}</div></span></div>`).join('')}</div></details>` : '';
  const planLine = m.plan.length ? `<div class="small dimmer">The reminders, from the send: ${esc(m.plan.map((p) => (p.channel === 'call' ? 'call card' : p.channel === 'push_office' ? 'nudge' : p.channel) + ' ' + planWord(p.hours)).join(' · '))} · past-due text at 30 d. Texts 9 AM–7:30 PM, never over an unanswered reply. Rows in invoice_nudge_plans.</div>` : '';
  const heldNote = m.held && status === 'held' ? `<div class="small">${esc(m.held.body)}</div>` : '';
  const notes = Array.isArray(b.notes) && b.notes.length ? `<div class="small">${esc(b.notes.join(' · '))}</div>` : '';
  return `<div class="card bill ${tone}" data-invoice-card="1">
    <div class="head" style="margin-bottom:2px"><div class="kicker" style="font-size:11px;color:${red ? 'var(--red)' : status === 'paid' ? 'var(--ink)' : 'var(--verify)'}">INVOICE · ${esc(openedBy)} · typed from the file · ${esc(brandName(job.cc_company_id))}${q?.auto ? ' · built by the machine' : ''}</div><span class="chip ${chipCls}">${esc(chipText)}</span></div>
    <div class="bill-grid">
      <div><div class="kicker">Signed</div><b>${esc(fmt(b.signed))}</b> <span class="small">· ${esc(b.signed_src || 'no signed amount')}</span></div>
      <div><div class="kicker">Deposit taken</div><b>${Number(b.deposit) > 0 ? '−' : ''}${esc(fmt(b.deposit || 0))}</b> <span class="small">· ${esc(b.deposit_src || 'none taken')}</span></div>
      <div><div class="kicker">Change orders</div><b>${esc(fmt(b.change_orders || 0))}</b> ${coChip}</div>
      <div><div class="kicker">Invoice${q?.qb_doc_number ? ' #' + esc(q.qb_doc_number) : ''}</div><b class="big">${esc(fmt(m.amount))}</b>${q && b.amount != null && Math.abs(num(q.amount) - num(b.amount)) > 0.005 ? ` <span class="small">· the file says ${esc(fmt(b.amount))}</span>` : ''}</div>
      ${sentCell}
    </div>
    ${lineRows ? `<div class="rows" style="margin-top:2px"><div class="r" style="border-top:0;padding-top:0"><span class="kicker">The lines · what ${esc(first)} reads</span><span class="kicker">amount</span></div>${lineRows}</div>` : ''}
    ${notes}${heldNote}
    ${q?.memo ? `<div class="small">Memo on it: "${esc(q.memo)}"</div>` : ''}
    ${q?.error ? `<div class="small red">QuickBooks said: ${esc(q.error)}</div>` : ''}
    ${payLine}
    <div class="next ${red ? 'bad' : 'good'}"><b>NEXT</b> ${esc(nextFor(m))}</div>
    ${canAct ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:2px">${buttons(m)}</div>` : ''}
    ${planLine}
    ${diary}
  </div>`;
}

function buttons(m) {
  const { q, status } = m; const first = esc(firstName(m.name));
  const est = m.estUrl ? `<a class="btn sm" href="${esc(ESTIMATE_VIEW + m.estUrl)}" target="_blank" rel="noopener">Open the estimate</a>` : '';
  const co = `<button class="btn sm" data-inv-co="1" title="A change order is an estimate the customer signs on the same link; signed, it is a line on this invoice">+ Change order</button>`;
  const photos = `<button class="btn sm" data-inv-photos="1">Open the photos</button>`;
  const pdf = q?.pdf_path ? `<button class="btn sm" data-inv-pdf="1">Open the PDF</button>` : '';
  const phone = m.b.customer?.phone ? `<a class="btn sm" href="tel:${esc(m.b.customer.phone)}">Call ${first}</a>` : '';
  switch (status) {
    case 'held': return `<button class="btn ok" data-inv-approve="1">Approve anyway · say why</button><button class="btn" data-inv-hold="1">Hold · tag who fixes it</button>${co}${photos}${est}`;
    case 'ready': return `<button class="btn ok" data-inv-approve="1">${m.auto ? 'Send it now' : '✓ Approve · send the invoice'}</button><button class="btn" data-inv-hold="1">Hold · say why</button>${co}${photos}${est}`;
    case 'queued': return `<button class="btn" data-inv-hold="1">Hold · pull it back</button>${m.qbOn ? '' : `<button class="btn ok" data-inv-done="1">Done · with the invoice number</button>`}${est}`;
    case 'sending': return est;
    case 'sent': return `<button class="btn ok" data-inv-paid="1">Paid · by check, cash or card</button>${phone}<button class="btn sm" data-inv-text="1">Text ${first} the link again</button><button class="btn sm" data-inv-nudges="${q.nudges_stopped_at ? 'on' : 'off'}">${q.nudges_stopped_at ? 'Reminders back on' : 'Stop the reminders'}</button>${pdf}${est}`;
    case 'paid': return `${pdf}${est}`;
    case 'failed': return `<button class="btn ok" data-inv-approve="1">Approve again</button><button class="btn" data-inv-hold="1">Hold · say why</button>${est}`;
    default: return '';
  }
}

/* the file's NEXT line when the invoice is the loudest thing (gospel 3) */
export function invoiceNext(ctx) {
  const m = invoiceModel(ctx); if (!m) return null;
  const first = firstName(m.name);
  switch (m.status) {
    case 'held': return { tone: 'bad', text: `Invoice held: ${m.problems.join(' and ')}. Fix it on the file, or Approve anyway with a reason.` };
    case 'ready': return { tone: 'good', text: m.auto ? `Invoice clean: ${fmt(m.amount)}, typed from the file. The machine sends it on the next pass; nothing to press.` : `Invoice ready: ${fmt(m.amount)}, typed from the file. ${firstName(m.seat)} taps Approve and it goes.` };
    case 'queued': return { tone: 'good', text: m.qbOn ? `Invoice ${fmt(m.amount)} recorded; QuickBooks makes it within 15 minutes and ${first} gets it by email and text.` : `Invoice ${fmt(m.amount)} recorded; the QuickBooks switch is off — make it by hand and press Done with the number.` };
    case 'sent': return m.call ? { tone: 'bad', text: `Call ${first} about the invoice — the card is on ${firstName(m.call.assignee || m.seat)}, ${clock(m.call.opened_at)}.` } : { tone: '', text: `Invoice #${m.q.qb_doc_number || ''} sent ${clock(m.q.sent_at)} ago, ${fmt(m.q.balance ?? m.q.amount)} open. The machine reminds ${first}; nothing for you unless they write back.` };
    case 'failed': return { tone: 'bad', text: `QuickBooks refused the invoice: ${m.q.error || 'no reason'}. Approve again or tell Kevin.` };
    default: return null;
  }
}

/* ── the taps ─────────────────────────────────────────────────────────────── */
export function wireInvoice(root, ctx, after) {
  const m = invoiceModel(ctx); if (!m) return;
  const q = (s) => root.querySelector(s);
  if (q('[data-inv-approve]')) q('[data-inv-approve]').onclick = () => approveDialog(ctx, m, after);
  if (q('[data-inv-hold]')) q('[data-inv-hold]').onclick = () => holdDialog(ctx, m, after);
  if (q('[data-inv-paid]')) q('[data-inv-paid]').onclick = () => paidDialog(ctx, m, after);
  if (q('[data-inv-nudges]')) q('[data-inv-nudges]').onclick = async (e) => {
    const on = e.currentTarget.dataset.invNudges === 'on';
    if (on) { try { await invoiceNudgesSet(m.q.id, true, null); toast('Reminders back on'); after(); } catch (err) { toast(err.message, 'err'); } return; }
    openModal({ title: `Stop the reminders · ${m.name}`, submitLabel: 'Stop them', body: `<div class="field"><label>Why · one line the next person reads</label><input name="reason" placeholder="paying Friday by check · disputing the gate · talked to them" required/></div><div class="note">No more texts, emails or call cards on this invoice until someone presses Reminders back on. The past-due text at 30 days still goes.</div>`,
      onSubmit: async (f) => { await invoiceNudgesSet(m.q.id, false, f.reason.value.trim()); toast('Reminders stopped · the reason is on the card'); after(); } });
  };
  if (q('[data-inv-text]')) q('[data-inv-text]').onclick = () => {
    const box = root.querySelector('#compose'); if (!box || box.disabled) return toast('This customer cannot be texted from here', 'err');
    box.value = fillLine(m.S.pay_line || `Hi {{first}}, your invoice for {{amount}} from ${brandName(ctx.data.job.cc_company_id)} is ready. {{link}}`, m, m.q?.pay_link || '');
    box.scrollIntoView({ block: 'center', behavior: 'smooth' }); box.focus();
  };
  if (q('[data-inv-pdf]')) q('[data-inv-pdf]').onclick = async (e) => {
    const el = e.currentTarget; el.disabled = true;
    const tab = window.open('', '_blank');
    try { const url = await openBillPdf(m.q.pdf_path); if (tab) tab.location = url; else window.location.assign(url); }
    catch (err) { if (tab) tab.close(); toast(err.message, 'err'); }
    el.disabled = false;
  };
  if (q('[data-inv-done]')) q('[data-inv-done]').onclick = () => { const b = m.b.ask_id ? root.querySelector(`[data-settle="${m.b.ask_id}"]`) : null; if (b) b.click(); else toast('Settle it in the Asks card', 'err'); };
  if (q('[data-inv-photos]')) q('[data-inv-photos]').onclick = () => { const card = root.querySelector('.pthumb')?.closest('.card') || root.querySelector('#photo-in')?.closest('.card'); if (card) card.scrollIntoView({ block: 'center', behavior: 'smooth' }); else toast('No photos on this file yet', 'err'); };
  if (q('[data-inv-co]')) q('[data-inv-co]').onclick = () => { const b = root.querySelector('#file-change-order'); if (b) b.click(); else toast('The change order button is on the file header', 'err'); };
}

export const fillLine = (line, m, link = '') => String(line || '').replace(/\{\{first\}\}/g, firstName(m.name)).replace(/\{\{brand\}\}/g, brandName(m.b.cc_company_id)).replace(/\{\{sender_first\}\}/g, firstName(state.me?.name || 'the office')).replace(/\{\{amount\}\}/g, fmt(m.amount)).replace(/\{\{link\}\}/g, link).replace(/\{\{[a-z_]+\}\}/g, '').replace(/\s{2,}/g, ' ').trim();

/* Approve = the row for QuickBooks, one press. A clean file needs no reason; a
   red one needs one line, and it goes on the diary and the file. */
function approveDialog(ctx, m, after) {
  const { job } = ctx.data; const first = firstName(m.name);
  const red = m.problems.length > 0;
  const memo = `Final invoice${Number(m.b.deposit) > 0 ? ' · balance after the ' + fmt(m.b.deposit) + ' deposit' : ''}${m.b.change_orders_n > 0 ? ' · ' + m.b.change_orders_n + ' change order' + (m.b.change_orders_n > 1 ? 's' : '') : ''}`;
  openModal({ title: `${red ? 'Approve anyway' : m.auto ? 'Send it now' : 'Approve'} · ${m.name}`, submitLabel: red ? 'Approve · with the reason' : '✓ Approve · send the invoice', wide: true, body: `
    <div class="two">
      <div class="field"><label>Invoice amount · from the file</label><input name="amount" type="number" step="0.01" min="0.01" value="${esc(m.b.amount ?? '')}" required/></div>
      <div class="field"><label>Memo · what the customer reads on it</label><input name="memo" value="${esc(memo)}"/></div>
    </div>
    ${red ? `<div class="field"><label>Why it is right anyway · one line (the file says: ${esc(m.problems.join(' · '))})</label><input name="reason" placeholder="photos are in CompanyCam · the change order was signed on paper, $850" required/></div>` : ''}
    <div class="rows" style="margin-bottom:8px">${m.lines.map((l) => `<div class="r"><span>${esc(l.label || '')}</span><span class="mono">${esc(fmt(l.amount))}</span></div>`).join('')}</div>
    <div class="note">${m.qbOn ? `QuickBooks makes invoice #${esc(String(m.b.doc_number || '…'))} within 15 minutes, names the customer the way the books already read ("job number - street"), and ${esc(first)} gets QuickBooks' own email with Review & Pay${m.textsOn ? ' plus the text with the pay link from the main line' : ' (the chain\'s texts switch is OFF, so no text yet)'}. Then the reminders run by themselves; a call card lands on ${esc(firstName(m.seat))} when the plan says call.` : 'The qb_invoices switch is OFF: this records the invoice and the math. Make it in QuickBooks as today and press Done on the ask with its number; Kevin flips the switch when the first ones look right.'} A different amount than the file's goes as one line, and the card says so.</div>`,
    onSubmit: async (f) => {
      const amount = Number(f.amount.value);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error('Put the amount in');
      const r = await invoiceApprove(job.job_id, amount, f.memo.value.trim() || null, red ? f.reason.value.trim() : null);
      toast(`Invoice ${fmt(r?.amount ?? amount)} recorded${r?.switch_on ? ' · QuickBooks within 15 minutes' : ' · QuickBooks switch is off'}`);
      after();
    } });
}
function holdDialog(ctx, m, after) {
  const { job } = ctx.data;
  const who = [];
  if (m.supervisor) who.push([mentionHandle(m.supervisor), `${firstName(m.supervisor.name)} · the supervisor`]);
  if (m.rep) who.push([mentionHandle(m.rep), `${firstName(m.rep.name)} · sold it`]);
  who.push(['@supers', '@supers · every supervisor'], ['@office', '@office · the office']);
  openModal({ title: `Hold the invoice · ${m.name}`, submitLabel: 'Hold · tag them', body: `
    <div class="field"><label>Why · what is missing or wrong</label><input name="note" placeholder="${esc(m.problems[0] || 'photos of the back run · the gate is not on the estimate')}" required/></div>
    <div class="field"><label>Who fixes it</label><select name="to">${who.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></div>
    <div class="note">${m.status === 'queued' ? 'The recorded invoice is pulled back before QuickBooks makes it. ' : ''}It goes on the file as a note with their name on it: they get the push, the invoice waits here${m.auto ? ' — the machine will not send it while it is held; Approve when it is right' : ''}. Nothing is sent to the customer.</div>`,
    onSubmit: async (f) => { await invoiceHold(job.job_id, f.note.value.trim(), f.to.value); toast('On hold · they were tagged on the file'); after(); } });
}
function paidDialog(ctx, m, after) {
  openModal({ title: `Paid · ${m.name} · ${fmt(m.q.amount)}`, submitLabel: 'Paid', body: `
    <div class="field"><label>How</label><select name="how"><option>check</option><option>cash</option><option>card, taken by phone</option><option>Zelle</option><option>financing paid out</option><option>other</option></select></div>
    <div class="field"><label>Note (optional) · check number, who took it</label><input name="note" placeholder="check 4471 · Laura"/></div>
    <div class="note">The Payment ask settles, the reminders stop, close-out opens, the review prompt goes (when the chain's texts are on). QuickBooks still needs the payment recorded against invoice #${esc(m.q.qb_doc_number || '')} — the one thing this does not do yet.</div>`,
    onSubmit: async (f) => { await invoicePaidByHand(m.q.id, [f.how.value, f.note.value.trim()].filter(Boolean).join(' · ')); toast('Paid · the file closes out by itself'); after(); } });
}
