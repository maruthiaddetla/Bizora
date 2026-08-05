import { ArrowRight, FileText } from "lucide-react";
import Link from "next/link";

const articles = [
  {
    title: "How to Find the Right Business to Buy",
    href: "/resources/find-right-business",
    readTime: "8 min read",
  },
  {
    title: "7 Ways to Increase the Value of Your Business",
    href: "/resources/increase-business-value",
    readTime: "6 min read",
  },
  {
    title: "Buying a Retail Business: A Complete Guide",
    href: "/resources/retail-buying-guide",
    readTime: "10 min read",
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
              Popular articles
            </h2>
            <p className="mt-3 text-base text-muted">
              Expert guides to help you buy smarter, sell faster, and navigate
              every stage of the acquisition journey.
            </p>
            <Link
              href="/resources"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            >
              Browse all resources
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <ul className="mt-8 flex flex-col divide-y divide-border lg:mt-0 lg:min-w-0 lg:flex-1">
            {articles.map((article) => (
              <li key={article.href}>
                <Link
                  href={article.href}
                  className="group flex items-center justify-between gap-4 py-4 transition-colors first:pt-0 last:pb-0 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                >
                  <span className="font-medium text-foreground transition-colors group-hover:text-primary">
                    {article.title}
                  </span>
                  <span className="shrink-0 text-xs text-muted">{article.readTime}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
