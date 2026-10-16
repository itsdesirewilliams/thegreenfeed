import Link from "next/link";
import { InstagramIcon } from "@/components/site/icons";
import { Container } from "@/components/site/container";
import { NAV_LINKS, SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-deep-green text-cream">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-3">
            <p className="text-3xl font-semibold tracking-tight leading-none text-cream">
              TheGreenFeed
            </p>
            <p className="max-w-sm text-sm text-cream/75">{SITE.description}</p>
            <Link
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex w-fit items-center gap-2 text-sm font-medium text-lime hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime"
            >
              <InstagramIcon className="size-4" />
              {SITE.instagramHandle}
            </Link>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-row flex-wrap gap-x-6 gap-y-3 text-sm md:flex-col md:gap-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-cream/80 transition-colors hover:text-lime focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-cream/15 pt-6">
          <p className="text-sm text-cream/70">
            © TheGreenFeed. Waste-management guidance for students and
            communities.
          </p>
        </div>
      </Container>
    </footer>
  );
}
