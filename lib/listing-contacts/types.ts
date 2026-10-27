import type { ListingContactType } from "@/lib/supabase/database.types";

export type { ListingContactType };

export const LISTING_CONTACT_TYPE_OPTIONS: {
  value: ListingContactType;
  label: string;
}[] = [
  { value: "owner", label: "Owner" },
  { value: "broker_agent", label: "Broker / agent" },
  {
    value: "authorised_representative",
    label: "Authorised representative",
  },
];

export type ListingContactFormInput = {
  contactName?: string | null;
  contactMobile?: string | null;
  contactEmail?: string | null;
  contactType?: string | null;
  sharingAuthorised?: boolean | string | null;
};

export type ListingContactFieldErrors = Partial<
  Record<
    | "contactName"
    | "contactMobile"
    | "contactEmail"
    | "contactType"
    | "sharingAuthorised"
    | "form",
    string
  >
>;

export type ParsedListingContact = {
  contactName: string | null;
  mobileE164: string | null;
  email: string | null;
  contactType: ListingContactType | null;
  sharingAuthorised: boolean;
};

/** Safe view for owners editing their own listing (never sent to public pages). */
export type ListingContactOwnerView = {
  contactName: string;
  contactMobile: string;
  contactEmail: string;
  contactType: ListingContactType | "";
  sharingAuthorised: boolean;
  /** True when a DB row exists (even if some fields empty / legacy). */
  exists: boolean;
};

/** Admin-only view — never pass to client components that buyers can load. */
export type ListingContactAdminView = {
  businessId: string;
  contactName: string | null;
  mobileE164: string | null;
  email: string | null;
  contactType: ListingContactType | null;
  sharingAuthorised: boolean;
};
