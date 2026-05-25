const fs = require("fs");
const path = require("path");
const { notesFromCatalogRecord } = require("./frus-source-notes");

const repoRoot = path.resolve(__dirname, "..");
const dataDir = path.join(repoRoot, "data");
const reportDir = path.join(repoRoot, "reports");
const dataPath = path.join(dataDir, "records.json");
const dataScriptPath = path.join(dataDir, "records.js");
const reportPath = path.join(reportDir, "presidential-conversation-harvest.json");

const ROWS = 100;
const FETCH_TIMEOUT_MS = 15000;

const SERIES = [
  {
    naid: "321498039",
    title: "Presidential Memcon Files",
    shortName: "Presidential Memcon Files",
    documentType: "Memcon"
  },
  {
    naid: "321498139",
    title: "Presidential Telcon Files",
    shortName: "Presidential Telcon Files",
    documentType: "Telcon"
  }
];

const CHAPTERS = {
  "Israel Track": { number: 1, name: "Israel Track" },
  "Palestinian-Jordanian Track": { number: 2, name: "Palestinian-Jordanian Track" },
  "Syria-Lebanon Track": { number: 3, name: "Syria-Lebanon Track" },
  "Egypt-Arab Regional Track": { number: 4, name: "Egypt-Arab Regional Track" },
  "Madrid-Multilateral Track": { number: 5, name: "Madrid-Multilateral Track" }
};

const QUERY_GROUPS = {
  "Israel Track": [
    "Israel",
    "Israeli",
    "Yitzhak Shamir",
    "Shamir",
    "Yitzhak Rabin",
    "Rabin",
    "Shimon Peres",
    "Peres",
    "Moshe Arens",
    "Arens",
    "Chaim Herzog",
    "Netanyahu",
    "Jerusalem",
    "settlements",
    "loan guarantees"
  ],
  "Palestinian-Jordanian Track": [
    "Palestinian",
    "Palestinians",
    "PLO",
    "Arafat",
    "West Bank",
    "Gaza",
    "King Hussein",
    "Hussein of Jordan",
    "Jordan"
  ],
  "Syria-Lebanon Track": ["Hafez Assad", "Assad", "Syria", "Syrian", "Lebanon", "Lebanese"],
  "Egypt-Arab Regional Track": [
    "Hosni Mubarak",
    "Mubarak",
    "Egypt",
    "Egyptian",
    "Amre Mousa",
    "Mousa",
    "Boutros Ghali",
    "Fahd",
    "Saudi",
    "Hassan II",
    "Morocco"
  ],
  "Madrid-Multilateral Track": [
    "Madrid Peace Conference",
    "Madrid conference",
    "Middle East peace",
    "peace process",
    "Arab-Israeli",
    "land for peace",
    "Perez de Cuellar",
    "United Nations Secretary General",
    "Baker"
  ]
};

const VISIBLE_TOPIC_PATTERNS = {
  "Israel Track": [
    /\bIsrael(?:i)?\b/i,
    /\bShamir\b/i,
    /\bRabin\b/i,
    /\bPeres\b/i,
    /\bArens\b/i,
    /\bHerzog\b/i,
    /\bNetanyahu\b/i,
    /\bJerusalem\b/i,
    /\bsettlements?\b/i,
    /\bloan guarantees?\b/i
  ],
  "Palestinian-Jordanian Track": [
    /\bPalestinian(?:s)?\b/i,
    /\bPLO\b/i,
    /\bArafat\b/i,
    /\bWest Bank\b/i,
    /\bGaza\b/i,
    /\bKing Hussein\b/i,
    /\bHussein of Jordan\b/i,
    /\bJordan(?:ian)?\b/i
  ],
  "Syria-Lebanon Track": [/\bAssad\b/i, /\bSyria(?:n)?\b/i, /\bLebanon\b/i, /\bLebanese\b/i],
  "Egypt-Arab Regional Track": [
    /\bMubarak\b/i,
    /\bEgypt(?:ian)?\b/i,
    /\bMousa\b/i,
    /\bBoutros[-\s]?Ghali\b/i,
    /\bFahd\b/i,
    /\bSaudi\b/i,
    /\bHassan\b/i,
    /\bMorocco\b/i
  ],
  "Madrid-Multilateral Track": [
    /\bMadrid\b/i,
    /\bMiddle East peace\b/i,
    /\bpeace process\b/i,
    /\bArab[-\s]Israeli\b/i,
    /\bland for peace\b/i,
    /\bPerez de Cuellar\b/i,
    /\bUnited Nations Secretary General\b/i,
    /\bBaker\b/i
  ]
};

const EVENT_WINDOWS = [
  {
    id: "opening-phase",
    label: "Opening Phase",
    start: "1989-01-20",
    end: "1990-07-31",
    description: "Early Bush administration contacts, Baker diplomacy, and pre-Gulf-crisis peace-process positioning."
  },
  {
    id: "gulf-war-linkage",
    label: "Gulf War Linkage",
    start: "1990-08-01",
    end: "1991-03-31",
    description: "Coalition diplomacy, Israeli restraint, and Arab-state positioning during the Kuwait crisis and war."
  },
  {
    id: "road-to-madrid",
    label: "Road to Madrid",
    start: "1991-04-01",
    end: "1991-10-29",
    description: "Postwar shuttle diplomacy, invitation formula debates, and regional preparations for a conference."
  },
  {
    id: "madrid-conference",
    label: "Madrid Conference",
    start: "1991-10-30",
    end: "1991-11-03",
    description: "Madrid opening, bilateral meetings, and the U.S.-Soviet co-sponsored conference moment."
  },
  {
    id: "post-madrid",
    label: "Post-Madrid Tracks",
    start: "1991-11-04",
    end: "1992-06-22",
    description: "Bilateral rounds, loan guarantees, settlements, and multilateral-track follow-through."
  },
  {
    id: "israeli-transition",
    label: "Israeli Transition",
    start: "1992-06-23",
    end: "1993-01-20",
    description: "Rabin government transition, late Bush administration diplomacy, and handoff issues."
  }
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function logicalDate(date) {
  return date?.logicalDate || "";
}

function dateFor(record) {
  return (
    logicalDate(record.productionDates?.[0]) ||
    logicalDate(record.coverageStartDate) ||
    logicalDate(record.inclusiveStartDate) ||
    logicalDate(record.productionDateArray?.[0]) ||
    titleDate(record.title) ||
    ""
  );
}

const MONTHS = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12"
};

function titleDate(value) {
  const match = String(value || "").match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(1989|1990|1991|1992|1993)\b/
  );
  if (!match) return "";
  return `${match[3]}-${MONTHS[match[1]]}-${String(match[2]).padStart(2, "0")}`;
}

function digitalObject(record) {
  return (record.digitalObjects || []).find((object) => object.objectUrl) || null;
}

function visibleText(record) {
  return [
    record.title,
    record.scopeAndContentNote,
    record.localIdentifier,
    ...(record.subjects || []).map((subject) => subject.heading),
    ...(record.generalNotes || []),
    ...(record.digitalObjects || []).map((object) => object.objectFilename),
    ...(record.ancestors || []).map((item) => item.title)
  ]
    .filter(Boolean)
    .join(" ");
}

function visibleTopicHits(record) {
  const text = visibleText(record);
  return Object.entries(VISIBLE_TOPIC_PATTERNS)
    .map(([chapterName, patterns]) => ({
      chapterName,
      labels: patterns.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source)
    }))
    .filter((hit) => hit.labels.length);
}

function scoreChapter(record, match, chapterName) {
  const title = record.title || "";
  const titleScore = (VISIBLE_TOPIC_PATTERNS[chapterName] || []).filter((pattern) => pattern.test(title)).length * 5;
  const visibleScore = (VISIBLE_TOPIC_PATTERNS[chapterName] || []).filter((pattern) => pattern.test(visibleText(record))).length * 2;
  const queryScore = (match.queryMatches[chapterName] || []).length;
  return titleScore + visibleScore + queryScore;
}

function chapterFor(match) {
  const scores = Object.keys(CHAPTERS).map((chapterName) => ({
    chapterName,
    score: scoreChapter(match.record, match, chapterName)
  }));
  scores.sort((a, b) => b.score - a.score || CHAPTERS[a.chapterName].number - CHAPTERS[b.chapterName].number);
  return CHAPTERS[scores[0]?.chapterName || "Madrid-Multilateral Track"];
}

function eventFor(date) {
  return EVENT_WINDOWS.find((event) => date >= event.start && date <= event.end) || EVENT_WINDOWS[0];
}

function documentTypeFor(record, series) {
  const title = record.title || "";
  if (/telcon|telephone|phone call|call to|call from|president'?s call|points to be made for telephone call/i.test(title)) {
    return "Telcon";
  }
  if (/meeting|luncheon|lunch|plenary|bilateral|session|one-on-one|credentials/i.test(title)) {
    return "Memcon";
  }
  return series.documentType;
}

function countriesFor(record) {
  const text = visibleText(record);
  const countries = [
    ["Israel", /\bIsrael(?:i)?\b|Shamir|Rabin|Peres|Arens|Herzog|Netanyahu/i],
    ["Jordan", /\bJordan(?:ian)?\b|King Hussein|Hussein of Jordan/i],
    ["Palestinians", /\bPalestinian(?:s)?\b|\bPLO\b|Arafat|West Bank|Gaza/i],
    ["Syria", /\bSyria(?:n)?\b|Assad/i],
    ["Lebanon", /\bLebanon\b|Lebanese/i],
    ["Egypt", /\bEgypt(?:ian)?\b|Mubarak|Mousa|Boutros[-\s]?Ghali/i],
    ["Saudi Arabia", /\bSaudi\b|Fahd/i],
    ["Morocco", /\bMorocco\b|Hassan/i],
    ["United Nations", /\bUnited Nations\b|Perez de Cuellar/i]
  ]
    .filter(([, pattern]) => pattern.test(text))
    .map(([label]) => label);
  return [...new Set(countries)];
}

function peopleFor(record) {
  const title = record.title || "";
  const people = [
    ["George H.W. Bush", /President Bush|the President/i],
    ["James A. Baker III", /\bBaker\b/i],
    ["Yitzhak Shamir", /Shamir/i],
    ["Yitzhak Rabin", /Rabin/i],
    ["Shimon Peres", /Peres/i],
    ["Moshe Arens", /Arens/i],
    ["Chaim Herzog", /Herzog/i],
    ["King Hussein", /King Hussein|Hussein of Jordan/i],
    ["Yasir Arafat", /Arafat/i],
    ["Hafez al-Assad", /Assad/i],
    ["Hosni Mubarak", /Mubarak/i],
    ["Amre Mousa", /Mousa/i],
    ["Boutros Boutros-Ghali", /Boutros[-\s]?Ghali/i],
    ["King Fahd", /Fahd/i],
    ["King Hassan II", /Hassan/i],
    ["Javier Perez de Cuellar", /Perez de Cuellar/i]
  ]
    .filter(([, pattern]) => pattern.test(title))
    .map(([label]) => label);
  return [...new Set(people)];
}

function selectionValue(record, chapter, matchedQueries) {
  const title = record.title || "";
  const date = dateFor(record);
  if (/Madrid|peace process|Arab[-\s]Israeli|loan guarantees?|settlements?/i.test(title)) return "Anchor";
  if (date >= "1991-10-25" && date <= "1991-11-05") return "Anchor";
  if (/Shamir|Rabin|Peres|Arens|Israel|King Hussein|Assad|Mubarak/i.test(title)) return "High";
  if (chapter.name === "Madrid-Multilateral Track" || matchedQueries.length >= 4) return "High";
  return "Context";
}

function sourceConfidence(record, matchedQueries) {
  const title = record.title || "";
  if (/Madrid|peace process|Arab[-\s]Israeli|loan guarantees?|settlements?|Shamir|Rabin|Peres|Arens|King Hussein|Assad|Mubarak/i.test(title)) {
    return {
      level: "title-anchor",
      label: "Title anchor",
      basis: "The catalog title itself names a key Middle East peace process actor, issue, or conference."
    };
  }
  if (matchedQueries.length >= 3) {
    return {
      level: "multi-signal",
      label: "Multiple topic signals",
      basis: "The item appeared under several MEPP search terms and needs PDF-level confirmation."
    };
  }
  return {
    level: "review",
    label: "Review candidate",
    basis: "The item matched a MEPP query but requires document reading before selection."
  };
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
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw lastError;
}

async function searchCatalog(series, query, from = 0) {
  const url = new URL("https://catalog.archives.gov/proxy/records/search");
  url.searchParams.set("ancestorNaId", series.naid);
  url.searchParams.set("q", query);
  url.searchParams.set("rows", String(ROWS));
  url.searchParams.set("from", String(from));
  const json = await fetchJson(url);
  const hits = json.body?.hits?.hits || [];
  const total = json.body?.hits?.total?.value ?? hits.length;
  return { hits, total, url: String(url) };
}

function toSiteRecord(match) {
  const { record, series } = match;
  const object = digitalObject(record);
  const date = dateFor(record);
  const chapter = chapterFor(match);
  const event = eventFor(date);
  const matchedQueries = [...new Set(Object.values(match.queryMatches).flat())];
  const notes = notesFromCatalogRecord(record, series, object);
  const value = selectionValue(record, chapter, matchedQueries);

  return {
    id: `conversation-${record.naId}`,
    naid: String(record.naId),
    title: record.title || `Catalog record ${record.naId}`,
    documentTitle: record.title || `Catalog record ${record.naId}`,
    documentType: documentTypeFor(record, series),
    chapter,
    date,
    sortDate: date || "9999-99-99",
    dateLine: date,
    eventId: event.id,
    eventLabel: event.label,
    countries: countriesFor(record),
    people: peopleFor(record),
    selectionValue: value,
    topicTerms: Object.fromEntries(
      Object.entries(match.queryMatches)
        .filter(([, terms]) => terms.length)
        .map(([chapterName, terms]) => [chapterName, [...new Set(terms)]])
    ),
    matchedQueries,
    catalogUrl: `https://catalog.archives.gov/id/${record.naId}`,
    pdfUrl: object?.objectUrl || "",
    objectFilename: object?.objectFilename || "",
    objectFileSize: object?.objectFileSize || null,
    pageCount: null,
    pageCountBasis: "not yet measured",
    localIdentifier: record.localIdentifier || "",
    releaseStatus: "Declassified presidential conversation; PDF available",
    accessRestrictionStatus: record.accessRestriction?.status || "",
    sourceConfidence: sourceConfidence(record, matchedQueries),
    source: {
      naid: series.naid,
      title: series.title,
      shortName: series.shortName,
      url: `https://catalog.archives.gov/id/${series.naid}`
    },
    sourceNoteLocation: notes.sourceNoteLocation,
    sourceNote: notes.sourceNote,
    frusSourceNote: notes.sourceNote,
    catalogTrail: notes.catalogTrail,
    compilerNote: compilerNoteFor(value, event, chapter)
  };
}

function compilerNoteFor(value, event, chapter) {
  if (value === "Anchor") {
    return `Anchor candidate for ${event.label}; verify PDF text against the ${chapter.name} chronology and related Department of State records.`;
  }
  if (value === "High") {
    return `High-priority context item for ${chapter.name}; confirm whether the conversation bears directly on Arab-Israeli diplomacy.`;
  }
  return `Context lead; retain for cross-reference and declassification trail until PDF review confirms scope.`;
}

async function main() {
  ensureDir(dataDir);
  ensureDir(reportDir);

  const byNaid = new Map();
  const searchLog = [];

  for (const series of SERIES) {
    for (const [chapterName, queries] of Object.entries(QUERY_GROUPS)) {
      for (const query of queries) {
        let total = 0;
        let returned = 0;
        let error = "";
        for (let from = 0; ; from += ROWS) {
          let result;
          try {
            result = await searchCatalog(series, query, from);
          } catch (searchError) {
            error = searchError.message;
            break;
          }

          total = result.total;
          returned += result.hits.length;
          for (const hit of result.hits) {
            const record = hit._source?.record;
            if (!record || record.levelOfDescription !== "item") continue;
            const object = digitalObject(record);
            if (!object?.objectUrl) continue;
            if ((record.accessRestriction?.status || "").toLowerCase() !== "unrestricted") continue;
            const date = dateFor(record);
            if (date && (date < "1989-01-20" || date > "1993-01-20")) continue;
            if (!visibleTopicHits(record).length) continue;

            const key = String(record.naId);
            const existing = byNaid.get(key) || {
              record,
              series,
              queryMatches: Object.fromEntries(Object.keys(CHAPTERS).map((name) => [name, []]))
            };
            if (!existing.queryMatches[chapterName].includes(query)) {
              existing.queryMatches[chapterName].push(query);
            }
            byNaid.set(key, existing);
          }

          if (!result.hits.length || from + ROWS >= total) break;
        }

        searchLog.push({ seriesNaid: series.naid, seriesTitle: series.title, chapterName, query, total, returned, error });
      }
    }
  }

  const matches = [...byNaid.values()];
  const records = matches
    .map(toSiteRecord)
    .sort(
      (a, b) =>
        a.chapter.number - b.chapter.number ||
        a.sortDate.localeCompare(b.sortDate) ||
        a.title.localeCompare(b.title)
    );
  const json = JSON.stringify(records, null, 2);

  fs.writeFileSync(dataPath, `${json}\n`);
  fs.writeFileSync(dataScriptPath, `window.MEPP_RECORDS = ${json};\n`);
  fs.writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        volume: "Foreign Relations of the United States, 1989-1992, Volume XIV, Arab-Israeli Dispute",
        policy:
          "Direct sweep of Presidential Memcon and Telcon Files. Public site includes unrestricted item-level presidential conversations with online PDFs and visible MEPP topic signals in the catalog metadata.",
        series: SERIES,
        queryGroups: QUERY_GROUPS,
        eventWindows: EVENT_WINDOWS,
        searchLog,
        reviewedMatches: matches.length,
        recordsAdded: records.length,
        chapterCounts: records.reduce((counts, record) => {
          counts[record.chapter.name] = (counts[record.chapter.name] || 0) + 1;
          return counts;
        }, {}),
        records
      },
      null,
      2
    )}\n`
  );

  console.log(`Wrote ${records.length} presidential conversations to ${path.relative(repoRoot, dataPath)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
