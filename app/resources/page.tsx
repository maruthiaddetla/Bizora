import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Building2, HelpCircle, Store } from "lucide-react";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { RESOURCE_LANDING_SECTIONS } from "@/lib/resources/articles";

export const metadata: Metadata = {
  title: "Resources | Business Buying, Selling & Commercial Space Guides",
  description:
    "Practical guides and insights to help you buy, sell, or find the right commercial space in India. Buyer guides, seller guides, checklists, and FAQs.",
  openGraph: {
    title: "Resources | Business Buying, Selling & Commercial Space Guides",
    description:
      "Practical guides and insights to help you buy, sell, or find the right commercial space in India.",
  },
};

const sectionIcons = {
  buy: BookOpen,
  sell: Store,
  commercial: Building2,
  help: HelpCircle,
} as const;

export default function ResourcesPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-surface">
        <section
          className="border-b border-border bg-white"
          aria-labelledby="resources-heading"
        >
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                Resources
              </p>
              <h1
                id="resources-heading"
                className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl lg:text-[2.75rem]"
              >
                Make Better Business Decisions.
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                Practical guides and insights to help you buy, sell, or find the
                right commercial space in India.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {RESOURCE_LANDING_SECTIONS.map((section) => {
              const Icon =
                sectionIcons[section.id as keyof typeof sectionIcons] ??
                BookOpen;
              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-7"
                  aria-labelledby={`${section.id}-heading`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h2
                        id={`${section.id}-heading`}
                        className="text-xl font-bold tracking-tight text-navy"
                      >
                        {section.title}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2">
                    {section.links.map((link) => (
                      <li key={link.href + link.title}>
                        <Link
                          href={link.href}
                          className="group flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm font-medium text-navy transition-colors hover:border-primary/30 hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <span className="min-w-0 leading-snug">
                            {link.title}
                          </span>
                          <ArrowRight
                            className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                            aria-hidden
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
