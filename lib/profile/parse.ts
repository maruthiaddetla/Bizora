import {
  MAX_PROFILE_BIO_LENGTH,
  MAX_PROFILE_CITY_LENGTH,
  MAX_PROFILE_NAME_LENGTH,
  MAX_PROFILE_WEBSITE_LENGTH,
} from "@/lib/profile/constants";
import type { SellerProfileUpdateInput } from "@/lib/repositories/profiles.repository";

export function sanitizeText(value: unknown, maxLen: number): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

export function sanitizeMultiline(value: unknown, maxLen: number): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

export function normalizeWebsite(value: unknown):
  | { ok: true; value: string | null }
  | { ok: false; message: string } {
  if (value == null || value === "") return { ok: true, value: null };
  if (typeof value !== "string") {
    return { ok: false, message: "Website must be a valid URL." };
  }
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  if (trimmed.length > MAX_PROFILE_WEBSITE_LENGTH) {
    return { ok: false, message: "Website URL is too long." };
  }

  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return { ok: false, message: "Enter a valid website URL." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, message: "Website must use http or https." };
  }

  return { ok: true, value: url.toString() };
}

/**
 * Parse Edit Profile form fields. Empty optional strings become null so clearing
 * a field is persisted as an intentional update (not skipped / restored).
 */
export function parseSellerProfileFields(input: {
  displayName?: unknown;
  companyName?: unknown;
  bio?: unknown;
  city?: unknown;
  website?: unknown;
}): { ok: true; data: SellerProfileUpdateInput } | { ok: false; message: string } {
  const displayName = sanitizeText(input.displayName, MAX_PROFILE_NAME_LENGTH);
  const companyName = sanitizeText(input.companyName, MAX_PROFILE_NAME_LENGTH);
  const bio = sanitizeMultiline(input.bio, MAX_PROFILE_BIO_LENGTH);
  const city = sanitizeText(input.city, MAX_PROFILE_CITY_LENGTH);
  const websiteResult = normalizeWebsite(input.website);
  if (!websiteResult.ok) return websiteResult;

  if (bio && bio.length > MAX_PROFILE_BIO_LENGTH) {
    return {
      ok: false,
      message: `Bio must be ${MAX_PROFILE_BIO_LENGTH} characters or fewer.`,
    };
  }

  return {
    ok: true,
    data: {
      displayName,
      companyName,
      bio,
      city,
      website: websiteResult.value,
    },
  };
}
