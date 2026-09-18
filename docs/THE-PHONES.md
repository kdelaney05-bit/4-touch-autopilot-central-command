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
| 321-352-6955 · 321-783-1688 (Jermey, ext 157) · 321-783-1694 (office) | Pro-Tech | **ON since 18 Sep 8:15 AM ET** (Kevin: "Turn Protech on. And set Jermey up."). `sms_lines` active, `brand_sms_lines` campaign_ok + active; Jermey's seat `sms_via` cloudmessage / `sms_from` +13213526955, ext 157 on his channel row, `uvoice_live_at` set (Call hands him into ConnectUC); the three missed calls on ext 157 (10 Sep ×2, 17 Sep 3:44 PM, all to voicemail on the core) credited to him. Keys for 6955 and 1688 on the rail since 17 Sep, **never probed and never sent from — the first send from 6955 proves the key** (`node backend/worker/sms-rail.mjs --probe=+13213526955` on the box, or read `sms_outbox.error` on the first send). 783-1694 lands on the file (Laura, 17 Sep). |
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

## Dropped calls: how to tell (17 Sep 2026, late; Kevin: "guys are getting calls dropped… how can you tell if anything is being dropped")

Uvoice's hourly file carries a **Release Cause** on every call and
`uvoice_calls.release_cause` keeps it. **No screen shows it yet**: the
customer file draws a call as who · answered · length (`js/file.js`), nothing
about how it ended. Two signals, both read from `uvoice_calls` on live.

**Signal 1: the PBX saw the call die.** The cause is not a hang-up.

| Release cause | What it is |
|---|---|
| `Orig: Bye` · `Term: Bye` | A normal hang-up by the caller · by the called side. |
| `Orig: Cancel` | The caller gave up before anyone answered. |
| `Term: 404` · `486` · `603` · `604` · `No Dial Rule` | Bad number, busy, declined, could not route. Never connected. |
| `Transferred` · `DTMF <n> entered` · `No digit` · `Recording Done` · `Max Recording` · `Playback Done` | The attendant and voicemail doing their job. |
| **`No ACK Timeout`** | The far side answered, the rep's ConnectUC app never acknowledged, the PBX tore it down at **exactly 32 s** (the SIP ACK timer). The rep hears ringing or dead air; the customer says hello into silence and hangs up. **A dropped call.** 7 since 9 Sep: Haakon ×3, Eric ×2, Travis ×1, ext 101 ×1, every one outbound, 32 s, on the app leg. In 5 of the 7 the same two numbers tried again within 4 minutes. |
| **`Reinv: 408`** | A mid-call session refresh timed out and the PBX ended the call on its own. 1 (ext 101, 9 Sep, at 39 minutes). |
| `Disconnect` on ext 812 at exactly 66 s · `Time Limit` at 1800 s on ext 813 | The auto-attendant timing out on one toll-free 877 caller that hits the office main line several times a day. Spam on the attendant, not a rep. |

**Signal 2: the reconnect.** A drop on the rep's side (the phone's data
dies, the app loses Uvoice) is written by the PBX as an ordinary `Orig: Bye`
or `Term: Bye`, because the other person hung up on silence. Those are caught
by the callback: an answered call of 20 s or more, then the same extension and
the same far number connected again within 60 s. 9–17 Sep on rep extensions:
Eric 12 of 111 answered calls, Haakon 6 of 118, Travis 4 of 84, Ron 3 of 29,
ext 105 5, ext 102 5, ext 104 2. Eric's are the clearest: six long inbound
calls (2–8 min) where the customer called straight back within 11–22 s and
talked another 5–17 min, four of them on 16 and 17 Sep.

```sql
-- Signal 1: every call the PBX did not end with a hang-up
select ext, began_at at time zone 'America/New_York' as began_et, call_type, duration_s, release_cause, call_id
from uvoice_calls where release_cause not in ('Orig: Bye','Term: Bye','Orig: Cancel') order by began_at desc;

-- Signal 2: answered 20 s+, then the same ext and far number back on within 60 s
with a as (select *, began_at + make_interval(secs => coalesce(duration_s,0)) as ended_at from uvoice_calls
           where answered_at is not null and call_type <> 'missed' and duration_s >= 20 and ext ~ '^1\d\d$')
select a.ext, a.began_at at time zone 'America/New_York' as began_et, a.call_type, a.duration_s, a.release_cause,
       extract(epoch from (n.began_at - a.ended_at))::int as back_after_s, n.duration_s as back_for_s
from a join lateral (select * from uvoice_calls c where c.call_id <> a.call_id and c.ext = a.ext and c.remote_e164 = a.remote_e164
       and c.answered_at is not null and c.call_type <> 'missed'
       and c.began_at >= a.ended_at - interval '5 s' and c.began_at < a.ended_at + interval '60 s'
       order by c.began_at limit 1) n on true
order by a.began_at desc;
```

**What the file cannot tell:** jitter, packet loss, MOS, which SIP leg
failed. Those live in Uvoice's portal (call quality, SIP trace). The ask to
Uvoice for a dropped call is the CallID (`uvoice_calls.call_id`), the
extension, the time and the release cause; our half of the ticket comes
straight off the table, theirs is the trace.

**The feed itself, checked 17 Sep 9:50 PM ET:** healthy. A file every hour
that had calls, the newest ingested within the hour. The hourly export began
**9 Sep 14:00 UTC**; the only earlier file is Uvoice's 15-minute test of
17 Aug, so the 17 Aug → 9 Sep hole is no export, not a lost one (inferred from
the file names on the table; the box's folder was not read this session).

**Not built:** a "dropped" mark on the file's call line and a daily count on
the Office room's door. Kevin's call.

## What a rep loses when they move to texting from the app (checked live 17 Sep 2026, ~10 PM ET; Kevin: "are my employees missing anything as they migrate to texting")

**Flowing, nothing lost on the road:** every post Uvoice made to `uvoice-sms`
in the last 24 h answered 200; every raw post of the last 10 days is
processed with zero errors; every weekday working hour since 9 Sep has calls
in `uvoice_calls`; the rail sent 412 texts in 7 days; every rep who texts has
a phone that buzzes. The missed-call buzz (401) went live 17 Sep 6:23 PM ET.

**What is missed, largest first:**

| Where | 14 days, inbound | What happens to it |
|---|---|---|
| The reps' OWN Uvoice lines (the PBX feed, by extension) | Haakon 263 · Eric 263 · Travis 143 · Ron 60 · Mike 60 | On the file within ~15 min, **no buzz**, and `resolved_rep_id` is null (the ingest credits a rep for outbound only). The rep knows only if they still watch ConnectUC. |
| The shared 386-276-6898 line (CloudMessage) | 119 | On the file the same second, buzzes the rep. |
| Texts from numbers on no customer file (the PBX feed) | 421 texts from 83 real phones, plus 40 short codes | **Nowhere in either app.** Central Command draws texts by customer (`js/book.js`); the phone app loads only texts with a customer (`App.tsx`). They live in the database and in ConnectUC. Spam, personal, and new leads, mixed. |
| The old HeyMarket road (`feed_source` zapier, inbox 90250) | 69, none duplicated on another feed | On the file if the number is known. Whoever still reads HeyMarket sees the rest. |
| 321-806-1995 | PBX feed only | No buzz (no CloudMessage forward, the open ask to Uvoice). `sms_lines` says off, `brand_sms_lines` says campaign_ok; the rail sent 3 from it 16 Sep. The two tables must agree. |

So a rep's customers hold two numbers for them, the old direct line and the
main line, and reply to whichever they saved. Replies to the direct line reach
the file late and silent; a stranger texting the direct line reaches nobody in
our apps. Migration 264 said it in advance: "once the number moves, ConnectUC
stops being his inbox and our database is the only place the reply exists."
The rep's own line has not moved yet, so ConnectUC is still half the inbox.

**Two sends failed and were never resent:** one from 321-806-1995 on 14 Sep
and one from the Oasis line 17 Sep 8:10 AM, both "invalid from number", both
before their line was ready on the rail. Check the two files.

**Who cannot text from the app:** Nick Campana (active sales seat, no line, no extension, no phone that
buzzes: retire the seat or set it up), the office seats (no rail line on
`reps.sms_from`; the office texts from the PBX extensions 100–105). Jermey
texts from the Pro-Tech line since 18 Sep 8:15 AM (the row in the lines table above).

**Not built, Kevin's call:** a buzz for PBX-feed inbound on a rep's
extension (late by the 15-minute ingest unless Uvoice puts a CloudMessage
forward on each rep DID); an "unknown senders" list in the app; retiring or
pointing the HeyMarket number.

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

## What we handle ourselves, and what needs the phone people (Kevin and Jess, 17 Sep 2026, late)

Kevin: "it seems we can do a lot with our phone system without our phone peeps… let me and Jess know all the things we can handle with you and all the things we need our phone peeps for… what troubleshooting can you do." The honest split, from the tables above and the playbook.

**We handle it here, no call to Uvoice (a session does it in the repo and on live, and tells you what changed):**

- **Which rep, which customer a text or call lands on.** Extension → rep is a row (`rep_channel_map`); customer matching is ours; a text on the wrong file or no file is our fix.
- **Everything the app does with a text:** which button does what, the words that come up, the preview and SEND, the 15-second undo, the approved lines, the thread, the receipts, who gets buzzed.
- **A text that did not go out from the app:** it is in `sms_outbox` with the provider's reason; we resend, fix the worker (`sms-rail.mjs`), or read the reason back to you.
- **Who texts from which line:** `reps.sms_via` / `sms_from`, the office lines, Mike's line, Sam's line, a rep moving onto the rail: rows, changed in minutes, no app update.
- **The office copies** of texts (migration 393), the missed-call buzz, the after-hours reply drafts and the appointment confirms (behind the switches you flip).
- **Dropped calls, who and when:** every call leg is in `uvoice_calls` with its `release_cause`; we read it and name the pattern (No ACK Timeout at 32 s, the reconnect-inside-60-s query).
- **"A text is missing":** step 1 of the playbook. We find it (or not) in `uvoice_sms_raw` by time and number, follow it through `text_messages`, the file and the push, and say whether it is ours or theirs, with the proof.
- **The lines tables agreeing** (`sms_lines` vs `brand_sms_lines`), a line switched on or off for texting, a campaign-approved line enforced in the app.

**Needs the phone people (Uvoice / Dwayne), because it lives on their side:**

- **A line that never posts to our URL.** If a text is not in `uvoice_sms_raw`, Uvoice never sent it: the forward is not on for that line, or the line is not on a campaign. They turn it on; we write the email with the line, the time and the test that proves it. You send it.
- **New numbers, porting a rep's own number onto the rail, 10DLC campaign registration and approval** (Pro-Tech's went ON 18 Sep 8:15 AM on Kevin's word).
- **"Only use the phone number assigned to your account"** on a failed send: the line is not on the CloudMessage account whose token we hold. They attach it.
- **ConnectUC on a rep's phone:** registration, audio, the softphone itself. The 32-second No ACK Timeout drops are the phone-network side of a call; we can show them exactly which calls and when.
- **Call routing:** the auto-attendant, voicemail boxes, ring groups, hold music, the toll-free spammer hitting the attendant, and the hourly call export (it started on their side 9 Sep).

**The troubleshooting a session runs, on its own, any hour:** find a text by time and number in the raw feed; trace one text or call end to end; read a failed send's reason; pull a rep's line rows and push tokens; compare the two line tables; read the edge-function logs; send a test text to a test file from a line and watch it land; count what a line carried in a day; write the Uvoice email with the proof when it is theirs. What a session never does: flip a machine switch (yours, from the Office room), text a real customer as a test, or change a line without you saying so.

## 18 Sep 2026, 10:50 AM ET: Travis and Eric not getting calls, every sales line audited (Kevin: "audit every sales line and see what's happening")

**Read-only; nothing changed on live.** Kevin, by voice: Travis is not getting calls or texts, Eric has had the same trouble, the phone company says there is nothing they can do. Everything below is from the tables on live at 10:48 AM ET.

**Our side is clean.** The call file was ingested through 9:57 AM (277 legs in 24 h); texts were landing on both feeds at 10:47 AM (308 raw posts in 24 h, none stuck); the rail sent 44 in 24 h, every one sent (the only two failures are the known 14 Sep and 17 Sep 8:10 AM ones). Travis's and Eric's rows are right: ext 151 / 321-292-5408 and ext 150 / 321-506-1808 on `rep_channel_map`, both texting from the 386 line, one iOS push token each, refreshed this morning (Travis 10:03, Eric 9:56). **Texts to their own numbers are arriving:** Travis's line took 17 inbound on 16 Sep, 6 on 17 Sep, 5 this morning (last 8:49 AM); Eric's 45, 15, 26 (last 10:36 AM). If ConnectUC shows no texts, Uvoice has them and the app on the phone is not showing them; the carrier is not losing them.

**The PBX is up; the gap is between the PBX and the ConnectUC app on the iPhone.** Share of inbound legs the app answered, Mon 14 Sep to Fri 18 Sep 10 AM, with 9–13 Sep in brackets:

| Line | App answered | Known customers answered | Straight to voicemail (5 s or less, never rang) | `:8070` legs | No ACK |
|---|---|---|---|---|---|
| Office 101 · 104 · 105 (desk phones) | 98% · 95% · 96% (81 · 100 · 100) | 100% · 91% · 98% | 1 · 1 · 1 | 0 | 0 |
| Eric 150 | 31% (60) | 12 of 39 (8 of 15) | **20** (2) | 0 | 2 |
| Travis 151 | 47% (44) | 7 of 17 (6 of 11) | 4 (4) | **11** (9) | 1 |
| Haakon 154 | 33% (65) | 15 of 31 (8 of 11) | 12 (4) | 0 | 3 |
| Ron 152 | 22% (26), the robocalls | 6 of 17 (3 of 7) | 9 (2) | 0 | 0 |

Two shapes of a lost call, both read off `uvoice_calls`:

- **Straight to voicemail:** `call_type = 'inbound'`, `answered_by = 'core'`, `duration_s <= 5`. The PBX found nothing to ring and voicemail took it in the first seconds. It is typed "inbound", so **401 does not buzz the rep for it** (Travis's 8:48 AM call from a known customer today: no buzz; he called back at 8:49 on his own).
- **Rang out:** `call_type = 'missed'`, core, 23–54 s. The PBX rang a registration and nobody picked up: the phone did not ring, or it was silenced.

**Signal 3, Travis only: the `:8070` leg.** `term_ip = '70.42.44.203:8070'`, `missed`, 0 s, `Orig: Cancel`. 20 on ext 151 since 9 Sep (6 on 16 Sep alone, often two 3 s apart); Mike's 156 has 4; the 85x groups have them; **Eric, Haakon and Ron have none.** It is the shape of the second registration the 16 Sep note flagged on 151 and 154 ("on the phone on a different device"). Haakon's straight-to-voicemail count went 5 · 4 · 3 on 14–16 Sep and then 0 on 17–18; Travis's `:8070` legs ran through 17 Sep.

**Mon 14 Sep is a step.** Eric's straight-to-voicemail went from at most 1 a day to 5 · 4 · 6 · 4 · 1 (14–18 Sep); Haakon's 5 · 4 · 3. That was the day Uvoice worked the batch of tickets (T20260914.0003 · .0005 · .0016 · .0017 · .0018). **The Wi-Fi rule (17 Sep noon) did not move Eric's numbers:** 4 straight-to-voicemail on 17 Sep, and this morning 5 of his 6 customer calls went to voicemail (4 rang 23–36 s, 1 straight); every one of the 4 buzzed him under 401.

By day (inbound legs / answered by the app): Travis 14 Sep 10/5 · 15 Sep 16/10 · 16 Sep 9/2 · 17 Sep 13/6 · 18 Sep 1/0. Eric 12/2 · 14/5 · 19/9 · 16/4 · 6/1. The Term and Orig IPs on every leg are Uvoice's own (70.42.44.x, 207.254.81.27), so the file cannot show which network the phone was on.

**Written for Uvoice (a draft in Kevin's Gmail, a reply on the Eric thread to Dwayne cc Jeff, 10:55 AM):** the table above in plain words; the registration history on 150 and 151 since 14 Sep; what the `:8070` leg is and why only 151 makes it; what changed on the domain on 14 Sep; forward-when-unregistered (or simultaneous ring) so no customer hits voicemail because an app slept; the CallIDs of 16 calls to pull SIP traces on. Kevin presses Send or says it on the phone.

**Ours, not built, Kevin's call:** (1) buzz the rep for a straight-to-voicemail call from a known customer (401 buzzes `missed` only); (2) the daily count on the Office room's door; (3) before the ticket lands, the phone checklist for Travis and Eric: ConnectUC on one device only, Wi-Fi off, Notifications on, Background App Refresh on, Cellular Data on for ConnectUC, Low Power Mode off, no Driving Focus silencing it. Those are the standard checks for a VoIP app that goes to sleep, not proven causes.

```sql
-- the week table
select ext, case when began_at < '2026-09-14 04:00+00' then '9-13' else '14-18' end as wk,
 count(*) filter (where call_type in ('inbound','missed')) as in_all,
 count(*) filter (where call_type='inbound' and answered_by='app') as in_app,
 count(*) filter (where call_type='inbound' and answered_by='core' and coalesce(duration_s,0) <= 5) as straight_vm,
 count(*) filter (where term_ip like '%:8070%') as legs_8070,
 count(*) filter (where release_cause='No ACK Timeout') as no_ack
from uvoice_calls where ext in ('150','151','152','154','101','104','105') and began_at >= '2026-09-09 04:00+00'
group by 1,2 order by 1,2;

-- the calls to hand Uvoice, with CallIDs
select ext, began_at at time zone 'America/New_York' as began_et, call_type, duration_s, release_cause, term_ip, call_id
from uvoice_calls
where ext in ('150','151') and began_at >= '2026-09-16 04:00+00'
 and ((call_type='inbound' and answered_by='core' and coalesce(duration_s,0) <= 5)
      or term_ip like '%:8070%' or release_cause='No ACK Timeout'
      or (call_type='missed' and customer_id is not null))
order by ext, began_at;
```

**The reps' Uvoice numbers are not their iPhones (18 Sep 2026, 11:30 AM ET).** 321-292-5408 (Travis) and 321-506-1808 (Eric) are DIDs on ext 151 and 150; this week 52 of 53 and 74 of 77 of their inbound calls were dialed to those numbers and routed by the PBX. Eric's cell was moved onto Uvoice (28 Jul ruling), so both iPhones carry a different carrier number now. Those numbers live on the `rep_channel_map` note for each row, never in this repo and never in `reps.phone` (the phone app prints that field into the texts and emails a rep sends). Haakon's, Ron's and Mike's personal cells are different from their Uvoice numbers. The plan Kevin chose after the Dwayne call: **forward-when-unregistered on 150 and 151 to the iPhone's own number** (a draft on the Eric thread, 11:30 AM), the app untouched, outbound stays on ConnectUC so it stays in the file. Never forward-all on Ron (his line takes thirty robocalls a day). Not done: clearing `reps.uvoice_live_at` so the Call button dials from the iPhone (loses the outbound record until a tap record is built), the tap record itself, and the click-to-dial hook Dwayne offered (the PBX rings the rep's cell then the customer: full record, company caller ID, no ConnectUC).
