# THE PHONES — where every call and text lives, and how to ask about them

**Kevin, 17 Sep 2026, evening:** "i dont know the phone, text, place to
reference." This is the place. Every Uvoice, ConnectUC, CloudMessage and
texting question starts here.

## How to ask (the whole recipe)

1. Open Claude Code in **this folder** (`4-touch-autopilot-central-command`)
   or in `Commercial-Desk` (the `trureview-mobile` clone). Either one.
2. First line of the session: **"Read docs/THE-PHONES.md, then …"** and the
   question. Say the line, the person, the time, and paste the text or the
   number you saw. "Haakon says a text never came in, 386-276-6898, about
   2:10 PM" is a perfect question.
3. The session reads live before it answers (the tables below), tells you
   whether the problem is on our side or Uvoice's side, fixes ours, and
   writes the Uvoice email for you to send. You press Send.

Why a code session can do this and a plain chat cannot: the code session has
the Supabase connector **and** this repo on your disk. The repo is the map:
which table holds what, which worker fills it, what the rules are. Chat has no
map, so it cannot find the rooms. Nothing about your phones lives in Claude;
it all lives in the database, and the map lives here.

## How a call or a text reaches us (verified live 17 Sep, 9:05 PM ET)

| What | Path | How fast | Lands in |
|---|---|---|---|
| A text, either direction | Uvoice posts every text to our URL, the edge function **`uvoice-sms`** (trureview-mobile, `supabase/functions/uvoice-sms/index.ts`). Two feeds post there: the **PBX log forward** (tagged by extension) and the **CloudMessage relay** (per line). | CloudMessage: the same second, and the rep's phone buzzes "texted back". PBX: the **`uvoice-ingest.mjs`** worker every 15 minutes, no buzz. | `uvoice_sms_raw` (verbatim), then `text_messages` (one row per text, matched to rep and customer). |
| A call, any leg | Uvoice drops one CSV an hour on the box (`/home/uvoice-cdr/uploads`, since 17 Aug). **`uvoice-cdr.mjs`** reads it every 5 minutes (migration **401**, built 17 Sep after Kevin's "I have the strangest suspicion that we're missing calls"). | Up to an hour late, because the file is hourly. | `uvoice_calls`, keyed on Uvoice's CallID. A NEW missed call from a KNOWN customer on a rep's line buzzes that rep once. Unknown numbers never buzz. |
| A text the app sends | The file's Text button, the reps' phone app, the machine → `sms_outbox` → **`sms-rail.mjs`** → the CloudMessage API. | Seconds. | `sms_outbox` (status, provider id), and the relay echoes it back into `text_messages`. |
| Jess's office copies | Texts on the office lines are copied for email (migration 393). | With the ingest. | `office_text_copies`, `office_text_copy_rules`. |

Counts on live, 17 Sep 9:05 PM ET: `text_messages` 3,944 · `uvoice_sms_raw`
6,166 · `uvoice_calls` 2,141 · `sms_outbox` 414. Both text feeds and the call
file were flowing within the last hour of that check.

## The tables a session reads

| Table | What it is | Who fills it |
|---|---|---|
| `text_messages` | Every text, both directions. `feed_source` is `cloudmessage`, `uvoice` (the PBX forward) or `zapier` (the old road). `direction`, `occurred_at`, `rep_id`, `customer_id`, `ext`. | the edge function (CloudMessage) and `uvoice-ingest.mjs` (PBX) |
| `uvoice_sms_raw` | The verbatim posts, with `received_at` and `processed_at`. **The first question in any "a text is missing" case: is it here?** | the edge function |
| `uvoice_calls` | One row per call leg: type (Inbound, Outbound, Missed), `ext`, `began_at`, `answered_at`, `duration_s`, the far number, `answered_by` (`app` = the rep's ConnectUC took it, `core` = voicemail or auto-attendant), `rep_id`, `customer_id`, `pushed_at`. | `uvoice-cdr.mjs` on the box |
| `sms_outbox` | What we sent: `queued_at`, `sent_at`, `status`, `provider_id`, the error when it was refused. | the app, then `sms-rail.mjs` |
| `sms_lines` | The phone app's lines per brand, `active` per line. | Kevin and Jess, as rows |
| `brand_sms_lines` | Central Command's lines per brand, `campaign_ok` per line. The two tables must agree. | Kevin and Jess, as rows |
| `rep_channel_map` | Extension → rep. A text or call on an extension credits this rep. | the office, as rows |
| `reps` | `phone`, `sms_via`, `sms_from`, `tag_text_off`, `takes_leads`. | the seats door |
| `rep_push_tokens` | The phones that can buzz. | the phone app, on sign-in |
| `automation_switches` | `text_clock`, `appt_confirm`, `office_machine_texts`, `after_hours_reply` and the rest. **Kevin flips these from the Office room, never code.** | Kevin |

## The lines (16–17 Sep; check `sms_lines` and `brand_sms_lines` on live before trusting this)

| Line | Brand | Where it stood |
|---|---|---|
| 386-276-6898 | Liberty Fencing | Live since 2 Sep. Every rep texts from it. Both feeds arrive. |
| 321-806-1995 | Liberty Fencing (321 market) | Inbound arrives on the PBX feed only, so a reply shows on the file within ~15 min and nobody buzzes. Outbound from our rail works and delivers. **Missing: the CloudMessage URL forward on this line**, and that is the ask to Uvoice. |
| 321-274-4268 | Oasis | Inbound proven on both feeds. Cannot send from our side until Uvoice gives the Oasis account UID + API key and the rail carries a token per line. |
| 321-352-6955 · 321-783-1688 (Jermey) · 321-783-1694 (office) | Pro-Tech | Campaign approved 16 Sep. Lines stay OFF until Kevin says; UIDs and tokens asked for on the ticket. |
| 321-220-9556 (Mike, ext 156) · 321-526-8951 (Gustavo, ext 155) | Oasis | Texting live on the PBX; their ConnectUC texts land on the file by extension. The app's own rail is off for Oasis reps until the Oasis line can send. |
| 321-275-1100 · 386-446-5110 · 386-246-7007 | Office | Jess's email copies come from these. |

Who is who at Uvoice, the ticket rules, the open tickets and the exact
history of every line: **`docs/HANDOFF-UVOICE-16-SEP.md`**. Read it before
writing to Dwayne.

## Fixing things moving forward, the playbook

**Step 1, always: our side or theirs?** Find the text in `uvoice_sms_raw` by
time and number.
- **It is there.** The problem is ours: matching (wrong rep, wrong customer,
  no customer), the worker not running, the push not sent. A session fixes it
  in the repo and on live, and tells you what changed.
- **It is not there.** Uvoice never posted it: the forward is not on for that
  line, the line is not on a campaign, or the number is wrong at their end.
  A session writes the email to Dwayne with the line, the time and the test
  that proves it. You send it.

**Step 2, calls:** the same idea with `uvoice_calls`. A call that is in the
hourly file but not on the customer file is ours. A call that never made the
hourly file is theirs. Remember the hour of lag before calling anything
missing.

**Step 3, sending:** a text that did not go out is in `sms_outbox` with its
status and the provider's reason. "Only use the phone number assigned to your
account" means the line is not on the CloudMessage account whose token we
hold. That is an ask to Uvoice, not a code fix.

**Step 4, the rules we do not break while fixing:**
- Every outbound text is a draft until a seat presses Send; the machine's
  texts stay behind `automation_switches` and only Kevin flips those.
- A seat texts only from a campaign-approved main line.
- Lines, extensions, seats and rules are **rows**, not code. Change the row.
- Nothing about a customer goes into either repo.
- If a fix changes what a person sees on their phone, the Film Law applies:
  a real MP4 at a link, pushed to the people it touches, listed on the
  ride-alongs page.

**Step 5, write it down.** A session that learns something about the phones
adds it here (or corrects the line table), and to `SESSIONS.md` in
trureview-mobile if it shipped code. The next session starts from this file,
not from memory.

## Where the code is (all in `trureview-mobile`; `git fetch` first, sibling sessions merge from the cloud)

- `supabase/functions/uvoice-sms/index.ts` is the URL Uvoice posts to. Deploy with `npx supabase functions deploy uvoice-sms --no-verify-jwt`.
- `backend/worker/uvoice-ingest.mjs` turns PBX rows into `text_messages`, every 15 minutes (`backend/scripts/run-scheduled.mjs`, job `uvoice`).
- `backend/worker/uvoice-cdr.mjs` with `backend/systemd/liberty-cdr.service` and `.timer` reads the hourly call file into `uvoice_calls`, every 5 minutes on the box.
- `backend/worker/sms-rail.mjs` sends `sms_outbox` through CloudMessage. One token today (the Liberty account). A per-line token is the Oasis and Pro-Tech unlock.
- `backend/worker/tag-notify.mjs` is the "tagged you" alert; it picks the text line per seat.
- Migrations: 180–182 (the raw basin and the ingest), 240 (the rail), 264 (the inbox and the reply push), 304 (the rep text line), 393 (office-line copies), 401 (the calls).

In this repo: `js/file.js` draws every call and text on the customer file's
thread and holds the Text button; `js/switchboard.js` is the message rail.
`docs/CC-UVOICE-WORKFLOW-AUDIT.md` is the 12 Sep audit of who on the inside
does what with the phones.
