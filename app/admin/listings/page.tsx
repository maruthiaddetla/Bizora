import type { Metadata } from "next";
import { AdminListingsQueue } from "@/components/admin/AdminListingsQueue";
import { fetchAdminListings } from "@/lib/repositories/admin.repository";
import type { AdminListingQueueFilter } from "@/lib/repositories/admin.types";

export const metadata: Metadata = {
  title: "Admin listings",
  description: "Review queue for Bizora business listings.",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

function parseFilter(value: string | undefined): AdminListingQueueFilter {
  if (
    value === "pending" ||
    value === "published" ||
    value === "rejected" ||
    value === "all"
  ) {
    return value;
  }
  return "pending";
}

export default async function AdminListingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter = parseFilter(params.status);
  const { listings, error } = await fetchAdminListings(filter);

  return (
    <main className="flex-1 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Listing review queue
          </h1>
          <p className="mt-2 text-muted">
            Pending submissions appear first. Open a listing to approve or reject.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <AdminListingsQueue listings={listings} filter={filter} />
      </div>
    </main>
  );
}
