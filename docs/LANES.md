# The lanes — one label per thread of work

Kevin, 14 Sep 2026: "should we split these tasks and label them easier to
follow." Yes. Every brief, commit and message uses one of these labels so
you can tell at a glance which thread a thing belongs to.

| Lane | What it is | Where it stands (14 Sep 2026) | What it needs from Kevin |
|---|---|---|---|
| **SIGN** | The estimate the customer taps ACCEPT on — Mike's Billdu flow on our own page (322). | Live. Customer page in Billdu's order (summary card → ACCEPT → the document). The builder is on the customer file in Central Command (the **Estimate** button). Phone-app builder next. | Walk it through on a test customer; say what feels different from Billdu. |
| **PAPERWORK** | The contract + disclosures under one signature — the DocuSign replacement (319–321). | Built, `esign_packet` switch OFF. Contract at signing; disclosures on the permit run; Oasis contract only. License line prints per brand (323). | "approved" on the four terms drafts → the version bumps and the drafts go live. |
| **PERMIT** | NOC and permit forms filled from county data, signed in person on the rep's phone. | **Lookup live (324):** the Property card on every file asks the county and shows owner of record, parcel, legal, mailing address and the signer check. Five counties answer from our server (Brevard via the county GIS layer, Orange, Volusia, Seminole, Flagler); Indian River waits on its weekly file. The lookup fires by itself when a customer taps ACCEPT. **The NOC fills itself (325):** the moment a customer taps ACCEPT the lookup runs and the NOC is made behind it, no tap needed; the Property card's "Fill the NOC" button remakes it any time. It makes the county's own form for Volusia and Flagler and the statutory NOC for Brevard, Indian River and Seminole, filled with owner of record, parcel, legal, mailing address, improvement and the contractor block; it lands on the file with an Open link and a list of the blanks the office still types (permit number, surety, lender, expiration, signature, notary). Next: the permit applications and hold-harmless forms per city, then in-person signing on the rep's phone. Regrid rejected ($375 a month, trial excludes our counties). | Indian River only: one weekly download of the appraiser's export. Later: e-recording and online notary decisions. |
| **FILES** | The customer file as the hub: text · tag · document · send to · invoice · collect · estimate. | Live in Central Command. CC files pull waits on `--apply` (Kevin runs it). | Run the CC files pull commands. |
| **OFFICE DAY** | The migrated CC workflow, the village rooms, the six switches. | Built beside CC, every switch OFF. | Flip switches one at a time when ready. |

Rules that hold in every lane: every outbound text/email is a draft until
Kevin says send; signing is not selling; never edit a published terms
version in place; nothing is switched over from Contractors Cloud until
Kevin says so.
