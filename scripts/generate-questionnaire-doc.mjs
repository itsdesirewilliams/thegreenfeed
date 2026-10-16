/**
 * Generates docs/survey-questionnaire-v4.md from the canonical repository
 * definitions — never from memory.
 *
 * Sources:
 *   - src/data/survey/v4.ts            (live instrument: wording, options, order)
 *   - src/data/survey/v3.ts            (frozen legacy instrument)
 *   - src/data/survey/profile.ts       (profile fields + consent statement)
 *   - src/data/analysis-framework.json (v3 constructs)
 *   - src/data/analysis-framework-v4.json (v4 constructs)
 *
 * Run:  node scripts/generate-questionnaire-doc.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { V3_INSTRUMENT } from "../src/data/survey/v3.ts";
import { V4_INSTRUMENT } from "../src/data/survey/v4.ts";
import {
  SURVEY_CONSENT_ID,
  SURVEY_CONSENT_STATEMENT,
  SURVEY_PROFILE_FIELDS,
  getProfileFieldOptions,
} from "../src/data/survey/profile.ts";

const v3Codebook = JSON.parse(
  readFileSync(new URL("../src/data/analysis-framework.json", import.meta.url), "utf8"),
);
const v4Codebook = JSON.parse(
  readFileSync(
    new URL("../src/data/analysis-framework-v4.json", import.meta.url),
    "utf8",
  ),
);

/** Change status per v4 item, from the change log in docs/survey-redesign.md. */
const V4_STATUS = {
  q1: "Retained from Q1 (extended to a 5-point scale)",
  q2: "Retained from Q2 (added a “Not sure” option)",
  q3: "Added (infrastructure split)",
  q4: "Added (infrastructure split)",
  q5: "Added (infrastructure split)",
  q6: "Added (attitude item)",
  q7: "Replaced Q3 (bundled option split into behaviour + infrastructure)",
  q8: "Added (peer-norm item)",
  q9: "Revised from Q4 (rewording + rescale)",
  q10: "Retained from Q5",
  q11: "Replaced Q7/Q8 (single communication funnel item)",
  q12: "Retained from Q9",
  q13: "Retained from Q10 (kept as a confidence measure)",
  q15: "Revised from Q11 (option C fixed)",
  q16: "Merged from Q12/Q15 (one consolidated preference)",
  q17: "Retained from Q13",
  q18: "Retained from Q14",
  q19: "Revised from Q16 (concrete participation choices)",
};

const V4_RESERVED = {
  q14: "Sorting knowledge (objective). Reserved and NOT shipped until PCTE confirms the actual waste streams and answer key.",
};

function constructFor(codebook, id) {
  return codebook.questions.find((question) => question.id === id)?.construct ?? "—";
}

function renderInstrument(instrument, codebook, { status, reserved }) {
  const lines = [];
  for (const section of instrument.sections) {
    lines.push(`### Section ${section.number} — ${section.title}`);
    if (section.subtitle) lines.push(`_${section.subtitle}_`);
    lines.push("");
    const questions = instrument.questions.filter(
      (question) => question.section === section.title,
    );
    for (const question of questions) {
      lines.push(`#### ${question.id.toUpperCase()} — ${question.label}`);
      lines.push("");
      lines.push(`- **Question ID:** \`${question.id}\``);
      lines.push(`- **Type:** ${question.type}`);
      lines.push(
        `- **Required:** ${question.required ? "yes" : "no"}`,
      );
      lines.push(`- **Research construct:** ${constructFor(codebook, question.id)}`);
      if (status) lines.push(`- **Status:** ${status[question.id] ?? "—"}`);
      if (reserved && reserved[question.id]) {
        lines.push(`- **Status:** ${reserved[question.id]}`);
      }
      lines.push("- **Answer options (display order):**");
      lines.push("");
      lines.push("  | Order | Canonical ID | Label |");
      lines.push("  | ----- | ------------ | ----- |");
      (question.options ?? []).forEach((option, index) => {
        lines.push(`  | ${index + 1} | \`${option.value}\` | ${option.label} |`);
      });
      lines.push("");
    }
  }
  return lines;
}

function renderProfile() {
  const lines = [];
  lines.push(`### Consent`);
  lines.push("");
  lines.push(`Key: \`${SURVEY_CONSENT_ID}\` (stored as \`true\` when accepted)`);
  lines.push("");
  lines.push(`> ${SURVEY_CONSENT_STATEMENT}`);
  lines.push("");
  lines.push(`### Respondent profile fields`);
  lines.push("");
  for (const field of SURVEY_PROFILE_FIELDS) {
    lines.push(
      `- **${field.label}** — id \`${field.id}\`, type \`${field.type}\`, ${
        field.required ? "required" : "optional"
      }${field.requiredFrom ? ` (from \`${field.requiredFrom}\`)` : ""}`,
    );
    if (field.type === "select") {
      const options = getProfileFieldOptions(field);
      const grouped = Boolean(field.groups);
      lines.push("");
      if (grouped) {
        for (const group of field.groups) {
          lines.push(`  - _${group.label}_`);
          for (const option of group.options) {
            lines.push(`    - \`${option.value}\` — ${option.label}`);
          }
        }
      } else {
        for (const option of options) {
          lines.push(`  - \`${option.value}\` — ${option.label}`);
        }
      }
      lines.push("");
    }
  }
  return lines;
}

const out = [];
out.push("# TheGreenFeed survey — final questionnaire (v4)");
out.push("");
out.push(
  "> Generated from the canonical definitions in the repository by `scripts/generate-questionnaire-doc.mjs`. Do not edit by hand — regenerate instead.",
);
out.push("");
out.push(
  "The **live instrument is `v4`** (18 shipping items; `q14` is reserved and not shipped). The previously published 16-question instrument is frozen as `v3` (and `v2` uses the same wording) and appears in the appendix. Answer codes (`a`/`b`/`c`…) are categorical and never summed.",
);
out.push("");
out.push(`- Instrument version: \`${V4_INSTRUMENT.version}\``);
out.push(`- Sections: ${V4_INSTRUMENT.sections.length}`);
out.push(`- Shipping questions: ${V4_INSTRUMENT.questions.length}`);
out.push("");
out.push("---");
out.push("");
out.push("## 1. v4 questionnaire (live)");
out.push("");
out.push(...renderInstrument(V4_INSTRUMENT, v4Codebook, { status: V4_STATUS, reserved: V4_RESERVED }));
out.push("---");
out.push("");
out.push("## 2. Consent and respondent profile");
out.push("");
out.push(...renderProfile());
out.push("");
out.push("---");
out.push("");
out.push("## 3. Appendix — frozen v3 legacy instrument (16 questions)");
out.push("");
out.push(
  "Collected under `schema_version` `v3` and `v2`. Kept verbatim so those rows stay interpretable; do not edit.",
);
out.push("");
out.push(...renderInstrument(V3_INSTRUMENT, v3Codebook, {}));

const path = new URL("../docs/survey-questionnaire-v4.md", import.meta.url);
writeFileSync(path, `${out.join("\n")}\n`, "utf8");
console.log("Wrote docs/survey-questionnaire-v4.md");
