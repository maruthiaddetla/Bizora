"use server";

import {
  AUTH_INVALID_OTP,
  AUTH_INVALID_PASSWORD,
  AUTH_INVALID_PHONE,
  AUTH_OTP_EXPIRED,
  AUTH_OTP_RATE_LIMITED,
  AUTH_OTP_SEND_FAILED,
  AUTH_PHONE_ALREADY_REGISTERED,
  AUTH_SIGNUP_CREATION_FAILED,
  AUTH_UNEXPECTED_ERROR,
  mapTwoFactorSendError,
  mapTwoFactorVerifyError,
} from "@/lib/auth/errors";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import {
  clearPendingSignup,
  createPendingSignupRecord,
  isPendingSignupExpired,
  MAX_OTP_SEND_ATTEMPTS,
  MAX_OTP_VERIFY_ATTEMPTS,
  readPendingSignup,
  resendCooldownRemainingSeconds,
  writePendingSignup,
} from "@/lib/auth/pending-signup";
import {
  createConfirmedPhoneUser,
  isPhoneAlreadyRegistered,
} from "@/lib/auth/phone-registration";
import { isValidOtpCode, normalizeIndianPhone, OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/auth/phone";
import { sendTwoFactorOtp, verifyTwoFactorOtp } from "@/lib/auth/twofactor";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PhoneSignupActionResult =
  | { ok: true; resendCooldownSeconds?: number }
  | { ok: false; message: string; resendCooldownSeconds?: number };

function validatePassword(password: string): string | null {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return AUTH_INVALID_PASSWORD;
  }
  return null;
}

async function establishPhoneSession(
  e164Phone: string,
  password: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;

  const { error } = await supabase.auth.signInWithPassword({
    phone: e164Phone,
    password,
  });

  return !error;
}

/**
 * Start phone signup: validate phone/password, send 2Factor OTP, store pending state.
 */
export async function sendPhoneSignupOtpAction(
  localPhone: string,
  password: string,
): Promise<PhoneSignupActionResult> {
  const e164Phone = normalizeIndianPhone(localPhone);
  if (!e164Phone) {
    return { ok: false, message: AUTH_INVALID_PHONE };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { ok: false, message: passwordError };
  }

  if (!process.env.TWOFACTOR_API_KEY?.trim()) {
    return { ok: false, message: AUTH_OTP_SEND_FAILED };
  }

  if (
    !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
    !process.env.AUTH_PENDING_SIGNUP_SECRET?.trim()
  ) {
    return { ok: false, message: AUTH_UNEXPECTED_ERROR };
  }

  if (await isPhoneAlreadyRegistered(e164Phone)) {
    return { ok: false, message: AUTH_PHONE_ALREADY_REGISTERED };
  }

  const sendResult = await sendTwoFactorOtp(e164Phone);
  if (!sendResult.ok) {
    return { ok: false, message: mapTwoFactorSendError(sendResult.reason) };
  }

  const record = createPendingSignupRecord({
    phone: e164Phone,
    password,
    otpSessionId: sendResult.sessionId,
  });

  if (!record) {
    return { ok: false, message: AUTH_UNEXPECTED_ERROR };
  }

  const saved = await writePendingSignup(record);
  if (!saved) {
    return { ok: false, message: AUTH_UNEXPECTED_ERROR };
  }

  return { ok: true, resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS };
}

/**
 * Resend signup OTP for the pending server-side session.
 */
export async function resendPhoneSignupOtpAction(): Promise<PhoneSignupActionResult> {
  const pending = await readPendingSignup();
  if (!pending || pending.verified) {
    return { ok: false, message: AUTH_OTP_EXPIRED };
  }

  if (isPendingSignupExpired(pending)) {
    await clearPendingSignup();
    return { ok: false, message: AUTH_OTP_EXPIRED };
  }

  const cooldown = resendCooldownRemainingSeconds(pending);
  if (cooldown > 0) {
    return {
      ok: false,
      message: AUTH_OTP_RATE_LIMITED,
      resendCooldownSeconds: cooldown,
    };
  }

  if (pending.sendAttempts >= MAX_OTP_SEND_ATTEMPTS) {
    await clearPendingSignup();
    return { ok: false, message: AUTH_OTP_RATE_LIMITED };
  }

  if (await isPhoneAlreadyRegistered(pending.phone)) {
    await clearPendingSignup();
    return { ok: false, message: AUTH_PHONE_ALREADY_REGISTERED };
  }

  const sendResult = await sendTwoFactorOtp(pending.phone);
  if (!sendResult.ok) {
    return { ok: false, message: mapTwoFactorSendError(sendResult.reason) };
  }

  const nextRecord = createPendingSignupRecord({
    phone: pending.phone,
    password: pending.password,
    otpSessionId: sendResult.sessionId,
    previous: pending,
  });

  if (!nextRecord) {
    return { ok: false, message: AUTH_UNEXPECTED_ERROR };
  }

  const saved = await writePendingSignup(nextRecord);
  if (!saved) {
    return { ok: false, message: AUTH_UNEXPECTED_ERROR };
  }

  return { ok: true, resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS };
}

/**
 * Verify signup OTP via 2Factor, create confirmed Supabase user, establish session.
 */
export async function verifyPhoneSignupOtpAction(
  otp: string,
): Promise<PhoneSignupActionResult> {
  if (!isValidOtpCode(otp)) {
    return { ok: false, message: AUTH_INVALID_OTP };
  }

  const pending = await readPendingSignup();
  if (!pending || pending.verified) {
    return { ok: false, message: AUTH_OTP_EXPIRED };
  }

  if (isPendingSignupExpired(pending)) {
    await clearPendingSignup();
    return { ok: false, message: AUTH_OTP_EXPIRED };
  }

  if (pending.verifyAttempts >= MAX_OTP_VERIFY_ATTEMPTS) {
    await clearPendingSignup();
    return { ok: false, message: AUTH_OTP_RATE_LIMITED };
  }

  const verifyResult = await verifyTwoFactorOtp(pending.otpSessionId, otp);

  if (!verifyResult.ok) {
    const nextRecord = {
      ...pending,
      verifyAttempts: pending.verifyAttempts + 1,
    };
    await writePendingSignup(nextRecord);
    return { ok: false, message: mapTwoFactorVerifyError(verifyResult.reason) };
  }

  if (await isPhoneAlreadyRegistered(pending.phone)) {
    await clearPendingSignup();
    return { ok: false, message: AUTH_PHONE_ALREADY_REGISTERED };
  }

  const createResult = await createConfirmedPhoneUser(pending.phone, pending.password);
  if (!createResult.ok) {
    await clearPendingSignup();
    if (createResult.reason === "already_registered") {
      return { ok: false, message: AUTH_PHONE_ALREADY_REGISTERED };
    }
    return { ok: false, message: AUTH_SIGNUP_CREATION_FAILED };
  }

  const sessionOk = await establishPhoneSession(pending.phone, pending.password);
  await clearPendingSignup();

  if (!sessionOk) {
    return { ok: false, message: AUTH_SIGNUP_CREATION_FAILED };
  }

  return { ok: true };
}

/** Clear pending signup when user changes phone number. */
export async function clearPhoneSignupPendingAction(): Promise<void> {
  await clearPendingSignup();
}

/** Read resend cooldown from pending cookie (for page refresh). */
export async function getPhoneSignupResendCooldownAction(): Promise<number> {
  const pending = await readPendingSignup();
  if (!pending) return 0;
  return resendCooldownRemainingSeconds(pending);
}
