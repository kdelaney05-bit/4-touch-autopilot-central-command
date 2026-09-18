// Liberty Command — the one place. Same project, same publishable key as the
// phone app and the desk; every read and write is bound by row-level
// security. Never a secret key in this folder.
export const SUPA_URL = 'https://lzegjjbkfuecrhdvlvay.supabase.co';
export const SUPA_KEY = 'sb_publishable_kToiGqET7XzO2It9evStJw_kYzvjSF8';
export const SESSION_KEY = 'command:session:v1';

/* THE ADDRESS THAT FILLS ITSELF IN (Samantha, 17 Sep — her first idea in the app). A Google Maps Platform BROWSER key:
   Places API (New) enabled, restricted to the referrer https://kdelaney05-bit.github.io/* so a copy of it is useless
   anywhere else (this repo is public; a referrer-locked browser key is built to sit here, like SUPA_KEY). Blank = the
   Street box still suggests, from OpenStreetMap (free, no key, no sign-up). Kevin pastes the key here; nothing else changes. */
export const GOOGLE_MAPS_KEY = '';

/* THE REP LIST ON THE NEW LEAD FORM (Kevin, 17 Sep: "put Gio and Jessica and Jermey in a sales person option on the lead
   form — Gio sometimes sells for real and Jessica is a placeholder"). The list is lead_rep_options() (396): every active
   seller, plus any seat with reps.takes_leads on. The note after a name says why a non-seller is on it. */
export const LEAD_REP_NOTE = {
  '940ad537-cfbd-4129-a335-9d8a9bc7a013': 'sells one himself sometimes',        // Gio
  'c2b126ae-a182-4dca-be11-2b9bf02c1c21': 'placeholder · no rep picked yet',     // Jessica Coley
};

export const BRAND_BY_CC = {
  '1461': { key: 'liberty', name: 'Liberty Fencing',  short: 'Fencing' },
  '1537': { key: 'libroof', name: 'Liberty Roofing',  short: 'Liberty Roofing' },
  '1560': { key: 'oasis',   name: 'Oasis Landscapes', short: 'Oasis' },
  '1563': { key: 'protech', name: 'Pro-Tech Roofing', short: 'Pro-Tech' },
};
export const brandName = (cc) => BRAND_BY_CC[cc]?.short ?? (cc ? 'Brand ' + cc : '—');

/* The funnel — job_stage() in migration 306. Color = the room that owns it. */
export const STAGES = {
  booked:         { label: 'Estimate booked', cls: 'st-gold',   room: 'sales',      order: 0 },
  selling:        { label: 'Selling',         cls: 'st-green',  room: 'sales',      order: 1 },
  sold_office:    { label: 'Sold · office',   cls: 'st-blue',   room: 'office',     order: 2 },
  production:     { label: 'Production',      cls: 'st-orange', room: 'production', order: 3 },
  field_complete: { label: 'Field complete',  cls: 'st-green',  room: 'production', order: 4 },
  invoiced:       { label: 'Invoiced',        cls: 'st-blue',   room: 'office',     order: 5 },
  paid:           { label: 'Paid',            cls: 'st-ink',    room: 'office',     order: 6 },
};
export const stageLabel = (s) => STAGES[s]?.label ?? (s || '—');

/* Days in stage past which a row goes red (Kevin's "held too long"). */
export const STAGE_LINE_DAYS = { sold_office: 3, production: 14, field_complete: 1, invoiced: 30, selling: 7, booked: 7 };

export const ASK_LABEL = {
  CONTRACT_DOC: 'Paperwork', PERMIT: 'Permit', SURVEY: 'Locate', SCHEDULE: 'Schedule', MATERIAL: 'Materials',
  INVOICE: 'Invoice', PAYMENT: 'Payment', CHANGE_ORDER: 'Change order', COMPLETION_SIGNOFF: 'Sign-off', COLLECT_CALL: 'Call · invoice',
  MATERIAL_REQUEST: 'Material run', SITE_ISSUE: 'Site issue', SUPERVISOR_PING: 'Supervisor', SAFETY_JHA: 'Safety',
  CUSTOMER_REQUEST: 'Customer request', SCHEDULE_QUESTION: 'Schedule question',
  /* Contractors Cloud's own steps, become asks here (cc_workflow_steps). */
  SOLD_CHECK: 'Sold check', INTRO_CALL: 'Intro call · colors & payment', MILESTONE: 'Milestone',
  INSPECTION: 'Final inspection', CLOSEOUT: 'Close-out',
};
export const DOC_LABEL = {
  contract: 'Signed contract', noc: 'Notice of Commencement', hoa: 'HOA approval', survey: 'Property survey', permit_sig: 'Permit application, signed', deed: 'Warranty deed',
  /* The roofing milestones — the doc_kind is which milestone it is. */
  tearoff: 'Tear-off started', dryin_ordered: 'Dry-in ordered', sheathing_inspection: 'Sheathing inspection',
  dryin_passed: 'Dry-in passed', shingling: 'Shingling', walkthrough: 'Walkthrough',
};
/* Type first, then the piece: a MILESTONE with doc_kind 'tearoff' reads
   "Milestone · Tear-off started". Either half alone when there is only one. */
export const askLabel = (a) => {
  const t = ASK_LABEL[a?.ask_type] || a?.ask_type || '';
  const d = a?.doc_kind ? (DOC_LABEL[a.doc_kind] || a.doc_kind) : '';
  if (a?.ask_type === 'CONTRACT_DOC' && d) return d;   // the paperwork checklist reads by item, not 'Paperwork · item'
  return d ? (t ? t + ' · ' + d : d) : t;
};

/* Which rooms a role opens. RLS decides the rows either way. */
export const ROOMS_BY_ROLE = {
  owner:   ['line', 'village', 'home', 'sales', 'pipeline', 'marketing', 'office', 'production', 'flow', 'photos', 'files'],
  admin:   ['line', 'village', 'home', 'sales', 'pipeline', 'marketing', 'office', 'production', 'flow', 'photos', 'files'],
  manager: ['line', 'village', 'production', 'photos', 'files'],   // 16 Sep: the Production room — their board, Take the job. 18 Sep evening: no Pipeline (Kevin: "I don't want anyone having marketing, sales, pipeline except sales rep… Gio can have them")
  office:  ['line', 'village', 'office', 'photos', 'files'],   // 16 Sep: the Office room is the office's automated day (the asks, oldest first). 18 Sep evening: no Pipeline — the New lead door is the button at the top, not a room
  sales:   ['line', 'village', 'sales', 'pipeline', 'marketing', 'photos', 'files'],   // 18 Sep evening: Sales · Pipeline · Marketing are the reps' rooms (and Gio's), nobody else's
  crew:    [],
};
// 16 Sep, launch morning: THE VILLAGE is a top tab for every seat. Kevin's first company-wide post went there and
// nobody could find it — at a laptop width the rail stacks under the whole Line. One tab, the whole company, one thread.
export const ROOM_LABEL = { line: 'The Line', village: 'The Village', home: 'The Business', sales: 'Sales', pipeline: 'Pipeline', marketing: 'Marketing', office: 'Office', production: 'Production', flow: 'Job Board', photos: 'Photos', files: 'Files' };

/* The owner console (liberty-command, GitHub Pages, same github.io origin) —
   the dashboard Kevin lived in while the app was built. Its sections route
   on the hash, so each room embeds the one it needs. The console signs in
   on its own the first time; same email and password. */
export const CONSOLE_URL = 'https://kdelaney05-bit.github.io/liberty-command/';
export const CONSOLE_SECTION = { sales: 'sales', marketing: 'marketing', home: 'master' };

/* THE KEYS (Kevin, 15 Sep night): "Gio is an owner, but by paper only… sweat
   equity… he doesn't get the keys that I get. A layer above Jess. Keep him
   focused on revenue… keep him away from the financials until they're tight."
   So a seat's rooms can override its role's: Gio keeps every room but The
   Business (page one, the P&L, collected). View as is the keys' too. */
// Kevin, 16 Sep: "jess and luis need a super one like me, they can be anyone and reach anyone" — the keys = View as
export const KEYS = ['fa314b31-dac6-4666-8920-e95d471f5732',                        // Kevin
                     'c2b126ae-a182-4dca-be11-2b9bf02c1c21',                        // Jessica Coley
                     '9cb2ccf5-15f5-4edf-975a-75fb215727be',                        // Luis Gonzalez
                     '050dde3d-4672-4aef-9aff-921c1a26e7c0'];                       // Mike LeRoy — "runs ops and production, needs all the Luis abilities" (16 Sep)
export const ROOMS_BY_SEAT = {
  // 18 Sep evening, Kevin looking as Luis ("these guys don't need access to all that… I don't want anyone having marketing, sales,
  // pipeline except sales rep… Gio can have them"): the keys keep every room BUT the reps' three. View as stays theirs.
  'c2b126ae-a182-4dca-be11-2b9bf02c1c21': ['line', 'village', 'home', 'office', 'production', 'flow', 'photos', 'files'],   // Jess — every room but Sales · Pipeline · Marketing (was every room like Kevin, 16 Sep)
  '9cb2ccf5-15f5-4edf-975a-75fb215727be': ['line', 'village', 'home', 'office', 'production', 'flow', 'photos', 'files'],   // Luis — the same
  '050dde3d-4672-4aef-9aff-921c1a26e7c0': ['line', 'village', 'home', 'office', 'production', 'flow', 'photos', 'files'],   // Mike — the same
  '940ad537-cfbd-4129-a335-9d8a9bc7a013': ['line', 'village', 'sales', 'pipeline', 'marketing', 'photos', 'files'],   // Gio — the selling sales manager: the reps' three rooms and no more (Kevin, 16 Sep: "just go sell"; 18 Sep: "Gio can have them"); never the books, never View as
};
