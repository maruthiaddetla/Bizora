"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthMethodDivider } from "@/components/auth/AuthMethodDivider";
import { EmailSignInForm } from "@/components/auth/EmailSignInForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { PhoneSignInForm } from "@/components/auth/PhoneSignInForm";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/Button";

type SignInFormProps = {
  nextPath?: string;
  initialError?: string | null;
};

export function SignInForm({
  nextPath = "/",
  initialError = null,
}: SignInFormProps) {
  const safeNext = getSafeNextPath(nextPath, "/");
  const [showEmail, setShowEmail] = useState(false);

  if (showEmail) {
    return (
      <EmailSignInForm
        nextPath={nextPath}
        onBack={() => setShowEmail(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {initialError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {initialError}
        </div>
      )}

      <PhoneSignInForm
        nextPath={nextPath}
        onContinueWithEmail={() => setShowEmail(true)}
      />

      <AuthMethodDivider />

      <GoogleSignInButton nextPath={nextPath} />

      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={() => setShowEmail(true)}
      >
        Continue with Email
      </Button>

      <p className="text-center text-sm text-muted">
        New to Bizora?{" "}
        <Link
          href={`/sign-up?next=${encodeURIComponent(safeNext)}`}
          className="font-semibold text-primary hover:text-primary-hover"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
