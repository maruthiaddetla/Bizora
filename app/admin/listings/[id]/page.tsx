import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminReviewActions } from "@/components/admin/AdminReviewActions";
import { ListingStatusBadge } from "@/components/dashboard/ListingStatusBadge";
import { DetailSection } from "@/components/listing/DetailSection";
import { FinancialMetrics } from "@/components/listing/FinancialMetrics";
import { ImageGallery } from "@/components/listing/ImageGallery";
import { Button } from "@/components/ui/Button";
import { fetchAdminBusinessById } from "@/lib/repositories/admin.repository";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { listing } = await fetchAdminBusinessById(id);
  if (!listing) {
    return {
      title: "Listing not found — Admin",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: `Review: ${listing.title}`,
    description: "Admin review of a business listing.",
    robots: { index: false, follow: false },
  };
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminListingReviewPage({ params }: PageProps) {
  const { id } = await params;
  const { listing, error } = await fetchAdminBusinessById(id);

  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Unable to load listing
        </h1>
        <p className="mt-3 max-w-md text-muted">{error}</p>
        <Button href="/admin/listings" className="mt-8">
          Back to queue
        </Button>
      </main>
    );
  }

  if (!listing) {
    notFound();
  }

  const locationParts = [
    listing.localityName,
    listing.cityName,
    listing.districtName,
    listing.stateName,
  ].filter(Boolean);

  return (
    <main className="flex-1 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6">
          <p className="text-sm text-muted">
            <Link
              href="/admin/listings"
              className="font-medium text-primary hover:text-primary-hover"
            >
              Listings
            </Link>
            <span className="mx-2">/</span>
            Review
          </p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <ListingStatusBadge status={listing.status} />
                {listing.isPremium && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    Premium
                  </span>
                )}
                {listing.isVerified && (
                  <span className="rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-semibold text-accent">
                    Verified
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {listing.title}
              </h1>
              <p className="mt-2 text-sm text-muted">
                {listing.category ?? "Business"} · {listing.location}
              </p>
            </div>
            {listing.status === "published" && (
              <Button
                href={`/listings/${listing.id}`}
                variant="secondary"
                size="sm"
              >
                View public page
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-8">
            <div className="overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5">
              <ImageGallery images={listing.images} title={listing.title} />
            </div>

            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
              <FinancialMetrics
                price={listing.askingPrice}
                location={listing.location}
                category={listing.category}
                revenue={listing.annualRevenue}
                ebitda={listing.ebitda}
                netProfit={listing.annualProfit}
                establishedYear={listing.establishedYear}
                employees={listing.employees}
              />
            </div>

            {listing.description && (
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
                <DetailSection id="overview" title="Business overview">
                  <p className="text-base leading-relaxed text-muted">
                    {listing.description}
                  </p>
                </DetailSection>
              </div>
            )}

            {listing.reasonForSale && (
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
                <DetailSection id="reason" title="Reason for sale">
                  <p className="text-base leading-relaxed text-muted">
                    {listing.reasonForSale}
                  </p>
                </DetailSection>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-foreground">
                Location hierarchy
              </h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    State
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {listing.stateName ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    District
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {listing.districtName ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    City
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {listing.cityName ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Locality
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {listing.localityName ?? "—"}
                  </dd>
                </div>
              </dl>
              {locationParts.length > 0 && (
                <p className="mt-4 text-sm text-muted">
                  Display label: {locationParts.join(", ")}
                </p>
              )}
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <AdminReviewActions
              listingId={listing.id}
              status={listing.status}
            />

            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-foreground">Seller</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-muted">Name</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {listing.sellerName}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Phone</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {listing.sellerPhone ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Company</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {listing.sellerCompany ?? "—"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-foreground">
                Review timeline
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-muted">Submitted</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {formatDateTime(listing.submittedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Reviewed</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {formatDateTime(listing.reviewedAt)}
                  </dd>
                </div>
                {listing.status === "rejected" && listing.rejectionReason && (
                  <div>
                    <dt className="text-muted">Rejection reason</dt>
                    <dd className="mt-0.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-red-800">
                      {listing.rejectionReason}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
