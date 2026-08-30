import { ArrowRight, BookOpen, TrendingUp } from "lucide-react";
import Link from "next/link";

const guides = [
  {
    icon: BookOpen,
    tag: "For Buyers",
    title: "Learn how to buy a business",
    description:
      "Key steps to evaluate opportunities, verify financials, and close with confidence — without costly mistakes.",
    href: "/resources/how-to-buy-a-business-in-india",
    cta: "Read the Guide",
    gradient: "from-primary/90 to-blue-700",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
  },
  {
    icon: TrendingUp,
    tag: "For Sellers",
    title: "Learn how to sell your business",
    description:
      "Selling takes preparation. Get the timing, positioning, and process right — you only get one shot.",
    href: "/resources/how-to-sell-a-business-in-india",
    cta: "Read the Guide",
    gradient: "from-emerald-600 to-teal-700",
    image:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
  },
];

export function LearnCards() {
  return (
    <section
      className="bg-surface py-14 sm:py-20"
      aria-labelledby="learn-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="learn-heading" className="sr-only">
          Buyer and seller guides
        </h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {guides.map((guide) => {
            const Icon = guide.icon;
            return (
              <Link
                key={guide.href}
                href={guide.href}
                className="group relative flex min-h-[280px] overflow-hidden rounded-3xl shadow-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${guide.image})` }}
                  aria-hidden
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${guide.gradient} opacity-90 transition-opacity group-hover:opacity-95`}
                  aria-hidden
                />

                <div className="relative flex flex-col justify-between p-8 sm:p-10">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                      {guide.tag}
                    </span>
                    <h3 className="mt-4 max-w-sm text-2xl font-bold leading-tight text-white sm:text-3xl">
                      {guide.title}
                    </h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
                      {guide.description}
                    </p>
                  </div>

                  <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white">
                    {guide.cta}
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      aria-hidden
                    />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
