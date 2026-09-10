import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { EmailForgotPasswordForm } from "@/components/auth/EmailForgotPasswordForm";
import { AUTH_PASSWORD_RESET_LINK_INVALID } from "@/lib/auth/errors";
import { getSafeNextPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Bizora account password by email.",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthForgotPasswordPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next, "/");
  const errorParam = typeof params.error === "string" ? params.error : null;

  const initialError =
    errorParam === "invalid_link" ? AUTH_PASSWORD_RESET_LINK_INVALID : null;

  return (
    <AuthShell>
      <EmailForgotPasswordForm
        nextPath={nextPath}
        initialError={initialError}
      />
    </AuthShell>
  );
}
