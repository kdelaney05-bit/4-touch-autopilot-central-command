# THE CREWS — one login per crew, one page per job, in their language

Kevin, 16 Sep 2026, evening: "Luis is meeting with the crew tomorrow to show
them what they need… the crew app is just basically going to give them one
login per crew. Someone has to just log in and then we can communicate with
that person on the job site. Whoever it is: your crew 1234, Liberty you're
1235, whatever… a whole new model of how it works: what guys do, what the
crews do. If they're in Spanish it translates. It's in Spanish, it's in
English, however he wants to do it."

Lane label: **CREWS**. The page Luis shows on his phone tomorrow:
`docs/the-crew-day.html` (Spanish first, EN one tap). Built beside everything
that runs today; nothing a crew does today stops (gospel 6).

## 1. What runs today (all live, read from the code and the database)

| Piece | Where | What it is |
|---|---|---|
| **The crew app** | `crew-app/` in trureview-mobile, own binary `com.trureview.crew`, TestFlight, live since 10 Aug | Three tabs: TODAY · MY RECORD · SETTINGS. Passive arrival and departure at the fenced site (119's law: the phone stamps it, nobody taps). Speaks the phone's language; one-tap override to Spanish or English. Kevin, 2 Aug: "I really don't want them interacting… simple easy for them." Twelve crew logins exist (`reps.role = 'crew'`, minted 9–10 Aug on the Spanish card sheet: Adrian Olvera, Andrés Cuervo, Andrés Velasquez, Danilo, Gregorio, Lazaro Alain, MK Fencing Truck 2 and Truck 3, Roberto Bello, Vilman, Yelson Hurtado, and the App Review demo) and **every one of them is inactive today** (read 16 Sep). The nugget's `crew_people` rows (MK Fencing · LA Fence · Bello Fencing, Spanish, Fencing) are the ones in use. |
| **The work order** (342) | `w.html` in liberty-command, edge fn `work-order`, one link per job | Written from the file the moment the install date is set, emailed to Luis and the crew, Spanish first with English under it: the customer, the address, the drawing, the material list, the scope. On the phone: **RECIBIDO · ENTENDIDO** with the name of whoever received it, then four big buttons **AQUÍ · FOTOS · LISTO · LLAMAR** and a line to the supervisor. Every tap lands on the customer's file. |
| **The nugget** (356 · 357 · 359) | `c.html` in liberty-command, edge fn `crew-nugget`, one standing link per crew | Mike's and Luis's one-instruction card: the words, the picture with the scope and the price, the customer, what to bring back (a photo, a number, sí/no, a few words, LISTO). RECIBIDO by name. The receipt on the manager's screen: texted, opened, received, brought back. Nothing to argue about. |
| **The file's lanes** (090 · 091) | `thread_messages.lane` | SUPER is crew ↔ supervisor; CHAT is crew + supervisor + homeowner; OFFICE is staff only and the crew can never reach it. |
| **The supervisor app** | `supervisor-app/`, Luis · Obed · Robert · Mike | Today (the crews on the fenced sites, stamped by the phone) · Sites · Crews · Pay · LIVE FILES with the four lanes and TAKE for photos. |
| **Sign-off and the invoice** (340, v96) | the chain, `js/bills.js` | Luis's COMPLETION_SIGNOFF with three or more finished photos opens INVOICE READY on the office. The crew's LISTO photos are what he signs off on. |

So the pieces exist. What does not exist is the **one door**: today a crew has a
login for the app that only stamps arrivals, a link for the order, and a link
for each nugget. Three doors, none of them "log in and we talk."

## 2. The model (Kevin's words, made concrete)

**No app. No login. A text with a link, and the link is the room.** Kevin at
7:30 PM said "one login per crew"; at 9 PM, seeing the link again: "problem
solved. no app… like send mini chat ecosystems." That is what 342 and 347
already are, read from the live functions tonight:

- `crew_link_text` (347): the moment the install date is set, the crew lead's
  phone gets a text from the brand's campaign-approved line, Spanish first:
  "Cuadrilla MK: Reed, Dana, 118 Palm Ave, Melbourne. Jue 9/18. Toda la orden
  está aquí: …/w.html?t=… — toca AQUÍ al llegar, FOTOS y LISTO al terminar."
  The phone comes from the crew's seat (`reps.phone`) or Contractors Cloud's
  crew card (`cc_crews.phone`) by name. **Behind the switch `crew_link_text`,
  OFF tonight; OFF = the link goes by email only.**
- `crew_link_view`: the page shows the order, the drawing, the material, and
  **the file's SUPER lane**: the supervisor's words to the crew and the crew's
  own lines, last 40. Never the customer's texts, never the office lane.
- `crew_link_event`: AQUÍ · FOTOS · LISTO · a message → one line on the file's
  SUPER lane, Spanish first with English under it ("Cuadrilla MK · EN SITIO ·
  on site — Ramón"), the photos attached to the file, and a push to the
  production watcher (the supervisor) that says what it is: crew is on site,
  crew sent photos, crew says done, crew message.

So one link per job is a mini chat for that job: the crew, Luis, the
supervisor; the office reads it on the file. The login is shelved; the twelve
Aug crew seats stay inactive. What the crew sees from the link, today, is the
list below.

**The link's page, today (`w.html`), and what each tap does:**

1. **The customer and the address**, the drawing, the material list, the
   scope, Spanish first with English under it (342).
2. **RECIBIDO · ENTENDIDO** with a name: the file says who received the order
   and when.
3. **AQUÍ** (on site, a line on the file and a push to the supervisor),
   **FOTOS** (the pictures land on the file with the crew's name; the
   supervisor is pushed), **LISTO** (done, with the photos; three or more is
   the sign-off rule), **LLAMAR** (the supervisor's number).
4. **Mensaje al supervisor**: the crew writes, it lands on the file's SUPER
   lane; what Luis or the supervisor write on the file in that lane shows on
   the same link. The room.

**Still to build on top of the link (the spoons in §4):** a text back to the
crew when the supervisor answers (today they reopen the link to see it);
translation both ways; Falta material as one tap (today it is a message);
the nuggets on the same page.

**Spanish or English, his choice, and the machine carries the other side.**
The app follows the phone, one tap to switch (already so). Every word the
office or the supervisor writes reaches the crew in the crew's language, and
what the crew writes reaches Luis in his. The rule: what a person wrote is
kept exactly, the translation sits beside it marked *traducido / translated*,
nobody's words are "corrected". Translation is a switch, `crew_translate`,
OFF until Kevin reads the first one (gospel 7 for words the machine makes).

**What the guys do.** Nothing on a phone. The crew has one phone; the lead
holds it. Arrive, read the order, tap RECIBIDO with your name, work, take the
pictures, tap LISTO. Ask the supervisor in your own words. That is the whole
job description on the screen.

**What the crew lead does that the guys do not.** Logs the crew in once.
Receives the order. Says "falta material" when it is short. Taps LISTO with
the photos. Answers the supervisor.

**What the supervisor (Luis · Obed · Robert · Mike) does.** Puts the crew on
the job (the date sets the order). Reads AQUÍ and the photos on Today. Answers
the SUPER lane in his language. Signs off (COMPLETION_SIGNOFF) on the LISTO
photos. Sends a nugget when something must come back. Pay reads the stamps.

**What the office does.** Never talks to a crew. Jonathan's material order
rides the work order; Laura's invoice opens off Luis's sign-off; Sam's permit
sign is on the order so the crew knows to hang it.

**What the machine does.** Writes the order at the date, sends it, translates
both ways, stamps the arrivals, counts the photos, opens the asks, keeps the
receipts, and nags nobody who did their part.

## 3. What Luis says tomorrow (the page says it for him)

`docs/the-crew-day.html`, Spanish first, one tap to English, six steps with
the real button words from the real page. He opens it on his phone and hands
it around, or prints it. The words on it:

> **Nada que aprender. Te llega.** Tu trabajo del día aparece en tu teléfono.
> El teléfono te dice qué tocar. Si algo no se entiende, la pantalla está mal,
> no tú. Díselo a Luis.

The six steps: **1 Entra** (one login per crew) · **2 AQUÍ** (the phone does it)
· **3 La orden** (RECIBIDO with your name) · **4 FOTOS** (say it with a picture)
· **5 Pregunta** (the line to Luis, in your language) · **6 LISTO** (three
photos or more). Then *what you never have to do*: no reports, no texts to the
office, no English, no second app.

## 4. The build, in spoons (one at a time, each one live before the next)

| Step | Who | What | Waits on |
|---|---|---|---|
| 1 | Kevin · Luis | **The roster.** Which crews, which brand, who holds the phone, the phone number, Spanish or English. The number goes on the crew's card in Contractors Cloud (`cc_crews.phone`, copied hourly) or on the crew's seat; no phone, no text. | tomorrow's meeting |
| 2 | Kevin | **Flip `crew_link_text`** in the Office room (added to the switch list 16 Sep night, v98). From then on the text goes out the moment an install date is set. Fence crews first: the Fencing lines are campaign-approved; Oasis and Pro-Tech crews would get it from the Fencing line until theirs are. | 1 |
| 3 | Luis | **The first real job.** One crew, one install, Luis on the file for every tap. | 2 |
| 4 | build | **The reply rides a text.** When Luis or the supervisor write in the SUPER lane on a job with an open work order, the crew lead gets a text "Luis: … — el link" from the brand's line, so nobody reopens a link to find an answer. Same switch. | 3 |
| 5 | build | **Translation both ways.** `thread_messages.body_translated` + `translated_to`, filled by an edge function when the writer's language and the reader's differ; shown beside the original, marked. Switch `crew_translate`, OFF. The first ten shown to Kevin before it goes on. | 3 |
| 6 | build | **Falta material** as one tap on the link (a photo + the words → MATERIAL_REQUEST on the supervisor with the clock), and the nuggets in their court on the same page. | 3 |
| 7 | build | **The Spanish Ride-Along.** The crew-day film with a Spanish narrator we have the right to use (Microsoft's `es-MX-JorgeNeural` through `tools/narrate.mjs`, `EDGE_VOICE=es-MX-JorgeNeural`; GUY stays the English voice). Listed on `docs/ride-alongs.html`. | 3 |
| 8 | build | **The customer sees the crew.** CHAT lane: "Ramón's crew arrived 7:32" from the AQUÍ stamp, in the customer's language, behind `office_machine_texts`. | 5 |

Steps 1–3 need no build. Steps 4–6 are one migration each (check the registry
first; sibling sessions number in parallel) and no app build at all.

## 4a. The nine questions to Luis

**Sent** to luis@libertyfencingfl.com (cc Jess) from Kevin's Gmail, 16 Sep
~8 PM, on Kevin's word ("send all emails… get the word out"), with the
handout links (the page, the Spanish PDF, the English PDF) and the ticket
rule: reply to that email, the thread is the ticket. The same night the four
supervisors (Luis, Obed, Robert, Mike, cc Jess) got "Your supervisor app: the
two-minute film, and how it gets on your phone": the film, Central Command on
the phone from the home screen, TestFlight in two taps once Apple's invite
lands, the ticket rule. **Open on Kevin:** the four are not TestFlight testers
yet (App Store Connect → TruReview Supervisor → TestFlight → an external group
with their four addresses, or a public link), and the "Could not reach the live
database" on his own phone (HANDOFF-16SEP) is unresolved. The questions: the roster; who holds the phone and whose phone; the login
names; who answers each crew; whether Luis reads Spanish; what every crew
brings back before sign-off; the three things that go wrong today; the first
real job; anything to change on the page before Wednesday. The answers fill
step 1 of §4 and rows 1–5 of §5.

## 4b. Luis's handbook

`docs/how-it-works-luis.html` → `docs/how-it-works-luis.pdf` (16 Sep night,
v97): how everything works from the ops manager's seat, ten sections, the
first one Kevin's word — "the notification will let everyone know what to
do, they won't have to think" — and the ninth what to do when something goes
wrong (reply to the thread, the ticket; a crew waiting → text or call Kevin;
nothing stops, do that job the old way; refresh, sign out and in, close the
app; the exact words of any error). **Sent** to Luis, cc Jess, as a reply in
the same thread as the nine questions (one thread, one ticket), with the
three PDF links. Attachments could not ride the Gmail door from this
session; the PDFs are on Pages and Kevin has them as files. Reprint as
things change; the page says so.

## 5. What Kevin decides

1. **Flip `crew_link_text`**, and when: after the roster has phones on it.
2. **Whose phone gets the text.** The lead's own phone (fast) or a company
   phone per crew (clean). Either way, one number per crew on the card.
3. **Translation on or off** at the start, and whether Luis reads Spanish
   (then his side needs no translation at all).
4. **The Spanish voice** for the film: Jorge (Microsoft, free, licensed like
   GUY) or an ElevenLabs Spanish voice.
5. **Gospel 26 stands as written**: no login. Kevin's 7:30 PM "one login per
   crew" was withdrawn at 9 PM ("problem solved. no app."); the gospel's
   addendum says so, dated.
