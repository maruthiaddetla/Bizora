/** Default country for Bizora phone auth (India). */
export const DEFAULT_PHONE_COUNTRY = {
  dialCode: "+91",
  iso: "IN",
  localLength: 10,
} as const;

const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

/**
 * Normalize a local Indian mobile number to E.164 (+91XXXXXXXXXX).
 * Returns null when the number is invalid.
 */
export function normalizeIndianPhone(localDigits: string): string | null {
  const cleaned = localDigits.replace(/\D/g, "");

  if (cleaned.length === 10 && INDIAN_MOBILE_PATTERN.test(cleaned)) {
    return `${DEFAULT_PHONE_COUNTRY.dialCode}${cleaned}`;
  }

  if (
    cleaned.length === 12 &&
    cleaned.startsWith("91") &&
    INDIAN_MOBILE_PATTERN.test(cleaned.slice(2))
  ) {
    return `+${cleaned}`;
  }

  return null;
}

/** Format E.164 for display: +91 XXXXX XXXXX */
export function formatPhoneDisplay(e164: string): string {
  if (e164.startsWith("+91") && e164.length === 13) {
    const local = e164.slice(3);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return e164;
}

/** Strip country code for profiles.phone storage (local 10-digit). */
export function toLocalIndianPhone(e164: string): string | null {
  if (e164.startsWith("+91") && e164.length === 13) {
    return e164.slice(3);
  }
  return null;
}

export function isValidOtpCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}

export const OTP_RESEND_COOLDOWN_SECONDS = 60;
