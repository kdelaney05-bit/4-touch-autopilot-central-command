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

**One login per crew, not per man.** A crew is a seat like any other
(`reps.role = 'crew'`, one row per crew, named the way Kevin says it: `Liberty
Crew 1235`, `Oasis Crew 1241`, `Pro-Tech Crew 1250`). Whoever holds the phone
that day is the crew; he types his name once on the order (RECIBIDO by name,
as today) so the file says who received it. No personal logins, no passwords
for eleven men: one per crew, kept by the crew lead, set by Kevin on the box
(passwords by Kevin's hand only). Gospel 26 keeps its first half (they talk in
pictures) and its per-job link for the man without the phone; the login is
the crew's door to the same pages.

**One page: Mi obra / My job.** When the crew logs in, the app opens on
today's job and nothing else:

1. **The customer and the address**, the drawing, the order, the scope — the
   work order (342), read by the crew's session instead of a link.
2. **AQUÍ** — the phone stamps it by itself inside the fence (119); the button
   is for the day the fence is wrong. **FOTOS** — the camera, the pictures
   land on the file with the crew's name. **LISTO** — done, with the finished
   photos; three or more is Luis's sign-off rule, and the page says how many
   are in. **LLAMAR** — the supervisor's number, one tap.
3. **The line to the supervisor** — the SUPER lane, in the crew's language,
   with the receipt (sent · read). A photo is something you say.
4. **In your court** — the nuggets Luis or Mike sent, with what to bring
   back, as today.
5. **Falta material** — one tap, a photo, the words: opens MATERIAL_REQUEST
   on the supervisor with the clock running (the ask type exists, 091).

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
| 1 | Kevin · Luis | **The roster.** Which eleven crews, which brand, who holds the phone, Spanish or English. The login name per crew, Kevin's way (`Liberty Crew 1235`). Kevin sets the passwords on the box; nothing typed in a chat. | tomorrow's meeting |
| 2 | build | **The crew seat as rows.** One `reps` row per crew (role `crew`), `lang`, the brand, the supervisor it answers to (`crew_people` already carries name · phone · language · manager for the nugget; the seat and the crew_people row become one). A view `v_my_job` that answers "the crew's job today" from the schedule and the work order. | 1 |
| 3 | build | **Mi obra in the crew app.** A fourth tab, first on open: the work order by session (no link), AQUÍ · FOTOS · LISTO · LLAMAR, the SUPER thread, the court, Falta material. Same edge functions as `w.html` and `c.html`, keyed by the crew's token instead of the link's. Geofence untouched. EAS build → TestFlight. | 2 |
| 4 | build | **Translation both ways.** `thread_messages.body_translated` + `translated_to`, filled by an edge function when the writer's language and the reader's differ; shown beside the original, marked. Switch `crew_translate`, OFF. The first ten shown to Kevin before it goes on. | 3 |
| 5 | build | **The Spanish Ride-Along.** The crew-day film with a Spanish narrator we have the right to use (Microsoft's `es-MX-JorgeNeural` through the same `tools/narrate.mjs`, `EDGE_VOICE=es-MX-JorgeNeural`; GUY stays the English voice). Listed on `docs/ride-alongs.html`. | 3 |
| 6 | Luis | **The first real job.** One crew, one install, Luis copied on every tap. | 3 |
| 7 | Kevin | **Flip `crew_translate`.** | 4, a week of 3 |
| 8 | build | **The customer sees the crew.** CHAT lane: "Ramón's crew arrived 7:32" from the AQUÍ stamp, in the customer's language, behind `office_machine_texts`. | 7 |

Nothing above is on. Steps 2–4 are one migration each (next free is 372 as of
16 Sep evening; check the registry first) plus one crew-app build.

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

## 5. What Kevin decides

1. **The names.** `Liberty Crew 1235` (brand + number), or the crew lead's
   name. Kevin's word tonight was the number.
2. **One phone per crew, or the lead's own phone.** The app is on TestFlight;
   a company phone per crew is the clean answer, the lead's phone is the fast
   one.
3. **Translation on or off** at the start, and whether Luis reads Spanish
   (then his side needs no translation at all).
4. **The Spanish voice** for the film: Jorge (Microsoft, free, licensed like
   GUY) or an ElevenLabs Spanish voice.
5. **Gospel 26.** It said "crews never get a login". Kevin's word tonight:
   one login per crew. The gospel keeps the pictures and the per-job link and
   adds the login, dated.
