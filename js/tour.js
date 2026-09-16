// THE TOUR — "here is a cool video of how it will work" (Kevin, 15 Sep night:
// "show the coolest parts and clearly show how to use all the features we
// want them to use"). A voice is not possible on a page, so this is the next
// best thing and in one way better: it runs on the real screen, in the demo
// book, with a caption per step and a Next button, so a seat learns by doing.
// ?tour=1 starts it; the "Show me around" button on The Line starts it too.
import { $, html, raw, esc } from './ui.js?v=74';

// Each step names the ROOM it plays in (Kevin, 15 Sep night: "the one you show is
// mine… it's not going to be that for everyone… give them the pipeline and then the
// line") — the film runs in the seat's own rooms (?demo=1&as=office), never the owner's.
const STEPS = [
  { room: 'line', at: null, title: 'This is The Line.', body: 'Everything with a human waiting on the other end, on one screen. Nobody has to hunt, and nothing gets to sit. Two minutes, and you will have seen all of it.' },
  { room: 'line', at: '#sayit, .sayit, [data-tour="sayit"]', title: 'Say it — to anyone, about any customer.', body: 'Type who it is about (last name, street or phone), pick a person or the customer, say what you need, press Post. It reaches them and it lands on that customer’s file, so it is never lost. And it tells you who it reached.' },
  { room: 'line', at: '#alerts .alert', do: 'bing', title: 'The bing.', body: 'When somebody tags you: a sound, and this card. It stays until you press ✓ Got it or Open the file. No feed to babysit — your name on it, or you never hear about it.' },
  { room: 'line', at: '[data-tour="sent"]', title: 'What you sent out.', body: 'Every directive of yours, who it reached, who picked it up, who did it and how fast. Tap one and the chain opens: this led to this led to this, straight down, until done. Look in without hovering. Nobody is beaten here; they look good.' },
  { room: 'line', at: '[data-tour="stuck"]', title: 'Where it is stuck.', body: 'Every open ask, grouped by what it waits on. The bar is how many; the number is the oldest one. That one is the one that is actually stuck.' },
  { room: 'line', at: '[data-tour="asking"]', title: 'What they are asking — and the file answers.', body: 'The customers waiting right now, sorted by what they asked. When the file already knows the answer, the Answer button shows what the file says and the reply in our own words. You read it, fix a word, press Send. It never sends by itself.' },
  { room: 'line', at: '[data-tour="quotes"]', title: 'The hard quote goes to Gio.', body: 'A rep on a hard fence job taps ASK GIO on his phone: the checklist and the pictures land here. Gio types the price and a word, presses Send the price, and the rep’s phone buzzes. The clock on each one is the number we watch.' },
  { room: 'line', at: '[data-tour="crews"]', title: 'My crews — and the nugget.', body: 'A crew is a name and a phone, no login. A nugget is one instruction, the customer and the address, and the one thing to bring back: a photo, a number, yes or no, done. They tap RECIBIDO by name. The court shows the receipt on every one: texted, opened, received, brought back. Nothing to argue about.' },
  { room: 'line', at: '#line-rail', title: 'Your rail.', body: 'You’re up is the short list with your name on it. Nothing goes unanswered is the company board. Rooms, People (direct lines, just the two of you and Kevin), and who spoke last.' },
  { room: 'pipeline', at: '.pies .pie, .pies', title: 'The Pipeline.', body: 'Every rep’s pie: what he has priced and is waiting to hear on, by when he last worked it. Tap a name for his book alone. Tap a customer and you are on their file.' },
  { room: 'photos', at: '.photo-feed, #ph-feed', title: 'Photos.', body: 'Every picture on every file, newest first, with the customer’s name, who shot it, the crew and the dollars. One search box. Crews, sales and supervisors talk in pictures here.' },
  { room: 'files', at: '.mybook, #tabs', title: 'Files opens on My book.', body: 'Your customers, one card each: the wait in gold or red, the open tasks as a checklist with who has them and how long, Open the file. Everyone is the whole list. Same job list and tasks you know from CC, with the hunting cut out.' },
  { room: 'files', at: '#drawer #photos-card', do: 'peek:cj3', title: 'The file — and ＋ Photo.', body: 'The photos sit first. ＋ Photo is the camera on a phone: the words, tag people, the crew, the dollar amount. It lands on the thread and everyone named gets the buzz. The customer never sees it.' },
  { room: 'files', at: '#drawer #lines', title: 'The next word.', body: 'The twelve approved lines, already filled in for this customer. Close the permit ask and the permit line is in the box. Set the schedule and the schedule line is in the box with the date. A customer asks about paying and Reply puts the pay-link line in the box. One tap left: Send.' },
  { room: 'files', at: '#drawer .rcpt', title: 'The receipt.', body: 'Under every note: who it reached — 📱 buzzed on the phone, 🖥 waiting in their You’re up — and a ✓ the moment they open it. Never a notification. There when you look.' },
  { room: 'line', at: null, title: 'That’s the whole thing.', body: 'Two things to try this week: say something to one person about one customer, and answer when someone says something to you. The customer never sees our notes. Only the texts we send them.' },
];

let i = 0, root = null, auto = null;
const AUTO_MS = 7000;
// ?auto=1 with ?tour=1: the tour runs itself, a step every seven seconds — the film, on the real screen
export function startTour(autoplay = /[?&]auto=1/.test(location.search)) {
  i = 0; clearTimeout(auto); auto = null;
  if (!root) { root = document.createElement('div'); root.id = 'tour'; document.body.appendChild(root); }
  paint(autoplay);
}
function stop() { clearTimeout(auto); auto = null; if (root) { root.remove(); root = null; } document.querySelectorAll('.tour-lit').forEach((e) => e.classList.remove('tour-lit')); }
const AUTO_LONG = new Set(['peek:cj3']);   // the file steps get a beat more
function paint(autoplay = false) {
  const s = STEPS[i];
  clearTimeout(auto); auto = null;
  if (autoplay && i < STEPS.length - 1) auto = setTimeout(() => { i++; paint(true); }, AUTO_MS);
  document.querySelectorAll('.tour-lit').forEach((e) => e.classList.remove('tour-lit'));
  // the step's room: switch only when the seat has it and the page is not already there
  if (s.room && window.__go && !document.querySelector(`#tabs .tab.on[data-view="${s.room}"]`) && document.querySelector(`#tabs [data-view="${s.room}"]`)) window.__go(s.room);
  // a step can DO something first: fire the demo bing, or open a file beside the room — then light its target once it is there
  if (s.do === 'bing' && window.__demoBing) window.__demoBing();
  if (s.do && s.do.startsWith('peek:') && window.__peek && !document.querySelector('#drawer:not([hidden])')) window.__peek(s.do.slice(5));
  const light = () => { let t = null; if (s.at) for (const sel of s.at.split(',')) { t = document.querySelector(sel.trim()); if (t) break; } if (t) { t.classList.add('tour-lit'); t.scrollIntoView({ block: 'center', behavior: 'smooth' }); } return t; };
  let target = light();
  if (!target && s.do) setTimeout(() => { const t = light(); if (t) { const card = root && root.querySelector('.tour-card'); if (card) card.classList.remove('center'); } }, 900);
  root.innerHTML = html`
    <div class="tour-card ${target ? '' : 'center'}">
      <div class="kicker">Show me around · ${i + 1} of ${STEPS.length}${autoplay ? " · playing" : ""}</div>${autoplay ? raw("<div class=\"tour-bar\"><i></i></div>") : ""}
      <h2 class="serif">${s.title}</h2>
      <p>${s.body}</p>
      <div class="tour-foot">
        <button class="btn" id="tour-x">Skip</button>
        <span style="flex:1"></span>
        ${i > 0 ? raw('<button class="btn" id="tour-b">Back</button>') : ''}
        <button class="btn fill" id="tour-n">${i === STEPS.length - 1 ? 'Done' : 'Next'}</button>
      </div>
    </div>`;
  $('#tour-x').onclick = stop;
  const b = $('#tour-b'); if (b) b.onclick = () => { i--; paint(autoplay); };
  $('#tour-n').onclick = () => { if (i >= STEPS.length - 1) stop(); else { i++; paint(autoplay); } };
}
export const tourWanted = () => /[?&]tour=1/.test(location.search);
