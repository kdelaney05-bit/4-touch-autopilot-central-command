// The book — everything the rooms read, loaded once, refreshed on demand.
// Every row comes through RLS with the seat's own token. ?demo=1 swaps in a
// fictional book and refuses every write.
import * as api from './api.js?v=5';
import { DEMO } from './demo.js?v=5';

export const state = {
  me: null,            // reps row for the signed-in seat
  seats: [],           // active manager/office/admin/owner reps
  stageSeats: [],      // stage_seats
  board: [],           // v_stage_board
  queue: [],           // v_office_queue
  clock: [],           // v_customer_text_clock
  switches: [],        // automation_switches
  lines: [],           // brand_sms_lines
  warnings: [],
  loadedAt: null,
};

export const isDemo = () => /[?&]demo=1/.test(location.search);

export async function loadAll() {
  state.warnings = [];
  if (isDemo()) { Object.assign(state, DEMO.book()); state.loadedAt = new Date(); return state; }
  const s = api.getSession();
  const [me, seats, stageSeats, board, queue, clock, switches, lines] = await Promise.all([
    api.one(`reps?select=id,name,role,manages_company_id,track&id=eq.${s.repId}`),
    api.page('reps?select=id,name,role&active=eq.true&role=in.(manager,office,admin,owner)&order=name.asc'),
    api.page('stage_seats?select=*'),
    api.page('v_stage_board?select=*&order=days_in_stage.desc', 3000),
    api.page('v_office_queue?select=*&order=opened_at.asc', 2000),
    api.page('v_customer_text_clock?select=*&order=waiting_min.desc', 1000),
    api.page('automation_switches?select=*'),
    api.page('brand_sms_lines?select=*'),
  ]);
  Object.assign(state, { me, seats, stageSeats, board, queue, clock, switches, lines });
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
  const [texts, emails, cust, handoffs, outbox] = await Promise.all([
    api.page(`text_messages?select=id,direction,body,occurred_at,uvoice_ext,from_number,to_number,has_media,media_url,feed_source&resolved_customer_id=eq.${customerId}&order=occurred_at.asc`, 2000),
    api.rpc('file_email_thread', { p_customer: customerId }).catch(() => []),
    api.one(`customers?select=id,name,phone,email,sms_opt_out_at&id=eq.${customerId}`),
    job.job_id ? api.page(`job_handoffs?select=*&job_id=eq.${job.job_id}&order=at.asc`) : [],
    api.page(`sms_outbox?select=id,body,status,queued_at,sent_at,from_number,rep_id,play&customer_id=eq.${customerId}&order=queued_at.asc`, 500).catch(() => []),
  ]);
  let thread = null, messages = [], asks = [], attachments = [];
  if (job.cc_project_id) {
    thread = await api.one(`job_threads?select=id,project_id,company_id,customer_name&project_id=eq.${encodeURIComponent(job.cc_project_id)}`);
    if (thread) {
      [messages, asks, attachments] = await Promise.all([
        api.page(`thread_messages?select=id,lane,author_id,author_name,body,is_system,created_at&thread_id=eq.${thread.id}&order=created_at.asc`, 2000),
        api.page(`thread_asks?select=id,lane,ask_type,doc_kind,note,state,assignee_id,assignee_name,opened_by_name,opened_at,closed_at,minutes_to_close,proof&thread_id=eq.${thread.id}&order=opened_at.asc`, 500),
        api.page(`thread_attachments?select=id,ask_id,message_id,lane,label,storage_path,source,source_id,created_at&thread_id=eq.${thread.id}&order=created_at.asc`, 500),
      ]);
    }
  }
  return { job, customer: cust, texts, emails: Array.isArray(emails) ? emails : [], thread, messages, asks, attachments, handoffs, outbox };
}

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
export async function linePreview(customerId) {
  if (isDemo()) return [
    { key: 'review_prompt', label: 'Review prompt · rate us 1–10', body: 'Hey Dana, This is Kevin with Liberty Fencing and I wanted to follow up on the project and ask how would you rate the staff and workmanship on a scale from 1-10 ( 10 being the BEST) ?' },
    { key: 'permit_in', label: 'Permit approved', body: 'Hi Dana, Kevin at Liberty Fencing. Your permit is approved. Next up is scheduling — we\'ll text you the day here.' },
    { key: 'lead_reply', label: 'Estimate request · call us back', body: 'Good morning, Liberty Fencing here. I am reaching out because we received a request that you were looking for a Free Fencing Estimate for an upcoming project and I\'d love to get that scheduled for you today! Please call us back at 321-215-4437 at your earliest convenience. We look forward to hearing from you. Thank you' },
  ];
  const r = await api.rpc('line_preview', { p_customer: customerId });
  return Array.isArray(r) ? r : [];
}
export async function cancelText(id) { guard(); return api.rpc('app_text_cancel', { p_id: id }); }
export async function ensureThread(ccProjectId) { guard(); return api.rpc('ensure_thread', { p_cc_project_id: ccProjectId }); }
export async function setSwitch(key, on) { guard(); return api.rpc('automation_switch_set', { p_key: key, p_on: on }); }
export async function uploadDoc(job, lane, file) {
  guard();
  const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 80);
  const path = `${job.cc_company_id || '0'}/${job.cc_project_id}/${lane}/DOC/${Date.now()}-${safe}`;
  await api.uploadPublic('job-docs', path, file, file.type || 'application/octet-stream');
  return { storage_path: path, label: file.name };
}
export async function searchCustomers(q) {
  if (isDemo()) return DEMO.search(q);
  const term = q.trim();
  if (term.length < 2) return [];
  const digits = term.replace(/\D/g, '');
  const filter = digits.length >= 4 ? `phone.ilike.*${digits}*` : `name.ilike.*${encodeURIComponent(term)}*`;
  return api.page(`customers?select=id,name,phone&or=(${filter})&limit=12`, 12);
}
