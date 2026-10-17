import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader, Panel, ProvenanceNotice, VersionNotice } from "@/components/admin/bits";
import { ErrorPanel } from "@/components/admin/error-panel";
import { requireAdmin } from "@/lib/admin/auth";
import { fetchAllRows } from "@/lib/admin/data";
import { load } from "@/lib/admin/load";
import { buildAnalysis, type RecommendationAudience } from "@/lib/analysis";
import { formatDateTime } from "@/lib/admin/format";

export const instant = false;

export const metadata: Metadata = { title: "Analysis" };

const AUDIENCE_ORDER: RecommendationAudience[] = [
  "Verify on campus",
  "College administration",
  "TheGreenFeed",
  "Students",
];

export default async function AdminAnalysisPage() {
  await requireAdmin();

  const result = await load(async () => {
    const rows = await fetchAllRows();
    return buildAnalysis(rows);
  });

  if (!result.ok) {
    return <ErrorPanel error={result.error} />;
  }

  const analysis = result.data;
  const { dataQuality, method } = analysis;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Analysis & conclusions"
        description="Deterministic, rule-based findings from the stored responses. Every rule and threshold is shown. This is descriptive analysis — not proof of cause, effectiveness or representativeness."
      />

      <VersionNotice
        analysedVersion={dataQuality.analysedVersion}
        excludedVersions={dataQuality.excludedVersions}
        unsupportedWarning={dataQuality.unsupportedWarning}
      />

      <ProvenanceNotice
        genuine={dataQuality.genuineResponses}
        synthetic={dataQuality.syntheticResponses}
        sharePct={dataQuality.syntheticSharePct}
      />

      {dataQuality.sampleWarning ? (
        <p className="rounded-lg bg-secondary px-4 py-3 text-sm text-forest">
          {dataQuality.sampleWarning}
        </p>
      ) : null}

      <Panel
        title="Data quality & sample"
        description="Read every finding below against these numbers."
      >
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-ink uppercase">Total responses</dt>
            <dd className="text-lg font-semibold text-forest">
              {dataQuality.totalResponses}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-ink uppercase">Genuine responses</dt>
            <dd className="text-lg font-semibold text-forest">
              {dataQuality.genuineResponses}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-ink uppercase">
              Synthetic responses
            </dt>
            <dd className="text-lg font-semibold text-forest">
              {dataQuality.syntheticResponses}
              <span className="ml-1 text-xs font-normal text-muted-ink">
                ({Math.round(dataQuality.syntheticSharePct)}%)
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-ink uppercase">
              With analysable answers
            </dt>
            <dd className="text-lg font-semibold text-forest">
              {dataQuality.analysedResponses}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-ink uppercase">
              Minimum N for interpretation
            </dt>
            <dd className="text-lg font-semibold text-forest">
              {dataQuality.minimumNForInterpretation}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-ink uppercase">Collection period</dt>
            <dd className="text-sm text-ink">
              {dataQuality.periodStart
                ? `${formatDateTime(dataQuality.periodStart)} → ${formatDateTime(dataQuality.periodEnd)}`
                : "No data yet"}
            </dd>
          </div>
        </dl>
      </Panel>

      <Panel
        title="Triggered patterns"
        description="Cross-question checks evaluated against the real responses. Triggered rows name their evidence and joint denominators."
      >
        <ul className="flex flex-col gap-4">
          {analysis.patterns.map((pattern) => (
            <li
              key={pattern.id}
              className="flex flex-col gap-2 rounded-lg border border-hairline p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={pattern.triggered ? "default" : "outline"}>
                  {pattern.triggered ? "Triggered" : "Not triggered"}
                </Badge>
                <span className="font-medium text-forest">{pattern.label}</span>
              </div>
              <p className="text-xs text-muted-ink">Rule: {pattern.rule}</p>
              <ul className="flex flex-col gap-1 text-sm text-ink">
                {pattern.evidence.map((entry) => (
                  <li key={entry.label}>
                    {entry.label}:{" "}
                    <span className="tabular-nums">{entry.detail}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-ink">{pattern.meaning}</p>
              {pattern.triggered ? (
                <ul className="list-disc pl-5 text-sm text-muted-ink">
                  {pattern.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              ) : null}
              <p className="text-xs text-muted-ink">{pattern.caveat}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title="Recommendations"
        description="Each recommendation names its supporting evidence, the uncertainty, and a low-cost next step. Preferences are hypotheses, not proof of effectiveness."
      >
        <div className="flex flex-col gap-4">
          {AUDIENCE_ORDER.map((audience) => {
            const items = analysis.recommendations.filter(
              (entry) => entry.audience === audience,
            );
            if (items.length === 0) return null;
            return (
              <div key={audience} className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold tracking-wide text-forest uppercase">
                  {audience}
                </h3>
                <ul className="flex flex-col gap-3">
                  {items.map((item) => (
                    <li
                      key={`${audience}-${item.action}`}
                      className="rounded-lg border border-hairline p-3"
                    >
                      <p className="text-sm text-ink">{item.action}</p>
                      <p className="mt-1 text-xs text-muted-ink">
                        Evidence: {item.evidence.join(" · ")}
                      </p>
                      <p className="mt-1 text-xs text-muted-ink">
                        Uncertainty: {item.caveat}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel
        title="Synthesis"
        description="Kept as separate dimensions — never collapsed into a single 'score'."
      >
        <div className="flex flex-col gap-4">
          {analysis.synthesisSummary.length > 0 ? (
            <ul className="list-disc pl-5 text-sm text-ink">
              {analysis.synthesisSummary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-ink">
              No synthesis rule has enough support with the current responses.
            </p>
          )}
          <div className="flex flex-col gap-3">
            {analysis.synthesis.map((dimension) => (
              <div
                key={dimension.id}
                className="rounded-lg border border-hairline p-3"
              >
                <h3 className="text-sm font-semibold text-forest">
                  {dimension.label}
                </h3>
                <ul className="mt-1 list-disc pl-5 text-sm text-muted-ink">
                  {dimension.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel
        title="Method, thresholds & guardrails"
        description="The rules applied to every view above."
      >
        <ul className="list-disc pl-5 text-sm text-muted-ink">
          <li>Majority: {method.dominance.majority}.</li>
          <li>Plurality: {method.dominance.plurality}.</li>
          <li>Close split: {method.dominance.closeSplit}.</li>
          <li>Tie: {method.dominance.tie}.</li>
          <li>{method.dominance.smallSampleWarning}</li>
          {method.guardrails.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </Panel>

      <Panel title="Limitations">
        <ul className="list-disc pl-5 text-sm text-muted-ink">
          {analysis.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
