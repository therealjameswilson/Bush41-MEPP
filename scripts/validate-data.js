const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const dataDir = path.join(repoRoot, "data");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertUnique(items, key, label) {
  const seen = new Set();
  for (const item of items) {
    const value = item[key];
    assert(value, `${label} missing ${key}`);
    assert(!seen.has(value), `${label} duplicate ${key}: ${value}`);
    seen.add(value);
  }
}

function main() {
  const records = readJson("records.json");
  const statements = readJson("public-statements.json");
  const persons = readJson("persons.json");
  const events = readJson("events.json");
  const gaps = readJson("compiler-gaps.json");
  const sourceLeads = readJson("source-leads.json");
  const sourceCandidates = readJson("source-candidates.json");
  const bakerPrincetonCandidates = readJson("baker-princeton-candidates.json");
  const haassChronologicalCandidates = readJson("haass-chronological-candidates.json");

  assert(records.length >= 100, `Expected at least 100 records; found ${records.length}`);
  assert(statements.length >= 100, `Expected at least 100 public statements; found ${statements.length}`);
  assert(persons.length >= 10, `Expected at least 10 persons; found ${persons.length}`);
  assert(events.length >= 6, `Expected at least 6 events; found ${events.length}`);
  assert(gaps.length >= 6, `Expected at least 6 compiler gaps; found ${gaps.length}`);
  assert(sourceLeads.length >= 6, `Expected at least 6 source leads; found ${sourceLeads.length}`);
  assert(sourceCandidates.length >= 10, `Expected at least 10 source candidates; found ${sourceCandidates.length}`);
  assert(
    bakerPrincetonCandidates.length >= 10,
    `Expected at least 10 Baker Princeton candidates; found ${bakerPrincetonCandidates.length}`
  );
  assert(
    haassChronologicalCandidates.length >= 100,
    `Expected at least 100 Haass chronological candidates; found ${haassChronologicalCandidates.length}`
  );

  assertUnique(records, "id", "records");
  assertUnique(statements, "id", "public statements");
  assertUnique(persons, "name", "persons");
  assertUnique(sourceCandidates, "id", "source candidates");
  assertUnique(bakerPrincetonCandidates, "id", "Baker Princeton candidates");
  assertUnique(haassChronologicalCandidates, "id", "Haass chronological candidates");

  const missingPdf = records.filter((record) => !record.pdfUrl || !record.catalogUrl || !record.frusSourceNote);
  assert(missingPdf.length === 0, `${missingPdf.length} records missing PDF/catalog/source-note basics`);

  const missingPageCounts = records.filter((record) => !(Number(record.pageCount) > 0));
  assert(missingPageCounts.length === 0, `${missingPageCounts.length} records missing PDF page counts`);

  const linkedRecords = records.filter((record) => record.relatedPublicStatementIds?.length);
  const linkedStatements = statements.filter((statement) => statement.relatedRecordIds?.length);
  assert(linkedRecords.length >= 25, `Expected at least 25 linked records; found ${linkedRecords.length}`);
  assert(linkedStatements.length >= 25, `Expected at least 25 linked public statements; found ${linkedStatements.length}`);

  const gapsWithoutStatus = gaps.filter((gap) => !gap.status);
  assert(gapsWithoutStatus.length === 0, `${gapsWithoutStatus.length} gaps missing remediation status`);

  const missingBakerContext = bakerPrincetonCandidates.filter(
    (candidate) => !candidate.localIdentifier || !candidate.sourceSeries || !candidate.sourceNote
  );
  assert(missingBakerContext.length === 0, `${missingBakerContext.length} Baker Princeton candidates missing box/folder/source context`);

  const mergedBakerCandidates = sourceCandidates.filter((candidate) => candidate.lane === "Baker Princeton Papers");
  assert(
    mergedBakerCandidates.length === bakerPrincetonCandidates.length,
    `Merged source-candidate list has ${mergedBakerCandidates.length} Baker Princeton candidates; expected ${bakerPrincetonCandidates.length}`
  );

  const missingHaassContext = haassChronologicalCandidates.filter(
    (candidate) =>
      candidate.sourceSeriesNaid !== "2554857" ||
      !candidate.localIdentifier ||
      !candidate.sourceNote ||
      !candidate.digitalObjectUrl
  );
  assert(missingHaassContext.length === 0, `${missingHaassContext.length} Haass chronological candidates missing source context`);

  const mergedHaassCandidates = sourceCandidates.filter((candidate) => candidate.lane === "Richard Haass Chronological Files");
  assert(
    mergedHaassCandidates.length === haassChronologicalCandidates.length,
    `Merged source-candidate list has ${mergedHaassCandidates.length} Haass chronological candidates; expected ${haassChronologicalCandidates.length}`
  );

  const report = {
    records: records.length,
    statements: statements.length,
    persons: persons.length,
    events: events.length,
    gaps: gaps.length,
    sourceLeads: sourceLeads.length,
    sourceCandidates: sourceCandidates.length,
    bakerPrincetonCandidates: bakerPrincetonCandidates.length,
    haassChronologicalCandidates: haassChronologicalCandidates.length,
    linkedRecords: linkedRecords.length,
    linkedStatements: linkedStatements.length,
    pages: records.reduce((sum, record) => sum + (Number(record.pageCount) || 0), 0)
  };

  console.log(JSON.stringify(report, null, 2));
}

main();
