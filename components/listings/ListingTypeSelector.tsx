import Link from "next/link";
import { Building2, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ListingTypeSelectorProps = {
  businessHref?: string;
  commercialHref?: string;
};

export function ListingTypeSelector({
  businessHref = "/dashboard/listings/new/business",
  commercialHref = "/dashboard/listings/new/commercial",
}: ListingTypeSelectorProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link
        href={businessHref}
        className="group flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
          <Store className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-foreground group-hover:text-primary">
          Sell a Business
        </h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
          List a running business for sale with financials, operations, and
          transfer details.
        </p>
        <span className="mt-4 text-sm font-semibold text-primary">
          Continue →
        </span>
      </Link>

      <Link
        href={commercialHref}
        className="group flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light text-accent">
          <Building2 className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-foreground group-hover:text-primary">
          List a Commercial Space
        </h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
          Rent or lease retail shops, offices, warehouses, and other commercial
          premises for business use.
        </p>
        <span className="mt-4 text-sm font-semibold text-primary">
          Continue →
        </span>
      </Link>
    </div>
  );
}

export function MarketplaceSelector({
  businessHref = "/listings?type=business",
  commercialHref = "/listings?type=commercial_space",
}: ListingTypeSelectorProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
      <Button href={businessHref} size="lg" className="min-w-[200px]">
        Businesses for Sale
      </Button>
      <Button
        href={commercialHref}
        size="lg"
        variant="secondary"
        className="min-w-[200px]"
      >
        Commercial Spaces
      </Button>
    </div>
  );
}
