/**
 * Authorised synthetic-data import / removal (admin workflow).
 *
 * This is the ONLY path allowed to create synthetic rows. It uses the
 * server-only Supabase secret key and always sets the provenance marker
 * `is_synthetic = true` plus a `synthetic_batch_id`, so synthetic data can never
 * be confused with genuine submissions. The public `/api/survey` route cannot
 * set either field and always creates genuine rows.
 *
 * Usage
 *   Import a batch:
 *     node scripts/import-synthetic.mjs --file <path.json> --batch <id> --confirm
 *   Remove a batch (only its synthetic rows):
 *     node scripts/import-synthetic.mjs --delete-batch <id> --confirm
 *
 * Input JSON — either a bare array or { "records": [ ... ] }:
 *   {
 *     "records": [
 *       {
 *         "schemaVersion": "v4",              // optional, defaults to "v4"
 *         "createdAt": "2026-10-20T09:00:00Z",// optional ISO 8601; synthetic timestamps are allowed here only
 *         "answers": {
 *           "consent": true,
 *           "profile_full_name": "...",
 *           "profile_programme": "bca",
 *           "profile_phone": "",              // optional
 *           "q1": "c", "q2": "a", ...          // canonical option codes
 *         }
 *       }
 *     ]
 *   }
 *
 * The script validates every record against the instrument of its declared
 * version before inserting. It never prints answers or secrets. Requires the
 * provenance migration to have been applied.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { V3_INSTRUMENT } from "../src/data/survey/v3.ts";
import { V4_INSTRUMENT } from "../src/data/survey/v4.ts";
import {
  SURVEY_CONSENT_ID,
  SURVEY_PROFILE_FIELDS,
  getProfileFieldOptions,
  isValidSurveyPhone,
} from "../src/data/survey/profile.ts";

const CHUNK = 100;
const MAX_BATCH_ID = 64;
const MAX_PROFILE_TEXT = 200;

const INSTRUMENTS = { v2: V3_INSTRUMENT, v3: V3_INSTRUMENT, v4: V4_INSTRUMENT };
const SUPPORTED = Object.keys(INSTRUMENTS);

function loadEnvFile(path) {
  let text;
  try {
    text = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(match[1] in process.env) && value.length > 0) process.env[match[1]] = value;
  }
}

function parseArgs(argv) {
  const args = {
    file: null,
    batch: null,
    deleteBatch: null,
    confirm: false,
    printExample: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--file") args.file = argv[++i];
    else if (token === "--batch") args.batch = argv[++i];
    else if (token === "--delete-batch") args.deleteBatch = argv[++i];
    else if (token === "--print-example") args.printExample = true;
    else if (token === "--confirm") args.confirm = true;
  }
  return args;
}

/** A valid example record built from the canonical v4 instrument. */
function buildExample() {
  const instrument = INSTRUMENTS.v4;
  const programmeField = SURVEY_PROFILE_FIELDS.find(
    (field) => field.id === "profile_programme",
  );
  const answers = {
    consent: true,
    profile_full_name: "Test Student",
    profile_programme: getProfileFieldOptions(programmeField)[0].value,
    profile_phone: "",
  };
  for (const question of instrument.questions) {
    answers[question.id] = question.options?.[0]?.value ?? "";
  }
  return {
    records: [
      {
        schemaVersion: "v4",
        createdAt: "2026-10-20T09:00:00.000Z",
        answers,
      },
    ],
  };
}

function die(message) {
  console.error(message);
  process.exit(1);
}

function isVersionAtLeast(version, required) {
  return version.localeCompare(required, undefined, { numeric: true }) >= 0;
}

/** Returns an array of human-readable problems for one record (empty = valid). */
function validateRecord(record, index) {
  const where = `record ${index}`;
  if (typeof record !== "object" || record === null || Array.isArray(record)) {
    return [`${where}: must be an object`];
  }

  const version =
    typeof record.schemaVersion === "string" ? record.schemaVersion : "v4";
  if (!SUPPORTED.includes(version)) {
    return [`${where}: unsupported schemaVersion "${version}"`];
  }
  const instrument = INSTRUMENTS[version];

  const answers = record.answers;
  if (typeof answers !== "object" || answers === null || Array.isArray(answers)) {
    return [`${where}: "answers" must be an object`];
  }

  const problems = [];

  const allowedKeys = new Set([
    SURVEY_CONSENT_ID,
    ...SURVEY_PROFILE_FIELDS.map((field) => field.id),
    ...instrument.questions.map((question) => question.id),
  ]);
  for (const key of Object.keys(answers)) {
    if (!allowedKeys.has(key)) problems.push(`${where}: unknown key "${key}"`);
  }

  if (answers[SURVEY_CONSENT_ID] !== true) {
    problems.push(`${where}: consent must be true`);
  }

  for (const field of SURVEY_PROFILE_FIELDS) {
    const raw = answers[field.id];
    const required =
      field.required &&
      (!field.requiredFrom || isVersionAtLeast(version, field.requiredFrom));
    if (raw === undefined || raw === null || raw === "") {
      if (required) problems.push(`${where}: "${field.id}" is required`);
      continue;
    }
    if (typeof raw !== "string") {
      problems.push(`${where}: "${field.id}" must be a string`);
      continue;
    }
    const trimmed = raw.trim();
    if (field.type === "select") {
      if (
        !getProfileFieldOptions(field).some((option) => option.value === trimmed)
      ) {
        problems.push(`${where}: "${field.id}" is not a listed option`);
      }
    } else if (field.type === "tel") {
      if (!isValidSurveyPhone(trimmed)) {
        problems.push(`${where}: "${field.id}" is not a valid phone number`);
      }
    } else if (field.maxLength && trimmed.length > field.maxLength) {
      problems.push(`${where}: "${field.id}" is too long`);
    }
    if (trimmed.length > MAX_PROFILE_TEXT) {
      problems.push(`${where}: "${field.id}" is too long`);
    }
  }

  for (const question of instrument.questions) {
    const raw = answers[question.id];
    if (raw === undefined || raw === null || raw === "") {
      if (question.required) problems.push(`${where}: "${question.id}" is required`);
      continue;
    }
    if (question.type === "single-choice") {
      if (
        typeof raw !== "string" ||
        !question.options?.some((option) => option.value === raw)
      ) {
        problems.push(`${where}: "${question.id}" is not a valid option`);
      }
    } else if (question.type === "multiple-choice") {
      if (!Array.isArray(raw) || raw.length === 0) {
        problems.push(`${where}: "${question.id}" must be a non-empty array`);
      } else if (
        raw.some(
          (value) =>
            typeof value !== "string" ||
            !question.options?.some((option) => option.value === value),
        )
      ) {
        problems.push(`${where}: "${question.id}" has an invalid option`);
      }
    } else if (question.type === "yes-no") {
      if (typeof raw !== "boolean") {
        problems.push(`${where}: "${question.id}" must be boolean`);
      }
    } else if (typeof raw !== "string") {
      problems.push(`${where}: "${question.id}" must be text`);
    }
  }

  if (record.createdAt !== undefined) {
    if (
      typeof record.createdAt !== "string" ||
      Number.isNaN(Date.parse(record.createdAt))
    ) {
      problems.push(`${where}: "createdAt" must be a valid ISO 8601 string`);
    }
  }

  return problems;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.printExample) {
    console.log(JSON.stringify(buildExample(), null, 2));
    return;
  }

  loadEnvFile(".env.local");

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    die("Not configured: SUPABASE_URL / SUPABASE_SECRET_KEY missing in .env.local.");
  }
  if (!args.confirm) {
    die("Refusing to run without --confirm. This command writes synthetic data.");
  }

  const client = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: provenanceError } = await client
    .from("survey_submissions")
    .select("is_synthetic")
    .limit(1);
  if (provenanceError) {
    die(
      "The provenance columns are missing. Apply supabase/migrations/20261016000000_survey_provenance.sql first.",
    );
  }

  if (args.deleteBatch) {
    const batchId = String(args.deleteBatch).trim();
    if (!batchId || batchId.length > MAX_BATCH_ID) {
      die("--delete-batch requires a batch id (1–64 chars).");
    }
    const { error, count } = await client
      .from("survey_submissions")
      .delete({ count: "exact" })
      .eq("is_synthetic", true)
      .eq("synthetic_batch_id", batchId);
    if (error) die(`Delete failed: ${error.message}`);
    console.log(
      `Deleted ${count ?? 0} synthetic row(s) from batch "${batchId}". Genuine rows are never matched (is_synthetic must be true).`,
    );
    return;
  }

  if (!args.file) die("Provide --file <path.json> (or --delete-batch <id>).");
  const batchId = String(args.batch ?? "").trim();
  if (!batchId || batchId.length > MAX_BATCH_ID) {
    die("--batch <id> is required for an import (1–64 chars).");
  }

  const raw = JSON.parse(readFileSync(args.file, "utf8"));
  const records = Array.isArray(raw) ? raw : raw?.records;
  if (!Array.isArray(records) || records.length === 0) {
    die("The file must contain a non-empty array, or { \"records\": [ ... ] }.");
  }

  const problems = [];
  const rows = [];
  records.forEach((record, index) => {
    const issues = validateRecord(record, index);
    if (issues.length > 0) {
      problems.push(...issues);
      return;
    }
    const version =
      typeof record.schemaVersion === "string" ? record.schemaVersion : "v4";
    rows.push({
      answers: record.answers,
      schema_version: version,
      is_synthetic: true,
      synthetic_batch_id: batchId,
      ...(record.createdAt ? { created_at: record.createdAt } : {}),
    });
  });

  if (problems.length > 0) {
    console.error(`Validation failed with ${problems.length} problem(s):`);
    for (const problem of problems.slice(0, 50)) console.error(`  - ${problem}`);
    if (problems.length > 50) console.error(`  …and ${problems.length - 50} more.`);
    die("Nothing was inserted.");
  }

  let inserted = 0;
  for (let from = 0; from < rows.length; from += CHUNK) {
    const chunk = rows.slice(from, from + CHUNK);
    const { error } = await client.from("survey_submissions").insert(chunk);
    if (error) {
      die(`Insert failed after ${inserted} row(s): ${error.message}`);
    }
    inserted += chunk.length;
  }

  console.log(
    `Inserted ${inserted} synthetic row(s) in batch "${batchId}". They are excluded from all research analysis and exports.`,
  );
}

main().catch((error) => die(`Unexpected failure: ${error.message}`));
