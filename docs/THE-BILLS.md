# THE BILLS — every supplier invoice lands on the file by itself

Kevin, 16 Sep 2026, on Jess's forward of the ABC Supply email: "how we can
integrate all these payables and bills… I have a login to everything. So if
we could set up an API… pull that in to automate that."

The one-page before/after, per person: `docs/the-bills-before-after.html`.

Lane label: **BILLS**. Built beside Contractors Cloud and QuickBooks, every
switch OFF until Kevin flips it (gospel 6). Takes the paper off Jess,
Jonathan and Claudette; takes no conversation off anyone (gospel 20).

## 1. What happens today (Jess, 16 Sep, 8:19 AM)

> "So I get emails like this and I forward them to Jonathan to input into
> contractors cloud. Claudette takes invoices from the portals and inputs
> them into quickbooks."

Read against the live rows, that is:

| Step | Who | Where it goes | What it costs |
|---|---|---|---|
| The supplier emails the invoice (ABC Supply via Billtrust, to jessica@libertyroofinggrp.com; SRS the same; Heritage Landscape Supply to Kevin's inbox) | the supplier | Gmail | nothing, but it lands in one person's inbox |
| Jess forwards it | Jess | Jonathan's inbox | a read and a forward per email |
| Jonathan keys the bill into CC: vendor, amount, the material order it pays | Jonathan | CC bills | a retype per invoice line |
| Claudette logs into each supplier portal, pulls the same invoices, keys them into QuickBooks | Claudette | QuickBooks Online | a second retype of the same invoice, from a different copy |
| Nothing links the CC bill to the QuickBooks bill | — | — | month-end reconciling by hand |

**What the rows say (CC bills report, 16 Sep):**

- Today's ABC Supply email carried five lines on two POs (PRO1133: 121.77,
  −94.16, 20.81, 758.62; PRO1129: −19.26). CC got two bills today for
  ABC Supply / Pro-Tech: **$807.04** (the four PRO1133 lines netted into one)
  and **$19.26** (the PRO1129 *credit*, entered as a bill). The supplier's
  invoice numbers were not typed.
- **Ref # is blank on every recent bill.** CC's own doc says the Ref # is how
  QuickBooks recognises a bill, and how CC catches a duplicate. Without it,
  nothing can match CC to QuickBooks to the supplier.
- **QB sync date is null on every recent bill.** CC's own QuickBooks Online
  integration (vendors + bills export) is not running for bills.
- 13,183 bills in CC all-time; the last 90 days by vendor are in §3.

## 2. Three doors, and which one is an API

| Door | Is there an API? | What we have |
|---|---|---|
| **The supplier** | Mostly no. Distributors on Billtrust (ABC Supply, SRS, Heritage) already email the invoice with a PDF **and an IIF file** — QuickBooks' own import format: vendor, invoice number, PO, date, due date, amount, per line. That attachment *is* the API. Suppliers that only offer a portal (Home Depot commercial via Citi, the fence yards) have no customer API; the first move is to ask each one to turn on email invoicing, which most do in one call. Scraping a portal with Kevin's login is the last resort: brittle, and against most portals' terms. | Gmail, already connected. The IIF needs no OCR. |
| **Contractors Cloud** | Yes. CC has a bill entity (vendor, Ref #, date, terms, expense lines attached to a material order or work order). It also has its own **QuickBooks Online export for vendors and bills** — the fastest end to Claudette's retype, but it is a switch inside CC (account manager enables it, the QB admin connects, accounts and vendors imported, a start date so history is not duplicated). | The hourly copy (343) already holds `cc_material_orders` with the PO reference (`MOPRO1133-3` ↔ the invoice's `PRO1133`), so a bill can find its job. A CC *bill-create* endpoint is not confirmed yet; the MCP exposes bills read-only. |
| **QuickBooks Online** | Yes, OAuth 2.0. `Bill` with `VendorRef`, `DocNumber` (= the supplier's invoice number), `DueDate`, lines with the expense account and `CustomerRef` (the job). | `qb_connections` (018), `qb-client.mjs`, `qb-add-company.mjs`, `qb-status.mjs` in trureview-mobile/backend, designed 20 Jul for the console's money section. Needs Kevin's one-time consent per company — `backend/QB-OAUTH-WALKTHROUGH.md`. This clone has no `.env`, so whether any of the four companies is connected on live could not be checked here. |

## 3. Who we buy from (last 90 days, from CC bills + the inboxes)

Filled from the CC bills report and the supplier emails in Kevin's and Jess's
inboxes. The census email (§7) asks the office to correct and complete it.

| Supplier | Brand | How the invoice arrives today | Who keys it |
|---|---|---|---|
| ABC Supply | Pro-Tech · Liberty Roofing | Billtrust email → jessica@libertyroofinggrp.com, PDF + IIF, PO on every line | Jonathan (CC), Claudette (QB from the portal) |
| SRS Building Products | Liberty Roofing | Billtrust email → Jess + Kevin, PDF + IIF, plus a monthly statement | same |
| Heritage Landscape Supply | Oasis | Billtrust email → Kevin's inbox, PDF + IIF, plus a monthly statement | ? |
| Home Depot (commercial account) | Liberty Fencing | Citi portal; statements by email possible | ? |
| Warehouse | Liberty Fencing | our own stock pulled to a job (the biggest "vendor" by count) | Jonathan |
| Iron World · Havana Fence Supply · Merchant Metals · Stephens Pipe & Steel · iDeal | Liberty Fencing | ? (portal / paper / on the truck) | ? |
| Bello Fencing · La Fence · MK Fencing · Pro-Tech Crew · Komodo Roofing · Kicking Grass (Rayce) | all | installers' invoices, not suppliers | Jonathan |
| Southern Dumpsters | Pro-Tech | ? | ? |

### 3a. The 90-day roll-up (CC bills report, 18 Jun – 16 Sep 2026)

Whole window: **1,847 bills, $1,959,191.88.** The vendor table below is the
newest 1,250 of them (16 Sep back to 15 Jul); the 597 older bills (~$672K)
are not broken out. Source: a private scratch report on the `bill` entity,
run 16 Sep and deleted after.

| Brand | Bills | Sum |
|---|---:|---:|
| Liberty Fencing | 823 | $619,357.52 |
| Oasis Landscapes | 173 | $433,067.54 |
| Pro-Tech Roofing | 239 | $215,200.36 |
| Liberty Roofing | 15 | $19,607.39 |

**Suppliers (materials):**

| Vendor | Brand | Bills | Sum |
|---|---|---:|---:|
| Warehouse (our stock) | Liberty Fencing · Pro-Tech | 162 | $249,287.02 |
| ABC Supply | Pro-Tech · Liberty Roofing | 97 | $113,413.86 |
| Havana Fence Supply | Liberty Fencing | 56 | $78,866.25 |
| Home Depot | Liberty Fencing · Oasis | 35 | $44,476.18 |
| Iron World | Liberty Fencing | 15 | $38,694.90 |
| Oasis- Material | Oasis | 33 | $30,800.57 |
| Merchant Metals | Liberty Fencing | 10 | $15,452.19 |
| Master Halco | Liberty Fencing | 6 | $7,273.43 |
| Statewide Fence Wholesale | Liberty Fencing | 3 | $2,890.51 |
| iDeal | Liberty Fencing | 4 | $2,497.86 |
| Horizon Distributors | Oasis | 1 | $1,730.99 |
| Stephens Pipe & Steel (two spellings) | Liberty Fencing | 3 | $1,525.73 |
| Lowes | Oasis · Liberty Fencing | 3 | $1,175.53 |
| The Fencing Factory | Liberty Fencing | 1 | $603.25 |
| SRS | Pro-Tech | 1 | $294.25 |
| ACE Hardware | Oasis | 1 | $68.86 |

**Installers, crews and services (bills, not supplier invoices):** MK
Fencing 98 · Pro-Tech Crew 82 · Kicking Grass (Rayce) 77 · La Fence 46 ·
Hurtado Fence Works 44 · Simplifile (e-recording) 59 · Bello Fencing 37 ·
Nick's Lawn 32 · Fence One 29 · Down Home Inspections 20 · Environmental
Health 16 · Southern Dumpsters 13 · CG Fence 8 · ProLawn 8 · Permit 6 ·
Vance Industries 5 · Millennia Roofing 6 · Sunrise Landscaping 4 · Owens 3 ·
and one each of J&S Dumpsters, Tropical Dumpster, MG Transportation, Master
Cuts, Josh Moore (Blue H2O), Maikel Excellent Fences, Komodo Roofing, YCP.

**What the rows are missing:**

| | Count |
|---|---:|
| Vendor blank or "TBD" | 218 of 1,250 (all but 16 are Liberty Fencing) |
| Ref # (the supplier's invoice number) blank | 1,250 of 1,250 |
| QuickBooks sync date set | 0 of 1,250 |

So the machine's first job is not speed. It is the three fields nobody has
time to type: the vendor, the invoice number, the link to QuickBooks.

## 4. The build — beside, switches OFF

**4a. The intake door.** One address per brand that suppliers email
(`bills@` on each domain, or a Gmail filter that labels supplier invoices
where they already land). A worker reads the label through the Gmail API,
saves the PDF to the private bucket, parses the IIF when there is one, the
PDF's text layer when there is not, and writes one row per invoice line to
`supplier_bills`: brand, supplier, invoice number, PO, date, due date, amount,
credit flag, the file, and the job it found by PO in `cc_material_orders`.
Status: `landed → matched → approved → in_cc → in_qb → paid`. No IIF and no
text layer = `needs_a_human`, on the Office queue.

**4b. On the customer file** (gospel 4): a **Bill landed** card. "ABC Supply ·
inv 2014568156-001 · PO PRO1133 · $758.62 · due 16 Oct · NEXT: Jonathan
approves." Red when the invoice is over the material order's estimated cost
or the PO matches nothing (gospel 2). One tap approves; a credit shows as a
credit.

**4c. Two switches, both OFF** (Office room, `automation_switches`):

- `bills_to_cc` — write the approved bill into CC with the Ref # filled and
  the line attached to the material order. Until a CC bill-create endpoint is
  confirmed, the card hands Jonathan the fields to paste, in CC's order.
- `bills_to_qb` — create the QuickBooks Bill through our own connection:
  `DocNumber` = invoice number, vendor, job, AP account; duplicate-guarded on
  vendor + DocNumber so a bill Claudette already keyed is never doubled.

**4d. The Office room's Bills queue.** Oldest first (like the asks): unmatched
PO · over estimate · past due · duplicate · needs a human. Every number says
its source and its as-of (gospel 5).

**4e. Later.** Statement reconciliation (the monthly Billtrust statement
against `supplier_bills`), and the payables line on The Business room.

## 5. What Kevin decides

1. **Turn on CC's own QuickBooks bill export, or not.** It ends Claudette's
   retype fastest, but it is a change inside CC and QuickBooks. If yes: the
   Ref # has to be typed on every bill from that day, credits as credits, and
   the start date set so nothing already in QuickBooks is duplicated.
2. **Do the QuickBooks consent for our own door** — the four companies, one
   browser sign-in each, the walkthrough exists. Fifteen minutes.
3. **Where supplier email lands** — one `bills@` address per brand, or keep
   Jess's and Kevin's inboxes and label them.
4. **Send the census** (§7) — drafted in Gmail, not sent.

## 6. The other direction: the customer's invoice (Kevin, 16 Sep, afternoon)

> "do we know how jess currently sends out invoices… will she just approve
> based on crew inputs, and supervisor inputs… we make everything binary."

**What we know about today.** Invoices are made by hand in Billdu (fence,
Oasis) and QuickBooks, then sent. CC's own task "Send invoice / collect" sits
on **Laura's** seat (median 4 h after sign-off, per the audit); the "your
invoice is attached" line is Laura's. Whether Jess or Laura clicks Send today,
and in which system per company, is one of the three questions in the reply
drafted on Jess's thread. Nothing in our data says Jess does it; Kevin thinks
she does. The card goes on whichever seat she names.

**What already runs (313 · 316 · 340).** The chain opens the INVOICE ask by
itself when COMPLETION_SIGNOFF settles (Luis's three-or-more finished-work
photos plus the customer's word). The file's **Invoice** button opens a modal
already typed with the sold amount and queues it through `invoice_request`
into `qb_invoice_queue`; the `qb_invoices` switch is OFF, so the row records
the intent and nothing reaches QuickBooks. The invoice number settles the ask
and opens PAYMENT with its 30-day clock; the "invoice sent" and "past due"
lines are drafts from the main line; **Collect** puts the pay link in the box.

**The binary card (to build).** When the sign-off lands, the file opens
**INVOICE READY** on the invoicing seat, already typed: the signed estimate's
price, minus the deposit taken (336), plus any signed CHANGE_ORDER on the
file; the crew's finished photos (their one link per job, gospel 26) and the
supervisor's sign-off beside it. Two moves only: **Approve** = `invoice_request`
with that amount + the "invoice attached" text in the box from the main line
(one press of Send, gospel 7), or **Hold** with a reason, which tags Luis or the
rep on the file. Red when the photos are short of the brand rule or a change
order is unsigned. With `qb_invoices` ON, Approve creates the QuickBooks
invoice; PAYMENT, the reminder and CLOSEOUT follow by themselves.

**The film** (`films/ride-along-the-invoice.mp4`, Laura and Jess, built from the
real demo file with the INVOICE READY card mounted) and Laura's note are
drafted the same way as Jonathan's. Every film, note and card ends on gospel
33: nothing to learn, it comes to you; never "I'll walk you through the first
one", the card walks them.

## 7. The census email

Drafted to Jess, cc Jonathan, Sam, Laura (Claudette has no address on file;
Jess forwards). It lists the table in §3 and asks, per supplier: which company,
how the invoice reaches us, who pulls it, where it gets typed, and whether
the PO goes on the order. It says in so many words: **no passwords in the
reply.** Draft until Kevin presses Send (gospel 7).

## 8. What it takes to turn it all on (Kevin, 16 Sep, 3:45 PM: "what are we still waiting on?")

Baby spoons: one card at a time, each one live for a week before the next
switch. Nothing below is on yet.

**Built 16 Sep:** the scope, the before/after page, both films, the four
drafts, gospel 33; migrations 365 and 369 on live; **both cards in the app
(v96), every switch OFF, recording only** — that is step 7 and step 11 below,
live for the office to see before a single bill has landed.

| Step | Who | What | Waits on |
|---|---|---|---|
| 1 | Kevin | Send the four drafts (all hands · Jonathan · Laura · the reply on Jess's thread). | nothing |
| 2 | Jess | The supplier list; who clicks Send on invoices today, per company. | step 1 |
| 3 | Kevin | One `bills@` address per brand, or say "label the inboxes" and the worker reads Jess's and Kevin's Gmail by label. | nothing |
| 4 | Kevin | The QuickBooks consent. **Three of four are done** (Liberty Fencing, Pro-Tech, Oasis connected on live, synced 16 Sep). Liberty Roofing 1537 remains: one sign-in, `backend/QB-OAUTH-WALKTHROUGH.md`. | nothing |
| 5 | build | **DONE 16 Sep, 17:25.** Migration 365 applied on live: `supplier_bills`, `v_bills_queue`, `bill_decide`, the two switches OFF. **And 369, the same evening:** read policy office/manager, `wrong_job` stays on the queue, `bill_rematch`, `bill_decide` guarded like `invoice_request`. | — |
| 6 | build | The intake worker: **written** (`backend/worker/bills-intake.mjs`, IIF parser test green, deps under `backend/`), **never run.** It runs on the box with `BILLS_IMAP_USER` / `BILLS_IMAP_PASS` in the box's env, typed by Kevin. `--dry` first. | 3, 5 |
| 7 | build | **Bill landed** on the file + the Office queue: **BUILT 16 Sep evening, v96, every switch OFF, recording only.** Approve · Wrong job · Hold · Pick the right file · Open the PDF; red when over the estimate, no job, unreadable or past due; approved hands the office the fields in CC's order. Shows the moment step 6 lands the first row. | 6 for a real row |
| 8 | build | The QuickBooks writer: **written** (`backend/worker/qb-bills.mjs`: Bill / VendorCredit create, DocNumber = invoice number, duplicate-guarded; Invoice create for `qb_invoice_queue`), **never run.** Runs on the box; needs `QB_BILL_EXPENSE_ACCOUNT_ID` and `QB_INVOICE_ITEM_ID` in the env. Still to add: the invoice's pay link into `qb_invoice_queue.pay_link` and the INVOICE ask settled with the QuickBooks number. | 4 |
| 9 | Kevin | Flip `bills_to_qb`. Second spoon. Claudette stops typing bills. | 7, 8, a week of 7 |
| 10 | build | The CC side: confirm a bill-create endpoint (the MCP is read-only for bills); until then the card gives Jonathan the fields in CC's order. Or Kevin turns on CC's own QuickBooks bill export instead. | Kevin's call |
| 11 | build | **Invoice ready** on the office seat: **BUILT 16 Sep evening, v96.** Opened by the sign-off or the INVOICE ask; typed from the accepted estimate or the sold amount − the deposit + signed change orders; photos against the proof rule, the sign-off, the customer's last text, the brand's "invoice sent" line. Approve = `invoice_request` + optional invoice number (settles the ask, opens Payment) + the text from the main line, one press; Hold tags the supervisor or the rep. With `qb_invoices` OFF the office still makes the invoice in Billdu / QuickBooks and types its number; the card says so. | — |
| 12 | Kevin | Flip `qb_invoices`, then `office_machine_texts` for the invoice text. Third and fourth spoons. | 8, 11 |

**16 Sep, late (376 HAND IT BACK):** steps 3 and 6 no longer need a mailbox address or an app password. The intake reads the office mailboxes through the Workspace delegation key (gmail.readonly — the nurture engine's key), `BILLS_MAILBOXES` + `BILLS_QUERY` in the box env; readonly cannot mark a mail seen, so the dedupe keys carry it. Kevin's personal Gmail is the one address the key cannot reach: Heritage gets re-pointed (draft to Brian). Every bill now carries a kind (supplier · sub · crew · fee) and the paper door `bill_land_by_hand` exists — see `docs/HAND-IT-BACK.md`.

The order of the spoons: 7 → 9 → 11 → 12. Each one is a card that shows up
and says what to press; nobody is told to learn anything (gospel 33).
