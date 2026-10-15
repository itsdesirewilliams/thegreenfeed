import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/site/container";
import { BlogCard } from "@/components/blog/blog-card";
import {
  blogPosts,
  getBlogPostBySlug,
  getRelatedPosts,
} from "@/data/blog-posts";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Article not found" };
  }

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      images: [{ url: post.coverImage, alt: post.coverImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: [post.coverImage],
    },
  };
}

export default async function BlogArticlePage(
  props: PageProps<"/blog/[slug]">,
) {
  const { slug } = await props.params;
  const post = getBlogPostBySlug(slug);

  if (!post) notFound();

  const related = getRelatedPosts(post);

  return (
    <main id="main" className="flex flex-1 flex-col">
      <article>
        <header className="bg-cream">
          <Container className="max-w-3xl py-12 sm:py-16">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to blog
            </Link>
            <h1 className="mt-6 font-serif text-title text-balance text-forest">
              {post.title}
            </h1>
            <p className="mt-4 text-xs font-semibold tracking-wide text-muted-ink uppercase">
              By {post.author}
            </p>
            <p className="mt-6 text-lg text-ink/80">{post.intro}</p>
          </Container>
        </header>

        <div className="bg-white">
          <Container className="max-w-3xl py-10 sm:py-12">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl ring-1 ring-forest/10">
              <Image
                src={post.coverImage}
                alt={post.coverImageAlt}
                fill
                priority
                sizes="(min-width: 768px) 768px, 100vw"
                className="object-cover"
              />
            </div>

            <div className="mt-10 flex flex-col gap-8">
              {post.sections.map((section) => (
                <section key={section.heading} className="flex flex-col gap-3">
                  <h2 className="font-serif text-2xl text-forest">
                    {section.heading}
                  </h2>
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="max-w-prose text-base leading-relaxed text-ink/80"
                    >
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
            </div>

            <aside className="mt-10 rounded-2xl border-l-4 border-lime bg-cream p-6">
              <p className="text-xs font-semibold tracking-[0.2em] text-muted-ink uppercase">
                Takeaway
              </p>
              <p className="mt-2 font-serif text-xl text-forest">
                {post.takeaway}
              </p>
            </aside>
          </Container>
        </div>
      </article>

      {related.length > 0 ? (
        <section className="bg-cream">
          <Container className="py-12 sm:py-16">
            <h2 className="font-serif text-2xl text-forest">Related articles</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((relatedPost) => (
                <BlogCard key={relatedPost.slug} post={relatedPost} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </main>
  );
}
