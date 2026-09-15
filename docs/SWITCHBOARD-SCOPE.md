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
