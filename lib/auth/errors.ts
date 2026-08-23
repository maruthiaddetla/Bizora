/**
 * Map Supabase Auth / validation errors to user-facing copy.
 * Never forward raw provider messages that may leak internals.
 */
export function mapAuthErrorMessage(error: {
  message?: string;
  code?: string;
  status?: number;
} | null): string {
  if (!error) {
    return "Authentication failed. Please try again.";
  }

  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials")
  ) {
    return "Invalid email or password.";
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
    return "An account with this email already exists. Try signing in instead.";
  }

  if (
    message.includes("invalid phone") ||
    message.includes("phone number is invalid") ||
    code === "phone_not_confirmed"
  ) {
    return "Please enter a valid mobile number.";
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

  if (message.includes("sms") && message.includes("not enabled")) {
    return "Mobile sign-in is temporarily unavailable. Please try email instead.";
  }

  return "Authentication failed. Please try again.";
}

export const AUTH_UNEXPECTED_ERROR =
  "Something went wrong while signing you in. Please try again.";

export const AUTH_INVALID_PHONE =
  "Please enter a valid 10-digit Indian mobile number.";

export const AUTH_INVALID_OTP =
  "Please enter the 6-digit verification code.";
