// Liberty Command — Supabase over plain fetch, the desk's rails verbatim (desk/js/api.js). Every call
// carries the publishable key plus the rep's own JWT, so RLS decides what
// comes back. Nothing here knows about the desk's screens.
import { SUPA_URL, SUPA_KEY, SESSION_KEY } from './config.js?v=105';

// ── session ───────────────────────────────────────────────────────────────────
let session = null;               // { token, refresh, repId, email, expiresAt }
const listeners = new Set();
export const onSession = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((fn) => { try { fn(session); } catch {} });

export const getSession = () => session;

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.token && s.refresh) session = s; }
  } catch {}
  return session;
}
function saveSession(s) {
  session = s;
  try { if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY); } catch {}
  emit();
}

const authHeaders = () => ({ apikey: SUPA_KEY, 'Content-Type': 'application/json' });

/* auth/v1/token?grant_type=password — supaSignIn in App.tsx, verbatim shape.
   reps.id IS the auth user id: that is how RLS binds a session to a book. */
export async function signIn(email, password) {
  const r = await fetch(SUPA_URL + '/auth/v1/token?grant_type=password', {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ email, password }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(j.error_description || j.msg || j.message || 'Sign-in failed');
  saveSession({ token: j.access_token, refresh: j.refresh_token, email,
                repId: j.user?.id ?? '', expiresAt: Date.now() + (j.expires_in ?? 3600) * 1000 });
  return session;
}

/* THE FIRST LOGIN (Kevin, 15 Sep night: "can we just create logins and
   passwords for everyone and send them out and keep everything locked up").
   Nobody's password ever passes through a person: the seat gets a one-time
   link (24 h), taps it, lands here with a recovery session in the URL hash,
   and chooses their own password. Forgot it later → the same door. */
export async function recover(email) {
  const redirect = location.origin + location.pathname;
  const r = await fetch(SUPA_URL + '/auth/v1/recover?redirect_to=' + encodeURIComponent(redirect), {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ email }),
  });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error_description || j.msg || j.message || 'Could not send the link'); }
  return true;
}
/* A recovery / invite / magic link lands with the session in the hash. Read it once, keep it, clean the address bar. */
export function sessionFromHash() {
  const h = location.hash || '';
  if (!/access_token=/.test(h)) return null;
  const p = new URLSearchParams(h.replace(/^#/, ''));
  const token = p.get('access_token'), refresh = p.get('refresh_token');
  if (!token) return null;
  let repId = '';
  try { repId = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub || ''; } catch {}
  saveSession({ token, refresh, email: '', repId, expiresAt: Date.now() + Number(p.get('expires_in') || 3600) * 1000 });
  const type = p.get('type') || 'recovery';
  history.replaceState(null, '', location.pathname + location.search);
  return { type };
}
export async function setPassword(password) {
  if (!session?.token) throw new Error('Open the link from your email first.');
  const r = await fetch(SUPA_URL + '/auth/v1/user', {
    method: 'PUT', headers: { ...authHeaders(), Authorization: 'Bearer ' + session.token }, body: JSON.stringify({ password }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error_description || j.msg || j.message || 'Could not set the password');
  if (j.email) saveSession({ ...session, email: j.email, repId: j.id || session.repId });
  return true;
}

/* SINGLE-FLIGHT refresh (App.tsx refreshOnce): Supabase rotates the refresh
   token on every use, so two refreshers racing burn each other's token. */
let refreshInFlight = null;
export function refreshOnce() {
  if (!refreshInFlight) refreshInFlight = doRefresh().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}
async function doRefresh() {
  if (!session) throw new Error('no session');
  const r = await fetch(SUPA_URL + '/auth/v1/token?grant_type=refresh_token', {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ refresh_token: session.refresh }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) { saveSession(null); throw new Error('session expired'); }
  saveSession({ ...session, token: j.access_token, refresh: j.refresh_token ?? session.refresh,
                expiresAt: Date.now() + (j.expires_in ?? 3600) * 1000 });
  return session;
}

export async function signOut() {
  const s = session;
  saveSession(null);
  if (s?.token) {
    try { await fetch(SUPA_URL + '/auth/v1/logout', { method: 'POST',
      headers: { ...authHeaders(), Authorization: 'Bearer ' + s.token } }); } catch {}
  }
}

/* A token that is not about to expire. Refreshes ahead of the edge so a long
   afternoon on the laptop never trips a 401 mid-save. */
async function freshToken() {
  if (!session) throw new Error('not signed in');
  if (Date.now() > session.expiresAt - 60_000) await refreshOnce();
  return session.token;
}

// ── REST ──────────────────────────────────────────────────────────────────────
async function call(method, path, body, extraHeaders = {}, retry = true) {
  const token = await freshToken();
  const r = await fetch(SUPA_URL + '/rest/v1/' + path, {
    method,
    headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', ...extraHeaders },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (r.status === 401 && retry) {           // one heal per call; a second 401 is real
    await refreshOnce();
    return call(method, path, body, extraHeaders, false);
  }
  return r;
}

export class ApiError extends Error {
  constructor(status, message, path) { super(message); this.status = status; this.path = path; }
}

async function fail(r, path) {
  let msg = r.status + ' ' + path.split('?')[0];
  try { const j = await r.json(); if (j?.message) msg = String(j.message); else if (j?.hint) msg = String(j.hint); } catch {}
  throw new ApiError(r.status, msg, path);
}

/* Paged select — supaPage in App.tsx. RLS scopes the rows; the Range header
   pages them 1000 at a time up to `cap`. Truncation is reported, never hidden. */
export async function page(path, cap = 5000) {
  const out = [];
  for (let from = 0; from < cap; from += 1000) {
    const r = await call('GET', path, undefined, { Range: from + '-' + (from + 999) });
    if (!r.ok) await fail(r, path);
    const rows = await r.json();
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  out.truncated = out.length >= cap;
  return out;
}

export async function one(path) {
  const rows = await page(path, 1000);
  return rows[0] ?? null;
}

/* An edge function, called as the seat: the rep's own JWT goes along, the
   function checks it with GoTrue. Used for the county lookup (parcel-lookup, 324). */
export async function fn(name, body) {
  const token = await freshToken();
  const r = await fetch(`${SUPA_URL}/functions/v1/${name}`, {
    method: 'POST', headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(r.status, j?.message || j?.error || (r.status + ' ' + name), name);
  return j;
}

export async function insert(table, row, representation = true) {
  const r = await call('POST', table, row, representation ? { Prefer: 'return=representation' } : {});
  if (!r.ok) await fail(r, table);
  if (!representation) return null;
  const rows = await r.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] ?? null : rows;
}

export async function patch(pathWithFilter, body) {
  const r = await call('PATCH', pathWithFilter, body, { Prefer: 'return=representation' });
  if (!r.ok) await fail(r, pathWithFilter);
  return r.json().catch(() => []);
}

export async function rpc(fn, args = {}) {
  const r = await call('POST', 'rpc/' + fn, args);
  if (!r.ok) await fail(r, 'rpc/' + fn);
  const text = await r.text();
  try { return text ? JSON.parse(text) : null; } catch { return text; }
}

/* DELETE with a filter — used for exactly one thing: unlinking a person from
   a bid (bid_people, 226). RLS decides; a filter that matches nothing is not
   an error, so the caller checks the returned count. */
export async function del(pathWithFilter) {
  const r = await call('DELETE', pathWithFilter, undefined, { Prefer: 'return=representation' });
  if (!r.ok) await fail(r, pathWithFilter);
  const rows = await r.json().catch(() => []);
  return Array.isArray(rows) ? rows.length : 0;
}

/* ── A SIGNED LINK INTO A PRIVATE BUCKET (328, the fence packet) ─────────────
   The calculator's material order, signed proposal, county packet and drawing
   sit in the private `estimates` bucket under the customer's id. The seat's
   own JWT asks storage to sign a ten-minute URL; the bucket's read policy
   (291: the book, or a manager) is what says yes or no. Never a public URL. */
export async function signUrl(bucket, path, expiresIn = 600) {
  const token = await freshToken();
  const p = String(path).split('/').map(encodeURIComponent).join('/');
  const r = await fetch(`${SUPA_URL}/storage/v1/object/sign/${bucket}/${p}`, {
    method: 'POST', headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.signedURL) throw new ApiError(r.status, j?.message || j?.error || 'This file could not be opened', 'sign/' + bucket);
  return SUPA_URL + '/storage/v1' + j.signedURL;
}

/* ── STORAGE (222's rep-uploads bucket) ───────────────────────────────────────
   A raw byte PUSH, not a REST row: the object API takes the body as-is with a
   Content-Type, so it never goes through `call`. RLS is the fence — the bucket
   policy `rep_uploads_insert_own` demands the FIRST path segment be the rep's
   own auth id, so a path this function did not build cannot be written. The
   caller gets the PUBLIC url back; nothing here decides what to do with it.

   A stall must SAY so rather than spin: the 75s cap is the phone's own (a
   laptop on hotel wifi is not so different from a phone in a field). */
export async function uploadPublic(bucket, path, blob, contentType) {
  const token = await freshToken();
  const ac = new AbortController();
  const kill = setTimeout(() => { try { ac.abort(); } catch {} }, 75_000);
  let r;
  try {
    r = await fetch(`${SUPA_URL}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + token, 'Content-Type': contentType },
      body: blob, signal: ac.signal,
    });
  } catch (e) {
    throw new ApiError(0, /abort/i.test(String(e?.name || e)) ? 'The upload timed out. Check the connection and try again.' : 'The upload could not start.', bucket);
  } finally { clearTimeout(kill); }
  if (!r.ok) await fail(r, 'storage/' + bucket);
  return `${SUPA_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/* 351: a public object's address (job-photos — uuid paths nobody can guess, rendered with a plain <img>) */
export const publicUrl = (bucket, path) => `${SUPA_URL}/storage/v1/object/public/${bucket}/${path}`;
