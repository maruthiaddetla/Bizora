import Link from "next/link";
import type { AdminListingSummary } from "@/lib/repositories/admin.types";

type AdminSummaryCardsProps = {
  summary: AdminListingSummary;
};

const cards: {
  key: keyof Pick<
    AdminListingSummary,
    "pending" | "published" | "rejected" | "total"
  >;
  label: string;
  href: string;
}[] = [
  { key: "pending", label: "Pending Review", href: "/admin/listings?status=pending" },
  { key: "published", label: "Published", href: "/admin/listings?status=published" },
  { key: "rejected", label: "Rejected", href: "/admin/listings?status=rejected" },
  { key: "total", label: "Total Listings", href: "/admin/listings?status=all" },
];

export function AdminSummaryCards({ summary }: AdminSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <Link
          key={card.key}
          href={card.href}
          className="rounded-2xl border border-border bg-white px-4 py-4 shadow-sm transition-colors hover:border-primary/40"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {card.label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {summary[card.key].toLocaleString("en-IN")}
          </p>
        </Link>
      ))}
    </div>
  );
}
