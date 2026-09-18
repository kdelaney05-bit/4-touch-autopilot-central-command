// THE VILLAGE AS CONVERSATIONS — v136 (18 Sep 2026, migration 411). Kevin, ~2:15 PM, in the Village on his laptop:
// "split off into little threads… see all the conversations, what's being done in each… each employee kind of has
// their own… it's going to be the same people… I want to message people, I want to message sales, I want to stay in
// this screen." On the drawn page (docs/the-village-threads.html): "I like your recommendations. Let's do that."
//
// The board (A): every conversation you are in is a card with the faces on it, the one waiting longest on top; the
// standing rooms (Sales · Office · Production · Everyone) are always there; the dashed card starts one — tap faces,
// type, Enter. Open a card and it shows beside the list with the faces along the top, the box at the bottom; Reply
// under a line splits off a little thread. By person (C) is the same cards turned sideways, one column per employee.
// B's two habits: Enter sends (Shift+Enter is a new line), and the same faces open the same conversation again.
// You see every card (owner/admin); an employee sees the cards with their face on them. Tagging @Name adds their face.
//
//   the cards        → v_my_threads            (411)
//   a conversation   → v_team_room?thread_id=  (team_messages with room = 'thread')
//   start · say · seen · add a face → thread_start · thread_post · thread_seen · thread_add
//   the rooms        → village.js renderRoom, mounted inside the board as before
import * as api from './api.js?v=143';
import { state, isDemo, personName, firstName, searchCustomers, loadFile, threadForJob, postMessage } from './book.js?v=143';
import { esc, toast } from './ui.js?v=143';
import { renderRoom, personOf, charStyle, charFace, titleOf, wireAtOn } from './village.js?v=143';
import { micButton } from './dictate.js?v=143';
import { DEMO } from './demo.js?v=143';

const ROOM_ORDER = ['sales', 'office', 'production', 'village'];
const ROOM_WHO = {   // who has the standing room on the board (316's push rules; sales = the reps' thread)
  sales: (r) => ['owner', 'admin', 'manager', 'sales'].includes(r),
  office: (r) => ['office', 'admin', 'owner', 'manager'].includes(r),
  production: (r) => ['manager', 'admin', 'owner'].includes(r),
  village: () => true,
};
const ROOM_META = {
  sales: { letter: 'S', name: 'Sales · all the reps', note: 'the reps’ own thread, on their phones' },
  office: { letter: 'O', name: 'Office', note: 'Sam, Laura, Jess and the managers' },
  production: { letter: 'P', name: 'Production', note: 'the managers and the supervisors' },
  village: { letter: 'E', name: 'Everyone · the Village', note: 'every seat in the company' },
};
const ROLE_ORDER = { owner: 0, admin: 1, manager: 2, office: 3, sales: 4, crew: 5 };

let ctx = null;
let timer = null;
let outsideWired = false;

export function stopVillagePoll() { if (timer) clearInterval(timer); timer = null; ctx = null; }
// 141 THE BING ON EVERY MESSAGE: alerts.js asks which pane is on the screen so the post you are already reading does not bing
export function openKey() { const o = ctx?.open; if (!o) return null; return o.kind === 'room' ? 'room:' + o.room : o.kind === 'thread' ? 'thread:' + o.id : null; }

// ── small helpers ─────────────────────────────────────────────────────────────
const P = (id) => (state.people || []).find((p) => p.id === id) || null;
const mins = (iso) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
const agoWord = (iso) => { const m = mins(iso); return m < 1 ? 'NOW' : m < 60 ? m + ' MIN' : m < 1440 ? Math.round(m / 60) + ' H' : Math.round(m / 1440) + ' D'; };
const relTime = (iso) => { const d = new Date(iso); const today = new Date().toDateString() === d.toDateString(); return (today ? '' : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ') + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
const lit = (s) => s.replace(/@([A-Z][A-Za-z]+(?: [A-Z][a-z]+)?|[a-z]+)/g, (m0) => '<span class="at">' + m0 + '</span>');
const face = (p) => {
  const ini = (p?.initials || String(p?.name || '').trim().split(/\s+/).map((w) => w[0] || '').join('') || '?').slice(0, 2).toUpperCase();
  return `<span class="ini${p?.avatar ? ' face' : ''}" title="${esc(p?.name || '')}" style="${charStyle({ name: p?.name }, p)}">${esc(charFace({ initials: ini }, p))}</span>`;
};
const facesOf = (members, max = 5) => `<span class="vfaces">${(members || []).slice(0, max).map((m) => face(P(m.id) || m)).join('')}${(members || []).length > max ? `<span class="ini">+${members.length - max}</span>` : ''}</span>`;
function threadName(t) {
  if (t.name) return t.name;
  const me = state.me?.id; const ms = t.members || [];
  const others = ms.filter((m) => m.id !== me).map((m) => firstName(m.name));
  return others.join(' · ') + (ms.some((m) => m.id === me) ? (others.length ? ' · you' : 'you') : '');
}
function waitChip(t) {
  const w = agoWord(t.last_at);
  if (Number(t.unread) > 0) return `<span class="vwait ${mins(t.last_at) >= 60 ? 'red' : ''}">you · ${w}</span>`;
  if (t.waiting_on) return `<span class="vwait">${esc(String(t.waiting_on).split(', ')[0])} · ${w}</span>`;
  return `<span class="vwait dim">${w}</span>`;
}
function orderThreads(ts) {
  const score = (t) => (Number(t.unread) > 0 ? 0 : t.waiting_on ? 1 : 2);
  return ts.slice().sort((a, b) => score(a) - score(b) || (score(a) < 2 ? new Date(a.last_at) - new Date(b.last_at) : new Date(b.last_at) - new Date(a.last_at)));
}

// ── the data ──────────────────────────────────────────────────────────────────
async function loadCards() {
  if (!ctx) return;
  if (isDemo()) { demoSeed(); ctx.threads = DEMO_STORE.threads.map(demoCard); ctx.roomLast = demoRoomLast(); return; }
  const [threads, rooms, hype] = await Promise.all([
    api.page('v_my_threads?select=*&order=last_at.desc', 300).catch(() => []),
    api.page('v_team_room?select=room,author_name,body,created_at&room=neq.thread&order=created_at.desc&limit=40', 40).catch(() => []),
    api.page('hype_messages?select=author_name,body,created_at&order=created_at.desc&limit=1', 1).catch(() => []),
  ]);
  if (!ctx) return;
  ctx.threads = Array.isArray(threads) ? threads : [];
  const last = {};
  for (const r of rooms || []) if (!last[r.room]) last[r.room] = r;
  if (hype && hype[0]) last.sales = hype[0];
  ctx.roomLast = last;
}

// ── the screen ────────────────────────────────────────────────────────────────
export function renderVillage(root) {
  stopVillagePoll();
  ctx = { root, mode: 'cards', open: null, threads: [], roomLast: {}, newPick: new Set(), replyTo: null, about: null, msgKey: null, busy: false };
  root.innerHTML = `
    <div class="head" style="margin-bottom:6px">
      <div class="kicker">The Village · your conversations · waiting longest on top</div>
      <div class="right">
        <div class="lanes"><button class="lanebtn on" data-mode="cards">By conversation</button><button class="lanebtn" data-mode="people">By person</button></div>
        <button class="btn sm" id="my-character" title="Your emoji and your color, everywhere your name shows">🎨 My character</button>
      </div>
    </div>
    <div class="vb" data-vb><div class="vb-list" data-list><div class="empty">Reading the Village…</div></div><div class="vb-open" data-open></div></div>`;
  root.querySelectorAll('[data-mode]').forEach((b) => (b.onclick = () => {
    if (!ctx) return;
    ctx.mode = b.dataset.mode;
    root.querySelectorAll('[data-mode]').forEach((x) => x.classList.toggle('on', x === b));
    if (ctx.mode === 'people') paintPeople(); else { paintBoardShell(); paintList(); reopen(); }
  }));
  wireOutsideClicks();
  loadCards().then(() => { if (!ctx) return; paintList(); arm(); }).catch((e) => toast(e.message || 'The Village would not load', 'err'));
}

function arm() {
  if (timer) return;
  timer = setInterval(async () => {
    if (!ctx || !ctx.root?.isConnected) { stopVillagePoll(); return; }
    try {
      await loadCards();
      if (!ctx) return;
      if (ctx.mode === 'people') paintPeople(); else { paintList(); await loadMsgs(false); }
    } catch { /* the next tick tries again */ }
  }, 20000);
}

function paintBoardShell() {
  const vb = ctx.root.querySelector('[data-vb]');
  if (!vb.querySelector('[data-list]')) vb.innerHTML = `<div class="vb-list" data-list></div><div class="vb-open" data-open></div>`;
  vb.classList.remove('vcols-mode');
}

function paintList() {
  if (!ctx || ctx.mode !== 'cards') return;
  const list = ctx.root.querySelector('[data-list]'); if (!list) return;
  const role = state.me?.role || 'sales';
  const openKey = ctx.open ? ctx.open.kind + ':' + (ctx.open.id || ctx.open.room || '') : '';
  const roomCard = (k) => {
    const m = ROOM_META[k]; const l = ctx.roomLast?.[k];
    return `<button class="vcard ${openKey === 'room:' + k ? 'on' : ''}" data-open-room="${k}"><div class="row"><span class="vfaces"><span class="ini grp">${m.letter}</span></span><span class="vwait dim">always there</span></div><div class="nm">${esc(m.name)}</div><div class="last">${l ? esc(firstName(l.author_name || '') + ': ' + (l.body || '')) : esc(m.note)}</div></button>`;
  };
  const tCard = (t) => `<button class="vcard ${openKey === 'thread:' + t.id ? 'on' : ''}" data-open-thread="${esc(t.id)}"><div class="row">${facesOf(t.members)}${waitChip(t)}</div><div class="nm">${esc(threadName(t))}</div><div class="last">${t.last_body ? esc(firstName(t.last_author_name || '') + ': ' + t.last_body) : 'Nothing said yet'}</div></button>`;
  list.innerHTML = `<button class="vcard new ${openKey === 'new:' ? 'on' : ''}" data-open-new><div class="row"><span class="vfaces"><span class="ini grp">+</span></span><span class="vwait ok">start one</span></div><div class="nm">New conversation</div><div class="last">Tap faces, type, Enter</div></button>`
    + ROOM_ORDER.filter((k) => ROOM_WHO[k](role)).map(roomCard).join('')
    + orderThreads(ctx.threads || []).map(tCard).join('');
  list.querySelectorAll('[data-open-room]').forEach((b) => (b.onclick = () => openRoom(b.dataset.openRoom)));
  list.querySelectorAll('[data-open-thread]').forEach((b) => (b.onclick = () => openThread(b.dataset.openThread)));
  const nb = list.querySelector('[data-open-new]'); if (nb) nb.onclick = openNew;
}

function reopen() {
  if (!ctx?.open) return;
  const o = ctx.open;
  if (o.kind === 'room') openRoom(o.room); else if (o.kind === 'thread') openThread(o.id); else if (o.kind === 'new') openNew();
}

function paneShell(inner) {
  const open = ctx.root.querySelector('[data-open]'); if (!open) return null;
  open.innerHTML = `<button class="btn sm vback" data-back>‹ All conversations</button>${inner}`;
  open.querySelector('[data-back]').onclick = () => { ctx.open = null; ctx.root.querySelector('[data-vb]')?.classList.remove('opened'); open.innerHTML = ''; paintList(); };
  ctx.root.querySelector('[data-vb]')?.classList.add('opened');
  return open;
}

// a standing room: the same card the Village had, with Enter sending here (B's habit)
function openRoom(room) {
  ctx.open = { kind: 'room', room }; ctx.replyTo = null; ctx.about = null;
  paintList();
  paneShell(`<div class="village-wide" data-room-host></div>`);
  const m = ROOM_META[room];
  renderRoom(ctx.root.querySelector('[data-room-host]'), room, { enterSends: true, kicker: m.name, note: m.note });
}

// ── a conversation ────────────────────────────────────────────────────────────
async function openThread(id) {
  ctx.open = { kind: 'thread', id }; ctx.replyTo = null; ctx.about = null; ctx.msgKey = null;
  paintList();
  const t = (ctx.threads || []).find((x) => x.id === id);
  paneShell(`
    <div class="vto" data-to style="position:relative"><span class="kicker">To</span>${(t?.members || []).map((m) => `<span class="pill">${face(P(m.id) || m)}${esc(firstName(m.name))}</span>`).join('')}<span class="pill add" data-add>+ add a face</span><div class="line-find-pop" data-add-pop hidden></div></div>
    <div class="room village-wide"><div class="vmsgs" data-msgs><div class="empty">Reading…</div></div></div>
    <div class="small" data-replying hidden></div>
    <div class="composer" style="position:relative"><textarea data-say placeholder="Type it like a text…"></textarea><button class="btn fill" data-post>Send</button><div class="line-find-pop at-pop" data-at-pop hidden></div></div>
    <div class="vabout"><span class="kicker">About</span><input data-find placeholder="a customer (optional) — name or number"/><span data-about-pick></span><div class="room-pop" data-pop hidden></div></div>
    <div class="small">Enter sends · Shift+Enter for a new line · everyone on the To row gets the buzz · @ a name to add their face · 🎤 talks into the box</div>`);
  wireComposer(); wireAdd(t); wireAbout();
  await loadMsgs(true);
  if (!ctx || ctx.open?.id !== id) return;
  if (!isDemo()) api.rpc('thread_seen', { p_thread: id }).catch(() => {});
  if (t && Number(t.unread) > 0) { t.unread = 0; paintList(); }
}

async function loadMsgs(toBottom) {
  if (!ctx?.open || ctx.open.kind !== 'thread') return;
  const box = ctx.root.querySelector('[data-msgs]'); if (!box) return;
  const id = ctx.open.id;
  let rows = [];
  if (isDemo()) rows = (DEMO_STORE.msgs[id] || []).slice();
  else rows = await api.page(`v_team_room?select=*&thread_id=eq.${encodeURIComponent(id)}&order=created_at.asc`, 500).catch(() => []);
  if (!ctx || ctx.open?.id !== id) return;
  const key = rows.length ? rows[rows.length - 1].id + ':' + rows.length : '0';
  if (!toBottom && key === ctx.msgKey) return;
  ctx.msgKey = key;
  // one level of little threads: a reply to a reply hangs under the same root
  const byId = new Map(rows.map((m) => [m.id, m]));
  const rootOf = (m) => { let x = m, n = 0; while (x.reply_to && byId.get(x.reply_to) && n++ < 20) x = byId.get(x.reply_to); return x.id; };
  const roots = rows.filter((m) => !m.reply_to || !byId.get(m.reply_to));
  const kids = {};
  for (const m of rows) if (m.reply_to && byId.get(m.reply_to)) (kids[rootOf(m)] ||= []).push(m);
  const stick = toBottom || (box.scrollHeight - box.scrollTop - box.clientHeight < 80);
  box.innerHTML = roots.length
    ? roots.map((m) => bubble(m) + (kids[m.id]?.length
        ? `<div class="vsplit"><div class="lab">a little thread · ${esc([...new Set(kids[m.id].map((k) => firstName(k.author_name)))].join(', '))}</div>${kids[m.id].map((k) => bubble(k, true)).join('')}</div>`
        : '')).join('')
    : '<div class="empty">Nothing here yet. Say the first thing.</div>';
  box.querySelectorAll('[data-reply]').forEach((b) => (b.onclick = () => { ctx.replyTo = { id: b.dataset.reply, first: b.dataset.first }; paintReplying(); ctx.root.querySelector('[data-say]')?.focus(); }));
  if (stick) box.scrollTop = box.scrollHeight;
}

function bubble(m, small = false) {
  const mine = m.author_id === state.me?.id;
  const who = P(m.author_id) || personOf({ authorId: m.author_id, name: m.author_name }) || { name: m.author_name, initials: m.author_initials };
  const on = m.customer_id ? `<button class="chip cust" onclick="__peek('${esc(m.customer_id)}')" title="Open the file">on ${esc(personName(m.customer_name || 'the file'))}</button>` : '';
  return `<div class="roomrow ${mine ? 'out' : ''}">${face(who)}<div class="msg ${mine ? 'out' : 'in'}"><div class="who">${esc(firstName(m.author_name || ''))} · ${esc(relTime(m.created_at))}</div><div class="say">${lit(esc(m.body))}</div>${on}${small ? '' : `<button class="vreply" data-reply="${esc(m.id)}" data-first="${esc(firstName(m.author_name || ''))}">Reply · splits off ↓</button>`}</div></div>`;
}

function paintReplying() {
  const el = ctx.root.querySelector('[data-replying]'); if (!el) return;
  el.hidden = !ctx.replyTo;
  el.innerHTML = ctx.replyTo ? `Replying under ${esc(ctx.replyTo.first)}'s line · it splits off into a little thread · <a href="#" data-unreply>never mind</a>` : '';
  const u = el.querySelector('[data-unreply]'); if (u) u.onclick = (e) => { e.preventDefault(); ctx.replyTo = null; paintReplying(); };
}

function paintAbout() {
  const el = ctx.root.querySelector('[data-about-pick]'); if (!el) return;
  el.innerHTML = ctx.about ? `<span class="chip cust">on ${esc(personName(ctx.about.name))} <span data-unabout style="cursor:pointer;padding-left:4px">×</span></span> <span class="small">it lands on their file too</span>` : '';
  const u = el.querySelector('[data-unabout]'); if (u) u.onclick = () => { ctx.about = null; paintAbout(); };
}

function wireComposer() {
  const say = ctx.root.querySelector('[data-say]'); const postBtn = ctx.root.querySelector('[data-post]'); const atPop = ctx.root.querySelector('[data-at-pop]');
  if (!say || !postBtn) return;
  wireAtOn(say, atPop, (c) => { ctx.about = c; paintAbout(); });   // @ a person leaves "@First" (411 adds their face); @ a customer hangs it on the file
  say.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.shiftKey || e.altKey || e.isComposing || e.defaultPrevented) return;
    if (atPop && !atPop.hidden) return;   // the @ picker takes Enter
    e.preventDefault(); send();
  });
  postBtn.onclick = send;
  const m = micButton(say); if (m) postBtn.parentElement.insertBefore(m, postBtn);
  say.focus();
}

async function send() {
  if (!ctx || ctx.busy) return;
  const say = ctx.root.querySelector('[data-say]'); const body = (say?.value || '').trim();
  if (!body) return;
  const open = ctx.open; if (!open) return;
  ctx.busy = true;
  const btn = ctx.root.querySelector('[data-post]'); if (btn) btn.disabled = true;
  try {
    if (open.kind === 'new') { await startNew(body); return; }
    if (open.kind !== 'thread') return;
    const about = ctx.about, replyTo = ctx.replyTo;
    say.value = ''; ctx.replyTo = null; paintReplying();
    if (isDemo()) { demoPost(open.id, body, replyTo?.id ?? null, about); toast('Demo — posted here only, nothing is saved'); }
    else {
      await api.rpc('thread_post', { p_thread: open.id, p_body: body, p_reply_to: replyTo?.id ?? null, p_customer: about?.id ?? null });
      if (about?.id) hangOnFile(about.id, body);
      toast(replyTo ? `In the little thread under ${replyTo.first}'s line` : 'Sent · everyone on the To row gets the buzz');
    }
    ctx.about = null; paintAbout();
    await loadMsgs(true);
    await loadCards(); paintList();
  } catch (e) { toast(e.message || 'It did not go through', 'err'); }
  finally { if (ctx) { ctx.busy = false; const b = ctx.root.querySelector('[data-post]'); if (b) b.disabled = false; } }
}

/* Kevin, 15 Sep: "keep it with inside the customer file." A conversation line hung on a customer is ALSO a note on that
   file's thread — same words, the @First mentions intact. Best effort, as the rooms do it. */
async function hangOnFile(customerId, body) {
  try {
    const f = await loadFile(customerId);
    let tid = f.thread?.id;
    if (!tid && f.job?.job_id) tid = await threadForJob(f.job.job_id);
    if (tid) await postMessage(tid, ['manager'].includes(state.me?.role) ? 'SUPER' : 'OFFICE', body);
    else toast('Sent · this customer has no job yet, so nothing landed on a file');
  } catch (e) { toast('Sent · the file did not take it: ' + (e.message || ''), 'err'); }
}

function wireAdd(t) {
  const btn = ctx.root.querySelector('[data-add]'); const pop = ctx.root.querySelector('[data-add-pop]');
  if (!btn || !pop || !t) return;
  btn.onclick = () => {
    if (!pop.hidden) { pop.hidden = true; return; }
    const have = new Set((t.members || []).map((m) => m.id));
    const ps = (state.people || []).filter((p) => !have.has(p.id) && p.role !== 'crew').slice().sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) || String(a.name).localeCompare(String(b.name)));
    pop.innerHTML = ps.length
      ? ps.map((p) => `<button class="line-item emp" data-add-rep="${esc(p.id)}"><span class="line-av">${esc((p.initials || firstName(p.name) || '?').slice(0, 2).toUpperCase())}</span><span><span class="nm">${esc(p.name)}</span><span class="pv">${esc(titleOf(p))}</span></span></button>`).join('')
      : '<div class="empty">Everyone is already here</div>';
    pop.hidden = false;
    pop.querySelectorAll('[data-add-rep]').forEach((b) => (b.onclick = async () => {
      pop.hidden = true;
      const rep = b.dataset.addRep;
      try {
        if (isDemo()) demoAdd(t.id, rep); else await api.rpc('thread_add', { p_thread: t.id, p_rep: rep });
        toast(`${firstName(P(rep)?.name || 'They')} is in · they got the buzz`);
        await loadCards(); await openThread(t.id);
      } catch (e) { toast(e.message || 'Could not add them', 'err'); }
    }));
  };
}

function wireAbout() {
  const find = ctx.root.querySelector('[data-find]'); const pop = ctx.root.querySelector('[data-pop]');
  if (!find || !pop) return;
  let t = null;
  const close = () => { pop.hidden = true; pop.innerHTML = ''; };
  find.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const q = find.value.trim();
      if (q.length < 2) { close(); return; }
      let rows = [];
      try { rows = await searchCustomers(q); } catch { rows = []; }
      pop.innerHTML = rows.length
        ? rows.slice(0, 8).map((c) => `<button class="line-item" data-id="${esc(c.id)}" data-name="${esc(personName(c.name))}"><span class="line-av">${esc((firstName(c.name) || '?').slice(0, 2).toUpperCase())}</span><span><span class="nm">${esc(personName(c.name))}</span><span class="pv">${esc(c.street || c.phone || '')}${c.city ? ' · ' + esc(c.city) : ''}</span></span></button>`).join('')
        : '<div class="empty">Nobody by that name or number</div>';
      pop.hidden = false;
      pop.querySelectorAll('button[data-id]').forEach((b) => (b.onclick = () => { ctx.about = { id: b.dataset.id, name: b.dataset.name }; find.value = ''; close(); paintAbout(); ctx.root.querySelector('[data-say]')?.focus(); }));
    }, 220);
  });
  find.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); find.blur(); } });
}

function wireOutsideClicks() {
  if (outsideWired) return;
  outsideWired = true;
  document.addEventListener('click', (e) => {
    if (!ctx?.root) return;
    ctx.root.querySelectorAll('[data-pop]:not([hidden]), [data-add-pop]:not([hidden])').forEach((p) => {
      const owner = p.parentElement?.querySelector('[data-find], [data-add]');
      if (p.contains(e.target) || (owner && owner.contains(e.target))) return;
      p.hidden = true; p.innerHTML = '';
    });
  });
}

// ── a new conversation: tap faces, type, Enter ────────────────────────────────
function openNew() {
  ctx.open = { kind: 'new' }; ctx.newPick = new Set(); ctx.about = null; ctx.replyTo = null;
  paintList();
  const me = state.me?.id;
  const people = (state.people || []).filter((p) => p.id !== me && p.role !== 'crew').slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const secs = [['Office', (p) => ['office', 'admin'].includes(p.role)], ['Sales', (p) => p.role === 'sales'], ['Supervisors and managers', (p) => p.role === 'manager'], ['Owners', (p) => p.role === 'owner']];
  const open = paneShell(`
    <div class="vto" data-to><span class="kicker">To</span><span class="small">tap the faces below</span></div>
    <div class="vpick">${secs.map(([label, f]) => { const ps = people.filter(f); if (!ps.length) return ''; return `<div class="sec"><div class="kicker"><span>${esc(label)}</span><button class="btn sm" data-all="${esc(label)}">All</button></div><div class="faces">${ps.map((p) => `<button class="fb" data-pick="${esc(p.id)}" data-sec="${esc(label)}">${face(p)}${esc(firstName(p.name))}<span class="small">${esc(titleOf(p))}</span></button>`).join('')}</div></div>`; }).join('')}</div>
    <div class="composer" style="position:relative;margin-top:10px"><textarea data-say placeholder="Type it like a text…"></textarea><button class="btn fill" data-post>Send</button><div class="line-find-pop at-pop" data-at-pop hidden></div></div>
    <div class="vabout"><span class="kicker">About</span><input data-find placeholder="a customer (optional) — name or number"/><span data-about-pick></span><div class="room-pop" data-pop hidden></div></div>
    <div class="small">The faces are the name. Enter sends. The same faces next time open this same conversation.</div>`);
  if (!open) return;
  open.querySelectorAll('[data-pick]').forEach((b) => (b.onclick = () => { const id = b.dataset.pick; if (ctx.newPick.has(id)) ctx.newPick.delete(id); else ctx.newPick.add(id); paintNewTo(); }));
  open.querySelectorAll('[data-all]').forEach((b) => (b.onclick = () => {
    const ids = [...open.querySelectorAll('[data-pick]')].filter((x) => x.dataset.sec === b.dataset.all).map((x) => x.dataset.pick);
    const allOn = ids.every((id) => ctx.newPick.has(id));
    ids.forEach((id) => (allOn ? ctx.newPick.delete(id) : ctx.newPick.add(id)));
    paintNewTo();
  }));
  wireComposer(); wireAbout();
}

function paintNewTo() {
  const open = ctx.root.querySelector('[data-open]'); if (!open) return;
  open.querySelectorAll('[data-pick]').forEach((b) => b.classList.toggle('on', ctx.newPick.has(b.dataset.pick)));
  const to = open.querySelector('[data-to]'); if (!to) return;
  const ps = [...ctx.newPick].map(P).filter(Boolean);
  to.innerHTML = `<span class="kicker">To</span>` + (ps.length ? ps.map((p) => `<span class="pill">${face(p)}${esc(firstName(p.name))}<span class="x" data-unpick="${esc(p.id)}">×</span></span>`).join('') : '<span class="small">tap the faces below</span>');
  to.querySelectorAll('[data-unpick]').forEach((x) => (x.onclick = () => { ctx.newPick.delete(x.dataset.unpick); paintNewTo(); }));
}

async function startNew(body) {
  const ids = [...ctx.newPick];
  if (!ids.length) { toast('Tap at least one face first', 'err'); return; }
  const about = ctx.about;
  let id;
  if (isDemo()) { id = demoStart(ids, body, about); toast('Demo — started here only, nothing is saved'); }
  else {
    id = await api.rpc('thread_start', { p_members: ids, p_body: body, p_customer: about?.id ?? null });
    if (about?.id) hangOnFile(about.id, body);
    toast('Sent · everyone on the To row gets the buzz');
  }
  ctx.about = null;
  await loadCards();
  await openThread(id);
}

// ── by person: the same cards, one column per employee ────────────────────────
function paintPeople() {
  if (!ctx || ctx.mode !== 'people') return;
  const vb = ctx.root.querySelector('[data-vb]'); if (!vb) return;
  vb.classList.remove('opened');
  const me = state.me?.id; const ts = ctx.threads || [];
  const people = (state.people || []).filter((p) => p.role !== 'crew').slice()
    .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) || String(a.name).localeCompare(String(b.name)));
  const col = (p) => {
    const mine = orderThreads(ts.filter((t) => (t.members || []).some((m) => m.id === p.id)));
    if (!mine.length) return '';
    const card = (t) => `<button class="vcard" data-open-thread="${esc(t.id)}"><div class="row">${facesOf((t.members || []).filter((m) => m.id !== p.id), 4)}${waitChip(t)}</div><div class="last">${t.last_body ? esc(firstName(t.last_author_name || '') + ': ' + t.last_body) : 'Nothing said yet'}</div></button>`;
    return `<div class="vcol"><div class="vh">${face(p)}${esc(firstName(p.name))}${p.id === me ? ' (you)' : ''}<span class="k">${esc(titleOf(p))}</span></div>${mine.map(card).join('')}</div>`;
  };
  const cols = people.map(col).join('');
  vb.classList.add('vcols-mode');
  vb.innerHTML = `<div class="vcols">${cols || '<div class="empty">No conversations yet. Switch to By conversation and start one.</div>'}</div><div class="small" style="margin-top:8px">${state.me && ['owner', 'admin'].includes(state.me.role) ? 'Every conversation in the company, by who is in it. ' : 'Your conversations, by who is in them. '}A person with none yet is not shown. Tap a card to open it.</div>`;
  vb.querySelectorAll('[data-open-thread]').forEach((b) => (b.onclick = () => {
    ctx.mode = 'cards';
    ctx.root.querySelectorAll('[data-mode]').forEach((x) => x.classList.toggle('on', x.dataset.mode === 'cards'));
    paintBoardShell(); paintList(); openThread(b.dataset.openThread);
  }));
}

// ── the demo: fictional conversations, in memory, so the walk-through has something to show ──
const DEMO_STORE = { threads: null, msgs: {}, n: 0 };
const agoIso = (h) => new Date(Date.now() - h * 3600e3).toISOString();
function demoSeed() {
  if (DEMO_STORE.threads) return;
  const me = state.me?.id || 'k';
  const has = (id) => !!P(id);
  const mk = (members, msgs) => {
    const id = 'dt' + (++DEMO_STORE.n);
    const ms = [...new Set([me, ...members])].filter(has);
    const t = { id, name: null, members: ms.map((m) => ({ ...(P(m) || { id: m, name: m }), seen_at: null })), created_at: agoIso(200), mine: true };
    DEMO_STORE.msgs[id] = msgs.filter((m) => has(m.by)).map((m, i) => ({ id: id + '-' + i, thread_id: id, author_id: m.by, author_name: P(m.by)?.name || m.by, author_initials: null, body: m.body, reply_to: m.reply != null ? id + '-' + m.reply : null, customer_id: m.cust || null, customer_name: m.custName || null, created_at: agoIso(m.h) }));
    DEMO_STORE.threads.push(t);
  };
  DEMO_STORE.threads = [];
  mk(['sam', 'jc', 'luis'], [
    { by: 'sam', h: 5, body: 'Whitfield: permit is in. @Luis when can the crew start?', cust: 'cj1', custName: 'Whitfield, Mark' },
    { by: 'luis', h: 4.5, reply: 0, body: 'Friday 8 AM. Two guys.' },
    { by: 'jc', h: 4.2, reply: 0, body: "I'll text the customer the day before." },
    { by: 'luis', h: 0.25, body: 'Crew is there at 8. Who calls the customer?' },
  ]);
  mk(['r3'], [{ by: 'r3', h: 2.1, body: 'Okafor wants the gutters priced with the re-roof. Reprice?', cust: 'cj5', custName: 'Okafor, Sam' }]);
  mk(['obed', 'luis'], [{ by: me, h: 30, body: 'Both trucks on the Alvarez job Friday?' }, { by: 'obed', h: 28, body: 'Both trucks out Friday.' }]);
}
function demoTouch(t) {
  const me = state.me?.id || 'k';
  const msgs = DEMO_STORE.msgs[t.id] || [];
  const last = msgs[msgs.length - 1];
  t.last_at = last ? last.created_at : t.created_at; t.last_body = last?.body || null; t.last_author_id = last?.author_id || null; t.last_author_name = last?.author_name || null;
  t.n_messages = msgs.length;
  if (t.unread == null) t.unread = last && last.author_id !== me ? 1 : 0;
  t.waiting_on = last ? t.members.filter((m) => m.id !== last.author_id && m.id !== me).map((m) => firstName(m.name)).join(', ') || null : null;
  return t;
}
const demoCard = (t) => ({ ...demoTouch(t) });
function demoRoomLast() {
  const out = {};
  try {
    const R = { ...(DEMO.rooms || {}), sales: DEMO.hype || [] };
    for (const k of Object.keys(R)) { const rows = (R[k] || []).slice().sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0)); const l = rows[rows.length - 1]; if (l) out[k] = { author_name: l.name, body: l.body }; }
  } catch { /* the demo rooms are optional */ }
  return out;
}
function demoStart(ids, body, about) {
  demoSeed();
  const me = state.me?.id || 'k';
  const key = [...new Set([me, ...ids])].sort().join(',');
  let t = DEMO_STORE.threads.find((x) => x.members.map((m) => m.id).sort().join(',') === key);
  if (!t) { const id = 'dt' + (++DEMO_STORE.n); t = { id, name: null, members: [...new Set([me, ...ids])].map((m) => ({ ...(P(m) || { id: m, name: m }), seen_at: null })), created_at: new Date().toISOString(), mine: true }; DEMO_STORE.msgs[id] = []; DEMO_STORE.threads.push(t); }
  demoPost(t.id, body, null, about);
  return t.id;
}
function demoPost(tid, body, replyTo, about) {
  const me = state.me || {};
  (DEMO_STORE.msgs[tid] ||= []).push({ id: tid + '-' + Date.now(), thread_id: tid, author_id: me.id, author_name: me.name || 'You', author_initials: null, body, reply_to: replyTo, customer_id: about?.id || null, customer_name: about?.name || null, created_at: new Date().toISOString() });
  const t = DEMO_STORE.threads.find((x) => x.id === tid); if (t) { t.unread = 0; demoTouch(t); }
}
function demoAdd(tid, rep) {
  const t = DEMO_STORE.threads.find((x) => x.id === tid); const p = P(rep);
  if (t && p && !t.members.some((m) => m.id === rep)) t.members.push({ ...p, seen_at: null });
}
