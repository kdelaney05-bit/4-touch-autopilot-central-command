# The Switchboard — one place every word lands

Kevin, 15 Sep 2026, after looking at the first mockup: *"If everybody's
involved here, including the customer, and everybody sees everything, there's
zero reason that anything goes unresponsive, unresponded to."* And on the
order of work: *"It's almost like let's start with the playground and then
build the school around it. Let's start with the playground."*

The Switchboard is the message layer under all six rooms: the customer's
texts, the office's private notes, the rooms, the direct lines and the subs,
in one rail that never closes. Mockup (clickable, fictional book):
https://claude.ai/artifact/7m5CaKCigjvzFsLyWgceLs

## Linked conversations — where this thread lives, 15 Sep 2026

Kevin: "can we link all these conversations please? I just did the same in
another." Same subject, several rooms. Every one of them is here so the next
session starts from all of it, not one of it.

| Where | What it holds |
|---|---|
| **This session — "CRM chat room UI design"** (`session_01Tg41ydDEZ5KWJas2eUu37J`) | The Switchboard mockup (https://claude.ai/artifact/7m5CaKCigjvzFsLyWgceLs), The Biopsy (https://claude.ai/artifact/1TdqaMBrXJ2V3k2qrHwT9M), The Line room (v39 → v46 on `main`), migration 346 direct lines (`trureview-mobile`, branch `claude/ecstatic-johnson-z7180f`), this doc, `THE-OUTSIDE-WAIT.md`. |
| **"Jetstream on steroids"** (`session_01E1AscsceFGrT2svxLgKYdc`, branch `claude/hopeful-ritchie-t4n04t`) | `docs/jetstream-on-steroids.html` on `main` (commit d1efd15) — the same one-chat CRM as a clickable picture, sign in as each person. Its **who-sees-what table** and **manager loop** are the rules The Line's lane switch now encodes. |
| **"Unified customer management system"** (`session_01UBtRcgQ94S8U8bKyZKxqF2`, 15 Sep 15:35) | Kevin's "I just did the same in another." Its transcript is not readable from here; whatever it decided should be reconciled against this doc, not built twice. |
| **"Liberty CRM"** (`session_01YYpQm5VczMsKQpP53Cuobh`, `trureview-mobile` · `claude/slim-claude-md`) | The CRM from the database side, same day. |
| **"Email from Ron"** (`session_01X6JD43oMWhEGRwf2BLQN25`) | **The phones.** Jess, 15 Sep: "Is kev aware that all calls go to vm?" Travis: "showing up private number." That session drafted the emergency Uvoice ticket and is waiting on Kevin to call Dwayne with five action items. No chat surface fixes a phone that does not ring — gospel 19 makes this priority zero for her team. |
| **Jess's own words, in Gmail** | "TEXTS" (14 Sep — *"How can I only receive texts that I need (office lines)? I am still getting every text from sales"*, Uvoice ticket T20260914.0006); "oasis calls" (14 Sep — rings once and stops, T20260914.0009); "reviews" (14 Sep — Claudette's 1–10 rule, below); "#Lead - Bedard, Brian" (15 Sep — calls to voicemail). |
| **Uvoice tickets this week** | T20260914.0003 (three production users), T20260914.0016 / .0017 / .0018 (Mike's DID, Gustavo's line), T20260915.0003 (robocalls + voicemail-to-email off on rep extensions), and the **Gio voice-line draft** sitting in Kevin's Gmail drafts (15 Sep). |
| **The office's day** | `docs/THE-OFFICE-DAY.md` — the office's four inputs beside CC's ten tasks; gospels 19–21 (the phone is human · take the paper off the humans, never the conversation · the people-happy business). |

⚠️ **The conversation Kevin had with Jess** ("really good insight to what her
team needs") is **not written down anywhere this session can reach** — it was
spoken, or it lives in a session whose transcript is not exposed. What follows
is her team's needs assembled from her own emails this week and the Jetstream
table. The two or three things she actually said belong at the top of the next
section the moment Kevin repeats them.

## The texting thread with Jess — found (migration 308, 12–13 Sep)

Kevin, 15 Sep: "look for another session I had with Jess about the texting…
she wants her people to be able to do it." The session list only reaches
today, but the thread left its record in `trureview-mobile`:
`backend/migrations/308_office_lines.sql` — Kevin, 13 Sep: *"i don't think we
need heymarket any longer… all outbound marketing, i'll take that over in
here… easy. build it."* Heymarket's four weeks (527 sent, 240 back, 11 STOP)
became rows: **`office_lines`** (Jess's wording verbatim — the review prompt,
the five-star follow-up, the lead reply, permit approved, on the schedule,
the invoice, the pay link), `brand_text_settings` (per-brand name, trade,
callbacks, the Google review link), `line_render()` / `line_preview()`, the
machine's copies on the chain behind `office_machine_texts` (OFF), STOP →
`sms_opt_out_at`, a 9 or 10 after the review prompt → the five-star link,
`payment_reminder_sweep` at 30 days. Handoffs: `docs/HANDOFF-2026-09-14.md`
(the shared line is 386-276-6898) and `docs/UVOICE-LINE-CHECK-15SEP.md`.

**So her people can text a customer today, from the file, in her own
words.** What was missing is what Kevin described next — doing it from the
playground without opening the file.

### SAY IT — built, v47

Kevin, 15 Sep: *"you should have the ability to send it to whichever employee
you want about whichever customer you pick. So it's a drop down box either by
their address or last name. So a thousand ways to quickly get this out."*

One box at the top of The Line, above everything:

1. **About** — type a last name, a street, or a phone number. The customer
   search now matches `name` OR `street` (customers carry street · city ·
   zip), and the row shows the address so a "Cox" is never a surprise.
2. **To** — two lanes. **A person**: a dropdown of @office · @schedule ·
   @production · @rep · @invoice and every seat by first name. The note lands
   on that customer's file with the @mention and 312 does the rest — the push
   and their You're up. **The customer**: a text from the brand's approved
   line (311, `file_text_queue`), with **Jess's office lines as one-tap
   presets** the moment a customer is picked (`line_preview`).
3. **Send.** The file opens beside you after: the text sitting with its
   six-second undo, or the note where it landed.

Nothing here is a new write — both doors already existed on the file. The
composer is the file's own tag box and Text button, reachable without the
file. The typed text survives rail clicks (module state), a ref-style busy
guard holds Send (b80), demo refuses politely.

## The office's seat — what Jess's team needs

Sam, Laura, Jonathan, and Jess over them. The Directors of First Impressions
(gospel 19). Every item below names its source and what it becomes on the
screen.

| What they need | Where it came from | On the screen | State |
|---|---|---|---|
| **Text the customer from here, in her words.** | 308 (Jess's Heymarket lines → `office_lines`) · Kevin 15 Sep, the dropdown by name or address | **SAY IT** at the top of The Line — pick the customer by last name / address / phone, pick a person or the customer, her lines as presets, Send. | **Built, v47** |
| **Their lane, not everyone's.** *"I am still getting every text from sales."* | Jess, 14 Sep, TEXTS ticket · the Jetstream table (*Sam: files at an office step, plus any file she is tagged on*) | **THE LANE** on The Line's rail: an office seat lands on files at an office step (sold · invoiced · paid) plus anything they are tagged on; production lands on scheduling-or-later; a rep on their own book. **Everything** is one tap away — open by default still stands, the seat just lands on its own work first. | **Built, v46** |
| **A phone that rings.** *"Is kev aware that all calls go to vm?"* | Jess + Travis, 15 Sep · Jess, 14 Sep (oasis rings once) | Nothing on a screen fixes this. It is the Uvoice emergency in the "Email from Ron" session — Kevin calls Dwayne with five items. Until it is fixed, every other line on this page is second. | **Blocked on the phone company** |
| **Jess looped in when Sam is tagged.** | The Jetstream table's *manager loop* (tag Sam → Jess is in; tag Obed → Luis; tag a rep → Gio; the tagger stays until it is handled) | The tag composer on the file shows the loop as it types — *"Sam · Jess is looped in"* — and the push goes to both. A small rules table (who is looped with whom), edited as rows like the seats. | Designed · needs a rows table + the push fan-out |
| **The review at paid-in-full.** *"Claudette asks 1–10 once paid. 9/10 → Google link. 8 or below → how do we make it a 10."* | Jess, 14 Sep, "reviews" | The `review_prompt` office line already exists (*rate the staff and workmanship 1–10*). At stage PAID the file's NEXT line offers it; the reply routes itself: a 9 or 10 queues the Google-link line as a draft, an 8 or under opens an ask on Jess with the customer's words on it. **Rows, not code** — office lines + one chain step, Kevin and Jess edit them. | Rows to add · nothing built |
| **The customer on the screen before hello.** | Gospel 20: *"the customer's source, last text and file on the screen before they say hello"* | The screen-pop: an inbound call on an office line opens that customer's file in the drawer with source, last text and NEXT. Needs the one thing being on Uvoice was supposed to buy — the call event feed. Same gap The Biopsy names. | Waits on the Uvoice call feed |
| **"Where is the permit" stops being a phone call.** | Jetstream: *the thread says "Now: permit, waiting on the county, 4 days"* · THE-OFFICE-DAY | Exists: the NEXT line on every file. What The Line adds is the customer never having to ask — it is the second most-asked question on the bottleneck board, and `THE-OUTSIDE-WAIT.md` is the plan to answer it by machine. | NEXT line exists · machine answer designed |
| **Getting help without walking over.** | THE-OFFICE-DAY: *post in the office room, tag the person, or send the file to their board* | The Office room in the rail, tags, direct lines (346), Send to… on the file. | Rooms + tags live · direct lines await 346 |
| **A name and a color on every bubble.** | Jetstream: *one color per person the day they join, everywhere* | The Flow already does this (one color per person, the machine in gold). The Line's bubbles should read the same palette. | Small · after 346 |
| **Listen.** | Jetstream: *Kevin's switch on any thread — on means every message pings his phone* | A per-thread toggle on the file header for owner seats; a `thread_listeners` row per (thread, seat). | Designed · needs a rows table |

## The three moves

1. **Nothing is "just a chat."** Every thread hangs on something — a customer,
   a job, a department, a person, a sub. There is no loose message anywhere,
   so nothing can be filed wrong: it was born attached. This is gospel 4 (the
   file is the hub) applied to every word anybody types.
2. **One thread, two lanes.** The customer's texts and the team's private
   notes live in the same scroll, in order, coloured differently — gold edge
   reached the customer, dashed never will. The file's two composers become
   one box with a switch, and the switch is the loudest thing on the screen.
3. **One box, everybody in it.** Owners, office, production, every rep, every
   sub, and the machine — one roster, one tap. A sub with no login gets the
   same thread as plain text messages.

## Kevin's four rulings, 15 Sep 2026

| Ruling | His words | What it means |
|---|---|---|
| **Subs keep text** | "Subs keep text." | No sub login, ever. The roster reaches them over the existing approved-line text rail (311); photos they send land on the job. Nothing to install, no password to forget. |
| **The customer stays on plain text** | "Keep the customer on plain text." | No customer portal in v1. No customer-facing thread, no login. The tracked-link rail already tells us when they open something. |
| **Internal email is dead** | "Kill the email internally." | Nobody inside the company emails anybody inside the company again. Outside email (county, carriers, suppliers) keeps flowing but lands **in the file's thread** like a text does. |
| **Open by default** | "Open by default. Zero reason anything goes unresponded to." | Every seat reads every room, every file, every question on the board. |

### The one wall that does not come down

**The customer never sees the inside lane.** "Everybody sees everything" means
everybody *in the company*. The dashed notes — hold the deposit, he's moved
three times, don't schedule this one — stay invisible to the person they are
about. That is why the composer has a switch instead of one box.

Two narrower ones, Kevin's to overturn: **pay and commission stay own-only**
(already true, different rail), and **direct lines stay private** — with the
rule that anything about a job gets a file hung on it, so the note lands on
the customer anyway.

⚠️ Open-by-default **widens the privacy constitution** in trureview-mobile's
`CLAUDE.md` (24 Jul 2026), which keeps another rep's book private. Kevin's
15 Sep ruling supersedes it for the message layer. It has **not** been applied
to the rep app's own book reads — that is a separate decision and a separate
migration.

## Nothing goes unanswered — the escalation ladder

Everybody seeing everything is only half of it. The other half: an unanswered
question gets louder on a clock, and the last stop is the whole company.

| When | What happens |
|---|---|
| **Minute 0** | It lands on a name — the person it is for, in their **You're up**, with a push. |
| **1 hour** | It posts itself into that department's room, named. Four people can now answer it. |
| **4 hours** | It climbs onto **Nothing goes unanswered**, at the top of *everyone's* rail. No manager has to notice — everybody already did. |
| **Never** | Nothing ages off. A question leaves the board when somebody answers it, or hands it to a name **with a reason** — and the reason goes on the file. |

The scoreboard is **how long the oldest unanswered thing has been sitting** —
never how many messages anybody sent (gospel 12: effort = success, but the
receipt is the customer coming back, not the typing).

Open-by-default is what gives the four-hour stop teeth: when it lands on the
company board, everyone can actually answer it.

## Where it sits — not a tab, the furniture

The Switchboard is the **left edge of Central Command on every screen**. The
eight rooms open beside it, unchanged. Switching rooms never disturbs the rail
or the thread you were reading.

```
[ The Business · Sales · Pipeline · Marketing · Office · Production · Flow · Files ]   ⌘K
┌────────────┬──────────────────────────────┬──────────────────┐
│ SWITCHBOARD│  the room you picked          │ the file, on tap │
│ always here│  (the eight rooms, unchanged) │ slides in / out  │
│ You're up  │                               │                  │
│ Unanswered │                               │                  │
│ Files·Rooms│                               │                  │
│ People·Out │                               │                  │
└────────────┴──────────────────────────────┴──────────────────┘
```

On a phone the rail is the home screen and the rooms live behind the menu —
the reverse, because on a phone answering people *is* the job.

Three ways in, and no fourth: **the rail** (always visible, longest wait on
top), **⌘K** (any customer, person, room or sub in two keystrokes, mid-
sentence in something else), **the push** (opens straight into that thread,
not the app's front door).

## The five kinds of thread

| Kind | Hangs on | Notes |
|---|---|---|
| **File thread** | a customer | The spine. Texts, emails, notes, documents, asks, stage moves — one scroll. Exists today in `js/file.js`; what is new is that notes and texts stop being two lists. |
| **Room** | a department | Office · Production · Sales hype · the Village. Exists today as `team_messages` / `v_team_room`. |
| **Direct line** | a person | New. The only private thread. Rule: anything about a job gets a file hung on it. |
| **Outside line** | a job, for someone outside | New. Subs and vendors over the text rail, scoped to the jobs they are on. |
| **You're up / Unanswered** | you / the company | Not threads — queues, built from the tags, the unanswered customer texts and the asks past their clock. |

**Write once, land twice.** A message written in a room, a direct line or an
outside line that points at a customer is *the same row* the file shows — not
a copy, not a sync. One table, many doors.

## Everybody in the entity

The roster is a door, not a settings page: 12 seats, 9 subs, and the machine.
Every row has **Open a line** and **Put on \<the file you have open\>** — and the
second is the better move, because the answer lands on the customer instead of
in a private chat.

**The reps are in the same box.** A rep has a direct line, sits in the village,
reads the rooms and writes on his customers' files like anybody else. He keeps
the hype thread, which does not change. What stays his alone is his *book*, not
his messages.

**Presence says where, not green.** "Samantha is at the Palm Bay building
department" answers the only question anybody is actually asking — can she
answer me in the next ten minutes. On a roof · at the county · in the truck ·
at the desk · between appointments.

## What exists already, and what is new

| Piece | Today | State |
|---|---|---|
| The file thread | `js/file.js` — texts, emails, notes, docs, asks, stages already in one scroll | Half |
| Department rooms | `team_messages` + `team_reactions` + `v_team_room` | Half |
| Tag the next person | 312 — @office / @production / @First, push, Tagged list | Have it |
| Asks with clocks | the chain, proof rules, brand-scoped | Have it |
| Texting a customer | `file_text_queue`, approved line (311), draft-until-Send, six-second undo | Have it |
| The rail & You're up | nothing — every room is entered from the nav | New |
| Direct lines | nothing | New |
| Outside lines (subs) | nothing — subs are numbers in somebody's pocket | New |
| Jump to anything (⌘K) | customer search exists in the composer and the nav | Widen |

## Build order — playground first

1. **The rail, on every screen.** Built from what exists — file threads, the
   three rooms, the tags. No new tables. The day it lands, nobody hunts.
2. **One composer, two lanes.** The file's two boxes become one with a switch.
3. **Everyone, and direct lines.** The roster with presence; seat-to-seat lines
   with the hang-a-file rule. Reps from day one.
4. **Nothing goes unanswered.** The clock, the three stops, the company board.
   Last because it needs the first three to mean anything.
5. **The outside line.** Subs on the existing text rail, scoped to their jobs.
   Last because it is the only piece that touches people outside the building.

Built beside Contractors Cloud, switched over nothing, through all five.

## Best practice we took, and what we left

- **AccuLynx** — take: two-way texting from inside the job, every message
  auto-logged to the file; reactions so an acknowledgement costs nothing.
  Leave: customer texting and team notes are still two motions; their sub
  portal needs a login, and our subs will not keep one.
- **Salesforce Chatter** — take: the record *is* the room; @mention on the
  account and it stays on the account forever. Leave: the @mention fires an
  **email**, which puts the conversation back where it started.
- **Procore** — take: subs are first-class, scoped to one project; every
  question is a numbered item with a clock (our asks). Leave: ten fields to
  ask a question; our crews text or do nothing.
- **Slack / Teams** — take: jump to anything in two keystrokes; read state
  that means something. Leave: nothing attaches to a customer, so six months
  later the answer is in a channel nobody can name. That is the failure we are
  building against.
