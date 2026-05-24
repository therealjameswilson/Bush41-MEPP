const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const cacheDir = path.join(repoRoot, ".cache");
const cachePath = path.join(cacheDir, "nara-2554857-children.json");
const dataPath = path.join(repoRoot, "data", "haass-chronological-candidates.json");
const dataScriptPath = path.join(repoRoot, "data", "haass-chronological-candidates.js");
const sourceCandidatesPath = path.join(repoRoot, "data", "source-candidates.json");
const sourceCandidatesScriptPath = path.join(repoRoot, "data", "source-candidates.js");
const reportPath = path.join(repoRoot, "reports", "haass-chronological-harvest.json");

const SERIES_NAID = "2554857";
const SERIES_TITLE = "Richard N. Haass' Chronological Files";
const COLLECTION_NAID = "2163580";
const COLLECTION_TITLE = "Records of the National Security Council (George H. W. Bush Administration)";
const ENDPOINT = `https://catalog.archives.gov/proxy/records/parentNaId/${SERIES_NAID}?limit=1000`;
const SERIES_URL = `https://catalog.archives.gov/id/${SERIES_NAID}`;

const TOPIC_PATTERNS = [
  ["Madrid", /\bMadrid\b/i],
  ["Middle East peace", /\bMiddle East peace\b|\bpeace process\b|\bpeace conference\b/i],
  ["Arab-Israeli", /\bArab[-\s]Israeli\b/i],
  ["Israeli-Palestinian", /\bIsraeli[-\s]Palestinian\b/i],
  ["Israel leadership", /\bShamir\b|\bRabin\b|\bPeres\b|\bArens\b|\bShoval\b|\bMoshe Arad\b|\bZalman Shoval\b/i],
  ["Palestinian channel", /\bPalestinian(?:s)?\b|\bPLO\b|\bHusseini\b|\bAshrawi\b|\bArafat\b|\bWest Bank\b|\bGaza\b/i],
  ["Jordan/King Hussein", /\bKing Hussein\b|\bJordanian[-\s]Palestinian\b/i],
  [
    "Syria/Assad",
    /\bHafiz al[-\s]Assad\b|\bHafez al[-\s]Assad\b|\bPresident Assad\b|\bAssad of Syria\b|Israel(?:i)?[-\s]Syrian|Syria(?:n)? (?:track|peace|negotiations)/i
  ],
  [
    "Loan guarantees/settlements",
    /\bloan guarantees?\b|\bsettlement activity\b|\bsettlements policy\b|\bsettlement freeze\b|\boccupied territories\b/i
  ]
];

const HIGH_PRIORITY_TERMS = new Set([
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

async function downloadChildren() {
  ensureDir(cacheDir);
  const json = await fetchJson(ENDPOINT);
  fs.writeFileSync(cachePath, `${JSON.stringify(json, null, 2)}\n`);
  return json;
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

function priorityFor(terms) {
  if (terms.some((term) => HIGH_PRIORITY_TERMS.has(term))) return "High";
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
  if (terms.includes("Palestinian channel") || terms.includes("Jordan/King Hussein")) {
    return "Palestinian-Jordanian Track";
  }
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

function toCandidate(record) {
  const text = recordText(record);
  const terms = matchedTerms(text);
  const priority = priorityFor(terms);
  const object = firstDigitalObject(record);
  const container = mediaContainer(record);
  const date = dateSpan(record);
  const localIdentifier = [record.localIdentifier, container ? `Container ${container}` : ""].filter(Boolean).join(", ");

  return {
    id: `haass-chron-${record.naId}`,
    naid: String(record.naId),
    title: record.title || `Catalog record ${record.naId}`,
    level: record.levelOfDescription || "fileUnit",
    lane: "Richard Haass Chronological Files",
    chapter: chapterFor(text, terms),
    priority,
    repository: "George H.W. Bush Library / National Archives Catalog",
    collection: COLLECTION_TITLE,
    collectionNaid: COLLECTION_NAID,
    sourceSeries: SERIES_TITLE,
    sourceSeriesNaid: SERIES_NAID,
    localIdentifier,
    date,
    catalogUrl: `https://catalog.archives.gov/id/${record.naId}`,
    hasDigitalObject: Boolean(object),
    digitalObjectUrl: object?.objectUrl || "",
    documentType: "NSC chronological file folder",
    matchedQueries: terms.length ? terms : ["Series/date-range inclusion"],
    matchedTerms: terms,
    evidenceSnippets: evidenceSnippets(text, terms),
    scopeAndContentNote: terms.length
      ? `OCR/topic markers: ${terms.join(", ")}. Inspect the linked PDF for document-level selection.`
      : "Chronological file folder in Richard Haass' NSC series; no high-confidence MEPP topic marker in OCR, but included for date-range completeness.",
    reason:
      priority === "Review"
        ? "Date-range file from Haass' NSC chronological series; inspect before excluding from compiler review."
        : `Haass NSC chronological file with ${terms.join(", ")} marker(s); inspect PDF/OCR for document-level FRUS selection.`,
    sourceNote: `Source candidate: George H.W. Bush Library, Bush Presidential Records, National Security Council, ${SERIES_TITLE}, ${record.title || `Catalog record ${record.naId}`}${localIdentifier ? `, ${localIdentifier}` : ""}${date ? `, ${date}` : ""}, NAID ${record.naId}.`
  };
}

function priorityRank(priority) {
  return priority === "High" ? 0 : priority === "Medium" ? 1 : priority === "Review" ? 2 : 3;
}

function mergeSourceCandidates(existingCandidates, haassCandidates) {
  const preservedCandidates = existingCandidates.filter(
    (candidate) =>
      candidate.lane !== "Richard Haass Chronological Files" && !String(candidate.id || "").startsWith("haass-chron-")
  );
  const byId = new Map(preservedCandidates.map((candidate) => [candidate.id, candidate]));
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
  const json = await downloadChildren();
  const records = (json.body?.hits?.hits || [])
    .map((hit) => hit._source?.record)
    .filter((record) => record?.levelOfDescription === "fileUnit")
    .sort((a, b) => String(dateSpan(a)).localeCompare(String(dateSpan(b))) || String(a.title).localeCompare(String(b.title)));
  const haassCandidates = records.map(toCandidate);

  writeJsonAndScript(dataPath, dataScriptPath, "MEPP_HAASS_CHRONOLOGICAL_CANDIDATES", haassCandidates);

  const existingCandidates = fs.existsSync(sourceCandidatesPath)
    ? JSON.parse(fs.readFileSync(sourceCandidatesPath, "utf8"))
    : [];
  const merged = mergeSourceCandidates(existingCandidates, haassCandidates);
  writeJsonAndScript(sourceCandidatesPath, sourceCandidatesScriptPath, "MEPP_SOURCE_CANDIDATES", merged);

  fs.writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: ENDPOINT,
        catalogUrl: SERIES_URL,
        seriesNaid: SERIES_NAID,
        seriesTitle: SERIES_TITLE,
        totalChildren: json.body?.hits?.total?.value ?? records.length,
        fileUnitsReturned: records.length,
        candidatesAdded: haassCandidates.length,
        highPriority: haassCandidates.filter((candidate) => candidate.priority === "High").length,
        mediumPriority: haassCandidates.filter((candidate) => candidate.priority === "Medium").length,
        reviewPriority: haassCandidates.filter((candidate) => candidate.priority === "Review").length,
        digitalObjects: haassCandidates.filter((candidate) => candidate.hasDigitalObject).length,
        mergedSourceCandidates: merged.length,
        note:
          "Chronological file folders are included as file-level review candidates. OCR snippets are directional and must be verified against PDFs before FRUS selection."
      },
      null,
      2
    )}\n`
  );

  console.log(`Added ${haassCandidates.length} Haass chronological candidates; merged source-candidate total ${merged.length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
