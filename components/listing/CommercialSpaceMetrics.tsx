import {
  FURNISHED_LABELS,
  FURNISHED_OPTIONS,
  LISTING_PURPOSE_LABELS,
  LISTING_PURPOSES,
  SPACE_TYPE_LABELS,
  SPACE_TYPES,
} from "@/lib/listing-types";

type CommercialSpaceMetricsProps = {
  monthlyRent?: string;
  securityDeposit?: string;
  location: string;
  category: string | null;
  areaSqft: number | null;
  spaceTypeLabel: string | null;
  floorLabel: string | null;
  parkingSpaces: number | null;
  furnishedLabel: string | null;
  leaseTermMonths: number | null;
  availableFrom: string | null;
  listingPurposeLabel: string | null;
  businessUsage: string | null;
};

function formatAvailableFrom(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CommercialSpaceMetrics({
  monthlyRent,
  securityDeposit,
  location,
  category,
  areaSqft,
  spaceTypeLabel,
  floorLabel,
  parkingSpaces,
  furnishedLabel,
  leaseTermMonths,
  availableFrom,
  listingPurposeLabel,
  businessUsage,
}: CommercialSpaceMetricsProps) {
  const metrics = [
    { label: "Monthly rent", value: monthlyRent ?? "—" },
    { label: "Security deposit", value: securityDeposit ?? "—" },
    { label: "Area", value: areaSqft ? `${areaSqft.toLocaleString("en-IN")} sq.ft` : "—" },
    { label: "Space type", value: spaceTypeLabel ?? "—" },
    { label: "Floor", value: floorLabel ?? "—" },
    {
      label: "Parking",
      value:
        parkingSpaces != null
          ? `${parkingSpaces} space${parkingSpaces === 1 ? "" : "s"}`
          : "—",
    },
    { label: "Furnishing", value: furnishedLabel ?? "—" },
    {
      label: "Lease term",
      value: leaseTermMonths ? `${leaseTermMonths} months` : "—",
    },
    {
      label: "Available from",
      value: formatAvailableFrom(availableFrom) ?? "—",
    },
    { label: "Purpose", value: listingPurposeLabel ?? "—" },
  ];

  return (
    <section aria-labelledby="commercial-metrics-heading">
      <div className="rounded-2xl border border-border bg-surface/60 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              id="commercial-metrics-heading"
              className="text-xl font-semibold text-foreground sm:text-2xl"
            >
              {monthlyRent ?? "Rent on request"}
            </h2>
            <p className="mt-1 text-sm text-muted">{location}</p>
          </div>
          {category && (
            <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">
              {category}
            </span>
          )}
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                {metric.label}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-foreground">
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>

        {businessUsage && (
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Permitted / suggested business use
            </p>
            <p className="mt-1 text-sm text-foreground">{businessUsage}</p>
          </div>
        )}
      </div>
    </section>
  );
}

export { FURNISHED_LABELS, FURNISHED_OPTIONS, LISTING_PURPOSE_LABELS, LISTING_PURPOSES, SPACE_TYPE_LABELS, SPACE_TYPES };
