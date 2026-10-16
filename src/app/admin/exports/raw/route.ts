import { requireAdminApi } from "@/lib/admin/auth";
import { AdminDataError, fetchAllRows } from "@/lib/admin/data";
import { toCsv, withBom, type CsvCell } from "@/lib/admin/csv";
import { surveyQuestions } from "@/data/survey-questions";

/**
 * Raw response export (admin only, sensitive).
 *
 * Contains identifying data (name, phone) and every stored answer. Every request
 * is re-authorised server-side; the file is generated on the server and streamed
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

  const questionIds = surveyQuestions.map((question) => question.id);
  const header: CsvCell[] = [
    "id",
    "created_at",
    "schema_version",
    "profile_full_name",
    "profile_programme",
    "profile_phone",
    "consent",
    ...questionIds,
  ];

  const body: CsvCell[][] = rows.map((row) => [
    row.id,
    row.created_at,
    row.schema_version,
    typeof row.answers.profile_full_name === "string"
      ? row.answers.profile_full_name
      : "",
    typeof row.answers.profile_programme === "string"
      ? row.answers.profile_programme
      : "",
    typeof row.answers.profile_phone === "string" ? row.answers.profile_phone : "",
    row.answers.consent === true ? "true" : "",
    ...questionIds.map((id) =>
      typeof row.answers[id] === "string" ? (row.answers[id] as string) : "",
    ),
  ]);

  const csv = withBom(toCsv([header, ...body]));
  const filename = `thegreenfeed-raw-responses-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
