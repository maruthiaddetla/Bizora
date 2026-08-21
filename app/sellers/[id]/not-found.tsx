import Link from "next/link";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/Button";

export default function SellerNotFound() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Seller not found
        </h1>
        <p className="mt-4 max-w-md text-muted">
          This seller profile doesn&apos;t exist or isn&apos;t available publicly.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/listings" size="lg">
            Browse Businesses
          </Button>
          <Link
            href="/"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            Back to home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
