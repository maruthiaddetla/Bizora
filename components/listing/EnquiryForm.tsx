"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createEnquiryFormAction,
  type EnquiryFormActionState,
} from "@/lib/enquiries/actions";
import { Button } from "@/components/ui/Button";

export type ContactSellerMode =
  | "sign-in"
  | "unavailable"
  | "own-listing"
  | "form";

type EnquiryFormProps = {
  businessId: string;
  businessTitle: string;
  mode: ContactSellerMode;
  buyerName?: string | null;
  buyerEmail?: string | null;
  compact?: boolean;
};

const initialState: EnquiryFormActionState = { ok: false };

const inputClass =
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function InfoBox({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-4 text-sm">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-muted">{description}</p>
    </div>
  );
}

export function EnquiryForm({
  businessId,
  businessTitle,
  mode,
  buyerName,
  buyerEmail,
  compact = false,
}: EnquiryFormProps) {
  const [state, formAction, pending] = useActionState(
    createEnquiryFormAction,
    initialState,
  );
  const [message, setMessage] = useState("");

  if (mode === "sign-in") {
    return (
      <InfoBox
        title="Sign in to contact the seller"
        description="Create a free Bizora account or sign in to send a confidential enquiry about this business."
      />
    );
  }

  if (mode === "unavailable") {
    return (
      <InfoBox
        title="Seller contact is currently unavailable"
        description="This listing does not have a seller assigned yet. Please check back later or browse other businesses."
      />
    );
  }

  if (mode === "own-listing") {
    return (
      <InfoBox
        title="This is your listing"
        description="You cannot send an enquiry on a business you own. Manage it from your dashboard."
      />
    );
  }

  if (state.ok && state.message) {
    return (
      <div
        className="rounded-xl bg-accent-light p-5 text-center"
        role="status"
      >
        <p className="font-semibold text-accent">{state.message}</p>
        <p className="mt-1 text-sm text-muted">
          Track replies in{" "}
          <Link
            href="/dashboard/enquiries"
            className="font-medium text-primary hover:text-primary-hover"
          >
            My Enquiries
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3" noValidate>
      <input type="hidden" name="businessId" value={businessId} />

      {!compact && (
        <p className="text-sm text-muted">
          Interested in{" "}
          <span className="font-medium text-foreground">{businessTitle}</span>?
          Send a confidential enquiry below.
        </p>
      )}

      {(buyerName || buyerEmail) && (
        <div className="rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-muted">
          Sending as{" "}
          <span className="font-medium text-foreground">
            {buyerName?.trim() || buyerEmail?.trim() || "your account"}
          </span>
          {buyerName && buyerEmail ? ` (${buyerEmail})` : null}
        </div>
      )}

      {state.message && !state.ok && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {state.message}
        </div>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Message
        </span>
        <textarea
          name="message"
          required
          rows={compact ? 3 : 4}
          minLength={10}
          maxLength={2000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tell the seller about your interest and timeline..."
          className={`${inputClass} resize-none`}
          aria-invalid={Boolean(state.fieldError)}
        />
        {state.fieldError && (
          <p className="mt-1 text-sm text-red-700">{state.fieldError}</p>
        )}
      </label>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send Enquiry"}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>

      <p className="text-center text-xs text-muted">
        By submitting, you agree to our confidentiality terms.
      </p>
    </form>
  );
}

type StickyEnquiryCardProps = EnquiryFormProps & {
  signInHref: string;
  price?: string;
};

export function StickyEnquiryCard({
  businessId,
  businessTitle,
  mode,
  signInHref,
  buyerName,
  buyerEmail,
  price,
}: StickyEnquiryCardProps) {
  return (
    <aside
      className="rounded-2xl border border-border bg-white p-6 shadow-lg shadow-black/5 lg:sticky lg:top-24"
      aria-label="Contact seller"
    >
      {price && (
        <div className="border-b border-border pb-5">
          <p className="text-2xl font-bold text-accent">{price}</p>
          <p className="mt-1 text-sm text-muted">Asking price</p>
        </div>
      )}

      <div className={price ? "py-5" : "pb-5"}>
        {mode === "sign-in" ? (
          <div className="space-y-4">
            <EnquiryForm
              businessId={businessId}
              businessTitle={businessTitle}
              mode="sign-in"
              compact
            />
            <Button href={signInHref} size="lg" className="w-full">
              Sign In to Enquire
            </Button>
          </div>
        ) : (
          <EnquiryForm
            businessId={businessId}
            businessTitle={businessTitle}
            mode={mode}
            buyerName={buyerName}
            buyerEmail={buyerEmail}
            compact
          />
        )}
      </div>
    </aside>
  );
}
