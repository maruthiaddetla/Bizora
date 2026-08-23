import Link from "next/link";
import {
  fetchBusinessCategories,
  fetchCommercialCategories,
  type CategoryOption,
} from "@/lib/repositories/categories.repository";
import { buildSearchHref } from "@/lib/search/params";

function CategoryLinks({
  title,
  categories,
  listingType,
}: {
  title: string;
  categories: CategoryOption[];
  listingType: "business" | "commercial_space";
}) {
  if (categories.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {categories.slice(0, 7).map((category) => (
          <li key={category.id}>
            <Link
              href={buildSearchHref({
                listingType,
                categoryIds: [category.id],
              })}
              className="inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function ExploreCategoriesSection() {
  const [businessCategories, commercialCategories] = await Promise.all([
    fetchBusinessCategories(),
    fetchCommercialCategories(),
  ]);

  if (businessCategories.length === 0 && commercialCategories.length === 0) {
    return null;
  }

  return (
    <section
      className="border-t border-border bg-white py-14 sm:py-16"
      aria-labelledby="explore-categories-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="explore-categories-heading"
          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          Explore categories
        </h2>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <CategoryLinks
            title="Businesses for sale"
            categories={businessCategories}
            listingType="business"
          />
          <CategoryLinks
            title="Commercial spaces"
            categories={commercialCategories}
            listingType="commercial_space"
          />
        </div>
      </div>
    </section>
  );
}
