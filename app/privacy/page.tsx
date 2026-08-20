import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Bizora handles account, listing, image, and enquiry information.",
  openGraph: {
    title: "Privacy Policy — Bizora",
    description:
      "How Bizora handles account, listing, image, and enquiry information.",
  },
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="bg-surface">
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted">
            General website privacy information for the current Bizora product.
            This is not legal advice.
          </p>

          <div className="mt-8 space-y-8 text-base leading-relaxed text-muted">
            <section>
              <h2 className="text-lg font-semibold text-foreground">
                1. What Bizora is
              </h2>
              <p className="mt-2">
                Bizora is an online marketplace where users can browse published
                business listings, create accounts, list businesses for sale,
                upload listing images, send buyer enquiries, and (for admins)
                review listings.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                2. Information we process
              </h2>
              <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>
                  Account details such as email address and optional display
                  name, managed through authentication.
                </li>
                <li>
                  Seller listing content (title, description, pricing, location
                  references, category, and related fields).
                </li>
                <li>
                  Business images uploaded to private storage and shown via
                  signed URLs when permitted.
                </li>
                <li>
                  Buyer enquiry messages and seller responses between buyers and
                  sellers on published listings.
                </li>
                <li>
                  Admin review metadata such as listing status and rejection
                  reasons.
                </li>
                <li>
                  Session cookies used to keep you signed in and secure the
                  application.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                3. How information is used
              </h2>
              <p className="mt-2">
                We use this information to operate the marketplace: authenticate
                users, display published listings, run seller workflows, deliver
                enquiries to the correct parties, and allow admins to moderate
                submissions. We do not sell personal information as a product
                feature of this application.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                4. Sharing and visibility
              </h2>
              <p className="mt-2">
                Published listing content is visible to visitors. Enquiry
                content is limited by access controls to the buyer, the listing
                seller, and admins. Draft, pending, rejected, and sold listings
                are not shown in public search. Service providers that host the
                application and database (for example Supabase / hosting) may
                process data to provide those services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                5. Cookies and sessions
              </h2>
              <p className="mt-2">
                Bizora uses session cookies required for authentication and
                security. These are not used to power a third-party advertising
                network in the current product.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                6. Retention and security
              </h2>
              <p className="mt-2">
                Data remains while needed to operate accounts, listings, and
                enquiries. Access is protected with authentication and
                database-level access controls. No method of transmission or
                storage is perfectly secure.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                7. Your choices
              </h2>
              <p className="mt-2">
                You can update profile fields available in the product, manage
                your listings from the dashboard, and stop using the service by
                signing out. For broader account or deletion requests, use the
                guidance on the{" "}
                <Link href="/contact" className="font-medium text-primary hover:text-primary-hover">
                  Contact
                </Link>{" "}
                page.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                8. Changes
              </h2>
              <p className="mt-2">
                This page may be updated as the product changes. Continued use
                of Bizora after updates means you should review the latest
                version here.
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
