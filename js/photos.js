// THE PHOTOS ROOM (Kevin, 15 Sep night: "we need to make the photo part in our
// app obvious to find and easy to use… mike uses the photos for his crews and
// landscapes"). Every picture the seat can read, company-wide, newest first,
// grouped by day — ours (351) and CompanyCam's (028) in one feed. Each tile
// carries the customer (tap → the file), who shot it, the crew and the dollars
// (352). One search box: a customer, a person, a crew, or a word in the caption.
import { state, isDemo, loadPhotoFeed, personName, firstName, photoSrc } from './book.js?v=146';
import { $, html, raw, esc, toast } from './ui.js?v=146';

let feed = null, q = '';
const money = (n) => '$' + Number(n).toLocaleString([], { maximumFractionDigits: 0 });

export async function renderPhotos(root) {
  root.innerHTML = html`
    <div class="head">
      <div><div class="kicker">Photos · every picture on every file, newest first</div><h1 class="serif">Say it with the picture.</h1></div>
      <div class="right"><button class="btn sm" id="ph-reload" title="Read the feed again">Refresh</button> ${isDemo() ? raw('<span class="chip demo">DEMO · FICTIONAL BOOK</span>') : raw('<span class="chip">LIVE · DB</span>')}</div>
    </div>
    <div class="card" style="flex-direction:row;gap:10px;align-items:center;flex-wrap:wrap">
      <input id="ph-q" class="photo-cap" style="margin:0;flex:1;min-width:220px" placeholder="A customer, a person, a crew, or a word in the caption" value="${q}">
      <span class="small dimmer" id="ph-n"></span>
      <span class="small dimmer">To add one: open the customer's file and press <b>＋ Photo</b>. Crews send theirs from the link.</span>
    </div>
    <div id="ph-feed"><div class="empty">Loading the pictures…</div></div>`;
  if (!feed) feed = await loadPhotoFeed().catch((e) => { toast(e.message || 'Could not read the photos', 'err'); return []; });
  paint(root);
  $('#ph-q').oninput = (e) => { q = e.target.value; paint(root); };
  $('#ph-reload').onclick = async () => { feed = null; renderPhotos(root); };
}

function paint(root) {
  if (!feed) return;
  const needle = q.trim().toLowerCase();
  const rows = feed.filter((p) => !needle || [personName(p.customer_name), p.by_name, p.crew, p.caption].filter(Boolean).join(' ').toLowerCase().includes(needle));
  const n = $('#ph-n'); if (n) n.textContent = `${rows.length}${rows.length !== feed.length ? ' of ' + feed.length : ''} photo${rows.length === 1 ? '' : 's'}`;
  const days = []; let last = null;
  for (const p of rows.slice(0, 240)) {
    const d = new Date(p.taken_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    if (d !== last) { days.push({ d, list: [] }); last = d; }
    days[days.length - 1].list.push(p);
  }
  const host = $('#ph-feed'); if (!host) return;
  host.innerHTML = rows.length
    ? days.map((g) => `<div class="kicker" style="margin:14px 0 6px">${esc(g.d)} · ${g.list.length}${g.list.some((p) => p.amount) ? ' · <span class="mono">' + esc(money(g.list.reduce((a, p) => a + Number(p.amount || 0), 0))) + '</span> on the pictures' : ''}</div><div class="photo-feed">${g.list.map(tile).join('')}</div>`).join('')
    : '<div class="empty">No pictures yet. Open a customer\'s file and press ＋ Photo.</div>';
  host.querySelectorAll('.ptile img').forEach((im) => (im.onclick = () => { const r = rows.find((x) => photoSrc(x) === im.dataset.full); window.__lightbox && window.__lightbox(im.dataset.full, im.title || '', r, r ? { id: r.customer_id, name: r.customer_name } : null); }));
  host.querySelectorAll('.ptile .pname').forEach((b) => (b.onclick = () => window.__peek(b.dataset.cust)));
}

function tile(p) {
  const who = [firstName(p.by_name), p.crew ? 'crew ' + p.crew : ''].filter(Boolean).join(' · ');
  const tags = (p.tagged || []).map((id) => (state.people || []).find((x) => x.id === id)).filter(Boolean).map((x) => '@' + firstName(x.name)).join(' ');
  return `<div class="ptile">
    <div class="pt"><img src="${esc(photoSrc(p, true))}" data-full="${esc(photoSrc(p))}" title="${esc([personName(p.customer_name), p.by_name, p.caption].filter(Boolean).join(' · '))}" loading="lazy" alt="">${p.amount ? `<span class="pbadge">${esc(money(p.amount))}</span>` : ''}${p.kind === 'companycam' ? '<span class="pbadge cc">CC</span>' : ''}</div>
    <button class="inv pname" data-cust="${esc(p.customer_id)}"><b>${esc(personName(p.customer_name))}</b></button>
    <div class="pmeta">${esc(who)}${tags ? ' · <span class="blue">' + esc(tags) + '</span>' : ''} · <span class="mono dimmer">${esc(new Date(p.taken_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))}</span></div>
    ${p.caption ? `<div class="pcap">${esc(p.caption)}</div>` : ''}
  </div>`;
}
