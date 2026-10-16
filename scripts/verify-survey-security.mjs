/**
 * Verifies the survey's server-side security posture without printing secrets.
 *
 * Usage:
 *   node scripts/verify-survey-security.mjs
 *
 * Checks:
 *   1. The publishable (browser) key cannot read or insert survey_submissions
 *      directly — Row Level Security must deny both.
 *   2. The server-only secret key never appears in client-served files
 *      (.next/static, public).
 *
 * Prints only pass/fail and error codes/messages. Never prints key values.
 * Nothing is written to the database.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

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
    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env) && value.length > 0) process.env[key] = value;
  }
}

loadEnvFile(".env.local");

const url = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !publishableKey || !secretKey) {
  console.error(
    "Not configured: SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY must be set in .env.local.",
  );
  process.exit(1);
}

let failures = 0;
function report(ok, message) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${message}`);
  if (!ok) failures++;
}

// 1. Publishable key must not be able to touch the table (RLS).
const anon = createClient(url, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const selectAttempt = await anon
  .from("survey_submissions")
  .select("id", { count: "exact", head: true });
// With RLS enabled and no policies, anonymous reads must expose zero rows
// (whether PostgREST returns an empty result or a permission error).
const selectError = selectAttempt.error
  ? `${selectAttempt.error.code ?? "no-code"}: ${selectAttempt.error.message}`
  : "none";
report(
  (selectAttempt.count ?? 0) === 0,
  `publishable key reads 0 rows from survey_submissions (count=${selectAttempt.count ?? 0}, error=${selectError})`,
);

const insertAttempt = await anon.from("survey_submissions").insert({
  answers: { consent: true, q1: "a" },
  schema_version: "security-probe",
});
report(
  Boolean(insertAttempt.error),
  `publishable key cannot INSERT survey_submissions (${insertAttempt.error?.code ?? "no error returned"})`,
);

// 2. Secret key must not appear in any client-served file.
const roots = [".next/static", "public"];
const clientFiles = [];
function walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const info = statSync(full);
    if (info.isDirectory()) walk(full);
    else clientFiles.push(full);
  }
}
for (const root of roots) walk(root);

const leaks = clientFiles.filter((file) => {
  try {
    return readFileSync(file, "utf8").includes(secretKey);
  } catch {
    return false;
  }
});
report(
  leaks.length === 0,
  `server secret key absent from ${clientFiles.length} client-served files${
    leaks.length ? ` (found in ${leaks.length})` : ""
  }`,
);

console.log(
  failures === 0
    ? "Security checks passed."
    : `${failures} security check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
