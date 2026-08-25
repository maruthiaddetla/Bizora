/**
 * Map Supabase Auth / validation errors to user-facing copy.
 * Never forward raw provider messages that may leak internals.
 */

export type AuthErrorContext = "email" | "phone";

export type AuthErrorLike = {
  message?: string;
  code?: string;
  status?: number;
} | null;

/** User-facing copy when SMS / phone provider is not configured. */
export const AUTH_SMS_UNAVAILABLE =
  "Mobile verification is temporarily unavailable because SMS is not configured yet. Please continue with email, or try again later.";

export const AUTH_PHONE_PROVIDER_UNAVAILABLE =
  "Mobile sign-in is temporarily unavailable. Please continue with email, or try again later.";

export const AUTH_UNEXPECTED_ERROR =
  "Something went wrong while signing you in. Please try again.";

export const AUTH_INVALID_PHONE =
  "Please enter a valid 10-digit Indian mobile number.";

export const AUTH_INVALID_OTP =
  "Please enter the 6-digit verification code.";

export const AUTH_INVALID_PASSWORD =
  "Password must be at least 8 characters.";

export const AUTH_PASSWORD_MISMATCH = "Passwords do not match.";

export const AUTH_OTP_SEND_FAILED =
  "We couldn't send a verification code right now. Please try again in a moment.";

export const AUTH_OTP_EXPIRED =
  "That verification code has expired. Please request a new code.";

export const AUTH_OTP_INVALID =
  "That verification code is incorrect. Please try again.";

export const AUTH_OTP_RATE_LIMITED =
  "Too many attempts. Please wait a moment and try again.";

export const AUTH_PHONE_ALREADY_REGISTERED =
  "This mobile number is already registered. Please sign in instead.";

export const AUTH_SIGNUP_CREATION_FAILED =
  "We couldn't finish creating your account. Please try again.";

/**
 * Detect Supabase / provider errors that mean SMS cannot be sent.
 * Used to keep the UI on the current step and offer an email fallback.
 */
export function isSmsProviderError(error: AuthErrorLike): boolean {
  if (!error) return false;

  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  return (
    code === "sms_send_failed" ||
    code === "phone_provider_disabled" ||
    code === "otp_disabled" ||
    (code === "unexpected_failure" && message.includes("sms")) ||
    message.includes("sms provider") ||
    message.includes("sms is not configured") ||
    message.includes("sms not configured") ||
    message.includes("sms provider not configured") ||
    message.includes("error sending confirmation sms") ||
    message.includes("error sending sms") ||
    message.includes("unable to send sms") ||
    message.includes("failed to send sms") ||
    message.includes("phone signups are disabled") ||
    message.includes("signups not allowed for otp") ||
    (message.includes("sms") && message.includes("not enabled")) ||
    (message.includes("phone provider") &&
      (message.includes("not enabled") ||
        message.includes("disabled") ||
        message.includes("not configured"))) ||
    (message.includes("twilio") &&
      (message.includes("not configured") ||
        message.includes("missing") ||
        message.includes("invalid"))) ||
    (message.includes("messagebird") && message.includes("not configured")) ||
    (message.includes("vonage") && message.includes("not configured"))
  );
}

export function isPhoneProviderDisabledError(error: AuthErrorLike): boolean {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();
  return (
    isSmsProviderError(error) ||
    code === "phone_provider_disabled" ||
    message.includes("phone logins are disabled") ||
    message.includes("phone signups are disabled") ||
    (message.includes("phone") &&
      (message.includes("not enabled") ||
        message.includes("provider is disabled") ||
        message.includes("signups are disabled") ||
        message.includes("signup is disabled") ||
        message.includes("logins are disabled")))
  );
}

export function mapAuthErrorMessage(
  error: AuthErrorLike,
  context: AuthErrorContext = "phone",
): string {
  if (!error) {
    return "Authentication failed. Please try again.";
  }

  if (isSmsProviderError(error)) {
    return AUTH_SMS_UNAVAILABLE;
  }

  if (isPhoneProviderDisabledError(error) && context === "phone") {
    return AUTH_PHONE_PROVIDER_UNAVAILABLE;
  }

  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials")
  ) {
    return context === "email"
      ? "Invalid email or password."
      : "Invalid mobile number or password.";
  }

  if (
    code === "email_not_confirmed" ||
    message.includes("email not confirmed")
  ) {
    return "Please confirm your email address before signing in.";
  }

  if (
    code === "user_already_exists" ||
    message.includes("already registered") ||
    message.includes("user already registered")
  ) {
    return context === "email"
      ? "An account with this email already exists. Try signing in instead."
      : "Unable to create an account with this number. Try signing in instead.";
  }

  if (
    message.includes("invalid phone") ||
    message.includes("phone number is invalid")
  ) {
    return "Please enter a valid mobile number.";
  }

  if (code === "phone_not_confirmed") {
    return "Please verify your mobile number before signing in. Use Forgot password if you need to confirm it again.";
  }

  if (
    message.includes("otp") &&
    (message.includes("expired") || message.includes("invalid"))
  ) {
    return "That verification code is incorrect or has expired. Please try again.";
  }

  if (
    message.includes("token") &&
    (message.includes("expired") || message.includes("invalid"))
  ) {
    return "That verification code is incorrect or has expired. Please try again.";
  }

  if (message.includes("password") && message.includes("weak")) {
    return "Please choose a stronger password.";
  }

  if (
    message.includes("rate limit") ||
    message.includes("too many") ||
    message.includes("over sms send rate limit") ||
    code === "over_request_rate_limit"
  ) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (
    message.includes("phone") &&
    (message.includes("already") || message.includes("registered"))
  ) {
    return "Unable to create an account with this number. Try signing in instead.";
  }

  return "Authentication failed. Please try again.";
}

export function mapTwoFactorSendError(
  reason: "provider_error" | "network_error" | "misconfigured",
): string {
  if (reason === "misconfigured") {
    return AUTH_OTP_SEND_FAILED;
  }
  if (reason === "network_error") {
    return AUTH_UNEXPECTED_ERROR;
  }
  return AUTH_OTP_SEND_FAILED;
}

export function mapTwoFactorVerifyError(
  reason:
    | "invalid_otp"
    | "expired_otp"
    | "provider_error"
    | "network_error"
    | "misconfigured",
): string {
  if (reason === "expired_otp") {
    return AUTH_OTP_EXPIRED;
  }
  if (reason === "invalid_otp") {
    return AUTH_OTP_INVALID;
  }
  if (reason === "network_error" || reason === "misconfigured") {
    return AUTH_UNEXPECTED_ERROR;
  }
  return AUTH_OTP_INVALID;
}
