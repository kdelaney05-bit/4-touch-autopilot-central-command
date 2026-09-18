# CLAUDE.md — The 4-Touch Autopilot Central Command

Kevin's one place: the company platform for Liberty Fencing, Liberty Roofing,
Pro-Tech Roofing and Oasis Landscapes. Named by Kevin, 13 Sep 2026. Rooms:
**The Business · Sales · Marketing · Office · Production · Files**, and the
customer file under all of them. `README.md` says what each room is and what
the file's header does.

## Read first, every session

**`docs/GOSPELS.md`** is Kevin's rulebook for every screen and every decision here: twenty rules in his words, 13 Sep 2026. **`docs/LANES.md`** is where each thread of work stands. Read both before touching anything. If Kevin is not around, they are how he would answer.

## The rule over everything

**Built beside Contractors Cloud. Nothing is switched over.** Kevin, 13 Sep:
"one contained unit, our own crm… just get it set up and don't integrate or
change anything over yet… let's get it built and set and then slowly migrate
safely." So: the office keeps typing into CC, no Zap is repointed, the
QuickBooks worker stays off, and every door we build is a second door onto the
same work. Do not "finish the migration" in a session; that is Kevin's call,
one step at a time. **The first step is taken (Kevin, 17 Sep morning): from
Mon 21 Sep 2026 the office schedules every new lead here first, through the
New lead door, and the machine carries the copy into CC (switch `cc_mirror`,
OFF until his word) or the office pastes it (Copy for CC on the file).
Nothing else moves. `docs/JESS-MONDAY.md` is the honest table of what stays
in CC.**

## What this repo is, and is not

- **Is:** the static web app at the root (`index.html`, `command.css`,
  `js/*.js`). No build step. GitHub Pages serves `main`; **push = deploy**.
  Live: https://kdelaney05-bit.github.io/4-touch-autopilot-central-command/
- **Is not:** the database. Migrations, workers and edge functions live in
  `kdelaney05-bit/trureview-mobile`
  (`C:\Users\kdela\OneDrive\Desktop\Commercial-Desk` is the current clone).
  This app's schema is migrations **306–381** there — see the table in
  `README.md` for which one backs which feature. **Next free = 397** (live, checked 17 Sep afternoon: **396** `lead_rep_options()` + `reps.takes_leads` + policy `office_reads_company_reps` — this app's New lead rep list and the office seat's reps door, the Samantha session, file on trureview-mobile main; 393 office-line copies, 394 no SVG on the signed note, 395 machine handles don't buzz, all the same day; 392 Mike's line, `office_lines.for_rep`, applied 17 Sep 10:58 AM by this session, file on trureview-mobile main; 389 the first name is a person, 390 the parcel says the city, 391 the seat that sleeps (Oasis is Jess), all applied 17 Sep ~10:05–10:55 AM by the inbox session, files on trureview-mobile main; 382 and 383 taken 17 Sep 8:20 AM, 384 the reschedule door 17 Sep 8:45 AM,
  checked 17 Sep noon; two 381s are applied on live, 381_the_invoice and 381_the_first_piece_leads, like the two 369s), but
  check `schema_migrations` on live before writing one: sibling sessions
  number in parallel.

  **17 Sep 2026 (evening):** live top is **397** — `397_the_sub_locked_in` (Kevin + Jess, the Billdu handoff meeting; APPLIED LIVE by the Billdu-handoff session, dry-run rolled back first on "Delaney Oasis walk, Kevin"; file on trureview-mobile main): `job_sub_locks` · `sub_options` · `sub_lock` · `sub_lock_mark` · `v_job_sub_locks`. This app v109: the checkbox on ＋ Photo, the Sub locked in card, NEXT, the Office room's waiting list, the film `?tour=sub`. **Next free = 398** — read `schema_migrations` first.
  **18 Sep 2026 (morning):** live top is **404** — `404_the_visit_on_the_reps_google_calendar` (Sam: a visit booked at the New lead door reached Gio's phone and the file, never his Google Calendar; Kevin: "we don't need the calendars but it should sync for sure"; APPLIED LIVE by the cloud session, dry-run rolled back first on Sam's own test visit; file on trureview-mobile branch `claude/google-calendar-appt-sync-6rtbkd`): `gcal_events` · `gcal_sync_due` · `gcal_sync_mark`; worker `backend/worker/gcal-sync.mjs` on the box as `liberty-gcal.service`, inert until Kevin adds the Calendar scope to the liberty-nurture delegation in the three Workspace admin consoles; **405** `typed_into_cc_is_ccs_calendar` the same morning (a visit the office typed into CC — `cc_mirror_queue` by_hand or sent — is CC's on the calendar: no insert, handoff if ours is there). Nothing in this app changed. **Next free = 406** — read `schema_migrations` first.
- The owner console (`kdelaney05-bit/liberty-command`) is a separate page; the
  Sales and Marketing rooms embed it by hash (`#sales`, `#marketing`). Same
  github.io origin, its own sign-in. Never copy it in.

## Where the data lives

Supabase project **`lzegjjbkfuecrhdvlvay`**, the same database as the phone
app, the crew app, the supervisor app and the desk. **RLS is the doorman** —
the page asks for everything and the database hands back only what that seat
may see. The key in `js/config.js` is publishable and authorises nothing.

## Laws

- **THE FILM LAW (Kevin, 17 Sep 2026, 4:30 PM — "i see no videos. ever… nobody
  can see them… make law across all code sessions and changes. push video
  explanation to all impacted").** A change that touches a person is NOT DONE
  until: (1) a real MP4 exists, about 10 MB or less, that plays from one link
  with no sign-in, no tap-to-start and no download —
  `films/watch.html?f=<name>&t=<title>` on this site (the repo is PUBLIC:
  demo data only, never a real customer); (2) that link is pushed to every
  person the change touches, on their phone (Expo push through
  `rep_push_tokens`; a text where there is no app), inside 8 AM–7:30 PM ET,
  and the same link is given to Kevin in the session — not by email; (3) the
  film is listed newest-first on `docs/ride-alongs.html`. An in-page tour
  (`?tour=`) is a rehearsal, not the film. No explanation to the team goes
  out as an email. Maker: `Commercial-Desk/tools/ride-along/make.mjs` (Guy);
  screenshots from `?demo=1&as=<seat>&file=<id>` at 390×844; ship the
  "(phone)" copy. Gospel 31 carries the same words.
- **Cache-bust together.** `index.html` references `command.css?v=N` and
  `js/app.js?v=N`, and every `import` inside `js/` carries the same `?v=N`.
  Bump all of them in one commit (`sed` over `js/*.js` + `index.html`), or a
  browser keeps an old module and the page loads blank — Kevin's first
  sign-in did exactly that. A stale module is a blank page, every time.
- **No data, no secrets.** Nothing about a customer is ever written into this
  repo.
- **Writes go through RPCs** — `job_create` (the New Job door), `job_take`,
  `job_assign`, `job_handback`, `ask_settle`, `file_text_queue`,
  `invoice_request`, `automation_switch_set`. A plain PATCH that closes an ask
  with a proof rule is refused by the database on purpose. The village's room
  posts are inserts into `team_messages` (RLS: staff only, author must be you;
  the owner may delete).
- **Every outbound text or email is a draft until a seat presses Send**, and
  the machine's texts stay behind `automation_switches` — `appt_confirm`,
  `text_clock`, `office_machine_texts`, `after_hours_reply`, `qb_invoices`,
  **all OFF**. Flipping one is Kevin's, from the Office room. Never from code.
- **A seat texts only from a campaign-approved main line** (311). Fencing
  386-276-6898 since 2 Sep; **Oasis 321-274-4268 live 17 Sep** (its
  CloudMessage key is on the rail, one key per line). Pro-Tech is registered
  and keyed but its lines stay OFF until Kevin says.
- **`?demo=1`** renders `js/demo.js`'s fictional book with every write
  refused. Use it to check rendering without a login.
- Kevin and Jess edit the office lines, the chain, the proof rules, the
  workflow map's notes, the seats and the brand settings **as rows** — not as
  code. Keep it that way.
- Spellings that are not typos: the rep is **Jermey**; the product is **The
  4-Touch Autopilot**.

## The pieces a session is most likely to touch

- **The phones** (`docs/THE-PHONES.md`) — where every call and text lives,
  which worker fills which table, the lines, and the playbook for fixing
  Uvoice and texting problems. Start there for any phone or text question.
- **The customer file** (`js/file.js`) — the header (Call · Text · Tag ·
  + Document · Send to…), the thread, the asks with their clocks, the
  documents, the side drawer that opens the file from any room.
- **The Office room** (`js/office.js`) — the ask queue oldest first, the
  switches, and the **workflow map**: `cc_workflow_steps`, 62 rows, every step
  of both CC templates per brand and what it became (ask · checklist ·
  handoff · clock · exists · dropped).
- **The Production room** (`js/production.js`) — the stage board, take /
  assign / hand back.
- **The village** (`js/village.js`) — `team_messages`, `team_reactions`, the
  view `v_team_room`; the office · production · village rooms, mounted in
  Home, Office, Production and Sales. The reps' sales hype thread
  (`hype_messages`) is a different table and must stay untouched.
- **The chain** — settling an ask opens the next one, pushes its owner and can
  text the customer. Chain rows are brand-scoped (`ask_chain.cc_company_id`),
  so roofing (1537 · 1563) runs the long roofing chain and fence/Oasis runs
  its own.

## Working here

- Preview: `npx -y serve -l 8091 -n .` then http://localhost:8091/?demo=1
- Commit on `main`. Attribution line as the harness instructs.
- The scope and the audit: `docs/ONE-OS-SCOPE.md`,
  `docs/CC-UVOICE-WORKFLOW-AUDIT.md`. `docs/THE-OFFICE-DAY.md` puts the
  office's day in CC beside the same day here, step by step.
  `docs/MORNING-BRIEF.md` is Kevin's one-page read: what works, what is off,
  what he has to decide. The session
  board lives in trureview-mobile's `SESSIONS.md` — add a line there too when
  you ship, and update its `CLAUDE.md` migration ledger.

## Films and anything Kevin sends on (Kevin, 17 Sep 2026)

- Never hand Kevin a video or picture only as a Claude file card or only inside a page, a GIF or a tour — he forwards to people without Claude ("a format no one can use"). Every film is a **plain MP4 at a direct link** (H.264 main, yuv420p, silent AAC if no narration, `+faststart`) under `films/` here, listed on `docs/films.html`, with a copy in `C:\Users\kdela\OneDrive\Desktop\YouTube Uploads\` (his numbering) for an unlisted YouTube link. Put the direct `.mp4` link in the note that goes out. Text-size 480-px copy for films under a minute.
- **Gospel 36:** every change ships with its own note the same day — `docs/was-and-is.html` per role, an email from Kevin to the people it touches, the hype thread when reps are involved, a film when the customer's side changed. The rule for all sessions lives in `C:\Users\kdela\.claude\CLAUDE.md`.
