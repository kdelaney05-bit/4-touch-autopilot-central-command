// THE TOUR — "here is a cool video of how it will work" (Kevin, 15 Sep night:
// "show the coolest parts and clearly show how to use all the features we
// want them to use"). A voice is not possible on a page, so this is the next
// best thing and in one way better: it runs on the real screen, in the demo
// book, with a caption per step and a Next button, so a seat learns by doing.
// ?tour=1 starts it; the "Show me around" button on The Line starts it too.
import { $, html, raw, esc } from './ui.js?v=57';

const STEPS = [
  { at: null, title: 'This is The Line.', body: 'Everything with a human waiting on the other end, on one screen. Nobody has to hunt, and nothing gets to sit. Let’s walk it in a minute.' },
  { at: '#sayit, .sayit, [data-tour="sayit"]', title: 'Say it — to anyone, about any customer.', body: 'Type who it is about (last name, street or phone), pick a person or the customer, say what you need, press Post. It reaches them and it lands on that customer’s file, so it is never lost.' },
  { at: '[data-tour="stuck"]', title: 'Where it is stuck.', body: 'Every open ask, grouped by what it waits on. The bar is how many; the number is the oldest one. That one is the one that is actually stuck.' },
  { at: '[data-tour="asking"]', title: 'What they are asking — and the file answers.', body: 'The customers waiting right now, sorted by what they asked. When the file already knows the answer, an Answer button shows what the file says and the reply in our own words. You read it, fix a word, press Send. It never sends by itself.' },
  { at: '#line-rail', title: 'Your rail.', body: 'You’re up is the short list with your name on it. Nothing goes unanswered is the company board. Rooms, People (direct lines, just the two of you and Kevin), and who spoke last. You are only pinged when you are named.' },
  { at: '#tabs', title: 'Files.', body: 'Every customer you can read. Tap one and the whole thing is one thread: their texts, our notes, what is waiting on who. Type @ and a name in the box and that person gets it.' },
  { at: null, title: 'That’s the whole thing.', body: 'Two things to try this week: say something to one person about one customer, and answer when someone says something to you. The customer never sees our notes. Only the texts we send them.' },
];

let i = 0, root = null;
export function startTour() {
  i = 0;
  if (!root) { root = document.createElement('div'); root.id = 'tour'; document.body.appendChild(root); }
  paint();
}
function stop() { if (root) { root.remove(); root = null; } document.querySelectorAll('.tour-lit').forEach((e) => e.classList.remove('tour-lit')); }
function paint() {
  const s = STEPS[i];
  document.querySelectorAll('.tour-lit').forEach((e) => e.classList.remove('tour-lit'));
  let target = null;
  if (s.at) for (const sel of s.at.split(',')) { target = document.querySelector(sel.trim()); if (target) break; }
  if (target) { target.classList.add('tour-lit'); target.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  root.innerHTML = html`
    <div class="tour-card ${target ? '' : 'center'}">
      <div class="kicker">Show me around · ${i + 1} of ${STEPS.length}</div>
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
  const b = $('#tour-b'); if (b) b.onclick = () => { i--; paint(); };
  $('#tour-n').onclick = () => { if (i >= STEPS.length - 1) stop(); else { i++; paint(); } };
}
export const tourWanted = () => /[?&]tour=1/.test(location.search);
