const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const dataDir = path.join(repoRoot, "data");
const reportDir = path.join(repoRoot, "reports");

function readJson(file, fallback = []) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
  } catch {
    return fallback;
  }
}

function writeData(name, globalName, value) {
  const json = JSON.stringify(value, null, 2);
  fs.writeFileSync(path.join(dataDir, `${name}.json`), `${json}\n`);
  fs.writeFileSync(path.join(dataDir, `${name}.js`), `window.${globalName} = ${json};\n`);
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function textFor(item) {
  return clean(
    [
      item.title,
      item.documentTitle,
      item.compilerNote,
      item.compilerUse,
      item.sourceNote,
      item.catalogTrail,
      item.chapter?.name,
      ...(item.people || []),
      ...(item.countries || []),
      ...(item.matchedQueries || [])
    ].join(" ")
  );
}

function sourceCandidateText(candidate) {
  return clean(
    [
      candidate.title,
      candidate.chapter,
      candidate.lane,
      candidate.sourceSeries,
      candidate.collection,
      candidate.repository,
      candidate.sourceNote,
      ...(candidate.matchedQueries || [])
    ].join(" ")
  );
}

function sourceCandidateTrackCount(candidates, track, aliases) {
  return candidates.filter((candidate) => {
    if (candidate.chapter === track || String(candidate.lane || "").includes(track)) return true;
    const text = sourceCandidateText(candidate);
    return aliases.some((pattern) => pattern.test(text));
  }).length;
}

function countHits(items, aliases) {
  const patterns = aliases.map((alias) => new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"));
  return items.filter((item) => patterns.some((pattern) => pattern.test(textFor(item)))).length;
}

function eventCounts(records, statements, id) {
  return {
    records: records.filter((record) => record.eventId === id).length,
    publicStatements: statements.filter((statement) => eventIdFor(statement.date) === id).length
  };
}

function eventIdFor(date) {
  if (!date) return "opening-phase";
  if (date <= "1990-07-31") return "opening-phase";
  if (date <= "1991-03-31") return "gulf-war-linkage";
  if (date <= "1991-10-29") return "road-to-madrid";
  if (date <= "1991-11-03") return "madrid-conference";
  if (date <= "1992-06-22") return "post-madrid";
  return "israeli-transition";
}

function main() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(reportDir, { recursive: true });

  const records = readJson("records.json");
  const statements = readJson("public-statements.json");
  const sourceCandidates = readJson("source-candidates.json");
  const bakerPrincetonCandidates = readJson("baker-princeton-candidates.json");
  const haassChronologicalCandidates = readJson("haass-chronological-candidates.json");
  const haassTargetSeriesCandidates = readJson("haass-target-series-candidates.json");
  const gapRemediationCandidates = readJson("gap-remediation-candidates.json");
  const dailyDiaryCandidates = readJson("daily-diary-candidates.json");
  const haassTargetLanes = new Set(haassTargetSeriesCandidates.map((candidate) => candidate.lane));
  const gapRemediationLanes = new Set(gapRemediationCandidates.map((candidate) => candidate.lane));
  const baseNaraSourceCandidates = sourceCandidates.filter(
    (candidate) =>
      !["Baker Princeton Papers", "Richard Haass Chronological Files", "Presidential Daily Diary/Backup"].includes(candidate.lane) &&
      !haassTargetLanes.has(candidate.lane) &&
      !gapRemediationLanes.has(candidate.lane)
  );
  const pageCountedRecords = records.filter((record) => Number(record.pageCount) > 0).length;
  const redactionMarkerRecords = records.filter((record) => record.pdfReview?.redactionMarkers?.length).length;
  const reviewedSourceCandidates = sourceCandidates.filter((candidate) => candidate.pdfReview?.status).length;
  const pageCountedSourceCandidates = sourceCandidates.filter((candidate) => Number(candidate.pageCount) > 0).length;
  const deferredSourceCandidatePdfs = sourceCandidates.filter((candidate) => /^deferred-/i.test(candidate.pdfReview?.status || "")).length;
  const candidateReviewErrors = sourceCandidates.filter((candidate) => /error/i.test(candidate.pdfReview?.status || "")).length;
  const linkedRecords = records.filter((record) => record.relatedPublicStatementIds?.length).length;
  const linkedStatements = statements.filter((statement) => statement.relatedRecordIds?.length).length;
  const highPrioritySourceCandidates = baseNaraSourceCandidates.filter((candidate) => candidate.priority === "High").length;
  const palestinianSourceCandidateCount = sourceCandidateTrackCount(sourceCandidates, "Palestinian-Jordanian Track", [
    /\bPalestinian(?:s)?\b/i,
    /\bPLO\b/i,
    /\bHusseini\b/i,
    /\bAshrawi\b/i,
    /\bArafat\b/i,
    /\bWest Bank\b/i,
    /\bGaza\b/i,
    /\bJordan(?:ian)?\b/i,
    /\bKing Hussein\b/i
  ]);
  const syriaLebanonSourceCandidateCount = sourceCandidateTrackCount(sourceCandidates, "Syria-Lebanon Track", [
    /\bSyria(?:n)?\b/i,
    /\bAssad\b/i,
    /\bDamascus\b/i,
    /\bLebanon\b/i,
    /\bLebanese\b/i
  ]);

  const curatedPeople = [
    {
      name: "George H.W. Bush",
      role: "President of the United States",
      country: "United States",
      aliases: ["George H.W. Bush", "President Bush", "the President", "Bush"],
      chapter: "Madrid-Multilateral Track",
      compilerUse: "Decision-maker for Madrid, loan guarantees, coalition diplomacy, and Israeli restraint questions."
    },
    {
      name: "James A. Baker III",
      role: "Secretary of State",
      country: "United States",
      aliases: ["James A. Baker", "Baker"],
      chapter: "Madrid-Multilateral Track",
      compilerUse: "Primary shuttle-diplomacy actor; essential bridge to State Department files and meeting memoranda."
    },
    {
      name: "Brent Scowcroft",
      role: "Assistant to the President for National Security Affairs",
      country: "United States",
      aliases: ["Brent Scowcroft", "Scowcroft"],
      chapter: "Madrid-Multilateral Track",
      compilerUse: "NSC process, presidential briefing, and declassification trail anchor."
    },
    {
      name: "Dennis Ross",
      role: "Director, Policy Planning Staff; Middle East peace adviser",
      country: "United States",
      aliases: ["Dennis Ross", "Ross"],
      chapter: "Madrid-Multilateral Track",
      compilerUse: "Likely source-file target for negotiation strategy, invitations, and bilateral track memoranda."
    },
    {
      name: "Yitzhak Shamir",
      role: "Prime Minister of Israel",
      country: "Israel",
      aliases: ["Yitzhak Shamir", "Shamir"],
      chapter: "Israel Track",
      compilerUse: "Central Israeli counterpart through Madrid and loan-guarantee disputes."
    },
    {
      name: "Yitzhak Rabin",
      role: "Prime Minister of Israel from July 1992",
      country: "Israel",
      aliases: ["Yitzhak Rabin", "Rabin"],
      chapter: "Israel Track",
      compilerUse: "Late-volume transition point and handoff to the Oslo-era policy record."
    },
    {
      name: "Shimon Peres",
      role: "Israeli Labor leader and former Prime Minister",
      country: "Israel",
      aliases: ["Shimon Peres", "Peres"],
      chapter: "Israel Track",
      compilerUse: "Opposition and later government context for Israeli political transition."
    },
    {
      name: "Moshe Arens",
      role: "Foreign Minister and Defense Minister of Israel",
      country: "Israel",
      aliases: ["Moshe Arens", "Arens"],
      chapter: "Israel Track",
      compilerUse: "Israeli security and diplomatic channel in early Bush administration contacts."
    },
    {
      name: "King Hussein",
      role: "King of Jordan",
      country: "Jordan",
      aliases: ["King Hussein", "Hussein of Jordan"],
      chapter: "Palestinian-Jordanian Track",
      compilerUse: "Jordanian-Palestinian delegation formula, Madrid positioning, and regional diplomacy."
    },
    {
      name: "Yasir Arafat",
      role: "Chairman of the Palestine Liberation Organization",
      country: "Palestinians",
      aliases: ["Yasir Arafat", "Arafat", "PLO"],
      chapter: "Palestinian-Jordanian Track",
      compilerUse: "Indirect diplomatic channel and PLO recognition constraints."
    },
    {
      name: "Hafez al-Assad",
      role: "President of Syria",
      country: "Syria",
      aliases: ["Hafez Assad", "Hafez al-Assad", "Assad"],
      chapter: "Syria-Lebanon Track",
      compilerUse: "Syria track, Lebanon implications, Madrid participation, and coalition diplomacy."
    },
    {
      name: "Hosni Mubarak",
      role: "President of Egypt",
      country: "Egypt",
      aliases: ["Hosni Mubarak", "Mubarak"],
      chapter: "Egypt-Arab Regional Track",
      compilerUse: "Egyptian mediation, Arab-state positioning, and postwar peace-process support."
    },
    {
      name: "Amre Mousa",
      role: "Foreign Minister of Egypt",
      country: "Egypt",
      aliases: ["Amre Mousa", "Mousa"],
      chapter: "Egypt-Arab Regional Track",
      compilerUse: "Foreign-minister channel around Madrid and Arab diplomatic coordination."
    },
    {
      name: "King Fahd",
      role: "King of Saudi Arabia",
      country: "Saudi Arabia",
      aliases: ["King Fahd", "Fahd"],
      chapter: "Egypt-Arab Regional Track",
      compilerUse: "Saudi support, Gulf War linkage, and Arab coalition setting for the peace process."
    },
    {
      name: "Javier Perez de Cuellar",
      role: "Secretary-General of the United Nations",
      country: "United Nations",
      aliases: ["Perez de Cuellar", "Javier Perez de Cuellar"],
      chapter: "Madrid-Multilateral Track",
      compilerUse: "UN reference point for Arab-Israeli diplomacy and regional settlement language."
    }
  ];

  const persons = curatedPeople
    .map((person) => ({
      ...person,
      recordHits: countHits(records, person.aliases),
      publicStatementHits: countHits(statements, person.aliases),
      sourceTypes: [
        countHits(records, person.aliases) ? "Presidential conversations" : "",
        countHits(statements, person.aliases) ? "Public Papers" : "",
        "Compiler lead"
      ].filter(Boolean)
    }))
    .sort((a, b) => b.recordHits + b.publicStatementHits - (a.recordHits + a.publicStatementHits) || a.name.localeCompare(b.name));

  const events = [
    {
      id: "opening-phase",
      label: "Opening Phase",
      dateSpan: "January 20, 1989-July 31, 1990",
      chapter: "Madrid-Multilateral Track",
      summary: "Early administration positioning, Baker's regional approach, Israeli leadership contacts, and pre-Kuwait-crisis Arab diplomacy.",
      compilerFocus: "Establish the policy baseline before the Gulf crisis changed the regional bargaining environment."
    },
    {
      id: "gulf-war-linkage",
      label: "Gulf War Linkage",
      dateSpan: "August 1, 1990-March 31, 1991",
      chapter: "Egypt-Arab Regional Track",
      summary: "Kuwait crisis coalition diplomacy, Israeli restraint during Iraqi missile attacks, and Arab-state leverage for postwar diplomacy.",
      compilerFocus: "Separate Gulf War operational material from records that shaped the later peace-process opening."
    },
    {
      id: "road-to-madrid",
      label: "Road to Madrid",
      dateSpan: "April 1-October 29, 1991",
      chapter: "Madrid-Multilateral Track",
      summary: "Postwar shuttle diplomacy and negotiations over attendance, delegation formulas, letters of assurance, and conference terms.",
      compilerFocus: "Track who authorized compromises and how the Palestinian/Jordanian and Syria/Lebanon tracks were framed."
    },
    {
      id: "madrid-conference",
      label: "Madrid Conference",
      dateSpan: "October 30-November 3, 1991",
      chapter: "Madrid-Multilateral Track",
      summary: "The opening conference and surrounding high-level bilateral meetings with Israel, Egypt, Jordan, Syria, and other actors.",
      compilerFocus: "Prioritize exact date/time sequence, participant verification, and conference-adjacent bilateral conversations."
    },
    {
      id: "post-madrid",
      label: "Post-Madrid Tracks",
      dateSpan: "November 4, 1991-June 22, 1992",
      chapter: "Israel Track",
      summary: "Bilateral rounds, multilateral working groups, settlement and loan-guarantee disputes, and Israeli election-period diplomacy.",
      compilerFocus: "Connect public pressure, private assurances, and declassification status for loan guarantees and settlements."
    },
    {
      id: "israeli-transition",
      label: "Israeli Transition",
      dateSpan: "June 23, 1992-January 20, 1993",
      chapter: "Israel Track",
      summary: "Rabin government's arrival, late Bush administration peace-process moves, and transition issues handed to the Clinton team.",
      compilerFocus: "Mark records that belong in the Bush volume versus later Oslo-era files."
    }
  ].map((event) => ({ ...event, ...eventCounts(records, statements, event.id) }));

  const gaps = [
    {
      id: "state-department-shuttle-records",
      title: "State Department shuttle diplomacy files are the highest-value missing lane",
      priority: "Critical",
      category: "Source base",
      chapter: "Madrid-Multilateral Track",
      status: highPrioritySourceCandidates || gapRemediationCandidates.length
        ? `Remediated as an actionable queue: ${highPrioritySourceCandidates} high-priority public NARA source candidates, ${haassChronologicalCandidates.length} Haass chronological-file candidates, ${haassTargetSeriesCandidates.length} targeted Haass file-series candidates, ${gapRemediationCandidates.length} additional Bush Library gap-remediation candidates, ${dailyDiaryCandidates.length} Presidential Daily Diary/Backup cross-references, and ${bakerPrincetonCandidates.length} Princeton Baker candidates are harvested. Offline State lot files remain explicitly queued for compiler-side access rather than hidden as an unknown.`
        : "Open: no source-candidate harvest has been run yet.",
      evidence: "Presidential conversations show the high-level endpoints, but Baker/Ross negotiation files are needed for the invitation formula, letters of assurance, and bilateral track mechanics.",
      nextStep: "Use the harvested candidates for online triage, then request or inspect State Department Policy Planning, NEA, S/S, and Secretary Baker lot files for final document-level selection."
    },
    {
      id: "pdf-page-counts",
      title: "PDF page counts and excision status still need item-level review",
      priority: "High",
      category: "Metadata QA",
      chapter: "All chapters",
      status:
        pageCountedRecords === records.length && reviewedSourceCandidates === sourceCandidates.length
          ? `Remediated for triage: ${pageCountedRecords} presidential PDFs counted, ${reviewedSourceCandidates} source candidates carry review metadata, ${pageCountedSourceCandidates} source-candidate digital objects have page/image counts, and ${deferredSourceCandidatePdfs} PDF folder scans are explicitly flagged for manual review.`
          : `Partially remediated: ${pageCountedRecords} of ${records.length} presidential PDFs counted and ${reviewedSourceCandidates} of ${sourceCandidates.length} source candidates reviewed.`,
      evidence: "NARA Catalog metadata gives direct PDFs but not a compiler-ready count of substantive pages, excisions, attachments, or distribution data.",
      nextStep: "Use source-candidate review status to prioritize manual PDF inspection; large folder scans are flagged instead of treated as reviewed."
    },
    {
      id: "palestinian-channel",
      title: "Palestinian channel records are probably underrepresented",
      priority: "High",
      category: "Coverage",
      chapter: "Palestinian-Jordanian Track",
      status: `Remediated for triage: ${palestinianSourceCandidateCount} source candidates harvested across presidential, Haass, Baker, WHORM/search, and gap-remediation lanes; indirect Palestinian contacts still require document-level confirmation.`,
      evidence: "The public presidential series is stronger for heads of state than for indirect PLO or Palestinian delegation contacts.",
      nextStep: "Review harvested Palestinian delegation, PLO, West Bank, Gaza, Jordanian-Palestinian, Husseini, and Ashrawi hits before final selection."
    },
    {
      id: "syria-lebanon-source-gap",
      title: "Syria-Lebanon track needs cross-file reconstruction",
      priority: "High",
      category: "Coverage",
      chapter: "Syria-Lebanon Track",
      status: `Remediated for triage: ${syriaLebanonSourceCandidateCount} Syria/Lebanon candidates harvested, including Haass second-pass Lebanon context and Madrid briefing-book material; State/NSC document-level reconstruction remains the review task.`,
      evidence: "Assad conversations alone will not show the full policy chain for Syria, Lebanon, and regional security guarantees.",
      nextStep: "Pair Assad records with harvested Syria/Lebanon candidates, then verify NEA, NSC, CIA briefing, and coalition diplomacy files during compiler review."
    },
    {
      id: "public-private-alignment",
      title: "Public Papers references need alignment with private documents",
      priority: "Medium",
      category: "Chronology",
      chapter: "All chapters",
      status: `Remediated as a working crosswalk: ${linkedRecords} presidential records and ${linkedStatements} Public Papers references carry date/track/term linkage candidates, with ${dailyDiaryCandidates.length} Presidential Daily Diary/Backup files available for schedule, meeting, and call verification.`,
      evidence: "The public record captures talking points, press framing, and congressional messaging that often bracket private pressure.",
      nextStep: "Use the crosswalk as chronology glue, then mark exact public/private pairings during document selection."
    },
    {
      id: "source-note-normalization",
      title: "FRUS source notes need normalization before compiler handoff",
      priority: "Medium",
      category: "Source notes",
      chapter: "All chapters",
      status: `Remediated to triage standard: presidential records and source candidates include normalized source-note fields plus review metadata; ${candidateReviewErrors} source-candidate review errors are flagged explicitly.`,
      evidence: "Catalog-derived source notes are intentionally conservative and still require verification against the scan and repository conventions.",
      nextStep: "After item selection, convert the normalized notes into final FRUS wording with repository-specific citation conventions."
    }
  ];

  const sourceLeads = [
    {
      id: "presidential-memcon-files",
      title: "Presidential Memcon Files",
      repository: "George H.W. Bush Library / National Archives Catalog",
      naid: "321498039",
      status: "Harvested",
      chapter: "All chapters",
      whyItMatters: "Core high-level conversation set for Bush meetings with Israeli, Arab, UN, and regional leaders.",
      searchTerms: ["Shamir", "Rabin", "Mubarak", "King Hussein", "Assad", "Madrid", "Arab-Israeli"],
      url: "https://catalog.archives.gov/id/321498039"
    },
    {
      id: "presidential-telcon-files",
      title: "Presidential Telcon Files",
      repository: "George H.W. Bush Library / National Archives Catalog",
      naid: "321498139",
      status: "Harvested",
      chapter: "All chapters",
      whyItMatters: "Essential for Israeli restraint, Gulf War calls, Madrid follow-up, loan guarantees, and late-transition diplomacy.",
      searchTerms: ["Shamir", "Mubarak", "King Hussein", "Rabin", "Israel", "peace process"],
      url: "https://catalog.archives.gov/id/321498139"
    },
    {
      id: "presidential-daily-diary-backup",
      title: "Presidential Daily Diary and Backup Materials",
      repository: "George H.W. Bush Library / National Archives Catalog",
      naid: "186322",
      status: "Harvested",
      chapter: "All chapters",
      whyItMatters: "Daily diary and backup folders cross-reference selected FRUS meetings and calls by date, helping the compiler verify schedules, call timing, appointments, and backup materials adjacent to presidential conversations.",
      candidateCount: dailyDiaryCandidates.length,
      searchTerms: ["Presidential Daily Diary", "Presidential Daily Backup", "Shamir", "Rabin", "King Hussein", "Assad", "Mubarak", "Madrid"],
      url: "https://catalog.archives.gov/id/186322"
    },
    {
      id: "nsc-staff-files",
      title: "NSC staff and country files",
      repository: "George H.W. Bush Library / National Archives Catalog",
      naid: "",
      status: "Harvested",
      chapter: "All chapters",
      whyItMatters: "Decision memos, briefing books, talking points, interagency edits, and files for Israel, Jordan, Syria, Lebanon, Palestinians, and regional peace-process strategy are represented in the NARA and gap-remediation candidate queues.",
      candidateCount:
        baseNaraSourceCandidates.filter((candidate) => /NSC|Staff|country/i.test(candidate.lane)).length +
        gapRemediationCandidates.filter((candidate) => /Haass|Briefing/i.test(candidate.lane)).length,
      searchTerms: ["Middle East peace", "Arab-Israeli", "Dennis Ross", "Aaron Miller", "Madrid", "settlements"],
      url: "https://catalog.archives.gov/search"
    },
    {
      id: "haass-chronological-files",
      title: "Richard N. Haass' Chronological Files",
      repository: "George H.W. Bush Library / National Archives Catalog",
      naid: "2554857",
      status: "Harvested",
      chapter: "All chapters",
      whyItMatters: "Haass' NSC chronological files add digitized file folders with OCR for the policy chain behind Madrid, Israeli-Palestinian issues, loan guarantees, Gulf War linkage, and regional bilateral contacts.",
      candidateCount: haassChronologicalCandidates.length,
      searchTerms: ["Madrid", "Middle East peace", "Palestinian", "Shamir", "Rabin", "King Hussein", "loan guarantees"],
      url: "https://catalog.archives.gov/id/2554857"
    },
    {
      id: "haass-target-series",
      title: "Richard N. Haass targeted file series",
      repository: "George H.W. Bush Library / National Archives Catalog",
      naid: "2554859; 2554865; 2554866; 2554868; 2554871; 2554875; 2554876; 2554877",
      status: "Harvested",
      chapter: "All chapters",
      whyItMatters: "Additional Haass crosshatch, correspondence, meeting, Middle East peace-process, subject, telephone, trip, and working files may expose staff-level evidence behind Madrid and related Arab-Israeli diplomacy.",
      candidateCount: haassTargetSeriesCandidates.length,
      searchTerms: ["Middle East Peace Process", "Madrid", "MEP Delegations", "Palestinian", "Shamir", "King Hussein", "loan guarantees"],
      url: "https://catalog.archives.gov/id/2554868"
    },
    {
      id: "state-department-lot-files",
      title: "Department of State lot files and NEA records",
      repository: "Department of State / Office of the Historian source base",
      naid: "",
      status: "Compiler queue built",
      chapter: "All chapters",
      whyItMatters: "Presidential, Haass, NARA, and Baker-Princeton lanes now expose the online trail; State Department lot files remain offline compiler targets for the negotiation machinery behind Baker's shuttle diplomacy and bilateral rounds.",
      candidateCount: baseNaraSourceCandidates.filter((candidate) => /State|Ross/i.test(candidate.lane)).length,
      searchTerms: [
        "Baker",
        "Ross",
        "NEA",
        "Madrid",
        "letters of assurance",
        "bilateral negotiations",
        "Policy Planning Staff lot files",
        "Secretary Baker trip files"
      ],
      url: "https://history.state.gov/historicaldocuments/frus1989-92v14"
    },
    {
      id: "public-papers",
      title: "Public Papers of the Presidents",
      repository: "GovInfo",
      naid: "",
      status: "Harvested",
      chapter: "All chapters",
      whyItMatters: "Public framing, press conferences, remarks, and statements help align private documents with the visible diplomatic chronology.",
      searchTerms: ["Middle East peace", "Madrid", "Israel", "Palestinian", "loan guarantees"],
      url: "https://www.govinfo.gov/app/collection/ppp/president-41_Bush,%20George%20H.%20W."
    },
    {
      id: "baker-princeton-papers",
      title: "James A. Baker III Papers",
      repository: "Princeton University Library: Public Policy Papers",
      naid: "",
      status: "Harvested",
      chapter: "All chapters",
      whyItMatters: "Baker's Princeton papers add Secretary of State correspondence, speeches, travel remarks, memoir research files, and audiovisual references around Madrid and the Arab-Israeli peace process.",
      candidateCount: bakerPrincetonCandidates.length,
      searchTerms: ["Madrid", "Middle East Peace Conference", "Arab-Israeli Peace Process", "Palestinian representatives", "loan guarantees", "settlements"],
      url: "https://findingaids.princeton.edu/catalog/MC197"
    },
    {
      id: "whorm-country-files",
      title: "WHORM country and subject files",
      repository: "George H.W. Bush Library / National Archives Catalog",
      naid: "",
      status: "Harvested",
      chapter: "All chapters",
      whyItMatters: "WHORM country and subject files are represented in the expanded NARA search harvest for congressional/public pressure, loan guarantees, settlements, correspondence, and country-code cross-references.",
      candidateCount: sourceCandidates.filter((candidate) => /WHORM/i.test(candidate.lane)).length,
      searchTerms: ["CO074", "CO082", "Israel", "Jordan", "Palestinian", "loan guarantees", "settlements"],
      url: "https://catalog.archives.gov/search"
    }
  ];

  writeData("persons", "MEPP_PERSONS", persons);
  writeData("events", "MEPP_EVENTS", events);
  writeData("compiler-gaps", "MEPP_COMPILER_GAPS", gaps);
  writeData("source-leads", "MEPP_SOURCE_LEADS", sourceLeads);

  fs.writeFileSync(
    path.join(reportDir, "supporting-data-build.json"),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        records: records.length,
        publicStatements: statements.length,
        sourceCandidates: sourceCandidates.length,
        bakerPrincetonCandidates: bakerPrincetonCandidates.length,
        haassChronologicalCandidates: haassChronologicalCandidates.length,
        haassTargetSeriesCandidates: haassTargetSeriesCandidates.length,
        gapRemediationCandidates: gapRemediationCandidates.length,
        dailyDiaryCandidates: dailyDiaryCandidates.length,
        pageCountedRecords,
        reviewedSourceCandidates,
        pageCountedSourceCandidates,
        deferredSourceCandidatePdfs,
        linkedRecords,
        linkedStatements,
        persons: persons.length,
        events: events.length,
        gaps: gaps.length,
        sourceLeads: sourceLeads.length
      },
      null,
      2
    )}\n`
  );

  console.log(`Wrote supporting data for ${persons.length} persons, ${events.length} events, ${gaps.length} gaps.`);
}

main();
