"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { OtpInput } from "@/components/auth/OtpInput";
import { PhoneInput } from "@/components/auth/PhoneInput";
import {
  AUTH_INVALID_OTP,
  AUTH_INVALID_PHONE,
  AUTH_UNEXPECTED_ERROR,
  mapAuthErrorMessage,
} from "@/lib/auth/errors";
import type { OnboardingIntentId } from "@/lib/auth/onboarding";
import {
  completeAuthProfile,
  userNeedsOnboarding,
} from "@/lib/auth/post-auth";
import {
  formatPhoneDisplay,
  isValidOtpCode,
  normalizeIndianPhone,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/lib/auth/phone";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type OtpChannel = "sms" | "whatsapp";

type PhoneOtpFlowProps = {
  nextPath?: string;
  /** When true, always collect onboarding for users without a profile name. */
  isSignUp?: boolean;
};

const whatsAppEnabled =
  process.env.NEXT_PUBLIC_BIZORA_OTP_WHATSAPP_ENABLED === "true";

export function PhoneOtpFlow({
  nextPath = "/",
  isSignUp = false,
}: PhoneOtpFlowProps) {
  const router = useRouter();
  const safeNext = getSafeNextPath(nextPath, "/");

  const [step, setStep] = useState<"phone" | "verify" | "onboarding">("phone");
  const [localPhone, setLocalPhone] = useState("");
  const [e164Phone, setE164Phone] = useState("");
  const [otp, setOtp] = useState("");
  const [channel, setChannel] = useState<OtpChannel>("sms");
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

  const sendOtp = useCallback(
    async (nextChannel: OtpChannel) => {
      setError(null);

      const normalized = normalizeIndianPhone(localPhone);
      if (!normalized) {
        setError(AUTH_INVALID_PHONE);
        return;
      }

      setLoading(true);
      setChannel(nextChannel);

      try {
        const supabase = createSupabaseBrowserClient();
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone: normalized,
          options: {
            channel: nextChannel,
          },
        });

        if (otpError) {
          setError(mapAuthErrorMessage(otpError));
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
    },
    [localPhone],
  );

  async function finishSession(options?: {
    fullName?: string;
    onboardingIntent?: OnboardingIntentId;
  }) {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(AUTH_UNEXPECTED_ERROR);
      return;
    }

    const result = await completeAuthProfile(supabase, user, options);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.push(safeNext);
    router.refresh();
  }

  async function handleVerifyOtp() {
    setError(null);

    if (!isValidOtpCode(otp)) {
      setError(AUTH_INVALID_OTP);
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: e164Phone,
        token: otp.trim(),
        type: "sms",
      });

      if (verifyError) {
        setError(mapAuthErrorMessage(verifyError));
        return;
      }

      const user = data.user;
      if (!user) {
        setError(AUTH_UNEXPECTED_ERROR);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      const needsOnboarding =
        isSignUp || userNeedsOnboarding(profile?.full_name, user);

      if (needsOnboarding) {
        setStep("onboarding");
        return;
      }

      await finishSession();
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
      await finishSession({
        fullName: data.fullName,
        onboardingIntent: data.intent,
      });
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
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Verify your mobile
          </h2>
          <p className="mt-1 text-sm text-muted">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-foreground">
              {formatPhoneDisplay(e164Phone)}
            </span>
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

        <OtpInput value={otp} onChange={setOtp} disabled={loading} />

        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={loading || otp.length < 6}
          onClick={handleVerifyOtp}
        >
          {loading ? "Verifying…" : "Verify"}
        </Button>

        <div className="flex flex-col items-center gap-2 text-sm">
          {resendSeconds > 0 ? (
            <p className="text-muted">
              Resend code in{" "}
              <span className="font-medium text-foreground">
                {resendSeconds}s
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => sendOtp(channel)}
              disabled={loading}
              className="font-semibold text-primary hover:text-primary-hover disabled:opacity-50"
            >
              Resend OTP
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setOtp("");
              setError(null);
            }}
            className="text-muted hover:text-foreground"
          >
            Change mobile number
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          Mobile number
        </span>
        <PhoneInput
          value={localPhone}
          onChange={setLocalPhone}
          disabled={loading}
        />
      </label>

      <p className="text-xs text-muted">
        We&apos;ll send a verification code to your mobile.
      </p>

      {whatsAppEnabled ? (
        <div className="space-y-2">
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={loading || localPhone.length < 10}
            onClick={() => sendOtp("whatsapp")}
          >
            {loading && channel === "whatsapp"
              ? "Sending…"
              : "Send OTP via WhatsApp"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={loading || localPhone.length < 10}
            onClick={() => sendOtp("sms")}
          >
            {loading && channel === "sms" ? "Sending…" : "Send via SMS"}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={loading || localPhone.length < 10}
          onClick={() => sendOtp("sms")}
        >
          {loading ? "Sending…" : "Send OTP"}
        </Button>
      )}
    </div>
  );
}
