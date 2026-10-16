import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";

const PRINCIPLES = [
  {
    step: "01",
    title: "Reduce",
    body: "Avoid unnecessary purchases and single-use items. Preventing waste usually takes fewer resources than dealing with it later.",
    href: "/blog/the-3rs-of-waste-management",
  },
  {
    step: "02",
    title: "Reuse",
    body: "Refill, repair, borrow, donate, and use items again. Reuse keeps useful things in circulation for longer.",
    href: "/blog/the-3rs-of-waste-management",
  },
  {
    step: "03",
    title: "Recycle",
    body: "Separate accepted materials and follow local collection rules. Recycling works best when materials are clean and sorted correctly.",
    href: "/blog/waste-segregation-at-home",
  },
];

export function ThreeRs() {
  return (
    <section className="bg-cream">
      <Container className="py-16 sm:py-20">
        <SectionHeading
          title="Start with the 3Rs"
          description="A simple way to make better decisions about the things we buy and throw away."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((principle) => (
            <Link
              key={principle.title}
              href={principle.href}
              className="group flex flex-col gap-3 rounded-2xl bg-white p-6 ring-1 ring-forest/10 transition-all hover:shadow-raised hover:shadow-forest/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-lime/30 text-lg font-semibold text-forest">
                {principle.step}
              </span>
              <h3 className="text-2xl font-semibold text-forest">
                {principle.title}
              </h3>
              <p className="text-sm text-ink/75">{principle.body}</p>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-forest">
                Read the guide
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
