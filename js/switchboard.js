// The Line — the switchboard. Kevin, 15 Sep 2026: "let's start with the
// playground and then build the school around it… zero reason that anything
// goes unresponsive, unresponded to."
//
// This room adds NO table and NO migration. Every row on it is already loaded
// by book.js for the other rooms; the only new thing is putting them on one
// list and sorting by WHO HAS WAITED LONGEST instead of by who typed last.
//
//   who is waiting   → v_customer_text_clock  (state.clock)
//   tagged you       → v_my_mentions          (state.mentions)
//   asks on you      → v_office_queue         (state.queue)
//   the rooms        → v_team_room            (village.js, mounted as-is)
//
// The escalation ladder is a READ, not a job: a question's tier is a function
// of how long it has sat, so nothing has to run for the board to be right.
import { state, isDemo, personName, firstName, seatName } from './book.js?v=46';
import { html, raw, esc } from './ui.js?v=46';
import { brandName, askLabel, stageLabel, STAGES } from './config.js?v=46';
import { renderRoom } from './village.js?v=46';

/* The three stops. Minutes, business-naive on purpose for v1 — an overnight
   text reads as "everyone" by morning, which is the honest answer. */
const WITH_PERSON = 60, WITH_ROOM = 240;
const tier = (min) => (min >= WITH_ROOM ? 'all' : min >= WITH_PERSON ? 'room' : 'person');
const TIER_WORD = { person: 'with the person', room: 'the room can see it', all: 'everyone can see it' };
const TIER_CLS = { person: '', room: 'clock', all: 'red' };

const mins = (m) => m == null ? '' : m >= 1440 ? (m / 1440).toFixed(1) + ' d' : m >= 60 ? (m / 60).toFixed(1) + ' h' : Math.round(m) + ' min';
const med = (a) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); const h = s.length >> 1; return s.length % 2 ? s[h] : Math.round((s[h - 1] + s[h]) / 2); };
const said = (c) => String(c.last_inbound_body ?? c.body ?? '').trim();

/* What they are actually asking. Kevin, 15 Sep: "it's going to be the most
   asked question" — the bottleneck names itself. These buckets read the words
   the customer used; anything unmatched stays "something else" rather than
   being forced into a bucket, because a wrong bucket is worse than none. */
const BUCKETS = [
  ['When do we start', /\b(when|what day|what date|how soon)\b.*\b(start|begin|come|get here|out here)\b|\bstart date\b|\bschedul/i],
  ['Where is the permit', /\bpermit|\bhoa\b|\binspect/i],
  ['Paying the balance', /\bpay\b|\bpayment|\binvoice|\bbalance|\bbill\b|\bdeposit/i],
  ['Where is the crew', /\bcrew\b|\bguys\b|\bshow(ed)? up\b|\bhere yet\b|\barriv|\bon site\b/i],
  ['What does it cost', /\bprice|\bquote|\bestimate|\bcost\b|\bhow much\b|\bfinanc/i],
  ['Changing something', /\bchange|\bmove\b|\breschedul|\binstead\b|\badd\b|\bcancel/i],
];
const bucketOf = (text) => (BUCKETS.find(([, re]) => re.test(text)) || [null])[0];

let pane = 'up';          // 'up' · 'wait' · 'room:office' …

export function renderSwitchboard(root) {
  const me = state.me || {};
  const C = (state.clock || []).slice().sort((a, b) => (b.waiting_min || 0) - (a.waiting_min || 0));
  const waiting = C.filter((c) => (c.waiting_min || 0) >= 15);
  const tagged = (state.mentions || []).filter((m) => !m.seen_at);
  const mine = (state.queue || []).filter((q) => q.assignee_id === me.id);
  const upN = tagged.length + mine.length + waiting.filter((c) => c.rep_id === me.id || c.owner_id === me.id).length;

  root.innerHTML = html`
    <div class="head">
      <div><div class="kicker">The Line · everything with a human waiting on the other end</div>
        <h1 class="serif">Nobody has to hunt, and nothing gets to sit.</h1></div>
      <div class="right">${isDemo() ? raw('<span class="chip demo">DEMO · FICTIONAL BOOK</span>') : raw('<span class="chip">LIVE · DB</span>')}</div>
    </div>
    ${raw(stuckCard(C, waiting))}
    <div class="line-wrap">
      <div class="line-rail" id="line-rail">${raw(railHTML(upN, waiting, tagged, mine, C))}</div>
      <div class="line-pane" id="line-pane"></div>
    </div>`;

  root.querySelectorAll('[data-pane]').forEach((b) => (b.onclick = () => { pane = b.dataset.pane; renderSwitchboard(root); }));
  paintPane(root, { waiting, tagged, mine, C });
}

/* ── where it's stuck ──────────────────────────────────────────────────────
   Open asks, grouped by what they are waiting for. The bar is the COUNT and
   the number beside it is the OLDEST — a lane with three asks and one of them
   nine days old is a different problem from nine fresh ones, and one bar
   cannot say both, so both are printed. */
function stuckCard(C, waiting) {
  const Q = state.queue || [];
  const byType = {};
  for (const q of Q) (byType[q.ask_type] ||= []).push(q.open_min || 0);
  const rows = Object.entries(byType)
    .map(([t, ages]) => ({ t, n: ages.length, oldest: Math.max(...ages), med: med(ages) }))
    .sort((a, b) => b.oldest - a.oldest).slice(0, 8);
  const max = Math.max(1, ...rows.map((r) => r.n));

  /* the most-asked question, from the words customers actually used */
  const asks = {};
  for (const c of waiting) { const b = bucketOf(said(c)); if (b) asks[b] = (asks[b] || 0) + 1; }
  const unmatched = waiting.filter((c) => !bucketOf(said(c))).length;
  const topAsks = Object.entries(asks).sort((a, b) => b[1] - a[1]);

  return html`
    <div class="two" style="align-items:start;margin-bottom:18px">
      <div class="card">
        <div class="head" style="margin-bottom:8px">
          <div class="kicker">Where it is stuck · every open ask, by what it waits on</div>
          <span class="small">${Q.length} open</span>
        </div>
        ${rows.length ? raw(rows.map((r) => `
          <div class="line-bar">
            <span class="bl">${esc(askLabel({ ask_type: r.t }))}</span>
            <span class="tr"><i style="width:${Math.round(r.n / max * 100)}%"></i></span>
            <span class="mono bn">${r.n}</span>
            <span class="mono bo ${r.oldest > 4320 ? 'red' : r.oldest > 1440 ? 'clock' : 'dimmer'}">${esc(mins(r.oldest))}</span>
          </div>`).join('')) : raw('<div class="empty">No asks open. That is the whole board empty.</div>')}
        <div class="small" style="margin-top:8px">Bar is how many. The number on the right is the <b>oldest one in that lane</b> — that is the one that is actually stuck.</div>
      </div>
      <div class="card">
        <div class="head" style="margin-bottom:8px">
          <div class="kicker">What they are asking · the customers waiting right now</div>
          <span class="small">${waiting.length} waiting</span>
        </div>
        ${topAsks.length ? raw(topAsks.map(([b, n]) => `
          <div class="inv" style="grid-template-columns:1fr auto;margin-bottom:6px"><span>${esc(b)}?</span><span class="mono">${n}</span></div>`).join('')) : raw('<div class="empty">Nobody is waiting on an answer.</div>')}
        ${unmatched ? raw(`<div class="small" style="margin-top:6px">${unmatched} more did not match a known question — those are the ones worth reading.</div>`) : ''}
        <div class="small" style="margin-top:8px">The most-asked question is the bottleneck naming itself. Anything at the top of this list for a week is something the machine should be answering.</div>
      </div>
    </div>`;
}

/* ── the rail ───────────────────────────────────────────────────────────── */
function railHTML(upN, waiting, tagged, mine, C) {
  const rooms = [['office', 'The Office room'], ['production', 'The Production room'], ['village', 'The Village'], ['sales', 'Sales hype']];
  const recent = C.slice().sort((a, b) => new Date(b.occurred_at || 0) - new Date(a.occurred_at || 0)).slice(0, 8);
  const grp = (label, note, body) => `<div class="line-grp"><div class="kicker"><span>${esc(label)}</span><span>${esc(note)}</span></div>${body}</div>`;
  const item = (on, av, ini, nm, pv, badge, cls) =>
    `<button class="line-item ${on ? 'on' : ''}" data-pane="${esc(av)}"><span class="line-av ${cls || ''}">${esc(ini)}</span>`
    + `<span><span class="nm">${esc(nm)}</span><span class="pv">${esc(pv)}</span></span>`
    + (badge ? `<span class="line-badge">${esc(badge)}</span>` : '') + '</button>';

  return grp('You\'re up', upN ? upN + ' waiting' : 'clear',
      item(pane === 'up', 'up', '!', 'Everything waiting on you', tagged.length ? firstName(tagged[0].author_name || '') + ' tagged you' : (mine.length ? mine.length + ' asks on you' : 'nothing owed'), upN || '', 'gold'))
    + grp('Nothing goes unanswered', 'everyone sees',
      item(pane === 'wait', 'wait', '∅', 'Customers with no answer', waiting.length ? 'oldest ' + mins(waiting[0].waiting_min) : 'everybody answered', waiting.length || '', waiting.some((c) => tier(c.waiting_min) === 'all') ? 'red' : ''))
    + grp('Rooms', 'anybody helps',
      rooms.map(([k, label]) => item(pane === 'room:' + k, 'room:' + k, k.slice(0, 2).toUpperCase(), label, k === 'sales' ? 'the reps’ own thread' : 'staff only', '', k === 'office' ? 'blue' : k === 'production' ? 'orange' : k === 'sales' ? 'green' : 'gold')).join(''))
    + grp('Lately', 'last to speak',
      recent.length ? recent.map((c) => `<button class="line-item" onclick="__peek('${esc(c.customer_id)}')">`
        + `<span class="line-av">${esc((firstName(c.customer_name) || '?').slice(0, 2).toUpperCase())}</span>`
        + `<span><span class="nm">${esc(personName(c.customer_name))}</span><span class="pv">${esc(said(c).slice(0, 44) || stageLabel(c.stage))}</span></span></button>`).join('')
        : '<div class="small" style="padding:0 10px 8px">Nothing on the line today.</div>');
}

/* ── the pane ───────────────────────────────────────────────────────────── */
function paintPane(root, d) {
  const el = root.querySelector('#line-pane');
  if (!el) return;
  if (pane.startsWith('room:')) { renderRoom(el, pane.slice(5)); return; }
  if (pane === 'wait') { el.innerHTML = waitHTML(d.waiting); return; }
  el.innerHTML = upHTML(d);
}

const custRow = (c, extra) => html`
  <button class="inv line-row" onclick="__peek('${c.customer_id}')">
    <span class="line-av">${(firstName(c.customer_name) || '?').slice(0, 2).toUpperCase()}</span>
    <span><b>${personName(c.customer_name)}</b><span class="pv">${said(c) ? '“' + said(c).slice(0, 80) + '”' : stageLabel(c.stage)}</span></span>
    ${raw(extra)}
  </button>`;

function waitHTML(waiting) {
  if (!waiting.length) return '<div class="card"><div class="empty">Nobody is waiting on an answer. That is the board doing its job.</div></div>';
  const g = { all: [], room: [], person: [] };
  for (const c of waiting) g[tier(c.waiting_min)].push(c);
  const sec = (k, title, note) => g[k].length ? `<div class="kicker" style="margin:14px 0 6px">${esc(title)} <span class="dimmer">· ${esc(note)}</span></div>`
    + g[k].map((c) => custRow(c, `<span class="mono ${TIER_CLS[k]}">${esc(mins(c.waiting_min))}</span>`)).join('') : '';
  return html`<div class="card">
    <div class="head" style="margin-bottom:2px"><div class="kicker">Nothing goes unanswered · oldest first</div>
      <span class="small">${waiting.length} waiting · median ${mins(med(waiting.map((c) => c.waiting_min || 0)))}</span></div>
    ${raw(sec('all', 'Past four hours — everyone can see these', 'answer it or hand it to a name with a reason'))}
    ${raw(sec('room', 'Past an hour — the room can see it', 'anybody may take it'))}
    ${raw(sec('person', 'Still with the person it is for', 'no action needed yet'))}
    <div class="small" style="margin-top:12px">A question leaves this board when somebody answers it. Nothing ages off. Tap anyone to open their file and answer from there.</div>
  </div>`;
}

function upHTML({ tagged, mine, waiting }) {
  const me = state.me || {};
  const minez = waiting.filter((c) => c.rep_id === me.id || c.owner_id === me.id);
  const none = !tagged.length && !mine.length && !minez.length;
  return html`<div class="card">
    <div class="head" style="margin-bottom:2px"><div class="kicker">You're up · ${firstName(me.name || 'you')}, in order of who has waited longest</div></div>
    ${none ? raw('<div class="empty">Nothing is waiting on you. Look at <b>Nothing goes unanswered</b> — somebody else may be buried.</div>') : ''}
    ${tagged.length ? raw('<div class="kicker" style="margin:14px 0 6px">Tagged you</div>' + tagged.map((m) => `
      <button class="inv line-row" ${m.customer_id ? `onclick="__peek('${esc(m.customer_id)}')"` : 'disabled title="No customer on this tag"'}>
        <span class="line-av blue">${esc((firstName(m.author_name) || '?').slice(0, 2).toUpperCase())}</span>
        <span><b>${esc(personName(m.customer_name || 'A file'))}</b><span class="pv">${esc(firstName(m.author_name))}: ${esc(String(m.body || '').slice(0, 80))}</span></span>
        <span class="mono dimmer">${esc(m.created_at ? mins((Date.now() - new Date(m.created_at)) / 60000) : '')}</span>
      </button>`).join('')) : ''}
    ${minez.length ? raw('<div class="kicker" style="margin:14px 0 6px">Your customers, waiting on an answer</div>'
      + minez.map((c) => custRow(c, `<span class="mono ${TIER_CLS[tier(c.waiting_min)]}">${esc(mins(c.waiting_min))}</span>`)).join('')) : ''}
    ${mine.length ? raw('<div class="kicker" style="margin:14px 0 6px">Asks on you</div>' + mine.slice().sort((a, b) => b.open_min - a.open_min).map((q) => `
      <button class="inv line-row" onclick="__peek('${esc(q.customer_id)}')">
        <span class="line-av orange">${esc(String(askLabel({ ask_type: q.ask_type })).slice(0, 2).toUpperCase())}</span>
        <span><b>${esc(personName(q.customer_name))}</b><span class="pv">${esc(askLabel(q))} · ${esc(brandName(q.cc_company_id))}</span></span>
        <span class="mono ${q.open_min > 4320 ? 'red' : q.open_min > 1440 ? 'clock' : 'dimmer'}">${esc(mins(q.open_min))}</span>
      </button>`).join('')) : ''}
  </div>`;
}
