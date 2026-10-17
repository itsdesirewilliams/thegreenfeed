import { Workbook, type Row, type Worksheet } from "exceljs";

import {
  CURRENT_SURVEY_VERSION,
  SURVEY_CONSENT_ID,
  SURVEY_PROFILE_FIELDS,
  getInstrument,
  getProfileFieldOptions,
  isSupportedSurveyVersion,
  type SurveyQuestion,
} from "@/data/survey-questions";
import type { AnalysisRow, SurveyAnalysis } from "@/lib/analysis";
import { formatDateTime } from "@/lib/admin/format";

/**
 * Excel (`.xlsx`) workbook builders for the admin exports.
 *
 * Deliberately framework-agnostic — no `server-only`, no Supabase, no Next
 * imports — so the route handlers can build a workbook from stored rows, and
 * `scripts/verify-exports.ts` can build the exact same workbooks from fixtures
 * and read them back without a database.
 *
 * A stored row names the instrument that produced it (`schema_version`). Raw
 * export sheets never mix instruments: each supported version present gets its
 * own worksheet with that instrument's question wording and option labels, so a
 * v3 option code is never labelled with a v4 option set. Rows with an
 * uninterpretable version are listed verbatim on a separate sheet rather than
 * dropped silently or reinterpreted.
 */

const FOREST = "FF14532D";
const HEADER_FILL = "FFEDF5EF";
const HAIRLINE = "FFB7C9BC";
const MUTED = "FF5B6B60";

const programmeField = SURVEY_PROFILE_FIELDS.find(
  (field) => field.id === "profile_programme",
);
const programmeLabels = new Map(
  (programmeField ? getProfileFieldOptions(programmeField) : []).map((option) => [
    option.value,
    option.label,
  ]),
);

/** Human-readable programme label for a stored slug (falls back to the slug). */
function programmeLabel(value: string): string {
  return programmeLabels.get(value) ?? value;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** The question's published number, taken from its stable id. */
function questionNumber(id: string): string {
  return id.replace(/\D/g, "");
}

function questionHeading(question: SurveyQuestion): string {
  const number = questionNumber(question.id);
  return number ? `Q${number}. ${question.label}` : question.label;
}

/**
 * Resolves a stored answer into the readable value a teacher expects: option
 * labels for choices, "Yes"/"No" for booleans, raw text otherwise. An unknown
 * code is passed through unchanged rather than blanked, so nothing is lost.
 */
function answerValue(question: SurveyQuestion, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";

  if (question.type === "multiple-choice") {
    const values = Array.isArray(value) ? value : [value];
    return values
      .filter((entry): entry is string => typeof entry === "string")
      .map(
        (entry) =>
          question.options?.find((option) => option.value === entry)?.label ??
          entry,
      )
      .join("; ");
  }

  if (question.type === "yes-no") {
    if (value === true) return "Yes";
    if (value === false) return "No";
    return "";
  }

  if (typeof value !== "string") return "";

  if (question.type === "single-choice") {
    return (
      question.options?.find((option) => option.value === value)?.label ?? value
    );
  }

  return value;
}

function submittedAt(value: string): string {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? "" : formatDateTime(value);
}

function setWidths(sheet: Worksheet, widths: number[]): void {
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
}

function styleHeaderRow(row: Row, columns: number): void {
  row.font = { bold: true, color: { argb: FOREST } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: HEADER_FILL },
  };
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 22;
  for (let column = 1; column <= columns; column += 1) {
    row.getCell(column).border = {
      bottom: { style: "thin", color: { argb: HAIRLINE } },
    };
  }
}

function styleBlockHeading(sheet: Worksheet, text: string): void {
  const row = sheet.addRow([text]);
  row.font = { bold: true, size: 12, color: { argb: FOREST } };
  row.alignment = { vertical: "middle" };
  row.height = 20;
}

/* -------------------------------------------------------------------------- */
/* Raw responses workbook                                                     */
/* -------------------------------------------------------------------------- */

const RAW_FIXED_HEADERS = [
  "ID",
  "Submitted At",
  "Full Name",
  "Programme",
  "Phone Number",
  "Consent Given",
];

function addRawSheet(
  workbook: Workbook,
  name: string,
  version: string,
  rows: AnalysisRow[],
): void {
  const questions = getInstrument(version)?.questions ?? [];
  const sheet = workbook.addWorksheet(name, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const headers = [
    ...RAW_FIXED_HEADERS,
    ...questions.map((question) => questionHeading(question)),
  ];

  setWidths(sheet, [
    38,
    20,
    26,
    34,
    18,
    14,
    ...questions.map(() => 46),
  ]);

  // Keep the identifier and phone columns as text so leading zeros survive.
  sheet.getColumn(1).numFmt = "@";
  sheet.getColumn(5).numFmt = "@";

  const headerRow = sheet.addRow(headers);
  styleHeaderRow(headerRow, headers.length);

  for (const row of rows) {
    const answers = row.answers ?? {};
    const fullName = asText(answers.profile_full_name);
    const programme = asText(answers.profile_programme);
    const phone = asText(answers.profile_phone);

    sheet.addRow([
      row.id,
      submittedAt(row.created_at),
      fullName,
      programme ? programmeLabel(programme) : "",
      phone,
      answers[SURVEY_CONSENT_ID] === true ? "Yes" : "No",
      ...questions.map((question) => answerValue(question, answers[question.id])),
    ]);
  }

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };
}

function addUnsupportedSheet(
  workbook: Workbook,
  rows: AnalysisRow[],
): void {
  const sheet = workbook.addWorksheet("Unsupported versions", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  setWidths(sheet, [38, 20, 16, 90]);

  const headers = ["ID", "Submitted At", "Schema Version", "Stored answers"];
  const headerRow = sheet.addRow(headers);
  styleHeaderRow(headerRow, headers.length);

  for (const row of rows) {
    sheet.addRow([
      row.id,
      submittedAt(row.created_at),
      row.schema_version,
      JSON.stringify(row.answers ?? {}),
    ]);
  }

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };
}

/**
 * Builds the teacher-ready raw-responses workbook: one worksheet per supported
 * instrument version present (a single "Responses" sheet for the common case),
 * with readable profile fields, consent and every questionnaire answer mapped
 * to its option label.
 */
export function buildRawResponsesWorkbook(
  rows: AnalysisRow[],
): Workbook {
  const workbook = new Workbook();
  workbook.creator = "TheGreenFeed";
  workbook.created = new Date();

  const byVersion = new Map<string, AnalysisRow[]>();
  for (const row of rows) {
    const version = row.schema_version?.trim() || "unknown";
    const list = byVersion.get(version);
    if (list) list.push(row);
    else byVersion.set(version, [row]);
  }

  const versions = [...byVersion.keys()].sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true }),
  );
  const supported = versions.filter(isSupportedSurveyVersion);
  const unsupported = versions.filter((version) => !isSupportedSurveyVersion(version));

  if (supported.length === 0) {
    addRawSheet(workbook, "Responses", CURRENT_SURVEY_VERSION, []);
  } else {
    for (const version of supported) {
      const name = supported.length === 1 ? "Responses" : `Responses (${version})`;
      addRawSheet(workbook, name, version, byVersion.get(version) ?? []);
    }
  }

  const unsupportedRows = unsupported.flatMap(
    (version) => byVersion.get(version) ?? [],
  );
  if (unsupportedRows.length > 0) {
    addUnsupportedSheet(workbook, unsupportedRows);
  }

  return workbook;
}

/* -------------------------------------------------------------------------- */
/* Analysis workbook                                                          */
/* -------------------------------------------------------------------------- */

function periodText(start: string | null, end: string | null): string {
  if (!start || !end) return "No data yet";
  return `${formatDateTime(start)} → ${formatDateTime(end)}`;
}

export type AnalysisWorkbookOptions = {
  /** Pre-suppressed programme groups (small groups combined by the caller). */
  programmeGroups?: { label: string; count: number }[];
};

function buildSummarySheet(
  workbook: Workbook,
  analysis: SurveyAnalysis,
  options: AnalysisWorkbookOptions,
): void {
  const { dataQuality } = analysis;
  const sheet = workbook.addWorksheet("Summary");
  setWidths(sheet, [40, 56]);

  const title = sheet.addRow(["TheGreenFeed — Survey analysis"]);
  title.font = { bold: true, size: 14, color: { argb: FOREST } };
  title.height = 22;
  sheet.addRow([]);
  sheet.addRow(["Deterministic, rule-based findings from the stored responses."])
    .font = { italic: true, color: { argb: MUTED } };
  sheet.addRow([]);

  const headerRow = sheet.addRow(["Metric", "Value"]);
  styleHeaderRow(headerRow, 2);

  const metrics: [string, string | number][] = [
    ["Generated", formatDateTime(new Date().toISOString())],
    ["Instrument version analysed", dataQuality.analysedVersion],
    ["Total responses", dataQuality.totalResponses],
    [
      "Responses with analysable answers",
      dataQuality.analysedResponses,
    ],
    ["Collection period", periodText(dataQuality.periodStart, dataQuality.periodEnd)],
  ];

  if (dataQuality.sampleWarning) {
    metrics.push(["Sample warning", dataQuality.sampleWarning]);
  }

  for (const [label, value] of metrics) {
    const row = sheet.addRow([label, value]);
    row.getCell(1).font = { bold: true };
    row.alignment = { vertical: "top", wrapText: true };
  }

  sheet.getColumn(2).alignment = { vertical: "top", wrapText: true };

  const programmeGroups = options.programmeGroups ?? [];
  if (programmeGroups.length > 0) {
    sheet.addRow([]);
    styleBlockHeading(sheet, "Programme / course breakdown");
    const groupHeader = sheet.addRow(["Programme / course", "Count"]);
    styleHeaderRow(groupHeader, 2);
    for (const group of programmeGroups) {
      const row = sheet.addRow([group.label, group.count]);
      row.getCell(1).alignment = { vertical: "top", wrapText: true };
    }
  }
}

function buildQuestionResultsSheet(
  workbook: Workbook,
  analysis: SurveyAnalysis,
): void {
  const sheet = workbook.addWorksheet("Question Results", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  setWidths(sheet, [64, 52, 10, 12, 12, 12]);

  const headers = [
    "Question",
    "Response Option",
    "Count",
    "Percentage",
    "Answered (N)",
    "Unanswered",
  ];
  const headerRow = sheet.addRow(headers);
  styleHeaderRow(headerRow, headers.length);

  sheet.getColumn(4).numFmt = '0.0"%"';

  for (const question of analysis.questions) {
    const number = questionNumber(question.id);
    const labelled = number ? `Q${number}. ${question.label}` : question.label;

    for (const option of question.options) {
      sheet.addRow([
        labelled,
        option.label,
        option.count,
        Number(option.pct.toFixed(1)),
        question.validN,
        question.missingN,
      ]);
    }

    if (question.missingN > 0) {
      const pct = question.total
        ? Number(((question.missingN / question.total) * 100).toFixed(1))
        : 0;
      sheet.addRow([
        labelled,
        "No answer",
        question.missingN,
        pct,
        question.validN,
        question.missingN,
      ]);
    }
  }

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };
  sheet.getColumn(1).alignment = { vertical: "top", wrapText: true };
  sheet.getColumn(2).alignment = { vertical: "top", wrapText: true };
}

function buildAdvancedAnalysisSheet(
  workbook: Workbook,
  analysis: SurveyAnalysis,
): void {
  const sheet = workbook.addWorksheet("Advanced Analysis");
  setWidths(sheet, [36, 42, 46, 46, 46, 46, 46]);

  const title = sheet.addRow(["TheGreenFeed — Advanced analysis"]);
  title.font = { bold: true, size: 14, color: { argb: FOREST } };
  title.height = 22;
  sheet.addRow(["Deterministic rules over the stored responses — not proof of cause, effectiveness or representativeness."])
    .font = { italic: true, color: { argb: MUTED } };
  sheet.addRow([]);

  styleBlockHeading(sheet, "Cross-question patterns");
  const patternHeader = sheet.addRow([
    "Pattern",
    "Status",
    "Rule",
    "Evidence",
    "Meaning",
    "Actions",
    "Caveat",
  ]);
  styleHeaderRow(patternHeader, 7);

  for (const pattern of analysis.patterns) {
    const row = sheet.addRow([
      pattern.label,
      pattern.triggered ? "Triggered" : "Not triggered",
      pattern.rule,
      pattern.evidence.map((entry) => `${entry.label}: ${entry.detail}`).join("\n"),
      pattern.meaning,
      pattern.triggered ? pattern.actions.join("\n") : "",
      pattern.caveat,
    ]);
    row.alignment = { vertical: "top", wrapText: true };
  }

  sheet.autoFilter = {
    from: { row: patternHeader.number, column: 1 },
    to: { row: patternHeader.number, column: 7 },
  };

  sheet.addRow([]);
  styleBlockHeading(sheet, "Recommendations");
  const recHeader = sheet.addRow([
    "Audience",
    "Recommended action",
    "Evidence",
    "Uncertainty",
  ]);
  styleHeaderRow(recHeader, 4);
  for (const recommendation of analysis.recommendations) {
    const row = sheet.addRow([
      recommendation.audience,
      recommendation.action,
      recommendation.evidence.join("\n"),
      recommendation.caveat,
    ]);
    row.alignment = { vertical: "top", wrapText: true };
  }

  sheet.addRow([]);
  styleBlockHeading(sheet, "Synthesis");
  const synthesisHeader = sheet.addRow(["Dimension", "Observations"]);
  styleHeaderRow(synthesisHeader, 2);
  for (const dimension of analysis.synthesis) {
    const row = sheet.addRow([dimension.label, dimension.notes.join("\n")]);
    row.alignment = { vertical: "top", wrapText: true };
  }

  if (analysis.synthesisSummary.length > 0) {
    sheet.addRow([]);
    styleBlockHeading(sheet, "Synthesis summary");
    for (const line of analysis.synthesisSummary) {
      sheet.addRow([line]);
    }
  }

  sheet.addRow([]);
  styleBlockHeading(sheet, "Method, thresholds & guardrails");
  const methodHeader = sheet.addRow(["Rule", "Detail"]);
  styleHeaderRow(methodHeader, 2);
  const { dominance } = analysis.method;
  const methodRows: [string, string][] = [
    ["Majority", dominance.majority],
    ["Plurality", dominance.plurality],
    ["Close split", dominance.closeSplit],
    ["Tie", dominance.tie],
    [
      `Minimum N (${dominance.minimumNForInterpretiveLanguage})`,
      dominance.smallSampleWarning,
    ],
    ...analysis.method.guardrails.map(
      (guardrail): [string, string] => ["Guardrail", guardrail],
    ),
  ];
  for (const [label, detail] of methodRows) {
    const row = sheet.addRow([label, detail]);
    row.alignment = { vertical: "top", wrapText: true };
  }

  sheet.addRow([]);
  styleBlockHeading(sheet, "Limitations");
  for (const limitation of analysis.limitations) {
    const row = sheet.addRow([limitation]);
    row.alignment = { vertical: "top", wrapText: true };
  }
}

/**
 * Builds the analysis workbook with three worksheets: Summary, Question
 * Results (option wording, counts, percentages) and Advanced Analysis
 * (patterns, recommendations, synthesis, method and limitations).
 */
export function buildAnalysisWorkbook(
  analysis: SurveyAnalysis,
  options: AnalysisWorkbookOptions = {},
): Workbook {
  const workbook = new Workbook();
  workbook.creator = "TheGreenFeed";
  workbook.created = new Date();

  buildSummarySheet(workbook, analysis, options);
  buildQuestionResultsSheet(workbook, analysis);
  buildAdvancedAnalysisSheet(workbook, analysis);

  return workbook;
}
