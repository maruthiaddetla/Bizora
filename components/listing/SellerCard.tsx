import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, UserRound } from "lucide-react";

export type ListingSellerSummary = {
  id: string;
  displayName: string;
  companyName: string | null;
  avatarUrl: string | null;
  listingCount: number;
};

type SellerCardProps = {
  seller: ListingSellerSummary;
  /** Listing location label (not the seller's city). */
  listingLocation?: string | null;
};

/**
 * Seller summary on listing detail — links to public /sellers/{id}.
 * Does not display the seller UUID.
 */
export function SellerCard({ seller, listingLocation }: SellerCardProps) {
  const href = `/sellers/${seller.id}`;

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground">Seller information</h3>

      <div className="mt-5 flex items-start gap-4">
        <Link
          href={href}
          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-surface ring-2 ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={`View ${seller.displayName}'s profile`}
        >
          {seller.avatarUrl ? (
            <Image
              src={seller.avatarUrl}
              alt=""
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted">
              <UserRound className="h-7 w-7" aria-hidden />
            </span>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={href}
            className="font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {seller.displayName}
          </Link>
          {seller.companyName && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
              <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{seller.companyName}</span>
            </p>
          )}
          <p className="mt-2 text-xs text-muted">
            {seller.listingCount} published listing
            {seller.listingCount === 1 ? "" : "s"}
          </p>
          <Link
            href={href}
            className="mt-3 inline-flex text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            View seller profile
          </Link>
        </div>
      </div>

      {listingLocation && (
        <div className="mt-5 flex items-start gap-2 rounded-xl bg-surface p-4 text-sm text-muted">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <address className="not-italic">{listingLocation}</address>
        </div>
      )}
    </div>
  );
}
