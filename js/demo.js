// A fictional book for ?demo=1 — the mockups' sample customers, same shape as
// the live views. 555 phones and invented streets, so a tap can never reach
// a real person. Every write is refused by book.js.
const now = Date.now();
const ago = (h) => new Date(now - h * 3600e3).toISOString();
const rep = (id, name, role = 'sales') => ({ id, name, role });
const SEATS = [rep('k', 'Kevin Delaney', 'owner'), rep('g', 'Gio Calderin', 'owner'), rep('jc', 'Jessica Coley', 'manager'), rep('sam', 'Samantha White', 'office'),
  rep('laura', 'Laura Schepp', 'office'), rep('jo', 'Jessica Oasis', 'manager'), rep('jon', 'Jonathan Garcia', 'office'), rep('luis', 'Luis Gonzalez', 'manager'), rep('obed', 'Obed Santiago', 'manager'), rep('ger', 'Gerardo Costas', 'manager')];
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

/* The village — the team's rooms (v_team_room's shape) and the reps' hype
   thread (hype_messages'). Fictional people saying fictional things about the
   fictional book above; nothing here is saved. */
const inits = (name) => name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
let tmN = 0;
const tm = (room, seatId, body, h, customer, reactions) => {
  const s = SEATS.find((x) => x.id === seatId) || SEATS[0];
  const c = customer ? BOARD.find((b) => b.customer_id === customer) : null;
  return { id: 'tm' + (++tmN), room, author_id: s.id, author_name: s.name, author_initials: inits(s.name), body,
    customer_id: c ? c.customer_id : null, customer_name: c ? c.customer_name : null, reply_to: null,
    created_at: ago(h), reactions: reactions || {} };
};

const ROOMS = {
  office: [
    tm('office', 'sam', 'Permit 26-04812 came back on Reed. It is on the file and the locate is called in for Wednesday.', 30, 'cj3', { '✅': 2 }),
    tm('office', 'laura', 'Nguyen is day 12 at the county. I called — they are backed up, nothing is stuck on us. Posting it here so nobody has to go digging.', 26, 'cj2', { '👍': 3 }),
    tm('office', 'jon', 'Kowalski asked for Thursday instead of Wednesday. Moved it and told Obed. Nothing else changes.', 9, 'cj7'),
    tm('office', 'sam', 'If anybody gets a survey they cannot find, ask me. I have the county portal up and it takes two minutes.', 6, null, { '🔥': 2, '👍': 4 }),
    tm('office', 'jc', 'Reyes paid the balance this morning. Laura, that one is closed.', 3, 'cj11', { '✅': 3 }),
    tm('office', 'k', 'Love seeing this. Every one of these is a customer who does not have to wonder.', 1.5, null, { '🔥': 4 }),
  ],
  production: [
    tm('production', 'obed', 'Crew Ortiz finished Reed a day early. Six photos on the file, gate swings clean.', 20, 'cj3', { '🔥': 5, '👍': 2 }),
    tm('production', 'luis', 'Anybody near Palm Bay with a spare gate kit? Alvarez needs one more and I would rather not lose the day.', 8, 'cj4'),
    tm('production', 'ger', 'I have two in the truck. Dropping them at your yard by 3.', 7.6, 'cj4', { '👍': 4 }),
    tm('production', 'luis', 'That is the village right there. Thank you Gerardo.', 7.4, null, { '🔥': 3 }),
    tm('production', 'obed', 'Pestana hit rock at post 14. We are coring instead of digging — half a day, no change order, customer already knows.', 4, 'cj8', { '👍': 2 }),
    tm('production', 'k', 'This is exactly the problem solving I want to see. Post the fix, not the complaint.', 2, null, { '🔥': 6 }),
  ],
  village: [
    tm('village', 'k', 'The village is open. Every room, every customer, everybody. If you see something you can help with, jump in — you do not need permission.', 48, null, { '🔥': 8, '👍': 5 }),
    tm('village', 'jc', 'The office is covered until 6 today. If a customer texts after that, post it here and somebody will catch it.', 22, null, { '👍': 3 }),
    tm('village', 'sam', 'Okafor\'s roof photos are gorgeous. Whoever shot those — that is marketing material.', 12, 'cj5', { '🔥': 4 }),
    tm('village', 'g', 'Marchetti sent a thank-you about the patio lighting. Passing it along: Luis, that is your crew.', 9, 'cj6', { '👍': 6, '🔥': 2 }),
    tm('village', 'laura', 'Can we invoice Brooks before the final walk, or do I wait? Asking so I do not jump the gun.', 5, 'cj9'),
    tm('village', 'obed', 'Walk is Friday morning. Hold it until I sign off and I will post here the second it is done.', 4.9, 'cj9', { '✅': 3 }),
    tm('village', 'k', 'Question asked, answered in four minutes, nobody had to go find anybody. That is the whole idea.', 4.5, null, { '🔥': 5 }),
  ],
};

let hyN = 0;
const hy = (name, body, h, img) => ({ id: 'hy' + (++hyN), author_name: name, author_initials: inits(name), author_avatar: null,
  body, image_url: img || null, reply_to: null, reply_name: null, reply_snippet: null, created_at: ago(h) });

const HYPE = [
  hy('Ron Seidel', '210 ft of vinyl signed at the table. She said three companies came out and only one called her back the same day.', 26),
  hy('Travis Janke', 'Let\'s gooo Ron. That is two this week off the same-day callback.', 25),
  hy('Eric Payne', 'Okafor signed the re-roof. Referral off the Brooks job — the follow-up text did it.', 20),
  hy('Haakon Endreson', 'Two today, both in the same neighborhood, both said they saw our yard sign.', 14),
  hy('Mike LeRoy', 'Paver patio and lighting, $31,400. Landscapes is on the map.', 7),
  hy('Kevin Delaney', 'This is the board I want to look at every morning. Nobody here is selling alone.', 3),
];

// The Pipeline room's fictional selling side: the same shape the live jobs read returns, customer embedded.
const pj = (id, name, city, rep, apptH, o = {}) => ({ id, customer_id: 'c' + id, rep_id: rep, cc_company_id: o.cc || '1461', title: o.title || 'Fence estimate', appt_starts_at: apptH == null ? null : ago(apptH), contract_signed_at: o.signedH != null ? ago(o.signedH) : null, fin_sold_amount: o.amt ?? null, created_at: ago((apptH ?? 48) + 72),
  customers: { name, phone: '(321) 555-0' + String(100 + Number(id.replace(/\D/g, ''))).slice(-3), city, disposition: o.lost ? 'lost' : null } });
const PIPE = [
  pj('p1', 'Hartley, Nina', 'Palm Bay', 'r3', -30, { cc: '1563', title: 'Shingle re-roof' }), pj('p2', 'Duarte, Miguel', 'Cocoa', 'r1', -6), pj('p3', 'Chen, Amy', 'Rockledge', 'r2', -52),
  pj('p4', 'Bellamy, Joe', 'Melbourne', 'r3', 3, { cc: '1563', title: 'Roof, 24 sq' }), pj('p5', 'Osei, Grace', 'Titusville', 'r1', 20), pj('p6', 'Ferraro, Dom', 'Merritt Island', 'r2', 40), pj('p7', 'Quinn, Sarah', 'Viera', 'g', 60),
  pj('p8', 'Lindqvist, Erik', 'Palm Coast', 'r5', 30), pj('p9', 'Baptiste, Marie', 'Cocoa', 'r1', 80), pj('p10', 'Torres, Luis', 'Winter Park', 'r4', 12, { cc: '1560', title: 'Paver patio' }),
  pj('p11', 'Nakamura, Ken', 'Melbourne', 'r3', 150, { cc: '1563' }), pj('p12', 'Whitaker, Ann', 'Palm Bay', 'r2', 200, { lost: true }), pj('p13', 'Grant, Tyrell', 'Deltona', 'r5', null), pj('p14', 'Ivey, Paula', 'Orlando', 'r4', null, { cc: '1560' }),
  ...BOARD.filter((b) => b.contract_signed_at).slice(0, 6).map((b) => ({ id: b.job_id, customer_id: b.customer_id, rep_id: b.rep_id, cc_company_id: b.cc_company_id, title: b.title, appt_starts_at: ago(300), contract_signed_at: b.contract_signed_at, fin_sold_amount: b.fin_sold_amount, created_at: ago(400), customers: { name: b.customer_name, phone: b.customer_phone, city: 'Cocoa', disposition: null } })),
];
const EST = [{ customer_id: 'cp8', amount: 7800, occurred_at: ago(28) }, { customer_id: 'cp9', amount: 12400, occurred_at: ago(70) }, { customer_id: 'cp11', amount: 18900, occurred_at: ago(140) }];

function book() {
  const people = [...SEATS.map((s) => ({ ...s, initials: null, sms_from: null })),
    ...[...new Map(BOARD.map((b) => [b.rep_id, b.rep_name])).entries()].map(([id, name]) => ({ id, name, role: 'sales', initials: null, sms_from: id === 'r1' ? '+13863023131' : null }))];
  return { me: { ...me, manages_company_id: null }, seats: SEATS, people, stageSeats: [{ cc_company_id: '1461', stage: 'sold_office', owner_id: 'sam', watcher_id: 'jc' }, { cc_company_id: '1461', stage: 'schedule', owner_id: 'jon', watcher_id: 'jc' }, { cc_company_id: '1461', stage: 'production', owner_id: null, watcher_id: 'luis' }, { cc_company_id: '1461', stage: 'invoiced', owner_id: 'laura', watcher_id: 'jc' }, { cc_company_id: '1461', stage: 'field_complete', owner_id: 'laura', watcher_id: 'jc' }], board: BOARD, queue: QUEUE, clock: CLOCK, pipeline: PIPE, estimates: EST, direct: DIRECT,
    leadSources: [{ cc_lead_id: 1, name: 'Google', cc_company_id: '1461' }, { cc_lead_id: 2, name: 'Referral', cc_company_id: '1461' }, { cc_lead_id: 3, name: 'Angi (Lead Service)', cc_company_id: '1461' }, { cc_lead_id: 4, name: 'Previous Customer', cc_company_id: '1461' }, { cc_lead_id: 5, name: 'Google', cc_company_id: '1560' }],
    sellers: [{ id: 'r1', name: 'Ron Seidel', cc_default_company_id: '1461' }, { id: 'r2', name: 'Travis Janke', cc_default_company_id: '1461' }, { id: 'r4', name: 'Mike LeRoy', cc_default_company_id: '1560' }],
    mentions: [{ message_id: 'mm1', thread_id: 'tj3', created_at: ago(0.4), seen_at: null, customer_id: 'cj3', customer_name: 'Reed, Dana', cc_company_id: '1461', author_name: 'Obed Santiago', body: '@Laura signed off, 6 photos on the file — invoice when you can', lane: 'OFFICE' }],
    switches: [{ key: 'appt_confirm', is_on: false }, { key: 'text_clock', is_on: false }],
    lines: [{ line_e164: '+13218061995', cc_company_id: '1461', label: 'Liberty Fencing · 321', campaign_ok: true }, { line_e164: '+13862766898', cc_company_id: '1461', label: 'Liberty Fencing · 386', campaign_ok: true }], warnings: ['DEMO — a fictional book; nothing is saved'] };
}

function file(customerId) {
  const b = BOARD.find((x) => x.customer_id === customerId) || BOARD[2];
  const t = (h, dir, body, ext, feed) => ({ id: 'm' + h + body.length, direction: dir, body, occurred_at: ago(h), uvoice_ext: ext ?? null, feed_source: feed || 'cloudmessage', has_media: false,
    resolved_rep_id: dir === 'outbound' ? ({ 152: 'r1', 102: 'sam', 158: 'obed' })[ext] ?? null : null, from_number: ext === 152 ? '+13863023131' : '+13218061995' });
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
    { id: 'hm1', lane: 'SUPER', author_id: 'obed', author_name: 'Obed Santiago', body: '@Laura signed off, 6 photos on the file — invoice when you can. @Jonathan the shed section finishes Thursday.', is_system: false, created_at: ago(0.4) },
    { id: 'hm2', lane: 'OFFICE', author_id: 'laura', author_name: 'Laura Schepp', body: 'Got it. Invoice goes out this afternoon. @Ron she asked about the gate latch — yours.', is_system: false, created_at: ago(0.2) },
  ] : [];
  // 354: who each note reached — 📱 has the app, 🖥 waits in You're up, ✓ opened it
  const receipts = b.job_id === 'j3' ? [
    { message_id: 'hm1', rep_id: 'laura', name: 'Laura Schepp', role: 'office', seen_at: ago(0.25), has_phone: false },
    { message_id: 'hm1', rep_id: 'jon', name: 'Jonathan Garcia', role: 'office', seen_at: null, has_phone: false },
    { message_id: 'hm2', rep_id: 'r1', name: 'Ron Seidel', role: 'sales', seen_at: null, has_phone: true },
  ] : [];
  const attachments = b.job_id === 'j3' ? [
    { id: 'at1', label: 'Signed contract', storage_path: '1461/Pj3/OFFICE/DOC/contract.pdf', created_at: ago(20 * 24), ask_id: 'd1' },
    { id: 'at2', label: 'Permit 26-04812', storage_path: '1461/Pj3/OFFICE/DOC/permit.pdf', created_at: ago(11 * 24), ask_id: 'd2' },
    ...[1, 2, 3, 4, 5, 6].map((i) => ({ id: 'ph' + i, label: 'Finished work ' + i, storage_path: '1461/Pj3/SUPER/DOC/photo' + i + '.jpg', created_at: ago(0.3), ask_id: 'd5' })),
  ] : [];
  const handoffs = b.supervisor_id ? [{ id: 'h1', kind: 'take', to_seat: b.supervisor_id, by_id: b.supervisor_id, at: ago(3 * 24), note: null }] : [];
  // 328/331: the calculator's job on one fictional fence (j8 — PVC privacy + 2 gates), the shape fence_takeoff_for returns
  const fence = b.job_id === 'j8' ? { found: true, created_at: ago(36), quote: 9900, styles: [{ prod: "White PVC 6'", material: 'vinyl', height_ft: 6, linear_ft: 142 }], style: "White PVC 6'", material: 'vinyl', height_ft: 6, linear_ft: 142,
    gates: [{ width_ft: 4, kind: 'single', source: 'drawn' }, { width_ft: 4, kind: 'single', source: 'drawn' }], gate_count: 2, tear_out_ft: 60, reinstall_ft: 0, core_drill_holes: 0, follow_grade: true, proposal_signed: true,
    description_of_work: "INSTALL 6' TALL VINYL FENCING (142 LF) WITH (2) 4' GATES",
    material_order: [{ group: "Style 1: White PVC 6' — 142 ft fence" }, { item: 'Sections (8 ft)', qty: '17' }, { item: '5x5 Posts', qty: '20' }, { item: 'Concrete 60lb bags', qty: '40' }, { group: 'Gates & Hardware' }, { item: 'Hinge pairs', qty: '2' }, { item: 'Latch', qty: '2' }, { item: 'Aluminum gate stiffener', qty: '2' }] } : null;
  const packet = b.job_id === 'j8' ? [
    { id: 'pk1', kind: 'proposal', label: 'Liberty_Proposal_Pestana_Luis_2026-09-13.pdf', signed: true, storage_path: 'cj8/1-proposal.pdf', mime: 'application/pdf', uploaded_at: ago(35) },
    { id: 'pk2', kind: 'material_order', label: 'Liberty_MaterialOrder_Pestana_Luis_2026-09-13.pdf', signed: false, storage_path: 'cj8/2-order.pdf', mime: 'application/pdf', uploaded_at: ago(35.5) },
    { id: 'pk3', kind: 'drawing', label: 'drawing.svg', signed: false, storage_path: 'cj8/3-drawing.svg', mime: 'image/svg+xml', uploaded_at: ago(36) },
  ] : [];
  return { photos: demoPhotos(b), quotes: QUOTES.filter((q) => q.customer_id === b.customer_id), receipts, job: { ...b, sms_opt_out_at: null }, customer: { id: b.customer_id, name: b.customer_name, phone: b.customer_phone, email: null }, texts, emails: b.job_id === 'j3' ? [{ id: 'e1', occurred_at: ago(22 * 24), subject: 'Your estimate from Liberty Fencing — #E-4481', status: 'sent', source: 'rep', opened: true }] : [], thread: { id: 't' + b.job_id }, messages, asks, attachments, handoffs, outbox: [], fence, packet };
}

function search(q) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  return BOARD.filter((b) => words.every((w) => b.customer_name.toLowerCase().includes(w))).map((b) => ({ id: b.customer_id, name: b.customer_name, phone: b.customer_phone, updated_at: b.stage_since })).slice(0, 8);
}

/* 346: direct lines — two fictional ones for the demo, and their threads. */
const DIRECT = [
  { other_id: 'jc', other_name: 'Jessica Coley', other_role: 'manager', other_initials: 'JC', last_at: ago(0.3), last_body: "That's the part I like — I didn't have to retype it anywhere.", last_from: 'jc', unseen: 1 },
  { other_id: 'obed', other_name: 'Obed Santiago', other_role: 'manager', other_initials: 'OS', last_at: ago(5), last_body: 'Ortega finishes Reed in the morning. Thursday is open if the survey lands.', last_from: 'k', unseen: 0 },
];
const DM = {
  jc: [
    { id: 1, from_id: 'jc', to_id: 'k', body: "Sandoval moved again. Third time. I don't want to be the one who tells a customer no.", created_at: ago(0.5) },
    { id: 2, from_id: 'k', to_id: 'jc', body: "You're not telling him no, you're telling him the crew costs us a day. Hold the deposit, offer the 24th, and put it on his file so Obed sees it without asking you.", created_at: ago(0.4) },
    { id: 3, from_id: 'jc', to_id: 'k', body: "That's the part I like — I didn't have to retype it anywhere.", created_at: ago(0.3) },
  ],
  obed: [{ id: 4, from_id: 'k', to_id: 'obed', body: 'Ortega finishes Reed in the morning. Thursday is open if the survey lands.', created_at: ago(5) }],
};
const dm = (other) => DM[other] || [];
export const DEMO = { book, file, search, rooms: ROOMS, hype: HYPE, dm, crews: () => CREWS, nuggets: () => NUGGETS, quotes: () => QUOTES, checklist: () => CHECKLIST, photos: () => BOARD.flatMap((b) => demoPhotos(b).map((p) => ({ ...p, customer_name: b.customer_name }))).sort((a, b) => new Date(b.taken_at) - new Date(a.taken_at)) };

/* 351: the photos on the fictional file — drawn, not fetched, so the demo never leaves the page */
const svgPhoto = (label, sky, ground, accent) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><rect width="320" height="200" fill="${sky}"/><rect y="200" width="320" height="120" fill="${ground}"/><rect x="30" y="120" width="12" height="150" fill="${accent}"/><rect x="150" y="120" width="12" height="150" fill="${accent}"/><rect x="270" y="120" width="12" height="150" fill="${accent}"/><rect x="30" y="140" width="252" height="10" fill="${accent}" opacity=".8"/><rect x="30" y="230" width="252" height="10" fill="${accent}" opacity=".8"/><text x="16" y="300" font-family="monospace" font-size="20" fill="#fff" opacity=".9">${label}</text></svg>`);
function demoPhotos(b) {
  const mk = (i, label, by, h, caption, kind = 'ours', src = 'web', extra = {}) => ({ id: 'dp' + b.job_id + i, kind, customer_id: b.customer_id, job_id: b.job_id, message_id: null, path: null, thumb_path: null, tagged: [], crew: null, amount: null, ...extra,
    url: svgPhoto(label, kind === 'companycam' ? '#9fb8d3' : '#b7c9dd', '#7a8a5a', '#e9e2cf'), thumb_url: svgPhoto(label, kind === 'companycam' ? '#9fb8d3' : '#b7c9dd', '#7a8a5a', '#e9e2cf'),
    taken_at: ago(h), by_name: by, caption, for_customer: false, source: src });
  // Mike's Oasis file: the crew and the dollars ride the picture (Kevin, 15 Sep night)
  if (b.job_id === 'j6') return [
    mk(1, 'PAVERS · DONE', 'Mike LeRoy', 2, '@Luis patio set and compacted', 'ours', 'app', { crew: 'Oasis · Nick', amount: 3400, tagged: ['luis'] }),
    mk(2, 'LIGHTS', 'Mike LeRoy', 2.2, 'Path lights wired, 8 fixtures', 'ours', 'app', { crew: 'Oasis · Nick', amount: 1150 }),
    mk(3, 'BASE', 'Nick C', 28, 'Base rock in, 4 inches', 'ours', 'crew_link', { crew: 'Oasis · Nick', amount: 900 }),
    mk(4, 'CC · BEFORE', 'Mike LeRoy', 6 * 24, null, 'companycam', 'companycam'),
  ];
  if (b.job_id !== 'j3') return [];
  return [
    mk(1, 'LISTO 1/6', 'Crew Ortiz', 0.3, 'TERMINADO · done', 'ours', 'crew_link'), mk(2, 'LISTO 2/6', 'Crew Ortiz', 0.3, null, 'ours', 'crew_link'), mk(3, 'LISTO 3/6', 'Crew Ortiz', 0.31, null, 'ours', 'crew_link'),
    mk(4, 'POSTES', 'Obed Santiago', 26, '@Laura posts set, panels tomorrow', 'ours', 'supervisor'),
    mk(5, 'EN SITIO', 'Crew Ortiz', 30, 'AQUÍ · on site', 'ours', 'crew_link'),
    mk(6, 'BEFORE', 'Ron Seidel', 22 * 24, 'Old chain link comes out, 300 ft', 'ours', 'app'),
    mk(7, 'CC · YARD', 'Ron Seidel', 22 * 24, null, 'companycam', 'companycam'), mk(8, 'CC · GATE', 'Ron Seidel', 22 * 24, null, 'companycam', 'companycam'),
  ];
}

/* 353: SEND QUOTE TO GIO — the demo's checklist (the live one is a table) and two asks */
const CHECKLIST = [
  { key: 'fence_type', ord: 10, label: 'Fence', kind: 'pick', options: ['Vinyl privacy', 'Vinyl semi-privacy', 'Aluminum', 'Wood', 'Chain link', 'Other'], required: true, hint: null },
  { key: 'height_ft', ord: 20, label: 'Height', kind: 'pick', options: ['4 ft', '5 ft', '6 ft', '8 ft'], required: true, hint: null },
  { key: 'linear_ft', ord: 30, label: 'Linear feet', kind: 'number', options: [], required: true, hint: 'Your measurement, not the survey\'s' },
  { key: 'gates', ord: 40, label: 'Gates', kind: 'text', options: [], required: true, hint: '2 × 4 ft single, 1 × 10 ft double' },
  { key: 'tear_out', ord: 50, label: 'Tear-out', kind: 'pick', options: ['None', 'Some', 'All'], required: true, hint: null },
  { key: 'grade', ord: 60, label: 'Grade', kind: 'pick', options: ['Flat', 'Sloped', 'Steep'], required: true, hint: null },
  { key: 'ground', ord: 70, label: 'Ground', kind: 'pick', options: ['Sand', 'Roots', 'Rock', 'Concrete to cut'], required: false, hint: null },
  { key: 'obstacles', ord: 80, label: 'Obstacles', kind: 'text', options: [], required: false, hint: null },
  { key: 'hoa', ord: 90, label: 'HOA', kind: 'pick', options: ['Yes', 'No', 'Unknown'], required: true, hint: null },
  { key: 'survey', ord: 100, label: 'Survey', kind: 'pick', options: ['On the file', 'Customer has it', 'None'], required: true, hint: null },
  { key: 'access', ord: 110, label: 'Access', kind: 'pick', options: ['Easy', 'Tight', 'Backyard by hand'], required: true, hint: null },
  { key: 'need_by', ord: 120, label: 'Customer expects', kind: 'text', options: [], required: false, hint: null },
  { key: 'notes', ord: 130, label: 'Anything else', kind: 'text', options: [], required: false, hint: null },
];
const QUOTES = [
  { id: 'q1', customer_id: 'cj3', customer_name: 'Reed, Dana', city: 'Melbourne', job_id: 'j3', cc_company_id: '1461', job_title: 'Aluminum + gate', rep_id: 'r1', rep_name: 'Ron Seidel', assignee_id: 'g', assignee_name: 'Gio Calderin',
    fields: { fence_type: 'Vinyl privacy', height_ft: '6 ft', linear_ft: '312', gates: '2 × 4 ft single, 1 × 10 ft double', tear_out: 'All', grade: 'Sloped', ground: 'Roots', obstacles: 'Neighbor\'s fence on the east line, AC pad, oak roots', hoa: 'Yes', survey: 'On the file', access: 'Tight', need_by: 'Thursday' },
    photo_ids: ['dpj31', 'dpj34', 'dpj36'], note: 'He wants it racked, not stepped. HOA wants tan.', status: 'open', price: null, answer_note: null, created_at: ago(1.4), answered_at: null, minutes_to_answer: null, open_min: 84 },
  { id: 'q2', customer_id: 'cj1', customer_name: 'Whitfield, Mark', city: 'Melbourne', job_id: 'j1', cc_company_id: '1461', job_title: 'Vinyl privacy 6\'', rep_id: 'r1', rep_name: 'Ron Seidel', assignee_id: 'g', assignee_name: 'Gio Calderin',
    fields: { fence_type: 'Vinyl privacy', height_ft: '6 ft', linear_ft: '188', gates: '1 × 4 ft', tear_out: 'Some', grade: 'Flat', hoa: 'No', survey: 'Customer has it', access: 'Easy' },
    photo_ids: [], note: null, status: 'priced', price: 14200, answer_note: 'Tear-out is 60 ft of wood — add a day. Racked panels.', created_at: ago(30), answered_at: ago(29.4), minutes_to_answer: 38, open_min: 1800 },
];

/* 356/357: Mike's crews and the nugget — the receipt nobody can argue */
const CREWS = [
  { id: 'cw1', name: 'Nick', phone: '+13215550171', cc_company_id: '1560', lang: 'en', manager_id: 'luis', active: true },
  { id: 'cw2', name: 'Ramón', phone: '+13215550172', cc_company_id: '1560', lang: 'es', manager_id: 'luis', active: true },
  { id: 'cw3', name: 'Crew Ortiz', phone: '+13865550173', cc_company_id: '1461', lang: 'es', manager_id: 'luis', active: true },
];
const NUGGETS = [
  { id: 'ng1', person_id: 'cw2', person_name: 'Ramón', lang: 'es', cc_company_id: '1560', customer_id: 'cj6', customer_name: 'Marchetti, Dave', city: 'Melbourne', by_id: 'luis', by_name: 'Luis Gonzalez',
    body: 'Sod goes in the BACK yard only. Front stays as it is.', bring: 'photo', bring_label: 'a photo of the back yard when the sod is down', due_at: ago(-3), status: 'open', answer: null, photos: [],
    created_at: ago(1.2), returned_at: null, minutes_to_return: null, open_min: 72, late: false, seen_at: ago(1.1), received_at: ago(1.05), received_by: 'Ramón', sms_status: 'sent', sms_sent_at: ago(1.2) },
  { id: 'ng2', person_id: 'cw1', person_name: 'Nick', lang: 'en', cc_company_id: '1560', customer_id: 'cj6', customer_name: 'Marchetti, Dave', city: 'Melbourne', by_id: 'luis', by_name: 'Luis Gonzalez',
    body: 'How many pallets of pavers are left on the truck?', bring: 'number', bring_label: 'the count', due_at: null, status: 'returned', answer: '3', photos: [],
    created_at: ago(5), returned_at: ago(4.6), minutes_to_return: 24, open_min: 300, late: false, seen_at: ago(4.9), received_at: ago(4.9), received_by: 'Nick', sms_status: 'sent', sms_sent_at: ago(5) },
  { id: 'ng3', person_id: 'cw3', person_name: 'Crew Ortiz', lang: 'es', cc_company_id: '1461', customer_id: 'cj3', customer_name: 'Reed, Dana', city: 'Melbourne', by_id: 'luis', by_name: 'Luis Gonzalez',
    body: 'Terminar la sección junto al cobertizo antes de las 3.', bring: 'done', bring_label: null, due_at: ago(0.5), status: 'open', answer: null, photos: [],
    created_at: ago(3), returned_at: null, minutes_to_return: null, open_min: 180, late: true, seen_at: null, received_at: null, received_by: null, sms_status: 'sent', sms_sent_at: ago(3) },
];
