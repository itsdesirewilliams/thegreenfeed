import type { Workbook } from "exceljs";

const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Serialises a workbook into a downloadable `.xlsx` attachment response. The
 * file is generated on the server and marked `no-store` so a shared cache never
 * retains a copy of potentially identifying data.
 */
export async function xlsxResponse(
  workbook: Workbook,
  basename: string,
): Promise<Response> {
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `${basename}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(new Uint8Array(buffer as ArrayBuffer), {
    status: 200,
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
