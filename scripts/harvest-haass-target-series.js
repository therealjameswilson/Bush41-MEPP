const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const cacheDir = path.join(repoRoot, ".cache", "haass-target-series");
const dataPath = path.join(repoRoot, "data", "haass-target-series-candidates.json");
const dataScriptPath = path.join(repoRoot, "data", "haass-target-series-candidates.js");
const sourceCandidatesPath = path.join(repoRoot, "data", "source-candidates.json");
const sourceCandidatesScriptPath = path.join(repoRoot, "data", "source-candidates.js");
const reportPath = path.join(repoRoot, "reports", "haass-target-series-harvest.json");

const COLLECTION_NAID = "2163580";
const COLLECTION_TITLE = "Records of the National Security Council (George H. W. Bush Administration)";
const REPOSITORY = "George H.W. Bush Library / National Archives Catalog";

const TARGET_SERIES = [
  { naid: "2554859", lane: "Richard Haass Cleared Crosshatch Files", includeAll: false },
  { naid: "2554865", lane: "Richard Haass Correspondence Files", includeAll: false },
  { naid: "2554866", lane: "Richard Haass Meeting Files", includeAll: false },
  { naid: "2554868", lane: "Richard Haass Middle East Peace Process Files", includeAll: true },
  { naid: "2554871", lane: "Richard Haass Subject Files", includeAll: false },
  { naid: "2554875", lane: "Richard Haass Telephone Listings Files", includeAll: false },
  { naid: "2554876", lane: "Richard Haass Trip Files", includeAll: false },
  { naid: "2554877", lane: "Richard Haass Working Files", includeAll: false }
];

const TOPIC_PATTERNS = [
  ["Madrid", /\bMadrid\b/i],
  ["Middle East peace", /\bMiddle East peace\b|\bpeace process\b|\bpeace conference\b|\bMEPP\b|\bMEP Delegations\b/i],
  ["Middle East regional", /\bMiddle East\b|\bMideast\b/i],
  ["Arab-Israeli", /\bArab[-\s]Israeli\b/i],
  ["Israeli-Palestinian", /\bIsraeli[-\s]Palestinian\b/i],
  [
    "Israel leadership",
    /\bIsrael(?:i)?\b|\bShamir\b|\bRabin\b|\bPeres\b|\bArens\b|\bShoval\b|\bMoshe Arad\b|\bZalman Shoval\b/i
  ],
  ["Palestinian channel", /\bPalestinian(?:s)?\b|\bPLO\b|\bHusseini\b|\bAshrawi\b|\bArafat\b|\bWest Bank\b|\bGaza\b/i],
  ["Jordan/King Hussein", /\bKing Hussein\b|\bJordanian[-\s]Palestinian\b|\bJordan\b/i],
  [
    "Syria/Assad",
    /\bHafiz al[-\s]Assad\b|\bHafez al[-\s]Assad\b|\bPresident Assad\b|\bAssad of Syria\b|\bAssad\b|Israel(?:i)?[-\s]Syrian|Syria(?:n)? (?:track|peace|negotiations)/i
  ],
  [
    "Loan guarantees/settlements",
    /\bloan guarantees?\b|\bsettlement activity\b|\bsettlements policy\b|\bsettlement freeze\b|\boccupied territories\b/i
  ]
];

const STRONG_TERMS = new Set([
  "Madrid",
  "Middle East peace",
  "Arab-Israeli",
  "Israeli-Palestinian",
  "Palestinian channel",
  "Loan guarantees/settlements"
]);

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

async function downloadChildren(series) {
  ensureDir(cacheDir);
  const url = `https://catalog.archives.gov/proxy/records/parentNaId/${series.naid}?limit=1000`;
  const json = await fetchJson(url);
  fs.writeFileSync(path.join(cacheDir, `${series.naid}.json`), `${JSON.stringify(json, null, 2)}\n`);
  return { json, url };
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

function seriesTitle(record, seriesNaid) {
  return (
    record.ancestors?.find((ancestor) => String(ancestor.naId) === String(seriesNaid))?.title ||
    record.ancestors?.find((ancestor) => ancestor.levelOfDescription === "series")?.title ||
    ""
  );
}

function dateSpan(record) {
  const start = record.coverageStartDate?.logicalDate || record.inclusiveStartDate?.logicalDate || "";
  const end = record.coverageEndDate?.logicalDate || record.inclusiveEndDate?.logicalDate || "";
  if (start && end && start !== end) return `${start}/${end}`;
  return start || end || "";
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

function firstDigitalObject(record) {
  return (record.digitalObjects || []).find((object) => object.objectUrl) || null;
}

function matchedTerms(text) {
  return TOPIC_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}

function isRelevant(record, series, terms) {
  if (series.includeAll) return true;
  if (terms.some((term) => STRONG_TERMS.has(term))) return true;
  if (
    /Middle East|Mideast|Madrid|Peace Process|Palestinian|Israel|Shamir|Rabin|Peres|Arens|King Hussein|Assad|loan guarantees?|settlement/i.test(
      record.title || ""
    )
  ) {
    return true;
  }
  if (/Telephone Listings/i.test(series.lane) && terms.length) return true;
  return false;
}

function priorityFor(series, terms) {
  if (series.includeAll || terms.some((term) => STRONG_TERMS.has(term))) return "High";
  if (terms.length) return "Medium";
  return "Review";
}

function chapterFor(text, terms) {
  if (
    terms.includes("Madrid") ||
    terms.includes("Middle East peace") ||
    terms.includes("Arab-Israeli") ||
    terms.includes("Israeli-Palestinian")
  ) {
    return "Madrid-Multilateral Track";
  }
  if (terms.includes("Palestinian channel") || terms.includes("Jordan/King Hussein")) return "Palestinian-Jordanian Track";
  if (terms.includes("Syria/Assad")) return "Syria-Lebanon Track";
  if (
    terms.includes("Loan guarantees/settlements") ||
    /Shamir|Rabin|Peres|Arens|Shoval|Moshe Arad|Zalman Shoval|\bIsrael(?:i)?\b/i.test(text)
  ) {
    return "Israel Track";
  }
  if (/Mubarak|Egypt|Saudi|Kuwait|Gulf/i.test(text) && terms.length) return "Egypt-Arab Regional Track";
  return "Madrid-Multilateral Track";
}

function documentType(series) {
  if (/Crosshatch/i.test(series.lane)) return "NSC cleared crosshatch file folder";
  if (/Correspondence/i.test(series.lane)) return "NSC correspondence file folder";
  if (/Meeting/i.test(series.lane)) return "NSC meeting file folder";
  if (/Middle East Peace Process/i.test(series.lane)) return "NSC Middle East peace-process file folder";
  if (/Subject/i.test(series.lane)) return "NSC subject file folder";
  if (/Telephone/i.test(series.lane)) return "NSC telephone listing file folder";
  if (/Trip/i.test(series.lane)) return "NSC trip file folder";
  if (/Working/i.test(series.lane)) return "NSC working file folder";
  return "NSC file folder";
}

function evidenceSnippets(text, terms) {
  const snippets = [];
  for (const [label, pattern] of TOPIC_PATTERNS) {
    if (!terms.includes(label)) continue;
    const match = pattern.exec(text);
    if (!match) continue;
    const start = Math.max(0, match.index - 120);
    const end = Math.min(text.length, match.index + match[0].length + 240);
    snippets.push(clean(text.slice(start, end)));
    if (snippets.length >= 4) break;
  }
  return snippets;
}

function toCandidate(record, series) {
  const text = recordText(record);
  const terms = matchedTerms(text);
  const object = firstDigitalObject(record);
  const container = mediaContainer(record);
  const date = dateSpan(record);
  const sourceSeries = seriesTitle(record, series.naid) || series.lane;
  const localIdentifier = [record.localIdentifier, container ? `Container ${container}` : ""].filter(Boolean).join(", ");
  const priority = priorityFor(series, terms);

  return {
    id: `source-candidate-${record.naId}`,
    naid: String(record.naId),
    title: record.title || `Catalog record ${record.naId}`,
    level: record.levelOfDescription || "fileUnit",
    lane: series.lane,
    chapter: chapterFor(text, terms),
    priority,
    repository: REPOSITORY,
    collection: COLLECTION_TITLE,
    collectionNaid: COLLECTION_NAID,
    sourceSeries,
    sourceSeriesNaid: series.naid,
    localIdentifier,
    date,
    catalogUrl: `https://catalog.archives.gov/id/${record.naId}`,
    hasDigitalObject: Boolean(object),
    digitalObjectUrl: object?.objectUrl || "",
    documentType: documentType(series),
    matchedQueries: terms.length ? terms : [`Series inclusion: ${sourceSeries}`],
    matchedTerms: terms,
    evidenceSnippets: evidenceSnippets(text, terms),
    scopeAndContentNote: terms.length
      ? `OCR/topic markers: ${terms.join(", ")}. Inspect the linked PDF for document-level selection.`
      : `Included because the parent series is directly relevant: ${sourceSeries}. Inspect the linked PDF for document-level selection.`,
    reason:
      priority === "Review"
        ? `File from ${sourceSeries}; inspect before excluding from compiler review.`
        : `Haass NSC file with ${terms.length ? `${terms.join(", ")} marker(s)` : "series-level relevance"}; inspect PDF/OCR for document-level FRUS selection.`,
    sourceNote: `Source candidate: George H.W. Bush Library, Bush Presidential Records, National Security Council, ${sourceSeries}, ${record.title || `Catalog record ${record.naId}`}${localIdentifier ? `, ${localIdentifier}` : ""}${date ? `, ${date}` : ""}, NAID ${record.naId}.`
  };
}

function priorityRank(priority) {
  return priority === "High" ? 0 : priority === "Medium" ? 1 : priority === "Review" ? 2 : 3;
}

function mergeSourceCandidates(existingCandidates, haassCandidates) {
  const byId = new Map(existingCandidates.map((candidate) => [candidate.id, candidate]));
  for (const candidate of haassCandidates) byId.set(candidate.id, candidate);
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
  ensureDir(path.dirname(dataPath));
  ensureDir(path.dirname(reportPath));

  const candidates = [];
  const seriesReport = [];

  for (const series of TARGET_SERIES) {
    const { json, url } = await downloadChildren(series);
    const records = (json.body?.hits?.hits || [])
      .map((hit) => hit._source?.record)
      .filter((record) => record?.levelOfDescription === "fileUnit");
    const selected = records
      .map((record) => {
        const text = recordText(record);
        const terms = matchedTerms(text);
        return isRelevant(record, series, terms) ? toCandidate(record, series) : null;
      })
      .filter(Boolean);
    candidates.push(...selected);
    seriesReport.push({
      seriesNaid: series.naid,
      title: selected[0]?.sourceSeries || series.lane,
      source: url,
      totalChildren: json.body?.hits?.total?.value ?? records.length,
      fileUnitsReturned: records.length,
      candidatesAdded: selected.length,
      highPriority: selected.filter((candidate) => candidate.priority === "High").length,
      mediumPriority: selected.filter((candidate) => candidate.priority === "Medium").length,
      reviewPriority: selected.filter((candidate) => candidate.priority === "Review").length,
      digitalObjects: selected.filter((candidate) => candidate.hasDigitalObject).length
    });
  }

  const sortedCandidates = candidates.sort(
    (a, b) =>
      priorityRank(a.priority) - priorityRank(b.priority) ||
      String(a.sourceSeries).localeCompare(String(b.sourceSeries)) ||
      String(a.title).localeCompare(String(b.title))
  );
  writeJsonAndScript(dataPath, dataScriptPath, "MEPP_HAASS_TARGET_SERIES_CANDIDATES", sortedCandidates);

  const existingCandidates = fs.existsSync(sourceCandidatesPath)
    ? JSON.parse(fs.readFileSync(sourceCandidatesPath, "utf8"))
    : [];
  const merged = mergeSourceCandidates(existingCandidates, sortedCandidates);
  writeJsonAndScript(sourceCandidatesPath, sourceCandidatesScriptPath, "MEPP_SOURCE_CANDIDATES", merged);

  fs.writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        requestedSeries: TARGET_SERIES.map((series) => `https://catalog.archives.gov/id/${series.naid}`),
        series: seriesReport,
        candidatesAdded: sortedCandidates.length,
        highPriority: sortedCandidates.filter((candidate) => candidate.priority === "High").length,
        mediumPriority: sortedCandidates.filter((candidate) => candidate.priority === "Medium").length,
        reviewPriority: sortedCandidates.filter((candidate) => candidate.priority === "Review").length,
        digitalObjects: sortedCandidates.filter((candidate) => candidate.hasDigitalObject).length,
        mergedSourceCandidates: merged.length,
        note:
          "Targeted Haass file-series candidates are selected by direct series relevance, title markers, and OCR/topic markers. OCR snippets are directional and must be verified against PDFs before FRUS selection."
      },
      null,
      2
    )}\n`
  );

  console.log(`Added ${sortedCandidates.length} targeted Haass candidates; merged source-candidate total ${merged.length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
