"use client";

import { Heart, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LISTING_PLACEHOLDER_IMAGE } from "@/lib/constants/images";
import type { Listing } from "@/lib/listings";

type ListingCardProps = {
  listing: Listing;
  variant?: "default" | "compact" | "horizontal";
};

export function ListingCard({
  listing,
  variant = "default",
}: ListingCardProps) {
  const isHorizontal = variant === "horizontal";
  const isCommercial = listing.listingType === "commercial_space";
  const [imageSrc, setImageSrc] = useState(listing.image);

  const priceLabel = isCommercial
    ? listing.monthlyRent ?? listing.price
    : listing.price;

  const stats = isCommercial
    ? [
        {
          label: "Area",
          value: listing.areaSqft
            ? `${listing.areaSqft.toLocaleString("en-IN")} sq.ft`
            : "—",
        },
        {
          label: "Type",
          value: listing.spaceTypeLabel ?? "—",
        },
        {
          label: "Floor",
          value: listing.floor ?? "—",
        },
      ]
    : [
        {
          label: "Annual Revenue",
          value: listing.annualRevenue ?? "—",
        },
        {
          label: "Annual Profit",
          value: listing.annualProfit ?? "—",
        },
        {
          label: "Employees",
          value:
            listing.employees != null
              ? listing.employees.toLocaleString("en-IN")
              : "—",
        },
      ];

  if (isHorizontal) {
    return (
      <article className="flex overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <Link
          href={`/listings/${listing.id}`}
          className="relative w-28 shrink-0 self-stretch sm:w-36"
        >
          <Image
            src={imageSrc}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="144px"
            onError={() => setImageSrc(LISTING_PLACEHOLDER_IMAGE)}
          />
          {listing.premium && (
            <span className="absolute left-2 top-2 z-10 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
              Premium
            </span>
          )}
        </Link>
        <div className="min-w-0 flex-1 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-navy sm:text-base">
                <Link href={`/listings/${listing.id}`}>{listing.title}</Link>
              </h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{listing.location}</span>
              </p>
            </div>
            <Link
              href={`/listings/${listing.id}`}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted hover:text-primary"
              aria-label="View listing"
            >
              <Heart className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          {priceLabel && (
            <p className="mt-2 text-base font-bold text-primary">{priceLabel}</p>
          )}
          <div className="mt-2 grid grid-cols-3 gap-2">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="truncate text-[10px] text-muted">{stat.label}</p>
                <p className="truncate text-xs font-semibold text-navy">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative">
        <Link href={`/listings/${listing.id}`} className="relative block">
          <div className="relative aspect-[4/3]">
            <Image
              src={imageSrc}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              onError={() => setImageSrc(LISTING_PLACEHOLDER_IMAGE)}
            />
          </div>
        </Link>
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {listing.premium && (
            <span className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white shadow-sm">
              Premium
            </span>
          )}
        </div>
        <Link
          href={`/listings/${listing.id}`}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-muted shadow-sm backdrop-blur hover:text-primary"
          aria-label="Save listing"
        >
          <Heart className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-navy">
              <Link href={`/listings/${listing.id}`}>{listing.title}</Link>
            </h3>
            <p className="mt-1.5 flex items-center gap-1 text-sm text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{listing.location}</span>
            </p>
          </div>
          {priceLabel && (
            <p className="shrink-0 text-base font-bold text-primary">
              {priceLabel}
            </p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-[11px] text-muted">{stat.label}</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-navy">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs font-semibold text-primary">
          {listing.category}
        </p>
      </div>
    </article>
  );
}
