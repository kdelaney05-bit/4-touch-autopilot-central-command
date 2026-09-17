// Sales — the owner console's Sales section, embedded whole (the signed
// dollars over the rep cards, the Hustle room, Moneyball), with the file's
// own read underneath: who is waiting on a rep right now. The retail board
// and Jermey's desk open from the header.
import { state, isDemo, personName, firstName } from './book.js?v=106';
import { html, raw, esc } from './ui.js?v=106';
import { brandName, CONSOLE_URL, CONSOLE_SECTION } from './config.js?v=106';
import { relTime } from './production.js?v=106';
import { renderRoom } from './village.js?v=106';

export function renderSales(root) {
  const waiting = state.clock.filter((c) => (c.stage === 'selling' || c.stage === 'booked') && c.waiting_min >= 15);
  root.innerHTML = html`
    <div class="head" style="margin-bottom:10px">
      <div><div class="kicker">Sales room · the owner console's Sales section, live</div><h1 class="serif">The foot soldiers and the fighter pilot, on one page.</h1></div>
      <div class="right">
        <a class="btn" href="${CONSOLE_URL}#${CONSOLE_SECTION.sales}" target="_blank" rel="noopener">Open full screen</a>
        <a class="btn" href="https://kdelaney05-bit.github.io/trureview-mobile/" target="_blank" rel="noopener">The rep app on the web</a>
        <a class="btn fill" href="https://kdelaney05-bit.github.io/trureview-mobile/desk/" target="_blank" rel="noopener">Jermey's desk</a>
        ${isDemo() ? raw('<span class="chip demo">DEMO · the console is live</span>') : ''}
      </div>
    </div>
    <div class="embed"><iframe title="The owner console · Sales" src="${CONSOLE_URL}#${CONSOLE_SECTION.sales}" loading="lazy" allow="clipboard-write"></iframe></div>
    <div id="sales-village" style="margin-top:12px"></div>
    <div class="card" style="margin-top:12px">
      <div class="kicker" style="color:var(--clock)">Customers waiting on a rep · ${waiting.length} · from the file</div>
      ${waiting.length ? raw(waiting.slice(0, 12).map((c) => `<div class="inv red"><span class="mono dimmer">${esc(relTime(c.occurred_at))}</span><span><b>${esc(personName(c.customer_name))}</b> · "${esc((c.body || '(photo)').slice(0, 70))}" · ${esc(c.owner_name ? firstName(c.owner_name) : 'no rep')}</span><span class="chip">${esc(brandName(c.cc_company_id))}</span><button class="btn sm" onclick="__peek('${esc(c.customer_id)}')">Open file</button></div>`).join('')) : raw('<div class="empty">Every selling customer has been answered.</div>')}
    </div>`;

  // the reps' own hype thread, the same one on their phones
  renderRoom(root.querySelector('#sales-village'), 'sales');
}
