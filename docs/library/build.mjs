// THE LIBRARY's data: docs/library/library.json from docs/ride-alongs.html (every box = one piece), plus the plain films
// that only films.html lists, and docs/library/frames.json + frames/*.jpg (four frames per film in films/*.mp4).
//
//   node docs/library/build.mjs            rebuild library.json and any missing frames
//   node docs/library/build.mjs --frames   re-cut every frame (after a film is re-rendered)
//
// Nothing here is data about a customer: the films are made from the demo book by law (FILM LAW, CLAUDE.md).
// ffmpeg: the ride-along maker's copy (Commercial-Desk/tools/ride-along/node_modules/ffmpeg-static/ffmpeg.exe).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const FF = process.env.FFMPEG || 'C:/Users/kdela/OneDrive/Desktop/Commercial-Desk/tools/ride-along/node_modules/ffmpeg-static/ffmpeg.exe';
const REDO = process.argv.includes('--frames');

// 1 · frames
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
  frames[name] = { seconds: Math.round(dur), frames: list };
}
fs.writeFileSync(path.join(HERE, 'frames.json'), JSON.stringify(frames, null, 1));

// 2 · the pieces, from the Ride-Alongs page
const h = fs.readFileSync(path.join(ROOT, 'docs', 'ride-alongs.html'), 'utf8');
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const boxes = [...h.matchAll(/<div class="box[^"]*">([\s\S]*?)<\/div>\s*<\/div>/g)].map((m) => m[1]);
const rows = boxes.map((b) => {
  const title = strip((/<h2>([\s\S]*?)<\/h2>/.exec(b) || [])[1] || '');
  const what = strip((/<p>([\s\S]*?)<\/p>/.exec(b) || [])[1] || '');
  let film = (/(?:watch|film)\.html\?f=([^&"]+)/.exec(b) || [])[1] || null; if (film && !frames[film]) film = null;
  const go = (/&go=([^"]+)"/.exec(b) || [])[1] || null;
  const meta = strip((/class="meta">([\s\S]*?)<\/span>/.exec(b) || [])[1] || '');
  const links = [...b.matchAll(/href="([^"]+)"[^>]*>([^<]*)</g)].map((x) => ({ href: x[1], text: strip(x[2]) }));
  const tour = (links.find((l) => /tour=.*voice=1/.test(l.href)) || {}).href || null;
  return { title, what, film, go: go ? decodeURIComponent(go) : (tour ? tour.replace(/^\.\.\//, '').replace(/&voice=1$/, '') : null), tour, meta, links: links.filter((l) => !/watch\.html|film\.html|tour=/.test(l.href)) };
}).filter((r) => r.title && !/^(How to send one|The rule)$/.test(r.title));

// 3 · the plain films that only films.html lists (the five commercials, the signing clip, the supervisor app)
const extra = [
  { title: 'Everyone · The Full Show — The 4-Touch Autopilot', what: 'Everything, start to finish: the lead, the estimate, the signature, the paperwork, the crew, the invoice, the review. Eleven minutes. Watch it once and you know the whole machine.', film: 'the-full-show', meta: '11 min · everyone' },
  { title: 'The sales team · The Hunt — the sales app', what: "A rep's day in the 4-Touch app: Today, the Morning Line, the customer file, the four touches, the estimate on the phone.", film: 'the-hunt', meta: '2:52 · sales' },
  { title: 'Luis · the crews · The Record — the crew cut', what: "The crew's day: the work order on the phone, Spanish first, the photos, RECIBIDO, done.", film: 'the-record', meta: '2:22 · Luis, the crews' },
  { title: 'Luis · Obed · Robert · The Babysitter — the supervisor cut', what: "The supervisor's day: take the job, the crew, the site, the sign-off, hand it back to the office.", film: 'the-babysitter', meta: '2:31 · Luis, Obed, Robert' },
  { title: "Kevin · Jess · The Blindfold Off — the owner's cut", what: 'What Kevin sees: the boards, the clocks, the money, who moved and who did not.', film: 'the-blindfold-off', meta: '2:54 · Kevin, Jess, the managers' },
  { title: 'Every rep · Sign on the phone', what: 'The whole thing the customer does on their phone: open the link, read it, sign once, done. Twenty-two seconds, no words.', film: 'sign-on-the-phone-small', meta: '0:22 · no words · every rep' },
  { title: 'Luis · Obed · Robert · The supervisor app — the real screens', what: 'The supervisor app, screen by screen: the board, the job, the crew, the photos, the sign-off, hand it back.', film: 'supervisor-app', meta: '2:53 · Luis, Obed, Robert' },
].map((e) => ({ ...e, go: null, tour: null, links: [] })).filter((e) => frames[e.film]);

const all = rows.concat(extra);
fs.writeFileSync(path.join(HERE, 'library.json'), JSON.stringify(all, null, 1));
console.log(`library: ${all.length} pieces · ${all.filter((r) => r.film).length} with a film · ${all.filter((r) => r.tour).length} play on the real screen · ${Object.keys(frames).length} films framed`);
