import type { BusinessStatus } from "@/lib/supabase/database.types";

export const LISTING_EDIT_REVIEW_SUBMITTED =
  "Your changes have been submitted for review. Your current published listing will remain visible until the changes are approved.";

export const OWNER_EDITABLE_STATUSES = [
  "draft",
  "rejected",
  "pending",
] as const satisfies readonly BusinessStatus[];

export type OwnerEditableStatus = (typeof OWNER_EDITABLE_STATUSES)[number];

export function isOwnerEditableStatus(
  status: string,
): status is OwnerEditableStatus {
  return (OWNER_EDITABLE_STATUSES as readonly string[]).includes(status);
}

/** Statuses that may open the seller edit form (published uses a revision). */
export function canSellerOpenEdit(status: string): boolean {
  return isOwnerEditableStatus(status) || status === "published";
}

export function isPublishedEditRevision(row: {
  supersedes_id?: string | null;
  status: string;
}): boolean {
  return Boolean(row.supersedes_id) && isOwnerEditableStatus(row.status);
}
