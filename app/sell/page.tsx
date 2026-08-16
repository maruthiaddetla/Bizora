import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sell a Business — Bizora",
  description: "Sell your business on Bizora and connect with genuine buyers.",
};

export default async function SellPage() {
  await requireUser("/sell");

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-medium text-primary">Seller tools</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Sell your business on Bizora
            </h1>
            <p className="mt-3 text-muted">
              Create a listing with your business details, save a draft, and
              submit it for review when you&apos;re ready.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href="/dashboard/listings/new" size="md">
                Create Your Listing
              </Button>
              <Button href="/dashboard" variant="secondary" size="md">
                Go to Dashboard
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted">
              Prefer browsing first?{" "}
              <Link
                href="/listings"
                className="font-medium text-primary hover:text-primary-hover"
              >
                View businesses for sale
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
