const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const dataPath = path.join(repoRoot, "data", "source-candidates.json");
const dataScriptPath = path.join(repoRoot, "data", "source-candidates.js");
const reportPath = path.join(repoRoot, "reports", "source-candidate-review-enrichment.json");
const cacheDir = path.join(repoRoot, ".cache", "source-candidate-pdfs");
const manifestCacheDir = path.join(repoRoot, ".cache", "source-candidate-manifests");

const MAX_SOURCE_PDF_BYTES = Number(process.env.MAX_SOURCE_PDF_BYTES || 8_000_000);
const MAX_SOURCE_PDFS = Number(process.env.MAX_SOURCE_PDFS || 40);
const FETCH_TIMEOUT_MS = 30000;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function objectType(url) {
  const lower = String(url || "").toLowerCase();
  if (!lower) return "none";
  if (lower.includes("/manifest")) return "iiif-manifest";
  if (/\.pdf(?:\?|$)/i.test(lower)) return "pdf";
  if (/\.(?:jpg|jpeg|png|gif|tif|tiff)(?:\?|$)/i.test(lower)) return "image";
  return "digital-object";
}

function metadataText(candidate) {
  return clean(
    [
      candidate.title,
      candidate.reason,
      candidate.sourceNote,
      candidate.scopeAndContentNote,
      candidate.catalogTrail,
      candidate.repository,
      candidate.collection,
      candidate.sourceSeries,
      ...(candidate.matchedQueries || []),
      ...(candidate.matchedTerms || []),
      ...(candidate.evidenceSnippets || [])
    ].join(" ")
  );
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
  return lines.filter((line) => patterns.some((pattern) => pattern.test(line))).slice(0, 6);
}

function textReview(text) {
  return {
    classificationMarkers: uniqueMatches(text, [
      ["Top Secret", /\bTOP SECRET\b/i],
      ["Secret", /\bSECRET\b/i],
      ["Confidential", /\bCONFIDENTIAL\b/i],
      ["Sensitive", /\bSENSITIVE\b/i],
      ["Unclassified", /\bUNCLASSIFIED\b/i]
    ]),
    redactionMarkers: uniqueMatches(text, [
      ["Declassified in part", /declassified in part/i],
      ["Sanitized", /\bsanitized\b/i],
      ["Excised/deleted text", /\[(?:excised|redacted|deleted|text not declassified)\]|excised|redacted|deleted/i],
      ["FOIA/PRA exemption", /\(b\)\([1-9]\)|\bb\([1-9]\)/i],
      ["Withdrawal marker", /withdrawal sheet|NA Form 1402[13]/i]
    ]),
    participantLine: firstMatchingLine(text, [/participants?:/i, /subject:/i, /memorandum of conversation/i]),
    dateTimeLine: firstMatchingLine(text, [/date,?\s*time/i, /time and place/i, /place:/i]),
    redactionSnippets: textSnippets(text, [/declassified in part/i, /\(b\)\([1-9]\)/i, /\bsanitized\b/i, /excised|redacted|deleted/i])
  };
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function headLength(url) {
  const response = await fetchWithTimeout(url, { method: "HEAD" });
  if (!response.ok) throw new Error(`HEAD failed ${response.status}`);
  const length = Number(response.headers.get("content-length") || 0) || null;
  return {
    length,
    contentType: response.headers.get("content-type") || ""
  };
}

async function manifestPageCount(candidate) {
  ensureDir(manifestCacheDir);
  const safeId = String(candidate.id || candidate.externalId || candidate.naid || "manifest").replace(/[^a-z0-9_-]+/gi, "_");
  const manifestPath = path.join(manifestCacheDir, `${safeId}.json`);
  let json;
  if (fs.existsSync(manifestPath) && fs.statSync(manifestPath).size > 0) {
    json = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } else {
    const response = await fetchWithTimeout(candidate.digitalObjectUrl);
    if (!response.ok) throw new Error(`Manifest fetch failed ${response.status}`);
    json = await response.json();
    fs.writeFileSync(manifestPath, `${JSON.stringify(json, null, 2)}\n`);
  }
  const canvases = json.items || json.sequences?.[0]?.canvases || [];
  return canvases.length || null;
}

function download(url, outputPath) {
  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) return;
  execFileSync("curl", [
    "-L",
    "--fail",
    "--retry",
    "3",
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

function measuredPdfReview(candidate, pdfBytes) {
  ensureDir(cacheDir);
  const safeId = String(candidate.id || candidate.naid || "candidate").replace(/[^a-z0-9_-]+/gi, "_");
  const pdfPath = path.join(cacheDir, `${safeId}.pdf`);
  const textPath = path.join(cacheDir, `${safeId}.txt`);
  download(candidate.digitalObjectUrl, pdfPath);
  const info = pdfInfo(pdfPath);
  const text = extractText(pdfPath, textPath);
  const review = textReview(text);
  const pageCount = Number(info.Pages || 0) || null;
  return {
    status: "pdf-metadata-enriched",
    objectType: "pdf",
    pdfBytes: pdfBytes || fs.statSync(pdfPath).size,
    pageCount,
    pageCountBasis: info.Pages ? "pdfinfo" : "not measured",
    textCharacters: text.length,
    ...review,
    note: "PDF was downloaded to the local cache for page-count and OCR marker extraction."
  };
}

async function enrichCandidate(candidate, measuredState) {
  const reviewedAt = new Date().toISOString();
  const type = objectType(candidate.digitalObjectUrl);
  const fallbackReview = textReview(metadataText(candidate));

  if (type === "none") {
    return {
      ...candidate,
      reviewStatus: "finding-aid-review-required",
      pdfReview: {
        status: "finding-aid-review-required",
        reviewedAt,
        objectType: type,
        pageCount: null,
        pageCountBasis: "no digital object",
        textCharacters: metadataText(candidate).length,
        ...fallbackReview,
        note: "No linked digital object is exposed in the harvested metadata; inspect the cited box/folder or catalog record."
      }
    };
  }

  if (type === "iiif-manifest") {
    try {
      const pageCount = await manifestPageCount(candidate);
      return {
        ...candidate,
        pageCount,
        pageCountBasis: pageCount ? "iiif-manifest-canvases" : candidate.pageCountBasis,
        reviewStatus: "iiif-manifest-indexed",
        pdfReview: {
          status: "iiif-manifest-indexed",
          reviewedAt,
          objectType: type,
          pageCount,
          pageCountBasis: pageCount ? "iiif-manifest-canvases" : "not measured",
          textCharacters: metadataText(candidate).length,
          ...fallbackReview,
          note: "IIIF manifest was fetched and canvas count recorded; page images still need content review."
        }
      };
    } catch (error) {
      return {
        ...candidate,
        reviewStatus: "iiif-manifest-error",
        pdfReview: {
          status: "iiif-manifest-error",
          reviewedAt,
          objectType: type,
          pageCount: null,
          pageCountBasis: "manifest fetch failed",
          textCharacters: metadataText(candidate).length,
          ...fallbackReview,
          error: error.message
        }
      };
    }
  }

  if (type === "image") {
    return {
      ...candidate,
      pageCount: candidate.pageCount || 1,
      pageCountBasis: candidate.pageCountBasis || "image-object",
      reviewStatus: "image-object-indexed",
      pdfReview: {
        status: "image-object-indexed",
        reviewedAt,
        objectType: type,
        pageCount: 1,
        pageCountBasis: "image-object",
        textCharacters: metadataText(candidate).length,
        ...fallbackReview,
        note: "Single image object indexed; inspect image content before source selection."
      }
    };
  }

  if (type !== "pdf") {
    return {
      ...candidate,
      reviewStatus: "digital-object-review-required",
      pdfReview: {
        status: "digital-object-review-required",
        reviewedAt,
        objectType: type,
        pageCount: null,
        pageCountBasis: "unsupported digital object type",
        textCharacters: metadataText(candidate).length,
        ...fallbackReview,
        note: "Digital object exists but is not a PDF, IIIF manifest, or single image."
      }
    };
  }

  try {
    const head = await headLength(candidate.digitalObjectUrl);
    if (head.length && head.length <= MAX_SOURCE_PDF_BYTES && measuredState.count < MAX_SOURCE_PDFS) {
      measuredState.count += 1;
      const measured = measuredPdfReview(candidate, head.length);
      return {
        ...candidate,
        pageCount: measured.pageCount,
        pageCountBasis: measured.pageCountBasis,
        reviewStatus: measured.status,
        pdfReview: {
          reviewedAt,
          ...measured
        }
      };
    }

    const overByteLimit = Boolean(head.length && head.length > MAX_SOURCE_PDF_BYTES);
    const status = overByteLimit ? "deferred-large-pdf" : "deferred-pdf-measurement-limit";
    const pageCountBasis = overByteLimit
      ? `not downloaded; exceeds ${MAX_SOURCE_PDF_BYTES} byte enrichment limit`
      : `not downloaded; measured PDF count limit ${MAX_SOURCE_PDFS} reached`;
    return {
      ...candidate,
      reviewStatus: status,
      pdfReview: {
        status,
        reviewedAt,
        objectType: type,
        pdfBytes: head.length,
        contentType: head.contentType,
        pageCount: null,
        pageCountBasis,
        textCharacters: metadataText(candidate).length,
        ...fallbackReview,
        note: overByteLimit
          ? "PDF link was verified by HEAD request and deferred for compiler review because folder scans are large."
          : "PDF link was verified by HEAD request and deferred after the local measurement cap was reached."
      }
    };
  } catch (error) {
    return {
      ...candidate,
      reviewStatus: "pdf-review-error",
      pdfReview: {
        status: "pdf-review-error",
        reviewedAt,
        objectType: type,
        pageCount: null,
        pageCountBasis: "PDF HEAD/download failed",
        textCharacters: metadataText(candidate).length,
        ...fallbackReview,
        error: error.message
      }
    };
  }
}

function writeJsonAndScript(value) {
  const json = JSON.stringify(value, null, 2);
  fs.writeFileSync(dataPath, `${json}\n`);
  fs.writeFileSync(dataScriptPath, `window.MEPP_SOURCE_CANDIDATES = ${json};\n`);
}

async function main() {
  ensureDir(cacheDir);
  ensureDir(path.dirname(reportPath));

  const candidates = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const measuredState = { count: 0 };
  const enriched = [];

  for (const candidate of candidates) {
    enriched.push(await enrichCandidate(candidate, measuredState));
  }

  writeJsonAndScript(enriched);

  const counts = enriched.reduce((acc, candidate) => {
    const status = candidate.pdfReview?.status || "missing";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  fs.writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        candidates: enriched.length,
        reviewed: enriched.filter((candidate) => candidate.pdfReview).length,
        pdfCandidates: enriched.filter((candidate) => objectType(candidate.digitalObjectUrl) === "pdf").length,
        pageCounted: enriched.filter((candidate) => Number(candidate.pageCount) > 0).length,
        measuredPdfLimitBytes: MAX_SOURCE_PDF_BYTES,
        measuredPdfLimitCount: MAX_SOURCE_PDFS,
        measuredPdfs: enriched.filter((candidate) => candidate.pdfReview?.status === "pdf-metadata-enriched").length,
        deferredLargePdfs: enriched.filter((candidate) => candidate.pdfReview?.status === "deferred-large-pdf").length,
        deferredMeasurementLimitPdfs: enriched.filter((candidate) => candidate.pdfReview?.status === "deferred-pdf-measurement-limit").length,
        statusCounts: counts,
        errors: enriched
          .filter((candidate) => /error/i.test(candidate.pdfReview?.status || ""))
          .map((candidate) => ({ id: candidate.id, naid: candidate.naid, status: candidate.pdfReview.status, error: candidate.pdfReview.error }))
      },
      null,
      2
    )}\n`
  );

  console.log(
    `Reviewed ${enriched.length} source candidates; measured ${measuredState.count} PDFs; page counts available for ${enriched.filter((candidate) => Number(candidate.pageCount) > 0).length}.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
