"use client";

import { OtpInput } from "@/components/auth/OtpInput";
import { formatPhoneDisplay } from "@/lib/auth/phone";
import { Button } from "@/components/ui/Button";

type OtpVerifyStepProps = {
  e164Phone: string;
  otp: string;
  onOtpChange: (value: string) => void;
  onVerify: () => void;
  onResend: () => void;
  onChangeNumber: () => void;
  resendSeconds: number;
  loading?: boolean;
  error?: string | null;
  verifyLabel?: string;
};

export function OtpVerifyStep({
  e164Phone,
  otp,
  onOtpChange,
  onVerify,
  onResend,
  onChangeNumber,
  resendSeconds,
  loading = false,
  error = null,
  verifyLabel = "Verify",
}: OtpVerifyStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Verify your mobile number
        </h2>
        <p className="mt-1 text-sm text-muted">
          We&apos;ve sent a 6-digit verification code to{" "}
          <span className="font-medium text-foreground">
            {formatPhoneDisplay(e164Phone)}
          </span>
          .
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

      <OtpInput value={otp} onChange={onOtpChange} disabled={loading} />

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={loading || otp.length < 6}
        onClick={onVerify}
      >
        {loading ? "Verifying…" : verifyLabel}
      </Button>

      <div className="flex flex-col items-center gap-2 text-sm">
        {resendSeconds > 0 ? (
          <p className="text-muted">
            Resend OTP in{" "}
            <span className="font-medium text-foreground">{resendSeconds}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={loading}
            className="font-semibold text-primary hover:text-primary-hover disabled:opacity-50"
          >
            Resend OTP
          </button>
        )}
        <button
          type="button"
          onClick={onChangeNumber}
          className="text-muted hover:text-foreground"
        >
          Change mobile number
        </button>
      </div>
    </div>
  );
}
