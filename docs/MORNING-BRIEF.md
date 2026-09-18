# Morning brief, Friday 18 September

Kevin, this is the whole picture in one page. Plain words. Nothing here needs
a build. The things that need you are at the bottom.

**The app:** https://kdelaney05-bit.github.io/4-touch-autopilot-central-command/
**The demo (fake customers, nothing saves):** add `?demo=1` to that link.

## New 18 Sep, 8 AM — THE LIBRARY, rebuilt; three things only your hand can send

Your words at 7:40: remove the owner's cut, only the last week or two, a
search or quick find of how things work, put it on the app or the CRM, make it
easier. Done: https://kdelaney05-bit.github.io/4-touch-autopilot-central-command/docs/library/

- The front page is the last two weeks; the five first-gen commercials are off
  it (they stay on `docs/films.html` as plain links). Older pieces fold under
  one line at the bottom.
- The search reads every word Guy says in every film and every step of every
  tour: type **deposit** and it finds the film that says it and shows the line.
  **HOW DO I…** questions, one tap each. Two tabs, **The phone app** ·
  **Central Command**, and a chip per team; it opens on everything unless the
  link says otherwise (nothing remembered: a remembered chip confused the first look).
- Every piece: four pictures, ▶ Play the film, Open the real screen (pretend
  customers), **Send it** (the link, ready to text).
- Doors: **🎬 The Library** at the top of Central Command (v119; opens on the
  seat's own pieces). In the 4-Touch app: a thin line under Find a customer on
  Today and a card in More — on `main` (7950945), **not on phones until the
  publish below**.
- The film, 1:44, Guy: https://kdelaney05-bit.github.io/4-touch-autopilot-central-command/films/watch.html?f=ride-along-the-library&t=The%20Library
  (YouTube Uploads: `16 - Ride-Along - The Library.mp4`). The Hand It Back
  film, linked since 16 Sep but never on the site, is on it now.

**Your three moves. The session's auto-mode classifier refused each one, so
nothing went out:**

1. **Last night's 8 AM push (the words-first film) — NOT SENT.** SQL editor on
   live (the same block sits in `docs/HANDOFF-UVOICE-16-SEP.md`):

   ```sql
   select r.name, rep_push_notify(r.id, 'The words first · new in the app',
     'Every text button now shows the words before it goes out. Read it, edit it, SEND. The film, about a minute: tap here.',
     jsonb_build_object('kind','film','url','https://kdelaney05-bit.github.io/4-touch-autopilot-central-command/films/watch.html?f=ride-along-words-first&t=The%20words%20first'))
   from reps r where r.name in ('Eric Payne','Gio Calderin','Gustavo Alvarez','Haakon Endreson','Mike LeRoy','Ron Seidel','Travis Janke');
   ```

2. **The Library film's push** (everyone with the app; the office and the
   supervisors have no app — text them the link):

   ```sql
   select r.name, rep_push_notify(r.id, 'The Library · how anything works',
     'Every change of the last two weeks, two minutes each. Type what you want to do, or tap a question. The film, 1:44: tap here.',
     jsonb_build_object('kind','film','url','https://kdelaney05-bit.github.io/4-touch-autopilot-central-command/films/watch.html?f=ride-along-the-library&t=The%20Library'))
   from reps r where r.name in ('Eric Payne','Gio Calderin','Gustavo Alvarez','Haakon Endreson','Jermey Gerber','Mike LeRoy','Ron Seidel','Travis Janke');
   ```

3. **The app update**, from a clone of trureview-mobile at `main` 7950945
   (tsc is clean for App.tsx):

   ```
   eas update --channel production --message "The Library door (7950945)"
   ```

## New 17 Sep — LEADS: Monday, every new lead starts here

Your words this morning: Jess schedules every lead in the new app from Monday,
no double entry, and everything she did in CC is here or done for her. Built
and live (v103, migration 381): **+ New lead** at the top is the first door.
The rep's phone buzzes the moment she books it, the booking is the file's
first line, the door shows the rep's day, and the machine carries the lead
into Contractors Cloud behind a switch (OFF: Copy for CC on the file). Her
film: `?demo=1&as=office&tour=leads&auto=1&voice=1`. Her page:
`docs/JESS-MONDAY.md`. The Jess email went out 17 Sep 11:52 AM ET. Your two moves: say whether the box's CC token may write (then the mirror switch); flip
`appt_confirm` for Fencing if you want the customer texted on booking.

## New tonight, 16 Sep — CONTRACT SIGNING AND AUTO WORKFLOW

The customer accepts now and signs everything once on the link: the contract,
the disclosures, the hold harmless, the permit application. Nothing notarized
on it. Oasis signs the contract alone. The Notice of Commencement goes to the
customer by email the second they sign, filled in, with a link to send back a
picture of the notarized page; the machine texts them until it lands. Nobody
goes back for paperwork. **Both of your parts are done** (16 Sep ~10:45 PM, on your word): **The NOC to
the customer is ON**, and the note to the sales team went out from your Gmail.
Walk it on the file "Delaney NOC walk, Kevin" — the link is in docs/HANDOFF-16SEP.md.

Sign in with the same email and password as the phone app. The database
decides what you see, not the page.

## The rule we built under

Everything below sits **beside Contractors Cloud**. Nothing moved. The office
still types into CC. No lead form was repointed. No invoice goes out by
itself. Your words on Friday: get it built and set, then migrate slowly and
safely. That is exactly where we are.

## What works right now

1. **One customer file.** Texts, emails, notes, asks, documents, and who
   touched it. All in one place, from the first text to the last invoice.
2. **The file's buttons.** Call, Text, Tag, add a Document, Send this file to
   somebody, Invoice, and Collect. Invoice puts the job in the QuickBooks
   queue. Collect texts the customer the payment link. Neither one goes
   anywhere until you turn the QuickBooks switch on or press Send.
3. **Text from the file.** The text is a draft until you press Send. You get
   six seconds to undo. It goes out on the brand's approved line.
4. **Tag the next person.** Type a note, tag Jess or the office or
   production, they get a push and it sits in their Tagged list until they
   open the file.
5. **The Office room.** Every ask the field is waiting on, oldest first. An
   ask only closes when the input is there. The permit number. The photos.
   The date. The input lands on the file, so nobody has to ask twice.
6. **The workflow map.** Every step of both Contractors Cloud templates, for
   each brand, and what it became on our side. Sixty two steps. Jess can read
   it. You and Jess can edit the notes.
7. **The Production room.** Every sold customer, who holds them, and how many
   days they have held them. Take the job, assign it, hand it back.
8. **The New Job door.** One form. It opens the customer, the job, the
   appointment and the signing checklist together. Same phone number means
   the same customer, so history stays in one file. The lead source list is
   your own CC list, per brand, so your reports keep counting.
9. **The village.** Team rooms for the office, for production, and one for
   everybody. Post, react, reply, and point a post at a customer's file when
   you want somebody to grab it. The reps' hype thread is untouched.
10. **The lead door.** A web address that can take leads straight in. It is
    built and live. Nothing points at it yet, on purpose.
11. **Adopt a job from CC.** Open any sold job that has no asks yet. A gold
    strip asks one question: where is it in CC right now? Tap the answer.
    Exactly that ask opens on the right seat, clock starting today. Nothing
    else opens. No flood. 549 sold jobs are waiting to be adopted this way
    (443 Fencing, 69 Oasis, 32 Pro-Tech, 5 Liberty Roofing), plus 29 at
    the invoice step.
12. **The office's day, side by side.** docs/THE-OFFICE-DAY.md walks every
    CC step Jess's team does today and the one move it becomes here. Fence
    jobs go from 10 tasks to 4 inputs. Roofing from 21 tasks to 4 office
    inputs and 7 supervisor inputs. Both templates were walked signing to
    close-out on the live database tonight and every ask landed on the
    right seat.
13. **The CC files.** Contractors Cloud does expose every project's files
    over its API, with plain download links. The puller is built and its
    dry run finished at 3 AM: of the 995 live jobs, 975 carry files. That
    is 5,207 files and 5.44 GB, almost all PDFs, and they are the office's
    real paperwork: contracts, NOCs, surveys, locates, warranties. Fencing
    has 4,414 of them. Nothing was copied yet. My permission rules stop me
    from running the copy on my own, even for one job, so it waits for you.
    The doc with the numbers and the two commands is
    Commercial-Desk/docs/CC-FILES-MIGRATION.md.

## The lanes

Every thread of work now carries one label — **SIGN · PAPERWORK · PERMIT · FILES · OFFICE DAY** — see [LANES.md](LANES.md) for what each is, where it stands and what it needs from you.

**PERMIT, today:** every customer file has a Property card. When a customer taps ACCEPT the county lookup runs by itself and the card shows the owner of record, parcel, legal, the owner's mailing address and whether the signer is the owner. **Fill the NOC** on that card makes the Notice of Commencement from the file (the county's own form for Volusia and Flagler, the statutory form for Brevard, Indian River and Seminole); it lands on the file with an Open link and the short list of blanks the office still types. Five counties answer from our server; Indian River waits on its weekly file. Regrid was rejected (trial excludes our counties, 75 a month after). Test customer for this: "Permit test, Autopilot".

**SIGN, today:** open any customer file → **Estimate** → items with the scope, price, valid days → Create → the link (copy, open, or text it). The customer sees Billdu's page order (number, amount, status, download, client, dates, ACCEPT) and taps ACCEPT; the file lists every estimate with its status; you get the push. Test customer: Delaney test, Kev.

## Try it in sixty seconds each

- **The file.** Type a name in Find a customer, top left. Open it. You are
  looking at everything we know.
- **A text.** On a file, press Text. Type a line. It shows as a draft. Press
  Send and watch the undo bar.
- **A tag.** On the same file, press Tag, pick a person, write one line. They
  get the push.
- **The Office room.** Open Office. The oldest ask is at the top. Try to
  close one without the input. The database says no.
- **The workflow map.** Same room, scroll to the map. Pick roofing and read
  down the list.
- **Production.** Open Production. Look at the days in stage column. Red is
  somebody holding a customer too long.
- **New job.** Top bar, press + New job. Make a fake one. It is yours.
- **Adopt a job.** Find any customer sold this month. If the file shows the
  gold strip, tap where the job is in CC. Watch the one ask open.
- **The village.** Open a room, post a line, point it at a customer.
- **The demo.** Add `?demo=1` to the link and show anybody. It is fake data
  and every button refuses to save.

## What is deliberately OFF

Six switches, all off, all in the Office room, owner only.

| Switch | What it would do |
|---|---|
| `appt_confirm` | Text a customer when their estimate is booked |
| `text_clock` | Chase a seat when a customer has waited too long |
| `office_machine_texts` | Let the office lines go out by themselves |
| `after_hours_reply` | Answer after 6 PM so nobody hears silence |
| `qb_invoices` | Create the QuickBooks invoice from the file |
| `esign_packet` | Put the disclosures and county forms under the customer's signature on the estimate page, one tap each |

Also off on purpose. No lead form points at our new lead door yet. Invoices
are still Billdu and QB by hand. Every text and email is a draft until a
person presses Send.

## What needs your decision today

1. **Send the Uvoice ticket.** It is written and sitting in your Gmail
   drafts. It asks for three supervisor users, extensions, a number each, and
   no texting on those numbers. Nothing about supervisors can start until
   those numbers exist.
2. **Ask Jeff to port (321) 252-5270** from Heymarket to Uvoice. That is the
   number customers already know.
3. **Export the Heymarket contacts before we cancel.** Once it is cancelled
   the list is gone. Do the export first, then cancel.
4. **Which switch flips first.** My suggestion is `appt_confirm` for Liberty
   Fencing only, because that campaign is approved and it is one text per new
   estimate. Oasis and Pro-Tech wait on their registrations.
5. **No bulk backfill.** Instead of opening paperwork asks on hundreds of old
   jobs at once, the office adopts each job with one tap the first time they
   open it. Say if you want the last 45 days adopted for them anyway.
6. **The Google review links.** Please click the four links and confirm each
   one lands on the right company's review box. They feed the review ask.
7. **Robert Govea, in or out.** He is a production supervisor in CC since
   February. You did not name him with Luis, Obed and Gerardo. If he is in,
   he gets a seat and a number. If not, we leave him alone.
8. **The CC files.** Two commands, in a terminal in the Commercial-Desk
   folder, with the env file set the usual way. First the eight-file trial on
   one job, then the live scope. Both read from CC and write only to our own
   storage and each customer's file. CC is untouched. About an hour or two of
   downloading, no CC rate limit involved.

   ```bash
   node backend/scripts/pull-cc-files.mjs --project 2094311 --apply
   ```

   ```bash
   node backend/scripts/pull-cc-files.mjs --scope live --apply
   ```

   Or tell me to run them and I will, once you allow it.
9. **DONE 18 Sep 11:32 AM — the visits reach Google Calendar (Sam's catch).**
   You gave the Calendar permission in both admin consoles this morning; the
   Calendar API is on in the liberty-nurture project and `liberty-gcal` runs
   on the box. A visit booked at the New lead door is on the rep's own Google
   Calendar within a minute (Gio's, Jessica's, Ron's, Eric's and Mike's are
   there). Jess, Sam and Laura have the note. Owed: the ride-along film.

## The safe order to migrate

One step at a time. Each one can stop and nothing breaks.

1. **Office first.** Jess and the office work the asks and the file here for
   a week, while still entering in CC. If the week is clean, the file becomes
   where they live.
2. **Supervisors next**, once the Uvoice numbers exist. Seats, the stage
   board, take the job, sign off with photos.
3. **Then repoint the lead forms** to our own lead door, one source at a
   time. Watch the first day of each.
4. **Then stop costing jobs in CC.** That is the last one, and only after the
   three above have run clean.

Nothing in step 3 or 4 happens without you saying so.
