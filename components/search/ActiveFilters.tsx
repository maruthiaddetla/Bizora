import Link from "next/link";
import { X } from "lucide-react";
import { formatIndianCurrency } from "@/lib/format/currency";
import {
  buildSearchHref,
  type BusinessSearchFilters,
} from "@/lib/search/params";

export type ActiveFilterChip = {
  key: string;
  label: string;
  href: string;
};

type ActiveFiltersProps = {
  chips: ActiveFilterChip[];
};

export function ActiveFilters({ chips }: ActiveFiltersProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="truncate">{chip.label}</span>
          <X className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
          <span className="sr-only">Remove {chip.label}</span>
        </Link>
      ))}
      <Link
        href="/listings"
        className="text-xs font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
      >
        Clear all filters
      </Link>
    </div>
  );
}

export function buildActiveFilterChips(
  filters: BusinessSearchFilters,
  labels: {
    categories: { id: string; name: string }[];
    stateName?: string;
    districtName?: string;
    cityName?: string;
    localityName?: string;
  },
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.q) {
    chips.push({
      key: "q",
      label: `"${filters.q}"`,
      href: buildSearchHref({ ...filters, q: undefined, page: 1 }),
    });
  }

  for (const category of labels.categories) {
    chips.push({
      key: `category-${category.id}`,
      label: category.name,
      href: buildSearchHref({
        ...filters,
        categoryIds: (filters.categoryIds ?? []).filter((id) => id !== category.id),
        page: 1,
      }),
    });
  }

  if (filters.localityId && labels.localityName) {
    chips.push({
      key: "locality",
      label: labels.localityName,
      href: buildSearchHref({ ...filters, localityId: undefined, page: 1 }),
    });
  }

  if (filters.cityId && labels.cityName) {
    chips.push({
      key: "city",
      label: labels.cityName,
      href: buildSearchHref({
        ...filters,
        cityId: undefined,
        localityId: undefined,
        page: 1,
      }),
    });
  }

  if (filters.districtId && labels.districtName) {
    chips.push({
      key: "district",
      label: labels.districtName,
      href: buildSearchHref({
        ...filters,
        districtId: undefined,
        cityId: undefined,
        localityId: undefined,
        page: 1,
      }),
    });
  }

  if (filters.stateId && labels.stateName) {
    chips.push({
      key: "state",
      label: labels.stateName,
      href: buildSearchHref({
        ...filters,
        stateId: undefined,
        districtId: undefined,
        cityId: undefined,
        localityId: undefined,
        page: 1,
      }),
    });
  }

  if (filters.minPrice != null || filters.maxPrice != null) {
    const minLabel = formatIndianCurrency(filters.minPrice);
    const maxLabel = formatIndianCurrency(filters.maxPrice);
    let priceLabel = "Price filter";
    if (minLabel && maxLabel) priceLabel = `${minLabel} – ${maxLabel}`;
    else if (minLabel) priceLabel = `From ${minLabel}`;
    else if (maxLabel) priceLabel = `Up to ${maxLabel}`;

    chips.push({
      key: "price",
      label: priceLabel,
      href: buildSearchHref({
        ...filters,
        minPrice: undefined,
        maxPrice: undefined,
        page: 1,
      }),
    });
  }

  return chips;
}
