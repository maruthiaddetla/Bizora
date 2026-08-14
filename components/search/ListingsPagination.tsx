import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  buildSearchHref,
  type BusinessSearchFilters,
} from "@/lib/search/params";

type ListingsPaginationProps = {
  filters: BusinessSearchFilters;
  page: number;
  hasMore: boolean;
  total: number;
  pageSize: number;
};

export function ListingsPagination({
  filters,
  page,
  hasMore,
  total,
  pageSize,
}: ListingsPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const previousHref =
    page > 1
      ? buildSearchHref({ ...filters, page: page - 1 })
      : null;
  const nextHref = hasMore
    ? buildSearchHref({ ...filters, page: page + 1 })
    : null;

  return (
    <nav
      className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row"
      aria-label="Pagination"
    >
      <p className="text-sm text-muted">
        Page {page} of {totalPages}
      </p>

      <div className="flex items-center gap-3">
        {previousHref ? (
          <Link
            href={previousHref}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Previous
          </Link>
        ) : (
          <span className="inline-flex h-10 cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-medium text-muted opacity-50">
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Previous
          </span>
        )}

        {nextHref ? (
          <Link
            href={nextHref}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <span className="inline-flex h-10 cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-medium text-muted opacity-50">
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>
    </nav>
  );
}
