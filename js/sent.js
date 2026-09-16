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
import { state, isDemo, personName, firstName, loadFile, threadForJob, postMessage, postRoom, mentionHandle } from './book.js?v=92';
import { $, html, raw, esc, toast, openModal } from './ui.js?v=92';

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
      <div class="step"><span></span><span style="display:flex;gap:6px;flex-wrap:wrap">${r.done_at ? `<button class="btn sm fill" data-thank="${esc(r.id)}">👏 Appreciate</button>` : ''}${r.customer_id ? `<button class="btn sm" onclick="__peek('${esc(r.customer_id)}')">Open the file</button>` : ''}</span></div>
    </div>` : ''}
  </div>`;
}
export function wireSent(root) {
  root.querySelectorAll('[data-thank]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); const r = (state.directives || []).find((x) => x.id === b.dataset.thank); if (r) appreciate(r, root); }));
  root.querySelectorAll('.dir .dirhead').forEach((h) => (h.onclick = () => {
    const id = h.parentElement.dataset.dir; if (openIds.has(id)) openIds.delete(id); else openIds.add(id);
    const card = root.querySelector('.card.sent'); if (card) { card.outerHTML = sentCard(); wireSent(root); }
  }));
}

/* THE ENCOURAGER (Kevin, 16 Sep: "hey man saw all your efforts, love the new email text program,
   it's really paying off, gonna share with team — encourager and rewarder and appreciator all in
   one"). One tap on a finished directive: the words pre-written from the chain, in Kevin's voice,
   to the person who did it; they get the push; a box shares it with the team room. Cause and
   effect, said out loud — the Showman's law, by a human this time. */
function appreciate(r, root) {
  const who = r.done_by || (r.to || [])[0]?.name || '';
  const person = (state.people || []).find((p) => p.name === who) || (state.people || []).find((p) => firstName(p.name) === firstName(who));
  const handle = person ? mentionHandle(person) : '@' + firstName(who);
  const cust = r.customer_name ? personName(r.customer_name) : 'that one';
  const took = r.minutes != null ? mins(r.minutes) : r.done_at ? mins((new Date(r.done_at) - new Date(r.at)) / 60000) : '';
  const steps = (r.downline || []).length;
  const draft = `${handle} saw the whole chain on ${cust}${took ? ' — picked it up and done in ' + took : ''}${steps > 1 ? ', ' + steps + ' steps, nothing dropped' : ''}. That is exactly how it's done. Thank you.`;
  openModal({
    title: `Appreciate ${esc(firstName(who))}`,
    submitLabel: 'Send it',
    body: `
      <div class="field"><label>To ${esc(firstName(who))} · lands on ${esc(cust)}'s file, they get the push</label><textarea name="words" rows="3">${esc(draft)}</textarea></div>
      <label class="tagchip"><input type="checkbox" name="share" checked> Share with the team room too (the village)</label>
      <div class="small dimmer" style="margin-top:6px">The customer never sees this. Cause and effect, said out loud.</div>`,
    onSubmit: async (f) => {
      const words = f.words.value.trim(); if (!words) throw new Error('Say it');
      if (isDemo()) { toast('Demo — on live this lands on the file, buzzes ' + firstName(who) + (f.share.checked ? ' and posts to the village' : '')); return; }
      const file = await loadFile(r.customer_id);
      let tid = file.thread?.id; if (!tid) { if (!file.job?.job_id) throw new Error('No job on this file'); tid = await threadForJob(file.job.job_id); }
      await postMessage(tid, ['manager'].includes(state.me?.role) ? 'SUPER' : 'OFFICE', words);
      if (f.share.checked) await postRoom('village', words.replace(/^@S+( [A-Z]S+)? /, firstName(who) + ' — ') , r.customer_id);
      toast(`Sent — ${firstName(who)} got it${f.share.checked ? ', and the village saw it' : ''}`);
    },
  });
}
