import { LISTING_PLACEHOLDER_IMAGE } from "@/lib/constants/images";

/**
 * Pure helpers for listing lifecycle UX / tests.
 * No database access.
 */

export type CloseActionKind = "sold" | "leased" | "withdrawn";

export function primaryCloseActionForListingType(
  listingType: "business" | "commercial_space",
): Extract<CloseActionKind, "sold" | "leased"> {
  return listingType === "commercial_space" ? "leased" : "sold";
}

export function confirmCopyForCloseAction(kind: CloseActionKind): {
  title: string;
  message: string;
  confirmLabel: string;
} {
  if (kind === "sold") {
    return {
      title: "Mark this listing as sold?",
      message:
        "This will remove the listing from public search and mark it as no longer available.",
      confirmLabel: "Confirm Sold",
    };
  }
  if (kind === "leased") {
    return {
      title: "Mark this listing as leased?",
      message:
        "This will remove the listing from public search and mark it as no longer available.",
      confirmLabel: "Confirm Leased",
    };
  }
  return {
    title: "Withdraw this listing?",
    message:
      "This will remove the listing from public search. You can republish it later for review.",
    confirmLabel: "Confirm Withdraw",
  };
}

export function closedListingHeadline(
  status: "sold" | "leased" | "withdrawn",
): string {
  if (status === "sold") return "SOLD";
  if (status === "leased") return "LEASED";
  return "NO LONGER AVAILABLE";
}

export function closedListingBrowseHref(
  listingType: "business" | "commercial_space",
): string {
  return listingType === "commercial_space"
    ? "/listings?type=commercial_space"
    : "/listings";
}

export function sanitizeClosedListingImage(url: string | null | undefined): string {
  const trimmed = url?.trim();
  if (!trimmed) return LISTING_PLACEHOLDER_IMAGE;
  return trimmed;
}

/** Statuses that must never appear in public available search. */
export const NON_PUBLIC_AVAILABLE_STATUSES = [
  "draft",
  "pending",
  "rejected",
  "sold",
  "leased",
  "withdrawn",
] as const;

export const PUBLIC_AVAILABLE_STATUS = "published" as const;
