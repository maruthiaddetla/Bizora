import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  ClipboardCheck,
  Link2,
  ListPlus,
  MapPin,
  Search,
  Store,
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
      "About Bizora | Buy, Sell & Lease Businesses and Commercial Spaces in India",
  },
  description:
    "Bizora is an India-focused marketplace to buy and sell businesses and discover commercial spaces across India.",
  openGraph: {
    title:
      "About Bizora | Buy, Sell & Lease Businesses and Commercial Spaces in India",
    description:
      "Bizora is an India-focused marketplace to buy and sell businesses and discover commercial spaces across India.",
  },
};

const whatYouCanDo = [
  {
    label: "BUY",
    title: "Buy a Business",
    description:
      "Discover businesses available for sale across India and find opportunities that match your goals.",
    icon: Search,
  },
  {
    label: "SELL",
    title: "Sell Your Business",
    description:
      "List your business on Bizora and connect with potential buyers looking for their next opportunity.",
    icon: Store,
  },
  {
    label: "LEASE",
    title: "Find a Commercial Space",
    description:
      "Discover commercial spaces across India for your next business, expansion or venture.",
    icon: Building2,
  },
] as const;

const howItWorks = [
  {
    step: "1",
    title: "List",
    description: "Submit your business or commercial space listing.",
    icon: ListPlus,
  },
  {
    step: "2",
    title: "Review",
    description: "Bizora reviews submitted listings before publication.",
    icon: ClipboardCheck,
  },
  {
    step: "3",
    title: "Publish",
    description:
      "Approved listings become visible to potential buyers and users.",
    icon: Store,
  },
  {
    step: "4",
    title: "Connect",
    description: "Interested users can explore listings and send enquiries.",
    icon: Link2,
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="bg-surface">
        {/* Hero */}
        <section
          className="border-b border-border bg-white"
          aria-labelledby="about-heading"
        >
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <h1
                id="about-heading"
                className="text-3xl font-bold tracking-tight text-navy sm:text-4xl"
              >
                About Bizora
              </h1>
              <p className="mt-3 text-lg font-semibold text-primary sm:text-xl">
                Buy. Sell. Lease.
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                Bizora is an India-focused marketplace that makes it easier to
                discover, buy and sell businesses, and find commercial spaces.
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section
          className="border-b border-border"
          aria-labelledby="mission-heading"
        >
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2
                id="mission-heading"
                className="text-2xl font-bold tracking-tight text-navy sm:text-3xl"
              >
                Our Mission
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                Our mission is to make business opportunities easier to discover
                and connect buyers, sellers and entrepreneurs through one simple
                platform.
              </p>
            </div>
          </div>
        </section>

        {/* What You Can Do */}
        <section
          className="border-b border-border bg-white"
          aria-labelledby="what-you-can-do-heading"
        >
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <h2
              id="what-you-can-do-heading"
              className="text-center text-2xl font-bold tracking-tight text-navy sm:text-3xl"
            >
              What You Can Do
            </h2>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {whatYouCanDo.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.label}
                    className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-7"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">
                      {item.label}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-navy">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* How Bizora Works */}
        <section
          id="how-it-works"
          className="scroll-mt-24 border-b border-border"
          aria-labelledby="how-it-works-heading"
        >
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <h2
              id="how-it-works-heading"
              className="text-center text-2xl font-bold tracking-tight text-navy sm:text-3xl"
            >
              How Bizora Works
            </h2>

            <ol className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {howItWorks.map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.step}
                    className="relative rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                        {item.step}
                      </span>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-navy">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      {item.description}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Built for India */}
        <section
          className="border-b border-border bg-white"
          aria-labelledby="built-for-india-heading"
        >
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
                <MapPin className="h-6 w-6" aria-hidden />
              </div>
              <h2
                id="built-for-india-heading"
                className="mt-4 text-2xl font-bold tracking-tight text-navy sm:text-3xl"
              >
                Built for India
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                Bizora brings business opportunities and commercial spaces
                together in one India-focused marketplace.
              </p>
              <p className="mt-3 text-base leading-relaxed text-muted">
                Users can discover listings across India using:
              </p>
              <p className="mt-2 text-base font-semibold text-navy">
                State → City → Locality
              </p>
              <p className="mt-3 text-base leading-relaxed text-muted">
                Bizora supports businesses and commercial spaces across India.
              </p>
            </div>
          </div>
        </section>

        {/* Our Commitment */}
        <section
          className="border-b border-border"
          aria-labelledby="commitment-heading"
        >
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2
                id="commitment-heading"
                className="text-2xl font-bold tracking-tight text-navy sm:text-3xl"
              >
                Our Commitment
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                We aim to provide a simple, transparent and easy-to-use
                marketplace for discovering business opportunities and
                commercial spaces.
              </p>
              <p className="mt-3 text-base leading-relaxed text-muted">
                Listings submitted to Bizora are reviewed before they are
                published.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="py-12 sm:py-16"
          aria-labelledby="about-cta-heading"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-border bg-navy px-6 py-12 text-center sm:px-12 sm:py-14">
              <h2
                id="about-cta-heading"
                className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
              >
                Ready to explore your next business opportunity?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base text-slate-300">
                Discover businesses and commercial spaces available across
                India.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <Button
                  href="/listings"
                  size="lg"
                  className="w-full bg-primary hover:bg-primary-hover sm:w-auto"
                >
                  Browse Businesses
                </Button>
                <Button
                  href="/sell"
                  variant="secondary"
                  size="lg"
                  className="w-full border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/15 sm:w-auto"
                >
                  List Your Business
                </Button>
              </div>
              <p className="mt-6 text-sm text-slate-300">
                Have a question?{" "}
                <Link
                  href="/contact"
                  className="font-semibold text-white underline-offset-2 hover:underline"
                >
                  Contact Us
                </Link>
                {" · "}
                <a
                  href={BIZORA_CONTACT_MAILTO}
                  className="font-semibold text-white underline-offset-2 hover:underline"
                >
                  {BIZORA_CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
