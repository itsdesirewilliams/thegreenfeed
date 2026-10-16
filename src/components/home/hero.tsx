import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/site/container";

export function HomeHero() {
  return (
    <section className="bg-cream">
      <Container className="grid items-center gap-12 py-14 sm:py-18 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-24">
        <div className="flex flex-col items-start gap-7">
          <h1 className="text-display font-semibold text-forest">
            Less waste.
            <br />
            <span className="relative inline-block">
              <span
                aria-hidden="true"
                className="absolute inset-x-[-0.18em] bottom-[0.08em] top-[0.42em] -rotate-1 rounded-md bg-lime"
              />
              <span className="relative text-forest">More impact.</span>
            </span>
          </h1>
          <p className="max-w-prose text-lg text-ink/80 sm:text-xl">
            Waste management starts with everyday choices. Learn how to reduce,
            reuse, and recycle — and keep your campus and community cleaner.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              render={<Link href="/blog" />}
              size="lg"
              className="h-12 px-6 text-base"
            >
              Explore the guides
              <ArrowRight aria-hidden="true" />
            </Button>
            <Button
              render={<Link href="/survey" />}
              variant="outline"
              size="lg"
              className="h-12 px-6 text-base"
            >
              Take the survey
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl ring-1 ring-forest/10">
            <Image
              src="/images/campaign/greenfeed-1.png"
              alt="GreenFeed campaign image of students in casual clothes gathered on a beach with full waste bags and collected plastic bottles, promoting coastal cleanups."
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="relative z-10 mx-6 -mt-14 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-forest/10 sm:mx-8">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime/30 font-semibold text-forest"
            >
              3R
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate text-sm font-semibold text-forest">
                Reduce · Reuse · Recycle
              </p>
              <p className="text-sm text-muted-ink">
                Start with the guide that maps it out.
              </p>
            </div>
            <Link
              href="/blog/the-3rs-of-waste-management"
              aria-label="Read the 3Rs guide"
              className="ml-auto inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-forest text-white transition-colors hover:bg-forest/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
