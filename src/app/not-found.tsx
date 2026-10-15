import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main
      id="main"
      className="flex flex-1 items-center bg-cream"
    >
      <Container className="flex max-w-2xl flex-col items-start gap-5 py-20">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-ink uppercase">
          404
        </p>
        <h1 className="font-serif text-title text-forest">
          This page could not be found.
        </h1>
        <p className="max-w-prose text-ink/80">
          The link may be broken, or the page may have moved. Head back home or
          browse the guides.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button render={<Link href="/" />} size="lg" className="h-11 px-5">
            Back to home
          </Button>
          <Button
            render={<Link href="/blog" />}
            variant="outline"
            size="lg"
            className="h-11 px-5"
          >
            Browse the guides
          </Button>
        </div>
      </Container>
    </main>
  );
}
