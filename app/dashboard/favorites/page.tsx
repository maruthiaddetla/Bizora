import type { Metadata } from "next";
import Link from "next/link";
import { FavoritesSection } from "@/components/dashboard/FavoritesSection";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { fetchMyFavorites } from "@/lib/repositories/favorites.repository";

export const metadata: Metadata = {
  title: "Saved Businesses",
  description: "Businesses you have saved on Bizora.",
  robots: { index: false, follow: false },
};

export default async function DashboardFavoritesPage() {
  const { user } = await requireUser("/dashboard/favorites");
  const result = await fetchMyFavorites(user.id);

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
                Saved Businesses
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Saved Businesses
              </h1>
              <p className="mt-2 text-sm text-muted sm:text-base">
                Published listings you&apos;ve saved for later.
                {result.error == null && result.total > 0
                  ? ` ${result.total} saved.`
                  : null}
              </p>
            </div>
            <Button href="/listings" variant="secondary" size="sm">
              Browse Businesses
            </Button>
          </div>

          {result.error && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {result.error}
            </div>
          )}

          <FavoritesSection favorites={result.favorites} />
        </div>
      </main>
      <Footer />
    </>
  );
}
