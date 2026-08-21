import type { Metadata } from "next";
import Link from "next/link";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { requireUser } from "@/lib/auth/session";
import { fetchMyNotifications } from "@/lib/repositories/notifications.repository";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your Bizora in-app notifications.",
  robots: { index: false, follow: false },
};

export default async function DashboardNotificationsPage() {
  const { user } = await requireUser("/dashboard/notifications");
  const result = await fetchMyNotifications(user.id, { page: 1, pageSize: 40 });

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="mb-8">
            <p className="text-sm text-muted">
              <Link
                href="/dashboard"
                className="font-medium text-primary hover:text-primary-hover"
              >
                Dashboard
              </Link>
              <span className="mx-2">/</span>
              Notifications
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Notifications
            </h1>
            <p className="mt-2 text-sm text-muted sm:text-base">
              Listing and enquiry updates for your account.
              {result.error == null && result.unreadCount > 0
                ? ` ${result.unreadCount} unread.`
                : null}
            </p>
          </div>

          {result.error && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {result.error}
            </div>
          )}

          <NotificationsList notifications={result.notifications} />
        </div>
      </main>
      <Footer />
    </>
  );
}
