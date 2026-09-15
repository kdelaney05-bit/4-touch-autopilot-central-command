// Liberty Command — bootstrap: sign-in, the rooms a role opens, load, render.
import * as api from './api.js?v=41';
import { state, loadAll, isDemo, searchCustomers, createJob } from './book.js?v=41';
import { $, $$, html, raw, toast, esc, openModal } from './ui.js?v=41';
import { BRAND_BY_CC } from './config.js?v=41';
import { ROOMS_BY_ROLE, ROOM_LABEL } from './config.js?v=41';
import { renderSwitchboard } from './switchboard.js?v=41';
import { renderHome } from './home.js?v=41';
import { renderSales } from './sales.js?v=41';
import { renderPipeline } from './pipeline.js?v=41';
import { renderMarketing } from './marketing.js?v=41';
import { renderOffice } from './office.js?v=41';
import { renderProduction } from './production.js?v=41';
import { renderFiles, openFile, closeDrawer } from './file.js?v=41';
import { stopRoomPoll } from './village.js?v=41';
import { renderFlow, stopFlow } from './flow.js?v=41';

let view = 'line';   // the playground first (Kevin, 15 Sep): every seat signs in on The Line
let loading = false;
const VIEWS = ['line', 'home', 'sales', 'pipeline', 'marketing', 'office', 'production', 'flow', 'files', 'file'];

export function rooms() {
  const role = state.me?.role || 'sales';
  return ROOMS_BY_ROLE[role] || ['files'];
}

export function go(v, arg) {
  view = v;
  stopRoomPoll();                 // the room you are leaving stops talking to the database
  stopFlow();
  if (v !== 'file') closeDrawer();
  if (v === 'file' && arg) { openFile(arg).catch((e) => toast(e.message || 'Could not open the file', 'err')); }
  render();
  window.scrollTo({ top: 0 });
}
window.__go = go;   // the tables' onclick handlers

export function render() {
  const me = state.me;
  const r = rooms();
  if (!r.includes(view) && view !== 'file') view = r[0] || 'files';
  $('#nav-who').textContent = me ? `${me.name.split(' ')[0]} · ${me.role}` : '';
  $('#who-sub').textContent = isDemo() ? 'DEMO — nothing is saved' : (state.loadedAt ? 'loaded ' + state.loadedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '');
  const tagged = (state.mentions || []).filter((m) => !m.seen_at).length;
  const counts = { line: state.clock.filter((c) => c.waiting_min >= 60).length + tagged, office: state.queue.length, production: state.board.filter((b) => b.stage === 'production' || b.stage === 'field_complete').length, home: state.clock.filter((c) => c.waiting_min >= 15).length + tagged };
  $('#tabs').innerHTML = r.map((k) => html`<button class="tab ${k === view || (view === 'file' && k === 'files') ? 'on' : ''}" data-view="${k}">${ROOM_LABEL[k]}${counts[k] ? raw(`<span class="n">${counts[k]}</span>`) : ''}</button>`).join('');
  $$('#tabs button').forEach((b) => (b.onclick = () => go(b.dataset.view)));
  for (const v of VIEWS) $('#view-' + v).classList.toggle('hidden', v !== view);
  if (view === 'line') renderSwitchboard($('#view-line'));
  if (view === 'home') renderHome($('#view-home'));
  if (view === 'sales') renderSales($('#view-sales'));
  if (view === 'pipeline') renderPipeline($('#view-pipeline'));
  if (view === 'marketing') renderMarketing($('#view-marketing'));
  if (view === 'office') renderOffice($('#view-office'));
  if (view === 'production') renderProduction($('#view-production'));
  if (view === 'flow') renderFlow($('#view-flow'));
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
  const close = () => { pop?.remove(); pop = null; };
  box.addEventListener('input', () => {
    clearTimeout(findTimer);
    findTimer = setTimeout(async () => {
      const q = box.value.trim();
      close();
      if (q.length < 2) return;
      let rows = [];
      try { rows = await searchCustomers(q); } catch (e) { toast(e.message, 'err'); return; }
      pop = document.createElement('div');
      pop.className = 'card';
      pop.style.cssText = 'position:absolute;right:40px;top:58px;width:360px;z-index:9;padding:8px;gap:2px;box-shadow:0 20px 50px rgba(0,0,0,.15)';
      pop.innerHTML = rows.length ? rows.map((c) => html`<button class="inv findrow" style="text-align:left;grid-template-columns:1fr auto auto;cursor:pointer" data-id="${c.id}"><span><b>${c.name}</b></span><span class="mono dimmer">${c.phone || ''}</span><span class="chip">OPEN THE FILE ›</span></button>`).join('') : '<div class="empty">Nobody by that name or number</div>';
      pop.querySelectorAll('button[data-id]').forEach((b) => (b.onclick = () => { close(); box.value = ''; window.__peek(b.dataset.id); }));
      $('nav.side').appendChild(pop);
    }, 220);
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { close(); box.blur(); }
    if (e.key === 'Enter') { const first = pop?.querySelector('button[data-id]'); if (first) first.click(); }   // Enter opens the top match
  });
  document.addEventListener('click', (e) => { if (pop && !pop.contains(e.target) && e.target !== box) close(); });
}

/* The New Job door — customer + job (+ appointment, + signing) in one call.
   Built beside Contractors Cloud: a job made here lives here; nothing in CC
   changes. The office keeps its CC habit until Kevin moves them. */
function newJob() {
  const me = state.me || {};
  const brands = Object.entries(BRAND_BY_CC);
  const sellers = state.sellers || [];
  const canPickRep = me.role !== 'sales';
  const srcFor = (cc) => (state.leadSources || []).filter((s) => s.cc_company_id === cc);
  const srcOpts = (cc) => '<option value="">— how they found us —</option>' + srcFor(cc).map((s) => `<option value="${esc(s.name)}">${esc(s.name)}</option>`).join('');
  openModal({ title: 'New job', submitLabel: 'Open the file', wide: true, body: `
    <div class="two">
      <div class="field"><label>Brand</label><select name="cc">${brands.map(([cc, b]) => `<option value="${cc}" ${cc === (me.manages_company_id || '1461') ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Sold by</label>${canPickRep ? `<select name="rep"><option value="">— pick the rep —</option>${sellers.map((s) => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select>` : `<input value="${esc(me.name || '')}" disabled/>`}</div>
    </div>
    <div class="two">
      <div class="field"><label>Customer name</label><input name="name" required placeholder="Last, First — or the household"/></div>
      <div class="field"><label>Mobile</label><input name="phone" placeholder="(321) 555-0100"/></div>
    </div>
    <div class="two">
      <div class="field"><label>Email</label><input name="email" type="email"/></div>
      <div class="field"><label>Job</label><input name="title" placeholder="6' vinyl privacy, 210 ft"/></div>
    </div>
    <div class="two">
      <div class="field"><label>Lead source · the same list as Contractors Cloud</label><select name="src">${srcOpts(me.manages_company_id || '1461')}</select></div>
      <div class="field"></div>
    </div>
    <div class="two">
      <div class="field"><label>Street</label><input name="street"/></div>
      <div class="field"><label>City · zip</label><div style="display:flex;gap:6px"><input name="city" placeholder="Cocoa"/><input name="zip" placeholder="32922" style="width:110px"/></div></div>
    </div>
    <div class="two">
      <div class="field"><label>Estimate appointment (optional)</label><input name="appt" type="datetime-local"/></div>
      <div class="field"><label>Signed today for (optional)</label><input name="amount" type="number" step="0.01" min="0" placeholder="leave blank if not signed yet"/></div>
    </div>
    <div class="field"><label>Note to the team (optional)</label><input name="note" placeholder="gate code 2021 · HOA approval needed · call before 8"/></div>
    <div class="note">Same phone number = same customer: their file keeps its history. A signed amount opens the paperwork checklist for the office. An appointment sends the confirmation text if that switch is on.</div>`,
    onOpen: (f) => { f.cc.onchange = () => { f.src.innerHTML = srcOpts(f.cc.value); }; },
    onSubmit: async (f) => {
      const amount = f.amount.value ? Number(f.amount.value) : null;
      const r = await createJob({ p_cc_company: f.cc.value, p_name: f.name.value.trim(), p_phone: f.phone.value.trim() || null, p_email: f.email.value.trim() || null,
        p_street: f.street.value.trim() || null, p_city: f.city.value.trim() || null, p_zip: f.zip.value.trim() || null,
        p_rep: canPickRep ? (f.rep.value || null) : null, p_title: f.title.value.trim() || null,
        p_appt_at: f.appt.value ? new Date(f.appt.value).toISOString() : null,
        p_amount: amount, p_signed_at: amount ? new Date().toISOString() : null, p_lead_source: f.src.value || null, p_note: f.note.value.trim() || null });
      toast('The file is open' + (amount ? ' · paperwork checklist opened for the office' : ''));
      await reload(true);
      window.__peek(r.customer_id);
    } });
}

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
  wireFind();
  if (isDemo()) { showApp(); await reload(true); toast('Demo — a fictional book, nothing is saved'); return; }
  if (api.loadSession()) { showApp(); await reload(true); } else showSignIn();
}
boot();
