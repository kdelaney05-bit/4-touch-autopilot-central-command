// The house words — every room speaks these, never the database's names.
//
// Kevin, 15 Sep 2026, on the first Flow room: "what am I looking at, I have no
// clue… I should be able to easily look at the flow and have a clue." Then, on
// the rebuilt Job Board: "so much more descriptive… I now officially understand
// everything… apply this picture move to anywhere in this entire CRM." So the
// steps, the things, the sentences and the pictures live here, once, and the
// Job Board, the Office room and the customer file all read from it.
//
// Pictures are plain line symbols (inline SVG), never emoji ("don't cheese it
// up"). No alarm colors: a step shows its own usual pace in grey; a soft
// highlight only when it is clearly past that ("it can't be mean and alarm
// all the time").

/* the steps a sold job walks, in order, in the office's words */
export const STEPS = [
  { key: 'signed',    label: 'Signed',       hint: 'the customer signed',                          types: [] },
  { key: 'paperwork', label: 'Paperwork',    hint: 'Sam is collecting the rest of the paperwork',   types: ['CONTRACT_DOC'] },
  { key: 'permit',    label: 'Permit',       hint: 'waiting on the county',                        types: ['PERMIT'] },
  { key: 'locate',    label: '811 locate',   hint: 'Diana files it, the utilities mark the yard',  types: ['SURVEY'] },
  { key: 'material',  label: 'Material',     hint: 'Jonathan orders it',                           types: ['MATERIAL', 'MATERIAL_REQUEST'] },
  { key: 'schedule',  label: 'Install date', hint: 'Jonathan sets the day with the customer',      types: ['SCHEDULE', 'SCHEDULE_QUESTION'] },
  { key: 'crew',      label: 'Crew',         hint: "Luis's crew builds it",                        types: ['COMPLETION_SIGNOFF', 'MILESTONE', 'SAFETY_JHA', 'SITE_ISSUE', 'SUPERVISOR_PING', 'CHANGE_ORDER', 'CUSTOMER_REQUEST'] },
  { key: 'invoice',   label: 'Invoice',      hint: 'Laura bills it, Sam books the inspection',     types: ['INVOICE', 'INSPECTION'] },
  { key: 'payment',   label: 'Payment',      hint: 'waiting on the money',                         types: ['PAYMENT'] },
  { key: 'closeout',  label: 'Done',         hint: 'paid and closed',                              types: ['CLOSEOUT'] },
];
export const STEP_OF = {}; for (const s of STEPS) for (const t of s.types) STEP_OF[t] = s;
export const stepOf = (askType) => STEP_OF[askType] || null;

/* what each ask is, in words */
const THING = {
  'CONTRACT_DOC:contract': 'the signed contract', 'CONTRACT_DOC:noc': 'the recorded Notice of Commencement', 'CONTRACT_DOC:hoa': 'the HOA approval',
  'CONTRACT_DOC:survey': 'the property survey', 'CONTRACT_DOC:permit_sig': 'the signed permit application', 'CONTRACT_DOC:': 'a document',
  'PERMIT:': 'the permit', 'SURVEY:': 'the 811 locate', 'MATERIAL:': 'the material order', 'SCHEDULE:': 'the install date',
  'COMPLETION_SIGNOFF:': 'the finished-job photos', 'INVOICE:': 'the invoice', 'INSPECTION:': 'the final inspection', 'PAYMENT:': 'the payment',
  'CLOSEOUT:': 'the closeout', 'MILESTONE:tearoff': 'the tear-off photo', 'MILESTONE:dryin_ordered': 'the dry-in order', 'MILESTONE:sheathing_inspection': 'the sheathing inspection',
  'MILESTONE:dryin_passed': 'the dry-in inspection', 'MILESTONE:shingling': 'the shingling photo', 'MILESTONE:walkthrough': 'the walkthrough', 'MILESTONE:': 'the milestone',
  'SOLD_CHECK:': 'sold or not', 'INTRO_CALL:': 'the intro call', 'CHANGE_ORDER:': 'the signed change order', 'SAFETY_JHA:': 'the safety photo',
  'CUSTOMER_REQUEST:': "the customer's request", 'MATERIAL_REQUEST:': 'a material run', 'SITE_ISSUE:': 'a site issue', 'SCHEDULE_QUESTION:': 'a schedule question',
  'SUPERVISOR_PING:': 'the supervisor',
};
export const thing = (a) => THING[`${a?.ask_type}:${a?.doc_kind || ''}`] || THING[`${a?.ask_type}:`] || String(a?.ask_type || '').toLowerCase().replace(/_/g, ' ');

/* the machine's own ledger lines ("X asked Y for contract doc (noc)"), read back as a sentence */
const NICE_TYPE = Object.fromEntries(Object.entries(THING).map(([k, v]) => [k.split(':')[0].toLowerCase().replace(/_/g, ' '), v]));
export function say(body) {
  if (!body) return '';
  let m;
  if ((m = /^(.+?) asked (.+?) for (.+?)(?: \((\w+)\))?$/.exec(body))) {
    const t = THING[`${m[3].toUpperCase().replace(/ /g, '_')}:${m[4] || ''}`] || NICE_TYPE[m[3]] || m[3];
    return `${firstOf(m[1])} handed ${firstOf(m[2])} ${t}`;
  }
  if ((m = /^(.+?) settled (.+?)(?: \((\w+)\))? in ([\d.]+ (?:min|h|d))(?: · (.+))?$/.exec(body))) {
    const type = m[2].toUpperCase().replace(/ /g, '_'), kind = m[3] || '', v = (m[5] || '').replace(/^waived: /, '');
    const waived = /^waived: /.test(m[5] || '');
    const t = THING[`${type}:${kind}`] || NICE_TYPE[m[2]] || m[2];
    if (waived) return `${firstOf(m[1])} skipped ${t}: ${v.replace(/^probe: /, '')}`;
    if (type === 'SCHEDULE' && v) return `${firstOf(m[1])} set the install date: ${md(v)}`;
    if (type === 'PERMIT' && v) return /none required/i.test(v) ? 'No permit needed here — the machine moved on' : `${firstOf(m[1])} got the permit: ${v}`;
    if (type === 'SURVEY' && v) return `The 811 locate is filed — ${v.replace(/^811 /, '')}`;
    if (type === 'CONTRACT_DOC' && kind === 'contract') return 'The signed contract is on the file';
    return `${firstOf(m[1])} turned in ${t}${v ? ': ' + v : ''}`;
  }
  if (/^Paperwork is official/.test(body)) return /released/.test(body) ? 'All the paperwork is in — material is released to order' : 'All the paperwork is in — material waits on the deposit';
  if ((m = /^811 ticket (\d+): (\d+) operators? responded — ALL CLEAR, dig on or after (.+)$/.exec(body))) return `Every utility answered the 811 locate — clear to dig on or after ${m[3]}`;
  if ((m = /^811 ticket (\d+): (\d+) operators? responded/.exec(body))) return `${m[2]} utilities have answered the 811 locate, waiting on the rest`;
  if (/^@office DEPOSIT DUE/.test(body)) return 'The customer tapped PAY BY CARD — the office takes the card by phone';
  if (/^No permit required here/.test(body)) return body.replace(/\. Settle PERMIT.*$/, '.');
  return body;
}
const firstOf = (name) => { const n = String(name || '').trim(); if (/^the machine$/i.test(n)) return 'The machine'; const p = n.includes(',') ? n.split(',')[1].trim() : n.split(/\s+/)[0]; return p || n; };
const md = (s) => { const r = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s)); return r ? `${Number(r[2])}/${Number(r[3])}` : s; };

/* a person's name the way you'd say it: "Pestana, Maria" → "Maria Pestana" */
export const person = (name) => { const raw = String(name || '').trim(); if (raw.includes(',')) { const [l, f] = raw.split(',').map((x) => x.trim()); return `${f} ${l}`; } return raw; };

/* the pictures — plain line symbols */
const I = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICON = {
  signed:    I('<path d="M4 20h16"/><path d="M14.5 4.5l5 5L9 20H4v-5z"/>'),
  paperwork: I('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>'),
  permit:    I('<circle cx="12" cy="11" r="6"/><path d="M12 8v3l2 1"/><path d="M8 20l4-3 4 3"/>'),
  locate:    I('<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>'),
  material:  I('<path d="M3 8l9-4 9 4-9 4z"/><path d="M3 8v8l9 4 9-4V8"/><path d="M12 12v8"/>'),
  schedule:  I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  crew:      I('<path d="M4 20l6-6"/><path d="M13 5l6 6"/><path d="M11 7l6 6 3-3-6-6z"/><path d="M4 20l3 0 0-3"/>'),
  invoice:   I('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'),
  payment:   I('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>'),
  closeout:  I('<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>'),
  handoff:   I('<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>'),
  done:      I('<path d="M5 12l4 4L19 7"/>'),
  money:     I('<path d="M12 4v16"/><path d="M8.5 8h5a2 2 0 0 1 0 4h-3a2 2 0 0 0 0 4h5"/>'),
  bad:       I('<path d="M6 6l12 12M18 6L6 18"/>'),
  mail:      I('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 7l9 6 9-6"/>'),
  pen:       I('<path d="M4 20h16"/><path d="M14.5 4.5l5 5L9 20H4v-5z"/>'),
  text:      I('<path d="M4 5h16v11H9l-5 4z"/>'),
  call:      I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  doc:       I('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>'),
  camera:    I('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
};
export const iconForAsk = (a) => ICON[stepOf(a?.ask_type)?.key || 'handoff'] || ICON.handoff;

/* "usually 3 days" — the quiet baseline per step, from v_step_baseline; a soft flag only when clearly past it */
export function pace(baseline, askType, openedAt) {
  const b = (baseline || []).find((x) => STEP_OF[x.ask_type]?.key === stepOf(askType)?.key);
  if (!b || b.n_done < 5) return null;
  const days = openedAt ? (Date.now() - new Date(openedAt)) / 86400e3 : null;
  return { usual: Number(b.median_days), slow: days != null && days > Math.max(Number(b.p80_days), Number(b.median_days) * 1.5), days };
}

/* THE MAP — every step of a sold job: who holds it, what the machine does, what the
   person does, what the customer hears. Kevin, 15 Sep: "I want to see all the steps
   of the process with all the actual employees and who does what… same philosophy,
   pictures and everything." Seats come from stage_seats (the office can change them);
   the words here are the rules as built (338, 340, 341, 336). */
export const MAP = [
  { key: 'signed',    seat: 'rep',         machine: ['Emails the rep, Gio and Kevin: "they are sold, get out there today" with the signed contract and the filled Notice of Commencement attached', 'Opens the paperwork checklist on the file and checks off the contract', 'Looks up the owner of record at the county'], person: ['The rep goes out once: notary on the NOC, the permit signature, the survey, selections'], customer: 'Signs on the link: two taps, type your name. "You are locked in."' },
  { key: 'paperwork', seat: 'sold_office', machine: ['Waives the NOC and permit signature where no permit is needed (Palm Coast)', 'The last upload makes the paperwork official — nobody marks it by hand', 'Releases the material the moment the paperwork is official (custom or aluminum: once the deposit is in)'], person: ['Uploads what only she has: the recorded NOC, the HOA approval, the survey, the signed permit application'], customer: 'Nothing — the office is working' },
  { key: 'permit',    seat: 'sold_office', machine: ['Opens the permit ask the moment the checklist finishes', 'Where no permit is needed, settles it itself as "none required" and moves on', 'Writes the 811 locate ticket for the next step'], person: ['Pulls the permit at the county and enters the permit number'], customer: 'Text (draft until sent): "Your permit is approved. Next up is scheduling."' },
  { key: 'locate',    seat: 'locate',      machine: ['Writes the whole Sunshine 811 ticket from the file: address, county, subdivision, lot, parcel, work date', 'Reads the Exactix confirmation email and closes the step with the ticket number', 'Posts every utility\'s answer on the file; "ALL CLEAR" when they have all answered'], person: ['Pastes the ticket into exactix.sunshine811.com (until Sunshine 811 grants us an API)'], customer: 'Nothing — the utilities mark the yard' },
  { key: 'material',  seat: 'schedule',    machine: ['Opens the material ask the moment material releases, with the calculator\'s order attached', 'Holds custom and aluminum until the card deposit is in'], person: ['Places the order with the supplier and enters the PO number'], customer: 'Nothing' },
  { key: 'schedule',  seat: 'schedule',    machine: ['Opens the install-date ask when the locate closes', 'The date hands the job to Luis and drafts the customer\'s schedule text'], person: ['Calls the customer, sets the day and the crew'], customer: 'Text (draft until sent): "You\'re on the schedule for {{date}}. {{super}} will text you before the crew arrives."' },
  { key: 'crew',      seat: 'production',  machine: ['Puts the job on Luis the moment the date is set', 'Three finished photos close it and open the invoice and the inspection'], person: ['Assigns the crew, builds it, posts three finished photos'], customer: 'The supervisor texts before the crew arrives' },
  { key: 'invoice',   seat: 'invoiced',    machine: ['Opens the invoice the moment the crew signs off', 'Opens the final inspection for the office on permitted jobs'], person: ['Laura invoices from the file (QuickBooks); Sam books the inspection and enters the result'], customer: 'Text (draft until sent): "Please find your invoice attached." — with the pay link' },
  { key: 'payment',   seat: 'invoiced',    machine: ['Opens the payment ask behind the invoice, 30-day clock', 'Past-due reminder text when it goes past due'], person: ['Records how it was paid'], customer: 'Pays online or by check' },
  { key: 'closeout',  seat: 'sold_office', machine: ['Opens the closeout when payment lands', 'Sends the review prompt: "how would you rate the staff and workmanship, 1–10?"'], person: ['One tap: the file is complete'], customer: 'The review ask, then the five-star follow-up' },
];
