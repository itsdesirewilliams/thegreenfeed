/**
 * Verifies that synthetic test rows are INCLUDED in the analysis and remain
 * distinguishable, while version separation is preserved.
 *
 * Usage:
 *   node scripts/verify-analysis-provenance.mjs
 *
 * Builds a fixture from the committed synthetic dataset
 * (`test-data/v4-synthetic-2026-10.json`) plus genuine v4/v3 rows and a legacy
 * unsupported `v1` row, then asserts:
 *   - dataset-level genuine/synthetic counts and batch grouping;
 *   - synthetic rows are counted in the analysed, current-version figures;
 *   - v3/v1 rows are never mixed into the v4 distribution;
 *   - the unsupported `v1` tag is reported and excluded, not reinterpreted.
 *
 * Reads only local source + JSON files. No secrets, no database. Exits non-zero
 * on any failure.
 */
import { readFileSync } from "node:fs";
import { register } from "node:module";

register(new URL("./analysis-loader.mjs", import.meta.url));

const { buildAnalysis, summariseProvenance } = await import(
  "../src/lib/analysis.ts"
);

const BATCH = "v4-synthetic-2026-10";

function loadSynthetic() {
  const raw = JSON.parse(
    readFileSync(
      new URL(`../test-data/${BATCH}.json`, import.meta.url),
      "utf8",
    ),
  );
  const records = Array.isArray(raw) ? raw : raw.records;
  return records.map((record, index) => ({
    id: `synthetic-${index}`,
    created_at:
      record.createdAt ??
      `2026-10-16T00:${String(index % 60).padStart(2, "0")}:00Z`,
    schema_version: record.schemaVersion ?? "v4",
    answers: record.answers,
    is_synthetic: true,
    synthetic_batch_id: BATCH,
  }));
}

let failures = 0;
function check(label, actual, expected) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson === expectedJson) {
    console.log(`PASS  ${label}`);
    return;
  }
  console.log(
    `FAIL  ${label}\n      expected ${expectedJson}\n      actual   ${actualJson}`,
  );
  failures++;
}

const synthetic = loadSynthetic();
const genuineV4 = Array.from({ length: 3 }, (_, index) => ({
  id: `genuine-v4-${index}`,
  created_at: `2026-10-05T09:00:0${index}Z`,
  schema_version: "v4",
  answers: synthetic[0].answers,
  is_synthetic: false,
}));
const genuineV3 = {
  id: "genuine-v3",
  created_at: "2026-10-04T09:00:00Z",
  schema_version: "v3",
  answers: synthetic[0].answers,
};
const legacyV1 = {
  id: "legacy-v1",
  created_at: "2026-10-03T09:00:00Z",
  schema_version: "v1",
  answers: {},
};

const rows = [...genuineV4, genuineV3, legacyV1, ...synthetic];
const syntheticCount = synthetic.length;
const totalCount = rows.length;

const provenance = summariseProvenance(rows);
check("provenance total", provenance.total, totalCount);
check("provenance genuine", provenance.genuine, 5);
check("provenance synthetic", provenance.synthetic, syntheticCount);
check("provenance batch grouping", provenance.syntheticBatches, [
  { batchId: BATCH, count: syntheticCount },
]);

const { dataQuality, questions } = buildAnalysis(rows);
const v4Count = syntheticCount + genuineV4.length;

check("analysed version", dataQuality.analysedVersion, "v4");
check("dataQuality total responses", dataQuality.totalResponses, totalCount);
check("dataQuality genuine responses", dataQuality.genuineResponses, 5);
check("dataQuality synthetic responses", dataQuality.syntheticResponses, syntheticCount);
check("dataQuality includesSynthetic", dataQuality.includesSynthetic, true);
check("dataQuality synthetic batches", dataQuality.syntheticBatches, [
  { batchId: BATCH, count: syntheticCount },
]);
check("dataQuality versions", dataQuality.versions, [
  { version: "v4", count: v4Count },
  { version: "v3", count: 1 },
  { version: "v1", count: 1 },
]);
check("dataQuality unsupported versions", dataQuality.unsupportedVersions, [
  { version: "v1", count: 1 },
]);
check("dataQuality excluded versions", dataQuality.excludedVersions, [
  { version: "v3", count: 1 },
  { version: "v1", count: 1 },
]);
check(
  "synthetic rows counted in analysed responses",
  dataQuality.analysedResponses,
  v4Count,
);
check(
  "q1 total is v4-only (versions never mixed)",
  questions[0].total,
  v4Count,
);
check(
  "q1 valid N includes synthetic rows",
  questions[0].validN,
  v4Count,
);

console.log(
  failures === 0
    ? "\nSynthetic rows are included in the analysis and version separation is preserved."
    : `\n${failures} check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
