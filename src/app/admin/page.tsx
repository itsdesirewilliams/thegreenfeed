import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AdminPageHeader, Bars, Panel, Stat, VersionNotice } from "@/components/admin/bits";
import { ErrorPanel } from "@/components/admin/error-panel";
import { requireAdmin } from "@/lib/admin/auth";
import { fetchAllRows, getOverview } from "@/lib/admin/data";
import { load } from "@/lib/admin/load";
import { buildAnalysis } from "@/lib/analysis";
import { formatDateTime } from "@/lib/admin/format";

export const instant = false;

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  await requireAdmin();

  const result = await load(async () => {
    const rows = await fetchAllRows();
    const overview = await getOverview(rows);
    const analysis = buildAnalysis(rows);
    return { overview, analysis };
  });

  if (!result.ok) {
    return <ErrorPanel error={result.error} />;
  }

  const { overview, analysis } = result.data;
  const warning = analysis.dataQuality.sampleWarning;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Overview"
        description="Survey submissions. No records are fabricated, edited or deleted from here."
      />

      <VersionNotice
        analysedVersion={analysis.dataQuality.analysedVersion}
        excludedVersions={analysis.dataQuality.excludedVersions}
        unsupportedWarning={analysis.dataQuality.unsupportedWarning}
      />

      {overview.truncated ? (
        <Alert>
          <Info />
          <AlertTitle>Large dataset</AlertTitle>
          <AlertDescription>
            Showing aggregates over the most recent {overview.loaded} of{" "}
            {overview.total} responses. Older responses are still stored and count
            toward the total, but are excluded from the per-question charts on
            this page.
          </AlertDescription>
        </Alert>
      ) : null}

      {warning ? (
        <Alert>
          <Info />
          <AlertTitle>Small sample</AlertTitle>
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total responses" value={overview.total} />
        <Stat
          label="Latest submission"
          value={
            <span className="text-base">{formatDateTime(overview.latestAt)}</span>
          }
        />
        <Stat
          label="Collection period"
          value={
            <span className="text-sm">
              {overview.periodStart
                ? `${formatDateTime(overview.periodStart)} → ${formatDateTime(overview.periodEnd)}`
                : "No data yet"}
            </span>
          }
        />
        <Stat
          label="Instrument versions"
          value={
            <span className="text-base">
              {overview.versions.length
                ? overview.versions
                    .map((entry) => `${entry.version} (${entry.count})`)
                    .join(", ")
                : "—"}
            </span>
          }
        />
      </div>

      <Panel
        title="Submissions over time"
        description="Grouped by UTC day of submission."
      >
        {overview.byDay.length === 0 ? (
          <p className="text-sm text-muted-ink">No responses yet.</p>
        ) : (
          <Bars
            items={overview.byDay.map((entry) => ({
              label: entry.date,
              count: entry.count,
              pct: 0,
            }))}
          />
        )}
      </Panel>

      <Panel
        title="Programme / course breakdown"
        description={`Groups smaller than ${overview.smallGroupThreshold} are combined to avoid identifying individuals.`}
        actions={
          overview.suppressedGroups > 0 ? (
            <span className="text-xs text-muted-ink">
              {overview.suppressedGroups} small group(s) combined
            </span>
          ) : null
        }
      >
        {overview.withProgramme === 0 ? (
          <p className="text-sm text-muted-ink">
            No programme data recorded yet (legacy responses may not include it).
          </p>
        ) : (
          <Bars
            items={overview.programmes.map((entry) => ({
              label: entry.label,
              count: entry.count,
              pct: (entry.count / overview.withProgramme) * 100,
            }))}
          />
        )}
      </Panel>

      <p className="text-sm text-muted-ink">
        See{" "}
        <Link className="text-forest underline" href="/admin/analysis">
          Analysis
        </Link>{" "}
        for deterministic findings, cross-question patterns and recommendations.
      </p>
    </div>
  );
}
