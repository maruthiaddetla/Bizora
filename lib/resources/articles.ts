export type ResourceLink = {
  title: string;
  href: string;
  description?: string;
};

export type ResourceSection = {
  id: string;
  title: string;
  description: string;
  links: ResourceLink[];
};

export type ResourceArticleMeta = {
  slug: string;
  title: string;
  description: string;
  category: "buy" | "sell" | "commercial" | "help";
};

/** Canonical metadata for published resource articles. */
export const RESOURCE_ARTICLES: ResourceArticleMeta[] = [
  {
    slug: "how-to-buy-a-business-in-india",
    title: "How to Buy a Business in India",
    description:
      "A practical guide to defining your goals, evaluating listings, conducting due diligence, and completing a business purchase in India.",
    category: "buy",
  },
  {
    slug: "business-buying-checklist",
    title: "Business Buying Checklist",
    description:
      "A practical checklist covering financials, lease, employees, customers, licences, and due diligence before buying a business in India.",
    category: "buy",
  },
  {
    slug: "how-to-sell-a-business-in-india",
    title: "How to Sell a Business in India",
    description:
      "Learn how to prepare records, set an asking price, create a compelling listing, and manage buyer enquiries when selling a business in India.",
    category: "sell",
  },
  {
    slug: "how-to-value-a-business",
    title: "How to Value a Business",
    description:
      "Understand the factors that influence business value in India — revenue, profitability, assets, location, and why asking price may differ from valuation.",
    category: "sell",
  },
  {
    slug: "how-to-find-a-commercial-space-in-india",
    title: "How to Find a Commercial Space in India",
    description:
      "Practical guidance on location, rent, lease terms, permitted use, and total occupancy cost when finding commercial space in India.",
    category: "commercial",
  },
];

export function getResourceArticle(slug: string): ResourceArticleMeta | undefined {
  return RESOURCE_ARTICLES.find((article) => article.slug === slug);
}

export const RESOURCE_LANDING_SECTIONS: ResourceSection[] = [
  {
    id: "buy",
    title: "Buy a Business",
    description:
      "Guides to help you evaluate business opportunities and make informed decisions.",
    links: [
      {
        title: "How to Buy a Business in India",
        href: "/resources/how-to-buy-a-business-in-india",
      },
      {
        title: "Business Buying Checklist",
        href: "/resources/business-buying-checklist",
      },
      {
        title: "How to Evaluate a Business Before Buying",
        href: "/resources/how-to-buy-a-business-in-india#evaluate",
      },
    ],
  },
  {
    id: "sell",
    title: "Sell a Business",
    description:
      "Learn how to prepare, value and present your business to potential buyers.",
    links: [
      {
        title: "How to Sell a Business in India",
        href: "/resources/how-to-sell-a-business-in-india",
      },
      {
        title: "How to Determine Your Asking Price",
        href: "/resources/how-to-value-a-business",
      },
      {
        title: "How to Create a Great Business Listing",
        href: "/resources/how-to-sell-a-business-in-india#listing",
      },
    ],
  },
  {
    id: "commercial",
    title: "Commercial Spaces",
    description:
      "Practical guidance for finding and evaluating commercial spaces.",
    links: [
      {
        title: "How to Find the Right Commercial Space in India",
        href: "/resources/how-to-find-a-commercial-space-in-india",
      },
      {
        title: "Commercial Space Leasing Checklist",
        href: "/resources/how-to-find-a-commercial-space-in-india#leasing-checklist",
      },
    ],
  },
  {
    id: "help",
    title: "Help",
    description: "Learn how Bizora works and find answers to common questions.",
    links: [
      {
        title: "How Bizora Works",
        href: "/about#how-it-works",
      },
      {
        title: "Frequently Asked Questions",
        href: "/resources/faq",
      },
    ],
  },
];
