import type { SellerListingSummary } from "@/lib/repositories/businesses.types";

type DashboardSummaryCardsProps = {
  summary: SellerListingSummary;
};

const cards: {
  key: keyof Omit<
    SellerListingSummary,
    "sold" | "leased" | "withdrawn" | "business" | "commercialSpace"
  >;
  label: string;
}[] = [
  { key: "total", label: "Total Listings" },
  { key: "draft", label: "Drafts" },
  { key: "pending", label: "Pending Review" },
  { key: "published", label: "Published" },
  { key: "rejected", label: "Rejected" },
];

export function DashboardSummaryCards({ summary }: DashboardSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-2xl border border-border bg-white px-4 py-4 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {card.label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {summary[card.key].toLocaleString("en-IN")}
          </p>
        </div>
      ))}
    </div>
  );
}
