# Asset inventory

Recorded during Phase 1. All supplied assets have been copied into the
canonical `public/images/` structure used by the code (see `components.json`,
`src/data/`, and the README). The original locations are left in place and
listed below for traceability.

## Campaign flyers / photography

Canonical: `public/images/campaign/greenfeed-{1..6}.png` (1122 × 1402 PNG)

Originally supplied as `greenfeed - {1..6}.png` in the Downloads folder, and
also copied into `public/instagram/` (flyers 2–5 only).

| File | Content | Used by |
| --- | --- | --- |
| `greenfeed-1.png` | Beach cleanup team photo holding collected waste bags | carousel |
| `greenfeed-2.png` | Poster: "The 3Rs of Waste Management" | carousel |
| `greenfeed-3.png` | Poster: "Your Campus. Your Responsibility." | carousel |
| `greenfeed-4.png` | Poster: "Where Does Your Waste Go?" | carousel |
| `greenfeed-5.png` | Poster: "Sort It Right." | carousel |
| `greenfeed-6.png` | Campus litter-pick photo | carousel |

Referenced by `src/data/instagram-posts.ts`. These are heavy source PNGs and
should be resized/compressed (ideally WebP) in Phase 3.

## Hannah's photo

Canonical: `public/images/about/hannah-lepathy.jpeg` (960 × 1280)

Originally supplied as `public/founder/hannah.jpeg`. This is a real,
supplied portrait — use it as-is; do not generate or substitute a portrait.
The About page is built in Phase 2.

## Blog cover images

Canonical: `public/images/blog/blog-{1..4}.png` (1672 × 941, 16:9)

Originally supplied as `public/blog/blog-{1..4}.png`. They map one-to-one to
the four Phase 2 starter articles:

| File | Article |
| --- | --- |
| `blog-1.png` | The 3Rs of Waste Management: Reduce, Reuse, Recycle |
| `blog-2.png` | Waste Segregation: Sort It Right at Home |
| `blog-3.png` | A Cleaner Campus Starts With Us |
| `blog-4.png` | What Happens to Waste After It Leaves Your Bin? |

## Ad-hoc folders (superseded)

`public/founder/`, `public/blog/`, and `public/instagram/` were supplied
outside the documented structure. Their contents are now duplicated under
`public/images/`. They can be deleted once the duplication has been reviewed —
nothing in the code references them.

## Still outstanding

None. All required Phase 1 assets (flyers, photography, Hannah's photo, and
blog covers) are present.
