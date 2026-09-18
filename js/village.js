// The village — the team's rooms, with the sales hype thread's manners in all
// of them. Kevin, 13 Sep 2026: "the chat ecosystem we do with the sales hype
// thread needs to be in all the team chats… positive problem solving… any team
// member can jump in and help… a shared village for all customers and all
// employees." Same rails as every other room: RLS decides who reads and who
// writes, a post can hang itself on a customer's file, and ?demo=1 renders a
// fictional room with every write refused.
import * as api from './api.js?v=121';
import { state, isDemo, personName, firstName, searchCustomers, searchPeople, loadFile, threadForJob, postMessage, textCustomer, mentionHandle } from './book.js?v=121';
import { DEMO } from './demo.js?v=121';
import { html, raw, esc, toast } from './ui.js?v=121';
import { enterPosts, micButton } from './dictate.js?v=121';

const ROOMS = {
  sales: { kicker: "Sales hype · the reps' thread, live",
           note: 'the reps’ own thread — the same one on their phones',
           say: 'Post the win. The room hears you…',
           foot: 'This is the reps’ live hype thread. What you post here shows up on their phones.' },
  office: { kicker: 'The office room · who can jump in and help',
            note: 'positive problem solving · anybody can answer',
            say: 'What you are stuck on, or what you just got unstuck…',
            foot: 'Hang a post on a customer and anyone can open their file from it. The customer never sees this room.' },
  production: { kicker: 'Production room',
                note: 'the field, the yard, the fix',
                say: 'What the crew hit, and what the fix is…',
                foot: 'Post the fix, not the complaint. Hang it on the customer so the next person has the file.' },
  village: { kicker: 'The village · everyone',
             note: 'all customers, all employees, one room',
             say: 'Say it to the whole company…',
             foot: 'Everybody with a seat reads this room. Hang a post on a customer and their file is one tap away.' },
};
const EMOJI = ['🔥', '👍', '✅'];   // the key a seat sends is the key the jsonb counts
const LIMIT = 80;

const initialsOf = (name) => (personName(name).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('') || '?').toUpperCase();
const relTime = (iso) => {
  if (!iso) return '';
  const m = (Date.now() - new Date(iso)) / 60000;
  if (m < 1) return 'just now';
  if (m < 60) return Math.round(m) + ' min ago';
  if (m < 1440) return Math.round(m / 60) + ' h ago';
  if (m < 1440 * 7) return Math.round(m / 1440) + ' d ago';
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
};
const byTime = (a, b) => new Date(a.at) - new Date(b.at);

const readPath = (room) => room === 'sales'
  ? `hype_messages?select=id,author_name,author_initials,body,image_url,created_at&order=created_at.desc&limit=${LIMIT}`
  : `v_team_room?select=*&room=eq.${encodeURIComponent(room)}&order=created_at.desc&limit=${LIMIT}`;

/* One shape for both tables: the hype thread has no seat id and no customer. */
function norm(r, room) {
  const name = r.author_name || 'Someone';
  return {
    id: String(r.id), room, name, first: firstName(name) || name,
    initials: String(r.author_initials || initialsOf(name)).slice(0, 2).toUpperCase(),
    authorId: r.author_id ?? null, body: r.body ?? '', image: r.image_url ?? null,
    customerId: r.customer_id ?? null, customerName: r.customer_name ?? null,
    at: r.created_at,
    reactions: r.reactions && typeof r.reactions === 'object' ? r.reactions : {},
  };
}

async function read(room) {
  const rows = isDemo()
    ? (room === 'sales' ? (DEMO.hype || []) : ((DEMO.rooms || {})[room] || []))
    : await api.page(readPath(room), LIMIT);
  return rows.map((r) => norm(r, room)).sort(byTime);
}

const isMine = (m) => m.authorId ? m.authorId === state.me?.id : !!(state.me?.name && m.name === state.me.name);

function bubble(m, room) {
  const mine = isMine(m);
  const on = m.customerId
    ? `<button class="chip cust" onclick="__peek('${esc(m.customerId)}')" title="Open the file">on ${esc(personName(m.customerName || 'the file'))}</button>`
    : '';
  const reacts = room === 'sales' ? '' : `<div class="room-reacts">${EMOJI.map((e) => {
    const n = Number(m.reactions?.[e] || 0);
    return `<button class="react ${n ? 'on' : ''}" data-react="${esc(m.id)}" data-emoji="${e}" title="${n ? n + ' so far' : 'Say it back'}">${e}${n ? ` <span class="mono">${n}</span>` : ''}</button>`;
  }).join('')}</div>`;
  const img = m.image ? `<div><a href="${esc(m.image)}" target="_blank" rel="noopener">photo</a></div>` : '';
  return `<div class="roomrow ${mine ? 'out' : ''}"><span class="ini" title="${esc(personName(m.name))}">${esc(m.initials)}</span>`
    + `<div class="msg ${mine ? 'out' : 'in'}"><div class="who">${esc(m.first)} · ${esc(relTime(m.at))}</div>`
    + `<div class="say">${lit(esc(m.body))}</div>${img}${on}${reacts}</div></div>`;
}

// the @names light up in the bubble (Kevin, 16 Sep: "it doesn't really say who it's to, who's tagged")
const lit = (s) => s.replace(/@([A-Z][A-Za-z]+(?: [A-Z][a-z]+)?|[a-z]+)/g, (m0) => '<span class="at">' + m0 + '</span>');

// ── mounting: one live room per view, polled while it is on the screen ───────
const mounts = new Map();     // room -> ctx
let timer = null;

export function stopRoomPoll() {
  if (timer) clearInterval(timer);
  timer = null;
  mounts.clear();
}

function arm() {
  if (timer) return;
  timer = setInterval(() => {
    for (const [room, ctx] of [...mounts]) {
      if (!ctx.root || !ctx.root.isConnected) { mounts.delete(room); continue; }
      load(ctx.root, room, ctx, false, true).catch(() => {});
    }
    if (!mounts.size) stopRoomPoll();
  }, 20000);
}

export function renderRoom(root, room, opts = {}) {
  if (!root) return;
  const meta = ROOMS[room] || ROOMS.village;
  const ctx = { root, pick: opts.customer || null, newestId: null, count: -1, findTimer: null };
  mounts.set(room, ctx);

  root.innerHTML = html`
    <div class="card room" data-room="${room}">
      <div class="head" style="margin-bottom:2px">
        <div class="kicker">${opts.kicker || meta.kicker}</div>
        <span class="small">${opts.note || meta.note}${isDemo() ? ' · demo' : ''}</span>
      </div>
      <div class="room-list" data-list><div class="empty">Reading the room…</div></div>
      ${room === 'sales' ? '' : raw(`<div class="room-on-row">
        <span class="kicker">On</span>
        <input data-find placeholder="on a customer… name or number"/>
        <div class="room-pick" data-pick hidden></div>
        <div class="room-pop" data-pop hidden></div>
      </div>`)}
      <div class="composer" style="position:relative">
        <textarea data-say placeholder="${meta.say}"></textarea>
        <button class="btn fill" data-post>Post</button>
        <div class="line-find-pop at-pop" data-at-pop hidden></div>
      </div>
      ${room === 'sales' ? '' : raw('<div class="lanes at-lanes" data-lanes hidden><button class="lanebtn on" data-room-lane="inside">Inside</button><button class="lanebtn" data-room-lane="text">Text the customer</button><span class="small" data-lane-law></span></div>')}
      <div class="small">${meta.foot} ${room === 'sales' ? '' : 'Type <b>@</b> for a person or a customer — a name, a street, or a phone number. Hang it on a customer and it lands on their file too. '}Enter posts · Shift+Enter for a new line · 🎤 talks into the box.</div>
    </div>`;

  const say = root.querySelector('[data-say]');
  root.querySelector('[data-post]').onclick = () => post(root, room, ctx);
  enterPosts(say, () => post(root, room, ctx), () => { const p = root.querySelector('[data-at-pop]'); return !!(p && !p.hidden); });
  { const m = micButton(say); const pb = root.querySelector('[data-post]'); if (m && pb) pb.parentElement.insertBefore(m, pb); }
  wireFind(root, ctx);
  if (room !== 'sales') wireAt(root, ctx);
  paintPick(root, ctx);
  load(root, room, ctx, true).catch(() => {});
  arm();
}

async function load(root, room, ctx, toBottom = false, quiet = false) {
  const list = root.querySelector('[data-list]');
  if (!list) return;
  let rows;
  try { rows = await read(room); }
  catch (e) {
    if (!quiet) toast(e.message || 'The room would not load', 'err');
    if (ctx.newestId == null) list.innerHTML = '<div class="empty">The room would not load. Refresh to try again.</div>';
    return;
  }
  const newest = rows.length ? rows[rows.length - 1].id : '';
  if (quiet && newest === ctx.newestId && rows.length === ctx.count) return;   // nothing new — leave the scroll alone
  ctx.newestId = newest; ctx.count = rows.length;
  const stick = toBottom || (list.scrollHeight - list.scrollTop - list.clientHeight < 60);
  list.innerHTML = rows.length
    ? rows.map((m) => bubble(m, room)).join('')
    : '<div class="empty">Nothing here yet. Say the first thing.</div>';
  list.querySelectorAll('[data-react]').forEach((b) => (b.onclick = () => react(root, room, ctx, b.dataset.react, b.dataset.emoji)));
  if (stick) list.scrollTop = list.scrollHeight;
}

async function post(root, room, ctx) {
  const say = root.querySelector('[data-say]');
  const body = (say?.value || '').trim();
  if (!body) return;
  if (isDemo()) {
    // the demo posts IN MEMORY — the room reads it back, nothing leaves the browser. Same for the customer lane, marked as a text.
    const asText = room !== 'sales' && ctx.lane === 'text' && ctx.pick;
    demoPost(room, { name: state.me?.name || 'You', initials: state.me?.initials, body: asText ? '→ text to ' + firstName(ctx.pick.name) + ': ' + body : body, customerId: ctx.pick?.id, customerName: ctx.pick?.name });
    toast(asText ? `Demo — would go to ${firstName(ctx.pick.name)} from the brand line · nothing is saved` : 'Demo — posted here only, nothing is saved');
    say.value = ''; ctx.pick = null; ctx.lane = 'inside'; paintPick(root, ctx);
    await load(root, room, ctx, true);
    return;
  }
  const btn = root.querySelector('[data-post]');
  btn.disabled = true;
  try {
    if (room !== 'sales' && ctx.lane === 'text' && ctx.pick) {
      // the customer lane: a text from the brand's approved line (311). It is already on the file's thread — the room does not get a copy.
      await textCustomer(ctx.pick.id, body);
      toast(`Queued to ${firstName(ctx.pick.name) || 'them'} from the brand line · six seconds to take it back`);
      const cid = ctx.pick.id;
      say.value = ''; ctx.pick = null; ctx.lane = 'inside'; paintPick(root, ctx);
      window.__peek(cid);
      return;
    }
    if (room === 'sales') await api.insert('hype_messages', { body }, false);
    else await api.insert('team_messages', { room, body, customer_id: ctx.pick?.id ?? null }, false);
    /* Kevin, 15 Sep: "keep it with inside the customer file." A post hung on a customer is ALSO a note on that
       file's thread — same words, with the @First mentions intact, so 312 pushes the people named and puts the
       file in their You're up. Best effort: a customer with no job yet still gets the room post. */
    if (room !== 'sales' && ctx.pick?.id) {
      try {
        const f = await loadFile(ctx.pick.id);
        let tid = f.thread?.id;
        if (!tid && f.job?.job_id) tid = await threadForJob(f.job.job_id);
        if (tid) await postMessage(tid, ['manager'].includes(state.me?.role) ? 'SUPER' : 'OFFICE', body);
        else toast('Posted to the room · this customer has no job yet, so nothing landed on a file');
      } catch (e) { toast('Posted to the room · the file did not take it: ' + (e.message || ''), 'err'); }
    }
    say.value = '';
    ctx.pick = null; ctx.lane = 'inside'; paintPick(root, ctx);
    await load(root, room, ctx, true);
  } catch (e) { toast(e.message || 'The post did not go through', 'err'); }
  finally { btn.disabled = false; }
}

/* One reaction per seat per emoji: the insert IS the toggle — the primary key
   refuses the second one (409), so that refusal means "take mine back". */
async function react(root, room, ctx, id, emoji) {
  if (isDemo()) { toast('Demo — nothing is saved'); return; }
  try {
    try { await api.insert('team_reactions', { message_id: id, emoji }, false); }
    catch (e) {
      if (e?.status === 409) await api.del(`team_reactions?message_id=eq.${encodeURIComponent(id)}&emoji=eq.${encodeURIComponent(emoji)}`);
      else throw e;
    }
    await load(root, room, ctx, false);
  } catch (e) { toast(e.message || 'That one did not stick', 'err'); }
}

// ── "on a customer…" — the same search the nav uses, in the composer ─────────
/* One listener for the module, not one per render: production re-paints on
   every filter click and a listener per paint would pile up all afternoon. */
let popsWired = false;
function wirePops() {
  if (popsWired) return;
  popsWired = true;
  document.addEventListener('click', (e) => {
    document.querySelectorAll('.room .room-pop:not([hidden])').forEach((p) => {
      if (p.contains(e.target) || p.parentElement?.querySelector('[data-find]') === e.target) return;
      p.hidden = true; p.innerHTML = '';
    });
  });
}

function wireFind(root, ctx) {
  const find = root.querySelector('[data-find]');
  const pop = root.querySelector('[data-pop]');
  if (!find || !pop) return;
  const close = () => { pop.hidden = true; pop.innerHTML = ''; };
  find.addEventListener('input', () => {
    clearTimeout(ctx.findTimer);
    ctx.findTimer = setTimeout(async () => {
      const q = find.value.trim();
      if (q.length < 2) { close(); return; }
      let rows = [];
      try { rows = await searchCustomers(q); } catch (e) { toast(e.message, 'err'); return; }
      pop.innerHTML = rows.length
        ? rows.map((c) => `<button class="inv" style="grid-template-columns:1fr auto;text-align:left" data-id="${esc(c.id)}" data-name="${esc(personName(c.name))}"><span><b>${esc(personName(c.name))}</b></span><span class="mono dimmer">${esc(c.phone || '')}</span></button>`).join('')
        : '<div class="empty">Nobody by that name or number</div>';
      pop.hidden = false;
      pop.querySelectorAll('button[data-id]').forEach((b) => (b.onclick = () => {
        ctx.pick = { id: b.dataset.id, name: b.dataset.name };
        find.value = ''; close(); paintPick(root, ctx);
        root.querySelector('[data-say]')?.focus();
      }));
    }, 220);
  });
  find.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); find.blur(); } });
  wirePops();
}

function paintPick(root, ctx) {
  const lanes = root.querySelector('[data-lanes]');
  if (lanes) {
    lanes.hidden = !ctx.pick;
    lanes.querySelectorAll('[data-room-lane]').forEach((b) => { b.classList.toggle('on', (ctx.lane || 'inside') === b.dataset.roomLane); b.onclick = () => { ctx.lane = b.dataset.roomLane; paintPick(root, ctx); }; });
    const law = lanes.querySelector('[data-lane-law]');
    if (law) law.textContent = (ctx.lane || 'inside') === 'text'
      ? `Goes to ${firstName(ctx.pick?.name || '') || 'them'} as a text from the brand's approved line — a draft until Post.`
      : `A note on ${personName(ctx.pick?.name || '')}'s file and this room. The customer never sees it.`;
  }
  const pick = root.querySelector('[data-pick]');
  if (!pick) return;
  pick.hidden = !ctx.pick;
  pick.innerHTML = ctx.pick
    ? `<span class="chip cust">on ${esc(personName(ctx.pick.name))}</span><button class="btn sm" data-unpick title="Post it to the room only">Clear</button>`
    : '';
  const un = pick.querySelector('[data-unpick]');
  if (un) un.onclick = () => { ctx.pick = null; paintPick(root, ctx); };
}


/* ── @ — a person or a customer, inline (Kevin, 15 Sep: "Jess can say, hey,
   @Kevin call this customer, @address, @last name, @phone number").
   Type @ and two letters: people come from the seats (every active rep),
   customers from the same search the top box uses — name, street or phone.
   Picking a person leaves "@First " in the text so 312 pushes them when the
   note lands on a file. Picking a customer hangs the post on their file and
   leaves their name in the text so the room can read who it is about. */
function wireAt(root, ctx) {
  wireAtOn(root.querySelector('[data-say]'), root.querySelector('[data-at-pop]'), (c) => { ctx.pick = c; paintPick(root, ctx); });
}
/* The same picker on any box: SAY IT on The Line uses it too (Kevin, 15 Sep: "how do I add more people?"). */
export function wireAtOn(say, pop, onCustomer) {
  if (!say || !pop) return;
  let timer = null, frag = null;
  const close = () => { pop.hidden = true; pop.innerHTML = ''; frag = null; };
  const fragAtCaret = () => {
    const upto = say.value.slice(0, say.selectionStart);
    const m = /(^|\s)@([^\s@]{2,})$/.exec(upto);
    return m ? { text: m[2], start: upto.length - m[2].length - 1 } : null;
  };
  const replaceFrag = (f, withText) => {
    const before = say.value.slice(0, f.start), after = say.value.slice(say.selectionStart);
    say.value = before + withText + ' ' + after;
    const at = (before + withText + ' ').length;
    say.focus(); say.setSelectionRange(at, at);
  };
  say.addEventListener('input', () => {
    clearTimeout(timer);
    const f = fragAtCaret();
    if (!f) { close(); return; }
    timer = setTimeout(async () => {
      frag = f;
      const all = searchPeople(f.text), lower = f.text.toLowerCase();
      // "@whit" is Whitfield, not Samantha White: a first-name prefix wins, then customers, then last-name matches
      const people = all.filter((p) => firstName(p.name).toLowerCase().startsWith(lower));
      const others = all.filter((p) => !people.includes(p));
      let custs = [];
      try { custs = await searchCustomers(f.text); } catch { custs = []; }
      if (!people.length && !custs.length && !others.length) { close(); return; }
      const personRow = (p) => `<button class="line-item" data-at-person="${esc(mentionHandle(p).slice(1))}"><span class="line-av blue">${esc((p.initials || firstName(p.name) || '?').slice(0, 2).toUpperCase())}</span><span><span class="nm">${esc(mentionHandle(p))}</span><span class="pv">${esc(p.name)}${p.role ? ' · ' + esc(p.role) : ''}</span></span></button>`;
      pop.innerHTML = (people.length ? '<div class="kicker" style="padding:6px 10px 2px">People</div>' + people.map(personRow).join('') : '')
        + (custs.length ? '<div class="kicker" style="padding:6px 10px 2px">Customers</div>' + custs.slice(0, 6).map((c) => `<button class="line-item" data-at-cust="${esc(c.id)}" data-name="${esc(c.name)}"><span class="line-av">${esc((firstName(c.name) || '?').slice(0, 2).toUpperCase())}</span><span><span class="nm">${esc(personName(c.name))}</span><span class="pv">${esc(c.street || c.phone || '')}${c.city ? ' · ' + esc(c.city) : ''}</span></span></button>`).join('') : '')
        + (others.length ? '<div class="kicker" style="padding:6px 10px 2px">Also</div>' + others.map(personRow).join('') : '');
      pop.hidden = false;
      /* the old tail below is replaced */
      pop.querySelectorAll('[data-at-person]').forEach((b) => (b.onclick = () => { replaceFrag(frag, '@' + b.dataset.atPerson); close(); }));
      pop.querySelectorAll('[data-at-cust]').forEach((b) => (b.onclick = () => {
        replaceFrag(frag, personName(b.dataset.name)); close();
        onCustomer({ id: b.dataset.atCust, name: b.dataset.name });
      }));
    }, 180);
  });
  say.addEventListener('keydown', (e) => {
    if (pop.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Enter' && !(e.metaKey || e.ctrlKey)) { const first = pop.querySelector('[data-at-person],[data-at-cust]'); if (first) { e.preventDefault(); first.click(); } }
    if (e.key === 'Tab') { const first = pop.querySelector('[data-at-person],[data-at-cust]'); if (first) { e.preventDefault(); first.click(); } }
  });
}


/* Demo only: a post that lives in memory, shaped like a v_team_room row, so the
   demo room behaves like the real one without a database. `window.__demoPost`
   lets a walkthrough stage other people's replies arriving on the thread. */
function demoPost(room, m) {
  const rooms = (DEMO.rooms ||= {});
  const list = (rooms[room] ||= []);
  list.push({ id: 'd' + Date.now() + Math.random().toString(16).slice(2, 6), author_name: m.name, author_initials: m.initials || null, author_id: m.authorId ?? null,
    body: m.body, customer_id: m.customerId ?? null, customer_name: m.customerName ?? null, created_at: new Date().toISOString(), reactions: m.reactions || {} });
  return list[list.length - 1];
}
if (isDemo()) window.__demoPost = (room, m) => { demoPost(room, m); const ctx = mounts.get(room); if (ctx?.root) load(ctx.root, room, ctx, true).catch(() => {}); };
