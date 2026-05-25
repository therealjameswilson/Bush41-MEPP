const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const cacheDir = path.join(repoRoot, ".cache");
const xmlPath = path.join(cacheDir, "baker-princeton-MC197.xml");
const bakerDataPath = path.join(repoRoot, "data", "baker-princeton-candidates.json");
const bakerScriptPath = path.join(repoRoot, "data", "baker-princeton-candidates.js");
const sourceCandidatesPath = path.join(repoRoot, "data", "source-candidates.json");
const sourceCandidatesScriptPath = path.join(repoRoot, "data", "source-candidates.js");
const reportPath = path.join(repoRoot, "reports", "baker-princeton-harvest.json");

const EAD_URL = "https://findingaids.princeton.edu/catalog/MC197.xml";
const COLLECTION_URL = "https://findingaids.princeton.edu/catalog/MC197";
const COLLECTION_ARK = "https://arks.princeton.edu/ark:/88435/tm70mv18x";

const TOPIC_PATTERNS = [
  ["Madrid", /\bMadrid\b/i],
  ["Middle East", /\bMiddle East\b/i],
  ["Middle East peace", /\bMiddle East Peace\b|\bpeace process\b/i],
  ["Arab-Israeli", /\bArab[-\s]Israeli\b/i],
  ["Israel", /\bIsrael(?:i)?\b|\bJerusalem\b|\bShamir\b|\bRabin\b|\bArens\b|\bLevy\b|\bShoval\b/i],
  ["Palestinian", /\bPalestinian(?:s)?\b|\bPLO\b|\bHusseini\b|\bAshrawi\b|\bArafat\b|\bWest Bank\b|\bGaza\b/i],
  ["Jordan", /\bJordan\b|\bJordanian\b|\bKing Hussein\b|\bAmman\b|\bAqaba\b|\bAllenby Bridge\b/i],
  ["Syria/Lebanon", /\bSyria\b|\bSyrian\b|\bAssad\b|\bDamascus\b|\bJabla\b|\bLebanon\b|\bLebanese\b|\bZahleh\b/i],
  ["Egypt/Arab regional", /\bEgypt\b|\bEgyptian\b|\bMubarak\b|\bCairo\b|\bAlexandria\b|\bSaudi\b|\bJeddah\b|\bRiyadh\b|\bTa'?if\b|\bKuwait\b|\bArab\b/i],
  ["Loan guarantees/settlements", /\bloan guarantees?\b|\bsettlements?\b/i]
];

const EXCLUDE_PATTERNS = [
  /\bHamilton Jordan\b/i,
  /\bBarbara Jordan\b/i,
  /\bSalute to Israel Parade\b/i,
  /\bState of Israel Bonds\b/i,
  /\bU\.S\.\/Saudi Joint Commission\b/i,
  /\bAmerican Businessmen's Group of Riyadh\b/i,
  /\bArab Boycott of Israel\b/i,
  /\bchildren's bio of Y\. Rabin\b/i,
  /\bPrincess Reema\b/i,
  /\b2004 Election\b/i
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function downloadFindingAid() {
  ensureDir(cacheDir);
  execFileSync("curl", ["-L", "--silent", "--show-error", "--fail", "--output", xmlPath, EAD_URL]);
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value) {
  return decodeXml(String(value || "").replace(/<[^>]+>/g, " "));
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`${name}="([^"]*)"`));
  return match?.[1] || "";
}

function firstTagText(xml, tagName) {
  const match = xml.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`));
  return stripTags(match?.[1] || "");
}

function unitDate(didXml) {
  const dateTag = didXml.match(/<unitdate\b[^>]*>[\s\S]*?<\/unitdate>/)?.[0] || "";
  const normal = attr(dateTag, "normal");
  return {
    label: firstTagText(didXml, "unitdate"),
    normal
  };
}

function containers(didXml) {
  return [...didXml.matchAll(/<container\b([^>]*)>([\s\S]*?)<\/container>/g)].map((match) => ({
    type: attr(match[0], "type"),
    label: attr(match[0], "label"),
    value: stripTags(match[2])
  }));
}

function componentText(componentXml) {
  return stripTags(componentXml);
}

function parseComponents(xml) {
  const components = [];
  const stack = [];
  const tagRe = /<\/?c\b[^>]*>/g;
  let match;

  while ((match = tagRe.exec(xml))) {
    const tag = match[0];
    if (tag.startsWith("</")) {
      const component = stack.pop();
      if (!component) continue;
      component.end = tagRe.lastIndex;
      component.xml = xml.slice(component.start, component.end);
      component.parentPath = stack.map((item) => item.title).filter(Boolean);
      components.push(component);
      continue;
    }

    const didEnd = xml.indexOf("</did>", tagRe.lastIndex);
    const didXml = didEnd > -1 ? xml.slice(tagRe.lastIndex, didEnd + "</did>".length) : "";
    stack.push({
      id: attr(tag, "id"),
      level: attr(tag, "level"),
      start: match.index,
      didXml,
      title: firstTagText(didXml, "unittitle")
    });
  }

  return components;
}

function scoreCandidate(component) {
  const text = componentText(component.xml);
  const ownText = componentText(component.didXml);
  if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(ownText))) return null;

  const pathText = component.parentPath.join(" > ");
  const searchableText = `${ownText} ${pathText}`;
  const matchedTerms = TOPIC_PATTERNS.filter(([, pattern]) => pattern.test(searchableText)).map(([label]) => label);
  const childOnlyTerms = TOPIC_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
  if (!matchedTerms.length && !childOnlyTerms.length) return null;

  const date = unitDate(component.didXml);
  const isLeafOrContainer = containers(component.didXml).length > 0 || !/<c\b/.test(component.xml.replace(component.didXml, ""));
  if (!isLeafOrContainer) return null;

  const title = component.title;
  const allText = `${title} ${pathText} ${date.label} ${ownText}`;
  const isCoreDate =
    /1989|1990|1991|1992/.test(date.label) ||
    /1989|1990|1991|1992/.test(date.normal) ||
    /Secretary of State|The Politics of Diplomacy|Audiovisual Materials/i.test(pathText);
  if (!isCoreDate && !/Chapter 29|Madrid|Arab[-\s]Israeli Peace Process/i.test(allText)) return null;

  const priority = priorityFor(allText, pathText, matchedTerms);
  return {
    priority,
    matchedTerms: [...new Set(matchedTerms.length ? matchedTerms : childOnlyTerms)]
  };
}

function priorityFor(text, pathText, matchedTerms) {
  if (/Middle East Peace Conference|Madrid|Arab[-\s]Israeli Peace Process|Chapter 29|loan guarantees?|settlements?/i.test(text)) {
    return "High";
  }
  if (/Secretary of State/i.test(pathText) && matchedTerms.length) return "High";
  if (/The Politics of Diplomacy|Audiovisual Materials/i.test(pathText)) return "Medium";
  return "Review";
}

function chapterFor(text) {
  if (/Madrid/i.test(text) && /Cairo|Jordan|Amman|Damascus|Jerusalem|Middle East Peace Conference/i.test(text)) {
    return "Madrid-Multilateral Track";
  }
  if (/loan guarantees?|settlements?|Shamir|Rabin|Arens|Levy|Shoval|Israel|Jerusalem/i.test(text)) return "Israel Track";
  if (/Palestinian|PLO|Husseini|Ashrawi|Arafat|West Bank|Gaza|Jordan|King Hussein/i.test(text)) {
    return "Palestinian-Jordanian Track";
  }
  if (/\bSyria\b|\bAssad\b|\bDamascus\b|\bJabla\b|\bLebanon\b|\bZahleh\b/i.test(text)) return "Syria-Lebanon Track";
  if (/Mubarak|Egypt|Cairo|Alexandria|Saudi|Jeddah|Riyadh|Ta'?if|Kuwait|Arab/i.test(text)) {
    return "Egypt-Arab Regional Track";
  }
  return "Madrid-Multilateral Track";
}

function candidateType(pathText, title) {
  if (/Speeches and Interviews/i.test(pathText)) return "Speech/interview file";
  if (/Correspondence/i.test(pathText)) return "Correspondence file";
  if (/The Politics of Diplomacy/i.test(pathText)) return "Memoir/research file";
  if (/Audiovisual Materials/i.test(pathText)) return "Audiovisual file";
  if (/Secretary of State/i.test(pathText)) return "Secretary of State file";
  if (/Chapter/i.test(title)) return "Chapter file";
  return "Archival file";
}

function displayTitleFor(component) {
  if (!/^(Baker Files|General Files)$/i.test(component.title)) return component.title;
  const relevantParent = [...component.parentPath]
    .reverse()
    .find((item) => /Chapter|Madrid|Middle East|Arab[-\s]Israeli|loan guarantees?|settlements?/i.test(item));
  return relevantParent ? `${relevantParent}: ${component.title}` : component.title;
}

function toCandidate(component, scoring) {
  const date = unitDate(component.didXml);
  const box = containers(component.didXml).filter((item) => item.type === "box").map((item) => item.value).join(", ");
  const folder = containers(component.didXml).filter((item) => item.type === "folder").map((item) => item.value).join(", ");
  const pathText = component.parentPath.join(" > ");
  const title = displayTitleFor(component);
  const fullText = `${title} ${pathText} ${date.label}`;
  return {
    id: `baker-princeton-${component.id}`,
    externalId: component.id,
    title,
    findingAidTitle: component.title,
    level: component.level,
    lane: "Baker Princeton Papers",
    chapter: chapterFor(fullText),
    priority: scoring.priority,
    repository: "Princeton University Library: Public Policy Papers",
    collection: "James A. Baker III Papers",
    collectionId: "MC197",
    collectionArk: COLLECTION_ARK,
    catalogUrl: `${COLLECTION_URL}#${component.id}`,
    findingAidXmlUrl: EAD_URL,
    sourceSeries: pathText,
    sourceSeriesNaid: "",
    localIdentifier: [box ? `Box ${box}` : "", folder ? `Folder ${folder}` : ""].filter(Boolean).join(", "),
    date: date.label,
    dateNormal: date.normal,
    matchedQueries: scoring.matchedTerms,
    matchedTerms: scoring.matchedTerms,
    hasDigitalObject: /<dao\b/i.test(component.didXml),
    digitalObjectUrl: component.didXml.match(/<dao\b[^>]*xlink:href="([^"]*)"/)?.[1] || "",
    documentType: candidateType(pathText, component.title),
    reason: `Princeton Baker Papers candidate for ${chapterFor(fullText)}; verify contents in Box/Folder before treating as FRUS evidence.`,
    sourceNote: `Source: Princeton University Library, Public Policy Papers, James A. Baker III Papers, MC197${box ? `, Box ${box}` : ""}${folder ? `, Folder ${folder}` : ""}, ${title}${date.label ? `, ${date.label}` : ""}. Folder-level source candidate; document-level classification, distribution, drafting, and place/time data require review.`
  };
}

function mergeSourceCandidates(existingCandidates, bakerCandidates) {
  const preservedCandidates = existingCandidates.filter(
    (candidate) => candidate.lane !== "Baker Princeton Papers" && !String(candidate.id || "").startsWith("baker-princeton-")
  );
  const byId = new Map(preservedCandidates.map((candidate) => [candidate.id, candidate]));
  for (const candidate of bakerCandidates) byId.set(candidate.id, candidate);
  return [...byId.values()].sort(
    (a, b) =>
      priorityRank(a.priority) - priorityRank(b.priority) ||
      String(a.lane).localeCompare(String(b.lane)) ||
      String(a.chapter).localeCompare(String(b.chapter)) ||
      String(a.title).localeCompare(String(b.title))
  );
}

function priorityRank(priority) {
  return priority === "High" ? 0 : priority === "Medium" ? 1 : priority === "Review" ? 2 : 3;
}

function writeJsonAndScript(jsonPath, scriptPath, globalName, value) {
  const json = JSON.stringify(value, null, 2);
  fs.writeFileSync(jsonPath, `${json}\n`);
  fs.writeFileSync(scriptPath, `window.${globalName} = ${json};\n`);
}

function main() {
  ensureDir(path.dirname(bakerDataPath));
  ensureDir(path.dirname(reportPath));
  downloadFindingAid();
  const xml = fs.readFileSync(xmlPath, "utf8");
  const components = parseComponents(xml);
  const bakerCandidates = components
    .filter((component) => component.level === "file")
    .map((component) => {
      const scoring = scoreCandidate(component);
      return scoring ? toCandidate(component, scoring) : null;
    })
    .filter(Boolean)
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.title.localeCompare(b.title));

  writeJsonAndScript(bakerDataPath, bakerScriptPath, "MEPP_BAKER_PRINCETON_CANDIDATES", bakerCandidates);

  const existingCandidates = fs.existsSync(sourceCandidatesPath)
    ? JSON.parse(fs.readFileSync(sourceCandidatesPath, "utf8"))
    : [];
  const merged = mergeSourceCandidates(existingCandidates, bakerCandidates);
  writeJsonAndScript(sourceCandidatesPath, sourceCandidatesScriptPath, "MEPP_SOURCE_CANDIDATES", merged);

  fs.writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: EAD_URL,
        collection: "James A. Baker III Papers, MC197",
        componentsParsed: components.length,
        fileComponents: components.filter((component) => component.level === "file").length,
        candidatesAdded: bakerCandidates.length,
        highPriority: bakerCandidates.filter((candidate) => candidate.priority === "High").length,
        mediumPriority: bakerCandidates.filter((candidate) => candidate.priority === "Medium").length,
        reviewPriority: bakerCandidates.filter((candidate) => candidate.priority === "Review").length,
        mergedSourceCandidates: merged.length,
        note:
          "Candidate list is title/finding-aid based. Each Box/Folder must be inspected before document-level FRUS inclusion."
      },
      null,
      2
    )}\n`
  );

  console.log(`Added ${bakerCandidates.length} Baker Princeton candidates; merged source-candidate total ${merged.length}.`);
}

main();
