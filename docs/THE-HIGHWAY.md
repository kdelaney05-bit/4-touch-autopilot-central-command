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
| 58 · 68 | The film: `?tour=1&auto=1` runs the tour a step every 7 s — thirteen steps by v68 (the bing, the quote, Photos, the file, the receipt) | "build out a video and deck" |
| 59 | The film runs in the SEAT'S view (`&as=office`); manager/office gain the Pipeline room | "the one you show is mine… give them the pipeline and then the line" |
| 60 | THE BING: chime + browser notification + a task card that stays until ✓ Got it or Open the file (`js/alerts.js`, polls every 10 s) | "the popup needs to be obvious and easy to check off for the employee whose task it is" |
| 61 | THE PHOTOS: the Photos room for every seat, the file's strip (ours + CompanyCam), ＋ Photo → the sheet (words · tag people · crew · $) | "crews, sales and supervisors communicate with pics… tag the crew and the dollar amount… Mike uses the app to manage the entire thing" |
| 62 | The phone layout | "Luis needs a mobile version" |
| 63–64 | `?room=` and `&file=` open a room / a file from a link; Jess + Luis get the keys; `docs/visuals.html` | "show me visuals of all this" |
| 65 | Gio's rooms narrowed | "player sales manager" |
| 66 | SEND QUOTE TO GIO: the pricer's queue at the top of The Line (checklist, pictures, price box), the file's card with the clock | "cut this down 1/3–1/4… get complicated quotes to guys" |
| 67 | THE RECEIPT: after a post, who it reached and how; under every note, who it tagged and ✓ who opened it — never a notification | "i didn't get a notification of who it went to… who opened it etc. not in my notifications but if i need to" |

## The database (trureview-mobile, all APPLIED LIVE 16 Sep)

| Migration | What |
|---|---|
| 351 `the_photos` | `job_photos`, public bucket `job-photos` (uuid paths), `job_photo_post` (the row AND the line on the file), `v_file_photos` = ours ∪ CompanyCam (count once) |
| 352 `photo_tags_crew_amount` | `tagged` / `crew` / `amount` on a photo; the line rides the seat's Say-it lane (never CHAT) so 312's trigger pushes everyone tagged; `v_photo_crews` |
| 353 `quote_to_gio` | `quote_checklist` (the questions, editable in the DB), `quote_pricer()` → Gio, `quote_requests`, `quote_request_send` / `quote_request_answer` (one @-tag line each way), `v_quote_requests` with the clock |
| 354 `mention_receipts` | `thread_receipts(thread)` — who each note tagged, has a phone, opened it |

Files: `backend/migrations/351–354` on branch `claude/photos-app` (PR #426).

## The phone (branch `claude/photos-app`, PR #426 — waits on "publish")

- `App.tsx`: `PhotoCard` — the FIRST card on every live customer file: TAKE / PICK →
  1600 + 320 on the phone → `job-photos` → `job_photo_post` with the words, the
  crew, the $; the strip = ours + CompanyCam.
- `App.tsx`: `QuoteToGio` in the Armory after Send a file as a link — the
  checklist as chips, pictures, SEND TO GIO; "💰 Gio priced it" comes back on the file.
- `supervisor-app/JobFileLive.tsx`: the PHOTOS lane reads `v_file_photos` and gains TAKE.

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
