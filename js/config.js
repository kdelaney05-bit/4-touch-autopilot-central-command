// Liberty Command — the one place. Same project, same publishable key as the
// phone app and the desk; every read and write is bound by row-level
// security. Never a secret key in this folder.
export const SUPA_URL = 'https://lzegjjbkfuecrhdvlvay.supabase.co';
export const SUPA_KEY = 'sb_publishable_kToiGqET7XzO2It9evStJw_kYzvjSF8';
export const SESSION_KEY = 'command:session:v1';

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
  INVOICE: 'Invoice', PAYMENT: 'Payment', CHANGE_ORDER: 'Change order', COMPLETION_SIGNOFF: 'Sign-off',
  MATERIAL_REQUEST: 'Material run', SITE_ISSUE: 'Site issue', SUPERVISOR_PING: 'Supervisor', SAFETY_JHA: 'Safety',
  CUSTOMER_REQUEST: 'Customer request', SCHEDULE_QUESTION: 'Schedule question',
  /* Contractors Cloud's own steps, become asks here (cc_workflow_steps). */
  SOLD_CHECK: 'Sold check', INTRO_CALL: 'Intro call · colors & payment', MILESTONE: 'Milestone',
  INSPECTION: 'Final inspection', CLOSEOUT: 'Close-out',
};
export const DOC_LABEL = {
  contract: 'Signed contract', noc: 'Notice of Commencement', hoa: 'HOA approval', survey: 'Property survey', permit_sig: 'Permit application, signed',
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
  owner:   ['home', 'sales', 'pipeline', 'marketing', 'office', 'production', 'files'],
  admin:   ['home', 'sales', 'pipeline', 'marketing', 'office', 'production', 'files'],
  manager: ['production', 'pipeline', 'files', 'office'],
  office:  ['office', 'files', 'production'],
  sales:   ['files'],
  crew:    [],
};
export const ROOM_LABEL = { home: 'The Business', sales: 'Sales', pipeline: 'Pipeline', marketing: 'Marketing', office: 'Office', production: 'Production', files: 'Files' };

/* The owner console (liberty-command, GitHub Pages, same github.io origin) —
   the dashboard Kevin lived in while the app was built. Its sections route
   on the hash, so each room embeds the one it needs. The console signs in
   on its own the first time; same email and password. */
export const CONSOLE_URL = 'https://kdelaney05-bit.github.io/liberty-command/';
export const CONSOLE_SECTION = { sales: 'sales', marketing: 'marketing', home: 'master' };
