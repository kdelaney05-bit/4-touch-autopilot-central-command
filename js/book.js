// The book — everything the rooms read, loaded once, refreshed on demand.
// Every row comes through RLS with the seat's own token. ?demo=1 swaps in a
// fictional book and refuses every write.
import * as api from './api.js?v=91';
import { DEMO } from './demo.js?v=91';

export const state = {
  me: null,            // reps row for the signed-in seat
  seats: [],           // active manager/office/admin/owner reps
  stageSeats: [],      // stage_seats
  board: [],           // v_stage_board
  queue: [],           // v_office_queue
  clock: [],           // v_customer_text_clock
  switches: [],        // automation_switches
  lines: [],           // brand_sms_lines
  mentions: [],        // v_my_mentions — tagged for me
  sellers: [],         // v_sellers — who a job can be sold by
  leadSources: [],     // lead_sources — CC's own list, per brand
  proofRules: [],      // ask_proof_rules — what closes each ask (the DB's word, not the room's)
  parcels: [],         // parcel_lookups, last 30 days (324)
  nocs: [],            // paperwork_filled, last 30 days (325)
  people: [],          // every active rep/seat: id, name, initials, role, sms_from — who a bubble can be
  realMe: null,        // the seat that actually signed in — View as (owner/admin) swaps state.me, never this
  viewAsId: null,      // the seat an owner is looking through, or null
  pipeline: [],        // jobs on the selling side (appointment in 90 days, or signed in 60) with the customer embedded — the Pipeline room
  estimates: [],       // estimates, last 90 days — a price on file puts a customer in Estimate out
  direct: null,        // v_direct_lines (346) — my direct lines; null until the migration is on live
  directives: [],      // my_directives (358) — what I sent out, who picked it up, the chain
  crews: [],           // crew_people (356) — the seat's crews: a name, a phone, a language
  nuggets: [],         // v_crew_nuggets (356/357) — in their court, and what came back
  quotes: [],          // v_quote_requests (353) — the pricer's queue + the reps' answers, last 30 days
  quoteChecklist: [],  // quote_checklist (353) — the questions, from the database
  quotePhotos: [],     // the photos attached to open quote requests (for the queue card)
  touches: [],         // touches, last 90 days — the last time a rep worked a customer; the Pipeline room's worked / cooling / unworked split
  warnings: [],
  loadedAt: null,
};

export const isDemo = () => /[?&]demo=1/.test(location.search);

export async function loadAll() {
  state.warnings = [];
  if (isDemo()) {
    Object.assign(state, DEMO.book());
    Object.assign(state, { quotes: DEMO.quotes(), quoteChecklist: DEMO.checklist(), quotePhotos: DEMO.photos(), crews: DEMO.crews(), nuggets: DEMO.nuggets(), directives: DEMO.directives() });
    state.realMe = state.me;   // View as needs the real seat in the demo too
    const as = (/[?&]as=(sales|office|manager)/.exec(location.search) || [])[1];   // see the demo as another seat
    if (as) { const seat = (state.people || []).find((p) => p.role === as) || state.me; state.me = { ...seat, role: as, manages_company_id: null }; }
    state.loadedAt = new Date(); return state;
  }
  const s = api.getSession();
  const since30 = new Date(Date.now() - 30 * 86400e3).toISOString();
  const since90 = new Date(Date.now() - 90 * 86400e3).toISOString(), since60 = new Date(Date.now() - 60 * 86400e3).toISOString();
  const [me, seats, stageSeats, board, queue, clock, switches, lines, mentions, sellers, leadSources, proofRules, parcels, nocs, people, pipeline, estimates, touches, direct] = await Promise.all([
    api.one(`reps?select=id,name,role,manages_company_id,track&id=eq.${s.repId}`),
    api.page('reps?select=id,name,role,email&active=eq.true&role=in.(manager,office,admin,owner)&order=name.asc'),
    api.page('stage_seats?select=*'),
    api.page('v_stage_board?select=*&order=days_in_stage.desc', 3000),
    api.page('v_office_queue?select=*&order=opened_at.asc', 2000),
    api.page('v_customer_text_clock?select=*&order=waiting_min.desc', 1000),
    api.page('automation_switches?select=*'),
    api.page('brand_sms_lines?select=*'),
    api.page('v_my_mentions?select=*&order=created_at.desc', 200).catch(() => []),
    api.page('v_sellers?select=*&order=name.asc').catch(() => []),
    api.page('lead_sources?select=cc_lead_id,name,cc_company_id,cc_total_used&is_active=eq.true&order=cc_total_used.desc.nullslast').catch(() => []),
    api.page('ask_proof_rules?select=*').catch(() => []),
    // 324/325: the permit lane's last 30 days — owner checks and NOCs made, for the Office door on the home room
    api.page(`parcel_lookups?select=customer_id,signer_match,fetched_at&fetched_at=gte.${since30}&order=fetched_at.desc`, 2000).catch(() => []),
    api.page(`paperwork_filled?select=customer_id,form_key,filled_at&filled_at=gte.${since30}&order=filled_at.desc`, 2000).catch(() => []),
    // everyone who can appear on a file's thread — reps, office, production, owners — with the line they text from (Kevin, 14 Sep: a color per person)
    api.page('reps?select=id,name,initials,role,sms_from&active=eq.true&order=name.asc', 500).catch(() => []),
    // the Pipeline room (Kevin, 14 Sep): the selling side of every rep's book — unsigned jobs with an appointment in the last 90 days
    // (or still ahead), plus what was signed in the last 60, with the customer on the row. RLS decides whose book a seat sees.
    api.page(`jobs?select=id,customer_id,rep_id,cc_company_id,title,appt_starts_at,contract_signed_at,fin_sold_amount,created_at,customers(name,phone,city,disposition,disposition_at)&or=(and(contract_signed_at.is.null,appt_starts_at.gte.${since90}),contract_signed_at.gte.${since60})&order=appt_starts_at.desc.nullslast`, 5000).catch(() => []),
    api.page(`estimates?select=customer_id,rep_id,amount,occurred_at&occurred_at=gte.${since90}&order=occurred_at.desc`, 4000).catch(() => []),
    // the Pipeline room's "is he working it": the last touch per customer (touches has no RLS; every seat reads it)
    api.page(`touches?select=customer_id,rep_id,occurred_at,channel&occurred_at=gte.${since90}&order=occurred_at.desc`, 8000).catch(() => []),
    // 346: direct lines. null (not []) when the view is not on live yet, so the rail can say so instead of reading empty.
    api.page('v_direct_lines?select=*&order=last_at.desc', 200).catch(() => null),
  ]);
  let everyone = people;
  if ((people || []).length < 3) {
    const names = await api.page('rep_names?select=id,name&order=name.asc', 500).catch(() => []);
    if (names.length > (people || []).length) everyone = names.map((n) => (people || []).find((p) => p.id === n.id) || { id: n.id, name: n.name, initials: String(n.name || '').split(/\s+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase(), role: null, sms_from: null });
  }
  Object.assign(state, { me, seats, stageSeats, board, queue, clock, switches, lines, mentions, sellers, leadSources, proofRules, parcels, nocs, people: everyone, pipeline, estimates, touches, direct });
  // 353: quotes to Gio — the open ones and the last 30 days, the checklist, and the photos the open ones carry
  const [quotes, quoteChecklist] = await Promise.all([
    api.page(`v_quote_requests?select=*&or=(status.eq.open,created_at.gte.${since30})&order=created_at.desc`, 300).catch(() => []),
    api.page('quote_checklist?select=*&order=ord.asc', 50).catch(() => []),
  ]);
  const qids = [...new Set(quotes.filter((q) => q.status === 'open').flatMap((q) => q.photo_ids || []))];
  const quotePhotos = qids.length ? await api.page(`v_file_photos?select=*&id=in.(${qids.join(',')})`, 400).catch(() => []) : [];
  Object.assign(state, { quotes, quoteChecklist, quotePhotos });
  // 358: what I sent out — every seat has a downline
  state.directives = await api.rpc('my_directives', { p_days: 7 }).then((r) => (Array.isArray(r) ? r : [])).catch(() => []);
  // 356/357: my crews and the nuggets in their court (managers)
  if (['manager', 'owner', 'admin'].includes(me?.role)) {
    const [crews, nuggets] = await Promise.all([
      api.page('crew_people?select=id,name,phone,cc_company_id,lang,manager_id,active&order=name.asc', 200).catch(() => []),
      api.page(`v_crew_nuggets?select=*&or=(status.eq.open,created_at.gte.${since30})&order=created_at.desc`, 300).catch(() => []),
    ]);
    Object.assign(state, { crews, nuggets });
  }
  // View as (Kevin, 15 Sep night: "flip through everyone in my company and see what they would see"): an owner or
  // admin looks through another seat — the rooms and the name are theirs; the rows are still what the owner's
  // login can read, because RLS runs on the real token. Survives a reload.
  state.realMe = me;
  if (state.viewAsId && me && (["fa314b31-dac6-4666-8920-e95d471f5732"].includes(me.id) || me.role === "admin")) { const s = (people || []).find((p) => p.id === state.viewAsId); if (s) state.me = { ...me, ...s }; else state.viewAsId = null; }
  if (!me) state.warnings.push('No seat row for this login — the database will show nothing.');
  if (board.truncated) state.warnings.push('Stage board cut at 3,000 rows.');
  state.loadedAt = new Date();
  return state;
}

export const seatName = (id) => state.seats.find((r) => r.id === id)?.name ?? null;
export const first = (name) => String(name || '').split(/[ ,]/).filter(Boolean)[0] || '';
/* "Reed, Dana" → "Dana Reed"; "Dana Reed" stays. */
export function personName(name) {
  const n = String(name || '').trim();
  const m = /^([^,]+),\s*(.+)$/.exec(n);
  return m ? `${m[2].trim()} ${m[1].trim()}` : n;
}
export const firstName = (name) => { const p = personName(name).split(/\s+/); return p[0] || ''; };

// ── one customer's file ──────────────────────────────────────────────────────
export async function loadFile(customerId) {
  if (isDemo()) return DEMO.file(customerId);
  const rows = state.board.filter((b) => b.customer_id === customerId);
  let job = rows.sort((a, b) => (a.completed_at ? 1 : 0) - (b.completed_at ? 1 : 0))[0] || null;
  if (!job) {
    // not on the stage board (selling, or older than 30 days): read the job directly
    const j = await api.one(`jobs?select=id,cc_project_id,cc_company_id,customer_id,title,fin_sold_amount,contract_signed_at,completed_at,rep_id&customer_id=eq.${customerId}&order=created_at.desc`);
    const c = await api.one(`customers?select=id,name,phone,email,sms_opt_out_at&id=eq.${customerId}`);
    job = j ? { job_id: j.id, cc_project_id: j.cc_project_id, cc_company_id: j.cc_company_id, customer_id: customerId, customer_name: c?.name, customer_phone: c?.phone,
                title: j.title, fin_sold_amount: j.fin_sold_amount, contract_signed_at: j.contract_signed_at, completed_at: j.completed_at, rep_id: j.rep_id,
                stage: j.contract_signed_at ? 'sold_office' : 'selling', days_in_stage: null, owner_name: null, open_asks: 0 }
            : { customer_id: customerId, customer_name: c?.name, customer_phone: c?.phone, stage: 'booked' };
    job.sms_opt_out_at = c?.sms_opt_out_at ?? null;
  }
  const [texts, emails, cust, handoffs, outbox, estimates, estLinks, parcel, filled, fence, packet] = await Promise.all([
    api.page(`text_messages?select=id,direction,body,occurred_at,uvoice_ext,from_number,to_number,has_media,media_url,feed_source,resolved_rep_id&resolved_customer_id=eq.${customerId}&order=occurred_at.asc`, 2000),
    api.rpc('file_email_thread', { p_customer: customerId }).catch(() => []),
    api.one(`customers?select=id,name,phone,email,sms_opt_out_at&id=eq.${customerId}`),
    job.job_id ? api.page(`job_handoffs?select=*&job_id=eq.${job.job_id}&order=at.asc`) : [],
    api.page(`sms_outbox?select=id,body,status,queued_at,sent_at,from_number,rep_id,play&customer_id=eq.${customerId}&order=queued_at.asc`, 500).catch(() => []),
    // 322: the itemized estimates on this file (the rep's own, or all of them for a manager), and their links
    api.page(`estimate_docs?select=id,serial_number,title,total,status,accepted_at,issue_date,valid_until,link_id,created_at&customer_id=eq.${customerId}&order=created_at.desc`, 100).catch(() => []),
    api.page(`estimate_links?select=id,token&customer_id=eq.${customerId}&doc_id=not.is.null`, 100).catch(() => []),
    // 324: the owner of record the county holds for this address, if anyone has looked
    api.rpc('parcel_lookup_latest', { p_customer: customerId }).catch(() => null),
    // 325: the county forms already filled from this file
    api.rpc('paperwork_filled_for', { p_customer: customerId }).catch(() => []),
    // 328/331: what the rep had in Gio's calculator at Complete Quote — the six numbers, the county's description of work
    api.rpc('fence_takeoff_for', { p_customer: customerId }).catch(() => null),
    // 328: the packet the calculator filed — material order, signed proposal, county packet, the drawing (private estimates bucket)
    api.page(`proofs?select=id,kind,label,signed,storage_path,mime,uploaded_at,uploaded_by&customer_id=eq.${customerId}&kind=in.(material_order,proposal,permit_packet,drawing)&order=uploaded_at.desc`, 60).catch(() => []),
  ]);
  let thread = null, messages = [], asks = [], attachments = [];
  if (job.cc_project_id) {
    thread = await api.one(`job_threads?select=id,project_id,company_id,customer_name&project_id=eq.${encodeURIComponent(job.cc_project_id)}`);
    if (thread) {
      [messages, asks, attachments] = await Promise.all([
        api.page(`thread_messages?select=id,lane,author_id,author_name,body,is_system,created_at&thread_id=eq.${thread.id}&order=created_at.asc`, 2000),
        api.page(`thread_asks?select=id,lane,ask_type,doc_kind,note,state,assignee_id,assignee_name,opened_by_name,opened_at,closed_at,minutes_to_close,proof&thread_id=eq.${thread.id}&order=opened_at.asc`, 500),
        api.page(`thread_attachments?select=id,ask_id,message_id,lane,label,storage_path,source,source_id,created_at,added_by&thread_id=eq.${thread.id}&order=created_at.asc`, 500),
      ]);
    }
  }
  // 351: every photo on this customer — ours and CompanyCam's, newest first
  const [photos, quotes, receipts] = await Promise.all([
    api.page(`v_file_photos?select=*&customer_id=eq.${customerId}&order=taken_at.desc`, 400).catch(() => []),
    api.page(`v_quote_requests?select=*&customer_id=eq.${customerId}&order=created_at.desc`, 20).catch(() => []),   // 353
    thread ? threadReceipts(thread.id).catch(() => []) : [],   // 354: who each note reached
  ]);
  return { job, customer: cust, texts, emails: Array.isArray(emails) ? emails : [], thread, messages, asks, attachments, handoffs, outbox, estimates, estLinks, parcel, filled: Array.isArray(filled) ? filled : [],
           fence: fence && fence.found ? fence : null, packet: Array.isArray(packet) ? packet : [], photos: Array.isArray(photos) ? photos : [], quotes: Array.isArray(quotes) ? quotes : [], receipts: Array.isArray(receipts) ? receipts : [] };
}
/* A ten-minute link to one of the packet's files (328). RLS on the bucket decides. */
export async function openPacketFile(path) { guard(); return api.signUrl('estimates', path); }

// ── writes (all refused in demo) ─────────────────────────────────────────────
const guard = () => { if (isDemo()) throw new Error('Demo — nothing is saved'); };
export async function takeJob(jobId, note) { guard(); return api.rpc('job_take', { p_job: jobId, p_note: note ?? null }); }
export async function assignJob(jobId, to, note) { guard(); return api.rpc('job_assign', { p_job: jobId, p_to: to, p_note: note ?? null }); }
export async function handBack(jobId, note) { guard(); return api.rpc('job_handback', { p_job: jobId, p_note: note ?? null }); }
export async function settleAsk(askId, proof) { guard(); return api.rpc('ask_settle', { p_ask: askId, p_proof: proof }); }
export async function openAsk(threadId, lane, askType, note, assigneeId, docKind) {
  guard();
  return api.insert('thread_asks', { thread_id: threadId, lane, ask_type: askType, note, assignee_id: assigneeId, opened_by: api.getSession().repId, doc_kind: docKind ?? null });
}
export async function postMessage(threadId, lane, body) {
  guard();
  return api.insert('thread_messages', { thread_id: threadId, lane, author_id: api.getSession().repId, body });
}
export async function textCustomer(customerId, body) { guard(); return api.rpc('file_text_queue', { p_customer: customerId, p_body: body }); }
/* The invoice, queued for QuickBooks. The qb_invoices switch decides whether
   it ever leaves the building; this only writes the row, and settles the
   INVOICE ask behind it when one is picked. */
export async function adoptJob(jobId, step) { guard(); return api.rpc('job_adopt', { p_job: jobId, p_step: step }); }
export async function invoiceRequest(jobId, amount, memo, askId) { guard(); return api.rpc('invoice_request', { p_job: jobId, p_amount: amount, p_memo: memo ?? null, p_ask: askId ?? null }); }
export async function linePreview(customerId) {
  if (isDemo()) return [
    { key: 'review_prompt', label: 'Review prompt · rate us 1–10', body: 'Hey Dana, This is Kevin with Liberty Fencing and I wanted to follow up on the project and ask how would you rate the staff and workmanship on a scale from 1-10 ( 10 being the BEST) ?' },
    { key: 'permit_in', label: 'Permit approved', body: 'Hi Dana, Kevin at Liberty Fencing. Your permit is approved. Next up is scheduling — we\'ll text you the day here.' },
    { key: 'schedule_set', label: "You're on the schedule", body: "Hi Dana, Kevin with Liberty Fencing. You're on the schedule for {{date}}. Obed, our supervisor, will text you here before the crew arrives." },
    { key: 'invoice_sent', label: 'Invoice sent', body: 'Thank you for choosing Liberty Fencing. We sincerely appreciate your business. Please find your invoice attached for your records. {{link}}' },
    { key: 'super_hello', label: 'Supervisor hello', body: "Hi Dana, Obed here, your Liberty Fencing supervisor. I'll text you the start day, and I'm your contact through the job — reply here anytime." },
    { key: 'pay_link', label: 'Payment link', body: 'Hi Dana, Liberty Fencing here. Your invoice is ready and you can pay it online here: {{link}} — thank you!' },
    { key: 'lead_reply', label: 'Estimate request · call us back', body: 'Good morning, Liberty Fencing here. I am reaching out because we received a request that you were looking for a Free Fencing Estimate for an upcoming project and I\'d love to get that scheduled for you today! Please call us back at 321-215-4437 at your earliest convenience. We look forward to hearing from you. Thank you' },
  ];
  const r = await api.rpc('line_preview', { p_customer: customerId });
  return Array.isArray(r) ? r : [];
}
export async function cancelText(id) { guard(); return api.rpc('app_text_cancel', { p_id: id }); }
export async function ensureThread(ccProjectId) { guard(); return api.rpc('ensure_thread', { p_cc_project_id: ccProjectId }); }
export async function createJob(args) { guard(); return api.rpc('job_create', args); }
/* 322: the itemized estimate — one call mints the document, its items, the amount fact and the tracked link. */
export async function createEstimate(p) { guard(); return api.rpc('estimate_doc_create', { p }); }
/* 324: ask the county who owns the address on this file; the row lands on the file with the signer check. */
export async function parcelLookup(customerId, signerName) { guard(); return api.fn('parcel-lookup', { customer_id: customerId, signer_name: signerName ?? null }); }
/* 325: fill the NOC (or a named county form) from the file; open a filled one with a fresh signed link. */
export async function fillPaperwork(customerId, formKey) { guard(); return api.fn('paperwork-fill', { customer_id: customerId, form_key: formKey ?? null }); }
export async function openPaperwork(id) { guard(); return api.fn('paperwork-fill', { open: id }); }
export async function threadForJob(jobId) { guard(); return api.rpc('file_thread_for', { p_job: jobId }); }
export async function mentionSeen(threadId) { if (isDemo()) return 0; return api.rpc('mention_seen', { p_thread: threadId }).catch(() => 0); }
export async function setSwitch(key, on) { guard(); return api.rpc('automation_switch_set', { p_key: key, p_on: on }); }
export async function uploadDoc(job, lane, file) {
  guard();
  const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 80);
  const path = `${job.cc_company_id || '0'}/${job.cc_project_id}/${lane}/DOC/${Date.now()}-${safe}`;
  await api.uploadPublic('job-docs', path, file, file.type || 'application/octet-stream');
  return { storage_path: path, label: file.name };
}
/* A document on the file with no ask behind it: the permit that arrived, the HOA letter, a photo. */
export async function addDoc(job, threadId, lane, file, label) {
  guard();
  const up = await uploadDoc(job, lane, file);
  return api.insert('thread_attachments', { thread_id: threadId, lane, source: 'storage', storage_path: up.storage_path, label: label || file.name, added_by: api.getSession().repId });
}
/* 346: a direct line — the thread with one person, a message to them, and 'seen'. */
export async function directThread(otherId) {
  if (isDemo()) return DEMO.dm(otherId);
  const me = api.getSession().repId;
  return api.page(`direct_messages?select=id,from_id,to_id,body,created_at,seen_at&or=(and(from_id.eq.${me},to_id.eq.${otherId}),and(from_id.eq.${otherId},to_id.eq.${me}))&order=created_at.asc`, 2000);
}
export async function sendDirect(toId, body) { guard(); return api.insert('direct_messages', { from_id: api.getSession().repId, to_id: toId, body }, false); }
export async function directSeen(fromId) { if (isDemo()) return 0; return api.rpc('direct_seen', { p_from: fromId }).catch(() => 0); }
/* THE HANDLE — 312's mention_resolve takes "@First" or "@First Last". Two active
   Jessicas (Coley · Oasis) made a bare "@Jessica" a coin flip on 15 Sep, so a
   first name shared by more than one active seat is written with the last
   name. The server resolves the two-word form exactly. */
export function mentionHandle(person) {
  const f = firstName(person?.name || '');
  if (!f) return '';
  const dup = (state.people || []).filter((p) => p.id !== person.id && firstName(p.name).toLowerCase() === f.toLowerCase()).length > 0;
  const last = String(person.name || '').trim().split(/\s+/).slice(1).join(' ');
  return '@' + (dup && last ? f + ' ' + last : f);
}
/* People a line can go to: every active seat but me. Name match, first or last. */
export function searchPeople(q) {
  const term = q.trim().toLowerCase();
  if (term.length < 2) return [];
  return (state.people || []).filter((p) => p.id !== state.me?.id && String(p.name || '').toLowerCase().includes(term)).slice(0, 6);
}
export async function searchCustomers(q) {
  if (isDemo()) return DEMO.search(q);
  const term = q.trim();
  if (term.length < 2) return [];
  const digits = term.replace(/\D/g, '');
  // Kevin, 15 Sep: "a drop down box either by their address or last name… a thousand ways to quickly get this out."
  // A number is a phone; anything else matches the name OR the street, and the row says which so a "Cox" is not a surprise.
  // Kevin, 15 Sep, eleven Delaneys deep: "Delaney beta" must find "Delaney, Kev beta" — so every word matches on its
  // own (name OR street), the newest file comes first, and the row carries the street and the date to tell twins apart.
  const words = term.split(/\s+/).filter(Boolean).slice(0, 4).map((w) => encodeURIComponent(w.replace(/[,()]/g, '')));
  const filter = digits.length >= 4
    ? `phone.ilike.*${digits.split('').join('*')}*`   // the phone is stored as (786) 366-1475: a star between every digit finds it however it was typed (Sam, 16 Sep)
    : words.length === 1 ? `name.ilike.*${words[0]}*,street.ilike.*${words[0]}*` : null;
  const where = filter ? `or=(${filter})` : `and=(${words.map((w) => `or(name.ilike.*${w}*,street.ilike.*${w}*)`).join(',')})`;
  return api.page(`customers?select=id,name,phone,street,city,updated_at,created_at&${where}&order=updated_at.desc.nullslast&limit=20`, 20);
}

/* ── 351: THE PHOTOS — a photo is something you SAY on the file ────────────
   Kevin, 15 Sep night: "the crews, sales and supervisors communicate with
   pics." Shrink on the device (1600 for the file, 320 for the strip), two
   objects in the public job-photos bucket under the customer's uuid, then one
   RPC that writes the row AND the line on the thread — so @Luis in the caption
   rides the same rails as any note, and the bing rides on it. */
export async function postPhoto(customerId, file, o = {}) {
  guard();
  const id = (crypto.randomUUID ? crypto.randomUUID() : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)));
  const [big, small] = await Promise.all([shrinkImage(file, 1600, 0.82), shrinkImage(file, 320, 0.72)]);
  const path = `${customerId}/${id}-1600.jpg`, thumb = `${customerId}/${id}-320.jpg`;
  await api.uploadPublic('job-photos', path, big, 'image/jpeg');
  await api.uploadPublic('job-photos', thumb, small, 'image/jpeg');
  return api.rpc('job_photo_post', { p_customer: customerId, p_path: path, p_thumb: thumb, p_caption: o.caption || null, p_source: 'web',
    p_tagged: Array.isArray(o.tagged) ? o.tagged : [], p_crew: o.crew || null, p_amount: o.amount != null && o.amount !== '' && Number.isFinite(Number(o.amount)) ? Number(o.amount) : null });
}
async function shrinkImage(file, max, quality) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => createImageBitmap(file));
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(bmp.width * s)); c.height = Math.max(1, Math.round(bmp.height * s));
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not read that picture'))), 'image/jpeg', quality));
}
/* the picture's address, for a strip thumbnail or the full size */
export function photoSrc(p, thumb = false) {
  if (p.kind === 'ours' && p.path) return api.publicUrl('job-photos', thumb && p.thumb_path ? p.thumb_path : p.path);
  return (thumb && p.thumb_url) || p.url || p.thumb_url || '';
}

/* 352: the crews a photo can name — CC's subs plus every crew already typed on a photo (Mike's Oasis crews) */
let crewsCache = null;
export async function loadCrews() {
  if (isDemo()) return ['Oasis · Nick', 'Crew Ortiz', 'Bello Fencing', 'CG Fence'];
  if (crewsCache) return crewsCache;
  const rows = await api.page('v_photo_crews?select=name&order=name.asc', 300).catch(() => []);
  crewsCache = [...new Set(rows.map((r) => r.name).filter(Boolean))];
  return crewsCache;
}
/* the Photos room: every picture the seat can read, newest first, with the customer's name on it */
export async function loadPhotoFeed() {
  if (isDemo()) return DEMO.photos();
  const rows = await api.page('v_file_photos?select=*&order=taken_at.desc&limit=400', 400);
  const names = new Map();
  for (const x of state.board || []) names.set(x.customer_id, x.customer_name);
  for (const j of state.pipeline || []) if (j.customers?.name) names.set(j.customer_id, j.customers.name);
  const missing = [...new Set(rows.map((r) => r.customer_id).filter((id) => id && !names.has(id)))];
  for (let i = 0; i < missing.length; i += 80) {
    const chunk = missing.slice(i, i + 80);
    const cs = await api.page('customers?select=id,name&id=in.(' + chunk.join(',') + ')', 200).catch(() => []);
    for (const c of cs) names.set(c.id, c.name);
  }
  return rows.map((r) => ({ ...r, customer_name: names.get(r.customer_id) || 'A customer' }));
}

/* 353: the pricer's answer — one RPC, one line on the file that @-tags the rep */
export async function answerQuote(id, price, note) { guard(); return api.rpc('quote_request_answer', { p_id: id, p_price: Number(price), p_note: note || null }); }

/* 354: THE RECEIPT (Kevin, 16 Sep, after his first push: "i didn't get a notification of who it
   went to"). Who a note reached, how (a phone that buzzed or a You're up that waits), and who
   has opened it. Read after a post, and on the file for every note. */
export async function threadReceipts(threadId) { if (isDemo()) return []; return api.rpc('thread_receipts', { p_thread: threadId }); }
export function receiptWords(rows) {
  if (!rows || !rows.length) return 'Nobody was named — it sits on the file only.';
  const phone = rows.filter((r) => r.has_phone).map((r) => firstName(r.name));
  const desk = rows.filter((r) => !r.has_phone).map((r) => firstName(r.name));
  const parts = [];
  if (phone.length) parts.push(`buzzed ${phone.join(', ')} on the phone`);
  if (desk.length) parts.push(`${desk.join(', ')} ${desk.length === 1 ? 'sees it' : 'see it'} in You're up (no phone signed in)`);
  return 'Sent → ' + parts.join(' · ');
}

/* THE NEXT WORD (Kevin, 16 Sep: "give the office staff and ops staff a gift like we did the
   sales reps — a quicker better faster way"). The office's Armory is the twelve approved lines,
   already filled from the file. This puts the RIGHT one in the box at the moment it is needed:
   close the permit ask → "your permit is approved" is in the box; set the schedule → "you're on
   the schedule for Thursday" is in the box; a customer asks about paying → the pay-link line is
   in the box. One tap: Send. Nothing sends by itself; the machine texts stay off. */
export const NEXT_WORD_FOR_ASK = { PERMIT: 'permit_in', SCHEDULE: 'schedule_set', INVOICE: 'invoice_sent', INVOICE_SENT: 'invoice_sent' };
export const NEXT_WORD_FOR_QUESTION = { 'Where is the permit': 'permit_in', 'When do we start': 'schedule_set', 'Paying the balance': 'pay_link', 'Where is the crew': 'super_hello', 'What does it cost': 'lead_reply', 'Changing something': null };
export function nextWordFor(ask, proof) {
  const key = NEXT_WORD_FOR_ASK[ask?.ask_type]; if (!key) return null;
  const extra = {};
  if (ask.ask_type === 'SCHEDULE' && proof?.value) extra.date = proof.value;
  if (proof?.link) extra.link = proof.link;
  if (proof?.value && ask.ask_type === 'PERMIT') extra.permit = proof.value;
  return { customerId: ask.customer_id, key, extra, why: askLabelWord(ask.ask_type) };
}
const askLabelWord = (t) => ({ PERMIT: 'the permit is in', SCHEDULE: 'the day is set', INVOICE: 'the invoice went out' })[t] || 'that step closed';
/* the line, rendered for this customer with the extras (the date, the link) — the same renderer the machine uses */
export async function renderLine(key, customerId, extra = {}) {
  if (isDemo()) { const l = (await linePreview(customerId)).find((x) => x.key === key); return l ? fillExtra(l.body, extra) : ''; }
  try { const r = await api.rpc('line_render', { p_key: key, p_customer: customerId, p_sender: api.getSession().repId, p_extra: extra }); if (typeof r === 'string' && r) return r; } catch {}
  const l = (await linePreview(customerId).catch(() => [])).find((x) => x.key === key);
  return l ? fillExtra(l.body, extra) : '';
}
function fillExtra(body, extra) {
  let s = String(body || '');
  if (extra.date) { const d = new Date(String(extra.date).length <= 10 ? extra.date + 'T12:00:00' : extra.date); s = s.replace(/\{\{date\}\}/g, d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })); }
  if (extra.link) s = s.replace(/\{\{link\}\}/g, extra.link);
  return s;
}
/* offer it: remember what the box should hold, open the file beside the room */
export function offerNextWord(nw) { if (!nw) return; state.nextWord = nw; if (window.__peek) window.__peek(nw.customerId); }

/* 356/357: the crews and the nugget */
export async function upsertCrew(id, name, phone, company, lang, active) { guard(); return api.rpc('crew_person_upsert', { p_id: id, p_name: name, p_phone: phone, p_company: company, p_lang: lang, p_active: active }); }
export async function sendNugget(personId, body, bring, bringLabel, customerId, due, photoIds = [], amount = null) { guard(); return api.rpc('nugget_send', { p_person: personId, p_body: body, p_bring: bring, p_bring_label: bringLabel, p_customer: customerId, p_due: due, p_photo_ids: photoIds, p_amount: amount }); }

/* 358b: a word to the team room (the village) — the encourager's share */
export async function postRoom(room, body, customerId) { guard(); return api.insert('team_messages', { room, body, customer_id: customerId ?? null }, false); }
