import os from "node:os";
import path from "node:path";

import { Workbook, type Cell, type Row, type Worksheet } from "exceljs";

import {
  buildAnalysisWorkbook,
  buildRawResponsesWorkbook,
} from "@/lib/admin/workbooks";
import { buildAnalysis, type AnalysisRow } from "@/lib/analysis";

/**
 * Programmatic checks on the generated admin Excel exports.
 *
 * Builds the raw and analysis workbooks from in-memory fixtures (no database),
 * writes them to a temp directory, reads them back with exceljs and asserts the
 * teacher-facing contract: readable option labels, correct profile/consent
 * mapping, no leaked schema-version columns, version separation and blank
 * handling. Run with `npm run verify:exports`.
 */

let failures = 0;

function check(condition: unknown, message: string): void {
  if (condition) {
    return;
  }
  failures += 1;
  console.error(`  FAIL: ${message}`);
}

function cellText(cell: Cell): string {
  const value = cell.value;
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if (value instanceof Date) return value.toISOString();
    if ("richText" in value) {
      return (value as { richText: { text: string }[] }).richText
        .map((part) => part.text)
        .join("");
    }
    if ("result" in value) {
      return String((value as { result?: unknown }).result ?? "");
    }
    return "";
  }
  return String(value);
}

function headerTexts(sheet: Worksheet, rowNumber = 1): string[] {
  const row = sheet.getRow(rowNumber);
  const texts: string[] = [];
  for (let column = 1; column <= sheet.columnCount; column += 1) {
    texts.push(cellText(row.getCell(column)));
  }
  return texts;
}

function findRow(
  sheet: Worksheet,
  predicate: (row: Row) => boolean,
): Row | undefined {
  for (let index = 1; index <= sheet.rowCount; index += 1) {
    const row = sheet.getRow(index);
    if (predicate(row)) return row;
  }
  return undefined;
}

function rowValues(row: Row): string[] {
  const values: string[] = [];
  for (let column = 1; column <= row.cellCount; column += 1) {
    values.push(cellText(row.getCell(column)));
  }
  return values;
}

const V4_ROWS: AnalysisRow[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    created_at: "2026-10-10T09:00:00.000Z",
    schema_version: "v4",
    answers: {
      profile_full_name: "Ada Test",
      profile_programme: "bca",
      profile_phone: "+91 90000 00000",
      consent: true,
      q1: "d",
      q2: "a",
      q13: "c",
    },
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    created_at: "2026-10-11T10:30:00.000Z",
    schema_version: "v4",
    answers: {
      profile_programme: "mba",
      consent: false,
      q1: "e",
    },
  },
];

const LEGACY_V3_ROW: AnalysisRow = {
  id: "33333333-3333-3333-3333-333333333333",
  created_at: "2026-09-01T08:00:00.000Z",
  schema_version: "v3",
  answers: {
    profile_full_name: "Legacy Learner",
    profile_programme: "mba",
    consent: true,
    q1: "c",
  },
};

const UNSUPPORTED_V1_ROW: AnalysisRow = {
  id: "44444444-4444-4444-4444-444444444444",
  created_at: "2026-08-01T08:00:00.000Z",
  schema_version: "v1",
  answers: { q1: "a" },
};

async function readBack(
  workbook: Workbook,
  name: string,
): Promise<Workbook> {
  const file = path.join(os.tmpdir(), `${name}-${Date.now()}.xlsx`);
  await workbook.xlsx.writeFile(file);
  const read = new Workbook();
  await read.xlsx.readFile(file);
  return read;
}

async function verifyRawSingleVersion(): Promise<void> {
  console.log("Raw workbook (v4 only)");
  const read = await readBack(buildRawResponsesWorkbook(V4_ROWS), "raw-v4");

  check(
    JSON.stringify(read.worksheets.map((sheet) => sheet.name)) ===
      JSON.stringify(["Responses"]),
    `expected a single "Responses" sheet, got ${read.worksheets
      .map((sheet) => sheet.name)
      .join(", ")}`,
  );

  const sheet = read.getWorksheet("Responses");
  check(Boolean(sheet), "Responses sheet exists");
  if (!sheet) return;

  const headers = headerTexts(sheet);
  check(headers[0] === "ID", `header[0] should be ID, got ${headers[0]}`);
  check(
    headers[1] === "Submitted At",
    `header[1] should be Submitted At, got ${headers[1]}`,
  );
  check(headers[2] === "Full Name", `header[2] should be Full Name`);
  check(headers[3] === "Programme", `header[3] should be Programme`);
  check(headers[4] === "Phone Number", `header[4] should be Phone Number`);
  check(headers[5] === "Consent Given", `header[5] should be Consent Given`);
  check(
    headers.some((text) => text.startsWith("Q1. ")) &&
      headers.some((text) => text.includes("notice litter")),
    "question columns should carry published wording",
  );
  check(
    !headers.some(
      (text) =>
        text === "schema_version" ||
        text === "Version" ||
        text === "Response ID",
    ),
    "raw headers must not expose schema_version or an ID/version column",
  );

  const first = sheet.getRow(2);
  const firstValues = rowValues(first);
  check(
    firstValues[0] === "11111111-1111-1111-1111-111111111111",
    "row 1 ID must be preserved verbatim",
  );
  check(firstValues[2] === "Ada Test", "row 1 Full Name should be Ada Test");
  check(
    firstValues[3] === "BCA (Computer Applications)",
    `row 1 Programme should be the readable label, got ${firstValues[3]}`,
  );
  check(
    firstValues[4] === "+91 90000 00000",
    "row 1 Phone should be preserved",
  );
  check(firstValues[5] === "Yes", "row 1 consent true should read Yes");

  const q1Index = headers.findIndex((text) => text.startsWith("Q1. "));
  const q2Index = headers.findIndex((text) => text.startsWith("Q2. "));
  const q3Index = headers.findIndex((text) => text.startsWith("Q3. "));
  check(
    cellText(first.getCell(q1Index + 1)) === "Often",
    `q1 code "d" should map to "Often", got ${cellText(
      first.getCell(q1Index + 1),
    )}`,
  );
  check(
    cellText(first.getCell(q2Index + 1)) ===
      "Canteens, food areas or student gathering spots",
    "q2 code should map to its option label",
  );
  check(
    cellText(first.getCell(q3Index + 1)) === "",
    "an unanswered question should be an empty cell",
  );

  const second = sheet.getRow(3);
  check(
    cellText(second.getCell(6)) === "No",
    "consent false should read No",
  );
  check(
    cellText(second.getCell(3)) === "",
    "missing name should be an empty cell",
  );
}

async function verifyRawMixedVersions(): Promise<void> {
  console.log("Raw workbook (mixed versions)");
  const read = await readBack(
    buildRawResponsesWorkbook([...V4_ROWS, LEGACY_V3_ROW, UNSUPPORTED_V1_ROW]),
    "raw-mixed",
  );

  const names = read.worksheets.map((sheet) => sheet.name);
  check(
    names.includes("Responses (v4)") && names.includes("Responses (v3)"),
    `mixed versions should not share a sheet, got ${names.join(", ")}`,
  );
  check(
    names.includes("Unsupported versions"),
    "unsupported rows should be listed separately",
  );

  const v3 = read.getWorksheet("Responses (v3)");
  check(Boolean(v3), "v3 sheet exists");
  if (v3) {
    const headers = headerTexts(v3);
    const q1Index = headers.findIndex((text) => text.startsWith("Q1. "));
    check(
      headers.some((text) => text.includes("disposed of improperly")),
      "v3 sheet should use v3 wording",
    );
    const row = v3.getRow(2);
    check(
      cellText(row.getCell(q1Index + 1)) === "Often or very often",
      `v3 q1 code "c" must resolve against the v3 options, got ${cellText(
        row.getCell(q1Index + 1),
      )}`,
    );
  }
}

async function verifyAnalysisWorkbook(): Promise<void> {
  console.log("Analysis workbook");
  const rows = [...V4_ROWS, LEGACY_V3_ROW, UNSUPPORTED_V1_ROW];
  const analysis = buildAnalysis(rows);
  const read = await readBack(buildAnalysisWorkbook(analysis), "analysis");

  const names = read.worksheets.map((sheet) => sheet.name);
  check(
    JSON.stringify(names) ===
      JSON.stringify(["Summary", "Question Results", "Advanced Analysis"]),
    `analysis should have the three expected sheets, got ${names.join(", ")}`,
  );

  const summary = read.getWorksheet("Summary");
  check(Boolean(summary), "Summary sheet exists");
  if (summary) {
    const total = findRow(
      summary,
      (row) => cellText(row.getCell(1)) === "Total responses",
    );
    check(
      total !== undefined && cellText(total.getCell(2)) === "4",
      "Summary total responses should be 4",
    );
    const analysed = findRow(
      summary,
      (row) => cellText(row.getCell(1)) === "Responses with analysable answers",
    );
    check(
      analysed !== undefined && cellText(analysed.getCell(2)) === "2",
      "Summary analysable responses should be 2",
    );
  }

  const results = read.getWorksheet("Question Results");
  check(Boolean(results), "Question Results sheet exists");
  if (results) {
    const headers = headerTexts(results);
    check(headers.includes("Question"), "question results has Question header");
    check(
      headers.includes("Response Option"),
      "question results has Response Option header",
    );
    check(headers.includes("Count"), "question results has Count header");
    const oftenRow = findRow(
      results,
      (row) =>
        cellText(row.getCell(2)) === "Often" &&
        cellText(row.getCell(1)).includes("notice litter"),
    );
    check(
      oftenRow !== undefined && cellText(oftenRow.getCell(3)) === "1",
      "question results should count the mapped option",
    );
  }

  const advanced = read.getWorksheet("Advanced Analysis");
  check(Boolean(advanced), "Advanced Analysis sheet exists");
  if (advanced) {
    const hasPattern = findRow(
      advanced,
      (row) => cellText(row.getCell(1)).length > 0 && cellText(row.getCell(2)).length > 0,
    );
    check(hasPattern !== undefined, "advanced sheet should carry pattern rows");
  }
}

async function main(): Promise<void> {
  await verifyRawSingleVersion();
  await verifyRawMixedVersions();
  await verifyAnalysisWorkbook();

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll export checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
