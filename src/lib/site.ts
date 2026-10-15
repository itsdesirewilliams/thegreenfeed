/** Shared site-level constants. */
export const SITE = {
  name: "TheGreenFeed",
  tagline: "Less Waste. More Impact.",
  description:
    "TheGreenFeed makes waste-management knowledge easier to understand and put into practice.",
  instagramUrl: "https://www.instagram.com/theg.r.e.e.nfeed/",
  instagramHandle: "@theg.r.e.e.nfeed",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/survey", label: "Survey" },
] as const;
