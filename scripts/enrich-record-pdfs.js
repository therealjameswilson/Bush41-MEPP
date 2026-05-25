const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { rebuildRecordSourceNote } = require("./frus-source-notes");

const repoRoot = path.resolve(__dirname, "..");
const dataPath = path.join(repoRoot, "data", "records.json");
const dataScriptPath = path.join(repoRoot, "data", "records.js");
const reportPath = path.join(repoRoot, "reports", "pdf-enrichment-report.json");
const cacheDir = path.join(repoRoot, ".cache", "record-pdfs");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function download(url, outputPath) {
  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) return;
  execFileSync("curl", [
    "-L",
    "--fail",
    "--retry",
    "4",
    "--retry-all-errors",
    "--silent",
    "--show-error",
    "--output",
    outputPath,
    url
  ]);
}

function pdfInfo(pdfPath) {
  const output = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  const info = {};
  for (const line of output.split(/\n/)) {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match) info[match[1].trim()] = match[2].trim();
  }
  return info;
}

function extractText(pdfPath, textPath) {
  if (!fs.existsSync(textPath) || fs.statSync(textPath).size === 0) {
    execFileSync("pdftotext", ["-layout", pdfPath, textPath], { stdio: "ignore" });
  }
  return fs.readFileSync(textPath, "utf8");
}

function uniqueMatches(text, patterns) {
  const matches = [];
  for (const [label, pattern] of patterns) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) matches.push(label);
  }
  return [...new Set(matches)];
}

function firstMatchingLine(text, patterns) {
  const lines = text.split(/\n/).map((line) => clean(line));
  return lines.find((line) => line && patterns.some((pattern) => pattern.test(line))) || "";
}

function textSnippets(text, patterns) {
  const lines = text.split(/\n/).map((line) => clean(line)).filter(Boolean);
  return lines
    .filter((line) => patterns.some((pattern) => pattern.test(line)))
    .slice(0, 6);
}

function enrichRecord(record) {
  const pdfPath = path.join(cacheDir, `${record.naid}.pdf`);
  const textPath = path.join(cacheDir, `${record.naid}.txt`);
  download(record.pdfUrl, pdfPath);
  const info = pdfInfo(pdfPath);
  const text = extractText(pdfPath, textPath);

  const classificationMarkers = uniqueMatches(text, [
    ["Top Secret", /\bTOP SECRET\b/i],
    ["Secret", /\bSECRET\b/i],
    ["Confidential", /\bCONFIDENTIAL\b/i],
    ["Sensitive", /\bSENSITIVE\b/i],
    ["Unclassified", /\bUNCLASSIFIED\b/i]
  ]);
  const redactionMarkers = uniqueMatches(text, [
    ["Declassified in part", /declassified in part/i],
    ["Sanitized", /\bsanitized\b/i],
    ["Excised/deleted text", /\[(?:excised|redacted|deleted|text not declassified)\]|excised|redacted|deleted/i],
    ["FOIA/PRA exemption", /\(b\)\([1-9]\)|\bb\([1-9]\)/i],
    ["Withdrawal marker", /withdrawal sheet|NA Form 1402[13]/i]
  ]);
  const participantLine = firstMatchingLine(text, [/participants?:/i, /subject:/i, /memorandum of conversation/i]);
  const dateTimeLine = firstMatchingLine(text, [/date,?\s*time/i, /time and place/i, /place:/i]);

  const enriched = {
    ...record,
    pageCount: Number(info.Pages || 0) || record.pageCount || null,
    pageCountBasis: info.Pages ? "pdfinfo" : record.pageCountBasis || "not measured",
    pdfReview: {
      status: "metadata-enriched",
      reviewedAt: new Date().toISOString(),
      pageCount: Number(info.Pages || 0) || null,
      pdfBytes: fs.statSync(pdfPath).size,
      textCharacters: text.length,
      classificationMarkers,
      redactionMarkers,
      participantLine,
      dateTimeLine,
      redactionSnippets: textSnippets(text, [/declassified in part/i, /\(b\)\([1-9]\)/i, /\bsanitized\b/i, /excised|redacted|deleted/i])
    }
  };
  const frusSourceNote = rebuildRecordSourceNote(enriched);
  return {
    ...enriched,
    sourceNote: frusSourceNote,
    frusSourceNote
  };
}

function main() {
  ensureDir(cacheDir);
  ensureDir(path.dirname(reportPath));
  const records = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const enriched = [];
  const errors = [];

  for (const record of records) {
    if (!record.pdfUrl) {
      enriched.push(record);
      errors.push({ id: record.id, naid: record.naid, error: "Missing PDF URL" });
      continue;
    }

    try {
      enriched.push(enrichRecord(record));
    } catch (error) {
      enriched.push({
        ...record,
        pdfReview: {
          status: "enrichment-error",
          reviewedAt: new Date().toISOString(),
          error: error.message
        }
      });
      errors.push({ id: record.id, naid: record.naid, error: error.message });
    }
  }

  const json = JSON.stringify(enriched, null, 2);
  fs.writeFileSync(dataPath, `${json}\n`);
  fs.writeFileSync(dataScriptPath, `window.MEPP_RECORDS = ${json};\n`);
  fs.writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        records: records.length,
        enriched: enriched.filter((record) => record.pdfReview?.status === "metadata-enriched").length,
        errors,
        pageCountTotal: enriched.reduce((sum, record) => sum + (Number(record.pageCount) || 0), 0),
        redactionMarkerRecords: enriched.filter((record) => record.pdfReview?.redactionMarkers?.length).length,
        classificationMarkerRecords: enriched.filter((record) => record.pdfReview?.classificationMarkers?.length).length
      },
      null,
      2
    )}\n`
  );

  console.log(`Enriched ${enriched.length - errors.length} records; ${errors.length} errors.`);
}

main();
