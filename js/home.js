// The Business — page one.
//
// Kevin, 15 Sep 2026: "the only things important are sales and jobs to be
// built and collected… how many have we sold, how many can we build, how many
// are waiting to be built, how many have we built, how many can we invoice,
// how many invoices have we collected… full clarity on page one… if I didn't
// say it, I wouldn't want to know it." So: three ledgers, in his order, and a
// strip for the four companies under them. Bars where the number is an amount
// (the tops of mountains); a figure beside its denominator where it is not.
// Every ledger names its source — CC PULL · LIVE DB · QB PULL · NO FEED YET —
// and a figure with no live source reads honestly absent. Sources are never
// blended; nothing is projected into an actual.
import * as api from './api.js?v=40';
import { state, isDemo, personName } from './book.js?v=40';
import { html, raw, esc } from './ui.js?v=40';
import { STAGES, STAGE_LINE_DAYS, BRAND_BY_CC, brandName, stageLabel } from './config.js?v=40';
import { renderRoom } from './village.js?v=40';

const money = (n) => n == null ? '—' : '$' + Math.round(Number(n)).toLocaleString();
const mins = (m) => m == null ? '' : m >= 1440 ? (m / 1440).toFixed(1) + ' d' : m >= 60 ? (m / 60).toFixed(1) + ' h' : Math.round(m) + ' min';
const overLine = (b) => b.days_in_stage != null && b.days_in_stage > (STAGE_LINE_DAYS[b.stage] ?? 99);
const sum = (rows, f) => rows.reduce((a, r) => a + Number(f(r) || 0), 0);
const day = (n) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
const iso = (d) => d.toISOString();
const ymd = (d) => { const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const BRANDS = Object.keys(BRAND_BY_CC);
const src = (kind, note) => `<span class="src ${kind === 'NO FEED YET' || kind === 'NO READ' ? 'none' : ''}" title="${esc(note || '')}">${esc(kind)}</span>`;
const fig = (n, l, cls = '') => `<div class="fig"><div class="n ${cls}">${n}</div><div class="l">${esc(l)}</div></div>`;
const nOf = (v, small) => v == null ? '<span class="dimmer">—</span>' : `${v}${small ? ` <small>${esc(small)}</small>` : ''}`;

// Bars on a shared zero baseline, the number on the bar (Kevin, 16 Aug: "we
// see the top of the bar which is all that matters"). Only for amounts.
function bars(rows, { isMoney = true, color = 'var(--goldsoft)' } = {}) {
  rows = rows.filter((r) => r.v > 0).sort((a, b) => b.v - a.v);
  if (!rows.length) return '<div class="note">Nothing in this window.</div>';
  const max = Math.max(1, ...rows.map((r) => r.v));
  const med = rows.map((r) => r.v).sort((a, b) => a - b)[Math.floor(rows.length / 2)];
  const lump = rows.length >= 3 && max > 4.5 * med ? `<div class="note">One ${esc(rows[0].k)} is most of this picture — the rest read small beside it, not because they are.</div>` : '';
  return `<div class="bars">${rows.map((r) => `<div class="brow"><span class="lbl" title="${esc(r.k)}">${esc(r.k)}</span><div class="bar" style="width:${Math.max(3, Math.round(r.v / max * 100))}%;background:${color}"><b>${isMoney ? money(r.v) : r.v}${r.sub ? ` <span class="dimmer">· ${esc(r.sub)}</span>` : ''}</b></div></div>`).join('')}</div>${lump}`;
}

async function loadLedgers() {
  if (isDemo()) return { demo: true };
  const t0 = day(0), t7 = day(7), m7 = day(-7), m30 = day(-30), m120 = day(-120);
  const [sold, leads, appts, wos, crews, qb, sigs, accepts] = await Promise.all([
    api.page(`sale_fact?select=job_id,rep_id,cc_company_id,sold_at,amount&sold_at=gte.${ymd(m30)}&limit=3000`, 3000).catch(() => null),
    api.page(`jobs?select=id,cc_company_id,created_at&created_at=gte.${iso(m30)}&limit=3000`, 3000).catch(() => null),
    api.page(`appointment_rep_truth?select=cc_company_id,starts_at,is_cancelled,rep_name&starts_at=gte.${iso(m7)}&starts_at=lt.${iso(t7)}&limit=2000`, 2000).catch(() => null),
    api.page('cc_work_orders?select=job_id,cc_company_id,crew_id,is_complete,install_starts_at,number&limit=2000', 2000).catch(() => null),
    api.page('cc_crews?select=cc_crew_id,name,color&is_active=eq.true&order=name', 200).catch(() => null),
    api.page(`qb_invoices?select=cc_company_id,txn_date,due_date,total_amt,balance,reporting_excluded&txn_date=gte.${ymd(m120)}&limit=5000`, 5000).catch(() => null),
    api.page('customer_signatures?select=customer_id,job_id,signed_at,signer_name&order=signed_at.desc&limit=200', 200).catch(() => null),
    api.page('estimate_docs?select=customer_id,job_id,total,accepted_at&accepted_at=not.is.null&order=accepted_at.desc&limit=200', 200).catch(() => null),
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
  return { sold, leads, appts, wos, crews, qb, committed };
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

  // ── SALES ──────────────────────────────────────────────────────────────
  const sold = L.sold, leads = L.leads, ap = (L.appts || []).filter((a) => !a.is_cancelled);
  const sold7 = sold ? sold.filter((s) => inWin(s.sold_at, m7, t1)) : null;
  const byRep = {}; (sold || []).forEach((s) => { const k = repName(s.rep_id); byRep[k] = (byRep[k] || 0) + Number(s.amount || 0); });
  const salesFigs = [
    fig(nOf(leads ? leads.length : null), 'new leads · last 30 days'),
    fig(nOf(L.appts ? ap.filter((a) => inWin(a.starts_at, t0, t1)).length : null), 'appointments today'),
    fig(nOf(L.appts ? ap.filter((a) => inWin(a.starts_at, t0, t7)).length : null), 'appointments · next 7 days'),
    fig(nOf(L.appts ? ap.filter((a) => inWin(a.starts_at, m7, t0)).length : null), 'appointments ran · last 7 days'),
    fig(nOf(sold7 ? money(sum(sold7, (s) => s.amount)) : null, sold7 ? `${sold7.length} jobs` : ''), 'sold · last 7 days', 'verify'),
    fig(nOf(sold ? money(sum(sold, (s) => s.amount)) : null, sold ? `${sold.length} jobs` : ''), 'sold · last 30 days', 'verify'),
  ].join('');
  const salesSrc = demo ? src('DEMO') : (sold ? src('LIVE DB', 'sale_fact: booked CC signings + Billdu invoices; the open bells are on the console') : src('NO READ', 'this login cannot read sale_fact'));

  // ── TO BUILD ───────────────────────────────────────────────────────────
  const wos = L.wos, crews = L.crews || [];
  const crewName = (id) => crews.find((c) => c.cc_crew_id === id)?.name || (id ? 'crew ' + id : 'no crew yet');
  const open = (wos || []).filter((w) => !w.is_complete);
  const dated = new Set(open.filter((w) => w.install_starts_at).map((w) => w.job_id));
  const waitingToBuild = B.filter((b) => b.stage === 'sold_office' || b.stage === 'production');
  const waitingNoDate = waitingToBuild.filter((b) => !dated.has(b.job_id));
  const next7 = open.filter((w) => inWin(w.install_starts_at, t0, t7));
  const started = open.filter((w) => w.install_starts_at && new Date(w.install_starts_at) < t0);
  const built = B.filter((b) => b.stage === 'field_complete');
  const committed = L.committed;
  const buildFigs = [
    fig(nOf(committed ? committed.length : null, committed && committed.length ? money(sum(committed, (c) => c.fin_sold_amount || c.yes?.total)) : ''), 'committed · said yes on our link, not in CC yet', 'gold'),
    fig(nOf(waitingToBuild.length, money(sum(waitingToBuild, (b) => b.fin_sold_amount))), 'sold · not built yet'),
    fig(nOf(wos ? waitingNoDate.length : null), 'of those, no install date yet'),
    fig(nOf(wos ? next7.length : null), 'installs · next 7 days'),
    fig(nOf(wos ? started.length : null), 'started · not marked done', started.length ? 'clock' : ''),
    fig(nOf(built.length, money(sum(built, (b) => b.fin_sold_amount))), 'built · can invoice', 'verify'),
  ].join('');
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = day(i), e = day(i + 1);
    const rows = open.filter((w) => inWin(w.install_starts_at, d, e));
    const byCrew = {}; rows.forEach((w) => { const k = crewName(w.crew_id); byCrew[k] = (byCrew[k] || 0) + 1; });
    return `<div class="d ${i === 0 ? 'today' : ''}"><div class="k">${esc(d.toLocaleDateString([], { weekday: 'short' }))} ${d.getDate()}</div><div class="n">${wos ? rows.length : '—'}</div><div class="c">${Object.entries(byCrew).map(([k, n]) => `${esc(k)}${n > 1 ? ' ×' + n : ''}`).join('<br>')}</div></div>`;
  }).join('');
  const crewLoad = crews.map((c) => ({ k: c.name, v: open.filter((w) => w.crew_id === c.cc_crew_id).length, sub: `${next7.filter((w) => w.crew_id === c.cc_crew_id).length} this week` })).filter((r) => r.v > 0);
  const buildSrc = demo ? src('DEMO') : (wos ? src('CC PULL', 'work orders and crews copied from Contractors Cloud hourly at :20') : src('NO READ'));
  const committedList = committed && committed.length ? `<div class="rows" style="margin-top:6px">${committed.slice(0, 6).map((c) => `<div class="r"><span><b>${esc(personName(c.customers?.name || ''))}</b> <span class="small">${esc(brandName(c.cc_company_id))} · said yes ${esc(new Date(c.yes?.at).toLocaleDateString([], { month: 'short', day: 'numeric' }))}</span></span><span class="mono">${money(c.fin_sold_amount || c.yes?.total)}</span></div>`).join('')}</div>` : '';

  // ── COLLECTED ──────────────────────────────────────────────────────────
  const qb = L.qb ? L.qb.filter((i) => !i.reporting_excluded) : null;
  const inv30 = qb ? qb.filter((i) => i.txn_date >= ymd(m30)) : null;
  const openBal = qb ? qb.filter((i) => Number(i.balance) > 0) : null;
  const overdue = openBal ? openBal.filter((i) => i.due_date && i.due_date < ymd(t0)) : null;
  const cashFigs = [
    fig(nOf(inv30 ? money(sum(inv30, (i) => i.total_amt)) : null, inv30 ? `${inv30.length} invoices` : ''), 'invoiced · last 30 days'),
    fig(nOf(inv30 ? money(sum(inv30, (i) => i.total_amt - i.balance)) : null), 'collected on those invoices', 'verify'),
    fig(nOf(openBal ? money(sum(openBal, (i) => i.balance)) : null, openBal ? `${openBal.length} open` : ''), 'still owed · invoices from the last 120 days'),
    fig(nOf(overdue ? money(sum(overdue, (i) => i.balance)) : null, overdue ? `${overdue.length} past due` : ''), 'of that, past the due date', overdue && overdue.length ? 'red' : ''),
  ].join('');
  const cashSrc = demo ? src('DEMO') : (qb ? src('QB PULL', 'QuickBooks invoices, synced by the box; Oasis Billdu is not in this ledger') : src('NO READ'));

  // ── THE FOUR COMPANIES ─────────────────────────────────────────────────
  const cos = BRANDS.map((cc) => {
    const s = sold ? sold.filter((x) => x.cc_company_id === cc) : null;
    const w = waitingToBuild.filter((b) => b.cc_company_id === cc);
    const n7 = wos ? next7.filter((x) => x.cc_company_id === cc).length : null;
    const ob = openBal ? sum(openBal.filter((i) => i.cc_company_id === cc), (i) => i.balance) : null;
    const a7 = L.appts ? ap.filter((a) => a.cc_company_id === cc && inWin(a.starts_at, t0, t7)).length : null;
    return `<div class="co"><div class="nm">${esc(BRAND_BY_CC[cc].name)}</div><div class="rows">
      <div class="r"><span>Sold · 30 days</span><span class="mono verify">${s ? money(sum(s, (x) => x.amount)) : '—'}${s ? ` <span class="dimmer">· ${s.length}</span>` : ''}</span></div>
      <div class="r"><span>To build</span><span class="mono">${w.length} <span class="dimmer">· ${money(sum(w, (b) => b.fin_sold_amount))}</span></span></div>
      <div class="r"><span>Installs · next 7 days</span><span class="mono">${n7 ?? '—'}</span></div>
      <div class="r"><span>Appointments · next 7 days</span><span class="mono">${a7 ?? '—'}</span></div>
      <div class="r"><span>Still owed</span><span class="mono ${ob ? 'clock' : ''}">${ob == null ? '—' : money(ob)}</span></div>
    </div></div>`;
  }).join('');

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
        <div><div class="kicker">Sold, not built · by company</div>${bars(brandRows((cc) => sum(waitingToBuild.filter((b) => b.cc_company_id === cc), (b) => b.fin_sold_amount)), { color: 'var(--prodsoft)' })}</div>
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

    <div class="card"><div class="lhead"><div class="kicker">The four companies · same three ledgers, one card each</div></div><div class="cos">${cos}</div></div>
    ${demo ? '<div class="note" style="margin:-6px 0 12px">Demo: the ledgers read live tables, so they show dashes here. Sign in for the real numbers.</div>' : ''}`;
}
