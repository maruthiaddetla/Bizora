import type { Metadata } from "next";
import Link from "next/link";
import { EnquiryStatusBadge } from "@/components/enquiries/EnquiryStatusBadge";
import { fetchAdminEnquiries } from "@/lib/admin/enquiries.repository";

export const metadata: Metadata = {
  title: "Admin enquiries",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminEnquiriesPage() {
  const { enquiries, error } = await fetchAdminEnquiries();

  return (
    <main className="flex-1 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Enquiries
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Review buyer enquiries, see each listing&apos;s private seller contact,
          and record when contact details are shared. Private numbers are never
          shown on the public site.
        </p>

        {error && (
          <p role="alert" className="mt-6 text-sm text-red-700">
            {error}
          </p>
        )}

        {!error && enquiries.length === 0 && (
          <p className="mt-8 text-sm text-muted">No enquiries yet.</p>
        )}

        {enquiries.length > 0 && (
          <ul className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            {enquiries.map((enquiry) => (
              <li key={enquiry.id}>
                <Link
                  href={`/admin/enquiries/${enquiry.id}`}
                  className="flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-surface sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {enquiry.businessTitle}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Buyer: {enquiry.buyerName} · Listing ID{" "}
                      <span className="font-mono text-xs">
                        {enquiry.businessId.slice(0, 8)}…
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {formatWhen(enquiry.createdAt)}
                      {!enquiry.hasSellerContact
                        ? " · No private contact on file"
                        : !enquiry.sharingAuthorised
                          ? " · Sharing not authorised"
                          : " · Contact on file"}
                    </p>
                  </div>
                  <EnquiryStatusBadge status={enquiry.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
