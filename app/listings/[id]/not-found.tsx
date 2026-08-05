import Link from "next/link";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/Button";

export default function ListingNotFound() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Listing not found
        </h1>
        <p className="mt-4 max-w-md text-muted">
          This business listing may have been sold or removed. Browse active
          listings to find your next opportunity.
        </p>
        <Button href="/listings" size="lg" className="mt-8">
          Browse listings
        </Button>
        <Link
          href="/"
          className="mt-4 text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
        >
          Back to home
        </Link>
      </main>
      <Footer />
    </>
  );
}
