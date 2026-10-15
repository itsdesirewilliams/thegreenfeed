import Link from "next/link";
import { InstagramIcon } from "@/components/site/icons";
import { Container } from "@/components/site/container";
import { NavLinks } from "@/components/site/nav-links";
import { MobileNav } from "@/components/site/mobile-nav";
import { SITE } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-cream">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="font-serif text-2xl leading-none text-forest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
        >
          TheGreenFeed
        </Link>

        <div className="flex items-center gap-2">
          <NavLinks className="hidden md:flex" />
          <Link
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TheGreenFeed on Instagram"
            className="hidden size-9 items-center justify-center rounded-full text-forest transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest md:inline-flex"
          >
            <InstagramIcon className="size-5" />
          </Link>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
