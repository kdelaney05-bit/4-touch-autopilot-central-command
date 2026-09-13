# PERMIT lane — where the owner of record comes from, county by county

Verified 14 Sep 2026 with live calls on public government addresses. No keys,
no sign-ups, no paid service. Regrid was tried the same day and rejected: its
trial excludes every county we sell in and the paid plan is $375–$500 a month.

The build makes ONE normalized record per address — owner names, owner mailing
address, parcel id, legal description, last deed book/page/instrument, sale
date, source, as-of — behind one small adapter per county. Two counties are
browser-only (Cloudflare blocks server calls), so those lookups run on the
rep's phone at signing and the result is saved to the file; the other four
run from the edge function.

| County | Source | Server-callable | Owner · Mailing · Parcel · Legal · Book/Page · Sale | Fresh |
|---|---|---|---|---|
| **Brevard** | BCPAO's own API: `bcpao.us/api/v1/search?address=…` → `account`, then `/api/v1/account/{account}` | **No** (Cloudflare) → rep's phone | all present (`owner`, `ownerNames[]`, `mailingAddress`, `parcelID`, `legalDescription`, `salesHistory[].book/page`, `platBookPage`) | nightly |
| **Orange** | OCPA API behind Azure Front Door: `ocpa-mainsite-afd-standard.azurefd.net/api/QuickSearch/GetSearchInfoByAddress?address=…` → `parcelId`, then `/api/PRC/GetPRCGeneralInfo`, `/GetPRCPropFeatLegal`, `/GetPRCSales` (`?pid=`) | Yes, with browser `User-Agent` + `Origin: https://ocpaweb.ocpafl.org` + `Referer` headers | all present (`ownerName`, `mailAddress/City/State/Zip`, `parcelId`, `propertyDescription`, sales `book/page/instrNum/deedDesc/saleDate`) | nightly (`/api/Parcel/GetSystemRefreshDate`) |
| **Volusia** | VCPA: `POST vcpa.vcgov.org/api/search/real-property` (form `search[value]=…`) → `altkey`, then `POST /api/export/parcel` (`altlist=`, `Accept: text/csv`) | Yes | owner `OWNER1/2/CAREOF` · mailing `MAILADDR1-3/CITY/STATE/ZIP` · parcel `DORPID` · legal `LEGAL1-3`+`SUBDIV` · **book/page missing** (backfill from NAL) · `LASTSALEDT/PRICE` | weekly |
| **Seminole** | SCPA ArcGIS: `map.scpafl.org/gis/sharing/servers/53774df119f24a0d9397a52e0e581f2f/rest/services/production/parcels_building_sales/MapServer/19/query?where=PrimaryAddress LIKE '…%'` ; book/page from layer `15` by `Parcel` | Yes | `OwnerName`, `MailingAddress`, `Parcel`/`ParcelFormat`, `LegalDescription`, `OraBook/OraPage` (only parcels with a qualified sale), `LastSaleDate` | ~weekly |
| **Flagler** | County GIS on ArcGIS Online: `services3.arcgis.com/hSKL9bYjhP4rHxSD/arcgis/rest/services/Flagler_County_Parcels/FeatureServer/0/query?where=situs_num='…' AND situs_street LIKE '…%'` | Yes | `file_as_name`, `addr_line1-3/addr_city/addr_state/zip`, `PARCELNO`, `Legal`, `book1/page1/inst1`, `saleDt1` | daily |
| **Indian River** | Official: qPublic (browser-only) and the PA's weekly Web Export zip `beacon.schneidercorp.com/FileData/IndianRiverCountyFL/DataDownload/DataDownload.zip` (browser-only, has PROPERTY/OWNER/SALES with legal + book/page). The only server-callable layer (`services9.arcgis.com/M0DpVhTwTZ42jNsw/…/IRCPA_Parcels`) is an Oct-2023 snapshot with no legal or book/page — a hint, not NOC-grade | **No** for anything current | see left | weekly zip |

**Indian River plan:** the office downloads the Web Export zip once a week (one
click in a browser) and drops it on the file's import door; we load it into a
table and look up from that. Owner of record at most a week old, full legal and
book/page. The 2023 layer is only used to warn "this address may not match".

**Statewide fallback (all 67 counties, identical columns):** the Florida DOR NAL
roll, anonymous HTTPS, one zip per county, e.g.
`https://floridarevenue.com/property/dataportal/Documents/PTO%20Data%20Portal/Tax%20Roll%20Data%20Files/NAL/2026P/Volusia%2074%20Preliminary%20NAL%202026.zip`
(Brevard 15, Flagler 28, Indian River 41, Orange 58, Seminole is mis-named
"Seminole 58" by DOR; CO_NO inside is 69). Preliminary posts late July, Final
after October certification; DOR removes the prior year, so archive each zip.
Good for `OR_BOOK1/OR_PAGE1/CLERK_NO1` backfill and a sanity check; NOT good
for the NOC legal (`S_LEGAL` is capped at 30 characters) or for owner of record
(2–14 months stale).

**Rules the lookup enforces at signing**
1. Signer name vs owner names: no match → the file goes red, the packet does not
   print, the rep is asked for the authorized signer (LLC, trust, estate, recent buyer).
2. Owner mailing address ≠ job address → NOC uses the mailing address; the file notes it.
3. Jurisdiction from the taxing district / city → picks that jurisdiction's form set.
4. Palm Coast → no permit; the permit run is skipped and the file says why.
5. `confidential` / protected-address flags are honored: nothing printed from the record.
6. Every record carries `source` and `as_of`; the office sees both on the file.

Samples and raw layer JSON from the verification run live in the session
scratchpad under `pa/` (not committed).
