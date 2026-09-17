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
import { state, isDemo, personName, firstName, seatName, directThread, sendDirect, directSeen, searchPeople, searchCustomers, loadFile, threadForJob, postMessage, textCustomer, cancelText, linePreview, mentionHandle, threadReceipts, receiptWords, offerNextWord, NEXT_WORD_FOR_QUESTION } from './book.js?v=107';
import { toast, openModal } from './ui.js?v=107';
import { enterPosts, micButton } from './dictate.js?v=107';
import { quotesQueueCard, wireQuotes } from './quotes.js?v=107';
import { crewsCard, wireCrews } from './crews.js?v=107';
import { sentCard, wireSent } from './sent.js?v=107';
import { html, raw, esc } from './ui.js?v=107';
import { brandName, askLabel, stageLabel, STAGES } from './config.js?v=107';
import { renderRoom, wireAtOn } from './village.js?v=107';
import * as api from './api.js?v=107';

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

/* THE ANSWER ON THE FILE (350). Kevin, 15 Sep night: "this is a living,
   thinking, breathing file… if we have the answer, are we able to give the
   answer to the person being asked? I don't want it to do the work." So: for
   a customer whose question is one the file can answer — the permit, the
   start, the balance — a card with what the file knows and the reply in the
   office's own words, filled in. The seat reads it, changes a word, taps
   Send. Nothing sends by itself. No fact → the card says so, honestly. */
const ANSWER_KIND = { 'Where is the permit': 'permit', 'When do we start': 'start', 'Paying the balance': 'balance' };
const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString();
const shortDate = (s) => s ? new Date(String(s).length <= 10 ? s + 'T12:00:00' : s).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
function factLine(kind, F) {
  if (kind === 'permit') {
    const p = F.permit;
    if (!p) return { has: false, text: 'The file has no permit step yet — nobody has applied, or the job is not signed.' };
    if (p.state === 'DONE') return { has: true, text: /none required/i.test(p.number || '') ? 'No permit is needed at this address.' : `Permit APPROVED · ${p.number || 'number on the file'} · ${shortDate(p.closed_at)}` };
    return { has: true, text: `With the county since ${shortDate(p.opened_at)} · day ${Math.round(p.days)}${p.usual_days ? ` of about ${Math.round(p.usual_days)}` : ''}${p.assignee ? ` · ${firstName(p.assignee)} holds it` : ''}${p.usual_days && p.days > p.usual_days ? ' · PAST ITS USUAL PACE' : ''}` };
  }
  if (kind === 'start') {
    const s = F.schedule;
    if (!s) return { has: false, text: 'The file has no schedule step yet.' };
    if (s.state === 'DONE' && s.date) return { has: true, text: `On the schedule for ${shortDate(s.date)}${s.crew ? ` · crew ${s.crew}` : ''}` };
    return { has: true, text: `Not on the calendar yet · waiting on ${s.waiting_on ? firstName(s.waiting_on) : 'the scheduler'}${F.permit && F.permit.state !== 'DONE' ? ' · the permit is still open' : ''}` };
  }
  if (kind === 'balance') {
    const b = F.balance || {};
    if (Number(b.balance) > 0) return { has: true, text: `${money(b.balance)} open on ${b.invoices} invoice${b.invoices === 1 ? '' : 's'}${b.due ? ` · due ${shortDate(b.due)}` : ''} (QuickBooks)` };
    if (b.invoice_state && b.invoice_state !== 'DONE') return { has: true, text: 'No invoice out yet — the invoice step is still open' };
    return { has: false, text: 'No open balance on the file.' };
  }
  return { has: false, text: '' };
}
async function openAnswer(c, kind) {
  let R;
  try {
    R = isDemo()
      ? { facts: { permit: { state: 'OPEN', opened_at: new Date(Date.now() - 6 * 864e5).toISOString(), days: 6, usual_days: 5, assignee: 'Samantha White' }, schedule: { state: 'OPEN', waiting_on: 'Jonathan Garcia' }, balance: { balance: 0, invoices: 0 } },
          answers: { permit: `Hi ${firstName(personName(c.customer_name))}, ${firstName(state.me.name)} at ${brandName(c.cc_company_id)}. Your permit is in with the county — we applied ${shortDate(new Date(Date.now() - 6 * 864e5).toISOString())} and they usually take about 5 days, so I'm calling them today to check on it. I'll text you the minute it clears.`, start: `Hi ${firstName(personName(c.customer_name))}, ${firstName(state.me.name)} at ${brandName(c.cc_company_id)}. You're not on the calendar yet — we're waiting on the permit first, then Jonathan sets the day and texts it to you here. Should be soon.` } }
      : await api.rpc('answer_facts', { p_customer: c.customer_id });
  } catch (e) { toast(e.message || 'Could not read the file', 'err'); return; }
  const F = (R && R.facts) || {};
  const fact = factLine(kind, F);
  const draft = (R && R.answers && R.answers[kind]) || '';
  const needsLink = /{{link}}/.test(draft);
  const title = { permit: 'Where is the permit?', start: 'When do we start?', balance: 'Paying the balance?' }[kind];
  openModal({
    title,
    submitLabel: fact.has && draft ? 'Send it from the brand line' : 'Close',
    body: `
      <div class="kicker">${esc(personName(c.customer_name))} asked · ${esc(mins(c.waiting_min))} ago</div>
      <div class="inv" style="grid-template-columns:1fr;margin:6px 0 10px">“${esc(said(c).slice(0, 240))}”</div>
      <div class="kicker">What the file says</div>
      <div style="font-size:15px;margin:4px 0 12px" class="${fact.has ? '' : 'clock'}">${esc(fact.text)}</div>
      ${fact.has && draft ? `<div class="kicker">The answer, in the office's words — change anything, then send</div>
      <textarea id="ans" rows="5" style="width:100%;margin-top:4px">${esc(draft.replace('{{link}}', needsLink ? '[pay link — Collect on the file makes one]' : ''))}</textarea>
      ${needsLink ? '<div class="small" style="margin-top:6px">There is no pay link on the file yet. Open the file, press Collect, and the link goes in the text.</div>' : ''}
      <div class="small" style="margin-top:6px">Goes out as a text on the brand's line, from you, with six seconds to undo. The customer never sees the file.</div>`
      : `<div class="small">The file cannot answer this one yet. Open the file to see where it stands.</div>`}`,
    onSubmit: async (form) => {
      const ta = form.querySelector('#ans');
      if (!ta) return;
      const body = ta.value.trim();
      if (!body) throw new Error('Nothing to send.');
      if (/\[pay link/.test(body)) throw new Error('Take the pay-link placeholder out, or add the real link from the file.');
      const r = await textCustomer(c.customer_id, body);
      const root = document.getElementById('toast-root');
      root.innerHTML = `<div class="toast">Sent from ${esc((r && r.from) || 'the main line')} · <button id="undo">Undo</button></div>`;
      let undone = false;
      document.getElementById('undo').onclick = async () => { undone = true; try { await cancelText(r.id); root.innerHTML = '<div class="toast">Not sent</div>'; setTimeout(() => (root.innerHTML = ''), 2000); } catch (e) { toast(e.message, 'err'); } };
      setTimeout(() => { if (!undone) root.innerHTML = ''; }, 6500);
    },
  });
}
function answerRows(waiting) {
  const rows = waiting.map((c) => ({ c, kind: ANSWER_KIND[bucketOf(said(c))], line: NEXT_WORD_FOR_QUESTION[bucketOf(said(c))] || null })).sort((a, b) => (b.kind ? 1 : 0) - (a.kind ? 1 : 0)).slice(0, 12);
  if (!rows.length) return '';
  return `<div class="kicker" style="margin-top:10px">The file can answer these · read it, fix a word, send</div>` + rows.map(({ c, kind, line }) => `
    <div class="inv" style="grid-template-columns:1fr auto auto;margin-top:6px"><span><b>${esc(personName(c.customer_name))}</b><div class="small">“${esc(said(c).slice(0, 80))}”</div></span><span class="mono dimmer">${esc(mins(c.waiting_min))}</span>${kind ? `<button class="btn sm fill" data-answer="${esc(c.customer_id)}" data-kind="${kind}">Answer</button>` : `<button class="btn sm ${line ? 'fill' : ''}" data-reply="${esc(c.customer_id)}" data-key="${esc(line || '')}" title="${line ? 'the line is ready in the box' : 'open the file and reply'}">Reply</button>`}</div>`).join('');
}
function wireAnswers(root, waiting) {
  root.querySelectorAll('[data-answer]').forEach((b) => (b.onclick = () => { const c = waiting.find((x) => x.customer_id === b.dataset.answer); if (c) openAnswer(c, b.dataset.kind); }));
  // THE NEXT WORD: Reply opens the file with the best-guess line already in the box
  root.querySelectorAll('[data-reply]').forEach((b) => (b.onclick = () => { if (b.dataset.key) offerNextWord({ customerId: b.dataset.reply, key: b.dataset.key, extra: {}, why: 'they asked' }); else window.__peek(b.dataset.reply); }));
}

let pane = 'up';          // 'up' · 'wait' · 'room:office' · 'dm:<rep id>'
let lastRoot = null;
/* THE LANE — Jess, 14 Sep, on the Uvoice ticket: "How can I only receive
   texts that I need (office lines)? I am still getting every text from
   sales." The Jetstream picture's who-sees-what table says the same thing in
   rules: Sam sees files at an office step plus any file she is tagged on;
   Luis sees files at scheduling or later plus his tags; a rep his own book.
   Open by default still stands — Everything is one tap away — but a seat
   LANDS on its own lane, so the rail is theirs before it is everybody's. */
let lane = null;          // 'all' · 'mine' — null = the seat's default
const OFFICE_STAGES = ['sold_office', 'invoiced', 'paid'];
const PROD_STAGES = ['sold_office', 'production', 'field_complete', 'invoiced'];
function laneDefault() { const r = state.me?.role; return (r === 'owner' || r === 'admin') ? 'all' : 'mine'; }
function laneWords() {
  const r = state.me?.role;
  if (r === 'office') return 'files at an office step, plus anything you are tagged on';
  if (r === 'manager') return 'files at scheduling or later, plus anything you are tagged on';
  if (r === 'sales') return 'your own book, plus anything you are tagged on';
  return 'files you hold, plus anything you are tagged on';
}
function laneSet() {
  const r = state.me?.role, me = state.me?.id, S = new Set();
  const stages = r === 'office' ? OFFICE_STAGES : r === 'manager' ? PROD_STAGES : null;
  for (const b of state.board || []) {
    if (stages && stages.includes(b.stage)) S.add(b.customer_id);
    if (b.rep_id === me || b.owner_id === me || b.supervisor_id === me) S.add(b.customer_id);
  }
  for (const q of state.queue || []) if (q.assignee_id === me || (r === 'office' && q.lane === 'OFFICE')) S.add(q.customer_id);
  for (const m of state.mentions || []) if (m.customer_id) S.add(m.customer_id);
  for (const c of state.clock || []) if (c.rep_id === me || c.owner_id === me) S.add(c.customer_id);
  return S;
}
let dmTimer = null;       // the open line polls; leaving the room stops it (app.js go())

export function stopLinePoll() { if (dmTimer) clearInterval(dmTimer); dmTimer = null; }

/* 346: open a direct line with one person, from anywhere (the top box, the rail, a push). */
export function openLine(personId) {
  pane = 'dm:' + personId;
  if (lastRoot && lastRoot.isConnected && !lastRoot.classList.contains('hidden')) { renderSwitchboard(lastRoot); showPane(lastRoot); }
  else { window.__go('line'); setTimeout(() => lastRoot && showPane(lastRoot), 300); }
}
// the pane you just opened scrolls into view when the rail sits under the Line (a laptop width)
function showPane(root) {
  const el = root.querySelector('#line-pane'); if (!el) return;
  const r = el.getBoundingClientRect();
  if (r.top < 60 || r.top > window.innerHeight - 240) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
}
// back to the top of The Line from a pane
window.__lineBack = () => { pane = 'up'; if (lastRoot) renderSwitchboard(lastRoot); window.scrollTo({ top: 0, behavior: 'smooth' }); };
window.__line = openLine;

export function renderSwitchboard(root) {
  lastRoot = root;
  stopLinePoll();
  const me = state.me || {};
  if (lane === null) lane = laneDefault();
  const inLane = lane === 'all' ? null : laneSet();
  const C = (state.clock || []).filter((c) => !inLane || inLane.has(c.customer_id)).sort((a, b) => (b.waiting_min || 0) - (a.waiting_min || 0));
  const waiting = C.filter((c) => (c.waiting_min || 0) >= 15);
  const tagged = (state.mentions || []).filter((m) => !m.seen_at);
  const mine = (state.queue || []).filter((q) => q.assignee_id === me.id);
  const upN = tagged.length + mine.length + waiting.filter((c) => c.rep_id === me.id || c.owner_id === me.id).length;

  /* A REP'S LINE (Kevin, 15 Sep: "I need a sales rep to be able to say, hey Jess, this customer called me, the crew
     didn't do this right, can you get with Obed… so easy a caveman can do it"): the box first, nothing above it, no
     dropdown, no boards. He types it like a text. The rail comes after. */
  const rep = me.role === 'sales';
  root.innerHTML = html`
    ${rep ? raw(`<div class="head rep-head"><div class="kicker">The Line · type it like a text</div>${isDemo() ? '<span class="chip demo">DEMO</span>' : ''}</div>`) : raw(`
    <div class="head">
      <div><div class="kicker">The Line · everything with a human waiting on the other end</div>
        <h1 class="serif">Nobody has to hunt, and nothing gets to sit.</h1></div>
      <div class="right"><button class="btn sm" id="tour-go" title="A one-minute walk through the screen">Show me around</button> ${isDemo() ? '<span class="chip demo">DEMO · FICTIONAL BOOK</span>' : '<span class="chip">LIVE · DB</span>'}</div>
    </div>`)}
    ${raw(sayItHTML())}
    ${raw(sentCard())}
    ${raw(quotesQueueCard())}
    ${raw(crewsCard())}
    ${rep ? '' : raw(stuckCard(C, waiting))}
    <div class="line-wrap">
      <div class="line-rail" id="line-rail">${raw(railHTML(upN, waiting, tagged, mine, C))}</div>
      <div class="line-pane" id="line-pane"></div>
    </div>`;

  root.querySelectorAll('[data-pane]').forEach((b) => (b.onclick = () => { pane = b.dataset.pane; renderSwitchboard(root); showPane(root); }));
  root.querySelectorAll('[data-lane]').forEach((b) => (b.onclick = () => { lane = b.dataset.lane; renderSwitchboard(root); }));
  wireQuotes(root);   // 353: the pricer sends the price from the card
  wireCrews(root);    // 356: my crews, the nugget
  wireSent(root);     // 358: what I sent out, the chain
  wireSayIt(root);
  wirePeopleFind(root);
  wireAnswers(root, waiting);
  const tg = root.querySelector('#tour-go'); if (tg) tg.onclick = () => window.__tour && window.__tour();
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
      <div class="card" data-tour="stuck">
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
      <div class="card" data-tour="asking">
        <div class="head" style="margin-bottom:8px">
          <div class="kicker">What they are asking · the customers waiting right now</div>
          <span class="small">${waiting.length} waiting</span>
        </div>
        ${topAsks.length ? raw(topAsks.map(([b, n]) => `
          <div class="inv" style="grid-template-columns:1fr auto;margin-bottom:6px"><span>${esc(b)}?</span><span class="mono">${n}</span></div>`).join('')) : raw('<div class="empty">Nobody is waiting on an answer.</div>')}
        ${unmatched ? raw(`<div class="small" style="margin-top:6px">${unmatched} more did not match a known question — those are the ones worth reading.</div>`) : ''}
        ${raw(answerRows(waiting))}
        <div class="small" style="margin-top:8px">The most-asked question is the bottleneck naming itself. Anything at the top of this list for a week is something the machine should be answering.</div>
      </div>
    </div>`;
}

/* ── the rail ───────────────────────────────────────────────────────────── */
function railHTML(upN, waiting, tagged, mine, C) {
  const laneBar = `<div class="line-lane"><button class="sub ${lane === 'mine' ? 'on' : ''}" data-lane="mine">My lane</button><button class="sub ${lane === 'all' ? 'on' : ''}" data-lane="all">Everything</button></div>`
    + `<div class="small" style="padding:0 12px 6px">${lane === 'mine' ? esc(laneWords()) : 'every file, every room — open by default'}</div>`;
  const rooms = [['office', 'The Office room'], ['production', 'The Production room'], ['village', 'The Village'], ['sales', 'Sales hype']];
  const recent = C.slice().sort((a, b) => new Date(b.occurred_at || 0) - new Date(a.occurred_at || 0)).slice(0, 8);
  const grp = (label, note, body) => `<div class="line-grp"><div class="kicker"><span>${esc(label)}</span><span>${esc(note)}</span></div>${body}</div>`;
  const item = (on, av, ini, nm, pv, badge, cls) =>
    `<button class="line-item ${on ? 'on' : ''}" data-pane="${esc(av)}"><span class="line-av ${cls || ''}">${esc(ini)}</span>`
    + `<span><span class="nm">${esc(nm)}</span><span class="pv">${esc(pv)}</span></span>`
    + (badge ? `<span class="line-badge">${esc(badge)}</span>` : '') + '</button>';

  return laneBar + grp('You\'re up', upN ? upN + ' waiting' : 'clear',
      item(pane === 'up', 'up', '!', 'Everything waiting on you', tagged.length ? firstName(tagged[0].author_name || '') + ' tagged you' : (mine.length ? mine.length + ' asks on you' : 'nothing owed'), upN || '', 'gold'))
    + grp('Nothing goes unanswered', 'everyone sees',
      item(pane === 'wait', 'wait', '∅', 'Customers with no answer', waiting.length ? 'oldest ' + mins(waiting[0].waiting_min) : 'everybody answered', waiting.length || '', waiting.some((c) => tier(c.waiting_min) === 'all') ? 'red' : ''))
    + grp('Rooms', 'anybody helps',
      rooms.map(([k, label]) => item(pane === 'room:' + k, 'room:' + k, k.slice(0, 2).toUpperCase(), label, k === 'sales' ? 'the reps’ own thread' : 'staff only', '', k === 'office' ? 'blue' : k === 'production' ? 'orange' : k === 'sales' ? 'green' : 'gold')).join(''))
    + grp('People', state.direct === null ? 'not on live yet' : 'direct lines', peopleRail())
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
  if (pane.startsWith('room:')) { renderRoom(el, pane.slice(5)); const h = el.querySelector('.card.room .head'); if (h && !h.querySelector('[data-line-back]')) h.insertAdjacentHTML('beforeend', '<button class="btn sm" data-line-back onclick="__lineBack()">← Back to The Line</button>'); return; }
  if (pane.startsWith('dm:')) { renderLine(el, pane.slice(3)); return; }
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


/* ── 346: direct lines ─────────────────────────────────────────────────────
   The one private thread in the system. Readable by the two people on it and
   the owner (RLS, not the page). The rail lists the lines that exist; the
   box under them starts a new one with anybody who has a seat. */
function peopleRail() {
  const D = state.direct;
  const box = `<div class="line-find"><input data-person-find placeholder="Message anyone… a name" autocomplete="off"/><div class="line-find-pop" data-person-pop hidden></div></div>`;
  if (D === null) return box + '<div class="small" style="padding:4px 10px 6px">Direct lines arrive with migration 346. Until it is on live this box finds people but cannot send.</div>';
  const rows = (D || []).map((d) => {
    const mine = d.last_from === state.me?.id;
    return `<button class="line-item ${pane === 'dm:' + d.other_id ? 'on' : ''}" data-pane="dm:${esc(d.other_id)}">`
      + `<span class="line-av blue">${esc(d.other_initials || (firstName(d.other_name) || '?').slice(0, 2).toUpperCase())}</span>`
      + `<span><span class="nm">${esc(personName(d.other_name))}</span><span class="pv">${mine ? 'you: ' : ''}${esc(String(d.last_body || '').slice(0, 48))}</span></span>`
      + (Number(d.unseen) ? `<span class="line-badge">${esc(d.unseen)}</span>` : '') + '</button>';
  }).join('');
  return box + (rows || '<div class="small" style="padding:4px 10px 6px">No lines yet. Type a name above.</div>');
}

/* wired once per paint — the rail is rebuilt on every click */
function wirePeopleFind(root) {
  const find = root.querySelector('[data-person-find]');
  const pop = root.querySelector('[data-person-pop]');
  if (!find || !pop) return;
  const close = () => { pop.hidden = true; pop.innerHTML = ''; };
  find.addEventListener('input', () => {
    const rows = searchPeople(find.value);
    if (!rows.length) { close(); return; }
    pop.innerHTML = rows.map((p) => `<button class="line-item" data-open-line="${esc(p.id)}"><span class="line-av blue">${esc((p.initials || firstName(p.name) || '?').slice(0, 2).toUpperCase())}</span><span><span class="nm">${esc(p.name)}</span><span class="pv">${esc(p.role || '')}</span></span></button>`).join('');
    pop.hidden = false;
    pop.querySelectorAll('[data-open-line]').forEach((b) => (b.onclick = () => { close(); find.value = ''; openLine(b.dataset.openLine); }));
  });
  find.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { close(); find.blur(); }
    if (e.key === 'Enter') { const first = pop.querySelector('[data-open-line]'); if (first) first.click(); }
  });
}

const whenShort = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

async function renderLine(el, otherId) {
  const me = state.me || {};
  const other = (state.people || []).find((p) => p.id === otherId) || (state.direct || []).map((d) => ({ id: d.other_id, name: d.other_name, role: d.other_role, initials: d.other_initials })).find((p) => p.id === otherId) || { id: otherId, name: 'A seat', role: '' };
  el.innerHTML = `<div class="card line-dm">
    <div class="head" style="margin-bottom:6px">
      <div><div class="kicker">Direct line · just the two of you${['owner'].includes(me.role) ? '' : ', and Kevin'}</div>
        <h3 class="serif" style="font-size:20px;margin-top:2px">${esc(personName(other.name))} <span class="small">· ${esc(other.role || '')}</span></h3></div>
      <span class="small">About a job? Put it on the customer's file instead — then everybody has it.</span>
      <button class="btn sm" onclick="__lineBack()">← Back to The Line</button>
    </div>
    <div class="room-list" data-dm-list><div class="empty">Opening the line…</div></div>
    <div class="composer">
      <textarea data-dm-say placeholder="Say it to ${esc(firstName(other.name) || 'them')}…"></textarea>
      <button class="btn fill" data-dm-send>Send</button>
    </div>
    <div class="small">Ctrl+Enter sends. They get a push on their phone. Nothing here is ever deleted.</div>
  </div>`;
  const list = el.querySelector('[data-dm-list]');
  const say = el.querySelector('[data-dm-say]');
  const send = el.querySelector('[data-dm-send]');
  let newest = null;

  const paintThread = async (quiet) => {
    let rows = [];
    try { rows = await directThread(otherId); }
    catch (e) { if (!quiet) list.innerHTML = `<div class="empty">${esc(e.message || 'The line would not open')}</div>`; return; }
    const last = rows.length ? rows[rows.length - 1].id : null;
    if (quiet && last === newest) return;
    newest = last;
    list.innerHTML = rows.length ? rows.map((m) => {
      const mine = m.from_id === me.id;
      return `<div class="roomrow ${mine ? 'out' : ''}"><span class="ini">${esc(mine ? (me.initials || firstName(me.name) || 'me').slice(0, 2).toUpperCase() : (other.initials || firstName(other.name) || '?').slice(0, 2).toUpperCase())}</span>`
        + `<div class="msg ${mine ? 'out' : 'in'}"><div class="who">${esc(mine ? 'You' : firstName(other.name))} · ${esc(whenShort(m.created_at))}</div><div class="say">${esc(m.body)}</div></div></div>`;
    }).join('') : '<div class="empty">Nothing on this line yet. Say the first thing.</div>';
    list.scrollTop = list.scrollHeight;
  };

  await paintThread(false);
  // opening the line is reading it: mark theirs seen, and take the badge off the rail without a reload
  const d = (state.direct || []).find((x) => x.other_id === otherId);
  if (d && Number(d.unseen)) { d.unseen = 0; directSeen(otherId); const b = el.closest('.line-wrap')?.querySelector(`[data-pane="dm:${CSS.escape(otherId)}"] .line-badge`); if (b) b.remove(); }

  let busy = false;                      // ref-style guard (b80): the render is not the lock
  const post = async () => {
    const body = (say.value || '').trim();
    if (!body || busy) return;
    if (isDemo()) { toast('Demo — nothing is saved'); return; }
    busy = true; send.disabled = true;
    try { await sendDirect(otherId, body); say.value = ''; await paintThread(false); }
    catch (e) { toast(e.message || 'It did not go through', 'err'); }
    finally { busy = false; send.disabled = false; }
  };
  send.onclick = post;
  enterPosts(say, post);
  { const m = micButton(say); if (m && send.parentElement) send.parentElement.insertBefore(m, send); }
  stopLinePoll();
  dmTimer = setInterval(() => { if (!el.isConnected) { stopLinePoll(); return; } paintThread(true); }, 15000);
}


/* ── SAY IT — one box at the top of The Line ───────────────────────────────
   Kevin, 15 Sep, after the Jess texting thread (308): "you should have the
   ability to send it to whichever employee you want about whichever customer
   you pick… a drop down box either by their address or last name… a thousand
   ways to quickly get this out."
   Pick the customer (last name · address · phone). Then either lane:
     a PERSON  → the note lands on that customer's file with @First, and 312
                 does the rest — the push and their Tagged list. Same rail as
                 the file's own tag box, without opening the file.
     the CUSTOMER → a text from the brand's approved line (file_text_queue,
                 311), with Jess's office lines (308) as one-tap presets. It is
                 a draft until Send, and the file opens after so the six-second
                 undo is right there.
   Nothing here is a new write: both doors already existed on the file. */
let say = { cust: null, lane: 'person', to: '', text: '', lines: [] };

function sayItHTML() {
  const me = state.me || {};
  const people = (state.people || []).filter((p) => p.id !== me.id);
  const roles = [['@office', '@office · the office seat'], ['@schedule', '@schedule · scheduling'], ['@production', '@production · the supervisor'], ['@rep', '@rep · who sold it'], ['@invoice', '@invoice · billing'], ['@sales', '@sales · every rep'], ['@supers', '@supers · every supervisor'], ['@everyone', '@everyone · the whole company']];
  const c = say.cust;
  const rep = me.role === 'sales';
  const who = c ? `<span class="chip cust">on ${esc(personName(c.name))}${c.street ? ' · ' + esc(c.street) : ''}${c.city ? ', ' + esc(c.city) : ''}</span><button class="btn sm" data-say-clear>Change</button>`
                : `<input data-say-find placeholder="Who is it about — last name, address, or phone" autocomplete="off"/><div class="line-find-pop" data-say-pop hidden></div>`;
  const toOpts = `<option value="">— pick who —</option>` + roles.map(([v, l]) => `<option value="${v}" ${say.to === v ? 'selected' : ''}>${esc(l)}</option>`).join('')
    + people.map((p) => `<option value="id:${esc(p.id)}" ${say.to === 'id:' + p.id ? 'selected' : ''}>${esc(mentionHandle(p))} · ${esc(p.name)}${p.role ? ' · ' + esc(p.role) : ''}</option>`).join('');
  const presets = say.lane === 'customer' && c
    ? `<div class="say-presets">${(say.lines || []).map((l) => `<button class="sub" data-say-line="${esc(l.key)}" title="${esc(l.body)}">${esc(l.label)}</button>`).join('') || '<span class="small">Reading the office lines…</span>'}</div>` : '';
  const law = say.lane === 'customer'
    ? (c ? `Goes to ${esc(firstName(c.name) || 'them')} as a text from the brand's approved line. A draft until Send; the file opens after with six seconds to take it back.` : 'Pick the customer first.')
    : (c ? `Lands on ${esc(personName(c.name))}'s file as a note. Everyone you @ gets a push and it sits in their You're up until they open it. The customer never sees this.` : 'No customer yet: this goes to the Village, where every seat reads it. @ a customer in the words and it lands on their file instead.');
  return `<div data-tour="sayit" class="card say" id="line-say">
    <div class="head" style="margin-bottom:8px"><div class="kicker">Say it · to anyone, about any customer, from here</div><span class="small">${isDemo() ? 'demo — nothing sends' : 'texts from the brand line · notes with a push'}</span></div>
    <div class="say-row"><span class="kicker">About</span><div class="say-who">${who}</div></div>
    <div class="say-row"><span class="kicker">To</span>
      <div class="lanes" style="margin:0">
        <button class="lanebtn ${say.lane === 'person' ? 'on' : ''}" data-say-lane="person">A person</button>
        <button class="lanebtn ${say.lane === 'customer' ? 'on' : ''}" data-say-lane="customer">The customer</button>
        ${say.lane === 'person' && !rep ? `<select data-say-to style="width:auto;padding:5px 8px;font-size:12px">${toOpts}</select>` : ''}
      </div></div>
    ${presets}
    <div class="composer" style="border:0;padding:0;background:transparent;position:relative">
      <div class="line-find-pop at-pop" data-say-at-pop hidden></div>
      <textarea data-say-text placeholder="${say.lane === 'customer' ? 'The text…' : (rep ? '@Jess this customer called me, the crew missed the gate latch. Can you get with @Obed to fix it? @ the customer by name, street or phone…' : 'permit is in, ready to schedule · take this one · customer asked for you')}">${esc(say.text)}</textarea>
      <button class="btn ${say.lane === 'customer' ? 'fill' : ''}" data-say-send ${(c || say.lane !== 'customer') ? '' : 'disabled'}>${say.lane === 'customer' ? 'Send the text' : 'Post it'}</button>
    </div>
    <div class="small">${law} Type <b>@</b> in the words for more people — everyone named gets the push. Enter sends · Shift+Enter for a new line · 🎤 talks into the box.</div>
  </div>`;
}

function wireSayIt(root) {
  const box = root.querySelector('#line-say'); if (!box) return;
  const repaint = () => { box.outerHTML = sayItHTML(); wireSayIt(root); };
  const find = box.querySelector('[data-say-find]'), pop = box.querySelector('[data-say-pop]');
  let t = null;
  if (find) {
    find.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(async () => {
        const q = find.value.trim(); if (q.length < 2) { pop.hidden = true; return; }
        let rows = []; try { rows = await searchCustomers(q); } catch (e) { toast(e.message, 'err'); return; }
        pop.innerHTML = rows.length ? rows.map((r) => `<button class="line-item" data-say-pick="${esc(r.id)}" data-name="${esc(r.name)}" data-street="${esc(r.street || '')}" data-city="${esc(r.city || '')}">`
          + `<span class="line-av">${esc((firstName(r.name) || '?').slice(0, 2).toUpperCase())}</span>`
          + `<span><span class="nm">${esc(personName(r.name))}</span><span class="pv">${esc(r.street || r.phone || '')}${r.city ? ' · ' + esc(r.city) : ''}${r.updated_at ? ' · ' + esc(new Date(r.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) : ''}</span></span></button>`).join('')
          : '<div class="small" style="padding:6px 10px">Nobody by that name, address or number</div>';
        pop.hidden = false;
        pop.querySelectorAll('[data-say-pick]').forEach((b) => (b.onclick = async () => {
          say.cust = { id: b.dataset.sayPick, name: b.dataset.name, street: b.dataset.street, city: b.dataset.city };
          say.lines = [];
          repaint();
          try { say.lines = await linePreview(say.cust.id); } catch { say.lines = []; }
          if (say.lane === 'customer') repaint();
        }));
      }, 220);
    });
    find.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); const f = pop.querySelector('[data-say-pick]'); if (f) f.click(); } if (e.key === 'Escape') { pop.hidden = true; } });
  }
  box.querySelector('[data-say-clear]')?.addEventListener('click', () => { say.cust = null; say.lines = []; repaint(); });
  box.querySelectorAll('[data-say-lane]').forEach((b) => (b.onclick = () => { say.lane = b.dataset.sayLane; repaint(); }));
  box.querySelector('[data-say-to]')?.addEventListener('change', (e) => { say.to = e.target.value; });
  const text = box.querySelector('[data-say-text]');
  text.addEventListener('input', () => { say.text = text.value; });
  // @ in the words: more people than the dropdown holds, and a customer by name / street / phone fills About
  wireAtOn(text, box.querySelector('[data-say-at-pop]'), async (c) => {
    say.text = text.value; say.cust = { id: c.id, name: c.name }; say.lines = [];
    repaint();
    try { say.lines = await linePreview(c.id); } catch { say.lines = []; }
    if (say.lane === 'customer') repaint();
  });
  box.querySelectorAll('[data-say-line]').forEach((b) => (b.onclick = () => { const l = (say.lines || []).find((x) => x.key === b.dataset.sayLine); if (l) { say.text = l.body; text.value = l.body; text.focus(); } }));

  let busy = false;                        // ref-style guard (b80): the render is not the lock
  const send = async () => {
    const c = say.cust, body = (text.value || '').trim();
    if (!body || busy || (say.lane === 'customer' && !c)) return;
    busy = true; const btn = box.querySelector('[data-say-send]'); btn.disabled = true;
    try {
      if (!c) {
        // nobody picked: it is a Village post — every staff seat reads it and gets the room's push (316)
        if (isDemo()) { if (window.__demoPost) window.__demoPost('village', { name: state.me?.name, initials: state.me?.initials, body }); toast('Demo — posted to the Village here only'); }
        else { await api.insert('team_messages', { room: 'village', body, customer_id: null }, false); toast('Posted to the Village · everyone gets the push'); }
        say.text = ''; text.value = ''; pane = 'room:village'; renderSwitchboard(lastRoot);
        return;
      }
      if (isDemo()) { toast('Demo — nothing is saved'); return; }
      if (say.lane === 'customer') {
        await textCustomer(c.id, body);
        toast(`Queued to ${firstName(c.name) || 'them'} from the brand line · six seconds to take it back`);
      } else {
        const f = await loadFile(c.id);
        let tid = f.thread?.id;
        if (!tid) { if (!f.job?.job_id) throw new Error('No job on this file yet — open the file and start it there'); tid = await threadForJob(f.job.job_id); }
        // a person is picked by id; the handle written into the note is the one 312 resolves without ambiguity
        const person = say.to.startsWith('id:') ? (state.people || []).find((p) => p.id === say.to.slice(3)) : null;
        const handle = person ? mentionHandle(person) : say.to;
        const note = handle && !body.includes(handle) ? handle + ' ' + body : body;
        const posted = await postMessage(tid, ['manager'].includes(state.me?.role) ? 'SUPER' : 'OFFICE', note);
        const mid = Array.isArray(posted) ? posted[0]?.id : posted?.id;
        const rc = mid ? (await threadReceipts(tid).catch(() => [])).filter((r) => r.message_id === mid) : [];   // 354: the receipt
        toast(`Posted on ${personName(c.name)} · ${receiptWords(rc)}`, rc.length ? 'ok' : undefined);
      }
      say.text = ''; text.value = '';
      window.__peek(c.id);                    // the file opens beside you: the text with its undo, or the note where it landed
    } catch (e) { toast(e.message || 'It did not go through', 'err'); }
    finally { busy = false; btn.disabled = false; }
  };
  box.querySelector('[data-say-send]').onclick = send;
  enterPosts(text, send, () => { const p = box.querySelector('[data-say-at-pop]'); return !!(p && !p.hidden); });
  { const m = micButton(text); const sb = box.querySelector('[data-say-send]'); if (m && sb) sb.parentElement.insertBefore(m, sb); }
}
