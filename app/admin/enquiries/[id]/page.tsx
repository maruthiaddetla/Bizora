import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminEnquiryWorkspace } from "@/components/admin/AdminEnquiryWorkspace";
import { fetchAdminEnquiryDetail } from "@/lib/admin/enquiries.repository";

export const metadata: Metadata = {
  title: "Enquiry detail",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEnquiryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { enquiry, error } = await fetchAdminEnquiryDetail(id);

  if (error) {
    return (
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Unable to load enquiry
          </h1>
          <p className="mt-3 text-muted">{error}</p>
          <Link
            href="/admin/enquiries"
            className="mt-6 inline-block text-sm font-medium text-primary"
          >
            Back to enquiries
          </Link>
        </div>
      </main>
    );
  }

  if (!enquiry) {
    notFound();
  }

  return (
    <main className="flex-1 bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <p className="mb-6 text-sm text-muted">
          <Link
            href="/admin/enquiries"
            className="font-medium text-primary hover:text-primary-hover"
          >
            Enquiries
          </Link>
          <span className="mx-2">/</span>
          Detail
        </p>
        <AdminEnquiryWorkspace enquiry={enquiry} />
      </div>
    </main>
  );
}
