import { Building2, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";

type SellerCtaSectionProps = {
  isAuthenticated: boolean;
};

export function SellerCtaSection({ isAuthenticated }: SellerCtaSectionProps) {
  const businessHref = isAuthenticated
    ? "/dashboard/listings/new/business"
    : "/sign-in?next=/dashboard/listings/new/business";
  const commercialHref = isAuthenticated
    ? "/dashboard/listings/new/commercial"
    : "/sign-in?next=/dashboard/listings/new/commercial";

  return (
    <section
      className="border-t border-border bg-white py-10 sm:py-12"
      aria-labelledby="seller-cta-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-navy px-5 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="seller-cta-heading"
              className="text-xl font-bold tracking-tight text-white sm:text-2xl"
            >
              List with Bizora
            </h2>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Have a business or commercial space to list?
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
            <article className="rounded-xl border border-white/10 bg-white/5 px-5 py-5 text-center sm:text-left">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary sm:mx-0">
                <Store className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-3 text-base font-semibold text-white">
                Sell Your Business
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                Reach buyers looking for businesses.
              </p>
              <Button href={businessHref} size="sm" className="mt-4 bg-primary">
                Sell Your Business
              </Button>
            </article>

            <article className="rounded-xl border border-white/10 bg-white/5 px-5 py-5 text-center sm:text-left">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-cta/20 text-cta sm:mx-0">
                <Building2 className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-3 text-base font-semibold text-white">
                List a Commercial Space
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                Find tenants for your shop, office, restaurant or warehouse.
              </p>
              <Button
                href={commercialHref}
                size="sm"
                className="mt-4 bg-cta hover:bg-cta-hover"
              >
                List Your Space
              </Button>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
