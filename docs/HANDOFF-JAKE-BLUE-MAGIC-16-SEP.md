# Handoff — Jake's Terminator ("Blue Magic"), 16 Sep 2026, end of Kevin's first account

Kevin moved to a second Claude account (kdelaney05) on 16 Sep. This page says
where the Jake work is so the next session picks it up cold. It sits beside
`docs/HANDOFF-16-SEP.md` (the Bills lane). Everything named here is PUSHED to
GitHub; nothing lives only on a machine.

## What it is

Jake Malesh sells commercial laundry equipment for Steiner-Atlantic (Milnor,
Dexter, B&C, LG, Chicago), Jacksonville to Port St. Lucie, a one-man shop. He is
test customer #1 for the 4-Touch Autopilot in another industry — "does our model
work with anyone in B2B." Kevin's brief: "prospect, bug, attack, win, repeat…
his b2b sales virus… only what he needs… I want to be the copilot." The desk is
named **Blue Magic** on its own screens; Kevin's name for the project is "Jake's
Terminator."

## Where the code is

Repo `kdelaney05-bit/trureview-mobile` (the residential + commercial repo; the
local clone is `C:\Users\kdela\OneDrive\Desktop\Commercial-Desk`).

| Piece | Path | State |
|---|---|---|
| The desk (static app, no build step) | `jake/` — `index.html`, `app.js`, `lines.js` (54 line sets in Jake's voice), `app.css`, `api.js` | **PR #427**, branch `claude/jake-sales-virus`, OPEN, not merged |
| His own backend (one Supabase project per client) | `b2b-kit/schema.sql` (applied 14 Sep), `b2b-kit/schema_v2_coach.sql` (**NOT applied** — the hunt columns, the six doors, `coach_notes`), `b2b-kit/functions/kit/index.ts` (deployed v1: texting via Uvoice/Cloudmessage, replies + STOP, call log, tracked links, BCC'd-quote capture), `b2b-kit/README.md` (the org/member inserts) | project `aewxegrjxgpxxmkpwltd` "jakes-desk", $10/mo on Kevin's Supabase org |
| The write-up and the playbook | `docs/JAKE-B2B-FIT.md` (the fit verdict, territory numbers with sources, rail costs, the 15 Sep build), `docs/B2B-PLAYBOOK.md` (the per-client checklist, ~$80–95/mo per client) | on the PR branch |
| The films | `tools/video/` (`record-prospecting.mjs` + `narrate.mjs` + `gen-voice.mjs` + `mux-voice.mjs`; the Guy neural voice via `msedge-tts`, no key) and `tools/ride-along/` (the spec-driven Ride-Along maker) | on the PR branch; the first cut "Blue Magic - Ride-Along.mp4" (4:48) was sent to Kevin in chat, not stored in a repo |
| Local preview | `.claude/launch.json` config `jake` → http://localhost:8092/?demo=1 (the sample book) | |

The 16 Sep safety net: every repo also has a branch `backup/16sep-account-switch`
holding whatever was uncommitted on Kevin's PC at the switch (this repo,
trureview-mobile, liberty-command).

## What the desk does now (v2, PR #427)

- **The Hunt**: prospects before any quote. Nine lead sources, one intro each
  in his voice (web lead = a call inside the hour; service department; GC bid
  invite; door knock; trade show; networking; referral, named; new AHCA/DBPR
  licenses; existing customer). Then a rotating text/call/email cadence: day 1,
  3, 5, 8, 12, 17, 24, 30, 38, 45, 60, then every six weeks, until a site
  visit, a quote or a no. "Not now" parks 90 days.
- **The six doors** (business with no lead): hotel PIP clock (last renovation
  year; 5 yrs soft goods / 10 hard), hotels that changed hands (12 months of
  cards), apartment route contracts ending (CSC/WASH, 9 months out, the rental
  wedge), service customers who never bought a machine (every 120 d), peer
  referral inside a brand/group, lost deals back at 120 d.
- **Quotes**: Four-Touch 3h/24h/48h, long game to day 90 then monthly, price
  expiry, options on one quote counted once, tracked links, "they opened your
  link · call now" on top for 72 h.
- **Site visit booked → confirm the day before → Visit done starts his own 24 h
  quote clock.** Signed → deposit → ordered → install confirm → installed → paid;
  install+7 check-in, +30 referral ask, warranty at 11 months.
- **Customers**: quarterly rhythm, budget month, chains ("3 of 8 locations are
  ours"), the Replacement Clock (every machine seen on a visit vs its years).
- **The hustle strip**: swings today against a daily target (15), came back,
  streak; "fill the day" puts the oldest silence on a card when the list runs short.
- **Bring your history**: HubSpot lost deals + service customers typed one per line.
- **Kevin's copilot seat**: a manager login on Jake's project reads the whole
  book and writes one table, `coach_notes`; notes land at the top of Jake's
  To-Do; "Tell Kevin" on every screen comes back the same way.
- Local-first: works with no login in one browser + a backup file; sign-in syncs
  laptop ↔ phone to his own project.

## What only Kevin can do (in order)

1. In the jakes-desk Supabase project: Authentication → Add user for Jake, then
   the `insert into orgs` / `insert into members` in `b2b-kit/README.md`, then
   his own row as role `manager` (the commented insert at the bottom of
   `b2b-kit/schema_v2_coach.sql`).
2. Paste `b2b-kit/schema_v2_coach.sql` into that project's SQL editor (the
   Management API token on his PC is dead; `docs`-memory
   `supabase-mgmt-token-dead`).
3. Merge PR #427, then publish `jake/` to gh-pages (the recipe is
   `desk/README.md`'s, same branch, a `/jake/` folder).
4. Email Dwayne at Uvoice (one item per email, Kevin's 10 Sep rule) for Jake's
   seat with one texting number → `CLOUDMESSAGE_TOKEN` in the kit's secrets,
   register the webhook, set `members.sms_from`.
5. Decide the quote-capture inbox domain (Jake BCCs it like he BCCs HubSpot;
   his IT's OK in writing first) and put his spec PDFs in his `materials` bucket.
6. Stop sharing Kevin's own desk login with Jake (the 10 Sep email).

## Rulings from these sessions that bind the next one

- Every change that a person sees ends with a Ride-Along film: shown, written,
  and said in a voice (gospel 31; `/ship` stage 6).
- The voice is a licensed narrator (Kevin picked Microsoft's `en-US-GuyNeural`,
  16 Sep) or Kevin's own with his say-so. A Steve Jobs clone was asked for and
  declined: never a real person's voice passed off as them.
- Nothing customer-facing sends by itself on Jake's desk; every email and text
  is his tap, logged at the hand-off with Undo.
- Jake's data never enters Liberty's database (there is no org isolation; 153).

## Session memory

Claude Code's memory for the Commercial-Desk folder lives on Kevin's PC at
`C:\Users\kdela\.claude\projects\C--Users-kdela-OneDrive-Desktop-Commercial-Desk\memory\`
— per machine and folder, not per account, so it carries over to the new
account on the same PC. `MEMORY.md` there is the index.
