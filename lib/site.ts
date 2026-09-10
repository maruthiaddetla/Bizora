/**
 * Absolute site origin for sitemap, robots, auth redirects, and Open Graph.
 *
 * Priority:
 * 1. Local Next.js development → http://localhost:3000
 *    (ignores a production NEXT_PUBLIC_SITE_URL so auth emails stay local)
 * 2. NEXT_PUBLIC_SITE_URL (required for production / Vercel)
 * 3. VERCEL_URL (preview deployments)
 * 4. Canonical production host when running in a production environment
 * 5. localhost — final non-production fallback
 *
 * Production must never fall back to http://localhost:3000.
 */
export const BIZORA_PRODUCTION_SITE_URL = "https://bizoraindia.com";
export const BIZORA_LOCAL_SITE_URL = "http://localhost:3000";

function isProductionRuntime(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  );
}

function isLocalDevelopmentRuntime(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.VERCEL_ENV !== "production" &&
    process.env.VERCEL_ENV !== "preview"
  );
}

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/$/, "");
}

export function getSiteUrl(): string {
  // nextdev on a developer machine: keep auth redirects on localhost even when
  // .env.local also contains the production site URL for other checks.
  if (isLocalDevelopmentRuntime()) {
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (configured && /localhost|127\.0\.0\.1/i.test(configured)) {
      return normalizeOrigin(configured);
    }
    return BIZORA_LOCAL_SITE_URL;
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return normalizeOrigin(configured);
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = normalizeOrigin(vercel);
    return host.startsWith("http") ? host : `https://${host}`;
  }

  if (isProductionRuntime()) {
    return BIZORA_PRODUCTION_SITE_URL;
  }

  return BIZORA_LOCAL_SITE_URL;
}

/**
 * Absolute URL for Supabase email confirmation / magic-link redirects.
 * Must be listed under Authentication → URL Configuration → Redirect URLs.
 */
export function getAuthEmailRedirectTo(nextPath = "/"): string {
  const next = nextPath.startsWith("/") ? nextPath : "/";
  const base = getSiteUrl();
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`;
}

/** Destination after Supabase password-recovery email link. */
export const PASSWORD_RESET_PATH = "/auth/reset-password";

/**
 * Dedicated recovery callback path (does not depend on `next` surviving
 * Supabase's redirect). Must be allowlisted in Supabase Redirect URLs.
 */
export const PASSWORD_RESET_CALLBACK_PATH = "/auth/callback/reset-password";

export function getPasswordResetRedirectTo(): string {
  const base = getSiteUrl();
  return `${base}${PASSWORD_RESET_CALLBACK_PATH}`;
}

/** Public Bizora business contact email (user-facing). */
export const BIZORA_CONTACT_EMAIL = "enquire@bizoraindia.com";

export const BIZORA_CONTACT_MAILTO = `mailto:${BIZORA_CONTACT_EMAIL}`;
