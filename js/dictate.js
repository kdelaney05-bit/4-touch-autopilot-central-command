// TALK INTO THE BOX + ENTER POSTS (Kevin, 16 Sep, launch afternoon: "if Laura is text messaging me in
// there I can just answer it in there too… I need voice text capability… when you hit enter it posts").
// Two helpers every composer uses:
//   enterPosts(textarea, post, isPickerOpen)  Ctrl+Enter posts; Enter makes a new line (v130);
//                                             while an @-picker is open, Enter picks (the picker's own handler)
//   micButton(textarea)                       a 🎤 that dictates into the box with the browser's own speech
//                                             engine (Chrome and Edge on the desktop; Safari on the phone);
//                                             hidden where the browser has none. Tap to talk, tap to stop.
const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

export function enterPosts(ta, post, isPickerOpen = () => false) {
  if (!ta) return;
  ta.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.shiftKey || e.altKey || e.isComposing) return;
    if (e.metaKey || e.ctrlKey) { e.preventDefault(); post(); return; }   // the old way still works
    // 130 (Jess, 18 Sep 12:35 PM: "we have all sent several messages that arent needed bc we hit enter"): Enter alone is a
    // new line, the same as any text box; Ctrl+Enter (⌘+Enter) or the button sends. While an @-picker is open its own handler picks.
  });
}

/* 388: langFor() says which language the recognizer listens in — a nugget to a Spanish-speaking crew
   is dictated in Spanish even from an English browser (Luis, 17 Sep: "Uma prueba" for "Una prueba"). */
export function micButton(ta, langFor = null) {
  if (!SR || !ta) return null;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'btn mic'; b.title = 'Talk into the box · tap to start, tap to stop'; b.textContent = '🎤';
  let rec = null, base = '';
  const stop = () => { if (rec) { try { rec.stop(); } catch {} } rec = null; b.classList.remove('on'); b.textContent = '🎤'; };
  b.onclick = () => {
    if (rec) { stop(); return; }
    try {
      rec = new SR(); rec.lang = (typeof langFor === 'function' ? langFor() : null) || (/^es/i.test(navigator.language) ? 'es-US' : 'en-US'); rec.continuous = true; rec.interimResults = true;
      base = ta.value ? ta.value.replace(/\s*$/, ' ') : '';
      rec.onresult = (ev) => {
        let final = '', interim = '';
        for (let k = 0; k < ev.results.length; k++) { const r = ev.results[k]; if (r.isFinal) final += r[0].transcript + ' '; else interim += r[0].transcript; }
        ta.value = base + tidy(final) + (interim ? ' ' + interim : '');
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.scrollTop = ta.scrollHeight;
      };
      rec.onerror = (ev) => { stop(); if (ev.error === 'not-allowed') alert('The browser needs the microphone. Click the lock icon at the left of the address bar, allow the microphone, and try again.'); };
      rec.onend = () => { if (rec) stop(); };
      rec.start(); b.classList.add('on'); b.textContent = '⏺';
      ta.focus();
    } catch { stop(); }
  };
  return b;
}

// spoken punctuation people say out loud, and a capital after a full stop
function tidy(s) {
  return s.replace(/\s*\b(period|full stop)\b\s*/gi, '. ').replace(/\s*\bcomma\b\s*/gi, ', ').replace(/\s*\bquestion mark\b\s*/gi, '? ')
    .replace(/\s*\bnew line\b\s*/gi, '\n').replace(/\s{2,}/g, ' ').replace(/(^|[.!?]\s+)([a-z])/g, (m, a, c) => a + c.toUpperCase()).trim() + ' ';
}
