# The communication highway — what is live, for whom, and where (15–16 Sep 2026)

Kevin, 16 Sep, 3 AM: "lock this stuff in hard code into the repo… almost ready
for the troops." This is the build sheet. Every line here is on `main` of this
repo (push = deploy) or on the named branch of `kdelaney05-bit/trureview-mobile`.
The words in quotes are Kevin's.

## The one sentence

"If it is about a customer, it lives on the customer." One file per customer;
everybody inside is on it the second they are named; the customer never sees
the inside lane.

## The links

| What | Where |
|---|---|
| The site | https://kdelaney05-bit.github.io/4-touch-autopilot-central-command/ |
| The film (runs by itself, Samantha's view) | `?demo=1&as=office&tour=1&auto=1` |
| The deck (12 slides) | `docs/highway-deck.html` |
| Every new piece, as the guys will see it | `docs/visuals.html` |
| The demo, straight into a room / a file | `?demo=1&room=photos` · `?demo=1&room=line&file=cj6` |
| The crew link (Spanish, no login) | `w.html` in `kdelaney05-bit/liberty-command` |

## Who opens what (config.js, v65+)

| Seat | Rooms | View as |
|---|---|---|
| Kevin | every room | yes |
| Jess (Jessica Coley), Luis | every room — "a super one like me, they can be anyone and reach anyone" (16 Sep) | yes |
| Gio | The Line · Sales · Pipeline · Photos · Files — "I don't want Gio seeing too much… player sales manager… just go sell" (16 Sep); never the books | no |
| Sam, Laura, Jonathan (office) | The Line · Pipeline · Photos · Files — "give them the pipeline and then the line" (15 Sep) | no |
| Obed, Robert, Mike (managers) | The Line · Pipeline · Photos · Files | no |
| Reps | the phone app; The Line · Photos · Files on the site | no |
| Crews | no login, ever — one link per job | — |

Admins and everyone who works from home: the same site on the phone (v62, one
column, thumb-sized tabs, Add to Home Screen). "Luis needs a mobile version…
a desktop cockpit and a mobile command center."

## The pieces, by version

| v | Piece | Kevin's words |
|---|---|---|
| 58 · 68 | The film: `?tour=1&auto=1` runs the tour a step every 7 s — thirteen steps by v68, fifteen by v72 (the bing, the quote, the crews and the nugget, Photos, My book, the file, the next word, the receipt) | "build out a video and deck" |
| 59 | The film runs in the SEAT'S view (`&as=office`); manager/office gain the Pipeline room | "the one you show is mine… give them the pipeline and then the line" |
| 60 | THE BING: chime + browser notification + a task card that stays until ✓ Got it or Open the file (`js/alerts.js`, polls every 10 s) | "the popup needs to be obvious and easy to check off for the employee whose task it is" |
| 61 | THE PHOTOS: the Photos room for every seat, the file's strip (ours + CompanyCam), ＋ Photo → the sheet (words · tag people · crew · $) | "crews, sales and supervisors communicate with pics… tag the crew and the dollar amount… Mike uses the app to manage the entire thing" |
| 62 | The phone layout | "Luis needs a mobile version" |
| 63–64 | `?room=` and `&file=` open a room / a file from a link; Jess + Luis get the keys; `docs/visuals.html` | "show me visuals of all this" |
| 65 | Gio's rooms narrowed | "player sales manager" |
| 66 | SEND QUOTE TO GIO: the pricer's queue at the top of The Line (checklist, pictures, price box), the file's card with the clock | "cut this down 1/3–1/4… get complicated quotes to guys" |
| 67 | THE RECEIPT: after a post, who it reached and how; under every note, who it tagged and ✓ who opened it — never a notification | "i didn't get a notification of who it went to… who opened it etc. not in my notifications but if i need to" |
| 69 | MY BOOK: Files opens on the seat's own customers, one card each with the wait and the open tasks as a checklist (who, how long); Everyone is the whole list | "all their customers and current open tasks in this easier to read and understand UI… we took all the best from CC… Jet Stream and the tasks were the best part… 10x easier" |
| 77 | THE PICTURE GOES WITH THE NUGGET: open any photo on a file or in the Photos room → "→ Send to a crew" → the nugget opens with the picture, the words, the customer and the price already in it; the crew's page shows the scope photo big and the dollars over RECIBIDO. 359 | "post the pic to the crew when he assigns it… locks in scope and price in pic" |
| 75 | APPRECIATE: one tap on a finished directive — the words pre-written from the chain in Kevin's voice, to the person (the push), shared with the village if the box is checked | "encourager and rewarder and appreciator all in one… that's all employees really want: appreciation and opportunity and the right way to please you" |
| 74 | WHAT I SENT OUT — the chain: every directive (a note that named someone, an ask, a nugget, a quote), who it reached, who picked it up, who did it and how fast; tap one and the downline opens, step by step, until done. The film gains the step. 358 `my_directives(days)` | "I sent out 15 directives and they were done in 5 min by this person and confirmed by this person… my 20 recommendations led to this led to this… straight down chain, follow through, look in — but not in a stressful way" |
| 73 | The find popup closes (Close ✕, Escape, a tap anywhere, an emptied box) | "won't let me put this screen down" |
| 71 | MY CREWS + THE NUGGET: a manager's crews (name, phone, language, no login), Send a nugget (the instruction, the customer and address, bring back a photo / number / yes-no / words / done, by when), the court with the receipt on every one — texted · opened · RECIBIDO by name · brought back. Mike gets the keys like Luis | "tag his crews who are basically his employees… an objective nugget with something you need to bring me back… it's in your court… today we put sod on the wrong yard… they need to know we told them" |
| 70 | THE NEXT WORD (the office's and ops' gift): close the permit ask → "your permit is approved" is in the box; set the schedule → "you're on the schedule for Friday" is in the box, date filled; invoice → the invoice line; a customer asks about paying → Reply puts the pay-link line in the box. The right one of the twelve approved lines, filled from the file, lit, one tap left. Nothing sends by itself | "give the office staff and ops staff a gift like we did the sales reps — a quicker better faster way" |

## The database (trureview-mobile, all APPLIED LIVE 16 Sep)

| Migration | What |
|---|---|
| 351 `the_photos` | `job_photos`, public bucket `job-photos` (uuid paths), `job_photo_post` (the row AND the line on the file), `v_file_photos` = ours ∪ CompanyCam (count once) |
| 352 `photo_tags_crew_amount` | `tagged` / `crew` / `amount` on a photo; the line rides the seat's Say-it lane (never CHAT) so 312's trigger pushes everyone tagged; `v_photo_crews` |
| 353 `quote_to_gio` | `quote_checklist` (the questions, editable in the DB), `quote_pricer()` → Gio, `quote_requests`, `quote_request_send` / `quote_request_answer` (one @-tag line each way), `v_quote_requests` with the clock |
| 354 `mention_receipts` | `thread_receipts(thread)` — who each note tagged, has a phone, opened it |
| 355 `brand_signed_texts` | at the one door every text leaves through: a brand line only carries its own company's customer (raises); a text that does not name the company gets " — Company"; `text_clock` ON |
| 356 `crew_nuggets` | `crew_people` (name · phone · language · one standing link, no login), `crew_nuggets` (one instruction + the one thing to bring back + by when), `nugget_send` (the text with the link from the company's line), `nugget_view` / `nugget_return` (the crew's page, by token), `v_crew_nuggets` (the court) |
| 359 `nugget_carries_the_photo` | `photo_ids` + `amount` on a nugget; `nugget_send` carries them; the crew page shows the scope photos and the price |
| 357 `nugget_received` | the receipt: `seen_at` when the link opens, RECIBIDO by name and minute (`nugget_ack`), the address on the nugget, the text's sent stamp — "so there is nothing to argue" |

Edge function `crew-nugget` (deployed 16 Sep, no JWT — the token is the key) · the crew's page `c.html` in `kdelaney05-bit/liberty-command` (Spanish first).

Files: `backend/migrations/351–354` on branch `claude/photos-app` (PR #426).

## The phone (branch `claude/photos-app`, PR #426 — waits on "publish")

- `App.tsx`: `PhotoCard` — the FIRST card on every live customer file: TAKE / PICK →
  1600 + 320 on the phone → `job-photos` → `job_photo_post` with the words, the
  crew, the $; the strip = ours + CompanyCam.
- `App.tsx`: `QuoteToGio` in the Armory after Send a file as a link — the
  checklist as chips, pictures, SEND TO GIO; "💰 Gio priced it" comes back on the file.
- `supervisor-app/JobFileLive.tsx`: the PHOTOS lane reads `v_file_photos` and gains TAKE.

## v76 → v79 (16 Sep, before dawn)

- **v76**: the demo's staged bing only plays inside a film or with `&bing=1` — Kevin heard a stray bing on his laptop.
- **v78**: THE CREWS FILM. `js/tour.js` carries two films now: `FILMS = { '1': STEPS, 'crews': CREW_STEPS }`.
  `?demo=1&as=manager&tour=crews&auto=1` walks Mike through the crews card, + Crew, the photo with scope and price
  on Dave Marchetti's file, tap it → Send to a crew, the nugget already filled, the court receipt, and a link to
  what Ramón sees (`liberty-command/c.html?demo=1`, a demo mode added the same night). `&voice=1` reads every
  caption in the browser's own voice (speechSynthesis). Autoplay waits longer on steps that open something.
- **v79**: 🎬 What's new in the header → `docs/ride-alongs.html`, the list of every Ride-Along, newest on top.
  Gospels 31 (every new thing ships with a Ride-Along) and 32 (the machine babysits so the people hunt).
- **v80**: THE VOICE, for real. A voiced film opens on "Sound on. Tap play." (browsers refuse to speak until one tap);
  it reads sentence by sentence in the best English voice the device has, and autoplay moves on when the voice ends,
  not on a timer. Two more films: `?tour=gio` (Quotes to price, 7 steps, `&as=manager`) and `?tour=keys` (Jess and
  Luis, 12 steps, every room + View as). `tools/narrate.mjs` records a licensed narrator (ElevenLabs or OpenAI, one
  key in the env) into `films/<film>/<n>.mp3` + `films/index.json`; the tour plays the recording when it exists.
  Kevin asked for Steve Jobs' voice — declined (a real person's voice passed off as him); the narrator is a licensed
  voice or Kevin's own clone with his say-so.
- The crew page `c.html` shipped broken for a few minutes: a JS `String.replace` whose replacement held `$'`
  spliced the file into itself. Rebuilt from the last good commit; splices are split/join now, and the inline
  script is parsed before a push.

## v81 → v82 + migration 360 (16 Sep, launch morning, live)

- **v81**: THE VILLAGE is a top tab for every seat. Kevin's first company-wide post went to the Village and nobody
  could find it — at a laptop width the rail stacks under the whole Line. `?room=village` boots there.
- **360 THE NAG** (applied 15:2x UTC): every tag becomes an email (from kevin@, the delegation) and a text on the
  fencing line with a link back to the exact spot — file tags, direct lines, and NOW names in a room post
  (`team_mentions`, the Village had no name rule). Box service `liberty-notify` (`backend/worker/tag-notify.mjs`,
  20 s). A tag the person already opened is not nagged. First run: 10 emails, 4 texts (the seats with a phone).
- **v82**: the bing rings for a Village tag too; the card says Open the Village.

## v84 → v92 + 360–364 (16 Sep, launch day, afternoon)

- v84 Enter posts + the 🎤 (js/dictate.js) · v85 the @ picker for office seats (rep_names) · v86 a rail pane scrolls into view + Back, the film Play id fixed · v87 the tab mark (favicon.svg) · v88 the find box always closes, group handles · v89/v90 the Village: small bubbles, lit @names, the list fills the screen · v91 phone search · v92 THE OFFICE FILM (?tour=office) and the Office room for office seats.
- 360 the nag · 361 email-only seats · 362 group tags (@sales @supers @office @everyone) · 363 stay on the file (the Jetstream rule) · 364 the office reads the whole book.
- The CC documents: pull-cc-files.mjs running on the box overnight (live → sold → all), landing under the OFFICE lane of each file.

## Found tonight, still owed

- The CompanyCam mirror (028, 106,862 photos) has 401'd every hour since 19 Aug —
  **Kevin mints a fresh token** (owner login → Account Settings → API) into
  `/etc/liberty-command.env`. Then the copier brings the history home (scope step 5).
- Before/after + the customer's gallery link (scope step 6).
- Group threads with the customer and a third party (Kevin asked 16 Sep) — not built;
  the crew-link way (a link per outside person into a room on the file) is the design.
- Gio's database role stays `owner` until the demotion is real — one UPDATE that day.
- The seven office/production seats have never signed into the phone app: no push
  reaches them until they do; their copy waits in You're up and the bing.

## The rollout

Wave one = Kevin, Luis, Jess, Sam, Gio. `backend/scripts/welcome-links.mjs
--wave1 --kevin-gives --send` on the box sends the welcome (dry by default);
`set-seat-password.mjs <email>` on the box sets a password by Kevin's hand.
Two things to try: say one thing to one person about one customer; answer when
someone says something to you. Then tell Kevin what is useful, missing, annoying.
