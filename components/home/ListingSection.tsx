import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ListingCard } from "@/components/home/ListingCard";
import type { Listing } from "@/lib/listings";

type ListingSectionProps = {
  id?: string;
  title: string;
  subtitle?: string;
  listings?: Listing[];
  viewAllHref?: string;
  variant?: "default" | "compact";
  className?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  errorMessage?: string;
  errorHeading?: string;
};

function ListingCardSkeleton() {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
      aria-hidden
    >
      <div className="aspect-[4/3] animate-pulse bg-surface" />
      <div className="space-y-3 p-4 sm:p-5">
        <div className="h-6 w-24 animate-pulse rounded bg-surface" />
        <div className="h-5 w-full animate-pulse rounded bg-surface" />
        <div className="h-4 w-full animate-pulse rounded bg-surface" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-surface" />
      </div>
    </div>
  );
}

export function ListingSection({
  id,
  title,
  subtitle,
  listings = [],
  viewAllHref = "/listings",
  variant = "default",
  className = "",
  isLoading = false,
  emptyMessage,
  errorMessage,
  errorHeading = "Unable to load listings",
}: ListingSectionProps) {
  const skeletonCount = 6;

  return (
    <section
      id={id}
      className={`py-14 sm:py-20 ${className}`}
      aria-labelledby={id ? `${id}-heading` : undefined}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id={id ? `${id}-heading` : undefined}
              className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 max-w-xl text-base text-muted">{subtitle}</p>
            )}
          </div>

          <Link
            href={viewAllHref}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
          >
            Search all listings
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {isLoading ? (
          <div
            className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            aria-busy="true"
            aria-label="Loading listings"
          >
            {Array.from({ length: skeletonCount }, (_, index) => (
              <ListingCardSkeleton key={index} />
            ))}
          </div>
        ) : errorMessage ? (
          <div
            className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center"
            role="alert"
          >
            <p className="font-medium text-red-900">{errorHeading}</p>
            <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
          </div>
        ) : listings.length === 0 && emptyMessage ? (
          <div className="mt-8 rounded-2xl border border-border bg-surface px-6 py-12 text-center">
            <p className="font-medium text-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} variant={variant} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
