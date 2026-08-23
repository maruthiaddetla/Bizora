import Link from "next/link";
import { buildSearchHref, type BusinessSearchFilters } from "@/lib/search/params";

type ListingsMarketplaceTabsProps = {
  activeType: "business" | "commercial_space";
  filters: BusinessSearchFilters;
};

export function ListingsMarketplaceTabs({
  activeType,
  filters,
}: ListingsMarketplaceTabsProps) {
  const businessHref = buildSearchHref({ ...filters, listingType: "business", page: 1 });
  const commercialHref = buildSearchHref({
    ...filters,
    listingType: "commercial_space",
    page: 1,
  });

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={businessHref}
        className={[
          "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          activeType === "business"
            ? "border-primary bg-primary text-white"
            : "border-border bg-white text-muted hover:text-foreground",
        ].join(" ")}
      >
        Businesses for Sale
      </Link>
      <Link
        href={commercialHref}
        className={[
          "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          activeType === "commercial_space"
            ? "border-primary bg-primary text-white"
            : "border-border bg-white text-muted hover:text-foreground",
        ].join(" ")}
      >
        Commercial Spaces
      </Link>
    </div>
  );
}

export function ListingTypeBadge({
  listingType,
}: {
  listingType: "business" | "commercial_space";
}) {
  const label =
    listingType === "commercial_space" ? "Commercial Space" : "Business";
  const className =
    listingType === "commercial_space"
      ? "bg-violet-100 text-violet-800"
      : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
