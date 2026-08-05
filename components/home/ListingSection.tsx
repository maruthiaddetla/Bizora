import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ListingCard } from "@/components/home/ListingCard";
import type { Listing } from "@/lib/listings";

type ListingSectionProps = {
  id?: string;
  title: string;
  subtitle?: string;
  listings: Listing[];
  viewAllHref?: string;
  variant?: "default" | "compact";
  className?: string;
};

export function ListingSection({
  id,
  title,
  subtitle,
  listings,
  viewAllHref = "/listings",
  variant = "default",
  className = "",
}: ListingSectionProps) {
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

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} variant={variant} />
          ))}
        </div>
      </div>
    </section>
  );
}
