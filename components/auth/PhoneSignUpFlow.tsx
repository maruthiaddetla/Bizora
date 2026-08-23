"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingForm } from "@/components/auth/OnboardingForm";
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
import type { OnboardingIntentId } from "@/lib/auth/onboarding";
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

type OtpChannel = "sms";

export function PhoneSignUpFlow({
  nextPath = "/",
  onContinueWithEmail,
}: PhoneSignUpFlowProps) {
  const router = useRouter();
  const safeNext = getSafeNextPath(nextPath, "/");

  const [step, setStep] = useState<SignUpStep>("phone");
  const [localPhone, setLocalPhone] = useState("");
  const [e164Phone, setE164Phone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [channel, setChannel] = useState<OtpChannel>("sms");
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

  const requestSignupOtp = useCallback(
    async (phone: string, userPassword: string, nextChannel: OtpChannel) => {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        phone,
        password: userPassword,
        options: { channel: nextChannel },
      });

      if (signUpError) {
        return {
          ok: false as const,
          message: mapAuthErrorMessage(signUpError, "phone"),
          smsUnavailable: isSmsProviderError(signUpError),
        };
      }

      if (
        data.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        return {
          ok: false as const,
          message:
            "Unable to create an account with this number. Try signing in instead.",
          smsUnavailable: false,
        };
      }

      return {
        ok: true as const,
        session: data.session,
      };
    },
    [],
  );

  async function handlePhoneContinue() {
    setError(null);
    setSmsUnavailable(false);
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
    setSmsUnavailable(false);
    setLoading(true);
    setPassword(userPassword);
    setChannel("sms");

    try {
      const result = await requestSignupOtp(e164Phone, userPassword, "sms");
      if (!result.ok) {
        setError(result.message);
        setSmsUnavailable(result.smsUnavailable);
        // Stay on password step — do not pretend OTP was sent.
        return;
      }

      // Only advance when Supabase accepted signup. Session without OTP
      // means phone confirmation is disabled in the project (not a mock).
      if (result.session) {
        setStep("onboarding");
        return;
      }

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

      setStep("onboarding");
    } catch {
      setError(AUTH_UNEXPECTED_ERROR);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (!password) return;
    setError(null);
    setSmsUnavailable(false);
    setLoading(true);

    try {
      const result = await requestSignupOtp(e164Phone, password, channel);
      if (!result.ok) {
        setError(result.message);
        setSmsUnavailable(result.smsUnavailable);
        return;
      }
      setResendSeconds(OTP_RESEND_COOLDOWN_SECONDS);
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
        {smsUnavailable && (
          <SmsUnavailableNotice
            message={error ?? undefined}
            onContinueWithEmail={onContinueWithEmail}
          />
        )}
        <OtpVerifyStep
          e164Phone={e164Phone}
          otp={otp}
          onOtpChange={setOtp}
          onVerify={handleVerifyOtp}
          onResend={handleResendOtp}
          onChangeNumber={() => {
            setStep("phone");
            setOtp("");
            setPassword("");
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

  if (step === "password") {
    return (
      <div className="space-y-4">
        {smsUnavailable ? (
          <SmsUnavailableNotice
            message={error ?? undefined}
            onContinueWithEmail={onContinueWithEmail}
          />
        ) : null}
        <PasswordCreateForm
          title="Create password"
          subtitle="You'll use this password to sign in. We'll verify your mobile next."
          submitLabel="Continue"
          loading={loading}
          error={smsUnavailable ? null : error}
          onSubmit={handlePasswordSubmit}
        />
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setError(null);
            setSmsUnavailable(false);
          }}
          className="w-full text-center text-sm font-medium text-muted hover:text-foreground"
        >
          Change mobile number
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {smsUnavailable ? (
        <SmsUnavailableNotice
          message={error ?? undefined}
          onContinueWithEmail={onContinueWithEmail}
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

      <p className="text-xs text-muted">
        We&apos;ll send a verification code to confirm your mobile. If SMS is
        unavailable, you can create an account with email instead.
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
