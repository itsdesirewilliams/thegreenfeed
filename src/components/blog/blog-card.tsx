import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/data/blog-posts";

export function BlogCard({
  post,
  priority = false,
}: {
  post: BlogPost;
  priority?: boolean;
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-forest/10 transition-all hover:shadow-raised hover:shadow-forest/10">
      <Link
        href={`/blog/${post.slug}`}
        className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary">
          <Image
            src={post.coverImage}
            alt={post.coverImageAlt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none"
          />
        </div>
        <div className="flex flex-1 flex-col gap-2.5 p-5">
          <h3 className="text-lg font-semibold leading-snug text-forest group-hover:underline group-hover:decoration-lime group-hover:decoration-2 group-hover:underline-offset-4">
            {post.title}
          </h3>
          <p className="line-clamp-3 text-sm text-ink/75">{post.summary}</p>
          <p className="mt-auto pt-2 text-sm text-muted-ink">
            By {post.author}
          </p>
        </div>
      </Link>
    </article>
  );
}
