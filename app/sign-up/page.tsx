import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { getSafeNextPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a free Bizora account.",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignUpPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next, "/");

  return (
    <AuthShell
      title="Welcome to Bizora"
      subtitle="Create your account using your mobile number."
    >
      <SignUpForm nextPath={nextPath} />
    </AuthShell>
  );
}
