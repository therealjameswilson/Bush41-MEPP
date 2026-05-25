function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeCollectionTitle(value) {
  const title = clean(value);
  if (/Records of the National Security Council/i.test(title)) {
    return "Bush Presidential Records, National Security Council";
  }
  return title;
}

function ancestor(record, level) {
  return (record.ancestors || []).find((item) => item.levelOfDescription === level);
}

function classificationSentence(markers = [], options = {}) {
  const order = ["Top Secret", "Secret", "Confidential", "Sensitive", "Unclassified"];
  const unique = [...new Set(markers)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  if (!unique.length) return options.verified ? "No classification marking." : "Classification marking requires PDF verification.";
  if (unique.includes("Unclassified") && unique.length === 1) return "Unclassified.";
  return `${unique.join("; ")}.`;
}

function reviewSentence(markers = []) {
  if (!markers.length) return "";
  if (markers.some((marker) => /declassified in part|sanitized|excised|deleted|withdrawal|exemption/i.test(marker))) {
    return `PDF review markers: ${markers.join(", ")}.`;
  }
  return "";
}

function sourceLocation({ collectionTitle, seriesTitle, folderTitle }) {
  const pathParts = [
    "Source: George H.W. Bush Library",
    normalizeCollectionTitle(collectionTitle),
    seriesTitle,
    folderTitle
  ].filter(Boolean);

  return `${pathParts.join(", ")}.`;
}

function buildFrusSourceNote({
  collectionTitle,
  seriesTitle,
  folderTitle,
  classificationMarkers = [],
  redactionMarkers = []
}) {
  const location = sourceLocation({ collectionTitle, seriesTitle, folderTitle });
  return [
    location,
    classificationSentence(classificationMarkers),
    reviewSentence(redactionMarkers),
    "Distribution, drafting, and place/time data require PDF verification."
  ]
    .filter(Boolean)
    .join(" ");
}

function rebuildRecordSourceNote(record) {
  return [
    record.sourceNoteLocation || record.sourceNote?.match(/^Source:.*?\./)?.[0] || record.frusSourceNote?.match(/^Source:.*?\./)?.[0] || "",
    classificationSentence(record.pdfReview?.classificationMarkers || [], { verified: Boolean(record.pdfReview) }),
    reviewSentence(record.pdfReview?.redactionMarkers || []),
    "Distribution, drafting, and place/time data require PDF verification."
  ]
    .filter(Boolean)
    .join(" ");
}

function buildCatalogTrail({
  catalogUrl,
  seriesUrl,
  folderUrl,
  objectFilename,
  objectId,
  objectUrl,
  catalogSubjects,
  accessRestriction
}) {
  return [
    catalogUrl ? `Catalog URL: ${catalogUrl}.` : "",
    seriesUrl ? `Series URL: ${seriesUrl}.` : "",
    folderUrl ? `Folder URL: ${folderUrl}.` : "",
    objectFilename || objectUrl
      ? `Digital object: ${[objectFilename, objectId ? `object ID ${objectId}` : "", objectUrl ? `URL ${objectUrl}` : ""]
          .filter(Boolean)
          .join(", ")}.`
      : "",
    catalogSubjects ? `Catalog subjects: ${catalogSubjects}.` : "",
    accessRestriction ? `Access restriction: ${accessRestriction}.` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function notesFromCatalogRecord(record, series, object) {
  const collection = ancestor(record, "collection");
  const folder = ancestor(record, "fileUnit");
  const catalogSubjects = (record.subjects || []).map((subject) => subject.heading).filter(Boolean).join(", ");
  const accessRestriction = record.accessRestriction?.status || "";
  const catalogUrl = `https://catalog.archives.gov/id/${record.naId}`;
  const seriesUrl = `https://catalog.archives.gov/id/${series.naid}`;
  const folderUrl = folder?.naId ? `https://catalog.archives.gov/id/${folder.naId}` : "";

  return {
    sourceNoteLocation: sourceLocation({
      collectionTitle: collection?.title || "Records of the National Security Council (George H. W. Bush Administration)",
      seriesTitle: series.title,
      folderTitle: folder?.title || ""
    }),
    sourceNote: buildFrusSourceNote({
      collectionTitle: collection?.title || "Records of the National Security Council (George H. W. Bush Administration)",
      seriesTitle: series.title,
      folderTitle: folder?.title || "",
      accessRestriction
    }),
    catalogTrail: buildCatalogTrail({
      catalogUrl,
      seriesUrl,
      folderUrl,
      objectFilename: object?.objectFilename || "",
      objectId: object?.objectId || "",
      objectUrl: object?.objectUrl || "",
      catalogSubjects,
      accessRestriction
    })
  };
}

module.exports = { buildFrusSourceNote, notesFromCatalogRecord, rebuildRecordSourceNote };
