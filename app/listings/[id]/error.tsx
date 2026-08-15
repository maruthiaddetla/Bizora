"use client";

import { Footer } from "@/components/home/Footer";
import { NavbarClient } from "@/components/home/NavbarClient";
import { Button } from "@/components/ui/Button";

export default function BusinessDetailErrorPage() {
  return (
    <>
      <NavbarClient
        isAuthenticated={false}
        postListingHref="/sign-in?next=/sell"
      />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Unable to load this business
        </h1>
        <p className="mt-4 max-w-md text-muted">
          We couldn&apos;t load this listing right now. Please try again shortly.
        </p>
        <Button href="/" size="lg" className="mt-8">
          Browse Businesses
        </Button>
      </main>
      <Footer />
    </>
  );
}
