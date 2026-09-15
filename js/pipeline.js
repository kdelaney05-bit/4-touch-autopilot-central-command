// The Pipeline — every rep's book, broken down (Kevin, 14 Sep: "I can't see
// pipeline… it just has everything. It doesn't have Gio's and each one broken
// down"). The stage board only knows sold customers; this room reads the
// selling side too, the way the rep app files it: a customer is a new lead,
// booked and ahead of the rep, visited and in the 4-Touch, priced and waiting
// on yes or no, signed, or lost. Pick a rep, see their book by stage, tap a
// customer and the file opens beside you. Every number comes from live rows
// the seat can read, counted once, and says its window.
import { state, personName, firstName } from './book.js?v=60';
import { html, raw, esc } from './ui.js?v=60';
import { brandName } from './config.js?v=60';

let rep = 'all';
let brand = 'all';

export const PIPE_STAGES = [
  ['lead',        'New leads',             'no appointment yet',              'var(--dimmer)'],
  ['appointment', 'Upcoming appointments', 'booked, ahead of the rep',        'var(--gold)'],
  ['touches',     'In touches',            'visited · the 4-Touch, 72 hours', 'var(--clock)'],
  ['estimate',    'Estimate out',          'priced · until yes or no',        'var(--office)'],
  ['signed',      'Signed · 60 days',      'the bell rang',                   'var(--verify)'],
  ['lost',        'Lost',                  'a no clears the board',           'var(--red)'],
];
const money = (n) => n ? '$' + Math.round(Number(n)).toLocaleString() : '';
const day = (iso) => iso ? new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : '';
const clockTime = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';

/* One row per customer, the rep app's own stage law (App.tsx liveCustomerToDayItem):
   signed wins over lost; lost wins over the rest; a booking still ahead is an
   appointment; a visit that ran is the rep's active work, in touches; nothing
   booked is a lead. This room can also see estimates, so a priced customer
   sits in Estimate out until the file says yes or no. */
export function pipelineRows() {
  const byCust = new Map();
  for (const j of state.pipeline || []) { if (!byCust.has(j.customer_id)) byCust.set(j.customer_id, []); byCust.get(j.customer_id).push(j); }
  const est = new Map();
  for (const e of state.estimates || []) { const cur = est.get(e.customer_id); if (!cur || String(e.occurred_at) > String(cur.occurred_at)) est.set(e.customer_id, e); }
  const clock = new Map((state.clock || []).map((c) => [c.customer_id, c]));
  const who = new Map((state.people || []).map((p) => [p.id, p.name]));
  // the last time anybody worked this customer — a touch of any channel (90 days)
  const lastTouch = new Map();
  for (const t of state.touches || []) { const cur = lastTouch.get(t.customer_id); if (!cur || String(t.occurred_at) > cur) lastTouch.set(t.customer_id, t.occurred_at); }
  const rows = [];
  for (const [cid, jobs] of byCust) {
    const when = (j) => String(j.contract_signed_at || j.appt_starts_at || j.created_at || '');
    const latest = jobs.slice().sort((a, b) => when(b).localeCompare(when(a)))[0];
    const signed = jobs.filter((j) => j.contract_signed_at).sort((a, b) => String(b.contract_signed_at).localeCompare(String(a.contract_signed_at)))[0];
    const c = latest.customers || {};
    const e = est.get(cid);
    const apptMs = latest.appt_starts_at ? new Date(latest.appt_starts_at).getTime() : null;
    const priced = e && (apptMs == null || new Date(e.occurred_at).getTime() >= apptMs - 6 * 3600e3);
    const stage = signed ? 'signed' : c.disposition === 'lost' ? 'lost' : priced ? 'estimate' : apptMs != null && apptMs > Date.now() ? 'appointment' : apptMs != null ? 'touches' : 'lead';
    rows.push({ customer_id: cid, name: c.name || latest.title || 'Unnamed', city: c.city || null, rep_id: latest.rep_id, rep_name: who.get(latest.rep_id) || null,
                cc: latest.cc_company_id, stage, title: latest.title, appt_at: latest.appt_starts_at, signed_at: signed?.contract_signed_at || null,
                amount: signed ? Number(signed.fin_sold_amount || 0) : e ? Number(e.amount || 0) : 0, est_at: e?.occurred_at || null, clock: clock.get(cid) || null,
                last_touch: lastTouch.get(cid) || null, lost_at: c.disposition_at || null });
  }
  return rows;
}

/* The line under a customer: where they are in the 4-Touch, or when the
   appointment is, or what was signed. Gospel 14: inside 72 hours, every
   appointment. Gospel 15: a no is as good as a yes. */
function line(r) {
  const now = Date.now();
  if (r.stage === 'appointment') return { t: `${day(r.appt_at)} · ${clockTime(r.appt_at)}`, due: false };
  if (r.stage === 'touches') {
    const h = (now - new Date(r.appt_at).getTime()) / 3600e3;
    if (h < 6) return { t: `Visited ${Math.round(h)} h ago · Touch 2, thank you, due`, due: true };
    if (h < 24) return { t: `Visited ${Math.round(h)} h ago · Touch 3, sneak back in`, due: true };
    if (h < 48) return { t: `Visited ${Math.round(h / 24 * 10) / 10} d ago · Touch 4, promo, before they decide`, due: true };
    if (h <= 72) return { t: `Visited ${Math.round(h / 24 * 10) / 10} d ago · D-Day, ask before they decide`, due: true };
    return { t: `Visited ${Math.round(h / 24)} d ago · until yes or no`, due: false };
  }
  if (r.stage === 'estimate') return { t: `${money(r.amount)} estimate · ${Math.round((now - new Date(r.est_at).getTime()) / 86400e3)} d out`, due: false };
  if (r.stage === 'signed') return { t: `Signed ${day(r.signed_at)} · ${money(r.amount)}`, due: false };
  if (r.stage === 'lost') return { t: 'Lost · off the board', due: false };
  return { t: r.title ? String(r.title).slice(0, 48) : 'No appointment yet', due: false };
}

/* THE PIE (Kevin, 15 Sep: "how big his pie is in play of bids out to sell,
   and how big his pie is that he hasn't really sold… is he cleaning his pie
   up, is he working his pie"). One band per rep: the dollars he has priced
   and not yet heard yes or no on, split by when he last worked each one —
   working it (touched inside 7 days), cooling (8–21), unworked (longer, or
   never). Beside it, what he decided in 60 days (signed vs lost) and what
   share of those decided dollars he won (144's law: dollars, not counts).
   Under it, what the owed law (143) says he still owes an answer on: priced
   more than 60 days ago, no yes and no no. Language law: unworked, never a
   failure word. */
const moneyK = (n) => !n ? '$0' : Math.abs(n) >= 1e6 ? '$' + (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M' : Math.abs(n) >= 1000 ? '$' + Math.round(n / 1000) + 'K' : '$' + Math.round(n);
function pieOf(rows) {
  const now = Date.now(), d = (iso) => iso ? (now - new Date(iso).getTime()) / 86400e3 : null;
  const est = rows.filter((r) => r.stage === 'estimate');
  const cut = (r) => { const a = d(r.last_touch); return a == null ? 'unworked' : a <= 7 ? 'working' : a <= 21 ? 'cooling' : 'unworked'; };
  const seg = (k) => { const list = est.filter((r) => cut(r) === k); return { k, n: list.length, $: list.reduce((a, r) => a + r.amount, 0) }; };
  const signed = rows.filter((r) => r.stage === 'signed'), lost = rows.filter((r) => r.stage === 'lost' && d(r.lost_at) != null && d(r.lost_at) <= 60);
  const signed$ = signed.reduce((a, r) => a + r.amount, 0), lost$ = lost.reduce((a, r) => a + r.amount, 0);
  return {
    n: est.length, $: est.reduce((a, r) => a + r.amount, 0),
    working: seg('working'), cooling: seg('cooling'), unworked: seg('unworked'),
    owed: est.filter((r) => d(r.est_at) > 60), signed, signed$, lost, lost$,
    winShare: signed$ + lost$ > 0 ? Math.round(signed$ / (signed$ + lost$) * 100) : null,
    ahead: rows.filter((r) => r.stage === 'appointment').length, visited: rows.filter((r) => r.stage === 'touches').length, leads: rows.filter((r) => r.stage === 'lead').length,
    waiting: rows.filter((r) => r.clock && r.clock.waiting_min >= 15).length,
  };
}
function pieHtml(p, name, repId) {
  const segs = [['working', 'working it · touched inside 7 days', 'var(--verify)'], ['cooling', 'cooling · 8 to 21 days since a touch', 'var(--goldbtn)'], ['unworked', 'unworked · longer than 3 weeks, or never', 'var(--faint)']];
  const stack = p.$ ? segs.map(([k, , c]) => { const s = p[k]; const w = Math.round(s.$ / p.$ * 100); return s.$ ? `<span style="width:${w}%;background:${c}" title="${esc(k)} · ${esc(moneyK(s.$))} · ${s.n}">${w >= 14 ? moneyK(s.$) : ''}</span>` : ''; }).join('') : '<span class="none">nothing priced and open</span>';
  const legend = segs.map(([k, label, c]) => `<span><i style="background:${c}"></i>${esc(label)} <b>${esc(moneyK(p[k].$))}</b> · ${p[k].n}</span>`).join('');
  const decided = p.winShare == null ? `<span class="dimmer">nothing decided in 60 days</span>` : `signed <b class="verify">${esc(moneyK(p.signed$))}</b> · ${p.signed.length} &nbsp; lost <b>${esc(moneyK(p.lost$))}</b> · ${p.lost.length} &nbsp; wins <b>${p.winShare}%</b> of the dollars decided`;
  return `<div class="pie" ${repId ? `data-rep="${esc(repId)}"` : ''}>
    <div class="pie-head"><div><b>${esc(name)}</b> <span class="small">${p.n} estimate${p.n === 1 ? '' : 's'} out · <b class="mono">${esc(moneyK(p.$))}</b> in play</span></div><div class="small">${decided}</div></div>
    <div class="stack">${stack}</div>
    <div class="pie-legend">${legend}</div>
    <div class="small">${p.owed.length ? `<b class="clock">${p.owed.length} priced more than 60 days ago, no yes and no no · ${esc(moneyK(p.owed.reduce((a, r) => a + r.amount, 0)))}</b> &nbsp;·&nbsp; ` : ''}${p.ahead} appointment${p.ahead === 1 ? '' : 's'} ahead &nbsp;·&nbsp; ${p.visited} visited, no price on file &nbsp;·&nbsp; ${p.leads} new lead${p.leads === 1 ? '' : 's'}${p.waiting ? ` &nbsp;·&nbsp; <b class="red">${p.waiting} texted and waiting</b>` : ''}</div>
  </div>`;
}

export function renderPipeline(root) {
  const all = pipelineRows();
  const open = (r) => r.stage !== 'signed' && r.stage !== 'lost';
  const reps = [...new Map(all.filter((r) => r.rep_id).map((r) => [r.rep_id, r.rep_name || 'Unnamed rep'])).entries()]
    .map(([id, name]) => ({ id, name, n: all.filter((r) => r.rep_id === id && open(r)).length, signed: all.filter((r) => r.rep_id === id && r.stage === 'signed').length }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  const brands = [...new Set(all.map((r) => r.cc).filter(Boolean))];
  if (rep !== 'all' && !reps.some((x) => x.id === rep)) rep = 'all';
  const rows = all.filter((r) => (rep === 'all' || r.rep_id === rep) && (brand === 'all' || r.cc === brand));
  const by = (s) => rows.filter((r) => r.stage === s).sort((a, b) => (b.clock?.waiting_min || 0) - (a.clock?.waiting_min || 0) || String(b.appt_at || b.signed_at || '').localeCompare(String(a.appt_at || a.signed_at || '')));
  const repName = rep === 'all' ? 'every rep' : (reps.find((x) => x.id === rep)?.name || '');
  const openN = rows.filter(open).length, signedN = by('signed').length, signed$ = by('signed').reduce((a, r) => a + r.amount, 0);

  root.innerHTML = html`
    <div class="head">
      <div><div class="kicker">Pipeline · ${esc(repName)} · the selling side of the book, by stage · last 90 days of appointments, 60 days of signings</div>
        <h1 class="serif">${openN} customer${openN === 1 ? '' : 's'} in play. ${signedN} signed, ${esc(money(signed$) || '$0')}.</h1></div>
      <div class="right subs">${raw(brands.map((cc) => `<button class="sub ${brand === cc ? 'on' : ''}" data-brand="${esc(cc)}">${esc(brandName(cc))}</button>`).join(''))}<button class="sub ${brand === 'all' ? 'on' : ''}" data-brand="all">All brands</button></div>
    </div>
    <div class="card" style="padding:10px 14px">
      <div class="subs">
        <span class="kicker" style="margin-right:4px">Whose book</span>
        <button class="sub ${rep === 'all' ? 'on' : ''}" data-rep="all">Everyone · ${all.filter(open).length}</button>
        ${raw(reps.map((x) => `<button class="sub ${rep === x.id ? 'on' : ''}" data-rep="${esc(x.id)}" title="${esc(x.name)} · ${x.n} in play · ${x.signed} signed">${esc(firstName(x.name))} · ${x.n}${x.signed ? ' <span class="mono" style="color:var(--verify)">+' + x.signed + '</span>' : ''}</button>`).join(''))}
      </div>
    </div>
    <div class="kicker" style="margin:14px 0 6px">The pie · what each rep has priced and is waiting to hear on, by when he last worked it${brand !== 'all' ? ' · ' + esc(brandName(brand)) : ''}</div>
    <div class="pies">${raw(rep === 'all'
      ? reps.map((x) => ({ x, p: pieOf(all.filter((r) => r.rep_id === x.id && (brand === 'all' || r.cc === brand))) })).sort((a, b) => b.p.$ - a.p.$).map(({ x, p }) => pieHtml(p, x.name, x.id)).join('')
      : pieHtml(pieOf(rows), repName, null))}</div>
    <div class="pipe">
      ${raw(PIPE_STAGES.map(([s, label, sub, color]) => {
        const list = by(s); const $ = list.reduce((a, r) => a + r.amount, 0);
        return `<div class="pcol" style="--c:${color}">
          <div class="ph"><div><div class="kicker">${esc(label)}</div><div class="small">${esc(sub)}</div></div><div class="n">${list.length}${(s === 'estimate' || s === 'signed') && $ ? `<div class="small mono">${esc(money($))}</div>` : ''}</div></div>
          ${list.length ? list.slice(0, 60).map((r) => { const l = line(r); const w = r.clock && r.clock.waiting_min >= 15 ? r.clock : null; return `<button class="pcard" data-cust="${esc(r.customer_id)}" title="Open the file">
              <b>${esc(personName(r.name))}</b>
              <span class="s">${esc([r.city, brandName(r.cc), rep === 'all' && r.rep_name ? firstName(r.rep_name) : ''].filter(Boolean).join(' · '))}</span>
              <span class="t ${l.due ? 'due' : ''}">${esc(l.t)}</span>
              ${w ? `<span class="clock">Texted ${Math.round(w.waiting_min >= 1440 ? w.waiting_min / 1440 : w.waiting_min >= 60 ? w.waiting_min / 60 : w.waiting_min)}${w.waiting_min >= 1440 ? ' d' : w.waiting_min >= 60 ? ' h' : ' min'} ago, no answer · "${esc(String(w.body || '(photo)').slice(0, 60))}"</span>` : ''}
            </button>`; }).join('') + (list.length > 60 ? `<div class="small">and ${list.length - 60} more · pick a rep to see them all</div>` : '') : '<div class="small dimmer">Nobody here.</div>'}
        </div>`; }).join(''))}
    </div>
    <div class="small" style="margin-top:8px">Stages follow the rep app's own rule: signed beats lost; a booking still ahead is an appointment; a visit that ran is in touches; a price on file is an estimate out. Tap a customer to open the file beside you. Counted once from jobs, estimates and the text clock the moment this room opened${state.loadedAt ? ' · ' + esc(state.loadedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })) : ''}.</div>`;

  root.querySelectorAll('[data-rep]').forEach((b) => (b.onclick = () => { rep = b.dataset.rep; renderPipeline(root); window.scrollTo({ top: 0 }); }));
  root.querySelectorAll('[data-brand]').forEach((b) => (b.onclick = () => { brand = b.dataset.brand; renderPipeline(root); }));
  root.querySelectorAll('.pcard').forEach((b) => (b.onclick = () => window.__peek(b.dataset.cust)));
}
