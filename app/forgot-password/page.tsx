import type { Metadata } from "next";
import { ForgotPasswordFlow } from "@/components/auth/ForgotPasswordFlow";
import { AuthShell } from "@/components/auth/AuthShell";
import { getSafeNextPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Bizora account password.",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ForgotPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next, "/");

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Verify your mobile number to set a new password."
    >
      <ForgotPasswordFlow nextPath={nextPath} />
    </AuthShell>
  );
}
