// SEND QUOTE TO GIO — the pricer's side (353). Kevin, 16 Sep 2026: "his biggest
// help is helping the guys get pricing for hard fence jobs fast… a checklist…
// pics… cut this down 1/3–1/4." The rep fills the checklist on the phone; it
// lands here as one card at the top of The Line for whoever prices (Gio), with
// the checklist, the photos and a price box. His price is one line on the file
// that @-tags the rep, so the rep's phone buzzes. Everyone else sees the card
// on the customer's file: what was asked, what came back, how long it took.
import { state, isDemo, personName, firstName, answerQuote, photoSrc } from './book.js?v=102';
import { $, html, raw, esc, toast, openModal } from './ui.js?v=102';
import { brandName } from './config.js?v=102';

const money = (n) => '$' + Number(n).toLocaleString([], { maximumFractionDigits: 0 });
const mins = (m) => m >= 1440 ? Math.round(m / 1440) + ' d' : m >= 60 ? Math.round(m / 60) + ' h' : Math.round(m) + ' min';
const CHECK = () => (state.quoteChecklist || []).slice().sort((a, b) => a.ord - b.ord);

/* the checklist as Gio reads it: label: value, one line each, empties skipped */
export function checklistHTML(q) {
  const f = q.fields || {};
  const rows = CHECK().filter((c) => String(f[c.key] ?? '').trim() !== '').map((c) => `<div class="r"><span class="dimmer">${esc(c.label)}</span><span>${esc(String(f[c.key]))}</span></div>`);
  return rows.length ? `<div class="rows qrows">${rows.join('')}</div>` : '<div class="small dimmer">No checklist — just the note.</div>';
}
function photosHTML(q) {
  const ids = new Set(q.photo_ids || []);
  const ph = (q.photos || (state.filePhotos || [])).filter((p) => ids.has(p.id));
  if (!ph.length) return '';
  return `<div class="photo-grid" style="margin-top:6px">${ph.map((p) => `<div class="pt"><img class="pthumb grid" src="${esc(photoSrc(p, true))}" data-full="${esc(photoSrc(p))}" alt=""></div>`).join('')}</div>`;
}

/* THE PRICER'S QUEUE — at the top of The Line for the seat that prices */
export function quotesQueueCard() {
  const me = state.me || {};
  const mine = (state.quotes || []).filter((q) => q.status === 'open' && (q.assignee_id === me.id || isDemo())).map((q) => ({ ...q, photos: state.quotePhotos })).sort((a, b) => b.open_min - a.open_min);
  if (!mine.length) return '';
  return `<div class="card quotes" data-tour="quotes">
    <div class="head" style="margin-bottom:4px"><div class="kicker">Quotes to price · ${mine.length} waiting on you · oldest first</div><div class="right"><span class="chip">the reps' hard ones</span></div></div>
    ${mine.map((q) => `<div class="qreq" data-q="${esc(q.id)}">
      <div class="qhead"><button class="inv" onclick="__peek('${esc(q.customer_id)}')"><b>${esc(personName(q.customer_name))}</b> · ${esc(q.city || '')} · ${esc(brandName(q.cc_company_id))}</button><span class="mono ${q.open_min > 240 ? 'red' : q.open_min > 60 ? 'clock' : 'dimmer'}">${esc(mins(q.open_min))} · ${esc(firstName(q.rep_name))}</span></div>
      ${checklistHTML(q)}
      ${q.note ? `<div class="small" style="margin-top:4px">${esc(q.note)}</div>` : ''}
      ${photosHTML(q)}
      <div class="qans"><span class="mono">$</span><input type="number" min="0" step="1" inputmode="decimal" placeholder="9,900" data-price="${esc(q.id)}"><input type="text" placeholder="a word for ${esc(firstName(q.rep_name))} — rack it, add a day, tear-out is the cost…" data-note="${esc(q.id)}"><button class="btn sm fill" data-send="${esc(q.id)}">Send the price</button></div>
    </div>`).join('')}
  </div>`;
}
export function wireQuotes(root) {
  root.querySelectorAll('[data-send]').forEach((b) => (b.onclick = async () => {
    const id = b.dataset.send;
    const price = Number(root.querySelector(`[data-price="${CSS.escape(id)}"]`)?.value || '');
    const note = (root.querySelector(`[data-note="${CSS.escape(id)}"]`)?.value || '').trim();
    if (!Number.isFinite(price) || price <= 0) { toast('Type the price first', 'err'); return; }
    if (isDemo()) { toast('Demo — on live this lands on the file and buzzes the rep'); return; }
    b.disabled = true;
    try {
      await answerQuote(id, price, note);
      const q = (state.quotes || []).find((x) => x.id === id); if (q) { q.status = 'priced'; q.price = price; q.answer_note = note; }
      b.closest('.qreq')?.remove();
      toast(`Priced — ${money(price)} is on the file and the rep got the buzz`);
    } catch (e) { toast(e.message || 'Could not send the price', 'err'); b.disabled = false; }
  }));
  root.querySelectorAll('.quotes .pthumb').forEach((im) => (im.onclick = () => window.__lightbox && window.__lightbox(im.dataset.full || im.src, '')));
}

/* THE FILE'S CARD — what was asked, what came back, for everyone who can read the file */
export function quoteFileCard(quotes, photos) {
  const me = state.me || {};
  const list = (quotes || []).map((q) => ({ ...q, photos })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (!list.length) return '';
  return `<div class="card quotes">
    <div class="kicker">Quote to ${esc(firstName(list[0].assignee_name) || 'Gio')} · ${list.length === 1 ? 'one ask' : list.length + ' asks'}</div>
    ${list.map((q) => `<div class="qreq" data-q="${esc(q.id)}">
      <div class="qhead"><span><b>${esc(firstName(q.rep_name))}</b> asked · ${esc(new Date(q.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))}</span>
        <span class="chip ${q.status === 'priced' ? 'ok' : ''}">${q.status === 'priced' ? 'PRICED · ' + esc(mins(q.minutes_to_answer || 0)) : q.status === 'void' ? 'DROPPED' : 'WAITING · ' + esc(mins(q.open_min))}</span></div>
      ${checklistHTML(q)}
      ${q.note ? `<div class="small" style="margin-top:4px">${esc(q.note)}</div>` : ''}
      ${q.status === 'priced' ? `<div class="qprice"><b>${esc(money(q.price))}</b>${q.answer_note ? ' · ' + esc(q.answer_note) : ''} <span class="dimmer">· ${esc(firstName(q.assignee_name))}</span></div>` : ''}
      ${q.status === 'open' && (q.assignee_id === me.id || isDemo()) ? `<div class="qans"><span class="mono">$</span><input type="number" min="0" step="1" inputmode="decimal" placeholder="9,900" data-price="${esc(q.id)}"><input type="text" placeholder="a word for ${esc(firstName(q.rep_name))}" data-note="${esc(q.id)}"><button class="btn sm fill" data-send="${esc(q.id)}">Send the price</button></div>` : ''}
    </div>`).join('')}
  </div>`;
}
