"use client";

import { ArrowRight, Phone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type EnquiryFormProps = {
  businessTitle: string;
  compact?: boolean;
  onSuccess?: () => void;
};

export function EnquiryForm({
  businessTitle,
  compact = false,
  onSuccess,
}: EnquiryFormProps) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    onSuccess?.();
  }

  if (submitted) {
    return (
      <div
        className="rounded-xl bg-accent-light p-5 text-center"
        role="status"
      >
        <p className="font-semibold text-accent">Enquiry sent successfully</p>
        <p className="mt-1 text-sm text-muted">
          The seller will respond within 24 hours.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      {!compact && (
        <p className="text-sm text-muted">
          Interested in <span className="font-medium text-foreground">{businessTitle}</span>?
          Send a confidential enquiry below.
        </p>
      )}

      <div className={compact ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>
        <label className="block">
          <span className="sr-only">Full name</span>
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            placeholder="Full name"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="sr-only">Email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="Email address"
            className={inputClass}
          />
        </label>
      </div>

      <label className="block">
        <span className="sr-only">Phone</span>
        <input
          type="tel"
          name="phone"
          autoComplete="tel"
          placeholder="Phone number (optional)"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="sr-only">Message</span>
        <textarea
          name="message"
          required
          rows={compact ? 3 : 4}
          placeholder="Tell the seller about your interest and timeline..."
          className={`${inputClass} resize-none`}
        />
      </label>

      <Button type="submit" size="lg" className="w-full">
        Send Enquiry
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>

      <p className="text-center text-xs text-muted">
        By submitting, you agree to our confidentiality terms.
      </p>
    </form>
  );
}

type StickyEnquiryCardProps = {
  businessTitle: string;
  price?: string;
};

export function StickyEnquiryCard({
  businessTitle,
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
        <EnquiryForm businessTitle={businessTitle} compact />
      </div>

      <div className="border-t border-border pt-5">
        <Button href="#contact-seller" variant="secondary" size="lg" className="w-full">
          <Phone className="h-4 w-4" aria-hidden />
          Contact Seller
        </Button>
      </div>
    </aside>
  );
}
