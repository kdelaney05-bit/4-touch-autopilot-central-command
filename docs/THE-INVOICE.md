# THE INVOICE — built by the machine, sent by text and email, chased politely, paid by itself

Kevin, 17 Sep 2026: "I want the invoicing to be a better version of how Jess did
it… moving forward you'll do it through here… is it going to be auto created
when the guy says it's complete? So we remove that piece completely and then
it's just going to send the invoice to the text number and the email and then
we'll just politely bug them there. And if they don't within a few hours,
we'll call them on the invoice… we got to make sure it's right… where do we
put any change orders?"

Lane label: **INVOICE**. The one-page, for Jess and Laura:
`docs/the-invoice.html` (old way beside new way, the math, where change orders
go, the polite bugging, the three switches). Built beside Contractors Cloud
and QuickBooks, **every switch OFF until Kevin flips it** (gospel 6).

## 1. What happens today (read from QuickBooks, 17 Sep)

Liberty Fencing's QuickBooks file, last 30 days: **119 invoices, $474,345,
18 still unpaid.** Every one made by hand, and every one the same shape:

| What Jess types | What the rows say |
|---|---|
| The customer | A new QuickBooks customer per job, named **"29314 - 5601 Jamaica Rd"** (the CC job number, a dash, the street) |
| The lines | One line, item **"New Fence Installation"**, no description, the contract price as the rate. A second line when there was an add-on (the $425 on 29307 and 29292) |
| The number | The CC job number |
| Terms | Due on receipt (due date = invoice date) |
| The email | **Blank on every customer**, so QuickBooks never sends it; the customer gets the "your invoice is attached" text or the CC envelope by hand |
| The deposit | Applied afterwards as a payment against the invoice (29307: $8,268.05 invoiced, $500 already in) |
| The reminder | QuickBooks' reminder template exists ("Reminder: your payment to Liberty Fencing Group, Inc is due") and is sent by hand, if at all; the past-due text at 30 days is Laura's |
| Paid | Typed into QuickBooks when the check lands; the CC task "Send invoice/collect" (median 4 h after sign-off) closed by hand |

QuickBooks Payments is on for Liberty Fencing (card + bank). So the invoice
*can* carry a pay link; today nobody puts it on.

Eight human touches per invoice (the count on `the-bills-before-after.html`),
for money we already know the amount of.

## 2. The new way — one invoice, from LISTO to paid

Every step below is a row in the database or a card on a screen. Nothing is a
person remembering.

| When | What happens | Who | Where |
|---|---|---|---|
| The crew taps **LISTO** on their link, Luis signs it off (3+ photos, the customer's word) | The chain opens the INVOICE ask on the invoicing seat, as it does today (340) | the machine | `ask_settle` |
| Within 15 minutes (`invoice_sweep`) | **`invoice_build`** reads the file: the accepted estimate (or the sold amount) − the deposit taken + every signed change order; the sign-off's photos against the brand rule. Clean → the row is written (`qb_invoice_queue`, `auto = true`), the seat is pushed *"Invoice built · Dana · $14,200 — goes out by itself within 15 minutes; press Hold if anything is wrong"* | the machine | switch **`invoice_auto`** |
| Not clean (photos short, a change order unsigned, no signed amount) | The card is **red**, the seat is told once, nothing goes out. Fix the file and the machine sends it; or Approve anyway with one line of reason; or Hold and tag the supervisor | a person | the Invoice card |
| Next worker pass (15 min) | **QuickBooks makes it**: customer named Jess's way ("job number - street"), one line per line (the contract, each change order, the deposit as a minus), DocNumber = the CC job number, due on receipt, the company's own item. The pay link is read back; the PDF lands on the customer's file; **QuickBooks' own email goes** (Review & Pay) | the machine | `qb-invoices.mjs`, switch **`qb_invoices`** |
| The same minute | The INVOICE ask settles with the number → PAYMENT opens with its clock → the **"invoice sent" text** goes from the main line with the pay link (Jess's wording, `office_lines.invoice_sent`) | the machine | switch **`office_machine_texts`** |
| +2 h | "Just making sure your invoice came through — {{link}}" · text | the machine | `invoice_nudge_plans` step 1 |
| +4 h | **A call card** lands on the invoicing seat: *"Call Dana: invoice #29388 for $14,200 went out Sep 17 by text and email, nothing back yet…"* — with a clock, red at 4 h | Laura / Jess | step 2 · ask type `COLLECT_CALL` |
| Day 1 · 3 · 7 · 14 · 21 | Text · email + call card · text + call card · text + call card · email | the machine, the seat for the calls | steps 3–10 |
| Day 30 | The past-due text, as today | the machine | `payment_reminder_sweep` |
| Any minute | **The balance hits 0** in QuickBooks (they paid on the link) → PAYMENT settles "paid online", CLOSEOUT opens, the review prompt goes, the seat and the rep are pushed *"Dana paid $14,200 · 3.2 h after the invoice · no reminders needed"* | the machine | `invoice_balance_mark` |
| A check comes | **Paid** on the card: how, and a note. Same close-out | a person | `invoice_paid_by_hand` |

Rules the sweep keeps: texts only 9 AM–7:30 PM ET, calls and pushes only
8 AM–7:30 PM (gospel 35); **an unanswered reply from the customer pauses
everything** — the office is in the conversation now, and the reminders resume
when the office has answered; a customer who said STOP gets no texts, the
email and the call still go; a step more than three days stale is skipped, not
fired late; **Stop the reminders** on the card stops them with a reason;
**Reminders back on** restarts.

## 3. Where the change orders go

A change order is **an estimate the customer signs on the same link.** The
**Change order** button on the file (beside Estimate) opens the same builder
with one difference in the words: *only what changed* — the extra gate, the
longer run, a credit as a negative price. The customer taps ACCEPT on the page
as they did for the estimate. Signed, it is **a line on the invoice** with its
own amount and date. Unsigned, **the invoice waits** and the card says so in
red: *"1 change order unsigned · Add one 4' gate $850.00."*

The paper path still counts: a CHANGE_ORDER ask settled with the signed file
and the amount typed is a line the same way. A signed change order with no
amount typed is a red line: *"a signed change order on the file has no amount
typed."*

Nothing is missed because the machine does not read anyone's memory: it reads
`estimate_docs` (kind = estimate or change_order, status = accepted), the
CHANGE_ORDER asks, `fence_jobs` for the deposit, the COMPLETION_SIGNOFF ask
for the photos. If it is not on the file, it is not on the invoice, and the
card says what is missing.

## 4. The math, on the card, every time

```
Signed          $14,200.00   estimate #4481 · accepted Aug 26
Deposit taken   −$0.00       none taken
Change orders   $850.00      1 signed
Invoice         $15,050.00

The lines · what Dana reads
  Aluminum + gate                       $14,200.00
  Change order · Add one 4' gate          $850.00
  Deposit received, thank you             −$0.00 (only when one was taken)
```

The deposit goes on the invoice as a minus line so the invoice total is what
they owe — the way Billdu did it. (Claudette's call whether the deposit's own
receipt stays a separate sales receipt in QuickBooks, as today; the minus line
names the date, the method and the reference so the two reconcile.)

## 5. What a person still does

| The moment | The one decision |
|---|---|
| The card is red | Fix the file (upload the photos, get the change order signed), or *Approve anyway* with a reason, or *Hold* and tag Luis |
| The call card lands | Call them. *Done* on the card with what they said. |
| A check comes | *Paid* on the card — how, and a note |
| They wrote back | Answer them (the text clock already pings); the reminders wait until you have |
| Something is wrong with the work | *Stop the reminders* with the reason; *Reminders back on* when it is fixed |

Nothing else. No QuickBooks screen, no typing an amount, no watching for the
payment, no remembering to remind.

## 6. The switches, in order (the spoons)

| Switch | What it does | Where it stands |
|---|---|---|
| `invoice_auto` | The invoice builds itself on a clean sign-off | **OFF** · Office room |
| `qb_invoices` | QuickBooks makes it, the pay link, the PDF, QuickBooks' email; the balance is read back | **OFF** · Office room |
| `office_machine_texts` | The "invoice sent" text, the reminder texts, the review prompt | **OFF** · Office room |

With all three OFF the Invoice card still works as it did on 16 Sep: Approve
records the math, the office makes the invoice in QuickBooks by hand and types
the number. The sweep runs every 15 minutes and builds nothing while
`invoice_auto` is OFF.

**The order Kevin flips them:** `qb_invoices` first on one real sign-off with
`invoice_auto` OFF (Laura presses Approve, QuickBooks makes it, she checks the
invoice in QuickBooks and the email the customer got); then `invoice_auto`;
`office_machine_texts` carries every chain text, so the pay-link text starts
when that one goes on. Oasis and Pro-Tech texts wait on their 10DLC lines
either way; their invoices go by email.

## 7. What is built where (17 Sep)

| Piece | Where |
|---|---|
| Migration **381** — `invoice_build`, `invoice_queue_row` / `invoice_approve` / `invoice_hold`, `invoice_sent_mark` / `invoice_failed_mark` / `invoice_paid_mark` / `invoice_balance_mark`, `invoice_paid_by_hand`, `invoice_nudges_set`, `invoice_state`, `invoice_sweep` (cron every 15 min), `invoice_nudge_plans` (30 rows, 10 steps × 3 brands), `invoice_log`, the COLLECT_CALL ask type + proof rule, `estimate_docs.kind`, `qb_connections.invoice_item_id`, the switch `invoice_auto` | trureview-mobile `backend/migrations/381_the_invoice.sql` · **applied on live 17 Sep** (dry-run rolled back first) |
| The QuickBooks writer `qb-invoices.mjs` (rail 2 moved out of `qb-bills.mjs`); `run-scheduled.mjs` job `invoice_out`; `install.sh` timer `invoice_out|15min` | trureview-mobile `backend/worker/qb-invoices.mjs` · runs on the box, `--dry` first |
| The Invoice card (`js/invoice.js`): six states, the math, the lines, the diary, the plan, Approve / Hold / Paid / Stop the reminders / Text the link again / Open the PDF; the file's NEXT line; the **Change order** button and the builder's change-order mode; the Office room's *Calls · invoices* tile, the COLLECT_CALL ask in the queue, the two switches | this repo, v102 |
| The one-page for Jess and Laura | `docs/the-invoice.html` |
| The demo | `?demo=1&as=office&file=cj3` (clean, about to go by itself) · `&file=cj11` (sent yesterday, two reminders in, the call card on Laura) · `&file=cj5` (red: photos short, a change order unsigned) · `&room=office` (the tile, the call in the queue) |

## 8. What Kevin decides

1. **The hours.** The plan is rows: text at 2 h, the call at 4 h, then day
   1 · 3 · 7 · 14 · 21, past due at 30. Change any row in
   `invoice_nudge_plans`; the sweep reads it next pass. The same plan runs for
   every brand until someone says otherwise.
2. **The deposit on the invoice** as a minus line (Billdu's way) — or invoice
   the full amount and let the worker record the deposit as a QuickBooks
   payment against it (QuickBooks' way). Claudette's preference decides;
   today it is the minus line.
3. **The email leg** is QuickBooks' own email (the PDF, Review & Pay, the
   company's own template). Kevin can reword it in QuickBooks; nothing here
   sends a second email of ours.
4. **Flip `qb_invoices` on one real sign-off**, then `invoice_auto`.
5. **The Ride-Along.** Laura and Jess's 16 Sep film shows the Approve flow;
   the new card needs its own two minutes (gospel 31). Owed.

## 9. Numbers, and where they came from

- 119 invoices · $474,345.05 · 18 unpaid — `qb_invoices`, realm 9130358006490026 (Liberty Fencing), `txn_date > current_date − 30`, read 17 Sep.
- The shape of Jess's invoices — the twelve newest in that file, read through QuickBooks' own API on 17 Sep.
- Sign-offs through the chain in the last 30 days: **0**; open INVOICE asks: **0**; change-order asks ever: **0** — the rails are empty, the first real job through is the test.
- The old way's eight touches — `docs/the-bills-before-after.html`, 16 Sep.
