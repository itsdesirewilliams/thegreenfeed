/**
 * Verifies that src/data/survey-questions.ts matches the approved survey
 * document word for word.
 *
 * Usage:
 *   node scripts/verify-survey-wording.mjs <path-to-TheGreenFeed_16_Question_Survey.md>
 *
 * Compares every question label and every option label in section order, plus
 * the consent question and its three options. Exits non-zero on any mismatch.
 * No secrets involved; reads only the two source files.
 */
import { readFileSync } from "node:fs";
import { surveyQuestions, SURVEY_CONSENT_OPTIONS, SURVEY_CONSENT_QUESTION } from "../src/data/survey-questions.ts";

const mdPath = process.argv[2];
if (!mdPath) {
  console.error(
    "Usage: node scripts/verify-survey-wording.mjs <path-to-TheGreenFeed_16_Question_Survey.md>",
  );
  process.exit(1);
}

const md = readFileSync(mdPath, "utf8");

const lines = md.split(/\r?\n/);
const docQuestions = [];
let current = null;
let inConsent = false;
for (const line of lines) {
  if (/^### Consent/.test(line)) inConsent = true;
  else if (/^# Section/.test(line)) inConsent = false;
  const qMatch = line.match(/^## Q(\d+)\.\s*(.*)$/);
  if (qMatch) {
    if (current) docQuestions.push(current);
    current = { id: `q${qMatch[1]}`, label: qMatch[2], options: [] };
    continue;
  }
  if (current && !inConsent) {
    const oMatch = line.match(/^- \*\*([ABC])\.\*\*\s*(.*)$/);
    if (oMatch) current.options.push(oMatch[2]);
  }
}
if (current) docQuestions.push(current);

let failures = 0;
function fail(message) {
  console.log(message);
  failures++;
}

if (docQuestions.length !== 16) {
  fail(`DOC PARSE FAIL: found ${docQuestions.length} questions, expected 16`);
}
const tsById = Object.fromEntries(surveyQuestions.map((q) => [q.id, q]));
const letter = ["a", "b", "c"];
for (const dq of docQuestions) {
  const tq = tsById[dq.id];
  if (!tq) {
    fail(`MISSING ${dq.id}`);
    continue;
  }
  if (tq.label !== dq.label) {
    fail(`LABEL MISMATCH ${dq.id}\n  md: ${dq.label}\n  ts: ${tq.label}`);
  }
  if (tq.options?.length !== 3) {
    fail(`OPTION COUNT ${dq.id}: ${tq.options?.length}, expected 3`);
    continue;
  }
  dq.options.forEach((label, i) => {
    if (tq.options[i].label !== label) {
      fail(
        `OPTION MISMATCH ${dq.id}.${letter[i]}\n  md: ${label}\n  ts: ${tq.options[i].label}`,
      );
    }
  });
}

if (SURVEY_CONSENT_QUESTION !== "Do you agree to take part in this anonymous student survey?") {
  fail(`CONSENT QUESTION MISMATCH\n  expected: Do you agree to take part in this anonymous student survey?\n  actual:   ${SURVEY_CONSENT_QUESTION}`);
}
const consentDoc = [
  "Yes, I agree to participate.",
  "No, I do not agree to participate.",
  "Prefer not to answer.",
];
if (JSON.stringify(SURVEY_CONSENT_OPTIONS.map((o) => o.label)) !== JSON.stringify(consentDoc)) {
  fail(`CONSENT OPTIONS MISMATCH\n  expected: ${JSON.stringify(consentDoc)}\n  actual:   ${JSON.stringify(SURVEY_CONSENT_OPTIONS.map((o) => o.label))}`);
}

console.log(`Compared ${docQuestions.length} questions, ${failures} mismatches`);
if (failures > 0) process.exit(1);
console.log("Survey data matches the approved document word for word.");
