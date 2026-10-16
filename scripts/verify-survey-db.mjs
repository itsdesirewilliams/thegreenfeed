/**
 * Verifies Supabase survey storage without exposing secrets or answers.
 *
 * Usage:
 *   node scripts/verify-survey-db.mjs
 *
 * Reads the same variables the app uses (.env.local is parsed by this script,
 * values are never printed). Prints:
 *   - whether the survey_submissions table is reachable,
 *   - the total row count,
 *   - the latest row's id / schema_version / created_at only.
 *
 * It never selects, prints, or logs the `answers` column.
 */
import { readFileSync } from "node:fs";
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
    if (!(key in process.env) && value.length > 0) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  console.error(
    "Not configured: SUPABASE_URL / SUPABASE_SECRET_KEY are missing in .env.local.",
  );
  process.exit(1);
}

const client = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { count, error } = await client
  .from("survey_submissions")
  .select("id", { count: "exact", head: true });

if (error) {
  console.error(`Table check failed: ${error.message}`);
  process.exit(1);
}

console.log(`Table reachable. Rows: ${count ?? 0}`);

// Provenance check (synthetic-data migration). Never prints answers.
const { error: provenanceError } = await client
  .from("survey_submissions")
  .select("is_synthetic")
  .limit(1);

if (provenanceError) {
  console.log(
    "Provenance columns: MISSING — apply supabase/migrations/20261016000000_survey_provenance.sql",
  );
} else {
  console.log("Provenance columns: present");
  const { count: genuine } = await client
    .from("survey_submissions")
    .select("id", { count: "exact", head: true })
    .eq("is_synthetic", false);
  const { count: synthetic } = await client
    .from("survey_submissions")
    .select("id", { count: "exact", head: true })
    .eq("is_synthetic", true);
  console.log(`Genuine rows: ${genuine ?? 0}`);
  console.log(`Synthetic rows: ${synthetic ?? 0}`);
}

const { data, error: latestError } = await client
  .from("survey_submissions")
  .select("id, schema_version, created_at")
  .order("created_at", { ascending: false })
  .limit(1);

if (latestError) {
  console.error(`Latest-row check failed: ${latestError.message}`);
  process.exit(1);
}

if (!data || data.length === 0) {
  console.log("No rows yet.");
} else {
  const latest = data[0];
  console.log(
    `Latest row: id=${latest.id} schema_version=${latest.schema_version} created_at=${latest.created_at}`,
  );
}
