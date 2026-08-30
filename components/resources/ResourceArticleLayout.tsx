import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";

type ResourceArticleLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function ResourceArticleLayout({
  title,
  description,
  children,
}: ResourceArticleLayoutProps) {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-surface">
        <article className="border-b border-border bg-white">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <Link
              href="/resources"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to Resources
            </Link>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              {description}
            </p>
          </div>
        </article>

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="space-y-8 text-base leading-relaxed text-foreground [&_h2]:scroll-mt-24 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-navy sm:[&_h2]:text-2xl [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-navy [&_li]:text-muted [&_p]:text-muted [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
            {children}
          </div>

          <aside className="mt-12 rounded-2xl border border-border bg-white p-5 text-sm leading-relaxed text-muted shadow-sm sm:p-6">
            <p className="font-semibold text-navy">Disclaimer</p>
            <p className="mt-2">
              This guide is for general informational purposes only and does not
              constitute legal, tax, accounting, or financial advice. Buying,
              selling, or leasing a business or commercial space can involve
              significant risk. Consider obtaining advice from qualified
              professionals before making decisions.
            </p>
          </aside>

          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/resources"
              className="text-sm font-medium text-primary hover:text-primary-hover"
            >
              ← All resources
            </Link>
            <Link
              href="/listings"
              className="text-sm font-medium text-primary hover:text-primary-hover"
            >
              Browse listings on Bizora →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
