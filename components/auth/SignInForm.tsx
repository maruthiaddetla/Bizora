"use client";

import { useState } from "react";
import { AuthMethodDivider } from "@/components/auth/AuthMethodDivider";
import { EmailSignInForm } from "@/components/auth/EmailSignInForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { PhoneOtpFlow } from "@/components/auth/PhoneOtpFlow";
import { Button } from "@/components/ui/Button";

type SignInFormProps = {
  nextPath?: string;
  initialError?: string | null;
};

export function SignInForm({
  nextPath = "/",
  initialError = null,
}: SignInFormProps) {
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

      <PhoneOtpFlow nextPath={nextPath} />

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
    </div>
  );
}
