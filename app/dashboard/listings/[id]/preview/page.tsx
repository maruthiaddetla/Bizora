import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ChevronRight, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { DetailSection } from "@/components/listing/DetailSection";
import { FinancialMetrics } from "@/components/listing/FinancialMetrics";
import { ImageGallery } from "@/components/listing/ImageGallery";
import { ListingStatusBadge } from "@/components/dashboard/ListingStatusBadge";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { mapBusinessToDetail } from "@/lib/repositories/businesses.mapper";
import { fetchOwnedBusinessById } from "@/lib/repositories/businesses.repository";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Preview listing — Bizora",
    description: `Owner preview for listing ${id}`,
  };
}

export default async function OwnerListingPreviewPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const { user } = await requireUser(`/dashboard/listings/${id}/preview`);

  const { business: row, error } = await fetchOwnedBusinessById(id, user.id);

  if (error) {
    return (
      <>
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Unable to load preview
          </h1>
          <p className="mt-3 max-w-md text-muted">
            We couldn&apos;t load this listing right now. Please try again
            shortly.
          </p>
          <Button href="/dashboard" className="mt-8">
            Back to dashboard
          </Button>
        </main>
        <Footer />
      </>
    );
  }

  if (!row) {
    notFound();
  }

  const business = await mapBusinessToDetail(row);
  const canEdit = row.status === "draft" || row.status === "rejected";
  const canViewPublic =
    row.status === "published" || row.status === "sold";

  return (
    <>
      <Navbar />
      <main className="bg-white">
        <div className="border-b border-border bg-surface/50">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 overflow-hidden text-sm text-muted"
            >
              <Link
                href="/dashboard"
                className="shrink-0 rounded-sm transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate font-medium text-foreground">
                Owner preview
              </span>
            </nav>
            <div className="flex flex-wrap items-center gap-2">
              <ListingStatusBadge status={row.status} />
              {canEdit && (
                <Button
                  href={`/dashboard/listings/${row.id}/edit`}
                  size="sm"
                  variant="secondary"
                >
                  Edit
                </Button>
              )}
              {canViewPublic && (
                <Button href={`/listings/${row.id}`} size="sm" variant="ghost">
                  Public page
                </Button>
              )}
            </div>
          </div>
        </div>

        {query.submitted === "1" && (
          <div className="border-b border-emerald-200 bg-emerald-50">
            <p className="mx-auto max-w-7xl px-4 py-3 text-sm text-emerald-900 sm:px-6 lg:px-8">
              Listing submitted for review. Our team will review your details
              before publishing.
            </p>
          </div>
        )}

        <div className="border-b border-amber-100 bg-amber-50">
          <p className="mx-auto max-w-7xl px-4 py-3 text-sm text-amber-950 sm:px-6 lg:px-8">
            This is a private owner preview. Draft, pending, and rejected
            listings are not shown on the public marketplace.
          </p>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {business.isPremium && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    Premium
                  </span>
                )}
                {business.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-1 text-xs font-semibold text-accent">
                    <BadgeCheck className="h-3 w-3" aria-hidden />
                    Verified
                  </span>
                )}
                {business.category && (
                  <span className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
                    {business.category}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                {business.title}
              </h1>
            </div>
          </div>

          <ImageGallery images={business.images} title={business.title} />

          <div className="mt-8 space-y-10 sm:space-y-12 lg:mt-12">
            <FinancialMetrics
              price={business.askingPrice}
              location={business.location}
              category={business.category}
              revenue={business.annualRevenue}
              ebitda={business.ebitda}
              netProfit={business.annualProfit}
              establishedYear={business.establishedYear}
              employees={business.employees}
            />

            {business.description && (
              <DetailSection id="overview" title="Business overview">
                <p className="text-base leading-relaxed break-words text-muted sm:leading-7">
                  {business.description}
                </p>
              </DetailSection>
            )}

            {business.reasonForSale && (
              <DetailSection id="reason" title="Reason for sale">
                <p className="text-base leading-relaxed break-words text-muted sm:leading-7">
                  {business.reasonForSale}
                </p>
              </DetailSection>
            )}

            {row.status === "rejected" && row.rejection_reason && (
              <DetailSection id="rejection" title="Rejection reason">
                <p className="text-base leading-relaxed break-words text-red-800 sm:leading-7">
                  {row.rejection_reason}
                </p>
              </DetailSection>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
