import { formDataToListingContactInput } from "@/lib/listing-contacts/parse-form";
import { upsertListingContact } from "@/lib/listing-contacts/repository";
import type { ListingContactFieldErrors } from "@/lib/listing-contacts/types";
import {
  hasContactFieldErrors,
  parseListingContactInput,
  validateContactDraftFields,
  validateContactSubmitFields,
} from "@/lib/listing-contacts/validation";

/**
 * Parse, validate, and upsert private contact for a listing.
 * Call only after the business row is saved for the same listingId.
 */
export async function persistListingContactFromForm(
  listingId: string,
  formData: FormData,
  mode: "draft" | "submit",
): Promise<
  | { ok: true }
  | { ok: false; message: string; fieldErrors: ListingContactFieldErrors }
> {
  const input = formDataToListingContactInput(formData);
  const { fields, errors: parseErrors } = parseListingContactInput(input);
  const fieldErrors =
    mode === "submit"
      ? validateContactSubmitFields(fields, parseErrors)
      : validateContactDraftFields(fields, parseErrors);

  if (hasContactFieldErrors(fieldErrors)) {
    return {
      ok: false,
      message: "Please fix the private seller contact details.",
      fieldErrors,
    };
  }

  // Draft with completely empty contact: skip writing a blank row
  if (
    mode === "draft" &&
    !fields.contactName &&
    !fields.mobileE164 &&
    !fields.email &&
    !fields.contactType &&
    !fields.sharingAuthorised
  ) {
    return { ok: true };
  }

  const saved = await upsertListingContact(listingId, fields);
  if (!saved.ok) {
    return {
      ok: false,
      message: saved.message,
      fieldErrors: { form: saved.message },
    };
  }

  return { ok: true };
}
