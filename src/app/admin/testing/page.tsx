import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader, Panel, Stat } from "@/components/admin/bits";
import { ErrorPanel } from "@/components/admin/error-panel";
import { requireAdmin } from "@/lib/admin/auth";
import { fetchSyntheticRows } from "@/lib/admin/data";
import { load } from "@/lib/admin/load";
import { formatDateTime } from "@/lib/admin/format";
import { SYNTHETIC_INCLUDED_NOTE, SYNTHETIC_LABEL } from "@/data/survey-questions";

export const instant = false;

export const metadata: Metadata = { title: "Testing data" };

export default async function AdminTestingPage() {
  await requireAdmin();

  const result = await load(() => fetchSyntheticRows());

  if (!result.ok) {
    return <ErrorPanel error={result.error} />;
  }

  const { ready, rows, batches } = result.data;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Testing data"
        description="Synthetic rows included in the analysis and exports to exercise those views — always labelled as test data."
      />

      <Alert variant="destructive">
        <FlaskConical />
        <AlertTitle>{SYNTHETIC_LABEL} — not research findings</AlertTitle>
        <AlertDescription>
          These rows are generated for testing. {SYNTHETIC_INCLUDED_NOTE} They
          must never be presented as real responses.
        </AlertDescription>
      </Alert>

      {!ready ? (
        <Panel title="Provenance not configured">
          <p className="text-sm text-ink">
            The synthetic-provenance columns are not present in the database yet,
            so no synthetic batch can exist. Apply the provenance migration
            (<code>supabase/migrations/20261016000000_survey_provenance.sql</code>)
            before importing test data. Genuine collection is unaffected.
          </p>
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Synthetic rows" value={rows.length} />
            <Stat label="Batches" value={batches.length} />
            <Stat
              label="Latest synthetic row"
              value={
                <span className="text-base">
                  {rows.length ? formatDateTime(rows[0].createdAt) : "—"}
                </span>
              }
            />
          </div>

          <Panel
            title="Batches"
            description="Each batch maps to one import run and can be removed together."
          >
            {batches.length === 0 ? (
              <p className="text-sm text-muted-ink">
                No synthetic batches are present.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <caption className="sr-only">Synthetic import batches</caption>
                  <thead>
                    <tr className="border-b border-hairline text-left text-muted-ink">
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Batch id
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Rows
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Earliest
                      </th>
                      <th scope="col" className="py-2 font-medium">
                        Latest
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((batch) => (
                      <tr
                        key={batch.batchId ?? "__unbatched__"}
                        className="border-b border-hairline/60"
                      >
                        <td className="py-2 pr-3 font-mono text-xs text-muted-ink">
                          {batch.batchId ?? "(unbatched)"}
                        </td>
                        <td className="py-2 pr-3">{batch.count}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {formatDateTime(batch.earliestAt)}
                        </td>
                        <td className="py-2 whitespace-nowrap">
                          {formatDateTime(batch.latestAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Rows" description="Newest first. Also listed in Responses and counted in Analysis and the exports, labelled as synthetic.">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-ink">No synthetic rows.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <caption className="sr-only">Synthetic test rows</caption>
                  <thead>
                    <tr className="border-b border-hairline text-left text-muted-ink">
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Created
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Version
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        Batch
                      </th>
                      <th scope="col" className="py-2 font-medium">
                        Detail
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-hairline/60">
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {formatDateTime(row.createdAt)}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge variant="secondary">{row.schemaVersion}</Badge>
                        </td>
                        <td className="py-2 pr-3 font-mono text-xs text-muted-ink">
                          {row.batchId ?? "—"}
                        </td>
                        <td className="py-2">
                          <Link
                            className="text-forest underline"
                            href={`/admin/responses/${row.id}`}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <p className="text-sm text-muted-ink">
            See{" "}
            <Link className="text-forest underline" href="/admin/analysis">
              Analysis
            </Link>{" "}
            and{" "}
            <Link className="text-forest underline" href="/admin/exports">
              Exports
            </Link>{" "}
            to confirm synthetic rows are included and labelled by provenance.
          </p>
        </>
      )}
    </div>
  );
}
