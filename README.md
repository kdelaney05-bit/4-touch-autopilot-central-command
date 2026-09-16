# The 4-Touch Autopilot Central Command

> **Start here:** [docs/GOSPELS.md](docs/GOSPELS.md) is the rulebook, in Kevin's words. [docs/LANES.md](docs/LANES.md) is where every thread of work stands.

The one place. Kevin's company platform for Liberty Fencing, Liberty Roofing,
Pro-Tech Roofing and Oasis Landscapes: one login, six rooms, and one customer
file under all of them. Named by Kevin, 13 Sep 2026.

Live: https://kdelaney05-bit.github.io/4-touch-autopilot-central-command/
Demo (a fictional book, every write refused): add `?demo=1`.

**The rule the whole thing is built under (Kevin, 13 Sep):** this is built
**beside Contractors Cloud, and nothing is switched over** — "get it built and
set and then slowly migrate safely." CC keeps running. Every door here is a
second door onto the same work, not a replacement, until Kevin says so.

## The rooms

- **The Business** (home) — the four brands, the funnel, who is waiting on an
  answer right now, and your Tagged-for-you list.
- **Sales** — the owner console's Sales section, live, plus the customers
  waiting on a rep. Doors to the rep app and Jermey's commercial desk.
- **Pipeline** — every rep's book on the selling side, broken down by
  stage the way the rep app files it: new leads, upcoming appointments, in
  touches (the 4-Touch clock), estimate out, signed, lost. Pick a rep, tap a
  customer, the file opens beside you.
- **Marketing** — the owner console's Marketing section, live.
- **Office** — every ask the field is waiting on, oldest first. An ask closes
  only on its input (the permit number, the photos, the date) and that input
  lands on the file. The **workflow map** lives here: every step of both
  Contractors Cloud templates, per brand, and what it became on our side. The
  machine's switches live here too, owner only.
- **Production** — the stage board: every sold customer, who holds them, how
  long they have held them. Take the job, assign, hand back. The supervisor's
  own board.
- **The Flow** — one scrolling timeline of everything moving through the
  lane, newest first, one color per person, the machine in gold, with the ten
  milestones across the top and how many files sit at each right now.
- **Files** — find anybody, open their file.
- **The customer file** — the spine under every room. One thread from the
  machine's first text to the final invoice, texts and emails together, any
  seat texting from the brand's main line, the asks with their clocks, the
  paperwork, and who touched it.

### The file's header

**Call · Text · Tag · + Document · Send to… · Invoice · Collect.** Call the
customer, text them from the brand's approved main line (a draft until a seat
presses Send, with a six-second undo after), tag the next person with a note
that pushes them and sits in their Tagged list, put a document on the file, or
hand the file to another seat. **Invoice** queues this job's invoice for
QuickBooks (`invoice_request`, 313).
**Collect** texts the customer the payment link (the `pay_link` office line,
316). Neither one fires by itself: the worker that creates the invoice sits
behind the `qb_invoices` switch, which is OFF, and the pay link goes out as a
text a seat presses Send on.

From any room, a customer's thread opens in a side drawer — you never lose
your place on a board to answer somebody.

### The village

The team rooms — **office · production · village** — beside the reps' sales
hype thread (which is untouched; the rep app reads its own feed exactly as
before). Anybody staff can post, react, reply, and point a post at a customer's
file — "grab this one". A post pushes that room's seats: office posts reach
office/admin/owner, production posts reach the managers, the village reaches
every staff seat. Kevin's words: "a shared village for all customers and all
employees… any team member can jump in and help."

### The New Job door

**+ New job** in the left rail opens a customer, a job, an appointment and the
signing checklist in **one** call (`job_create`). It dedupes on the phone
number, so the same customer keeps one file and all of their history. The lead
source dropdown is Contractors Cloud's own list for that brand, and the job
carries CC's `cc_lead_source_id`, so every console report keeps counting
whichever door the job came through. Nothing is written into CC.

## The laws

- **Cache-bust together.** `index.html` references `command.css?v=N` and
  `js/app.js?v=N`, and every `import` inside `js/` carries the same `?v=N`.
  Bump all of them in one commit, or a browser keeps one old module and the
  page loads **blank** — Kevin's first sign-in did exactly that.
- **No data, no secrets here.** A page, a stylesheet, a few scripts. Every
  number is fetched at view time with the signed-in user's own token.
- **Every outbound text or email is a draft until a person presses Send**, and
  the machine's texts stay behind switches that are all OFF.
- **Writes go through RPCs**, never a plain PATCH.

## Where the data lives

Supabase project **`lzegjjbkfuecrhdvlvay`** — the same database the phone app,
the crew app, the supervisor app, the commercial desk and the owner console
read. **Row-level security is the doorman:** the page asks for everything, and
the database returns only the rows that seat is allowed to see. The key in
`js/config.js` is a publishable key; it authorises nothing on its own.

Migrations, workers and edge functions live in `kdelaney05-bit/trureview-mobile`
(`C:\Users\kdela\OneDrive\Desktop\Commercial-Desk` is the current clone).

## Which migration backs which feature

| Feature | Migration |
|---|---|
| The stage, the hand-off, the proof chain (`ask_settle`), the answer clock | **306** |
| An ask never lands on a seat that has left | **307** |
| The office's pre-written lines on the file (`office_lines`) | **308** |
| The stage board computed once, so Chrome loads it | **309** |
| Stale jobs off the board, every old STOP recorded | **310** |
| A seat texts only from a campaign-approved line | **311** |
| Tag the next person: team notes, @mentions, push, Tagged list | **312** |
| The New Job door, the lead-intake door, `v_sellers`, the QuickBooks invoice queue (switch OFF), `invoice_request` | **313** |
| Door-made jobs carry CC's lead-source id | **314** |
| The new ask types: SOLD_CHECK · INTRO_CALL · MILESTONE · INSPECTION · CLOSEOUT | **315** |
| The whole CC workflow (brand-scoped chain, proof rules, the roofing chain, `cc_workflow_steps`), the village rooms, the pay link | **316** |
| The fence job on the file: `fence_jobs`, the packet proofs, the office packet email (`fence_packet_queue`), and the read the card and the NOC fill share (`fence_takeoff_for`) | **328 · 331–334** |
| The deposit + material lock (custom/aluminum = a card before material; stock waits on official paperwork) | **336** |
| The signature sets the visit: a customer signing on the estimate link pushes Gio and emails the rep, Gio and Kevin what the visit has to collect (no office ask, no office list: Kevin, 15 Sep) | **338** |
| The chain marches: a signature opens the office checklist and settles what the machine can; the checklist finishing IS paperwork official; no-permit addresses settle PERMIT themselves; material release opens MATERIAL for Jonathan; the date hands the job to Luis ("no humans does any thinking") | **340** |
| The locate: the Sunshine 811 ticket written from the file into the locate ask (Sam pastes it), the Exactix confirmation closes the step, every utility response lands on the file, ALL CLEAR when they have all answered | **341** |
| The crew work order: written from the file when the install date is set, emailed to Luis and the crew in Spanish and English with the drawing, one tap RECIBIDO on w.html lands on the file | **342** |
| Contractors Cloud production copied here hourly at :20 (work orders, material orders, contract costs, crews, suppliers) from the nested project routes | **343** |
| The Special Order Guide from Gio as rows: supplier, stock or special, deposit, lead time per product; gates over 5 ft are special; the material step names who to call and pushes Gio when he must approve; the day-before survey text (switch OFF until the voice pass) | **344** |
| The bills: `supplier_bills`, `v_bills_queue`, `bill_decide`, switches `bills_to_qb` · `bills_to_cc` (OFF) — the supplier invoice lands on the file, Jonathan approves | **365** |
| Sign everything, once: every active form on the signing link as a plain e-sign (`paperwork_forms.stage` = signing, `signing` = esign) | **366** |
| The NOC is the customer's errand: `noc_handoffs`, `noc_nudge_plans`, `noc_handoff_start/email/send/for/view/receive`, `noc_nudge_sweep` (cron, 30 min), switch `noc_notarize` (OFF), the chain no longer waits on the NOC; edge fn `noc-return` | **367** |
| Oasis signs the contract alone: `paperwork_forms.except_brands`; the packet honours it | **368** |
| The bills, the two flags and the move: read policy `is_office() or is_manager()`, `wrong_job` stays on `v_bills_queue`, `bill_rematch(p_id, p_customer)`, `bill_decide` guarded like `invoice_request` | **369** |
| Nothing waits at signing (a sibling session, the same evening, the same number): the contract settling opens PERMIT on Sam and MATERIAL on Jonathan at once, every brand; a calculator job releases its material at the signature; `machine_email_watchers` ride every machine email; the SIGNED note says what opened on whom | **369** (`369_nothing_waits_at_signing`) |
| The NOC handoff opens at the signature and the form rides in when the fill lands; the office nagged at 30 minutes; parcel-lookup fills the NOC without a county match | **370** |
| Luis hears it at the signature: the production watcher is pushed EXPECTED and rides the SIGNED note; a calculator job's SIGNED note carries its packet | **371** |

Next free migration number: check `schema_migrations` on live — sibling sessions number in parallel (371 applied as of 16 Sep ~7:20 PM; two migrations share the number 369 — `369_bills_queue_and_rematch` and `369_nothing_waits_at_signing`, both applied; next free 372).

## What Kevin and Jess change without a build

These are rows, not code. Edit the row, the app follows.

- `office_lines` — the pre-written texts (including `pay_link`).
- `ask_chain` — what settling one ask opens next, who is pushed, what the
  customer is told. Brand-scoped since 316.
- `ask_proof_rules` — what each ask needs before it can close.
- `cc_workflow_steps` — the workflow map's notes, owner and admin.
- `stage_seats` — who owns and who watches each stage, per brand.
- `brand_text_settings` — brand names, callback numbers, the review links.
- `automation_switches` — the switches, from the Office room, owner only.

## Working here

- No build step. Static files. GitHub Pages serves `main`; **push = deploy**.
- Preview: `npx -y serve -l 8091 -n .` then http://localhost:8091/?demo=1
- The scope and the audit: `docs/ONE-OS-SCOPE.md`,
  `docs/CC-UVOICE-WORKFLOW-AUDIT.md`. What the office's day looks like here
  against Contractors Cloud: `docs/THE-OFFICE-DAY.md`. What works tonight and
  what Kevin has to decide: `docs/MORNING-BRIEF.md`.
