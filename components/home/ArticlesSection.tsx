import { ArrowRight, FileText } from "lucide-react";
import Link from "next/link";

const highlights = [
  {
    title: "Browse published businesses for sale",
    description: "Search by keyword, category, location, and price.",
  },
  {
    title: "Enquire as a registered buyer",
    description: "Send messages on published listings and track replies.",
  },
  {
    title: "List and manage as a seller",
    description: "Draft listings, submit for review, and respond to enquiries.",
  },
];

export function ArticlesSection() {
  return (
    <section className="py-14 sm:py-20" aria-labelledby="articles-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-white p-8 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-12">
          <div className="lg:max-w-md">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <FileText className="h-5 w-5" aria-hidden />
            </div>
            <h2
              id="articles-heading"
              className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              How Bizora works
            </h2>
            <p className="mt-3 text-base text-muted">
              Buy, sell, and enquire on published listings. Detailed buyer and
              seller guides are coming soon.
            </p>
            <Link
              href="/listings"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            >
              Browse listings
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <ul className="mt-8 flex flex-col divide-y divide-border lg:mt-0 lg:min-w-0 lg:flex-1">
            {highlights.map((item) => (
              <li key={item.title} className="py-4 first:pt-0 last:pb-0">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
