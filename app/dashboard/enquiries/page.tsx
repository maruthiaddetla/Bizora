import type { Metadata } from "next";
import Link from "next/link";
import { EnquiriesListSection } from "@/components/enquiries/EnquiriesListSection";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import {
  fetchBuyerEnquiries,
  fetchSellerEnquiries,
} from "@/lib/repositories/enquiries.repository";

export const metadata: Metadata = {
  title: "My Enquiries — Bizora",
  description: "View enquiries you have sent and received on Bizora.",
};

export default async function DashboardEnquiriesPage() {
  const { user } = await requireUser("/dashboard/enquiries");

  const [buyerResult, sellerResult] = await Promise.all([
    fetchBuyerEnquiries(user.id),
    fetchSellerEnquiries(user.id),
  ]);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-muted">
                <Link
                  href="/dashboard"
                  className="font-medium text-primary hover:text-primary-hover"
                >
                  Dashboard
                </Link>
                <span className="mx-2">/</span>
                Enquiries
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                My Enquiries
              </h1>
              <p className="mt-2 text-sm text-muted sm:text-base">
                Messages you&apos;ve sent to sellers and enquiries received on
                your listings.
              </p>
            </div>
            <Button href="/listings" variant="secondary" size="sm">
              Browse listings
            </Button>
          </div>

          {(buyerResult.error || sellerResult.error) && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {buyerResult.error ?? sellerResult.error}
            </div>
          )}

          <div className="space-y-10">
            <EnquiriesListSection
              title="Enquiries I sent"
              emptyMessage="You haven't contacted any sellers yet. Browse listings to send your first enquiry."
              enquiries={buyerResult.enquiries}
              role="buyer"
            />
            <EnquiriesListSection
              title="Enquiries on my listings"
              emptyMessage="When buyers contact you about your published listings, they'll appear here."
              enquiries={sellerResult.enquiries}
              role="seller"
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
