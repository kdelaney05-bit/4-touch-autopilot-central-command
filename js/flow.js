// The Flow — one scrolling timeline of everything moving through the lane.
//
// Kevin, 15 Sep 2026: "we need like a scrolling timeline of all the stuff in
// our entire workflow flowing thru this new lane… outline of all key
// milestones and then build the steps inside." So: the milestones across the
// top (how many jobs sit at each step right now), and under them every move
// the machine and the people made, newest first, one color per person, the
// machine in gold. Click a line, the customer's file opens beside you.
//
// Reads only what the office rail already writes: the asks (306), their
// system lines (thread_messages.is_system), signatures (129/338), the fence
// job's stamps (336) and the notes that left the rep's mailbox (338). Nothing
// here writes. Refreshes itself every 30 seconds while the room is open.
import * as api from './api.js?v=32';
import { state, isDemo, firstName } from './book.js?v=32';
import { $, html, raw, esc } from './ui.js?v=32';
import { brandName } from './config.js?v=32';

const DAYS = 14;
let timer = null;
let brand = 'all';
let who = 'all';
let onlyMachine = false;
let q = '';
let cache = null;          // { events, open, at }

/* the lane's milestones, in the order a job walks them */
const MILESTONES = [
  { key: 'signed',    label: 'Signed',            hint: 'signed on the link or the carbon', types: [] },
  { key: 'checklist', label: 'Paperwork',         hint: 'the office checklist is open',     types: ['CONTRACT_DOC'] },
  { key: 'permit',    label: 'Permit',            hint: 'Sam has the permit ask',           types: ['PERMIT'] },
  { key: 'locate',    label: 'Locate',            hint: 'the 811 locate',                   types: ['SURVEY'] },
  { key: 'material',  label: 'Material',          hint: 'released — Jonathan orders it',    types: ['MATERIAL'] },
  { key: 'schedule',  label: 'Schedule',          hint: 'Jonathan sets the day',            types: ['SCHEDULE'] },
  { key: 'crew',      label: 'Crew',              hint: 'Luis has the job',                 types: ['COMPLETION_SIGNOFF', 'MILESTONE'] },
  { key: 'invoice',   label: 'Invoice · inspect', hint: 'Laura invoices, Sam inspects',     types: ['INVOICE', 'INSPECTION'] },
  { key: 'payment',   label: 'Payment',           hint: 'collect',                          types: ['PAYMENT'] },
  { key: 'closeout',  label: 'Closeout',          hint: 'one tap, file complete',           types: ['CLOSEOUT'] },
];

const PALETTE = [
  ['#1f6f4a', '#dff0e6'], ['#1d5fa8', '#e1e8f3'], ['#b45309', '#f6e3d6'], ['#0e7c86', '#dcf1f3'], ['#5b3a8f', '#ece5f6'],
  ['#a8323e', '#f8e2e4'], ['#6b6d0e', '#eef0d2'], ['#8a4b1f', '#f3e4d7'], ['#245e8f', '#dde9f2'], ['#7a2e6d', '#f2e0ee'],
];
const colorFor = (id) => {
  if (!id || id === 'machine') return { c: 'var(--gold)', cs: 'var(--goldsoft)' };
  let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [c, cs] = PALETTE[h % PALETTE.length]; return { c, cs };
};
const personOf = (id) => id ? ((state.people || []).find((p) => p.id === id) || (state.seats || []).find((s) => s.id === id) || null) : null;
const nameOf = (id) => personOf(id)?.name || null;
const initials = (n) => String(n || '?').split(/[\s,]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const nice = (t) => String(t || '').toLowerCase().replace(/_/g, ' ');
const when = (d) => { const x = new Date(d); return x.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
const dayKey = (d) => { const x = new Date(d); return x.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }); };

async function load() {
  const since = new Date(Date.now() - DAYS * 86400e3).toISOString();
  if (isDemo()) { cache = demoCache(); return cache; }
  const [asks, sys, threads, sigs, fences, notes, locates] = await Promise.all([
    api.page(`thread_asks?select=id,thread_id,ask_type,doc_kind,state,note,opened_at,closed_at,opened_by,assignee_id,closed_by,proof,void_reason&or=(opened_at.gte.${since},closed_at.gte.${since})&order=opened_at.desc`, 3000),
    api.page(`thread_messages?select=id,thread_id,body,author_id,created_at,lane&is_system=eq.true&created_at=gte.${since}&order=created_at.desc`, 4000),
    api.page('job_threads?select=id,customer_id,customer_name,company_id', 6000),
    api.page(`customer_signatures?select=id,customer_id,signer_name,signed_at,device_hint&signed_at=gte.${since}&order=signed_at.desc`, 1000),
    api.page(`fence_jobs?select=id,customer_id,rep_id,quote,created_at,deposit_required,deposit_amount,deposit_paid_at,deposit_paid_by,paperwork_official_at,paperwork_official_by,material_release_at&created_at=gte.${since}&order=created_at.desc`, 1000),
    api.page(`rep_email_queue?select=id,customer_id,rep_id,subject,to_email,status,sent_at,queued_at,meta&meta->>kind=in.(signed_visit,fence_packet)&queued_at=gte.${since}&order=queued_at.desc`, 500).catch(() => []),
    api.page(`locate_tickets?select=ticket,customer_id,taken_at,due_date,exp_date,address,city,all_clear,last_response_at,responses,caller&or=(taken_at.gte.${since},last_response_at.gte.${since})&order=taken_at.desc`, 1000).catch(() => []),
  ]);
  const T = new Map(threads.map((t) => [t.id, t]));
  const custName = (cid) => threads.find((t) => t.customer_id === cid)?.customer_name || (state.customers || []).find((c) => c.id === cid)?.name || 'A customer';
  const custBrand = (cid) => threads.find((t) => t.customer_id === cid)?.company_id || null;
  const ev = [];
  const push = (e) => ev.push(e);

  for (const a of asks) {
    const t = T.get(a.thread_id) || {};
    const base = { cid: t.customer_id, cust: t.customer_name || 'A customer', brand: t.company_id, ask: a };
    push({ ...base, at: a.opened_at, pid: a.opened_by || 'machine', who: nameOf(a.opened_by) || 'The machine',
           body: `asked ${firstName(nameOf(a.assignee_id) || 'someone')} for ${nice(a.ask_type)}${a.doc_kind ? ' (' + a.doc_kind + ')' : ''}`, cls: '', step: a.ask_type });
    if (a.state === 'DONE' && a.closed_at) {
      const v = a.proof?.value || (a.proof?.waived ? 'waived: ' + a.proof.waived : (a.proof?.files?.length ? a.proof.files.length + ' file(s)' : ''));
      push({ ...base, at: a.closed_at, pid: a.closed_by || 'machine', who: nameOf(a.closed_by) || 'The machine',
             body: `settled ${nice(a.ask_type)}${a.doc_kind ? ' (' + a.doc_kind + ')' : ''}${v ? ' · ' + v : ''}`, cls: 'file', step: a.ask_type });
    }
    if (a.state === 'VOID' && a.closed_at) push({ ...base, at: a.closed_at, pid: a.closed_by || 'machine', who: nameOf(a.closed_by) || 'The machine', body: `voided ${nice(a.ask_type)}${a.void_reason ? ' · ' + a.void_reason : ''}`, cls: 'bad', step: a.ask_type });
  }
  for (const m of sys) {
    // the asks already tell the "asked / settled" story; keep the machine's own lines (official, deposit, texts)
    if (/^(.+?) (asked|settled) /.test(m.body)) continue;
    const t = T.get(m.thread_id) || {};
    push({ cid: t.customer_id, cust: t.customer_name || 'A customer', brand: t.company_id, at: m.created_at, pid: 'machine', who: 'The machine', body: m.body, cls: /official|released/i.test(m.body) ? 'money' : '' });
  }
  for (const s of sigs) push({ cid: s.customer_id, cust: custName(s.customer_id), brand: custBrand(s.customer_id), at: s.signed_at, pid: 'customer', who: s.signer_name, body: `SIGNED the contract${s.device_hint ? ' on ' + s.device_hint : ''}`, cls: 'money', step: 'SIGNED' });
  for (const f of fences) {
    const base = { cid: f.customer_id, cust: custName(f.customer_id), brand: custBrand(f.customer_id) || '1461' };
    push({ ...base, at: f.created_at, pid: f.rep_id || 'machine', who: nameOf(f.rep_id) || 'A rep', body: `Complete Quote · $${Math.round(f.quote || 0).toLocaleString()}${f.deposit_required ? ' · custom, deposit due' : ' · stock'}`, cls: '' });
    if (f.deposit_paid_at) push({ ...base, at: f.deposit_paid_at, pid: f.deposit_paid_by || 'machine', who: nameOf(f.deposit_paid_by) || 'The machine', body: `deposit in · $${Math.round(f.deposit_amount || 0).toLocaleString()}`, cls: 'money' });
    if (f.paperwork_official_at) push({ ...base, at: f.paperwork_official_at, pid: f.paperwork_official_by || 'machine', who: nameOf(f.paperwork_official_by) || 'The machine', body: 'paperwork official', cls: 'money' });
    if (f.material_release_at) push({ ...base, at: f.material_release_at, pid: 'machine', who: 'The machine', body: 'material RELEASED', cls: 'money' });
  }
  for (const n of notes) push({ cid: n.customer_id, cust: custName(n.customer_id), brand: custBrand(n.customer_id), at: n.sent_at || n.queued_at, pid: 'machine', who: 'The machine',
                                body: `${n.status === 'sent' ? 'emailed' : 'queued email'} "${n.subject}" → ${String(n.to_email || '').split(',').map((e) => e.trim().split('@')[0]).join(', ')}`, cls: '' });

  // 341: the locates — the ticket filed at Sunshine 811 (Diana's paste, confirmed by Exactix) and the utilities' answers
  for (const l of locates) {
    const base = { cid: l.customer_id, cust: l.customer_id ? custName(l.customer_id) : (l.address || 'unmatched address'), brand: l.customer_id ? custBrand(l.customer_id) : null };
    if (l.taken_at) push({ ...base, at: l.taken_at, pid: 'machine', who: 'Sunshine 811', body: `locate ticket ${l.ticket} filed${l.caller ? ' by ' + l.caller.split(' ')[0] : ''}${l.due_date ? ' · dig after ' + l.due_date.slice(5).replace('-', '/') : ''}`, cls: 'file', step: 'SURVEY' });
    if (l.last_response_at) push({ ...base, at: l.last_response_at, pid: 'machine', who: 'Sunshine 811', body: `ticket ${l.ticket}: ${(l.responses || []).length} utilit${(l.responses || []).length === 1 ? 'y' : 'ies'} answered${l.all_clear ? ' — ALL CLEAR' : ''}`, cls: l.all_clear ? 'money' : '' });
  }
  ev.sort((a, b) => new Date(b.at) - new Date(a.at));
  const open = asks.filter((a) => a.state === 'OPEN');
  cache = { events: ev, open, at: new Date() };
  return cache;
}

function demoCache() {
  const now = Date.now(); const m = (min) => new Date(now - min * 60e3).toISOString();
  const p = (i) => (state.people || [])[i]?.id;
  const ev = [
    { cid: 'j8', cust: 'Pestana, Maria', brand: '1461', at: m(3), pid: 'machine', who: 'The machine', body: 'asked Luis for completion signoff', step: 'COMPLETION_SIGNOFF' },
    { cid: 'j8', cust: 'Pestana, Maria', brand: '1461', at: m(4), pid: p(2), who: 'Jonathan Garcia', body: 'settled schedule · 2026-09-22', cls: 'file', step: 'SCHEDULE' },
    { cid: 'j8', cust: 'Pestana, Maria', brand: '1461', at: m(41), pid: 'machine', who: 'The machine', body: 'material RELEASED', cls: 'money' },
    { cid: 'j8', cust: 'Pestana, Maria', brand: '1461', at: m(41), pid: 'machine', who: 'The machine', body: 'Paperwork is official — every item on the checklist is in. Material is released.', cls: 'money' },
    { cid: 'j8', cust: 'Pestana, Maria', brand: '1461', at: m(42), pid: p(1), who: 'Samantha White', body: 'settled contract doc (survey) · 1 file(s)', cls: 'file', step: 'CONTRACT_DOC' },
    { cid: 'j8', cust: 'Pestana, Maria', brand: '1461', at: m(190), pid: 'customer', who: 'Maria Pestana', body: 'SIGNED the contract on iPhone', cls: 'money', step: 'SIGNED' },
    { cid: 'j8', cust: 'Pestana, Maria', brand: '1461', at: m(191), pid: 'machine', who: 'The machine', body: 'emailed "SIGNED: Pestana, Maria / set the visit" → ron, gio, kdelaney05' },
  ];
  return { events: ev, open: [{ ask_type: 'COMPLETION_SIGNOFF' }, { ask_type: 'PERMIT' }, { ask_type: 'PERMIT' }, { ask_type: 'MATERIAL' }], at: new Date() };
}

export function renderFlow(root) {
  if (timer) clearInterval(timer);
  root.innerHTML = html`<div class="head"><div><div class="kicker">The flow · everything moving through the lane, newest first</div><h1 class="serif">Loading the lane…</h1></div></div>`;
  const draw = () => paint(root);
  load().then(draw).catch((e) => { root.innerHTML = html`<div class="head"><h1 class="serif">The lane would not load.</h1><div class="note">${e.message || String(e)}</div></div>`; });
  timer = setInterval(() => load().then(draw).catch(() => {}), 30_000);
}
export function stopFlow() { if (timer) clearInterval(timer); timer = null; }

function paint(root) {
  if (!cache) return;
  const { events, open, at } = cache;
  const people = [...new Map(events.filter((e) => e.pid && e.pid !== 'machine' && e.pid !== 'customer').map((e) => [e.pid, e.who])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const brands = [...new Set(events.map((e) => e.brand).filter(Boolean))];
  const E = events.filter((e) => (brand === 'all' || e.brand === brand) && (who === 'all' || e.pid === who) && (!onlyMachine || e.pid === 'machine')
                                 && (!q || (e.cust + ' ' + e.body + ' ' + e.who).toLowerCase().includes(q.toLowerCase())));
  const counts = Object.fromEntries(MILESTONES.map((m) => [m.key, m.key === 'signed'
    ? new Set(events.filter((e) => e.step === 'SIGNED' && (brand === 'all' || e.brand === brand)).map((e) => e.cid)).size
    : new Set(open.filter((a) => m.types.includes(a.ask_type)).map((a) => a.thread_id)).size]));
  const today = new Set(events.filter((e) => Date.now() - new Date(e.at) < 86400e3).map((e) => e.cid)).size;

  const byDay = new Map();
  for (const e of E) { const k = dayKey(e.at); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(e); }

  root.innerHTML = html`
    <div class="head">
      <div><div class="kicker">The flow · everything moving through the lane, newest first · refreshed ${at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
        <h1 class="serif">${E.length} moves in ${DAYS} days. ${today} file${today === 1 ? '' : 's'} moved today.</h1></div>
      <div class="right subs">
        <select id="flow-brand"><option value="all">All brands</option>${raw(brands.map((b) => `<option value="${esc(b)}" ${b === brand ? 'selected' : ''}>${esc(brandName(b))}</option>`).join(''))}</select>
        <select id="flow-who"><option value="all">Everyone</option>${raw(people.map(([id, n]) => `<option value="${esc(id)}" ${id === who ? 'selected' : ''}>${esc(n)}</option>`).join(''))}</select>
        <button class="sub ${onlyMachine ? 'on' : ''}" id="flow-machine">The machine only</button>
        <input id="flow-q" placeholder="find a customer…" value="${q}" style="width:180px"/>
        ${isDemo() ? raw('<span class="chip demo">DEMO</span>') : ''}
      </div>
    </div>

    <div class="flow-miles">
      ${raw(MILESTONES.map((m, i) => `<div class="mile ${counts[m.key] ? 'live' : ''}" title="${esc(m.hint)}"><div class="n">${counts[m.key] || 0}</div><div class="l">${esc(m.label)}</div>${i < MILESTONES.length - 1 ? '<i class="arrow">›</i>' : ''}</div>`).join(''))}
    </div>
    <div class="note" style="margin:6px 2px 14px">Each box is how many files sit at that step right now (Signed = signed in the last ${DAYS} days). The machine moves a file to the next box the moment the step before it is in; a person only supplies the input the box asks for.</div>

    <div class="flow">
      ${raw([...byDay.entries()].map(([day, list]) => `<div class="flow-day">${esc(day)}</div>` + list.map(line).join('')).join('') || '<div class="note">Nothing has moved through the lane in the last ' + DAYS + ' days.</div>')}
    </div>`;

  $('#flow-brand').onchange = (e) => { brand = e.target.value; paint(root); };
  $('#flow-who').onchange = (e) => { who = e.target.value; paint(root); };
  $('#flow-machine').onclick = () => { onlyMachine = !onlyMachine; paint(root); };
  $('#flow-q').oninput = (e) => { q = e.target.value; paint(root); };
  const qi = $('#flow-q'); if (q) { qi.focus(); qi.setSelectionRange(q.length, q.length); }
  root.querySelectorAll('.flow-line[data-cid]').forEach((el) => (el.onclick = () => window.__go('file', el.dataset.cid)));
}

function line(e) {
  const c = colorFor(e.pid === 'customer' ? 'customer' : e.pid);
  const av = e.pid === 'machine' ? 'AI' : e.pid === 'customer' ? '✍' : initials(e.who);
  return `<div class="flow-line ${esc(e.cls || '')}" style="--c:${c.c};--cs:${c.cs}" ${e.cid ? `data-cid="${esc(e.cid)}"` : ''}>
    <span class="t">${esc(when(e.at))}</span>
    <i class="av">${esc(av)}</i>
    <span class="w">${esc(e.who)}</span>
    <span class="b">${esc(e.body)}</span>
    <span class="c">${esc(e.cust)}${e.brand ? ' · ' + esc(brandName(e.brand)) : ''}</span>
  </div>`;
}
