import Link from "next/link";
import { InstagramIcon } from "@/components/site/icons";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { GreenFeedCarousel } from "@/components/home/greenfeed-carousel";
import { INSTAGRAM_PROFILE_URL, instagramPosts } from "@/data/instagram-posts";
import { SITE } from "@/lib/site";

export function GreenFeedSection() {
  return (
    <section className="bg-cream">
      <Container className="py-16 sm:py-20">
        <SectionHeading
          eyebrow="From the campaign"
          align="center"
          title="GreenFeed in Action"
          description="Highlights from the GreenFeed campaign. Tap any slide to visit the profile on Instagram."
        />
        <div className="mt-10">
          <GreenFeedCarousel posts={instagramPosts} />
        </div>
        <div className="mt-8 flex justify-center">
          <Link
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-forest/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            <InstagramIcon className="size-4" />
            Follow {SITE.instagramHandle}
          </Link>
        </div>
      </Container>
    </section>
  );
}
