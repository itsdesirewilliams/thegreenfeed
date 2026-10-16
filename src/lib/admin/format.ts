/** Formatting helpers shared by admin views. */

/**
 * Normalises any stored timestamp to a single, sortable ISO 8601 UTC string
 * (`YYYY-MM-DDTHH:MM:SS.sssZ`). Postgres/Supabase return TIMESTAMPTZ with a
 * `+00:00` offset, which would otherwise make CSVs inconsistent, so every export
 * runs timestamps through this. Returns "" for missing/invalid input.
 */
export function toIsoUtc(value: string | null | undefined): string {
  if (!value) return "";
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "";
  return new Date(timestamp).toISOString();
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return "—";
  return new Date(timestamp).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return "—";
  return new Date(timestamp).toLocaleDateString("en-GB", {
    dateStyle: "medium",
    timeZone: "UTC",
  });
}

export function formatPct(value: number): string {
  return `${Math.round(value)}%`;
}
