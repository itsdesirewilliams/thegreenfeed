import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-forest">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-ink">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-white p-4 ring-1 ring-forest/10">
      <span className="text-xs font-medium tracking-wide text-muted-ink uppercase">
        {label}
      </span>
      <span className="text-2xl font-semibold text-forest">{value}</span>
      {hint ? <span className="text-xs text-muted-ink">{hint}</span> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("bg-white ring-forest/10", className)}>
      {title ? (
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-forest">{title}</CardTitle>
            {actions}
          </div>
          {description ? (
            <p className="text-sm text-muted-ink">{description}</p>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export type BarItem = {
  label: string;
  count: number;
  pct: number;
  emphasis?: boolean;
};

/**
 * Accessible horizontal bars. Counts are always shown as text, so the chart is
 * readable even where the bar rendering is not (and the tables on the same pages
 * carry the full numbers).
 */
export function Bars({ items }: { items: BarItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-ink">No data yet.</p>;
  }
  const max = Math.max(1, ...items.map((item) => item.pct));

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-ink">
              {item.emphasis ? (
                <span className="font-semibold">{item.label}</span>
              ) : (
                item.label
              )}
            </span>
            <span className="shrink-0 tabular-nums text-muted-ink">
              {item.count} · {Math.round(item.pct)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full rounded-full",
                item.emphasis ? "bg-lime" : "bg-forest/70",
              )}
              style={{ width: `${Math.max(2, (item.pct / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
