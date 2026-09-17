# HAND IT BACK — everything the office types into Contractors Cloud, handed back as one decision

Kevin, 16 Sep 2026 (evening): "She puts sooo much in Contractors Cloud. Let's strip all that and make it
easier, faster, better, like always." And the rule underneath it:

> "Number one is: what do I do? I don't want them to say 'what do I do?'. I want to take
> whatever they did and hand it back to them to just make the decision, and not have to do
> all the work attached to it. You don't need to worry about how; we'll do it for you. We
> just need to know what you did and how you did it."

Lane label: **HAND IT BACK**. Built beside Contractors Cloud and QuickBooks, every switch OFF
until Kevin flips it (gospel 6). The card is the whole instruction (gospel 33). Nothing typed
twice, no conversation taken off anyone (gospel 20).

## 1. What "hand it back" means, in one shape

Whatever reaches a person today — an email with a PDF, a piece of paper from a crew, a fee
they paid on the company card — the machine takes it, does the typing, finds the file it
belongs to, and puts one card on that file:

**KIND LANDED · who · how much · which job · the paper. NEXT: you decide.**

Three buttons, the same three every time: **✓ Approve** · **Wrong job** · **Hold, say why.**
The person's knowledge is the decision. The machine's job is everything around it.

That is the BILL LANDED card from THE BILLS (16 Sep), and this lane is that card applied to
every kind of thing the office types by hand.

## 2. What the office actually types, measured (16 Sep (evening), live database)

The hourly copy of Contractors Cloud says what the office does there. Last 90 days:

| | Count | What it is |
|---|---:|---|
| Tasks the office closed | 1,939 | **every one created by a CC template; 0 typed by hand** |
| … Sam | 381 | inspection results (179 "Did pass final inspection?"), permit submitted, dry-in and sheathing steps |
| … Jonathan | 316 | week 1/2/3 calls, homeowner on schedule, tear-off, shingling, walkthrough, project completed |
| … Luis | 156 | order materials and schedule labor |
| … Jess | 34 | **"Send final invoice to h/o"** — the invoice is her only CC task |
| Bills in CC (16 Sep report) | 1,847 · $1.96M | about 20 a day; Ref # blank on all 1,250 recent; QuickBooks sync on 0 |

So the tasks are already answered by THE OFFICE DAY (asks replace the template; four office
inputs per job). **What Jess types is the money**, and none of it is in the mirror: supplier
bills, sub invoices, crew invoices, permit fees, the customer's invoice, the payments, payroll.
That is this lane.

Jess and Sam's own map of it (the census thread, 16 Sep):

| What reaches us | Today | Who types it, where |
|---|---|---|
| ABC Supply (roofing) | Billtrust email to Jess, PDF + IIF, PO on most | Jess forwards → Jonathan types CC → Claudette types QB from the portal |
| SRS · Heritage Landscape Supply (= FIS Outdoor, same account H021915) | Billtrust email to Jess / Kevin | same; Heritage: nobody has said who types it |
| Southern Dumpsters · Metal Factory | email to Jess | Jess types QB **and** CC |
| Home Depot · Merchant Metals · FIS | a portal Claudette logs into | Jonathan job-costs in CC; Claudette QB (Home Depot: not in QB at all) |
| Havana Fence Supply | no portal, paid Fridays | Jonathan CC; Jess pays |
| Kicking Grass and 4–5 Oasis subs | email to Jess | Jess types CC and pays |
| Fencing crews (MK, La Fence, Bello, Hurtado, Fence One, CG…) | paper from Obed | Jess's spreadsheet → Claudette types CC → Jess cuts the check |
| Roofing crews (Pro-Tech Crew, Komodo, Millennia) | paper from Luis | Jess's spreadsheet → Laura types CC → Jess runs payroll |
| NOC recording (Simplifile) · septic survey stamp (Environmental Health) · permit fees | Sam pays | Sam types CC as paid |
| Warehouse pulls (162 "bills", $249K) | our own stock to a job | Jonathan job-costs in CC |
| The customer's invoice | Billdu (fence, Oasis) or QuickBooks, by hand | Jess (roofing task), Laura's seat in CC |
| The customer's payment | check, card, ACH | recorded in QuickBooks and CC by hand |

## 3. Each one, handed back

| What they did | What the machine takes | The card | Who decides | Status |
|---|---|---|---|---|
| A supplier emailed the invoice | the email: PDF + IIF, PO → the material order → the job | **SUPPLIER BILL LANDED** | Jonathan | built 16 Sep (365, 369, v96); worker written, never run |
| A supplier is portal-only (Home Depot, Merchant Metals, FIS) | one call to each: turn on emailed invoices with our PO; until then Claudette forwards the PDF to the bills mailbox | same card | Jonathan | asks to draft |
| A sub emailed Jess | the email, matched by sender (payees) | **SUB INVOICE LANDED** | Jess | **376**: lands as `sub` |
| A crew handed Obed or Luis paper | the supervisor snaps it on the job and types the amount, once | **CREW INVOICE LANDED · by Obed, on the job** | Jess | **376**: the door `bill_land_by_hand`; the TAKE option in the supervisor app is the next spoon |
| Sam paid a fee | Simplifile's receipt email; the county's receipt; or Sam's one extra field on the PERMIT ask ("what did it cost") | **FEE RECEIPT LANDED** | Sam | **376**: lands as `fee` by email; the PERMIT-ask field is the next spoon |
| Havana, paid Fridays | ask for emailed invoices with the PO; until then Jess's Friday list = the week's landed Havana rows | same card, batch Approve | Jess | ask to draft |
| The warehouse pull | the fence calculator's order already says stock vs special (344); a released order **is** the pull | no card; the cost line writes itself | nobody | FENCE PACKET lane |
| The customer's invoice | sign-off + the accepted estimate − deposit + change orders | **INVOICE READY** | Laura / Jess | built 16 Sep (v96); `qb_invoices` OFF |
| The customer's payment | QuickBooks Payments (card + ACH already on for Fencing): the pay link on the invoice; the payment lands in QuickBooks; `qb_invoices` balance → 0 settles PAYMENT | no card | nobody | needs the worker on the box; Pro-Tech and Oasis need QB Payments turned on |
| Crew pay / payroll | the crew app's stamps (CREWS lane) | out of this lane | | |

**Approve does the same thing whatever the kind.** `bills_to_cc` ON writes it into Contractors
Cloud with the Ref # filled; `bills_to_qb` ON creates the QuickBooks Bill (or Expense for a fee)
the same second, duplicate-guarded on payee + invoice number. Until then the tap records the
decision and hands the office the fields in CC's order. Both switches OFF.

## 4. What 376 put on live (16 Sep (evening))

- `payees` — every supplier, sub, crew and fee that bills us: the kind, the brand, how it
  arrives, the sender match, and "who types it today" from the census (the map, not a rule).
  Seeded with 39 rows from Jess and Sam's answers plus the CC bills report. Owner and admin
  edit; office and managers read.
- `supplier_bills.kind` (supplier · sub · crew · fee, default supplier), `payee_id`, `landed_by`.
  Nothing already there changes.
- `v_bills_queue` carries `kind`, `payee_id`, `landed_by`, `landed_by_name` (new columns at the end).
- `bill_land_by_hand(customer, payee, kind, amount, invoice_number?, note?, pdf_path?, bill_date?)`
  — the paper door. Office, manager, owner, admin. Lands matched to the newest job on that
  customer, posts "Crew invoice landed by hand · MK Fencing · $1,850.00" on the file's thread.
  `bill_decide` takes it from there.
- No new switch.

**The intake worker** (`backend/worker/bills-intake.mjs`) now lands a mail with no
"Your Invoice From" subject when its sender or subject matches a payee and a PDF came with it,
as that payee's kind. **It reads the mailboxes through the Workspace delegation key** (gmail.readonly, the key the nurture engine and the ITB reader already hold): `BILLS_MAILBOXES` (default the two Jessicas, Jessica Oasis, kevin@libertyfencingfl.com) and `BILLS_QUERY` in the box env. No IMAP, no app password. A consumer Gmail (kdelaney05@) cannot be impersonated, so Heritage is re-pointed to a Workspace address (draft to Brian at Heritage/FIS in Kevin's Gmail). Still never run.

**The app (v97):** the card says its kind before the name (SUPPLIER BILL · SUB INVOICE ·
CREW INVOICE · FEE RECEIPT LANDED), says who landed it and how ("landed by Obed from the
paper"), drops the "we ordered at" comparison where there is no order, and the Office room's
Bills tile and queue say "suppliers · subs · crews · fees". The demo file carries one of each:
`?demo=1&as=office&file=cj7` (the crew invoice), `&file=cj3` (the fee receipt).

## 4a. The dry runs on the box (16 Sep, 9–10 PM)

The intake ran on the box against the real mailboxes five times, writing nothing, and each
run fixed something. What the last one would land, from seven days of mail:

| Mailbox | Would land | Read from |
|---|---|---|
| jessica@libertyfencingfl.com | Iron World INV1260 $454.70 and INV1255 $913.64 (supplier, no PO on their invoice) | the NetSuite PDF |
| jessica@libertyfencingfl.com | Heritage H044803 inv 0029347593-001, **amount unread → needs a human** (the PDF's text layer stops at page 1; no IIF came with it) | the Billtrust PDF |
| jessica@oasislandscapesfl.com | Nick's Lawn 10001567 $190.90 and 10001545 $4,082.26 (sub) | the PDF |
| jessica@oasislandscapesfl.com | Kicking Grass #1065 $1,750 · #1064 $1,100 · #1060 $550 · #1057 $4,050 (sub, link-only emails) | the email's subject and text |

Skipped on purpose: payment confirmations (Billtrust "Your payment summary", Heritage
"Payment Confirmation", a sub's "Payment processed"), our own Billdu reminders to customers,
Havana's "Payments Due" replies (inline images, no PDF: Jess's draft asks Havana for PDFs),
legal and payroll bills (Ausley & McMullen, ADP: overhead, not a payee yet), NOCs, calendar
invites, voicemails. The two Heritage accounts: H044803 (Fencing) lands in Jess's fencing inbox;
H021915 (Oasis, the paver account the subs buy on) still reaches only Kevin's personal Gmail
until Brian adds Jess or Kevin forwards it. **Ask Billtrust to attach the IIF on H044803** and
Heritage's amounts read exactly.

**Not run for real yet.** The first real pass puts the cards above on the office's files
(v97 reads `v_bills_queue`), every switch still OFF. Kevin says when.

## 5. The spoons, in order

Each one is a card that shows up and says what to press. One at a time, a week each.

| Step | Who | What | Waits on |
|---|---|---|---|
| 1 | Kevin | **Done 16 Sep, late.** The reach check (Kevin ran it on the box, headers only): the key reads jessica@libertyfencingfl.com, jessica@oasislandscapesfl.com and kevin@libertyfencingfl.com; jessica@libertyroofinggrp.com answers 401 (another mail tenant). Kicking Grass's invoices already land in the Oasis mailbox as link-only emails ("You received a new invoice (#1065)"), Heritage's Fencing account H044803 already lands in Jess's fencing inbox with PDFs, Heritage's Oasis account H021915 still goes to Kevin's Gmail — the email to Brian went out asking for Jess's address too. ABC/SRS: Jess re-points Billtrust off the roofing address (draft). The intake now parses a link-only sub invoice from the email text and skips payment confirmations. | — |
| 2 | — | ~~Liberty Roofing's QuickBooks consent~~ **Not needed.** Liberty Roofing (1537) has no QuickBooks company of its own; its books live inside Pro-Tech's file (migration 022, 20 Jul). The consent screen on 16 Sep offered a new trial company, which is the tell. The writer now sends 1537 through the 1563 connection. | — |
| 3 | build | Copy the rewritten intake to the box and run it `--dry` first. The first real ABC (Jess's roofing inbox) and Heritage mails land. | 1 |
| 4 | build | The supervisor app: TAKE gains "the crew's invoice" — snap the paper, type the amount, pick the crew from `payees`. Calls `bill_land_by_hand`. Ride-Along ships with it. | 376 (done) |
| 5 | build | The PERMIT ask gains one field, "what did it cost"; Sam's tap lands the fee. | 376 (done) |
| 6 | Kevin | Send the three supplier asks (Havana, Home Depot, Merchant Metals): emailed invoices with our PO. Drafts. | nothing |
| 7 | Kevin | Flip `bills_to_qb`. Claudette stops typing bills. | 3, a week of cards |
| 8 | Kevin | Flip `qb_invoices`. Jess stops typing invoices. Payments land by themselves. | worker on the box |
| 9 | Kevin | Flip `bills_to_cc` — or turn on CC's own QuickBooks export and never type CC again. | 7 |

## 6. What Kevin decides

1. Whether a supervisor may land a crew's invoice (step 4), or only the office. 376 allows
   office, manager, owner, admin; Luis and Obed are managers.
2. Whether Claudette's portal pulls go through the bills mailbox (forward the PDF) or wait for
   each supplier to email us. The mailbox is the faster start.
3. The Home Depot question: it is not in QuickBooks at all today. The statement by email is the
   door; the machine can land each statement line as a bill.

## 7. The film

`tools/ride-along/specs/hand-it-back.json` → "Ride-Along - Hand It Back.mp4" (Guy, ~2 min):
today's typing by person; the crew invoice card on the real demo file; the fee receipt card;
your move; the numbers; how it rolls out; nothing to learn. Same rules as every film: their
view, never mine (gospel 25); the card is the instruction (gospel 33).
