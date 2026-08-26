import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  HelpCircle,
  Mail,
  Search,
  Store,
  UserRound,
} from "lucide-react";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/Button";
import {
  BIZORA_CONTACT_EMAIL,
  BIZORA_CONTACT_MAILTO,
} from "@/lib/site";

export const metadata: Metadata = {
  title: {
    absolute:
      "Contact Bizora | Buy, Sell & Lease Businesses and Commercial Spaces",
  },
  description:
    "Contact Bizora for questions, support, partnerships, business listings, and commercial space enquiries across India.",
  openGraph: {
    title:
      "Contact Bizora | Buy, Sell & Lease Businesses and Commercial Spaces",
    description:
      "Contact Bizora for questions, support, partnerships, business listings, and commercial space enquiries across India.",
  },
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="bg-surface">
        {/* Hero */}
        <section
          className="border-b border-border bg-white"
          aria-labelledby="contact-heading"
        >
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <h1
                id="contact-heading"
                className="text-3xl font-bold tracking-tight text-navy sm:text-4xl"
              >
                Contact Bizora
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                Have a question, need help with a listing, or want to know more
                about Bizora? We&apos;d love to hear from you.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
            {/* Email Us */}
            <section
              className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8"
              aria-labelledby="email-us-heading"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <Mail className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h2
                    id="email-us-heading"
                    className="text-xl font-bold tracking-tight text-navy sm:text-2xl"
                  >
                    Email Us
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                    For general enquiries, feedback, partnerships, technical
                    questions, or help with using Bizora:
                  </p>
                  <a
                    href={BIZORA_CONTACT_MAILTO}
                    className="mt-4 inline-flex break-all text-lg font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:text-xl"
                  >
                    {BIZORA_CONTACT_EMAIL}
                  </a>
                </div>
              </div>
            </section>

            {/* Buyers + Sellers */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <section
                className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-7"
                aria-labelledby="buyers-heading"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <Search className="h-5 w-5" aria-hidden />
                </div>
                <h2
                  id="buyers-heading"
                  className="mt-4 text-lg font-bold tracking-tight text-navy sm:text-xl"
                >
                  Buyers
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                  Looking for a business or commercial space?
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                  Browse our listings and, when signed in, use the enquiry
                  option on the listing to contact the seller.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <Button href="/listings" size="md" className="w-full sm:w-auto">
                    Browse Businesses
                  </Button>
                  <Button
                    href="/listings?type=commercial_space"
                    variant="secondary"
                    size="md"
                    className="w-full sm:w-auto"
                  >
                    <Building2 className="h-4 w-4" aria-hidden />
                    Explore Commercial Spaces
                  </Button>
                </div>
              </section>

              <section
                className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-7"
                aria-labelledby="sellers-heading"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <Store className="h-5 w-5" aria-hidden />
                </div>
                <h2
                  id="sellers-heading"
                  className="mt-4 text-lg font-bold tracking-tight text-navy sm:text-xl"
                >
                  Sellers
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                  Want to sell your business or list a commercial space on
                  Bizora?
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                  Create an account and use the listing tools to submit your
                  listing. Once submitted, your listing goes through the
                  existing Bizora review/publish workflow.
                </p>
                <div className="mt-auto pt-6">
                  <Button href="/sell" size="md" className="w-full sm:w-auto">
                    List Your Business
                  </Button>
                </div>
              </section>
            </div>

            {/* Account Help */}
            <section
              className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-7"
              aria-labelledby="account-help-heading"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <UserRound className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h2
                    id="account-help-heading"
                    className="text-lg font-bold tracking-tight text-navy sm:text-xl"
                  >
                    Account Help
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                    For account-related actions:
                  </p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted sm:text-base">
                    <li>
                      <Link
                        href="/sign-in"
                        className="font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        Sign in
                      </Link>{" "}
                      to your existing Bizora account
                    </li>
                    <li>
                      <Link
                        href="/sign-up"
                        className="font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        Create a new account
                      </Link>
                    </li>
                    <li>
                      Manage listings and enquiries from your{" "}
                      <Link
                        href="/dashboard"
                        className="font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        dashboard
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* General Enquiries */}
            <section
              className="rounded-2xl border border-border bg-navy px-6 py-8 text-center sm:px-10 sm:py-10"
              aria-labelledby="general-enquiries-heading"
            >
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <HelpCircle className="h-5 w-5" aria-hidden />
              </div>
              <h2
                id="general-enquiries-heading"
                className="mt-4 text-lg font-bold tracking-tight text-white sm:text-xl"
              >
                General Enquiries
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
                For anything else, contact us at:
              </p>
              <a
                href={BIZORA_CONTACT_MAILTO}
                className="mt-4 inline-flex break-all text-base font-semibold text-white underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy sm:text-lg"
              >
                {BIZORA_CONTACT_EMAIL}
              </a>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
