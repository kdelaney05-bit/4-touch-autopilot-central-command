// A fictional book for ?demo=1 — the mockups' sample customers, same shape as
// the live views. 555 phones and invented streets, so a tap can never reach
// a real person. Every write is refused by book.js.
const now = Date.now();
const ago = (h) => new Date(now - h * 3600e3).toISOString();
const rep = (id, name, role = 'sales') => ({ id, name, role });
const SEATS = [rep('k', 'Kevin Delaney', 'owner'), rep('g', 'Gio Calderin', 'owner'), rep('jc', 'Jessica Coley', 'manager'), rep('sam', 'Samantha White', 'office'),
  rep('laura', 'Laura Schepp', 'office'), rep('jon', 'Jonathan Garcia', 'office'), rep('luis', 'Luis Gonzalez', 'manager'), rep('obed', 'Obed Santiago', 'manager'), rep('ger', 'Gerardo Costas', 'manager')];
const me = SEATS[0];

const job = (o) => ({ job_id: o.id, cc_project_id: 'P' + o.id, cc_company_id: o.cc || '1461', customer_id: 'c' + o.id, customer_name: o.name, customer_phone: '(321) 555-0' + String(100 + Number(o.id.replace(/\D/g, ''))).slice(-3),
  title: o.title, fin_sold_amount: o.amt, contract_signed_at: ago(o.signedH ?? 200), completed_at: o.done ? ago(2) : null, rep_id: o.rep, rep_name: o.repName,
  stage: o.stage, stage_since: ago(o.sinceH ?? 48), days_in_stage: +((o.sinceH ?? 48) / 24).toFixed(1), owner_id: o.owner, owner_name: SEATS.find((s) => s.id === o.owner)?.name ?? null,
  supervisor_id: o.sup ?? null, open_asks: o.asks ?? 0, last_inbound_at: o.lastIn ? ago(o.lastIn) : null, last_inbound_body: o.lastBody ?? null, waiting_min: o.wait ?? null });

const BOARD = [
  job({ id: 'j1', name: 'Whitfield, Mark', title: 'Vinyl privacy 6\'', amt: 14200, rep: 'r1', repName: 'Ron Seidel', stage: 'sold_office', sinceH: 101, owner: 'sam', asks: 1, lastIn: 2, lastBody: 'when do you start?', wait: 118 }),
  job({ id: 'j2', name: 'Nguyen, Linh', title: 'Vinyl privacy, 210 ft', amt: 22900, rep: 'r1', repName: 'Ron Seidel', stage: 'sold_office', sinceH: 77, owner: 'sam', asks: 1, lastIn: 26, lastBody: 'any update on the permit?', wait: 1560 }),
  job({ id: 'j3', name: 'Reed, Dana', title: 'Aluminum + gate', amt: 14200, rep: 'r1', repName: 'Ron Seidel', stage: 'field_complete', sinceH: 0.3, owner: 'laura', sup: 'obed', asks: 1, lastIn: 0.1, lastBody: 'Gate looks great, when do they finish the last section by the shed?', wait: 6 }),
  job({ id: 'j4', name: 'Alvarez, Rosa', title: 'Shadowbox 8\', 140 ft', amt: 12600, rep: 'r2', repName: 'Travis Janke', stage: 'production', sinceH: 48, owner: 'obed', sup: 'obed', asks: 2, lastIn: 0.6, lastBody: 'Permit sign is up, thank you' }),
  job({ id: 'j5', name: 'Okafor, Sam', title: 'Shingle re-roof', amt: 18900, cc: '1563', rep: 'r3', repName: 'Eric Payne', stage: 'field_complete', sinceH: 26, owner: 'laura', sup: 'ger', asks: 1, lastIn: 30, lastBody: 'thank you all' }),
  job({ id: 'j6', name: 'Marchetti, Dave', title: 'Paver patio + lighting', amt: 31400, cc: '1560', rep: 'r4', repName: 'Mike LeRoy', stage: 'production', sinceH: 120, owner: 'luis', sup: 'luis', asks: 0, lastIn: 80, lastBody: 'lights look amazing' }),
  job({ id: 'j7', name: 'Kowalski, Jan', title: 'Chain link, 300 ft', amt: 16750, rep: 'r2', repName: 'Travis Janke', stage: 'sold_office', sinceH: 3, owner: 'sam', asks: 1, lastIn: 1.3, lastBody: 'Thursday instead of Wednesday?', wait: 78 }),
  job({ id: 'j8', name: 'Pestana, Luis', title: 'PVC privacy + 2 gates', amt: 9900, rep: 'r5', repName: 'Haakon Endreson', stage: 'production', sinceH: 36, owner: 'obed', sup: 'obed', asks: 1, lastIn: 6, lastBody: 'crew is here, thanks' }),
  job({ id: 'j9', name: 'Brooks, Terry', title: 'Gutter guards + fascia', amt: 9300, cc: '1563', rep: 'r3', repName: 'Eric Payne', stage: 'sold_office', sinceH: 5, owner: 'laura', asks: 1 }),
  job({ id: 'j10', name: 'Sandoval, Rick', title: 'Aluminum pool fence', amt: 11400, rep: 'r2', repName: 'Travis Janke', stage: 'sold_office', sinceH: 57, owner: 'sam', asks: 1 }),
  job({ id: 'j11', name: 'Reyes, Ana', title: 'Vinyl privacy', amt: 6400, rep: 'r5', repName: 'Haakon Endreson', stage: 'invoiced', sinceH: 30, owner: 'laura', sup: 'obed', asks: 1, lastIn: 5, lastBody: 'how do I pay the balance?', wait: 312 }),
];

const ask = (id, jobId, lane, type, note, assignee, state, openedH, doc, closedH, mins) => ({ ask_id: id, id, thread_id: 't' + jobId, lane, ask_type: type, doc_kind: doc ?? null, note, state, opened_at: ago(openedH), closed_at: closedH != null ? ago(closedH) : null, minutes_to_close: mins ?? null,
  assignee_id: assignee, assignee_name: SEATS.find((s) => s.id === assignee)?.name, opened_by_name: 'Ron Seidel', open_min: Math.round(openedH * 60),
  cc_project_id: 'P' + jobId, cc_company_id: BOARD.find((b) => b.job_id === jobId)?.cc_company_id, customer_id: 'c' + jobId, customer_name: BOARD.find((b) => b.job_id === jobId)?.customer_name, job_value: BOARD.find((b) => b.job_id === jobId)?.fin_sold_amount, job_id: jobId, stage: BOARD.find((b) => b.job_id === jobId)?.stage,
  proof_label: ({ PERMIT: 'Permit number (attach the permit if you have it)', INVOICE: 'Billdu / QuickBooks invoice number', SURVEY: 'Locate ticket number, or why none is needed', PAYMENT: 'How it was paid', CONTRACT_DOC: 'The document', SCHEDULE: 'Start date — and the crew, in the note', COMPLETION_SIGNOFF: 'Finished-work photos (3 or more)', MATERIAL: 'PO / order confirmation number' })[type] || 'Tap to close',
  proof_kind: ({ PERMIT: 'number', INVOICE: 'number', SURVEY: 'text', PAYMENT: 'text', CONTRACT_DOC: 'file', SCHEDULE: 'date', COMPLETION_SIGNOFF: 'photos', MATERIAL: 'text' })[type] || 'tap', proof_min: type === 'COMPLETION_SIGNOFF' ? 3 : 1, waivable: type === 'CONTRACT_DOC' || type === 'SURVEY' });

const QUEUE = [
  ask('a1', 'j2', 'OFFICE', 'PERMIT', 'Paperwork complete — pull the permit', 'sam', 'OPEN', 76),
  ask('a2', 'j10', 'OFFICE', 'PERMIT', 'Paperwork complete — pull the permit', 'sam', 'OPEN', 57),
  ask('a3', 'j3', 'OFFICE', 'INVOICE', 'Field complete, photos on the file — invoice it', 'laura', 'OPEN', 0.3),
  ask('a4', 'j7', 'OFFICE', 'CONTRACT_DOC', 'Property survey', 'sam', 'OPEN', 2.8, 'survey'),
  ask('a5', 'j11', 'OFFICE', 'PAYMENT', 'Invoice sent — collect', 'laura', 'OPEN', 5.2),
  ask('a6', 'j9', 'OFFICE', 'CONTRACT_DOC', 'HOA approval', 'laura', 'OPEN', 4.4, 'hoa'),
  ask('a7', 'j5', 'OFFICE', 'INVOICE', 'Field complete, photos on the file — invoice it', 'laura', 'OPEN', 25),
  ask('a8', 'j1', 'OFFICE', 'SCHEDULE', 'Locate done — call the customer and set the day', 'jon', 'OPEN', 96),
];

const CLOCK = BOARD.filter((b) => b.waiting_min).map((b) => ({ text_id: 'tx' + b.job_id, customer_id: b.customer_id, customer_name: b.customer_name, phone: b.customer_phone, occurred_at: b.last_inbound_at, body: b.last_inbound_body, waiting_min: b.waiting_min, job_id: b.job_id, cc_company_id: b.cc_company_id, stage: b.stage, owner_id: b.owner_id, owner_name: b.owner_name, watcher_id: 'jc' }));

function book() {
  return { me: { ...me, manages_company_id: null }, seats: SEATS, stageSeats: [], board: BOARD, queue: QUEUE, clock: CLOCK,
    switches: [{ key: 'appt_confirm', is_on: false }, { key: 'text_clock', is_on: false }],
    lines: [{ line_e164: '+13218061995', cc_company_id: '1461', label: 'Liberty Fencing · 321', campaign_ok: true }, { line_e164: '+13862766898', cc_company_id: '1461', label: 'Liberty Fencing · 386', campaign_ok: true }], warnings: ['DEMO — a fictional book; nothing is saved'] };
}

function file(customerId) {
  const b = BOARD.find((x) => x.customer_id === customerId) || BOARD[2];
  const t = (h, dir, body, ext, feed) => ({ id: 'm' + h + body.length, direction: dir, body, occurred_at: ago(h), uvoice_ext: ext ?? null, feed_source: feed || 'cloudmessage', has_media: false });
  const texts = b.job_id === 'j3' ? [
    t(24 * 24, 'outbound', 'Hi Dana, this is Liberty Fencing. Your estimate is booked for Thu, Aug 21 at 2:00 PM with Ron. Reply here anytime.\nReply STOP to stop, HELP for more information.', null, 'machine'),
    t(22 * 24, 'outbound', 'Thank you for having me out today, Dana. The estimate is on its way to your email. Text me here with anything. — Ron', 152),
    t(10 * 24, 'outbound', 'Hi Dana, Sam at Liberty Fencing. Your permit is approved and the survey stakes are in. Obed, our supervisor, will text you the start day.', 102),
    t(3 * 24, 'outbound', 'Good morning Dana, Obed with Liberty Fencing. Crew Ortiz starts Friday at 7:30, two days. Gate goes in day two.', 158),
    t(3 * 24 - 0.2, 'inbound', 'Great, the side gate will be unlocked.'),
    t(0.3, 'outbound', 'All done, Dana. 6 photos are on your file. Laura in our office will send the invoice today. Thank you for choosing us. — Obed', 158),
    t(0.1, 'inbound', 'Gate looks great, when do they finish the last section by the shed?'),
  ] : [t(b.job_id === 'j1' ? 2 : 26, 'inbound', b.last_inbound_body || 'Hi, checking in.')];
  const asks = QUEUE.filter((a) => a.job_id === b.job_id).concat(b.job_id === 'j3' ? [
    ask('d1', 'j3', 'OFFICE', 'CONTRACT_DOC', 'Signed contract', 'sam', 'DONE', 21 * 24, 'contract', 20 * 24, 240),
    ask('d2', 'j3', 'OFFICE', 'PERMIT', 'Paperwork complete — pull the permit', 'sam', 'DONE', 20 * 24, null, 11 * 24, 41),
    ask('d3', 'j3', 'OFFICE', 'SURVEY', 'Permit in — schedule the locate', 'sam', 'DONE', 11 * 24, null, 9 * 24, 1560),
    ask('d4', 'j3', 'SUPER', 'MATERIAL_REQUEST', '2 gate kits · Palm Bay yard', 'obed', 'DONE', 2 * 24, null, 2 * 24 - 0.7, 40),
    ask('d5', 'j3', 'SUPER', 'COMPLETION_SIGNOFF', 'Sign off when the field is complete — photos required', 'obed', 'DONE', 3 * 24, null, 0.3, 4260),
  ] : []);
  const messages = b.job_id === 'j3' ? [
    { id: 'sm1', lane: 'OFFICE', author_name: 'Samantha White', body: 'Samantha White settled permit in 41 min · 26-04812', is_system: true, created_at: ago(11 * 24) },
    { id: 'sm2', lane: 'SUPER', author_name: 'Obed Santiago', body: 'took the job', is_system: true, created_at: ago(3 * 24) },
    { id: 'sm3', lane: 'SUPER', author_name: 'Obed Santiago', body: 'Obed Santiago settled completion signoff in 2.9 d', is_system: true, created_at: ago(0.3) },
  ] : [];
  const attachments = b.job_id === 'j3' ? [
    { id: 'at1', label: 'Signed contract', storage_path: '1461/Pj3/OFFICE/DOC/contract.pdf', created_at: ago(20 * 24), ask_id: 'd1' },
    { id: 'at2', label: 'Permit 26-04812', storage_path: '1461/Pj3/OFFICE/DOC/permit.pdf', created_at: ago(11 * 24), ask_id: 'd2' },
    ...[1, 2, 3, 4, 5, 6].map((i) => ({ id: 'ph' + i, label: 'Finished work ' + i, storage_path: '1461/Pj3/SUPER/DOC/photo' + i + '.jpg', created_at: ago(0.3), ask_id: 'd5' })),
  ] : [];
  const handoffs = b.supervisor_id ? [{ id: 'h1', kind: 'take', to_seat: b.supervisor_id, by_id: b.supervisor_id, at: ago(3 * 24), note: null }] : [];
  return { job: { ...b, sms_opt_out_at: null }, customer: { id: b.customer_id, name: b.customer_name, phone: b.customer_phone, email: null }, texts, emails: b.job_id === 'j3' ? [{ id: 'e1', occurred_at: ago(22 * 24), subject: 'Your estimate from Liberty Fencing — #E-4481', status: 'sent', source: 'rep', opened: true }] : [], thread: { id: 't' + b.job_id }, messages, asks, attachments, handoffs, outbox: [] };
}

function search(q) {
  const s = q.toLowerCase();
  return BOARD.filter((b) => b.customer_name.toLowerCase().includes(s)).map((b) => ({ id: b.customer_id, name: b.customer_name, phone: b.customer_phone })).slice(0, 8);
}

export const DEMO = { book, file, search };
