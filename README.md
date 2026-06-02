# Bush41-MEPP

A static FRUS compiler-assist workbench for:

<https://history.state.gov/historicaldocuments/frus1989-92v14>

Scope: *Foreign Relations of the United States, 1989-1992, Volume XIV, Arab-Israeli Dispute*.

## What It Includes

- Declassified presidential memoranda of conversation and telephone conversations from the George H.W. Bush Library / National Archives Catalog
- First-screen declassified-document chronology for starting review directly from the dated presidential record sequence
- Public Papers of the Presidents references from GovInfo, with page-level PDF links
- Shareable Public Papers view links for exact public-chronology filter handoffs
- Track-based arrangement for Israel, Palestinian/Jordanian, Syria/Lebanon, Egypt/Arab regional, and Madrid/multilateral materials
- Search, filters, local review state, source-note and compiler-packet copy buttons, and CSV export
- Filter-aware source-note registers for the visible chronology and source-candidate queues, with copy/download actions
- Filter-aware meeting/call crosswalk comparing visible presidential records against Daily Diary/Backup, public chronology, and source-candidate support
- Browser-saved record decisions for Include, Maybe, and Exclude, with filters and portable workspace-state support
- Shareable chronology view links for handing off exact filtered/sorted review states
- Copy/download selection slate for browser-marked Include and Maybe records, grouped by track with source support and source-note context
- Batch copy/download of visible chronology and source-candidate compiler packets
- Compiler action dashboard for one-click anchor/high, unsupported, public-crosswalk, digital-candidate, and shortlisted-source queues
- Copy/download compiler action worklist covering unresolved record queues, source-candidate queues, and open gap follow-up
- Local working notes saved in the browser, plus full dataset copy/download as JSON
- Portable workspace-state copy/download/import for browser-saved notes, record review state, and source-candidate triage
- Source-candidate triage by lane group, linkage to presidential meetings/calls, and digital-object status, with copyable candidate packets
- Shareable source-candidate view links for handing off exact filtered archive-request queues
- Filter-aware source-candidate pull list for archive requests/checklists, grouped by repository, lane, and source series
- Browser-saved source-candidate shortlist and reviewed-state queue for multi-session compiler triage
- Persons list, event dossiers, source-series leads, and a compiler gap register
- PDF page-count/review-marker enrichment for the current presidential corpus
- Date/track/term-based public/private chronology linkage
- Public NARA source-candidate harvests for unfilled State, NSC, WHORM, and post-Madrid lanes
- Richard N. Haass' Chronological Files candidates from NARA Catalog series NAID 2554857
- Targeted Richard N. Haass file-series candidates from NARA Catalog series NAIDs 2554859, 2554865, 2554866, 2554868, 2554871, 2554875, 2554876, and 2554877
- Additional gap-remediation candidates from Haass Presidential Meeting Files and Madrid briefing-book series
- Presidential Daily Diary and Backup Materials candidates from NARA Catalog series NAID 186322, crosswalked to selected FRUS meeting and call dates
- Princeton James A. Baker III Papers candidates from the MC197 EAD finding aid
- Source-candidate review metadata, including page/image counts where practical and explicit large-PDF/manual-review flags
- Source-support summary cards in the opening chronology for linked candidates, Daily Diary/Backup corroboration, public chronology links, and unsupported records
- Track coverage matrix and exportable coverage summary for source-support, public-crosswalk, undecided-selection, and review-risk triage
- FRUS-style source note generation and audit checks for presidential records and source candidates
- Filter-aware draft document-list export from the opening chronology for working volume assembly
- Filter-aware annotation planner from visible records, public chronology links, people/entities, issues, and source-candidate evidence
- Filter-aware source map grouping visible presidential records and linked candidates by repository, collection, and source series
- Filter-aware people index export from the opening chronology for front-matter and participant verification
- Filter-aware chronology issue register for source-support gaps, local review state, and PDF/source-note verification prompts
- GitHub Actions validation and GitHub Pages deployment workflow
- Compiler-network handoff copy button for moving page context into pull requests, source-note checks, or cross-tool review
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
node scripts/harvest-gap-remediation-candidates.js
node scripts/harvest-daily-diary-candidates.js
node scripts/harvest-baker-princeton.js
node scripts/enrich-record-pdfs.js
node scripts/enrich-source-candidate-reviews.js
node scripts/link-public-private.js
node scripts/build-supporting-data.js
node scripts/audit-frus-source-notes.js
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
- `data/gap-remediation-candidates.json`: additional high-value Bush Library gap-remediation candidates
- `data/daily-diary-candidates.json`: Presidential Daily Diary/Backup date crosswalk and meeting/call candidates
- `data/baker-princeton-candidates.json`: Princeton James A. Baker III Papers candidates

## Verification

Useful checks:

```bash
node --check app.js
node --check scripts/harvest-presidential-conversations.js
node --check scripts/harvest-public-statements.js
node --check scripts/harvest-daily-diary-candidates.js
node --check scripts/build-supporting-data.js
node scripts/audit-frus-source-notes.js
npm test
```
