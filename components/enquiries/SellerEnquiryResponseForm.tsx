"use client";

import { useActionState, useState } from "react";
import {
  closeEnquiryFormAction,
  respondToEnquiryFormAction,
  type EnquiryFormActionState,
} from "@/lib/enquiries/actions";
import type { EnquiryDetailView } from "@/lib/repositories/enquiries.types";
import { Button } from "@/components/ui/Button";

type SellerEnquiryResponseFormProps = {
  enquiry: EnquiryDetailView;
};

const initialState: EnquiryFormActionState = { ok: false };

const textareaClass =
  "min-h-28 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function SellerEnquiryResponseForm({
  enquiry,
}: SellerEnquiryResponseFormProps) {
  const [response, setResponse] = useState(enquiry.sellerResponse ?? "");
  const [respondState, respondAction, respondPending] = useActionState(
    respondToEnquiryFormAction,
    initialState,
  );
  const [closeState, closeAction, closePending] = useActionState(
    closeEnquiryFormAction,
    initialState,
  );

  const isClosed = enquiry.status === "closed";
  const canRespond = !isClosed;

  return (
    <div className="space-y-4">
      {(respondState.message || closeState.message) && (
        <div
          role="status"
          className={`rounded-xl border px-3 py-2 text-sm ${
            respondState.ok || closeState.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {respondState.message || closeState.message}
        </div>
      )}

      {canRespond ? (
        <form action={respondAction} className="space-y-3">
          <input type="hidden" name="enquiryId" value={enquiry.id} />
          <label htmlFor="sellerResponse" className="block text-sm font-medium text-foreground">
            Your response
          </label>
          <textarea
            id="sellerResponse"
            name="sellerResponse"
            className={textareaClass}
            value={response}
            onChange={(event) => setResponse(event.target.value)}
            minLength={10}
            maxLength={2000}
            required
            disabled={respondPending || closePending}
          />
          {respondState.fieldError && (
            <p className="text-sm text-red-700">{respondState.fieldError}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={respondPending || closePending}>
              {respondPending ? "Sending…" : "Send Response"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted">
          This enquiry is closed. No further responses can be sent.
        </p>
      )}

      {canRespond && (
        <form action={closeAction}>
          <input type="hidden" name="enquiryId" value={enquiry.id} />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={respondPending || closePending}
          >
            {closePending ? "Closing…" : "Close Enquiry"}
          </Button>
        </form>
      )}
    </div>
  );
}
