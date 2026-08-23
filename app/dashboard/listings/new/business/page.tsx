import type { Metadata } from "next";
import Link from "next/link";
import { ListingForm } from "@/components/listings/ListingForm";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { requireUser } from "@/lib/auth/session";
import { fetchBusinessCategories } from "@/lib/repositories/categories.repository";
import { fetchStates } from "@/lib/repositories/locations.repository";

export const metadata: Metadata = {
  title: "Sell a business",
  description: "Create a new business-for-sale listing draft on Bizora.",
  robots: { index: false, follow: false },
};

export default async function NewBusinessListingPage() {
  await requireUser("/dashboard/listings/new/business");
  const [categories, states] = await Promise.all([
    fetchBusinessCategories(),
    fetchStates(),
  ]);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="mb-6">
            <p className="text-sm text-muted">
              <Link
                href="/dashboard/listings/new"
                className="font-medium text-primary hover:text-primary-hover"
              >
                New listing
              </Link>
              <span className="mx-2">/</span>
              Sell a business
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Sell a business
            </h1>
            <p className="mt-2 text-sm text-muted sm:text-base">
              Save a draft anytime. Submit for review when the required details
              are complete.
            </p>
          </div>

          <ListingForm mode="create" categories={categories} states={states} />
        </div>
      </main>
      <Footer />
    </>
  );
}
