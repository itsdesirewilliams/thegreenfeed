import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet Hannah Lepathy, founder of TheGreenFeed, and learn why the project exists: to make waste-management knowledge easier to understand and put into practice.",
};

const FACTS = [
  { label: "Founder", value: "TheGreenFeed" },
  { label: "Studying", value: "Journalism & mass communication" },
  { label: "Focus", value: "Environmental awareness" },
];

export default function AboutPage() {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <section className="bg-cream">
        <Container className="grid gap-12 py-14 sm:py-18 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:py-20">
          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-forest/10">
              <Image
                src="/images/about/hannah-lepathy.jpeg"
                alt="Hannah Lepathy, founder of TheGreenFeed, smiling outdoors in a brown coat."
                fill
                priority
                sizes="(min-width: 1024px) 38vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="relative z-10 mx-6 -mt-10 rounded-2xl bg-white p-4 shadow-card ring-1 ring-forest/10">
              <p className="text-sm font-semibold text-forest">
                Hannah Lepathy
              </p>
              <p className="text-sm text-muted-ink">
                Founder &amp; author, TheGreenFeed
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-6">
            <h1 className="text-display font-semibold text-forest">
              Meet Hannah Lepathy
            </h1>
            <p className="max-w-prose text-lg text-ink/80 sm:text-xl">
              A dedicated nature lover and passionate advocate for environmental
              protection, Hannah Lepathy is the proud owner of a dog and an
              aspiring journalist. With a strong belief in the importance of
              environmental awareness, she is currently studying journalism and
              mass communication. Hannah aims to equip herself with the
              necessary tools to raise awareness about environmental issues and
              inspire others to join the cause.
            </p>
            <dl className="grid w-full gap-3 sm:grid-cols-3">
              {FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="flex flex-col gap-1 rounded-2xl bg-white p-4 ring-1 ring-forest/10"
                >
                  <dt className="text-xs font-semibold text-muted-ink">
                    {fact.label}
                  </dt>
                  <dd className="text-sm font-medium text-forest">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button render={<Link href="/blog" />} size="lg" className="h-11 px-5">
                Read the guides
              </Button>
              <Button
                render={<Link href="/survey" />}
                variant="outline"
                size="lg"
                className="h-11 px-5"
              >
                Take the survey
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-deep-green">
        <Container className="py-16 sm:py-20">
          <div className="flex flex-col gap-3">
            <h2 className="text-title font-semibold text-cream">
              Turning awareness into everyday action
            </h2>
            <p className="max-w-prose text-base text-cream/75 sm:text-lg">
              Two ideas anchor everything TheGreenFeed publishes.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-3xl bg-cream/5 p-6 ring-1 ring-cream/10 sm:p-8">
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-xl bg-lime/20 text-sm font-semibold text-lime"
              >
                1
              </span>
              <h3 className="text-xl font-semibold text-lime">
                Why TheGreenFeed exists
              </h3>
              <p className="text-cream/85">
                To make waste-management knowledge easier to understand and put
                into practice — for anyone, starting with campus life.
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl bg-cream/5 p-6 ring-1 ring-cream/10 sm:p-8">
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-xl bg-lime/20 text-sm font-semibold text-lime"
              >
                2
              </span>
              <h3 className="text-xl font-semibold text-lime">Our aim</h3>
              <p className="text-cream/85">
                Help students and communities turn environmental awareness into
                everyday action.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
