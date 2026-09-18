// Liberty Command — bootstrap: sign-in, the rooms a role opens, load, render.
import * as api from './api.js?v=128';
import { state, loadAll, isDemo, searchCustomers, searchPeople, createJob, repDay, whoIsFree, personName, firstName } from './book.js?v=128';
import { $, $$, html, raw, toast, esc, openModal } from './ui.js?v=128';
import { BRAND_BY_CC, LEAD_REP_NOTE } from './config.js?v=128';
import { addressPicker, addressSource } from './address.js?v=128';
import { ROOMS_BY_ROLE, ROOM_LABEL, ROOMS_BY_SEAT, KEYS } from './config.js?v=128';
import { renderSwitchboard, stopLinePoll } from './switchboard.js?v=128';
import { renderHome } from './home.js?v=128';
import { renderRoom } from './village.js?v=128';
import { renderSales } from './sales.js?v=128';
import { renderPipeline } from './pipeline.js?v=128';
import { renderMarketing } from './marketing.js?v=128';
import { renderOffice } from './office.js?v=128';
import { renderProduction } from './production.js?v=128';
import { renderFiles, openFile, closeDrawer } from './file.js?v=128';
import { stopRoomPoll } from './village.js?v=128';
import { renderFlow, stopFlow } from './flow.js?v=128';
import { startTour, tourWanted } from './tour.js?v=128';
import { startAlerts } from './alerts.js?v=128';
import { renderPhotos } from './photos.js?v=128';

let view = 'line';   // the playground first (Kevin, 15 Sep): every seat signs in on The Line
let loading = false;
const VIEWS = ['line', 'village', 'home', 'sales', 'pipeline', 'marketing', 'office', 'production', 'flow', 'photos', 'files', 'file'];

export function rooms() {
  const me = state.me;
  if (me && ROOMS_BY_SEAT[me.id]) return ROOMS_BY_SEAT[me.id];   // the seat's own list beats its role's (Gio: everything but the books)
  return ROOMS_BY_ROLE[me?.role || 'sales'] || ['files'];
}

export function go(v, arg) {
  view = v;
  stopRoomPoll();                 // the room you are leaving stops talking to the database
  stopLinePoll();
  stopFlow();
  if (v !== 'file') closeDrawer();
  if (v === 'file' && arg) { openFile(arg).catch((e) => toast(e.message || 'Could not open the file', 'err')); }
  render();
  window.scrollTo({ top: 0 });
}
window.__go = go;   // the tables' onclick handlers
window.addEventListener('error', (e) => { try { toast('Something broke: ' + ((e.error && e.error.message) || e.message || 'unknown') + ' — tell Kevin those words', 'err'); } catch {} });
window.addEventListener('unhandledrejection', (e) => { try { const m = (e.reason && e.reason.message) || String(e.reason || ''); if (/JWT|expired|Failed to fetch/i.test(m)) return; toast('Something broke: ' + m + ' — tell Kevin those words', 'err'); } catch {} });

/* THE VILLAGE as a room of its own (16 Sep, launch morning). The same card the rail shows, full width:
   every seat reads it, every post can hang on a customer, and a name in the words gets the buzz. */
function renderVillageRoom(root) {
  root.innerHTML = html`
    <div class="head">
      <div><div class="kicker">The Village · the whole company, one thread</div>
      <h1 class="serif">Everyone in one room.</h1></div>
    </div>
    <div class="village-wide" id="village-room"></div>`;
  renderRoom(root.querySelector('#village-room'), 'village', { kicker: 'The Village · everyone', note: 'all customers, all employees, one room · newest at the bottom' });
}
window.__reloadQuiet = () => reload(true);

/* VIEW AS — Kevin, 15 Sep night: "I want to be able to just click down and, if I'm
   that person, I can be them… flip through everyone in my company and see what
   they would see." Owner and admin only. The rooms, the name and the role
   become theirs; the rows stay what the real login can read (RLS runs on the
   real token), which for an owner is everything — so a rep's Files list reads
   wider than the rep's own would. The banner says so. Never saved. */
export function viewAs(id) {
  const real = state.realMe || state.me;
  if (!real || !(KEYS.includes(real.id) || real.role === 'admin' || (isDemo() && real.role === 'owner'))) return;   // the keys only — an owner on paper does not get View as
  const seat = id ? (state.people || []).find((p) => p.id === id) : null;
  state.viewAsId = seat ? seat.id : null;
  state.me = seat ? { ...real, ...seat } : real;
  stopRoomPoll(); stopLinePoll(); stopFlow(); closeDrawer();
  view = rooms()[0] || 'files';
  render();
  window.scrollTo({ top: 0 });
}
window.__viewAs = viewAs;
const ROLE_ORDER = { owner: 0, admin: 1, manager: 2, office: 3, sales: 4, crew: 5 };
function renderViewAs() {
  const el = $('#viewas'); if (!el) return;
  const real = state.realMe || state.me;
  const filmOfTheirView = isDemo() && /[?&]as=/.test(location.search);   // ?demo=1&as=office is THEIR view — Kevin's picker stays off it
  if (filmOfTheirView || !real || !(KEYS.includes(real.id) || real.role === 'admin' || (isDemo() && real.role === 'owner'))) { el.hidden = true; el.innerHTML = ''; return; }
  const people = (state.people || []).filter((p) => p.id !== real.id && p.role !== 'crew').slice().sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) || String(a.name).localeCompare(String(b.name)));
  const cur = state.viewAsId || '';
  el.hidden = false;
  el.innerHTML = html`<select id="viewas-pick" aria-label="View as">
      <option value="">${raw('View as… (you: ' + esc(real.name.split(' ')[0]) + ')')}</option>
      ${raw(people.map((p) => `<option value="${esc(p.id)}" ${p.id === cur ? 'selected' : ''}>${esc(p.name)} · ${esc(p.role)}</option>`).join(''))}
    </select>
    ${cur ? raw(`<div class="on"><b>Viewing as ${esc(state.me.name)} · ${esc(state.me.role)}</b>their rooms, their name — the rows are still what your login can see · <button id="viewas-back">back to you</button></div>`) : ''}`;
  $('#viewas-pick').onchange = (e) => viewAs(e.target.value || null);
  const back = $('#viewas-back'); if (back) back.onclick = () => viewAs(null);
}

export function render() {
  const me = state.me;
  const r = rooms();
  if (!r.includes(view) && view !== 'file') view = r[0] || 'files';
  $('#nav-who').textContent = me ? `${me.name.split(' ')[0]} · ${me.role}` : '';
  // 🎬 THE LIBRARY (18 Sep): the header's door opens on Central Command's pieces, and on the seat's own team
  const lib = $('#btn-new'); if (lib) lib.href = 'docs/library/?where=cc' + (me && me.role === 'office' ? '&for=Office' : me && me.role === 'sales' ? '&for=Sales' : '');
  renderViewAs();
  $('#who-sub').textContent = isDemo() ? 'DEMO — nothing is saved' : (state.loadedAt ? 'loaded ' + state.loadedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '');
  const tagged = (state.mentions || []).filter((m) => !m.seen_at).length;
  const counts = { line: state.clock.filter((c) => c.waiting_min >= 60).length + tagged + (state.direct || []).reduce((a, d) => a + Number(d.unseen || 0), 0), office: state.queue.length, production: state.board.filter((b) => b.stage === 'production' || b.stage === 'field_complete').length, home: state.clock.filter((c) => c.waiting_min >= 15).length + tagged };
  $('#tabs').innerHTML = r.map((k) => html`<button class="tab ${k === view || (view === 'file' && k === 'files') ? 'on' : ''}" data-view="${k}">${ROOM_LABEL[k]}${counts[k] ? raw(`<span class="n">${counts[k]}</span>`) : ''}</button>`).join('');
  $$('#tabs button').forEach((b) => (b.onclick = () => go(b.dataset.view)));
  for (const v of VIEWS) $('#view-' + v).classList.toggle('hidden', v !== view);
  if (view === 'line') renderSwitchboard($('#view-line'));
  if (view === 'village') renderVillageRoom($('#view-village'));
  if (view === 'home') renderHome($('#view-home'));
  if (view === 'sales') renderSales($('#view-sales'));
  if (view === 'pipeline') renderPipeline($('#view-pipeline'));
  if (view === 'marketing') renderMarketing($('#view-marketing'));
  if (view === 'office') renderOffice($('#view-office'));
  if (view === 'production') renderProduction($('#view-production'));
  if (view === 'flow') renderFlow($('#view-flow'));
  if (view === 'photos') renderPhotos($('#view-photos'));
  if (view === 'files') renderFiles($('#view-files'));
  document.title = `${counts.home ? counts.home + ' waiting · ' : ''}Central Command · 4-Touch Autopilot`;
}

export async function reload(quiet = false) {
  if (loading) return;
  loading = true;
  try {
    await loadAll();
    render();
    if (!quiet) toast(`Loaded · ${state.board.length} files on the board · ${state.queue.length} asks open`);
    if (state.warnings.length) toast(state.warnings[0], 'err');
  } catch (e) {
    const msg = e.message || 'Load failed';
    toast(msg, 'err');
    if (/not signed in|session expired|401|JWT/i.test(msg)) { showSignIn(); }
    else {
      $('main').innerHTML = html`<div class="card"><div class="kicker">The load failed</div><div style="font-size:15px;margin-top:6px">${msg}</div><div class="note" style="margin-top:8px">The database refused or timed out on one of the room's reads. Refresh to try again; if it keeps happening, send Kevin this exact line.</div><div style="margin-top:10px"><button class="btn fill" id="retry">Try again</button> <button class="btn" id="out">Sign out</button></div></div>`;
      $('#retry').onclick = () => reload();
      $('#out').onclick = async () => { await api.signOut(); state.me = null; showSignIn(); };
    }
  } finally { loading = false; }
}

function showSignIn() { $('#signin').classList.remove('hidden'); $('#app').classList.add('hidden'); }
function showApp() { $('#signin').classList.add('hidden'); $('#app').classList.remove('hidden'); }

// ── find a customer, from any room ──────────────────────────────────────────
let findTimer = null;
function wireFind() {
  const box = $('#find');
  let pop = null;
  let seq = 0;
  let unfit = null;
  const close = () => { document.querySelectorAll('.findpop').forEach((p) => p.remove()); pop = null; if (unfit) { unfit(); unfit = null; } };
  box.addEventListener('input', () => {
    clearTimeout(findTimer);
    findTimer = setTimeout(async () => {
      const my = ++seq;
      const q = box.value.trim();
      close();
      if (q.length < 2) return;
      let rows = [];
      try { rows = await searchCustomers(q); } catch (e) { toast(e.message, 'err'); return; }
      if (my !== seq) return;   // a newer search is on its way — this one never lands
      close();
      const people = searchPeople(q);   // 346: a person opens a direct line; a customer opens the file — same box
      pop = document.createElement('div');
      pop.className = 'card findpop';
      pop.innerHTML = '<div class="findhead"><span class="kicker">Find · ' + esc(q) + (rows.length > 1 ? ' · ' + rows.length + ' files, best match first' : '') + '</span><button class="btn sm" id="find-close" type="button">Close ✕</button></div>' + ((people.length || rows.length)
        ? people.map((p) => html`<button class="inv findrow" style="text-align:left;grid-template-columns:1fr auto auto;cursor:pointer" data-person="${p.id}"><span><b>${p.name}</b></span><span class="mono dimmer">${p.role || ''}</span><span class="chip st-blue">OPEN A LINE ›</span></button>`).join('')
          + rows.map((c) => html`<button class="inv findrow" style="text-align:left;grid-template-columns:1fr auto auto;cursor:pointer" data-id="${c.id}"><span><b>${c.name}</b><br><span class="small">${c.street || ''}${c.city ? ' · ' + c.city : ''}${c.updated_at ? ' · ' + new Date(c.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span></span><span class="mono dimmer">${c.phone || ''}</span><span class="chip">OPEN THE FILE ›</span></button>`).join('')
        : '<div class="empty">Nobody by that name or number</div>');
      const mine = pop; pop.querySelector('#find-close').onclick = () => { mine.remove(); close(); box.value = ''; box.blur(); };
      pop.querySelectorAll('button[data-id]').forEach((b) => (b.onclick = () => { close(); box.value = ''; window.__peek(b.dataset.id); }));
      pop.querySelectorAll('button[data-person]').forEach((b) => (b.onclick = () => { close(); box.value = ''; window.__line(b.dataset.person); }));
      $('nav.side').appendChild(pop);
      // THE PHONE (Kevin, 17 Sep night: a hundred Smiths, "my phone doesn't let me slide all the way down"): the list sits
      // right under the box and is sized to the part of the screen the keyboard leaves (visualViewport), so its end is
      // reachable with the keyboard up; and the first drag on the list drops the keyboard so the whole screen is list.
      const fit = () => { if (!pop) return; const vv = window.visualViewport; pop.style.setProperty('--findtop', Math.round(box.getBoundingClientRect().bottom + 6) + 'px'); pop.style.setProperty('--vvh', Math.round(vv ? vv.height + vv.offsetTop : window.innerHeight) + 'px'); };
      fit(); window.visualViewport?.addEventListener('resize', fit); window.visualViewport?.addEventListener('scroll', fit);
      unfit = () => { window.visualViewport?.removeEventListener('resize', fit); window.visualViewport?.removeEventListener('scroll', fit); };
      pop.addEventListener('touchmove', () => { if (document.activeElement === box) box.blur(); }, { passive: true, once: true });
    }, 220);
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { close(); box.blur(); }
    if (e.key === 'Enter') { const first = pop?.querySelector('button[data-id],button[data-person]'); if (first) first.click(); }   // Enter opens the top match
  });
  // it closes on a tap anywhere else, on Escape from anywhere, and when the box empties (Kevin, 16 Sep: "won't let me put this screen down")
  document.addEventListener('pointerdown', (e) => { if (pop && !pop.contains(e.target) && e.target !== box) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && pop) { close(); box.blur(); } });
  box.addEventListener('input', () => { if (!box.value.trim()) close(); });
  // ⌘K / Ctrl+K from anywhere: the box, focused. Kevin, 15 Sep: "a quick way to message anyone".
  document.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); box.focus(); box.select(); } });
}

/* the time list on the New lead form: 7:00 AM to 7:30 PM by the half hour, said the way the office says it (Sam, 17 Sep) */
const clock12 = (hm) => { const [h, m] = hm.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
function timeOpts() { const out = []; for (let h = 7; h <= 19; h++) for (const m of [0, 30]) { const v = `${String(h).padStart(2, '0')}:${m ? '30' : '00'}`; out.push(`<option value="${v}">${clock12(v)}</option>`); } return out.join(''); }

/* THE NEW LEAD DOOR — customer + job (+ appointment, + signing) in one call (313, 381).
   Kevin, 17 Sep: "Jess starting on Monday scheduling all leads in the new app… we have to start
   here, we're not going to do the first redundancy." So from Mon 21 Sep this is the FIRST door a
   new customer comes through, ahead of Contractors Cloud: the rep's phone buzzes the moment it is
   booked, the booking is a line on the file, the confirmation text follows its switch, and the
   machine carries the copy into CC behind the cc_mirror switch (OFF = the file shows the fields
   to paste). The form reads the rep's day so nobody is double-booked. A prefill opens it typed
   (the Ride-Along). Nothing else moves: invoicing, bills, work orders stay in CC until Kevin says. */
function newJob(prefill) {
  const me = state.me || {};
  const brands = Object.entries(BRAND_BY_CC);
  const sellers = state.sellers || [];
  const canPickRep = me.role !== 'sales';
  const cc0 = prefill?.cc || me.manages_company_id || '1461';
  const srcFor = (cc) => (state.leadSources || []).filter((s) => s.cc_company_id === cc);
  const srcOpts = (cc) => '<option value="">— how they found us —</option>' + srcFor(cc).map((s) => `<option value="${esc(s.name)}">${esc(s.name)}</option>`).join('');
  const repOpts = (cc) => { const mine = sellers.filter((s) => String(s.cc_default_company_id) === String(cc)), rest = sellers.filter((s) => String(s.cc_default_company_id) !== String(cc)); return '<option value="">— pick the rep —</option>' + [...mine, ...rest].map((s) => `<option value="${esc(s.id)}">${esc(s.name)}${LEAD_REP_NOTE[s.id] ? ' · ' + esc(LEAD_REP_NOTE[s.id]) : ''}</option>`).join(''); };
  // the rep's day: what they already have booked on the day you picked, so nobody is double-booked
  const dayStrip = async (f) => {
    const box = f.querySelector('#nj-day'); if (!box) return;
    const rep = canPickRep ? f.rep.value : me.id, day = (f.day && f.day.value) || (f.appt.value ? f.appt.value.slice(0, 10) : '');
    if (!rep || !day) { box.innerHTML = '<div class="small dimmer">Pick the rep and the day and this shows what they already have that day.</div>'; return; }
    box.innerHTML = '<div class="small dimmer">Reading the rep\'s day…</div>';
    try {
      const rows = await repDay(rep, day);
      const who = firstName(sellers.find((s) => s.id === rep)?.name || me.name || 'the rep');
      const d = new Date(day + 'T12:00:00').toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
      box.innerHTML = rows.length
        ? `<div class="kicker">${esc(who)} · ${esc(d)} · already booked</div>` + rows.map((r) => `<div class="r"><span><span class="mono">${esc(new Date(r.appt_starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))}</span> · ${esc(personName(r.customers?.name || 'a customer'))}${r.customers?.city ? ' · ' + esc(r.customers.city) : ''}</span><span class="small dimmer">${esc(r.title || '')}</span></div>`).join('')
        : `<div class="small verify">${esc(who)} has nothing booked ${esc(d)}. Wide open.</div>`;
    } catch (e) { box.innerHTML = `<div class="small dimmer">Could not read the day (${esc(e.message)}).</div>`; }
  };
  // 407 WHO'S FREE (Kevin, 18 Sep: "how does she know if they're available?"): for this brand, the county the address picker
  // found and the hour on the form — who covers the area, who is free, what the busy ones are doing (a visit by name, anything
  // personal just "busy"), how many visits each already has that day. Tap a name and it is the rep. Sam still chooses.
  let county = prefill?.county || '';
  const freeStrip = async (f) => {
    const box = f.querySelector('#nj-free'); if (!box) return;
    if (!canPickRep) { box.innerHTML = ''; return; }
    const at = f.appt.value;
    if (!at) { box.innerHTML = '<div class="small dimmer">Pick the day and the time and this shows who is free then, in that area.</div>'; return; }
    box.innerHTML = '<div class="small dimmer">Asking who is free…</div>';
    try {
      const rows = await whoIsFree(f.cc.value, county, new Date(at).toISOString(), f.mins.value || 60);
      if (f.appt.value !== at) return;   // she moved the time while this was in flight; the newer ask paints
      const when = new Date(at).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      const chip = (r) => {
        const picked = f.rep && f.rep.value === r.rep_id;
        const unread = !r.calendar_read_at || r.calendar_ok === false;
        const cls = r.free ? (unread ? 'st-ink' : 'st-green') : 'warn';
        const what = r.free ? (unread ? 'free on the book · calendar not read yet' : 'free') : esc(r.busy_with || 'busy');
        const n = r.visits_that_day ? ` · ${r.visits_that_day} that day` : ' · nothing else that day';
        return `<button type="button" class="chip ${cls}" data-rep="${esc(r.rep_id)}" style="margin:0 6px 6px 0;cursor:pointer">${picked ? '✓ ' : ''}${esc(firstName(r.name))} · ${what}${n}</button>`;
      };
      const inArea = rows.filter((r) => r.covers !== false), outArea = rows.filter((r) => r.covers === false);
      box.innerHTML = rows.length
        ? `<div class="kicker">Who's free · ${esc(when)}${county ? ' · ' + esc(county) + ' County' : ''}</div><div>${inArea.map(chip).join('')}</div>` +
          (outArea.length ? `<div class="small dimmer" style="margin-top:2px">Outside their area</div><div>${outArea.map(chip).join('')}</div>` : '')
        : '<div class="small dimmer">No reps on this brand\'s list.</div>';
      box.querySelectorAll('button[data-rep]').forEach((b) => { b.onclick = () => { if (f.rep) { f.rep.value = b.dataset.rep; dayStrip(f); freeStrip(f); } }; });
    } catch (e) { box.innerHTML = `<div class="small dimmer">Could not ask who is free (${esc(e.message)}).</div>`; }
  };
  openModal({ title: 'New lead · a new customer starts here', submitLabel: 'Open the file', wide: true, body: `
    <div class="two">
      <div class="field"><label>Brand</label><select name="cc">${brands.map(([cc, b]) => `<option value="${cc}" ${cc === cc0 ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></div>
      <div class="field"><label>How they found us · the same list as Contractors Cloud</label><select name="src">${srcOpts(cc0)}</select></div>
    </div>
    <div class="two">
      <div class="field"><label>First name · Last name <span class="dimmer">(the file reads Last, First on its own)</span></label><div style="display:flex;gap:6px"><input name="first" placeholder="Grace" autocomplete="off" style="flex:1"/><input name="last" required placeholder="Okonkwo — or the household" autocomplete="off" style="flex:1.3"/></div></div>
      <div class="field"><label>Mobile</label><input name="phone" placeholder="(321) 555-0100"/></div>
    </div>
    <div class="two">
      <div class="field"><label>Email</label><input name="email" type="email"/></div>
      <div class="field"><label>What they want</label><input name="title" placeholder="chain link quote needed · 6' vinyl privacy, 210 ft"/></div>
    </div>
    <div class="two">
      <div class="field"><label>Street · type it, pick the match · suggestions from ${esc(addressSource())}</label><input name="street" autocomplete="off" placeholder="4050 Palm Ave"/><div id="nj-addr-pick" class="pick addrpick" hidden></div></div>
      <div class="field"><label>City · zip</label><div style="display:flex;gap:6px"><input name="city" placeholder="Cocoa"/><input name="zip" placeholder="32922" style="width:110px"/></div></div>
    </div>
    <div class="two">
      <div class="field"><label>Rep</label>${canPickRep ? `<select name="rep">${repOpts(cc0)}</select>` : `<input value="${esc(me.name || '')}" disabled/>`}</div>
      <div class="field"><label>Estimate appointment · leave blank if they still need a time</label><div style="display:flex;gap:6px"><input name="day" type="date" style="flex:1"/><select name="time" style="width:112px"><option value="">time</option>${timeOpts()}</select><input name="appt" type="hidden"/><select name="mins" style="width:96px"><option value="30">30 min</option><option value="45">45 min</option><option value="60" selected>1 hour</option><option value="90">1½ h</option><option value="120">2 h</option></select></div></div>
    </div>
    <div class="rows" id="nj-free" style="margin:2px 0 6px"><div class="small dimmer">Pick the day and the time and this shows who is free then, in that area.</div></div>
    <div class="rows" id="nj-day" style="margin:2px 0 8px"><div class="small dimmer">Pick the rep and the day and this shows what they already have that day.</div></div>
    <div class="two">
      <div class="field"><label>Note to the team (optional)</label><input name="note" placeholder="gate code 2021 · dog in the yard · call before 8"/></div>
      <div class="field"><label>Signed today for (optional)</label><input name="amount" type="number" step="0.01" min="0" placeholder="leave blank if not signed yet"/></div>
    </div>
    <div class="note">Open the file and it is done: the rep's phone buzzes with the day, the time and the address; the booking is the first line on the file; the customer gets the confirmation text when that switch is on; and the machine carries the lead into Contractors Cloud when its switch is on. Same phone number = same customer. A signed amount opens the paperwork checklist for the office.</div>`,
    onOpen: (f) => {
      f.cc.onchange = () => { f.src.innerHTML = srcOpts(f.cc.value); if (f.rep) f.rep.innerHTML = repOpts(f.cc.value); dayStrip(f); freeStrip(f); };
      if (f.rep) f.rep.onchange = () => { dayStrip(f); freeStrip(f); };
      // Sam, 17 Sep: the day and a time list that reads 8:00 AM — one pick, no AM/PM segment to tab into; the hidden appt carries both as before
      const joinAppt = () => { f.appt.value = f.day.value && f.time.value ? f.day.value + 'T' + f.time.value : ''; dayStrip(f); freeStrip(f); };
      f.day.onchange = joinAppt; f.time.onchange = joinAppt; f.mins.onchange = () => freeStrip(f);
      // Samantha's first (17 Sep): the street suggests as she types; a pick fills street, city and zip and moves her on. 407: the county rides along, for Who's free.
      addressPicker(f.street, f.querySelector('#nj-addr-pick'), (a) => { if (a.street) f.street.value = a.street; if (a.city) f.city.value = a.city; if (a.zip) f.zip.value = a.zip; county = a.county || ''; freeStrip(f); (a.zip ? (f.rep || f.day) : f.city).focus(); });
      freeStrip(f);
      if (prefill) {   // the Ride-Along opens it typed; nothing is saved in the demo
        for (const [k, v] of Object.entries(prefill)) { const el = f.elements[k]; if (el && k !== 'cc') el.value = v; }
        if (prefill.name) { const [l, fi] = String(prefill.name).split(/,\s*/); f.last.value = l || ''; f.first.value = fi || ''; }   // "Okonkwo, Grace" → the two boxes
        if (prefill.src) f.src.value = prefill.src;
        if (prefill.rep && f.rep) f.rep.value = prefill.rep;
        if (prefill.appt) { f.day.value = String(prefill.appt).slice(0, 10); const t = String(prefill.appt).slice(11, 16); if (t && ![...f.time.options].some((o) => o.value === t)) f.time.add(new Option(clock12(t), t)); f.time.value = t; }
        joinAppt();
      }
    },
    onSubmit: async (f) => {
      const amount = f.amount.value ? Number(f.amount.value) : null;
      // Sam, 18 Sep: two boxes, First and Last, the way CC has them; the file keeps reading "Last, First" so nothing downstream changes
      const last = f.last.value.trim().replace(/,\s*$/, ''), first = f.first.value.trim();
      const r = await createJob({ p_cc_company: f.cc.value, p_name: first ? `${last}, ${first}` : last, p_phone: f.phone.value.trim() || null, p_email: f.email.value.trim() || null,
        p_street: f.street.value.trim() || null, p_city: f.city.value.trim() || null, p_zip: f.zip.value.trim() || null,
        p_rep: canPickRep ? (f.rep.value || null) : null, p_title: f.title.value.trim() || null,
        p_appt_at: f.appt.value ? new Date(f.appt.value).toISOString() : null,
        p_amount: amount, p_signed_at: amount ? new Date().toISOString() : null, p_lead_source: f.src.value || null, p_note: f.note.value.trim() || null,
        p_appt_minutes: Number(f.mins.value || 60), p_what: f.title.value.trim() || null });
      const bits = ['The file is open'];
      if (r?.pushed_rep) bits.push(`${firstName(r.rep_name || 'the rep')}'s phone buzzed`);
      if (amount) bits.push('paperwork checklist opened for the office');
      bits.push(r?.mirror_on ? 'going into Contractors Cloud within the hour' : 'not in Contractors Cloud yet — the file shows what to paste');
      toast(bits.join(' · '));
      await reload(true);
      window.__peek(r.customer_id);
    } });
}
window.__newJob = (prefill) => newJob(prefill);   // the Ride-Along opens the door typed

async function boot() {
  $('#btn-newjob').onclick = newJob;
  $('#btn-refresh').onclick = () => reload();
  $('#btn-signout').onclick = async () => { await api.signOut(); state.me = null; showSignIn(); };
  $('#si-form').onsubmit = async (e) => {
    e.preventDefault();
    const go = $('#si-go'); go.disabled = true; $('#si-err').textContent = '';
    try { await api.signIn($('#si-email').value.trim(), $('#si-pass').value); showApp(); await reload(); }
    catch (err) { $('#si-err').textContent = err.message || 'Sign-in failed'; }
    finally { go.disabled = false; }
  };
  // the set-password door (Kevin, 15 Sep night): first time here, or forgot it
  const card = (id) => { for (const k of ['si-form', 'rc-form', 'sp-form']) $('#' + k).classList.toggle('hidden', k !== id); };
  $('#si-forgot').onclick = (e) => { e.preventDefault(); $('#rc-email').value = $('#si-email').value.trim(); card('rc-form'); $('#rc-err').textContent = ''; };
  $('#rc-back').onclick = (e) => { e.preventDefault(); card('si-form'); };
  $('#rc-form').onsubmit = async (e) => {
    e.preventDefault();
    const go = $('#rc-go'); go.disabled = true; $('#rc-err').textContent = '';
    try { await api.recover($('#rc-email').value.trim()); $('#rc-err').style.color = 'var(--verify)'; $('#rc-err').textContent = 'Sent. Open the email on this device and tap the link — it works for 24 hours.'; }
    catch (err) { $('#rc-err').style.color = ''; $('#rc-err').textContent = err.message || 'Could not send the link'; go.disabled = false; }
  };
  $('#sp-form').onsubmit = async (e) => {
    e.preventDefault();
    const a = $('#sp-pass').value, b = $('#sp-pass2').value; $('#sp-err').textContent = '';
    if (a.length < 6) { $('#sp-err').textContent = 'Six characters or more.'; return; }
    if (a !== b) { $('#sp-err').textContent = 'Those two do not match.'; return; }
    const go = $('#sp-go'); go.disabled = true;
    try { await api.setPassword(a); showApp(); await reload(); startAlerts(); toast('Password saved. You are in.'); }
    catch (err) { $('#sp-err').textContent = err.message || 'Could not save it'; go.disabled = false; }
  };
  wireFind();
  window.__tour = startTour;
  // ?room=photos (or any room the seat has) opens there — the deck and the visuals link straight into a room
  const wantRoom = (/[?&]room=([a-z]+)/.exec(location.search) || [])[1];
  const wantFile = (/[?&]file=([A-Za-z0-9-]+)/.exec(location.search) || [])[1];   // &file=<customer id> opens that file beside the room
  const openWanted = () => { if (wantRoom && rooms().includes(wantRoom)) go(wantRoom); if (wantFile) setTimeout(() => window.__peek && window.__peek(wantFile), 500); };
  if (isDemo()) { showApp(); await reload(true); openWanted(); toast('Demo — a fictional book, nothing is saved'); startAlerts(); if (tourWanted()) setTimeout(startTour, 600); return; }
  // arrived from the one-time link in the welcome / reset email → choose a password first
  const fromLink = api.sessionFromHash();
  if (fromLink) { showSignIn(); card('sp-form'); $('#sp-pass').focus(); return; }
  if (api.loadSession()) { showApp(); await reload(true); openWanted(); startAlerts(); if (tourWanted()) setTimeout(startTour, 600); } else { showSignIn(); card('si-form'); }
}
boot();
