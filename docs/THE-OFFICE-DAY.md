# The office's day: Contractors Cloud vs. Central Command

Kevin, 13 Sep: "all the ladies do in CC, which is basically run all three companies, we can easily have them adapt to our easier version without a hiccup. Must be easier than they are currently doing it."

This page is the promise, step by step. Left: what the office does in CC today. Right: the one move here. Everything on the right was walked end to end on the live database on 13 Sep (rolled back, nothing saved), for both templates.

## The shape of the difference

| | Contractors Cloud | Central Command |
|---|---|---|
| Where a job's work lives | tasks on a project, created by a template, assigned by hand | asks on the customer file, opened by the last one closing, assigned by the seat map |
| How you know what to do next | open the task list, filter, sort | the Office room: the oldest ask on top, with its clock |
| How you finish a step | tick a checkbox (sometimes with a comment) | give the input the step is for: the upload, the number, the date. The checkbox does not exist. |
| Who sees the customer's texts | whoever has Uvoice open | the file. Every text, every email, every note, in one thread, with a 15-minute clock nobody has to watch. |
| Handing the job to production | add a name to the project team | the schedule date closes and production gets a push. The supervisor taps Take the job. |
| Getting help | call or walk over | post in the office room, tag the person, or send the file to their board. Any seat can jump in. |

## Fence and Oasis (Liberty Fencing 1461, Oasis Landscapes 1560)

CC template: 10 tasks per job, each created and assigned by hand or by the template, each closed with a checkbox.

Here: 4 inputs from the office. Everything else opens itself.

| # | In CC today | Here | Who |
|---|---|---|---|
| 1 | Determine if job sold or lead needs cancelling | Nothing to do. An estimate with no outcome is already on the rep and the sales manager in the console. | rep |
| 2 | Follow up with Rep to see if sold | Nothing to do. When the rep sends the contract from the app, the file opens the paperwork checklist by itself. | rep |
| 3 | Upload Contract and create sales order | **Input 1: the rest of the paperwork.** The checklist opens the moment the customer signs on the link (340); the contract settles itself, and on a no-permit address (Palm Coast) the NOC and permit signature are waived by the machine. Sam uploads what only she has: the recorded NOC, HOA, survey, the permit signature. The last upload IS "paperwork official" — material releases (or waits on the deposit, 336). | office |
| 4 | Pull permit | **Input 2: the permit number.** The ask opened by itself when the paperwork finished. 5-day clock. The customer gets the "permit is in" text from the main line. | office |
| 5 | Locate scheduled | **Input 3: one paste.** The locate ask opens when the permit lands with the whole Sunshine 811 ticket already written from the file (address, county, subdivision, lot, parcel, work date) and lands on Sam, who files it on Exactix (the Sunshine 811 login is still in Diana's name and its mail still lands in diana@ — move it to Sam's). The confirmation email closes the ask by itself; each utility's response lands on the file, ALL CLEAR when they have all answered (341). | Sam |
| 6 | Order Materials and Schedule Labor | **Input 4: the PO number, then the start date.** MATERIAL opens for Jonathan the moment material releases (official + deposit where due), with the calculator's order attached — before the locate, not after (340). SCHEDULE opens when the locate closes; the date sends the customer the schedule text and hands the job to Luis (COMPLETION_SIGNOFF). | Jonathan |
| 7 | Follow up with homeowner | Gone. The customer's texts land on the file; if nobody answers in 15 minutes the watcher sees it. | owning seat |
| 8 | Did pass final inspection? | Opens by itself when the supervisor signs off. The result is the input. Waive it when there was no permit. | office |
| 9 | Send invoice/collect | Opens by itself on sign-off. Invoice from the file (queued for QuickBooks). The invoice number closes it and the customer gets the invoice text. Collect is a button on the file. | Laura |
| 10 | Closeout job | Opens by itself when payment lands. One tap. | office |

## Roofing (Liberty Roofing 1537, Pro-Tech Roofing 1563)

CC template: 21 tasks per job.

Here: 4 office inputs, 7 supervisor inputs. The week-1/2/3 calls and the PM folder are gone.

| # | In CC today | Here | Who |
|---|---|---|---|
| 1 | Add your name to the project team | Gone. Whoever settles the first ask holds the file. | office |
| 2 | Do intro call / send email (confirm colors, payment) | Opens with the signed contract. The note is the input. | office |
| 3 | Make PM Folder | Gone. The customer file is the folder. | |
| 4 | Email Material List | Opens with the signed contract. Closes on the order. | office |
| 5 | Record NOC | On the paperwork checklist. Closes on the recorded NOC upload. | office |
| 6 | Submit for Permit | Opens when paperwork is complete. The permit number closes it. | office |
| 7 | Add supervisor to project team | Gone. The schedule date pushes production; the supervisor taps Take the job. | |
| 8 to 10 | Week 1, 2, 3 calls | Gone. The customer's texts on the file and the 15-minute clock. | |
| 11 | Homeowner is on schedule | The start date. Opens when the permit lands. Sends the schedule text. | Jonathan |
| 12 | Confirm tearoff has started | Opens on the schedule. A photo from the roof closes it. | supervisor |
| 13 | Dryin Ordered | One tap. | supervisor |
| 14 | Sheathing Inspection | The result. | supervisor |
| 15 | Dryin Passed | The result. | supervisor |
| 16 | Shingling in progress | A photo. | supervisor |
| 17 | Schedule Walkthrough | The day. | supervisor |
| 18, 19 | Final Inspection Ordered / Passed | One ask, opened by the walkthrough. The result is the input. | office |
| 20 | Project Completed | Opens when the final passes. Three finished-work photos and the customer's word close it. | supervisor |
| 21 | Send final invoice to h/o | Opens on sign-off. Invoice from the file; the number closes it. Payment and close-out follow by themselves. | Laura |

## What the walkthrough proved (13 Sep, live database, rolled back)

Pro-Tech, signing to close-out, 20 asks, every one landing on the right seat with nobody assigning anything:

```
paperwork (5 uploads) → permit + intro call + material list → schedule
→ tear-off → dry-in ordered → sheathing inspection → dry-in passed → shingling
→ walkthrough → final inspection → completion sign-off → invoice → payment → close-out
```

Fencing, signing to the production hand-off:

```
paperwork (5 uploads) → permit → locate → materials + schedule → production is pushed
```

## The map itself

The Office room has a "Workflow" panel: every CC step per brand, what it became, who owns it, and a note. Owner and admin can edit the notes in place. The machine reads the same rules (`ask_chain`, `ask_proof_rules`), so when the map changes, the file changes.

## Not switched yet, on purpose

Contractors Cloud stays exactly as it is. The office keeps working there until Kevin says otherwise. When it is time: the office works its asks here for a week with CC open beside it, then CC task templates are turned off for new jobs. Old jobs finish in CC.
