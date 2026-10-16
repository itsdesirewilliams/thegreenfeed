import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/site/container";

export function ClosingCta() {
  return (
    <section className="bg-deep-green">
      <Container className="flex flex-col items-center gap-6 py-16 text-center sm:py-20">
        <h2 className="text-title font-semibold text-cream">
          A cleaner campus starts with us.
        </h2>
        <p className="max-w-prose text-lg text-cream/80">
          Small actions become habits when we do them together.
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <ButtonLink
            href="/blog"
            size="lg"
            className="h-12 bg-lime px-6 text-base text-deep-green hover:bg-lime/90"
          >
            Explore practical tips
          </ButtonLink>
          <ButtonLink
            href="/survey"
            variant="outline"
            size="lg"
            className="h-12 border-cream/35 bg-transparent px-6 text-base text-cream hover:bg-cream/10 hover:text-cream"
          >
            Take the survey
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
