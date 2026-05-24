# Bush41-MEPP

A static FRUS compiler-assist workbench for:

<https://history.state.gov/historicaldocuments/frus1989-92v14>

Scope: *Foreign Relations of the United States, 1989-1992, Volume XIV, Arab-Israeli Dispute*.

## What It Includes

- Declassified presidential memoranda of conversation and telephone conversations from the George H.W. Bush Library / National Archives Catalog
- Public Papers of the Presidents references from GovInfo, with page-level PDF links
- Track-based arrangement for Israel, Palestinian/Jordanian, Syria/Lebanon, Egypt/Arab regional, and Madrid/multilateral materials
- Search, filters, local review state, source-note copy buttons, and CSV export
- Persons list, event dossiers, source-series leads, and a compiler gap register
- PDF page-count/review-marker enrichment for the current presidential corpus
- Date/track/term-based public/private chronology linkage
- Public NARA source-candidate harvests for unfilled State, NSC, WHORM, and post-Madrid lanes
- Richard N. Haass' Chronological Files candidates from NARA Catalog series NAID 2554857
- Targeted Richard N. Haass file-series candidates from NARA Catalog series NAIDs 2554859, 2554865, 2554866, 2554868, 2554871, 2554875, 2554876, and 2554877
- Princeton James A. Baker III Papers candidates from the MC197 EAD finding aid
- GitHub Actions validation and GitHub Pages deployment workflow
- Reproducible harvest scripts and JSON/JS data bundles for GitHub Pages

## Run Locally

This is a no-build static site. From the repo root:

```bash
python3 -m http.server 4173
```

Open:

```text
http://127.0.0.1:4173
```

## Refresh Data

```bash
node scripts/harvest-presidential-conversations.js
node scripts/harvest-public-statements.js
node scripts/harvest-source-candidates.js
node scripts/harvest-haass-chronological-files.js
node scripts/harvest-haass-target-series.js
node scripts/harvest-baker-princeton.js
node scripts/enrich-record-pdfs.js
node scripts/link-public-private.js
node scripts/build-supporting-data.js
```

The Public Papers, NARA source-candidate, and Princeton finding-aid harvests cache downloaded source material in `.cache/`, which is intentionally ignored by git.

## Current Seed Corpus

- `data/records.json`: presidential conversations
- `data/public-statements.json`: Public Papers references
- `data/persons.json`: front-matter persons list
- `data/events.json`: event dossiers
- `data/compiler-gaps.json`: compiler gap register
- `data/source-leads.json`: source-series and research-lane leads
- `data/source-candidates.json`: combined source-candidate harvest for gap remediation
- `data/haass-chronological-candidates.json`: Richard N. Haass' Chronological Files candidates
- `data/haass-target-series-candidates.json`: targeted Richard N. Haass file-series candidates
- `data/baker-princeton-candidates.json`: Princeton James A. Baker III Papers candidates

## Verification

Useful checks:

```bash
node --check app.js
node --check scripts/harvest-presidential-conversations.js
node --check scripts/harvest-public-statements.js
node --check scripts/build-supporting-data.js
npm test
```
