// Office — the asks, oldest first, each closed by its proof (migration 306).
// Done here is ask_settle(): the input lands on the file, the chain opens the
// next ask and pushes its owner. No checkbox anywhere.
import { state, isDemo, personName, settleAsk, handAsk, voidAsk, uploadDoc, setSwitch, offerNextWord, nextWordFor, loadSubLocksWaiting, loadHandoffsWaiting, handoffTake } from './book.js?v=147';
import * as api from './api.js?v=147';
import { $, html, raw, esc, toast, openModal } from './ui.js?v=147';
import { brandName, askLabel, stageLabel, STAGES, BRAND_BY_CC } from './config.js?v=147';
import { iconForAsk } from './words.js?v=147';
import { DEMO_STEPS } from './demo-office.js?v=147';
import { reload } from './app.js?v=147';
import { billsTile, billsQueueCard, wireBills } from './bills.js?v=147';   // 365/369: the Bills tile and queue

let filter = 'all', laneF = 'OFFICE', oldOnly = false;   // 135: the list can show the field's asks too, and only the ones older than three days
const canVoid = (q) => ['owner', 'admin', 'manager', 'office'].includes(state.me?.role) || (q.assignee_id && q.assignee_id === state.me?.id);
const mins = (m) => m == null ? '' : m >= 1440 ? (m / 1440).toFixed(1) + ' d' : m >= 60 ? (m / 60).toFixed(1) + ' h' : Math.round(m) + ' min';
const money = (n) => n == null ? '' : '$' + Math.round(Number(n)).toLocaleString();
const LINE_MIN = { PERMIT: 5 * 1440, CONTRACT_DOC: 2 * 1440, SURVEY: 1440, SCHEDULE: 2 * 1440, MATERIAL: 2 * 1440, INVOICE: 240, PAYMENT: 30 * 1440, COLLECT_CALL: 240 };   // 381: a call card waits four hours, then it is red

/* Sam, 18 Sep ("I wonder if there's a way the CRM could alert us when an 811 locate is getting close to expiring,
   specifically if the job is still in a pre-production stage… just give us an alert or task so we can review it and
   decide whether to reorder it"): the tickets the machine already reads (341) that expire within ten days on a job
   with no start date. Nothing reorders itself — the card is the review, the decision is hers. */
const DEMO_LOCATES = [
  { ticket: '233601431', name: 'Keyeck, Tony', job: '29102', brand: '1461', exp_date: new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10), address: '1180 Pine St', city: 'Titusville' },
  { ticket: '233606949', name: 'Reed, Dana', job: '29088', brand: '1461', exp_date: new Date(Date.now() + 6 * 864e5).toISOString().slice(0, 10), address: '2130 Sunrise Ave', city: 'Melbourne' },
];
async function fillLocates(root) {
  const box = root.querySelector('#locates-expiring'); if (!box) return;
  let rows = [];
  try {
    if (isDemo()) rows = DEMO_LOCATES;
    else {
      const iso = (d) => new Date(d).toISOString().slice(0, 10);
      const L = await api.page(`locate_tickets?select=ticket,customer_id,exp_date,address,city&exp_date=gte.${iso(Date.now())}&exp_date=lte.${iso(Date.now() + 10 * 864e5)}&order=exp_date.asc`, 200);
      if (L.length) {
        const ids = [...new Set(L.map((l) => l.customer_id).filter(Boolean))];
        const J = ids.length ? await api.page(`jobs?select=customer_id,cc_job_number,start_date,completed_at,cc_company_id,created_at,customers(name)&customer_id=in.(${ids.join(',')})&order=created_at.desc`, 500).catch(() => []) : [];
        rows = L.map((l) => { const j = J.find((x) => x.customer_id === l.customer_id); return { ...l, name: j?.customers?.name || '', job: j?.cc_job_number || '', brand: j?.cc_company_id || '', started: !!(j && (j.start_date || j.completed_at)) }; }).filter((r) => !r.started);
      }
    }
  } catch (e) { box.innerHTML = `<div class="small dimmer">Could not read the locates (${esc(e.message)}).</div>`; return; }
  if (!rows.length) { box.innerHTML = ''; return; }
  const days = (d) => Math.max(0, Math.round((new Date(d + 'T12:00:00') - Date.now()) / 864e5));
  box.innerHTML = `<div class="card locates" data-tour="locates-expiring">
    <div class="head" style="margin-bottom:4px"><div class="kicker">811 locates expiring · the job has not started · soonest first</div><span class="chip">${rows.length}</span></div>
    <div class="rows">${rows.map((r) => { const n = days(r.exp_date); return `<div class="r ${n <= 3 ? 'soon' : ''}"><span><b>${esc(personName(r.name) || 'a customer')}</b>${r.job ? ' · ' + esc(String(r.job)) : ''}${r.brand ? ' · ' + esc(brandName(r.brand)) : ''} · <span class="mono">ticket ${esc(r.ticket)}</span>${r.address ? ' · ' + esc([r.address, r.city].filter(Boolean).join(', ')) : ''}</span><span class="mono">${n === 0 ? 'expires today' : n === 1 ? 'expires tomorrow' : 'expires in ' + n + ' days'}</span></div>`; }).join('')}</div>
    <div class="small" style="margin-top:6px">Nothing reorders itself. If the job is on hold (HOA, the homeowner, a wait), leave it; if it is about to go, reorder it on 811 and the new ticket lands here on its own. Sam's idea, 18 Sep.</div>
  </div>`;
}

export function renderOffice(root) {
  setTimeout(() => { fillHandoffs(root); fillSubLocks(root); fillLocates(root); }, 0);   // 417: the handoffs first — a customer is waiting on us   // 397: the subs waiting to be typed into CC, after the paint · 18 Sep: the locates about to expire
  const ALL = state.queue;
  const QO = ALL.filter((q) => q.lane === 'OFFICE');
  // 135 (Jess, 18 Sep 1:51 PM: "Is there a way I can see all open tasks?… overdue… so we dont forget any final inspections"): Office, Field or Everything, and only the old ones
  const Q = ALL.filter((q) => (laneF === 'all' || q.lane === laneF) && (!oldOnly || q.open_min > 3 * 1440));
  const types = ['CONTRACT_DOC', 'PERMIT', 'SURVEY', 'SCHEDULE', 'MATERIAL', 'INVOICE', 'COLLECT_CALL', 'PAYMENT', 'INTRO_CALL', 'INSPECTION', 'COMPLETION_SIGNOFF', 'MILESTONE', 'CLOSEOUT', 'MATERIAL_REQUEST', 'SITE_ISSUE'];
  const n = (t) => Q.filter((q) => q.ask_type === t).length;
  const nO = (t) => QO.filter((q) => q.ask_type === t).length;
  const oldest = (t) => QO.filter((q) => q.ask_type === t).sort((a, b) => b.open_min - a.open_min)[0];
  const lanes = (l) => ALL.filter((q) => l === 'all' || q.lane === l).length;
  const stale = ALL.filter((q) => (laneF === 'all' || q.lane === laneF) && q.open_min > 3 * 1440).length;
  const rows = (filter === 'all' ? Q : Q.filter((q) => q.ask_type === filter)).slice().sort((a, b) => b.open_min - a.open_min);
  const canFlip = ['owner', 'admin'].includes(state.me?.role);
  const sw = (k) => state.switches.find((s) => s.key === k);

  root.innerHTML = html`
    <div class="head">
      <div><div class="kicker">Office room · the asks, oldest first · the clock starts when the ask opens</div>
        <h1 class="serif">What the field is waiting on the office for, and how long.</h1></div>
      <div class="right">${isDemo() ? raw('<span class="chip demo">DEMO</span>') : ''}</div>
    </div>
    <div class="tiles" data-tour="office-tiles" style="grid-template-columns:repeat(6,minmax(0,1fr))">
      ${raw([['CONTRACT_DOC', 'Paperwork'], ['PERMIT', 'Permit'], ['INVOICE', sw('invoice_auto')?.is_on ? 'Invoices · the machine' : 'Ready to invoice'], ['COLLECT_CALL', 'Calls · invoices'], ['PAYMENT', 'Payment']].map(([t, label]) => {
        const o = oldest(t); const red = o && o.open_min > (LINE_MIN[t] || 1e9);
        return `<div class="tile"><div class="kicker">${esc(label)}</div><div class="fnum" ${t === 'INVOICE' ? 'style="color:var(--verify)"' : red ? 'style="color:var(--clock)"' : ''}>${nO(t)}</div><div class="small">${o ? 'oldest <span class="mono ' + (red ? 'red' : '') + '">' + esc(mins(o.open_min)) + '</span> · ' + esc(o.assignee_name || '') : t === 'COLLECT_CALL' ? 'none · the machine opens one when an invoice goes unpaid' : t === 'INVOICE' && sw('invoice_auto')?.is_on ? 'none waiting · they build themselves' : 'none open'}</div></div>`;
      }).join(''))}
      ${raw(billsTile())}
    </div>
    <div class="card" data-tour="office-asks">
      <div class="subs" style="margin-bottom:2px">
        <button class="sub ${laneF === 'OFFICE' ? 'on' : ''}" data-lane="OFFICE" title="What the office holds">Office · ${lanes('OFFICE')}</button>
        <button class="sub ${laneF === 'SUPER' ? 'on' : ''}" data-lane="SUPER" title="What the field holds: sign-offs, milestones, the crew's asks">Field · ${lanes('SUPER')}</button>
        <button class="sub ${laneF === 'all' ? 'on' : ''}" data-lane="all" title="Every open ask on every file">Everything · ${lanes('all')}</button>
        <button class="sub ${oldOnly ? 'on' : ''}" data-old="1" title="Only the asks open longer than three days" style="margin-left:8px">${oldOnly ? '✓ ' : ''}3 days + · ${stale}</button>
      </div>
      <div class="subs" style="margin-bottom:4px">
        <button class="sub ${filter === 'all' ? 'on' : ''}" data-f="all">All · ${Q.length}</button>
        ${raw(types.filter(n).map((t) => `<button class="sub ${filter === t ? 'on' : ''}" data-f="${t}">${esc(askLabel({ ask_type: t }))} · ${n(t)}</button>`).join(''))}
        <span class="small" style="margin-left:auto">Done asks for the input. The input goes on the file and opens the next step by itself.</span>
      </div>
      ${rows.length ? raw(rows.map(row).join('')) : raw('<div class="empty">Nothing open. When a job signs, its paperwork checklist lands here.</div>')}
    </div>
    ${raw(billsQueueCard())}
    <div id="handoffs-waiting"></div>
    <div id="sub-locks-waiting"></div>
    <div id="locates-expiring"></div>
    ${canFlip ? raw(`<div class="card"><div class="kicker">The machine · switches (owner only)</div>
      <div class="switch"><span><b>Estimate-booked confirmation text</b> — the first text, from the brand's main line, the moment a new appointment lands. Fencing lines only until the other campaigns approve.</span><button class="btn sm ${sw('appt_confirm')?.is_on ? 'ok' : ''}" data-switch="appt_confirm">${sw('appt_confirm')?.is_on ? 'ON — turn off' : 'OFF — turn on'}</button></div>
      <div class="switch"><span><b>The answer clock</b> — 15 minutes, then the watcher is pinged; 60 minutes, the owners. Counts only texts that arrive after you flip it.</span><button class="btn sm ${sw('text_clock')?.is_on ? 'ok' : ''}" data-switch="text_clock">${sw('text_clock')?.is_on ? 'ON — turn off' : 'OFF — turn on'}</button></div>
      <div class="switch"><span><b>The chain's texts</b> — permit approved, you're on the schedule, invoice sent, the past-due reminder at 30 days, the review prompt on payment, and the five-star link when a customer texts back a 9 or 10. Jess's wording, from the brand's main line.</span><button class="btn sm ${sw('office_machine_texts')?.is_on ? 'ok' : ''}" data-switch="office_machine_texts">${sw('office_machine_texts')?.is_on ? 'ON — turn off' : 'OFF — turn on'}</button></div>
      <div class="switch" data-tour="invoice-switch"><span><b>The invoice builds and sends itself</b> (381) — the moment the sign-off lands with the photos and the paperwork right, the machine types the invoice from the signed estimate − the deposit + the signed change orders, QuickBooks makes it, and the customer gets it by email (QuickBooks' own, Review & Pay) and by text with the pay link. Then the reminders run (rows in invoice_nudge_plans: a text at 2 h, a call card on the office at 4 h, then day 1 · 3 · 7 · 14 · 21, the past-due text at 30), paid closes it. Not clean = the card is red and waits for a person. Needs the QuickBooks switch below and the chain's texts above to go all the way; OFF = the Invoice card waits for Approve, as before.</span><button class="btn sm ${sw('invoice_auto')?.is_on ? 'ok' : ''}" data-switch="invoice_auto">${sw('invoice_auto')?.is_on ? 'ON — turn off' : 'OFF — turn on'}</button></div>
      <div class="switch"><span><b>QuickBooks makes the customer's invoice</b> (313 · 381, <code>qb_invoices</code>) — every recorded invoice becomes the real QuickBooks invoice within 15 minutes: the customer named the way the books already read ("job number - street"), the lines, due on receipt, the pay link read back, the PDF on the file, QuickBooks' email sent. Then the balance is read back so paid happens by itself. OFF: the office makes it in QuickBooks as today and types the number.</span><button class="btn sm ${sw('qb_invoices')?.is_on ? 'ok' : ''}" data-switch="qb_invoices">${sw('qb_invoices')?.is_on ? 'ON — turn off' : 'OFF — turn on'}</button></div>
      <div class="switch"><span><b>After hours</b> — 6 PM to 7 AM, a customer text gets "Got it, {first} — {owner} will text you first thing in the morning," once per night.</span><button class="btn sm ${sw('after_hours_reply')?.is_on ? 'ok' : ''}" data-switch="after_hours_reply">${sw('after_hours_reply')?.is_on ? 'ON — turn off' : 'OFF — turn on'}</button></div>
      <div class="switch"><span><b>The crew's text</b> — the moment the install date is set, the crew lead's phone gets the work order's link by text from the brand's line, Spanish first (347). The link is the crew's room for that job: AQUÍ · FOTOS · LISTO and a line to the supervisor, every tap on the customer's file. OFF: the link goes by email only. Needs a phone on the crew's card.</span><button class="btn sm ${sw('crew_link_text')?.is_on ? 'ok' : ''}" data-switch="crew_link_text">${sw('crew_link_text')?.is_on ? 'ON — turn off' : 'OFF — turn on'}</button></div>
      <div class="switch"><span><b>Supplier bills → QuickBooks</b> — an approved Bill landed card becomes the QuickBooks bill (vendor, invoice number as the Ref #, the job; duplicate-guarded so a bill Claudette already keyed is never doubled). OFF: the card only records the decision.</span><button class="btn sm ${sw('bills_to_qb')?.is_on ? 'ok' : ''}" data-switch="bills_to_qb">${sw('bills_to_qb')?.is_on ? 'ON — turn off' : 'OFF — turn on'}</button></div>
      <div class="switch"><span><b>Supplier bills → Contractors Cloud</b> — the approved bill written into CC with the Ref # filled. No CC bill-create door is confirmed yet, so OFF the card hands the office the fields to paste, in CC's order.</span><button class="btn sm ${sw('bills_to_cc')?.is_on ? 'ok' : ''}" data-switch="bills_to_cc">${sw('bills_to_cc')?.is_on ? 'ON — turn off' : 'OFF — turn on'}</button></div>
      <div class="switch"><span><b>Asks → Contractors Cloud tasks</b> (382, <code>asks_to_cc</code>) — the old knows: when an ask settles here, the matching CC task on that project is ticked with a comment (who, when, the input), and the steps the chain passed (the did-it-sell calls, the homeowner follow-ups, add-the-supervisor) are ticked as passed. The money steps (upload contract and sales order, record NOC, invoice, close-out) get a project note and stay yours until their lanes are on. OFF: every tick is held and counted, CC untouched. ON drains what was held.</span><button class="btn sm ${sw('asks_to_cc')?.is_on ? 'ok' : ''}" data-switch="asks_to_cc">${sw('asks_to_cc')?.is_on ? 'ON — turn off' : 'OFF — turn on'}</button></div>
      <div class="switch" data-tour="mirror-switch"><span><b>New leads → Contractors Cloud</b> (381) — a lead born at the New lead door is written into CC by the machine within the hour: the account, the project (Lead, the brand's default event and workflow, the lead source, the rep as primary) and the Sales Appointment on the rep, so CC puts it on his Google Calendar the way it does today; then the file takes CC's ids so the sync keeps one file. OFF: the file says "not in Contractors Cloud yet" and Copy for CC hands the office the fields in CC's order; "Typed into CC" records that a person did it.</span><button class="btn sm ${sw('cc_mirror')?.is_on ? 'ok' : ''}" data-switch="cc_mirror">${sw('cc_mirror')?.is_on ? 'ON — turn off' : 'OFF — turn on'}</button></div></div>`) : ''}
      <div class="switch"><span><b>The packet on the estimate page</b> — the disclosures and the county or city forms for the address appear under the customer's signature, one tap each, the same signature covers them — the permit application and the hold harmless included, nothing notarized on the link. Oasis signs the contract alone. The Notice of Commencement is the one form not on it (the switch below). Off = the estimate page is exactly as it was.</span><button class="btn sm ${sw('esign_packet')?.is_on ? 'ok' : ''}" data-switch="esign_packet">${sw('esign_packet')?.is_on ? 'ON' : 'off'}</button></div>
      <div class="switch" data-tour="noc-switch"><span><b>The NOC note to the customer — OFF: the NOC is the rep's</b> (Kevin, 17 Sep). The Notice of Commencement is out of the customer's process: nothing on the link, no email, no texts. The rep gets it signed by the owner before a notary and uploads it; the file reminds the rep on days 2, 5, 9, 14, 21 and 30 (rows in noc_rep_nag_steps). It holds nothing — the permit and the material open the minute they sign. ON would email the customer the filled NOC with a photo link and text them until it is back. Leave it off.</span><button class="btn sm ${sw('noc_notarize')?.is_on ? 'ok' : ''}" data-switch="noc_notarize">${sw('noc_notarize')?.is_on ? 'ON — turn off' : 'OFF'}</button></div>
      <div class="switch"><span><b>The order to the supplier</b> — the moment a calculator job's material releases (paperwork official, deposit in), the order goes by email to the supplier the products point at (FIS, Merchants, Ideal, Iron World, Statewide, Home Depot), from Jonathan's seat, the calculator's material order attached, the bill of materials in the body, Gio and the watchers copied. Wood waits for the permit. Gio's approval or a product not in the guide keeps it a human send. The supplier's order number still closes the ask. Off = the ask says "Send to supplier"; Jonathan presses it on the file.</span><button class="btn sm ${sw('material_to_supplier')?.is_on ? 'ok' : ''}" data-switch="material_to_supplier">${sw('material_to_supplier')?.is_on ? 'ON — turn off' : 'OFF — turn on'}</button></div>
      <div class="switch"><span><b>The warranty deed</b> — when the county lists a different person than the one who signed, the customer is emailed for a picture of the deed with a photo link (the rep, Sam and the watchers copied) and texted from the rep's seat until it lands (day 1, 3, 6, 10, 15, 21; the rep and the office pushed along the way; rows in noc_nudge_plans under "deed"). The deed ask on the office holds nothing. A company, a trust or an HOA as the owner: the office checks Sunbiz first and nobody is emailed unless a seat presses Request the deed (413, Sam). Off = the ask still opens; a seat presses Request the deed on the Property card.</span><button class="btn sm ${sw('deed_request')?.is_on ? 'ok' : ''}" data-switch="deed_request">${sw('deed_request')?.is_on ? 'ON — turn off' : 'OFF — turn on'}</button></div>
    <div class="card" id="cc-workflow"></div>`;

  workflowCard(root);
  wireBills(root, { after: () => reload(true) });   // 365/369: the Bills queue's taps
  root.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { filter = b.dataset.f; renderOffice(root); }));
  root.querySelectorAll('[data-lane]').forEach((b) => (b.onclick = () => { laneF = b.dataset.lane; filter = 'all'; renderOffice(root); }));
  root.querySelectorAll('[data-old]').forEach((b) => (b.onclick = () => { oldOnly = !oldOnly; renderOffice(root); }));
  root.querySelectorAll('[data-void]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); const a = state.queue.find((q) => q.ask_id === b.dataset.void); if (a) voidDialog(a, () => reload(true)); }));
  root.querySelectorAll('[data-hand]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); const a = state.queue.find((q) => q.ask_id === b.dataset.hand); if (a) handDialog(a, { repId: a.rep_id, repName: a.rep_name }, () => reload(true)); }));
  root.querySelectorAll('[data-settle]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); const a = state.queue.find((q) => q.ask_id === b.dataset.settle); if (a) settleDialog(a, (r, proof) => { reload(true); offerNextWord(nextWordFor(a, proof)); }); }));
  root.querySelectorAll('[data-switch]').forEach((b) => (b.onclick = async () => {
    const cur = sw(b.dataset.switch)?.is_on;
    const ask = { cc_mirror: 'Turn the mirror ON? From now on every lead born here is written into Contractors Cloud by the machine within the hour (the account, the project, the Sales Appointment on the rep) and linked back to this file. The box\'s CC token must carry write scope; a refused row goes red on the file and the office can still paste it.', invoice_auto: 'Turn the invoice ON? From now on, every sign-off with the photos and the paperwork right becomes an invoice by itself: typed from the signed estimate, minus the deposit, plus the signed change orders; the seat is pushed and has until the next 15-minute pass to press Hold. With the QuickBooks switch on it then goes to the customer by email and text and the reminders run.', qb_invoices: 'Turn QuickBooks ON for the customer\'s invoices? From now on every recorded invoice is created in QuickBooks within 15 minutes, the customer gets QuickBooks\' own email with Review & Pay, and the balance is read back so paid happens by itself.', appt_confirm: 'Turn the confirmation text ON? The next new appointments get a text from the main line within 5 minutes.', text_clock: 'Turn the answer clock ON? Watchers get pinged 15 minutes after any customer text from now on.', office_machine_texts: 'Turn the chain\'s texts ON? From now on a settled permit, schedule, invoice and payment texts the customer from the main line.', after_hours_reply: 'Turn the after-hours holding text ON?', crew_link_text: 'Turn the crew\'s text ON? From now on, the moment an install date is set, the crew lead\'s phone gets the work order link by text from the brand\'s line (Spanish first). Crews with no phone on their card still get it by email only.', bills_to_qb: 'Turn supplier bills → QuickBooks ON? From now on an approved Bill landed card is created in QuickBooks within the hour, duplicate-guarded on vendor + invoice number.', bills_to_cc: 'Turn supplier bills → Contractors Cloud ON? Nothing writes into CC yet (no bill-create door confirmed); the card only stops showing the fields to paste. Leave it OFF until that door exists.', deed_request: 'Turn the warranty deed request ON? When the county lists a different owner than the signer, the customer is emailed for a picture of the deed and texted until it lands; Sam and the rep are copied.', material_to_supplier: 'Turn the order to the supplier ON? From now on, the moment a calculator job\'s material releases, the order is emailed to the supplier from Jonathan\'s seat with the calculator\'s order attached (Gio and the watchers copied). Wood still waits for the permit; Gio\'s approval or an unknown product stays a human send.', noc_notarize: 'Turn the customer NOC note ON? Kevin pulled the NOC out of the customer\'s process on 17 Sep — the rep gets it. ON = the customer is emailed the filled NOC with a photo link and texted from the main line until it is back.' };
    const ok = confirm(cur ? 'Turn it off?' : (ask[b.dataset.switch] || 'Turn it on?'));
    if (!ok) return;
    try { await setSwitch(b.dataset.switch, !cur); toast(cur ? 'Off' : 'On'); await reload(true); } catch (e) { toast(e.message, 'err'); }
  }));
}

function row(q) {
  const noc = q.ask_type === 'CONTRACT_DOC' && q.doc_kind === 'noc';   // 367: the customer's errand — the machine texts them; never red on the office
  const red = !noc && q.open_min > (LINE_MIN[q.ask_type] || 1e9);
  const green = q.ask_type === 'INVOICE';
  return `<div class="ask ${green ? 'green' : ''}" style="cursor:pointer" onclick="__peek('${esc(q.customer_id)}')">
    <span class="chip ${green ? 'st-green' : 'st-blue'}"><i class="ai">${iconForAsk(q)}</i>${esc(askLabel(q))}</span>
    <div><b>${esc(personName(q.customer_name))}</b> · ${esc(brandName(q.cc_company_id))}${q.lane === 'SUPER' ? ' · <span class="chip st-orange">field</span>' : ''} · ${esc(money(q.job_value))}<div class="who">${noc ? 'with the customer to notarize · the machine texts them · ' : ''}${esc(q.note || '')} · opened by ${esc(q.opened_by_name || 'the file')} · ${esc(q.assignee_name || 'unassigned')} holds it</div></div>
    <span class="mono ${red ? 'red' : ''}">${esc(mins(q.open_min))}</span>
    <span class="chip ${STAGES[q.stage]?.cls || 'st-ink'}">${esc(stageLabel(q.stage))}</span>
    <div style="display:flex;gap:6px" onclick="event.stopPropagation()"><button class="btn sm" onclick="__peek('${esc(q.customer_id)}')">Open file</button><button class="btn sm" data-hand="${esc(q.ask_id)}" title="Hand this ask to another seat">Hand to…</button>${canVoid(q) ? `<button class="btn sm" data-void="${esc(q.ask_id)}" title="Not needed on this job — off the list, with the reason on the file">Not needed</button>` : ''}<button class="btn sm ok" data-settle="${esc(q.ask_id)}">${green ? 'Invoiced' : 'Done'}</button></div>
  </div>`;
}

/* 135 (Jess, 18 Sep 1:51 PM: "I can also jump in and close tasks that arent needed so no one is overwhelmed"): Not needed —
   the ask comes off the list with a reason, the file says who and why, nothing else opens (ask_void, migration 410). */
export function voidDialog(a, after) {
  openModal({ title: 'Not needed on this job', submitLabel: 'Take it off the list', body: `
    <div class="note" style="margin-bottom:10px">${a.customer_name ? '<b>' + esc(personName(a.customer_name)) + '</b> · ' : ''}${esc(askLabel(a))}${a.note ? ' · ' + esc(a.note) : ''}</div>
    <div class="field"><label>Why — it goes on the file</label><input name="reason" placeholder="no HOA here · CC has it · done another way" required minlength="3"/></div>
    <div class="note">This does not open the next step. If the job needs what comes after this ask, press Done instead.</div>`,
    onSubmit: async (f) => {
      if (isDemo()) { toast('Demo — nothing is saved'); return; }
      await voidAsk(a.ask_id || a.id, f.reason.value.trim());
      toast('Off the list');
      after?.();
    } });
}

/* The settle dialog — one shape per proof kind. Files go to the job-docs
   bucket first (lane in the path, so storage RLS applies), then ask_settle
   gets their paths. */
export function settleDialog(a, after) {
  const kind = a.proof_kind || 'tap';
  const job = { cc_company_id: a.cc_company_id, cc_project_id: a.cc_project_id };
  const label = a.proof_label || 'Tap to close';
  let body = `<div class="note" style="margin-bottom:10px"><b>${esc(personName(a.customer_name))}</b> · ${esc(askLabel(a))}${a.note ? ' · ' + esc(a.note) : ''}</div>`;
  if (kind === 'file' || kind === 'photos') body += `<div class="field"><label>${esc(label)}</label><input type="file" name="files" ${kind === 'photos' ? 'accept="image/*" ' : ''}multiple ${a.waivable ? '' : 'required'}/></div>`;   // 130: a waivable row settles on the words alone (the browser refused the form without a file)
  if (kind === 'number' || kind === 'text') body += `<div class="field"><label>${esc(label)}</label><input name="value" required/></div>${a.ask_type === 'INVOICE' || a.ask_type === 'PAYMENT' ? '<div class="field"><label>Payment link for the customer (optional)</label><input name="link" placeholder="https://…"/></div>' : ''}<div class="field"><label>Attach the document (optional)</label><input type="file" name="files" multiple/></div>`;
  if (kind === 'date') body += `<div class="field"><label>${esc(label)}</label><input type="date" name="value" required/></div><div class="field"><label>Crew and note</label><input name="note" placeholder="Crew Ortiz · two days"/></div>`;
  if (kind === 'tap') body += `<div class="note">This one closes on your word.</div>`;
  if (a.waivable) body += `<div class="field" style="margin-top:14px"><label>Or: not required, because…</label><input name="waived" placeholder="leave blank if you have the document"/></div>`;
  openModal({ title: kind === 'tap' ? 'Close it' : 'Done — with the proof', submitLabel: a.ask_type === 'INVOICE' ? 'Invoiced' : 'Done', body,
    onSubmit: async (f) => {
      const proof = {};
      const waived = f.waived?.value?.trim();
      if (waived) proof.waived = waived;
      else {
        if (f.value) proof.value = f.value.value.trim();
        if (f.note?.value) proof.note = f.note.value.trim();
        if (f.link?.value?.trim()) proof.link = f.link.value.trim();
        const files = f.files?.files ? Array.from(f.files.files) : [];
        if ((kind === 'file' || kind === 'photos') && files.length < (a.proof_min || 1)) throw new Error(`Needs ${a.proof_min || 1} file${(a.proof_min || 1) > 1 ? 's' : ''}: ${label}`);
        if (files.length) {
          proof.files = [];
          for (const file of files) proof.files.push(await uploadDoc(job, a.lane || 'OFFICE', file));
        }
      }
      const r = await settleAsk(a.ask_id, proof);
      const opened = (r?.opened || []).length, texted = (r?.texts || []).length;
      toast(`Done${opened ? ` · ${opened} next step${opened > 1 ? 's' : ''} opened` : ''}${texted ? ' · the customer was texted' : ''}`);
      after?.(r, proof);
    } });
}

/* ── the workflow map ────────────────────────────────────────────────────────
   Contractors Cloud's own step list, brand by brand, beside what each step
   became here: an ask with a clock, a piece of the paperwork checklist, a
   hand-off, a clock the machine keeps, something the app already did, or a
   step that simply went away. The rows are `cc_workflow_steps` — Kevin and
   Jess edit the note column in place; nothing here is code. Read once per
   page load and kept in the module, so the filter buttons never re-fetch. */
let STEPS = null, stepsLoading = false, stepsErr = null, stepsCc = '1461';
const BECOMES = {
  ask:       ['st-gold',   'ask'],
  checklist: ['st-blue',   'checklist'],
  handoff:   ['st-green',  'hand-off'],
  clock:     ['st-orange', 'the clock'],
  exists:    ['st-ink',    'already here'],
  dropped:   ['st-ink',    'dropped'],
};

async function loadSteps() {
  if (isDemo()) return DEMO_STEPS.slice();
  return api.page('cc_workflow_steps?select=*&order=cc_company_id.asc,ord.asc');
}

function workflowCard(root) {
  const box = root.querySelector('#cc-workflow');
  if (!box) return;
  const head = '<div class="kicker">The workflow · every Contractors Cloud step and what it became here</div>'
    + '<div class="small">CC\'s checklist, step for step. Gold is an ask with a clock on it; blue is a piece of the paperwork checklist; green is a hand-off; orange is a follow-up the machine keeps; grey was already here, or went away.</div>';
  if (STEPS == null) {
    box.innerHTML = head + '<div class="empty">Reading the map…</div>';
    if (!stepsLoading) {
      stepsLoading = true;
      loadSteps()
        .then((rows) => { STEPS = rows; stepsErr = null; })
        .catch((e) => { STEPS = []; stepsErr = e?.message || 'Could not read cc_workflow_steps'; })
        .finally(() => { stepsLoading = false; workflowCard(root); });
    }
    return;
  }
  const brands = Object.keys(BRAND_BY_CC);
  if (!brands.includes(stepsCc)) stepsCc = brands[0];
  const forCc = (cc) => STEPS.filter((s) => String(s.cc_company_id) === cc);
  const rows = forCc(stepsCc).slice().sort((a, b) => (Number(a.ord) || 0) - (Number(b.ord) || 0));
  const canEdit = ['owner', 'admin'].includes(state.me?.role);

  box.innerHTML = head
    + '<div class="subs" style="margin:2px 0 4px">'
    + brands.map((cc) => `<button class="sub ${cc === stepsCc ? 'on' : ''}" data-cc="${esc(cc)}">${esc(BRAND_BY_CC[cc].short)} · ${forCc(cc).length}</button>`).join('')
    + (canEdit ? '<span class="small" style="margin-left:auto">Click a note to rewrite it — it saves when you click away.</span>' : '')
    + '</div>'
    + (rows.length
      ? '<div class="wrap"><table><thead><tr><th>#</th><th>CC step</th><th>Becomes</th><th>The ask</th><th>Lane</th><th>Who</th><th>What changed</th></tr></thead><tbody>'
        + rows.map((s) => stepRow(s, canEdit)).join('') + '</tbody></table></div>'
      : `<div class="empty">${esc(stepsErr || 'No steps mapped for ' + BRAND_BY_CC[stepsCc].short + ' yet.')}</div>`);

  box.querySelectorAll('[data-cc]').forEach((b) => (b.onclick = () => { stepsCc = b.dataset.cc; workflowCard(root); }));
  box.querySelectorAll('[data-note-ord]').forEach((cell) => {
    cell.dataset.was = cell.textContent;
    cell.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); cell.blur(); } if (e.key === 'Escape') { cell.textContent = cell.dataset.was; cell.blur(); } });
    cell.onblur = async () => {
      const note = cell.textContent.trim();
      if (note === (cell.dataset.was || '').trim()) return;
      const cc = cell.dataset.noteCc, ord = cell.dataset.noteOrd;
      if (isDemo()) { cell.textContent = cell.dataset.was; toast('Demo — nothing is saved', 'err'); return; }
      try {
        await api.patch(`cc_workflow_steps?cc_company_id=eq.${encodeURIComponent(cc)}&ord=eq.${encodeURIComponent(ord)}`, { note });
        const hit = STEPS.find((s) => String(s.cc_company_id) === cc && String(s.ord) === ord);
        if (hit) hit.note = note;
        cell.dataset.was = note;
        toast('Saved');
      } catch (e) { cell.textContent = cell.dataset.was; toast(e.message, 'err'); }
    };
  });
}

function stepRow(s, canEdit) {
  const b = BECOMES[s.becomes] || ['st-ink', s.becomes || '—'];
  const gone = s.becomes === 'dropped';
  const stepCell = `<b${gone ? ' style="text-decoration:line-through;color:var(--dimmer)"' : ''}>${esc(s.cc_subject || '')}</b>`
    + (s.cc_count != null ? ` <span class="mono dimmer">${esc(s.cc_count)}</span>` : '');
  const ask = s.ask_type || s.doc_kind ? esc(askLabel({ ask_type: s.ask_type, doc_kind: s.doc_kind })) : '<span class="dimmer">—</span>';
  const note = canEdit
    ? `<div class="note" contenteditable="true" data-note-cc="${esc(s.cc_company_id)}" data-note-ord="${esc(s.ord)}" style="min-height:17px;outline:none;border-bottom:1px dashed var(--line)">${esc(s.note || '')}</div>`
    : `<span class="note">${esc(s.note || '')}</span>`;
  return `<tr>
    <td class="mono dimmer">${esc(s.ord)}</td>
    <td>${stepCell}</td>
    <td><span class="chip ${b[0]}"${gone ? ' style="text-decoration:line-through"' : ''}>${esc(b[1].toUpperCase())}</span></td>
    <td>${ask}</td>
    <td>${s.lane ? '<span class="chip">' + esc(s.lane) + '</span>' : '<span class="dimmer">—</span>'}</td>
    <td class="small">${esc(s.owner_rule || '—')}</td>
    <td style="min-width:220px">${note}</td>
  </tr>`;
}

/* 417: THE HANDOFF — every customer a seat walked to the next department and who has them now, oldest first (gospel 37:
   nobody says "call the office"). GOT IT is the seat saying so to the faces on the conversation; Done on the ask settles it. */
const DEPT_WORD = { office: 'the office', schedule: 'scheduling', production: 'the supervisor', billing: 'billing', sales: 'the rep' };
async function fillHandoffs(root) {
  const box = root.querySelector('#handoffs-waiting'); if (!box) return;
  const rows = await loadHandoffsWaiting().catch(() => []);
  if (!rows.length) { box.innerHTML = ''; return; }
  const me = state.me;
  box.innerHTML = `<div class="card" data-tour="handoffs"><div class="kicker" style="color:var(--gold)">Handoffs · a customer was walked to the next department · who has them now · ${rows.length}</div><div class="rows">${rows.map((h) => `<div class="r"><span><b>${esc(h.customer_name)}</b>${h.city ? ' · ' + esc(h.city) : ''} · ${esc(brandName(String(h.cc_company_id)))} → <b>${esc(DEPT_WORD[h.to_dept] || h.to_dept)}</b> · <b>${esc((h.to_name || '').split(' ')[0])}</b> has them · ${esc((h.manager_name || '').split(' ')[0])} on it · from ${esc((h.from_name || '').split(' ')[0])}${h.what ? ' · ' + esc(h.what) : ''}${h.sms_id ? ' · <span class="verify">texted</span>' : h.text_error ? ' · <span class="red">no text: ' + esc(h.text_error) + '</span>' : ''}${h.status === 'taken' ? ' · <span class="chip ok">GOT IT</span>' : ''}</span><span style="display:flex;gap:6px;align-items:center"><span class="mono ${h.open_min > 60 ? 'red' : ''}">${esc(mins(h.open_min))}</span>${h.status === 'open' && me?.id && (h.to_id === me.id || (h.members || []).includes(me.id) || ['owner', 'admin', 'manager'].includes(me.role)) ? `<button class="btn sm ok" data-take="${esc(h.id)}" title="Tell the faces on the conversation you have this customer">Got it</button>` : ''}<button class="btn sm" data-open="${esc(h.customer_id)}">Open the file</button></span></div>`).join('')}</div><div class="small dimmer" style="margin-top:6px">The clock started when the customer was handed over. Answer them from the file — never "call the office". Done on the HANDOFF ask settles it.</div></div>`;
  box.querySelectorAll('[data-open]').forEach((a) => a.onclick = (e) => { e.preventDefault(); if (window.__peek) window.__peek(a.dataset.open); });
  box.querySelectorAll('[data-take]').forEach((b) => b.onclick = async () => { b.disabled = true; try { await handoffTake(b.dataset.take); toast('Got it — the conversation knows'); fillHandoffs(root); } catch (e) { toast(e.message, 'err'); b.disabled = false; } });
}

/* 397: the subs locked on a contract that nobody has typed into Contractors Cloud yet, oldest first (gospel 2: it shows on the room's door) */
async function fillSubLocks(root) {
  const box = root.querySelector('#sub-locks-waiting'); if (!box) return;
  const rows = await loadSubLocksWaiting().catch(() => []);
  if (!rows.length) { box.innerHTML = ''; return; }
  box.innerHTML = `<div class="card" data-tour="sublocks"><div class="kicker">Subs locked in · waiting to be typed into Contractors Cloud · ${rows.length}</div><div class="rows">${rows.map((l) => `<div class="r"><span><b>🔒 ${esc(l.sub_name)}</b> · ${money(l.amount)} · <a href="#" data-open="${esc(l.customer_id)}">${esc(l.customer_name)}</a>${l.city ? ' · ' + esc(l.city) : ''} · ${esc(brandName(String(l.cc_company_id)))} <span class="dimmer">· ${esc((l.locked_by_name || '').split(' ')[0])}${l.received_at ? ' · RECIBIDO ' + esc(l.received_by || '') : l.person_id ? ' · texted' : ' · no phone'}</span></span><span class="mono ${l.open_min > 240 ? 'red' : ''}">${esc(mins(l.open_min))}</span></div>`).join('')}</div><div class="small dimmer" style="margin-top:6px">Open the file: Copy for CC has the fields, Typed into CC turns it green.</div></div>`;
  box.querySelectorAll('[data-open]').forEach((a) => a.onclick = (e) => { e.preventDefault(); if (window.__peek) window.__peek(a.dataset.open); });
}

/* 126 · 407: hand one open ask to one seat (ask_hand). The seats door still says who gets every NEW ask for a brand;
   this moves one ask that already exists. Jess, 18 Sep: "how can we assign different tasks to different staff members." */
export function handDialog(a, ctx, after) {
  const seats = (state.seats || []).map((s) => ({ id: s.id, name: s.name, role: s.role || '' }));
  if (ctx?.repId && !seats.some((s) => s.id === ctx.repId)) seats.push({ id: ctx.repId, name: ctx.repName || 'the rep', role: 'sales · the rep on this job' });
  const list = seats.filter((s) => s.id !== a.assignee_id).sort((x, y) => x.name.localeCompare(y.name));
  openModal({ title: `Hand ${askLabel(a)} to…`, submitLabel: 'Hand it', body: `
      <div class="field"><label>Who</label><select name="to" required><option value="">— pick the seat —</option>${list.map((s) => `<option value="${esc(s.id)}">${esc(s.name)} · ${esc(s.role)}</option>`).join('')}</select></div>
      <div class="field"><label>A word for them (optional)</label><input name="note" placeholder="you know this customer · needs a call before 8"/></div>
      <div class="note">${esc(a.assignee_name || 'Nobody')} holds it now. The new holder gets a push and their name on the row; the clock keeps running. Anyone in the office can still press Done.</div>`,
    onSubmit: async (fm) => { if (!fm.to.value) throw new Error('Pick the seat'); await handAsk(a.ask_id || a.id, fm.to.value, fm.note.value.trim() || null); toast('Handed · they get a push'); if (after) after(); } });
}
