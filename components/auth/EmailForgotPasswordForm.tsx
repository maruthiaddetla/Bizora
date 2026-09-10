"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { authFieldClass } from "@/components/auth/PhoneInput";
import {
  AUTH_PASSWORD_RESET_FAILED,
  AUTH_PASSWORD_RESET_SENT,
  AUTH_PASSWORD_RESET_SENT_HEADING,
} from "@/lib/auth/errors";
import {
  getPasswordResetResendButtonState,
  mapPasswordResetRequestError,
  normalizeResetEmail,
  PASSWORD_RESET_RESEND_COOLDOWN_SECONDS,
  validateResetEmail,
} from "@/lib/auth/password-reset";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { AUTH_SIGN_IN_PATH, authSignInHref } from "@/lib/auth/routes";
import { getPasswordResetRedirectTo } from "@/lib/site";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type EmailForgotPasswordFormProps = {
  nextPath?: string;
  initialError?: string | null;
};

type ForgotView = "request" | "sent";

export function EmailForgotPasswordForm({
  nextPath = "/",
  initialError = null,
}: EmailForgotPasswordFormProps) {
  const safeNext = getSafeNextPath(nextPath, "/");
  const signInHref = authSignInHref(safeNext);

  const [view, setView] = useState<ForgotView>("request");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  async function requestResetLink() {
    setError(null);

    const validationError = validateResetEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    const trimmedEmail = normalizeResetEmail(email);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = getPasswordResetRedirectTo();

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        { redirectTo },
      );

      if (resetError) {
        const mapped = mapPasswordResetRequestError(resetError);
        if (mapped.revealGenericSuccess) {
          setView("sent");
          setResendSeconds(PASSWORD_RESET_RESEND_COOLDOWN_SECONDS);
        } else {
          setError(mapped.message);
        }
        return;
      }

      setView("sent");
      setResendSeconds(PASSWORD_RESET_RESEND_COOLDOWN_SECONDS);
    } catch {
      setError(AUTH_PASSWORD_RESET_FAILED);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await requestResetLink();
  }

  const backToLogin = (
    <p className="text-center text-sm text-muted">
      <Link
        href={signInHref}
        data-canonical-sign-in={AUTH_SIGN_IN_PATH}
        className="font-semibold text-primary hover:text-primary-hover"
      >
        Back to login
      </Link>
    </p>
  );

  if (view === "sent") {
    const resend = getPasswordResetResendButtonState({
      resendSeconds,
      loading,
    });

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {AUTH_PASSWORD_RESET_SENT_HEADING}
          </h1>
          <p
            role="status"
            className="mt-2 text-sm text-muted sm:text-base"
          >
            {AUTH_PASSWORD_RESET_SENT}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={resend.disabled}
          onClick={() => void requestResetLink()}
        >
          {resend.label}
        </Button>

        {backToLogin}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          Enter the email address associated with your Bizora account and
          we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Email
        </span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={authFieldClass}
          required
          disabled={loading}
        />
      </label>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </Button>

      {backToLogin}
    </form>
  );
}
