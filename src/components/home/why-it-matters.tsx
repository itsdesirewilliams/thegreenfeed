import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";

export function WhyItMatters() {
  return (
    <section className="bg-white">
      <Container className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <SectionHeading title="How we handle waste shapes the world around us." />
        <div className="flex flex-col gap-6">
          <p className="max-w-prose text-lg text-ink/80">
            How we buy, use, separate, and dispose of materials affects the
            cleanliness of our surroundings and the resources we use.
          </p>
          <p className="max-w-prose text-base text-ink/75">
            When different kinds of waste are mixed together, useful materials
            become harder to recover, and waste that is mishandled is more
            likely to end up polluting land and water. Handling it well is not
            complicated — it starts with a few everyday decisions that anyone
            can make.
          </p>
          <blockquote className="pt-2 text-2xl font-semibold leading-snug text-forest">
            The best waste is the waste we never create.
          </blockquote>
        </div>
      </Container>
    </section>
  );
}
