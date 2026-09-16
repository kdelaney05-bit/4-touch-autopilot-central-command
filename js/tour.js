// THE TOUR — "here is a cool video of how it will work" (Kevin, 15 Sep night:
// "show the coolest parts and clearly show how to use all the features we
// want them to use"). A voice is not possible on a page, so this is the next
// best thing and in one way better: it runs on the real screen, in the demo
// book, with a caption per step and a Next button, so a seat learns by doing.
// ?tour=1 starts it; the "Show me around" button on The Line starts it too.
import { $, html, raw, esc } from './ui.js?v=78';

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

// THE CREWS FILM (Kevin, 16 Sep: "he needs to visually see that. create a short form video I can just send to
// Mike on how it works, with the subtitles… commentate our instructions"). ?tour=crews&auto=1 — and &voice=1
// reads every caption aloud in the browser's own voice.
const CREW_STEPS = [
  { room: 'line', at: '[data-tour="crews"]', title: 'Mike, this is your crews card.', body: 'It sits on The Line. Your crews are people with a phone, not logins. Every nugget you send them lands here with a receipt.' },
  { room: 'line', at: '#crew-add', title: 'Add a crew once.', body: '+ Crew: a name, a phone, their language. That is it. Each crew gets one link for good; they never install anything.' },
  { room: 'files', at: '#drawer #photos-card', do: 'peek:cj6', title: 'On the job: take the picture.', body: 'Open the customer. ＋ Photo. The scope on the yard, then the words, the crew, and the price for that piece. Post it. Scope and price, locked in the pic.' },
  { room: 'files', at: '#lightbox .cap', do: 'lightbox', title: 'Tap the photo. Send to a crew.', body: 'Any photo on the file has the button. It carries the picture, your words, the customer and the price with it.' },
  { room: 'files', at: '#modal-form', do: 'lbcrew', title: 'The nugget, already filled.', body: 'Pick who. Say what to bring back: a photo, a number, yes or no, or just done. A by-when if you want. Send it.' },
  { room: 'line', at: '[data-tour="crews"] .nug', do: 'closemodal', title: 'Their court, your receipt.', body: 'Ramón gets a text with the link. Here you see: texted at 7:23, opened at 7:31, RECIBIDO Ramón at 7:32, brought back with the photo. Nothing to argue about. If it says not opened, call before a pallet moves.' },
  { room: 'line', at: null, title: 'What Ramón sees.', body: 'The customer and the address in gold. Your picture, big. Your words. The price. One button: RECIBIDO · ENTENDIDO. Then the one thing to bring back.', link: 'https://kdelaney05-bit.github.io/liberty-command/c.html?demo=1', linkText: 'Open Ramón\'s screen' },
];
const FILMS = { '1': STEPS, 'crews': CREW_STEPS };
let FILM = STEPS;
let i = 0, root = null, auto = null;
const AUTO_MS = 7000;
// ?auto=1 with ?tour=1: the tour runs itself, a step every seven seconds — the film, on the real screen
export function startTour(autoplay = /[?&]auto=1/.test(location.search), name = (/[?&]tour=([a-z0-9]+)/.exec(location.search) || [])[1]) {
  FILM = FILMS[name] || STEPS;
  i = 0; clearTimeout(auto); auto = null;
  if (!root) { root = document.createElement('div'); root.id = 'tour'; document.body.appendChild(root); }
  paint(autoplay);
}
function stop() { clearTimeout(auto); auto = null; try { speechSynthesis.cancel(); } catch {} if (root) { root.remove(); root = null; } document.querySelectorAll('.tour-lit').forEach((e) => e.classList.remove('tour-lit')); }
const AUTO_LONG = new Set(['peek:cj3']);   // the file steps get a beat more
function paint(autoplay = false) {
  const s = FILM[i];
  clearTimeout(auto); auto = null;
  if (autoplay && i < FILM.length - 1) auto = setTimeout(() => { i++; paint(true); }, AUTO_MS + (s.do ? 2500 : 0) + Math.max(0, (s.body.length - 160) * 25));
  document.querySelectorAll('.tour-lit').forEach((e) => e.classList.remove('tour-lit'));
  // the step's room: switch only when the seat has it and the page is not already there
  if (s.room && window.__go && !document.querySelector(`#tabs .tab.on[data-view="${s.room}"]`) && document.querySelector(`#tabs [data-view="${s.room}"]`)) window.__go(s.room);
  // a step can DO something first: fire the demo bing, or open a file beside the room — then light its target once it is there
  if (s.do === 'bing' && window.__demoBing) window.__demoBing();
  if (s.do && s.do.startsWith('peek:') && window.__peek && !document.querySelector('#drawer:not([hidden])')) window.__peek(s.do.slice(5));
  if (s.do === 'lightbox') document.querySelector('#drawer #photos-card .pthumb')?.click();
  if (s.do === 'lbcrew') { document.querySelector('#lb-crew')?.click(); }
  if (s.do === 'closemodal') { document.querySelector('#modal-cancel')?.click(); const lb = document.querySelector('#lightbox'); if (lb) lb.hidden = true; }
  // the voice: &voice=1 reads the caption in the browser's own voice (Kevin: "commentate our instructions")
  if (/[?&]voice=1/.test(location.search) && 'speechSynthesis' in window) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(s.title + ' ' + s.body); u.rate = 1.02; speechSynthesis.speak(u); } catch {} }
  const light = () => { let t = null; if (s.at) for (const sel of s.at.split(',')) { t = document.querySelector(sel.trim()); if (t) break; } if (t) { t.classList.add('tour-lit'); t.scrollIntoView({ block: 'center', behavior: 'smooth' }); } return t; };
  let target = light();
  if (!target && s.do) setTimeout(() => { const t = light(); if (t) { const card = root && root.querySelector('.tour-card'); if (card) card.classList.remove('center'); } }, 900);
  root.innerHTML = html`
    <div class="tour-card ${target ? '' : 'center'}">
      <div class="kicker">Show me around · ${i + 1} of ${FILM.length}${autoplay ? " · playing" : ""}</div>${autoplay ? raw("<div class=\"tour-bar\"><i></i></div>") : ""}
      <h2 class="serif">${s.title}</h2>
      <p>${s.body}</p>${s.link ? raw(`<p><a class="btn sm fill" href="${esc(s.link)}" target="_blank" rel="noopener">${esc(s.linkText || 'Open')}</a></p>`) : ''}
      <div class="tour-foot">
        <button class="btn" id="tour-x">Skip</button>
        <span style="flex:1"></span>
        ${i > 0 ? raw('<button class="btn" id="tour-b">Back</button>') : ''}
        <button class="btn fill" id="tour-n">${i === FILM.length - 1 ? 'Done' : 'Next'}</button>
      </div>
    </div>`;
  $('#tour-x').onclick = stop;
  const b = $('#tour-b'); if (b) b.onclick = () => { i--; paint(autoplay); };
  $('#tour-n').onclick = () => { if (i >= FILM.length - 1) stop(); else { i++; paint(autoplay); } };
}
export const tourWanted = () => /[?&]tour=(1|crews)\b/.test(location.search);
