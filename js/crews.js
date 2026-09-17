// MY CREWS + THE NUGGET (356/357) — Mike's card on The Line. Kevin, 16 Sep 2026:
// "build mike the ability to tag his crews who are basically his employees… add
// their phone number… 5-7… easy fast understandable instructions that you won't
// forget… some objective nugget with something you need to bring me back. it's in
// your court." And the sod on the wrong yard: "there was enough doubt for everyone
// to point fingers… they need to know we told them next time." So every nugget is
// a receipt: texted (when), opened (when), RECIBIDO by name (when), brought back
// (what, when). Not to fight. So there is nothing to argue.
import { state, isDemo, personName, firstName, photoSrc, upsertCrew, sendNugget, searchCustomers } from './book.js?v=105';
import { $, html, raw, esc, toast, openModal } from './ui.js?v=105';
import { brandName } from './config.js?v=105';

const BRING = { done: 'Just tell me it is done', photo: 'A photo', number: 'A number', yesno: 'Yes or no', text: 'A few words' };
const mins = (m) => m >= 1440 ? Math.round(m / 1440) + ' d' : m >= 60 ? Math.round(m / 60) + ' h' : Math.round(m) + ' min';
const when = (s) => s ? new Date(s).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
const PUB = 'https://lzegjjbkfuecrhdvlvay.supabase.co/storage/v1/object/public/job-photos/';

/* who sees the card: a seat with crews of its own, or a manager with the keys and any crews at all */
export function crewsCard() {
  const me = state.me || {};
  const mine = (state.crews || []).filter((c) => c.active !== false && (c.manager_id === me.id || isDemo()));
  const canManage = ['manager', 'owner', 'admin'].includes(me.role) || isDemo();   // the film runs as an office seat; the demo shows the card to everyone
  if (!canManage) return '';
  const court = (state.nuggets || []).filter((n) => n.status === 'open' && (n.by_id === me.id || isDemo())).sort((a, b) => (b.late - a.late) || (b.open_min - a.open_min));
  const back = (state.nuggets || []).filter((n) => n.status === 'returned' && (n.by_id === me.id || isDemo())).sort((a, b) => new Date(b.returned_at) - new Date(a.returned_at)).slice(0, 6);
  const receipt = (n) => {
    const steps = [];
    steps.push(n.sms_status === 'sent' ? `📨 texted ${when(n.sms_sent_at)}` : n.sms_status ? `📨 text ${n.sms_status}` : '📨 no phone line');
    steps.push(n.seen_at ? `👀 opened ${when(n.seen_at)}` : '👀 not opened');
    steps.push(n.received_at ? `☑ RECIBIDO ${esc(firstName(n.received_by || n.person_name))} ${when(n.received_at)}` : '☐ not received yet');
    return `<div class="nrcpt">${steps.join(' · ')}</div>`;
  };
  return `<div class="card crews" data-tour="crews">
    <div class="head" style="margin-bottom:4px"><div class="kicker">My crews · ${mine.length} · the nugget: one instruction, one thing to bring back, a receipt nobody can argue</div>
      <div class="right"><button class="btn sm" id="crew-add">+ Crew</button><button class="btn sm fill" id="nugget-new" ${mine.length ? '' : 'disabled title="Add a crew first"'}>Send a nugget</button></div></div>
    ${mine.length ? `<div class="crewrow">${mine.map((c) => `<span class="crewchip" data-crew="${esc(c.id)}" title="${esc(c.phone)} · ${c.lang === 'es' ? 'español' : 'English'} · ${esc(brandName(c.cc_company_id))}"><b>${esc(c.name)}</b> <span class="mono dimmer">${esc(String(c.phone || '').replace(/^\+1/, ''))}</span></span>`).join('')}</div>` : '<div class="small dimmer">No crews yet. + Crew: a name, a phone, their language. No login, ever — one standing link.</div>'}
    ${court.length ? `<div class="kicker" style="margin:12px 0 4px">In their court · ${court.length}</div>${court.map((n) => `
      <div class="nug ${n.late ? 'late' : ''}">
        <div class="nughead"><span><b>${esc(n.person_name)}</b>${n.customer_name ? ` · <button class="inv" onclick="__peek('${esc(n.customer_id)}')">${esc(personName(n.customer_name))}${n.city ? ' · ' + esc(n.city) : ''}</button>` : ''}</span><span class="mono ${n.late ? 'red' : n.open_min > 240 ? 'clock' : 'dimmer'}">${n.late ? 'LATE · ' : ''}${esc(mins(n.open_min))}</span></div>
        <div class="nugbody">${esc(n.body)}${n.bring !== 'done' ? ` <span class="dimmer">· bring back: ${esc(n.bring_label || BRING[n.bring])}</span>` : ''}${n.due_at ? ` <span class="mono dimmer">· by ${esc(when(n.due_at))}</span>` : ''}</div>
        ${receipt(n)}
      </div>`).join('')}` : (mine.length ? '<div class="small dimmer" style="margin-top:8px">Nothing in their court.</div>' : '')}
    ${back.length ? `<div class="kicker" style="margin:12px 0 4px">Brought back</div>${back.map((n) => `
      <div class="nug back">
        <div class="nughead"><span><b>${esc(n.person_name)}</b>${n.customer_name ? ` · ${esc(personName(n.customer_name))}` : ''}</span><span class="mono verify">✓ ${esc(when(n.returned_at))} · ${esc(mins(n.minutes_to_return || 0))}</span></div>
        <div class="nugbody"><span class="dimmer">${esc(n.body)}</span>${n.answer ? ` → <b>${esc(n.answer)}</b>` : ''}</div>
        ${(n.photos || []).length ? `<div class="photo-grid" style="margin-top:4px">${n.photos.map((p) => `<div class="pt"><img class="pthumb grid" src="${PUB}${esc(p.path)}" data-full="${PUB}${esc(p.path)}" alt=""></div>`).join('')}</div>` : ''}
      </div>`).join('')}` : ''}
  </div>`;
}

export function wireCrews(root) {
  const add = root.querySelector('#crew-add'); if (add) add.onclick = () => crewDialog(null, root);
  root.querySelectorAll('.crewchip').forEach((ch) => (ch.onclick = () => { const c = (state.crews || []).find((x) => x.id === ch.dataset.crew); if (c) crewDialog(c, root); }));
  const nn = root.querySelector('#nugget-new'); if (nn) nn.onclick = () => nuggetDialog(root);
  root.querySelectorAll('.crews .pthumb').forEach((im) => (im.onclick = () => window.__lightbox && window.__lightbox(im.dataset.full || im.src, '')));
}

function crewDialog(c, root) {
  openModal({
    title: c ? `${c.name}` : 'A crew · a name, a phone, their language',
    submitLabel: c ? 'Save' : 'Add the crew',
    body: `
      <div class="field"><label>Name</label><input name="name" value="${esc(c?.name || '')}" placeholder="Nick" required></div>
      <div class="two-up">
        <div class="field"><label>Phone (texts go here)</label><input name="phone" value="${esc(String(c?.phone || '').replace(/^\+1/, ''))}" placeholder="321 555 0100" inputmode="tel" required></div>
        <div class="field"><label>Language</label><select name="lang"><option value="es" ${(c?.lang || 'es') === 'es' ? 'selected' : ''}>Español</option><option value="en" ${c?.lang === 'en' ? 'selected' : ''}>English</option></select></div>
      </div>
      <div class="field"><label>Company</label><select name="company">${['1560', '1461', '1537', '1563'].map((k) => `<option value="${k}" ${(c?.cc_company_id || '1560') === k ? 'selected' : ''}>${esc(brandName(k))}</option>`).join('')}</select></div>
      ${c ? `<label class="tagchip"><input type="checkbox" name="active" ${c.active !== false ? 'checked' : ''}> Active</label>` : ''}
      <div class="small dimmer">No login. Every nugget texts them a link; the link is theirs for good.</div>`,
    onSubmit: async (f) => {
      if (isDemo()) { toast('Demo — nothing is saved'); return; }
      const row = await upsertCrew(c?.id || null, f.name.value.trim(), f.phone.value.trim(), f.company.value, f.lang.value, c ? f.active.checked : true);
      const list = state.crews || []; const i = list.findIndex((x) => x.id === row.id); if (i >= 0) list[i] = row; else list.unshift(row); state.crews = list;
      toast(`${row.name} is on the crews`);
      const card = root.querySelector('.card.crews'); if (card) { card.outerHTML = crewsCard(); wireCrews(root); }
    },
  });
}

export function nuggetDialog(root, pre = {}) {
  const mine = (state.crews || []).filter((c) => c.active !== false);
  if (!mine.length) { toast('Add a crew first — + Crew on The Line', 'err'); return; }
  let cust = pre.customer ? { id: pre.customer.id, name: pre.customer.name } : null;
  const shots = (pre.photos || []).slice(0, 6);
  openModal({
    title: 'Send a nugget',
    submitLabel: 'Send it',
    body: `
      <div class="field"><label>To</label><select name="person">${mine.map((c) => `<option value="${esc(c.id)}">${esc(c.name)} · ${c.lang === 'es' ? 'español' : 'English'}</option>`).join('')}</select></div>
      ${shots.length ? `<div class="field"><label>The picture goes with it · the scope, on the yard</label><div class="photo-grid">${shots.map((p) => `<div class="pt"><img class="pthumb grid" src="${esc(photoSrc(p, true))}" alt=""></div>`).join('')}</div></div>` : ''}
      <div class="field"><label>The instruction · one thing, plain</label><textarea name="body" rows="2" placeholder="Sod goes on 1420 Palm Ave, the BACK yard only. Front stays." required>${esc(pre.body || '')}</textarea></div>
      <div class="two-up">
        <div class="field"><label>Which customer (optional) · the address goes on the nugget</label><input name="cust" placeholder="Last name, street or phone" autocomplete="off" value="${esc(cust ? personName(cust.name) : '')}"><div id="nug-cust-pick" class="pick"></div></div>
        <div class="field"><label>Price on this piece ($)</label><input name="amount" type="number" min="0" step="1" inputmode="decimal" placeholder="3400" value="${pre.amount != null ? esc(String(pre.amount)) : ''}"></div>
      </div>
      <div class="two-up">
        <div class="field"><label>Bring back</label><select name="bring">${Object.entries(BRING).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select></div>
        <div class="field"><label>What exactly</label><input name="bring_label" placeholder="a photo of the finished back yard"></div>
      </div>
      <div class="field"><label>By when (optional)</label><input name="due" type="datetime-local"></div>
      <div class="small dimmer">They get a text with the link. They tap RECIBIDO · ENTENDIDO, then bring it back. Every step is stamped on the nugget and on the customer's file.</div>`,
    onOpen: (f) => {
      const inp = f.cust, pick = f.querySelector('#nug-cust-pick'); let t = null;
      inp.oninput = () => { clearTimeout(t); const q = inp.value.trim(); cust = null; if (q.length < 2) { pick.innerHTML = ''; return; } t = setTimeout(async () => {
        const rows = await searchCustomers(q).catch(() => []);
        pick.innerHTML = rows.slice(0, 6).map((r) => `<button type="button" class="sub" data-id="${esc(r.id)}">${esc(personName(r.name))}${r.city ? ' · ' + esc(r.city) : ''}</button>`).join('');
        pick.querySelectorAll('button').forEach((b) => (b.onclick = () => { cust = { id: b.dataset.id, name: b.textContent }; inp.value = b.textContent; pick.innerHTML = ''; }));
      }, 250); };
    },
    onSubmit: async (f) => {
      const body = f.body.value.trim(); if (!body) throw new Error('Say the one thing');
      if (isDemo()) { toast('Demo — on live this texts them the link and it lands in their court'); return; }
      const due = f.due.value ? new Date(f.due.value).toISOString() : null;
      const amt = f.amount.value.trim() === '' ? null : Number(f.amount.value);
      const r = await sendNugget(f.person.value, body, f.bring.value, f.bring_label.value.trim() || null, cust?.id || null, due, shots.map((p) => p.id), Number.isFinite(amt) ? amt : null);
      toast(r?.texted ? 'Sent — they got the text with the link' : 'Saved, but no line to text from — send them the link yourself', r?.texted ? '' : 'err');
      window.__reloadQuiet && window.__reloadQuiet();
    },
  });
}

/* the door from any photo tile: this picture, these words, this price → a crew (Kevin, 16 Sep: "post the pic to the crew when he assigns it… locks in scope and price in pic") */
window.__nuggetFromPhoto = (photo, customer) => nuggetDialog(document.querySelector('main') || document.body, { photos: [photo], customer, body: photo.caption || '', amount: photo.amount });
