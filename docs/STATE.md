# STATE — where everything stands

**Reading this from another Claude account?** Make a project on that account
pointing at the same three repos (`trureview-mobile`,
`4-touch-autopilot-central-command`, `liberty-command`), then say:
*"read docs/STATE.md in central-command first."* This page is the handoff. It is
rewritten every evening at 7 PM Eastern by a routine, so the date at the bottom
tells you how fresh it is.

Kevin runs two or three Claude accounts because one runs out. A project folder
cannot be shared between accounts, but GitHub can, so this page is the bridge.

---

## What the project is for

One desk instead of ten open Claude windows. Kevin drops an ask, it becomes a
thread that works on its own, and the coordinator keeps the threads from
stepping on each other. The reason it exists: Kevin works fast and merges out
of order, so two sessions touching the same repo need a referee.

## The three repos

- **`kdelaney05-bit/trureview-mobile`** (private) — the rep app, the crew app,
  the supervisor app, the two sales desks, the console mirror, and the whole
  backend (migrations, workers, edge functions) on one Supabase project
  `lzegjjbkfuecrhdvlvay`. Nearly all the work is here. Its `CLAUDE.md` is the
  law book and the migration ledger.
- **`kdelaney05-bit/4-touch-autopilot-central-command`** (public) — the Central
  Command web app (static, GitHub Pages, push = deploy), the films, and the
  docs. `docs/GOSPELS.md` is Kevin's rulebook, `docs/LANES.md` is where each
  thread of work stands, `docs/HANDOFF-2026-09-19.md` is the account-switch
  transfer. No customer data ever goes in this repo; it is public.
- **`kdelaney05-bit/liberty-command`** (public) — the owner console on GitHub
  Pages. Jess has a lane here and opens pull requests; she never pushes to
  main.

**Rule that trips everyone up:** in trureview-mobile, migrations are usually
applied to the live database *before* their files are merged. Live is the
source of truth. Read `schema_migrations` on live before writing a migration
number, never trust main alone.

## Open pull requests

*Snapshot 19 Sep 2026, 9:45 AM ET. A thread was merging the applied-live ones
as this was written, so some of these may already be gone.*

**trureview-mobile**

| PR | What it is | Waiting on |
|---|---|---|
| #434 | The Handoff (416 + 417) — you walk the customer over, nobody says "call the office" | Typecheck, then a ship to the phones |
| #433 | The Hunter (415) — the marketing agent's memory, doors, morning pass | Migration not applied; Windsor key on the box; Kevin's yes on three spending caps |
| #427 | Jake's sales desk — hunt cadence v2, six doors, hot signals | Merging now (Kevin said yes to all) |
| #424 | 348 — the crew link, Spanish first | Stacked behind #418 |
| #421 | CC's new API probed read-only, plan to repoint | Kevin's decision |
| #418 | 340 — the chain marches, turned in → Sam → Jonathan → Luis | Merge |
| #417 | 339 — Highlights stops counting Kevin's test swings | Merge |
| #404 | Fence calculator reopens the job saved on the file | Kevin's decision |
| #395 | 327 + 329 — Ron's lock-ups, Eric's Pro-Tech texts off the fencing line | Merge **and a real ship**: carries phone code never published |
| #394 | Account-switch handoff doc | Looks like a straight close |
| #388 | One row per text: skip the Uvoice twin (+305) | Database half never applied |

**central-command** — nothing open. **liberty-command** — nothing open,
untouched since 17 Sep.

## Still owed

- Three films under the film law: the Handoff, the Google Calendar sync,
  Who's free.
- Two one-line fixes: machine emails greet a "Last, First" customer by their
  last name; a text reply shows on the file as an email reply.
- `339_app_text_no_cross_brand_fallback.sql` written 15 Sep, never applied —
  the app can still text a Pro-Tech or Oasis customer from the fencing 386
  number.
- Migration 406 is live but never wrote itself into `schema_migrations`.
- 415 is written and not applied (its tables are missing on live).
- Kevin's PC clone of central-command is stuck mid-rebase with one unpushed
  commit.
- The Hunter routine is still switched on under the old Claude account.
- About 300 stale branches on trureview-mobile and 90 on liberty-command, all
  already merged. Safe to delete whenever.

## What the project remembers

- Owner: Kevin (GitHub `kdelaney05-bit`, kevin@libertyfencingfl.com).
- Goal: keep the repos in order. Kevin merges out of order when he is moving
  fast, so the coordinator warns any two threads touching the same repo to
  fetch main fresh before pushing.
- Migrations go live before their files merge. Live wins; merge the files after
  so main matches.

## Decisions made today (19 Sep 2026)

- Kevin moved off the old Claude account. `docs/HANDOFF-2026-09-19.md` is that
  transfer.
- He said merge on the nine pull requests that were already running live.
- He said yes to all on Jake's sales desk (#427).
- A project folder cannot be shared across Claude accounts, so this page exists
  instead, rewritten nightly.

---

*Written by the Central Command project. Next rewrite: 7 PM Eastern.*
