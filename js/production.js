// Production — the stage board (every sold customer, by who holds them), My
// board (the supervisor's jobs), and Take the job.
import { state, isDemo, personName, firstName, takeJob, assignJob, handBack, seatName } from './book.js?v=18';
import { $, html, raw, esc, toast, openModal } from './ui.js?v=18';
import { STAGES, STAGE_LINE_DAYS, brandName, stageLabel } from './config.js?v=18';
import { reload } from './app.js?v=18';
import { renderRoom } from './village.js?v=18';

let sub = 'stage';      // stage | mine
let brand = 'all';
let showStale = false;   // jobs signed > 180 days ago with no activity — CC hygiene, hidden by default
const mins = (m) => m == null ? '' : m >= 1440 ? (m / 1440).toFixed(1) + ' d' : m >= 60 ? (m / 60).toFixed(1) + ' h' : Math.round(m) + ' min';
const money = (n) => n == null ? '—' : '$' + Math.round(Number(n)).toLocaleString();
const overLine = (b) => b.days_in_stage != null && b.days_in_stage > (STAGE_LINE_DAYS[b.stage] ?? 99);

export function renderProduction(root) {
  const me = state.me;
  const staleN = state.board.filter((b) => b.stale).length;
  const B = state.board.filter((b) => (brand === 'all' || b.cc_company_id === brand) && (showStale || !b.stale));
  const open = B.filter((b) => ['sold_office', 'production', 'field_complete', 'invoiced'].includes(b.stage));
  const waiting = open.filter((b) => b.stage === 'sold_office');
  const mine = state.board.filter((b) => b.supervisor_id === me?.id && ['production', 'field_complete'].includes(b.stage));
  const counts = { sold_office: open.filter((b) => b.stage === 'sold_office').length, production: open.filter((b) => b.stage === 'production').length, field_complete: open.filter((b) => b.stage === 'field_complete').length, invoiced: open.filter((b) => b.stage === 'invoiced').length };
  const brands = [...new Set(state.board.map((b) => b.cc_company_id).filter(Boolean))];

  root.innerHTML = html`
    <div class="head">
      <div><div class="kicker">Production room · ${sub === 'mine' ? 'my board' : 'the stage board'} · who has the customer right now, and for how long</div>
        <h1 class="serif">${sub === 'mine' ? `${mine.length} jobs on me.` : `${counts.production} in production. ${counts.sold_office} sold and waiting for a supervisor.`}</h1></div>
      <div class="right subs">
        <button class="sub ${sub === 'stage' ? 'on' : ''}" data-sub="stage">Stage board</button>
        <button class="sub ${sub === 'mine' ? 'on' : ''}" data-sub="mine">My board <span class="mono">${mine.length}</span></button>
        ${isDemo() ? raw('<span class="chip demo">DEMO</span>') : ''}
      </div>
    </div>

    <div id="prod-village"></div>

    <div class="tiles" style="grid-template-columns:repeat(4,minmax(0,1fr))">
      ${raw([['sold_office', 'Sold · waiting for a supervisor', 'var(--office)'], ['production', 'In production', 'var(--prod)'], ['field_complete', 'Field complete · invoice pending', 'var(--verify)'], ['invoiced', 'Invoiced · collecting', 'var(--dim)']].map(([s, label, color]) => `
        <div class="tile"><div class="kicker">${esc(label)}</div><div class="fnum" style="color:${color}">${counts[s]}</div>
          <div class="small">${esc(money(open.filter((b) => b.stage === s).reduce((a, b) => a + Number(b.fin_sold_amount || 0), 0)))} · line at ${STAGE_LINE_DAYS[s]} d</div></div>`).join(''))}
    </div>

    <div class="card">
      <div class="subs" style="margin-bottom:6px">
        <button class="sub ${brand === 'all' ? 'on' : ''}" data-brand="all">All · ${open.length}</button>
        ${raw(brands.map((cc) => `<button class="sub ${brand === cc ? 'on' : ''}" data-brand="${esc(cc)}">${esc(brandName(cc))}</button>`).join(''))}
        <button class="sub ${showStale ? 'on' : ''}" data-stale="1">Stale · ${staleN}</button>
        <span class="small" style="margin-left:auto">sorted by days in stage · red past the line · stale = signed 6+ months ago, nothing since</span>
      </div>
      <div class="wrap">${raw(table(sub === 'mine' ? mine : open, me))}</div>
    </div>`;

  renderRoom(root.querySelector('#prod-village'), 'production');
  root.querySelectorAll('[data-sub]').forEach((b) => (b.onclick = () => { sub = b.dataset.sub; renderProduction(root); }));
  root.querySelectorAll('[data-brand]').forEach((b) => (b.onclick = () => { brand = b.dataset.brand; renderProduction(root); }));
  root.querySelectorAll('[data-stale]').forEach((b) => (b.onclick = () => { showStale = !showStale; renderProduction(root); }));
  root.querySelectorAll('[data-take]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); take(b.dataset.take, b.dataset.name); }));
  root.querySelectorAll('[data-assign]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); assign(b.dataset.assign, b.dataset.name); }));
  root.querySelectorAll('[data-back]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); back(b.dataset.back, b.dataset.name); }));
}

function table(rows, me) {
  if (!rows.length) return '<div class="empty">Nothing here.</div>';
  const canAssign = ['owner', 'admin', 'manager'].includes(me?.role);
  return `<table><thead><tr><th>Customer · job</th><th>Brand</th><th>Stage</th><th>Who holds it</th><th>Days in stage</th><th>Last customer text</th><th>Open asks</th><th></th></tr></thead><tbody>${rows.map((b) => {
    const st = STAGES[b.stage] || {};
    const wait = b.waiting_min != null ? ` <span class="mono red">· waiting ${esc(mins(b.waiting_min))}</span>` : '';
    const last = b.last_inbound_body ? `"${esc(String(b.last_inbound_body).slice(0, 60))}" · ${esc(relTime(b.last_inbound_at))}${wait}` : '<span class="dimmer">—</span>';
    const holder = b.stage === 'sold_office' && b.open_asks === 0 ? '<span class="red">nobody · signed ' + esc(relTime(b.contract_signed_at)) + '</span>'
                 : esc(b.owner_name || 'nobody') + (b.supervisor_id && b.stage !== 'production' ? ' <span class="dimmer">· ' + esc(firstName(seatName(b.supervisor_id) || '')) + ' in the field</span>' : '');
    const act = b.stage === 'sold_office'
      ? `<button class="btn sm fill" data-take="${esc(b.job_id)}" data-name="${esc(personName(b.customer_name))}">Take the job</button>${canAssign ? ` <button class="btn sm" data-assign="${esc(b.job_id)}" data-name="${esc(personName(b.customer_name))}">Assign</button>` : ''}`
      : b.stage === 'production' && b.supervisor_id === me?.id ? `<button class="btn sm" data-back="${esc(b.job_id)}" data-name="${esc(personName(b.customer_name))}">Hand back</button>`
      : '';
    return `<tr class="link" onclick="__peek('${esc(b.customer_id)}')"><td><b>${esc(personName(b.customer_name))}</b> · ${esc(b.title || '')} <span class="mono dimmer">${esc(money(b.fin_sold_amount))}</span></td><td><span class="chip">${esc(brandName(b.cc_company_id))}</span></td><td><span class="chip ${st.cls || 'st-ink'}">${esc(stageLabel(b.stage))}</span></td><td>${holder}</td><td class="mono ${overLine(b) ? 'red' : ''}">${b.days_in_stage ?? '—'}</td><td>${last}</td><td class="mono">${b.open_asks ?? 0}</td><td onclick="event.stopPropagation()">${act} <button class="btn sm" onclick="__peek('${esc(b.customer_id)}')">Open file</button></td></tr>`;
  }).join('')}</tbody></table>`;
}

export function relTime(iso) {
  if (!iso) return '';
  const h = (Date.now() - new Date(iso)) / 36e5;
  if (h < 1) return Math.max(1, Math.round(h * 60)) + ' min ago';
  if (h < 24) return Math.round(h) + ' h ago';
  return Math.round(h / 24) + ' d ago';
}

async function take(jobId, name) {
  try { await takeJob(jobId); toast(`You have ${name}. The sign-off ask is on your board.`); await reload(true); }
  catch (e) { toast(e.message, 'err'); }
}
async function back(jobId, name) {
  openModal({ title: `Hand ${name} back`, submitLabel: 'Hand it back', body: `<div class="field"><label>Why (the office and Luis see this)</label><textarea name="note" required></textarea></div>`,
    onSubmit: async (f) => { await handBack(jobId, f.note.value.trim()); toast('Handed back'); await reload(true); } });
}
async function assign(jobId, name) {
  const sups = state.seats.filter((s) => s.role === 'manager');
  openModal({ title: `Assign ${name}`, submitLabel: 'Assign', body: `<div class="field"><label>Supervisor</label><select name="to">${sups.map((s) => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select></div><div class="field"><label>Note</label><input name="note" placeholder="optional"/></div>`,
    onSubmit: async (f) => { await assignJob(jobId, f.to.value, f.note.value.trim() || null); toast('Assigned — they get a push'); await reload(true); } });
}
