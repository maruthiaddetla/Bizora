import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { EmailResetPasswordForm } from "@/components/auth/EmailResetPasswordForm";
import { getSafeNextPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Bizora account.",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthResetPasswordPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next, "/");

  return (
    <AuthShell>
      <EmailResetPasswordForm nextPath={nextPath} />
    </AuthShell>
  );
}
