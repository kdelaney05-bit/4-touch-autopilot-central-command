# HANDOFF, Uvoice / phones / texting, 16 Sep 2026 (evening)

Written by the Claude Code session "Uvoice port, texting still broken, Pro-Tech campaign" at the end of Kevin's first Claude account. Pick up here from the new account. Everything below was verified from Gmail, the live websites and Uvoice's own replies, not remembered.

## Who is who
- **Uvoice** (phone system, ConnectUC app, CloudMessage texting): Dwayne Connelly dwayne@uvoice.com (account manager, ALL requests go to him), Jeff Lagassey jeff@uvoice.com, Oliver Dupuis oliver@uvoice.com. Tickets are Autotask numbers like T20260915.0003; ticket mail comes from support@unifiedusa.com. **Rule from Dwayne, 15 Sep:** wish list, fixes, troubleshooting go to Dwayne first; only true outages to support@uvoice.com; nothing to his team by email without him seeing it. Replies on tickets Uvoice already opened are fine with Dwayne cc'd.
- **Next Level** (websites): Corey Goolsby corey@gonextlevel.ai (CEO), Richard Llido richard@gonextlevel.ai (does the work), James Ramos. Ticket form: https://nlwebdesign.com/client-support/ . **Lesson:** they do find-and-replace on the words a ticket names and nothing more. Give them a standard ("the page must read as X"), not a search list, and ask a human to read the page before replying "done".
- **Jessica Coley/Southers** jessica@libertyfencingfl.com = "Central Command", Executive Manager over all three companies. Sam (104), Laura (105), Jonathan (102) are office. Sales: Eric 150, Travis 151, Ron 152, Haakon 154, Gustavo 155 (Oasis), Mike 156 (Oasis), Jermey 157 (Pro-Tech). Production: Luis 158, Obed 159, Robert 160. Ext 153 (Matt Vedder, gone) is being removed; its DID 386-276-5979 routes to Haakon.
- Entity: Liberty Roofing Group Inc is the legal owner, **dba Pro-Tech Roofing** (the only public brand). Site protechroofingofbrevard.com. Old libertyroofinggrp.com taken offline 15 Sep.

## Texting lines (CloudMessage, relayed to our URL)
| Line | Brand | Status 16 Sep |
|---|---|---|
| 386-276-6898 | Liberty Fencing | Live since 9/2. Reps currently text from this. |
| 321-806-1995 | Liberty Fencing (321 market) | Voice rings Fencing greeting. **Inbound texts DO NOT arrive.** Kevin texted it about 10 times on 9/15, nothing hit the URL. Dwayne says "setup is correct". Ask: Oliver sends one test text and confirms in CloudMessage inbox and at our URL. Until then keep reps' sms_from on 386. TOP PRIORITY. |
| 321-274-4268 | Oasis | Brand approved 9/2 (Dwayne, 16 Sep). Assigned, relaying. Needs one test text; the app's line table still marks Oasis inactive since 9/12. |
| 321-352-6955 | Pro-Tech | Blocked until the Pro-Tech campaign is approved. |
| 321-783-1688 (ext 157 Jermey) | Pro-Tech | SMS after campaign approval; Uvoice has an internal ticket. |
| 321-220-9556 (ext 156 Mike) | Oasis | New DID; voice live; SMS "programming set up", Mike must log out/in. Old 689-238-0508 ports back to T-Mobile Thu 9/17; Uvoice removing it from the campaign 9/16. |

We do NOT have a working CloudMessage login. Asked Dwayne to have Jeff resend login and account UID.

## Pro-Tech SMS campaign (the thing that kept failing)
Failed because the site's Terms and Privacy were a word-for-word clone of Liberty Fencing's (fencing services, Flagler County) and the consent text said "PRO-TECH ROOFING OF BREVARD" while the registration is "Liberty Roofing Group dba Pro-Tech Roofing". Nobody on our side asked Next Level to clone those pages; they did it. Fixed over three tickets on 15 Sep; **verified clean on 16 Sep morning on all three pages** (Terms, Privacy, Contact form checkbox). Dwayne resubmits under the dba name, roofing only. Watch for the carrier answer on ticket T20260910.0005.

## Calls going to voicemail (Travis 151, Haakon 154)
Haakon's text on 16 Sep 10:21: "it says I'm on the phone on a different device". He had ConnectUC on phone and iPad. Calls route to the other registration, ring 20 seconds (timer raised to 30 on 151), drop to voicemail. Same symptom as Travis. Fix: reps delete ConnectUC from every device but the phone; Uvoice clears stale registrations on 151 and 154 and enables ring-all if it exists. Kevin texted Haakon; the ask to Uvoice is in the Dwayne draft.

## Jessica's text copies ("user 100")
Uvoice has turned OFF every ReachUC email copy (all lines, ext 100). Jess wants email copies of texts on the three office lines only: 321-275-1100, 386-446-5110, 386-246-7007. **To build on our side:** office-line texts from the URL feed, emailed to jessica@libertyfencingfl.com, de-duped (the feed sends each text twice, rep ext plus ext 100). No ext 100 rebuild needed.

## Robocalls
No platform screening. Nomorobo.com is the answer (Kevin registers DIDs). Uvoice can enable anonymous call rejection at PBX level (asked for, all DIDs). Voicemail-to-email is now notification-only for all field reps; Ron's is ConnectUC only; office keeps audio.

## Open questions to Uvoice (all in the Dwayne draft)
Group MMS inbound (T20260903.0019, since 9/3): does the platform deliver inbound group texts to our DIDs at all? Zero received since the port. Jess/Sam/Laura texting from ConnectUC desktop on main lines 386-446-5110, 321-626-2802, 321-783-1694 (Jess emailed support directly 9/15). Remove ext 153. CloudMessage login.

## Gmail state at handoff (kdelaney05@gmail.com)
**Sent:** "Clean slate: everything open with Uvoice" to Dwayne 15 Sep 12:49 PM (Dwayne answered line by line 16 Sep 10:34 AM, subject "Responses and suggestions."). Oliver's voicemail ticket reply 15 Sep 5:45 PM (done by Oliver 16 Sep). Corey emails 15 Sep (site fixed overnight, Richard confirmed 16 Sep 12:14 AM). Handoff email to Kevin 16 Sep evening.

**Unsent drafts, ready to send (search Drafts):**
1. Re: Responses and suggestions. (to Dwayne, 11 items, the main one)
2. Re: T20260914.0005 - Waiting your response (CloudMessage ticket; auto-close warning sent twice, latest 16 Sep 4:36 PM)
3. Re: Ticket T20260915.0003 - confirmed; remove x153
4. Re: Calling (Travis)
5. Re: Fwd: Verify: Travis Janke ... varga (deny) to Jess and Gio
6. Re: Protech customers confused (Eric)
7. Re: New Village Chat Portal Idea (Sam, cc Jess/Gio/Laura)
8. Re: ABC Supply invoices (Jess)

**Delete:** standalone "Terms of Service still says we're a fencing company" to Corey (superseded); three empty Uvoice replies dated 9/13 and 9/14.
**Hold, wrong number:** "New user for Gio Calderin" draft puts Gio's voice on 321-806-1995, which now rings the Fencing greeting on purpose. Give Gio a fresh DID instead.

## Kevin's to-do
1. Send the 8 drafts (or have Claude send them). 2. Text Dwayne "clean" (site verified). 3. Tell Mike to log out and back into ConnectUC. 4. Register DIDs at Nomorobo. 5. Test text through Oasis 321-274-4268. 6. Beachsider ad copy (Bill Lawrence bullsharkholdings@gmail.com, full page 8 x 10.25). 7. Google Local Services lead from 16 Sep 7:11 AM to the office.

## App-side items already handed to the Commercial-Desk session (trureview-mobile repo)
Travis: the customer-screen call button opens a blank page; the Pipeline button works. Migration 339 (no cross-brand SMS fallback) written, not applied. Oasis line flip to active after a test. Jess office-line SMS-to-email routine. Samantha: keep Jetstream-style email notifications with a link to the file; a hard visual divide between internal chat and customer texting. Jess: auto confirmation email plus text with a calendar file at booking; rep availability by city and time on intake; @-tagging multiple people.

## Where things live
- This file: docs/HANDOFF-UVOICE-16-SEP.md in kdelaney05-bit/4-touch-autopilot-central-command (next to HANDOFF-16-SEP.md, the app handoff from the sibling session).
- Uvoice ticket history: Gmail, search from:support@unifiedusa.com or a ticket number.
- SMS log-forward URL (Uvoice posts every text here): the Supabase edge function uvoice-sms in trureview-mobile.
- Hourly CDR call exports: the SFTP box (user uvoice-cdr) and email from vm@unifiedusa.com.
