// THE BING (Kevin, 15 Sep night: "in the b2b it has this cool loud bing and a
// little side screen pops up. the popup needs to be obvious and easy to check
// off for the employee whose task it is to complete").
// Jermey's desk proved the shape: a chime, a browser notification, a card in the
// corner. Here the card is a TASK CARD — it stays until the person it is for
// presses ✓ Got it (marks it seen, the tab count drops) or opens the file.
// Every 10 seconds this asks for anything new with your name on it: an @-tag
// on a customer's file (v_my_mentions) or a direct line to you
// (direct_messages). The phone gets the same thing as a push (312 / 346).
import * as api from './api.js?v=90';
import { state, isDemo, mentionSeen, directSeen, personName, firstName } from './book.js?v=90';
import { $, esc, toast } from './ui.js?v=90';

let timer = null, since = null, unseen = 0;
const seen = new Set();
const KEY = () => `cc:alerts-since:${state.me?.id || 'x'}`;

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
  const el = document.createElement('div'); el.className = 'alert';
  const who = firstName(h.from) || 'Someone';
  el.innerHTML = `
    <div class="ak">${h.kind === 'direct' ? '✉ direct line · just you two' : h.kind === 'room' ? '@ tagged you in the ' + esc(h.room === 'village' ? 'Village' : h.room + ' room') : '@ tagged you'} · ${esc(who)}</div>
    ${h.customer ? `<div class="an">${esc(personName(h.customer))}</div>` : `<div class="an">${esc(h.from || 'A seat')}</div>`}
    <div class="ab">${esc(String(h.body || '').slice(0, 220))}</div>
    <div class="af">
      ${h.customer_id ? '<button class="btn sm fill" data-act="open">Open the file</button>' : (h.kind === 'direct' ? '<button class="btn sm fill" data-act="line">Open the line</button>' : h.kind === 'room' ? '<button class="btn sm fill" data-act="room">Open the ' + (h.room === 'village' ? 'Village' : 'room') + '</button>' : '')}
      <button class="btn sm ok" data-act="done">✓ Got it</button>
    </div>`;
  const gone = () => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); };
  el.querySelector('[data-act="done"]').onclick = async () => { gone(); await settle(h); };
  const open = el.querySelector('[data-act="open"]'); if (open) open.onclick = async () => { gone(); await settle(h); window.__peek(h.customer_id); };
  const line = el.querySelector('[data-act="line"]'); if (line) line.onclick = async () => { gone(); await settle(h); if (window.__go) window.__go('line'); };
  const room = el.querySelector('[data-act="room"]'); if (room) room.onclick = async () => { gone(); await settle(h); if (window.__go) window.__go(h.room === 'village' ? 'village' : 'line'); };
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
}
function notify(h) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(`${firstName(h.from) || 'Someone'} ${h.kind === 'direct' ? 'sent you a line' : h.kind === 'room' ? 'tagged you in the Village' : 'tagged you' + (h.customer ? ' on ' + personName(h.customer) : '')}`, { body: String(h.body || '').slice(0, 140), tag: `cc-${h.id}` });
    n.onclick = () => { window.focus(); n.close(); if (h.customer_id) window.__peek(h.customer_id); };
  } catch {}
}
function fire(hits) {
  if (!hits.length) return;
  chime();
  for (const h of hits.slice(-4)) { card(h); notify(h); }
  if (document.hidden) { unseen += hits.length; title(); }
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
  if (!hits.length) return;
  hits.sort((a, b) => new Date(a.at) - new Date(b.at));
  const newest = hits[hits.length - 1].at; if (newest > since) { since = newest; try { localStorage.setItem(KEY(), since); } catch {} }
  fire(hits);
}

export function startAlerts() {
  if (timer || !state.me) return;
  if (isDemo()) {
    // the film: one staged tag lands twenty seconds in, so the seat sees the bing and the card
    const m = (state.mentions || [])[0];
    const stage = () => { if (m && !document.querySelector('#alerts .alert')) fire([{ id: 'demo', kind: 'mention', thread_id: m.thread_id, customer_id: m.customer_id, customer: m.customer_name, from: m.author_name, body: m.body, at: m.created_at }]); };
    window.__demoBing = stage;
    // the film fires it on its own step; a plain demo tab stays quiet unless the page asks (&bing=1) — Kevin, 16 Sep: "a loud notification buzz on my laptop for no reason"
    if (/[?&]bing=1/.test(location.search)) setTimeout(stage, 20000);
    timer = 1; paintBell(); return;
  }
  try { since = localStorage.getItem(KEY()) || new Date().toISOString(); } catch { since = new Date().toISOString(); }
  const floor = new Date(Date.now() - 2 * 3600e3).toISOString(); if (since < floor) since = floor;   // never replay more than two hours
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
  b.title = on ? 'A bing, a card in the corner and a browser notification when somebody tags you or sends you a line' : 'Click to let the browser notify you when somebody tags you';
  b.onclick = async () => {
    try { localStorage.setItem(ARMED, '1'); } catch {}
    chime(); paintBell();
    toast('Bing on. You get a sound and a card here when somebody tags you.', 'ok');
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      let p = 'default'; try { p = await Notification.requestPermission(); } catch {}
      if (p !== 'granted') toast('For a pop-up outside this tab too: click the bell or lock icon at the right end of the address bar and choose Allow notifications. Not required.', 'warn');
      paintBell();
    }
  };
}
