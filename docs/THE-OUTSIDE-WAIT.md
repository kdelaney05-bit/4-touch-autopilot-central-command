# The outside wait — HOA approval and the permit

Kevin, 15 Sep 2026: *"the two bottlenecks that I've heard are waiting on HOA
approval… and then waiting on permit. So can we think how to work or nurture
that through more?"*

He is right, and the Line's own board agrees: PERMIT is the oldest lane in the
ask queue, and *"any update on the permit?"* is the second most-asked customer
question. Both bottlenecks are the same shape — **an ask on somebody who does
not work for us and has no reason to hurry** — and today the only thing moving
either one along is a human remembering.

## The one thing to understand first

**An HOA is not slow. An HOA is periodic.**

A county is a queue: work goes in, work comes out, roughly first in first out.
Pushing on a queue gets you a little. An architectural review committee is a
**meeting**. If the board meets the second Tuesday and closes submissions ten
days before, then a packet handed in on a Thursday is not one day late — it is
**a month late**. Nothing anybody does in those four weeks changes the date.

That is why "follow up more" has never fixed HOA. The fix is to never miss the
window, which means the meeting date has to be *data* before the packet is
even built.

The two bottlenecks therefore get two different treatments:

| | HOA | Permit |
|---|---|---|
| What it is | a meeting on a calendar | a queue with a clerk |
| What wins | hitting the submission window | a complete packet, and a named human |
| What the customer can do | **a lot** — they are a member | almost nothing |
| Worst failure | missing the cutoff by a day, losing a month | a rejection nobody noticed for a week |

## HOA — the four moves

**1. Capture the calendar, once, per association.** Meeting cadence, the
submission deadline before it, who receives the packet, what they require, and
what they have historically taken. One row per HOA, reused forever, and every
customer in that neighbourhood inherits it. This is the single highest-value
thing on this page: it converts a four-week surprise into a date the office
can see at signing.

**2. Start it at signing, in parallel with the permit — never after it.**
Today HOA tends to begin when somebody notices it is needed. It should open
the day the contract is signed, beside the permit, not behind it. The drawing
the calculator already produces (328) plus the survey is most of what an ARC
asks for, and we have both.

**3. The customer is the lever, and we barely use them.** An HOA answers its
own member far faster than it answers a contractor. So the nurture runs on two
tracks: a machine email to the association, and — from day 10 — a one-tap
message the *homeowner* sends, written for them, from their file:

> "Hi — checking on the fence application submitted on the 3rd for 2300 Cox Rd.
> Is it on the agenda for the 14th, or is anything still missing? Thank you."

This is the same move as the reference-sheet rail: the customer does the work
that only the customer can do, and it costs a text. It also answers the
most-asked question by itself, because now they know where it stands.

**4. Nurture the association like a bid.** The Long Game machinery already
built for commercial (226: `nurture_sequences` / `steps` / `enrollments`, with
`kind = machine | prompt`) is exactly the right engine — it already knows how
to send on an anchor date, throttle per person, and hand a step to a human
instead of sending it. Point it at a third party instead of a prospect:

| Day | Kind | What goes out |
|---|---|---|
| 0 | machine | Submission confirmed, with the packet attached and a reference number asked for |
| 3 | machine | "Confirming you received it — is anything missing?" |
| 7 | machine | "Is this on the agenda for *meeting date*?" |
| 10 | **prompt** | The office texts the homeowner the one-tap note above |
| 14 | **prompt** | A named human calls the named human, and the call is logged |
| cutoff − 2 | machine | Only if still unsubmitted: "this misses the window on Friday" — to *us*, loudly |

## Permit — the three moves

**1. Completeness, before submission.** The bottleneck inside the bottleneck
is the rejection nobody predicted. Every returned packet's reason gets written
down, per jurisdiction; the top three reasons become a check the machine runs
before anything is filed. 324 (owner of record) and 325 (the NOC, filled) are
already two of these — they exist because "signer is not the owner" was a
rejection. The list should keep growing from the record, not from memory.

**2. A named human per building department.** Not "Palm Bay" — a person, an
extension, and the hours they answer. Stored beside the jurisdiction rules
(324's `permit_jurisdiction_rules`), so the day-14 call has somebody to call.

**3. Poll the status so no human has to ask.** Most Florida counties publish
permit status. The day we can read it, *"any update on the permit?"* stops
being a question a person answers — the customer is told the moment it moves.
That one change takes the #2 most-asked question off the board permanently,
and it is the clearest case on the Biopsy page of a recurring question the
database could answer by itself.

## What has to exist for any of this

Small, and mostly additive:

- **`hoa_associations`** — name, contact, email, portal, meeting cadence,
  submission-deadline days, requirements, and the running median of how long
  they actually take. `customers.hoa_id` links a file to one.
- **`permit_jurisdiction_rules`** (exists, 324) — gains median days, portal
  URL, the named contact, and the common rejection reasons.
- **`third_party_submissions`** — one row per submission, HOA or permit:
  submitted_at, reference, status, returned_at, reject_reason, approved_at.
  **This one table is what makes every number on this page computable**: the
  medians, the rejection list, the per-association reality. Without it we are
  back to remembering.
- The nurture sequences above, as rows — inactive until Kevin reads the words
  (the email-launch gate binds here exactly as it does everywhere else).

## What it changes on the screens

- **The Line** — "Where it is stuck" grows a lane for *waiting on someone
  outside*, with what has been done about it and what is next.
- **The customer file** — the HOA card beside the Property card (324): the
  association, the meeting date, where the packet is, what we sent and when.
- **The office** — at signing, one line: *"Bayside ARC meets the 2nd Tuesday.
  Packet is due Friday the 5th. Submit by Thursday or the start date moves to
  November."* That sentence is the whole point of this document.

## The honest limit

None of this makes a county or a board move faster. What it does is make sure
**we are never the reason it is slow**, that a missed window can never happen
quietly, and that the customer always knows where it stands — which is most of
what "waiting on the permit" actually costs us today.
