"use client";

import Link from "next/link";
import { AUTH_SMS_UNAVAILABLE } from "@/lib/auth/errors";

type SmsUnavailableNoticeProps = {
  message?: string;
  /** When provided, shows a button to switch to email auth. */
  onContinueWithEmail?: () => void;
  /** Fallback link when no callback is available (e.g. forgot-password page). */
  emailHref?: string;
};

/**
 * Non-blocking notice for SMS/phone provider configuration gaps.
 * Does not fake OTP delivery or success.
 */
export function SmsUnavailableNotice({
  message = AUTH_SMS_UNAVAILABLE,
  onContinueWithEmail,
  emailHref,
}: SmsUnavailableNoticeProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <p>{message}</p>
      {(onContinueWithEmail || emailHref) && (
        <p className="mt-2">
          {onContinueWithEmail ? (
            <button
              type="button"
              onClick={onContinueWithEmail}
              className="font-semibold text-primary underline-offset-2 hover:underline"
            >
              Continue with Email
            </button>
          ) : (
            <Link
              href={emailHref!}
              className="font-semibold text-primary underline-offset-2 hover:underline"
            >
              Continue with Email
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
