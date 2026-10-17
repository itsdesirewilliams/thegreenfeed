import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader, Bars, Panel, VersionNotice } from "@/components/admin/bits";
import { ErrorPanel } from "@/components/admin/error-panel";
import { requireAdmin } from "@/lib/admin/auth";
import { fetchAllRows } from "@/lib/admin/data";
import { load } from "@/lib/admin/load";
import { buildAnalysis, type QuestionAggregate } from "@/lib/analysis";

export const instant = false;

export const metadata: Metadata = { title: "Questions" };

const DOMINANCE_LABEL: Record<QuestionAggregate["dominance"], string> = {
  majority: "Majority (>50%)",
  plurality: "Plurality (≤50%)",
  closeSplit: "Close split (<10 pts)",
  tie: "Tie",
};

export default async function AdminQuestionsPage() {
  await requireAdmin();

  const result = await load(async () => {
    const rows = await fetchAllRows();
    return buildAnalysis(rows);
  });

  if (!result.ok) {
    return <ErrorPanel error={result.error} />;
  }

  const analysis = result.data;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Question distributions"
        description="Counts and percentages per option, over all stored responses. Missing or invalid answers are excluded from the valid denominator and shown separately. Percentages are rounded; the letters are categorical, never summed."
      />

      <VersionNotice
        analysedVersion={analysis.dataQuality.analysedVersion}
        excludedVersions={analysis.dataQuality.excludedVersions}
        unsupportedWarning={analysis.dataQuality.unsupportedWarning}
      />

      {analysis.dataQuality.sampleWarning ? (
        <p className="rounded-lg bg-secondary px-4 py-3 text-sm text-forest">
          {analysis.dataQuality.sampleWarning}
        </p>
      ) : null}

      {analysis.questions.map((question) => {
        const leaderValue = question.leadingValues[0];
        return (
          <Panel
            key={question.id}
            title={`Q${question.number}. ${question.label}`}
            description={`${question.section} · ${question.construct}`}
            actions={
              <Badge variant="secondary">
                {DOMINANCE_LABEL[question.dominance]}
              </Badge>
            }
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-4 text-sm text-muted-ink">
                <span>
                  Valid N: <strong className="text-ink">{question.validN}</strong>
                </span>
                <span>
                  Missing: <strong className="text-ink">{question.missingN}</strong>
                </span>
                <span>
                  Total responses:{" "}
                  <strong className="text-ink">{question.total}</strong>
                </span>
              </div>

              <Bars
                items={question.options.map((option) => ({
                  label: option.label,
                  count: option.count,
                  pct: option.pct,
                  emphasis: option.value === leaderValue,
                }))}
              />

              <p className="text-sm text-ink">{question.summary}</p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <caption className="sr-only">
                    Counts, percentages and interpretation for each option of Q
                    {question.number}
                  </caption>
                  <thead>
                    <tr className="border-b border-hairline text-left text-muted-ink">
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Option
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Count
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        %
                      </th>
                      <th scope="col" className="py-2 font-medium">
                        Permitted interpretation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {question.interpretations.map((option) => (
                      <tr
                        key={option.value}
                        className="border-b border-hairline/60 align-top"
                      >
                        <td className="py-2 pr-3 text-ink">
                          <span className="font-mono text-xs text-muted-ink">
                            {option.value}
                          </span>{" "}
                          {option.label}
                        </td>
                        <td className="py-2 pr-3 tabular-nums">{option.count}</td>
                        <td className="py-2 pr-3 tabular-nums">
                          {Math.round(option.pct)}%
                        </td>
                        <td className="py-2 text-muted-ink">
                          {option.interpretation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-ink">{question.caveat}</p>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
