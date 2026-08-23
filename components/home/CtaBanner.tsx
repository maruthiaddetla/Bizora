import { Button } from "@/components/ui/Button";

type CtaBannerProps = {
  isAuthenticated?: boolean;
};

export function CtaBanner({ isAuthenticated = false }: CtaBannerProps) {
  const href = isAuthenticated
    ? "/dashboard/listings/new"
    : "/sign-in?next=/dashboard/listings/new";

  return (
    <section className="py-14 sm:py-16" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-navy px-6 py-12 text-center sm:px-12 sm:py-14">
          <h2
            id="cta-heading"
            className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
          >
            Have a business or commercial space to list?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-300">
            List your opportunity on Bizora.
          </p>
          <Button
            href={href}
            size="lg"
            className="mt-8 bg-primary hover:bg-primary-hover"
          >
            List with Bizora
          </Button>
        </div>
      </div>
    </section>
  );
}
