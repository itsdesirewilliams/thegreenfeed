import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet Hannah Lepathy, founder of TheGreenFeed, and learn why the project exists: to make waste-management knowledge easier to understand and put into practice.",
};

export default function AboutPage() {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <section className="bg-cream">
        <Container className="grid gap-10 py-14 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16 lg:py-20">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl ring-1 ring-forest/10">
            <Image
              src="/images/about/hannah-lepathy.jpeg"
              alt="Hannah Lepathy, founder of TheGreenFeed, smiling outdoors in a brown coat."
              fill
              priority
              sizes="(min-width: 1024px) 32vw, 100vw"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col gap-5">
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-ink uppercase">
              About
            </p>
            <h1 className="font-serif text-display text-forest">
              Meet Hannah Lepathy
            </h1>
            <p className="max-w-prose text-lg text-ink/80">
              A dedicated nature lover and passionate advocate for environmental
              protection, Hannah Lepathy is the proud owner of a dog and an
              aspiring journalist. With a strong belief in the importance of
              environmental awareness, she is currently studying journalism and
              mass communication. Hannah aims to equip herself with the
              necessary tools to raise awareness about environmental issues and
              inspire others to join the cause.
            </p>
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
          <SectionHeading
            eyebrow="Our mission"
            tone="dark"
            title="Turning awareness into everyday action"
          />
          <div className="mt-10 grid gap-8 md:grid-cols-2 md:gap-12">
            <div className="flex flex-col gap-3 rounded-2xl bg-cream/5 p-6 ring-1 ring-cream/10">
              <h3 className="font-serif text-2xl text-lime">
                Why TheGreenFeed exists
              </h3>
              <p className="text-cream/85">
                TheGreenFeed makes waste-management knowledge easier to
                understand and put into practice.
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl bg-cream/5 p-6 ring-1 ring-cream/10">
              <h3 className="font-serif text-2xl text-lime">Our aim</h3>
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
