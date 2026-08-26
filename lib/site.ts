/**
 * Absolute site origin for sitemap, robots, and Open Graph.
 * Prefer NEXT_PUBLIC_SITE_URL; fall back to Vercel URL or localhost.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/\/$/, "");
    return host.startsWith("http") ? host : `https://${host}`;
  }

  return "http://localhost:3000";
}

/** Public Bizora business contact email (user-facing). */
export const BIZORA_CONTACT_EMAIL = "enquire@bizoraindia.com";

export const BIZORA_CONTACT_MAILTO = `mailto:${BIZORA_CONTACT_EMAIL}`;
