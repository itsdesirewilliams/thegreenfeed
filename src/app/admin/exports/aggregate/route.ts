import { requireAdminApi } from "@/lib/admin/auth";
import {
  AdminDataError,
  computeProgrammeCounts,
  fetchAllRows,
  SMALL_GROUP_THRESHOLD,
} from "@/lib/admin/data";
import { toCsv, withBom, type CsvCell } from "@/lib/admin/csv";
import { toIsoUtc } from "@/lib/admin/format";
import { buildAnalysis } from "@/lib/analysis";

/**
 * Aggregate analysis export (admin only).
 *
 * Contains counts, percentages, patterns and recommendations. Names, phone
 * numbers and raw per-respondent rows are excluded by construction.
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
  const generatedAt = new Date().toISOString();
  const { programmes } = computeProgrammeCounts(rows);

  const lines: CsvCell[][] = [];

  lines.push(["TheGreenFeed aggregate analysis"]);
  lines.push(["generated_at", generatedAt]);
  lines.push(["total_responses", analysis.dataQuality.totalResponses]);
  lines.push(["analysed_responses", analysis.dataQuality.analysedResponses]);
  lines.push([
    "instrument_versions",
    analysis.dataQuality.versions.map((v) => `${v.version} (${v.count})`).join("; "),
  ]);
  lines.push(["analysed_version", analysis.dataQuality.analysedVersion]);
  lines.push([
    "excluded_versions",
    analysis.dataQuality.excludedVersions
      .map((v) => `${v.version} (${v.count})`)
      .join("; "),
  ]);
  lines.push([
    "unsupported_versions",
    analysis.dataQuality.unsupportedVersions
      .map((v) => `${v.version} (${v.count})`)
      .join("; "),
  ]);
  lines.push(["period_start", toIsoUtc(analysis.dataQuality.periodStart)]);
  lines.push(["period_end", toIsoUtc(analysis.dataQuality.periodEnd)]);
  lines.push(["small_group_threshold", SMALL_GROUP_THRESHOLD]);
  lines.push(["sample_warning", analysis.dataQuality.sampleWarning ?? ""]);
  lines.push([]);

  lines.push([
    "question_id",
    "number",
    "section",
    "construct",
    "option_value",
    "option_label",
    "count",
    "pct",
    "valid_n",
    "missing_n",
    "dominance",
  ]);
  for (const question of analysis.questions) {
    for (const option of question.options) {
      lines.push([
        question.id,
        question.number,
        question.section,
        question.construct,
        option.value,
        option.label,
        option.count,
        option.pct.toFixed(1),
        question.validN,
        question.missingN,
        question.dominance,
      ]);
    }
  }
  lines.push([]);

  lines.push(["programme", "count", "suppressed", "small_group_threshold"]);
  for (const entry of programmes) {
    lines.push([entry.label, entry.count, entry.suppressed, SMALL_GROUP_THRESHOLD]);
  }
  lines.push([]);

  lines.push(["pattern_id", "label", "triggered", "rule", "evidence", "actions"]);
  for (const pattern of analysis.patterns) {
    lines.push([
      pattern.id,
      pattern.label,
      pattern.triggered,
      pattern.rule,
      pattern.evidence.map((e) => `${e.label}: ${e.detail}`).join("; "),
      pattern.actions.join("; "),
    ]);
  }
  lines.push([]);

  lines.push(["audience", "action", "evidence", "caveat"]);
  for (const recommendation of analysis.recommendations) {
    lines.push([
      recommendation.audience,
      recommendation.action,
      recommendation.evidence.join("; "),
      recommendation.caveat,
    ]);
  }
  lines.push([]);

  lines.push(["limitations"]);
  for (const limitation of analysis.limitations) {
    lines.push([limitation]);
  }

  const csv = withBom(toCsv(lines));
  const filename = `thegreenfeed-analysis-${generatedAt.slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
