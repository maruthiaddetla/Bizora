"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EnquiryStatusBadge } from "@/components/enquiries/EnquiryStatusBadge";
import { Button } from "@/components/ui/Button";
import type { AdminEnquiryDetail } from "@/lib/admin/enquiries.repository";
import {
  recordEnquiryContactShared,
  saveAdminEnquiryNotes,
  updateAdminEnquiryStatus,
} from "@/lib/admin/enquiry-actions";
import type { EnquiryStatus } from "@/lib/supabase/database.types";

const STATUS_OPTIONS: { value: EnquiryStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "contact_shared", label: "Contact Shared" },
  { value: "read", label: "Read" },
  { value: "responded", label: "Responded" },
  { value: "closed", label: "Closed" },
];

type AdminEnquiryWorkspaceProps = {
  enquiry: AdminEnquiryDetail;
};

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function AdminEnquiryWorkspace({ enquiry }: AdminEnquiryWorkspaceProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(enquiry.adminNotes);
  const [status, setStatus] = useState<EnquiryStatus>(enquiry.status);
  const [shareNote, setShareNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canShare =
    enquiry.sellerContact.exists &&
    Boolean(enquiry.sellerContact.mobileDisplay) &&
    enquiry.sellerContact.sharingAuthorised;

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setMessage(result.message);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      {(message || error) && (
        <div
          role={error ? "alert" : "status"}
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {error ?? message}
        </div>
      )}

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {enquiry.businessTitle}
            </h1>
            <p className="mt-1 font-mono text-xs text-muted">
              Listing ID: {enquiry.businessId}
            </p>
            <p className="mt-1 font-mono text-xs text-muted">
              Enquiry ID: {enquiry.id}
            </p>
          </div>
          <EnquiryStatusBadge status={enquiry.status} />
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Buyer
            </dt>
            <dd className="mt-1 text-sm text-foreground">{enquiry.buyerName}</dd>
            {enquiry.buyerPhone && (
              <dd className="mt-0.5 text-sm text-muted">{enquiry.buyerPhone}</dd>
            )}
            {enquiry.buyerEmail && (
              <dd className="mt-0.5 text-sm text-muted">{enquiry.buyerEmail}</dd>
            )}
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Received
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              {formatWhen(enquiry.createdAt)}
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-foreground">
            Buyer message
          </h2>
          <p className="mt-2 whitespace-pre-wrap rounded-xl bg-surface px-4 py-3 text-sm text-foreground">
            {enquiry.message}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Private seller contact (this listing)
        </h2>
        {!enquiry.sellerContact.exists ? (
          <p className="mt-3 text-sm text-amber-950">
            No private seller contact is on file for this listing. Ask the listing
            owner to add contact details before sharing with a buyer.
          </p>
        ) : (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-muted">
                Contact name
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {enquiry.sellerContact.contactName || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-muted">
                Mobile
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {enquiry.sellerContact.mobileDisplay || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-muted">
                Email
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {enquiry.sellerContact.email || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-muted">
                Contact type
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {enquiry.sellerContact.contactTypeLabel || "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase text-muted">
                Sharing authorised
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {enquiry.sellerContact.sharingAuthorised ? "Yes" : "No"}
              </dd>
            </div>
          </dl>
        )}

        {!enquiry.sellerContact.sharingAuthorised &&
          enquiry.sellerContact.exists && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm text-amber-950"
            >
              Sharing permission is not recorded. You cannot mark contact as
              shared until the listing contact authorisation is confirmed.
            </p>
          )}

        <div className="mt-5 space-y-3">
          <label className="block text-sm font-medium text-foreground">
            Optional note for the share record
            <textarea
              className="mt-1.5 min-h-20 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              value={shareNote}
              onChange={(event) => setShareNote(event.target.value)}
              placeholder="e.g. Shared over WhatsApp after buyer verification"
              disabled={pending || !canShare}
            />
          </label>
          <Button
            type="button"
            size="md"
            disabled={pending || !canShare}
            onClick={() =>
              run(() => recordEnquiryContactShared(enquiry.id, shareNote))
            }
          >
            Record contact shared with buyer
          </Button>
          <p className="text-xs text-muted">
            This does not message the buyer automatically. Use it after you have
            manually shared the seller contact with a qualified buyer.
          </p>
        </div>

        {enquiry.contactShares.length > 0 && (
          <div className="mt-6 border-t border-amber-200 pt-4">
            <h3 className="text-sm font-semibold text-foreground">
              Share history
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              {enquiry.contactShares.map((share) => (
                <li key={share.id} className="rounded-lg bg-white px-3 py-2">
                  <span className="font-medium">{share.sharedByName}</span>
                  {" · "}
                  {formatWhen(share.sharedAt)}
                  {share.note ? ` — ${share.note}` : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Admin workflow</h2>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="block flex-1 text-sm font-medium text-foreground">
            Status
            <select
              className="mt-1.5 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as EnquiryStatus)
              }
              disabled={pending}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={pending}
            onClick={() =>
              run(() => updateAdminEnquiryStatus(enquiry.id, status))
            }
          >
            Update status
          </Button>
        </div>

        <label className="mt-6 block text-sm font-medium text-foreground">
          Private follow-up notes
          <textarea
            className="mt-1.5 min-h-32 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={pending}
            placeholder="Visible only to admins"
          />
        </label>
        <div className="mt-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={pending}
            onClick={() => run(() => saveAdminEnquiryNotes(enquiry.id, notes))}
          >
            Save notes
          </Button>
        </div>
      </section>
    </div>
  );
}
