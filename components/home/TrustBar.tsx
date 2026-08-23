import { Check } from "lucide-react";

const trustItems = [
  "Free for Buyers",
  "Admin Reviewed",
  "Direct Communication",
  "Hyderabad Focused",
];

export function TrustBar() {
  return (
    <section
      className="border-t border-border bg-surface py-8 sm:py-10"
      aria-labelledby="why-bizora-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
          <h2
            id="why-bizora-heading"
            className="shrink-0 text-lg font-bold tracking-tight text-navy sm:text-xl"
          >
            Why Bizora?
          </h2>
          <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2 lg:flex-1 lg:justify-between lg:gap-4">
            {trustItems.map((label) => (
              <li
                key={label}
                className="inline-flex items-center gap-2 text-sm font-medium text-navy"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                  <Check className="h-3 w-3" aria-hidden strokeWidth={3} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
