/**
 * Static blog content. There is intentionally no CMS or database for posts.
 *
 * Cover images are the supplied graphic covers under `public/images/blog/`.
 * Each cover already contains its own title artwork, so article pages display
 * the title as HTML text and do not overlay it on the image.
 *
 * No publication dates are set: none have been approved yet.
 */
export const BLOG_AUTHOR = "Hannah Lepathy";

export type BlogSection = {
  heading: string;
  paragraphs: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  summary: string;
  coverImage: string;
  coverImageAlt: string;
  author: string;
  intro: string;
  sections: BlogSection[];
  takeaway: string;
  relatedSlugs?: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "the-3rs-of-waste-management",
    title: "The 3Rs of Waste Management: Reduce, Reuse, Recycle",
    summary:
      "The 3Rs are a simple way to make better decisions about the things we buy and throw away.",
    coverImage: "/images/blog/blog-1.png",
    coverImageAlt:
      "GreenFeed cover reading 'The 3Rs of Waste Management' beside a reusable water bottle, cloth bag, lunch box, flattened cardboard, and clean recyclables.",
    author: BLOG_AUTHOR,
    intro:
      "Waste management does not begin when something reaches a bin. It begins earlier, when we decide what to buy, how to use it, and whether it can serve another purpose.",
    sections: [
      {
        heading: "Reduce: prevent waste before it starts",
        paragraphs: [
          "Buy what you need, choose durable products when possible, avoid unnecessary packaging, and carry reusable items such as a water bottle or shopping bag. Preventing waste usually takes fewer resources than dealing with it later.",
        ],
      },
      {
        heading: "Reuse: give items another life",
        paragraphs: [
          "Refill containers where appropriate, repair useful items, borrow things you rarely need, and donate usable clothes or equipment. Reuse helps extend a product's useful life and delays disposal.",
        ],
      },
      {
        heading: "Recycle: sort materials correctly",
        paragraphs: [
          "Recycling works best when the materials are accepted by the local collection system and are prepared correctly. Keep recyclable items free from food residue where required, and check local guidance because accepted materials and bin colours vary by location.",
        ],
      },
      {
        heading: "Put the 3Rs into practice",
        paragraphs: [
          "Before throwing something away, ask: Can I avoid buying it? Can I use it again? Can it be recycled through a suitable local service?",
        ],
      },
    ],
    takeaway:
      "The most effective first step is often to prevent waste from being created.",
    relatedSlugs: ["waste-segregation-at-home", "what-happens-to-waste"],
  },
  {
    slug: "waste-segregation-at-home",
    title: "Waste Segregation: Sort It Right at Home",
    summary:
      "Separating waste at the point where it is created makes responsible collection and processing easier.",
    coverImage: "/images/blog/blog-2.png",
    coverImageAlt:
      "GreenFeed cover reading 'Waste Segregation At Home' showing two students sorting food scraps, clean recyclables, and residual waste into three bins.",
    author: BLOG_AUTHOR,
    intro:
      "When different kinds of waste are mixed together, useful materials can become harder to recover. Separating waste at home is a practical habit that can make collection safer and more effective.",
    sections: [
      {
        heading: "Start with the categories available locally",
        paragraphs: [
          "Many systems separate organic or wet waste, recyclable dry materials, and residual waste. The exact categories, colours, and accepted materials vary by city and service, so follow your local rules rather than relying on a universal colour code.",
        ],
      },
      {
        heading: "Keep recyclables suitable for collection",
        paragraphs: [
          "Empty containers and follow local instructions on whether they should be rinsed, dried, flattened, or kept separate. Food-soiled packaging may not be accepted in ordinary recycling.",
        ],
      },
      {
        heading: "Handle special waste separately",
        paragraphs: [
          "Batteries, electronics, bulbs, medicines, chemicals, and sharp objects may require dedicated collection or drop-off. Do not put them into ordinary bins unless local guidance specifically permits it.",
        ],
      },
      {
        heading: "Make sorting easy",
        paragraphs: [
          "Place clearly labelled containers where waste is usually created. Explain the categories to everyone in the household and empty each container according to the collection schedule.",
        ],
      },
    ],
    takeaway:
      "Sort waste where it is created, and check what your local system actually accepts.",
    relatedSlugs: ["the-3rs-of-waste-management", "what-happens-to-waste"],
  },
  {
    slug: "cleaner-campus-starts-with-us",
    title: "A Cleaner Campus Starts With Us",
    summary:
      "Students can make a visible difference by building small, repeatable habits into campus life.",
    coverImage: "/images/blog/blog-3.png",
    coverImageAlt:
      "GreenFeed cover reading 'A Cleaner Campus Starts With Us' showing students collecting litter with gloves and a litter picker on a campus lawn.",
    author: BLOG_AUTHOR,
    intro:
      "A clean campus is easier to maintain when everyone takes responsibility for their own waste. You do not need a large event to begin; small habits can improve shared spaces every day.",
    sections: [
      {
        heading: "Carry reusables",
        paragraphs: [
          "Bring a refillable bottle, lunchbox, or reusable cutlery when practical. Choose items you will genuinely use, rather than buying more products in the name of sustainability.",
        ],
      },
      {
        heading: "Use bins properly",
        paragraphs: [
          "Separate waste when suitable bins are provided. Keep food waste away from recycling where the system requires it, and do not leave rubbish beside a full bin—look for another appropriate option or notify campus staff.",
        ],
      },
      {
        heading: "Organise a safe cleanup",
        paragraphs: [
          "Work in small teams, agree on the area to clean, and get permission where necessary. Wear suitable footwear and gloves, use litter grabbers when available, and never touch needles, chemicals, broken glass, or unknown hazardous material. Tell campus staff or the appropriate service about hazardous waste.",
        ],
      },
      {
        heading: "Reduce paper and material waste",
        paragraphs: [
          "Use digital notes when practical, print only what is needed, and use both sides of paper when appropriate. Share, borrow, repair, or donate usable supplies instead of discarding them.",
        ],
      },
      {
        heading: "Make it a group habit",
        paragraphs: [
          "A short cleanup, clear bin labels, and a friendly reminder can help classmates participate without blame or embarrassment.",
        ],
      },
    ],
    takeaway:
      "A cleaner campus is a shared responsibility, built through everyday actions.",
    relatedSlugs: ["the-3rs-of-waste-management", "waste-segregation-at-home"],
  },
  {
    slug: "what-happens-to-waste",
    title: "What Happens to Waste After It Leaves Your Bin?",
    summary:
      "Waste collection is only one part of the journey. What happens next depends on the material and the local waste system.",
    coverImage: "/images/blog/blog-4.png",
    coverImageAlt:
      "GreenFeed cover reading 'What Happens to Waste After Collection?' showing a worker sorting plastic bottles and recyclables at a collection facility.",
    author: BLOG_AUTHOR,
    intro:
      "Putting rubbish in a bin can make it disappear from view, but it does not make the material disappear. After collection, waste may follow different routes depending on local infrastructure, sorting practices, and material type.",
    sections: [
      {
        heading: "Reuse and repair can come first",
        paragraphs: [
          "Products that remain useful may be repaired, refilled, shared, or donated. Keeping an item in use can delay the need for replacement and disposal.",
        ],
      },
      {
        heading: "Recyclables need suitable processing",
        paragraphs: [
          "Accepted paper, metal, glass, and plastic may be sorted and sent to processors that can turn them into recovered materials. Not every item labelled recyclable is accepted everywhere, and contamination can reduce recovery.",
        ],
      },
      {
        heading: "Organic waste may be composted",
        paragraphs: [
          "Suitable food scraps and garden waste can be processed into compost where appropriate facilities or safe home systems exist. Meat, dairy, oils, and other materials may be restricted in some systems.",
        ],
      },
      {
        heading: "Residual waste needs controlled management",
        paragraphs: [
          "Material that cannot be reused, recycled, or composted may go to a permitted disposal facility or another locally used treatment route. Poorly managed waste can pollute land and water, so collection and handling matter.",
        ],
      },
      {
        heading: "What can you do?",
        paragraphs: [
          "Reduce unnecessary purchases, separate materials according to local instructions, use authorised collection points for special waste, and learn how your local service works.",
        ],
      },
    ],
    takeaway:
      "The bin is not the end of the story. Better choices before disposal can improve what happens next.",
    relatedSlugs: ["waste-segregation-at-home", "the-3rs-of-waste-management"],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getRelatedPosts(post: BlogPost): BlogPost[] {
  if (!post.relatedSlugs?.length) return [];
  return post.relatedSlugs
    .map((slug) => getBlogPostBySlug(slug))
    .filter((related): related is BlogPost => Boolean(related));
}
