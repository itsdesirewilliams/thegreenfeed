import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";

const TIP_GROUPS = [
  {
    title: "At college",
    tips: [
      "Carry a reusable bottle or cup.",
      "Use a lunchbox or reusable cutlery when practical.",
      "Put waste in the correct bins; avoid contaminating recycling with food.",
      "Organise a short litter-pick or campus cleanup with permission and safe handling.",
      "Print only when necessary and use both sides of paper when appropriate.",
    ],
    ctaLabel: "Read the campus guide",
    href: "/blog/cleaner-campus-starts-with-us",
  },
  {
    title: "At home",
    tips: [
      "Plan purchases and avoid excess packaging where possible.",
      "Keep reusable bags and containers handy.",
      "Separate organic waste, recyclables, and residual waste according to local rules.",
      "Compost suitable organic waste if there is a safe, practical setup.",
      "Keep batteries, e-waste, chemicals, and sharps out of ordinary waste; use appropriate local collection routes.",
    ],
    ctaLabel: "Learn how to sort waste",
    href: "/blog/waste-segregation-at-home",
  },
];

export function PracticalTips() {
  return (
    <section className="bg-deep-green">
      <Container className="py-16 sm:py-20">
        <SectionHeading
          tone="dark"
          title="Small habits, at college and at home"
          description="Simple, repeatable actions that keep shared spaces cleaner and make waste easier to handle."
        />
        <div className="mt-10 grid gap-10 rounded-3xl bg-forest/40 p-6 ring-1 ring-cream/10 sm:p-10 lg:grid-cols-2 lg:gap-16">
          {TIP_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-5">
              <h3 className="text-2xl font-semibold text-lime">{group.title}</h3>
              <ul className="flex flex-col gap-3">
                {group.tips.map((tip) => (
                  <li key={tip} className="flex gap-3 text-cream/85">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-lime"
                    />
                    <span className="text-sm sm:text-base">{tip}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={group.href}
                className="mt-auto inline-flex w-fit items-center gap-1.5 text-sm font-medium text-lime hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime"
              >
                {group.ctaLabel}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
