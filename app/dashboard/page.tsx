import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { DashboardSummaryCards } from "@/components/dashboard/DashboardSummaryCards";
import { MyListingsSection } from "@/components/dashboard/MyListingsSection";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { fetchMyBusinesses } from "@/lib/repositories/businesses.repository";
import { fetchSellerEnquiries } from "@/lib/repositories/enquiries.repository";
import { countUnreadNotifications } from "@/lib/repositories/notifications.repository";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your business listings on Bizora.",
  robots: { index: false, follow: false },
};

function welcomeName(
  profileName: string | null | undefined,
  email: string | undefined,
): string {
  const name = profileName?.trim();
  if (name) return name;
  if (email?.trim()) return email.trim();
  return "there";
}

export default async function DashboardPage() {
  const { user, profile } = await requireUser("/dashboard");
  const [result, sellerEnquiries, unreadNotifications] = await Promise.all([
    fetchMyBusinesses(user.id),
    fetchSellerEnquiries(user.id),
    countUnreadNotifications(user.id),
  ]);
  const name = welcomeName(profile?.full_name, user.email);
  const newEnquiryCount = sellerEnquiries.enquiries.filter(
    (enquiry) => enquiry.status === "new",
  ).length;

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Dashboard
              </h1>
              <p className="mt-2 text-base text-muted">
                Welcome, {name}
              </p>
              <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">
                Manage your business listings and track their review status.
              </p>
            </div>
            <Button
              href="/dashboard/listings/new"
              size="md"
              className="shrink-0 self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Post a Business
            </Button>
          </div>

          <div className="mt-8">
            <DashboardSummaryCards summary={result.summary} />
          </div>

          <section className="mt-8 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Profile
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Update your display name, company details, and public seller
                  profile.
                </p>
              </div>
              <Button href="/dashboard/profile" size="sm" variant="secondary">
                Edit profile
              </Button>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Notifications
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {unreadNotifications > 0
                    ? `You have ${unreadNotifications} unread notification${unreadNotifications === 1 ? "" : "s"}.`
                    : "You're all caught up — no unread notifications."}
                </p>
              </div>
              <Button
                href="/dashboard/notifications"
                size="sm"
                variant="secondary"
              >
                View notifications
              </Button>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Enquiries
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {newEnquiryCount > 0
                    ? `${newEnquiryCount} new enquiry${newEnquiryCount === 1 ? "" : "ies"} waiting for you.`
                    : "View messages from buyers or enquiries you've sent."}
                </p>
              </div>
              <Button href="/dashboard/enquiries" size="sm" variant="secondary">
                My Enquiries
              </Button>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Saved Businesses
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Revisit published listings you&apos;ve saved while browsing.
                </p>
              </div>
              <Button href="/dashboard/favorites" size="sm" variant="secondary">
                Saved Businesses
              </Button>
            </div>
          </section>

          {result.error && (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {result.error}
            </div>
          )}

          <section className="mt-10">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                My Listings
              </h2>
              <Button
                href="/dashboard/listings/new"
                size="sm"
                variant="secondary"
                className="self-start"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Post a Business
              </Button>
            </div>
            <MyListingsSection listings={result.listings} />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
