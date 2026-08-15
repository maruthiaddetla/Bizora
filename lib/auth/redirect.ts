/**
 * Safe internal redirect paths for auth `next` query params.
 * Rejects protocol-relative and external URLs.
 */
export function getSafeNextPath(
  next: string | string[] | null | undefined,
  fallback = "/",
): string {
  const raw = Array.isArray(next) ? next[0] : next;
  if (!raw || typeof raw !== "string") return fallback;

  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://")) return fallback;
  if (trimmed.includes("\\")) return fallback;

  return trimmed;
}
