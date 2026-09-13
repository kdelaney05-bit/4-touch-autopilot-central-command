# CONTRACTORS CLOUD + UVOICE — the workflow audit, and the merge into the one OS (12 Sep 2026)

**Kevin, 12 Sep:** "audit contractors cloud workflow and now reaudit our uvoice
data which has all the inside support folks attached. jess, sam, laura,
johnathan and merge all their current tasks and workflows into this…
contractors cloud is so static… at no time should the customer not have a
supervisor watching their team's part… the #1 complaint… is they can't get
ahold of someone fast enough. if it's handled fast it's never an issue."

**Kevin's own description of the office flow, same day:** "signing → get
all paperwork to submit (NOC sometimes, permit signed, HOA, survey etc) →
file those → bug those people for it → permit → ok to schedule (Jonathan)
→ call customer and schedule → Jonathan orders materials upon job turned in.
it's all in there and super easy."

Read live 12 Sep 2026 (read-only, Management API from Kevin's PC; CC classic
dashboard in Kevin's Chrome). Numbers are measured; where the mirror is
stale it says so. Companion to `docs/ONE-OS-SCOPE.md`.

---

## 1. Contractors Cloud — the workflow as it actually runs

The office's whole workflow in CC is **milestone templates that spawn tasks**.
We mirror every task (`cc_tasks`, 24,002 rows, 490 open). ⚠️ **The full task
puller last ran 3 Aug 2026** (`cc_tasks.synced_at` max) — the open-queue
numbers below are six weeks old; the template steps and the medians are not.

### 1a. The two templates (every step name, from 24,002 tasks)

**Fence / Oasis template** (in order of the job):
1. Determine if job sold or lead needs cancelling (194) · Follow up with Rep to see if sold (737)
2. Upload Contract and create sales order (906)
3. **Pull permit** (1,658)
4. **Locate scheduled** (2,430)
5. **Order Materials and Schedule Labor** (3,244)
6. Follow up with homeowner (6,217 — see below, it is a dead step)
7. Did pass final inspection? (1,392)
8. Send invoice/collect (3,212) · Send Final Invoice (345, since Mar 2026)
9. Closeout job (216)

**Roofing template** (Aug 2025, Pro-Tech / Liberty Roofing):
Add your name to the project team → Do intro call/send email (Confirm
Colors/Payment) → Make PM Folder → Email Material List → **Record NOC** →
**Submit for Permit** → Add supervisor/project manager to project team →
Week 1 Call → Week 2 Call → Week 3 Call → Homeowner is on schedule →
Confirm tearoff has started → Dryin Ordered → Sheathing Inspection → Dryin
Passed → Shingling in progress → Schedule Walkthrough → Final Inspection
Ordered → Final Inspection Passed → Project Completed → Send final invoice
to h/o. (~150 instances each.)

Kevin's spoken flow maps onto these exactly: signing = Upload Contract;
paperwork = NOC / permit / HOA / survey (CC has Record NOC + Pull/Submit
permit, **no HOA step and no survey step**, so those live in someone's head);
"bug those people" = nothing in CC; "ok to schedule" = Locate scheduled;
"call customer and schedule" + "order materials" = Order Materials and
Schedule Labor (one task for two jobs).

### 1b. What the numbers say

| Finding | Measured |
|---|---|
| Open signed jobs (signed, not completed, not excluded) | **674** |
| …of which carry NO open CC task at all | **559 (83%)** — the template is not tracking most live jobs |
| Open tasks assigned to people who LEFT (Diana, Margaret, Autumn) | **564** — templates still assign to them; can never be closed |
| Tasks with CC notification on create/complete | **0 of 24,002** — CC pings nobody, ever |
| Cross-closed tasks (closed by someone other than the assignee) | thousands: Diana's 711 closed by Jonathan; Jonathan's 557 by Jessica (Oasis), 452 by Sam, 269 by Jessica; Sam's 509 by Jessica (Oasis), 227 by Jessica |

The cross-closing is the important one: **work in the office is shared, CC's
per-person assignment is fiction.** Whoever is there settles it. The OS must
model asks by lane and clock, settle-able by anyone in the room — which is
exactly how 090's `thread_asks` already works.

**Clean medians (real assignee, employed, completed, not an instant clear):**

| Step | Completed | Median | p90 |
|---|---|---|---|
| Pull permit | 1,167 | **12.1 days** | 38 days |
| Order Materials and Schedule Labor | 2,685 | 3.1 days | 23 days |
| Locate scheduled | 1,479 | 22 h | 7 days |
| Did pass final inspection? | 680 | 4 h | 24 days |
| Send Final Invoice / to h/o | 141 | 4 h | 17–24 h |
| Follow up with Rep to see if sold | 516 | 7.9 days | 47 days |
| Follow up with homeowner | 5,746 | **180 days** | 551 days |
| Submit for Permit (roofing) | 100 | 1.2 days | 20 days |
| Record NOC | 95 | 1.1 days | 20 days |
| Week 1 Call (roofing) | 123 | 4.1 days | 22 days |

"Follow up with homeowner" is a reminder nobody closes (6,113 instances,
median half a year): the one step that IS the customer's communication is
the one the template cannot carry. Per person (who actually closed it):
Jonathan 2,238 tasks · Sam 2,960 · Jessica (Oasis) 932 · Jessica Coley 693 ·
Laura 120 (since June) · Diana/Bronte/Autumn (gone) 3,305.

### 1c. The production side lives on CC's work-order whiteboard, invisible to us

CC's dashboard, 12 Sep: **Work Orders — Ready 23 · Needs Approval 1 ·
Waiting 36 · In Progress 105 · Service/Warranty 0 (165 total).** Our
database holds only a flag (`jobs.cc_has_work_orders`), no work-order rows.
The supervisors' actual board is here; the file cannot see it, so the
"who has the customer right now" question has no answer today.

Also on the dashboard, for the rooms:
- **Accounts receivable aging:** 90+ days 20 invoices / $139.6K · 60–90 4 /
  $15.6K · 30–60 6 / $42.8K · 0–30 38 / $178.3K → **~$376K open**.
  (Collections room, day one.)
- **Expired installer insurance: 11 subs** (Cuba Fence, Fence & Plus, Fikox,
  Hurtado, Maikel, Mickey's, Navarrete, Noham, Piloto, Portal of Dreams,
  YCP) — Stratus won't schedule a crew with expired insurance; classic will.
- **Commission approvals: 1,928 available / $424.5K, 0 approved** — a queue
  nobody works in CC (the app pays the boards instead).

## 2. Uvoice — the texting, last 30 days (live, `text_messages`)

### 2a. Who texts on what line

| Line | Inbound (people) | Outbound (people) |
|---|---|---|
| ext 100 (house / Kevin's admin share) | 115 (40) | 201 (77) |
| ext 101 (office — who? see 2d) | 51 (25) | 12 (10) |
| ext 102 (office — who?) | 58 (16) | 53 (32) |
| 150 Eric | 271 (41) | 271 (42) |
| 151 Travis | 136 (32) | 114 (32) |
| 152 Ron | 45 (15) | 16 (9) |
| 153 Matt (ext kept, unnamed) | 48 (11) | 17 (7) |
| 154 Haakon | 220 (35) | 245 (55) |
| 156 Mike | 152 (42) | 147 (61) |
| **Cloudmessage rail (the app, since 8–10 Sep)** | 46 (8) | **186 (63)** |
| The company main line via Heymarket (Zapier feed; the review-prompt line — see Appendix A) | **199 (106)** | not captured — Heymarket's outbound never reaches us |

The rail is live for **7 reps** (`reps.sms_via='cloudmessage'`), 201 sends in
`sms_outbox`, all `sent`.

### 2b. How fast the customer gets an answer (inbound → first outbound to that number, any line)

| Lane | Inbound | Median (answered) | Within 15 min | Within 1 h | **Over 24 h or never** |
|---|---|---|---|---|---|
| **Office lines 100–102** | 224 | 8 min | 34% | 40% | **53%** (112 never got a reply at all) |
| Rep lines 150–156 | 872 | 8 min | 50% | 63% | 26% |
| **Cloudmessage rail (the app)** | 46 | **2 min** | **74%** | **89%** | 11% |
| Main line via Heymarket (replies invisible to us) | 199 | — | 1% | 1% | **97% unseen** — 27 answered from Uvoice lines; the rest may be answered inside Heymarket, which we do not hold (Appendix A) |

**This is the #1 complaint in numbers.** More than half of the texts to the
office lines never get a text back. The app's rail, ten days old, answers
three of four inside 15 minutes — so the fast answer is not a people
problem, it is a "which screen was it on" problem.

### 2c. By stage — customers IN PRODUCTION text the rep, not the office

| Stage of the customer's job | To rep lines | To office lines |
|---|---|---|
| Selling | 293 · 69% in 1 h · 13% never | 22 · 45% · 50% never |
| **Production (signed, not complete)** | **258 · 71% in 1 h · 18% never** | 26 · 42% · **46% never** |
| Completed | 43 · 67% · 23% never | 23 · 48% · 39% never |

Production texts are answered by: Eric 111, nobody 73, Travis 54, Haakon 28,
Mike 26, house ext 100 12, ext 102 11. **The salesman is the customer's
production contact today**, because he is the only number the customer has.
The supervisors have no line, the office answers less than half. Examples
unanswered >24 h this week, all production customers: "Hi good morning did
you get my message?" (to 102) · "Hello I tried to call back but couldn't
reach anyone…" (to 102) · "I'll wait for your call" (to 102) · "Yes, the
work looked excellent, is there any way you can get me a photo…" (rail).

### 2d. Inside staff on Uvoice — what we know and don't

- Extensions 100–102 are the office; **which of Jessica / Sam / Laura /
  Jonathan holds 101 and 102 is NOT in our data.** ext 100 is Kevin's admin
  user, to which every rep line is SMS-shared (the 263 finding), so "100
  outbound" is usually a rep and "100 inbound" is a customer texting a main
  number that copies to Kevin/Jessica (the 10 Sep call: "company main
  numbers continue routing incoming customer texts to Jessica"). Fix = the
  Uvoice users-and-DIDs sheet (Oliver, 10 Sep) — read it from the Manager
  Portal (clients.uvoice.com/portal, needs Kevin's login) and seed
  `rep_channel_map` rows for the four office seats.
- The three supervisors have no Uvoice user at all (ticket drafted 12 Sep).
- Jermey is ext 157 in Uvoice, `uvoice_ext` still NULL in `rep_channel_map`.
- Inbound texts by hour (ET): 8 AM–6 PM carries 91%; peak 1–5 PM (135–148 /h);
  **106 texts arrive after 6 PM** — the evening ones are the unanswered ones.

### 2e. Heymarket — what is in it, and what moves (read in Kevin's Chrome, 12 Sep night)

**Kevin:** "i don't think we need heymarket any longer… all outbound marketing,
i'm certain i'll take that over in here."

One inbox, (321) 252-5270, a trial account (`heymarket@trial-71637…`). No
automations. One active campaign (Kevin's "Estimate Sent – Pro-Tec Roofing
(Touch 1)", 2 contacts). Broadcasts: the May voting blasts (Best of Brevard,
five fencing groups + Oasis) and review blasts, and the 14 Aug / 28 Aug
**5-Star Reviewer reference-consent lists** (81 Fencing, 58 Oasis — the
reference sheet's consent, migration 161). The day-to-day is the office's
hand-typed templates, visible in the chats:

| Heymarket text today | Who sends | Where it lives in the OS |
|---|---|---|
| "Hey {first}, this is Jessica with {brand}… rate the staff and workmanship 1–10?" | Jessica, after completion | **Touch 4 / the review ask** — the machine, from the brand main line, on PAYMENT settle (chain) — Kevin's voice pass |
| "That is so wonderful to hear!… leave us a 5 star review {Google link}" | Jessica, on a 9–10 | the machine, on a 9–10 reply (per-brand Google review links, already in `touch_pieces`) |
| "Good morning, Liberty Fencing here… you were looking for a Free Fencing Estimate… call us back at 321-215-4437 / 386-446-5110" | office, on a web lead | **the lead-response text** — same rail as the confirmation text, `automation_switches.lead_reply` (to build) |
| "Thank you for choosing Liberty Fencing… your invoice attached {link}" | Laura | the INVOICE settle sends it from the main line with the Billdu link (chain push + text) |
| "Friendly reminder… your invoice is past due {link}" | Laura | the PAYMENT ask's 30-day clock sends it |
| "…have you been able to sign your service finance loan documents…" | Laura | a CONTRACT_DOC (loan docs) ask on the paperwork checklist, its 48-h chase |
| "Hello Bill, my email address is Laura@…" | Laura, one-off replies | `file_text_queue` from the file |

So every Heymarket job has a home; the reply threads (Manka's missing cap
still sits unanswered there with a 5-day badge) come onto the file when the
number moves to Cloudmessage. **Cancel Heymarket after: the number ports,
the two consent lists are exported (they are the reference-sheet consent),
and the last 30 days of chats are exported for the file.**

## 3. The file engine — built, unused

| Rail | State on live |
|---|---|
| `job_threads` | 80 files ever opened |
| `thread_messages` | **12 messages ever** (CHAT 7, SUPER 3, OFFICE 2), last 9 Sep |
| `thread_asks` | **1 ask ever** (a MATERIAL_REQUEST, still open) |
| `customer_signatures` | 1 |
| Crew app, last 14 days | **1 crew, 1 site, 8 events** — dormant since the August pilot |
| SMS rail (`sms_outbox`) | 201 sent, 7 reps on it — LIVE and fast |
| Machine emails, 30 days | 42 sent, 8 skipped |

The lanes, asks and clocks were built 30 Jul and never got a room. The rail
got a button in the app and was used 201 times in ten days. **The lesson for
the OS: a feature is used when it is on the screen the person already has
open, one tap from the customer.**

## 4. The merge — every CC step becomes an ask with a lane, an owner and a clock

| CC step (template) | Kevin's word | OS ask (lane · type) | Opens when | Owner seat | Watcher | Clock target |
|---|---|---|---|---|---|---|
| Upload Contract / create sales order | signing | OFFICE · CONTRACT_DOC | `contract_signed_at` lands | office (Sam/Laura) | admin (Jessica) | 4 h |
| — (not in CC) | paperwork: NOC, permit signature, HOA, survey | OFFICE · CONTRACT_DOC ×n (checklist per brand) | with the contract | office | admin | 24 h to request, chase every 48 h |
| — (not in CC) | "bug those people" | the chase = the machine's text/email from the main line + the ask's clock | ask open > 48 h | office | admin | auto |
| Record NOC / Pull permit / Submit for Permit | permit | OFFICE · PERMIT | paperwork DONE | office (Sam) | admin | **5 days** (median today 12) |
| Locate scheduled | ok to schedule | OFFICE · SURVEY | permit DONE | office | admin | 24 h |
| Order Materials and Schedule Labor | Jonathan orders + schedules | OFFICE · MATERIAL + the schedule date on the file | job turned in | Jonathan | admin | 48 h |
| Add supervisor to project team | — | **hand-off row → PRODUCTION · TAKE THE JOB** | schedule set | supervisor | **ops (Luis)** | 24 h to take |
| Week 1/2/3 Call · Follow up with homeowner | (the dead step) | replaced by the customer's own texts on the file + the answer clock | any inbound text | owning seat | stage watcher | **15 min** |
| Confirm tearoff / Dryin / Sheathing / Shingling | crew day | SUPER · SITE_ISSUE / SAFETY_JHA as needed; crew arrivals from the crew app | crew on site | supervisor | ops | same day |
| Did pass final inspection? · Final Inspection Passed | — | OFFICE · PERMIT (close) | sign-off | office | admin | 48 h |
| Schedule Walkthrough · Project Completed | field complete | SUPER · COMPLETION_SIGNOFF (photos required) | supervisor taps | supervisor | ops | day of |
| Send invoice/collect · Send Final Invoice | invoice | OFFICE · INVOICE (auto-opened by the sign-off) | sign-off DONE | office (Laura) | admin | **4 h** (median today 4 h — keep) |
| Closeout job | paid | OFFICE · PAYMENT | invoice sent | office | admin | 30 days, red at 30 (AR aging feeds it) |

Everything in the middle column already exists in the schema (090/091 ask
types). Two new ask types are needed: `HOA` and `NOC` under CONTRACT_DOC
(or a `doc_kind` note) so the paperwork checklist is per item.

## 5. The rule that answers the #1 complaint — nobody waits, and somebody is always watching

1. **Every inbound customer text starts a clock on the file** (it already
   lands there). The owning seat for the stage has **15 minutes**.
2. **At 15 minutes the watcher is pinged**: Luis for production, Jessica for
   the office stage, Kevin/Gio for selling. At 60 minutes Kevin. The ping
   says who the customer is, what they asked, who was supposed to answer.
3. **Anyone in the room can answer** (the file is shared, the main line is
   shared, credit is by who sent). Answering stops the clock.
4. **Red on every board** until answered: the owner console's "needs you
   now", the room boards, the supervisor's board.
5. **Targets, measured monthly from the same query as §2b:** 90% inside 15
   min (the rail already does 74%), 98% inside 1 h, **zero over 24 h**.
   Today the office lines sit at 34 / 40 / 53%.
7. **Text first, call second (Kevin, 12 Sep: "all our support folks should
   be texting not calling if possible. it's quick, everyone reads and has
   objective proof yes or no").** The office's outbound texting today: ext
   101 sent 12 texts in 30 days, ext 102 sent 53 — 65 office texts against
   224 customer texts in. Every office ask that touches the customer
   (survey date, permit in, schedule, invoice sent) goes out as a text from
   the main line, from the file, with the proof attached — so the customer
   has it in writing and the file has the yes or no. Measure: office
   outbound texts per open sold job per week (today ≈ 0.2).
6. **After 6 PM** the watcher is the on-call supervisor; the machine sends
   "Got it, {first name} — {Obed} will text you first thing at 7:30" so the
   customer never hears silence. (This one text is the whole difference
   between "a curious question" and "the waterfall".)

## 5b. The one thing CC got right — an ask closes on the INPUT, not a checkbox (Kevin, 12 Sep)

**Kevin:** "only reason i like cc was that they were the only crm that had
automatic workflows that required an input to complete and not just check
it off. like upload the building permit, upload signed contract… and then it
would send the permit girl a message hey you got new permit here it is get
it filed and so on. lets make sure we do the same, add the crucial piece to
the file so we don't need to ask and it's all here where it needs to be."

Two facts from the data first: (1) in Kevin's CC account that message never
fires — `notifies_on_create` and `notifies_on_complete` are **false on all
24,002 tasks**; the office has been running the chain by eye. (2) CC's tasks
close on a click (`is_complete`), the input rule lives in the template
step's UI, which is why 5,746 "Follow up with homeowner" tasks closed with
nothing attached. The OS makes the rule structural:

**The law: an ask closes only by `ask_settle(ask, proof)`, and the proof goes
on the file.** No checkbox. The proof is the crucial piece Kevin means —
it lands in the folder (`thread_attachments`, `job-docs` bucket, CompanyCam
for photos) so nobody has to ask for it again.

| Ask | Required proof to close | Then, by itself |
|---|---|---|
| CONTRACT_DOC · signed contract | the signed PDF (DocuSign / tap-to-sign) | opens the paperwork checklist asks for the brand + the PERMIT ask |
| CONTRACT_DOC · NOC / HOA approval / survey | the document, or a typed "not required because…" | each one green on the file's checklist; when all are green, PERMIT unblocks |
| PERMIT | permit number + the permit PDF | opens SURVEY ("Locate scheduled") for the office · pushes Sam/Laura: "permit is in, here it is" |
| SURVEY / locate | the survey PDF or the locate ticket number | opens MATERIAL + SCHEDULE for Jonathan |
| MATERIAL | the PO / order confirmation + expected delivery date | — |
| SCHEDULE (new, on the file) | the start date + crew | opens **TAKE THE JOB** for production · pushes Luis: "scheduled, needs a supervisor" |
| TAKE THE JOB | the supervisor's tap (the hand-off row) | the customer gets the machine's "Obed will text you the start day" |
| COMPLETION_SIGNOFF | ≥ N photos (brand rule) + the customer's reply or signature | opens INVOICE for Laura · pushes her: "field complete, photos attached, invoice it" |
| INVOICE | the Billdu / QB invoice id | opens PAYMENT with the due date |
| PAYMENT | the payment record (QB) | closes the file · triggers the review ask (Touch 4) |

Mechanics (rides step 2 of the scope): `ask_proof_rules(ask_type, proof_kind,
min_count)` + `ask_chain(on_type, opens_type, assign_rule)` as DATA, so Kevin
changes the chain without a build; `ask_settle()` is the only path that sets
`closed_at` (RLS denies direct UPDATE of `state`); the settle trigger inserts
the next ask, stamps the file's stage, and calls `rep-push` for the new
owner with the proof attached. The push is the "hey you got a new permit,
here it is" — but real this time, and on the phone the person already has.

## 6. Fixes that need no build (this week)

- **Restart the CC full task puller** (`backend/worker/cc_tasks_sync.py`,
  dark since 3 Aug) so the office room's day-one numbers are current.
- **In CC: retire Diana / Margaret / Autumn from every milestone template**
  (564 ghost tasks). Reassign to the Admin Team, not a person.
- **Uvoice users-and-DIDs sheet** → seed `rep_channel_map` for Jessica, Sam,
  Laura, Jonathan (which of 100/101/102 each answers) and Jermey (157).
- **The main line still on Heymarket: 199 customer texts in 30 days and we
  cannot see a single reply from it** (Appendix A — it is the company
  review-prompt line, all brands, not Oasis; 107 of the 199 need a person).
  Bring that number onto the Cloudmessage account like the other four so
  its replies land on the file, and record the 11 STOPs.
- **11 subs with expired insurance** on CC's board — production should see
  that before a crew is scheduled (Stratus refuses; classic does not).

## 7. What this changes in ONE-OS-SCOPE

- Step 2 gains: the paperwork checklist per brand (NOC / permit signature /
  HOA / survey) as CONTRACT_DOC asks opened by the signing; the answer clock
  + watcher pings (§5); the after-hours auto-reply.
- Step 4 (the office room) is the queue in §4, in Kevin's order, with the
  CC step name shown beside each ask so the office recognises it.
- The console's Collections door reads CC's AR aging (already in QB/CC feeds).
- Production room: CC work orders need a mirror (worker: `/workorders` from
  the classic API) so "Ready / Waiting / In Progress" is on the stage board
  until the hand-off rows replace it.


## Appendix A — every text on the Heymarket-fed main line, 14 Aug – 12 Sep 2026 (199)

Kevin, 12 Sep: "help me understand the missed oasis texts… could these be Mike's? please go thru all of them."

**What this line is.** All 199 arrived through ONE Heymarket inbox (90250) via the Zapier path — the company main texting line the office sends the review prompt from ("rate us 1–10"), NOT an Oasis line: 127 are Liberty Fencing customers, 28 Oasis, 10 Pro-Tech, 34 unmatched. By rep: Haakon 28, Gio 24, Ron 23, Matt 19, Eric 19, **Mike 15**, Travis 12, Tim 10. So no — these are not Mike's; Mike's number problem (the T-Mobile port) is a different thing.

**Why the audit read "97% never answered".** We ingest this line's INBOUND through Zapier and hold ZERO outbound rows from it, ever — Heymarket's replies are not in any feed we hold. 27 of the 199 got a reply we can see, all from Uvoice lines (Sam/office 102: 9, Haakon 154: 10, Travis 151: 2, Mike 156: 2, 100/101: 4). The rest may have been answered inside Heymarket, or not — we cannot tell, which is itself the finding: **a line the file cannot see is a line nobody is accountable for.** Fix: bring this number onto the Cloudmessage account like the other four (or turn the review prompt to send from the main lines), and STOP replies must set `customers.sms_opt_out_at` (306 adds the column; 8 STOPs below were never recorded).

### needs a person — 107

| When (ET) | Customer | Brand | Rep | Text | Reply we can see |
|---|---|---|---|---|---|
| 09-12 21:33 | ? …0876 | — | — | Is there anything you can do to improve this situation.  I had great expectations but at this point I would no | none |
| 09-11 16:02 | Royer, Garth …9778 | Fencing | Matt Vedder | Please send me your email address. I can forward it directly to you. | none |
| 09-11 16:01 | Royer, Garth …9778 | Fencing | Matt Vedder | And please forward the invoice and Leane waiver if you don't have it, I could resend it to you to sign that so | none |
| 09-11 16:01 | Royer, Garth …9778 | Fencing | Matt Vedder | Yes, the work looked excellent is there anyway that you can get me a photo of the signage of the site number?  | none |
| 09-09 15:21 | Nelson, Corazon …2918 | Fencing | Jared Heideman | Thank you for your service. I like my new fence. | none |
| 09-09 12:34 | Villeda, Lorena …3334 | Fencing | Travis Janke | Got it thanks so much for letting me know  | none |
| 09-09 11:59 | Duriseti, Rao …1860 | Fencing | Haakon Endreson | 1735 Barrow st,  Deltona,  FL 32725 | 09-11 12:24 ext 154 |
| 09-09 09:46 | Royer, Garth …9778 | Fencing | Matt Vedder | Please forward the photos  | none |
| 09-09 06:48 | Duriseti, Rao …1860 | Fencing | Haakon Endreson | Good morning.  Could we schedule a meet tomorrow morning instead, say 10 am. Thank you. | 09-11 12:24 ext 154 |
| 09-08 16:03 | Royer, Garth …9778 | Fencing | Matt Vedder | Please forward photos of repair at storage unit to groyer@towermrl.com | none |
| 09-08 12:17 | Baturla, Carol …1540 | Pro-Tech | Eric Payne | I have called the homeowner and gave them your number Laura | none |
| 09-08 12:02 | Manka, Jodi …7057 | Fencing | Ron Seidel | Hello I have not received a response to the missing cap. Please give me the contact information to the right p | none |
| 09-08 09:14 | seale, Ethan …8068 | Fencing | Travis Janke | We would like to move forward in the process | 09-08 09:22 ext 151 |
| 09-07 16:34 | Manka, Jodi …7057 | Fencing | Ron Seidel | After having to spray paint front sections of worn fencing that was installed I observed one of the top caps t | none |
| 09-04 08:34 | Krol, Carolyn …9389 | Fencing | Haakon Endreson | All they did was leave a card on door. I explained i couldn't be there due to high demand of my job and to hav | 09-04 11:11 ext 154 |
| 09-03 15:32 | ? …5788 | — | — | Hi Samantha need to give deposit to order fence please call me 518-365-7313 thx Fabio  | none |
| 09-03 14:33 | Monica, Shawn …4356 | Oasis | Tim Whitson | Everything went well with what was done and interacting with the gentlemen as well.  The only thing I would re | none |
| 09-03 13:42 | Hall, Brenda …7385 | Fencing | Matt Vedder | I am assuming that the city passed the fence  | none |
| 09-03 12:22 | pellegrino, kim …6606 | Fencing | Travis Janke | Sorry I thought I was | 09-03 15:06 ext 151 |
| 09-03 12:09 | Manka, Jodi …7057 | Fencing | Ron Seidel | A straight lined fence, not having overspray of black paint on my neighbors white fence pole not removing my g | none |
| 09-03 11:18 | Hatfield, Janice …1615 | Fencing | Eric Payne | I wasn't here throughout the entire job but from what I saw 👀 I would say an 8.  | none |
| 09-03 11:13 | Petitti, Tim …3616 | Fencing | Eric Payne | Hi, It's only been a day so im unsure on the workmanship but as of now it looks good. The workers worked hard  | none |
| 09-03 10:36 | Gower , Zachary …4564 | Fencing | Haakon Endreson | Yeah i think you have a wrong email. Ill do it from here thanks | none |
| 09-03 10:06 | Gower , Zachary …4564 | Fencing | Haakon Endreson | Hey good morning i havent received any link to pay for the fence. | none |
| 09-02 17:30 | Huey , Ed …9200 | Fencing | Gio Calderin | Please cancel any service calls. You may have scheduled for some reason. I don't know why the lock is working  | none |
| 09-02 13:02 | Krol, Carolyn …9389 | Fencing | Haakon Endreson | I can send you survey through email | 09-04 11:11 ext 154 |
| 09-02 13:02 | Krol, Carolyn …9389 | Fencing | Haakon Endreson | Carolyn krol 224 Dartmouth st deltona fl 32725 3866759389 | 09-04 11:11 ext 154 |
| 09-02 11:59 | Huey , Ed …9200 | Fencing | Gio Calderin | Just checking is he scheduled to come today to do the lock and if so, do you know about what time? | none |
| 09-02 11:52 | Krol, Carolyn …9389 | Fencing | Haakon Endreson | My apologies I've had HVAC installers attic insulate tree, trimmers, and my grown-up children coming in and ou | 09-04 11:11 ext 154 |
| 09-02 11:21 | Huey , Ed …9200 | Fencing | Gio Calderin | Ok. Once he's finished, I'll call in and give you a Credit Card number. | none |
| 09-02 09:35 | Schiffer, Jonathan & Willy …4397 | Fencing | Gio Calderin | That's ok very appreciated if they can just give 10 min heads up in case my dogs out is all  | none |
| 09-02 09:29 | Schiffer, Jonathan & Willy …4397 | Fencing | Gio Calderin | But will be home from noon on today | none |
| 09-02 09:04 | Huey , Ed …9200 | Fencing | Gio Calderin | Do you accept Zelle payments? | none |
| 09-02 08:44 | Huey , Ed …9200 | Fencing | Gio Calderin | You already sent me a quote for 185 which I accepted. Please put me on your schedule. | none |
| 09-02 08:15 | Schiffer, Jonathan & Willy …4397 | Fencing | Gio Calderin | Awesome thank you so much really relives worry and helps thank you  | none |
| 09-02 08:12 | Schiffer, Jonathan & Willy …4397 | Fencing | Gio Calderin | Absolutely thank you 🙏 I can pay cash or check and if it's before then I will be home  | none |
| 09-01 21:53 | Rosemark, Karen …1395 | Fencing | Ron Seidel | Haven't heard back. | none |
| 09-01 09:27 | Huey , Ed …9200 | Fencing | Gio Calderin | Please let me know when you're coming. We're usually home all the time. | none |
| 08-31 17:34 | ? …8774 | — | — | Temu: Tu codigo de verificacion es 266091. No lo compartas con nadie. | none |
| 08-31 14:50 | Huey , Ed …9200 | Fencing | Gio Calderin | Is this the locket that can be locked from the outside or the inside? | none |
| 08-31 14:34 | Huey , Ed …9200 | Fencing | Gio Calderin | No, unfortunately I don't know what I did with it when you get my age those things happen. I'm sorry. | none |
| 08-31 13:45 | Huey , Ed …9200 | Fencing | Gio Calderin | Also, if you can handle it, I trust you folks, so go ahead and put it on the schedule whenever you're ready to | none |
| 08-28 16:57 | Tallet, Joe …5496 | Oasis | Mike LeRoy | I gave your team every opportunity to complete. They failed.  | none |
| 08-28 11:31 | ? …8691 | — | — | all of our trees died with the frost. please do not include me on the list  | none |
| 08-28 09:15 | Keating, Darrell …3370 | Oasis | Mike LeRoy | I was going to write you today. The two palm trees you put in the front of our house are dying. Palm fronds ar | none |
| 08-28 08:45 | Shipman, Andrew …4252 | Oasis | Samantha White | Come back and resand and seal for free.. I have stuff growing up threw everywhere  | none |
| 08-28 08:04 | ? …7829 | — | — | Yes | none |
| 08-27 14:36 | Fiske, Pete …8292 | Oasis | Mike LeRoy | Jessica hi. Couple things. Had left Tim a text. Wanted to know if he wanted to remove one more tree. And. Funn | 09-02 09:11 ext 156 |
| 08-27 13:07 | ? …5788 | — | — | Ya if you could include this to job price as a add on but I will talk to painter find out a schedule so I can  | none |
| 08-27 13:05 | ? …5788 | — | — | Something like this | none |
| 08-27 13:04 | Rowley, Gary …0295 | Fencing | Ron Seidel | I already filled out one online yesterday | none |
| 08-27 13:01 | ? …5788 | — | — | Hi Eric this is Fabio I spoke with my painter that is doing my house she is going to remove the pieces of fenc | none |
| 08-27 11:37 | Montez , Jordan …9267 | Fencing | Haakon Endreson | And look forward to doing the rear and side fence later  | none |
| 08-27 11:37 | Montez , Jordan …9267 | Fencing | Haakon Endreson | Fence looks really good | none |
| 08-27 11:37 | Montez , Jordan …9267 | Fencing | Haakon Endreson | I have no complaints  | none |
| 08-27 11:37 | Montez , Jordan …9267 | Fencing | Haakon Endreson | A 10 | none |
| 08-27 08:36 | Abramovic, John …9586 | Fencing | Ron Seidel | Thank you. Have left two messages with HOA yesterday. I haven’t heard back from them | 09-03 08:09 ext 102 |
| 08-26 15:55 | Abramovic, John …9586 | Fencing | Ron Seidel | Please call me. This # I have for you won't accept phone calls. John Abramovic  | 09-03 08:09 ext 102 |
| 08-26 14:07 | ? …3353 | — | — | That should say 13 Senseney Path Palm Coast, FL 32164 | none |
| 08-26 14:04 | ? …3353 | — | — | 13 Senseney Path, Palm | none |
| 08-26 13:59 | ? …3353 | — | — | Here are the pictures I said I would send. I hope they help! | none |
| 08-26 13:13 | PATLIN , LESILE …7264 | Pro-Tech | Eric Payne | I do not feel comfortable with the results of your fixing my roof. | none |
| 08-26 08:48 | Morrison, David …0678 | Fencing | Haakon Endreson | Thank you, I do have a change in the gate design in mind. How do I contact Haakon? | none |
| 08-26 08:38 | Brown, Vidal, Linda …2564 | Fencing | Eric Payne | I signed a contract! You got my business! | none |
| 08-26 07:23 | Bibby, sean …1406 | Fencing | — | Still waiting on quote | none |
| 08-25 11:04 | BADLEY, JEFF …4533 | Fencing | Matt Vedder | Sorry. Sent that to wrong person.  | none |
| 08-25 11:03 | BADLEY, JEFF …4533 | Fencing | Matt Vedder | You are welcome. Are you open to new lender partners? | none |
| 08-25 10:13 | BADLEY, JEFF …4533 | Fencing | Matt Vedder | Good morning. I just paid the $1k through the portal. Thank you for everything | none |
| 08-24 14:00 | cardosa, manual …7968 | Fencing | Haakon Endreson | cardoso.manny@gmail.com | none |
| 08-24 11:13 | Hill, Christy …3430 | Oasis | Mike LeRoy | Sounds good. I'll call soon | none |
| 08-23 08:28 | Gower , Zachary …4564 | Fencing | Haakon Endreson | Oh wrong number sorry! Still waking up lol! | none |
| 08-21 10:57 | ? …1918 | — | — | Thanks Laura, I'll let you know shortly. | none |
| 08-21 10:34 | Anderson , Roseann & Jeff …7181 | Fencing | Gio Calderin | We went with someone else sorry | none |
| 08-21 08:44 | Bibby, sean …1406 | Fencing | — | I still haven't got the quote | none |
| 08-20 15:34 | Anderson , Roseann & Jeff …7181 | Fencing | Gio Calderin | Who is this? | none |
| 08-20 15:25 | Morales, Lorna …2232 | Oasis | Tim Whitson | No problem thanks for your prompt service  | none |
| 08-20 14:48 | Mesnard, Dan …5110 | Oasis | Mike LeRoy | I hope this helps  | none |
| 08-20 14:37 | Morales, Lorna …2232 | Oasis | Tim Whitson | Hello Jessica, to be honest I can't give you a ten, but the workers were ok, I offered them water which I happ | none |
| 08-20 14:35 | Marshall, Andrew …4351 | Oasis | Tim Whitson | Will be glad to complete a survey.  | none |
| 08-20 14:35 | Marshall, Andrew …4351 | Oasis | Tim Whitson | I don't recall the name of the young man in charge of landscaping, but he did an excellent job.  | none |
| 08-20 14:05 | ? …7266 | — | — | It's all good. I talked to the production manager and let him know me and 2 of my employees fixed it. Let Gio  | none |
| 08-20 12:49 | ? …7266 | — | — | And you can not put me on your website as a satisfied customer  | none |
| 08-20 11:30 | Zacapa, Nicole …7400 | Fencing | Ron Seidel | I will be there tomorrow | none |
| 08-20 11:30 | Zacapa, Nicole …7400 | Fencing | Ron Seidel | Í haven't seen it yet | none |
| 08-20 11:30 | Zacapa, Nicole …7400 | Fencing | Ron Seidel | Hi Jessica  | none |
| 08-20 11:24 | Kebreau, Jamel …2732 | Fencing | Travis Janke | Is Travis able to stop by today? | 09-01 12:26 ext 102 |
| 08-20 09:03 | ? …7266 | — | — | I did exactly what Gio told me to do before the fence was installed  | none |
| 08-20 09:00 | ? …7266 | — | — | Does that price include y'all removing the stump, putting in a new bottom rail and re cementing the post? | none |
| 08-20 08:42 | Rowley, Gary …0295 | Fencing | Ron Seidel | Because Ron was so professional, thorough and straightforward I didn't feel I had to look for other estimates, | none |
| 08-19 17:17 | ? …7266 | — | — | *since | none |
| 08-19 12:53 | Mashburn, Ron …9544 | Fencing | Travis Janke | No HOA approval required  | 08-21 09:26 ext 102 |
| 08-19 08:57 | Morris, Glenn …3369 | Fencing | Jared Heideman | Liked “Wonderful, thank you! I will head that way shortly. I am coming from our Cocoa office in Brevard County | none |
| 08-19 08:54 | Morris, Glenn …3369 | Fencing | Jared Heideman | Do you have a time in mind? | none |
| 08-19 08:53 | Morris, Glenn …3369 | Fencing | Jared Heideman | Yes, you can come by anytime. Gate code is 2021 | none |
| 08-18 14:44 | BADLEY, JEFF …4533 | Fencing | Matt Vedder | I signed the completion documents as well so you can get paid  | none |
| 08-18 14:34 | Fishman, Michael …1682 | Fencing | Haakon Endreson | Yes #5555 | 08-21 15:16 ext 102 |
| 08-18 14:24 | BADLEY, JEFF …4533 | Fencing | Matt Vedder | I'm available now to pay you if you want to call me | none |
| 08-18 13:26 | BADLEY, JEFF …4533 | Fencing | Matt Vedder | Hey Laura. I signed the loan docs. I told the lady job was complete. Please let me know next steps.  | none |
| 08-18 12:54 | COLON, HEIDY …1235 | Fencing | Ron Seidel | Just wanted to confirm you have the right email address since I haven't received the quote. Heidyvcolon@gmail. | 08-26 11:58 ext 102 |
| 08-18 09:40 | grave, Lorraine …8091 | Fencing | Matt Vedder | Your company was $1000 more than two other companies. I don't think I'll be going with you you charge too much | 09-12 13:47 ext 100 |
| 08-18 08:12 | ? …5829 | — | — | You have the wrong number. I don't need roofing.  | none |
| 08-17 15:21 | Kebreau, Jamel …2732 | Fencing | Travis Janke | That would be fine | 09-01 12:26 ext 102 |
| 08-16 21:01 | DONNA, DEBRA …8710 | Oasis | Tim Whitson | I need someone to call me  please  | none |
| 08-15 11:28 | Herbster, Steven …8449 | Fencing | — | Yes | none |
| 08-15 09:18 | ? …9610 | — | — | This is a test from Kevin  | 08-20 10:22 ext 101 |
| 08-14 23:16 | ? …9610 | — | — | This is Kevin and a test  | 08-20 10:22 ext 101 |
| 08-14 13:46 | Araujo, Joe …2530 | Fencing | Ron Seidel | Yes | none |

### review reply (1–10) — 45

| When (ET) | Customer | Brand | Rep | Text | Reply we can see |
|---|---|---|---|---|---|
| 09-10 15:34 | Long, Valen …9306 | Oasis | Mike LeRoy | I meant to say rate* we can't wait lol we have an HOA  | none |
| 09-10 12:06 | thompson, william …5032 | Fencing | Travis Janke | 5 Star | none |
| 09-10 11:23 | thompson, william …5032 | Fencing | Travis Janke | 10 | none |
| 09-10 11:23 | Brown, Vidal, Linda …2564 | Fencing | Eric Payne | 10, the young men were very nice and worked hard in the heat. | none |
| 09-10 11:19 | ? …4041 | — | — | 10 | none |
| 09-10 11:18 | Suarel , Elvin …1450 | Oasis | Haakon Endreson | 10 | none |
| 09-10 11:17 | Marion, Marie …9050 | Fencing | Ron Seidel | 10 | none |
| 09-09 13:58 | Fischer, Marcella …6504 | Pro-Tech | Eric Payne | 10! | none |
| 09-09 13:38 | Young, James …9875 | Pro-Tech | Eric Payne | 7 | none |
| 09-09 13:19 | Berg, Denise …2253 | Pro-Tech | Eric Payne | 10. They did an amazing job. Thank you.  | none |
| 09-03 16:29 | FANTARO , John …2370 | Fencing | Matt Vedder | 10 | none |
| 09-03 15:33 | Geyer, Russ …4789 | Oasis | Mike LeRoy | I would rate the overall service a 10.  I will admit that I was surprised yesterday when I pulled up to our ho | none |
| 09-03 14:03 | Broussseau, Brian …3642 | Oasis | Tim Whitson | 2 | none |
| 09-03 13:27 | Howard, John …1866 | Fencing | Haakon Endreson | Hey Jessica, we are extremely pleased so far. I would rate staff and workmanship a 10  | none |
| 09-03 13:24 | Artis, Jennifer …3077 | Fencing | Ron Seidel | 10😍 | none |
| 09-03 11:41 | YUAN , WANQUING …4547 | Fencing | Eric Payne | 10 | none |
| 09-03 11:27 | Manka, Jodi …7057 | Fencing | Ron Seidel | 5 | none |
| 09-03 11:17 | Mamary, Mark …3838 | Fencing | Haakon Endreson | 10 | none |
| 08-28 13:03 | Stokley, Michael …9096 | Fencing | Haakon Endreson | 10+++ | none |
| 08-28 09:02 | Fiske, Pete …8292 | Oasis | Mike LeRoy | 10:30 to 11 am on Wednesday works for me   Thanx | 09-02 09:11 ext 156 |
| 08-28 08:17 | Shipman, Andrew …4252 | Oasis | Samantha White | I would like to change my rating to 1 star | none |
| 08-27 15:44 | Brown, Judy …2876 | Oasis | Mike LeRoy |  10 | none |
| 08-27 13:12 | ? …5788 | — | — | Yes thank you it won't be long there starting next week I'm going to tell them to get both side done first so  | none |
| 08-27 12:58 | ? …9144 | — | — | 10 | none |
| 08-27 12:22 | Hiller, Chris …9522 | Fencing | Eric Payne | Hey Jess I would rate your staff as a 10 they really kicked ass in the heat. Taking down my old fence and putt | none |
| 08-27 11:52 | ? …5270 | — | — | 9 | none |
| 08-27 11:23 | BADLEY, JEFF …4533 | Fencing | Matt Vedder | Finished product is good. Had some issues from start to finish.  | none |
| 08-27 11:21 | Rowley, Gary …0295 | Fencing | Ron Seidel | 10 | none |
| 08-27 11:12 | aliev, izek …2581 | Fencing | Haakon Endreson | 9 | none |
| 08-20 15:36 | Gardner, Kendrick …0964 | Fencing | Eric Payne | 10 | none |
| 08-20 15:27 | Leiter, Amy …2005 | Oasis | Mike LeRoy | 10 for sure  | none |
| 08-20 14:49 | Silver, Russell …4555 | Oasis | Tim Whitson | Excellent rating all around.  Was hoping for new dirt or some mulch. But Excellent  looking plants. Excellent  | none |
| 08-20 14:36 | Segal, Danny …1278 | Oasis | Mike LeRoy | 10 | none |
| 08-20 14:31 | Bolton, Ken …6410 | Oasis | Tim Whitson | 5 | none |
| 08-20 14:29 | Heckman, Traci …9128 | Oasis | Mike LeRoy | 10 | none |
| 08-20 14:27 | Delrosario, Luis …8823 | Oasis | Mike LeRoy | 10 | none |
| 08-20 11:50 | Girardi, Matteo …9234 | Fencing | Matt Vedder | 10 | none |
| 08-20 11:38 | Domingez, Iris …1965 | Fencing | Haakon Endreson | My rate will be 10, they were punctual, respectful, efficient and very professional. My fence looks beautiful. | none |
| 08-20 11:33 | Foster, Richard …4670 | Fencing | Ron Seidel | 3 | none |
| 08-20 11:22 | Gill,  Charles …9120 | Fencing | Matt Vedder | 10 | none |
| 08-20 11:19 | Ferraro , Michael …3574 | Fencing | Jared Heideman | 10.    But you left materials here and my gate needs to be adjusted. I've already called twice on it. | none |
| 08-19 13:22 | Cogger , Robert …4767 | Pro-Tech | Eric Payne | 10 the staff was great | none |
| 08-19 13:18 | ? …3655 | — | — | 10 | none |
| 08-17 11:31 | Gezik , James …3970 | Fencing | Javier Negron | 7 | none |
| 08-16 21:01 | DONNA, DEBRA …8710 | Oasis | Tim Whitson | You don't want me to rate you | none |

### thanks / ok — 22

| When (ET) | Customer | Brand | Rep | Text | Reply we can see |
|---|---|---|---|---|---|
| 09-10 12:08 | thompson, william …5032 | Fencing | Travis Janke | You're welcome | none |
| 09-09 11:26 | Royer, Garth …9778 | Fencing | Matt Vedder | Thank you  | none |
| 09-08 12:26 | Baturla, Carol …1540 | Pro-Tech | Eric Payne | Thank you  | none |
| 09-03 10:38 | Gower , Zachary …4564 | Fencing | Haakon Endreson | Just paid it! Thanks | none |
| 09-02 09:52 | Schiffer, Jonathan & Willy …4397 | Fencing | Gio Calderin | Thank  you! Have a great day  | none |
| 09-02 09:27 | Schiffer, Jonathan & Willy …4397 | Fencing | Gio Calderin | Thank you!  | none |
| 09-02 09:03 | Michaels, Maryanne …8964 | Fencing | Haakon Endreson | 😊 | 09-02 12:56 ext 154 |
| 09-02 08:44 | Michaels, Maryanne …8964 | Fencing | Haakon Endreson | Thank you. Will be in touch. | 09-02 12:56 ext 154 |
| 09-02 08:42 | denisco, James …2897 | Fencing | Ron Seidel | Thanks | none |
| 09-01 16:01 | Huey , Ed …9200 | Fencing | Gio Calderin | Ok ty | none |
| 08-31 14:50 | Huey , Ed …9200 | Fencing | Gio Calderin | Ok.  Thanks let me know when  | none |
| 08-31 13:30 | Huey , Ed …9200 | Fencing | Gio Calderin | Ty | none |
| 08-29 07:53 | ? …7829 | — | — | Thanks 🙂 | none |
| 08-27 13:33 | ? …5788 | — | — | Perfect 👍 | none |
| 08-26 16:12 | Duriseti, Rao …1860 | Fencing | Haakon Endreson | Thank you  | 09-11 12:24 ext 154 |
| 08-26 14:55 | ? …3353 | — | — | You're welcome | none |
| 08-25 13:30 | Abramovic, John …9586 | Fencing | Ron Seidel | Thank you  | 09-03 08:09 ext 102 |
| 08-24 14:01 | thompson, william …5032 | Fencing | Travis Janke | You're welcome | none |
| 08-24 14:00 | cardosa, manual …7968 | Fencing | Haakon Endreson | Thank you  | none |
| 08-23 08:29 | Gower , Zachary …4564 | Fencing | Haakon Endreson | Perfect thanks! Have a good sunday! | none |
| 08-20 08:26 | ? …7266 | — | — | Thank you  | none |
| 08-18 16:21 | COLON, HEIDY …1235 | Fencing | Ron Seidel | He got back to me thank you | 08-26 11:58 ext 102 |

### STOP — 11

| When (ET) | Customer | Brand | Rep | Text | Reply we can see |
|---|---|---|---|---|---|
| 09-09 13:38 | Young, James …9875 | Pro-Tech | Eric Payne | Stop  | none |
| 09-08 08:46 | and PLUMBING, Annas air heat …6070 | Fencing | Eric Payne | stop | none |
| 09-03 08:50 | Moore, debbie …0481 | Fencing | Ron Seidel | STOP | none |
| 08-31 13:54 | Ji, Vi …9794 | Fencing | — | Stop | none |
| 08-28 22:36 | Hanke, Tracy …7775 | Oasis | Mike LeRoy | Stop | 09-01 14:35 ext 100 |
| 08-28 12:30 | ? …1258 | — | — | Stop | none |
| 08-28 08:16 | ? …7583 | — | — | STOP | none |
| 08-28 08:02 | ? …7812 | — | — | Stop | none |
| 08-24 08:47 | Sebastyn, jeff …9440 | Fencing | Matt Vedder | Stop | 09-10 15:13 ext 154 |
| 08-21 09:21 | heltvel, Kate …9889 | Fencing | Ron Seidel | STOP | none |
| 08-18 09:02 | Parchment, Lloyd …9450 | Fencing | Travis Janke | STOP | none |

### photo / empty — 14

| When (ET) | Customer | Brand | Rep | Text | Reply we can see |
|---|---|---|---|---|---|
| 09-10 12:37 | Schiffer, Jonathan & Willy …4397 | Fencing | Gio Calderin |  | none |
| 09-09 15:21 | Nelson, Corazon …2918 | Fencing | Jared Heideman |  | none |
| 09-08 11:41 | Baturla, Carol …1540 | Pro-Tech | Eric Payne |  | none |
| 09-08 11:35 | Baturla, Carol …1540 | Pro-Tech | Eric Payne |  | none |
| 08-31 11:50 | Huey , Ed …9200 | Fencing | Gio Calderin |  | none |
| 08-31 11:48 | Huey , Ed …9200 | Fencing | Gio Calderin |  | none |
| 08-31 08:31 | Schiffer, Jonathan & Willy …4397 | Fencing | Gio Calderin |  | none |
| 08-28 10:03 | GAGNON , TIM …8447 | Oasis | Mike LeRoy |  | none |
| 08-27 13:05 | ? …5788 | — | — |  | none |
| 08-26 13:59 | ? …3353 | — | — |  | none |
| 08-24 12:30 | thompson, william …5032 | Fencing | Travis Janke |  | none |
| 08-24 11:20 | Gonzales , Ismael …2643 | Fencing | Eric Payne |  | none |
| 08-21 08:53 | Kokensparger,  Michael …1406 | Fencing | — |  | none |
| 08-21 08:52 | Kokensparger,  Michael …1406 | Fencing | — |  | none |

