import {
  Building2,
  Calendar,
  IndianRupee,
  MapPin,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { BusinessDetail } from "@/lib/listings";

type FinancialMetricsProps = Pick<
  BusinessDetail,
  | "price"
  | "location"
  | "industry"
  | "revenue"
  | "ebitda"
  | "netProfit"
  | "establishedYear"
  | "employees"
>;

const metrics = [
  { key: "revenue", label: "Annual Revenue", icon: TrendingUp },
  { key: "ebitda", label: "EBITDA", icon: Wallet },
  { key: "netProfit", label: "Net Profit", icon: IndianRupee },
  { key: "establishedYear", label: "Established", icon: Calendar },
  { key: "employees", label: "Employees", icon: Users },
  { key: "industry", label: "Industry", icon: Building2 },
] as const;

export function FinancialMetrics(props: FinancialMetricsProps) {
  const values: Record<(typeof metrics)[number]["key"], string | number> = {
    revenue: props.revenue,
    ebitda: props.ebitda,
    netProfit: props.netProfit,
    establishedYear: props.establishedYear,
    employees: props.employees,
    industry: props.industry,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-2xl font-bold tracking-tight text-accent sm:text-3xl">
            {props.price}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            {props.location}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
        {metrics.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/20"
          >
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {label}
            </dt>
            <dd className="mt-2 text-base font-semibold text-foreground sm:text-lg">
              {values[key]}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
