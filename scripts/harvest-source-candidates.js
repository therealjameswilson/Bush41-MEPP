const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const dataPath = path.join(repoRoot, "data", "source-candidates.json");
const dataScriptPath = path.join(repoRoot, "data", "source-candidates.js");
const reportPath = path.join(repoRoot, "reports", "source-candidate-harvest.json");

const ROWS = 100;
const FETCH_TIMEOUT_MS = 15000;
const EXCLUDED_SERIES = new Set(["321498039", "321498139"]);

const QUERIES = [
  { lane: "State/Baker/Ross", query: '"Middle East peace" "George Bush"' },
  { lane: "State/Baker/Ross", query: '"Arab-Israeli" "George Bush"' },
  { lane: "State/Baker/Ross", query: '"Dennis Ross" Madrid Bush' },
  { lane: "State/Baker/Ross", query: '"letters of assurance" Bush Madrid' },
  { lane: "State/Baker/Ross", query: '"bilateral negotiations" "Middle East" Bush' },
  { lane: "Madrid/Post-Madrid", query: '"Madrid Peace Conference" "George Bush"' },
  { lane: "Madrid/Post-Madrid", query: '"Middle East Peace Conference" "George H. W. Bush"' },
  { lane: "Madrid/Post-Madrid", query: '"Madrid conference" Israel Bush' },
  { lane: "Madrid/Post-Madrid", query: '"Mideast Peace Process Since Madrid" Bush' },
  { lane: "Madrid/Post-Madrid", query: '"Opening Session" "Middle East Peace Conference" Madrid Bush' },
  { lane: "Israel Track", query: '"loan guarantees" Israel Bush' },
  { lane: "Israel Track", query: 'settlements Israel "George Bush"' },
  { lane: "Israel Track", query: 'CO074 Israel "loan guarantees" Bush' },
  { lane: "Israel Track", query: '"Jewish leaders" Shamir Bush Madrid' },
  { lane: "Palestinian-Jordanian Track", query: 'Palestinian Madrid Bush' },
  { lane: "Palestinian-Jordanian Track", query: '"Palestinian Delegation" "George H. W. Bush"' },
  { lane: "Palestinian-Jordanian Track", query: '"King Hussein" Madrid Bush' },
  { lane: "Palestinian-Jordanian Track", query: '"West Bank" Gaza Bush' },
  { lane: "Syria-Lebanon Track", query: 'Syria Madrid Bush Assad' },
  { lane: "Syria-Lebanon Track", query: '"Syrian Delegation" "George H. W. Bush"' },
  { lane: "Syria-Lebanon Track", query: 'Lebanon Madrid Bush Syria' },
  { lane: "Egypt-Arab Regional Track", query: 'Mubarak "peace process" Bush' },
  { lane: "Egypt-Arab Regional Track", query: 'Saudi Kuwait Gulf "peace process" Bush' },
  { lane: "NSC Staff Files", query: '"Dennis Ross" Bush' },
  { lane: "NSC Staff Files", query: '"Richard Haass" "Middle East" Bush' },
  { lane: "NSC Staff Files", query: '"National Security Council" "Middle East Peace" "George H. W. Bush"' },
  { lane: "NSC Staff Files", query: '"Presidential Briefing Book" Madrid "Middle East Peace"' },
  { lane: "WHORM/Subject Files", query: 'WHORM Israel loan guarantees' },
  { lane: "WHORM/Subject Files", query: 'WHORM Palestinian Bush' },
  { lane: "WHORM/Subject Files", query: '"CO001-07" "Middle East" Bush' },
  { lane: "WHORM/Subject Files", query: '"FO004-02" "Middle East" Bush' }
];

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
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
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

async function searchCatalog(query) {
  const url = new URL("https://catalog.archives.gov/proxy/records/search");
  url.searchParams.set("q", query);
  url.searchParams.set("rows", String(ROWS));
  const json = await fetchJson(url);
  const hits = json.body?.hits?.hits || [];
  const total = json.body?.hits?.total?.value ?? hits.length;
  return { hits, total, url: String(url) };
}

function ancestors(record) {
  return (record.ancestors || []).map((ancestor) => ({
    naid: String(ancestor.naId || ""),
    title: ancestor.title || ancestor.collectionTitle || "",
    level: ancestor.levelOfDescription || ""
  }));
}

function ancestor(record, level) {
  return ancestors(record).find((item) => item.level === level) || null;
}

function sourceText(record) {
  return clean(
    [
      record.title,
      record.scopeAndContentNote,
      record.localIdentifier,
      ...(record.subjects || []).map((subject) => subject.heading),
      ...(record.generalNotes || []),
      ...(record.digitalObjects || []).map((object) => object.objectFilename),
      ...ancestors(record).map((item) => item.title)
    ].join(" ")
  );
}

function isBush41(record) {
  const text = sourceText(record);
  if (/George\s+W\.\s+Bush\s+Administration/i.test(text)) return false;
  return /George\s+H\.?\s*W\.?\s+Bush|George\s+Bush\s+Library|Bush\s+Presidential\s+Records|Bush Administration|Brent\s+Scowcroft/i.test(text);
}

function topicVisible(record) {
  return /Middle East peace|Mideast peace|Arab[-\s]Israeli|Madrid|Israel|Israeli|Palestinian|PLO|West Bank|Gaza|Jordan|King Hussein|Syria|Syrian|Assad|Lebanon|Mubarak|Egypt|Saudi|Kuwait|Gulf|loan guarantees?|settlements?|Dennis Ross|Baker|letters of assurance|bilateral negotiations/i.test(
    sourceText(record)
  );
}

function chapterFor(text, lane) {
  if (/Syria|Assad|Lebanon/i.test(text)) return "Syria-Lebanon Track";
  if (/Palestinian|PLO|West Bank|Gaza|Jordan|King Hussein/i.test(text)) return "Palestinian-Jordanian Track";
  if (/loan guarantees?|settlements?|Shamir|Rabin|Israel/i.test(text)) return "Israel Track";
  if (/Mubarak|Egypt|Saudi|Fahd|Kuwait|Persian Gulf|Gulf|Arab states?/i.test(text)) return "Egypt-Arab Regional Track";
  if (/Madrid|Arab[-\s]Israeli|Middle East peace|peace process|Baker|Ross/i.test(text)) return "Madrid-Multilateral Track";
  return lane;
}

function priorityFor(record, text) {
  if (/State|Department of State|Baker|Dennis Ross|Madrid Peace Conference|letters of assurance|loan guarantees?/i.test(text)) return "High";
  if (record.levelOfDescription === "series" || record.levelOfDescription === "fileUnit") return "Medium";
  return "Review";
}

function toCandidate(record, queryInfo) {
  const series = ancestor(record, "series");
  const collection = ancestor(record, "collection");
  const object = (record.digitalObjects || []).find((item) => item.objectUrl);
  const text = sourceText(record);
  const localIdentifier = record.localIdentifier || "";
  const repositoryLabel = queryInfo.lane.includes("WHORM")
    ? "Source: George H.W. Bush Library, White House Office of Records Management"
    : "Source: George H.W. Bush Library";
  const sourceNoteParts = [
    repositoryLabel,
    collection?.title || "",
    series?.title || "",
    record.title || `Catalog record ${record.naId}`,
    localIdentifier
  ].filter(Boolean);
  return {
    id: `source-candidate-${record.naId}`,
    naid: String(record.naId),
    title: record.title || `Catalog record ${record.naId}`,
    level: record.levelOfDescription || "",
    lane: queryInfo.lane,
    chapter: chapterFor(text, queryInfo.lane),
    priority: priorityFor(record, text),
    matchedQueries: [queryInfo.query],
    catalogUrl: `https://catalog.archives.gov/id/${record.naId}`,
    hasDigitalObject: Boolean(object),
    digitalObjectUrl: object?.objectUrl || "",
    localIdentifier,
    scopeAndContentNote: clean(record.scopeAndContentNote || ""),
    sourceSeries: series?.title || "",
    sourceSeriesNaid: series?.naid || "",
    collection: collection?.title || "",
    collectionNaid: collection?.naid || "",
    reason: `Candidate from ${queryInfo.lane}; verify scope, date range, and availability before treating as compiler evidence.`,
    sourceNote: `${sourceNoteParts.join(", ")}. Folder-level source candidate; document-level classification, distribution, drafting, and place/time data require review. Catalog control: NAID ${record.naId}.`
  };
}

function mergeCandidate(existing, next) {
  return {
    ...existing,
    priority: existing.priority === "High" || next.priority !== "High" ? existing.priority : next.priority,
    matchedQueries: [...new Set([...(existing.matchedQueries || []), ...(next.matchedQueries || [])])],
    lane: [...new Set([existing.lane, next.lane].filter(Boolean))].join("; ")
  };
}

async function main() {
  ensureDir(path.dirname(dataPath));
  ensureDir(path.dirname(reportPath));
  const byNaid = new Map();
  const searchLog = [];

  for (const queryInfo of QUERIES) {
    let result;
    try {
      result = await searchCatalog(queryInfo.query);
    } catch (error) {
      searchLog.push({ ...queryInfo, total: 0, returned: 0, error: error.message });
      continue;
    }

    for (const hit of result.hits) {
      const record = hit._source?.record;
      if (!record) continue;
      const series = ancestor(record, "series");
      if (EXCLUDED_SERIES.has(String(series?.naid || ""))) continue;
      if (!isBush41(record)) continue;
      if (!topicVisible(record)) continue;
      const next = toCandidate(record, queryInfo);
      const existing = byNaid.get(next.naid);
      byNaid.set(next.naid, existing ? mergeCandidate(existing, next) : next);
    }
    searchLog.push({ ...queryInfo, total: result.total, returned: result.hits.length, error: "" });
  }

  const candidates = [...byNaid.values()].sort(
    (a, b) =>
      (a.priority === "High" ? 0 : a.priority === "Medium" ? 1 : 2) -
        (b.priority === "High" ? 0 : b.priority === "Medium" ? 1 : 2) ||
      a.chapter.localeCompare(b.chapter) ||
      a.title.localeCompare(b.title)
  );
  const json = JSON.stringify(candidates, null, 2);
  fs.writeFileSync(dataPath, `${json}\n`);
  fs.writeFileSync(dataScriptPath, `window.MEPP_SOURCE_CANDIDATES = ${json};\n`);
  fs.writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        queries: QUERIES,
        searchLog,
        candidates: candidates.length,
        highPriority: candidates.filter((candidate) => candidate.priority === "High").length,
        digitalObjects: candidates.filter((candidate) => candidate.hasDigitalObject).length
      },
      null,
      2
    )}\n`
  );

  console.log(`Wrote ${candidates.length} source candidates.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
