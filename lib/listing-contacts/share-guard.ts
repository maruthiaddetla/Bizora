/**
 * Pure guard used before recording a contact-share event.
 * Keeps permission logic testable without Supabase.
 */
export function assertCanRecordContactShare(contact: {
  mobile_e164: string | null;
  sharing_authorised: boolean;
} | null): { ok: true } | { ok: false; message: string } {
  if (!contact?.mobile_e164) {
    return {
      ok: false,
      message:
        "This listing has no private seller mobile number on file. Add contact details on the listing before sharing.",
    };
  }

  if (!contact.sharing_authorised) {
    return {
      ok: false,
      message:
        "Seller sharing permission is not recorded for this listing. Update the listing contact authorisation before sharing.",
    };
  }

  return { ok: true };
}
