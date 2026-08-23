import Image from "next/image";
import Link from "next/link";
import { ListingStatusBadge } from "@/components/dashboard/ListingStatusBadge";
import { Button } from "@/components/ui/Button";
import { ListingTypeBadge } from "@/components/search/ListingsMarketplaceTabs";
import type {
  AdminListingQueueFilter,
  AdminListingQueueItem,
} from "@/lib/repositories/admin.types";

type AdminListingsQueueProps = {
  listings: AdminListingQueueItem[];
  filter: AdminListingQueueFilter;
};

const filters: { value: AdminListingQueueFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AdminListingsQueue({
  listings,
  filter,
}: AdminListingsQueueProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => {
          const active = item.value === filter;
          return (
            <Link
              key={item.value}
              href={`/admin/listings?status=${item.value}`}
              className={[
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white text-muted hover:text-foreground",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-14 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            No listings in this queue
          </h2>
          <p className="mt-2 text-sm text-muted">
            {filter === "pending"
              ? "There are no listings waiting for review."
              : "Try another filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <article
              key={listing.id}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-surface sm:h-28 sm:w-40">
                  <Image
                    src={listing.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 160px"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <ListingTypeBadge listingType={listing.listingType} />
                        <h3 className="truncate text-lg font-semibold text-foreground">
                          {listing.title}
                        </h3>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {listing.category} · {listing.location}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Seller: {listing.sellerName}
                      </p>
                    </div>
                    <ListingStatusBadge status={listing.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <p className="text-base font-semibold text-accent">
                      {listing.price ?? "Price on request"}
                    </p>
                    <p className="text-sm text-muted">
                      Submitted {formatDate(listing.submittedAt)}
                    </p>
                  </div>
                  <div className="mt-4">
                    <Button
                      href={`/admin/listings/${listing.id}`}
                      size="sm"
                    >
                      {listing.status === "pending" ? "Review" : "View"}
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
