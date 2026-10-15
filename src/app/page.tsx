import { HomeHero } from "@/components/home/hero";
import { WhyItMatters } from "@/components/home/why-it-matters";
import { ThreeRs } from "@/components/home/three-rs";
import { PracticalTips } from "@/components/home/practical-tips";
import { GreenFeedSection } from "@/components/home/greenfeed-section";
import { LatestPosts } from "@/components/home/latest-posts";
import { ClosingCta } from "@/components/home/closing-cta";

export default function HomePage() {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <HomeHero />
      <WhyItMatters />
      <ThreeRs />
      <PracticalTips />
      <GreenFeedSection />
      <LatestPosts />
      <ClosingCta />
    </main>
  );
}
