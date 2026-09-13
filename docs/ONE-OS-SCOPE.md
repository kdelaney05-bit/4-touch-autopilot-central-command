# ONE OPERATING SYSTEM — the map and the build order (12 Sep 2026)

**Kevin, 12 Sep:** "can i add my owner console to all this… one place to go to
work and see all. owner dashboard, sales ecosystem live look-in for both retail
(foot soldiers) and commercial (inside fighter pilots / drone pilots)… our next
problem is communication with the job supervisor and the customer and office
admin who needs field stuff complete to invoice… put [supervisors] in their own
room to keep all their stuff and also to chat with the customer and inside
staff inside the customer file… lets integrate all these into one operating
system… owner console, sales ecosystems, admin ecosystems, production
ecosystems… all files self-contained with all customer info staying in file…
use our uvoice numbers to shuffle thru our funnel of support."

This doc is the audit of what already exists, what is missing, and the order
to build it. Nothing here is built yet. Migration numbers are NOT claimed —
next free on the live registry was 303 on 12 Sep; re-check before writing one.

---

## Status 13 Sep — what is built, what remains

Written the night of 13 Sep 2026. It supersedes "nothing here is built yet"
above: steps 1, 2, 4 and most of 5b of this scope shipped on 12–13 Sep, and
the app that holds them is **The 4-Touch Autopilot Central Command**
(`kdelaney05-bit/4-touch-autopilot-central-command`, GitHub Pages,
https://kdelaney05-bit.github.io/4-touch-autopilot-central-command/ ,
`?demo=1` for the fictional book). **Kevin's rule over all of it: built
BESIDE Contractors Cloud, nothing switched over — "get it built and set and
then slowly migrate safely."**

### Built

| Piece | Where | Migration |
|---|---|---|
| Stage on the file, hand-off rows, the proof chain (`ask_settle`), the answer clock | database + every room | **306** |
| An ask never assigns to a seat that has left | database | **307** |
| The office's texts on the file (Jess's Heymarket lines become `office_lines`) | Office room + the file | **308** |
| The stage board computed once (Chrome would not load it) | Production room | **309** |
| Stale jobs off the board + every old STOP recorded | boards | **310** |
| A seat texts only from a campaign-approved line | the file | **311** |
| Tag the next person — team notes, @First/@office/@production, push + Tagged list | the file + The Business | **312** |
| **Our own doors:** `job_create` (+ New job), `lead_create` + the `lead-intake` edge function (deployed, no Zap on it), `v_sellers`, `qb_invoice_queue` behind `qb_invoices` (OFF), `invoice_request` | app + database | **313** |
| Door-made jobs carry CC's `cc_lead_source_id`, so the console reports keep counting | database | **314** |
| Ask types for the rest of CC's templates: SOLD_CHECK · INTRO_CALL · MILESTONE · INSPECTION · CLOSEOUT | database | **315** |
| **The whole CC workflow** — brand-scoped `ask_chain`, proof rules for every new ask, the roofing chain end to end (1537 · 1563), INSPECTION and CLOSEOUT for fence/Oasis, and `cc_workflow_steps` (62 rows: every CC step and what it became) | Office room's workflow map | **316** |
| **The village** — `team_messages` · `team_reactions` · `v_team_room`, the office · production · village rooms beside the reps' hype thread; a post can point at a customer's file; pushes go to the room's seats | Home / Office / Production / Sales | **316** |
| Collect from the file — the `pay_link` office line | the file | **316** |
| The rooms themselves: The Business · Sales · Marketing · Office · Production · Files, and the customer file under all of them, with Call · Text · Tag · + Document · Send to… in its header | the app | 306–316 |

Next free migration number: **317**.

### Remaining

1. **Crew app — the Spanish tab** (step 3b): *Mi obra*, the SUPER lane, the
   punch list as checkboxes that settle asks with photos.
2. **Phone-app parity** — the rep app and the supervisor app do not yet know
   the new ask types or the stage; they show the old lanes.
3. **Office extensions 101 / 102** — which seat is which in
   `rep_channel_map`, so office calls and texts credit a person.
4. **CC task sync** — restart it, so CC's own tasks keep flowing while both
   systems run side by side.
5. **Retire the ghost names in CC's templates** — steps still assigned to
   people who have left (307 protects our side; CC's own templates do not).
6. **Seats without the app** — an alert when an ask lands on somebody who has
   never signed in, so nothing waits on a person who cannot see it.
7. **Import CC's files** — the documents already in Contractors Cloud onto
   our files.
8. **Repoint the lead Zaps** to `lead-intake` (built and deployed, nothing
   points at it yet).
9. **Turn the QuickBooks invoice worker ON** (`qb_invoices` is OFF; Billdu
   and QB stay by hand until Kevin says).
10. **Heymarket** — port the number (321) 252-5270 to Uvoice, export the
    contacts, then cancel.

The rulings in §6 below are still Kevin's to make, and the decisions waiting
on him tonight are listed in the app repo's `docs/MORNING-BRIEF.md`.

---

## 1. Where every surface lives today

| Surface | Who | Where the code is | How it ships | State |
|---|---|---|---|---|
| **Owner console** ("liberty-command") | Kevin | repo `kdelaney05-bit/liberty-command`, `index.html` (mirror: `console/index.html` here) | GitHub Pages on `main`, push = deploy | LIVE. Sections: THE BUSINESS · SALES · MARKETING · PRODUCTION · COLLECTIONS · PAYABLES + the Hustle / Commercial rooms |
| **Rep app** (retail, "foot soldiers") | 7 sellers | `App.tsx` (this repo) | TestFlight + App Store unlisted, OTA-first | LIVE, 1.0.4 / build 116 |
| **Commercial desk** ("fighter pilots") | Jermey | `desk/` (this repo) | gh-pages `/desk/` | LIVE |
| **Supervisor app** (the one on Kevin's phone from TestFlight) | supervisors, Gio | `supervisor-app/` — own binary `com.trureview.supervisor`, ASC app 6798487788 | EAS → TestFlight, v1.0 build 2 (6 Aug) | LIVE SEAT: Today (crew geofence) · Sites · Crews · Pay · LIVE FILES. Behind "VIEW THE DEMO": the six-tab vision (Babysit Board · Pipeline w/ punch lists · Customer Threads · Crew Threads · Pay · Crew Record) |
| Supervisor web demo | — | `liberty-command/supervisor/index.html` (28 Jul) | Pages `/supervisor/` | DEMO ONLY, superseded by the binary |
| Supervisor mode inside the rep app | Kevin only | `SupervisorMode.tsx` | rides the rep app | demo twin of `supervisor-app/demo.tsx` (change both) |
| **Crew app** | 11 crews (7 fence, 4 roofing) | `crew-app/` — own binary `com.trureview.crew` | TestFlight | LIVE since 10 Aug: geofence arrivals only |
| **Customer's door** | homeowners | designed in 091 (phone-OTP auth users, CHAT lane only) | — | **NOT BUILT** — only `e.html` (the estimate) and the `/f/` folder pages exist |

Clones on Kevin's PC (same repo, same `main`): `Desktop/Commercial-Desk`
(current, 302) and `Desktop/TruReview-Mobile-MVP/TruReviewMobile` (stale at
229 with UNCOMMITTED autopilot-engine work: `225_automations_engine.sql`,
`backend/worker/autopilot-engine.mjs`, systemd units — 225 is already burned
on main by another file's neighbour range; that work needs renumbering before
it can land). `C:\Users\kdela\trureview-mobile` named in CLAUDE.local.md does
not exist.

## 2. What is ALREADY one system (nothing to build)

- **One database.** Every surface reads Supabase `lzegjjbkfuecrhdvlvay` with the
  signed-in user's token; RLS is the doorman for every seat.
- **One job file.** `job_threads` keyed on the CC project (090), three lanes on
  the same file (091): **CHAT** (crew + supervisor + homeowner), **SUPER**
  (crew ↔ supervisor), **OFFICE** (staff only). Typed asks with an owner and a
  clock (`thread_asks.minutes_to_close`): SUPER = MATERIAL_REQUEST · SITE_ISSUE
  · SUPERVISOR_PING · SAFETY_JHA · **COMPLETION_SIGNOFF** · CHANGE_ORDER;
  OFFICE = SURVEY · PERMIT · **INVOICE** · PAYMENT · CHANGE_ORDER · MATERIAL ·
  CONTRACT_DOC. Attachments reference CompanyCam / storage, never duplicate.
  `JobFileLive.tsx` renders it in the rep app, Crew Mode, and the supervisor
  app — same component.
- **One text line.** Uvoice → `uvoice_sms_raw` (180) → `text_messages` (181),
  keyed to the customer by phone; extension names the seat (150–157 reps,
  100–102 office, per `rep_channel_map.uvoice_ext`). Rep copy wins (263). MMS
  on the line (300). The file's Texts thread draws them; emails ride beside
  them (293/294). Call / Text / Email buttons hand off to ConnectUC per rep
  (`reps.uvoice_live_at`, 182).
- **One arrivals ledger.** `crew_events` / `crew_sessions` (119), read by the
  supervisor's Today board and the console.
- **Seats already gated.** `supervisor-app/auth.ts` admits owner / admin /
  manager / office; RLS enforces regardless. Mike's manager seat over Oasis
  (`grant-mike-oasis-manager.sql`) is the precedent for a supervisor account.

## 3. What is MISSING for "one place, screen to screen"

1. **The shell.** The console has a PRODUCTION section but no door into the
   supervisor's live seat and no door into the desk; the rooms are separate
   URLs Kevin keeps in his head.
2. **The supervisor's room.** The live seat has Today / Sites / Crews / Pay;
   it has no punch list, no material-run queue, no "my board" — the SUPER lane
   asks exist in the schema but the seat never surfaces them as a queue. CC
   carries only `cc_has_work_orders` (a flag, no line items), so work orders
   are ours to hold.
3. **The stage and the hand-off.** Nothing on the file says WHO OWNS THE
   CUSTOMER RIGHT NOW. Sold → office → production → complete → invoiced → paid
   is derivable from CC stamps for some steps (`contract_signed_at`,
   `completed_at`, `fin_received_amount`) and not at all for "production
   started" (no CC start field) or "field complete, ready to invoice" (the
   admin's exact need).
4. **Routing the customer's text to the owning seat.** Inbound texts land on
   the file but nobody is pushed. `rep-push` exists (edge function); it does
   not know the stage.
5. **Supervisors on Uvoice.** No supervisor extension in `rep_channel_map`; a
   supervisor texting from ConnectUC lands as "house" (ext 100).
6. **The customer's door.** 091 designed it; no page exists. Today the
   customer's whole channel is the text line, which is fine for v1.

## 4. The design — the customer file is the spine, the seats are rooms off it

```
                    ┌──────────────── THE CUSTOMER FILE ────────────────┐
  customer ──text──▶│ Texts (Uvoice) · Emails · CHAT lane · Photos (CC)  │
  (one number,      │ SUPER lane (crew ↔ super) · OFFICE lane · Asks     │
   theirs)          │ STAGE + OWNING SEAT  ◀── new                       │
                    └───────┬──────────┬──────────┬──────────┬──────────┘
                            │          │          │          │
                        SALES       OFFICE    PRODUCTION  OWNER
                     rep app +    admin room  supervisor  console
                     desk         (asks by    room (board,  (every room,
                     ext 150–157  clock)      punch, runs)  every number)
                                  ext 100–102 ext 158+ new
```

**The funnel of support** (Kevin's "run our customers right down our funnel
line") is the stage on the file plus the seat that owns that stage:

| Stage | Set by | Owning seat | Overseer (Kevin, 12 Sep) | Customer texts go to |
|---|---|---|---|---|
| **ESTIMATE BOOKED** | a NEW appointment lands in `appointment-sync` | the machine sends ONE text from the brand's MAIN LINE confirming date + time (new, §4a) | sales manager | the rep |
| SELLING | job exists, no `contract_signed_at` | the rep | **sales manager** (Kevin today; console Sales room + view-as) | the rep (today's behaviour) |
| SOLD · OFFICE | `contract_signed_at` | office: survey, permit, paperwork, ordering | **admin** | office + rep cc'd |
| PRODUCTION | supervisor taps **TAKE THE JOB** (new hand-off row) | the supervisor | **ops** | supervisor + office cc'd |
| FIELD COMPLETE | supervisor closes **COMPLETION_SIGNOFF** (exists) → auto-opens **INVOICE** ask to office (new trigger) | office | ops → admin | office |
| INVOICED / PAID | Billdu / QB / CC `fin_received_amount` | office → closed | admin | office |

The overseer is a manager seat over a stage: the sales manager reads the
SELLING board (what Kevin does now), the admin reads the OFFICE asks queue and
the INVOICE line, ops reads the PRODUCTION board. Same `job_stage()`, three
lenses.

### 4a. The first text is the machine's, from the main line (Kevin, 12 Sep)

**Kevin:** "as soon as a new estimate arrives in our model, we send an automated
text confirming date and time. this will clear our disclosure thing early and
then all subsequent folks can use that shared number to text… all the way
down the line."

**Why it works.** The approved 10DLC campaign (1 Sep) appends the STOP/HELP
disclosure line under the FIRST outbound text of a thread and never again
(`backend/NURTURE-ENGINE.md` §2). A thread is (our number, their number). If
the machine's confirmation is the first outbound on the MAIN LINE's thread,
the disclosure rides that one text and every later text from any seat on
that line is a plain conversation. Exactly Kevin's read.

**The one correction to the picture.** 240's law: a number is on ConnectUC OR
on Cloudmessage, never both. The machine can only send from a Cloudmessage
number (the SMS rail, `sms-rail.mjs`), so the main line must live on
Cloudmessage — which means the seats do NOT reply to it from ConnectUC.
They reply **from the file**, over the same rail (`app_text_queue`, one tap,
6-second undo, `sms_outbox.rep_id` = who sent it, `from_number` = the main
line). Replies come back through the Cloudmessage webhook
(`cloudmessage_ingest`) onto the file. That is better than the ConnectUC
version: the file IS the inbox, nothing is copied, credit is exact, and it is
what 240 already built. **ConnectUC stays for calls.** Reps' own DIDs keep
working as today for reps who want their personal line during SELLING.

**The rule (rides step 2):**
- Trigger: `appointment-sync.mjs` inserts an appointment it has never seen,
  `starts_at` in the future, customer has a mobile, brand's main line exists
  and its 10DLC brand is registered (Fencing + Roofing yes; **Oasis waits on
  its registration**), no `sms_opt_out_at` on the customer (column to add —
  only `email_opt_out_at` exists today).
- Send: one `sms_outbox` row, `play='confirm'`, `from_number` = the brand's
  main line, `rep_id` = the house row (never a rep touch, never credited).
  Copy, Kevin's voice pass owed: *"Hi {first}, this is {Brand}. Your estimate
  is booked for {Tue, Sep 16 at 2:00 PM} with {Rep}. Reply here anytime."*
  The campaign appends the STOP/HELP line itself.
- Reschedule (appointment-sync already sees edits): one more text with the
  new time. Cancel: none in v1.
- Never twice per appointment (unique on `cc_appointment_id`).
- Kevin's 8 Sep "we won't automate the text" was about the four-touch;
  this is one confirmation, ruled 12 Sep. It does NOT enrol anything.

**Already settled in Kevin's Gmail, 10–12 Sep (found while drafting the
supervisor ticket):** the Cloudmessage loop was PROVED on the 386-276-6898
test line on 10 Sep ("text out from our app, reply comes back, lands on the
customer's file, rep's phone buzzes"), so the token is on the box. On 11 Sep
Kevin told Dwayne NOT to move Travis and ruled the shared-company-lines
model himself; on 12 Sep Jeff assigned the MAIN LINES to the Cloudmessage
account (`sms@libertyfencingfl.com`, relay webhook unchanged) and Kevin
confirmed them at 08:25 ET:

| Brand | Main line(s) on Cloudmessage | Campaign |
|---|---|---|
| Liberty Fencing | 386-276-6898 (386 customers) · 321-806-1995 (321 customers) | Liberty — approved 1 Sep |
| Oasis Landscapes | 321-274-4268 | Oasis — status asked of Jeff 12 Sep, unanswered |
| Pro-Tech Roofing | 321-352-6955 | Pro-Tech — being filed as Liberty Roofing Group, Inc. DBA Pro-Tech (EIN on the 10 Sep call); NOT complete |

So the confirmation text's only outside blockers are "the numbers are live
on the account" (Jeff to say) and, for Oasis and Pro-Tech, their campaigns.
Fencing can go first. `brand_sms_lines` seeds from this table.

Every hand-off is a row (`job_handoffs`: job, from seat, to seat, by, at, note),
so the console can read "how long did each seat hold it" — the same clock
discipline as `thread_asks.minutes_to_close`.

## 5. Build order (each step ships on its own)

**Step 1 — Rows, not code (a morning).**
- **The squad (Kevin, 12 Sep: "that's our whole squad"):** Kevin, Gio, Mike,
  Eric, Travis, Haakon, Ron, Jermey (sales); Jessica (admin + accounting
  lead), Sam(antha White), Laura (Schepp), Jonathan (Garcia — inside
  coordinator); **production: Luis Gonzalez (Regional Production Manager,
  roofing + fencing), Obed Santiago (field supervisor, Brevard + South),
  Gerardo Costas (field supervisor, Palm Coast / Volusia — Kevin's "Raul or
  something")**. All three have CC seats and `@libertyfencingfl.com` mail
  (092's `cc_users`). Open question: Robert Govea (Pro-Tec production
  supervisor since Feb 2026, in `cc_users`) — Kevin did not name him.
- Supervisor seats: `reps` rows with `role='manager'` +
  `manages_company_id` per brand (Mike precedent) for Luis, Obed, Gerardo.
- Supervisor Uvoice users: **ticket DRAFTED in Kevin's Gmail 12 Sep** (to
  support@uvoice.com, cc Jessica — one request per ticket, Dwayne's rule from
  the 10 Sep call): three ConnectUC mobile users, exts 158–160 if free, a
  voice DID each, caller ID "Liberty Fencing", voicemail to email, **no SMS
  on their DIDs** — their texting rides the shared main lines from the file.
  Kevin sends it. Extensions today: 150 Eric · 151 Travis · 152 Ron ·
  153 unnamed (Matt's, held for a future hire) · 154 Haakon · 155 Tim (gone)
  · 156 Mike · 157 Jermey; office 100–102.
- Once the exts exist: `rep_channel_map` rows so their CALLS resolve to
  them (the CDR feed); texts are credited by `sms_outbox.rep_id` already.
- The console's PRODUCTION section gets the door: a link tile to the
  supervisor seat's WEB build (supervisor-app already renders on web,
  `IS_WEB`), published to gh-pages `/supervisor/` in place of the July demo.
  SALES section gets the desk's door beside the rep-app web export.

**Step 2 — The stage and the hand-off (one migration + one push rule).**
- `job_handoffs` table + `job_stage(job)` function (derives the five stages
  from CC stamps + the hand-off rows + the sign-off ask). RLS: seats read
  their brand; owner reads all.
- Trigger: `thread_asks` COMPLETION_SIGNOFF → DONE opens an OFFICE INVOICE
  ask assigned to the office seat, with the sign-off photos attached. This is
  the "field complete to invoice" line the admin is waiting on.
- `uvoice-ingest.mjs` / `cloudmessage_ingest`: after inserting an inbound
  text, resolve the file's owning seat by stage and call `rep-push` for that
  seat (rep behaviour unchanged during SELLING).
- The confirmation text (§4a): `customers.sms_opt_out_at`, `brand_sms_lines`
  (brand → main line, registered flag), the appointment-sync hook, the house
  row on `sms_outbox`.
- The seats' send-from-the-file: the supervisor seat and the office room
  call `app_text_queue` with the main line as `from_number` (today it is the
  rep's `sms_from`; needs a per-seat or per-stage choice of line).
- **Input-required completion + the chain (Kevin, 12 Sep; audit §5b):**
  `ask_proof_rules`, `ask_chain`, `ask_settle(ask, proof)` as the only
  close path, the settle trigger opening the next ask and pushing its owner
  with the proof. The paperwork checklist per brand (signed contract, NOC,
  HOA, survey) opens on the signing. See `docs/CC-UVOICE-WORKFLOW-AUDIT.md`.
- **The answer clock (audit §5):** every inbound customer text starts a
  15-minute clock on the owning seat; 15 min → the stage's watcher (Luis /
  Jessica / Kevin+Gio); 60 min → Kevin; after 6 PM the machine's holding
  text from the main line. Targets 90% / 15 min, 98% / 1 h, zero over 24 h.
- The console's PRODUCTION section reads the stage board: every open sold
  job, which seat holds it, days in stage, red when a seat's clock is long.

**Step 3 — The supervisor's room (app half, supervisor-app + web).**
- **MY BOARD**: the jobs handed to me, stage chip, the SUPER asks open on
  each (the punch list IS `thread_asks` in the SUPER lane — no new table),
  material runs as MATERIAL_REQUEST asks with a "picked up" close.
- **TAKE THE JOB / HAND IT BACK** buttons write `job_handoffs`.
- **The customer tab**: the file's Texts + CHAT lane, send from my extension
  through ConnectUC (same hand-off as the rep app, `uvoice_live_at`).
- Sign-off: COMPLETION_SIGNOFF with required photos → the INVOICE ask fires.
- Spanish throughout (i18n.ts exists).
- **"Whatever they need from the app" (Kevin, 12 Sep):** photos + files to
  the folder — EXISTS (`JobFileLive` uploads to the `job-docs` bucket +
  CompanyCam); signatures — the tap-to-sign chain (129 `customer_signatures`,
  `estimate-view`) and the paperwork sheet (242, DocuSign) exist on the rep
  side and need the supervisor seat's button; payment — NOT WIRED, a
  processor is a business decision (the live seat says so on screen);
  invoices — Billdu/QB are the systems of record, the INVOICE ask is how the
  field tells the office, not a send button.

**Step 3b — The crews (Kevin, 12 Sep night: "crews should be easy, we can
just assign each crew its own login… messaging the crew and a supervisor
from the app… it's all right there").** 12 crew logins already exist
(`reps.role='crew'`, minted 9–10 Aug, Spanish card sheet). The SUPER lane
(crew ↔ supervisor) exists in the schema and `JobFileLive` renders it; the
supervisor app carries the Spanish strings. Build: the crew app gets a second
tab, **Mi obra** — today's assigned site, the SUPER lane thread with the
supervisor, the punch list as checkboxes that settle SUPER asks (photos as
proof), all in Spanish first. Geofence stays exactly as ruled (119's law).

**Step 4 — The admin's room (console section or the desk pattern, web).**
- OFFICE asks queue by clock: SURVEY · PERMIT · INVOICE · PAYMENT, oldest
  first, one tap to DONE, the file one tap away. Office texts from 100–102
  already on the file.

**Step 5 — The customer's door (later).** 091's phone-OTP page: their CHAT
lane, their photos, their schedule, their estimate, a pay link once a
processor is a decision. Until then the customer's door is the text line.

## 6a. One number for the customer, every department jumps in (Kevin, 12 Sep, later)

**Kevin:** "can we just attach this main number to all the connectuc numbers and
when the next dept jumps in they use the line we've already established… all
new numbers from our team can just jump in the thread in their job file task
lists."

**Yes, and both halves already exist on live:**

- **Our side — the file.** `text_messages` keys on the CUSTOMER's phone, not on
  which of our numbers they texted. Whatever DID a text rode, it lands on the
  same file's Texts thread. So the file is one thread already.
- **The customer's side — one number in their contacts.** Uvoice SHARED LINES.
  Every rep DID is already shared to Kevin's ConnectUC user (Uvoice's own
  sheet, 10 Sep: "SMS Shared (to CUC user): Kevin"), and a send from a shared
  line arrives at our webhook prefixed `[NNN]` with the sending extension —
  the ingest already strips it and credits that extension (181/263). That is
  the exact mechanism for "the next department jumps in on the same line": a
  MAIN LINE per brand, shared to every seat's ConnectUC user; the customer
  texts one number forever; whoever replies is credited by extension on the
  file.
- **The "task lists"** are `thread_asks` per lane — already there.

**Superseded the same day by §4a:** the shared-ConnectUC-line version cannot
carry the machine's first text (240's law: a number is on ConnectUC or
Cloudmessage, never both). The main line lives on Cloudmessage; every seat
texts from the file over the rail; ConnectUC keeps the calls. Kevin had
already ruled exactly this with Dwayne on 11 Sep and Jeff assigned the four
main lines on 12 Sep — see the table in §4a.

**How the hand-off reads on each side (Kevin's question, 12 Sep evening):**
the customer keeps ONE thread from ONE number (the brand's main line) from
the confirmation text to the final invoice; every seat sends from the file
on that line and signs the text with their first name ("Sam at Liberty
Fencing here…"); every hand-off is announced by the outgoing seat ("Obed,
our supervisor, will text you the start day"). On our side the thread lives
on the file, everyone connected to the file can read all of it forever; what
changes at a hand-off is WHO IS PINGED (the owning seat, then the watcher at
15 min), not who can see. A non-owner who answers anyway is credited. Open
Uvoice question: can outbound caller ID on office/supervisor extensions show
the main line, so calls and texts are one number to the customer?

**Trade-off to rule on:** during SELLING the rep's own number carries the
relationship (the four touches are personal). Option A: the confirmation and
the customer's replies ride the main line, the rep's own four touches ride
his DID (two of our numbers in the customer's phone). Option B: main line
from the first text, the rep sends his touches from the file on it (one
number forever; credit by `sms_outbox.rep_id` is exact). B is Kevin's stated
wish. The file is identical either way.

## 6. Rulings needed from Kevin

1. **Shape of "one place":** the console is the owner's one place, and the
   other rooms open from it as web doors (desk, supervisor web seat, admin
   queue) — recommended, no new binary. OR a fourth native app that holds
   every seat behind role. (The three-binary ruling of 5–6 Aug argues for the
   first.)
2. **Who the supervisors are** (names, brands, phones) so seats and Uvoice
   extensions can be minted. Gio's fence crews' supervisor(s) first?
3. **Does the office seat = Jess?** Which extension is hers (100 / 101 / 102).
4. **Hand-off is manual (TAKE THE JOB) or automatic on `contract_signed_at`
   to a per-brand default supervisor?** Manual recommended for the first
   month so the clock is honest.
