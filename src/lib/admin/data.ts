import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { AnalysisRow } from "@/lib/analysis";
import {
  SURVEY_PROFILE_FIELDS,
  SYNTHETIC_COLUMN,
  SYNTHETIC_BATCH_COLUMN,
  getProfileFieldOptions,
} from "@/data/survey-questions";

/**
 * Server-only reads for the admin panel. Uses the secret-key Supabase client
 * (bypasses RLS) and returns only what each view needs. Raw rows never reach the
 * browser unless an authenticated admin opens the detail view or requests the
 * raw export.
 */

const FETCH_PAGE_SIZE = 1000;
const MAX_ROWS = 20_000;
export const SMALL_GROUP_THRESHOLD = 5;
export const RESPONSES_PAGE_SIZE = 25;

export class AdminDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminDataError";
  }
}

const programmeFields = SURVEY_PROFILE_FIELDS.find(
  (field) => field.id === "profile_programme",
);
const programmeLabels = new Map(
  (programmeFields ? getProfileFieldOptions(programmeFields) : []).map(
    (option) => [option.value, option.label],
  ),
);

export function programmeLabel(value: string): string {
  return programmeLabels.get(value) ?? value;
}

function makeClient() {
  try {
    return createAdminSupabaseClient();
  } catch {
    throw new AdminDataError(
      "The admin data source is not configured (missing Supabase secret key).",
    );
  }
}

type ProvenanceState = "unknown" | "ready" | "missing";
let provenanceState: ProvenanceState = "unknown";

/**
 * Detects (once, cached) whether the synthetic-provenance columns exist. They
 * are added by the provenance migration; until it is applied there can be no
 * synthetic rows, so reading genuine-only is simply a no-op filter.
 */
async function detectProvenance(
  client: ReturnType<typeof createAdminSupabaseClient>,
): Promise<boolean> {
  if (provenanceState !== "unknown") return provenanceState === "ready";
  const { error } = await client
    .from("survey_submissions")
    .select(SYNTHETIC_COLUMN)
    .limit(1);
  provenanceState = error ? "missing" : "ready";
  return provenanceState === "ready";
}

/** True when the synthetic-provenance columns are present in the database. */
export async function isProvenanceReady(): Promise<boolean> {
  return detectProvenance(makeClient());
}

/**
 * Fetches every stored response (capped) for server-side aggregation, genuine
 * and synthetic alike. Synthetic rows are included so the combined dataset can
 * be exercised end to end, but they stay distinguishable: once the provenance
 * columns exist each row carries `is_synthetic` / `synthetic_batch_id` so every
 * view and export can label provenance. Before the migration there can be no
 * synthetic rows, so reading without the columns is a no-op.
 */
export async function fetchAllRows(): Promise<AnalysisRow[]> {
  const client = makeClient();

  const rows: AnalysisRow[] = [];

  for (let from = 0; from < MAX_ROWS; from += FETCH_PAGE_SIZE) {
    const to = Math.min(from + FETCH_PAGE_SIZE - 1, MAX_ROWS - 1);
    const { data, error } = await client
      .from("survey_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new AdminDataError("Could not load survey responses.");
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      rows.push({
        id: String(row.id),
        schema_version: String(row.schema_version ?? "unknown"),
        created_at: String(row.created_at ?? ""),
        answers: (row.answers ?? {}) as Record<string, unknown>,
        is_synthetic: row[SYNTHETIC_COLUMN] === true,
        synthetic_batch_id:
          row[SYNTHETIC_BATCH_COLUMN] === null ||
          row[SYNTHETIC_BATCH_COLUMN] === undefined
            ? null
            : String(row[SYNTHETIC_BATCH_COLUMN]),
      });
    }
    if (data.length < FETCH_PAGE_SIZE) break;
  }

  return rows;
}

export type SyntheticRow = {
  id: string;
  createdAt: string;
  schemaVersion: string;
  batchId: string | null;
};

export type SyntheticBatch = {
  batchId: string | null;
  count: number;
  earliestAt: string | null;
  latestAt: string | null;
};

export type SyntheticData = {
  /** False when the provenance migration has not been applied yet. */
  ready: boolean;
  rows: SyntheticRow[];
  batches: SyntheticBatch[];
};

/**
 * Fetches synthetic test rows only, for the labelled admin testing view. Never
 * used by research analysis or exports.
 */
export async function fetchSyntheticRows(): Promise<SyntheticData> {
  const client = makeClient();
  const ready = await detectProvenance(client);
  if (!ready) return { ready: false, rows: [], batches: [] };

  const { data, error } = await client
    .from("survey_submissions")
    .select("id, created_at, schema_version, synthetic_batch_id")
    .eq(SYNTHETIC_COLUMN, true)
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);

  if (error) {
    throw new AdminDataError("Could not load synthetic test rows.");
  }

  const rows: SyntheticRow[] = (data ?? []).map((row) => ({
    id: String(row.id),
    createdAt: String(row.created_at ?? ""),
    schemaVersion: String(row.schema_version ?? "unknown"),
    batchId:
      row.synthetic_batch_id === null || row.synthetic_batch_id === undefined
        ? null
        : String(row.synthetic_batch_id),
  }));

  const batchMap = new Map<
    string,
    { batchId: string | null; count: number; earliestAt: string | null; latestAt: string | null }
  >();
  for (const row of rows) {
    const key = row.batchId ?? "__unbatched__";
    const entry =
      batchMap.get(key) ??
      { batchId: row.batchId, count: 0, earliestAt: null, latestAt: null };
    entry.count += 1;
    const ts = Date.parse(row.createdAt);
    if (!Number.isNaN(ts)) {
      if (!entry.earliestAt || ts < Date.parse(entry.earliestAt)) {
        entry.earliestAt = row.createdAt;
      }
      if (!entry.latestAt || ts > Date.parse(entry.latestAt)) {
        entry.latestAt = row.createdAt;
      }
    }
    batchMap.set(key, entry);
  }

  return {
    ready: true,
    rows,
    batches: [...batchMap.values()].sort((a, b) => b.count - a.count),
  };
}

export type ProgrammeCount = {
  value: string;
  label: string;
  count: number;
  suppressed: boolean;
};

export type Overview = {
  total: number;
  /** Genuine submissions only (total minus synthetic). */
  genuine: number;
  /** Synthetic test rows included in the dataset. */
  synthetic: number;
  /** Synthetic share of the whole dataset, as a percentage. */
  syntheticSharePct: number;
  loaded: number;
  truncated: boolean;
  latestAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  versions: { version: string; count: number }[];
  byDay: { date: string; count: number }[];
  programmes: ProgrammeCount[];
  suppressedGroups: number;
  withProgramme: number;
  smallGroupThreshold: number;
};

function summariseByDay(rows: AnalysisRow[]): { date: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const timestamp = Date.parse(row.created_at);
    if (Number.isNaN(timestamp)) continue;
    const date = new Date(timestamp).toISOString().slice(0, 10);
    map.set(date, (map.get(date) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function computeProgrammeCounts(rows: AnalysisRow[]): {
  programmes: ProgrammeCount[];
  suppressedGroups: number;
  withProgramme: number;
} {
  const map = new Map<string, number>();
  for (const row of rows) {
    const value = row.answers?.profile_programme;
    if (typeof value === "string" && value.length > 0) {
      map.set(value, (map.get(value) ?? 0) + 1);
    }
  }

  const withProgramme = [...map.values()].reduce((sum, n) => sum + n, 0);
  const programmes: ProgrammeCount[] = [];
  let suppressedGroups = 0;
  let suppressedCount = 0;

  for (const [value, count] of [...map.entries()].sort((a, b) => b[1] - a[1])) {
    if (count < SMALL_GROUP_THRESHOLD) {
      suppressedGroups += 1;
      suppressedCount += count;
      continue;
    }
    programmes.push({
      value,
      label: programmeLabel(value),
      count,
      suppressed: false,
    });
  }

  if (suppressedCount > 0) {
    programmes.push({
      value: "__suppressed__",
      label: `Other (groups smaller than ${SMALL_GROUP_THRESHOLD})`,
      count: suppressedCount,
      suppressed: true,
    });
  }

  return { programmes, suppressedGroups, withProgramme };
}

export async function getOverview(rows: AnalysisRow[]): Promise<Overview> {
  const client = makeClient();
  const ready = await detectProvenance(client);

  const countRows = async (synthetic?: boolean): Promise<number> => {
    let query = client
      .from("survey_submissions")
      .select("id", { count: "exact", head: true });
    if (synthetic !== undefined) {
      query = query.eq(SYNTHETIC_COLUMN, synthetic);
    }
    const { count, error } = await query;
    if (error) {
      throw new AdminDataError("Could not count survey responses.");
    }
    return count ?? 0;
  };

  let total: number;
  let genuine: number;
  let synthetic: number;
  if (ready) {
    [total, genuine, synthetic] = await Promise.all([
      countRows(),
      countRows(false),
      countRows(true),
    ]);
  } else {
    // No provenance columns: every stored row is genuine by construction.
    genuine = await countRows();
    total = genuine;
    synthetic = 0;
  }
  if (total === 0) total = rows.length;

  const { programmes, suppressedGroups, withProgramme } =
    computeProgrammeCounts(rows);

  const byDay = summariseByDay(rows);
  const withTimestamps = rows
    .map((row) => ({ row, ts: Date.parse(row.created_at) }))
    .filter((entry) => !Number.isNaN(entry.ts))
    .sort((a, b) => a.ts - b.ts);

  const versionMap = new Map<string, number>();
  for (const row of rows) {
    versionMap.set(row.schema_version, (versionMap.get(row.schema_version) ?? 0) + 1);
  }

  return {
    total,
    genuine,
    synthetic,
    syntheticSharePct: total ? (synthetic / total) * 100 : 0,
    loaded: rows.length,
    truncated: total > rows.length,
    latestAt: withTimestamps.at(-1)?.row.created_at ?? null,
    periodStart: withTimestamps.at(0)?.row.created_at ?? null,
    periodEnd: withTimestamps.at(-1)?.row.created_at ?? null,
    versions: [...versionMap.entries()]
      .map(([version, c]) => ({ version, count: c }))
      .sort((a, b) => a.version.localeCompare(b.version)),
    byDay,
    programmes,
    suppressedGroups,
    withProgramme,
    smallGroupThreshold: SMALL_GROUP_THRESHOLD,
  };
}

export type ResponseSummary = {
  id: string;
  createdAt: string;
  schemaVersion: string;
  programme: string | null;
  hasName: boolean;
  hasPhone: boolean;
  isSynthetic: boolean;
  syntheticBatchId: string | null;
};

function toSummary(row: {
  id: unknown;
  created_at: unknown;
  schema_version: unknown;
  answers: unknown;
  is_synthetic?: unknown;
  synthetic_batch_id?: unknown;
}): ResponseSummary {
  const answers = (row.answers ?? {}) as Record<string, unknown>;
  const programme =
    typeof answers.profile_programme === "string" ? answers.profile_programme : null;
  return {
    id: String(row.id),
    createdAt: String(row.created_at ?? ""),
    schemaVersion: String(row.schema_version ?? "unknown"),
    programme,
    hasName:
      typeof answers.profile_full_name === "string" &&
      answers.profile_full_name.length > 0,
    hasPhone:
      typeof answers.profile_phone === "string" &&
      answers.profile_phone.length > 0,
    isSynthetic: row.is_synthetic === true,
    syntheticBatchId:
      row.synthetic_batch_id === null || row.synthetic_batch_id === undefined
        ? null
        : String(row.synthetic_batch_id),
  };
}

export async function listResponses(
  page: number,
): Promise<{ rows: ResponseSummary[]; total: number; page: number; pageSize: number }> {
  const client = makeClient();
  const safePage = Math.max(1, Math.floor(page) || 1);
  const from = (safePage - 1) * RESPONSES_PAGE_SIZE;
  const to = from + RESPONSES_PAGE_SIZE - 1;

  const { data, error, count } = await client
    .from("survey_submissions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new AdminDataError("Could not load the response list.");
  }

  return {
    rows: (data ?? []).map(toSummary),
    total: count ?? 0,
    page: safePage,
    pageSize: RESPONSES_PAGE_SIZE,
  };
}

export type ResponseDetail = {
  id: string;
  createdAt: string;
  schemaVersion: string;
  answers: Record<string, unknown>;
  isSynthetic: boolean;
  syntheticBatchId: string | null;
};

export async function getResponseById(
  id: string,
): Promise<ResponseDetail | null> {
  const client = makeClient();
  const { data, error } = await client
    .from("survey_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new AdminDataError("Could not load that response.");
  }
  if (!data) return null;

  return {
    id: String(data.id),
    createdAt: String(data.created_at ?? ""),
    schemaVersion: String(data.schema_version ?? "unknown"),
    answers: (data.answers ?? {}) as Record<string, unknown>,
    isSynthetic: data[SYNTHETIC_COLUMN] === true,
    syntheticBatchId:
      data[SYNTHETIC_BATCH_COLUMN] === null ||
      data[SYNTHETIC_BATCH_COLUMN] === undefined
        ? null
        : String(data[SYNTHETIC_BATCH_COLUMN]),
  };
}
