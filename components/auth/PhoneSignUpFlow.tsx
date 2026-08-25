"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { OtpVerifyStep } from "@/components/auth/OtpVerifyStep";
import { PasswordCreateForm } from "@/components/auth/PasswordCreateForm";
import { PhoneInput } from "@/components/auth/PhoneInput";
import {
  AUTH_INVALID_OTP,
  AUTH_INVALID_PHONE,
  AUTH_UNEXPECTED_ERROR,
} from "@/lib/auth/errors";
import type { OnboardingIntentId } from "@/lib/auth/onboarding";
import {
  clearPhoneSignupPendingAction,
  resendPhoneSignupOtpAction,
  sendPhoneSignupOtpAction,
  verifyPhoneSignupOtpAction,
} from "@/lib/auth/phone-signup.actions";
import { completeAuthProfile } from "@/lib/auth/post-auth";
import {
  isValidOtpCode,
  normalizeIndianPhone,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/lib/auth/phone";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SignUpStep = "phone" | "password" | "verify" | "onboarding";

type PhoneSignUpFlowProps = {
  nextPath?: string;
  onContinueWithEmail?: () => void;
};

export function PhoneSignUpFlow({
  nextPath = "/",
  onContinueWithEmail,
}: PhoneSignUpFlowProps) {
  const router = useRouter();
  const safeNext = getSafeNextPath(nextPath, "/");

  const [step, setStep] = useState<SignUpStep>("phone");
  const [localPhone, setLocalPhone] = useState("");
  const [e164Phone, setE164Phone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const resetPendingSignup = useCallback(async () => {
    try {
      await clearPhoneSignupPendingAction();
    } catch {
      // Best-effort cleanup when changing number.
    }
  }, []);

  async function handlePhoneContinue() {
    setError(null);
    const normalized = normalizeIndianPhone(localPhone);
    if (!normalized) {
      setError(AUTH_INVALID_PHONE);
      return;
    }
    setE164Phone(normalized);
    setStep("password");
  }

  async function handlePasswordSubmit(userPassword: string) {
    setError(null);
    setLoading(true);

    try {
      const result = await sendPhoneSignupOtpAction(localPhone, userPassword);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      setOtp("");
      setStep("verify");
      setResendSeconds(result.resendCooldownSeconds ?? OTP_RESEND_COOLDOWN_SECONDS);
    } catch {
      setError(AUTH_UNEXPECTED_ERROR);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError(null);

    if (!isValidOtpCode(otp)) {
      setError(AUTH_INVALID_OTP);
      return;
    }

    setLoading(true);

    try {
      const result = await verifyPhoneSignupOtpAction(otp.trim());
      if (!result.ok) {
        setError(result.message);
        return;
      }

      setStep("onboarding");
    } catch {
      setError(AUTH_UNEXPECTED_ERROR);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError(null);
    setLoading(true);

    try {
      const result = await resendPhoneSignupOtpAction();
      if (!result.ok) {
        setError(result.message);
        if (result.resendCooldownSeconds) {
          setResendSeconds(result.resendCooldownSeconds);
        }
        return;
      }
      setResendSeconds(result.resendCooldownSeconds ?? OTP_RESEND_COOLDOWN_SECONDS);
    } catch {
      setError(AUTH_UNEXPECTED_ERROR);
    } finally {
      setLoading(false);
    }
  }

  async function handleOnboardingSubmit(data: {
    fullName: string;
    intent: OnboardingIntentId;
  }) {
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(AUTH_UNEXPECTED_ERROR);
        return;
      }

      const result = await completeAuthProfile(supabase, user, {
        fullName: data.fullName,
        onboardingIntent: data.intent,
      });

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

  if (step === "onboarding") {
    return (
      <OnboardingForm
        onSubmit={handleOnboardingSubmit}
        loading={loading}
        error={error}
      />
    );
  }

  if (step === "verify") {
    return (
      <div className="space-y-4">
        <OtpVerifyStep
          e164Phone={e164Phone}
          otp={otp}
          onOtpChange={setOtp}
          onVerify={handleVerifyOtp}
          onResend={handleResendOtp}
          onChangeNumber={async () => {
            await resetPendingSignup();
            setStep("phone");
            setOtp("");
            setError(null);
          }}
          resendSeconds={resendSeconds}
          loading={loading}
          error={error}
        />
      </div>
    );
  }

  if (step === "password") {
    return (
      <div className="space-y-4">
        <PasswordCreateForm
          title="Create password"
          subtitle="You'll use this password to sign in. We'll verify your mobile next."
          submitLabel="Continue"
          loading={loading}
          error={error}
          onSubmit={handlePasswordSubmit}
        />
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setError(null);
          }}
          className="w-full text-center text-sm font-medium text-muted hover:text-foreground"
        >
          Change mobile number
        </button>
        {error && onContinueWithEmail ? (
          <button
            type="button"
            onClick={onContinueWithEmail}
            className="w-full text-center text-sm font-medium text-primary hover:text-primary-hover"
          >
            Continue with email instead
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
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

      <p className="text-xs text-muted">
        We&apos;ll send a verification code to confirm your mobile. You can also
        create an account with email instead.
      </p>

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={loading || localPhone.length < 10}
        onClick={handlePhoneContinue}
      >
        Continue
      </Button>
    </div>
  );
}
