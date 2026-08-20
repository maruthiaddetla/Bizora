import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";

export const metadata: Metadata = {
  title: "About",
  description:
    "Bizora is an India-focused marketplace for buying and selling businesses.",
  openGraph: {
    title: "About — Bizora",
    description:
      "Bizora is an India-focused marketplace for buying and selling businesses.",
  },
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            About Bizora
          </h1>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
            <p>
              Bizora is a marketplace for browsing published businesses for sale
              in India, sending buyer enquiries, and managing seller listings
              through draft, review, and publish workflows.
            </p>
            <p>
              Listings submitted by sellers are reviewed by Bizora admins before
              they appear publicly. Buyers can search published listings and
              enquire when signed in. Brokers directories and advanced advisory
              products are not part of the current product.
            </p>
            <p>
              For questions about using the site, see{" "}
              <Link href="/contact" className="font-medium text-primary hover:text-primary-hover">
                Contact
              </Link>
              ,{" "}
              <Link href="/privacy" className="font-medium text-primary hover:text-primary-hover">
                Privacy
              </Link>
              , and{" "}
              <Link href="/terms" className="font-medium text-primary hover:text-primary-hover">
                Terms
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
