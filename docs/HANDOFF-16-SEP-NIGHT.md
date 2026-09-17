# Handoff — 16 Sep 2026, night (HAND IT BACK · QUIET HOURS · the bills intake ran)

The pickup page for the next session, whichever account it runs on. Everything below is
committed and pushed: this repo on `main`, `kdelaney05-bit/trureview-mobile` on
`claude/jake-sales-virus`. Nothing lives only in a chat.

## What is live

- **Migration 376 HAND IT BACK** on the live database: `payees` (38), `supplier_bills.kind`
  (supplier · sub · crew · fee), `payee_id`, `landed_by`, `v_bills_queue` + 4 columns,
  `bill_land_by_hand(customer, payee, kind, amount, …)`. Every switch OFF. Next free number:
  **re-read the registry** (`select version from public.schema_migrations order by 1 desc limit 3`);
  three sessions took numbers tonight.
- **The app at v97**: the Bill landed card says its kind before the name; the Office room's
  Bills tile and queue say suppliers · subs · crews · fees. Lane doc `docs/HAND-IT-BACK.md`.
  Film: Ride-Along - Hand It Back (3:15) on `docs/ride-alongs.html`.
- **The bills intake ran for real at 10:20 PM on Kevin's "run it": 9 bills on the files**
  (Iron World ×2, Heritage ×1 needing a human, Nick's Lawn ×2, Kicking Grass ×4). None matched
  a job (no PO on any), so the first tap is Pick the right file. A second pass returned all
  "already". **On a timer since 10:50 PM on Kevin's "hourly": `liberty-bills.timer` (OnCalendar=hourly,
  RandomizedDelaySec=120, Persistent) → `liberty-bills.service` (oneshot, EnvironmentFile /etc/liberty-command.env).**
  `journalctl -u liberty-bills.service` shows each pass. By hand:
  `ssh` to the box, `cd /opt/liberty-command`,
  `LIBERTY_ENV_FILE=/etc/liberty-command.env node backend/worker/bills-intake.mjs` (`--dry` to look).
- **How the intake reads mail:** the Workspace delegation key (`NURTURE_GMAIL_SA_KEYFILE`, gmail.readonly).
  Mailboxes: jessica@libertyfencingfl.com, jessica@oasislandscapesfl.com, kevin@libertyfencingfl.com.
  jessica@libertyroofinggrp.com is another tenant (401) — ABC/SRS get re-pointed by Jess.
  Kevin's personal Gmail cannot be read — Heritage's Oasis account H021915 lands only there.
- **Gospel 35, quiet hours 7:30 PM–8 AM ET**: `backend/worker/quiet-hours.mjs`; gates in
  autopilot-engine, nurture-engine (touch email/text, the rep's queued email, the estimate nudge),
  no-quote-notify, xtrade-handoff, sms-rail (restarted 01:37 UTC). Rows stay queued and go at 8 AM.
  **Kevin is the one exception** (`isExempt` / `quietFor`). Still open: the DB-side pushes
  (089 hype, 094 ask) and the app's "goes at 8 AM" label where Send is.
- **QuickBooks:** three companies is all of them. Liberty Roofing (1537) lives inside Pro-Tech's
  file (022); `qb-bills.mjs` aliases 1537 → 1563. Never ask for a fourth consent.
- **Sent tonight by Kevin:** Brian at Heritage (add Jess to H021915 — went 9:05 PM, which is what
  produced gospel 35); Jess on Havana · Home Depot · Merchant Metals (scheduled for the morning).
  **Drafts, Kevin schedules for 8 AM:** Jess on ABC/SRS to her fencing address; Brian on the IIF.
- **Billtrust portal (surveyed by the Chrome side panel):** no IIF-by-email; recipients are
  sub-users; Jess has a sub-user on H021915 — her notifications must be ON with "attach a PDF".
  H044803 (Fencing) sits on another login and already emails Jess's fencing inbox.

## Owed by Kevin (the whole list)

1. ~~Billtrust~~ **Done 11 PM (the Chrome side panel):** Jess's sub-user JESSICA2024 lost "Change EBill Notifications", so her feed follows Kevin's login: new bill + PDF → jessica@oasislandscapesfl.com. Verified on reload. (The Gmail forward was abandoned: Google's re-verification blocks the side panel; this makes it unnecessary.)
2. ~~Schedule the two drafts~~ **Scheduled by the Chrome side panel for 8:00 AM ET** (its own session timer, sends by draft id; the drafts were edited: plain billtrust.com link to Jess; Brian's last line says the portal has no IIF setting on our side). If the send did not fire, the two drafts are still in Kevin's Gmail — send them by hand after 8.
3. ~~Decision~~ **Decided 10:50 PM: the office lands the crew's paper first; the supervisors' snap comes a week later.**
4. ~~Hourly~~ **Done 10:50 PM: the timer is on.**
5. **QuickBooks Payments on Pro-Tech and Oasis:** gear → Account and settings → Payments; card
   and ACH on? (Fencing already is.) Not blocking.
6. **The card list** for the next lane (bank, last four, company, who carries it), and the alert
   emails to kevin@libertyfencingfl.com per the prompt in the chat. Not blocking.

## Next builds, in order

1. The "+ Bill" paper door on the customer file (office seats), calling `bill_land_by_hand`.
2. "What did it cost" on Sam's PERMIT ask → a fee row.
3. The night pushes from the database and the "goes at 8 AM" label.
4. ~~The intake on a timer~~ done 10:50 PM.
5. CARD CHARGE LANDED from the cards' alert emails; Approve → QuickBooks Purchase → bank match.
6. The supervisor app's snap for the crew's paper.
