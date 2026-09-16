// The Flow — every job moving through the lane, in plain English.
//
// Kevin, 15 Sep 2026: "we need like a scrolling timeline of all the stuff in
// our entire workflow flowing thru this new lane." Then, looking at the first
// cut: "what am I looking at, I have no clue… I should be able to easily look
// at the flow and have a clue." So, the rule for this room: no code words.
// One card per customer. The top line says where the job is right now and who
// it is waiting on. Under it, what happened, as sentences a person would say.
// The machine's moves are gold. Click the card, the file opens beside you.
//
// Reads only what the office rail already writes: the asks (306), their
// system lines, signatures (129/338), the fence job's stamps (336), the
// signing notes (338) and the 811 tickets (341). Nothing here writes.
// Refreshes itself every 30 seconds while the room is open.
import * as api from './api.js?v=61';
import { state, isDemo, firstName } from './book.js?v=61';
import { $, html, raw, esc } from './ui.js?v=61';
import { brandName } from './config.js?v=61';

const DAYS = 14;
let timer = null;
let brand = 'all';
let q = '';
let view = 'jobs';      // jobs | map
let cache = null;

import { STEPS, STEP_OF, thing, ICON, person, pace, MAP } from './words.js?v=61';

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
const first = (id) => firstName(nameOf(id) || '') || 'someone';
const initials = (n) => String(n || '?').split(/[\s,]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const when = (d) => { const x = new Date(d); const today = new Date().toDateString() === x.toDateString(); return (today ? '' : x.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ' ') + x.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
const ago = (d) => { const m = (Date.now() - new Date(d)) / 60000; return m < 60 ? Math.round(m) + ' min' : m < 1440 ? Math.round(m / 60) + ' h' : Math.round(m / 1440) + ' d'; };
const md = (s) => { if (!s) return ''; const [y, m, d] = String(s).split('-'); return `${Number(m)}/${Number(d)}`; };

async function load() {
  const since = new Date(Date.now() - DAYS * 86400e3).toISOString();
  if (isDemo()) { cache = demoCache(); return cache; }
  const [asks, sys, threads, sigs, fences, notes, locates, baseline, ccprod] = await Promise.all([
    api.page(`thread_asks?select=id,thread_id,ask_type,doc_kind,state,note,opened_at,closed_at,opened_by,assignee_id,closed_by,proof,void_reason&or=(opened_at.gte.${since},closed_at.gte.${since})&order=opened_at.desc`, 3000),
    api.page(`thread_messages?select=id,thread_id,body,author_id,created_at,lane&is_system=eq.true&created_at=gte.${since}&order=created_at.desc`, 4000),
    api.page('job_threads?select=id,customer_id,customer_name,company_id,job_address', 6000),
    api.page(`customer_signatures?select=id,customer_id,signer_name,signed_at,device_hint&signed_at=gte.${since}&order=signed_at.desc`, 1000),
    api.page(`fence_jobs?select=id,customer_id,rep_id,quote,created_at,deposit_required,deposit_amount,deposit_paid_at,deposit_paid_by,paperwork_official_at,paperwork_official_by,material_release_at&created_at=gte.${since}&order=created_at.desc`, 1000),
    api.page(`rep_email_queue?select=id,customer_id,rep_id,subject,to_email,status,sent_at,queued_at,meta&meta->>kind=in.(signed_visit,fence_packet)&queued_at=gte.${since}&order=queued_at.desc`, 500).catch(() => []),
    api.page(`locate_tickets?select=ticket,customer_id,taken_at,due_date,exp_date,address,city,all_clear,last_response_at,responses,caller&or=(taken_at.gte.${since},last_response_at.gte.${since})&order=taken_at.desc`, 1000).catch(() => []),
    api.page('v_step_baseline?select=*', 50).catch(() => []),
    api.page('v_cc_production?select=job_id,number,is_complete,install_starts_at,crew_name,crew_color,material_cost,total_cost,material_orders,expenses_total,synced_at&order=synced_at.desc', 3000).catch(() => []),
  ]);
  const T = new Map(threads.map((t) => [t.id, t]));
  const jobsById = new Map((await api.page('jobs?select=id,customer_id&source=in.(cc,app_live)&completed_at=is.null&limit=4000').catch(() => [])).map((j) => [j.id, j.customer_id]));
  const byCust = new Map(); for (const t of threads) if (t.customer_id && !byCust.has(t.customer_id)) byCust.set(t.customer_id, t);
  const custName = (cid) => byCust.get(cid)?.customer_name || (state.customers || []).find((c) => c.id === cid)?.name || 'A customer';
  const custBrand = (cid) => byCust.get(cid)?.company_id || null;
  const custAddr = (cid) => byCust.get(cid)?.job_address || (state.customers || []).find((c) => c.id === cid)?.street || '';
  const ev = [];
  const push = (e) => ev.push(e);

  for (const a of asks) {
    const t = T.get(a.thread_id) || {};
    const base = { cid: t.customer_id, cust: t.customer_name || 'A customer', brand: t.company_id };
    const to = first(a.assignee_id), what = thing(a);
    const opener = a.opened_by && nameOf(a.opened_by);
    push({ ...base, at: a.opened_at, pid: a.opened_by || 'machine',
           body: opener ? `${firstName(opener)} handed ${to} ${what}` : `The machine handed ${to} ${what}`, step: STEP_OF[a.ask_type]?.key });
    if (a.state === 'DONE' && a.closed_at) {
      const v = a.proof?.value; const w = a.proof?.waived; const files = a.proof?.files?.length;
      const closer = a.closed_by && nameOf(a.closed_by);
      let body;
      if (a.ask_type === 'SCHEDULE' && v) body = `${firstName(closer) || 'Jonathan'} set the install date: ${md(v)}`;
      else if (a.ask_type === 'PERMIT' && v) body = /none required/i.test(v) ? 'No permit needed here — the machine moved on' : `${firstName(closer) || 'Sam'} got the permit: ${v}`;
      else if (a.ask_type === 'SURVEY' && v) body = `The 811 locate is filed — ${v.replace(/^811 /, '')}`;
      else if (w) body = `${firstName(closer) || 'The machine'} skipped ${what}: ${w.replace(/^probe: /, '')}`;
      else if (a.ask_type === 'CONTRACT_DOC' && a.doc_kind === 'contract' && (!closer || files)) body = 'The signed contract is on the file';
      else body = `${firstName(closer) || 'The machine'} turned in ${what}${v ? ': ' + v : files ? ` (${files} file${files === 1 ? '' : 's'})` : ''}`;
      push({ ...base, at: a.closed_at, pid: a.closed_by || 'machine', body, cls: 'done', step: STEP_OF[a.ask_type]?.key });
    }
    if (a.state === 'VOID' && a.closed_at) push({ ...base, at: a.closed_at, pid: a.closed_by || 'machine', body: `${first(a.closed_by)} took ${what} off the list${a.void_reason ? ' — ' + a.void_reason : ''}`, cls: 'bad' });
  }
  for (const m of sys) {
    if (/ (asked|settled|handed|turned in) /.test(m.body)) continue;   // the asks already tell that story
    const t = T.get(m.thread_id) || {};
    let body = m.body;
    if (/^Paperwork is official/.test(body)) body = /released/.test(body) ? 'All the paperwork is in — material is released to order' : 'All the paperwork is in — material waits on the deposit';
    else if (/^811 ticket (\d+): (\d+) operators? responded — ALL CLEAR, dig on or after (.+)$/.test(body)) body = body.replace(/^811 ticket (\d+): (\d+) operators? responded — ALL CLEAR, dig on or after (.+)$/, 'Every utility answered the 811 locate — clear to dig on or after $3');
    else if (/^811 ticket (\d+): (\d+) operators? responded — waiting/.test(body)) body = body.replace(/^811 ticket (\d+): (\d+) operators? responded.*$/, '$2 utilities have answered the 811 locate, waiting on the rest');
    else if (/^@office DEPOSIT DUE/.test(body)) body = 'The customer tapped PAY BY CARD — the office takes the card by phone';
    push({ cid: t.customer_id, cust: t.customer_name || 'A customer', brand: t.company_id, at: m.created_at, pid: 'machine', body, cls: /released|clear to dig/i.test(body) ? 'money' : '' });
  }
  for (const s of sigs) push({ cid: s.customer_id, cust: custName(s.customer_id), brand: custBrand(s.customer_id), at: s.signed_at, pid: 'customer', body: `${person(s.signer_name)} SIGNED the contract${s.device_hint ? ' on ' + (s.device_hint === 'Desktop' ? 'a computer' : 'their ' + s.device_hint) : ''}`, cls: 'money', step: 'signed' });
  for (const f of fences) {
    const base = { cid: f.customer_id, cust: custName(f.customer_id), brand: custBrand(f.customer_id) || '1461' };
    push({ ...base, at: f.created_at, pid: f.rep_id || 'machine', body: `${first(f.rep_id)} finished the quote: $${Math.round(f.quote || 0).toLocaleString()}${f.deposit_required ? ' — custom material, a deposit is due' : ' — stock material, no deposit'}` });
    if (f.deposit_paid_at) push({ ...base, at: f.deposit_paid_at, pid: f.deposit_paid_by || 'machine', body: `Deposit received: $${Math.round(f.deposit_amount || 0).toLocaleString()}`, cls: 'money' });
    if (f.material_release_at) push({ ...base, at: f.material_release_at, pid: 'machine', body: 'Material released — Jonathan can order', cls: 'money' });
  }
  for (const n of notes) {
    const who = String(n.to_email || '').split(',').map((e) => firstName(nameOf((state.people || []).find((p) => (p.email || '').toLowerCase() === e.trim().toLowerCase())?.id) || e.trim().split('@')[0]));
    push({ cid: n.customer_id, cust: custName(n.customer_id), brand: custBrand(n.customer_id), at: n.sent_at || n.queued_at, pid: 'machine',
           body: n.meta?.kind === 'fence_packet' ? `The sold packet ${n.status === 'sent' ? 'went' : 'is going'} to the office` : `${n.status === 'sent' ? 'Emailed' : 'Emailing'} ${who.join(', ')}: the customer signed, get out there today` });
  }
  for (const l of locates) {
    const base = { cid: l.customer_id, cust: l.customer_id ? custName(l.customer_id) : (l.address || 'an address we could not match'), brand: l.customer_id ? custBrand(l.customer_id) : null };
    if (l.taken_at) push({ ...base, at: l.taken_at, pid: 'machine', body: `${l.caller ? firstName(person(l.caller)) : 'The office'} filed the 811 locate${l.due_date ? ' — utilities have until ' + md(l.due_date) : ''}`, cls: 'done', step: 'locate' });
    if (l.last_response_at && (l.responses || []).length) push({ ...base, at: l.last_response_at, pid: 'machine', body: l.all_clear ? `All ${l.responses.length} utilities answered — clear to dig` : `${l.responses.length} of the utilities have answered the locate`, cls: l.all_clear ? 'money' : '' });
  }

  // 343: what Contractors Cloud knows — the work order, the crew, the install date, the material — as moves on the card
  const jobCust = new Map(threads.map((t) => [t.customer_id, t]));
  const byJob = new Map(); for (const t of threads) byJob.set(t.project_id, t);
  const ccByJob = new Map();
  for (const w of ccprod) {
    const t = threads.find((x) => x.customer_id && jobsById.get(w.job_id) === x.customer_id) || null;
    const cid = jobsById.get(w.job_id); if (!cid) continue;
    ccByJob.set(cid, w);
    const base = { cid, cust: custName(cid), brand: custBrand(cid) };
    if (w.install_starts_at) push({ ...base, at: w.install_starts_at, pid: 'cc', body: `CC: install ${w.is_complete ? 'done' : 'set'} ${md(w.install_starts_at.slice(0, 10))}${w.crew_name ? ' · crew ' + w.crew_name : ''}${w.number ? ' · ' + w.number : ''}`, cls: w.is_complete ? 'done' : '', step: w.is_complete ? 'crew' : 'schedule' });
    for (const m of (w.material_orders || [])) if (m.delivery_at) push({ ...base, at: m.delivery_at + 'T12:00:00', pid: 'cc', body: `CC: material ${m.supplier ? 'from ' + m.supplier + ' ' : ''}delivered ${md(m.delivery_at)}${m.actual_cost ? ' · $' + Math.round(Number(m.actual_cost)).toLocaleString() : ''}`, cls: 'done', step: 'material' });
  }
  ev.sort((a, b) => new Date(b.at) - new Date(a.at));
  // where each file is right now: its open asks
  const open = asks.filter((a) => a.state === 'OPEN');
  const now = new Map();
  for (const a of open) {
    const t = T.get(a.thread_id); if (!t?.customer_id) continue;
    const st = STEP_OF[a.ask_type]; if (!st) continue;
    const cur = now.get(t.customer_id);
    const idx = STEPS.findIndex((s) => s.key === st.key);
    if (!cur || idx < cur.idx) now.set(t.customer_id, { idx, step: st, a, since: a.opened_at, who: first(a.assignee_id), what: thing(a), n: 1 });
    else if (idx === cur.idx) cur.n++;
  }
  cache = { events: ev, now, threads: byCust, addr: custAddr, baseline, at: new Date() };
  return cache;
}

function demoCache() {
  const nowT = Date.now(); const m = (min) => new Date(nowT - min * 60e3).toISOString();
  const p = (i) => (state.people || [])[i]?.id;
  const ev = [
    { cid: 'j8', cust: 'Pestana, Maria', brand: '1461', at: m(3), pid: 'machine', body: 'The machine handed Luis the finished-job photos' },
    { cid: 'j8', cust: 'Pestana, Maria', brand: '1461', at: m(4), pid: p(2), body: 'Jonathan set the install date: 9/22', cls: 'done' },
    { cid: 'j8', cust: 'Pestana, Maria', brand: '1461', at: m(41), pid: 'machine', body: 'Material released — Jonathan can order', cls: 'money' },
    { cid: 'j8', cust: 'Pestana, Maria', brand: '1461', at: m(42), pid: p(1), body: 'Samantha turned in the property survey (1 file)', cls: 'done' },
    { cid: 'j8', cust: 'Pestana, Maria', brand: '1461', at: m(190), pid: 'customer', body: 'Maria Pestana SIGNED the contract on their iPhone', cls: 'money', step: 'signed' },
    { cid: 'j8', cust: 'Pestana, Maria', brand: '1461', at: m(191), pid: 'machine', body: 'Emailed Ron, Gio, Kevin: the customer signed, get out there today' },
    { cid: 'j3', cust: 'Keyeck, Tony', brand: '1461', at: m(600), pid: 'machine', body: 'Sam filed the 811 locate — utilities have until 9/17', cls: 'done' },
    { cid: 'j3', cust: 'Keyeck, Tony', brand: '1461', at: m(300), pid: 'machine', body: 'All 6 utilities answered — clear to dig', cls: 'money' },
  ];
  const now = new Map([['j8', { idx: 6, step: STEPS[6], since: m(3), who: 'Luis', what: 'the finished-job photos', n: 1 }], ['j3', { idx: 5, step: STEPS[5], since: m(299), who: 'Jonathan', what: 'the install date', n: 1 }]]);
  return { events: ev, now, threads: new Map(), addr: () => '', baseline: [{ ask_type: 'PERMIT', n_done: 40, median_days: 6, p80_days: 11 }, { ask_type: 'SCHEDULE', n_done: 40, median_days: 9, p80_days: 16 }], at: new Date() };
}

export function renderFlow(root) {
  if (timer) clearInterval(timer);
  root.innerHTML = html`<div class="head"><div><div class="kicker">The flow</div><h1 class="serif">Loading the lane…</h1></div></div>`;
  const draw = () => paint(root);
  load().then(draw).catch((e) => { root.innerHTML = html`<div class="head"><h1 class="serif">The lane would not load.</h1><div class="note">${e.message || String(e)}</div></div>`; });
  timer = setInterval(() => load().then(draw).catch(() => {}), 30_000);
}
export function stopFlow() { if (timer) clearInterval(timer); timer = null; }

function paint(root) {
  if (!cache) return;
  const { events, now, addr, baseline, at } = cache;
  const usual = (s) => { const b = (baseline || []).find((x) => STEP_OF[x.ask_type]?.key === s.key && Number(x.n_done) >= 5); return b ? `usually ${Number(b.median_days) < 1 ? 'same day' : Math.round(Number(b.median_days)) + ' day' + (Math.round(Number(b.median_days)) === 1 ? '' : 's')}` : ''; };
  const brands = [...new Set(events.map((e) => e.brand).filter(Boolean))];
  const E = events.filter((e) => (brand === 'all' || e.brand === brand) && (!q || (e.cust + ' ' + e.body).toLowerCase().includes(q.toLowerCase())));

  // one card per customer, newest activity first
  const cards = new Map();
  for (const e of E) {
    const k = e.cid || e.cust;
    if (!cards.has(k)) cards.set(k, { cid: e.cid, cust: e.cust, brand: e.brand, list: [], last: e.at });
    cards.get(k).list.push(e);
  }
  const counts = Object.fromEntries(STEPS.map((s) => [s.key, 0]));
  for (const [cid, n] of now) { const card = cards.get(cid); if (card && (brand === 'all' || card.brand === brand)) counts[n.step.key]++; }
  counts.signed = new Set(E.filter((e) => e.step === 'signed').map((e) => e.cid)).size;
  const moved = [...cards.values()].filter((c) => Date.now() - new Date(c.last) < 86400e3).length;

  root.innerHTML = html`
    <div class="head">
      <div><div class="kicker">The job board · every sold job, where it is, what moved · refreshed ${at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
        <h1 class="serif">${cards.size} jobs moved in the last ${DAYS} days. ${moved} today.</h1></div>
      <div class="right subs">
        <button class="sub ${view === 'jobs' ? 'on' : ''}" id="flow-jobs">The jobs</button>
        <button class="sub ${view === 'map' ? 'on' : ''}" id="flow-map">How it works · who does what</button>
        <select id="flow-brand"><option value="all">All brands</option>${raw(brands.map((b) => `<option value="${esc(b)}" ${b === brand ? 'selected' : ''}>${esc(brandName(b))}</option>`).join(''))}</select>
        <input id="flow-q" placeholder="find a customer…" value="${q}" style="width:180px"/>
        ${isDemo() ? raw('<span class="chip demo">DEMO</span>') : ''}
      </div>
    </div>

    <div class="flow-miles">
      ${raw(STEPS.map((s, i) => `<div class="mile ${counts[s.key] ? 'live' : ''}"><div class="ic">${ICON[s.key]}</div><div class="n">${counts[s.key] || 0}</div><div class="l">${esc(s.label)}</div><div class="h">${esc(s.hint)}</div>${usual(s) ? `<div class="u">${esc(usual(s))}</div>` : ''}${i < STEPS.length - 1 ? '<i class="arrow">›</i>' : ''}</div>`).join(''))}
    </div>
    <div class="note" style="margin:6px 2px 14px">A job walks these boxes left to right. The number is how many jobs are sitting in that box right now. The machine moves a job to the next box the moment the step before it is done; a person only supplies what the box asks for.</div>

    ${view === 'map' ? raw(mapHtml()) : raw(`<div class="flow">${[...cards.values()].map(card).join('') || '<div class="note">Nothing has moved in the last ' + DAYS + ' days.</div>'}</div>`)}`;

  $('#flow-brand').onchange = (e) => { brand = e.target.value; paint(root); };
  $('#flow-jobs').onclick = () => { view = 'jobs'; paint(root); };
  $('#flow-map').onclick = () => { view = 'map'; paint(root); };
  $('#flow-q').oninput = (e) => { q = e.target.value; paint(root); };
  const qi = $('#flow-q'); if (q) { qi.focus(); qi.setSelectionRange(q.length, q.length); }
  root.querySelectorAll('.fcard[data-cid]').forEach((el) => (el.querySelector('.fhead').onclick = () => window.__go('file', el.dataset.cid)));
  root.querySelectorAll('.fcard .more').forEach((b) => (b.onclick = (ev) => { ev.stopPropagation(); b.closest('.fcard').classList.add('open'); b.remove(); }));

  function card(c) {
    const n = c.cid ? now.get(c.cid) : null;
    const where = n
      ? `<b>Now:</b> ${esc(n.step.label)} — waiting on ${esc(n.who)} for ${esc(n.what)}${n.n > 1 ? ` (+${n.n - 1} more)` : ''} · ${esc(ago(n.since))}${(() => { const p = pace(baseline, n.a?.ask_type, n.since); return p?.slow ? ` <span class="slow">longer than usual (${p.usual < 1 ? 'same day' : Math.round(p.usual) + ' d'})</span>` : ''; })()}`
      : (c.list[0]?.cls === 'money' || /clear to dig|released|SIGNED/.test(c.list[0]?.body || '')) ? `<b>Now:</b> nothing waiting — the machine moves it when the next piece lands` : `<b>Now:</b> nothing open on this file`;
    const shown = c.list.slice(0, 4), hidden = c.list.length - shown.length;
    const a = c.cid ? addr(c.cid) : '';
    const doneSteps = new Set(c.list.filter((e) => e.cls === 'done' || e.cls === 'money' || e.step === 'signed').map((e) => e.step).filter(Boolean));
    const curIdx = n ? n.idx : (doneSteps.size ? Math.max(...[...doneSteps].map((k) => STEPS.findIndex((x) => x.key === k))) + 1 : 0);
    const track = STEPS.map((st, i) => `<span class="seg ${i < curIdx ? 'past' : i === curIdx ? 'now' : ''}" title="${esc(st.label)}">${ICON[st.key]}<em>${esc(st.label)}</em></span>`).join('');
    return `<div class="fcard" ${c.cid ? `data-cid="${esc(c.cid)}"` : ''}>
      <div class="track">${track}</div>
      <div class="fhead"><div><div class="fname">${esc(person(c.cust))}</div><div class="fsub">${esc([brandName(c.brand), a].filter(Boolean).join(' · '))}</div></div><div class="fwhere ${n ? 'wait' : ''}">${where}</div></div>
      <div class="flines">${shown.map(line).join('')}${hidden > 0 ? `<button class="more" type="button">${hidden} earlier move${hidden === 1 ? '' : 's'}</button>${c.list.slice(4).map(line).join('')}` : ''}</div>
    </div>`;
  }
  function line(e) {
    const col = colorFor(e.pid === 'customer' ? 'customer' : e.pid);
    const av = e.pid === 'machine' ? 'AI' : e.pid === 'customer' ? '✍' : initials(nameOf(e.pid) || '?');
    const mark = e.pid === 'customer' ? ICON.pen : e.cls === 'money' ? ICON.money : e.cls === 'done' ? ICON.done : e.cls === 'bad' ? ICON.bad : /^Email|^The sold packet/.test(e.body) ? ICON.mail : /handed/.test(e.body) ? ICON.handoff : (e.step && ICON[e.step]) || ICON.handoff;
    return `<div class="fline ${esc(e.cls || '')}" style="--c:${col.c};--cs:${col.cs}"><i class="mk">${mark}</i><i class="av">${esc(av)}</i><span class="b">${esc(e.body)}</span><span class="t">${esc(when(e.at))}</span></div>`;
  }
}

/* HOW IT WORKS — the lane as a map: each step, the person who holds it (from stage_seats, so
   the office can change hands without a build), what the machine does, what the person does,
   what the customer hears. */
function seatFor(rule) {
  const cc = brand === 'all' ? '1461' : brand;
  if (rule === 'rep') return { name: 'The rep who sold it', id: 'rep' };
  if (rule === 'locate') return seatFor('sold_office');   // the seat that files locates = the sold_office owner (Sam). Diana left; 15 Sep.
  const rows = (state.stageSeats || []).filter((s) => s.stage === rule);
  const r = rows.find((s) => s.cc_company_id === cc) || rows[0];
  const id = rule === 'production' ? (r?.watcher_id || r?.owner_id) : (r?.owner_id || r?.watcher_id);
  const p = id && ((state.seats || []).find((x) => x.id === id) || (state.people || []).find((x) => x.id === id));
  return p ? { name: p.name, id: p.id } : { name: 'The office', id: null };
}
function mapHtml() {
  const rows = MAP.map((m, i) => {
    const st = STEPS.find((s) => s.key === m.key); const who = seatFor(m.seat); const col = colorFor(who.id);
    return `<div class="mrow">
      <div class="mstep"><div class="mic">${ICON[m.key]}</div><div class="mn">${i + 1}</div><div class="ml">${esc(st.label)}</div></div>
      <div class="mwho" style="--c:${col.c};--cs:${col.cs}"><i class="av">${esc(who.id === 'rep' ? 'REP' : initials(who.name))}</i><div><div class="mwn">${esc(who.name)}</div><div class="mwh">holds this step</div></div></div>
      <div class="mcol"><div class="mk gold">The machine</div><ul>${m.machine.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="mcol"><div class="mk">${esc(who.id === 'rep' ? 'The rep' : who.id ? firstName(who.name) : 'The office')}</div><ul>${m.person.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="mcol"><div class="mk">The customer</div><div class="mcust">${esc(m.customer)}</div></div>
    </div>`;
  }).join('');
  return `<div class="note" style="margin:0 2px 12px">Left to right: the step, who holds it, what the machine does by itself, the one thing that person supplies, and what the customer hears. Hands come from the seats table in the Office room — change a seat there and this map follows.</div><div class="map">${rows}</div>`;
}
