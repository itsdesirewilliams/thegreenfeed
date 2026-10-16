/**
 * Verifies that every instrument version and its deterministic codebook agree.
 *
 * Usage:
 *   node scripts/verify-survey-consistency.mjs
 *
 * For each supported version it checks that:
 *   - every instrument question has a codebook entry (construct + caveat);
 *   - every instrument option value has an interpretation, and the codebook
 *     defines no option the instrument does not;
 *   - the codebook's question/section id sets match the instrument;
 *   - question and pattern ids are unique.
 *
 * Reads only local source + JSON files. No secrets, no database. Exits non-zero
 * on any inconsistency.
 */
import { readFileSync } from "node:fs";
import { V3_INSTRUMENT } from "../src/data/survey/v3.ts";
import { V4_INSTRUMENT } from "../src/data/survey/v4.ts";

// Kept in sync with src/data/survey/registry.ts. Imported directly here because
// Node cannot resolve the facade's extensionless relative imports.
const INSTRUMENTS = {
  v2: V3_INSTRUMENT,
  v3: V3_INSTRUMENT,
  v4: V4_INSTRUMENT,
};
const VERSIONS = Object.keys(INSTRUMENTS);

const FRAMEWORK_FILES = {
  v2: "analysis-framework.json",
  v3: "analysis-framework.json",
  v4: "analysis-framework-v4.json",
};

function loadFramework(file) {
  const raw = readFileSync(new URL(`../src/data/${file}`, import.meta.url), "utf8");
  return JSON.parse(raw);
}

let failures = 0;
function fail(message) {
  console.log(`FAIL  ${message}`);
  failures++;
}

for (const version of VERSIONS) {
  const questions = INSTRUMENTS[version].questions;
  const framework = loadFramework(FRAMEWORK_FILES[version]);

  const codebookById = new Map(
    framework.questions.map((question) => [question.id, question]),
  );

  const seenQuestionIds = new Set();
  for (const question of questions) {
    if (seenQuestionIds.has(question.id)) {
      fail(`${version}: duplicate question id "${question.id}"`);
    }
    seenQuestionIds.add(question.id);

    const codebook = codebookById.get(question.id);
    if (!codebook) {
      fail(`${version}: codebook is missing question "${question.id}"`);
      continue;
    }
    if (!codebook.construct?.trim()) {
      fail(`${version}: ${question.id} has no construct`);
    }
    if (!codebook.analysisCaveat?.trim()) {
      fail(`${version}: ${question.id} has no analysisCaveat`);
    }

    const optionValues = new Set((question.options ?? []).map((o) => o.value));
    for (const value of optionValues) {
      const rule = codebook.options?.[value];
      if (!rule?.interpretation?.trim()) {
        fail(`${version}: ${question.id}.${value} has no interpretation`);
      }
    }
    for (const value of Object.keys(codebook.options ?? {})) {
      if (!optionValues.has(value)) {
        fail(`${version}: codebook defines unknown option ${question.id}.${value}`);
      }
    }
  }

  for (const id of codebookById.keys()) {
    if (!seenQuestionIds.has(id)) {
      fail(`${version}: codebook defines unknown question "${id}"`);
    }
  }

  const patternIds = new Set();
  for (const section of framework.sectionAnalysis ?? []) {
    for (const id of section.questions ?? []) {
      if (!seenQuestionIds.has(id)) {
        fail(`${version}: section "${section.id}" references unknown question "${id}"`);
      }
    }
    for (const pattern of section.patterns ?? []) {
      if (patternIds.has(pattern.id)) {
        fail(`${version}: duplicate pattern id "${pattern.id}"`);
      }
      patternIds.add(pattern.id);
    }
  }

  console.log(
    `Checked ${version}: ${questions.length} questions, ${codebookById.size} codebook entries, ${patternIds.size} patterns`,
  );
}

console.log(failures === 0 ? "Instrument and codebook are consistent." : `${failures} inconsistency(ies) found.`);
process.exit(failures === 0 ? 0 : 1);
