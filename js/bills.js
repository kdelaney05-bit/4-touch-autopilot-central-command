// THE BILLS (365 · docs/THE-BILLS.md) — the two money cards on the customer
// file and the Bills tile in the Office room. Kevin, 16 Sep 2026: "turn
// everything on." The spoons, in order: these cards live with every switch
// OFF (they only record) → bills_to_qb → qb_invoices → office_machine_texts.
//
//   BILL LANDED    one card per bill that landed on this file — a supplier's invoice the
//                  intake worker read from the mail, a sub's, a crew's paper snapped on the job,
//                  a fee receipt (376: kind says which; the card says it before the name) —
//                  this file (supplier_bills). Red before anyone opens it when
//                  the invoice is over what we ordered at, or the PO matched
//                  nothing. One tap: bill_decide() approve · wrong_job · hold;
//                  bill_rematch() moves a bill to the right file. With
//                  bills_to_cc OFF the approved card hands the office the
//                  fields to type into Contractors Cloud, in CC's order. With
//                  bills_to_qb OFF nothing reaches QuickBooks: recorded only.
//   THE INVOICE    moved to js/invoice.js (381, 17 Sep): built by the machine on
//                  the sign-off, QuickBooks makes it, email + text with the pay
//                  link, the reminders, the call card, paid by itself.
//
// Every number says its source (gospel 5); the next step is one line with the
// button beside it (gospel 3); nothing to learn, it comes to you (gospel 33).
import { state, isDemo, firstName, personName, seatName, decideBill, rematchBill, openBillPdf, searchCustomers } from './book.js?v=128';
import { invoiceCard, invoiceNext, wireInvoice } from './invoice.js?v=128';   // 381: the customer's invoice, from the sign-off to the money
import { raw, esc, toast, openModal } from './ui.js?v=128';
import { brandName } from './config.js?v=128';

const ESTIMATE_VIEW = 'https://lzegjjbkfuecrhdvlvay.supabase.co/functions/v1/estimate-view/';
const fmt = (n) => (n == null || n === '' ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const day = (v) => { if (!v) return '—'; const d = new Date(String(v).length <= 10 ? v + 'T12:00:00' : v); return isNaN(d) ? '—' : d.toLocaleDateString([], { month: 'short', day: 'numeric' }); };
const clock = (iso) => { if (!iso) return ''; const m = Math.max(0, (Date.now() - new Date(iso)) / 6e4); return m >= 1440 ? (m / 1440).toFixed(1) + ' d' : m >= 60 ? (m / 60).toFixed(1) + ' h' : Math.round(m) + ' min'; };
const num = (v) => { if (v == null || v === '') return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
const sw = (k) => !!(state.switches || []).find((s) => s.key === k)?.is_on;
const staffSeat = () => ['manager', 'office', 'admin', 'owner'].includes(state.me?.role);

/* ── the bill's words ─────────────────────────────────────────────────────── */
export const BILL_WAITING = ['landed', 'matched', 'needs_human', 'held', 'wrong_job'];
/* 376 HAND IT BACK: the kind of bill, in the office's words. The card says it before the name. */
export const KIND_WORD = { supplier: 'SUPPLIER BILL', sub: 'SUB INVOICE', crew: 'CREW INVOICE', fee: 'FEE RECEIPT' };
export const KIND_TITLE = { supplier: 'Supplier invoice', sub: 'Sub invoice', crew: 'Crew invoice', fee: 'Fee receipt' };
export const kindWord = (b) => KIND_WORD[b.kind] || KIND_WORD.supplier;
const kindTitle = (b) => KIND_TITLE[b.kind] || KIND_TITLE.supplier;
const howItLanded = (b) => b.landed_by_name ? `landed by ${firstName(b.landed_by_name)} from the paper` : b.kind === 'fee' ? 'read from the receipt email' : "read from the supplier's email";
export const isBillWaiting = (b) => BILL_WAITING.includes(b.status);
export const isBillOnCard = (b) => isBillWaiting(b) || b.status === 'approved';   // approved stays on the card until CC / QuickBooks has it
export const isBillRed = (b) => isBillWaiting(b) && (Number(b.over_by || 0) > 0 || !b.job_id || b.status === 'needs_human' || (b.due_date && b.due_date < new Date().toISOString().slice(0, 10)));

/* who verifies a bill: whoever holds the material step for that brand (stage_seats), else the office */
function approverName(b) {
  if (b.kind && b.kind !== 'supplier') return 'the office';
  const ss = (state.stageSeats || []).find((s) => String(s.cc_company_id) === String(b.cc_company_id) && s.stage === 'schedule');
  return firstName(seatName(ss?.owner_id) || '') || 'the office';
}
const deciderName = (b) => b.decided_by_name || seatName(b.decided_by) || '';
const pastDue = (b) => !!b.due_date && b.due_date < new Date().toISOString().slice(0, 10) && !['in_qb', 'paid'].includes(b.status);

function billChip(b) {
  const who = firstName(deciderName(b));
  switch (b.status) {
    case 'needs_human': return ['warn', 'NEEDS A HUMAN · THE MACHINE COULD NOT READ IT'];
    case 'held': return ['warn', 'ON HOLD' + (who ? ' · ' + who.toUpperCase() : '')];
    case 'wrong_job': return ['warn', 'WRONG JOB · NEEDS THE RIGHT FILE'];
    case 'approved': return ['st-green', 'APPROVED' + (who ? ' · ' + who.toUpperCase() : '') + ' · ' + day(b.decided_at).toUpperCase()];
    case 'in_cc': return ['st-green', 'IN CONTRACTORS CLOUD'];
    case 'in_qb': return ['st-green', 'IN QUICKBOOKS' + (b.qb_bill_id ? ' · BILL ' + b.qb_bill_id : '')];
    case 'paid': return ['st-ink', 'PAID'];
    default:
      if (Number(b.over_by || 0) > 0) return ['warn', 'OVER THE ESTIMATE · BY ' + fmt(b.over_by)];
      if (!b.job_id) return ['warn', 'NO JOB MATCHED · PO ' + (b.po_number || '—')];
      if (pastDue(b)) return ['warn', 'PAST DUE · ' + day(b.due_date).toUpperCase()];
      return ['st-gold', 'WAITING ON ' + approverName(b).toUpperCase() + ' · ' + clock(b.created_at)];
  }
}

function billNext(b) {
  const who = approverName(b), dec = firstName(deciderName(b)) || 'someone';
  const ccOn = sw('bills_to_cc'), qbOn = sw('bills_to_qb');
  switch (b.status) {
    case 'needs_human': return 'The machine could not read the invoice number or the amount. Open the PDF and type it into Contractors Cloud as today, then Hold with a note so nobody looks twice.';
    case 'wrong_job': return `${dec} said this is the wrong job. Pick the right file and the bill moves there with its PDF.`;
    case 'held': return `On hold by ${dec}${b.decision_note ? ': "' + b.decision_note + '"' : ''}. Approve it when it is right, or pick the right file.`;
    case 'approved': return ccOn && qbOn ? 'Approved. The machine writes it into Contractors Cloud and QuickBooks; nothing to type.'
      : qbOn ? 'Approved. QuickBooks gets it within the hour. The bills_to_cc switch is OFF: type it into Contractors Cloud from the fields below, in CC\'s order.'
      : 'Approved and recorded. Both switches are OFF tonight: type it into Contractors Cloud from the fields below, in CC\'s order, and QuickBooks as today. When Kevin flips the switches this same tap does both.';
    case 'in_cc': return 'In Contractors Cloud with the Ref # filled. QuickBooks next.';
    case 'in_qb': return `In QuickBooks${b.qb_bill_id ? ' as bill ' + b.qb_bill_id : ''}. Claudette pays it; nothing to type.`;
    case 'paid': return 'Paid.';
    default:
      if (Number(b.over_by || 0) > 0) return `This invoice is ${fmt(b.over_by)} over what we ordered at. Open the order, decide, and say why on Hold, or Approve if the extra is right.`;
      if (!b.job_id) return 'The PO matched nothing on file. Pick the file it belongs to, or Approve it as stock with no job.';
      return `${who} verifies it: right job, right amount${b.kind && b.kind !== 'supplier' ? '' : ', right order'}. One tap. The switches (OFF) are what put it in Contractors Cloud and QuickBooks; until then the tap records it.`;
  }
}

/* the fields for Contractors Cloud's bill, in CC's order (vendor · Ref # · date · terms · amount · the material order) */
function ccFields(b) {
  const raw_ = b.raw || {};
  return [
    ['Vendor', b.supplier],
    ['Ref #', b.invoice_number],
    ['Bill date', b.bill_date ? day(b.bill_date) : '—'],
    ['Terms / due', raw_.terms ? raw_.terms + (b.due_date ? ' · due ' + day(b.due_date) : '') : b.due_date ? 'due ' + day(b.due_date) : '—'],
    [b.is_credit ? 'Credit' : 'Amount', (b.is_credit ? '−' : '') + fmt(b.amount)],
    ['Material order', b.po_number ? (String(b.po_number).startsWith('MO') ? b.po_number : 'MO' + b.po_number) + (b.cc_material_order_id ? ' · #' + b.cc_material_order_id : '') : '—'],
    ['Memo', `${kindTitle(b)} ${b.invoice_number}${b.po_number ? ' · PO ' + b.po_number : ''}`],
  ];
}

/* ── BILL LANDED — the full card, on the file ───────────────────────────────── */
export function billCard(b) {
  const waiting = isBillWaiting(b), red = isBillRed(b);
  const tone = red ? 'red' : b.status === 'approved' || b.status === 'in_cc' || b.status === 'in_qb' ? 'green' : waiting ? '' : 'done';
  const [chipCls, chipText] = billChip(b);
  const est = num(b.estimate_amount), amt = num(b.amount), over = num(b.over_by);
  const estChip = b.is_credit || (b.kind && b.kind !== 'supplier') ? '' : est == null ? '<span class="chip">NO ESTIMATE ON THE ORDER</span>' : over > 0 ? `<span class="chip warn">OVER BY ${esc(fmt(over))}</span>` : Math.abs((amt ?? 0) - est) < 0.005 ? '<span class="chip st-green">MATCHES</span>' : `<span class="chip st-green">UNDER BY ${esc(fmt(est - (amt ?? 0)))}</span>`;
  const lines = Array.isArray(b.lines) ? b.lines : [];
  const lineWords = lines.slice(0, 2).map((l) => l.memo || l.item).filter(Boolean).join(' · ');
  const dec = firstName(deciderName(b));
  const fields = b.status === 'approved' && !sw('bills_to_cc') ? `<div class="rows" style="margin-top:2px"><div class="r" style="border-top:0;padding-top:0"><span class="kicker">For Contractors Cloud · in CC's order</span><button class="btn sm" data-bill-copy="${esc(b.id)}">Copy the fields</button></div>${ccFields(b).map(([k, v]) => `<div class="r"><span class="small dimmer">${esc(k)}</span><span class="mono" style="font-size:12px">${esc(v)}</span></div>`).join('')}</div>` : '';
  return `<div class="card bill ${tone}" data-bill-card="${esc(b.id)}">
    <div class="head" style="margin-bottom:2px"><div class="kicker" style="font-size:11px;color:${red ? 'var(--red)' : tone === 'green' ? 'var(--verify)' : 'var(--gold)'}">${kindWord(b)} LANDED · ${esc(b.supplier)} · ${esc(howItLanded(b))} ${esc(day(b.created_at))}${b.raw?.parsed_from === 'iif' ? ' (the IIF)' : b.raw?.parsed_from === 'pdf' ? ' (the PDF)' : ''}${b.pdf_path ? (b.landed_by ? ' · the photo is on the file' : ' · the PDF is on the file') : b.landed_by ? '' : ' · no PDF came with it'} · ${esc(brandName(b.cc_company_id))}</div><span class="chip ${chipCls}">${esc(chipText)}</span></div>
    <div class="bill-grid">
      <div><div class="kicker">Invoice</div><b>${esc(b.invoice_number)}</b></div>
      <div><div class="kicker">PO</div><b>${esc(b.po_number || '—')}</b> <span class="small">${b.cc_material_order_id ? '· found the material order' : b.job_id ? '· matched the job' : '· matches nothing on file'}</span></div>
      <div><div class="kicker">${b.is_credit ? 'Credit' : 'Invoice amount'}</div><b class="big">${b.is_credit ? '−' : ''}${esc(fmt(amt))}</b>${b.is_credit ? ' <span class="chip st-green">COMES IN AS A CREDIT</span>' : ''}</div>
      <div><div class="kicker">${b.kind && b.kind !== 'supplier' ? 'Landed' : 'We ordered at'}</div><b>${b.kind && b.kind !== 'supplier' ? esc(b.landed_by_name ? 'by ' + firstName(b.landed_by_name) + ', on the job' : 'by email') : esc(est == null ? '—' : fmt(est))}</b> ${estChip}</div>
      <div><div class="kicker">Due</div><b>${esc(day(b.due_date))}</b>${pastDue(b) ? ' <span class="chip warn">PAST DUE</span>' : ''}</div>
      <div><div class="kicker">Lines</div><b>${lines.length}</b>${lineWords ? ` <span class="small">· ${esc(lineWords)}</span>` : ''}</div>
    </div>
    ${b.decision_note ? `<div class="small">${esc(dec || 'Note')}: "${esc(b.decision_note)}"</div>` : ''}
    ${b.qb_error ? `<div class="small red">QuickBooks refused it: ${esc(b.qb_error)}</div>` : ''}
    <div class="next ${red ? 'bad' : tone === 'green' ? 'good' : ''}"><b>NEXT</b> ${esc(billNext(b))}</div>
    ${fields}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:2px">${billButtons(b)}</div>
  </div>`;
}

function billButtons(b, compact = false) {
  const id = esc(b.id);
  const pdf = b.pdf_path ? `<button class="btn sm" data-bill-pdf="${id}">Open the PDF</button>` : '';
  if (!staffSeat()) return pdf;
  if (b.status === 'wrong_job' || (isBillWaiting(b) && !b.job_id && b.status !== 'needs_human')) {
    return `<button class="btn ${compact ? 'sm' : ''} fill" data-bill-rematch="${id}">Pick the right file</button>` + (b.status !== 'wrong_job' ? `<button class="btn ${compact ? 'sm' : ''} ok" data-bill-decide="approve" data-bill="${id}">✓ Approve · stock, no job</button>` : '') + `<button class="btn ${compact ? 'sm' : ''}" data-bill-decide="hold" data-bill="${id}">Hold · say why</button>${pdf}`;
  }
  if (b.status === 'needs_human') return `<button class="btn ${compact ? 'sm' : ''}" data-bill-decide="hold" data-bill="${id}">Hold · say why</button><button class="btn ${compact ? 'sm' : ''}" data-bill-rematch="${id}">Pick the file</button>${pdf}`;
  if (isBillWaiting(b)) return `<button class="btn ${compact ? 'sm' : ''} ok" data-bill-decide="approve" data-bill="${id}">✓ Approve · right job, right amount</button><button class="btn ${compact ? 'sm' : ''}" data-bill-decide="wrong_job" data-bill="${id}">Wrong job</button><button class="btn ${compact ? 'sm' : ''}" data-bill-decide="hold" data-bill="${id}">${b.status === 'held' ? 'Still on hold · update why' : 'Hold · say why'}</button>${pdf}`;
  if (b.status === 'approved') return (sw('bills_to_cc') ? '' : `<button class="btn sm" data-bill-copy="${id}">Copy the fields for CC</button>`) + `<button class="btn sm" data-bill-decide="hold" data-bill="${id}">Take it back · hold</button>${pdf}`;
  return pdf;
}

/* the compact row — the Office room's queue, oldest first */
export function billRow(b) {
  const red = isBillRed(b); const [cls, text] = billChip(b);
  return `<div class="billrow ${red ? 'red' : ''}" data-bill-row="${esc(b.id)}">
    <div><span class="small">${esc(kindWord(b))}</span> · <b>${esc(b.supplier)}</b> · inv ${esc(b.invoice_number)} · <span class="mono">${b.is_credit ? '−' : ''}${esc(fmt(b.amount))}</span> · PO ${esc(b.po_number || '—')} · ${esc(brandName(b.cc_company_id))} · ${b.customer_id ? `<a href="#" data-bill-peek="${esc(b.customer_id)}"><b>${esc(personName(b.customer_name || 'the file'))}</b></a>` : '<span class="red">no file matched</span>'}
      <div class="who"><span class="chip ${cls}">${esc(text)}</span> · landed ${esc(clock(b.created_at))} ago${b.due_date ? ' · due ' + esc(day(b.due_date)) : ''}${b.estimate_amount != null ? ' · we ordered at ' + esc(fmt(b.estimate_amount)) : ''}${b.decision_note ? ' · "' + esc(b.decision_note) + '"' : ''}</div></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${b.customer_id ? `<button class="btn sm" data-bill-peek="${esc(b.customer_id)}">Open file</button>` : ''}${billButtons(b, true)}</div>
  </div>`;
}

/* ── the Office room: the tile and the queue ──────────────────────────────── */
export function billsTile() {
  const B = (state.bills || []).filter(isBillWaiting);
  const red = B.filter(isBillRed).length; const oldest = B[0];
  return `<div class="tile" data-tour="bills-tile"><div class="kicker">Bills · suppliers · subs · crews · fees</div><div class="fnum" ${red ? 'style="color:var(--clock)"' : ''}>${B.length}</div><div class="small">${oldest ? 'oldest <span class="mono' + (red ? ' red' : '') + '">' + esc(clock(oldest.created_at)) + '</span>' + (red ? ' · <span class="red">' + red + ' need a look</span>' : ' · all match') : 'none waiting · they land by themselves'}</div></div>`;
}
export function billsQueueCard() {
  const B = (state.bills || []).filter(isBillWaiting).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const asOf = state.loadedAt ? state.loadedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  return `<div class="card" data-tour="bills-queue">
    <div class="head" style="margin-bottom:4px"><div class="kicker">Bills · suppliers, subs, crews and fees waiting on a person · oldest first · from the emails and the paper${asOf ? ' · as of ' + esc(asOf) : ''}</div><span class="chip ${B.some(isBillRed) ? 'warn' : 'st-gold'}">${B.length} WAITING</span></div>
    ${B.length ? B.map(billRow).join('') : '<div class="empty">No bills waiting. They land here by themselves when a supplier, a sub or Simplifile emails an invoice, or when a supervisor snaps the paper a crew handed over, on the job: the machine reads it, finds the job, and the card asks for one tap.</div>'}
  </div>`;
}

/* the file's NEXT line when money is waiting (gospel 3: worst news first) */
export function billsNext(ctx) {
  const bills = (ctx.data.bills || []).filter(isBillWaiting);
  const red = bills.find(isBillRed);
  if (red) return { tone: 'bad', text: `A ${red.supplier} bill for ${fmt(red.amount)} landed ${Number(red.over_by || 0) > 0 ? 'over what we ordered at' : !red.job_id ? 'with no job matched' : red.status === 'needs_human' ? 'and the machine could not read it' : 'past due'}. It is on the card below.` };
  const inv = invoiceNext(ctx);   // 381: the invoice's own line — held, ready, sent, the call card
  if (inv && (inv.tone === 'bad' || inv.tone === 'good')) return inv;
  if (bills.length) return { tone: '', text: `${bills.length} supplier bill${bills.length > 1 ? 's' : ''} waiting on ${approverName(bills[0])}: right job, right amount. One tap on the card below.` };
  return null;
}

/* everything the file shows: the invoice, then the bills oldest first, then what is already through */
export function billsCards(ctx) {
  const bills = (ctx.data.bills || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const onCard = bills.filter(isBillOnCard), through = bills.filter((b) => !isBillOnCard(b));
  const settled = through.length ? `<div class="card"><div class="kicker">Supplier bills on this file · through</div><div class="rows">${through.map((b) => { const [c, t] = billChip(b); return `<div class="r"><span>${esc(b.supplier)} · inv ${esc(b.invoice_number)} · ${b.is_credit ? 'credit ' : ''}<span class="mono">${esc(fmt(b.amount))}</span> · <span class="chip ${c}">${esc(t)}</span></span><span>${b.pdf_path ? `<button class="btn sm" data-bill-pdf="${esc(b.id)}">Open the PDF</button>` : ''}</span></div>`; }).join('')}</div></div>` : '';
  return invoiceCard(ctx) + onCard.map(billCard).join('') + settled;
}

/* ── the taps ─────────────────────────────────────────────────────────────── */
export function wireBills(root, { bills = [], ctx = null, after = () => {} }) {
  const find = (id) => bills.find((b) => b.id === id) || (state.bills || []).find((b) => b.id === id) || null;
  root.querySelectorAll('[data-bill-peek]').forEach((el) => (el.onclick = (e) => { e.preventDefault(); window.__peek(el.dataset.billPeek); }));
  root.querySelectorAll('[data-bill-pdf]').forEach((el) => (el.onclick = async () => {
    const b = find(el.dataset.billPdf); if (!b?.pdf_path) return;
    el.disabled = true;
    const tab = window.open('', '_blank');   // iPhone Safari blocks a popup opened after an await
    try { const url = await openBillPdf(b.pdf_path); if (tab) tab.location = url; else window.location.assign(url); }
    catch (e) { if (tab) tab.close(); toast(e.message, 'err'); }
    el.disabled = false;
  }));
  root.querySelectorAll('[data-bill-copy]').forEach((el) => (el.onclick = async () => {
    const b = find(el.dataset.billCopy); if (!b) return;
    const text = ccFields(b).map(([k, v]) => `${k}: ${v}`).join('\n');
    try { await navigator.clipboard.writeText(text); toast('Copied · paste into the Contractors Cloud bill'); } catch { window.prompt('Copy the fields', text); }
  }));
  root.querySelectorAll('[data-bill-decide]').forEach((el) => (el.onclick = () => {
    const b = find(el.dataset.bill); if (!b) return;
    const d = el.dataset.billDecide;
    if (d === 'approve') return approveBill(b, el, after);
    if (d === 'hold') return holdBill(b, after);
    if (d === 'wrong_job') return rematchDialog(b, after, true);
  }));
  root.querySelectorAll('[data-bill-rematch]').forEach((el) => (el.onclick = () => { const b = find(el.dataset.billRematch); if (b) rematchDialog(b, after, false); }));
  if (ctx) wireInvoice(root, ctx, after);   // 381: the invoice card's taps
}

async function approveBill(b, el, after) {
  el.disabled = true;
  try {
    await decideBill(b.id, 'approve', null);
    toast(sw('bills_to_qb') ? 'Approved · QuickBooks gets it within the hour' : 'Approved · recorded. Both switches are off: type it into CC from the fields on the card');
    after();
  } catch (e) { toast(e.message, 'err'); el.disabled = false; }
}
function holdBill(b, after) {
  openModal({ title: `Hold · ${b.supplier} inv ${b.invoice_number}`, submitLabel: 'Hold it', body: `
    <div class="field"><label>Why · one line the next person reads</label><input name="note" value="${esc(b.decision_note || '')}" placeholder="over by $153 · waiting on Jonathan to check the order · duplicate of inv 2014568155" required/></div>
    <div class="note">It stays on the Office queue with your name and the reason. Approve it, or pick the right file, when you know.</div>`,
    onSubmit: async (f) => { await decideBill(b.id, 'hold', f.note.value.trim()); toast('On hold · the reason is on the card'); after(); } });
}
/* Wrong job / no job matched: find the file it belongs to; picking one moves the bill there. No pick + a note = marked wrong job for someone who knows. */
function rematchDialog(b, after, markOnly) {
  let picked = null, timer = null;
  openModal({ title: markOnly ? `Wrong job · ${b.supplier} inv ${b.invoice_number}` : `Which file? · ${b.supplier} inv ${b.invoice_number}`, submitLabel: markOnly ? 'Mark it wrong job' : 'Move it there', body: `
    <div class="field"><label>The customer it belongs to · type a name or a street</label><input name="q" placeholder="Marchetti · 118 Palm" autocomplete="off"/></div>
    <div class="rows" data-hits style="max-height:220px;overflow:auto"><div class="r"><span class="small dimmer">Start typing; pick the file.</span></div></div>
    <div class="field" style="margin-top:12px"><label>Or a note for whoever knows the orders</label><input name="note" placeholder="this is the Alvarez order, not Marchetti · PO on the ticket is 29388"/></div>
    <div class="note">Pick a file and the bill moves there with its PDF and goes back to Waiting. No pick: it is marked wrong job with your note and stays on the Office queue.</div>`,
    onOpen: (f) => {
      const hits = f.querySelector('[data-hits]'); const go = f.querySelector('#modal-go');
      f.q.oninput = () => {
        clearTimeout(timer); picked = null; go.textContent = markOnly ? 'Mark it wrong job' : 'Move it there';
        const s = f.q.value.trim(); if (s.length < 2) { hits.innerHTML = '<div class="r"><span class="small dimmer">Start typing; pick the file.</span></div>'; return; }
        timer = setTimeout(async () => {
          let rows = []; try { rows = await searchCustomers(s); } catch (e) { hits.innerHTML = `<div class="r"><span class="red">${esc(e.message)}</span></div>`; return; }
          hits.innerHTML = rows.length ? rows.map((c) => `<div class="r"><label style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="radio" name="pick" value="${esc(c.id)}"/><span><b>${esc(personName(c.name))}</b> <span class="small">${esc(c.street || '')}${c.city ? ' · ' + esc(c.city) : ''}</span></span></label><span class="mono dimmer">${esc(c.phone || '')}</span></div>`).join('') : '<div class="r"><span class="small dimmer">Nobody by that name.</span></div>';
          hits.querySelectorAll('input[name=pick]').forEach((r) => (r.onchange = () => { picked = r.value; go.textContent = 'Move it there'; }));
        }, 220);
      };
    },
    onSubmit: async (f) => {
      if (picked) { await rematchBill(b.id, picked); toast('Moved · the bill is on that file, back to Waiting'); after(); return; }
      const note = f.note.value.trim();
      if (!note && !markOnly) throw new Error('Pick the file, or leave a note');
      await decideBill(b.id, 'wrong_job', note || null); toast('Marked wrong job · it stays on the Office queue'); after();
    } });
}
