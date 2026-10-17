import { requireAdminApi } from "@/lib/admin/auth";
import { AdminDataError, fetchAllRows } from "@/lib/admin/data";
import { buildRawResponsesWorkbook } from "@/lib/admin/workbooks";
import { xlsxResponse } from "@/lib/admin/xlsx-response";

/**
 * Raw response export (admin only, sensitive).
 *
 * A teacher-ready Excel workbook: identifying details, consent and every answer
 * already mapped to its readable option label, grouped by instrument version so
 * dissimilar questionnaires are never mixed on one sheet. Every request is
 * re-authorised server-side and the file is generated on the server, streamed
 * only to an authenticated admin.
 */
export async function GET() {
  if (!(await requireAdminApi())) {
    return new Response("Not authorised.", { status: 401 });
  }

  let rows;
  try {
    rows = await fetchAllRows();
  } catch (error) {
    const message =
      error instanceof AdminDataError
        ? error.message
        : "Could not load responses.";
    return new Response(message, { status: 500 });
  }

  const workbook = buildRawResponsesWorkbook(rows);
  return xlsxResponse(workbook, "thegreenfeed-responses");
}
