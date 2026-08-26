import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import {
  BIZORA_CONTACT_EMAIL,
  BIZORA_CONTACT_MAILTO,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "General terms for using the Bizora business marketplace website.",
  openGraph: {
    title: "Terms & Conditions — Bizora",
    description:
      "General terms for using the Bizora business marketplace website.",
  },
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-surface">
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Terms &amp; Conditions
          </h1>
          <p className="mt-2 text-sm text-muted">
            General website terms for the current Bizora product. This is not
            legal advice.
          </p>

          <div className="mt-8 space-y-8 text-base leading-relaxed text-muted">
            <section>
              <h2 className="text-lg font-semibold text-foreground">
                1. Acceptance
              </h2>
              <p className="mt-2">
                By accessing or using Bizora, you agree to these terms and the{" "}
                <Link href="/privacy" className="font-medium text-primary hover:text-primary-hover">
                  Privacy Policy
                </Link>
                . If you do not agree, do not use the site.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                2. The service
              </h2>
              <p className="mt-2">
                Bizora provides tools to browse published business listings,
                create user accounts, submit seller listings (including images),
                send and respond to buyer enquiries, and allow admins to review
                listings. Bizora is a marketplace platform and does not itself
                buy or sell the businesses listed.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                3. Accounts
              </h2>
              <p className="mt-2">
                You are responsible for keeping your login credentials secure
                and for activity under your account. Provide accurate
                information. Roles such as buyer, seller, and admin are enforced
                by the application; users must not attempt to bypass access
                controls.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                4. Seller listings and images
              </h2>
              <p className="mt-2">
                Sellers may create draft listings, upload business images, and
                submit listings for review. Admins may approve, reject, or
                otherwise moderate listings. Only published listings appear in
                public search and the public sitemap. You must only upload
                content you have the right to use and that does not mislead
                buyers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                5. Buyer enquiries
              </h2>
              <p className="mt-2">
                Signed-in buyers may send enquiries on published listings.
                Enquiry content should be professional and related to a genuine
                interest in the listing. Sellers may respond, mark enquiries as
                read, or close them according to product rules.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                6. Marketplace disclaimer
              </h2>
              <p className="mt-2">
                Listing information is provided by sellers. Bizora does not
                guarantee the accuracy, completeness, or outcome of any listing,
                enquiry, negotiation, or transaction. Buyers and sellers should
                perform their own due diligence. Bizora is not a party to deals
                between users unless separately agreed in writing.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                7. Acceptable use
              </h2>
              <p className="mt-2">
                Do not misuse the service, attempt unauthorized access, upload
                harmful content, scrape the site in a way that harms
                availability, or use Bizora for unlawful activity.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                8. Availability
              </h2>
              <p className="mt-2">
                Features may change, and the service may be interrupted for
                maintenance or outages. Some advertised future features (such as
                favourites or email alerts) may not yet be available.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">
                9. Contact
              </h2>
              <p className="mt-2">
                Questions about these terms can be raised by emailing{" "}
                <a
                  href={BIZORA_CONTACT_MAILTO}
                  className="font-medium text-primary hover:text-primary-hover"
                >
                  {BIZORA_CONTACT_EMAIL}
                </a>{" "}
                or via the{" "}
                <Link href="/contact" className="font-medium text-primary hover:text-primary-hover">
                  Contact
                </Link>{" "}
                page.
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
