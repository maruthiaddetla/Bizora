"use client";

import { LISTING_CONTACT_TYPE_OPTIONS } from "@/lib/listing-contacts/types";
import type { ListingContactOwnerView } from "@/lib/listing-contacts/types";

const inputClass =
  "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

type FieldErrors = Partial<
  Record<
    | "contactName"
    | "contactMobile"
    | "contactEmail"
    | "contactType"
    | "sharingAuthorised",
    string
  >
>;

type PrivateSellerContactFieldsProps = {
  defaults?: Partial<ListingContactOwnerView>;
  fieldErrors?: FieldErrors;
  values: {
    contactName: string;
    contactMobile: string;
    contactEmail: string;
    contactType: string;
    sharingAuthorised: boolean;
  };
  onChange: (patch: Partial<PrivateSellerContactFieldsProps["values"]>) => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-700">{message}</p>;
}

export function PrivateSellerContactFields({
  fieldErrors = {},
  values,
  onChange,
}: PrivateSellerContactFieldsProps) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">
        Private Seller Contact Details
      </h2>
      <p className="mt-1 text-sm text-muted">
        These details are for Bizora admins only. They are never shown on the
        public listing page. Use the contact person for <em>this</em> listing —
        do not assume it matches your account profile.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="contactName"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Contact person full name{" "}
            <span className="text-red-600" aria-hidden>
              *
            </span>
          </label>
          <input
            id="contactName"
            name="contactName"
            type="text"
            autoComplete="name"
            className={inputClass}
            value={values.contactName}
            onChange={(event) => onChange({ contactName: event.target.value })}
            placeholder="Name of the person buyers should eventually speak with"
            aria-invalid={Boolean(fieldErrors.contactName)}
            required
          />
          <FieldError message={fieldErrors.contactName} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="contactMobile"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Mobile number{" "}
              <span className="text-red-600" aria-hidden>
                *
              </span>
            </label>
            <input
              id="contactMobile"
              name="contactMobile"
              type="tel"
              autoComplete="tel"
              className={inputClass}
              value={values.contactMobile}
              onChange={(event) =>
                onChange({ contactMobile: event.target.value })
              }
              placeholder="+91 98XXX XXXXX"
              aria-invalid={Boolean(fieldErrors.contactMobile)}
              required
            />
            <p className="mt-1 text-xs text-muted">
              Include country code for international numbers.
            </p>
            <FieldError message={fieldErrors.contactMobile} />
          </div>

          <div>
            <label
              htmlFor="contactEmail"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Email <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              autoComplete="email"
              className={inputClass}
              value={values.contactEmail}
              onChange={(event) =>
                onChange({ contactEmail: event.target.value })
              }
              placeholder="Optional"
              aria-invalid={Boolean(fieldErrors.contactEmail)}
            />
            <FieldError message={fieldErrors.contactEmail} />
          </div>
        </div>

        <div>
          <label
            htmlFor="contactType"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Contact type{" "}
            <span className="text-red-600" aria-hidden>
              *
            </span>
          </label>
          <select
            id="contactType"
            name="contactType"
            className={inputClass}
            value={values.contactType}
            onChange={(event) => onChange({ contactType: event.target.value })}
            aria-invalid={Boolean(fieldErrors.contactType)}
            required
          >
            <option value="">Select…</option>
            {LISTING_CONTACT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.contactType} />
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground">
          <input
            type="checkbox"
            name="sharingAuthorised"
            value="true"
            checked={values.sharingAuthorised}
            onChange={(event) =>
              onChange({ sharingAuthorised: event.target.checked })
            }
            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span>
            I confirm this contact is authorised to be shared with suitable
            prospective buyers after Bizora qualifies the enquiry.
            {!values.sharingAuthorised && (
              <span className="mt-1 block text-amber-800">
                Without this confirmation, admins cannot share the number with
                buyers.
              </span>
            )}
          </span>
        </label>
        <FieldError message={fieldErrors.sharingAuthorised} />
      </div>
    </section>
  );
}
