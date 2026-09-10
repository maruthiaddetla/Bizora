import type { AuthErrorLike } from "@/lib/auth/errors";
import {
  AUTH_PASSWORD_RESET_FAILED,
  AUTH_PASSWORD_RESET_SENT,
} from "@/lib/auth/errors";
import { OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/auth/phone";
import { getPasswordResetRedirectTo } from "@/lib/site";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Reuse the standard OTP resend cooldown (60s) for password-reset email resend. */
export const PASSWORD_RESET_RESEND_COOLDOWN_SECONDS =
  OTP_RESEND_COOLDOWN_SECONDS;

export function normalizeResetEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateResetEmail(email: string): string | null {
  const trimmed = normalizeResetEmail(email);
  if (!trimmed) {
    return "Please enter your email address.";
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return "Please enter a valid email address.";
  }
  return null;
}

/**
 * Errors that may reveal account existence or are recoverable — still show the
 * generic privacy-preserving message. Rate limits / config get a distinct message.
 */
export function mapPasswordResetRequestError(
  error: AuthErrorLike,
): { revealGenericSuccess: boolean; message: string } {
  if (!error) {
    return { revealGenericSuccess: true, message: AUTH_PASSWORD_RESET_SENT };
  }

  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  if (
    code === "over_request_rate_limit" ||
    message.includes("rate limit") ||
    message.includes("too many")
  ) {
    return {
      revealGenericSuccess: false,
      message: "Too many attempts. Please wait a moment and try again.",
    };
  }

  // Supabase may return "user not found" depending on project settings —
  // never surface that; always use the generic success copy.
  return { revealGenericSuccess: true, message: AUTH_PASSWORD_RESET_SENT };
}

export function passwordResetRequestFailureMessage(): string {
  return AUTH_PASSWORD_RESET_FAILED;
}

export function getPasswordResetResendButtonState(params: {
  resendSeconds: number;
  loading: boolean;
}): { disabled: boolean; label: string } {
  const { resendSeconds, loading } = params;
  if (loading) {
    return { disabled: true, label: "Sending…" };
  }
  if (resendSeconds > 0) {
    return {
      disabled: true,
      label: `Resend reset link (${resendSeconds}s)`,
    };
  }
  return { disabled: false, label: "Resend reset link" };
}

export { getPasswordResetRedirectTo, AUTH_PASSWORD_RESET_SENT };
