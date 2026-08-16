import type { BusinessStatus } from "@/lib/supabase/database.types";

const statusStyles: Record<BusinessStatus, string> = {
  draft: "border-slate-200 bg-slate-50 text-slate-700",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  published: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
  sold: "border-blue-200 bg-blue-50 text-blue-800",
};

const statusLabels: Record<BusinessStatus, string> = {
  draft: "Draft",
  pending: "Pending Review",
  published: "Published",
  rejected: "Rejected",
  sold: "Sold",
};

type ListingStatusBadgeProps = {
  status: BusinessStatus;
};

export function ListingStatusBadge({ status }: ListingStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
