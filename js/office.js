// Office — the asks, oldest first, each closed by its proof (migration 306).
// Done here is ask_settle(): the input lands on the file, the chain opens the
// next ask and pushes its owner. No checkbox anywhere.
import { state, isDemo, personName, settleAsk, uploadDoc, setSwitch } from './book.js?v=59';
import * as api from './api.js?v=59';
import { $, html, raw, esc, toast, openModal } from './ui.js?v=59';
import { brandName, askLabel, stageLabel, STAGES, BRAND_BY_CC } from './config.js?v=59';
import { iconForAsk } from './words.js?v=59';
import { DEMO_STEPS } from './demo-office.js?v=59';
import { reload } from './app.js?v=59';

let filter = 'all';
const mins = (m) => m == null ? '' : m >= 1440 ? (m / 1440).toFixed(1) + ' d' : m >= 60 ? (m / 60).toFixed(1) + ' h' : Math.round(m) + ' min';
const money = (n) => n == null ? '' : '$' + Math.round(Number(n)).toLocaleString();
const LINE_MIN = { PERMIT: 5 * 1440, CONTRACT_DOC: 2 * 1440, SURVEY: 1440, SCHEDULE: 2 * 1440, MATERIAL: 2 * 1440, INVOICE: 240, PAYMENT: 30 * 1440 };

export function renderOffice(root) {
  const Q = state.queue.filter((q) => q.lane === 'OFFICE');
  const types = ['CONTRACT_DOC', 'PERMIT', 'SURVEY', 'SCHEDULE', 'MATERIAL', 'INVOICE', 'PAYMENT'];
  const n = (t) => Q.filter((q) => q.ask_type === t).length;
  const oldest = (t) => Q.filter((q) => q.ask_type === t).sort((a, b) => b.open_min - a.open_min)[0];
  const rows = (filter === 'all' ? Q : Q.filter((q) => q.ask_type === filter)).slice().sort((a, b) => b.open_min - a.open_min);
  const canFlip = ['owner', 'admin'].includes(state.me?.role);
  const sw = (k) => state.switches.find((s) => s.key === k);

  root.innerHTML = html`
    <div class="head">
      <div><div class="kicker">Office room · the asks, oldest first · the clock starts when the ask opens</div>
        <h1 class="serif">What the field is waiting on the office for, and how long.</h1></div>
      <div class="right">${isDemo() ? raw('<span class="chip demo">DEMO</span>') : ''}</div>
    </div>
    <div class="tiles" style="grid-template-columns:repeat(4,minmax(0,1fr))">
      ${raw([['CONTRACT_DOC', 'Paperwork'], ['PERMIT', 'Permit'], ['INVOICE', 'Ready to invoice'], ['PAYMENT', 'Payment']].map(([t, label]) => {
        const o = oldest(t); const red = o && o.open_min > (LINE_MIN[t] || 1e9);
        return `<div class="tile"><div class="kicker">${esc(label)}</div><div class="fnum" ${t === 'INVOICE' ? 'style="color:var(--verify)"' : red ? 'style="color:var(--clock)"' : ''}>${n(t)}</div><div class="small">${o ? 'oldest <span class="mono ' + (red ? 'red' : '') + '">' + esc(mins(o.open_min)) + '</span> · ' + esc(o.assignee_name || '') : 'none open'}</div></div>`;
      }).join(''))}
    </div>
    <div class="card">
      <div class="subs" style="margin-bottom:4px">
        <button class="sub ${filter === 'all' ? 'on' : ''}" data-f="all">All · ${Q.length}</button>
        ${raw(types.filter(n).map((t) => `<button class="sub ${filter === t ? 'on' : ''}" data-f="${t}">${esc(askLabel({ ask_type: t }))} · ${n(t)}</button>`).join(''))}
        <span class="small" style="margin-left:auto">Done asks for the input. The input goes on the file and opens the next step by itself.</span>
      </div>
      ${rows.length ? raw(rows.map(row).join('')) : raw('<div class="empty">Nothing open. When a job signs, its paperwork checklist lands here.</div>')}
    </div>
    ${canFlip ? raw(`<div class="card"><div class="kicker">The machine · switches (owner only)</div>
      <div class="switch"><span><b>Estimate-booked confirmation text</b> — the first text, from the brand's main line, the moment a new appointment lands. Fencing lines only until the other campaigns approve.</span><button class="btn sm ${sw('appt_confirm')?.is_on ? 'ok' : ''}" data-switch="appt_confirm">${sw('appt_confirm')?.is_on ? 'ON — turn off' : 'OFF — turn on'}</button></div>
      <div class="switch"><span><b>The answer clock</b> — 15 minutes, then the watcher is pinged; 60 minutes, the owners. Counts only texts that arrive after you flip it.</span><button class="btn sm ${sw('text_clock')?.is_on ? 'ok' : ''}" data-switch="text_clock">${sw('text_clock')?.is_on ? 'ON — turn off' : 'OFF — turn on'}</button></div>
      <div class="switch"><span><b>The chain's texts</b> — permit approved, you're on the schedule, invoice sent, the past-due reminder at 30 days, the review prompt on payment, and the five-star link when a customer texts back a 9 or 10. Jess's wording, from the brand's main line.</span><button class="btn sm ${sw('office_machine_texts')?.is_on ? 'ok' : ''}" data-switch="office_machine_texts">${sw('office_machine_texts')?.is_on ? 'ON — turn off' : 'OFF — turn on'}</button></div>
      <div class="switch"><span><b>After hours</b> — 6 PM to 7 AM, a customer text gets "Got it, {first} — {owner} will text you first thing in the morning," once per night.</span><button class="btn sm ${sw('after_hours_reply')?.is_on ? 'ok' : ''}" data-switch="after_hours_reply">${sw('after_hours_reply')?.is_on ? 'ON — turn off' : 'OFF — turn on'}</button></div></div>`) : ''}
      <div class="switch"><span><b>The packet on the estimate page</b> — the disclosures and the county or city forms for the address appear under the customer's signature, one tap each, the same signature covers them; NOC and the wet-ink forms stay in person. Off = the estimate page is exactly as it was.</span><button class="btn sm ${sw('esign_packet')?.is_on ? 'ok' : ''}" data-switch="esign_packet">${sw('esign_packet')?.is_on ? 'ON' : 'off'}</button></div>
    <div class="card" id="cc-workflow"></div>`;

  workflowCard(root);
  root.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { filter = b.dataset.f; renderOffice(root); }));
  root.querySelectorAll('[data-settle]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); const a = state.queue.find((q) => q.ask_id === b.dataset.settle); if (a) settleDialog(a, () => reload(true)); }));
  root.querySelectorAll('[data-switch]').forEach((b) => (b.onclick = async () => {
    const cur = sw(b.dataset.switch)?.is_on;
    const ask = { appt_confirm: 'Turn the confirmation text ON? The next new appointments get a text from the main line within 5 minutes.', text_clock: 'Turn the answer clock ON? Watchers get pinged 15 minutes after any customer text from now on.', office_machine_texts: 'Turn the chain\'s texts ON? From now on a settled permit, schedule, invoice and payment texts the customer from the main line.', after_hours_reply: 'Turn the after-hours holding text ON?' };
    const ok = confirm(cur ? 'Turn it off?' : (ask[b.dataset.switch] || 'Turn it on?'));
    if (!ok) return;
    try { await setSwitch(b.dataset.switch, !cur); toast(cur ? 'Off' : 'On'); await reload(true); } catch (e) { toast(e.message, 'err'); }
  }));
}

function row(q) {
  const red = q.open_min > (LINE_MIN[q.ask_type] || 1e9);
  const green = q.ask_type === 'INVOICE';
  return `<div class="ask ${green ? 'green' : ''}" style="cursor:pointer" onclick="__peek('${esc(q.customer_id)}')">
    <span class="chip ${green ? 'st-green' : 'st-blue'}"><i class="ai">${iconForAsk(q)}</i>${esc(askLabel(q))}</span>
    <div><b>${esc(personName(q.customer_name))}</b> · ${esc(brandName(q.cc_company_id))} · ${esc(money(q.job_value))}<div class="who">${esc(q.note || '')} · opened by ${esc(q.opened_by_name || 'the file')} · ${esc(q.assignee_name || 'unassigned')} holds it</div></div>
    <span class="mono ${red ? 'red' : ''}">${esc(mins(q.open_min))}</span>
    <span class="chip ${STAGES[q.stage]?.cls || 'st-ink'}">${esc(stageLabel(q.stage))}</span>
    <div style="display:flex;gap:6px" onclick="event.stopPropagation()"><button class="btn sm" onclick="__peek('${esc(q.customer_id)}')">Open file</button><button class="btn sm ok" data-settle="${esc(q.ask_id)}">${green ? 'Invoiced' : 'Done'}</button></div>
  </div>`;
}

/* The settle dialog — one shape per proof kind. Files go to the job-docs
   bucket first (lane in the path, so storage RLS applies), then ask_settle
   gets their paths. */
export function settleDialog(a, after) {
  const kind = a.proof_kind || 'tap';
  const job = { cc_company_id: a.cc_company_id, cc_project_id: a.cc_project_id };
  const label = a.proof_label || 'Tap to close';
  let body = `<div class="note" style="margin-bottom:10px"><b>${esc(personName(a.customer_name))}</b> · ${esc(askLabel(a))}${a.note ? ' · ' + esc(a.note) : ''}</div>`;
  if (kind === 'file' || kind === 'photos') body += `<div class="field"><label>${esc(label)}</label><input type="file" name="files" ${kind === 'photos' ? 'accept="image/*" ' : ''}multiple required/></div>`;
  if (kind === 'number' || kind === 'text') body += `<div class="field"><label>${esc(label)}</label><input name="value" required/></div>${a.ask_type === 'INVOICE' || a.ask_type === 'PAYMENT' ? '<div class="field"><label>Payment link for the customer (optional)</label><input name="link" placeholder="https://…"/></div>' : ''}<div class="field"><label>Attach the document (optional)</label><input type="file" name="files" multiple/></div>`;
  if (kind === 'date') body += `<div class="field"><label>${esc(label)}</label><input type="date" name="value" required/></div><div class="field"><label>Crew and note</label><input name="note" placeholder="Crew Ortiz · two days"/></div>`;
  if (kind === 'tap') body += `<div class="note">This one closes on your word.</div>`;
  if (a.waivable) body += `<div class="field" style="margin-top:14px"><label>Or: not required, because…</label><input name="waived" placeholder="leave blank if you have the document"/></div>`;
  openModal({ title: kind === 'tap' ? 'Close it' : 'Done — with the proof', submitLabel: a.ask_type === 'INVOICE' ? 'Invoiced' : 'Done', body,
    onSubmit: async (f) => {
      const proof = {};
      const waived = f.waived?.value?.trim();
      if (waived) proof.waived = waived;
      else {
        if (f.value) proof.value = f.value.value.trim();
        if (f.note?.value) proof.note = f.note.value.trim();
        if (f.link?.value?.trim()) proof.link = f.link.value.trim();
        const files = f.files?.files ? Array.from(f.files.files) : [];
        if ((kind === 'file' || kind === 'photos') && files.length < (a.proof_min || 1)) throw new Error(`Needs ${a.proof_min || 1} file${(a.proof_min || 1) > 1 ? 's' : ''}: ${label}`);
        if (files.length) {
          proof.files = [];
          for (const file of files) proof.files.push(await uploadDoc(job, a.lane || 'OFFICE', file));
        }
      }
      const r = await settleAsk(a.ask_id, proof);
      const opened = (r?.opened || []).length, texted = (r?.texts || []).length;
      toast(`Done${opened ? ` · ${opened} next step${opened > 1 ? 's' : ''} opened` : ''}${texted ? ' · the customer was texted' : ''}`);
      after?.();
    } });
}

/* ── the workflow map ────────────────────────────────────────────────────────
   Contractors Cloud's own step list, brand by brand, beside what each step
   became here: an ask with a clock, a piece of the paperwork checklist, a
   hand-off, a clock the machine keeps, something the app already did, or a
   step that simply went away. The rows are `cc_workflow_steps` — Kevin and
   Jess edit the note column in place; nothing here is code. Read once per
   page load and kept in the module, so the filter buttons never re-fetch. */
let STEPS = null, stepsLoading = false, stepsErr = null, stepsCc = '1461';
const BECOMES = {
  ask:       ['st-gold',   'ask'],
  checklist: ['st-blue',   'checklist'],
  handoff:   ['st-green',  'hand-off'],
  clock:     ['st-orange', 'the clock'],
  exists:    ['st-ink',    'already here'],
  dropped:   ['st-ink',    'dropped'],
};

async function loadSteps() {
  if (isDemo()) return DEMO_STEPS.slice();
  return api.page('cc_workflow_steps?select=*&order=cc_company_id.asc,ord.asc');
}

function workflowCard(root) {
  const box = root.querySelector('#cc-workflow');
  if (!box) return;
  const head = '<div class="kicker">The workflow · every Contractors Cloud step and what it became here</div>'
    + '<div class="small">CC\'s checklist, step for step. Gold is an ask with a clock on it; blue is a piece of the paperwork checklist; green is a hand-off; orange is a follow-up the machine keeps; grey was already here, or went away.</div>';
  if (STEPS == null) {
    box.innerHTML = head + '<div class="empty">Reading the map…</div>';
    if (!stepsLoading) {
      stepsLoading = true;
      loadSteps()
        .then((rows) => { STEPS = rows; stepsErr = null; })
        .catch((e) => { STEPS = []; stepsErr = e?.message || 'Could not read cc_workflow_steps'; })
        .finally(() => { stepsLoading = false; workflowCard(root); });
    }
    return;
  }
  const brands = Object.keys(BRAND_BY_CC);
  if (!brands.includes(stepsCc)) stepsCc = brands[0];
  const forCc = (cc) => STEPS.filter((s) => String(s.cc_company_id) === cc);
  const rows = forCc(stepsCc).slice().sort((a, b) => (Number(a.ord) || 0) - (Number(b.ord) || 0));
  const canEdit = ['owner', 'admin'].includes(state.me?.role);

  box.innerHTML = head
    + '<div class="subs" style="margin:2px 0 4px">'
    + brands.map((cc) => `<button class="sub ${cc === stepsCc ? 'on' : ''}" data-cc="${esc(cc)}">${esc(BRAND_BY_CC[cc].short)} · ${forCc(cc).length}</button>`).join('')
    + (canEdit ? '<span class="small" style="margin-left:auto">Click a note to rewrite it — it saves when you click away.</span>' : '')
    + '</div>'
    + (rows.length
      ? '<div class="wrap"><table><thead><tr><th>#</th><th>CC step</th><th>Becomes</th><th>The ask</th><th>Lane</th><th>Who</th><th>What changed</th></tr></thead><tbody>'
        + rows.map((s) => stepRow(s, canEdit)).join('') + '</tbody></table></div>'
      : `<div class="empty">${esc(stepsErr || 'No steps mapped for ' + BRAND_BY_CC[stepsCc].short + ' yet.')}</div>`);

  box.querySelectorAll('[data-cc]').forEach((b) => (b.onclick = () => { stepsCc = b.dataset.cc; workflowCard(root); }));
  box.querySelectorAll('[data-note-ord]').forEach((cell) => {
    cell.dataset.was = cell.textContent;
    cell.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); cell.blur(); } if (e.key === 'Escape') { cell.textContent = cell.dataset.was; cell.blur(); } });
    cell.onblur = async () => {
      const note = cell.textContent.trim();
      if (note === (cell.dataset.was || '').trim()) return;
      const cc = cell.dataset.noteCc, ord = cell.dataset.noteOrd;
      if (isDemo()) { cell.textContent = cell.dataset.was; toast('Demo — nothing is saved', 'err'); return; }
      try {
        await api.patch(`cc_workflow_steps?cc_company_id=eq.${encodeURIComponent(cc)}&ord=eq.${encodeURIComponent(ord)}`, { note });
        const hit = STEPS.find((s) => String(s.cc_company_id) === cc && String(s.ord) === ord);
        if (hit) hit.note = note;
        cell.dataset.was = note;
        toast('Saved');
      } catch (e) { cell.textContent = cell.dataset.was; toast(e.message, 'err'); }
    };
  });
}

function stepRow(s, canEdit) {
  const b = BECOMES[s.becomes] || ['st-ink', s.becomes || '—'];
  const gone = s.becomes === 'dropped';
  const stepCell = `<b${gone ? ' style="text-decoration:line-through;color:var(--dimmer)"' : ''}>${esc(s.cc_subject || '')}</b>`
    + (s.cc_count != null ? ` <span class="mono dimmer">${esc(s.cc_count)}</span>` : '');
  const ask = s.ask_type || s.doc_kind ? esc(askLabel({ ask_type: s.ask_type, doc_kind: s.doc_kind })) : '<span class="dimmer">—</span>';
  const note = canEdit
    ? `<div class="note" contenteditable="true" data-note-cc="${esc(s.cc_company_id)}" data-note-ord="${esc(s.ord)}" style="min-height:17px;outline:none;border-bottom:1px dashed var(--line)">${esc(s.note || '')}</div>`
    : `<span class="note">${esc(s.note || '')}</span>`;
  return `<tr>
    <td class="mono dimmer">${esc(s.ord)}</td>
    <td>${stepCell}</td>
    <td><span class="chip ${b[0]}"${gone ? ' style="text-decoration:line-through"' : ''}>${esc(b[1].toUpperCase())}</span></td>
    <td>${ask}</td>
    <td>${s.lane ? '<span class="chip">' + esc(s.lane) + '</span>' : '<span class="dimmer">—</span>'}</td>
    <td class="small">${esc(s.owner_rule || '—')}</td>
    <td style="min-width:220px">${note}</td>
  </tr>`;
}
