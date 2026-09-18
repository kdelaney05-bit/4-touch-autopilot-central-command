// THE LIBRARY's data (Kevin, 17 Sep 2026: "a full video library website… 3-5 screenshots of what it is with description and
// short video"; 18 Sep: "remove the owners cut, those videos are old… only show videos from the last week or two… add a
// search button or quick find of how most works… our employees just need a quick library").
//
//   node docs/library/build.mjs            rebuild library.json and any missing frames
//   node docs/library/build.mjs --frames   re-cut every frame (after a film is re-rendered)
//
// Reads: docs/ride-alongs.html (every box = one piece, newest on top) · films/*.mp4 (four frames each) · the film specs in
// Commercial-Desk/tools/ride-along/specs/*.json (every word Guy says, so the search finds "deposit" or "RECIBIDO") ·
// js/tour.js (every step's words, for the pieces that play on the real screen). Writes library.json, frames.json, frames/*.jpg.
// Nothing here is data about a customer: the films are made from the demo book by law (FILM LAW, CLAUDE.md).
// The five first-gen commercials (The Full Show, The Hunt, The Record, The Babysitter, The Blindfold Off) are NOT pieces
// any more (Kevin, 18 Sep): they stay on docs/films.html as plain links.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const DESK = process.env.DESK || 'C:/Users/kdela/OneDrive/Desktop/Commercial-Desk';
const FF = process.env.FFMPEG || path.join(DESK, 'tools/ride-along/node_modules/ffmpeg-static/ffmpeg.exe');
const REDO = process.argv.includes('--frames');

// 1 · frames: four stills per film, and how long it runs
const framesDir = path.join(HERE, 'frames'); fs.mkdirSync(framesDir, { recursive: true });
const frames = {};
for (const f of fs.readdirSync(path.join(ROOT, 'films')).filter((x) => x.endsWith('.mp4'))) {
  const name = f.replace(/\.mp4$/, ''); const src = path.join(ROOT, 'films', f);
  let probe = ''; try { execFileSync(FF, ['-i', src], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { probe = String(e.stderr || ''); }
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(probe); const dur = m ? (+m[1] * 3600 + +m[2] * 60 + +m[3]) : 60;
  const list = [];
  [0.22, 0.42, 0.62, 0.82].forEach((k, i) => {
    const dst = path.join(framesDir, `${name}-${i + 1}.jpg`);
    if (REDO || !fs.existsSync(dst)) execFileSync(FF, ['-y', '-loglevel', 'error', '-ss', String(Math.max(1, Math.floor(dur * k))), '-i', src, '-frames:v', '1', '-vf', 'scale=720:-2', '-q:v', '5', dst], { stdio: 'inherit' });
    list.push(path.basename(dst));
  });
  frames[name] = { seconds: Math.round(dur), frames: list, bytes: fs.statSync(src).size };
}
fs.writeFileSync(path.join(HERE, 'frames.json'), JSON.stringify(frames, null, 1));

// 2 · the words: what Guy says in each film (the spec's "say" lines), keyed by the film's file name
const SPEC_FILM = {
  'the-library': 'ride-along-the-library',
  'words-first': 'ride-along-words-first',
  'say-it': 'ride-along-say-it',
  'when-you-miss-a-call': 'ride-along-when-you-miss-a-call-or-a-text',
  'estimate-in-the-app-mike': 'ride-along-the-estimate-in-the-4-touch-app',
  'estimate-on-the-file-jess': 'ride-along-the-estimate-on-the-file-jess',
  'estimate-on-your-phone': 'ride-along-the-estimate-on-your-phone',
  'the-paperwork': 'ride-along-the-paperwork',
  'the-invoice': 'ride-along-the-invoice',
  'hand-it-back': 'ride-along-hand-it-back',
  'the-bills': 'ride-along-the-bills',
  'what-youre-getting': 'ride-along-what-youre-getting',
  'put-it-to-bed': 'ride-along-put-it-to-bed',
  'tell-the-team': 'ride-along-tell-the-team',
  'supervisor-app': 'supervisor-app',
};
const strip = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const wordsOfFilm = {};
const specDir = path.join(DESK, 'tools/ride-along/specs');
if (fs.existsSync(specDir)) for (const f of fs.readdirSync(specDir).filter((x) => x.endsWith('.json'))) {
  const key = f.replace(/\.json$/, ''); const film = SPEC_FILM[key]; if (!film) continue;
  try { const s = JSON.parse(fs.readFileSync(path.join(specDir, f), 'utf8')); wordsOfFilm[film] = s.scenes.map((x) => strip(x.say)).filter(Boolean).join(' '); } catch {}
}
// … and every step of the in-page tours (js/tour.js), keyed by the tour's name
const wordsOfTour = {};
try {
  let src = fs.readFileSync(path.join(ROOT, 'js', 'tour.js'), 'utf8');
  src = src.replace(/^import[^\n]*\n/m, '').replace(/^const VOICE[\s\S]*$/m, '');
  const F = new Function('location', 'window', 'document', src + '; return FILMS;')({ search: '' }, {}, {});
  for (const k of Object.keys(F)) wordsOfTour[k] = F[k].map((s) => strip(s.title) + ' ' + strip(s.body)).join(' ');
} catch (e) { console.warn('tour words skipped:', String(e).slice(0, 80)); }

// 3 · what a session knows about each piece that the Ride-Alongs page does not say in one line:
//     where it plays (app · cc · customer · paper), the one-line "short", and the plain questions it answers.
const KNOWN = {
  'ride-along-the-library': { where: ['app', 'cc'], short: 'Where to find how anything works: type what you want to do, tap a question, watch two minutes.', ask: ['Where do I find how something works?'] },
  'ride-along-words-first': { where: ['app'], short: 'Every text button on the file shows you the words first. Read it, change it, tap SEND. You stay on the file.', ask: ['How do I text a customer from the app?', 'Why did nothing go out when I tapped a text button?'] },
  'ride-along-say-it': { where: ['app'], short: 'The gold 🔍 finds any customer in three letters from any page. TELL THE TEAM inside the file reaches anyone on the job, with a receipt.', ask: ['How do I find a customer from any page?', 'How do I tell Jess, a supervisor or the office something about a customer?'] },
  'ride-along-when-you-miss-a-call-or-a-text': { where: ['app'], short: 'A customer call or text you miss buzzes your phone once. Every call sits on the customer’s file, a missed one in red.', ask: ['What happens when I miss a call or a text?'] },
  'ride-along-the-estimate-in-the-4-touch-app': { where: ['app'], short: 'The estimate line by line in the app: pick from the Oasis menu or type, SAVE makes the customer’s link, Text it sends it.', ask: ['How do I build an estimate line by line in the app?'] },
  'ride-along-the-estimate-on-the-file-jess': { where: ['cc'], short: 'The same estimate from the office chair: Files, the customer, Estimate, one row per thing, Create, Text it.', ask: ['How does the office make an estimate on the file?'] },
  'ride-along-the-estimate-on-your-phone': { where: ['cc'], short: 'The Estimate button on the customer’s file, on a phone: one row per thing, one link, the customer taps ACCEPT and you buzz.', ask: [] },
  'tour:sub': { where: ['cc', 'app'], short: 'One question on the contract picture locks the sub in: who is doing the work, their price, their cell. Jess is tagged; nobody remembers anything.', ask: ['How do I lock in the sub on a job?'] },
  'tour:leads': { where: ['cc'], short: '+ New lead: type it once, pick the rep and the time, Open the file. The rep’s phone buzzes and the booking is the file’s first line.', ask: ['How do I book a new lead?'] },
  'the-crew-thread': { where: ['cc'], short: 'The crew’s room on the customer’s file, drawn as a chat: one text, one link, the day step by step.', ask: [] },
  'how-it-works-luis': { where: ['paper'], short: 'The ops manager’s handbook: the two doors, the rooms, the file, the chain, the crews, what to do when something goes wrong.', ask: [] },
  'the-crew-day': { where: ['paper'], short: 'The page a crew gets: six taps in a day, AQUÍ · RECIBIDO · FOTOS · LISTO, Spanish first.', ask: ['What does a crew do on the phone?'] },
  'tour:noc': { where: ['customer', 'cc'], short: 'The customer accepts and signs everything once on one link. The NOC is the one form that goes to them to notarize.', ask: ['How does the customer sign?', 'What is the NOC and who handles it?'] },
  'ride-along-the-paperwork': { where: ['app'], short: 'One link signs the job; the county forms fill themselves from the file; Sam prints, notarizes and pulls the permit.', ask: ['How does the paperwork get from signature to permit?'] },
  'ride-along-the-invoice': { where: ['cc'], short: 'When Luis signs off, the file builds the invoice by itself: one INVOICE card, Approve or Hold.', ask: ['How does the invoice get made?'] },
  'ride-along-hand-it-back': { where: ['cc'], short: 'A sub’s email, a crew’s paper, a fee receipt: the machine types it and hands it back as one card. Approve, Wrong job, or Hold.', ask: ['What do I do when a sub or crew invoice comes in?'] },
  'ride-along-the-bills': { where: ['cc'], short: 'A supplier bill lands on the customer’s file by itself: the number, the PO, the amount next to the order. Jonathan taps Approve.', ask: ['What happens when a supplier bill lands?'] },
  'ride-along-what-youre-getting': { where: ['app'], short: 'Six weeks ago, today’s app, and the three new things: Photos on the file, the help desk both ways, Send quote to Gio.', ask: ['What changed in the app for the reps?'] },
  'ride-along-put-it-to-bed': { where: ['cc', 'app'], short: 'A customer asks about the permit. Sam tags Jonathan, his phone buzzes, the answer is written, one tap sends it.', ask: ['A customer asked something I cannot answer. What do I do?'] },
  'ride-along-tell-the-team': { where: ['app'], short: 'Under the texts card: type @ and a name, say what you need, they get the buzz and the file.', ask: [] },
  'tour:chain': { where: ['cc'], short: 'The customer signs on the link and the job walks itself: Sam, Jonathan, Luis, Laura, in order. Nobody assigns anything.', ask: ['What happens after the customer signs?'] },
  'tour:office': { where: ['cc'], short: 'The Office room: four tiles, oldest ask on top, Done asks for the input, the checklist opens itself.', ask: ['Where do my tasks come from now (the office)?'] },
  'supervisor-app': { where: ['app'], short: 'The supervisor app, screen by screen: LIVE FILES, a file’s four lanes, OFFICE with @names, PHOTOS with TAKE.', ask: ['How do I take a job and run it (supervisors)?'] },
  'tour:super': { where: ['cc'], short: 'The supervisor’s day in Central Command: the board, Take the job, the customer’s text line, the inside note, photos, your crews.', ask: [] },
  'tour:crews': { where: ['cc'], short: 'The crews card, the photo with scope and price, tap it, Send to a crew, the receipt: texted · opened · RECIBIDO.', ask: ['How do I send a job to a crew?'] },
  'tour:gio': { where: ['cc'], short: 'Quotes to price: the card, the clock, type the price and a word, Send the price, PRICED on the file.', ask: ['How do I price a quote (Gio)?'] },
  'tour:keys': { where: ['cc'], short: 'Every room, for Jess and Luis: Say it, the bing, what you sent out, View as, the crews, My book, the phone on the road.', ask: [] },
  'tour:1': { where: ['cc'], short: 'The Line on Sam’s screen: the bing, ✓ Got it, the file and the thread, the receipt, ＋ Photo, the Answer button.', ask: ['What is The Line?'] },
  'sign-on-the-phone-small': { where: ['customer'], short: 'What the customer does: open the link, read it, sign once, done. Twenty-two seconds.', ask: ['What does the customer see when they sign?'] },
};

// 4 · the pieces, from the Ride-Alongs page (newest on top)
const h = fs.readFileSync(path.join(ROOT, 'docs', 'ride-alongs.html'), 'utf8');
const boxes = [...h.matchAll(/<div class="box[^"]*">([\s\S]*?)<\/div>\s*<\/div>/g)].map((m) => m[1]);
const dateOf = (meta) => { const m = /(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?\s*Sep/.exec(meta || ''); if (!m) return null; return `2026-09-${String(+(m[2] || m[1])).padStart(2, '0')}`; };
const guessWhere = (text) => { const t = text.toLowerCase(); const w = new Set(); if (/phone app|4-touch app|app pr|ota|supervisor app|in the app/.test(t)) w.add('app'); if (/central command|\bv\d{2,3}\b|the office room|on the file in/.test(t)) w.add('cc'); if (/customer's phone|the customer does/.test(t)) w.add('customer'); if (/printed|a page, not a film|print/.test(t)) w.add('paper'); return [...w]; };
const shortOf = (what) => { let s = what.replace(/^(Kevin|Kevin and Jess|The)[^:]{0,60}:\s*"[^"]*"\.?\s*/g, '').replace(/^(Then|So,)[^.]*\.\s*/, ''); const first = /^(.{20,220}?[.!?])(\s|$)/.exec(s); return (first ? first[1] : s.slice(0, 200)).trim(); };
const seen = new Set();   // two boxes may play the same film (Jermey's Pro-Tech note reuses the words-first film): each piece keeps its own id and its own words
const rows = boxes.map((b) => {
  const title = strip((/<h2>([\s\S]*?)<\/h2>/.exec(b) || [])[1] || '');
  const what = [...b.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => strip(m[1])).join(' ');
  let film = (/(?:watch|film)\.html\?f=([^&"]+)/.exec(b) || [])[1] || null; if (film && !frames[film]) film = null;
  const inline = (/src="\.\.\/films\/([a-z0-9-]+)\.mp4"/.exec(b) || [])[1]; if (!film && inline && frames[inline]) film = inline;
  const go = (/&go=([^"]+)"/.exec(b) || [])[1] || null;
  const meta = strip((/class="meta">([\s\S]*?)<\/span>/.exec(b) || [])[1] || '');
  const links = [...b.matchAll(/href="([^"]+)"[^>]*>([^<]*)</g)].map((x) => ({ href: x[1], text: strip(x[2]) }));
  const tour = (links.find((l) => /tour=.*voice=1/.test(l.href)) || {}).href || null;
  const tourKey = tour ? (/[?&]tour=([a-z0-9]+)/.exec(tour) || [])[1] : null;
  const page = (links.find((l) => /^[a-z0-9-]+\.html$/.test(l.href)) || {}).href;
  const key = film || (tourKey ? 'tour:' + tourKey : page ? page.replace(/\.html$/, '') : null);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const again = !!(key && seen.has(key)); if (key) seen.add(key);
  const k = again ? {} : (KNOWN[key] || {});
  return {
    id: again || !key ? slug : key,
    title, what, short: k.short || shortOf(what), film,
    go: go ? decodeURIComponent(go) : (tour ? tour.replace(/^\.\.\//, '').replace(/&voice=1$/, '') : null),
    tour, meta, date: dateOf(meta), where: k.where || guessWhere(meta + ' ' + what), ask: k.ask || [],
    links: links.filter((l) => !/watch\.html|film\.html|tour=/.test(l.href)),
    words: (film && wordsOfFilm[film]) || (tourKey && wordsOfTour[tourKey]) || '',
  };
}).filter((r) => r.title && !/^(How to send one|The rule)$/.test(r.title));

// 5 · the plain films that only films.html lists and are still how things work today (the commercials are not pieces)
const extra = [
  { title: 'Every rep · Sign on the phone', what: 'The whole thing the customer does on their phone: open the link, read it, sign once, done. Twenty-two seconds, no words.', film: 'sign-on-the-phone-small', meta: '0:22 · no words · 17 Sep', date: '2026-09-17' },
].map((e) => ({ id: e.film, ...e, short: KNOWN[e.film].short, go: null, tour: null, where: KNOWN[e.film].where, ask: KNOWN[e.film].ask, links: [], words: wordsOfFilm[e.film] || '' })).filter((e) => frames[e.film] && !rows.some((r) => r.film === e.film));

const all = rows.concat(extra);
fs.writeFileSync(path.join(HERE, 'library.json'), JSON.stringify({ built: new Date().toISOString(), pieces: all }, null, 1));
console.log(`library: ${all.length} pieces · ${all.filter((r) => r.film).length} with a film · ${all.filter((r) => r.tour).length} play on the real screen · ${all.filter((r) => r.words).length} with their words indexed · ${Object.keys(frames).length} films framed`);
for (const r of all) if (!r.date) console.warn('  no date:', r.title);
for (const r of all) if (!KNOWN[r.id]) console.warn('  not in KNOWN (guessed):', r.id, '→', r.where.join(','));
