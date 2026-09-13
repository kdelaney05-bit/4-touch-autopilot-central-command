// Tiny DOM helpers — no framework. Every string that came from the server
// goes through esc() before it becomes HTML.
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function html(strings, ...vals) {
  // Tagged template: interpolations are escaped unless wrapped in raw().
  return strings.reduce((out, s, i) => {
    const v = vals[i - 1];
    const piece = v == null ? '' : (v && v.__raw != null ? v.__raw : Array.isArray(v) ? v.map((x) => x && x.__raw != null ? x.__raw : esc(x)).join('') : esc(v));
    return out + piece + s;
  });
}
export const raw = (s) => ({ __raw: String(s ?? '') });

let toastTimer = null;
export function toast(msg, kind = '') {
  const root = $('#toast-root');
  root.innerHTML = html`<div class="toast ${kind}">${msg}</div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { root.innerHTML = ''; }, kind === 'err' ? 6000 : 3200);
}

/* A modal with a form. `render()` returns inner HTML; `onSubmit(form)` runs
   on submit and may throw — the message lands in .err and the modal stays. */
export function openModal({ title, body, submitLabel = 'Save', onSubmit, wide = false }) {
  const root = $('#modal-root');
  root.innerHTML = html`
    <div class="modal-bg" id="modal-bg">
      <form class="modal" id="modal-form" style="${wide ? 'width:760px' : ''}">
        <h2>${title}</h2>
        ${raw(body)}
        <div class="err" id="modal-err"></div>
        <div class="foot">
          <button class="btn fill" type="submit" id="modal-go">${submitLabel}</button>
          <button class="btn" type="button" id="modal-cancel">Cancel</button>
        </div>
      </form>
    </div>`;
  const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  $('#modal-cancel').onclick = close;
  $('#modal-bg').onclick = (e) => { if (e.target.id === 'modal-bg') close(); };
  const form = $('#modal-form');
  let busy = false;                        // ref-style guard (b80 lesson)
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true; $('#modal-go').disabled = true; $('#modal-err').textContent = '';
    try { await onSubmit(form); close(); }
    catch (err) { $('#modal-err').textContent = err?.message || String(err); busy = false; $('#modal-go').disabled = false; }
  };
  const first = form.querySelector('input,textarea,select');
  if (first) first.focus();
  return close;
}

export const field = (id, label, attrs = '', tag = 'input') => html`
  <div class="field"><label for="${id}">${label}</label>
    ${raw(tag === 'textarea' ? `<textarea id="${id}" ${attrs}></textarea>` : `<input id="${id}" ${attrs}/>`)}
  </div>`;

export const val = (form, id) => (form.querySelector('#' + id)?.value ?? '').trim();

export const fmtWhen = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};
export const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
