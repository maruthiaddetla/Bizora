import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CtaBanner() {
  return (
    <section className="py-14 sm:py-20" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-blue-800 px-6 py-12 sm:px-12 sm:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-accent/20 blur-2xl"
          />

          <div className="relative flex flex-col items-center gap-8 text-center lg:flex-row lg:text-left">
            <div className="flex-1">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 lg:mx-0">
                <Mail className="h-6 w-6 text-white" aria-hidden />
              </div>
              <h2
                id="cta-heading"
                className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl"
              >
                Don&apos;t miss an opportunity
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-base text-blue-100 lg:mx-0">
                Get the latest business listings delivered to your inbox. Free
                to subscribe — unsubscribe anytime.
              </p>
            </div>

            <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row lg:shrink-0">
              <label className="sr-only" htmlFor="cta-email">
                Email address
              </label>
              <input
                id="cta-email"
                type="email"
                placeholder="you@company.com"
                className="h-12 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-blue-200/70 backdrop-blur-sm focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <Button
                href="/subscribe"
                size="lg"
                className="h-12 shrink-0 bg-white text-primary hover:bg-blue-50 active:bg-blue-100 focus-visible:ring-white"
              >
                Subscribe
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
