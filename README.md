# The 4-Touch Autopilot Central Command

The one place. Kevin's company platform for Liberty Fencing, Liberty Roofing,
Pro-Tech Roofing and Oasis Landscapes: one login, five rooms, and one customer
file under all of them.

- **The Business** — four doors, the funnel, who is waiting on an answer.
- **Sales** — the owner console's Sales section, live, and the file's read of
  customers waiting on a rep. Doors to the rep app and Jermey's desk.
- **Marketing** — the owner console's Marketing section, live.
- **Office** — every ask the field is waiting on, oldest first. An ask closes
  only on its input (the permit number, the photos, the date) and the input
  lands on the file. The machine's switches live here, owner only.
- **Production** — the stage board: every sold customer, who holds them, how
  long. Take the job, assign, hand back. The supervisor's own board.
- **The customer file** — one thread from the machine's first text to the
  final invoice, texts and emails together, any seat texting from the brand's
  main line, the asks with their clocks, the paperwork, who touched it.

Named by Kevin, 13 Sep 2026.

## Why this repository is public and still safe

The same rule as the owner console (`liberty-command`): **no business data is
stored here.** A page, a stylesheet, a few scripts. Every number is fetched at
view time with the signed-in user's own token, and PostgreSQL row-level
security decides what that user may see. The key in `js/config.js` is a
publishable key; it authorises nothing on its own.

## Where things live

- The app: this repo's root, static, no build step. GitHub Pages serves `main`.
  Push = deploy. Bump the `?v=` on `command.css`, `js/app.js` and the module
  imports together, or open tabs keep old modules.
- The database, migrations and workers: `kdelaney05-bit/trureview-mobile`
  (`backend/migrations/306–309` are this app's: the stage, the hand-off, the
  proof chain, the clock, the office lines).
- The scope and the audit: `docs/ONE-OS-SCOPE.md`, `docs/CC-UVOICE-WORKFLOW-AUDIT.md`.
- `?demo=1` renders a fictional book with every write refused.

## What Kevin and Jess edit without a build

- `office_lines` — the pre-written texts.
- `ask_chain` — what settling one ask opens next, and who is pushed or texted.
- `ask_proof_rules` — what each ask needs before it can close.
- `stage_seats` — who owns and who watches each stage, per brand.
- `brand_text_settings` — brand names, callback numbers, the Google review links.
- `automation_switches` — the four switches, from the Office room.
