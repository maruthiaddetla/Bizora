import { EnquiryStatusBadge } from "@/components/enquiries/EnquiryStatusBadge";
import { Button } from "@/components/ui/Button";
import type { EnquiryView } from "@/lib/repositories/enquiries.types";

type EnquiriesListSectionProps = {
  title: string;
  emptyMessage: string;
  enquiries: EnquiryView[];
  role: "buyer" | "seller";
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EnquiriesListSection({
  title,
  emptyMessage,
  enquiries,
  role,
}: EnquiriesListSectionProps) {
  if (enquiries.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-white px-6 py-10 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="space-y-3">
        {enquiries.map((enquiry) => (
          <article
            key={enquiry.id}
            className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-foreground">
                  {enquiry.businessTitle}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {role === "seller"
                    ? `From ${enquiry.buyerName}`
                    : `To ${enquiry.sellerName}`}
                </p>
              </div>
              <EnquiryStatusBadge status={enquiry.status} />
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-muted">{enquiry.message}</p>
            {enquiry.sellerResponse && role === "buyer" && (
              <p className="mt-2 line-clamp-2 text-sm text-foreground">
                <span className="font-medium">Seller: </span>
                {enquiry.sellerResponse}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted">{formatDate(enquiry.createdAt)}</p>
              <Button href={`/dashboard/enquiries/${enquiry.id}`} size="sm">
                View
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
