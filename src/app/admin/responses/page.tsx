import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { AdminPageHeader, Panel } from "@/components/admin/bits";
import { ErrorPanel } from "@/components/admin/error-panel";
import { requireAdmin } from "@/lib/admin/auth";
import { listResponses, programmeLabel } from "@/lib/admin/data";
import { load } from "@/lib/admin/load";
import { formatDateTime } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export const instant = false;

export const metadata: Metadata = { title: "Responses" };

function pageHref(page: number): string {
  return page <= 1 ? "/admin/responses" : `/admin/responses?page=${page}`;
}

export default async function AdminResponsesPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();

  const params = await props.searchParams;
  const requested = Number.parseInt(params.page ?? "1", 10);

  const result = await load(() =>
    listResponses(Number.isNaN(requested) ? 1 : requested),
  );

  if (!result.ok) {
    return <ErrorPanel error={result.error} />;
  }

  const { rows, total, page, pageSize } = result.data;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Responses"
        description="Paginated list of survey submissions. Names are shown here; phone numbers appear only inside the protected detail view."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/analysis"
              className="text-sm text-muted-ink underline underline-offset-4 hover:text-forest"
            >
              {total} response{total === 1 ? "" : "s"}
            </Link>
            <a
              href="/admin/exports/raw"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              <Download />
              Download Responses
            </a>
          </div>
        }
      />

      <Panel>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-ink">
            No responses have been recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">Survey responses</caption>
              <thead>
                <tr className="border-b border-hairline text-left text-muted-ink">
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Submitted
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Name
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Programme / course
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
                      {row.name ?? (
                        <Badge variant="outline">No name</Badge>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {row.programme ? programmeLabel(row.programme) : "—"}
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

      {totalPages > 1 ? (
        <nav
          aria-label="Pagination"
          className="flex items-center justify-between text-sm"
        >
          {page > 1 ? (
            <Link className="text-forest underline" href={pageHref(page - 1)}>
              ← Newer
            </Link>
          ) : (
            <span className="text-muted-ink">← Newer</span>
          )}
          <span className="text-muted-ink">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link className="text-forest underline" href={pageHref(page + 1)}>
              Older →
            </Link>
          ) : (
            <span className="text-muted-ink">Older →</span>
          )}
        </nav>
      ) : null}
    </div>
  );
}
