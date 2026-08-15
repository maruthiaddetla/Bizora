import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sell a Business — Bizora",
  description: "Seller listing tools are coming soon on Bizora.",
};

export default async function SellPage() {
  const { profile } = await requireUser("/sell");

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-medium text-primary">Coming next</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Seller listing tools
            </h1>
            <p className="mt-3 text-muted">
              You&apos;re signed in
              {profile?.full_name ? ` as ${profile.full_name}` : ""}. Creating and
              managing business listings will be available in the next phase.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/listings" size="md">
                Browse businesses
              </Button>
              <Button href="/" variant="secondary" size="md">
                Back to homepage
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted">
              Need help?{" "}
              <Link href="/contact" className="font-medium text-primary hover:text-primary-hover">
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
