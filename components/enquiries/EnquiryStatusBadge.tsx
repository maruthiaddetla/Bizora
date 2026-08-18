import type { EnquiryStatus } from "@/lib/supabase/database.types";

const styles: Record<EnquiryStatus, string> = {
  new: "border-blue-200 bg-blue-50 text-blue-800",
  read: "border-slate-200 bg-slate-50 text-slate-700",
  responded: "border-emerald-200 bg-emerald-50 text-emerald-800",
  closed: "border-zinc-200 bg-zinc-50 text-zinc-700",
};

const labels: Record<EnquiryStatus, string> = {
  new: "New",
  read: "Read",
  responded: "Responded",
  closed: "Closed",
};

type EnquiryStatusBadgeProps = {
  status: EnquiryStatus;
};

export function EnquiryStatusBadge({ status }: EnquiryStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
