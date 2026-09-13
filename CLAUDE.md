# CLAUDE.md — The 4-Touch Autopilot Central Command

Kevin's one place: the company platform for Liberty Fencing, Liberty Roofing,
Pro-Tech Roofing and Oasis Landscapes. Named by Kevin, 13 Sep 2026. Rooms:
The Business · Sales · Marketing · Office · Production · Files, and the
customer file under all of them. `README.md` says what each room is.

## What this repo is, and is not

- **Is:** the static web app at the root (`index.html`, `command.css`,
  `js/*.js`). No build step. GitHub Pages serves `main`; **push = deploy**.
  Live: https://kdelaney05-bit.github.io/4-touch-autopilot-central-command/
- **Is not:** the database. Migrations, workers and edge functions live in
  `kdelaney05-bit/trureview-mobile` (`C:\Users\kdela\OneDrive\Desktop\Commercial-Desk`
  is the current clone). This app's schema is migrations **306–310** there:
  the stage, the hand-off, the proof chain (`ask_settle`), the clock, the
  office lines, stale jobs. Check `schema_migrations` on live for the next
  free number before writing one; sibling sessions number in parallel.
- The owner console (`kdelaney05-bit/liberty-command`) is a separate page;
  the Sales and Marketing rooms embed it by hash (`#sales`, `#marketing`).
  Same github.io origin, its own sign-in. Never copy it in.

## Laws

- **Cache-bust together.** `index.html` references `command.css?v=N` and
  `js/app.js?v=N`, and every `import` inside `js/` carries the same `?v=N`.
  Bump all of them in one commit (`sed` over `js/*.js` + `index.html`), or a
  browser keeps an old module and the page loads blank — Kevin's first
  sign-in did exactly that.
- **No data, no secrets.** The key in `js/config.js` is publishable. Row-level
  security decides every row. Nothing about a customer is ever written into
  this repo.
- **Writes go through RPCs** (`job_take`, `job_assign`, `job_handback`,
  `ask_settle`, `file_text_queue`, `automation_switch_set`). A plain PATCH
  that closes an ask with a proof rule is refused by the database on purpose.
- **Every outbound text is a draft until a seat presses Send**, and the
  machine's texts stay behind `automation_switches` (four switches, Office
  room, owner only). Never flip a switch from code.
- **`?demo=1`** renders `js/demo.js`'s fictional book with every write
  refused. Use it to check rendering without a login.
- Kevin and Jess edit the office lines, the chain, the proof rules, the
  seats and the brand settings as rows — not as code. Keep it that way.

## Working here

- Preview: `npx -y serve -l 8091 -n .` then http://localhost:8091/?demo=1
  (the Code app's `launch.json` entry "command" in the other repos points here).
- Commit on `main`. Attribution line as the harness instructs.
- The scope and the audit: `docs/ONE-OS-SCOPE.md`,
  `docs/CC-UVOICE-WORKFLOW-AUDIT.md`. The session board lives in
  trureview-mobile's `SESSIONS.md`; add a line there too when you ship.
