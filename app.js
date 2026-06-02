const records = window.MEPP_RECORDS || [];
const publicStatements = window.MEPP_PUBLIC_STATEMENTS || [];
const persons = window.MEPP_PERSONS || [];
const events = window.MEPP_EVENTS || [];
const compilerGaps = window.MEPP_COMPILER_GAPS || [];
const sourceLeads = window.MEPP_SOURCE_LEADS || [];
const sourceCandidates = window.MEPP_SOURCE_CANDIDATES || [];

const REVIEW_STORAGE_KEY = "bush41-mepp-reviewed-records";
const RECORD_DECISION_STORAGE_KEY = "bush41-mepp-record-decisions";
const SOURCE_CANDIDATE_REVIEW_STORAGE_KEY = "bush41-mepp-reviewed-source-candidates";
const SOURCE_CANDIDATE_SHORTLIST_STORAGE_KEY = "bush41-mepp-shortlisted-source-candidates";
const NOTES_STORAGE_KEY = "bush41-mepp-compiler-notes";
const VOLUME_TITLE = "Foreign Relations of the United States, 1989-1992, Volume XIV, Arab-Israeli Dispute";
const RECORD_DECISION_LABELS = {
  include: "Include",
  maybe: "Maybe",
  exclude: "Exclude"
};

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
  decisionFilter: document.querySelector("#filter-decision"),
  sortRecords: document.querySelector("#sort-records"),
  resetFilters: document.querySelector("#reset-filters"),
  copyRecordViewLink: document.querySelector("#copy-record-view-link"),
  exportCsv: document.querySelector("#export-csv"),
  copyRecordDocumentList: document.querySelector("#copy-record-document-list"),
  downloadRecordDocumentList: document.querySelector("#download-record-document-list"),
  copyRecordAnnotationPlanner: document.querySelector("#copy-record-annotation-planner"),
  downloadRecordAnnotationPlanner: document.querySelector("#download-record-annotation-planner"),
  copyRecordSourceNotes: document.querySelector("#copy-record-source-notes"),
  downloadRecordSourceNotes: document.querySelector("#download-record-source-notes"),
  copyRecordSourceMap: document.querySelector("#copy-record-source-map"),
  downloadRecordSourceMap: document.querySelector("#download-record-source-map"),
  copyMeetingCrosswalk: document.querySelector("#copy-meeting-crosswalk"),
  downloadMeetingCrosswalk: document.querySelector("#download-meeting-crosswalk"),
  copyRecordPeopleIndex: document.querySelector("#copy-record-people-index"),
  downloadRecordPeopleIndex: document.querySelector("#download-record-people-index"),
  copyRecordIssueRegister: document.querySelector("#copy-record-issue-register"),
  downloadRecordIssueRegister: document.querySelector("#download-record-issue-register"),
  copyRecordPackets: document.querySelector("#copy-record-packets"),
  downloadRecordPackets: document.querySelector("#download-record-packets"),
  supportSummary: document.querySelector("#support-summary"),
  actionDashboard: document.querySelector("#action-dashboard"),
  coverageMatrix: document.querySelector("#coverage-matrix"),
  copyCoverageSummary: document.querySelector("#copy-coverage-summary"),
  downloadCoverageSummary: document.querySelector("#download-coverage-summary"),
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
  copyStatementViewLink: document.querySelector("#copy-statement-view-link"),
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
  candidateTriage: document.querySelector("#candidate-triage"),
  candidateCount: document.querySelector("#candidate-count"),
  resetSourceCandidates: document.querySelector("#reset-source-candidates"),
  exportSourceCandidates: document.querySelector("#export-source-candidates-csv"),
  copySourceCandidateViewLink: document.querySelector("#copy-source-candidate-view-link"),
  copySourceCandidatePullList: document.querySelector("#copy-source-candidate-pull-list"),
  downloadSourceCandidatePullList: document.querySelector("#download-source-candidate-pull-list"),
  copySourceCandidateNotes: document.querySelector("#copy-source-candidate-notes"),
  downloadSourceCandidateNotes: document.querySelector("#download-source-candidate-notes"),
  copySourceCandidatePackets: document.querySelector("#copy-source-candidate-packets"),
  downloadSourceCandidatePackets: document.querySelector("#download-source-candidate-packets"),
  gapsRoot: document.querySelector("#gaps-root"),
  gapSearch: document.querySelector("#gap-search"),
  gapPriority: document.querySelector("#gap-priority"),
  gapCategory: document.querySelector("#gap-category"),
  gapCount: document.querySelector("#gap-count"),
  copyGapViewLink: document.querySelector("#copy-gap-view-link"),
  exportGaps: document.querySelector("#export-gaps-csv"),
  reviewRoot: document.querySelector("#review-root"),
  sourceReviewRoot: document.querySelector("#source-review-root"),
  openReviewCount: document.querySelector("#open-review-count"),
  reviewedListSummary: document.querySelector("#reviewed-list-summary"),
  recordDecisionSummary: document.querySelector("#record-decision-summary"),
  sourceCandidateReviewSummary: document.querySelector("#source-candidate-review-summary"),
  copyActionWorklist: document.querySelector("#copy-action-worklist"),
  downloadActionWorklist: document.querySelector("#download-action-worklist"),
  copySelectionSlate: document.querySelector("#copy-selection-slate"),
  downloadSelectionSlate: document.querySelector("#download-selection-slate"),
  compilerNotes: document.querySelector("#compiler-notes"),
  notesStatus: document.querySelector("#notes-status"),
  copyVolumeTitle: document.querySelector("#copy-volume-title"),
  copyDatasetJson: document.querySelector("#copy-dataset-json"),
  downloadDatasetJson: document.querySelector("#download-dataset-json"),
  copyWorkspaceState: document.querySelector("#copy-workspace-state"),
  downloadWorkspaceState: document.querySelector("#download-workspace-state"),
  importWorkspaceState: document.querySelector("#import-workspace-state")
};

let reviewedRecords = new Set(readReviewedRecords());
let recordDecisions = readLocalObject(RECORD_DECISION_STORAGE_KEY);
let reviewedSourceCandidates = new Set(readLocalSet(SOURCE_CANDIDATE_REVIEW_STORAGE_KEY));
let shortlistedSourceCandidates = new Set(readLocalSet(SOURCE_CANDIDATE_SHORTLIST_STORAGE_KEY));
let visibleRecords = [];
let visibleStatements = [];
let visiblePersons = [];
let visibleGaps = [];
let visibleSourceCandidates = [];

const recordById = new Map(records.map((record) => [record.id, record]));
const statementById = new Map(publicStatements.map((statement) => [statement.id, statement]));
const sourceCandidateById = new Map(sourceCandidates.map((candidate) => [candidate.id, candidate]));
const sourceCandidatesByRecordId = buildSourceCandidatesByRecordId();
const personByAlias = buildPersonByAlias();
recordDecisions = cleanRecordDecisions(recordDecisions);

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

function readLocalSet(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalSet(key, values) {
  localStorage.setItem(key, JSON.stringify([...values]));
}

function readLocalObject(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveLocalObject(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
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

function normalizedPersonKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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

function buildPersonByAlias() {
  const map = new Map();
  for (const person of persons) {
    for (const name of [person.name, ...(person.aliases || [])]) {
      const key = normalizedPersonKey(name);
      if (key && !map.has(key)) map.set(key, person);
    }
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

function isAnchorOrHigh(record) {
  return record.selectionValue === "Anchor" || record.selectionValue === "High";
}

function cleanRecordDecisions(decisions) {
  return Object.fromEntries(
    Object.entries(decisions || {}).filter(
      ([id, decision]) => recordById.has(id) && Object.prototype.hasOwnProperty.call(RECORD_DECISION_LABELS, decision)
    )
  );
}

function recordDecision(record) {
  return recordDecisions[record.id] || "";
}

function recordDecisionCounts() {
  const counts = { include: 0, maybe: 0, exclude: 0, undecided: 0 };
  for (const record of records) {
    const decision = recordDecision(record);
    if (decision) counts[decision] += 1;
    else counts.undecided += 1;
  }
  return counts;
}

function saveRecordDecisions() {
  saveLocalObject(RECORD_DECISION_STORAGE_KEY, recordDecisions);
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
  const mode = selectors.sortRecords?.value || "date";
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
  const decision = selectors.decisionFilter?.value || "";

  visibleRecords = records
    .filter((record) => {
      const linkedSourceCandidates = linkedSourceCandidatesForRecord(record);
      const localDecision = recordDecision(record);
      if (query && !searchText(record).includes(query)) return false;
      if (chapter && record.chapter?.name !== chapter) return false;
      if (type && record.documentType !== type) return false;
      if (year && record.date?.slice(0, 4) !== year) return false;
      if (source && record.source?.shortName !== source) return false;
      if (support === "linked-source" && !linkedSourceCandidates.length) return false;
      if (support === "daily-diary" && !hasDailyDiaryCandidate(record)) return false;
      if (support === "public-private" && !record.publicChronologyLinks?.length) return false;
      if (support === "no-public-private" && record.publicChronologyLinks?.length) return false;
      if (support === "unsupported" && linkedSourceCandidates.length) return false;
      if (value === "Anchor/High" && !isAnchorOrHigh(record)) return false;
      else if (value && value !== "Anchor/High" && record.selectionValue !== value) return false;
      if (review === "open" && reviewedRecords.has(record.id)) return false;
      if (review === "reviewed" && !reviewedRecords.has(record.id)) return false;
      if (decision === "undecided" && localDecision) return false;
      if (decision && decision !== "undecided" && localDecision !== decision) return false;
      return true;
    })
    .sort(compareRecords);

  selectors.filteredCount.textContent = `Showing ${visibleRecords.length.toLocaleString()} of ${records.length.toLocaleString()} records.`;
  selectors.recordsRoot.innerHTML = visibleRecords.length
    ? visibleRecords.map(renderRecordCard).join("")
    : `<p class="empty-state">No presidential records match the current filters.</p>`;
  renderSupportSummary();
  renderActionDashboard();
  renderCoverageMatrix();
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

function actionQueueCounts() {
  return {
    anchorHighOpen: records.filter((record) => isAnchorOrHigh(record) && !reviewedRecords.has(record.id)).length,
    anchorHighUnsupported: records.filter((record) => isAnchorOrHigh(record) && !linkedSourceCandidatesForRecord(record).length).length,
    anchorHighNoPublic: records.filter((record) => isAnchorOrHigh(record) && !record.publicChronologyLinks?.length).length,
    highDigitalUnlinkedCandidates: sourceCandidates.filter(
      (candidate) => candidate.priority === "High" && candidateHasDigitalObject(candidate) && !candidate.relatedRecordIds?.length
    ).length,
    openShortlistedCandidates: [...shortlistedSourceCandidates].filter((id) => !reviewedSourceCandidates.has(id)).length
  };
}

function renderActionDashboard() {
  if (!selectors.actionDashboard) return;
  const counts = actionQueueCounts();
  const items = [
    {
      target: "anchor-high-open",
      count: counts.anchorHighOpen,
      label: "Anchor/High open review",
      note: "Selection decisions still pending locally"
    },
    {
      target: "anchor-high-unsupported",
      count: counts.anchorHighUnsupported,
      label: "Anchor/High without linked sources",
      note: "Presidential records needing source-support follow-up"
    },
    {
      target: "anchor-high-no-public",
      count: counts.anchorHighNoPublic,
      label: "Anchor/High without public crosswalk",
      note: "No Public Papers chronology link yet"
    },
    {
      target: "high-digital-unlinked",
      count: counts.highDigitalUnlinkedCandidates,
      label: "High digital candidates unlinked",
      note: "Likely fastest source-candidate review queue"
    },
    {
      target: "shortlisted-open",
      count: counts.openShortlistedCandidates,
      label: "Shortlisted candidates open",
      note: "Local source shortlist still awaiting review"
    }
  ];
  selectors.actionDashboard.innerHTML = items
    .map(
      (item) => `
        <button class="action-card" type="button" data-action-queue="${escapeHtml(item.target)}">
          <span class="support-value">${Number(item.count).toLocaleString()}</span>
          <span class="support-label">${escapeHtml(item.label)}</span>
          <span class="support-note">${escapeHtml(item.note)}</span>
        </button>
      `
    )
    .join("");
}

function coverageRows() {
  const statementCounts = publicStatements.reduce((counts, statement) => {
    const name = statement.chapter?.name || "Unassigned";
    counts[name] = (counts[name] || 0) + 1;
    return counts;
  }, {});
  const candidateCounts = sourceCandidates.reduce((counts, candidate) => {
    const name = candidate.chapter || "Unassigned";
    counts[name] = (counts[name] || 0) + 1;
    return counts;
  }, {});

  return chapterNames().map((name) => {
    const chapterRecords = records.filter((record) => record.chapter?.name === name);
    const anchorHighRecords = chapterRecords.filter(isAnchorOrHigh);
    const linkedSourceRecords = chapterRecords.filter((record) => linkedSourceCandidatesForRecord(record).length);
    const unsupportedAnchorHigh = anchorHighRecords.filter((record) => !linkedSourceCandidatesForRecord(record).length).length;
    const noPublicAnchorHigh = anchorHighRecords.filter((record) => !record.publicChronologyLinks?.length).length;
    const undecidedAnchorHigh = anchorHighRecords.filter((record) => !recordDecision(record)).length;
    const openReviewAnchorHigh = anchorHighRecords.filter((record) => !reviewedRecords.has(record.id)).length;
    const highDigitalUnlinked = sourceCandidates.filter(
      (candidate) =>
        candidate.chapter === name && candidate.priority === "High" && candidateHasDigitalObject(candidate) && !candidate.relatedRecordIds?.length
    ).length;
    const riskScore = unsupportedAnchorHigh + noPublicAnchorHigh + undecidedAnchorHigh + openReviewAnchorHigh + highDigitalUnlinked;

    return {
      name,
      number: CHAPTER_INFO[name]?.number || 99,
      short: CHAPTER_INFO[name]?.short || name,
      records: chapterRecords.length,
      anchorHigh: anchorHighRecords.length,
      linkedSourceRecords: linkedSourceRecords.length,
      dailyDiaryRecords: chapterRecords.filter(hasDailyDiaryCandidate).length,
      publicRefs: statementCounts[name] || 0,
      sourceCandidates: candidateCounts[name] || 0,
      unsupportedAnchorHigh,
      noPublicAnchorHigh,
      undecidedAnchorHigh,
      openReviewAnchorHigh,
      highDigitalUnlinked,
      riskScore
    };
  });
}

function formatCoverageRatio(count, total) {
  if (!total) return "0 / 0";
  return `${Number(count).toLocaleString()} / ${Number(total).toLocaleString()}`;
}

function renderCoverageMatrix() {
  if (!selectors.coverageMatrix) return;
  const rows = coverageRows();
  selectors.coverageMatrix.innerHTML = `
    <table>
      <thead>
        <tr>
          <th scope="col">Track</th>
          <th scope="col">Records</th>
          <th scope="col">Anchor/High</th>
          <th scope="col">Source gaps</th>
          <th scope="col">Public gaps</th>
          <th scope="col">Undecided</th>
          <th scope="col">Open review</th>
          <th scope="col">Candidate pool</th>
          <th scope="col">Risk</th>
          <th scope="col">Open</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                <th scope="row">
                  <span class="matrix-track">Track ${escapeHtml(row.number)}: ${escapeHtml(row.short)}</span>
                  <span class="matrix-subtext">${escapeHtml(row.name)}</span>
                </th>
                <td>${row.records.toLocaleString()}</td>
                <td>${row.anchorHigh.toLocaleString()}</td>
                <td>${formatCoverageRatio(row.unsupportedAnchorHigh, row.anchorHigh)}</td>
                <td>${formatCoverageRatio(row.noPublicAnchorHigh, row.anchorHigh)}</td>
                <td>${formatCoverageRatio(row.undecidedAnchorHigh, row.anchorHigh)}</td>
                <td>${formatCoverageRatio(row.openReviewAnchorHigh, row.anchorHigh)}</td>
                <td>
                  ${row.sourceCandidates.toLocaleString()}
                  <span class="matrix-subtext">${row.highDigitalUnlinked.toLocaleString()} high digital unlinked</span>
                </td>
                <td><span class="risk-badge">${row.riskScore.toLocaleString()}</span></td>
                <td><button type="button" data-coverage-track="${escapeHtml(row.name)}">Track</button></td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderRecordCard(record) {
  const relatedSourceCandidates = linkedSourceCandidatesForRecord(record);
  const decision = recordDecision(record);
  const terms = [
    record.sourceConfidence?.label,
    record.eventLabel,
    record.pdfReview?.classificationMarkers?.length ? `Classification: ${record.pdfReview.classificationMarkers.join(", ")}` : "",
    record.pdfReview?.redactionMarkers?.length ? `Review markers: ${record.pdfReview.redactionMarkers.join(", ")}` : "",
    ...(record.countries || []),
    ...(record.people || []),
    ...(record.matchedQueries || []),
    relatedSourceCandidates.length ? `${relatedSourceCandidates.length} linked source candidates` : "",
    decision ? `Decision: ${RECORD_DECISION_LABELS[decision]}` : "",
    hasDailyDiaryCandidate(record) ? "Daily Diary/Backup linked" : "",
    record.publicChronologyLinks?.length ? "Public chronology linked" : ""
  ];
  const reviewed = reviewedRecords.has(record.id);
  return `
    <article class="record-card" id="${escapeHtml(record.id)}" data-value="${escapeHtml(record.selectionValue)}" data-decision="${escapeHtml(decision || "undecided")}">
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
        ${Object.entries(RECORD_DECISION_LABELS)
          .map(
            ([value, label]) => `
              <button
                class="decision-toggle"
                type="button"
                data-record-decision-id="${escapeHtml(record.id)}"
                data-record-decision="${escapeHtml(value)}"
                aria-pressed="${decision === value ? "true" : "false"}"
              >${escapeHtml(label)}</button>
            `
          )
          .join("")}
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
  const triage = selectors.candidateTriage?.value || "";
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
      if (triage === "shortlisted" && !shortlistedSourceCandidates.has(candidate.id)) return false;
      if (triage === "shortlisted-open" && (!shortlistedSourceCandidates.has(candidate.id) || reviewedSourceCandidates.has(candidate.id))) {
        return false;
      }
      if (triage === "open" && reviewedSourceCandidates.has(candidate.id)) return false;
      if (triage === "reviewed" && !reviewedSourceCandidates.has(candidate.id)) return false;
      if (triage === "unshortlisted" && shortlistedSourceCandidates.has(candidate.id)) return false;
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
  renderActionDashboard();
}

function renderSourceCandidateCard(candidate) {
  const reviewed = reviewedSourceCandidates.has(candidate.id);
  const shortlisted = shortlistedSourceCandidates.has(candidate.id);
  return `
    <article
      class="source-candidate-card"
      id="${escapeHtml(candidate.id)}"
      data-priority="${escapeHtml(candidate.priority)}"
      data-reviewed="${reviewed ? "true" : "false"}"
      data-shortlisted="${shortlisted ? "true" : "false"}"
    >
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
        ${shortlisted ? `<span class="pill">shortlisted locally</span>` : ""}
        ${reviewed ? `<span class="pill">reviewed locally</span>` : ""}
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
        <button
          class="triage-toggle"
          type="button"
          data-shortlist-candidate="${escapeHtml(candidate.id)}"
          aria-pressed="${shortlisted ? "true" : "false"}"
        >${shortlisted ? "Shortlisted" : "Shortlist"}</button>
        <button
          class="triage-toggle"
          type="button"
          data-review-candidate="${escapeHtml(candidate.id)}"
          aria-pressed="${reviewed ? "true" : "false"}"
        >${reviewed ? "Reviewed" : "Mark reviewed"}</button>
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
  const decisionCounts = recordDecisionCounts();
  const priorityRank = { High: 0, Medium: 1, Review: 2 };
  const shortlistedCandidates = sourceCandidates
    .filter((candidate) => shortlistedSourceCandidates.has(candidate.id))
    .sort(
      (a, b) =>
        Number(reviewedSourceCandidates.has(a.id)) - Number(reviewedSourceCandidates.has(b.id)) ||
        (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) ||
        String(a.chapter).localeCompare(String(b.chapter)) ||
        a.title.localeCompare(b.title)
    );
  const openShortlistedCandidates = shortlistedCandidates.filter((candidate) => !reviewedSourceCandidates.has(candidate.id));
  selectors.openReviewCount.textContent = `${openHighValue.length.toLocaleString()} anchor or high-value records need local review.`;
  selectors.reviewedListSummary.textContent = `${reviewed.length.toLocaleString()} records marked reviewed in this browser.`;
  if (selectors.recordDecisionSummary) {
    selectors.recordDecisionSummary.textContent = `${decisionCounts.include.toLocaleString()} include / ${decisionCounts.maybe.toLocaleString()} maybe / ${decisionCounts.exclude.toLocaleString()} exclude; ${decisionCounts.undecided.toLocaleString()} undecided.`;
  }
  if (selectors.sourceCandidateReviewSummary) {
    selectors.sourceCandidateReviewSummary.textContent = `${shortlistedCandidates.length.toLocaleString()} source candidates shortlisted; ${openShortlistedCandidates.length.toLocaleString()} still need local review.`;
  }
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
  if (selectors.sourceReviewRoot) {
    selectors.sourceReviewRoot.innerHTML = shortlistedCandidates.length
      ? shortlistedCandidates
          .slice(0, 12)
          .map(
            (candidate) => `
              <article class="review-item">
                <p class="record-date">${escapeHtml([candidate.priority, candidateLaneGroup(candidate)].filter(Boolean).join(" / "))}</p>
                <h3>${escapeHtml(candidate.title)}</h3>
                <p>${escapeHtml(candidate.reason || "")}</p>
                <div class="tag-list">
                  <span class="pill">${escapeHtml(candidate.chapter || "Unassigned")}</span>
                  ${reviewedSourceCandidates.has(candidate.id) ? `<span class="pill">reviewed locally</span>` : `<span class="pill">open local review</span>`}
                </div>
                <div class="record-links">
                  <a href="${escapeHtml(candidate.catalogUrl)}" rel="noreferrer">Catalog</a>
                  <a href="#${escapeHtml(candidate.id)}">Jump to candidate</a>
                  <button type="button" data-copy-candidate-packet="${escapeHtml(candidate.id)}">Copy packet</button>
                  <button
                    class="triage-toggle"
                    type="button"
                    data-review-candidate="${escapeHtml(candidate.id)}"
                    aria-pressed="${reviewedSourceCandidates.has(candidate.id) ? "true" : "false"}"
                  >${reviewedSourceCandidates.has(candidate.id) ? "Reviewed" : "Mark reviewed"}</button>
                </div>
              </article>
            `
          )
          .join("")
      : `<p class="empty-state">No source candidates are shortlisted in this browser yet.</p>`;
  }
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

function scrollToSection(id) {
  document.querySelector(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToCurrentHash() {
  const hash = window.location?.hash || "";
  if (hash.length < 2) return;
  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    id = hash.slice(1);
  }
  const target = document.getElementById(id);
  if (!target) return;
  const scroll = () => target.scrollIntoView({ block: "start" });
  scroll();
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => window.requestAnimationFrame(scroll));
  }
  if (typeof window.setTimeout === "function") {
    [250, 800, 1600].forEach((delay) => window.setTimeout(scroll, delay));
  }
}

function scheduleCurrentHashScroll() {
  scrollToCurrentHash();
  if (typeof window.addEventListener === "function" && document.readyState !== "complete") {
    window.addEventListener("load", scrollToCurrentHash, { once: true });
  }
}

function applyActionQueue(target) {
  if (target.startsWith("anchor-high")) {
    resetRecordFilters();
    selectors.valueFilter.value = "Anchor/High";
    selectors.sortRecords.value = "value";
    if (target === "anchor-high-open") selectors.reviewFilter.value = "open";
    if (target === "anchor-high-unsupported") selectors.supportFilter.value = "unsupported";
    if (target === "anchor-high-no-public") selectors.supportFilter.value = "no-public-private";
    renderRecords();
    scrollToSection("#records");
    return;
  }

  resetSourceCandidateFilters();
  if (target === "high-digital-unlinked") {
    selectors.candidatePriority.value = "High";
    selectors.candidateLinkage.value = "unlinked";
    selectors.candidateAccess.value = "digital";
  }
  if (target === "shortlisted-open") selectors.candidateTriage.value = "shortlisted-open";
  renderSourceCandidates();
  scrollToSection("#source-candidates");
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
    selectors.decisionFilter,
    selectors.reviewFilter
  ].forEach((control) => {
    if (control) control.value = "";
  });
  if (selectors.sortRecords) selectors.sortRecords.value = "date";
  renderRecords();
}

const RECORD_VIEW_PARAMS = [
  ["q", "searchInput"],
  ["track", "chapterFilter"],
  ["type", "typeFilter"],
  ["year", "yearFilter"],
  ["source", "sourceFilter"],
  ["support", "supportFilter"],
  ["value", "valueFilter"],
  ["review", "reviewFilter"],
  ["decision", "decisionFilter"],
  ["sort", "sortRecords"]
];

function applyRecordViewFromUrl() {
  if (!window.location?.search) return false;
  const params = new URLSearchParams(window.location.search);
  let applied = false;
  for (const [param, selectorName] of RECORD_VIEW_PARAMS) {
    const control = selectors[selectorName];
    if (!control || !params.has(param)) continue;
    control.value = params.get(param) || "";
    applied = true;
  }
  return applied;
}

function buildRecordViewUrl() {
  const base = new URL(window.location?.pathname || "/", window.location?.origin || "https://therealjameswilson.github.io");
  for (const [param, selectorName] of RECORD_VIEW_PARAMS) {
    const value = selectors[selectorName]?.value || "";
    if (value) base.searchParams.set(param, value);
  }
  base.hash = "records";
  return base.toString();
}

const SOURCE_CANDIDATE_VIEW_PARAMS = [
  ["cq", "candidateSearch"],
  ["ctrack", "candidateChapter"],
  ["cpriority", "candidatePriority"],
  ["clevel", "candidateLevel"],
  ["clane", "candidateLaneGroup"],
  ["clinkage", "candidateLinkage"],
  ["caccess", "candidateAccess"],
  ["ctriage", "candidateTriage"]
];

function applySourceCandidateViewFromUrl() {
  if (!window.location?.search) return false;
  const params = new URLSearchParams(window.location.search);
  let applied = false;
  for (const [param, selectorName] of SOURCE_CANDIDATE_VIEW_PARAMS) {
    const control = selectors[selectorName];
    if (!control || !params.has(param)) continue;
    control.value = params.get(param) || "";
    applied = true;
  }
  return applied;
}

function buildSourceCandidateViewUrl() {
  const base = new URL(window.location?.pathname || "/", window.location?.origin || "https://therealjameswilson.github.io");
  for (const [param, selectorName] of SOURCE_CANDIDATE_VIEW_PARAMS) {
    const value = selectors[selectorName]?.value || "";
    if (value) base.searchParams.set(param, value);
  }
  base.hash = "source-candidates";
  return base.toString();
}

const STATEMENT_VIEW_PARAMS = [
  ["pq", "statementSearch"],
  ["ptrack", "statementChapter"],
  ["pyear", "statementYear"],
  ["prelevance", "statementRelevance"],
  ["psort", "sortStatements"]
];

function applyStatementViewFromUrl() {
  if (!window.location?.search) return false;
  const params = new URLSearchParams(window.location.search);
  let applied = false;
  for (const [param, selectorName] of STATEMENT_VIEW_PARAMS) {
    const control = selectors[selectorName];
    if (!control || !params.has(param)) continue;
    control.value = params.get(param) || "";
    applied = true;
  }
  return applied;
}

function buildStatementViewUrl() {
  const base = new URL(window.location?.pathname || "/", window.location?.origin || "https://therealjameswilson.github.io");
  for (const [param, selectorName] of STATEMENT_VIEW_PARAMS) {
    const value = selectors[selectorName]?.value || "";
    if (value) base.searchParams.set(param, value);
  }
  base.hash = "statements";
  return base.toString();
}

const GAP_VIEW_PARAMS = [
  ["gq", "gapSearch"],
  ["gpriority", "gapPriority"],
  ["gcategory", "gapCategory"]
];

function applyGapViewFromUrl() {
  if (!window.location?.search) return false;
  const params = new URLSearchParams(window.location.search);
  let applied = false;
  for (const [param, selectorName] of GAP_VIEW_PARAMS) {
    const control = selectors[selectorName];
    if (!control || !params.has(param)) continue;
    control.value = params.get(param) || "";
    applied = true;
  }
  return applied;
}

function buildGapViewUrl() {
  const base = new URL(window.location?.pathname || "/", window.location?.origin || "https://therealjameswilson.github.io");
  for (const [param, selectorName] of GAP_VIEW_PARAMS) {
    const value = selectors[selectorName]?.value || "";
    if (value) base.searchParams.set(param, value);
  }
  base.hash = "gaps";
  return base.toString();
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
    selectors.candidateAccess,
    selectors.candidateTriage
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

function workspaceStateSnapshot() {
  return {
    reviewedRecordIds: [...reviewedRecords],
    recordDecisions: { ...recordDecisions },
    shortlistedSourceCandidateIds: [...shortlistedSourceCandidates],
    reviewedSourceCandidateIds: [...reviewedSourceCandidates],
    compilerNotes: selectors.compilerNotes?.value ?? readLocalValue(NOTES_STORAGE_KEY)
  };
}

function buildWorkspaceStateExport() {
  return {
    title: VOLUME_TITLE,
    stateVersion: 1,
    exportedAt: new Date().toISOString(),
    liveSiteUrl: "https://therealjameswilson.github.io/Bush41-MEPP/",
    localState: workspaceStateSnapshot()
  };
}

function workspaceStateJson() {
  return JSON.stringify(buildWorkspaceStateExport(), null, 2);
}

function cleanIds(values, knownMap) {
  if (!Array.isArray(values)) return [];
  return values.filter((value) => typeof value === "string" && value && (!knownMap || knownMap.has(value)));
}

function normalizeImportedWorkspaceState(payload) {
  const localState = payload?.localState || payload?.localWorkspaceState || payload || {};
  const localSourceCandidateTriage = payload?.localSourceCandidateTriage || {};
  return {
    reviewedRecordIds: cleanIds(localState.reviewedRecordIds || localState.reviewedRecords || payload?.reviewedRecordIds, recordById),
    recordDecisions: cleanRecordDecisions(localState.recordDecisions || payload?.recordDecisions || {}),
    shortlistedSourceCandidateIds: cleanIds(
      localState.shortlistedSourceCandidateIds ||
        localState.shortlistedSourceCandidates ||
        localSourceCandidateTriage.shortlistedIds ||
        payload?.shortlistedSourceCandidateIds,
      sourceCandidateById
    ),
    reviewedSourceCandidateIds: cleanIds(
      localState.reviewedSourceCandidateIds ||
        localState.reviewedSourceCandidates ||
        localSourceCandidateTriage.reviewedIds ||
        payload?.reviewedSourceCandidateIds,
      sourceCandidateById
    ),
    compilerNotes:
      typeof localState.compilerNotes === "string"
        ? localState.compilerNotes
        : typeof payload?.compilerNotes === "string"
          ? payload.compilerNotes
          : null
  };
}

function applyWorkspaceState(payload) {
  const state = normalizeImportedWorkspaceState(payload);
  reviewedRecords = new Set(state.reviewedRecordIds);
  recordDecisions = state.recordDecisions;
  shortlistedSourceCandidates = new Set(state.shortlistedSourceCandidateIds);
  reviewedSourceCandidates = new Set(state.reviewedSourceCandidateIds);
  saveReviewedRecords();
  saveRecordDecisions();
  saveLocalSet(SOURCE_CANDIDATE_SHORTLIST_STORAGE_KEY, shortlistedSourceCandidates);
  saveLocalSet(SOURCE_CANDIDATE_REVIEW_STORAGE_KEY, reviewedSourceCandidates);
  if (state.compilerNotes !== null) {
    saveLocalValue(NOTES_STORAGE_KEY, state.compilerNotes);
    if (selectors.compilerNotes) selectors.compilerNotes.value = state.compilerNotes;
  }
  renderStats();
  renderRecords();
  renderSourceCandidates();
  renderReviewQueue();
  return {
    reviewedRecords: reviewedRecords.size,
    recordDecisions: Object.keys(recordDecisions).length,
    shortlistedSourceCandidates: shortlistedSourceCandidates.size,
    reviewedSourceCandidates: reviewedSourceCandidates.size,
    hasCompilerNotes: Boolean(state.compilerNotes)
  };
}

function buildDatasetExport() {
  const decisionCounts = recordDecisionCounts();
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
      sourceSupport: sourceSupportCounts(),
      recordDecisions: decisionCounts,
      sourceCandidateTriage: {
        shortlisted: shortlistedSourceCandidates.size,
        reviewed: reviewedSourceCandidates.size,
        openShortlisted: [...shortlistedSourceCandidates].filter((id) => !reviewedSourceCandidates.has(id)).length
      }
    },
    localSourceCandidateTriage: {
      shortlistedIds: [...shortlistedSourceCandidates],
      reviewedIds: [...reviewedSourceCandidates]
    },
    localWorkspaceState: workspaceStateSnapshot(),
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
      "local_decision",
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
      RECORD_DECISION_LABELS[recordDecision(record)] || "",
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
      "local_triage",
      "local_review_state",
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
      shortlistedSourceCandidates.has(candidate.id) ? "shortlisted" : "",
      reviewedSourceCandidates.has(candidate.id) ? "reviewed" : "open",
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

function packetBundle(title, items, renderPacket) {
  return packetLines([
    title,
    `Generated: ${new Date().toISOString()}`,
    `Count: ${items.length.toLocaleString()}`,
    "",
    items.length ? items.map(renderPacket).join("\n\n---\n\n") : "No visible items."
  ]);
}

function coverageSummaryLine(row, index) {
  return compactList([
    `${index + 1}. Track ${row.number}: ${row.short}`,
    `Records: ${row.records.toLocaleString()}; Anchor/High: ${row.anchorHigh.toLocaleString()}; Public refs: ${row.publicRefs.toLocaleString()}; Source candidates: ${row.sourceCandidates.toLocaleString()}`,
    `Weak spots: ${row.unsupportedAnchorHigh.toLocaleString()} Anchor/High without linked source candidates; ${row.noPublicAnchorHigh.toLocaleString()} Anchor/High without public chronology; ${row.undecidedAnchorHigh.toLocaleString()} Anchor/High undecided locally; ${row.openReviewAnchorHigh.toLocaleString()} Anchor/High open review`,
    `Source pool: ${row.linkedSourceRecords.toLocaleString()} records with linked candidates; ${row.dailyDiaryRecords.toLocaleString()} Daily Diary/Backup links; ${row.highDigitalUnlinked.toLocaleString()} high digital candidates not linked to FRUS records`,
    `Risk score: ${row.riskScore.toLocaleString()}`
  ]);
}

function buildCoverageSummary() {
  const rows = coverageRows();
  return packetLines([
    "FRUS MEPP Track Coverage Summary",
    `Generated: ${new Date().toISOString()}`,
    `Live site: https://therealjameswilson.github.io/Bush41-MEPP/`,
    "",
    rows.map(coverageSummaryLine).join("\n\n")
  ]);
}

function compareRecordsForWorklist(a, b) {
  const valueRank = { Anchor: 0, High: 1, Context: 2 };
  return (
    (valueRank[a.selectionValue] ?? 9) - (valueRank[b.selectionValue] ?? 9) ||
    a.sortDate.localeCompare(b.sortDate) ||
    a.title.localeCompare(b.title)
  );
}

function compareSourceCandidatesForWorklist(a, b) {
  const priorityRank = { High: 0, Medium: 1, Review: 2 };
  return (
    (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) ||
    Number(Boolean(a.relatedRecordIds?.length)) - Number(Boolean(b.relatedRecordIds?.length)) ||
    String(a.chapter || "").localeCompare(String(b.chapter || "")) ||
    candidateLaneGroup(a).localeCompare(candidateLaneGroup(b)) ||
    a.title.localeCompare(b.title)
  );
}

function worklistSection(title, items, renderItem, limit = 20) {
  const shown = items.slice(0, limit);
  return packetLines([
    title,
    `Count: ${items.length.toLocaleString()}`,
    shown.length ? shown.map(renderItem).join("\n\n") : "No current items.",
    items.length > shown.length ? `${(items.length - shown.length).toLocaleString()} more items remain in this queue.` : ""
  ]);
}

function worklistRecordLine(record, index) {
  const relatedSourceCandidates = linkedSourceCandidatesForRecord(record);
  const support = [
    relatedSourceCandidates.length ? `${relatedSourceCandidates.length} linked source candidates` : "No linked source candidates",
    hasDailyDiaryCandidate(record) ? "Daily Diary/Backup linked" : "",
    record.publicChronologyLinks?.length ? `${record.publicChronologyLinks.length} public chronology links` : "No public chronology link"
  ]
    .filter(Boolean)
    .join("; ");

  return compactList([
    `${index + 1}. ${formatDate(record.date)} - ${record.title}`,
    [record.selectionValue, RECORD_DECISION_LABELS[recordDecision(record)] || "Undecided", record.chapter?.name, record.documentType, `NAID ${record.naid}`]
      .filter(Boolean)
      .join(" | "),
    `Source support: ${support}`,
    record.compilerNote ? `Compiler note: ${record.compilerNote}` : "",
    record.pdfUrl ? `PDF: ${record.pdfUrl}` : "",
    record.catalogUrl ? `Catalog: ${record.catalogUrl}` : ""
  ]);
}

function worklistCandidateLine(candidate, index) {
  return compactList([
    `${index + 1}. ${candidate.title}`,
    [candidate.priority, candidate.chapter, candidateLaneGroup(candidate), candidate.lane, candidate.level].filter(Boolean).join(" | "),
    `Local state: ${shortlistedSourceCandidates.has(candidate.id) ? "shortlisted" : "not shortlisted"}; ${
      reviewedSourceCandidates.has(candidate.id) ? "reviewed" : "open review"
    }`,
    `Linkage: ${candidate.relatedRecordIds?.length ? `${candidate.relatedRecordIds.length} related FRUS records` : "unlinked"}`,
    `Digital object: ${candidateHasDigitalObject(candidate) ? "yes" : "no"}`,
    candidate.reason ? `Reason: ${candidate.reason}` : "",
    candidate.catalogUrl ? `Catalog: ${candidate.catalogUrl}` : "",
    candidate.digitalObjectUrl ? `Digital object URL: ${candidate.digitalObjectUrl}` : ""
  ]);
}

function worklistGapLine(gap, index) {
  return compactList([
    `${index + 1}. ${gap.title}`,
    [gap.priority, gap.category, gap.chapter].filter(Boolean).join(" | "),
    gap.evidence ? `Evidence: ${gap.evidence}` : "",
    gap.nextStep ? `Next step: ${gap.nextStep}` : "",
    gap.status ? `Status: ${gap.status}` : ""
  ]);
}

function buildCompilerActionWorklist() {
  const counts = actionQueueCounts();
  const decisionCounts = recordDecisionCounts();
  const anchorHighOpen = records.filter((record) => isAnchorOrHigh(record) && !reviewedRecords.has(record.id)).sort(compareRecordsForWorklist);
  const anchorHighUnsupported = records
    .filter((record) => isAnchorOrHigh(record) && !linkedSourceCandidatesForRecord(record).length)
    .sort(compareRecordsForWorklist);
  const anchorHighNoPublic = records
    .filter((record) => isAnchorOrHigh(record) && !record.publicChronologyLinks?.length)
    .sort(compareRecordsForWorklist);
  const highDigitalUnlinkedCandidates = sourceCandidates
    .filter((candidate) => candidate.priority === "High" && candidateHasDigitalObject(candidate) && !candidate.relatedRecordIds?.length)
    .sort(compareSourceCandidatesForWorklist);
  const openShortlistedCandidates = [...shortlistedSourceCandidates]
    .map((id) => sourceCandidateById.get(id))
    .filter((candidate) => candidate && !reviewedSourceCandidates.has(candidate.id))
    .sort(compareSourceCandidatesForWorklist);
  const openCompilerGaps = compilerGaps
    .filter((gap) => gap.priority !== "Low")
    .sort((a, b) => {
      const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) || a.title.localeCompare(b.title);
    });

  return packetLines([
    "FRUS MEPP Compiler Action Worklist",
    `Generated: ${new Date().toISOString()}`,
    `Live site: https://therealjameswilson.github.io/Bush41-MEPP/`,
    "",
    "Queue Summary",
    `Anchor/High open review: ${counts.anchorHighOpen.toLocaleString()}`,
    `Anchor/High without linked sources: ${counts.anchorHighUnsupported.toLocaleString()}`,
    `Anchor/High without public crosswalk: ${counts.anchorHighNoPublic.toLocaleString()}`,
    `High digital candidates unlinked: ${counts.highDigitalUnlinkedCandidates.toLocaleString()}`,
    `Shortlisted candidates open: ${counts.openShortlistedCandidates.toLocaleString()}`,
    `Record decisions: ${decisionCounts.include.toLocaleString()} include / ${decisionCounts.maybe.toLocaleString()} maybe / ${decisionCounts.exclude.toLocaleString()} exclude / ${decisionCounts.undecided.toLocaleString()} undecided`,
    "",
    worklistSection("Anchor/High Open Review", anchorHighOpen, worklistRecordLine),
    "",
    worklistSection("Anchor/High Without Linked Source Candidates", anchorHighUnsupported, worklistRecordLine),
    "",
    worklistSection("Anchor/High Without Public Chronology Crosswalk", anchorHighNoPublic, worklistRecordLine),
    "",
    worklistSection("High Digital Source Candidates Not Linked To FRUS Records", highDigitalUnlinkedCandidates, worklistCandidateLine),
    "",
    worklistSection("Shortlisted Source Candidates Still Open", openShortlistedCandidates, worklistCandidateLine),
    "",
    worklistSection("Open Compiler Gaps", openCompilerGaps, worklistGapLine)
  ]);
}

function selectionSlateRecordLine(record, index) {
  const relatedSourceCandidates = linkedSourceCandidatesForRecord(record);
  const publicChronologyLinks = record.publicChronologyLinks || [];
  const support = [
    relatedSourceCandidates.length ? `${relatedSourceCandidates.length} linked source candidates` : "No linked source candidates",
    hasDailyDiaryCandidate(record) ? "Daily Diary/Backup linked" : "",
    publicChronologyLinks.length ? `${publicChronologyLinks.length} public chronology links` : "No public chronology link"
  ]
    .filter(Boolean)
    .join("; ");

  return compactList([
    `${index + 1}. ${formatDate(record.date)} - ${record.title}`,
    [
      `Decision: ${RECORD_DECISION_LABELS[recordDecision(record)]}`,
      `Value: ${record.selectionValue || "Unassigned"}`,
      record.chapter?.name,
      record.documentType,
      `NAID ${record.naid || "Pending"}`
    ]
      .filter(Boolean)
      .join(" | "),
    `Source support: ${support}`,
    `Source note: ${record.frusSourceNote || record.sourceNote || "Source note pending."}`,
    record.compilerNote ? `Compiler note: ${record.compilerNote}` : "",
    relatedSourceCandidates.length ? "Related source candidates:" : "",
    ...relatedSourceCandidates.slice(0, 5).map(sourceCandidatePacketLine),
    relatedSourceCandidates.length > 5 ? `${relatedSourceCandidates.length - 5} more linked source candidates on the record card.` : "",
    publicChronologyLinks.length ? "Related public chronology:" : "",
    ...publicChronologyLinks
      .slice(0, 3)
      .map((link, publicIndex) => `${publicIndex + 1}. ${formatDate(link.date)}: ${link.title}${link.pdfPageUrl ? ` (${link.pdfPageUrl})` : ""}`),
    publicChronologyLinks.length > 3 ? `${publicChronologyLinks.length - 3} more public chronology links on the record card.` : "",
    record.pdfUrl ? `PDF: ${record.pdfUrl}` : "",
    record.catalogUrl ? `Catalog: ${record.catalogUrl}` : ""
  ]);
}

function selectionSlateDecisionSection(label, items) {
  return packetLines([
    label,
    `Count: ${items.length.toLocaleString()}`,
    items.length ? chapterNames().map((name) => selectionSlateTrackSection(name, items)).filter(Boolean).join("\n\n") : "No records in this decision state."
  ]);
}

function selectionSlateTrackSection(trackName, items) {
  const trackRecords = items.filter((record) => record.chapter?.name === trackName).sort(compareRecordsForWorklist);
  if (!trackRecords.length) return "";
  const info = CHAPTER_INFO[trackName];
  return packetLines([
    `Track ${info?.number || ""}: ${info?.short || trackName}`,
    trackRecords.map(selectionSlateRecordLine).join("\n\n")
  ]);
}

function buildSelectionSlate() {
  const decisionCounts = recordDecisionCounts();
  const includeRecords = records.filter((record) => recordDecision(record) === "include").sort(compareRecordsForWorklist);
  const maybeRecords = records.filter((record) => recordDecision(record) === "maybe").sort(compareRecordsForWorklist);
  const selectedRecords = [...includeRecords, ...maybeRecords];

  return packetLines([
    "FRUS MEPP Selection Slate",
    `Generated: ${new Date().toISOString()}`,
    `Live site: https://therealjameswilson.github.io/Bush41-MEPP/`,
    "",
    "Decision Summary",
    `${decisionCounts.include.toLocaleString()} include / ${decisionCounts.maybe.toLocaleString()} maybe / ${decisionCounts.exclude.toLocaleString()} exclude / ${decisionCounts.undecided.toLocaleString()} undecided`,
    "",
    selectedRecords.length
      ? [
          selectionSlateDecisionSection("Include", includeRecords),
          "",
          selectionSlateDecisionSection("Maybe", maybeRecords)
        ].join("\n")
      : "No Include or Maybe records are marked in this browser yet."
  ]);
}

function sourceNoteVerificationFlags(note) {
  const flags = [];
  if (!note) flags.push("Source note pending");
  if (/classification marking requires PDF verification/i.test(note)) flags.push("Classification requires PDF verification");
  if (/Folder-level source candidate|document-level .* require review/i.test(note)) flags.push("Document-level details require review");
  if (/No classification marking\./i.test(note)) flags.push("Confirm absence of classification marking against scan");
  return flags;
}

function sourceNoteRegisterEntry(item, index) {
  const note = item.note || "";
  const flags = sourceNoteVerificationFlags(note);
  return compactList([
    `${index + 1}. ${item.title}`,
    item.meta,
    item.decision ? `Local decision: ${item.decision}` : "",
    item.naid ? `NAID: ${item.naid}` : "",
    item.catalogUrl ? `Catalog: ${item.catalogUrl}` : "",
    item.digitalObjectUrl ? `Digital object: ${item.digitalObjectUrl}` : "",
    `Source note: ${note || "Source note pending."}`,
    flags.length ? `Verification flags: ${flags.join("; ")}` : ""
  ]);
}

function buildRecordSourceNoteRegister() {
  const linkedCandidates = new Map();
  for (const record of visibleRecords) {
    for (const candidate of linkedSourceCandidatesForRecord(record)) {
      linkedCandidates.set(candidate.id, candidate);
    }
  }

  const recordEntries = visibleRecords.map((record) => ({
    title: record.title,
    meta: [formatDate(record.date), record.documentType, record.chapter?.name, record.selectionValue].filter(Boolean).join(" | "),
    decision: RECORD_DECISION_LABELS[recordDecision(record)] || "Undecided",
    naid: record.naid,
    catalogUrl: record.catalogUrl,
    digitalObjectUrl: record.pdfUrl,
    note: record.frusSourceNote || record.sourceNote || ""
  }));

  const candidateEntries = [...linkedCandidates.values()].map((candidate) => ({
    title: candidate.title,
    meta: [candidate.priority, candidateLaneGroup(candidate), candidate.lane, candidate.sourceSeries].filter(Boolean).join(" | "),
    naid: candidate.naid || candidate.externalId,
    catalogUrl: candidate.catalogUrl,
    digitalObjectUrl: candidate.digitalObjectUrl,
    note: candidate.sourceNote || ""
  }));

  return packetLines([
    "FRUS MEPP Visible Chronology Source Note Register",
    `Generated: ${new Date().toISOString()}`,
    `Presidential records: ${recordEntries.length.toLocaleString()}`,
    `Linked source candidates: ${candidateEntries.length.toLocaleString()}`,
    "",
    "Presidential Records",
    recordEntries.length ? recordEntries.map(sourceNoteRegisterEntry).join("\n\n") : "No visible presidential records.",
    "",
    "Linked Source Candidates",
    candidateEntries.length ? candidateEntries.map(sourceNoteRegisterEntry).join("\n\n") : "No linked source candidates for the visible records."
  ]);
}

function sourceMapKey(parts) {
  return parts.map((part) => String(part || "")).join("\u001f");
}

function recordSourceMapLine(record, index) {
  return compactList([
    `${index + 1}. ${formatDate(record.date)} - ${record.title}`,
    [record.documentType, record.selectionValue, RECORD_DECISION_LABELS[recordDecision(record)] || "Undecided", record.chapter?.name, `NAID ${record.naid}`]
      .filter(Boolean)
      .join(" | "),
    record.catalogUrl ? `Catalog: ${record.catalogUrl}` : "",
    record.pdfUrl ? `PDF: ${record.pdfUrl}` : ""
  ]);
}

function candidateSourceMapLine(candidate, index, visibleRecordIds) {
  const relatedVisibleRecords = (candidate.relatedRecords || []).filter((record) => visibleRecordIds.has(record.id));
  return compactList([
    `${index + 1}. ${candidate.title}`,
    [candidate.priority, candidate.lane, candidate.level, candidate.localIdentifier, candidate.date].filter(Boolean).join(" | "),
    relatedVisibleRecords.length
      ? `Visible FRUS links: ${relatedVisibleRecords.map((record) => [record.date, record.title].filter(Boolean).join(" - ")).join("; ")}`
      : "",
    candidate.catalogUrl ? `Catalog: ${candidate.catalogUrl}` : "",
    candidate.digitalObjectUrl ? `Digital object: ${candidate.digitalObjectUrl}` : ""
  ]);
}

function buildVisibleSourceMapGroups() {
  const recordGroups = new Map();
  const candidateGroups = new Map();
  const visibleRecordIds = new Set(visibleRecords.map((record) => record.id));

  for (const record of visibleRecords) {
    const source = record.source || {};
    const key = sourceMapKey(["presidential", source.naid, source.shortName || source.title, source.url]);
    if (!recordGroups.has(key)) {
      recordGroups.set(key, {
        source,
        records: [],
        notes: new Set()
      });
    }
    const group = recordGroups.get(key);
    group.records.push(record);
    if (record.sourceNoteLocation) group.notes.add(record.sourceNoteLocation);
    else if (record.frusSourceNote || record.sourceNote) group.notes.add(record.frusSourceNote || record.sourceNote);

    for (const candidate of linkedSourceCandidatesForRecord(record)) {
      const laneGroup = candidateLaneGroup(candidate);
      const candidateKey = sourceMapKey([
        "candidate",
        candidate.repository,
        candidate.collection,
        candidate.sourceSeries,
        laneGroup,
        candidate.sourceSeriesNaid
      ]);
      if (!candidateGroups.has(candidateKey)) {
        candidateGroups.set(candidateKey, {
          repository: candidate.repository || "Repository not specified",
          collection: candidate.collection || "Collection not specified",
          sourceSeries: candidate.sourceSeries || "Series not specified",
          sourceSeriesNaid: candidate.sourceSeriesNaid || "",
          laneGroup,
          candidates: new Map(),
          notes: new Set(),
          visibleRecordIds: new Set()
        });
      }
      const candidateGroup = candidateGroups.get(candidateKey);
      candidateGroup.candidates.set(candidate.id, candidate);
      candidateGroup.visibleRecordIds.add(record.id);
      if (candidate.sourceNote) candidateGroup.notes.add(candidate.sourceNote);
    }
  }

  return { recordGroups: [...recordGroups.values()], candidateGroups: [...candidateGroups.values()], visibleRecordIds };
}

function sourceMapRecordGroupSection(group, index) {
  const recordsForGroup = group.records.sort(compareRecordsForWorklist);
  const source = group.source || {};
  return packetLines([
    `${index + 1}. Presidential record series: ${source.shortName || source.title || "Series not specified"}`,
    `Repository: George H.W. Bush Library / National Archives Catalog`,
    source.naid ? `Series NAID: ${source.naid}` : "",
    source.url ? `Series catalog: ${source.url}` : "",
    `Visible records: ${recordsForGroup.length.toLocaleString()}`,
    `Anchor/High records: ${recordsForGroup.filter(isAnchorOrHigh).length.toLocaleString()}`,
    `Open local review: ${recordsForGroup.filter((record) => !reviewedRecords.has(record.id)).length.toLocaleString()}`,
    "",
    "Source-note examples:",
    [...group.notes].slice(0, 3).map((note, noteIndex) => `${noteIndex + 1}. ${note}`).join("\n") || "No source-note examples.",
    group.notes.size > 3 ? `${group.notes.size - 3} more source-note variants in visible record source notes.` : "",
    "",
    "Visible record examples:",
    recordsForGroup.slice(0, 10).map(recordSourceMapLine).join("\n\n"),
    recordsForGroup.length > 10 ? `${recordsForGroup.length - 10} more visible records in this series.` : ""
  ]);
}

function sourceMapCandidateGroupSection(group, index, visibleRecordIds) {
  const candidates = [...group.candidates.values()].sort(compareSourceCandidatesForWorklist);
  const digitalCount = candidates.filter(candidateHasDigitalObject).length;
  return packetLines([
    `${index + 1}. Linked source candidate series: ${group.sourceSeries}`,
    `Repository: ${group.repository}`,
    `Collection: ${group.collection}`,
    `Lane group: ${group.laneGroup}`,
    group.sourceSeriesNaid ? `Series NAID: ${group.sourceSeriesNaid}` : "",
    `Linked candidates: ${candidates.length.toLocaleString()}`,
    `Linked visible presidential records: ${group.visibleRecordIds.size.toLocaleString()}`,
    `Digital objects: ${digitalCount.toLocaleString()} of ${candidates.length.toLocaleString()}`,
    "",
    "Source-note examples:",
    [...group.notes].slice(0, 2).map((note, noteIndex) => `${noteIndex + 1}. ${note}`).join("\n") || "No source-note examples.",
    group.notes.size > 2 ? `${group.notes.size - 2} more source-note variants in linked candidate notes.` : "",
    "",
    "Candidate examples:",
    candidates.slice(0, 10).map((candidate, candidateIndex) => candidateSourceMapLine(candidate, candidateIndex, visibleRecordIds)).join("\n\n"),
    candidates.length > 10 ? `${candidates.length - 10} more linked candidates in this source series.` : ""
  ]);
}

function buildVisibleSourceMap() {
  const { recordGroups, candidateGroups, visibleRecordIds } = buildVisibleSourceMapGroups();
  const linkedCandidateCount = candidateGroups.reduce((sum, group) => sum + group.candidates.size, 0);

  return packetLines([
    "FRUS MEPP Visible Source Map",
    `Generated: ${new Date().toISOString()}`,
    `Live site: https://therealjameswilson.github.io/Bush41-MEPP/`,
    `Visible presidential records: ${visibleRecords.length.toLocaleString()}`,
    `Presidential record series represented: ${recordGroups.length.toLocaleString()}`,
    `Linked source-candidate series represented: ${candidateGroups.length.toLocaleString()}`,
    `Linked source candidates represented: ${linkedCandidateCount.toLocaleString()}`,
    "",
    "Compiler use:",
    "- Use this after filtering the chronology to see the repositories, collections, and source series implicated by that subset.",
    "- Use source-note examples as drafting aids only; verify exact folder, item, classification, distribution, and digital-object details against scans and catalog records.",
    "- Compare linked source-candidate series against presidential record series before preparing archive requests or final source notes.",
    "",
    "Presidential Record Series",
    recordGroups.length
      ? recordGroups.sort((a, b) => String(a.source?.shortName || a.source?.title || "").localeCompare(String(b.source?.shortName || b.source?.title || ""))).map(sourceMapRecordGroupSection).join("\n\n---\n\n")
      : "No presidential record series in the visible chronology.",
    "",
    "Linked Source Candidate Series",
    candidateGroups.length
      ? candidateGroups
          .sort(
            (a, b) =>
              a.repository.localeCompare(b.repository) ||
              a.laneGroup.localeCompare(b.laneGroup) ||
              a.sourceSeries.localeCompare(b.sourceSeries)
          )
          .map((group, index) => sourceMapCandidateGroupSection(group, index, visibleRecordIds))
          .join("\n\n---\n\n")
      : "No linked source-candidate series for the visible chronology."
  ]);
}

function visibleDecisionCounts(items) {
  return items.reduce(
    (counts, record) => {
      const decision = recordDecision(record);
      if (decision) counts[decision] += 1;
      else counts.undecided += 1;
      return counts;
    },
    { include: 0, maybe: 0, exclude: 0, undecided: 0 }
  );
}

function documentListSupportSummary(record) {
  const relatedSourceCandidates = linkedSourceCandidatesForRecord(record);
  return [
    relatedSourceCandidates.length ? `${relatedSourceCandidates.length.toLocaleString()} linked source candidates` : "No linked source candidates",
    hasDailyDiaryCandidate(record) ? "Daily Diary/Backup linked" : "No Daily Diary/Backup candidate linked",
    record.publicChronologyLinks?.length
      ? `${record.publicChronologyLinks.length.toLocaleString()} public chronology links`
      : "No public chronology crosswalk"
  ].join("; ");
}

function draftDocumentListEntry(record, index) {
  const relatedSourceCandidates = linkedSourceCandidatesForRecord(record);
  const publicChronologyLinks = record.publicChronologyLinks || [];
  const people = (record.people || []).slice(0, 8).join("; ");
  const shownCandidates = relatedSourceCandidates.slice(0, 3);

  return compactList([
    `${String(index + 1).padStart(3, "0")}. ${formatDate(record.date)} - ${record.title}`,
    [
      record.chapter?.name,
      record.documentType,
      record.selectionValue || "Unassigned value",
      `Decision: ${RECORD_DECISION_LABELS[recordDecision(record)] || "Undecided"}`,
      reviewedRecords.has(record.id) ? "Reviewed locally" : "Open review",
      record.naid ? `NAID ${record.naid}` : ""
    ]
      .filter(Boolean)
      .join(" | "),
    people ? `People: ${people}` : "",
    record.countries?.length ? `Countries/entities: ${record.countries.join("; ")}` : "",
    `Source support: ${documentListSupportSummary(record)}`,
    `Source note: ${record.frusSourceNote || record.sourceNote || "Source note pending."}`,
    record.compilerNote ? `Compiler note: ${record.compilerNote}` : "",
    shownCandidates.length ? `Top source candidates: ${shownCandidates.map((candidate) => candidate.title).join("; ")}` : "",
    relatedSourceCandidates.length > shownCandidates.length
      ? `${relatedSourceCandidates.length - shownCandidates.length} more linked source candidates on the record card.`
      : "",
    publicChronologyLinks.length
      ? `Public chronology: ${publicChronologyLinks
          .slice(0, 2)
          .map((link) => `${formatDate(link.date)} - ${link.title}`)
          .join("; ")}`
      : "",
    publicChronologyLinks.length > 2 ? `${publicChronologyLinks.length - 2} more public chronology links on the record card.` : "",
    record.pdfUrl ? `PDF: ${record.pdfUrl}` : "",
    record.catalogUrl ? `Catalog: ${record.catalogUrl}` : ""
  ]);
}

function buildVisibleDraftDocumentList() {
  const decisionCounts = visibleDecisionCounts(visibleRecords);
  const anchorHighCount = visibleRecords.filter(isAnchorOrHigh).length;
  const supportCounts = sourceSupportCounts(visibleRecords);

  return packetLines([
    "FRUS MEPP Visible Draft Document List",
    `Generated: ${new Date().toISOString()}`,
    `Live site: https://therealjameswilson.github.io/Bush41-MEPP/`,
    `FRUS volume: ${VOLUME_TITLE}`,
    `Visible presidential records: ${visibleRecords.length.toLocaleString()}`,
    `Anchor/High visible records: ${anchorHighCount.toLocaleString()}`,
    `Local decisions: ${decisionCounts.include.toLocaleString()} include / ${decisionCounts.maybe.toLocaleString()} maybe / ${decisionCounts.exclude.toLocaleString()} exclude / ${decisionCounts.undecided.toLocaleString()} undecided`,
    `Source support: ${supportCounts.linkedSource.toLocaleString()} linked / ${supportCounts.dailyDiary.toLocaleString()} Daily Diary/Backup / ${supportCounts.publicChronology.toLocaleString()} public chronology / ${supportCounts.unsupported.toLocaleString()} unsupported`,
    "",
    "Compiler use:",
    "- Use after filtering or sorting the chronology to create a working FRUS document table for the visible subset.",
    "- Treat numbers as temporary working sequence numbers, not final FRUS document numbers.",
    "- Verify date, title, source note, participant data, and selection state against the scan before final assembly.",
    "",
    visibleRecords.length ? visibleRecords.map(draftDocumentListEntry).join("\n\n---\n\n") : "No visible presidential records."
  ]);
}

function crosswalkCandidateLine(candidate, index) {
  return `${index + 1}. ${[candidate.title, candidate.lane, candidate.sourceSeries, candidate.localIdentifier].filter(Boolean).join(" | ")}${
    candidate.catalogUrl ? ` (${candidate.catalogUrl})` : ""
  }`;
}

function publicChronologyLine(link, index) {
  return `${index + 1}. ${formatDate(link.date)} - ${link.title}${link.pdfPageUrl ? ` (${link.pdfPageUrl})` : ""}`;
}

function meetingCrosswalkRecordLine(record, index) {
  const relatedSourceCandidates = linkedSourceCandidatesForRecord(record);
  const diaryCandidates = relatedSourceCandidates.filter((candidate) => candidate.lane === "Presidential Daily Diary/Backup");
  const nonDiaryCandidates = relatedSourceCandidates.filter((candidate) => candidate.lane !== "Presidential Daily Diary/Backup");
  const publicChronologyLinks = record.publicChronologyLinks || [];
  const gaps = [
    diaryCandidates.length ? "" : "No Daily Diary/Backup candidate linked",
    publicChronologyLinks.length ? "" : "No public chronology link",
    relatedSourceCandidates.length ? "" : "No source candidates linked"
  ].filter(Boolean);

  return compactList([
    `${index + 1}. ${formatDate(record.date)} - ${record.title}`,
    [record.selectionValue, RECORD_DECISION_LABELS[recordDecision(record)] || "Undecided", record.chapter?.name, record.documentType, `NAID ${record.naid}`]
      .filter(Boolean)
      .join(" | "),
    record.compilerNote ? `Compiler note: ${record.compilerNote}` : "",
    diaryCandidates.length ? "Daily Diary/Backup:" : "",
    ...diaryCandidates.slice(0, 4).map(crosswalkCandidateLine),
    diaryCandidates.length > 4 ? `${diaryCandidates.length - 4} more Daily Diary/Backup candidates on the record card.` : "",
    publicChronologyLinks.length ? "Public chronology:" : "",
    ...publicChronologyLinks.slice(0, 4).map(publicChronologyLine),
    publicChronologyLinks.length > 4 ? `${publicChronologyLinks.length - 4} more public chronology links on the record card.` : "",
    nonDiaryCandidates.length ? "Other source candidates:" : "",
    ...nonDiaryCandidates.slice(0, 6).map(crosswalkCandidateLine),
    nonDiaryCandidates.length > 6 ? `${nonDiaryCandidates.length - 6} more source candidates on the record card.` : "",
    gaps.length ? `Open support gaps: ${gaps.join("; ")}` : "Open support gaps: none flagged by current crosswalk.",
    record.pdfUrl ? `PDF: ${record.pdfUrl}` : "",
    record.catalogUrl ? `Catalog: ${record.catalogUrl}` : ""
  ]);
}

function buildVisibleMeetingCrosswalk() {
  return packetLines([
    "FRUS MEPP Visible Meeting/Call Crosswalk",
    `Generated: ${new Date().toISOString()}`,
    `Live site: https://therealjameswilson.github.io/Bush41-MEPP/`,
    `Visible presidential records: ${visibleRecords.length.toLocaleString()}`,
    "",
    "Compiler use:",
    "- Compare each declassified presidential meeting/call against Daily Diary/Backup, public chronology, and source-candidate support.",
    "- Treat open support gaps as prompts for source-note verification or further archival pulls.",
    "",
    visibleRecords.length ? visibleRecords.map(meetingCrosswalkRecordLine).join("\n\n---\n\n") : "No visible presidential records."
  ]);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function recordPeopleMatchText(record) {
  return [
    record.title,
    record.documentTitle,
    record.eventLabel,
    record.compilerNote,
    ...(record.people || []),
    ...(record.matchedQueries || []),
    ...Object.values(record.topicTerms || {}).flat(),
    record.pdfReview?.participantLine
  ]
    .filter(Boolean)
    .join(" ");
}

function personAliases(person) {
  return [...new Set([person.name, ...(person.aliases || [])].filter(Boolean))];
}

function textContainsPersonAlias(text, person) {
  return personAliases(person).some((alias) => {
    const normalizedAlias = normalizedPersonKey(alias);
    if (normalizedAlias.length < 3) return false;
    const pattern = new RegExp(`(^|[^A-Za-z0-9])${escapeRegExp(alias)}([^A-Za-z0-9]|$)`, "i");
    return pattern.test(text);
  });
}

function visiblePeopleRecordLine(record, index) {
  return compactList([
    `${index + 1}. ${formatDate(record.date)} - ${record.title}`,
    [record.chapter?.name, record.selectionValue, RECORD_DECISION_LABELS[recordDecision(record)] || "Undecided", record.documentType, record.naid ? `NAID ${record.naid}` : ""]
      .filter(Boolean)
      .join(" | "),
    record.catalogUrl ? `Catalog: ${record.catalogUrl}` : "",
    record.pdfUrl ? `PDF: ${record.pdfUrl}` : ""
  ]);
}

function personIndexEntryLine(entry, index) {
  const recordsForEntry = [...entry.records].sort((a, b) => String(a.sortDate || a.date || "").localeCompare(String(b.sortDate || b.date || "")));
  const firstRecord = recordsForEntry[0];
  const lastRecord = recordsForEntry[recordsForEntry.length - 1];
  const basisCounts = [...entry.basisByRecord.values()].reduce(
    (counts, bases) => {
      if (bases.has("explicit")) counts.explicit += 1;
      if (bases.has("alias")) counts.alias += 1;
      if (bases.has("baseline")) counts.baseline += 1;
      return counts;
    },
    { explicit: 0, alias: 0, baseline: 0 }
  );
  const basis = [
    basisCounts.explicit ? `${basisCounts.explicit.toLocaleString()} explicit record.people` : "",
    basisCounts.alias ? `${basisCounts.alias.toLocaleString()} alias/title/topic matches` : "",
    basisCounts.baseline ? `${basisCounts.baseline.toLocaleString()} presidential-record baseline` : ""
  ].filter(Boolean);
  const anchorHighCount = recordsForEntry.filter(isAnchorOrHigh).length;
  const shownRecords = recordsForEntry.slice(0, 12);

  return compactList([
    `${index + 1}. ${entry.name}`,
    `Visible record hits: ${recordsForEntry.length.toLocaleString()}`,
    `Front-matter match: ${entry.person ? "yes" : "no"}`,
    entry.person?.role ? `Front-matter role: ${entry.person.role}` : "",
    entry.person?.country ? `Country/entity: ${entry.person.country}` : "",
    entry.person?.chapter ? `Front-matter track: ${entry.person.chapter}` : "",
    entry.person?.compilerUse ? `Compiler use: ${entry.person.compilerUse}` : "",
    basis.length ? `Match basis: ${basis.join("; ")}` : "",
    `Tracks: ${[...entry.tracks].sort().join("; ") || "Unassigned"}`,
    firstRecord && lastRecord ? `Visible span: ${formatDate(firstRecord.date)} to ${formatDate(lastRecord.date)}` : "",
    `Anchor/High visible records: ${anchorHighCount.toLocaleString()}`,
    shownRecords.length ? "Record examples:" : "",
    shownRecords.map(visiblePeopleRecordLine).join("\n\n"),
    recordsForEntry.length > shownRecords.length ? `${recordsForEntry.length - shownRecords.length} more visible records in the current filter.` : ""
  ]);
}

function addPersonIndexHit(entries, record, person, displayName, basis) {
  const name = person?.name || displayName;
  if (!name) return;
  const key = person ? normalizedPersonKey(person.name) : normalizedPersonKey(name);
  if (!key) return;
  if (!entries.has(key)) {
    entries.set(key, {
      name,
      person,
      tracks: new Set(),
      records: [],
      recordIds: new Set(),
      basisByRecord: new Map()
    });
  }
  const entry = entries.get(key);
  if (!entry.recordIds.has(record.id)) {
    entry.records.push(record);
    entry.recordIds.add(record.id);
  }
  if (record.chapter?.name) entry.tracks.add(record.chapter.name);
  if (!entry.basisByRecord.has(record.id)) entry.basisByRecord.set(record.id, new Set());
  entry.basisByRecord.get(record.id).add(basis);
}

function collectVisiblePeopleIndexEntries() {
  const entries = new Map();
  for (const record of visibleRecords) {
    for (const name of record.people || []) {
      addPersonIndexHit(entries, record, personByAlias.get(normalizedPersonKey(name)), name, "explicit");
    }

    const matchText = recordPeopleMatchText(record);
    for (const person of persons) {
      if (person.name === "George H.W. Bush") {
        addPersonIndexHit(entries, record, person, person.name, "baseline");
      } else if (textContainsPersonAlias(matchText, person)) {
        addPersonIndexHit(entries, record, person, person.name, "alias");
      }
    }
  }

  return [...entries.values()].sort((a, b) => b.records.length - a.records.length || a.name.localeCompare(b.name));
}

function buildVisibleRecordPeopleIndex() {
  const entries = collectVisiblePeopleIndexEntries();
  const frontMatterHits = entries.filter((entry) => entry.person).length;
  const unlistedNames = entries.filter((entry) => !entry.person).map((entry) => entry.name);

  return packetLines([
    "FRUS MEPP Visible Chronology People Index",
    `Generated: ${new Date().toISOString()}`,
    `Live site: https://therealjameswilson.github.io/Bush41-MEPP/`,
    `Visible presidential records: ${visibleRecords.length.toLocaleString()}`,
    `People/name entries: ${entries.length.toLocaleString()}`,
    `Front-matter names represented: ${frontMatterHits.toLocaleString()} of ${persons.length.toLocaleString()}`,
    `Names not yet in front-matter list: ${unlistedNames.length ? unlistedNames.join("; ") : "none detected from visible records"}`,
    "",
    "Compiler use:",
    "- Use after filtering the chronology by track, year, source support, or local decision.",
    "- Treat alias/title/topic matches as a prompt for name and participant verification against the PDF scan.",
    "- Use names without front-matter matches as candidates for the volume persons list or annotation checks.",
    "",
    entries.length ? entries.map(personIndexEntryLine).join("\n\n---\n\n") : "No visible people/name matches."
  ]);
}

function visibleRecordVerificationPrompts(record) {
  const note = record.frusSourceNote || record.sourceNote || "";
  return [
    /No classification marking\./i.test(note) ? "Confirm absence of classification marking against the scan" : "",
    /Distribution, drafting, and place\/time data require PDF verification/i.test(note)
      ? "Verify place/time, drafting, distribution, participants, attachments, and excisions"
      : "",
    record.pdfReview?.participantLine ? `Check PDF participant/subject marker: ${record.pdfReview.participantLine}` : ""
  ].filter(Boolean);
}

function visibleRecordIssueSummary(record) {
  const relatedSourceCandidates = linkedSourceCandidatesForRecord(record);
  const sourceNoteFlags = sourceNoteVerificationFlags(record.frusSourceNote || record.sourceNote || "");
  const issues = [];
  const verificationPrompts = visibleRecordVerificationPrompts(record);
  let score = 0;

  if (!relatedSourceCandidates.length) {
    issues.push(isAnchorOrHigh(record) ? "Anchor/High record has no linked source candidates" : "No linked source candidates");
    score += isAnchorOrHigh(record) ? 30 : 12;
  }
  if (!hasDailyDiaryCandidate(record)) {
    issues.push(isAnchorOrHigh(record) ? "Anchor/High record lacks Daily Diary/Backup corroboration" : "No Daily Diary/Backup candidate linked");
    score += isAnchorOrHigh(record) ? 12 : 4;
  }
  if (!record.publicChronologyLinks?.length) {
    issues.push(isAnchorOrHigh(record) ? "Anchor/High record lacks public chronology crosswalk" : "No public chronology crosswalk");
    score += isAnchorOrHigh(record) ? 12 : 4;
  }
  if (!recordDecision(record)) {
    issues.push("Local Include/Maybe/Exclude decision pending");
    score += isAnchorOrHigh(record) ? 10 : 4;
  }
  if (!reviewedRecords.has(record.id)) {
    issues.push("Local record review pending");
    score += isAnchorOrHigh(record) ? 8 : 3;
  }
  if (!record.pdfUrl) {
    issues.push("No direct PDF link");
    score += 25;
  }
  if (!record.pageCount) {
    issues.push("PDF page count not captured");
    score += 10;
  }
  if (record.pdfReview?.status === "enrichment-error") {
    issues.push(`PDF enrichment error: ${record.pdfReview.error || "review required"}`);
    score += 20;
  }
  if (record.sourceConfidence?.label === "Review candidate") {
    issues.push(`Source confidence requires review: ${record.sourceConfidence.basis || record.sourceConfidence.label}`);
    score += 6;
  }
  for (const flag of sourceNoteFlags) {
    if (flag === "Confirm absence of classification marking against scan") continue;
    issues.push(`Source note: ${flag}`);
    score += flag === "Source note pending" ? 20 : 8;
  }

  const severity = score >= 45 ? "Critical" : score >= 25 ? "High" : score >= 10 ? "Medium" : score > 0 ? "Low" : "None";
  return { record, issues, verificationPrompts, score, severity };
}

function compareRecordIssueSummaries(a, b) {
  const severityRank = { Critical: 0, High: 1, Medium: 2, Low: 3, None: 4 };
  return (
    (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9) ||
    b.score - a.score ||
    compareRecordsForWorklist(a.record, b.record)
  );
}

function visibleRecordIssueLine(summary, index) {
  const record = summary.record;
  const relatedSourceCandidates = linkedSourceCandidatesForRecord(record);
  const publicChronologyLinks = record.publicChronologyLinks || [];
  const support = [
    relatedSourceCandidates.length ? `${relatedSourceCandidates.length.toLocaleString()} linked source candidates` : "No linked source candidates",
    hasDailyDiaryCandidate(record) ? "Daily Diary/Backup linked" : "No Daily Diary/Backup candidate linked",
    publicChronologyLinks.length ? `${publicChronologyLinks.length.toLocaleString()} public chronology links` : "No public chronology crosswalk"
  ].join("; ");
  const shownCandidates = relatedSourceCandidates.slice(0, 4);

  return compactList([
    `${index + 1}. ${formatDate(record.date)} - ${record.title}`,
    [
      `Severity: ${summary.severity}`,
      `Score: ${summary.score}`,
      record.selectionValue || "Unassigned value",
      RECORD_DECISION_LABELS[recordDecision(record)] || "Undecided",
      reviewedRecords.has(record.id) ? "Reviewed locally" : "Open review",
      record.chapter?.name,
      record.documentType,
      record.naid ? `NAID ${record.naid}` : ""
    ]
      .filter(Boolean)
      .join(" | "),
    `Source support: ${support}`,
    summary.issues.length ? "Open issues:" : "Open issues: none from current filters/local state.",
    summary.issues.map((issue) => `- ${issue}`).join("\n"),
    summary.verificationPrompts.length ? "Verification prompts:" : "",
    summary.verificationPrompts.map((prompt) => `- ${prompt}`).join("\n"),
    record.compilerNote ? `Compiler note: ${record.compilerNote}` : "",
    record.frusSourceNote || record.sourceNote ? `Source note: ${record.frusSourceNote || record.sourceNote}` : "",
    shownCandidates.length ? "Linked source candidates:" : "",
    ...shownCandidates.map(crosswalkCandidateLine),
    relatedSourceCandidates.length > shownCandidates.length
      ? `${relatedSourceCandidates.length - shownCandidates.length} more linked source candidates on the record card.`
      : "",
    publicChronologyLinks.length ? "Public chronology:" : "",
    ...publicChronologyLinks.slice(0, 3).map(publicChronologyLine),
    publicChronologyLinks.length > 3 ? `${publicChronologyLinks.length - 3} more public chronology links on the record card.` : "",
    record.pdfUrl ? `PDF: ${record.pdfUrl}` : "",
    record.catalogUrl ? `Catalog: ${record.catalogUrl}` : ""
  ]);
}

function buildVisibleRecordIssueRegister() {
  const summaries = visibleRecords.map(visibleRecordIssueSummary).filter((summary) => summary.issues.length || summary.verificationPrompts.length);
  const rankedSummaries = summaries.sort(compareRecordIssueSummaries);
  const severityCounts = rankedSummaries.reduce((counts, summary) => {
    counts[summary.severity] = (counts[summary.severity] || 0) + 1;
    return counts;
  }, {});

  return packetLines([
    "FRUS MEPP Visible Chronology Issue Register",
    `Generated: ${new Date().toISOString()}`,
    `Live site: https://therealjameswilson.github.io/Bush41-MEPP/`,
    `Visible presidential records: ${visibleRecords.length.toLocaleString()}`,
    `Records with open issues or verification prompts: ${rankedSummaries.length.toLocaleString()}`,
    `Severity counts: ${["Critical", "High", "Medium", "Low"].map((level) => `${level} ${(severityCounts[level] || 0).toLocaleString()}`).join(" / ")}`,
    "",
    "Compiler use:",
    "- Use after filtering the chronology to create a source-support and editorial verification queue for the exact visible subset.",
    "- Start with Critical and High records before resolving lower-risk verification prompts.",
    "- Treat local review and decision lines as browser-local state, not shared repository state.",
    "",
    rankedSummaries.length ? rankedSummaries.map(visibleRecordIssueLine).join("\n\n---\n\n") : "No visible issue prompts."
  ]);
}

function annotationTopicHooks(record) {
  const terms = [
    ...(record.matchedQueries || []),
    ...Object.values(record.topicTerms || {}).flat(),
    record.eventLabel,
    ...(record.countries || [])
  ];
  return [...new Set(terms.filter(Boolean))].slice(0, 14);
}

function annotationPosture(record) {
  const posture = [
    record.selectionValue ? `${record.selectionValue} document` : "Unassigned selection value",
    recordDecision(record) ? `locally marked ${RECORD_DECISION_LABELS[recordDecision(record)]}` : "local selection undecided",
    linkedSourceCandidatesForRecord(record).length ? "source-candidate support available" : "source support gap",
    hasDailyDiaryCandidate(record) ? "schedule/call corroboration available" : "schedule/call corroboration open",
    record.publicChronologyLinks?.length ? "public-private chronology available" : "public chronology open"
  ];
  return posture.join("; ");
}

function annotationTaskLines(record, issueSummary) {
  const relatedSourceCandidates = linkedSourceCandidatesForRecord(record);
  const publicChronologyLinks = record.publicChronologyLinks || [];
  const tasks = [
    "Verify document date, time/place, participants, classification, distribution, drafting, attachments, and excisions against the PDF scan.",
    record.people?.length ? `Check first-reference treatment for ${record.people.slice(0, 6).join("; ")}.` : "",
    publicChronologyLinks.length
      ? "Compare the private record with same-day or adjacent Public Papers material before drafting annotation text."
      : "Search for a public statement, press guidance, or chronology entry around this date if annotation context is needed.",
    relatedSourceCandidates.length
      ? "Review linked source candidates for corroborating schedule, policy-process, or briefing-file evidence."
      : "Use the source-candidate lanes to locate corroborating State, NSC, Baker, Daily Diary/Backup, or briefing-file material.",
    annotationTopicHooks(record).length ? `Consider topical cross-references: ${annotationTopicHooks(record).slice(0, 8).join("; ")}.` : "",
    issueSummary.issues.length ? `Resolve open issue-register prompts before treating the annotation as final: ${issueSummary.issues.slice(0, 3).join("; ")}.` : ""
  ];
  return tasks.filter(Boolean);
}

function annotationCandidateEvidenceLine(candidate, index) {
  return compactList([
    `${index + 1}. ${[candidate.title, candidateLaneGroup(candidate), candidate.priority, candidate.sourceSeries].filter(Boolean).join(" | ")}`,
    candidate.reason ? `Use: ${candidate.reason}` : "",
    candidate.evidenceSnippets?.length ? `Evidence: ${candidate.evidenceSnippets.slice(0, 2).join(" / ")}` : "",
    candidate.catalogUrl ? `Catalog: ${candidate.catalogUrl}` : "",
    candidate.digitalObjectUrl ? `Digital object: ${candidate.digitalObjectUrl}` : ""
  ]);
}

function annotationPlannerEntry(record, index) {
  const relatedSourceCandidates = linkedSourceCandidatesForRecord(record).slice(0, 5);
  const publicChronologyLinks = record.publicChronologyLinks || [];
  const topicHooks = annotationTopicHooks(record);
  const issueSummary = visibleRecordIssueSummary(record);
  const tasks = annotationTaskLines(record, issueSummary);

  return compactList([
    `${String(index + 1).padStart(3, "0")}. ${formatDate(record.date)} - ${record.title}`,
    [
      record.chapter?.name,
      record.documentType,
      record.selectionValue || "Unassigned value",
      RECORD_DECISION_LABELS[recordDecision(record)] || "Undecided",
      issueSummary.severity !== "None" ? `Issue severity: ${issueSummary.severity}` : "",
      record.naid ? `NAID ${record.naid}` : ""
    ]
      .filter(Boolean)
      .join(" | "),
    `Annotation posture: ${annotationPosture(record)}`,
    record.people?.length ? `People/entities to verify: ${record.people.join("; ")}` : "",
    topicHooks.length ? `Topic hooks: ${topicHooks.join("; ")}` : "",
    record.compilerNote ? `Compiler note: ${record.compilerNote}` : "",
    publicChronologyLinks.length ? "Public chronology to consider:" : "Public chronology to consider: none linked yet.",
    ...publicChronologyLinks.slice(0, 4).map(publicChronologyLine),
    publicChronologyLinks.length > 4 ? `${publicChronologyLinks.length - 4} more public chronology links on the record card.` : "",
    relatedSourceCandidates.length ? "Source-candidate evidence to check:" : "Source-candidate evidence to check: none linked yet.",
    ...relatedSourceCandidates.map(annotationCandidateEvidenceLine),
    linkedSourceCandidatesForRecord(record).length > relatedSourceCandidates.length
      ? `${linkedSourceCandidatesForRecord(record).length - relatedSourceCandidates.length} more linked source candidates on the record card.`
      : "",
    "Draft annotation tasks:",
    tasks.map((task) => `- ${task}`).join("\n"),
    issueSummary.verificationPrompts.length ? "Verification prompts:" : "",
    issueSummary.verificationPrompts.map((prompt) => `- ${prompt}`).join("\n"),
    record.pdfUrl ? `PDF: ${record.pdfUrl}` : "",
    record.catalogUrl ? `Catalog: ${record.catalogUrl}` : ""
  ]);
}

function buildVisibleAnnotationPlanner() {
  const anchorHighCount = visibleRecords.filter(isAnchorOrHigh).length;
  const publicLinkedCount = visibleRecords.filter((record) => record.publicChronologyLinks?.length).length;
  const sourceLinkedCount = visibleRecords.filter((record) => linkedSourceCandidatesForRecord(record).length).length;
  const peopleCount = visibleRecords.filter((record) => record.people?.length).length;

  return packetLines([
    "FRUS MEPP Visible Annotation Planner",
    `Generated: ${new Date().toISOString()}`,
    `Live site: https://therealjameswilson.github.io/Bush41-MEPP/`,
    `Visible presidential records: ${visibleRecords.length.toLocaleString()}`,
    `Anchor/High visible records: ${anchorHighCount.toLocaleString()}`,
    `Records with linked source candidates: ${sourceLinkedCount.toLocaleString()}`,
    `Records with linked public chronology: ${publicLinkedCount.toLocaleString()}`,
    `Records with named people/entities: ${peopleCount.toLocaleString()}`,
    "",
    "Compiler use:",
    "- Use this as an annotation planning aid, not final annotation prose.",
    "- Start from the visible filter state, then verify every hook against the PDF scan and repository context.",
    "- Compare public chronology and linked source candidates before drafting annotation text or cross-references.",
    "",
    visibleRecords.length ? visibleRecords.map(annotationPlannerEntry).join("\n\n---\n\n") : "No visible presidential records."
  ]);
}

function buildSourceCandidateSourceNoteRegister() {
  const candidateEntries = visibleSourceCandidates.map((candidate) => ({
    title: candidate.title,
    meta: [candidate.priority, candidate.chapter, candidateLaneGroup(candidate), candidate.lane, candidate.sourceSeries].filter(Boolean).join(" | "),
    naid: candidate.naid || candidate.externalId,
    catalogUrl: candidate.catalogUrl,
    digitalObjectUrl: candidate.digitalObjectUrl,
    note: candidate.sourceNote || ""
  }));

  return packetLines([
    "FRUS MEPP Visible Source Candidate Source Note Register",
    `Generated: ${new Date().toISOString()}`,
    `Source candidates: ${candidateEntries.length.toLocaleString()}`,
    "",
    candidateEntries.length ? candidateEntries.map(sourceNoteRegisterEntry).join("\n\n") : "No visible source candidates."
  ]);
}

function pullListGroupKey(candidate) {
  return [candidate.repository || "Repository not specified", candidateLaneGroup(candidate), candidate.sourceSeries || "Series not specified"].join(" / ");
}

function sourceCandidatePullListLine(candidate, index) {
  const relatedRecords = candidate.relatedRecords || [];
  const requestDetails = [
    candidate.collection,
    candidate.sourceSeries,
    candidate.localIdentifier,
    candidate.date,
    candidate.naid ? `NAID ${candidate.naid}` : candidate.externalId
  ].filter(Boolean);

  return compactList([
    `${index + 1}. ${candidate.title}`,
    [candidate.priority, candidate.chapter, candidate.lane, candidate.level].filter(Boolean).join(" | "),
    requestDetails.length ? `Request details: ${requestDetails.join("; ")}` : "Request details: verify container/folder details in catalog.",
    `Access: ${candidateHasDigitalObject(candidate) ? "Digital object linked" : "No digital object linked"}${
      candidate.reviewStatus ? `; ${candidate.reviewStatus}` : ""
    }`,
    `Local triage: ${shortlistedSourceCandidates.has(candidate.id) ? "shortlisted" : "not shortlisted"}; ${
      reviewedSourceCandidates.has(candidate.id) ? "reviewed" : "open review"
    }`,
    candidate.reason ? `Why pull: ${candidate.reason}` : "",
    candidate.scopeAndContentNote ? `Scope note: ${candidate.scopeAndContentNote}` : "",
    relatedRecords.length ? "Related FRUS meetings/calls:" : "Related FRUS meetings/calls: none linked yet.",
    ...relatedRecords
      .slice(0, 6)
      .map((record, relatedIndex) => `${relatedIndex + 1}. ${[record.date, record.title, record.chapter].filter(Boolean).join(" - ")}`),
    relatedRecords.length > 6 ? `${relatedRecords.length - 6} more related records in the candidate card/data export.` : "",
    candidate.catalogUrl ? `Catalog: ${candidate.catalogUrl}` : "",
    candidate.digitalObjectUrl ? `Digital object: ${candidate.digitalObjectUrl}` : ""
  ]);
}

function buildSourceCandidatePullList() {
  const groups = new Map();
  for (const candidate of visibleSourceCandidates) {
    const key = pullListGroupKey(candidate);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(candidate);
  }

  const groupSections = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, candidates]) =>
      packetLines([
        key,
        `Count: ${candidates.length.toLocaleString()}`,
        candidates.sort(compareSourceCandidatesForWorklist).map(sourceCandidatePullListLine).join("\n\n")
      ])
    );

  return packetLines([
    "FRUS MEPP Visible Source Candidate Pull List",
    `Generated: ${new Date().toISOString()}`,
    `Live site: https://therealjameswilson.github.io/Bush41-MEPP/`,
    `Visible candidates: ${visibleSourceCandidates.length.toLocaleString()}`,
    "",
    "Compiler use:",
    "- Use this as an archive request/checklist for the currently filtered source-candidate queue.",
    "- Confirm container, folder, document title, date, classification, and access conditions against the catalog and scan.",
    "- Compare candidate material against linked FRUS meetings/calls before selecting for annotation or source-note support.",
    "",
    groupSections.length ? groupSections.join("\n\n---\n\n") : "No visible source candidates."
  ]);
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
    `Local decision: ${RECORD_DECISION_LABELS[recordDecision(record)] || "Undecided"}`,
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

function visibleRecordPacketsText() {
  return packetBundle("FRUS MEPP Visible Record Packets", visibleRecords, buildRecordCompilerPacket);
}

function visibleSourceCandidatePacketsText() {
  return packetBundle("FRUS MEPP Visible Source Candidate Packets", visibleSourceCandidates, buildSourceCandidateCompilerPacket);
}

async function copyText(value, trigger) {
  const setCopyStatus = (label) => {
    if (!trigger) return;
    const original = trigger.textContent;
    trigger.textContent = label;
    setTimeout(() => {
      trigger.textContent = original;
    }, 1200);
  };

  try {
    await navigator.clipboard.writeText(value);
    setCopyStatus("Copied");
  } catch {
    let copied = false;
    const textArea = document.createElement("textarea");
    textArea.value = value;
    document.body.append(textArea);
    textArea.select();
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    textArea.remove();
    setCopyStatus(copied ? "Copied" : "Copy failed");
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
  selectors.copyWorkspaceState?.addEventListener("click", () => copyText(workspaceStateJson(), selectors.copyWorkspaceState));
  selectors.downloadWorkspaceState?.addEventListener("click", () => {
    downloadTextFile("bush41-mepp-workspace-state.json", `${workspaceStateJson()}\n`, "application/json;charset=utf-8");
  });
  selectors.importWorkspaceState?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = applyWorkspaceState(JSON.parse(await file.text()));
      if (selectors.notesStatus) {
        selectors.notesStatus.textContent = `Imported ${result.reviewedRecords.toLocaleString()} reviewed records, ${result.recordDecisions.toLocaleString()} record decisions, ${result.shortlistedSourceCandidates.toLocaleString()} shortlisted candidates, and ${result.reviewedSourceCandidates.toLocaleString()} reviewed candidates.`;
      }
    } catch {
      if (selectors.notesStatus) selectors.notesStatus.textContent = "Unable to import workspace state JSON.";
    } finally {
      event.target.value = "";
    }
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
    selectors.decisionFilter,
    selectors.sortRecords
  ].forEach((control) => control?.addEventListener("input", renderRecords));

  selectors.resetFilters?.addEventListener("click", resetRecordFilters);
  selectors.copyRecordViewLink?.addEventListener("click", () => copyText(buildRecordViewUrl(), selectors.copyRecordViewLink));
  selectors.exportCsv?.addEventListener("click", exportVisibleRecords);
  selectors.copyRecordDocumentList?.addEventListener("click", () => copyText(buildVisibleDraftDocumentList(), selectors.copyRecordDocumentList));
  selectors.downloadRecordDocumentList?.addEventListener("click", () => {
    downloadTextFile("bush41-mepp-visible-draft-document-list.txt", `${buildVisibleDraftDocumentList()}\n`);
  });
  selectors.copyRecordAnnotationPlanner?.addEventListener("click", () =>
    copyText(buildVisibleAnnotationPlanner(), selectors.copyRecordAnnotationPlanner)
  );
  selectors.downloadRecordAnnotationPlanner?.addEventListener("click", () => {
    downloadTextFile("bush41-mepp-visible-annotation-planner.txt", `${buildVisibleAnnotationPlanner()}\n`);
  });
  selectors.copyRecordSourceNotes?.addEventListener("click", () => copyText(buildRecordSourceNoteRegister(), selectors.copyRecordSourceNotes));
  selectors.downloadRecordSourceNotes?.addEventListener("click", () => {
    downloadTextFile("bush41-mepp-visible-record-source-notes.txt", `${buildRecordSourceNoteRegister()}\n`);
  });
  selectors.copyRecordSourceMap?.addEventListener("click", () => copyText(buildVisibleSourceMap(), selectors.copyRecordSourceMap));
  selectors.downloadRecordSourceMap?.addEventListener("click", () => {
    downloadTextFile("bush41-mepp-visible-source-map.txt", `${buildVisibleSourceMap()}\n`);
  });
  selectors.copyMeetingCrosswalk?.addEventListener("click", () => copyText(buildVisibleMeetingCrosswalk(), selectors.copyMeetingCrosswalk));
  selectors.downloadMeetingCrosswalk?.addEventListener("click", () => {
    downloadTextFile("bush41-mepp-visible-meeting-call-crosswalk.txt", `${buildVisibleMeetingCrosswalk()}\n`);
  });
  selectors.copyRecordPeopleIndex?.addEventListener("click", () => copyText(buildVisibleRecordPeopleIndex(), selectors.copyRecordPeopleIndex));
  selectors.downloadRecordPeopleIndex?.addEventListener("click", () => {
    downloadTextFile("bush41-mepp-visible-record-people-index.txt", `${buildVisibleRecordPeopleIndex()}\n`);
  });
  selectors.copyRecordIssueRegister?.addEventListener("click", () =>
    copyText(buildVisibleRecordIssueRegister(), selectors.copyRecordIssueRegister)
  );
  selectors.downloadRecordIssueRegister?.addEventListener("click", () => {
    downloadTextFile("bush41-mepp-visible-record-issue-register.txt", `${buildVisibleRecordIssueRegister()}\n`);
  });
  selectors.copyCoverageSummary?.addEventListener("click", () => copyText(buildCoverageSummary(), selectors.copyCoverageSummary));
  selectors.downloadCoverageSummary?.addEventListener("click", () => {
    downloadTextFile("bush41-mepp-track-coverage-summary.txt", `${buildCoverageSummary()}\n`);
  });
  selectors.copyRecordPackets?.addEventListener("click", () => copyText(visibleRecordPacketsText(), selectors.copyRecordPackets));
  selectors.downloadRecordPackets?.addEventListener("click", () => {
    downloadTextFile("bush41-mepp-visible-record-packets.txt", `${visibleRecordPacketsText()}\n`);
  });

  [selectors.statementSearch, selectors.statementChapter, selectors.statementYear, selectors.statementRelevance, selectors.sortStatements].forEach(
    (control) => control?.addEventListener("input", renderStatements)
  );
  selectors.resetStatements?.addEventListener("click", resetStatementFilters);
  selectors.copyStatementViewLink?.addEventListener("click", () => copyText(buildStatementViewUrl(), selectors.copyStatementViewLink));
  selectors.exportStatements?.addEventListener("click", exportVisibleStatements);

  [selectors.personSearch, selectors.personChapter].forEach((control) => control?.addEventListener("input", renderPersons));
  selectors.exportPersons?.addEventListener("click", exportVisiblePersons);

  [selectors.gapSearch, selectors.gapPriority, selectors.gapCategory].forEach((control) => control?.addEventListener("input", renderGaps));
  selectors.copyGapViewLink?.addEventListener("click", () => copyText(buildGapViewUrl(), selectors.copyGapViewLink));
  selectors.exportGaps?.addEventListener("click", exportVisibleGaps);

  selectors.copyActionWorklist?.addEventListener("click", () => copyText(buildCompilerActionWorklist(), selectors.copyActionWorklist));
  selectors.downloadActionWorklist?.addEventListener("click", () => {
    downloadTextFile("bush41-mepp-compiler-action-worklist.txt", `${buildCompilerActionWorklist()}\n`);
  });
  selectors.copySelectionSlate?.addEventListener("click", () => copyText(buildSelectionSlate(), selectors.copySelectionSlate));
  selectors.downloadSelectionSlate?.addEventListener("click", () => {
    downloadTextFile("bush41-mepp-selection-slate.txt", `${buildSelectionSlate()}\n`);
  });

  [
    selectors.candidateSearch,
    selectors.candidateChapter,
    selectors.candidatePriority,
    selectors.candidateLevel,
    selectors.candidateLaneGroup,
    selectors.candidateLinkage,
    selectors.candidateAccess,
    selectors.candidateTriage
  ].forEach((control) => control?.addEventListener("input", renderSourceCandidates));
  selectors.resetSourceCandidates?.addEventListener("click", resetSourceCandidateFilters);
  selectors.exportSourceCandidates?.addEventListener("click", exportVisibleSourceCandidates);
  selectors.copySourceCandidateViewLink?.addEventListener("click", () =>
    copyText(buildSourceCandidateViewUrl(), selectors.copySourceCandidateViewLink)
  );
  selectors.copySourceCandidatePullList?.addEventListener("click", () =>
    copyText(buildSourceCandidatePullList(), selectors.copySourceCandidatePullList)
  );
  selectors.downloadSourceCandidatePullList?.addEventListener("click", () => {
    downloadTextFile("bush41-mepp-visible-source-candidate-pull-list.txt", `${buildSourceCandidatePullList()}\n`);
  });
  selectors.copySourceCandidateNotes?.addEventListener("click", () =>
    copyText(buildSourceCandidateSourceNoteRegister(), selectors.copySourceCandidateNotes)
  );
  selectors.downloadSourceCandidateNotes?.addEventListener("click", () => {
    downloadTextFile("bush41-mepp-visible-source-candidate-notes.txt", `${buildSourceCandidateSourceNoteRegister()}\n`);
  });
  selectors.copySourceCandidatePackets?.addEventListener("click", () =>
    copyText(visibleSourceCandidatePacketsText(), selectors.copySourceCandidatePackets)
  );
  selectors.downloadSourceCandidatePackets?.addEventListener("click", () => {
    downloadTextFile("bush41-mepp-visible-source-candidate-packets.txt", `${visibleSourceCandidatePacketsText()}\n`);
  });

  document.addEventListener("click", (event) => {
    const chapterCard = event.target.closest("[data-chapter-card]");
    if (chapterCard) {
      selectors.chapterFilter.value = chapterCard.dataset.chapterCard;
      selectors.sortRecords.value = "chapter-date";
      renderRecords();
      return;
    }

    const actionQueue = event.target.closest("[data-action-queue]");
    if (actionQueue) {
      applyActionQueue(actionQueue.dataset.actionQueue);
      return;
    }

    const coverageTrack = event.target.closest("[data-coverage-track]");
    if (coverageTrack) {
      resetRecordFilters();
      selectors.chapterFilter.value = coverageTrack.dataset.coverageTrack;
      selectors.sortRecords.value = "chapter-date";
      renderRecords();
      scrollToSection("#records");
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

    const recordDecisionButton = event.target.closest("[data-record-decision-id]");
    if (recordDecisionButton) {
      const id = recordDecisionButton.dataset.recordDecisionId;
      const decision = recordDecisionButton.dataset.recordDecision;
      if (recordDecisions[id] === decision) delete recordDecisions[id];
      else recordDecisions[id] = decision;
      recordDecisions = cleanRecordDecisions(recordDecisions);
      saveRecordDecisions();
      renderRecords();
      renderReviewQueue();
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

    const shortlistCandidateButton = event.target.closest("[data-shortlist-candidate]");
    if (shortlistCandidateButton) {
      const id = shortlistCandidateButton.dataset.shortlistCandidate;
      if (shortlistedSourceCandidates.has(id)) shortlistedSourceCandidates.delete(id);
      else shortlistedSourceCandidates.add(id);
      saveLocalSet(SOURCE_CANDIDATE_SHORTLIST_STORAGE_KEY, shortlistedSourceCandidates);
      renderSourceCandidates();
      renderReviewQueue();
      return;
    }

    const reviewCandidateButton = event.target.closest("[data-review-candidate]");
    if (reviewCandidateButton) {
      const id = reviewCandidateButton.dataset.reviewCandidate;
      if (reviewedSourceCandidates.has(id)) reviewedSourceCandidates.delete(id);
      else reviewedSourceCandidates.add(id);
      saveLocalSet(SOURCE_CANDIDATE_REVIEW_STORAGE_KEY, reviewedSourceCandidates);
      renderSourceCandidates();
      renderReviewQueue();
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
  applyRecordViewFromUrl();
  applySourceCandidateViewFromUrl();
  applyStatementViewFromUrl();
  applyGapViewFromUrl();
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
  scheduleCurrentHashScroll();
}

init();
