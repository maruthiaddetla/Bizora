import { normalizeIndianPhone } from "@/lib/auth/phone";

/**
 * Normalize a listing contact phone to E.164.
 * Accepts Indian local/E.164 via existing helper, or other international E.164.
 * Returns null when invalid / empty.
 */
export function normalizeListingContactPhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const indian = normalizeIndianPhone(trimmed);
  if (indian) return indian;

  // Strip spaces/dashes/parentheses but keep leading +
  const compact = trimmed.replace(/[^\d+]/g, "");
  if (compact.startsWith("+")) {
    const digits = compact.slice(1).replace(/\D/g, "");
    // E.164: country code + subscriber, 8–15 digits total, no leading 0
    if (
      digits.length >= 8 &&
      digits.length <= 15 &&
      /^[1-9]\d+$/.test(digits)
    ) {
      return `+${digits}`;
    }
  }

  return null;
}

/** Display helper — does not log or expose beyond caller. */
export function formatListingContactPhone(e164: string | null): string {
  if (!e164) return "";
  if (e164.startsWith("+91") && e164.length === 13) {
    const local = e164.slice(3);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return e164;
}
