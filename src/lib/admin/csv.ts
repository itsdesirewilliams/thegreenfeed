/** Minimal CSV serialisation. No dependency needed. */

export type CsvCell = string | number | boolean | null | undefined;

function escapeCell(cell: CsvCell): string {
  const text = cell === null || cell === undefined ? "" : String(cell);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(rows: CsvCell[][]): string {
  return rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

/** Prefixes a UTF-8 BOM so Excel opens the file with the right encoding. */
export function withBom(csv: string): string {
  return `\uFEFF${csv}`;
}
