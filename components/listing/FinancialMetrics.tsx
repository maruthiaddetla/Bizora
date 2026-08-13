import {
  Building2,
  Calendar,
  IndianRupee,
  MapPin,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type FinancialMetricsProps = {
  price?: string;
  location?: string;
  category?: string | null;
  revenue?: string;
  ebitda?: string;
  netProfit?: string;
  establishedYear?: number | null;
  employees?: number | null;
};

type MetricItem = {
  label: string;
  value: string;
  icon: LucideIcon;
};

function hasValue(value: string | number | null | undefined): value is string | number {
  return value != null && value !== "";
}

export function FinancialMetrics(props: FinancialMetricsProps) {
  const metrics: MetricItem[] = [
    hasValue(props.revenue)
      ? { label: "Annual Revenue", value: String(props.revenue), icon: TrendingUp }
      : null,
    hasValue(props.ebitda)
      ? { label: "EBITDA", value: String(props.ebitda), icon: Wallet }
      : null,
    hasValue(props.netProfit)
      ? { label: "Net Profit", value: String(props.netProfit), icon: IndianRupee }
      : null,
    hasValue(props.establishedYear)
      ? { label: "Established", value: String(props.establishedYear), icon: Calendar }
      : null,
    hasValue(props.employees)
      ? { label: "Employees", value: String(props.employees), icon: Users }
      : null,
    hasValue(props.category)
      ? { label: "Industry", value: String(props.category), icon: Building2 }
      : null,
  ].filter((item): item is MetricItem => item !== null);

  return (
    <div className="space-y-6">
      {(props.price || props.location) && (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {props.price && (
              <p className="text-2xl font-bold tracking-tight text-accent sm:text-3xl">
                {props.price}
              </p>
            )}
            {props.location && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {props.location}
              </p>
            )}
          </div>
        </div>
      )}

      {metrics.length > 0 && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
          {metrics.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/20"
            >
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {label}
              </dt>
              <dd className="mt-2 text-base font-semibold text-foreground sm:text-lg">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
