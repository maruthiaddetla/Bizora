/**
 * Absolute site origin for sitemap, robots, auth redirects, and Open Graph.
 *
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL (required for production)
 * 2. VERCEL_URL (preview / Vercel deployments)
 * 3. Canonical production host when running in a production environment
 * 4. localhost — local development only
 *
 * Production must never fall back to http://localhost:3000.
 */
export const BIZORA_PRODUCTION_SITE_URL = "https://bizoraindia.com";

function isProductionRuntime(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  );
}

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/$/, "");
}

export function getSiteUrl(): string {
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

  return "http://localhost:3000";
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

/** Public Bizora business contact email (user-facing). */
export const BIZORA_CONTACT_EMAIL = "enquire@bizoraindia.com";

export const BIZORA_CONTACT_MAILTO = `mailto:${BIZORA_CONTACT_EMAIL}`;
