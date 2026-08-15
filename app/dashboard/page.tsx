import type { Metadata } from "next";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard — Bizora",
  description: "Your Bizora seller dashboard is coming soon.",
};

export default async function DashboardPage() {
  const { profile } = await requireUser("/dashboard");

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-medium text-primary">Coming next</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Your dashboard
            </h1>
            <p className="mt-3 text-muted">
              Account access is working
              {profile?.full_name ? ` for ${profile.full_name}` : ""}. Listing
              management and seller tools will arrive in a later phase.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/sell" size="md">
                Post a listing (soon)
              </Button>
              <Button href="/listings" variant="secondary" size="md">
                Browse businesses
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
