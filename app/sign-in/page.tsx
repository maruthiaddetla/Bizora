import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/SignInForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { getSafeNextPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Bizora account or create a new one.",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next, "/");
  const errorParam = typeof params.error === "string" ? params.error : null;

  let initialError: string | null = null;
  if (errorParam === "auth") {
    initialError = "Authentication failed. Please try signing in again.";
  } else if (errorParam === "config") {
    initialError = "Authentication is temporarily unavailable. Please try again later.";
  }

  return (
    <AuthShell subtitle="Sign in to your Bizora account or create a new one.">
      <SignInForm nextPath={nextPath} initialError={initialError} />
    </AuthShell>
  );
}
