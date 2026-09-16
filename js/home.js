// The Business — page one.
//
// Kevin, 15 Sep 2026: "the only things important are sales and jobs to be
// built and collected… how many have we sold, how many can we build, how many
// are waiting to be built, how many have we built, how many can we invoice,
// how many invoices have we collected… full clarity on page one… if I didn't
// say it, I wouldn't want to know it." Then, an hour later: "I love it… break
// down what we have to build… the health of each company, for the month, the
// quarter, the year, how it's trending — we try to do 1.2 a month, this last
// 30 days we've only invoiced 1 million, we're down 20%, I wouldn't have seen
// that… do it by company, separated, not consolidated. Don't muddy it up."
//
// So: three ledgers in his order (SALES · JOBS TO BUILD · COLLECTED), then one
// band per company — health against its OWN recent pace (the rhythm law: the
// last 1–4 months, never last year), the backlog broken into what it waits on,
// and the owed money aged. Bars where the number is an amount (the tops of
// mountains); a figure beside its denominator where it is not. Every ledger
// names its source — CC PULL · LIVE DB · QB PULL · NO FEED YET — and a figure
// with no live source reads honestly absent. Sources are never blended;
// nothing is projected into an actual. Costs and profit have no feed yet and
// say so.
import * as api from './api.js?v=75';
import { state, isDemo, personName } from './book.js?v=75';
import { html, raw, esc } from './ui.js?v=75';
import { STAGES, STAGE_LINE_DAYS, BRAND_BY_CC, brandName, stageLabel } from './config.js?v=75';
import { renderRoom } from './village.js?v=75';

const money = (n) => n == null ? '—' : '$' + Math.round(Number(n)).toLocaleString();
const moneyK = (n) => n == null ? '—' : Math.abs(n) >= 1e6 ? '$' + (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M' : Math.abs(n) >= 1000 ? '$' + Math.round(n / 1000) + 'K' : '$' + Math.round(n);
const mins = (m) => m == null ? '' : m >= 1440 ? (m / 1440).toFixed(1) + ' d' : m >= 60 ? (m / 60).toFixed(1) + ' h' : Math.round(m) + ' min';
const overLine = (b) => b.days_in_stage != null && b.days_in_stage > (STAGE_LINE_DAYS[b.stage] ?? 99);
const sum = (rows, f) => rows.reduce((a, r) => a + Number(f(r) || 0), 0);
const day = (n) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
const iso = (d) => d.toISOString();
const ymd = (d) => { const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const daysBetween = (a, b) => Math.round((new Date(a) - new Date(b)) / 864e5);
const BRANDS = Object.keys(BRAND_BY_CC);
const src = (kind, note) => `<span class="src ${kind === 'NO FEED YET' || kind === 'NO READ' ? 'none' : ''}" title="${esc(note || '')}">${esc(kind)}</span>`;
const fig = (n, l, cls = '', extra = '') => `<div class="fig"><div class="n ${cls}">${n}</div><div class="l">${esc(l)}</div>${extra}</div>`;
// "Compared to what?" (Kevin, 15 Sep): one quiet line under a figure — its
// usual over the company's OWN recent rhythm (the last 1–4 months, never last
// year), and on pace / up / down. Within ten percent is on pace. No usual, no
// line — a comparison against nothing is noise.
const cmp = (now, usual, isMoney = false, what = 'usual') => {
  if (now == null || usual == null || !(usual > 0)) return '';
  const pct = Math.round((now - usual) / usual * 100);
  const cls = pct <= -10 ? 'down' : pct >= 10 ? 'up' : '';
  const f = (v) => isMoney ? moneyK(v) : String(Math.round(v));
  return `<div class="cmp ${cls}">${esc(what)} ${f(usual)} · ${cls ? (pct > 0 ? 'up ' : 'down ') + Math.abs(pct) + '%' : 'on pace'}</div>`;
};
const nOf = (v, small) => v == null ? '<span class="dimmer">—</span>' : `${v}${small ? ` <small>${esc(small)}</small>` : ''}`;
const rowline = (label, n, cls = '') => `<div class="r"><span>${label}</span><span class="mono ${cls}">${n}</span></div>`;

// Bars on a shared zero baseline, the number on the bar (Kevin, 16 Aug: "we
// see the top of the bar which is all that matters"). Only for amounts.
function bars(rows, { isMoney = true, color = 'var(--goldsoft)', keepOrder = false, compact = false } = {}) {
  rows = keepOrder ? rows.filter((r) => r.v != null) : rows.filter((r) => r.v > 0).sort((a, b) => b.v - a.v);
  if (!rows.length) return '<div class="note">Nothing in this window.</div>';
  const max = Math.max(1, ...rows.map((r) => r.v));
  const vals = rows.map((r) => r.v).filter((v) => v > 0).sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)] || 0;
  const lump = !keepOrder && rows.length >= 3 && max > 4.5 * med ? `<div class="note">One ${esc(rows[0].k)} is most of this picture — the rest read small beside it, not because they are.</div>` : '';
  const fmt = (v) => isMoney ? (compact ? moneyK(v) : money(v)) : v;
  return `<div class="bars">${rows.map((r) => `<div class="brow ${compact ? 'compact' : ''}"><span class="lbl" title="${esc(r.k)}">${esc(r.k)}</span><div class="bar ${r.cls || ''}" style="width:${Math.max(3, Math.round(r.v / max * 100))}%;background:${r.color || color}"><b>${fmt(r.v)}${r.sub ? ` <span class="dimmer">· ${esc(r.sub)}</span>` : ''}</b></div></div>`).join('')}</div>${lump}`;
}

async function loadLedgers() {
  if (isDemo()) return { demo: true };
  const t0 = day(0), t7 = day(7), m120 = day(-120);
  const jan1 = new Date(t0.getFullYear(), 0, 1);
  // 120 days back on leads and appointments: the last 30 are the figure, the 90 before are its "usual"
  const [sold, leads, appts, wos, crews, qb, sigs, accepts, mats, pnl] = await Promise.all([
    api.page(`sale_fact?select=job_id,rep_id,cc_company_id,sold_at,amount&sold_at=gte.${ymd(jan1)}&order=sold_at.desc&limit=8000`, 8000).catch(() => null),
    api.page(`jobs?select=id,cc_company_id,created_at&created_at=gte.${iso(m120)}&order=created_at.desc&limit=8000`, 8000).catch(() => null),
    api.page(`appointment_rep_truth?select=cc_company_id,starts_at,cc_created_at,is_cancelled,rep_name&starts_at=gte.${iso(m120)}&starts_at=lt.${iso(t7)}&order=starts_at.desc&limit=8000`, 8000).catch(() => null),
    api.page('cc_work_orders?select=job_id,cc_company_id,crew_id,is_complete,install_starts_at,number&limit=2000', 2000).catch(() => null),
    api.page('cc_crews?select=cc_crew_id,name,color&is_active=eq.true&order=name', 200).catch(() => null),
    api.page(`qb_invoices?select=cc_company_id,txn_date,due_date,total_amt,balance,reporting_excluded&txn_date=gte.${ymd(jan1)}&order=txn_date.desc&limit=8000`, 8000).catch(() => null),
    api.page('customer_signatures?select=customer_id,job_id,signed_at,signer_name&order=signed_at.desc&limit=200', 200).catch(() => null),
    api.page('estimate_docs?select=customer_id,job_id,total,accepted_at&accepted_at=not.is.null&order=accepted_at.desc&limit=200', 200).catch(() => null),
    api.page('cc_material_orders?select=job_id,delivery_at,submitted_at&limit=2000', 2000).catch(() => null),
    // 345: QuickBooks' own P&L per company per month (absent until the migration lands — then it just appears)
    api.page(`v_company_pnl?select=cc_company_id,period_start,period_end,total_income,cogs,gross_profit,total_expenses,net_income,book_close_date,approved,state,synced_at&basis=eq.Accrual&period_start=gte.${ymd(jan1)}&order=period_start.desc&limit=100`, 100).catch(() => null),
  ]);
  // committed = the customer said yes on OUR link (accepted or signed) and CC does not carry the signing yet
  let committed = null;
  const yes = [...(sigs || []).map((s) => ({ job_id: s.job_id, customer_id: s.customer_id, at: s.signed_at, who: s.signer_name })), ...(accepts || []).map((a) => ({ job_id: a.job_id, customer_id: a.customer_id, at: a.accepted_at, total: a.total }))];
  if (sigs || accepts) {
    const ids = [...new Set(yes.map((y) => y.job_id).filter(Boolean))];
    const rows = ids.length ? await api.page(`jobs?select=id,customer_id,cc_company_id,contract_signed_at,fin_sold_amount,customers(name)&id=in.(${ids.join(',')})`, 500).catch(() => []) : [];
    const seen = new Set();
    committed = rows.filter((j) => !j.contract_signed_at && !seen.has(j.id) && seen.add(j.id)).map((j) => ({ ...j, yes: yes.filter((y) => y.job_id === j.id).sort((a, b) => new Date(b.at) - new Date(a.at))[0] }));
  }
  return { sold, leads, appts, wos, crews, qb, committed, mats, pnl };
}

export function renderHome(root) {
  const B = state.board.filter((b) => !b.stale), C = state.clock;
  const today = new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  const sw = (k) => state.switches.find((s) => s.key === k)?.is_on;
  const late = B.filter(overLine).sort((a, b) => b.days_in_stage - a.days_in_stage).slice(0, 5);
  const waiting = C.filter((c) => c.waiting_min >= 15).slice(0, 6);
  const tagged = (state.mentions || []).filter((m) => !m.seen_at);

  root.innerHTML = html`
    <div class="head">
      <div><div class="kicker">${today} · page one</div><h1 class="serif">Sales. Jobs to build. Collected.</h1></div>
      <div class="right">${isDemo() ? raw('<span class="chip demo">DEMO · FICTIONAL BOOK</span>') : raw('<span class="chip">LIVE · DB</span>')}</div>
    </div>
    <div id="ledgers"><div class="card"><div class="note">Reading the ledgers…</div></div></div>

    ${tagged.length ? raw('<div class="card" style="border-color:var(--goldbtn)"><div class="kicker" style="color:var(--gold)">Tagged for you · ' + tagged.length + '</div>' + tagged.slice(0, 5).map((m) => `<div class="inv" style="cursor:pointer" onclick="__peek('${m.customer_id}')"><span class="mono dimmer">${esc(new Date(m.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }))}</span><span><b>${esc(m.author_name || '')}</b> · ${esc(m.customer_name || '')}<div class="small">${esc((m.body || '').slice(0, 120))}</div></span><span></span><span></span></div>`).join('') + '</div>') : ''}
    <div class="two">
      <div class="card">
        <div class="kicker">Needs you now · customers waiting for an answer${sw('text_clock') ? '' : ' · the clock is off'}</div>
        ${waiting.length ? raw(waiting.map((c) => `<div class="inv red"><span class="chip ${STAGES[c.stage]?.cls || 'st-ink'}">${esc(stageLabel(c.stage))}</span><span><b>${esc(personName(c.customer_name))}</b><div class="small">${esc((c.last_inbound_body || '').slice(0, 90))}</div></span><span class="mono clock">${mins(c.waiting_min)}</span><span class="btn" onclick="__peek('${c.customer_id}')">Open</span></div>`).join('')) : raw('<div class="note">Nobody is waiting on us right now.</div>')}
        ${late.length ? raw('<div class="kicker" style="margin-top:8px">Held too long</div>' + late.map((b) => `<div class="inv"><span class="chip ${STAGES[b.stage]?.cls || 'st-ink'}">${esc(stageLabel(b.stage))}</span><span><b>${esc(personName(b.customer_name))}</b> <span class="small">${esc(brandName(b.cc_company_id))} · ${esc(b.owner_name || 'nobody')}</span></span><span class="mono red">${b.days_in_stage} d</span><span class="btn" onclick="__peek('${b.customer_id}')">Open</span></div>`).join('')) : ''}
      </div>
      <div class="card">
        <div class="kicker">The line right now · last customer texts, any room</div>
        ${C.length ? raw(C.slice().sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at)).slice(0, 6).map((c) => `<div class="inv"><span class="mono dimmer">${esc(new Date(c.occurred_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))}</span><span><b>${esc(personName(c.customer_name))}</b><div class="small">${esc((c.last_inbound_body || '').slice(0, 90))}</div></span><span class="small">${esc(brandName(c.cc_company_id))}</span><span class="btn" onclick="__peek('${c.customer_id}')">Open</span></div>`).join('')) : raw('<div class="note">No customer texts yet today.</div>')}
      </div>
    </div>
    <div id="home-village"></div>`;

  renderRoom(root.querySelector('#home-village'), 'village');
  loadLedgers().then((L) => { const el = root.querySelector('#ledgers'); if (el) el.innerHTML = ledgersHtml(L, B); })
    .catch((e) => { const el = root.querySelector('#ledgers'); if (el) el.innerHTML = `<div class="card"><div class="kicker red">The ledgers would not load</div><div class="note">${esc(e.message || String(e))}</div></div>`; });
}

function ledgersHtml(L, B) {
  const t0 = day(0), t1 = day(1), t7 = day(7), m7 = day(-7), m30 = day(-30);
  const inWin = (s, a, b) => s && new Date(s) >= a && new Date(s) < b;
  const brandRows = (f) => BRANDS.map((cc) => ({ k: brandName(cc), v: f(cc) }));
  const repName = (id) => (state.people || []).find((p) => p.id === id)?.name || (state.seats || []).find((p) => p.id === id)?.name || 'House';
  const demo = L.demo;
  const todayY = ymd(t0);
  const mStart = new Date(t0.getFullYear(), t0.getMonth(), 1), qStart = new Date(t0.getFullYear(), Math.floor(t0.getMonth() / 3) * 3, 1), yStart = new Date(t0.getFullYear(), 0, 1);

  // ── SALES ──────────────────────────────────────────────────────────────
  const m56 = day(-56), m91 = day(-91), m120 = day(-120);
  const soldAll = L.sold, leadsAll = L.leads, apAll = L.appts ? L.appts.filter((a) => !a.is_cancelled) : null;
  const ap = apAll || [];
  const cnt = (rows, f, a, b) => rows ? rows.filter((r) => inWin(r[f], a, b)).length : null;
  const amt = (rows, f, a, b, v) => rows ? sum(rows.filter((r) => inWin(r[f], a, b)), v) : null;
  // LEADS: a day on which hundreds of "new" jobs appear is a bulk import (20 Jul
  // 2026 wrote 6,787 rows in one go), not leads. Those days are out of the
  // figure and out of the usual, and the usual only starts the day after the
  // last import — there is no lead history before it. Kevin, 15 Sep: the first
  // cut read "774 · usual 2,409 · down 68%" off exactly that import day.
  const IMPORT_MAX = 300;
  const dayCounts = {}; (leadsAll || []).forEach((l) => { const k = l.created_at.slice(0, 10); dayCounts[k] = (dayCounts[k] || 0) + 1; });
  const realLeads = leadsAll ? leadsAll.filter((l) => dayCounts[l.created_at.slice(0, 10)] <= IMPORT_MAX) : null;
  const importDays = Object.keys(dayCounts).filter((k) => dayCounts[k] > IMPORT_MAX).sort();
  const leadStart = importDays.length ? new Date(Math.max(m120.getTime(), new Date(importDays[importDays.length - 1] + 'T00:00:00').getTime() + 864e5)) : m120;
  const leadSpan = (m30 - leadStart) / 864e5;
  const leadsUsualOf = (rows) => rows && leadSpan >= 21 ? rows.filter((l) => inWin(l.created_at, leadStart, m30)).length / leadSpan * 30 : null;
  const leads = realLeads ? realLeads.filter((l) => inWin(l.created_at, m30, t1)) : null;
  const sold = soldAll ? soldAll.filter((s) => inWin(s.sold_at, m30, t1)) : null;
  const sold7 = sold ? sold.filter((s) => inWin(s.sold_at, m7, t1)) : null;
  const byRep = {}; (sold || []).forEach((s) => { const k = repName(s.rep_id); byRep[k] = (byRep[k] || 0) + Number(s.amount || 0); });
  // the usuals: 30-day figures against the three 30-day windows before them; weekly figures against the last 8 weeks; today against the same weekday over 8 weeks
  const leadsUsual = leadsUsualOf(realLeads);
  const apTodayUsual = apAll ? apAll.filter((a) => { const d = new Date(a.starts_at); return d >= m56 && d < t0 && d.getDay() === t0.getDay(); }).length / 8 : null;
  const apWeekUsual = apAll ? cnt(apAll, 'starts_at', m56, t0) / 8 : null;
  // NEXT 7 DAYS is a week still filling up. Its honest usual is how many were
  // ON THE BOOKS a week out in past weeks (booked before that week began) —
  // not how many eventually ran. The first cut compared 40 booked against 98
  // ran and read "down 53%"; against a-week-out it is 41, on pace.
  const aheadUsual = (rows, f) => { if (!rows) return null; let n = 0; for (let k = 1; k <= 8; k++) { const ws = day(-7 * k), we = day(-7 * k + 7); n += rows.filter((a) => (!f || f(a)) && inWin(a.starts_at, ws, we) && a.cc_created_at && new Date(a.cc_created_at) < ws).length; } return n / 8; };
  const apAheadUsual = aheadUsual(apAll);
  const sold7Usual = soldAll ? amt(soldAll, 'sold_at', m91, m7, (s) => s.amount) / 12 : null;
  const sold30Usual = soldAll ? amt(soldAll, 'sold_at', m120, m30, (s) => s.amount) / 3 : null;
  const salesFigs = [
    fig(nOf(leads ? leads.length : null), 'new leads · last 30 days', '', cmp(leads?.length, leadsUsual)),
    fig(nOf(cnt(apAll, 'starts_at', t0, t1)), 'appointments today', '', cmp(cnt(apAll, 'starts_at', t0, t1), apTodayUsual, false, `usual ${t0.toLocaleDateString([], { weekday: 'long' })}`)),
    fig(nOf(cnt(apAll, 'starts_at', t0, t7)), 'appointments · next 7 days', '', cmp(cnt(apAll, 'starts_at', t0, t7), apAheadUsual, false, 'usual booked a week out')),
    fig(nOf(cnt(apAll, 'starts_at', m7, t0)), 'appointments ran · last 7 days', '', cmp(cnt(apAll, 'starts_at', m7, t0), apWeekUsual, false, 'usual week')),
    fig(nOf(sold7 ? money(sum(sold7, (s) => s.amount)) : null, sold7 ? `${sold7.length} jobs` : ''), 'sold · last 7 days', 'verify', cmp(sold7 ? sum(sold7, (s) => s.amount) : null, sold7Usual, true, 'usual week')),
    fig(nOf(sold ? money(sum(sold, (s) => s.amount)) : null, sold ? `${sold.length} jobs` : ''), 'sold · last 30 days', 'verify', cmp(sold ? sum(sold, (s) => s.amount) : null, sold30Usual, true, 'usual 30 days')),
  ].join('');
  const salesSrc = demo ? src('DEMO') : (sold ? src('LIVE DB', 'sale_fact: booked CC signings + Billdu invoices; the open bells are on the console') : src('NO READ', 'this login cannot read sale_fact'));

  // ── TO BUILD ───────────────────────────────────────────────────────────
  const wos = L.wos, crews = L.crews || [], mats = L.mats;
  const crewName = (id) => crews.find((c) => c.cc_crew_id === id)?.name || (id ? 'crew ' + id : 'no crew yet');
  const open = (wos || []).filter((w) => !w.is_complete);
  const woBy = new Map(); (wos || []).forEach((w) => { const cur = woBy.get(w.job_id); if (!cur || (cur.is_complete && !w.is_complete)) woBy.set(w.job_id, w); });
  const matIn = new Set((mats || []).filter((m) => m.delivery_at || m.submitted_at).map((m) => m.job_id));
  const backlog = B.filter((b) => b.stage === 'sold_office' || b.stage === 'production' || b.stage === 'field_complete');
  // what each sold job waits on, read off CC's work order for it
  const bucketOf = (b) => {
    if (!wos) return null;
    const w = woBy.get(b.job_id);
    if (b.stage === 'field_complete' || (w && w.is_complete)) return 'built';
    if (!w || !w.install_starts_at) return 'nodate';
    const d = new Date(w.install_starts_at);
    if (d < t0) return 'started';
    if (d < t7) return 'week';
    return 'later';
  };
  const BUCKETS = [['nodate', 'no install date yet', 'var(--prodsoft)'], ['week', 'scheduled this week', 'var(--goldsoft)'], ['later', 'scheduled later', 'var(--card-hi)'], ['started', 'started · not marked done', '#f3dcd8'], ['built', 'built · not invoiced', 'var(--greensoft)']];
  const waitingToBuild = backlog.filter((b) => b.stage !== 'field_complete');
  const next7 = open.filter((w) => inWin(w.install_starts_at, t0, t7));
  const started = open.filter((w) => w.install_starts_at && new Date(w.install_starts_at) < t0);
  const builtAll = wos ? backlog.filter((b) => bucketOf(b) === 'built') : B.filter((b) => b.stage === 'field_complete');
  const committed = L.committed;
  const buildFigs = [
    fig(nOf(committed ? committed.length : null, committed && committed.length ? money(sum(committed, (c) => c.fin_sold_amount || c.yes?.total)) : ''), 'committed · said yes on our link, not in CC yet', 'gold'),
    fig(nOf(waitingToBuild.length, money(sum(waitingToBuild, (b) => b.fin_sold_amount))), 'sold · not built yet'),
    fig(nOf(wos ? waitingToBuild.filter((b) => bucketOf(b) === 'nodate').length : null), 'of those, no install date yet'),
    fig(nOf(wos ? next7.length : null), 'installs · next 7 days'),   // no usual yet: the CC mirror (343) is a day old and holds no honest eight weeks of work-order history
    fig(nOf(wos ? started.length : null), 'started · not marked done', started.length ? 'clock' : ''),
    fig(nOf(builtAll.length, money(sum(builtAll, (b) => b.fin_sold_amount))), 'built · can invoice', 'verify'),
  ].join('');
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = day(i), e = day(i + 1);
    const rows = open.filter((w) => inWin(w.install_starts_at, d, e));
    const byCrew = {}; rows.forEach((w) => { const k = crewName(w.crew_id); byCrew[k] = (byCrew[k] || 0) + 1; });
    return `<div class="d ${i === 0 ? 'today' : ''}"><div class="k">${esc(d.toLocaleDateString([], { weekday: 'short' }))} ${d.getDate()}</div><div class="n">${wos ? rows.length : '—'}</div><div class="c">${Object.entries(byCrew).map(([k, n]) => `${esc(k)}${n > 1 ? ' ×' + n : ''}`).join('<br>')}</div></div>`;
  }).join('');
  const crewLoad = crews.map((c) => ({ k: c.name, v: open.filter((w) => w.crew_id === c.cc_crew_id).length, sub: `${next7.filter((w) => w.crew_id === c.cc_crew_id).length} this week` })).filter((r) => r.v > 0);
  const buildSrc = demo ? src('DEMO') : (wos ? src('CC PULL', 'work orders, material orders and crews copied from Contractors Cloud hourly at :20') : src('NO READ'));
  const committedList = committed && committed.length ? `<div class="rows" style="margin-top:6px">${committed.slice(0, 6).map((c) => `<div class="r"><span><b>${esc(personName(c.customers?.name || ''))}</b> <span class="small">${esc(brandName(c.cc_company_id))} · said yes ${esc(new Date(c.yes?.at).toLocaleDateString([], { month: 'short', day: 'numeric' }))}</span></span><span class="mono">${money(c.fin_sold_amount || c.yes?.total)}</span></div>`).join('')}</div>` : '';

  // ── COLLECTED ──────────────────────────────────────────────────────────
  const qbAll = L.qb ? L.qb.filter((i) => !i.reporting_excluded) : null;
  const inv30 = qbAll ? qbAll.filter((i) => i.txn_date >= ymd(m30)) : null;
  const openBal = qbAll ? qbAll.filter((i) => Number(i.balance) > 0) : null;
  const overdue = openBal ? openBal.filter((i) => i.due_date && i.due_date < todayY) : null;
  const AGES = [['current', 'not due yet'], ['1-30', '1–30 days late'], ['31-60', '31–60 days late'], ['61-90', '61–90 days late'], ['90+', 'over 90 days late']];
  const ageOf = (i) => { const d = i.due_date ? daysBetween(todayY, i.due_date) : 0; return d <= 0 ? 'current' : d <= 30 ? '1-30' : d <= 60 ? '31-60' : d <= 90 ? '61-90' : '90+'; };
  const invUsual = qbAll ? sum(qbAll.filter((i) => i.txn_date >= ymd(m120) && i.txn_date < ymd(m30)), (i) => i.total_amt) / 3 : null;
  const cashFigs = [
    fig(nOf(inv30 ? money(sum(inv30, (i) => i.total_amt)) : null, inv30 ? `${inv30.length} invoices` : ''), 'invoiced · last 30 days', '', cmp(inv30 ? sum(inv30, (i) => i.total_amt) : null, invUsual, true, 'usual 30 days')),
    fig(nOf(inv30 ? money(sum(inv30, (i) => i.total_amt - i.balance)) : null), 'collected on those invoices', 'verify'),   // no usual: older invoices have had longer to be paid, so any comparison reads "down" by construction
    fig(nOf(openBal ? money(sum(openBal, (i) => i.balance)) : null, openBal ? `${openBal.length} open` : ''), 'still owed · this year\'s invoices'),
    fig(nOf(overdue ? money(sum(overdue, (i) => i.balance)) : null, overdue ? `${overdue.length} past due` : ''), 'of that, past the due date', overdue && overdue.length ? 'red' : ''),
  ].join('');
  const cashSrc = demo ? src('DEMO') : (qbAll ? src('QB PULL', 'QuickBooks invoices, synced by the box, this calendar year; Oasis Billdu invoices count once they reach QuickBooks') : src('NO READ'));

  // ── THE HEALTH OF EACH COMPANY ─────────────────────────────────────────
  const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(t0.getFullYear(), t0.getMonth() - 5 + i, 1); return { key: monthKey(d), label: d.toLocaleDateString([], { month: 'short' }), full: i < 5 }; });
  const priorFull = months.slice(2, 5);   // the three full months before this one — the rhythm, never last year
  const companyBand = (cc) => {
    const name = BRAND_BY_CC[cc].name;
    const inv = qbAll ? qbAll.filter((i) => i.cc_company_id === cc) : null;
    const sf = soldAll ? soldAll.filter((s) => s.cc_company_id === cc) : null;
    const invIn = (from) => inv ? sum(inv.filter((i) => i.txn_date >= ymd(from)), (i) => i.total_amt) : null;
    const soldIn = (from) => sf ? sum(sf.filter((s) => s.sold_at >= ymd(from)), (s) => s.amount) : null;
    const byMonth = months.map((m) => ({ k: m.label, v: inv ? sum(inv.filter((i) => i.txn_date.slice(0, 7) === m.key), (i) => i.total_amt) : null, color: m.full ? 'var(--officesoft)' : 'var(--goldsoft)', sub: m.full ? '' : 'so far' }));
    const usual = inv ? sum(priorFull, (m) => byMonth[months.indexOf(m)].v) / 3 : null;
    const last30 = invIn(m30);
    const trend = usual && last30 != null && usual > 0 ? Math.round((last30 - usual) / usual * 100) : null;
    const trendLine = trend == null ? '' : `<div class="trend ${trend < -10 ? 'down' : trend > 10 ? 'up' : ''}">Last 30 days <b>${moneyK(last30)}</b> against your usual month of <b>${moneyK(usual)}</b> (the three before this one) — <b>${trend > 0 ? 'up' : trend < 0 ? 'down' : 'level'} ${Math.abs(trend)}%</b>.</div>`;
    const collectedYtd = inv ? sum(inv, (i) => i.total_amt - i.balance) : null;
    const owed = openBal ? openBal.filter((i) => i.cc_company_id === cc) : null;
    const aging = owed ? AGES.map(([k, label]) => ({ k: label, v: sum(owed.filter((i) => ageOf(i) === k), (i) => i.balance), color: k === 'current' ? 'var(--officesoft)' : k === '1-30' ? 'var(--goldsoft)' : '#f3dcd8' })) : null;
    const bl = backlog.filter((b) => b.cc_company_id === cc);
    const bk = wos ? BUCKETS.map(([k, label, color]) => { const rows = bl.filter((b) => bucketOf(b) === k); return { k: label, v: sum(rows, (b) => b.fin_sold_amount), sub: `${rows.length} job${rows.length === 1 ? '' : 's'}`, color }; }) : null;
    const old60 = bl.filter((b) => b.contract_signed_at && daysBetween(todayY, b.contract_signed_at) > 60 && bucketOf(b) !== 'built');
    const withMat = mats ? bl.filter((b) => matIn.has(b.job_id)).length : null;
    const a7 = L.appts ? ap.filter((a) => a.cc_company_id === cc && inWin(a.starts_at, t0, t7)).length : null;
    const a7Usual = aheadUsual(apAll, (a) => a.cc_company_id === cc);
    const coLeads = leads ? leads.filter((l) => l.cc_company_id === cc).length : null;
    const coLeadsUsual = leadsUsualOf(realLeads ? realLeads.filter((l) => l.cc_company_id === cc) : null);
    const coSold30 = sf ? sum(sf.filter((s) => inWin(s.sold_at, m30, t1)), (s) => s.amount) : null;
    const coSold30Usual = sf ? sum(sf.filter((s) => inWin(s.sold_at, m120, m30)), (s) => s.amount) / 3 : null;
    // THE P&L, REAL (345): QuickBooks' own numbers. The running month, the
    // last month the accountant closed (approved), and the year. Net income
    // is the one line Kevin asked for: "if we're making money we're doing
    // good, if we're not, we're not."
    const pn = L.pnl ? L.pnl.filter((p) => p.cc_company_id === cc) : null;
    const pnRun = pn ? pn.find((p) => p.state === 'running') : null;
    const pnClosed = pn ? pn.find((p) => p.approved) : null;
    const pnYtdNet = pn && pn.length ? sum(pn, (p) => p.net_income) : null;
    const netCls = (v) => v == null ? '' : v < 0 ? 'red' : 'verify';
    const pnlRows = pn && pn.length ? `
            ${rowline(`Net income · ${pnRun ? new Date(pnRun.period_start + 'T00:00:00').toLocaleDateString([], { month: 'long' }) + ', running' : 'this month'}`, pnRun ? `${moneyK(pnRun.net_income)} <span class="dimmer">· on ${moneyK(pnRun.total_income)} in</span>` : '—', netCls(pnRun?.net_income))}
            ${rowline(`Net income · ${pnClosed ? new Date(pnClosed.period_start + 'T00:00:00').toLocaleDateString([], { month: 'long' }) + ', closed by the books' : 'last closed month'}`, pnClosed ? `${moneyK(pnClosed.net_income)} <span class="dimmer">· on ${moneyK(pnClosed.total_income)} in</span>` : '<span class="dimmer">no month closed yet</span>', netCls(pnClosed?.net_income))}
            ${rowline('Net income · this year', moneyK(pnYtdNet), netCls(pnYtdNet))}` : rowline('Costs and profit', 'no feed yet', 'clock');
    const quiet = !bl.length && !(inv && inv.length) && !(sf && sf.length);
    return `<div class="ledger co ${quiet ? 'quiet' : ''}">
      <div class="lhead"><h2>${esc(name)}</h2><div class="right">${demo ? src('DEMO') : ''}${!demo && inv ? src('QB PULL · INVOICES') : ''} ${!demo && sf ? src('LIVE DB') : ''} ${pn && pn.length ? src('QB PULL · P&L', `QuickBooks' own Profit and Loss, accrual, synced ${new Date(pn[0].synced_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}; a month is approved when it ends on or before the books' closing date`) : src('NO FEED YET', 'costs and profit: the QuickBooks P&L feed (345) is written and waits on the database token')}</div></div>
      ${quiet ? '<div class="note">Nothing moving this year on this line.</div>' : `
      <div class="cogrid">
        <div>
          <div class="kicker">Health · invoiced</div>
          <div class="figs tight">${fig(nOf(inv ? moneyK(invIn(mStart)) : null), 'this month')}${fig(nOf(inv ? moneyK(invIn(qStart)) : null), 'this quarter')}${fig(nOf(inv ? moneyK(invIn(yStart)) : null), 'this year')}</div>
          ${inv ? bars(byMonth, { keepOrder: true, compact: true }) : '<div class="note">—</div>'}
          ${trendLine}
          <div class="rows" style="margin-top:8px">
            ${rowline('New leads · last 30 days', coLeads == null ? '—' : `${coLeads}${coLeadsUsual > 0 ? ` <span class="dimmer">· usual ${Math.round(coLeadsUsual)}</span>` : ''}`)}
            ${rowline('Sold · last 30 days', coSold30 == null ? '—' : `${moneyK(coSold30)}${coSold30Usual > 0 ? ` <span class="dimmer">· usual ${moneyK(coSold30Usual)}</span>` : ''}`, 'verify')}
            ${rowline('Sold · this month', sf ? moneyK(soldIn(mStart)) : '—', 'verify')}
            ${rowline('Sold · this quarter', sf ? moneyK(soldIn(qStart)) : '—', 'verify')}
            ${rowline('Sold · this year', sf ? moneyK(soldIn(yStart)) : '—', 'verify')}
            ${rowline('Collected · this year', collectedYtd == null ? '—' : moneyK(collectedYtd))}
            ${pnlRows}
          </div>
        </div>
        <div>
          <div class="kicker">To build · ${bl.length} job${bl.length === 1 ? '' : 's'} · ${moneyK(sum(bl, (b) => b.fin_sold_amount))}</div>
          ${bk ? bars(bk, { keepOrder: true, compact: true }) : `<div class="note">${demo ? '—' : 'Contractors Cloud work orders are not readable on this login.'}</div>`}
          <div class="rows" style="margin-top:8px">
            ${rowline('Waiting more than 60 days since signing', old60.length, old60.length ? 'clock' : '')}
            ${rowline('Material ordered or delivered', withMat == null ? '—' : `${withMat} of ${bl.length}`)}
            ${rowline('Appointments · next 7 days', a7 == null ? '—' : `${a7}${a7Usual > 0 ? ` <span class="dimmer">· usual ${Math.round(a7Usual)}</span>` : ''}`)}
          </div>
        </div>
        <div>
          <div class="kicker">Still owed · ${owed ? moneyK(sum(owed, (i) => i.balance)) : '—'}${owed ? ` · ${owed.length} invoice${owed.length === 1 ? '' : 's'}` : ''}</div>
          ${aging ? bars(aging, { keepOrder: true, compact: true }) : '<div class="note">—</div>'}
        </div>
      </div>`}
    </div>`;
  };

  return `
    <div class="ledger sales">
      <div class="lhead"><h2>Sales</h2><div class="right">${salesSrc} <span class="btn" onclick="__go('sales')">Open the Sales room</span></div></div>
      <div class="figs">${salesFigs}</div>
      <div class="three">
        <div><div class="kicker">Sold · last 30 days · by company</div>${sold ? bars(brandRows((cc) => sum(sold.filter((s) => s.cc_company_id === cc), (s) => s.amount)), { color: 'var(--greensoft)' }) : '<div class="note">—</div>'}</div>
        <div><div class="kicker">Sold · last 30 days · by rep</div>${sold ? bars(Object.entries(byRep).map(([k, v]) => ({ k, v })).slice(0, 8), { color: 'var(--greensoft)' }) : '<div class="note">—</div>'}</div>
        <div><div class="kicker">New leads · last 30 days · by company</div>${leads ? bars(brandRows((cc) => leads.filter((l) => l.cc_company_id === cc).length), { isMoney: false, color: 'var(--goldsoft)' }) : '<div class="note">—</div>'}</div>
      </div>
    </div>

    <div class="ledger build">
      <div class="lhead"><h2>Jobs to build</h2><div class="right">${buildSrc} ${src('LIVE DB', 'sold / built come from the stage board (job_stage, 306); stale CC jobs are left out (310)')} <span class="btn" onclick="__go('production')">Open Production</span></div></div>
      <div class="figs">${buildFigs}</div>
      ${committedList}
      <div class="kicker" style="margin:10px 0 6px">Installs · the next seven days · from Contractors Cloud's work orders</div>
      <div class="week">${week}</div>
      <div class="three" style="margin-top:12px">
        <div><div class="kicker">Sold, not built · by company</div>${bars(brandRows((cc) => sum(waitingToBuild.filter((b) => b.cc_company_id === cc), (b) => b.fin_sold_amount)), { color: 'var(--prodsoft)' })}<div class="note">Each company's backlog is broken down below.</div></div>
        <div><div class="kicker">Crews · open work orders</div>${wos ? bars(crewLoad, { isMoney: false, color: 'var(--prodsoft)' }) : '<div class="note">—</div>'}</div>
        <div><div class="kicker">Inventory · fencing stock ${src('NO FEED YET')}</div><div class="note">The yard carries a lot of fence stock and the database holds none of it. Nothing here will be guessed. What it takes: one count per product — the 25 products in Gio's Special Order Guide are already rows — kept by a weekly count sheet or off the supplier deliveries. Say the word and that sheet exists.</div></div>
      </div>
    </div>

    <div class="ledger cash">
      <div class="lhead"><h2>Collected</h2><div class="right">${cashSrc} <span class="btn" onclick="__go('office')">Open the Office room</span></div></div>
      <div class="figs">${cashFigs}</div>
      <div class="two">
        <div><div class="kicker">Still owed · by company</div>${openBal ? bars(brandRows((cc) => sum(openBal.filter((i) => i.cc_company_id === cc), (i) => i.balance)), { color: 'var(--officesoft)' }) : '<div class="note">—</div>'}</div>
        <div><div class="kicker">Past due · by company</div>${overdue ? bars(brandRows((cc) => sum(overdue.filter((i) => i.cc_company_id === cc), (i) => i.balance)), { color: '#f3dcd8' }) : '<div class="note">—</div>'}</div>
      </div>
    </div>

    <div class="head" style="margin:22px 0 10px"><div><div class="kicker">The health of each company · month · quarter · year · against its own last three months</div><h2 class="serif" style="margin:0">One company at a time.</h2></div></div>
    ${BRANDS.map(companyBand).join('')}
    ${demo ? '<div class="note" style="margin:-6px 0 12px">Demo: the ledgers read live tables, so they show dashes here. Sign in for the real numbers.</div>' : ''}`;
}
