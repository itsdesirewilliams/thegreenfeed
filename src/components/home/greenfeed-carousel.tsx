"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { InstagramPost } from "@/data/instagram-posts";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 6000;

export function GreenFeedCarousel({ posts }: { posts: InstagramPost[] }) {
  const count = posts.length;
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  const isPlaying =
    !userPaused && !hovering && !focusWithin && !reducedMotion && count > 1;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % count),
      AUTOPLAY_MS,
    );
    return () => window.clearInterval(timer);
  }, [isPlaying, count]);

  if (count === 0) return null;

  const active = posts[index];

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="GreenFeed campaign highlights"
      className="relative mx-auto w-full max-w-md"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={() => setFocusWithin(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goPrev();
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          goNext();
        }
      }}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-deep-green ring-1 ring-forest/10">
        <div
          className="flex h-full transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {posts.map((post, i) => (
            <a
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={i === index ? 0 : -1}
              aria-hidden={i !== index}
              aria-label={`${post.alt} (opens Instagram in a new tab)`}
              className="relative h-full w-full shrink-0 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-lime"
            >
              <Image
                src={post.src}
                alt=""
                fill
                priority={i === 0}
                sizes="(min-width: 768px) 28rem, 100vw"
                className="object-cover"
              />
            </a>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Slide {index + 1} of {count}: {active.alt}
      </p>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous slide"
          className="inline-flex size-9 items-center justify-center rounded-full border border-hairline bg-white text-forest transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        {!reducedMotion ? (
          <button
            type="button"
            onClick={() => setUserPaused((paused) => !paused)}
            aria-label={userPaused ? "Resume slideshow" : "Pause slideshow"}
            className="inline-flex size-9 items-center justify-center rounded-full border border-hairline bg-white text-forest transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            {userPaused ? (
              <Play className="size-4" aria-hidden="true" />
            ) : (
              <Pause className="size-4" aria-hidden="true" />
            )}
          </button>
        ) : null}

        <button
          type="button"
          onClick={goNext}
          aria-label="Next slide"
          className="inline-flex size-9 items-center justify-center rounded-full border border-hairline bg-white text-forest transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {posts.map((post, i) => (
          <button
            key={post.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
            className={cn(
              "h-2 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest",
              i === index ? "w-6 bg-forest" : "w-2 bg-forest/25 hover:bg-forest/40",
            )}
          />
        ))}
      </div>
    </div>
  );
}
