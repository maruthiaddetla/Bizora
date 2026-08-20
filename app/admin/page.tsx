import type { Metadata } from "next";
import Link from "next/link";
import { AdminSummaryCards } from "@/components/admin/AdminSummaryCards";
import { Button } from "@/components/ui/Button";
import { fetchAdminListingSummary } from "@/lib/repositories/admin.repository";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Review and moderate Bizora business listings.",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const { summary, error } = await fetchAdminListingSummary();

  return (
    <main className="flex-1 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-muted">
              Review seller submissions and keep the marketplace trusted.
            </p>
          </div>
          <Button href="/admin/listings?status=pending" size="md">
            Open review queue
          </Button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <div className="mt-8">
          <AdminSummaryCards summary={summary} />
        </div>

        <section className="mt-10 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Quick actions
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              <Link
                href="/admin/listings?status=pending"
                className="font-medium text-primary hover:text-primary-hover"
              >
                Review pending listings
              </Link>
              {summary.pending > 0
                ? ` — ${summary.pending} waiting`
                : " — queue is clear"}
            </li>
            <li>
              <Link
                href="/admin/listings?status=rejected"
                className="font-medium text-primary hover:text-primary-hover"
              >
                Browse rejected listings
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
