import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnquiryStatusBadge } from "@/components/enquiries/EnquiryStatusBadge";
import { SellerEnquiryResponseForm } from "@/components/enquiries/SellerEnquiryResponseForm";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/Button";
import { markEnquiryRead } from "@/lib/enquiries/actions";
import { requireUser } from "@/lib/auth/session";
import { fetchEnquiryByIdForParticipant } from "@/lib/repositories/enquiries.repository";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Enquiry",
    description: "View enquiry details on Bizora.",
    robots: { index: false, follow: false },
  };
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function EnquiryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { user } = await requireUser(`/dashboard/enquiries/${id}`);

  const { enquiry: initialEnquiry, error } =
    await fetchEnquiryByIdForParticipant(id, user.id);
  let enquiry = initialEnquiry;

  if (error) {
    return (
      <>
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Unable to load enquiry
          </h1>
          <p className="mt-3 max-w-md text-muted">{error}</p>
          <Button href="/dashboard/enquiries" className="mt-8">
            Back to enquiries
          </Button>
        </main>
        <Footer />
      </>
    );
  }

  if (!enquiry) {
    notFound();
  }

  const isSeller = enquiry.sellerId === user.id;
  const isBuyer = enquiry.buyerId === user.id;

  if (isSeller && enquiry.status === "new") {
    await markEnquiryRead(enquiry.id);
    const refreshed = await fetchEnquiryByIdForParticipant(id, user.id);
    enquiry = refreshed.enquiry ?? enquiry;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <p className="text-sm text-muted">
            <Link
              href="/dashboard/enquiries"
              className="font-medium text-primary hover:text-primary-hover"
            >
              My Enquiries
            </Link>
          </p>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {enquiry.businessTitle}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {isSeller
                  ? `Enquiry from ${enquiry.buyerName}`
                  : `Enquiry to ${enquiry.sellerName}`}
              </p>
            </div>
            <EnquiryStatusBadge status={enquiry.status} />
          </div>

          <div className="mt-8 space-y-6">
            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Buyer message
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {enquiry.message}
              </p>
              <p className="mt-3 text-xs text-muted">
                Sent {formatDateTime(enquiry.createdAt)}
              </p>
            </section>

            {enquiry.sellerResponse && (
              <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                  Seller response
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {enquiry.sellerResponse}
                </p>
                <p className="mt-3 text-xs text-muted">
                  Responded {formatDateTime(enquiry.respondedAt)}
                </p>
              </section>
            )}

            {isSeller && (
              <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">
                  Respond to buyer
                </h2>
                <div className="mt-4">
                  <SellerEnquiryResponseForm enquiry={enquiry} />
                </div>
              </section>
            )}

            {isBuyer && enquiry.status === "closed" && (
              <p className="text-sm text-muted">
                This enquiry has been closed by the seller.
              </p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
