import { requireAdminApi } from "@/lib/admin/auth";
import { AdminDataError, computeProgrammeCounts, fetchAllRows } from "@/lib/admin/data";
import { buildAnalysisWorkbook } from "@/lib/admin/workbooks";
import { xlsxResponse } from "@/lib/admin/xlsx-response";
import { buildAnalysis } from "@/lib/analysis";

/**
 * Aggregate analysis export (admin only).
 *
 * Three worksheets: Summary, Question Results and Advanced Analysis. Names,
 * phone numbers and raw per-respondent rows are excluded by construction.
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
      error instanceof AdminDataError ? error.message : "Could not load responses.";
    return new Response(message, { status: 500 });
  }

  const analysis = buildAnalysis(rows);
  const { programmes } = computeProgrammeCounts(rows);
  const workbook = buildAnalysisWorkbook(analysis, {
    programmeGroups: programmes.map((entry) => ({
      label: entry.label,
      count: entry.count,
    })),
  });

  return xlsxResponse(workbook, "thegreenfeed-analysis");
}
