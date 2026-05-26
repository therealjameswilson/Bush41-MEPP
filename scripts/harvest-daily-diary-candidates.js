const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const cacheDir = path.join(repoRoot, ".cache", "daily-diary-candidates");
const recordsPath = path.join(repoRoot, "data", "records.json");
const dataPath = path.join(repoRoot, "data", "daily-diary-candidates.json");
const dataScriptPath = path.join(repoRoot, "data", "daily-diary-candidates.js");
const sourceCandidatesPath = path.join(repoRoot, "data", "source-candidates.json");
const sourceCandidatesScriptPath = path.join(repoRoot, "data", "source-candidates.js");
const reportPath = path.join(repoRoot, "reports", "daily-diary-harvest.json");

const SERIES_NAID = "186322";
const SERIES_TITLE = "Presidential Daily Diary and Presidential Daily Backup Materials";
const COLLECTION_NAID = "1081";
const COLLECTION_TITLE = "White House Office of Appointments and Scheduling Files";
const REPOSITORY = "George H.W. Bush Library / National Archives Catalog";
const PAGE_LIMIT = 1000;

const QUERIES = [
  "Madrid Peace Conference",
  "Middle East Peace",
  "peace process Israel",
  "President Shamir",
  "Prime Minister Shamir",
  "Yitzhak Rabin",
  "Shimon Peres",
  "Moshe Arens",
  "King Hussein",
  "Palestinian Delegation",
  "Hanan Ashrawi",
  "Faisal Husseini",
  "Hafez Assad",
  "President Assad",
  "Hosni Mubarak",
  "Secretary Baker Israel",
  "loan guarantees Israel",
  "telephone memorandum Shamir",
  "telephone memorandum Rabin",
  "telephone memorandum Assad",
  "telephone memorandum Mubarak"
];

const TOPIC_PATTERNS = [
  ["Madrid", /\bMadrid\b/i],
  ["Middle East peace", /\bMiddle East peace\b|\bMideast peace\b|\bpeace process\b|\bpeace conference\b/i],
  ["Israel leadership", /\bIsrael(?:i)?\b|\bShamir\b|\bRabin\b|\bPeres\b|\bArens\b|\bLevy\b|\bShoval\b|\bHerzog\b/i],
  ["Palestinian channel", /\bPalestinian(?:s)?\b|\bPLO\b|\bHusseini\b|\bAshrawi\b|\bArafat\b|\bWest Bank\b|\bGaza\b/i],
  ["Jordan/King Hussein", /\bKing Hussein\b|\bJordanian[-\s]Palestinian\b|\bJordan\b|\bAmman\b/i],
  ["Syria/Lebanon", /\bSyria(?:n)?\b|\bAssad\b|\bDamascus\b|\bLebanon\b|\bLebanese\b/i],
  ["Egypt/Arab regional", /\bMubarak\b|\bEgypt(?:ian)?\b|\bCairo\b|\bSaudi\b|\bFahd\b/i],
  ["Loan guarantees/settlements", /\bloan guarantees?\b|\bsettlement activity\b|\bsettlements policy\b|\bsettlement freeze\b|\boccupied territories\b/i],
  ["Meeting reference", /\bmeeting with\b|\bmet with\b|\bvisit with\b|\bbilateral\b|\bsession\b/i],
  ["Call reference", /\btelephone memorandum\b|\btelephone conversation\b|\btelephone call\b|\btelcon\b|\bphone call\b|\bconference call\b|\bcalled\b|\btlkd-ok\b|\bcall from\b|\bcall to\b/i]
];

const HIGH_PRIORITY_TERMS = new Set([
  "Madrid",
  "Middle East peace",
  "Israel leadership",
  "Palestinian channel",
  "Jordan/King Hussein",
  "Syria/Lebanon",
  "Egypt/Arab regional",
  "Loan guarantees/settlements"
]);

const KEYWORD_ONLY_TERMS = new Set([
  "Madrid",
  "Middle East peace",
  "Israel leadership",
  "Palestinian channel",
  "Jordan/King Hussein",
  "Syria/Lebanon",
  "Egypt/Arab regional",
  "Loan guarantees/settlements"
]);

const ACTION_REFERENCE_PATTERN = /\b(meeting|met with|telephone memorandum|telephone conversation|telephone call|telcon|conference call|phone call|called|talked|session|visit)\b/i;
const DIRECT_MEPP_PATTERN =
  /\b(Madrid|Middle East peace|Mideast peace|peace process|Arab-Israeli|Shamir|Rabin|Peres|Arens|Levy|Shoval|Herzog|Palestinian(?:s)?|PLO|Husseini|Ashrawi|Arafat|West Bank|Gaza|King Hussein|Jordanian[-\s]Palestinian|Jordanian peace|Assad|Shara|Syria(?:n)?|Lebanon|Lebanese|Mubarak|Boutros[-\s]Ghali|Amre Mousa|Fahd|Prince Saud|Prince Bandar|loan guarantees?|settlements?|occupied territories)\b/i;

const MONTHS = new Map(
  [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december"
  ].map((month, index) => [month, String(index + 1).padStart(2, "0")])
);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function fetchJson(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`Fetch failed ${response.status}: ${url}`);
      return response.json();
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 800));
    }
  }
  throw lastError;
}

async function fetchParentPage(page) {
  const url = new URL(`https://catalog.archives.gov/proxy/records/parentNaId/${SERIES_NAID}`);
  url.searchParams.set("limit", String(PAGE_LIMIT));
  url.searchParams.set("page", String(page));
  const json = await fetchJson(url);
  fs.writeFileSync(path.join(cacheDir, `parent_page_${page}.json`), `${JSON.stringify(json, null, 2)}\n`);
  const hits = json.body?.hits?.hits || [];
  const total = json.body?.hits?.total?.value ?? hits.length;
  return { hits, total, url: String(url) };
}

async function fetchSeriesRecords() {
  const records = [];
  const pageLog = [];
  for (let page = 1; ; page += 1) {
    const result = await fetchParentPage(page);
    pageLog.push({ page, total: result.total, returned: result.hits.length, url: result.url });
    records.push(...result.hits.map((hit) => hit._source?.record).filter(Boolean));
    if (!result.hits.length || records.length >= result.total) break;
  }
  return { records, pageLog };
}

function readJson(filePath, fallback = []) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function selectedRecordId(record) {
  return String(record.id || record.naid || record.catalogUrl || record.title || "");
}

function recordsByDate(records) {
  const map = new Map();
  for (const record of records) {
    if (!record.date) continue;
    const items = map.get(record.date) || [];
    items.push(record);
    map.set(record.date, items);
  }
  return map;
}

function recordText(record) {
  return clean(
    [
      record.title,
      record.scopeAndContentNote,
      record.localIdentifier,
      ...(record.generalNotes || []),
      ...(record.subjects || []).map((subject) => subject.heading),
      ...(record.digitalObjects || []).map(
        (object) => `${object.objectFilename || ""} ${object.completeExtractedText || ""} ${object.extractedText || ""}`
      )
    ].join(" ")
  );
}

function firstDigitalObject(record) {
  const objects = (record.digitalObjects || []).filter((object) => object.objectUrl);
  return (
    objects.find((object) => /pdf/i.test(`${object.objectType || ""} ${object.objectFilename || ""} ${object.objectUrl || ""}`)) ||
    objects.find((object) => /manifest/i.test(object.objectUrl || "")) ||
    objects[0] ||
    null
  );
}

function mediaContainer(record) {
  return clean(
    (record.physicalOccurrences || [])
      .flatMap((occurrence) => occurrence.mediaOccurrences || [])
      .map((media) => media.containerId)
      .filter(Boolean)
      .join(", ")
  );
}

function dateFromTitle(value) {
  const match = String(value || "").match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (match) {
    const year = match[3].length === 2 ? `19${match[3]}` : match[3];
    return `${year}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
  }
  const namedMonth = String(value || "").match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})\b/i
  );
  if (!namedMonth) return "";
  return `${namedMonth[3]}-${MONTHS.get(namedMonth[1].toLowerCase())}-${namedMonth[2].padStart(2, "0")}`;
}

function dateFromDigitalObjects(record) {
  for (const object of record.digitalObjects || []) {
    const value = `${object.objectFilename || ""} ${object.objectUrl || ""}`;
    const match = value.match(/(?:^|[-_])(\d{2})_(\d{2})_(\d{2})(?:[-_])/);
    if (!match) continue;
    return `19${match[3]}-${match[1]}-${match[2]}`;
  }
  return "";
}

function dateSpan(record) {
  const start = record.coverageStartDate?.logicalDate || record.inclusiveStartDate?.logicalDate || "";
  const end = record.coverageEndDate?.logicalDate || record.inclusiveEndDate?.logicalDate || "";
  if (start && end && start !== end) return `${start}/${end}`;
  return start || end || dateFromTitle(record.title) || dateFromDigitalObjects(record);
}

function matchedTerms(text) {
  return TOPIC_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}

function textLines(text) {
  return text
    .split(/(?<=\.)\s+|\n+/)
    .map(clean)
    .filter(Boolean);
}

function hasPertinentMeetingOrCall(text) {
  return textLines(text).some((line) => ACTION_REFERENCE_PATTERN.test(line) && DIRECT_MEPP_PATTERN.test(line));
}

function relatedRecordText(records) {
  return clean(
    records
      .map((record) =>
        [
          record.date,
          record.title,
          record.documentTitle,
          record.chapter?.name || record.chapter,
          ...(record.people || []),
          ...(record.countries || [])
        ].join(" ")
      )
      .join(" ")
  );
}

function relatedRecordReferences(records) {
  return records.map((record) => ({
    id: selectedRecordId(record),
    title: record.title || record.documentTitle || selectedRecordId(record),
    date: record.date || "",
    chapter: record.chapter?.name || record.chapter || "",
    catalogUrl: record.catalogUrl || ""
  }));
}

function hasMeetingOrCall(records) {
  return records.some((record) => /\b(meeting|memorandum of conversation|telephone|telcon|call|conversation|plenary|luncheon|working lunch)\b/i.test(record.title || record.documentTitle || ""));
}

function isRelevant(text, terms, relatedRecords) {
  if (relatedRecords.length && hasMeetingOrCall(relatedRecords)) return true;
  if (!terms.some((term) => KEYWORD_ONLY_TERMS.has(term))) return false;
  return hasPertinentMeetingOrCall(text);
}

function chapterFromRelated(records) {
  const counts = new Map();
  for (const record of records) {
    const chapter = record.chapter?.name || record.chapter || "";
    if (!chapter) continue;
    counts.set(chapter, (counts.get(chapter) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || "";
}

function chapterFor(text, terms, relatedRecords) {
  const relatedChapter = chapterFromRelated(relatedRecords);
  if (relatedChapter) return relatedChapter;
  if (terms.includes("Syria/Lebanon")) return "Syria-Lebanon Track";
  if (terms.includes("Palestinian channel") || terms.includes("Jordan/King Hussein")) return "Palestinian-Jordanian Track";
  if (terms.includes("Loan guarantees/settlements") || terms.includes("Israel leadership")) return "Israel Track";
  if (terms.includes("Egypt/Arab regional")) return "Egypt-Arab Regional Track";
  if (terms.includes("Madrid") || terms.includes("Middle East peace")) return "Madrid-Multilateral Track";
  if (/\bSyria\b|\bAssad\b|\bLebanon\b/i.test(text)) return "Syria-Lebanon Track";
  if (/\bPalestinian\b|\bJordan\b|\bKing Hussein\b/i.test(text)) return "Palestinian-Jordanian Track";
  if (/\bIsrael\b|\bShamir\b|\bRabin\b|\bLevy\b/i.test(text)) return "Israel Track";
  if (/\bEgypt\b|\bMubarak\b|\bSaudi\b|\bKuwait\b|\bGulf\b/i.test(text)) return "Egypt-Arab Regional Track";
  return "Madrid-Multilateral Track";
}

function priorityFor(terms, relatedRecords) {
  if (relatedRecords.length && hasMeetingOrCall(relatedRecords)) return "High";
  if ((terms.includes("Meeting reference") || terms.includes("Call reference")) && terms.some((term) => HIGH_PRIORITY_TERMS.has(term))) {
    return "High";
  }
  return "Medium";
}

function evidenceSnippets(text, terms, requireDirectEvidence = false) {
  const snippets = [];
  const patterns = TOPIC_PATTERNS.filter(([label]) => terms.includes(label)).map(([, pattern]) => pattern);
  const lines = textLines(text);
  if (requireDirectEvidence) {
    for (const line of lines) {
      if (!ACTION_REFERENCE_PATTERN.test(line) || !DIRECT_MEPP_PATTERN.test(line)) continue;
      snippets.push(line.slice(0, 500));
      if (snippets.length >= 6) break;
    }
    if (snippets.length) return snippets;
  }
  for (const line of lines) {
    if (!patterns.some((pattern) => pattern.test(line))) continue;
    if (!/\b(meeting|telephone|call|schedule|diary|backup|visit|session|tlkd-ok|president)\b/i.test(line)) continue;
    snippets.push(line.slice(0, 500));
    if (snippets.length >= 6) break;
  }
  if (snippets.length) return snippets;

  for (const [, pattern] of TOPIC_PATTERNS) {
    const match = pattern.exec(text);
    if (!match) continue;
    const start = Math.max(0, match.index - 160);
    const end = Math.min(text.length, match.index + match[0].length + 360);
    snippets.push(clean(text.slice(start, end)));
    if (snippets.length >= 4) break;
  }
  return snippets;
}

function crosswalkSnippets(relatedRecords) {
  return relatedRecords.slice(0, 8).map((record) => {
    const chapter = record.chapter?.name || record.chapter || "Unassigned track";
    return `FRUS date cross-reference: ${record.date || "undated"} - ${record.title || record.documentTitle || selectedRecordId(record)} (${chapter}).`;
  });
}

function titleForRelatedRecords(relatedRecords) {
  if (!relatedRecords.length) return "";
  if (relatedRecords.length === 1) return relatedRecords[0].title || relatedRecords[0].documentTitle || "";
  const shown = relatedRecords
    .slice(0, 3)
    .map((record) => record.title || record.documentTitle)
    .filter(Boolean)
    .join("; ");
  const remainder = relatedRecords.length > 3 ? `; plus ${relatedRecords.length - 3} more` : "";
  return `${shown}${remainder}`;
}

function toCandidate(record, queries, relatedRecords) {
  const text = clean([recordText(record), relatedRecordText(relatedRecords)].join(" "));
  const terms = matchedTerms(text);
  const object = firstDigitalObject(record);
  const container = mediaContainer(record);
  const date = dateSpan(record);
  const localIdentifier = [record.localIdentifier, container ? `Container ${container}` : ""].filter(Boolean).join(", ");
  const title = record.title || `Catalog record ${record.naId}`;
  const relatedTitle = titleForRelatedRecords(relatedRecords);
  const evidence = evidenceSnippets(text, terms, relatedRecords.length === 0);
  const crosswalkEvidence = crosswalkSnippets(relatedRecords);

  return {
    id: `source-candidate-${record.naId}`,
    naid: String(record.naId),
    title,
    level: record.levelOfDescription || "fileUnit",
    lane: "Presidential Daily Diary/Backup",
    chapter: chapterFor(text, terms, relatedRecords),
    priority: priorityFor(terms, relatedRecords),
    repository: REPOSITORY,
    collection: COLLECTION_TITLE,
    collectionNaid: COLLECTION_NAID,
    sourceSeries: SERIES_TITLE,
    sourceSeriesNaid: SERIES_NAID,
    localIdentifier,
    date,
    catalogUrl: `https://catalog.archives.gov/id/${record.naId}`,
    hasDigitalObject: Boolean(object),
    digitalObjectUrl: object?.objectUrl || "",
    digitalObjectCount: (record.digitalObjects || []).length,
    documentType: "Presidential daily diary/backup folder",
    remediationHarvest: "daily-diary",
    matchedQueries: [...new Set(queries)],
    matchedTerms: terms,
    relatedRecordIds: relatedRecords.map(selectedRecordId),
    relatedRecordTitles: relatedRecords.map((item) => item.title || item.documentTitle || selectedRecordId(item)),
    relatedRecords: relatedRecordReferences(relatedRecords),
    evidenceSnippets: (relatedRecords.length ? [...crosswalkEvidence, ...evidence] : evidence).slice(0, 10),
    scopeAndContentNote: relatedRecords.length
      ? `Daily diary/backup file for the same date as ${relatedRecords.length} selected FRUS meeting/call record${relatedRecords.length === 1 ? "" : "s"}${relatedTitle ? `: ${relatedTitle}` : ""}. OCR/catalog markers: ${terms.join(", ") || "date crosswalk"}.`
      : `Daily diary/backup OCR markers: ${terms.join(", ")}. Use this to cross-reference meetings, calls, schedules, and telephone memoranda against selected FRUS documents.`,
    reason: relatedRecords.length
      ? `Daily diary/backup cross-reference for selected FRUS meeting/call material on ${date}; verify the diary/backup PDF before using it as chronology evidence.`
      : `Daily diary/backup reference to MEPP-relevant meeting or call; verify PDF pages before treating as chronology evidence.`,
    sourceNote: `Source: George H.W. Bush Library, Bush Presidential Records, White House Office of Appointments and Scheduling Files, ${SERIES_TITLE}, ${title}${localIdentifier ? `, ${localIdentifier}` : ""}${date ? `, ${date}` : ""}. Classification marking requires PDF verification.`,
    catalogTrail: `NARA Catalog: series NAID ${SERIES_NAID}; record NAID ${record.naId}; ${`https://catalog.archives.gov/id/${record.naId}`}${object?.objectUrl ? `; digital object ${object.objectUrl}` : ""}.`
  };
}

function priorityRank(priority) {
  return priority === "High" ? 0 : priority === "Medium" ? 1 : priority === "Review" ? 2 : 3;
}

function mergeSourceCandidates(existingCandidates, diaryCandidates) {
  const preservedCandidates = existingCandidates.filter(
    (candidate) => candidate.remediationHarvest !== "daily-diary" && candidate.lane !== "Presidential Daily Diary/Backup"
  );
  const byId = new Map(preservedCandidates.map((candidate) => [candidate.id, candidate]));
  for (const candidate of diaryCandidates) {
    const previous = existingCandidates.find((item) => item.id === candidate.id);
    const preservedReview =
      previous && previous.digitalObjectUrl === candidate.digitalObjectUrl
        ? {
            pageCount: previous.pageCount,
            pageCountBasis: previous.pageCountBasis,
            reviewStatus: previous.reviewStatus,
            pdfReview: previous.pdfReview
          }
        : {};
    byId.set(candidate.id, { ...previous, ...candidate, ...preservedReview });
  }
  return [...byId.values()].sort(
    (a, b) =>
      priorityRank(a.priority) - priorityRank(b.priority) ||
      String(a.lane).localeCompare(String(b.lane)) ||
      String(a.chapter).localeCompare(String(b.chapter)) ||
      String(a.title).localeCompare(String(b.title))
  );
}

function writeJsonAndScript(jsonPath, scriptPath, globalName, value) {
  const json = JSON.stringify(value, null, 2);
  fs.writeFileSync(jsonPath, `${json}\n`);
  fs.writeFileSync(scriptPath, `window.${globalName} = ${json};\n`);
}

async function main() {
  ensureDir(cacheDir);
  ensureDir(path.dirname(dataPath));
  ensureDir(path.dirname(reportPath));

  const byNaid = new Map();
  const selectedRecords = readJson(recordsPath);
  const selectedByDate = recordsByDate(selectedRecords);
  const { records: seriesRecords, pageLog } = await fetchSeriesRecords();

  for (const record of seriesRecords) {
    if (!record || record.levelOfDescription !== "fileUnit") continue;
    if (!/\bPresidential Daily (?:Diary|Backup)\b/i.test(record.title || "")) continue;
    if (/\[empty\]/i.test(record.title || "")) continue;
    const date = dateSpan(record);
    const relatedRecords = selectedByDate.get(date) || [];
    const text = clean([recordText(record), relatedRecordText(relatedRecords)].join(" "));
    const terms = matchedTerms(text);
    if (!isRelevant(text, terms, relatedRecords)) continue;
    const matchingQueries = QUERIES.filter((query) => new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text));
    if (relatedRecords.length) matchingQueries.unshift(`FRUS date crosswalk ${date}`);
    byNaid.set(String(record.naId), { record, queries: matchingQueries, relatedRecords });
  }

  const candidates = [...byNaid.values()]
    .map(({ record, queries, relatedRecords }) => toCandidate(record, queries, relatedRecords))
    .sort(
      (a, b) =>
        priorityRank(a.priority) - priorityRank(b.priority) ||
        String(a.chapter).localeCompare(String(b.chapter)) ||
        String(a.date).localeCompare(String(b.date)) ||
        String(a.title).localeCompare(String(b.title))
    );

  writeJsonAndScript(dataPath, dataScriptPath, "MEPP_DAILY_DIARY_CANDIDATES", candidates);

  const existingCandidates = fs.existsSync(sourceCandidatesPath)
    ? JSON.parse(fs.readFileSync(sourceCandidatesPath, "utf8"))
    : [];
  const merged = mergeSourceCandidates(existingCandidates, candidates);
  writeJsonAndScript(sourceCandidatesPath, sourceCandidatesScriptPath, "MEPP_SOURCE_CANDIDATES", merged);

  fs.writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: `https://catalog.archives.gov/id/${SERIES_NAID}`,
        seriesNaid: SERIES_NAID,
        seriesTitle: SERIES_TITLE,
        selectedFrusRecords: selectedRecords.length,
        selectedFrusDates: selectedByDate.size,
        parentPages: pageLog,
        seriesRecordsChecked: seriesRecords.length,
        queries: QUERIES,
        candidatesAdded: candidates.length,
        dateCrosswalkCandidates: candidates.filter((candidate) => candidate.relatedRecordIds?.length).length,
        highPriority: candidates.filter((candidate) => candidate.priority === "High").length,
        mediumPriority: candidates.filter((candidate) => candidate.priority === "Medium").length,
        digitalObjects: candidates.filter((candidate) => candidate.hasDigitalObject).length,
        pdfDigitalObjects: candidates.filter((candidate) => /\.pdf(?:\?|$)/i.test(candidate.digitalObjectUrl || "")).length,
        mergedSourceCandidates: merged.length,
        note:
          "Daily diary/backup candidates are selected from exact-date crosswalks against harvested FRUS meetings/calls plus OCR/catalog markers for MEPP meetings, calls, schedules, and telephone memoranda. Verify PDF pages before using them as chronology evidence."
      },
      null,
      2
    )}\n`
  );

  console.log(`Added ${candidates.length} daily diary/backup candidates; merged source-candidate total ${merged.length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
