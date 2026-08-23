"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ListingTypeBadge } from "@/components/search/ListingsMarketplaceTabs";
import { Button } from "@/components/ui/Button";
import { removeFavorite } from "@/lib/favorites/actions";
import type { FavoriteListingView } from "@/lib/repositories/favorites.repository";

type FavoritesSectionProps = {
  favorites: FavoriteListingView[];
};

function formatSavedDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FavoritesSection({ favorites }: FavoritesSectionProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  if (favorites.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white px-6 py-14 text-center">
        <h2 className="text-xl font-semibold text-foreground">
          You haven&apos;t saved any listings yet.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Browse published listings and tap Save to keep opportunities you want
          to revisit.
        </p>
        <Button href="/listings" size="md" className="mt-6">
          Browse Businesses
        </Button>
      </div>
    );
  }

  function handleRemove(businessId: string) {
    if (isPending) return;
    setPendingId(businessId);
    setErrorById((prev) => {
      const next = { ...prev };
      delete next[businessId];
      return next;
    });

    startTransition(async () => {
      const result = await removeFavorite(businessId);
      setPendingId(null);
      if (!result.ok) {
        setErrorById((prev) => ({ ...prev, [businessId]: result.message }));
        return;
      }
      router.refresh();
    });
  }

  return (
    <ul className="space-y-4">
      {favorites.map((listing) => {
        const savedLabel = formatSavedDate(listing.favoritedAt);
        const removing = pendingId === listing.id && isPending;

        return (
          <li key={listing.id}>
            <article className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-stretch sm:p-5">
              <Link
                href={`/listings/${listing.id}`}
                className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-surface sm:aspect-auto sm:h-28 sm:w-40"
              >
                <Image
                  src={listing.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 160px"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <ListingTypeBadge
                    listingType={listing.listingType ?? "business"}
                  />
                  <span className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
                    {listing.category}
                  </span>
                  {listing.premium && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      Premium
                    </span>
                  )}
                </div>
                <h2 className="mt-2 text-lg font-semibold text-foreground">
                  <Link
                    href={`/listings/${listing.id}`}
                    className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                  >
                    {listing.title}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-muted">{listing.location}</p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {listing.price}
                </p>
                {savedLabel && (
                  <p className="mt-1 text-xs text-muted">Saved {savedLabel}</p>
                )}
                {errorById[listing.id] && (
                  <p className="mt-2 text-xs text-red-700" role="alert">
                    {errorById[listing.id]}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:justify-center">
                <Button href={`/listings/${listing.id}`} size="sm" variant="secondary">
                  View Listing
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={removing}
                  onClick={() => handleRemove(listing.id)}
                >
                  {removing ? "Removing…" : "Remove"}
                </Button>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
