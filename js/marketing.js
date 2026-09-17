// Marketing — the owner console's Marketing section, embedded whole: the
// appointments hero, the by-company band, the source strip, the spend → signed
// ledger. Same origin (github.io), same login; nothing is duplicated here.
import { html, raw } from './ui.js?v=103';
import { CONSOLE_URL, CONSOLE_SECTION } from './config.js?v=103';
import { isDemo } from './book.js?v=103';

export function renderMarketing(root) {
  root.innerHTML = html`
    <div class="head" style="margin-bottom:10px">
      <div><div class="kicker">Marketing room · the owner console's Marketing section, live</div><h1 class="serif">Where the at-bats come from, and what they cost.</h1></div>
      <div class="right">
        <a class="btn" href="${CONSOLE_URL}#${CONSOLE_SECTION.marketing}" target="_blank" rel="noopener">Open full screen</a>
        ${isDemo() ? raw('<span class="chip demo">DEMO · the console is live</span>') : ''}
      </div>
    </div>
    <div class="embed"><iframe title="The owner console · Marketing" src="${CONSOLE_URL}#${CONSOLE_SECTION.marketing}" loading="lazy" allow="clipboard-write"></iframe></div>
    <div class="small" style="margin-top:8px">The first time, the console asks you to sign in inside the frame. Same email and password. It remembers you after that.</div>`;
}
