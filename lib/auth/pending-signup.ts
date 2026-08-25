import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/auth/phone";

/** Server-only pending phone signup state (encrypted HTTP-only cookie). */

export const PENDING_SIGNUP_COOKIE = "bizora_pending_signup";
export const PENDING_SIGNUP_PURPOSE = "phone_signup" as const;
export const PENDING_SIGNUP_TTL_MS = 10 * 60 * 1000;
export const MAX_OTP_VERIFY_ATTEMPTS = 5;
export const MAX_OTP_SEND_ATTEMPTS = 5;

export type PendingSignupRecord = {
  v: 1;
  purpose: typeof PENDING_SIGNUP_PURPOSE;
  phone: string;
  password: string;
  otpSessionId: string;
  expiresAt: number;
  verifyAttempts: number;
  sendAttempts: number;
  lastSendAt: number;
  verified: boolean;
  nonce: string;
};

export type PendingSignupSaveInput = {
  phone: string;
  password: string;
  otpSessionId: string;
  previous?: PendingSignupRecord | null;
};

function getPendingSignupSecret(): string | null {
  return (
    process.env.AUTH_PENDING_SIGNUP_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    null
  );
}

function deriveKey(secret: string): Buffer {
  return createHmac("sha256", "bizora-pending-signup-v1").update(secret).digest();
}

function encodeRecord(record: PendingSignupRecord, secret: string): string {
  const key = deriveKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(record), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

function decodeRecord(value: string, secret: string): PendingSignupRecord | null {
  const [ivB64, tagB64, dataB64] = value.split(".");
  if (!ivB64 || !tagB64 || !dataB64) return null;

  try {
    const key = deriveKey(secret);
    const iv = Buffer.from(ivB64, "base64url");
    const tag = Buffer.from(tagB64, "base64url");
    const data = Buffer.from(dataB64, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(plaintext) as PendingSignupRecord;

    if (parsed.v !== 1 || parsed.purpose !== PENDING_SIGNUP_PURPOSE) return null;
    if (
      typeof parsed.phone !== "string" ||
      typeof parsed.password !== "string" ||
      typeof parsed.otpSessionId !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      typeof parsed.verifyAttempts !== "number" ||
      typeof parsed.sendAttempts !== "number" ||
      typeof parsed.lastSendAt !== "number" ||
      typeof parsed.verified !== "boolean" ||
      typeof parsed.nonce !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function isPendingSignupExpired(record: PendingSignupRecord, now = Date.now()): boolean {
  return record.expiresAt <= now;
}

export function canResendPendingSignup(
  record: PendingSignupRecord,
  now = Date.now(),
): boolean {
  if (isPendingSignupExpired(record, now)) return false;
  const elapsedMs = now - record.lastSendAt;
  return elapsedMs >= OTP_RESEND_COOLDOWN_SECONDS * 1000;
}

export function resendCooldownRemainingSeconds(
  record: PendingSignupRecord,
  now = Date.now(),
): number {
  const elapsedMs = now - record.lastSendAt;
  const remainingMs = OTP_RESEND_COOLDOWN_SECONDS * 1000 - elapsedMs;
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

export function createPendingSignupRecord(input: PendingSignupSaveInput): PendingSignupRecord | null {
  const secret = getPendingSignupSecret();
  if (!secret) return null;

  const now = Date.now();
  const previous = input.previous;

  if (previous) {
    if (previous.phone !== input.phone) return null;
    if (previous.verified) return null;
    if (isPendingSignupExpired(previous, now)) return null;
    if (previous.sendAttempts >= MAX_OTP_SEND_ATTEMPTS) return null;
  }

  return {
    v: 1,
    purpose: PENDING_SIGNUP_PURPOSE,
    phone: input.phone,
    password: input.password,
    otpSessionId: input.otpSessionId,
    expiresAt: now + PENDING_SIGNUP_TTL_MS,
    verifyAttempts: previous?.verifyAttempts ?? 0,
    sendAttempts: (previous?.sendAttempts ?? 0) + 1,
    lastSendAt: now,
    verified: false,
    nonce: previous?.nonce ?? randomBytes(16).toString("hex"),
  };
}

export async function readPendingSignup(): Promise<PendingSignupRecord | null> {
  const secret = getPendingSignupSecret();
  if (!secret) return null;

  const cookieStore = await cookies();
  const raw = cookieStore.get(PENDING_SIGNUP_COOKIE)?.value;
  if (!raw) return null;

  const record = decodeRecord(raw, secret);
  if (!record || isPendingSignupExpired(record)) {
    return null;
  }
  return record;
}

export async function writePendingSignup(record: PendingSignupRecord): Promise<boolean> {
  const secret = getPendingSignupSecret();
  if (!secret) return false;

  const cookieStore = await cookies();
  cookieStore.set(PENDING_SIGNUP_COOKIE, encodeRecord(record, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.ceil(PENDING_SIGNUP_TTL_MS / 1000),
  });
  return true;
}

export async function clearPendingSignup(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_SIGNUP_COOKIE);
}

/** Test-only helpers */
export function encodePendingSignupForTests(record: PendingSignupRecord, secret: string): string {
  return encodeRecord(record, secret);
}

export function decodePendingSignupForTests(value: string, secret: string): PendingSignupRecord | null {
  return decodeRecord(value, secret);
}
