import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared editorial section heading: small eyebrow label, serif title, and an
 * optional description. `tone` switches the palette for deep-green sections.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = "light",
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: "light" | "dark";
  align?: "left" | "center";
  className?: string;
}) {
  const isDark = tone === "dark";
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-[0.2em]",
            isDark ? "text-lime" : "text-muted-ink",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "font-serif text-title",
          isDark ? "text-cream" : "text-forest",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "max-w-prose text-base sm:text-lg",
            isDark ? "text-cream/75" : "text-ink/75",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
