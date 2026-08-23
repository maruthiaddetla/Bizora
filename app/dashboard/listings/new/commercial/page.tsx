import type { Metadata } from "next";
import Link from "next/link";
import { CommercialSpaceForm } from "@/components/listings/CommercialSpaceForm";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { requireUser } from "@/lib/auth/session";
import { fetchCommercialCategories } from "@/lib/repositories/categories.repository";
import { fetchStates } from "@/lib/repositories/locations.repository";

export const metadata: Metadata = {
  title: "List a commercial space",
  description: "Create a new commercial space listing draft on Bizora.",
  robots: { index: false, follow: false },
};

export default async function NewCommercialListingPage() {
  await requireUser("/dashboard/listings/new/commercial");
  const [categories, states] = await Promise.all([
    fetchCommercialCategories(),
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
              Commercial space
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              List a commercial space
            </h1>
            <p className="mt-2 text-sm text-muted sm:text-base">
              Commercial premises for business use only — retail, office,
              warehouse, and similar spaces.
            </p>
          </div>

          <CommercialSpaceForm
            mode="create"
            categories={categories}
            states={states}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
