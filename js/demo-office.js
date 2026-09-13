// The workflow map, for ?demo=1 — Contractors Cloud's own step list for the
// fence brands and the roofing brands, and what each step became here. The
// live table is `cc_workflow_steps`; these rows are the same shape with
// invented counts, so the Office room draws without a login. office.js only.

const step = (ord, cc_subject, becomes, o = {}) => ({
  ord, cc_subject, becomes,
  cc_count: o.count ?? null,
  lane: o.lane ?? null,
  ask_type: o.ask ?? null,
  doc_kind: o.doc ?? null,
  owner_rule: o.owner ?? null,
  note: o.note ?? null,
});

/* Fencing and Oasis — ten steps on CC's board. */
const FENCE = [
  step(1, 'Determine if job sold or lead needs cancelling', 'exists', { count: 41, owner: 'nobody — the stage says it',
    note: 'The stage board already says sold or not. No seat re-asks the question.' }),
  step(2, 'Follow up with Rep to see if sold', 'exists', { count: 18, owner: 'nobody — the board says it',
    note: 'Selling sits on the board under the rep’s own name until it signs.' }),
  step(3, 'Upload Contract and create sales order', 'checklist', { count: 27, lane: 'OFFICE', ask: 'CONTRACT_DOC', doc: 'contract',
    owner: 'the office seat holding the file', note: 'Signing opens the paperwork checklist by itself; the document is the proof.' }),
  step(4, 'Pull permit', 'ask', { count: 23, lane: 'OFFICE', ask: 'PERMIT', owner: 'the office seat holding the file',
    note: 'Closes on the permit number. The customer gets the permit text if that switch is on.' }),
  step(5, 'Locate scheduled', 'ask', { count: 16, lane: 'OFFICE', ask: 'SURVEY', owner: 'the office seat holding the file',
    note: 'Closes on the locate ticket, or a reason none is needed.' }),
  step(6, 'Order Materials and Schedule Labor', 'ask', { count: 21, lane: 'OFFICE', ask: 'MATERIAL', owner: 'the office seat holding the file',
    note: 'One CC step, two asks here — materials and the schedule — each with its own clock.' }),
  step(7, 'Follow up with homeowner', 'clock', { count: 34, lane: 'CHAT', owner: 'the answer clock, then the watcher',
    note: 'The machine watches the line instead: 15 minutes to the watcher, 60 to the owners.' }),
  step(8, 'Did pass final inspection?', 'ask', { count: 12, lane: 'OFFICE', ask: 'INSPECTION', owner: 'the office seat holding the file',
    note: 'One ask for the inspection; passing closes it.' }),
  step(9, 'Send invoice/collect', 'ask', { count: 19, lane: 'OFFICE', ask: 'INVOICE', owner: 'billing',
    note: 'Invoice queues it for QuickBooks; Collect texts the payment link from the main line.' }),
  step(10, 'Closeout job', 'ask', { count: 15, lane: 'OFFICE', ask: 'CLOSEOUT', owner: 'the office seat holding the file',
    note: 'The last ask on the file. Paid is the stage; close-out is the paperwork behind it.' }),
];

/* Liberty Roofing and Pro-Tech — twenty-one steps on CC's board. */
const ROOF = [
  step(1, 'Add your name to the project team', 'handoff', { count: 31, lane: 'OFFICE', owner: 'whoever takes the file',
    note: 'Taking the file is the project team. The board shows who holds it.' }),
  step(2, 'Do intro call/send email (Confirm Colors/Payment)', 'ask', { count: 28, lane: 'OFFICE', ask: 'INTRO_CALL',
    owner: 'the office seat holding the file', note: 'Colors and how they are paying, on the file, before anything is ordered.' }),
  step(3, 'Make PM Folder', 'dropped', { count: 26, owner: 'nobody',
    note: 'The customer file is the folder. Nothing to make.' }),
  step(4, 'Email Material List', 'ask', { count: 24, lane: 'OFFICE', ask: 'MATERIAL', owner: 'the office seat holding the file',
    note: 'Closes on the PO or order confirmation number.' }),
  step(5, 'Record NOC', 'checklist', { count: 22, lane: 'OFFICE', ask: 'CONTRACT_DOC', doc: 'noc',
    owner: 'the office seat holding the file', note: 'Part of the paperwork checklist that signing opens.' }),
  step(6, 'Submit for Permit', 'ask', { count: 22, lane: 'OFFICE', ask: 'PERMIT', owner: 'the office seat holding the file',
    note: 'Closes on the permit number.' }),
  step(7, 'Add supervisor/project manager to project team', 'handoff', { count: 20, lane: 'SUPER', owner: 'the supervisor who takes it',
    note: 'Send to… hands the file over; the stage moves with the seat.' }),
  step(8, 'Week 1 Call', 'clock', { count: 17, lane: 'CHAT', owner: 'the machine',
    note: 'A kept follow-up, not a checkbox — the clock texts and the answer clock watches the reply.' }),
  step(9, 'Week 2 Call', 'clock', { count: 14, lane: 'CHAT', owner: 'the machine', note: 'The same clock, second week.' }),
  step(10, 'Week 3 Call', 'clock', { count: 11, lane: 'CHAT', owner: 'the machine', note: 'The same clock, third week.' }),
  step(11, 'Homeowner is on schedule', 'ask', { count: 18, lane: 'OFFICE', ask: 'SCHEDULE', owner: 'scheduling',
    note: 'Closes on the start date, with the crew in the note.' }),
  step(12, 'Confirm tearoff has started', 'ask', { count: 13, lane: 'SUPER', ask: 'MILESTONE', doc: 'tearoff',
    owner: 'the supervisor on the job', note: 'A milestone the supervisor stamps from the field.' }),
  step(13, 'Dryin Ordered', 'ask', { count: 12, lane: 'SUPER', ask: 'MILESTONE', doc: 'dryin_ordered',
    owner: 'the supervisor on the job', note: 'A milestone the supervisor stamps from the field.' }),
  step(14, 'Sheathing Inspection', 'ask', { count: 10, lane: 'SUPER', ask: 'MILESTONE', doc: 'sheathing_inspection',
    owner: 'the supervisor on the job', note: 'A milestone the supervisor stamps from the field.' }),
  step(15, 'Dryin Passed', 'ask', { count: 10, lane: 'SUPER', ask: 'MILESTONE', doc: 'dryin_passed',
    owner: 'the supervisor on the job', note: 'A milestone the supervisor stamps from the field.' }),
  step(16, 'Shingling in progress', 'ask', { count: 9, lane: 'SUPER', ask: 'MILESTONE', doc: 'shingling',
    owner: 'the supervisor on the job', note: 'A milestone the supervisor stamps from the field.' }),
  step(17, 'Schedule Walkthrough', 'ask', { count: 8, lane: 'SUPER', ask: 'MILESTONE', doc: 'walkthrough',
    owner: 'the supervisor on the job', note: 'The last milestone before the final inspection.' }),
  step(18, 'Final Inspection Ordered', 'ask', { count: 9, lane: 'OFFICE', ask: 'INSPECTION',
    owner: 'the office seat holding the file', note: 'Closes on the inspection being ordered and passed.' }),
  step(19, 'Final Inspection Passed', 'exists', { count: 7, owner: 'nobody — the inspection ask says it',
    note: 'The inspection ask closes on the pass. There is no second step to tick.' }),
  step(20, 'Project Completed', 'ask', { count: 8, lane: 'SUPER', ask: 'COMPLETION_SIGNOFF',
    owner: 'the supervisor on the job', note: 'Sign-off needs the finished-work photos; the photos land on the file.' }),
  step(21, 'Send final invoice to h/o', 'ask', { count: 11, lane: 'OFFICE', ask: 'INVOICE', owner: 'billing',
    note: 'Invoice queues it for QuickBooks; Collect texts the payment link from the main line.' }),
];

const forBrand = (cc, list) => list.map((s) => ({ cc_company_id: cc, ...s }));

/* Fencing and Oasis run the fence list; Liberty Roofing and Pro-Tech the roofing one. */
export const DEMO_STEPS = [
  ...forBrand('1461', FENCE),
  ...forBrand('1537', ROOF),
  ...forBrand('1560', FENCE),
  ...forBrand('1563', ROOF),
];
