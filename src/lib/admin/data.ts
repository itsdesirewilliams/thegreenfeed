import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { AnalysisRow } from "@/lib/analysis";
import {
  SURVEY_PROFILE_FIELDS,
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

/** Fetches every stored response (capped) for server-side aggregation. */
export async function fetchAllRows(): Promise<AnalysisRow[]> {
  const client = makeClient();
  const rows: AnalysisRow[] = [];

  for (let from = 0; from < MAX_ROWS; from += FETCH_PAGE_SIZE) {
    const to = Math.min(from + FETCH_PAGE_SIZE - 1, MAX_ROWS - 1);
    const { data, error } = await client
      .from("survey_submissions")
      .select("id, schema_version, created_at, answers")
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
      });
    }
    if (data.length < FETCH_PAGE_SIZE) break;
  }

  return rows;
}

export type ProgrammeCount = {
  value: string;
  label: string;
  count: number;
  suppressed: boolean;
};

export type Overview = {
  total: number;
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
  const { count, error } = await client
    .from("survey_submissions")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new AdminDataError("Could not count survey responses.");
  }

  const total = count ?? rows.length;
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
};

function toSummary(row: {
  id: unknown;
  created_at: unknown;
  schema_version: unknown;
  answers: unknown;
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
    .select("id, created_at, schema_version, answers", { count: "exact" })
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
};

export async function getResponseById(
  id: string,
): Promise<ResponseDetail | null> {
  const client = makeClient();
  const { data, error } = await client
    .from("survey_submissions")
    .select("id, created_at, schema_version, answers")
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
  };
}
