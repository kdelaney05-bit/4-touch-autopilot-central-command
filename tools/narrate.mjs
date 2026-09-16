// THE NARRATOR — records a real voice for a Ride-Along (Gospel 31; Kevin, 16 Sep: "it's got to be a cool voice").
// Reads the films out of js/tour.js and writes films/<film>/<n>.mp3 + films/index.json; the tour plays the
// recording when it is there and falls back to the browser's own voice when it is not.
//
//   node tools/narrate.mjs crews            # one film
//   node tools/narrate.mjs all              # every film in FILMS
//   node tools/narrate.mjs gio --dry        # print the lines, record nothing
//
// The voice is one we have the right to use — a licensed studio voice, or Kevin's own cloned with his say-so.
// Never a real person's voice passed off as them.
//   ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID  → ElevenLabs (the best voices; a cloned voice is a voice id too)
//   OPENAI_API_KEY   [+ OPENAI_TTS_VOICE, default 'onyx']  → OpenAI gpt-4o-mini-tts (cheap, very good)
// One key in the environment is enough; ElevenLabs wins when both are set. Cost: about a cent a step.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(ROOT, 'js/tour.js'), 'utf8');
const films = {};
for (const m of src.matchAll(/const (\w+STEPS) = (\[[\s\S]*?\n\]);/g)) films[m[1]] = new Function('return ' + m[2])();
const names = Object.fromEntries([...src.matchAll(/'([a-z0-9]+)': (\w+STEPS)/g)].map((m) => [m[1], m[2]]));
const want = process.argv[2] || 'all';
const dry = process.argv.includes('--dry');
const pick = want === 'all' ? Object.keys(names) : [want];
if (pick.some((n) => !names[n])) { console.error('films:', Object.keys(names).join(' ')); process.exit(2); }

const EL = process.env.ELEVENLABS_API_KEY, OA = process.env.OPENAI_API_KEY;
if (!dry && !EL && !OA) { console.error('no voice: set ELEVENLABS_API_KEY (+ELEVENLABS_VOICE_ID) or OPENAI_API_KEY'); process.exit(2); }

async function record(text) {
  if (EL) {
    const vid = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';   // George, the default studio narrator
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}?output_format=mp3_44100_128`, {
      method: 'POST', headers: { 'xi-api-key': EL, 'content-type': 'application/json' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.2 } }),
    });
    if (!r.ok) throw new Error('elevenlabs ' + r.status + ' ' + (await r.text()).slice(0, 200));
    return Buffer.from(await r.arrayBuffer());
  }
  const r = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST', headers: { authorization: 'Bearer ' + OA, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice: process.env.OPENAI_TTS_VOICE || 'onyx', input: text, instructions: 'Calm, warm, confident. Plain and unhurried, like a founder walking a friend through a new tool. Short pauses at the periods.' }),
  });
  if (!r.ok) throw new Error('openai ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return Buffer.from(await r.arrayBuffer());
}

const indexPath = path.join(ROOT, 'films/index.json');
const index = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : {};
for (const name of pick) {
  const steps = films[names[name]];
  const dir = path.join(ROOT, 'films', name);
  console.log(`\n${name} · ${steps.length} steps`);
  for (let k = 0; k < steps.length; k++) {
    const s = steps[k];
    const text = (s.title + ' ' + s.body).replace(/[＋]/g, 'plus ').replace(/·/g, ',').replace(/\s+/g, ' ');
    console.log(`  ${k + 1}. ${text.slice(0, 90)}${text.length > 90 ? '…' : ''}`);
    if (dry) continue;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${k + 1}.mp3`), await record(text));
  }
  if (!dry) index[name] = steps.length;
}
if (!dry) { fs.mkdirSync(path.dirname(indexPath), { recursive: true }); fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n'); console.log('\nwrote films/index.json', index); }
