/**
 * Manually maintained carousel data for the "GreenFeed in Action" section.
 *
 * These entries point at local campaign assets copied from the supplied
 * flyers (see `docs/ASSETS.md`). Nothing here is scraped from Instagram.
 * When a specific post URL is known, replace `url` for that entry; otherwise
 * slides link to the profile.
 */
export const INSTAGRAM_PROFILE_URL =
  "https://www.instagram.com/theg.r.e.e.nfeed/";

export type InstagramPost = {
  id: string;
  src: string;
  alt: string;
  url: string;
};

export const instagramPosts: InstagramPost[] = [
  {
    id: "beach-cleanup-team",
    src: "/images/campaign/greenfeed-1.png",
    alt: "GreenFeed campaign image of students in casual clothes gathered on a beach with full waste bags and collected plastic bottles, promoting coastal cleanups.",
    url: INSTAGRAM_PROFILE_URL,
  },
  {
    id: "the-3rs",
    src: "/images/campaign/greenfeed-2.png",
    alt: "GreenFeed poster titled 'The 3Rs of Waste Management' illustrating reduce, reuse, and recycle with a reusable bottle, cloth bag, and cardboard.",
    url: INSTAGRAM_PROFILE_URL,
  },
  {
    id: "campus-responsibility",
    src: "/images/campaign/greenfeed-3.png",
    alt: "GreenFeed poster reading 'Your Campus. Your Responsibility.' showing students sorting waste into green, blue, and yellow bins.",
    url: INSTAGRAM_PROFILE_URL,
  },
  {
    id: "where-waste-goes",
    src: "/images/campaign/greenfeed-4.png",
    alt: "GreenFeed infographic titled 'Where Does Your Waste Go?' outlining prevent, reduce and reuse, recycle, recover, and dispose.",
    url: INSTAGRAM_PROFILE_URL,
  },
  {
    id: "sort-it-right",
    src: "/images/campaign/greenfeed-5.png",
    alt: "GreenFeed poster titled 'Sort It Right.' showing organic, recyclable, and general waste separated into three labelled bins at home.",
    url: INSTAGRAM_PROFILE_URL,
  },
  {
    id: "campus-litter-pick",
    src: "/images/campaign/greenfeed-6.png",
    alt: "GreenFeed campaign image of students in casual campus clothing using gloves and a litter picker to collect plastic waste into bags during a cleanup.",
    url: INSTAGRAM_PROFILE_URL,
  },
];
