const records = window.MEPP_RECORDS || [];
const publicStatements = window.MEPP_PUBLIC_STATEMENTS || [];
const persons = window.MEPP_PERSONS || [];
const events = window.MEPP_EVENTS || [];
const compilerGaps = window.MEPP_COMPILER_GAPS || [];
const sourceLeads = window.MEPP_SOURCE_LEADS || [];
const sourceCandidates = window.MEPP_SOURCE_CANDIDATES || [];

const REVIEW_STORAGE_KEY = "bush41-mepp-reviewed-records";
const NOTES_STORAGE_KEY = "bush41-mepp-compiler-notes";
const VOLUME_TITLE = "Foreign Relations of the United States, 1989-1992, Volume XIV, Arab-Israeli Dispute";

const CHAPTER_INFO = {
  "Israel Track": {
    number: 1,
    short: "Israel",
    description:
      "Israeli leadership conversations, settlements, loan guarantees, electoral transition, and U.S. pressure on the Shamir and Rabin governments."
  },
  "Palestinian-Jordanian Track": {
    number: 2,
    short: "Palestinian/Jordanian",
    description:
      "Jordanian-Palestinian delegation issues, PLO constraints, West Bank and Gaza references, and regional Arab participation formulas."
  },
  "Syria-Lebanon Track": {
    number: 3,
    short: "Syria/Lebanon",
    description:
      "Assad diplomacy, Syrian participation, Lebanon implications, and the way coalition politics shaped peace-process leverage."
  },
  "Egypt-Arab Regional Track": {
    number: 4,
    short: "Egypt/Arab Regional",
    description:
      "Egyptian, Saudi, Moroccan, and broader Arab-state diplomacy that bracketed Madrid and the postwar peace-process opening."
  },
  "Madrid-Multilateral Track": {
    number: 5,
    short: "Madrid/Multilateral",
    description:
      "Madrid conference, U.S.-Soviet co-sponsorship, UN references, public framing, and cross-track negotiation architecture."
  }
};

const selectors = {
  totalRecords: document.querySelector("#total-records"),
  totalPdfs: document.querySelector("#total-pdfs"),
  totalPages: document.querySelector("#total-pages"),
  totalStatements: document.querySelector("#total-statements"),
  totalSourceCandidates: document.querySelector("#total-source-candidates"),
  totalPersons: document.querySelector("#total-persons"),
  totalGaps: document.querySelector("#total-gaps"),
  totalReviewed: document.querySelector("#total-reviewed"),
  recordsRoot: document.querySelector("#records-root"),
  filteredCount: document.querySelector("#filtered-count"),
  searchInput: document.querySelector("#filter-search"),
  chapterFilter: document.querySelector("#filter-chapter"),
  typeFilter: document.querySelector("#filter-type"),
  yearFilter: document.querySelector("#filter-year"),
  sourceFilter: document.querySelector("#filter-source"),
  supportFilter: document.querySelector("#filter-support"),
  valueFilter: document.querySelector("#filter-value"),
  reviewFilter: document.querySelector("#filter-review"),
  sortRecords: document.querySelector("#sort-records"),
  resetFilters: document.querySelector("#reset-filters"),
  exportCsv: document.querySelector("#export-csv"),
  supportSummary: document.querySelector("#support-summary"),
  chapterGrid: document.querySelector("#chapter-grid"),
  eventsRoot: document.querySelector("#events-root"),
  personsRoot: document.querySelector("#persons-root"),
  personSearch: document.querySelector("#person-search"),
  personChapter: document.querySelector("#person-chapter"),
  personCount: document.querySelector("#person-count"),
  exportPersons: document.querySelector("#export-persons-csv"),
  statementsRoot: document.querySelector("#statements-root"),
  statementSearch: document.querySelector("#statement-search"),
  statementChapter: document.querySelector("#statement-chapter"),
  statementYear: document.querySelector("#statement-year"),
  statementRelevance: document.querySelector("#statement-relevance"),
  sortStatements: document.querySelector("#sort-statements"),
  statementCount: document.querySelector("#statement-count"),
  resetStatements: document.querySelector("#reset-statements"),
  exportStatements: document.querySelector("#export-statements-csv"),
  sourceLeadsRoot: document.querySelector("#source-leads-root"),
  sourceCandidatesRoot: document.querySelector("#source-candidates-root"),
  candidateSearch: document.querySelector("#candidate-search"),
  candidateChapter: document.querySelector("#candidate-chapter"),
  candidatePriority: document.querySelector("#candidate-priority"),
  candidateLevel: document.querySelector("#candidate-level"),
  candidateLaneGroup: document.querySelector("#candidate-lane-group"),
  candidateLinkage: document.querySelector("#candidate-linkage"),
  candidateAccess: document.querySelector("#candidate-access"),
  candidateCount: document.querySelector("#candidate-count"),
  resetSourceCandidates: document.querySelector("#reset-source-candidates"),
  exportSourceCandidates: document.querySelector("#export-source-candidates-csv"),
  gapsRoot: document.querySelector("#gaps-root"),
  gapSearch: document.querySelector("#gap-search"),
  gapPriority: document.querySelector("#gap-priority"),
  gapCategory: document.querySelector("#gap-category"),
  gapCount: document.querySelector("#gap-count"),
  exportGaps: document.querySelector("#export-gaps-csv"),
  reviewRoot: document.querySelector("#review-root"),
  openReviewCount: document.querySelector("#open-review-count"),
  reviewedListSummary: document.querySelector("#reviewed-list-summary"),
  compilerNotes: document.querySelector("#compiler-notes"),
  notesStatus: document.querySelector("#notes-status"),
  copyVolumeTitle: document.querySelector("#copy-volume-title"),
  copyDatasetJson: document.querySelector("#copy-dataset-json"),
  downloadDatasetJson: document.querySelector("#download-dataset-json")
};

let reviewedRecords = new Set(readReviewedRecords());
let visibleRecords = [];
let visibleStatements = [];
let visiblePersons = [];
let visibleGaps = [];
let visibleSourceCandidates = [];

const recordById = new Map(records.map((record) => [record.id, record]));
const statementById = new Map(publicStatements.map((statement) => [statement.id, statement]));
const sourceCandidateById = new Map(sourceCandidates.map((candidate) => [candidate.id, candidate]));
const sourceCandidatesByRecordId = buildSourceCandidatesByRecordId();

function readReviewedRecords() {
  try {
    return JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveReviewedRecords() {
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify([...reviewedRecords]));
}

function readLocalValue(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function saveLocalValue(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDate(value) {
  if (!value) return "Date not determined";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}

function normalize(value) {
  return String(value || "").toLowerCase();
}

function uniqueValues(items, selector) {
  return [...new Set(items.map(selector).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

function setOptions(select, values, allLabel) {
  if (!select) return;
  const current = select.value;
  select.replaceChildren(new Option(allLabel, ""), ...values.map((value) => new Option(value, value)));
  if (values.includes(current)) select.value = current;
}

function buildSourceCandidatesByRecordId() {
  const map = new Map();
  for (const candidate of sourceCandidates) {
    for (const id of candidate.relatedRecordIds || []) {
      const items = map.get(id) || [];
      items.push(candidate);
      map.set(id, items);
    }
  }
  for (const items of map.values()) {
    items.sort(
      (a, b) =>
        String(a.lane).localeCompare(String(b.lane)) ||
        String(a.date || "").localeCompare(String(b.date || "")) ||
        String(a.title).localeCompare(String(b.title))
    );
  }
  return map;
}

function chapterNames() {
  return Object.keys(CHAPTER_INFO);
}

function linkedSourceCandidatesForRecord(record) {
  return sourceCandidatesByRecordId.get(record.id) || [];
}

function hasDailyDiaryCandidate(record) {
  return linkedSourceCandidatesForRecord(record).some((candidate) => candidate.lane === "Presidential Daily Diary/Backup");
}

function candidateLaneGroup(candidate) {
  const lane = normalize(candidate.lane);
  const repository = normalize(candidate.repository);
  const series = normalize(candidate.sourceSeries);
  if (lane.includes("daily diary") || series.includes("daily diary")) return "Presidential Daily Diary/Backup";
  if (lane.includes("baker princeton") || repository.includes("princeton")) return "Baker Princeton Papers";
  if (lane.includes("haass") || series.includes("haass")) return "Richard Haass Files";
  if (lane.includes("state/baker/ross")) return "State/Baker/Ross Leads";
  if (lane.includes("nsc") || lane.includes("whorm") || lane.includes("briefing books")) return "NSC/WHORM/Briefing Leads";
  if (repository.includes("bush library") || repository.includes("national archives")) return "Bush Library/NARA Leads";
  if (lane.includes("israel") || lane.includes("palestinian") || lane.includes("syria") || lane.includes("egypt") || lane.includes("madrid")) {
    return "Track Issue Leads";
  }
  return "Other Source Leads";
}

function candidateHasDigitalObject(candidate) {
  return Boolean(candidate.digitalObjectUrl || candidate.hasDigitalObject);
}

function sourceSupportCounts(items = records) {
  return items.reduce(
    (counts, record) => {
      const linkedSourceCandidates = linkedSourceCandidatesForRecord(record);
      if (linkedSourceCandidates.length) counts.linkedSource += 1;
      else counts.unsupported += 1;
      if (linkedSourceCandidates.some((candidate) => candidate.lane === "Presidential Daily Diary/Backup")) counts.dailyDiary += 1;
      if (record.publicChronologyLinks?.length) counts.publicChronology += 1;
      return counts;
    },
    { linkedSource: 0, dailyDiary: 0, publicChronology: 0, unsupported: 0 }
  );
}

function tagsHtml(tags) {
  return tags
    .filter(Boolean)
    .slice(0, 12)
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join("");
}

function valueClass(value) {
  if (value === "Anchor") return "anchor";
  if (value === "High") return "high";
  return "";
}

function searchText(record) {
  return [
    record.naid,
    record.title,
    record.documentType,
    record.chapter?.name,
    record.eventLabel,
    record.selectionValue,
    record.source?.shortName,
    record.sourceConfidence?.label,
    record.sourceConfidence?.basis,
    record.localIdentifier,
    record.frusSourceNote,
    record.catalogTrail,
    record.compilerNote,
    ...(record.people || []),
    ...(record.countries || []),
    ...(record.matchedQueries || []),
    ...linkedSourceCandidatesForRecord(record).flatMap((candidate) => [
      candidate.title,
      candidate.lane,
      candidate.sourceSeries,
      candidate.sourceNote,
      ...(candidate.evidenceSnippets || [])
    ])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function statementSearchText(statement) {
  return [
    statement.title,
    statement.dateText,
    statement.chapter?.name,
    statement.documentType,
    statement.publicVoice,
    statement.relevance,
    statement.compilerUse,
    statement.citation,
    statement.source?.shortName,
    ...Object.values(statement.matchedTerms || {})
      .flat()
      .map((term) => term.label)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function personSearchText(person) {
  return [person.name, person.role, person.country, person.chapter, person.compilerUse, ...(person.aliases || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function gapSearchText(gap) {
  return [gap.title, gap.priority, gap.category, gap.chapter, gap.evidence, gap.nextStep].join(" ").toLowerCase();
}

function sourceCandidateSearchText(candidate) {
  return [
    candidate.title,
    candidate.priority,
    candidate.repository,
    candidate.documentType,
    candidate.chapter,
    candidate.lane,
    candidate.level,
    candidate.sourceSeries,
    candidate.collection,
    candidate.localIdentifier,
    candidateLaneGroup(candidate),
    candidate.scopeAndContentNote,
    candidate.reason,
    candidate.sourceNote,
    ...(candidate.evidenceSnippets || []),
    ...(candidate.matchedQueries || []),
    ...(candidate.relatedRecordTitles || []),
    ...(candidate.relatedRecords || []).map((record) => [record.title, record.date, record.chapter].join(" "))
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function compareRecords(a, b) {
  const mode = selectors.sortRecords?.value || "chapter-date";
  const valueRank = { Anchor: 0, High: 1, Context: 2 };
  if (mode === "date") return a.sortDate.localeCompare(b.sortDate) || a.title.localeCompare(b.title);
  if (mode === "value") {
    return (
      (valueRank[a.selectionValue] ?? 9) - (valueRank[b.selectionValue] ?? 9) ||
      a.sortDate.localeCompare(b.sortDate) ||
      a.title.localeCompare(b.title)
    );
  }
  if (mode === "source") {
    return (
      (a.source?.shortName || "").localeCompare(b.source?.shortName || "") ||
      a.sortDate.localeCompare(b.sortDate) ||
      a.title.localeCompare(b.title)
    );
  }
  return (
    (a.chapter?.number || 99) - (b.chapter?.number || 99) ||
    a.sortDate.localeCompare(b.sortDate) ||
    a.title.localeCompare(b.title)
  );
}

function compareStatements(a, b) {
  const mode = selectors.sortStatements?.value || "date";
  const relevanceRank = { "Title anchor": 0, "Substantive body": 1, "Passing mention": 2 };
  if (mode === "chapter-date") {
    return (a.chapter?.number || 99) - (b.chapter?.number || 99) || a.date.localeCompare(b.date) || a.title.localeCompare(b.title);
  }
  if (mode === "relevance") {
    return (
      (relevanceRank[a.relevance] ?? 9) - (relevanceRank[b.relevance] ?? 9) ||
      a.date.localeCompare(b.date) ||
      a.title.localeCompare(b.title)
    );
  }
  return a.date.localeCompare(b.date) || a.title.localeCompare(b.title);
}

function renderStats() {
  selectors.totalRecords.textContent = records.length.toLocaleString();
  selectors.totalPdfs.textContent = records.filter((record) => record.pdfUrl).length.toLocaleString();
  selectors.totalPages.textContent = records.reduce((sum, record) => sum + (Number(record.pageCount) || 0), 0).toLocaleString();
  selectors.totalStatements.textContent = publicStatements.length.toLocaleString();
  selectors.totalSourceCandidates.textContent = sourceCandidates.length.toLocaleString();
  selectors.totalPersons.textContent = persons.length.toLocaleString();
  selectors.totalGaps.textContent = compilerGaps.length.toLocaleString();
  selectors.totalReviewed.textContent = reviewedRecords.size.toLocaleString();
}

function renderChapterGrid() {
  const recordCounts = records.reduce((counts, record) => {
    const name = record.chapter?.name || "Unassigned";
    counts[name] = (counts[name] || 0) + 1;
    return counts;
  }, {});
  const statementCounts = publicStatements.reduce((counts, statement) => {
    const name = statement.chapter?.name || "Unassigned";
    counts[name] = (counts[name] || 0) + 1;
    return counts;
  }, {});

  selectors.chapterGrid.innerHTML = chapterNames()
    .map((name) => {
      const info = CHAPTER_INFO[name];
      return `
        <a class="chapter-card" href="#records" data-chapter-card="${escapeHtml(name)}" aria-label="Filter records to ${escapeHtml(name)}">
          <p class="chapter-number">Track ${info.number}</p>
          <h3>${escapeHtml(info.short)}</h3>
          <p class="chapter-count">${recordCounts[name] || 0} records / ${statementCounts[name] || 0} public refs</p>
          <p>${escapeHtml(info.description)}</p>
          <span class="chapter-action">Filter the workbench</span>
        </a>
      `;
    })
    .join("");
}

function renderRecords() {
  const query = normalize(selectors.searchInput?.value);
  const chapter = selectors.chapterFilter?.value || "";
  const type = selectors.typeFilter?.value || "";
  const year = selectors.yearFilter?.value || "";
  const source = selectors.sourceFilter?.value || "";
  const support = selectors.supportFilter?.value || "";
  const value = selectors.valueFilter?.value || "";
  const review = selectors.reviewFilter?.value || "";

  visibleRecords = records
    .filter((record) => {
      const linkedSourceCandidates = linkedSourceCandidatesForRecord(record);
      if (query && !searchText(record).includes(query)) return false;
      if (chapter && record.chapter?.name !== chapter) return false;
      if (type && record.documentType !== type) return false;
      if (year && record.date?.slice(0, 4) !== year) return false;
      if (source && record.source?.shortName !== source) return false;
      if (support === "linked-source" && !linkedSourceCandidates.length) return false;
      if (support === "daily-diary" && !hasDailyDiaryCandidate(record)) return false;
      if (support === "public-private" && !record.publicChronologyLinks?.length) return false;
      if (support === "unsupported" && linkedSourceCandidates.length) return false;
      if (value && record.selectionValue !== value) return false;
      if (review === "open" && reviewedRecords.has(record.id)) return false;
      if (review === "reviewed" && !reviewedRecords.has(record.id)) return false;
      return true;
    })
    .sort(compareRecords);

  selectors.filteredCount.textContent = `Showing ${visibleRecords.length.toLocaleString()} of ${records.length.toLocaleString()} records.`;
  selectors.recordsRoot.innerHTML = visibleRecords.length
    ? visibleRecords.map(renderRecordCard).join("")
    : `<p class="empty-state">No presidential records match the current filters.</p>`;
  renderSupportSummary();
}

function renderSupportSummary() {
  if (!selectors.supportSummary) return;
  const counts = sourceSupportCounts();
  const active = selectors.supportFilter?.value || "";
  const items = [
    {
      value: "linked-source",
      count: counts.linkedSource,
      label: "Linked source candidates",
      note: "NARA, Baker, Haass, or diary leads"
    },
    {
      value: "daily-diary",
      count: counts.dailyDiary,
      label: "Daily Diary/Backup linked",
      note: "Schedule, meeting, or call corroboration"
    },
    {
      value: "public-private",
      count: counts.publicChronology,
      label: "Public chronology linked",
      note: "Public Papers date and track crosswalk"
    },
    {
      value: "unsupported",
      count: counts.unsupported,
      label: "No linked source candidates",
      note: "Highest-priority follow-up queue"
    }
  ];

  selectors.supportSummary.innerHTML = items
    .map(
      (item) => `
        <button
          class="support-card${active === item.value ? " is-active" : ""}"
          type="button"
          data-support-shortcut="${escapeHtml(item.value)}"
          aria-pressed="${active === item.value ? "true" : "false"}"
        >
          <span class="support-value">${Number(item.count).toLocaleString()}</span>
          <span class="support-label">${escapeHtml(item.label)}</span>
          <span class="support-note">${escapeHtml(item.note)}</span>
        </button>
      `
    )
    .join("");
}

function renderRecordCard(record) {
  const relatedSourceCandidates = linkedSourceCandidatesForRecord(record);
  const terms = [
    record.sourceConfidence?.label,
    record.eventLabel,
    record.pdfReview?.classificationMarkers?.length ? `Classification: ${record.pdfReview.classificationMarkers.join(", ")}` : "",
    record.pdfReview?.redactionMarkers?.length ? `Review markers: ${record.pdfReview.redactionMarkers.join(", ")}` : "",
    ...(record.countries || []),
    ...(record.people || []),
    ...(record.matchedQueries || []),
    relatedSourceCandidates.length ? `${relatedSourceCandidates.length} linked source candidates` : "",
    hasDailyDiaryCandidate(record) ? "Daily Diary/Backup linked" : "",
    record.publicChronologyLinks?.length ? "Public chronology linked" : ""
  ];
  const reviewed = reviewedRecords.has(record.id);
  return `
    <article class="record-card" id="${escapeHtml(record.id)}" data-value="${escapeHtml(record.selectionValue)}">
      <div class="record-top">
        <div>
          <p class="record-date">${escapeHtml(formatDate(record.date))}</p>
          <h3>${escapeHtml(record.title)}</h3>
          <div class="record-meta">
            <span class="value-badge ${valueClass(record.selectionValue)}">${escapeHtml(record.selectionValue)}</span>
            <span class="pill">${escapeHtml(record.documentType)}</span>
            <span class="pill">${escapeHtml(record.chapter?.name || "Unassigned")}</span>
            ${record.pageCount ? `<span class="pill">${Number(record.pageCount).toLocaleString()} pp.</span>` : ""}
            <span class="pill">NAID ${escapeHtml(record.naid)}</span>
          </div>
        </div>
        <button
          class="review-toggle"
          type="button"
          data-review-id="${escapeHtml(record.id)}"
          aria-pressed="${reviewed ? "true" : "false"}"
        >${reviewed ? "Reviewed" : "Mark reviewed"}</button>
      </div>
      <p>${escapeHtml(record.compilerNote || "")}</p>
      <div class="tag-list">${tagsHtml(terms)}</div>
      <div class="record-links">
        ${record.pdfUrl ? `<a href="${escapeHtml(record.pdfUrl)}" rel="noreferrer">Open PDF</a>` : ""}
        <a href="${escapeHtml(record.catalogUrl)}" rel="noreferrer">Catalog</a>
        <a href="${escapeHtml(record.source?.url || record.catalogUrl)}" rel="noreferrer">Series</a>
        <button type="button" data-copy-record-note="${escapeHtml(record.id)}">Copy source note</button>
        <button type="button" data-copy-record-packet="${escapeHtml(record.id)}">Copy packet</button>
      </div>
      <div class="record-details">
        <div class="note-box">
          <h4>FRUS-style Source Note Draft</h4>
          <p>${escapeHtml(record.frusSourceNote || record.sourceNote || "Source note pending.")}</p>
        </div>
        <div class="note-box">
          <h4>Catalog Trail</h4>
          <p>${escapeHtml(record.catalogTrail || "Catalog trail pending.")}</p>
        </div>
        <div class="note-box">
          <h4>PDF Review Markers</h4>
          <p>${escapeHtml(pdfReviewSummary(record))}</p>
        </div>
        ${
          record.publicChronologyLinks?.length
            ? `<div class="note-box chronology-box">
                <h4>Related Public Chronology</h4>
                ${record.publicChronologyLinks
                  .slice(0, 4)
                  .map(
                    (link) =>
                      `<p><a href="${escapeHtml(link.pdfPageUrl)}" rel="noreferrer">${escapeHtml(formatDate(link.date))}: ${escapeHtml(link.title)}</a></p>`
                  )
                  .join("")}
              </div>`
            : ""
        }
        ${renderRelatedSourceCandidates(relatedSourceCandidates)}
      </div>
    </article>
  `;
}

function renderRelatedSourceCandidates(candidates) {
  if (!candidates.length) return "";
  const shown = candidates.slice(0, 6);
  const hiddenCount = candidates.length - shown.length;
  return `
    <div class="note-box related-source-box">
      <h4>Related Source Candidates</h4>
      <ul class="note-list">
        ${shown
          .map(
            (candidate) => `
              <li>
                <a href="${escapeHtml(candidate.catalogUrl)}" rel="noreferrer">${escapeHtml(candidate.title)}</a>
                <span>${escapeHtml([candidate.lane, candidate.date, candidate.sourceSeries].filter(Boolean).join(" / "))}</span>
              </li>
            `
          )
          .join("")}
      </ul>
      ${hiddenCount ? `<p class="note-more">${hiddenCount.toLocaleString()} more related source candidates in the candidates section.</p>` : ""}
    </div>
  `;
}

function pdfReviewSummary(record) {
  const review = record.pdfReview || {};
  if (review.status === "enrichment-error") return `PDF enrichment error: ${review.error}`;
  const parts = [];
  if (record.pageCount) parts.push(`${record.pageCount} pages counted by pdfinfo`);
  if (review.classificationMarkers?.length) parts.push(`classification markers: ${review.classificationMarkers.join(", ")}`);
  if (review.redactionMarkers?.length) parts.push(`redaction/excision markers: ${review.redactionMarkers.join(", ")}`);
  if (review.participantLine) parts.push(`possible participant/subject line: ${review.participantLine}`);
  return parts.length ? parts.join("; ") : "No PDF enrichment markers available yet.";
}

function renderEvents() {
  selectors.eventsRoot.innerHTML = events
    .map(
      (event) => `
        <article class="event-card">
          <p class="kicker">${escapeHtml(event.dateSpan)}</p>
          <h3>${escapeHtml(event.label)}</h3>
          <p>${escapeHtml(event.summary)}</p>
          <div class="note-box">
            <h4>Compiler Focus</h4>
            <p>${escapeHtml(event.compilerFocus)}</p>
          </div>
          <div class="event-stats">
            <span class="pill">${Number(event.records || 0).toLocaleString()} records</span>
            <span class="pill">${Number(event.publicStatements || 0).toLocaleString()} public refs</span>
            <span class="pill">${escapeHtml(event.chapter)}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderPersons() {
  const query = normalize(selectors.personSearch?.value);
  const chapter = selectors.personChapter?.value || "";
  visiblePersons = persons
    .filter((person) => {
      if (query && !personSearchText(person).includes(query)) return false;
      if (chapter && person.chapter !== chapter) return false;
      return true;
    })
    .sort((a, b) => b.recordHits + b.publicStatementHits - (a.recordHits + a.publicStatementHits) || a.name.localeCompare(b.name));

  selectors.personCount.textContent = `${visiblePersons.length.toLocaleString()} persons`;
  selectors.personsRoot.innerHTML = visiblePersons.length
    ? visiblePersons
        .map(
          (person) => `
            <article class="person-card">
              <h3>${escapeHtml(person.name)}</h3>
              <p class="person-role">${escapeHtml(person.role)}${person.country ? `, ${escapeHtml(person.country)}` : ""}</p>
              <p>${escapeHtml(person.compilerUse)}</p>
              <div class="tag-list">
                <span class="pill">${escapeHtml(person.chapter)}</span>
                <span class="pill">${Number(person.recordHits || 0)} record hits</span>
                <span class="pill">${Number(person.publicStatementHits || 0)} public hits</span>
              </div>
            </article>
          `
        )
        .join("")
    : `<p class="empty-state">No persons match the current filters.</p>`;
}

function renderStatements() {
  const query = normalize(selectors.statementSearch?.value);
  const chapter = selectors.statementChapter?.value || "";
  const year = selectors.statementYear?.value || "";
  const relevance = selectors.statementRelevance?.value || "";
  visibleStatements = publicStatements
    .filter((statement) => {
      if (query && !statementSearchText(statement).includes(query)) return false;
      if (chapter && statement.chapter?.name !== chapter) return false;
      if (year && statement.year !== year) return false;
      if (relevance && statement.relevance !== relevance) return false;
      return true;
    })
    .sort(compareStatements);

  selectors.statementCount.textContent = `Showing ${visibleStatements.length.toLocaleString()} of ${publicStatements.length.toLocaleString()} references.`;
  selectors.statementsRoot.innerHTML = visibleStatements.length
    ? visibleStatements.map(renderStatementCard).join("")
    : `<p class="empty-state">No Public Papers references match the current filters.</p>`;
}

function renderStatementCard(statement) {
  const terms = [
    statement.relevance,
    statement.documentType,
    statement.publicVoice,
    ...Object.values(statement.matchedTerms || {})
      .flat()
      .filter((term) => term.count)
      .map((term) => (term.count > 1 ? `${term.label} (${term.count})` : term.label))
  ];
  return `
    <article class="statement-card">
      <p class="statement-date">${escapeHtml(formatDate(statement.date))}</p>
      <h3>${escapeHtml(statement.title)}</h3>
      <p>${escapeHtml(statement.compilerUse || "")}</p>
      <div class="tag-list">
        <span class="pill">${escapeHtml(statement.chapter?.name || "Unassigned")}</span>
        ${tagsHtml(terms)}
      </div>
      <p><strong>Citation:</strong> ${escapeHtml(statement.citation || "")}</p>
      <div class="statement-links">
        <a class="inline-link" href="${escapeHtml(statement.pdfPageUrl || statement.pdfUrl)}" rel="noreferrer">Open page</a>
        <a class="inline-link" href="${escapeHtml(statement.govinfoUrl)}" rel="noreferrer">GovInfo details</a>
        <button type="button" data-copy-statement="${escapeHtml(statement.id)}">Copy citation</button>
      </div>
      ${
        statement.privateRecordLinks?.length
          ? `<div class="note-box">
              <h4>Related Private Records</h4>
              ${statement.privateRecordLinks
                .slice(0, 4)
                .map(
                  (link) =>
                    `<p><a href="#${escapeHtml(link.id)}">${escapeHtml(formatDate(link.date))}: ${escapeHtml(link.title)}${link.naid ? `, NAID ${escapeHtml(link.naid)}` : ""}</a></p>`
                )
                .join("")}
            </div>`
          : ""
      }
    </article>
  `;
}

function renderSourceLeads() {
  selectors.sourceLeadsRoot.innerHTML = sourceLeads
    .map(
      (source) => `
        <article class="source-card" data-status="${escapeHtml(source.status)}">
          <p class="kicker">${escapeHtml(source.status)}</p>
          <h3>${escapeHtml(source.title)}</h3>
          <p><strong>Repository:</strong> ${escapeHtml(source.repository)}</p>
          <p>${escapeHtml(source.whyItMatters)}</p>
          <div class="tag-list">
            <span class="pill">${escapeHtml(source.chapter)}</span>
            ${source.naid ? `<span class="pill">NAID ${escapeHtml(source.naid)}</span>` : ""}
            ${source.candidateCount ? `<span class="pill">${Number(source.candidateCount).toLocaleString()} candidates</span>` : ""}
          </div>
          <ul>${(source.searchTerms || []).map((term) => `<li class="tag">${escapeHtml(term)}</li>`).join("")}</ul>
          <p><a class="inline-link" href="${escapeHtml(source.url)}" rel="noreferrer">Open source lane</a></p>
        </article>
      `
    )
    .join("");
}

function renderSourceCandidates() {
  const query = normalize(selectors.candidateSearch?.value);
  const chapter = selectors.candidateChapter?.value || "";
  const priority = selectors.candidatePriority?.value || "";
  const level = selectors.candidateLevel?.value || "";
  const laneGroup = selectors.candidateLaneGroup?.value || "";
  const linkage = selectors.candidateLinkage?.value || "";
  const access = selectors.candidateAccess?.value || "";
  const priorityRank = { High: 0, Medium: 1, Review: 2 };
  visibleSourceCandidates = sourceCandidates
    .filter((candidate) => {
      if (query && !sourceCandidateSearchText(candidate).includes(query)) return false;
      if (chapter && candidate.chapter !== chapter) return false;
      if (priority && candidate.priority !== priority) return false;
      if (level && candidate.level !== level) return false;
      if (laneGroup && candidateLaneGroup(candidate) !== laneGroup) return false;
      if (linkage === "linked" && !candidate.relatedRecordIds?.length) return false;
      if (linkage === "unlinked" && candidate.relatedRecordIds?.length) return false;
      if (access === "digital" && !candidateHasDigitalObject(candidate)) return false;
      if (access === "no-digital" && candidateHasDigitalObject(candidate)) return false;
      return true;
    })
    .sort(
      (a, b) =>
        (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) ||
        String(a.chapter).localeCompare(String(b.chapter)) ||
        a.title.localeCompare(b.title)
    );

  selectors.candidateCount.textContent = `Showing ${visibleSourceCandidates.length.toLocaleString()} of ${sourceCandidates.length.toLocaleString()} source candidates.`;
  selectors.sourceCandidatesRoot.innerHTML = visibleSourceCandidates.length
    ? visibleSourceCandidates.map(renderSourceCandidateCard).join("")
    : `<p class="empty-state">No source candidates match the current filters.</p>`;
}

function renderSourceCandidateCard(candidate) {
  return `
    <article class="source-candidate-card" data-priority="${escapeHtml(candidate.priority)}">
      <p class="kicker">${escapeHtml(candidate.priority)} / ${escapeHtml(candidate.level || "catalog record")}</p>
      <h3>${escapeHtml(candidate.title)}</h3>
      <p>${escapeHtml(candidate.reason || "")}</p>
      <div class="tag-list">
        <span class="pill">${escapeHtml(candidate.chapter || "Unassigned")}</span>
        <span class="pill">${escapeHtml(candidateLaneGroup(candidate))}</span>
        <span class="pill">${escapeHtml(candidate.lane || "Source lane")}</span>
        ${candidate.documentType ? `<span class="pill">${escapeHtml(candidate.documentType)}</span>` : ""}
        ${candidate.hasDigitalObject ? `<span class="pill">digital object</span>` : ""}
        ${candidate.reviewStatus ? `<span class="pill">${escapeHtml(candidate.reviewStatus)}</span>` : ""}
        ${candidate.pageCount ? `<span class="pill">${Number(candidate.pageCount).toLocaleString()} pp.</span>` : ""}
        ${candidate.naid ? `<span class="pill">NAID ${escapeHtml(candidate.naid)}</span>` : ""}
      </div>
      <div class="note-box">
        <h4>Catalog Context</h4>
        <p>${escapeHtml([candidate.repository, candidate.collection, candidate.sourceSeries, candidate.localIdentifier].filter(Boolean).join(", ") || "Catalog context pending.")}</p>
      </div>
      ${candidate.sourceNote ? `<div class="note-box"><h4>Source Note</h4><p>${escapeHtml(candidate.sourceNote)}</p></div>` : ""}
      ${
        candidate.scopeAndContentNote
          ? `<div class="note-box"><h4>Scope Note</h4><p>${escapeHtml(candidate.scopeAndContentNote)}</p></div>`
          : ""
      }
      ${
        candidate.evidenceSnippets?.length
          ? `<div class="note-box"><h4>Evidence</h4><p>${escapeHtml(candidate.evidenceSnippets.join(" ... "))}</p></div>`
          : ""
      }
      ${
        candidate.relatedRecords?.length
          ? `<div class="note-box"><h4>Related FRUS Meetings/Calls</h4><ul class="note-list">${candidate.relatedRecords
              .slice(0, 8)
              .map(
                (record) => {
                  const label = escapeHtml([record.date, record.title, record.chapter].filter(Boolean).join(" - "));
                  return record.id ? `<li><a href="#${escapeHtml(record.id)}">${label}</a></li>` : `<li>${label}</li>`;
                }
              )
              .join("")}</ul></div>`
          : ""
      }
      ${candidate.pdfReview ? `<div class="note-box"><h4>Review Metadata</h4><p>${escapeHtml(sourceCandidateReviewSummary(candidate))}</p></div>` : ""}
      <div class="record-links">
        <a href="${escapeHtml(candidate.catalogUrl)}" rel="noreferrer">Catalog</a>
        ${candidate.digitalObjectUrl ? `<a href="${escapeHtml(candidate.digitalObjectUrl)}" rel="noreferrer">Digital object</a>` : ""}
        <button type="button" data-copy-candidate-note="${escapeHtml(candidate.id)}">Copy source note</button>
        <button type="button" data-copy-candidate-packet="${escapeHtml(candidate.id)}">Copy packet</button>
      </div>
    </article>
  `;
}

function sourceCandidateReviewSummary(candidate) {
  const review = candidate.pdfReview || {};
  const parts = [];
  if (review.status) parts.push(review.status.replace(/-/g, " "));
  if (review.pageCount) parts.push(`${Number(review.pageCount).toLocaleString()} pages counted`);
  if (review.pdfBytes) parts.push(`${Math.round(Number(review.pdfBytes) / 1024 / 1024).toLocaleString()} MB digital object`);
  if (review.classificationMarkers?.length) parts.push(`classification markers: ${review.classificationMarkers.join(", ")}`);
  if (review.redactionMarkers?.length) parts.push(`review markers: ${review.redactionMarkers.join(", ")}`);
  if (review.note) parts.push(review.note);
  if (review.error) parts.push(`error: ${review.error}`);
  return parts.join("; ") || "Review metadata pending.";
}

function renderGaps() {
  const query = normalize(selectors.gapSearch?.value);
  const priority = selectors.gapPriority?.value || "";
  const category = selectors.gapCategory?.value || "";
  const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  visibleGaps = compilerGaps
    .filter((gap) => {
      if (query && !gapSearchText(gap).includes(query)) return false;
      if (priority && gap.priority !== priority) return false;
      if (category && gap.category !== category) return false;
      return true;
    })
    .sort((a, b) => (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) || a.title.localeCompare(b.title));

  selectors.gapCount.textContent = `${visibleGaps.length.toLocaleString()} gaps`;
  selectors.gapsRoot.innerHTML = visibleGaps.length
    ? visibleGaps
        .map(
          (gap) => `
            <article class="gap-card" data-priority="${escapeHtml(gap.priority)}">
              <p class="kicker">${escapeHtml(gap.priority)} / ${escapeHtml(gap.category)}</p>
              <h3>${escapeHtml(gap.title)}</h3>
              <p>${escapeHtml(gap.evidence)}</p>
              ${gap.status ? `<div class="note-box"><h4>Remediation Status</h4><p>${escapeHtml(gap.status)}</p></div>` : ""}
              <div class="note-box">
                <h4>Next Step</h4>
                <p>${escapeHtml(gap.nextStep)}</p>
              </div>
              <div class="tag-list">
                <span class="pill">${escapeHtml(gap.chapter)}</span>
              </div>
            </article>
          `
        )
        .join("")
    : `<p class="empty-state">No compiler gaps match the current filters.</p>`;
}

function renderReviewQueue() {
  const openHighValue = records.filter((record) => ["Anchor", "High"].includes(record.selectionValue) && !reviewedRecords.has(record.id));
  const reviewed = records.filter((record) => reviewedRecords.has(record.id));
  selectors.openReviewCount.textContent = `${openHighValue.length.toLocaleString()} anchor or high-value records need local review.`;
  selectors.reviewedListSummary.textContent = `${reviewed.length.toLocaleString()} records marked reviewed in this browser.`;
  selectors.reviewRoot.innerHTML = openHighValue.length
    ? openHighValue
        .sort(compareRecords)
        .slice(0, 18)
        .map(
          (record) => `
            <article class="review-item">
              <p class="record-date">${escapeHtml(formatDate(record.date))}</p>
              <h3>${escapeHtml(record.title)}</h3>
              <p>${escapeHtml(record.compilerNote || "")}</p>
              <div class="record-links">
                ${record.pdfUrl ? `<a href="${escapeHtml(record.pdfUrl)}" rel="noreferrer">Open PDF</a>` : ""}
                <a href="#${escapeHtml(record.id)}">Jump to record</a>
              </div>
            </article>
          `
        )
        .join("")
    : `<p class="empty-state">All anchor and high-value records are marked reviewed in this browser.</p>`;
}

function initOptions() {
  setOptions(selectors.chapterFilter, chapterNames(), "All tracks");
  setOptions(selectors.statementChapter, chapterNames(), "All tracks");
  setOptions(selectors.personChapter, chapterNames(), "All tracks");
  setOptions(selectors.typeFilter, uniqueValues(records, (record) => record.documentType), "All types");
  setOptions(selectors.yearFilter, uniqueValues(records, (record) => record.date?.slice(0, 4)), "All years");
  setOptions(selectors.sourceFilter, uniqueValues(records, (record) => record.source?.shortName), "All source series");
  setOptions(selectors.statementYear, uniqueValues(publicStatements, (statement) => statement.year), "All years");
  setOptions(selectors.statementRelevance, uniqueValues(publicStatements, (statement) => statement.relevance), "All relevance levels");
  setOptions(selectors.candidateChapter, chapterNames(), "All tracks");
  setOptions(selectors.candidatePriority, uniqueValues(sourceCandidates, (candidate) => candidate.priority), "All priorities");
  setOptions(selectors.candidateLevel, uniqueValues(sourceCandidates, (candidate) => candidate.level), "All levels");
  setOptions(selectors.candidateLaneGroup, uniqueValues(sourceCandidates, candidateLaneGroup), "All lane groups");
  setOptions(selectors.gapPriority, uniqueValues(compilerGaps, (gap) => gap.priority), "All priorities");
  setOptions(selectors.gapCategory, uniqueValues(compilerGaps, (gap) => gap.category), "All categories");
}

function resetRecordFilters() {
  [
    selectors.searchInput,
    selectors.chapterFilter,
    selectors.typeFilter,
    selectors.yearFilter,
    selectors.sourceFilter,
    selectors.supportFilter,
    selectors.valueFilter,
    selectors.reviewFilter
  ].forEach((control) => {
    if (control) control.value = "";
  });
  if (selectors.sortRecords) selectors.sortRecords.value = "date";
  renderRecords();
}

function resetStatementFilters() {
  [selectors.statementSearch, selectors.statementChapter, selectors.statementYear, selectors.statementRelevance].forEach((control) => {
    if (control) control.value = "";
  });
  if (selectors.sortStatements) selectors.sortStatements.value = "date";
  renderStatements();
}

function resetSourceCandidateFilters() {
  [
    selectors.candidateSearch,
    selectors.candidateChapter,
    selectors.candidatePriority,
    selectors.candidateLevel,
    selectors.candidateLaneGroup,
    selectors.candidateLinkage,
    selectors.candidateAccess
  ].forEach((control) => {
    if (control) control.value = "";
  });
  renderSourceCandidates();
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function exportRows(filename, rows) {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([`${csv}\n`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadTextFile(filename, value, type = "text/plain;charset=utf-8") {
  const blob = new Blob([value], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildDatasetExport() {
  return {
    title: VOLUME_TITLE,
    frusUrl: "https://history.state.gov/historicaldocuments/frus1989-92v14",
    liveSiteUrl: "https://therealjameswilson.github.io/Bush41-MEPP/",
    exportedAt: new Date().toISOString(),
    stats: {
      records: records.length,
      publicStatements: publicStatements.length,
      persons: persons.length,
      events: events.length,
      compilerGaps: compilerGaps.length,
      sourceLeads: sourceLeads.length,
      sourceCandidates: sourceCandidates.length,
      pages: records.reduce((sum, record) => sum + (Number(record.pageCount) || 0), 0),
      sourceSupport: sourceSupportCounts()
    },
    records,
    publicStatements,
    persons,
    events,
    compilerGaps,
    sourceLeads,
    sourceCandidates
  };
}

function datasetExportJson() {
  return JSON.stringify(buildDatasetExport(), null, 2);
}

function exportVisibleRecords() {
  exportRows("bush41-mepp-visible-records.csv", [
    [
      "date",
      "title",
      "track",
      "type",
      "selection_value",
      "naid",
      "pdf_url",
      "catalog_url",
      "source_note",
      "related_source_candidates"
    ],
    ...visibleRecords.map((record) => [
      record.date,
      record.title,
      record.chapter?.name,
      record.documentType,
      record.selectionValue,
      record.naid,
      record.pdfUrl,
      record.catalogUrl,
      record.frusSourceNote || record.sourceNote,
      linkedSourceCandidatesForRecord(record).map((candidate) => `${candidate.title} (${candidate.catalogUrl})`).join("; ")
    ])
  ]);
}

function exportVisibleStatements() {
  exportRows("bush41-mepp-public-statements.csv", [
    ["date", "title", "track", "type", "relevance", "citation", "pdf_page_url"],
    ...visibleStatements.map((statement) => [
      statement.date,
      statement.title,
      statement.chapter?.name,
      statement.documentType,
      statement.relevance,
      statement.citation,
      statement.pdfPageUrl || statement.pdfUrl
    ])
  ]);
}

function exportVisiblePersons() {
  exportRows("bush41-mepp-persons.csv", [
    ["name", "role", "country", "track", "record_hits", "public_statement_hits", "compiler_use"],
    ...visiblePersons.map((person) => [
      person.name,
      person.role,
      person.country,
      person.chapter,
      person.recordHits,
      person.publicStatementHits,
      person.compilerUse
    ])
  ]);
}

function exportVisibleGaps() {
  exportRows("bush41-mepp-compiler-gaps.csv", [
    ["priority", "category", "track", "title", "evidence", "next_step"],
    ...visibleGaps.map((gap) => [gap.priority, gap.category, gap.chapter, gap.title, gap.evidence, gap.nextStep])
  ]);
}

function exportVisibleSourceCandidates() {
  exportRows("bush41-mepp-source-candidates.csv", [
    [
      "priority",
      "track",
      "lane_group",
      "lane",
      "level",
      "title",
      "id",
      "series",
      "collection",
      "repository",
      "catalog_url",
      "digital_object_url",
      "linkage",
      "digital_object_status",
      "source_note",
      "evidence_snippets",
      "related_frus_records",
      "matched_queries"
    ],
    ...visibleSourceCandidates.map((candidate) => [
      candidate.priority,
      candidate.chapter,
      candidateLaneGroup(candidate),
      candidate.lane,
      candidate.level,
      candidate.title,
      candidate.naid || candidate.externalId || candidate.id,
      candidate.sourceSeries,
      candidate.collection,
      candidate.repository,
      candidate.catalogUrl,
      candidate.digitalObjectUrl,
      candidate.relatedRecordIds?.length ? "linked" : "unlinked",
      candidateHasDigitalObject(candidate) ? "digital object" : "no digital object",
      candidate.sourceNote,
      (candidate.evidenceSnippets || []).join(" ... "),
      (candidate.relatedRecordTitles || []).join("; "),
      (candidate.matchedQueries || []).join("; ")
    ])
  ]);
}

function compactList(items) {
  return items.filter(Boolean).join("\n");
}

function packetLines(items) {
  return items.filter((item) => item !== false && item !== null && item !== undefined).join("\n");
}

function sourceCandidatePacketLine(candidate, index) {
  const parts = [
    `${index + 1}. ${candidate.title}`,
    candidate.date ? `Date: ${candidate.date}` : "",
    candidate.lane ? `Lane: ${candidate.lane}` : "",
    candidate.priority ? `Priority: ${candidate.priority}` : "",
    candidate.sourceSeries ? `Series: ${candidate.sourceSeries}` : "",
    candidate.collection ? `Collection: ${candidate.collection}` : "",
    candidate.localIdentifier ? `Local ID: ${candidate.localIdentifier}` : "",
    candidate.pageCount ? `Pages: ${candidate.pageCount}` : "",
    candidate.sourceNote ? `Source note: ${candidate.sourceNote}` : "",
    candidate.catalogUrl ? `Catalog: ${candidate.catalogUrl}` : "",
    candidate.digitalObjectUrl ? `Digital object: ${candidate.digitalObjectUrl}` : "",
    candidate.evidenceSnippets?.length ? `Evidence: ${candidate.evidenceSnippets.slice(0, 2).join(" / ")}` : ""
  ];
  return compactList(parts);
}

function buildSourceCandidateCompilerPacket(candidate) {
  return packetLines([
    "FRUS Source Candidate Packet",
    candidate.title,
    `${candidate.priority || "Priority pending"} | ${candidate.level || "Catalog level pending"} | ${candidate.chapter || "Unassigned track"}`,
    `Lane group: ${candidateLaneGroup(candidate)}`,
    candidate.lane ? `Lane: ${candidate.lane}` : "",
    candidate.naid ? `NAID: ${candidate.naid}` : "",
    candidate.externalId ? `External ID: ${candidate.externalId}` : "",
    candidate.date ? `Date: ${candidate.date}` : "",
    "",
    "Why this may matter:",
    candidate.reason || "Reason pending.",
    "",
    "Source note draft:",
    candidate.sourceNote || "Source note pending.",
    "",
    "Catalog context:",
    [candidate.repository, candidate.collection, candidate.sourceSeries, candidate.localIdentifier].filter(Boolean).join(", ") ||
      "Catalog context pending.",
    "",
    "Links:",
    candidate.catalogUrl ? `Catalog: ${candidate.catalogUrl}` : "",
    candidate.digitalObjectUrl ? `Digital object: ${candidate.digitalObjectUrl}` : "Digital object: not currently linked",
    "",
    candidate.scopeAndContentNote ? "Scope note:" : "",
    candidate.scopeAndContentNote || "",
    candidate.evidenceSnippets?.length ? "" : "",
    candidate.evidenceSnippets?.length ? "Evidence snippets:" : "",
    ...(candidate.evidenceSnippets || []).slice(0, 6).map((snippet, index) => `${index + 1}. ${snippet}`),
    candidate.evidenceSnippets?.length > 6 ? `${candidate.evidenceSnippets.length - 6} more snippets on the candidate card/data export.` : "",
    "",
    candidate.relatedRecords?.length ? "Related FRUS meetings/calls:" : "Related FRUS meetings/calls: None linked yet.",
    ...(candidate.relatedRecords || []).slice(0, 10).map((record, index) =>
      `${index + 1}. ${[record.date, record.title, record.chapter].filter(Boolean).join(" - ")}${record.catalogUrl ? ` (${record.catalogUrl})` : ""}`
    ),
    candidate.relatedRecords?.length > 10 ? `${candidate.relatedRecords.length - 10} more related records in the data export.` : "",
    "",
    "Review metadata:",
    sourceCandidateReviewSummary(candidate),
    "",
    "Verification checklist:",
    "- Open the catalog record and digital object, if present.",
    "- Confirm date, folder title, series, container/local identifier, classification, and review markings.",
    "- Compare against linked presidential meetings/calls and public chronology entries before selecting for annotation or source-note support."
  ]);
}

function buildRecordCompilerPacket(record) {
  const relatedSourceCandidates = linkedSourceCandidatesForRecord(record);
  const publicChronologyLinks = record.publicChronologyLinks || [];
  const shownCandidates = relatedSourceCandidates.slice(0, 10);
  const hiddenCandidateCount = relatedSourceCandidates.length - shownCandidates.length;
  const sourceSupport = [
    relatedSourceCandidates.length ? `${relatedSourceCandidates.length} linked source candidates` : "No linked source candidates",
    hasDailyDiaryCandidate(record) ? "Daily Diary/Backup linked" : "",
    publicChronologyLinks.length ? `${publicChronologyLinks.length} public chronology links` : ""
  ]
    .filter(Boolean)
    .join("; ");

  return packetLines([
    "FRUS Compiler Packet",
    record.title,
    `${formatDate(record.date)} | ${record.documentType || "Document type pending"} | ${record.chapter?.name || "Unassigned track"}`,
    `Selection value: ${record.selectionValue || "Unassigned"}`,
    `NAID: ${record.naid || "Pending"}`,
    `Source support: ${sourceSupport}`,
    "",
    "FRUS-style source note draft:",
    record.frusSourceNote || record.sourceNote || "Source note pending.",
    "",
    "Catalog trail:",
    record.catalogTrail || "Catalog trail pending.",
    "",
    "Core links:",
    record.pdfUrl ? `PDF: ${record.pdfUrl}` : "",
    record.catalogUrl ? `NARA catalog: ${record.catalogUrl}` : "",
    record.source?.url ? `Series: ${record.source.url}` : "",
    "",
    "PDF review markers:",
    pdfReviewSummary(record),
    "",
    "Compiler note:",
    record.compilerNote || "Compiler note pending.",
    "",
    publicChronologyLinks.length ? "Related public chronology:" : "",
    ...publicChronologyLinks
      .slice(0, 6)
      .map((link, index) => `${index + 1}. ${formatDate(link.date)}: ${link.title}${link.pdfPageUrl ? ` (${link.pdfPageUrl})` : ""}`),
    publicChronologyLinks.length > 6 ? `${publicChronologyLinks.length - 6} more public chronology links on the record card.` : "",
    publicChronologyLinks.length ? "" : "",
    shownCandidates.length ? "Related source candidates:" : "Related source candidates: None linked yet.",
    ...shownCandidates.map(sourceCandidatePacketLine),
    hiddenCandidateCount ? `${hiddenCandidateCount} more related source candidates in the candidates section.` : "",
    "",
    "Verification checklist:",
    "- Verify date, place/time, participants, classification, drafting, distribution, attachments, and excisions against the PDF scan.",
    "- Compare private record against any Daily Diary/Backup entry and public chronology references.",
    "- Decide whether the record is an anchor, contextual note, or exclusion for the printed volume."
  ]);
}

async function copyText(value, trigger) {
  try {
    await navigator.clipboard.writeText(value);
    const original = trigger.textContent;
    trigger.textContent = "Copied";
    setTimeout(() => {
      trigger.textContent = original;
    }, 1200);
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = value;
    document.body.append(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
  }
}

function initCompilerDesk() {
  if (selectors.compilerNotes) {
    selectors.compilerNotes.value = readLocalValue(NOTES_STORAGE_KEY);
    selectors.compilerNotes.addEventListener("input", () => {
      const saved = saveLocalValue(NOTES_STORAGE_KEY, selectors.compilerNotes.value);
      if (selectors.notesStatus) selectors.notesStatus.textContent = saved ? "Notes saved locally." : "Unable to save notes locally.";
    });
  }

  selectors.copyVolumeTitle?.addEventListener("click", () => copyText(VOLUME_TITLE, selectors.copyVolumeTitle));
  selectors.copyDatasetJson?.addEventListener("click", () => copyText(datasetExportJson(), selectors.copyDatasetJson));
  selectors.downloadDatasetJson?.addEventListener("click", () => {
    downloadTextFile("bush41-mepp-dataset.json", `${datasetExportJson()}\n`, "application/json;charset=utf-8");
  });
}

function bindEvents() {
  [
    selectors.searchInput,
    selectors.chapterFilter,
    selectors.typeFilter,
    selectors.yearFilter,
    selectors.sourceFilter,
    selectors.supportFilter,
    selectors.valueFilter,
    selectors.reviewFilter,
    selectors.sortRecords
  ].forEach((control) => control?.addEventListener("input", renderRecords));

  selectors.resetFilters?.addEventListener("click", resetRecordFilters);
  selectors.exportCsv?.addEventListener("click", exportVisibleRecords);

  [selectors.statementSearch, selectors.statementChapter, selectors.statementYear, selectors.statementRelevance, selectors.sortStatements].forEach(
    (control) => control?.addEventListener("input", renderStatements)
  );
  selectors.resetStatements?.addEventListener("click", resetStatementFilters);
  selectors.exportStatements?.addEventListener("click", exportVisibleStatements);

  [selectors.personSearch, selectors.personChapter].forEach((control) => control?.addEventListener("input", renderPersons));
  selectors.exportPersons?.addEventListener("click", exportVisiblePersons);

  [selectors.gapSearch, selectors.gapPriority, selectors.gapCategory].forEach((control) => control?.addEventListener("input", renderGaps));
  selectors.exportGaps?.addEventListener("click", exportVisibleGaps);

  [
    selectors.candidateSearch,
    selectors.candidateChapter,
    selectors.candidatePriority,
    selectors.candidateLevel,
    selectors.candidateLaneGroup,
    selectors.candidateLinkage,
    selectors.candidateAccess
  ].forEach((control) => control?.addEventListener("input", renderSourceCandidates));
  selectors.resetSourceCandidates?.addEventListener("click", resetSourceCandidateFilters);
  selectors.exportSourceCandidates?.addEventListener("click", exportVisibleSourceCandidates);

  document.addEventListener("click", (event) => {
    const chapterCard = event.target.closest("[data-chapter-card]");
    if (chapterCard) {
      selectors.chapterFilter.value = chapterCard.dataset.chapterCard;
      selectors.sortRecords.value = "chapter-date";
      renderRecords();
      return;
    }

    const reviewButton = event.target.closest("[data-review-id]");
    if (reviewButton) {
      const id = reviewButton.dataset.reviewId;
      if (reviewedRecords.has(id)) reviewedRecords.delete(id);
      else reviewedRecords.add(id);
      saveReviewedRecords();
      renderStats();
      renderRecords();
      renderReviewQueue();
      return;
    }

    const supportShortcut = event.target.closest("[data-support-shortcut]");
    if (supportShortcut) {
      const value = supportShortcut.dataset.supportShortcut;
      selectors.supportFilter.value = selectors.supportFilter.value === value ? "" : value;
      renderRecords();
      return;
    }

    const copyRecordNoteButton = event.target.closest("[data-copy-record-note]");
    if (copyRecordNoteButton) {
      const record = recordById.get(copyRecordNoteButton.dataset.copyRecordNote);
      if (record) copyText(record.frusSourceNote || record.sourceNote || "", copyRecordNoteButton);
      return;
    }

    const copyRecordPacketButton = event.target.closest("[data-copy-record-packet]");
    if (copyRecordPacketButton) {
      const record = recordById.get(copyRecordPacketButton.dataset.copyRecordPacket);
      if (record) copyText(buildRecordCompilerPacket(record), copyRecordPacketButton);
      return;
    }

    const copyCandidateNoteButton = event.target.closest("[data-copy-candidate-note]");
    if (copyCandidateNoteButton) {
      const candidate = sourceCandidateById.get(copyCandidateNoteButton.dataset.copyCandidateNote);
      if (candidate) copyText(candidate.sourceNote || "", copyCandidateNoteButton);
      return;
    }

    const copyCandidatePacketButton = event.target.closest("[data-copy-candidate-packet]");
    if (copyCandidatePacketButton) {
      const candidate = sourceCandidateById.get(copyCandidatePacketButton.dataset.copyCandidatePacket);
      if (candidate) copyText(buildSourceCandidateCompilerPacket(candidate), copyCandidatePacketButton);
      return;
    }

    const copyStatementButton = event.target.closest("[data-copy-statement]");
    if (copyStatementButton) {
      const statement = statementById.get(copyStatementButton.dataset.copyStatement);
      if (statement) copyText(statement.citation || statement.sourceNote || "", copyStatementButton);
    }
  });
}

function init() {
  initCompilerDesk();
  initOptions();
  renderStats();
  renderChapterGrid();
  renderRecords();
  renderEvents();
  renderPersons();
  renderStatements();
  renderSourceLeads();
  renderSourceCandidates();
  renderGaps();
  renderReviewQueue();
  bindEvents();
}

init();
