// The Business — the one place. Four doors, the funnel, what needs you now,
// the line right now. Every number is a count of live rows the seat can read.
import { state, isDemo, personName, firstName } from './book.js?v=4';
import { html, raw, esc } from './ui.js?v=4';
import { STAGES, STAGE_LINE_DAYS, brandName, stageLabel } from './config.js?v=4';

const money = (n) => n == null ? '—' : '$' + Math.round(Number(n)).toLocaleString();
const mins = (m) => m == null ? '' : m >= 1440 ? (m / 1440).toFixed(1) + ' d' : m >= 60 ? (m / 60).toFixed(1) + ' h' : Math.round(m) + ' min';
const overLine = (b) => b.days_in_stage != null && b.days_in_stage > (STAGE_LINE_DAYS[b.stage] ?? 99);

export function renderHome(root) {
  const B = state.board, Q = state.queue, C = state.clock;
  const inProd = B.filter((b) => b.stage === 'production');
  const waitingSup = B.filter((b) => b.stage === 'sold_office' && b.open_asks === 0);
  const fieldDone = B.filter((b) => b.stage === 'field_complete');
  const byType = (t) => Q.filter((q) => q.ask_type === t).length;
  const oldestQ = Q.slice().sort((a, b) => b.open_min - a.open_min)[0];
  const stageN = (s) => B.filter((b) => b.stage === s).length;
  const stageMoney = (s) => B.filter((b) => b.stage === s).reduce((a, b) => a + Number(b.fin_sold_amount || 0), 0);
  const late = B.filter(overLine).sort((a, b) => b.days_in_stage - a.days_in_stage).slice(0, 5);
  const waiting = C.filter((c) => c.waiting_min >= 15).slice(0, 6);
  const lately = C.slice().sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at)).slice(0, 6);
  const today = new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  const sw = (k) => state.switches.find((s) => s.key === k)?.is_on;

  root.innerHTML = html`
    <div class="head">
      <div><div class="kicker">${today} · the one place</div><h1 class="serif">Four rooms. One customer file under all of them.</h1></div>
      <div class="right">${isDemo() ? raw('<span class="chip demo">DEMO · FICTIONAL BOOK</span>') : raw('<span class="chip">LIVE · DB</span>')}</div>
    </div>

    <div class="tiles">
      <div class="tile door sales" onclick="__go('sales')">
        <div class="kicker">Sales · retail + commercial</div>
        <div class="fnum">${stageN('selling') + stageN('booked')} <small>selling</small></div>
        <div class="rows">
          <div class="r"><span>Customer texts waiting on a rep</span><span class="mono ${C.filter((c) => c.stage === 'selling' && c.waiting_min >= 15).length ? 'clock' : ''}">${C.filter((c) => c.stage === 'selling' && c.waiting_min >= 15).length}</span></div>
          <div class="r"><span>Signed, last 30 days</span><span class="mono">${money(B.filter((b) => b.contract_signed_at && new Date(b.contract_signed_at) > Date.now() - 30 * 864e5).reduce((a, b) => a + Number(b.fin_sold_amount || 0), 0))}</span></div>
        </div>
        <span class="btn fill">Open the Sales room</span>
      </div>
      <div class="tile door office" onclick="__go('office')">
        <div class="kicker">Office · survey, permit, invoice</div>
        <div class="fnum">${Q.length} <small>asks open</small></div>
        <div class="rows">
          <div class="r"><span>Paperwork</span><span class="mono">${byType('CONTRACT_DOC')}</span></div>
          <div class="r"><span>Permit</span><span class="mono">${byType('PERMIT')}</span></div>
          <div class="r"><span>Ready to invoice</span><span class="mono verify">${byType('INVOICE')}</span></div>
          <div class="r"><span>Oldest</span><span class="mono ${oldestQ && oldestQ.open_min > 4320 ? 'red' : ''}">${oldestQ ? mins(oldestQ.open_min) : '—'}</span></div>
        </div>
        <span class="btn fill">Open the Office room</span>
      </div>
      <div class="tile door production" onclick="__go('production')">
        <div class="kicker">Production · Luis, Obed, Gerardo</div>
        <div class="fnum">${inProd.length} <small>in production</small></div>
        <div class="rows">
          <div class="r"><span>Sold, waiting for a supervisor</span><span class="mono clock">${waitingSup.length}</span></div>
          <div class="r"><span>Field complete, invoice pending</span><span class="mono verify">${fieldDone.length}</span></div>
          <div class="r"><span>Held past the line</span><span class="mono ${late.length ? 'red' : ''}">${B.filter(overLine).length}</span></div>
        </div>
        <span class="btn fill">Open the Production room</span>
      </div>
      <div class="tile door money">
        <div class="kicker">Collections · Billdu + QuickBooks</div>
        <div class="fnum">${money(B.filter((b) => b.stage === 'invoiced').reduce((a, b) => a + Number(b.fin_sold_amount || 0), 0))}</div>
        <div class="rows">
          <div class="r"><span>Invoiced, not paid</span><span class="mono">${stageN('invoiced')}</span></div>
          <div class="r"><span>Paid, last 30 days</span><span class="mono verify">${money(stageMoney('paid'))}</span></div>
        </div>
        <div class="note">AR aging by bucket comes from QuickBooks next.</div>
      </div>
    </div>

    <div class="card">
      <div class="head" style="margin-bottom:6px"><div class="kicker">The funnel · every open customer, by who holds them</div><span class="small">days in stage · red past the line</span></div>
      <div class="funnel">
        ${raw(['booked', 'selling', 'sold_office', 'production', 'field_complete', 'invoiced'].map((s) => {
          const rows = B.filter((b) => b.stage === s);
          const owners = {};
          rows.forEach((b) => { const k = b.owner_name ? firstName(b.owner_name) : 'nobody'; owners[k] = (owners[k] || 0) + 1; });
          const top = Object.entries(owners).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, n]) => `${esc(k)} ${n}`).join(' · ');
          const bg = { booked: 'var(--goldsoft)', selling: 'var(--greensoft)', sold_office: 'var(--officesoft)', production: 'var(--prodsoft)', field_complete: 'var(--greensoft)', invoiced: 'var(--card-hi)' }[s];
          return `<div class="cell" style="background:${bg}" onclick="__go('production')"><div class="kicker">${esc(stageLabel(s))}</div><div class="n">${rows.length}</div><div class="d">${top || '—'}${rows.length ? ' · ' + esc(money(stageMoney(s))) : ''}</div></div>`;
        }).join(''))}
      </div>
    </div>

    <div class="two">
      <div class="card">
        <div class="kicker">Needs you now · customers waiting for an answer${sw('text_clock') ? '' : ' · the clock is off'}</div>
        ${waiting.length ? raw(waiting.map((c) => `<div class="inv red"><span class="chip ${STAGES[c.stage]?.cls || 'st-ink'}">${esc(stageLabel(c.stage))}</span><span><b>${esc(personName(c.customer_name))}</b> · "${esc((c.body || '(photo)').slice(0, 70))}" · ${esc(c.owner_name || 'nobody')} has not answered</span><span class="mono red">${esc(mins(c.waiting_min))}</span><button class="btn sm" onclick="__go('file','${esc(c.customer_id)}')">Open file</button></div>`).join('')) : raw('<div class="empty">Nobody is waiting on a text right now.</div>')}
        ${late.length ? raw('<div class="kicker" style="margin-top:8px">Held too long</div>' + late.map((b) => `<div class="inv"><span class="chip ${STAGES[b.stage]?.cls || 'st-ink'}">${esc(stageLabel(b.stage))}</span><span><b>${esc(personName(b.customer_name))}</b> · ${esc(brandName(b.cc_company_id))} · ${esc(b.owner_name || 'nobody')} has held it</span><span class="mono red">${b.days_in_stage} d</span><button class="btn sm" onclick="__go('file','${esc(b.customer_id)}')">Open file</button></div>`).join('')) : ''}
      </div>
      <div class="card">
        <div class="kicker">The line right now · last customer texts, any room</div>
        ${lately.length ? raw(lately.map((c) => `<div class="inv"><span class="mono dimmer">${esc(new Date(c.occurred_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))}</span><span><b>${esc(personName(c.customer_name))}</b> to ${esc(c.owner_name ? firstName(c.owner_name) : 'the line')} · "${esc((c.body || '(photo)').slice(0, 80))}"</span><span class="chip">${esc(brandName(c.cc_company_id))}</span><button class="btn sm" onclick="__go('file','${esc(c.customer_id)}')">Reply</button></div>`).join('')) : raw('<div class="empty">No customer texts in the last two weeks.</div>')}
      </div>
    </div>`;
}
