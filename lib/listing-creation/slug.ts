/**
 * URL-safe unique slug helpers for business listings.
 */

export function slugifyTitle(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return base.length > 0 ? base.slice(0, 80) : "business";
}

/**
 * Build a unique slug. `exists` should return true when the candidate is taken
 * (optionally excluding the current listing id on updates).
 */
export async function generateUniqueSlug(
  title: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const base = slugifyTitle(title);
  let candidate = base;
  let suffix = 2;

  while (await exists(candidate)) {
    const suffixText = `-${suffix}`;
    const trimmedBase = base.slice(0, Math.max(1, 80 - suffixText.length));
    candidate = `${trimmedBase}${suffixText}`;
    suffix += 1;
    if (suffix > 1000) {
      candidate = `${base}-${Date.now().toString(36)}`;
      break;
    }
  }

  return candidate;
}
