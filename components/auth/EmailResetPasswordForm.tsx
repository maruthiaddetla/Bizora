"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PasswordCreateForm } from "@/components/auth/PasswordCreateForm";
import {
  AUTH_PASSWORD_RESET_LINK_INVALID,
  AUTH_PASSWORD_UPDATED,
  AUTH_UNEXPECTED_ERROR,
  mapAuthErrorMessage,
} from "@/lib/auth/errors";
import { getSafeNextPath } from "@/lib/auth/redirect";
import {
  authForgotPasswordEmailHref,
  authSignInHref,
} from "@/lib/auth/routes";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type EmailResetPasswordFormProps = {
  nextPath?: string;
};

type ResetView = "loading" | "form" | "invalid" | "done";

export function EmailResetPasswordForm({
  nextPath = "/",
}: EmailResetPasswordFormProps) {
  const safeNext = getSafeNextPath(nextPath, "/");
  const signInHref = authSignInHref(safeNext);
  const forgotHref = authForgotPasswordEmailHref(safeNext);

  const [view, setView] = useState<ResetView>("loading");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifyRecoverySession() {
      try {
        const supabase = createSupabaseBrowserClient();

        // Belt-and-suspenders: if a code lands on this page directly, exchange it
        // in the browser (PKCE verifier lives in browser cookies).
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const code = params.get("code");
          const tokenHash = params.get("token_hash");
          const type = params.get("type");

          if (code) {
            const { error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              if (!cancelled) setView("invalid");
              return;
            }
            window.history.replaceState({}, "", "/auth/reset-password");
          } else if (tokenHash && type) {
            const { error: otpError } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: type as "recovery",
            });
            if (otpError) {
              if (!cancelled) setView("invalid");
              return;
            }
            window.history.replaceState({}, "", "/auth/reset-password");
          }
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (userError || !user) {
          setView("invalid");
          return;
        }

        setView("form");
      } catch {
        if (!cancelled) {
          setView("invalid");
        }
      }
    }

    void verifyRecoverySession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSetPassword(newPassword: string) {
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setView("invalid");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        const msg = (updateError.message ?? "").toLowerCase();
        if (
          msg.includes("session") ||
          updateError.code === "session_not_found"
        ) {
          setView("invalid");
          return;
        }
        setError(mapAuthErrorMessage(updateError, "email"));
        return;
      }

      await supabase.auth.signOut();
      setView("done");
    } catch {
      setError(AUTH_UNEXPECTED_ERROR);
    } finally {
      setLoading(false);
    }
  }

  if (view === "loading") {
    return (
      <p className="text-sm text-muted" role="status">
        Verifying your reset link…
      </p>
    );
  }

  if (view === "invalid") {
    return (
      <div className="space-y-4">
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {AUTH_PASSWORD_RESET_LINK_INVALID}
        </div>
        <Button href={forgotHref} size="lg" className="w-full">
          Request a new link
        </Button>
        <p className="text-center text-sm text-muted">
          <Link
            href={signInHref}
            className="font-semibold text-primary hover:text-primary-hover"
          >
            Back to login
          </Link>
        </p>
      </div>
    );
  }

  if (view === "done") {
    return (
      <div className="space-y-4 text-center">
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900"
        >
          {AUTH_PASSWORD_UPDATED}
        </div>
        <Button href={signInHref} size="lg" className="w-full">
          Sign in to Bizora
        </Button>
      </div>
    );
  }

  return (
    <PasswordCreateForm
      title="Set a new password"
      subtitle="Choose a new password for your Bizora account."
      submitLabel="Update password"
      passwordLabel="New password"
      confirmLabel="Confirm new password"
      loading={loading}
      error={error}
      onSubmit={handleSetPassword}
    />
  );
}
