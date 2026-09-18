# Monday, 21 Sep: every new lead starts here

Kevin, 17 Sep 2026, morning: "Jess starting on Monday scheduling all leads in
the new app… you just click on here and then all new customers will be in
there… we'll slowly be migrating away from Contractors Cloud… reassure that
every step is in here… we have to start here, we're not going to do the first
redundancy… make sure that everything she was doing in Contractors Cloud we
are already doing or it's being done for her."

This page is that reassurance, written down. The film that goes with it:
**Play with voice** on [ride-alongs.html](ride-alongs.html) (`?demo=1&as=office&tour=leads&auto=1&voice=1`).

## What changes Monday (one thing)

A new customer comes in by phone, web or referral. Instead of opening
Contractors Cloud, you press **+ New lead** at the top of Central Command, type
it once, and press **Open the file**. That is the whole change. Nothing else
you do moves yet.

## The three steps (the film, in words)

1. **+ New lead.** Brand, how they found us (the same lead-source list as CC,
   so the reports keep counting), name, mobile, email, what they want in your
   words ("chain link quote needed"), the address. Same phone number = the
   same customer; their history stays in one file.
2. **The rep and the time.** Pick the rep and the appointment; the form reads
   what that rep already has that day, so nobody is double-booked. An hour is
   the default. Leave the time blank if they still need one; NEXT on the file
   will say so in red until you book it.
3. **Open the file.** The moment you press it:
   - the rep's phone buzzes: "New estimate booked · Mon Sep 21 · 9:00 AM ·
     Okonkwo, Grace · 4050 Palm Ave, Mims · chain link quote needed · booked by
     Laura" — and the visit is on his Today in the phone app;
   - the booking is the first line on the customer's file, with your name;
   - the customer gets the confirmation text from the brand's main line when
     Kevin has that switch on (Fencing lines only until the other campaigns
     are approved);
   - the machine carries the lead into Contractors Cloud — the account, the
     project, the Sales Appointment on the rep, so his Google Calendar fills
     in exactly as it does today — when Kevin has **that** switch on. Until
     then the file says NOT IN CONTRACTORS CLOUD YET, **Copy for CC** gives
     you the fields in CC's order, and **Typed into CC** records that you did.
   - the visit lands on the rep's own Google Calendar by itself (404, 18 Sep,
     Sam's catch — **on since 18 Sep, 11:32 AM**): the machine writes it there
     within a minute of Open the file, moves it when you change the time,
     takes it off when you cancel. You no longer type it into CC for the
     calendar's sake. If you already typed one into CC and pressed Typed
     into CC, leave it: the machine knows (405) and never adds a second one.
     Do not add it to Google by hand on his calendar; the machine cannot see
     that, and the rep would get the visit twice.

## Everything you do in Contractors Cloud today, and where it is here

Honest column on the right: *here* means it lives here from Monday; *CC* means
it stays in Contractors Cloud for now and nothing about it changes; *switch*
means it is built and waits on Kevin's word.

| In Contractors Cloud today | Here | Monday |
|---|---|---|
| Make the account and the contact (name, phone, email, address) | + New lead | **here, first** |
| Make the project (Lead · Standard Event · lead source · primary rep) | + New lead; the lead source is CC's own list | **here, first**; CC gets the copy from the machine (switch `cc_mirror`) or from Copy for CC |
| Book the Sales Appointment on the rep (title, description, time, address) | + New lead: rep, time, length; the rep's day shown | **here, first** |
| The rep finds out (his Google Calendar, through CC) | his phone buzzes the moment you press Open the file; the visit is on Today in the phone app; his Google Calendar fills by itself (404) — the machine writes the visit straight onto his calendar, no CC copy needed for that | here; Google Calendar needs Kevin's one permission click (the Calendar scope on the delegation) |
| The "your estimate is booked" text (Heymarket, by hand) | the confirmation text from the brand's main line, 5 minutes after booking | switch `appt_confirm` (Kevin) |
| Project notes | the file's thread: the booking line, your notes, @names that buzz the person | here |
| The template tasks after a sale (paperwork, permit, locate, materials, schedule, inspection, invoice, close-out) | asks with clocks, opened by the chain the moment the customer signs on the link; the Office room, oldest first | here for a lead born here; CC's own template still runs on the CC copy until Kevin turns it off |
| Reschedule or cancel an appointment | **Change the time** · **Cancel the visit** on the file (384): the rep's phone buzzes with the new time, the line goes on the file, CC follows its switch (or Copy for CC); a lead with no time yet has **Book the time** | **here** |
| Work orders, crews, scheduling labor | CC; the crew's link is the room (switch `crew_link_text`, OFF) | CC |
| Mike's sub and price (his email with the Billdu link, the sub, the amount) → the subcontractor expense on the project | the **Sub locked in** card on the file (397, 17 Sep): Mike locks it on the contract picture; you are tagged (push, email, text); Copy for CC hands you the expense in CC's order, Typed into CC records it; the Office room lists what is waiting | **here, first**; the CC expense typed as today, from the card, until a CC expense door exists (then a switch, OFF) |
| The customer's invoice (Billdu / QuickBooks) | the Invoice ready card records it; the invoice lane (381 the invoice) waits on its switches | CC / Billdu, untouched |
| Supplier bills and expenses | the Bill landed card records it; `bills_to_cc` · `bills_to_qb` OFF | CC, untouched |
| Commissions, the reports | CC and the owner console | CC |
| Cancel a lead / mark it lost | Not going with us on the file (380); the office is tagged to mark it in CC | both |
| Find a customer, read the whole story | the Find box, the file, the Pipeline | here |

## What Kevin flips, and when

1. **Nothing has to be on for Monday to work.** The door, the rep's buzz, the
   file's line and Copy for CC work with every switch OFF.
2. **`appt_confirm`** (Office room): the customer's confirmation text, Fencing
   lines. Kevin's suggestion since 14 Sep.
3. **`cc_mirror`** (Office room): the machine writes the lead into CC. Before
   flipping it: the box's CC token must be allowed to WRITE (the read token
   answers 401/403 and the row goes red on the file, nothing else happens);
   run `node backend/worker/lead-mirror.mjs --dry` on the box, then
   `--one=<queue id> --force` on one real lead, then the hourly unit.
4. The rows the machine keeps: `cc_mirror_queue` (queued · sending · sent ·
   failed · by_hand · skipped), read on the file as the chip.

## If something goes wrong Monday

Reply to Kevin's email thread ("Monday: every new lead starts here"). That
thread is the ticket. Do not start a new one, do not text it. Contractors
Cloud is still there the whole time: typing a lead into it by hand is never
wrong, it is just the thing we are taking off you.

Nothing to learn. It comes to you.
