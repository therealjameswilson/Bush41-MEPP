const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const recordsPath = path.join(repoRoot, "data", "records.json");
const recordsScriptPath = path.join(repoRoot, "data", "records.js");
const statementsPath = path.join(repoRoot, "data", "public-statements.json");
const statementsScriptPath = path.join(repoRoot, "data", "public-statements.js");
const reportPath = path.join(repoRoot, "reports", "public-private-linkage.json");

function parseDate(value) {
  return value ? Date.parse(`${value}T00:00:00Z`) : NaN;
}

function dayDiff(a, b) {
  const aTime = parseDate(a);
  const bTime = parseDate(b);
  if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 999;
  return Math.round(Math.abs(aTime - bTime) / 86400000);
}

function textFor(item) {
  return [
    item.title,
    item.compilerNote,
    item.compilerUse,
    item.chapter?.name,
    ...(item.people || []),
    ...(item.countries || []),
    ...(item.matchedQueries || [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function termOverlap(record, statement) {
  const recordTerms = new Set(
    [
      record.chapter?.name,
      ...(record.people || []),
      ...(record.countries || []),
      ...(record.matchedQueries || [])
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
  );
  const statementText = textFor(statement);
  return [...recordTerms].filter((term) => term.length > 3 && statementText.includes(term)).length;
}

function scoreLink(record, statement) {
  let score = 0;
  const diff = dayDiff(record.date, statement.date);
  if (diff === 0) score += 8;
  else if (diff <= 2) score += 5;
  else if (diff <= 7) score += 2;
  else return 0;

  if (record.chapter?.name === statement.chapter?.name) score += 4;
  if (record.eventId && record.eventId === eventIdFor(statement.date)) score += 2;
  score += Math.min(termOverlap(record, statement), 5);
  if (/Madrid|peace process|loan guarantee|settlement/i.test(`${record.title} ${statement.title}`)) score += 2;
  return score;
}

function eventIdFor(date) {
  if (!date) return "";
  if (date <= "1990-07-31") return "opening-phase";
  if (date <= "1991-03-31") return "gulf-war-linkage";
  if (date <= "1991-10-29") return "road-to-madrid";
  if (date <= "1991-11-03") return "madrid-conference";
  if (date <= "1992-06-22") return "post-madrid";
  return "israeli-transition";
}

function main() {
  const records = JSON.parse(fs.readFileSync(recordsPath, "utf8"));
  const statements = JSON.parse(fs.readFileSync(statementsPath, "utf8"));
  const statementLinks = new Map(statements.map((statement) => [statement.id, []]));
  let linkedRecords = 0;

  const linkedRecordsData = records.map((record) => {
    const links = statements
      .map((statement) => ({ statement, score: scoreLink(record, statement) }))
      .filter((link) => link.score >= 9)
      .sort((a, b) => b.score - a.score || a.statement.date.localeCompare(b.statement.date))
      .slice(0, 8);

    if (links.length) linkedRecords += 1;
    for (const link of links) {
      statementLinks.get(link.statement.id).push({ record, score: link.score });
    }

    return {
      ...record,
      relatedPublicStatementIds: links.map((link) => link.statement.id),
      publicChronologyLinks: links.map((link) => ({
        id: link.statement.id,
        title: link.statement.title,
        date: link.statement.date,
        relevance: link.statement.relevance,
        citation: link.statement.citation,
        pdfPageUrl: link.statement.pdfPageUrl,
        score: link.score
      }))
    };
  });

  const linkedStatementsData = statements.map((statement) => {
    const links = (statementLinks.get(statement.id) || [])
      .sort((a, b) => b.score - a.score || a.record.date.localeCompare(b.record.date))
      .slice(0, 8);
    return {
      ...statement,
      relatedRecordIds: links.map((link) => link.record.id),
      privateRecordLinks: links.map((link) => ({
        id: link.record.id,
        title: link.record.title,
        date: link.record.date,
        naid: link.record.naid,
        catalogUrl: link.record.catalogUrl,
        pdfUrl: link.record.pdfUrl,
        score: link.score
      }))
    };
  });

  const recordsJson = JSON.stringify(linkedRecordsData, null, 2);
  const statementsJson = JSON.stringify(linkedStatementsData, null, 2);
  fs.writeFileSync(recordsPath, `${recordsJson}\n`);
  fs.writeFileSync(recordsScriptPath, `window.MEPP_RECORDS = ${recordsJson};\n`);
  fs.writeFileSync(statementsPath, `${statementsJson}\n`);
  fs.writeFileSync(statementsScriptPath, `window.MEPP_PUBLIC_STATEMENTS = ${statementsJson};\n`);
  fs.writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        records: records.length,
        statements: statements.length,
        linkedRecords,
        linkedStatements: linkedStatementsData.filter((statement) => statement.relatedRecordIds?.length).length,
        exactDateRule: "Same date strongly preferred; same track/event and term overlap required for promotion."
      },
      null,
      2
    )}\n`
  );

  console.log(`Linked ${linkedRecords} records to public chronology references.`);
}

main();

