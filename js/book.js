// The book — everything the rooms read, loaded once, refreshed on demand.
// Every row comes through RLS with the seat's own token. ?demo=1 swaps in a
// fictional book and refuses every write.
import * as api from './api.js?v=34';
import { DEMO } from './demo.js?v=34';

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
  pipeline: [],        // jobs on the selling side (appointment in 90 days, or signed in 60) with the customer embedded — the Pipeline room
  estimates: [],       // estimates, last 90 days — a price on file puts a customer in Estimate out
  warnings: [],
  loadedAt: null,
};

export const isDemo = () => /[?&]demo=1/.test(location.search);

export async function loadAll() {
  state.warnings = [];
  if (isDemo()) { Object.assign(state, DEMO.book()); state.loadedAt = new Date(); return state; }
  const s = api.getSession();
  const since30 = new Date(Date.now() - 30 * 86400e3).toISOString();
  const since90 = new Date(Date.now() - 90 * 86400e3).toISOString(), since60 = new Date(Date.now() - 60 * 86400e3).toISOString();
  const [me, seats, stageSeats, board, queue, clock, switches, lines, mentions, sellers, leadSources, proofRules, parcels, nocs, people, pipeline, estimates] = await Promise.all([
    api.one(`reps?select=id,name,role,manages_company_id,track&id=eq.${s.repId}`),
    api.page('reps?select=id,name,role&active=eq.true&role=in.(manager,office,admin,owner)&order=name.asc'),
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
    api.page(`jobs?select=id,customer_id,rep_id,cc_company_id,title,appt_starts_at,contract_signed_at,fin_sold_amount,created_at,customers(name,phone,city,disposition)&or=(and(contract_signed_at.is.null,appt_starts_at.gte.${since90}),contract_signed_at.gte.${since60})&order=appt_starts_at.desc.nullslast`, 5000).catch(() => []),
    api.page(`estimates?select=customer_id,rep_id,amount,occurred_at&occurred_at=gte.${since90}&order=occurred_at.desc`, 4000).catch(() => []),
  ]);
  Object.assign(state, { me, seats, stageSeats, board, queue, clock, switches, lines, mentions, sellers, leadSources, proofRules, parcels, nocs, people, pipeline, estimates });
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
  return { job, customer: cust, texts, emails: Array.isArray(emails) ? emails : [], thread, messages, asks, attachments, handoffs, outbox, estimates, estLinks, parcel, filled: Array.isArray(filled) ? filled : [],
           fence: fence && fence.found ? fence : null, packet: Array.isArray(packet) ? packet : [] };
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
export async function searchCustomers(q) {
  if (isDemo()) return DEMO.search(q);
  const term = q.trim();
  if (term.length < 2) return [];
  const digits = term.replace(/\D/g, '');
  const filter = digits.length >= 4 ? `phone.ilike.*${digits}*` : `name.ilike.*${encodeURIComponent(term)}*`;
  return api.page(`customers?select=id,name,phone&or=(${filter})&limit=12`, 12);
}
