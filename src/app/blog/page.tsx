import type { Metadata } from "next";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { BlogCard } from "@/components/blog/blog-card";
import { blogPosts } from "@/data/blog-posts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Short, practical guides to waste management from TheGreenFeed: the 3Rs, waste segregation, campus habits, and what happens to waste after collection.",
};

export default function BlogPage() {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <section className="bg-cream">
        <Container className="py-14 sm:py-16">
          <SectionHeading
            title="Practical waste-management guides"
            description="Plain-language, practical articles for students and communities. Written by Hannah Lepathy."
          />
        </Container>
      </section>

      <section className="flex-1 bg-white">
        <Container className="py-12 sm:py-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post, index) => (
              <BlogCard
                key={post.slug}
                post={post}
                priority={index < 3}
              />
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
