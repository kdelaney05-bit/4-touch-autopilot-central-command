# Handoff — 16 Sep 2026, end of Kevin's first account

> Phones / Uvoice / texting handoff is separate: **docs/HANDOFF-UVOICE-16-SEP.md** (16 Sep evening).

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
`docs/LANES.md` says which files exist. **Migration 365 IS applied on live** (dry-run in a
rollback first, then applied ~17:25 local, recorded in `schema_migrations`): `supplier_bills`,
`v_bills_queue`, `bill_decide(p_id, p_decision, p_note)`, switches `bills_to_qb` · `bills_to_cc` both OFF.
The IIF/PDF parser (`backend/worker/bills-iif.mjs`) passes its test (`backend/scripts/test-iif-parse.mjs`).
**No worker runs yet.** The two things the build agent flagged are done in **migration 369** (`369_bills_queue_and_rematch`, applied on live 16 Sep evening after a rolled-back dry run): the read policy is `is_office() or is_manager()`; `wrong_job` stays on `v_bills_queue`; `bill_rematch(p_id, p_customer)` moves a bill to the right file; `bill_decide` is guarded like `invoice_request`. The IIF sign convention (BILL amount negative on the TRNS row) is assumed from the QuickBooks Desktop shape and must be checked on the first real ABC/SRS/Heritage file; `raw` keeps what was read. Deps: `backend/package.json` now exists (running `npm i` from `backend/` without it walked up and installed into the phone app's root; reverted). Installed on this PC, test green. **The workers run on the box, not this PC** (`SUPABASE_SECRET_KEY` is not in the PC env): `ssh root@178.156.252.178`, `/opt/liberty-command`, `sudo -u liberty LIBERTY_ENV_FILE=/etc/liberty-command.env node backend/worker/qb-bills.mjs --dry`.
The live credentials on this PC are in the other clone: `C:/Users/kdela/trureview-mobile/backend/.env`;
run anything in Commercial-Desk with `LIBERTY_ENV_FILE="C:/Users/kdela/trureview-mobile/backend/.env"` in front
(the SQL runner is `backend/scripts/run-sql-file.mjs`; dry-run inside `begin; … rollback;` first).

**The front end is built (16 Sep evening, v96).** `js/bills.js`: the Invoice
ready card and the Bill landed card on the customer file (mounted under the
header card, above the conversation; `billsNext()` takes over the file's NEXT
line unless the owner of record is wrong), the Bills tile and the queue in the
Office room, the two bills switches in the owner's switch list. `book.js` loads
`v_bills_queue` into `state.bills` and, per file, `supplier_bills` + the deposit
on `fence_jobs` + `qb_invoice_queue`; writes are `decideBill` · `rematchBill` ·
`openBillPdf`. `demo.js` carries five fictional bills (one matches, one over,
one unmatched, one credit, one approved) and Dana Reed's invoice is ready.
See it as the office seat: `?demo=1&as=office&file=cj3` (the invoice),
`&file=cj6` (a bill that matches), `&file=cj4` (over the estimate), `&room=office`.

## What only Kevin can do (unchanged)

1. Send the five drafts.
2. QuickBooks: **three of four companies are already connected on live**
   (`qb_connections`: Liberty Fencing 1461, Pro-Tech 1563, Oasis 1560, all
   active, synced 16 Sep 20:32 UTC). Liberty Roofing 1537 needs NO consent: it has no QuickBooks company of its own, its books are inside Pro-Tech's file (022); qb-bills.mjs aliases 1537 → the 1563 connection (16 Sep late). The `qb_invoices` switch still
   has no worker behind it until `qb-bills.mjs` runs.
3. A `bills@` address per brand (or say "label the inboxes") and a Google app
   password for the intake worker's IMAP login.
4. Decide on Contractors Cloud's own QuickBooks bill export.
5. Run the two workers with `--dry` first, on the box (365 and 369 are applied; the PC has no service key).
6. Say whether Gio may read supplier bills: his role is `owner`, so `is_manager()` lets him; gospel 28 says never the books.

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
