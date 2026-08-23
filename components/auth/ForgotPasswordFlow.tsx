"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { OtpVerifyStep } from "@/components/auth/OtpVerifyStep";
import { PasswordCreateForm } from "@/components/auth/PasswordCreateForm";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { SmsUnavailableNotice } from "@/components/auth/SmsUnavailableNotice";
import {
  AUTH_INVALID_OTP,
  AUTH_INVALID_PHONE,
  AUTH_UNEXPECTED_ERROR,
  isSmsProviderError,
  mapAuthErrorMessage,
} from "@/lib/auth/errors";
import {
  isValidOtpCode,
  normalizeIndianPhone,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/lib/auth/phone";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ForgotStep = "phone" | "verify" | "password" | "done";

type ForgotPasswordFlowProps = {
  nextPath?: string;
};

export function ForgotPasswordFlow({ nextPath = "/" }: ForgotPasswordFlowProps) {
  const safeNext = getSafeNextPath(nextPath, "/");
  const signInHref = `/sign-in?next=${encodeURIComponent(safeNext)}`;

  const [step, setStep] = useState<ForgotStep>("phone");
  const [localPhone, setLocalPhone] = useState("");
  const [e164Phone, setE164Phone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [smsUnavailable, setSmsUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const sendRecoveryOtp = useCallback(async (phone: string) => {
    const supabase = createSupabaseBrowserClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: false },
    });

    if (otpError) {
      return {
        ok: false as const,
        message: mapAuthErrorMessage(otpError, "phone"),
        smsUnavailable: isSmsProviderError(otpError),
      };
    }

    return { ok: true as const };
  }, []);

  async function handleSendOtp() {
    setError(null);
    setSmsUnavailable(false);
    const normalized = normalizeIndianPhone(localPhone);
    if (!normalized) {
      setError(AUTH_INVALID_PHONE);
      return;
    }

    setLoading(true);

    try {
      const result = await sendRecoveryOtp(normalized);
      if (!result.ok) {
        setError(result.message);
        setSmsUnavailable(result.smsUnavailable);
        // Stay on phone step — do not pretend OTP was sent.
        return;
      }

      setE164Phone(normalized);
      setOtp("");
      setStep("verify");
      setResendSeconds(OTP_RESEND_COOLDOWN_SECONDS);
    } catch {
      setError(AUTH_UNEXPECTED_ERROR);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError(null);
    setSmsUnavailable(false);

    if (!isValidOtpCode(otp)) {
      setError(AUTH_INVALID_OTP);
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: e164Phone,
        token: otp.trim(),
        type: "sms",
      });

      if (verifyError) {
        setError(mapAuthErrorMessage(verifyError, "phone"));
        setSmsUnavailable(isSmsProviderError(verifyError));
        return;
      }

      setStep("password");
    } catch {
      setError(AUTH_UNEXPECTED_ERROR);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPassword(newPassword: string) {
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(mapAuthErrorMessage(updateError, "phone"));
        return;
      }

      await supabase.auth.signOut();
      setStep("done");
    } catch {
      setError(AUTH_UNEXPECTED_ERROR);
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="space-y-4 text-center">
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900"
        >
          Your password has been updated. Sign in with your mobile number and new
          password.
        </div>
        <Button href={signInHref} size="lg" className="w-full">
          Sign in
        </Button>
      </div>
    );
  }

  if (step === "password") {
    return (
      <PasswordCreateForm
        title="Set new password"
        subtitle="Choose a new password for your Bizora account."
        submitLabel="Update password"
        loading={loading}
        error={error}
        onSubmit={handleSetPassword}
      />
    );
  }

  if (step === "verify") {
    return (
      <div className="space-y-4">
        {smsUnavailable && (
          <SmsUnavailableNotice
            message={error ?? undefined}
            emailHref={signInHref}
          />
        )}
        <OtpVerifyStep
          e164Phone={e164Phone}
          otp={otp}
          onOtpChange={setOtp}
          onVerify={handleVerifyOtp}
          onResend={async () => {
            setLoading(true);
            setError(null);
            setSmsUnavailable(false);
            try {
              const result = await sendRecoveryOtp(e164Phone);
              if (!result.ok) {
                setError(result.message);
                setSmsUnavailable(result.smsUnavailable);
              } else {
                setResendSeconds(OTP_RESEND_COOLDOWN_SECONDS);
              }
            } catch {
              setError(AUTH_UNEXPECTED_ERROR);
            } finally {
              setLoading(false);
            }
          }}
          onChangeNumber={() => {
            setStep("phone");
            setOtp("");
            setError(null);
            setSmsUnavailable(false);
          }}
          resendSeconds={resendSeconds}
          loading={loading}
          error={smsUnavailable ? null : error}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Enter your mobile number and we&apos;ll send a verification code to reset
        your password. Password reset by SMS requires an SMS provider.
      </p>

      {smsUnavailable ? (
        <SmsUnavailableNotice
          message={error ?? undefined}
          emailHref={signInHref}
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

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={loading || localPhone.length < 10}
        onClick={handleSendOtp}
      >
        {loading ? "Sending…" : "Send OTP"}
      </Button>

      <p className="text-center text-sm text-muted">
        <Link
          href={signInHref}
          className="font-semibold text-primary hover:text-primary-hover"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
