const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const dataDir = path.join(repoRoot, "data");

const SOURCE_NOTE_FILES = [
  { file: "source-candidates.json", label: "merged source candidates" },
  { file: "baker-princeton-candidates.json", label: "Baker Princeton candidates" },
  { file: "haass-chronological-candidates.json", label: "Haass chronological candidates" },
  { file: "haass-target-series-candidates.json", label: "targeted Haass series candidates" },
  { file: "gap-remediation-candidates.json", label: "gap-remediation candidates" },
  { file: "daily-diary-candidates.json", label: "daily diary/backup candidates" }
];

const BANNED_SOURCE_NOTE_TEXT =
  /Declassified copy released through|Access restriction:|Catalog URL:|Series URL:|Digital object:|Catalog control:|https?:\/\//i;
const RECORD_STATUS_TEXT =
  /(?:Top Secret|Secret|Confidential|Sensitive|Unclassified)(?:; [^.]+)?|No classification marking|Classification marking requires PDF verification/;
const STATUS_MARKER = new RegExp(`\\.\\s+(?:Folder-level source candidate;|${RECORD_STATUS_TEXT.source}\\.)`);
const RECORD_STATUS_SENTENCE = new RegExp(`\\.\\s+(?:${RECORD_STATUS_TEXT.source})\\.`);
const FOLDER_LEVEL_REVIEW_SENTENCE =
  /\. Folder-level source candidate; document-level classification, distribution, drafting, and place\/time data require review\.$/;
const RECORD_PDF_REVIEW_SENTENCE = /Distribution, drafting, and place\/time data require PDF verification\.$/;
const REPOSITORY_RE = /^Source: (?:George H\.W\. Bush Library|Princeton University Library|Department of State|National Archives)/;
const COLLECTION_RE =
  /Bush Presidential Records|Brent Scowcroft Papers|Records of the White House|White House Office of Records Management|Public Policy Papers|James A\. Baker III Papers|National Security Council|Presidential (?:Memcon|Telcon) Files|Department of State/;

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function idFor(item, index) {
  return item.id || item.naid || `row ${index + 1}`;
}

function noteFor(item) {
  return item.frusSourceNote || item.sourceNote || "";
}

function sourceProvenance(note) {
  const match = note.match(STATUS_MARKER);
  if (!match) return "";
  return note.slice("Source: ".length, match.index).trim();
}

function hasRepositoryLedProvenance(note) {
  const provenance = sourceProvenance(note);
  return (
    Boolean(provenance) &&
    REPOSITORY_RE.test(note) &&
    COLLECTION_RE.test(provenance) &&
    provenance.split(",").map((part) => part.trim()).filter(Boolean).length >= 3
  );
}

function candidateSourceNoteIssues(candidate, index, label) {
  const note = noteFor(candidate);
  const issues = [];
  if (!note.startsWith("Source: ")) issues.push("missing Source prefix");
  if (/^Source candidate:/i.test(note)) issues.push("uses Source candidate prefix");
  if (BANNED_SOURCE_NOTE_TEXT.test(note)) issues.push("contains catalog/web boilerplate");
  if (!hasRepositoryLedProvenance(note)) issues.push("does not lead with repository/collection provenance");
  if (!FOLDER_LEVEL_REVIEW_SENTENCE.test(note) && !RECORD_STATUS_SENTENCE.test(note)) {
    issues.push("missing classification/status or folder-level review sentence");
  }
  return issues.length ? { label, id: idFor(candidate, index), issues, note } : null;
}

function main() {
  const records = readJson("records.json");

  const badRecordNotes = records
    .map((record, index) => {
      const note = noteFor(record);
      const issues = [];
      if (!note.startsWith("Source: ")) issues.push("missing Source prefix");
      if (BANNED_SOURCE_NOTE_TEXT.test(note)) issues.push("contains catalog/web boilerplate");
      if (!hasRepositoryLedProvenance(note)) issues.push("does not lead with repository/collection provenance");
      if (!/Bush Presidential Records/.test(note) || !/National Security Council/.test(note)) {
        issues.push("missing Bush Library/NSC archival path");
      }
      if (!/Presidential (?:Memcon|Telcon) Files/.test(note)) issues.push("missing presidential conversation file series");
      if (!RECORD_STATUS_SENTENCE.test(note)) issues.push("missing original classification/status sentence");
      if (!RECORD_PDF_REVIEW_SENTENCE.test(note)) issues.push("missing PDF verification caveat");
      if (record.sourceNoteLocation && !note.startsWith(record.sourceNoteLocation)) {
        issues.push("sourceNoteLocation no longer matches source-note provenance");
      }
      return issues.length ? { label: "presidential records", id: idFor(record, index), issues, note } : null;
    })
    .filter(Boolean);
  assert(
    badRecordNotes.length === 0,
    `${badRecordNotes.length} presidential records have non-FRUS-style source notes:\n${badRecordNotes
      .slice(0, 10)
      .map((item) => `${item.id}: ${item.issues.join("; ")}`)
      .join("\n")}`
  );

  const candidateReports = SOURCE_NOTE_FILES.map(({ file, label }) => {
    const items = readJson(file);
    const badNotes = items.map((item, index) => candidateSourceNoteIssues(item, index, label)).filter(Boolean);
    return { file, label, items, badNotes };
  });

  const badCandidateNotes = candidateReports.flatMap((report) => report.badNotes);
  assert(
    badCandidateNotes.length === 0,
    `${badCandidateNotes.length} source candidates have non-FRUS-style source notes:\n${badCandidateNotes
      .slice(0, 15)
      .map((item) => `${item.label} ${item.id}: ${item.issues.join("; ")}`)
      .join("\n")}`
  );

  const report = {
    standard:
      "FRUS-style notes lead with repository/collection/file provenance, then original classification/status and drafting/distribution/place-time context; catalog URLs and NAIDs stay in structured metadata.",
    records: records.length,
    sourceCandidates: candidateReports.find((report) => report.file === "source-candidates.json").items.length,
    recordNotesChecked: records.filter((record) => record.frusSourceNote || record.sourceNote).length,
    candidateNotesChecked: candidateReports.reduce(
      (sum, report) => sum + report.items.filter((candidate) => candidate.sourceNote).length,
      0
    ),
    candidateFilesChecked: candidateReports.map((report) => ({
      file: report.file,
      notes: report.items.filter((candidate) => candidate.sourceNote).length
    }))
  };
  console.log(JSON.stringify(report, null, 2));
}

main();
