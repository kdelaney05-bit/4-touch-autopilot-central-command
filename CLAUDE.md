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
one step at a time.

## What this repo is, and is not

- **Is:** the static web app at the root (`index.html`, `command.css`,
  `js/*.js`). No build step. GitHub Pages serves `main`; **push = deploy**.
  Live: https://kdelaney05-bit.github.io/4-touch-autopilot-central-command/
- **Is not:** the database. Migrations, workers and edge functions live in
  `kdelaney05-bit/trureview-mobile`
  (`C:\Users\kdela\OneDrive\Desktop\Commercial-Desk` is the current clone).
  This app's schema started at migrations **306–316** there and has grown
  since (328–344, 365, 366) — see the table in `README.md` for which one
  backs which feature. **Live is at 366, next free = 367** (16 Sep evening),
  but check `schema_migrations` on live before writing one: sibling sessions
  number in parallel.
- The owner console (`kdelaney05-bit/liberty-command`) is a separate page; the
  Sales and Marketing rooms embed it by hash (`#sales`, `#marketing`). Same
  github.io origin, its own sign-in. Never copy it in.

## Where the data lives

Supabase project **`lzegjjbkfuecrhdvlvay`**, the same database as the phone
app, the crew app, the supervisor app and the desk. **RLS is the doorman** —
the page asks for everything and the database hands back only what that seat
may see. The key in `js/config.js` is publishable and authorises nothing.

## Laws

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
- **A seat texts only from a campaign-approved main line** (311). Oasis and
  Pro-Tech wait on their 10DLC registrations.
- **`?demo=1`** renders `js/demo.js`'s fictional book with every write
  refused. Use it to check rendering without a login.
- Kevin and Jess edit the office lines, the chain, the proof rules, the
  workflow map's notes, the seats and the brand settings **as rows** — not as
  code. Keep it that way.
- Spellings that are not typos: the rep is **Jermey**; the product is **The
  4-Touch Autopilot**.

## The pieces a session is most likely to touch

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
