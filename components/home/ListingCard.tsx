"use client";

import { ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LISTING_PLACEHOLDER_IMAGE } from "@/lib/constants/images";
import type { Listing } from "@/lib/listings";

type ListingCardProps = {
  listing: Listing;
  variant?: "default" | "compact";
};

export function ListingCard({ listing, variant = "default" }: ListingCardProps) {
  const isCompact = variant === "compact";
  const isCommercial = listing.listingType === "commercial_space";
  const [imageSrc, setImageSrc] = useState(listing.image);

  const priceLabel = isCommercial
    ? listing.monthlyRent ?? listing.price
    : listing.price;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
      <Link href={`/listings/${listing.id}`} className="relative block overflow-hidden">
        <div className={isCompact ? "aspect-[5/3]" : "aspect-[4/3]"}>
          <Image
            src={imageSrc}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageSrc(LISTING_PLACEHOLDER_IMAGE)}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {listing.premium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-2.5 py-1 text-xs font-semibold text-amber-950 shadow-sm">
              <Sparkles className="h-3 w-3" aria-hidden />
              Premium
            </span>
          )}
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
            {listing.category}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-sm font-medium text-white">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {listing.location}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {priceLabel && (
          <p className="text-lg font-bold text-accent sm:text-xl">{priceLabel}</p>
        )}

        <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-lg">
          <Link href={`/listings/${listing.id}`}>{listing.title}</Link>
        </h3>

        {isCommercial ? (
          <p className="mt-2 line-clamp-2 text-sm text-muted">
            {[
              listing.areaSqft
                ? `${listing.areaSqft.toLocaleString("en-IN")} sq.ft`
                : null,
              listing.floor,
              listing.spaceTypeLabel,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : (
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
            {listing.description}
          </p>
        )}

        <Link
          href={`/listings/${listing.id}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
        >
          View listing
          <ArrowUpRight
            className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </article>
  );
}
