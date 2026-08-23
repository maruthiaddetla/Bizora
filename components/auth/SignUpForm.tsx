"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthMethodDivider } from "@/components/auth/AuthMethodDivider";
import { EmailSignUpForm } from "@/components/auth/EmailSignUpForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { PhoneSignUpFlow } from "@/components/auth/PhoneSignUpFlow";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/Button";

type SignUpFormProps = {
  nextPath?: string;
};

export function SignUpForm({ nextPath = "/" }: SignUpFormProps) {
  const safeNext = getSafeNextPath(nextPath, "/");
  const [showEmail, setShowEmail] = useState(false);

  if (showEmail) {
    return (
      <EmailSignUpForm
        nextPath={nextPath}
        onBack={() => setShowEmail(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <PhoneSignUpFlow
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
        Already have an account?{" "}
        <Link
          href={`/sign-in?next=${encodeURIComponent(safeNext)}`}
          className="font-semibold text-primary hover:text-primary-hover"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
