// Liberty Command — bootstrap: sign-in, the rooms a role opens, load, render.
import * as api from './api.js?v=6';
import { state, loadAll, isDemo, searchCustomers } from './book.js?v=6';
import { $, $$, html, raw, toast } from './ui.js?v=6';
import { ROOMS_BY_ROLE, ROOM_LABEL } from './config.js?v=6';
import { renderHome } from './home.js?v=6';
import { renderSales } from './sales.js?v=6';
import { renderMarketing } from './marketing.js?v=6';
import { renderOffice } from './office.js?v=6';
import { renderProduction } from './production.js?v=6';
import { renderFiles, openFile } from './file.js?v=6';

let view = 'home';
let loading = false;
const VIEWS = ['home', 'sales', 'marketing', 'office', 'production', 'files', 'file'];

export function rooms() {
  const role = state.me?.role || 'sales';
  return ROOMS_BY_ROLE[role] || ['files'];
}

export function go(v, arg) {
  view = v;
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
  const counts = { office: state.queue.length, production: state.board.filter((b) => b.stage === 'production' || b.stage === 'field_complete').length, home: state.clock.filter((c) => c.waiting_min >= 15).length + tagged };
  $('#tabs').innerHTML = r.map((k) => html`<button class="tab ${k === view || (view === 'file' && k === 'files') ? 'on' : ''}" data-view="${k}">${ROOM_LABEL[k]}${counts[k] ? raw(`<span class="n">${counts[k]}</span>`) : ''}</button>`).join('');
  $$('#tabs button').forEach((b) => (b.onclick = () => go(b.dataset.view)));
  for (const v of VIEWS) $('#view-' + v).classList.toggle('hidden', v !== view);
  if (view === 'home') renderHome($('#view-home'));
  if (view === 'sales') renderSales($('#view-sales'));
  if (view === 'marketing') renderMarketing($('#view-marketing'));
  if (view === 'office') renderOffice($('#view-office'));
  if (view === 'production') renderProduction($('#view-production'));
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
      pop.innerHTML = rows.length ? rows.map((c) => html`<button class="inv" style="text-align:left;grid-template-columns:1fr auto" data-id="${c.id}"><span><b>${c.name}</b></span><span class="mono dimmer">${c.phone || ''}</span></button>`).join('') : '<div class="empty">Nobody by that name or number</div>';
      pop.querySelectorAll('button[data-id]').forEach((b) => (b.onclick = () => { close(); box.value = ''; go('file', b.dataset.id); }));
      $('nav.side').appendChild(pop);
    }, 220);
  });
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); box.blur(); } });
  document.addEventListener('click', (e) => { if (pop && !pop.contains(e.target) && e.target !== box) close(); });
}

async function boot() {
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
