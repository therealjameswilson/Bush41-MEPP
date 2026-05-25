const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const dataDir = path.join(repoRoot, "data");

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  const records = readJson("records.json");
  const sourceCandidates = readJson("source-candidates.json");

  const badRecordNotes = records.filter((record) => {
    const note = record.frusSourceNote || record.sourceNote || "";
    return (
      !note.startsWith("Source: ") ||
      /Declassified copy released through|Access restriction:|Catalog URL:|Series URL:|Digital object:/i.test(note) ||
      !/(Top Secret|Secret|Confidential|Sensitive|Unclassified|No classification marking|Classification marking requires PDF verification)\./.test(note)
    );
  });
  assert(badRecordNotes.length === 0, `${badRecordNotes.length} presidential records have non-FRUS-style source notes`);

  const badCandidateNotes = sourceCandidates.filter((candidate) => {
    const note = candidate.sourceNote || "";
    return !note.startsWith("Source: ") || /^Source candidate:/i.test(note);
  });
  assert(badCandidateNotes.length === 0, `${badCandidateNotes.length} source candidates have non-FRUS-style source notes`);

  const report = {
    records: records.length,
    sourceCandidates: sourceCandidates.length,
    recordNotesChecked: records.filter((record) => record.frusSourceNote || record.sourceNote).length,
    candidateNotesChecked: sourceCandidates.filter((candidate) => candidate.sourceNote).length
  };
  console.log(JSON.stringify(report, null, 2));
}

main();
