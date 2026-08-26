/** 2Factor.in SMS OTP — server-only. Never import from client components. */

/** Approved 2Factor SMS template name for phone signup OTP. */
export const TWOFACTOR_SIGNUP_TEMPLATE = "OTP1";

const TWOFACTOR_BASE_URL = "https://2factor.in/API/V1";

export type TwoFactorResponse = {
  Status?: string;
  Details?: string;
};

export type TwoFactorSendResult =
  | { ok: true; sessionId: string }
  | { ok: false; reason: "provider_error" | "network_error" | "misconfigured" };

export type TwoFactorVerifyResult =
  | { ok: true }
  | {
      ok: false;
      reason: "invalid_otp" | "expired_otp" | "provider_error" | "network_error" | "misconfigured";
    };

function getTwoFactorApiKey(): string | null {
  const key = process.env.TWOFACTOR_API_KEY?.trim();
  return key || null;
}

/**
 * Template name for AUTOGEN. Prefer server-only TWOFACTOR_SMS_TEMPLATE when set;
 * otherwise use the approved default OTP1.
 */
export function getTwoFactorSignupTemplate(): string {
  const fromEnv = process.env.TWOFACTOR_SMS_TEMPLATE?.trim();
  return fromEnv || TWOFACTOR_SIGNUP_TEMPLATE;
}

function parseTwoFactorResponse(body: unknown): TwoFactorResponse | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  return {
    Status: typeof record.Status === "string" ? record.Status : undefined,
    Details: typeof record.Details === "string" ? record.Details : undefined,
  };
}

function isSuccessStatus(status: string | undefined): boolean {
  return status?.toLowerCase() === "success";
}

function classifyVerifyFailure(details: string | undefined): TwoFactorVerifyResult {
  const normalized = (details ?? "").toLowerCase();
  if (normalized.includes("expired")) {
    return { ok: false, reason: "expired_otp" };
  }
  if (
    normalized.includes("mismatch") ||
    normalized.includes("invalid") ||
    normalized.includes("incorrect")
  ) {
    return { ok: false, reason: "invalid_otp" };
  }
  return { ok: false, reason: "provider_error" };
}

/**
 * Send OTP via 2Factor AUTOGEN with approved template. Returns session ID; never returns OTP.
 */
export async function sendTwoFactorOtp(
  e164Phone: string,
  templateName: string = getTwoFactorSignupTemplate(),
): Promise<TwoFactorSendResult> {
  const apiKey = getTwoFactorApiKey();
  if (!apiKey) {
    return { ok: false, reason: "misconfigured" };
  }

  const phoneSegment = encodeURIComponent(e164Phone);
  const templateSegment = encodeURIComponent(templateName);
  const url = `${TWOFACTOR_BASE_URL}/${apiKey}/SMS/${phoneSegment}/AUTOGEN/${templateSegment}`;

  try {
    const response = await fetch(url, { method: "GET", cache: "no-store" });
    const body = parseTwoFactorResponse(await response.json().catch(() => null));

    if (!body || !isSuccessStatus(body.Status) || !body.Details?.trim()) {
      return { ok: false, reason: "provider_error" };
    }

    return { ok: true, sessionId: body.Details.trim() };
  } catch {
    return { ok: false, reason: "network_error" };
  }
}

/**
 * Verify OTP via 2Factor VERIFY. Requires explicit Success + OTP Matched.
 */
export async function verifyTwoFactorOtp(
  sessionId: string,
  otp: string,
): Promise<TwoFactorVerifyResult> {
  const apiKey = getTwoFactorApiKey();
  if (!apiKey) {
    return { ok: false, reason: "misconfigured" };
  }

  const sessionSegment = encodeURIComponent(sessionId);
  const otpSegment = encodeURIComponent(otp.trim());
  const url = `${TWOFACTOR_BASE_URL}/${apiKey}/SMS/VERIFY/${sessionSegment}/${otpSegment}`;

  try {
    const response = await fetch(url, { method: "GET", cache: "no-store" });
    const body = parseTwoFactorResponse(await response.json().catch(() => null));

    if (!body) {
      return { ok: false, reason: "provider_error" };
    }

    if (isSuccessStatus(body.Status) && body.Details?.toLowerCase().includes("otp matched")) {
      return { ok: true };
    }

    return classifyVerifyFailure(body.Details);
  } catch {
    return { ok: false, reason: "network_error" };
  }
}
