const CRORE = 10_000_000;
const LAKH = 100_000;

/**
 * Formats a numeric INR amount for display.
 * @example formatIndianCurrency(205000000) → "₹20.5 Cr"
 * @example formatIndianCurrency(8500000) → "₹85 Lakh"
 */
export function formatIndianCurrency(
  amount: number | null | undefined,
): string | undefined {
  if (amount == null || Number.isNaN(amount)) {
    return undefined;
  }

  const abs = Math.abs(amount);

  if (abs >= CRORE) {
    const crores = amount / CRORE;
    const formatted =
      crores % 1 === 0
        ? crores.toFixed(0)
        : crores.toFixed(1).replace(/\.0$/, "");
    return `₹${formatted} Cr`;
  }

  if (abs >= LAKH) {
    const lakhs = Math.round(amount / LAKH);
    return `₹${lakhs.toLocaleString("en-IN")} Lakh`;
  }

  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/**
 * Parses Supabase numeric columns that may arrive as strings.
 */
export function toNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}
