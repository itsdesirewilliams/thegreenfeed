import type { Metadata } from "next";
import { Download, ShieldAlert } from "lucide-react";
import { AdminPageHeader, Panel } from "@/components/admin/bits";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/lib/admin/auth";
import { SMALL_GROUP_THRESHOLD } from "@/lib/admin/data";

export const instant = false;

export const metadata: Metadata = { title: "Exports" };

export default async function AdminExportsPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Exports"
        description="Downloads are generated on the server and only for an authenticated admin. Files are CSV (UTF-8 with BOM) — open in Excel, Numbers or Google Sheets."
      />

      <Panel
        title="Aggregate analysis"
        description="Counts, percentages, patterns and recommendations. No names, phone numbers or per-respondent rows."
      >
        <a
          href="/admin/exports/aggregate"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          <Download />
          Download analysis CSV
        </a>
        <p className="mt-3 text-xs text-muted-ink">
          Programme groups smaller than {SMALL_GROUP_THRESHOLD} are combined
          before export.
        </p>
      </Panel>

      <Panel
        title="Raw responses (sensitive)"
        description="Every stored row, including identifying details and each answer code. Handle only in line with consent and data-protection rules."
      >
        <a
          href="/admin/exports/raw"
          className={cn(buttonVariants({ variant: "destructive" }))}
        >
          <ShieldAlert />
          Download raw CSV
        </a>
        <p className="mt-3 text-xs text-muted-ink">
          Columns: id, created_at, schema_version, name, programme, phone,
          consent, then q1–q16.
        </p>
      </Panel>
    </div>
  );
}
