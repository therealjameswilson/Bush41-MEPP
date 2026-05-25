const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const cacheDir = path.join(repoRoot, ".cache", "gap-remediation-series");
const dataPath = path.join(repoRoot, "data", "gap-remediation-candidates.json");
const dataScriptPath = path.join(repoRoot, "data", "gap-remediation-candidates.js");
const sourceCandidatesPath = path.join(repoRoot, "data", "source-candidates.json");
const sourceCandidatesScriptPath = path.join(repoRoot, "data", "source-candidates.js");
const reportPath = path.join(repoRoot, "reports", "gap-remediation-harvest.json");

const COLLECTION_NAID = "2163580";
const COLLECTION_TITLE = "Records of the National Security Council (George H. W. Bush Administration)";
const REPOSITORY = "George H.W. Bush Library / National Archives Catalog";

const TARGET_SERIES = [
  {
    naid: "2554869",
    lane: "Richard Haass Presidential Meeting Files",
    documentType: "NSC presidential meeting file folder"
  },
  {
    naid: "376217868",
    lane: "Summit Briefing Books Files",
    documentType: "Presidential briefing book folder"
  },
  {
    naid: "374000442",
    lane: "European and Soviet Directorate Briefing Books",
    documentType: "NSC briefing book folder"
  }
];

const TOPIC_PATTERNS = [
  ["Madrid", /\bMadrid\b/i],
  ["Middle East peace", /\bMiddle East peace\b|\bMideast peace\b|\bpeace process\b|\bpeace conference\b|\bMEPP\b|\bMEP Delegations\b/i],
  ["Arab-Israeli", /\bArab[-\s]Israeli\b/i],
  ["Israeli-Palestinian", /\bIsraeli[-\s]Palestinian\b/i],
  ["Israel leadership", /\bIsrael(?:i)?\b|\bShamir\b|\bRabin\b|\bPeres\b|\bArens\b|\bLevy\b|\bShoval\b|\bHerzog\b/i],
  ["Palestinian channel", /\bPalestinian(?:s)?\b|\bPLO\b|\bHusseini\b|\bAshrawi\b|\bArafat\b|\bWest Bank\b|\bGaza\b/i],
  ["Jordan/King Hussein", /\bKing Hussein\b|\bJordanian[-\s]Palestinian\b|\bJordan\b|\bAmman\b|\bHassan of Morocco\b/i],
  ["Syria/Lebanon", /\bSyria(?:n)?\b|\bAssad\b|\bDamascus\b|\bLebanon\b|\bLebanese\b|\bZahleh\b/i],
  ["Egypt/Arab regional", /\bMubarak\b|\bEgypt(?:ian)?\b|\bCairo\b|\bSaudi\b|\bFahd\b|\bKuwait(?:i)?\b|\bGulf\b|\bBahrain\b|\bTunisia\b|\bMorocco\b|\bYemen\b|\bOman\b|\bUAE\b/i],
  ["Loan guarantees/settlements", /\bloan guarantees?\b|\bsettlement activity\b|\bsettlements policy\b|\bsettlement freeze\b|\boccupied territories\b/i]
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

function isRelevant(record, terms) {
  if (terms.some((term) => STRONG_TERMS.has(term))) return true;
  return /Madrid|Middle East|Mideast|Peace Process|Palestinian|Israel|Shamir|Rabin|Peres|Arens|Levy|Herzog|King Hussein|Jordan|Assad|Syria|Lebanon|Mubarak|Egypt|Kuwait|Saudi|Gulf|Bahrain|Morocco|Tunisia/i.test(
    record.title || ""
  );
}

function priorityFor(series, terms, text) {
  if (terms.some((term) => STRONG_TERMS.has(term))) return "High";
  if (/Presidential Meeting|Presidential Visit|Briefing Book: Opening Session|Mid-East Peace Conference/i.test(text)) return "High";
  if (terms.length) return "Medium";
  return series.naid === "2554869" ? "Medium" : "Review";
}

function chapterFor(text, terms) {
  if (terms.includes("Syria/Lebanon")) return "Syria-Lebanon Track";
  if (terms.includes("Palestinian channel") || terms.includes("Jordan/King Hussein")) return "Palestinian-Jordanian Track";
  if (terms.includes("Loan guarantees/settlements") || terms.includes("Israel leadership")) return "Israel Track";
  if (terms.includes("Egypt/Arab regional")) return "Egypt-Arab Regional Track";
  if (
    terms.includes("Madrid") ||
    terms.includes("Middle East peace") ||
    terms.includes("Arab-Israeli") ||
    terms.includes("Israeli-Palestinian")
  ) {
    return "Madrid-Multilateral Track";
  }
  if (/\bSyria\b|\bAssad\b|\bLebanon\b/i.test(text)) return "Syria-Lebanon Track";
  if (/\bPalestinian\b|\bJordan\b|\bKing Hussein\b/i.test(text)) return "Palestinian-Jordanian Track";
  if (/\bIsrael\b|\bShamir\b|\bRabin\b|\bLevy\b/i.test(text)) return "Israel Track";
  if (/\bEgypt\b|\bMubarak\b|\bSaudi\b|\bKuwait\b|\bGulf\b/i.test(text)) return "Egypt-Arab Regional Track";
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

function toCandidate(record, series) {
  const text = recordText(record);
  const terms = matchedTerms(text);
  const object = firstDigitalObject(record);
  const container = mediaContainer(record);
  const date = dateSpan(record);
  const sourceSeries = seriesTitle(record, series.naid) || series.lane;
  const localIdentifier = [record.localIdentifier, container ? `Container ${container}` : ""].filter(Boolean).join(", ");
  const priority = priorityFor(series, terms, `${record.title || ""} ${text}`);

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
    documentType: series.documentType,
    remediationHarvest: "high-value-series",
    matchedQueries: terms.length ? terms : [`Series/title inclusion: ${sourceSeries}`],
    matchedTerms: terms,
    evidenceSnippets: evidenceSnippets(text, terms),
    scopeAndContentNote: terms.length
      ? `Gap-remediation OCR/topic markers: ${terms.join(", ")}. Inspect the linked PDF for document-level selection.`
      : `Gap-remediation candidate from ${sourceSeries}; inspect the linked PDF for document-level selection.`,
    reason: `High-value Bush Library gap-remediation file from ${sourceSeries}; verify PDF/OCR before treating as compiler evidence.`,
    sourceNote: `Source: George H.W. Bush Library, Bush Presidential Records, National Security Council, ${sourceSeries}, ${record.title || `Catalog record ${record.naId}`}${localIdentifier ? `, ${localIdentifier}` : ""}${date ? `, ${date}` : ""}. Folder-level source candidate; document-level classification, distribution, drafting, and place/time data require review. Catalog control: NAID ${record.naId}.`
  };
}

function priorityRank(priority) {
  return priority === "High" ? 0 : priority === "Medium" ? 1 : priority === "Review" ? 2 : 3;
}

function mergeSourceCandidates(existingCandidates, gapCandidates) {
  const targetLanes = new Set(TARGET_SERIES.map((series) => series.lane));
  const preservedCandidates = existingCandidates.filter(
    (candidate) => candidate.remediationHarvest !== "high-value-series" && !targetLanes.has(candidate.lane)
  );
  const byId = new Map(preservedCandidates.map((candidate) => [candidate.id, candidate]));
  for (const candidate of gapCandidates) byId.set(candidate.id, candidate);
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
        return isRelevant(record, terms) ? toCandidate(record, series) : null;
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
  writeJsonAndScript(dataPath, dataScriptPath, "MEPP_GAP_REMEDIATION_CANDIDATES", sortedCandidates);

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
          "Gap-remediation candidates add high-value Bush Library series not covered by the first Haass harvest, especially presidential meeting files and Madrid briefing books."
      },
      null,
      2
    )}\n`
  );

  console.log(`Added ${sortedCandidates.length} gap-remediation candidates; merged source-candidate total ${merged.length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
