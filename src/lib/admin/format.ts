/** Formatting helpers shared by admin views. */

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
