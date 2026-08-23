import Link from "next/link";
import {
  fetchBusinessCategories,
  fetchCommercialCategories,
  type CategoryOption,
} from "@/lib/repositories/categories.repository";
import { buildSearchHref } from "@/lib/search/params";

const BUSINESS_ORDER = [
  "restaurant",
  "cafe",
  "food-hospitality",
  "retail",
  "manufacturing",
  "engineering",
  "it-technology",
  "saas",
  "services",
  "education",
  "healthcare",
];

const COMMERCIAL_ORDER = [
  "commercial-retail-shop",
  "commercial-office",
  "commercial-restaurant-cafe",
  "commercial-warehouse",
  "commercial-industrial",
  "commercial-land",
];

function pickCategories(
  categories: CategoryOption[],
  preferredSlugs: string[],
  limit: number,
): CategoryOption[] {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const picked: CategoryOption[] = [];
  for (const slug of preferredSlugs) {
    const match = bySlug.get(slug);
    if (match && !picked.some((c) => c.id === match.id)) {
      picked.push(match);
    }
    if (picked.length >= limit) return picked;
  }
  for (const category of categories) {
    if (!picked.some((c) => c.id === category.id)) {
      picked.push(category);
    }
    if (picked.length >= limit) break;
  }
  return picked;
}

function CategoryChip({
  category,
  listingType,
}: {
  category: CategoryOption;
  listingType: "business" | "commercial_space";
}) {
  return (
    <Link
      href={buildSearchHref({
        listingType,
        categoryIds: [category.id],
      })}
      className="inline-flex shrink-0 items-center rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-medium text-navy transition-colors hover:border-primary/40 hover:text-primary"
    >
      {category.name}
    </Link>
  );
}

/**
 * Compact homepage category discovery (chip strip).
 * Replaces the previous large "What are you looking for?" card grid.
 */
export async function ExploreCategoriesSection() {
  const [businessCategories, commercialCategories] = await Promise.all([
    fetchBusinessCategories(),
    fetchCommercialCategories(),
  ]);

  const businessChips = pickCategories(businessCategories, BUSINESS_ORDER, 6);
  const commercialChips = pickCategories(
    commercialCategories,
    COMMERCIAL_ORDER,
    4,
  );
  const chips = [
    ...businessChips.map((category) => ({
      category,
      listingType: "business" as const,
    })),
    ...commercialChips.map((category) => ({
      category,
      listingType: "commercial_space" as const,
    })),
  ];

  if (chips.length === 0) {
    return null;
  }

  return (
    <section
      className="border-t border-border bg-white py-8 sm:py-10"
      aria-labelledby="browse-categories-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="browse-categories-heading"
            className="text-lg font-bold tracking-tight text-navy sm:text-xl"
          >
            Browse by Category
          </h2>
          <Link
            href="/listings?type=business"
            className="text-sm font-semibold text-primary hover:text-primary-hover"
          >
            View all →
          </Link>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
          {chips.map(({ category, listingType }) => (
            <CategoryChip
              key={`${listingType}-${category.id}`}
              category={category}
              listingType={listingType}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
