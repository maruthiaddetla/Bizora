"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SmsUnavailableNotice } from "@/components/auth/SmsUnavailableNotice";
import { PhoneInput, authFieldClass } from "@/components/auth/PhoneInput";
import {
  AUTH_INVALID_PHONE,
  AUTH_UNEXPECTED_ERROR,
  isPhoneProviderDisabledError,
  isSmsProviderError,
  mapAuthErrorMessage,
} from "@/lib/auth/errors";
import { completeAuthProfile } from "@/lib/auth/post-auth";
import { normalizeIndianPhone } from "@/lib/auth/phone";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type PhoneSignInFormProps = {
  nextPath?: string;
  onContinueWithEmail?: () => void;
};

export function PhoneSignInForm({
  nextPath = "/",
  onContinueWithEmail,
}: PhoneSignInFormProps) {
  const router = useRouter();
  const safeNext = getSafeNextPath(nextPath, "/");

  const [localPhone, setLocalPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [providerUnavailable, setProviderUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setProviderUnavailable(false);

    const phone = normalizeIndianPhone(localPhone);
    if (!phone) {
      setError(AUTH_INVALID_PHONE);
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        phone,
        password,
      });

      if (signInError) {
        if (
          isSmsProviderError(signInError) ||
          isPhoneProviderDisabledError(signInError)
        ) {
          setProviderUnavailable(true);
          setError(mapAuthErrorMessage(signInError, "phone"));
          return;
        }
        setError(mapAuthErrorMessage(signInError, "phone"));
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(AUTH_UNEXPECTED_ERROR);
        return;
      }

      const result = await completeAuthProfile(supabase, user);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      router.push(safeNext);
      router.refresh();
    } catch {
      setError(AUTH_UNEXPECTED_ERROR);
    } finally {
      setLoading(false);
    }
  }

  const forgotHref = `/forgot-password?next=${encodeURIComponent(safeNext)}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {providerUnavailable ? (
        <SmsUnavailableNotice
          message={error ?? undefined}
          onContinueWithEmail={onContinueWithEmail}
          emailHref={
            onContinueWithEmail
              ? undefined
              : `/sign-in?next=${encodeURIComponent(safeNext)}`
          }
        />
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Mobile number
        </span>
        <PhoneInput
          value={localPhone}
          onChange={setLocalPhone}
          disabled={loading}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Password
        </span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={authFieldClass}
          required
          disabled={loading}
        />
      </label>

      <div className="text-right">
        <Link
          href={forgotHref}
          className="text-sm font-medium text-primary hover:text-primary-hover"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={loading || localPhone.length < 10 || !password}
      >
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
