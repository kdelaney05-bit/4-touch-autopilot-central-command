// THE TOUR — "here is a cool video of how it will work" (Kevin, 15 Sep night:
// "show the coolest parts and clearly show how to use all the features we
// want them to use"). A voice is not possible on a page, so this is the next
// best thing and in one way better: it runs on the real screen, in the demo
// book, with a caption per step and a Next button, so a seat learns by doing.
// ?tour=1 starts it; the "Show me around" button on The Line starts it too.
// 16 Sep: it is THE RIDE-ALONG now (Gospel 31) — several films (FILMS), a voice (&voice=1), one link per person.
import { $, html, raw, esc } from './ui.js?v=142';

// Each step names the ROOM it plays in (Kevin, 15 Sep night: "the one you show is
// mine… it's not going to be that for everyone… give them the pipeline and then the
// line") — the film runs in the seat's own rooms (?demo=1&as=office), never the owner's.
const STEPS = [
  { room: 'line', at: null, title: 'This is The Line.', body: 'Everything with a human waiting on the other end, on one screen. Nobody has to hunt, and nothing gets to sit. Two minutes, and you will have seen all of it.' },
  { room: 'line', at: '#sayit, .sayit, [data-tour="sayit"]', title: 'Say it — to anyone, about any customer.', body: 'Type who it is about (last name, street or phone), pick a person or the customer, say what you need, press Post. It reaches them and it lands on that customer’s file, so it is never lost. And it tells you who it reached.' },
  { room: 'line', at: '#alerts .alert', do: 'bing', title: 'The bing.', body: 'When somebody tags you: a sound, and this card. It stays until you press ✓ Got it or Open the file. No feed to babysit — your name on it, or you never hear about it.' },
  { room: 'line', at: '[data-tour="sent"]', title: 'What you sent out.', body: 'Every directive of yours, who it reached, who picked it up, who did it and how fast. Tap one and the chain opens: this led to this led to this, straight down, until done. Look in without hovering. Nobody is beaten here; they look good.' },
  { room: 'line', at: '[data-tour="stuck"]', title: 'Where it is stuck.', body: 'Every open ask, grouped by what it waits on. The bar is how many; the number is the oldest one. That one is the one that is actually stuck.' },
  { room: 'line', at: '[data-tour="asking"]', title: 'What they are asking — and the file answers.', body: 'The customers waiting right now, sorted by what they asked. When the file already knows the answer, the Answer button shows what the file says and the reply in our own words. You read it, fix a word, press Send. It never sends by itself.' },
  { room: 'line', at: '[data-tour="quotes"]', title: 'The hard quote goes to Gio.', body: 'A rep on a hard fence job taps ASK GIO on his phone: the checklist and the pictures land here. Gio types the price and a word, presses Send the price, and the rep’s phone buzzes. The clock on each one is the number we watch.' },
  { room: 'line', at: '[data-tour="crews"]', title: 'My crews — and the nugget.', body: 'A crew is a name and a phone, no login. A nugget is one instruction, the customer and the address, and the one thing to bring back: a photo, a number, yes or no, done. They tap RECIBIDO by name. The court shows the receipt on every one: texted, opened, received, brought back. Nothing to argue about.' },
  { room: 'line', at: '#line-rail', title: 'Your rail.', body: 'You’re up is the short list with your name on it. Nothing goes unanswered is the company board. Rooms, People (direct lines, just the two of you and Kevin), and who spoke last.' },
  { room: 'pipeline', at: '.pies .pie, .pies', title: 'The Pipeline.', body: 'Every rep’s pie: what he has priced and is waiting to hear on, by when he last worked it. Tap a name for his book alone. Tap a customer and you are on their file.' },
  { room: 'photos', at: '.photo-feed, #ph-feed', title: 'Photos.', body: 'Every picture on every file, newest first, with the customer’s name, who shot it, the crew and the dollars. One search box. Crews, sales and supervisors talk in pictures here.' },
  { room: 'files', at: '.mybook, #tabs', title: 'Files opens on My book.', body: 'Your customers, one card each: the wait in gold or red, the open tasks as a checklist with who has them and how long, Open the file. Everyone is the whole list. Same job list and tasks you know from CC, with the hunting cut out.' },
  { room: 'files', at: '#drawer #photos-card', do: 'peek:cj3', title: 'The file — and ＋ Photo.', body: 'The photos sit first. ＋ Photo is the camera on a phone: the words, tag people, the crew, the dollar amount. It lands on the thread and everyone named gets the buzz. The customer never sees it.' },
  { room: 'files', at: '#drawer #lines', title: 'The next word.', body: 'The twelve approved lines, already filled in for this customer. Close the permit ask and the permit line is in the box. Set the schedule and the schedule line is in the box with the date. A customer asks about paying and Reply puts the pay-link line in the box. One tap left: Send.' },
  { room: 'files', at: '#drawer .rcpt', title: 'The receipt.', body: 'Under every note: who it reached — 📱 buzzed on the phone, 🖥 waiting in their You’re up — and a ✓ the moment they open it. Never a notification. There when you look.' },
  { room: 'line', at: null, title: 'That’s the whole thing.', body: 'Two things to try this week: say something to one person about one customer, and answer when someone says something to you. The customer never sees our notes. Only the texts we send them.' },
];

// THE CREWS FILM (Kevin, 16 Sep: "he needs to visually see that. create a short form video I can just send to
// Mike on how it works, with the subtitles… commentate our instructions"). ?tour=crews&auto=1 — and &voice=1
// reads every caption aloud in the browser's own voice.
const CREW_STEPS = [
  { room: 'line', at: '[data-tour="crews"]', title: 'Mike, this is your crews card.', body: 'It sits on The Line. Your crews are people with a phone, not logins. Every nugget you send them lands here with a receipt.' },
  { room: 'line', at: '#crew-add', title: 'Add a crew once.', body: '+ Crew: a name, a phone, their language. That is it. Each crew gets one link for good; they never install anything.' },
  { room: 'files', at: '#drawer #photos-card', do: 'peek:cj6', title: 'On the job: take the picture.', body: 'Open the customer. ＋ Photo. The scope on the yard, then the words, the crew, and the price for that piece. Post it. Scope and price, locked in the pic.' },
  { room: 'files', at: '#lightbox .cap', do: 'lightbox', title: 'Tap the photo. Send to a crew.', body: 'Any photo on the file has the button. It carries the picture, your words, the customer and the price with it.' },
  { room: 'files', at: '#modal-form', do: 'lbcrew', title: 'The nugget, already filled.', body: 'Pick who. Say what to bring back: a photo, a number, yes or no, or just done. A by-when if you want. Send it.' },
  { room: 'line', at: '[data-tour="crews"] .nug', do: 'closemodal', title: 'Their court, your receipt.', body: 'Ramón gets a text with the link. Here you see: texted at 7:23, opened at 7:31, RECIBIDO Ramón at 7:32, brought back with the photo. Nothing to argue about. If it says not opened, call before a pallet moves.' },
  { room: 'line', at: null, title: 'What Ramón sees.', body: 'The customer and the address in gold. Your picture, big. Your words. The price. One button: RECIBIDO · ENTENDIDO. Then the one thing to bring back.', link: 'https://kdelaney05-bit.github.io/liberty-command/c.html?demo=1', linkText: 'Open Ramón\'s screen' },
];
// GIO'S FILM — ?demo=1&as=manager&tour=gio&auto=1&voice=1 (his seat: The Line · Sales · Pipeline · Photos · Files; the demo's manager rooms are the closest fit)
const GIO_STEPS = [
  { room: 'line', at: null, title: 'Gio, this is The Line.', body: 'One screen: every customer and every one of us waiting on the other end. Your part is one card. Two minutes and you have it.' },
  { room: 'line', at: '[data-tour="quotes"]', title: 'Quotes to price. Your card.', body: 'A rep on a hard fence job taps ASK GIO on his phone. His checklist lands here: type, height, feet, gates, tear-out, grade, ground, HOA, survey, access, need-by. His pictures and his note with it. No phone call to get the facts.' },
  { room: 'line', at: '[data-tour="quotes"] .qhead', title: 'The clock is the number.', body: 'Each ask shows how long it has waited and who asked. Gold past an hour, red past four. Get it under an hour and the guys sell on the spot.' },
  { room: 'line', at: '[data-tour="quotes"] .qans', title: 'Type the price and a word. Send the price.', body: 'The price, and one line the rep should know: add a day for the tear-out, racked panels. Press Send the price. His phone buzzes with it, and it lands on the customer\'s file.' },
  { room: 'files', at: '#drawer .quotes', do: 'peek:cj1', title: 'On the file: PRICED · 38 min.', body: 'Mark Whitfield. Ron asked, you priced it in thirty-eight minutes, your note is right there. Anyone who opens the file sees it. Nothing to repeat.' },
  { room: 'pipeline', at: '.pies .pie, .pies', title: 'The Pipeline.', body: 'Every rep\'s pie: priced and waiting, by when he last worked it. Tap a name for his book. Yours is in there too. You are selling again.' },
  { room: 'line', at: null, title: 'That\'s your part.', body: 'Sit on The Line. When a quote lands, price it, send it, and go sell. The rest of the room runs itself.' },
];
// THE KEYS' FILM — Jess and Luis: ?demo=1&tour=keys&auto=1&voice=1 (no &as=, so it runs in every room with View as)
const KEYS_STEPS = [
  { room: 'line', at: null, title: 'Jess, Luis: you hold the keys.', body: 'Every room, every file, and View as: be anyone and reach anyone. Two minutes for the whole place.' },
  { room: 'line', at: '#sayit, .sayit, [data-tour="sayit"]', title: 'Say it, to anyone, about any customer.', body: 'Type who it is about, pick a person, say what you need, press Post. It reaches them, it lands on the customer\'s file, and it tells you who it reached.' },
  { room: 'line', at: '#alerts .alert', do: 'bing', title: 'The bing.', body: 'When somebody tags you: a sound and this card. It stays until you press Got it or Open the file. Your name on it, or you never hear about it.' },
  { room: 'line', at: '[data-tour="sent"]', title: 'What you sent out.', body: 'Every directive of yours: who it reached, who picked it up, who did it, how fast. Tap one and the chain opens, straight down until done. Look in without hovering. Tap Appreciate on the one that landed well.' },
  { room: 'line', at: '[data-tour="stuck"]', title: 'Where it is stuck.', body: 'Every open ask, grouped by what it waits on. The number is the oldest one. That one is the one that is actually stuck.' },
  { room: 'line', at: '#viewas', title: 'View as.', body: 'Pick a name at the top and the site becomes their rooms with their name on it. See exactly what Sam sees, then back to you. Only the keys have this.' },
  { room: 'line', at: '[data-tour="crews"]', title: 'My crews and the nugget.', body: 'Luis: a crew is a name and a phone, no login. A nugget is one instruction, the address, the picture, the price, and the one thing to bring back. They tap RECIBIDO by name and you hold the receipt.' },
  { room: 'line', at: '#line-rail', title: 'Your rail.', body: 'You\'re up is the short list with your name on it. Nothing goes unanswered is the company board. People is the direct lines: just the two of you and Kevin.' },
  { room: 'files', at: '.mybook, #tabs', title: 'Files opens on My book.', body: 'Your customers, one card each: the wait in gold or red, the open tasks with who has them and how long. Everyone is the whole list.' },
  { room: 'files', at: '#drawer #photos-card', do: 'peek:cj3', title: 'The file, and Photo.', body: 'The photos sit first. Plus Photo is the camera on a phone: the words, tag people, the crew, the dollars. It lands on the thread and everyone named gets the buzz. The customer never sees it.' },
  { room: 'files', at: '#drawer .rcpt', title: 'The receipt.', body: 'Under every note: who it reached, buzzed on the phone or waiting in their You\'re up, and a check the moment they open it. There when you look.' },
  { room: 'line', at: null, title: 'On the road: the same site.', body: 'Open it on your phone and add it to the home screen. Same rooms, same files, in your pocket. Luis, that is your mobile command center.' },
];
// THE OFFICE FILM (Kevin, 16 Sep afternoon: "let's walk through the new automations… how it was and how it is… show
// people how to use"). From docs/THE-OFFICE-DAY.md: 10 CC tasks became 4 office inputs; the rest opens itself.
const OFFICE_STEPS = [
  { room: 'line', at: null, title: 'Sam, Laura, Jonathan: your day, the new way.', body: 'In Contractors Cloud a job was ten tasks, assigned by hand, closed with a checkbox. Here it is four inputs from you, and the machine opens every next step by itself. Two minutes.' },
  { room: 'office', at: '[data-tour="office-tiles"]', title: 'The Office room. Four tiles, four inputs.', body: 'Paperwork, permit, ready to invoice, payment. The number is how many are waiting on the office; the clock on each is how long. Nothing here was created by hand. When a customer signs, the paperwork ask opens itself. When the paperwork finishes, the permit ask opens itself.' },
  { room: 'office', at: '[data-tour="office-asks"]', title: 'Oldest on top. Done asks for the input.', body: 'No task list to filter. The one that has waited longest is first. Press Done and it asks for the real thing: the permit number, the PO number, the start date, the invoice number. That input goes on the file and opens the next step. There is no checkbox to tick.' },
  { room: 'office', at: '#cc-workflow', title: 'Every CC step, and what became of it.', body: 'This card is the whole map. Fence and Oasis: ten tasks became four inputs. Roofing: twenty-one became four for the office and seven for the supervisor. Follow up with the homeowner is gone: their texts land on the file and a fifteen-minute clock watches them. Make a PM folder is gone: the file is the folder.' },
  { room: 'files', at: '#drawer [data-tour="paperwork"], #drawer #photos-card', do: 'peek:cj3', title: 'On the file: the paperwork checklist.', body: 'It opened the moment the customer signed on the link. The contract settled itself. What is left is the county forms for that address: the NOC, the hold harmless, filled from the file. Upload the recorded one and the permit ask opens.' },
  { room: 'files', at: '#drawer #note', title: 'A note to the team, on the file.', body: 'Tag, then type. Tag @Jessica Coley and she gets the bing and the email with a link here. Once you have written on a file you stay on it: every later note reaches you. The customer never sees a word of this.' },
  { room: 'files', at: '#drawer #compose', title: 'Text the customer from the file.', body: 'The box at the top goes to the customer, from the company line, signed with the company name, and stays on the file. Permit is in, you are on the schedule, the invoice is out: the lines are already written. Later those go out by themselves; today you press Send.' },
  { room: 'line', at: '[data-tour="asking"]', title: 'What they are asking, and the file answers.', body: 'Every customer waiting right now, sorted by what they asked. Where the file already knows the answer, Answer shows it in our words. Read it, fix a word, Send.' },
  { room: 'line', at: null, title: 'That is the whole day.', body: 'Four inputs. Everything else opens itself, and the documents from Contractors Cloud are landing on the files tonight: contracts, surveys, NOCs, permits. CC stays open beside this until Kevin says otherwise. This is where we talk, and where the job moves.' },
];
// THE CHAIN FILM (Kevin, 16 Sep: "from contract signing, automatic, and then what happens and who does what and what
// the sales guy gets and how he gets it to the office and all he's doing is this"). One job, signature to close-out,
// every seat's part lighting up in turn. Runs in the owner's demo so every room is on the screen.
const CHAIN_STEPS = [
  { room: 'line', at: null, title: 'One job, signature to close-out. Nobody assigns anything.', body: 'This is how a job moves now. Watch each person\'s part light up in turn. The rep does one thing. The office does four. The machine does the rest.' },
  { room: 'files', at: '#drawer [data-tour="paperwork"], #drawer .asks, #drawer #photos-card', do: 'peek:cj7', title: 'The customer signs on the link. On their phone.', body: 'The rep sent the estimate link from the app. The customer signs it in the driveway or that night. That signature is the trigger: the file opens the paperwork checklist by itself, the contract settles itself, and the rep is finished. He turned in nothing. The link did it.' },
  { room: 'office', at: '[data-tour="office-tiles"]', title: 'Sam\'s tile lights: Paperwork.', body: 'The same second, the paperwork ask lands on the office seat with a clock. Sam\'s desk bings, her phone buzzes, her email has the link. Nobody told her. Nobody made a task.' },
  { room: 'office', at: '[data-tour="office-asks"]', title: 'Sam presses Done. It asks for the real thing.', body: 'Not a checkbox: the county forms for that address, filled from the file, one upload. That input closes Paperwork and opens the next ask on its own: Permit, on Sam, with a five-day clock.' },
  { room: 'office', at: '#cc-workflow', title: 'The permit number in. Then one paste.', body: 'Sam types the permit number. The machine texts the customer "your permit is in" from the main line, the moment you flip that switch. The Locate ask opens with the whole 811 ticket already written from the file. Sam pastes it once.' },
  { room: 'office', at: '[data-tour="office-tiles"]', title: 'Jonathan\'s turn.', body: 'Material releases, and MATERIAL opens on Jonathan\'s seat: the PO number, then the start date. The schedule text goes to the customer. He never adds a name to a project team.' },
  { room: 'production', at: '[data-take], [data-tour="prod-board"]', title: 'Luis\'s turn: Take the job.', body: 'The start date pushes production. Luis, Obed or Robert gets the buzz and taps Take the job. On a roof that supervisor then gives seven taps as the job goes: a photo, a result, a day. On a fence: sign off.' },
  { room: 'flow', at: '[data-tour="flow-head"], .pipe', title: 'The Job Board moves by itself.', body: 'Every sold job, by stage, sliding right as each input lands. Nobody drags a card. If you want to know where a job is, it is here, and it is on the file.' },
  { room: 'office', at: '[data-tour="office-tiles"]', title: 'Laura\'s turn: Ready to invoice.', body: 'The supervisor signs off and Ready to invoice lights on Laura. Invoice from the file; the number closes it; the customer gets the invoice text. Payment lands, close-out is one tap, and the review prompt goes to the customer.' },
  { room: 'line', at: '[data-tour="sent"]', title: 'And you see the whole chain.', body: 'Who got it, who did it, how fast: this led to this led to this, down to done. Appreciate on the one that landed well.' },
  { room: 'line', at: null, title: 'That is the job, start to finish.', body: 'The rep: one link. The office: four inputs. The supervisor: a tap and, on a roof, seven more. The customer: texted at every turn. The machine: everything between. Nobody\'s job is taken; the hunting is.' },
];
// THE SUPERVISOR FILM (Kevin, 16 Sep: "so they know how to communicate — that they can text through the supervisor
// app in the customer portal"). ?demo=1&as=manager&tour=super — the supervisor's rooms; on a phone it is the phone layout.
const SUPER_STEPS = [
  { room: 'line', at: null, title: 'Luis, Obed, Robert: this is your phone.', body: 'Open the site on your phone and add it to the home screen. Every room, every customer, in the truck. The supervisor app opens the same file with the same three lanes; this is where the words live.' },
  { room: 'production', at: '[data-take], [data-tour="prod-board"]', title: 'Production: your board, and Take the job.', body: 'Who has the customer right now, and for how long. When the office sets the start date, the job pushes to you. Tap Take the job and it is yours; the office sees it the same second.' },
  { room: 'files', at: '#drawer #compose', do: 'peek:cj3', title: 'The customer: text them from the file.', body: 'The box at the top goes to the customer, from the company line, signed with the company name. We are running a day early, is Thursday morning good. It stays on the file. The customer answers and it lands right here, with a clock nobody has to watch.' },
  { room: 'files', at: '#drawer #note', title: 'The inside note: the wall.', body: 'The tan box is us. Tag @office or @Jessica Coley and they get the bing and the email with a link to this file. The customer never sees this lane. Green is the customer. Tan is the team. You cannot mix them up.' },
  { room: 'files', at: '#drawer #photos-card', title: 'Photos: the job, in pictures.', body: 'Plus Photo is the camera. The words, tag a person, the crew, the dollars. It lands on the file and in the Photos room, and everyone named gets the buzz. No more pictures lost in a text thread.' },
  { room: 'line', at: '[data-tour="crews"]', title: 'Your crews and the nugget.', body: 'A crew is a name and a phone, no login. Send one instruction with the picture and the price. They tap RECIBIDO by name, bring back the photo, and you hold the receipt: texted, opened, received, done. Sod on the wrong yard never happens twice.' },
  { room: 'line', at: '[data-tour="asking"]', title: 'What they are asking.', body: 'Your customers waiting right now, sorted by what they asked. Where the file knows the answer, Answer puts the words in the box. Read it, fix a word, Send.' },
  { room: 'village', at: '#view-village [data-say]', title: 'The Village: the whole company.', body: 'Say it, press Enter. Tag @office, @sales, or a name. The 🎤 talks for you when your hands are busy. Answer here, not by text, so it is on the record.' },
  { room: 'line', at: null, title: 'That is the supervisor\'s day.', body: 'Take the job. Text the customer from the file. Note the team on the file. Photo the work. Nugget the crew. The office sees all of it without a phone call, and so does Kevin.' },
];
// CONTRACT SIGNING AND AUTO WORKFLOW (Kevin, 16 Sep evening): sign everything once; the NOC is the customer's errand
const NOC_STEPS = [
  /* 385 (Kevin, 17 Sep, the final answer): everything signs on the link, hold harmless included, every county; the NOC is the rep's; nothing waits */
  { room: 'files', at: null, title: 'The customer signs everything, once.', body: 'One link. The proposal, our contract sheet, the disclosures, the hold harmless and the building permit application, every form the address needs, filled in on the lines, all under one signature. That acceptance is the contract: they are locked in. Oasis signs the contract and initials the terms. The close is one line: great, I can get you started now, go ahead and accept here, and we get everything moving on our end.' },
  { room: 'files', at: '#drawer [data-tour="paperwork"]', do: 'peek:cj7', title: 'Nothing waits.', body: 'The second they sign, the permit opens on Sam and the material opens on Jonathan. Custom and aluminum the moment the deposit is in. The town\'s forms are on the file signed and stamped, so Sam pulls the permit off them. Luis knows a job is coming. Nobody waits on a notary.' },
  { room: 'files', at: '#drawer [data-tour="paperwork"] .next', title: 'The one form off the link: the NOC. It is the rep\'s.', body: 'Florida wants the owner to sign the Notice of Commencement in front of a notary, so it is not on the link and it is not the customer\'s errand. The file fills it in the moment they sign, it rides on the SIGNED email, and it is yours: you are the notary, or any bank, or your own DocuSign. Get it stamped and put the picture on the file. Sam records it.' },
  { room: 'files', at: null, title: 'It holds nothing.', body: 'Not the permit, not the material, not the contract. The county wants it before the first inspection on jobs over $5,000, so it has to be on the file before the crew\'s first inspection. Under $5,000 there is no NOC at all.', link: 'sign-everything.html', linkText: 'See the customer\'s phone' },
  { room: 'files', at: '#drawer [data-tour="paperwork"]', title: 'The file reminds you. Not Sam.', body: 'Day two, day five, day nine, two weeks, three weeks, a month: a buzz on your phone with the customer\'s name, and an email with the filled form attached, until the stamped copy is on the file. Kevin edits those reminders as rows.' },
  { room: 'office', at: '[data-tour="noc-switch"]', title: 'The customer note stays off.', body: 'There is a switch that would email the customer the NOC with a photo link and text them until it is back. Kevin turned it off: the NOC is the rep\'s, not the customer\'s. Nothing about paperwork goes to the customer after they sign.' },
  { room: 'files', at: null, title: 'Nothing to learn. It comes to you.', body: 'The customer signs once. The office gets the permit and the material the same minute. You get the SIGNED email with the NOC in it and a reminder until it is done. Still easier. Just compliant.' },
];
// THE FIRST PIECE (Kevin, 17 Sep: "Jess starting on Monday scheduling all leads in the new app… send a video… the same
// way you did before… reassure that every step is in here"). ?demo=1&as=office&tour=leads&auto=1&voice=1 — the office's own rooms.
const nextMonday9 = () => { const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); d.setHours(9, 0, 0, 0); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T09:00`; };
const LEADS_STEPS = [
  { room: 'files', at: '#btn-newjob', title: 'Monday: every new lead starts here.', body: 'Jess, Laura, Sam: from Monday a new customer comes in through this button, not through Contractors Cloud. One form, two minutes, and everything after it happens by itself. Here is the whole thing.' },
  { room: 'files', at: '#modal-form', do: 'newjob', title: 'Plus New lead. Type it once.', body: 'The brand, and how they found us: the same lead-source list as Contractors Cloud, so the reports keep counting. Name, mobile, email, the address. What they want, in your words: chain link quote needed. Same phone number means the same customer, so their history stays in one file.' },
  { room: 'files', at: '#nj-addr-pick', do: 'address', title: 'The address fills itself in.', body: 'Samantha\'s idea, her first day in the app. Start typing the street and the map offers the match. Pick it, and the street, the city and the zip are typed for you. And the rep list now has every seller, plus Gio when he sells one himself, and Jessica as the placeholder until a rep is picked.' },
  { room: 'files', at: '#nj-day', title: 'Pick the rep and the day. It shows you their day.', body: 'Choose the rep and the appointment time, and the form reads what that rep already has booked that day, so nobody is double-booked. An hour is the default; change it if you need to. Then press Open the file.' },
  { room: 'files', at: '#drawer #lead-line', do: 'newjobdone', title: 'The file is open. The rep already knows.', body: 'The moment you press it, Eric\'s phone buzzes: new estimate booked, Monday at nine, the address, chain link quote, booked by Laura. The booking is the first line on the file. The customer gets the confirmation text from the main line when Kevin turns that switch on. Nobody calls anybody.' },
  { room: 'files', at: '#drawer .next', title: 'NEXT says what happens next.', body: 'Estimate booked Monday at nine with Eric. Eric shows up early. If a lead comes in with no time yet, NEXT says so in red: call them and book it. Nothing to remember.' },
  { room: 'files', at: '#drawer #lead-line', title: 'And Contractors Cloud?', body: 'Nothing else moves. Invoicing, bills, work orders and commissions stay in Contractors Cloud for now. The machine carries the lead across, the account, the project and the sales appointment on the rep, so his Google Calendar fills in the way it does today. Until Kevin flips that switch, the chip says not in Contractors Cloud yet, Copy for CC gives you the fields in CC\'s order, and Typed into CC records that you did.' },
  { room: 'pipeline', at: '.pies .pie, .pies', title: 'The Pipeline sees it too.', body: 'Every rep\'s book by stage: new leads with no appointment, upcoming appointments, priced and waiting, signed. Tap a name for his book alone; tap a customer and you are on the file.' },
  { room: 'files', at: null, title: 'Nothing to learn. It comes to you.', body: 'Monday: a lead comes in, you press plus New lead, you type it once, you press Open the file. The rep is told, the file is written, the customer is texted, Contractors Cloud is filled. Everything you did in there is either already here or being done for you, one piece at a time, and Kevin says when each piece moves.' },
];
// THE SUB LOCKED IN (Kevin + Jess, 17 Sep, the Billdu handoff meeting: "lock in that sub to that price, so the sub knows and
// we know and Mike doesn't have to remember it… put that as an input when he uploads the contract"). ?demo=1&as=manager&tour=sub&auto=1&voice=1
const SUB_STEPS = [
  { room: 'files', at: '#drawer #photos-card', do: 'peek:cj6', title: 'Mike. The contract you just signed.', body: 'Same as always: the customer signs the sheet, you take the picture. Open the customer, press Plus Photo. One new question sits under the picture now.' },
  { room: 'files', at: '#modal-form #ps-contract', do: 'photosheet', title: 'This picture is the signed contract.', body: 'Tick it. Two boxes appear: who is doing the work, and their price. The number the sub gave you on the phone, the one you used to keep in the CompanyCam picture. Type it here instead.' },
  { room: 'files', at: '#modal-form #ps-sub', do: 'subfill', title: "Nick's Lawn. Three thousand four hundred.", body: 'The first time, their cell too. After that the name is in the list and it says texts them. Post it.' },
  { room: 'files', at: '#drawer #sub-card', do: 'closemodal', title: 'Three things happen. You do none of them.', body: 'The picture is on the file. Nick gets a text from the Oasis line with the contract picture, the price, and one question: do you take it at this price, yes or no. And Jess is tagged: her phone buzzes, the email goes, with the sub and the price. That is the email you used to write.' },
  { room: 'files', at: '#drawer #sub-card .rows', title: 'The receipt. Nothing to remember, nothing to argue.', body: 'Texted at 7:23. Opened. RECIBIDO, Nick, 7:32. Said yes. If it says not opened, call before a truck rolls. The price is locked to the sub on the file, for good.' },
  { room: 'files', at: '#drawer #sub-card .btn', title: 'Jess: the same card, on the same file.', body: 'Copy for CC puts the sub and the price in your clipboard, in the order you type it. Typed into CC turns the chip green with your name on it. The Office room lists every lock that is still waiting, oldest first.' },
  { room: 'files', at: '#drawer #sub-card', title: 'Billdu can wait. Nothing else changes today.', body: 'When you are ready, the Estimate button on the file is your Billdu shape: the customer taps ACCEPT on the link, the SIGNED email goes to Jess by itself, and you lock the sub the same way. Until then, the paper and the picture are fine. Nothing to learn. It comes to you.' },
];
const FILMS = { '1': STEPS, 'crews': CREW_STEPS, 'gio': GIO_STEPS, 'keys': KEYS_STEPS, 'office': OFFICE_STEPS, 'chain': CHAIN_STEPS, 'super': SUPER_STEPS, 'noc': NOC_STEPS, 'leads': LEADS_STEPS, 'sub': SUB_STEPS };
let FILM_NAME = '1';
// THE VOICE. &voice=1 reads every step aloud. Browsers refuse to speak until the person has tapped the page once
// (Chrome since 71, every iPhone), so a voiced film opens on a tap-to-start card. A step can carry a recorded
// narration at films/<film>/<n>.mp3 (tools/narrate.mjs); when the file is not there, the browser's best voice reads it.
const VOICE = /[?&]voice=1/.test(location.search) && ('speechSynthesis' in window || 'Audio' in window);
let voiceSeq = 0;
let RECORDED = null;   // films/index.json → { film: steps } for the films that have a recorded narrator
const recordedReady = VOICE ? fetch('films/index.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((j) => { RECORDED = j || {}; }) : Promise.resolve();
function bestVoice() {
  let vs = []; try { vs = speechSynthesis.getVoices() || []; } catch {}
  const want = ['Google US English', 'Samantha', 'Microsoft Aria Online (Natural)', 'Microsoft Guy Online (Natural)', 'Microsoft Ava Online (Natural)', 'Daniel', 'Alex'];
  for (const w of want) { const v = vs.find((x) => x.name === w || x.name.startsWith(w)); if (v) return v; }
  return vs.find((x) => /^en[-_]US/i.test(x.lang)) || vs.find((x) => /^en/i.test(x.lang)) || null;
}
// speak a step; done() fires when the last word has been said (used by autoplay to move on)
function narrate(s, done) {
  const my = ++voiceSeq;
  try { speechSynthesis.cancel(); } catch {}
  if (window.__narr) { try { window.__narr.pause(); } catch {} window.__narr = null; }
  const finish = () => { if (my === voiceSeq && done) done(); };
  const synth = () => {
    if (!('speechSynthesis' in window)) return finish();
    const parts = [s.title, ...(s.body.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [s.body])].map((x) => x.trim()).filter(Boolean);
    const v = bestVoice();
    parts.forEach((txt, k) => {
      const u = new SpeechSynthesisUtterance(txt); u.rate = 1.0; u.pitch = 1; if (v) u.voice = v; u.lang = (v && v.lang) || 'en-US';
      if (k === parts.length - 1) { u.onend = finish; u.onerror = finish; }
      try { speechSynthesis.speak(u); } catch { if (k === parts.length - 1) finish(); }
    });
  };
  // a recorded narration first, if the film has one
  recordedReady.then(() => {
    if (my !== voiceSeq) return;
    if (!RECORDED || !(RECORDED[FILM_NAME] >= i + 1)) return synth();
    const a = new Audio(`films/${FILM_NAME}/${i + 1}.mp3`);
    window.__narr = a;
    a.onended = finish; a.onerror = () => { if (my === voiceSeq) synth(); };
    a.play().catch(() => { if (my === voiceSeq) synth(); });
  });
}
const wordsMs = (s) => 900 + ((s.title + ' ' + s.body).split(/\s+/).length * 400);
let FILM = STEPS;
let i = 0, root = null, auto = null;
const AUTO_MS = 7000;
// ?auto=1 with ?tour=1: the tour runs itself, a step every seven seconds — the film, on the real screen
export function startTour(autoplay = /[?&]auto=1/.test(location.search), name = (/[?&]tour=([a-z0-9]+)/.exec(location.search) || [])[1]) {
  if (root && root.querySelector('.tour-card') && !root.querySelector('#tour-play')) return;   // already playing
  FILM = FILMS[name] || STEPS; FILM_NAME = FILMS[name] ? name : '1';
  i = 0; clearTimeout(auto); auto = null;
  if (!root) { root = document.createElement('div'); root.id = 'tour'; document.body.appendChild(root); }
  if (VOICE) {
    try { speechSynthesis.getVoices(); } catch {}
    root.innerHTML = html`
      <div class="tour-card center">
        <div class="kicker">Ride-Along · ${FILM.length} steps · with voice</div>
        <h2 class="serif">Sound on. Tap play.</h2>
        <p>It runs itself on the real screen: every step shown, said out loud, and written under the picture. Nothing here is real and nothing is saved.</p>
        <div class="tour-foot"><button class="btn" id="tour-x">Not now</button><span style="flex:1"></span><button class="btn fill" id="tour-play">▶ Play</button></div>
      </div>`;
    $('#tour-x').onclick = stop;
    let started = false;
    const start = (ev) => {
      if (started) return; started = true; if (ev) ev.preventDefault();
      try { speechSynthesis.speak(new SpeechSynthesisUtterance(' ')); } catch {}
      try { paint(autoplay); }
      catch (e) {
        started = false;
        const card = root.querySelector('.tour-card'); const msg = (e && e.message) || String(e);
        if (card) card.insertAdjacentHTML('beforeend', '<p class="small" style="color:var(--red)">It did not start: ' + esc(msg) + ' — tell Kevin those words. <a href="' + esc(location.pathname + location.search.replace(/&voice=1/, '')) + '">Play it without the voice</a>.</p>');
        try { console.error('ride-along start', e); } catch {}
      }
    };
    const go = root.querySelector('#tour-play'); go.addEventListener('click', start); go.addEventListener('pointerup', start);
    return;
  }
  paint(autoplay);
}
function stop() { clearTimeout(auto); auto = null; voiceSeq++; try { speechSynthesis.cancel(); } catch {} if (window.__narr) { try { window.__narr.pause(); } catch {} window.__narr = null; } if (root) { root.remove(); root = null; } document.querySelectorAll('.tour-lit').forEach((e) => e.classList.remove('tour-lit')); }
const AUTO_LONG = new Set(['peek:cj3']);   // the file steps get a beat more
function paint(autoplay = false) {
  const s = FILM[i];
  clearTimeout(auto); auto = null;
  const stepMs = VOICE ? wordsMs(s) + (s.do ? 1500 : 0) : AUTO_MS + (s.do ? 2500 : 0) + Math.max(0, (s.body.length - 160) * 25);
  const next = () => { clearTimeout(auto); auto = null; if (i < FILM.length - 1) { i++; paint(true); } };
  // with voice the step ends when the voice does (plus a breath); the timer is only the safety net
  if (autoplay && i < FILM.length - 1) auto = setTimeout(next, VOICE ? stepMs + 15000 : stepMs);
  document.querySelectorAll('.tour-lit').forEach((e) => e.classList.remove('tour-lit'));
  // the step's room: switch only when the seat has it and the page is not already there
  if (s.room && window.__go && !document.querySelector(`#tabs .tab.on[data-view="${s.room}"]`) && document.querySelector(`#tabs [data-view="${s.room}"]`)) window.__go(s.room);
  // a step can DO something first: fire the demo bing, or open a file beside the room — then light its target once it is there
  if (s.do === 'bing' && window.__demoBing) window.__demoBing();
  if (s.do && s.do.startsWith('peek:') && window.__peek && !document.querySelector('#drawer:not([hidden])')) window.__peek(s.do.slice(5));
  if (s.do === 'lightbox') document.querySelector('#drawer #photos-card .pthumb')?.click();
  if (s.do === 'lbcrew') { document.querySelector('#lb-crew')?.click(); }
  if (s.do === 'closemodal') { document.querySelector('#modal-cancel')?.click(); const lb = document.querySelector('#lightbox'); if (lb) lb.hidden = true; }
  // 381: the New lead door opens typed with a fictional lead; the next step closes it and opens the file the demo holds for her
  if (s.do === 'newjob' && window.__newJob && !document.querySelector('#modal-form')) window.__newJob({ cc: '1461', src: 'Google', name: 'Okonkwo, Grace', phone: '(321) 555-0177', email: 'grace.okonkwo@example.com', title: 'chain link quote needed', street: '4050 Palm Ave', city: 'Mims', zip: '32754', rep: 'r3', appt: nextMonday9(), mins: '60', note: 'gate code 2021 · dog in the yard' });
  // the address step types a street into the open door so the suggestions show for real (they come from the map; nothing is saved)
  if (s.do === 'address') { const st = document.querySelector('#modal-form [name=street]'); if (st) { st.value = '4050 Palm'; st.focus(); st.dispatchEvent(new Event('input', { bubbles: true })); } }
  // 397: the photo sheet opens as if a contract picture were taken; the next step ticks "this is the signed contract" and types the sub and the price
  if (s.do === 'photosheet' && window.__photoSheetOpen && !document.querySelector('#modal-form')) { window.__photoSheetOpen(); setTimeout(() => { const c = document.querySelector('#ps-contract'); if (c && !c.checked) { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); } }, 350); }
  if (s.do === 'subfill') { const f = document.querySelector('#modal-form'); if (f) { const c = f.querySelector('#ps-contract'); if (c && !c.checked) { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); } const set = (n, v) => { const el = f.querySelector('[name=' + n + ']'); if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); } }; set('sub', "Nick's Lawn"); set('subamt', '3400'); set('subphone', '(321) 555-0171'); } }
  if (s.do === 'newjobdone') { document.querySelector('#modal-cancel')?.click(); if (window.__peek && !document.querySelector('#drawer:not([hidden])')) window.__peek('cp15'); }
  // the voice: &voice=1 reads the caption in the browser's own voice (Kevin: "commentate our instructions")
  if (VOICE) narrate(s, autoplay && i < FILM.length - 1 ? () => setTimeout(next, 1400) : null);
  const light = () => { let t = null; if (s.at) for (const sel of s.at.split(',')) { t = document.querySelector(sel.trim()); if (t) break; } if (t) { t.classList.add('tour-lit'); t.scrollIntoView({ block: 'center', behavior: 'smooth' }); } return t; };
  let target = light();
  if (!target && s.do) setTimeout(() => { const t = light(); if (t) { const card = root && root.querySelector('.tour-card'); if (card) card.classList.remove('center'); } }, 900);
  root.innerHTML = html`
    <div class="tour-card ${target ? '' : 'center'}">
      <div class="kicker">Show me around · ${i + 1} of ${FILM.length}${autoplay ? " · playing" : ""}</div>${autoplay ? raw(`<div class="tour-bar"><i style="animation-duration:${stepMs}ms"></i></div>`) : ""}
      <h2 class="serif">${s.title}</h2>
      <p>${s.body}</p>${s.link ? raw(`<p><a class="btn sm fill" href="${esc(s.link)}" target="_blank" rel="noopener">${esc(s.linkText || 'Open')}</a></p>`) : ''}
      <div class="tour-foot">
        <button class="btn" id="tour-x">Skip</button>
        <span style="flex:1"></span>
        ${i > 0 ? raw('<button class="btn" id="tour-b">Back</button>') : ''}
        <button class="btn fill" id="tour-n">${i === FILM.length - 1 ? 'Done' : 'Next'}</button>
      </div>
    </div>`;
  $('#tour-x').onclick = stop;
  const b = $('#tour-b'); if (b) b.onclick = () => { i--; paint(autoplay); };
  $('#tour-n').onclick = () => { if (i >= FILM.length - 1) stop(); else { i++; paint(autoplay); } };
}
export const tourWanted = () => { const m = /[?&]tour=([a-z0-9]+)/.exec(location.search); return !!(m && FILMS[m[1]]); };
