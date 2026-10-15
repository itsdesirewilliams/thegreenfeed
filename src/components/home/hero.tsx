import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/site/container";

export function HomeHero() {
  return (
    <section className="bg-cream">
      <Container className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <div className="flex flex-col items-start gap-6">
          <p className="inline-flex items-center rounded-full bg-lime/30 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-forest uppercase">
            TheGreenFeed
          </p>
          <h1 className="font-serif text-display text-forest">
            Less Waste. More Impact.
          </h1>
          <p className="max-w-prose text-lg text-ink/80">
            Waste management starts with everyday choices. Learn how to reduce,
            reuse, recycle, and keep your campus and community cleaner.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              render={<Link href="/blog" />}
              size="lg"
              className="h-12 px-6 text-base"
            >
              Explore the Guides
            </Button>
            <Button
              render={<Link href="/survey" />}
              variant="outline"
              size="lg"
              className="h-12 px-6 text-base"
            >
              Take the Survey
            </Button>
          </div>
        </div>

        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl ring-1 ring-forest/10 sm:aspect-[16/11] lg:aspect-[4/5]">
          <Image
            src="/images/campaign/greenfeed-1.png"
            alt="GreenFeed campaign image of students in casual clothes gathered on a beach with full waste bags and collected plastic bottles, promoting coastal cleanups."
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
        </div>
      </Container>
    </section>
  );
}
