"use client";

import {
  ArrowRight,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { categories, locations } from "@/lib/listings";

type SearchTab = "buy" | "sell" | "latest";

const tabs: { id: SearchTab; label: string }[] = [
  { id: "buy", label: "Buy a Business" },
  { id: "sell", label: "Sell a Business" },
  { id: "latest", label: "Latest Listings" },
];

export function SearchHero() {
  const [activeTab, setActiveTab] = useState<SearchTab>("buy");
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("Hyderabad");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-hero-from via-[#121a2e] to-hero-to">
      {/* Animated gradient wash */}
      <div
        aria-hidden
        className="animate-gradient-shift pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/10"
      />

      {/* Grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-80"
      />

      {/* Floating orbs */}
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -right-20 top-10 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-[100px]"
      />
      <div
        aria-hidden
        className="animate-float-delayed pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-accent/15 blur-[90px]"
      />
      <div
        aria-hidden
        className="animate-pulse-glow pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[80px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
        {/* Hero copy */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm text-slate-300 backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden />
            Verified listings across India
          </div>

          <h1 className="animate-fade-up text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl md:text-6xl md:leading-[1.05] lg:text-[3.75rem] [animation-delay:80ms]">
            India&apos;s Trusted
            <br />
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Business Marketplace
            </span>
          </h1>

          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:mt-7 sm:text-lg sm:leading-8 md:text-xl [animation-delay:160ms]">
            Discover verified businesses for sale, connect with genuine buyers
            and sellers, and complete deals with confidence.
          </p>

          <div className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4 [animation-delay:240ms]">
            <Button
              href="/listings"
              size="lg"
              className="h-12 w-full min-w-[200px] border-0 bg-white px-7 text-base font-semibold text-slate-900 shadow-lg shadow-black/20 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-white sm:w-auto"
            >
              Browse Businesses
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              href="/sell"
              variant="secondary"
              size="lg"
              className="h-12 w-full min-w-[200px] border-white/15 bg-white/[0.06] px-7 text-base font-semibold text-white shadow-none backdrop-blur-sm hover:border-white/25 hover:bg-white/10 active:bg-white/[0.14] focus-visible:ring-white/50 sm:w-auto"
            >
              List Your Business
            </Button>
          </div>

          <div className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500 sm:mt-12 [animation-delay:320ms]">
            <span>
              <strong className="font-semibold text-slate-300">1,200+</strong>{" "}
              businesses listed
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:block" aria-hidden />
            <span>
              <strong className="font-semibold text-slate-300">350+</strong>{" "}
              verified sellers
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:block" aria-hidden />
            <span>
              <strong className="font-semibold text-slate-300">150+</strong>{" "}
              trusted brokers
            </span>
          </div>
        </div>

        {/* Search card */}
        <div className="animate-fade-up mx-auto mt-14 max-w-4xl rounded-2xl border border-white/10 bg-white p-2 shadow-2xl shadow-black/30 sm:mt-16 sm:rounded-3xl sm:p-3 lg:mt-20 [animation-delay:400ms]">
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface p-1 sm:gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  activeTab === tab.id
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "buy" && (
            <form
              className="mt-3 grid gap-3 p-2 sm:grid-cols-[1fr_auto_auto] sm:p-3"
              onSubmit={(e) => e.preventDefault()}
            >
              <label className="relative block">
                <span className="sr-only">Search keywords</span>
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <input
                  type="search"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Industry, keyword, or business type..."
                  className="h-12 w-full rounded-xl border border-border bg-white pl-12 pr-4 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="relative block sm:w-52">
                <span className="sr-only">Location</span>
                <MapPin
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-12 w-full appearance-none rounded-xl border border-border bg-white pl-12 pr-10 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </label>

              <Button type="submit" size="lg" className="h-12 px-8">
                Search
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </form>
          )}

          {activeTab === "sell" && (
            <div className="mt-3 grid gap-4 p-2 sm:grid-cols-2 sm:p-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="font-semibold text-foreground">List privately</h3>
                <p className="mt-2 text-sm text-muted">
                  Reach qualified buyers without public exposure. NDAs and vetting
                  built in.
                </p>
                <Button href="/sell" size="sm" className="mt-4">
                  Start Selling
                </Button>
              </div>
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="font-semibold text-foreground">Broker-assisted</h3>
                <p className="mt-2 text-sm text-muted">
                  Work with a verified broker to manage your listing and deal flow.
                </p>
                <Button href="/brokers" variant="secondary" size="sm" className="mt-4">
                  Find a Broker
                </Button>
              </div>
            </div>
          )}

          {activeTab === "latest" && (
            <div className="mt-3 p-2 sm:p-4">
              <p className="text-sm text-muted">
                Browse the newest verified listings added in the last 7 days.
              </p>
              <Button href="/listings?sort=latest" size="md" className="mt-4">
                View Latest Listings
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-2 pb-1 pt-3 sm:px-4">
            <div className="flex flex-wrap gap-2">
              {categories.slice(1, 6).map((cat) => (
                <Link
                  key={cat}
                  href={`/listings?category=${cat.toLowerCase()}`}
                  className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {cat}
                </Link>
              ))}
            </div>
            <Link
              href="/listings/advanced"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
              Advanced Search
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
