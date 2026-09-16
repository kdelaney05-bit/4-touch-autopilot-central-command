// WHAT I SENT OUT — the downline (358). Kevin, 16 Sep 2026: "I should know what I
// sent out got acknowledged and checked off… 15 directives, done in 5 min by this
// person, confirmed by this person… hold people accountable without beating them,
// make them look good… my 20 recommendations led to this, led to this, led to
// this… straight down chain, follow through, look in — but not in a stressful
// way. Keep helping that person solve their issue better."
// So: one card for the sender. Every directive in the window — a note that named
// someone, an ask, a nugget, a quote — with who it reached, who acknowledged, who
// did it and how fast, and the chain that followed on that file. Language law:
// nobody is late or failing here; a thing is done, moving, or waiting.
import { state, isDemo, personName, firstName } from './book.js?v=74';
import { $, html, raw, esc } from './ui.js?v=74';

const mins = (m) => m >= 1440 ? Math.round(m / 1440) + ' d' : m >= 60 ? Math.round(m / 60) + ' h' : Math.round(m) + ' min';
const when = (s) => s ? new Date(s).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
const ago = (s) => s ? mins((Date.now() - new Date(s)) / 60000) : '';
const KIND = { note: 'said', ask: 'asked for', nugget: 'nugget', quote: 'quote' };
let openIds = new Set();

export function sentCard() {
  const rows = state.directives || [];
  if (!rows.length) return '';
  const done = rows.filter((r) => r.done_at), acked = rows.filter((r) => (r.to || []).some((t) => t.ack_at) || r.done_at);
  const avg = done.length ? Math.round(done.reduce((a, r) => a + (r.minutes ?? (new Date(r.done_at) - new Date(r.at)) / 60000), 0) / done.length) : null;
  const me = firstName(state.me?.name || 'you');
  const byDay = []; let last = null;
  for (const r of rows) { const d = new Date(r.at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }); if (d !== last) { byDay.push({ d, list: [] }); last = d; } byDay[byDay.length - 1].list.push(r); }
  return `<div class="card sent" data-tour="sent">
    <div class="head" style="margin-bottom:2px"><div class="kicker">What ${esc(me)} sent out · last 7 days</div>
      <div class="right subs"><span class="sub on">${rows.length} sent</span><span class="sub">${acked.length} acknowledged</span><span class="sub">${done.length} done${avg != null ? ' · ' + esc(mins(avg)) + ' each' : ''}</span></div></div>
    <div class="small dimmer" style="margin-bottom:6px">Every directive, who it reached, who picked it up, and the chain that followed. Tap one to look in.</div>
    ${byDay.map((g) => `<div class="kicker" style="margin:10px 0 2px">${esc(g.d)}</div>${g.list.map(row).join('')}`).join('')}
  </div>`;
}

function status(r) {
  if (r.done_at) return `<span class="chip ok">✓ done${r.done_by ? ' · ' + esc(firstName(r.done_by)) : ''}${r.minutes != null ? ' · ' + esc(mins(r.minutes)) : r.done_at ? ' · ' + esc(mins((new Date(r.done_at) - new Date(r.at)) / 60000)) : ''}</span>`;
  const ack = (r.to || []).find((t) => t.ack_at);
  if (ack) return `<span class="chip st-blue">picked up · ${esc(firstName(ack.name))} · ${esc(ago(ack.ack_at))} ago</span>`;
  return `<span class="chip">with them · ${esc(ago(r.at))}</span>`;
}
function toLine(r) {
  return (r.to || []).map((t) => `<span class="${t.ack_at ? 'verify' : ''}" title="${esc(t.ack_at ? 'opened ' + when(t.ack_at) : t.has_phone ? 'buzzed on the phone' : 'waits in their You\'re up')}">${esc(firstName(t.name))}${t.ack_at ? ' ✓' : t.has_phone ? ' 📱' : ' 🖥'}</span>`).join(' · ');
}
function row(r) {
  const open = openIds.has(r.id);
  const chain = (r.downline || []);
  return `<div class="dir ${r.done_at ? 'done' : ''}" data-dir="${esc(r.id)}">
    <div class="dirhead">
      <span class="dirkind mono">${esc(KIND[r.kind] || r.kind)}</span>
      <span class="dirbody"><b>${esc(r.customer_name ? personName(r.customer_name) : 'the team')}</b> · ${esc(String(r.body || '').replace(/^📷 |^🧾 |^📌 → /, '').slice(0, 110))}</span>
      <span class="dirto">→ ${toLine(r)}</span>
      ${status(r)}
    </div>
    ${open ? `<div class="chain">
      <div class="step first"><span class="mono dimmer">${esc(when(r.at))}</span><b>${esc(firstName(state.me?.name || 'you'))}</b><span>${esc(String(r.body || '').slice(0, 220))}</span></div>
      ${(r.to || []).map((t) => `<div class="step"><span class="mono dimmer">${esc(t.ack_at ? when(t.ack_at) : '')}</span><b>${esc(firstName(t.name))}</b><span>${t.ack_at ? 'opened it' : t.has_phone ? 'phone buzzed · not opened yet' : 'in their You\'re up · not opened yet'}</span></div>`).join('')}
      ${chain.map((s) => `<div class="step"><span class="mono dimmer">${esc(when(s.at))}</span><b>${esc(firstName(s.who))}</b><span>${esc(s.what)}</span></div>`).join('')}
      ${r.answer ? `<div class="step"><span class="mono dimmer">${esc(when(r.done_at))}</span><b>${esc(firstName(r.done_by || ''))}</b><span>brought back: ${esc(r.answer)}</span></div>` : ''}
      ${!chain.length && !r.done_at && !(r.to || []).some((t) => t.ack_at) ? '<div class="step"><span></span><span class="dimmer">nothing yet — it is with them</span></div>' : ''}
      ${r.customer_id ? `<div class="step"><span></span><button class="btn sm" onclick="__peek('${esc(r.customer_id)}')">Open the file</button></div>` : ''}
    </div>` : ''}
  </div>`;
}
export function wireSent(root) {
  root.querySelectorAll('.dir .dirhead').forEach((h) => (h.onclick = () => {
    const id = h.parentElement.dataset.dir; if (openIds.has(id)) openIds.delete(id); else openIds.add(id);
    const card = root.querySelector('.card.sent'); if (card) { card.outerHTML = sentCard(); wireSent(root); }
  }));
}
