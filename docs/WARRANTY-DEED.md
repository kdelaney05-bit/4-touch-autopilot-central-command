# The warranty deed — when the county has the wrong owner

Kevin, 14 Sep 2026:

> "After the guy sells, it automatically generates the NOC and the permit
> paper information — and make sure who's on the county. If the customer's
> name that we sign is not on the county information we need to get a
> warranty deed from the customer, cause they probably just bought the
> house. So that needs to be triggered, that needs to be automated. The
> sales guy needs to know that he has to get the warranty deed, so when
> they go to sign it, it has to make sure."

## Why it happens

Every county roll we read is behind, and a fresh buyer is the owner before
the county knows it:

| County | How fresh the owner of record is |
|---|---|
| Brevard, Orange, Flagler | nightly / daily |
| Volusia, Seminole, Indian River | weekly (Indian River is a weekly download) |
| The statewide DOR fallback | 2–14 months |

So a customer who closed three weeks ago signs our contract and the appraiser
still prints the people he bought it from. That is not a problem with the
customer; it is the roll catching up. The deed in his closing package is the
proof, and the **Notice of Commencement is sworn by the owner** — which is why
nothing prints until we have it.

## The rule

**If the person signing is not the owner of record, the file needs the
warranty deed, and the NOC and the permit wait on it.** Three ways the county
answer can send us here:

| What the county says | What we need |
|---|---|
| `mismatch` — a different name on the roll | The warranty deed from the customer. They just bought it. |
| `entity` — a company, trust or estate owns it | The deed, plus the name and title of whoever can sign for it. |
| `confidential` — a protected address | The deed the customer holds. Nothing prints off the county record. |

## Where it shows up

1. **On the rep's screen, before the signature.** The estimate builder and the
   send screen both carry the county's owner of record across the top. Red
   when that is not who is about to sign: *GET THE WARRANTY DEED — the county
   has PORTER, JAMES E on this address… photograph their warranty deed before
   you leave.* When nobody has asked the county yet, the band says so and says
   the check runs itself on ACCEPT. Gospel 3: the next step shouts, and it
   shouts while the customer is still in the driveway.
2. **The file's NEXT line.** While the deed is missing it beats everything
   else on the file, including open asks.
3. **The Property card.** A `WARRANTY DEED NEEDED` chip, the reason in one
   line, who is holding the ask, **Upload the deed**, **Ask the customer for
   it** (a text draft), and **Fill the NOC is disabled** until the deed lands.
4. **The Office room.** The deed is an ordinary ask in the queue, oldest
   first, closed by the document.
5. **The Business (home).** The Office door counts *Warranty deed needed*
   beside *Signer is not the owner*, from the latest county answer per
   customer.

## How it holds the permit — no new machinery

The deed is a **`CONTRACT_DOC` ask with `doc_kind` `deed`** — a piece of the
paperwork checklist, not a new ask type. That is the whole trick:
`ask_chain` row 1 opens `PERMIT` only when **no `CONTRACT_DOC` ask is still
open** (`requires_none_open`). So an open deed ask holds the permit by itself.
No code decides it; the chain already did, since 316.

`doc_kind` is free text on `thread_asks`, `ask_chain` and `ask_proof_rules`
(checked against the live database, 14 Sep 2026), so **this needed no
migration**.

## What is automatic today, and what is not

**Automatic now, in this app:** the county answer opens the deed ask itself.
Ask the county from the Property card (or let a rep press *Ask the customer
for it*) and a `mismatch`, `entity` or protected answer opens the deed ask on
the seat holding the file, before anyone has to remember. The permit then
waits on it, and the NOC button is off until the document is on the file.

**Not automatic yet — one hook, one row, both outside this repo:**

- The lookup that fires by itself when a customer taps ACCEPT lives in the
  `parcel-lookup` edge function (`kdelaney05-bit/trureview-mobile`, 324). It
  saves the answer; it does not yet open the deed ask. The same three-line
  rule belongs there, so a customer who accepts at 9 PM has the deed ask open
  at 9 PM. Until that ships, the ask opens the moment anybody opens the file
  and asks the county from it.
- One row, so the ask asks for the right thing by name (today it falls back to
  the generic "The document"):

  ```sql
  insert into ask_proof_rules (ask_type, doc_kind, proof_kind, min_count, waivable, label)
  values ('CONTRACT_DOC', 'deed', 'file', 1, true,
          'The recorded warranty deed — a photo or the PDF from their closing package');
  ```

  A row, not code: Kevin's and Jess's to add when he says so. Nothing here
  writes to the live database on its own.

## What the office does when the deed lands

Fill the NOC **off the deed** — the owner exactly as the deed names them, not
the old name the county still carries — and note the deed's book and page. The
rest of the run is unchanged: the blanks the office types (permit number,
surety, lender, expiration, signature, notary), notarize, record at the Clerk,
upload to the permit portal.

## Kevin's calls, still open

1. **Who holds the deed ask?** Today it lands on the seat holding the file
   (the office). The other shape: it sits on the **rep** for 24 hours first —
   the same gate as *Turn in the job* in `docs/signing.html` — and only then
   falls to the office. Kevin's word decides it.
2. **Waivable?** The proof rule above says yes (an office seat can close it
   with "not required, because…" and a reason on the file). Say no and the
   document becomes the only way out.
3. **Does the customer get asked automatically?** The text is a draft a seat
   presses Send on, like every outbound word. If it should go out by itself
   when the county comes back wrong, that is a new switch in the Office room —
   OFF until Kevin flips it.
