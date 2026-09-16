# Handoff — 16 Sep 2026, end of Kevin's first account

Kevin moved to a second Claude account (kdelaney05) mid-afternoon; this page is
where the next session picks up. Everything below is pushed to `main` of this
repo unless it says otherwise. Read in this order: `CLAUDE.md` → `docs/GOSPELS.md`
(33 now) → `docs/LANES.md` → `docs/THE-BILLS.md` → this page.

## What shipped today (BILLS lane)

| Thing | Where |
|---|---|
| The scope, the 90-day vendor roll-up, the twelve-step turn-on list | `docs/THE-BILLS.md` (§8 is the checklist) |
| One invoice, before and after, per person (bills + the customer's invoice) | `docs/the-bills-before-after.html` · live at https://kdelaney05-bit.github.io/4-touch-autopilot-central-command/docs/the-bills-before-after.html |
| Jonathan's film, The Bills (3:16) | `films/ride-along-the-bills.mp4` · listed on `docs/ride-alongs.html` |
| Laura and Jess's film, The Invoice (2:55) | `films/ride-along-the-invoice.mp4` · same page |
| Gospel 33: nothing to learn, it comes to you | `docs/GOSPELS.md` |
| The film tooling (specs, the cards mounted on the real demo file, the recorder fix for stats/timeline scenes) | trureview-mobile clone `C:\Users\kdela\OneDrive\Desktop\Commercial-Desk`, branch `claude/jake-sales-virus`, `tools/ride-along/` |

## Five drafts in Kevin's Gmail (kdelaney05@gmail.com), none sent

1. **All hands** — "We're going to keep handing you new pieces. Don't get overwhelmed." To Jess, Sam, Laura, Jonathan, Luis, Gio, Obed, Robert.
2. **Jonathan** — his new role on the Bill landed card, his film.
3. **Laura** (cc Jess) — her new role on the Invoice ready card, her film.
4. **Reply on Jess's ABC Supply thread** — both flows updated, the binary rule, three questions for her.
5. **The supplier census** — to Jess, cc Jonathan, Sam, Laura.

Every one opens on gospel 33. Kevin presses Send.

## In progress when the account ran out

**The backend for the bills** was being written by a build agent in the
Commercial-Desk clone when the session closed: `backend/migrations/365_supplier_bills.sql`
(live is at 364; checked at close), the
`bill_decide` RPC, the view `v_bills_queue`, the two switches `bills_to_qb` ·
`bills_to_cc` (OFF), `backend/worker/bills-intake.mjs` (IMAP → IIF/PDF → the
row), `backend/worker/qb-bills.mjs` (approved bills → QuickBooks Bill; queued
invoices → QuickBooks Invoice). Whatever landed is committed on that branch;
`docs/LANES.md` says which files exist. **Nothing is applied and nothing runs.**
The live credentials on this PC are in the other clone: `C:/Users/kdela/trureview-mobile/backend/.env`;
run anything in Commercial-Desk with `LIBERTY_ENV_FILE="C:/Users/kdela/trureview-mobile/backend/.env"` in front
(the SQL runner is `backend/scripts/run-sql-file.mjs`; dry-run inside `begin; … rollback;` first).

**The front end is not started.** The plan: a new module `js/bills.js` with
the Bill landed card (reads `supplier_bills` by customer, calls `bill_decide`
with approve · wrong_job · hold), the Invoice ready card (computed from the
accepted estimate, the deposit on `fence_jobs`, the settled COMPLETION_SIGNOFF
and the photos; Approve = the existing `invoice_request` + the invoice line in
the compose box; Hold = a note to @supers), an Office tile reading
`v_bills_queue`; one-line hooks in `js/file.js` (after the fence card),
`js/office.js` (a fifth tile) and `js/demo.js` (two demo rows). Cache-bust is
`?v=94` at close; bump every `?v=` together.

## What only Kevin can do (unchanged)

1. Send the five drafts.
2. QuickBooks: **three of four companies are already connected on live**
   (`qb_connections`: Liberty Fencing 1461, Pro-Tech 1563, Oasis 1560, all
   active, synced 16 Sep 20:32 UTC). Only Liberty Roofing 1537 still needs the
   consent (`backend/QB-OAUTH-WALKTHROUGH.md`). The `qb_invoices` switch still
   has no worker behind it until `qb-bills.mjs` runs.
3. A `bills@` address per brand (or say "label the inboxes") and a Google app
   password for the intake worker's IMAP login.
4. Decide on Contractors Cloud's own QuickBooks bill export.
5. Apply 365 and run the two workers with `--dry` first.

## Live at close (read-only check)

Switches: text_clock ON, esign_packet ON, crew_link_text OFF, qb_invoices OFF,
appt_confirm OFF, after_hours_reply OFF, office_machine_texts OFF.
`qb_invoice_queue` empty. `cc_material_orders` columns: `reference` ("MO29381-1"),
`est_cost`, `actual_cost`, `job_id`, `supplier_id`. Thread messages: `thread_messages`
(thread_id, author_id, body, is_system, lane, author_name). Buckets: job-docs, job-photos.

## The spoons, in order

Bill landed card live with every switch OFF (records only) → `bills_to_qb` →
Invoice ready card → `qb_invoices` + `office_machine_texts`. One card at a
time; each one shows up and says what to press.

## Other sessions running today

Sibling sessions shipped the supervisor app film, the paperwork film and the
in-page film player (`docs/film.html`) on this repo, and were working in
`tools/evolution-film` and on migration 339 in the Commercial-Desk clone. Their
uncommitted files were left alone. Session board: trureview-mobile `SESSIONS.md`.
