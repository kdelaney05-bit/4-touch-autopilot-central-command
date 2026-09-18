// THE ADDRESS THAT FILLS ITSELF IN (Samantha, 17 Sep — her first idea in the app: "when inputting a new lead, can it
// connect to Google Maps so it starts populating the street address?" Kevin: "green light, go go go").
//
// Two sources, one shape. With GOOGLE_MAPS_KEY in config.js the suggestions are Google's — Places API (New), biased to
// Brevard County, one session token per typing run so Google bills a session, not a call per keystroke. Without a key
// they come from OpenStreetMap through Photon (photon.komoot.io — free, no key, no sign-up): it knows the street, the
// city and the zip and often not the house number, so the number the office typed stays in front of the street it picked.
// Nothing about the customer goes anywhere: the query is the address being typed, that is all.
import { GOOGLE_MAPS_KEY } from './config.js?v=129';
import { esc } from './ui.js?v=129';

const HOME = { lat: 28.33, lon: -80.67 };   // Merritt Island — the middle of the book; a bias, not a fence
const key = () => (GOOGLE_MAPS_KEY || '').trim();
export const addressSource = () => (key() ? 'Google Maps' : 'OpenStreetMap');

let session = null;
const token = () => (session ||= (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())));

/* suggest(q) → [{ label, sub, street, city, zip, placeId }], at most 5. Never throws: a dead network is an empty list. */
export async function suggest(q) {
  q = (q || '').trim();
  if (q.length < 3) return [];
  try { return key() ? await google(q) : await photon(q); } catch { return []; }
}

/* pick(s, typed) → { street, city, zip }. Google's suggestions carry no parts until Place Details is read (one call per
   pick, which closes the session); Photon's carry what they have. `typed` is what the office typed: its leading house
   number wins when the suggestion has none. */
export async function pick(s, typed) {
  let out = { street: s.street || '', city: s.city || '', zip: s.zip || '' };
  if (s.placeId && key()) { try { out = await details(s.placeId); } catch {} finally { session = null; } }
  const num = /^\s*(\d+[a-z]?)\b/i.exec(typed || '')?.[1];
  if (num && out.street && !/^\d/.test(out.street)) out.street = num + ' ' + out.street;
  return out;
}

/* addressPicker(input, box, onPick) — the list under a street box. Three letters and 250 ms of quiet ask; ↑ ↓ move,
   Enter picks (or just closes the list — it never opens the file by accident), Esc closes the list and not the form,
   a click picks. onPick gets { street, city, zip }. */
export function addressPicker(input, box, onPick) {
  let t = null, rows = [], cur = -1, seq = 0;
  const close = () => { rows = []; cur = -1; box.innerHTML = ''; box.hidden = true; };
  const paint = () => {
    const typedNum = /^ *([0-9]+[a-z]?)(?=[^0-9a-z]|$)/i.exec(input.value || "")?.[1];   // Sam, 17 Sep: the list said Greenbrier Ave · 32958 for 934 Greenbrier — the number she typed rides the line, as it will ride the pick
    box.innerHTML = rows.map((r, i) => `<button type="button" class="sub${i === cur ? ' lit' : ''}" data-i="${i}"><b>${esc(typedNum && r.street && !/^[0-9]/.test(r.street) ? typedNum + ' ' + r.label : r.label)}</b>${r.sub ? `<span>${esc(r.sub)}</span>` : ''}</button>`).join('');
    box.hidden = !rows.length;
    box.querySelectorAll('button').forEach((b) => { b.onmousedown = (e) => e.preventDefault(); b.onclick = () => choose(Number(b.dataset.i)); });
  };
  const choose = async (i) => { const s = rows[i]; if (!s) return; const typed = input.value; close(); input.value = s.street || typed; onPick(await pick(s, typed)); };
  input.addEventListener('input', () => {
    clearTimeout(t); const q = input.value.trim(); if (q.length < 3) return close();
    const my = ++seq;
    t = setTimeout(async () => { const got = await suggest(q); if (my !== seq) return; rows = got; cur = -1; paint(); }, 250);
  });
  input.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'ArrowDown') { cur = (cur + 1) % rows.length; paint(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { cur = (cur - 1 + rows.length) % rows.length; paint(); e.preventDefault(); }
    else if (e.key === 'Enter') { e.preventDefault(); if (cur >= 0) choose(cur); else close(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  });
  input.addEventListener('blur', () => setTimeout(close, 150));
}

// ── Google — Places API (New). A browser key restricted to this site's referrer; it authorises these two calls only.
async function google(q) {
  const r = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key() },
    body: JSON.stringify({ input: q, sessionToken: token(), includedRegionCodes: ['us'], languageCode: 'en',
      locationBias: { circle: { center: { latitude: HOME.lat, longitude: HOME.lon }, radius: 80000 } } }) });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.suggestions || []).map((s) => s.placePrediction).filter(Boolean).slice(0, 5).map((p) => ({
    placeId: p.placeId, label: p.structuredFormat?.mainText?.text || p.text?.text || '', sub: p.structuredFormat?.secondaryText?.text || '' }));
}
async function details(placeId) {
  const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(token())}`, {
    headers: { 'X-Goog-Api-Key': key(), 'X-Goog-FieldMask': 'addressComponents,formattedAddress' } });
  if (!r.ok) throw new Error('place ' + r.status);
  const j = await r.json(); const c = {};
  for (const a of j.addressComponents || []) for (const t of a.types || []) c[t] ||= a.longText || a.shortText || '';
  const street = [c.street_number, c.route].filter(Boolean).join(' ') || (j.formattedAddress || '').split(',')[0];
  // Sam, 18 Sep: no county-level name as the city. The county rides beside it (407, Who's free: the rep's territory), never in the city box.
  return { street, city: c.locality || c.sublocality || c.postal_town || c.neighborhood || '', zip: c.postal_code || '', county: (c.administrative_area_level_2 || '').replace(/\s+county$/i, '') };
}

// ── OpenStreetMap through Photon — free, keyless, CORS-open; fenced to Florida (every book is here) and biased to home so
//    "Palm" means Palm Bay before Palm Coast, and "1463 Harbor" never means Dallas.
const FLORIDA = '-87.64,24.40,-79.97,31.01';   // bbox: west, south, east, north
async function photon(q) {
  const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${HOME.lat}&lon=${HOME.lon}&bbox=${FLORIDA}&limit=10&lang=en`);
  if (!r.ok) return [];
  const j = await r.json(); const seen = new Set(); const out = [];
  for (const f of j.features || []) {
    const p = f.properties || {};
    if (p.countrycode && p.countrycode !== 'US') continue;
    const streetName = p.osm_key === 'highway' ? p.name : p.street;   // a street, or a house on one — not a town, not a shop
    if (!streetName) continue;
    const street = [p.housenumber, streetName].filter(Boolean).join(' ');
    const city = p.city || p.town || p.village || '';   // Sam, 18 Sep: never the county or a district as the city ("Brevard County" on 3606 Egret Dr) — blank beats wrong; she types it
    const sub = [city, p.state === 'Florida' ? 'FL' : p.state, p.postcode].filter(Boolean).join(' · ');
    const k = (street + '|' + sub).toLowerCase(); if (seen.has(k)) continue; seen.add(k);
    out.push({ label: street, sub, street, city, zip: p.postcode || '' });
    if (out.length === 5) break;
  }
  return out;
}
