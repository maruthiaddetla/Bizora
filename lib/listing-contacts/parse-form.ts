import type { ListingContactFormInput } from "@/lib/listing-contacts/types";

export function formDataToListingContactInput(
  formData: FormData,
): ListingContactFormInput {
  const sharing = formData.get("sharingAuthorised");
  return {
    contactName: String(formData.get("contactName") ?? ""),
    contactMobile: String(formData.get("contactMobile") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    contactType: String(formData.get("contactType") ?? ""),
    sharingAuthorised: typeof sharing === "string" ? sharing : null,
  };
}
