import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { requireUser } from "@/lib/auth/session";
import { fetchMyProfile } from "@/lib/repositories/profiles.repository";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Manage your Bizora profile.",
  robots: { index: false, follow: false },
};

export default async function DashboardProfilePage() {
  const { user } = await requireUser("/dashboard/profile");
  const result = await fetchMyProfile(user.id);

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
              Profile
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              My Profile
            </h1>
            <p className="mt-2 text-sm text-muted sm:text-base">
              Update the details shown on your public seller page. Email and
              account role are managed separately.
            </p>
          </div>

          {result.error || !result.profile ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {result.error ?? "Profile not found."}
            </div>
          ) : (
            <ProfileEditForm profile={result.profile} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
