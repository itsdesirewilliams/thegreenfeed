import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared section heading: a weighted title and an optional description.
 * `tone` switches the palette for deep-green sections.
 */
export function SectionHeading({
  title,
  description,
  tone = "light",
  align = "left",
  className,
}: {
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
      <h2
        className={cn(
          "text-title font-semibold",
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
