// THE BING (Kevin, 15 Sep night: "in the b2b it has this cool loud bing and a
// little side screen pops up. the popup needs to be obvious and easy to check
// off for the employee whose task it is to complete").
// Jermey's desk proved the shape: a chime, a browser notification, a card in the
// corner. Here the card is a TASK CARD — it stays until the person it is for
// presses ✓ Got it (marks it seen, the tab count drops) or opens the file.
// Every 10 seconds this asks for anything new with your name on it: an @-tag
// on a customer's file (v_my_mentions) or a direct line to you
// (direct_messages). The phone gets the same thing as a push (312 / 346).
//
// 141 THE BING ON EVERY MESSAGE (Kevin, 18 Sep 4:50 PM: "I want everyone at the
// company to be dinging when they're being notified. That's their notification,
// not a call. It'll just be dinging, and then they're in the app or on their
// desktop."). Until now the desktop only bing'd when your name was in it; a post
// in the Village, the sales chat, a conversation you are in, or a note on a file
// arrived in silence unless you were looking at it. Now every message you can
// see bings, with a card that says where it is. The post you are reading right
// now (that pane open, this tab in front) does not bing — it is already on the
// screen. "Every message" at the top of the rail turns it down to tags only,
// per person, on this browser; a filter by room comes when Kevin asks for it.
import * as api from './api.js?v=144';
import { state, isDemo, mentionSeen, directSeen, personName, firstName } from './book.js?v=144';
import { $, esc, toast } from './ui.js?v=144';
import { openKey } from './threads.js?v=144';
import { mountedRooms } from './village.js?v=144';

let timer = null, since = null, postsSince = null, unseen = 0;
const seen = new Set();
const silent = new Set();   // the machine's seats (Receipts, Highlights): they post, they never bing — same as the phones (395)
const KEY = () => `cc:alerts-since:${state.me?.id || 'x'}`;
const ALL = 'cc-bing-all';
export const everyOn = () => { try { return localStorage.getItem(ALL) !== '0'; } catch { return true; } };
const WHERE = { sales: 'the sales chat', village: 'the Village', office: 'the office room', production: 'the production room', thread: 'a conversation' };
const whereOf = (h) => WHERE[h.room] || ('the ' + h.room);

/* the chime — two notes, louder than the desk's (Kevin: "loud bing") */
export function chime() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    [[880, 0], [1318.5, 0.16]].forEach(([hz, at]) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = hz;
      g.gain.setValueAtTime(0.0001, ac.currentTime + at);
      g.gain.exponentialRampToValueAtTime(0.5, ac.currentTime + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + at + 0.55);
      o.connect(g).connect(ac.destination); o.start(ac.currentTime + at); o.stop(ac.currentTime + at + 0.6);
    });
  } catch {}
}

function host() { let h = $('#alerts'); if (!h) { h = document.createElement('div'); h.id = 'alerts'; document.body.appendChild(h); } return h; }
function badge(delta) {
  // the count on The Line tab moves without re-rendering the room the person is typing in
  const t = document.querySelector('#tabs .tab[data-view="line"]'); if (!t) return;
  let n = t.querySelector('.n'); const v = Math.max(0, (Number(n?.textContent) || 0) + delta);
  if (!v) { if (n) n.remove(); return; }
  if (!n) { n = document.createElement('span'); n.className = 'n'; t.appendChild(n); }
  n.textContent = String(v);
}
function title() { const base = document.title.replace(/^\(\d+\) /, ''); document.title = unseen ? `(${unseen}) ${base}` : base; }
document.addEventListener('visibilitychange', () => { if (!document.hidden) { unseen = 0; title(); } });

/* the task card: who · about whom · the words · OPEN THE FILE · ✓ GOT IT */
function card(h) {
  const el = document.createElement('div'); el.className = 'alert' + (h.kind === 'post' ? ' post' : '');
  const who = firstName(h.from) || 'Someone';
  const kicker = h.kind === 'direct' ? '✉ direct line · just you two'
    : h.kind === 'room' ? '@ tagged you in the ' + esc(h.room === 'village' ? 'Village' : h.room + ' room')
    : h.kind === 'post' ? '💬 ' + esc(whereOf(h))
    : '@ tagged you';
  el.innerHTML = `
    <div class="ak">${kicker} · ${esc(who)}</div>
    ${h.customer ? `<div class="an">${esc(personName(h.customer))}</div>` : `<div class="an">${esc(h.from || 'A seat')}</div>`}
    <div class="ab">${esc(String(h.body || '').slice(0, 220))}</div>
    <div class="af">
      ${h.customer_id ? '<button class="btn sm fill" data-act="open">Open the file</button>' : (h.kind === 'direct' ? '<button class="btn sm fill" data-act="line">Open the line</button>' : (h.kind === 'room' || h.kind === 'post') ? '<button class="btn sm fill" data-act="room">Open the ' + (h.kind === 'post' ? 'Village' : h.room === 'village' ? 'Village' : 'room') + '</button>' : '')}
      <button class="btn sm ok" data-act="done">✓ Got it</button>
    </div>`;
  const gone = () => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); };
  el.querySelector('[data-act="done"]').onclick = async () => { gone(); await settle(h); };
  const open = el.querySelector('[data-act="open"]'); if (open) open.onclick = async () => { gone(); await settle(h); window.__peek(h.customer_id); };
  const line = el.querySelector('[data-act="line"]'); if (line) line.onclick = async () => { gone(); await settle(h); if (window.__go) window.__go('line'); };
  const room = el.querySelector('[data-act="room"]'); if (room) room.onclick = async () => { gone(); await settle(h); if (window.__go) window.__go(h.kind === 'post' || h.room === 'village' ? 'village' : 'line'); };
  host().prepend(el);
  setTimeout(() => el.classList.add('show'), 20);
  // stack cap: the oldest card folds into You're up, where it still waits
  const all = host().querySelectorAll('.alert'); if (all.length > 4) all[all.length - 1].remove();
}
async function settle(h) {
  if (h.kind === 'mention') {
    await mentionSeen(h.thread_id);
    for (const m of state.mentions || []) if (m.thread_id === h.thread_id && !m.seen_at) m.seen_at = new Date().toISOString();
    badge(-1);
  } else if (h.kind === 'room') {
    try { await api.rpc('team_mention_seen', { p_message: h.id }); } catch {}
    badge(-1);
  } else if (h.kind === 'direct') {
    await directSeen(h.from_id);
    const d = (state.direct || []).find((x) => x.other_id === h.from_id); if (d) { badge(-Number(d.unseen || 0)); d.unseen = 0; }
  }
  // a plain post has nothing to mark: the card was the notification
}
function notify(h) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    const first = firstName(h.from) || 'Someone';
    const head = h.kind === 'direct' ? `${first} sent you a line`
      : h.kind === 'room' ? `${first} tagged you in the Village`
      : h.kind === 'post' ? `${first} ${h.customer ? 'on ' + personName(h.customer) : 'in ' + whereOf(h)}`
      : `${first} tagged you${h.customer ? ' on ' + personName(h.customer) : ''}`;
    const n = new Notification(head, { body: String(h.body || '').slice(0, 140), tag: `cc-${h.id}` });
    n.onclick = () => { window.focus(); n.close(); if (h.customer_id) window.__peek(h.customer_id); else if (h.kind === 'post' && window.__go) window.__go('village'); };
  } catch {}
}
function fire(hits) {
  if (!hits.length) return;
  chime();
  for (const h of hits.slice(-4)) { card(h); notify(h); }
  if (document.hidden) { unseen += hits.length; title(); }
}

/* 141: is that post already on the screen? the pane open in the Village, or the room mounted in Home / Office / Production / Sales — and this tab in front */
function onScreen(h) {
  if (document.hidden || !document.hasFocus()) return false;
  const key = h.room === 'thread' ? 'thread:' + h.thread_id : 'room:' + h.room;
  try { if (openKey() === key) return true; } catch {}
  try { if (h.room !== 'thread' && mountedRooms().includes(h.room)) return true; } catch {}
  return false;
}

async function look() {
  if (!state.me || !since) return;
  const hits = [];
  const me = state.me.id;
  try {
    const rows = await api.page(`v_my_mentions?select=message_id,thread_id,created_at,seen_at,customer_id,customer_name,author_name,body&seen_at=is.null&created_at=gt.${encodeURIComponent(since)}&order=created_at.desc&limit=20`, 100);
    for (const r of rows) {
      const k = 'm:' + r.message_id; if (seen.has(k)) continue; seen.add(k);
      if (!(state.mentions || []).some((m) => m.message_id === r.message_id)) { (state.mentions ||= []).unshift(r); badge(1); }
      hits.push({ id: r.message_id, kind: 'mention', thread_id: r.thread_id, customer_id: r.customer_id, customer: r.customer_name, from: r.author_name, body: r.body, at: r.created_at });
    }
  } catch {}
  try {
    const rows = await api.page(`direct_messages?select=id,from_id,body,created_at&to_id=eq.${me}&seen_at=is.null&created_at=gt.${encodeURIComponent(since)}&order=created_at.desc&limit=20`, 100);
    for (const r of rows) {
      const k = 'd:' + r.id; if (seen.has(k)) continue; seen.add(k);
      const p = (state.people || []).find((x) => x.id === r.from_id);
      const d = (state.direct || []).find((x) => x.other_id === r.from_id); if (d) { d.unseen = Number(d.unseen || 0) + 1; badge(1); }
      hits.push({ id: r.id, kind: 'direct', from_id: r.from_id, from: p ? p.name : (d ? d.other_name : 'A seat'), body: r.body, at: r.created_at });
    }
  } catch {}
  try {
    const rows = await api.page(`v_my_room_mentions?select=message_id,created_at,seen_at,room,author_name,body,customer_id,customer_name&seen_at=is.null&created_at=gt.${encodeURIComponent(since)}&order=created_at.desc&limit=20`, 100);
    for (const r of rows) {
      const k = 'r:' + r.message_id; if (seen.has(k)) continue; seen.add(k);
      badge(1);
      hits.push({ id: r.message_id, kind: 'room', room: r.room, customer_id: r.customer_id, customer: r.customer_name, from: r.author_name, body: r.body, at: r.created_at });
    }
  } catch {}
  // the tagged kinds move the old watermark; the posts below keep their own so a page opened now never replays the morning
  if (hits.length) {
    hits.sort((a, b) => new Date(a.at) - new Date(b.at));
    const newest = hits[hits.length - 1].at; if (newest > since) { since = newest; try { localStorage.setItem(KEY(), since); } catch {} }
  }
  // 141: every message you can see — the rooms, your conversations, the notes on files (team_messages) and the sales chat (hype_messages)
  if (everyOn() && postsSince) {
    const posts = [];
    try {
      const rows = await api.page(`v_team_room?select=id,room,author_id,author_name,body,customer_id,customer_name,thread_id,created_at&author_id=neq.${me}&created_at=gt.${encodeURIComponent(postsSince)}&order=created_at.desc&limit=20`, 100);
      for (const r of rows) {
        const k = 'p:' + r.id; if (seen.has(k) || seen.has('r:' + r.id) || seen.has('m:' + r.id)) continue; seen.add(k);   // a tag already made its own card
        if (silent.has(r.author_id)) continue;
        posts.push({ id: r.id, kind: 'post', room: r.room || 'village', thread_id: r.thread_id, customer_id: r.customer_id, customer: r.customer_name, from: r.author_name, body: r.body, at: r.created_at });
      }
    } catch {}
    try {
      const rows = await api.page(`hype_messages?select=id,author_id,author_name,body,created_at&author_id=neq.${me}&created_at=gt.${encodeURIComponent(postsSince)}&order=created_at.desc&limit=20`, 100);
      for (const r of rows) {
        const k = 'h:' + r.id; if (seen.has(k)) continue; seen.add(k);
        if (silent.has(r.author_id)) continue;
        posts.push({ id: r.id, kind: 'post', room: 'sales', from: r.author_name, body: r.body, at: r.created_at });
      }
    } catch {}
    if (posts.length) {
      posts.sort((a, b) => new Date(a.at) - new Date(b.at));
      postsSince = posts[posts.length - 1].at;
      for (const p of posts) if (!onScreen(p)) hits.push(p);
      hits.sort((a, b) => new Date(a.at) - new Date(b.at));
    }
  }
  if (!hits.length) return;
  fire(hits);
}

export function startAlerts() {
  if (timer || !state.me) return;
  if (isDemo()) {
    // the film: one staged tag lands twenty seconds in, so the seat sees the bing and the card
    const m = (state.mentions || [])[0];
    const stage = () => { if (m && !document.querySelector('#alerts .alert')) fire([{ id: 'demo', kind: 'mention', thread_id: m.thread_id, customer_id: m.customer_id, customer: m.customer_name, from: m.author_name, body: m.body, at: m.created_at }]); };
    window.__demoBing = stage;
    // 141: the picture for the was/is — a post in the sales chat and a note on a file, as cards (&bing=all)
    const stagePost = () => fire([
      { id: 'demo-post-1', kind: 'post', room: 'sales', from: 'Haakon Endreson', body: 'Just left the Okonkwo house. Two quotes on the way, she wants to hear back today.', at: new Date().toISOString() },
      { id: 'demo-post-2', kind: 'post', room: 'village', customer_id: m?.customer_id, customer: m?.customer_name, from: 'Samantha White', body: 'Permit is in. City limits, so give it a week. I will post here the minute it clears.', at: new Date().toISOString() },
    ]);
    window.__demoBingPost = stagePost;
    // the film fires it on its own step; a plain demo tab stays quiet unless the page asks (&bing=1) — Kevin, 16 Sep: "a loud notification buzz on my laptop for no reason"
    if (/[?&]bing=1/.test(location.search)) setTimeout(stage, 20000);
    if (/[?&]bing=all/.test(location.search)) setTimeout(stagePost, 1500);
    timer = 1; paintBell(); return;
  }
  try { since = localStorage.getItem(KEY()) || new Date().toISOString(); } catch { since = new Date().toISOString(); }
  const floor = new Date(Date.now() - 2 * 3600e3).toISOString(); if (since < floor) since = floor;   // never replay more than two hours
  postsSince = new Date().toISOString();   // 141: posts start from now — the page you just opened is not a replay
  api.page('reps?select=id&hype_push_silent=eq.true', 50).then((rows) => { for (const r of rows || []) silent.add(r.id); }).catch(() => {});
  look();
  timer = setInterval(look, 10000);
  paintBell();
}

/* the bell in the nav: asks the browser once, then says whether the bing is on */
const ARMED = 'cc-bing-armed';
const armed = () => { try { return localStorage.getItem(ARMED) === '1'; } catch { return false; } };
function paintBell() {
  const b = $('#btn-bell'); if (!b) return;
  const granted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
  const on = granted || armed();
  b.textContent = on ? '🔔 Bing on' : '🔕 Turn the bing on';
  b.classList.toggle('verify', on);
  b.title = on ? 'A bing, a card in the corner and a browser notification on every message you can see: the rooms, the sales chat, your conversations, the notes on files, a tag, a direct line. "Every message" at the top turns it down to tags only.' : 'Click to let the browser notify you when a message lands';
  b.onclick = async () => {
    try { localStorage.setItem(ARMED, '1'); } catch {}
    chime(); paintBell();
    toast(everyOn() ? 'Bing on. Every message you can see: a sound and a card here.' : 'Bing on. A sound and a card here when somebody tags you.', 'ok');
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      let p = 'default'; try { p = await Notification.requestPermission(); } catch {}
      if (p !== 'granted') toast('For a pop-up outside this tab too: click the bell or lock icon at the right end of the address bar and choose Allow notifications. Not required.', 'warn');
      paintBell();
    }
  };
}
