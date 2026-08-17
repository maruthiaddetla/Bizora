"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approveListing,
  markListingSold,
  rejectListing,
} from "@/lib/admin/actions";
import type { BusinessStatus } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/Button";

type AdminReviewActionsProps = {
  listingId: string;
  status: BusinessStatus;
};

export function AdminReviewActions({
  listingId,
  status,
}: AdminReviewActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  function run(
    action: () => Promise<{ ok: boolean; message: string; fieldError?: string }>,
  ) {
    setMessage(null);
    setError(null);
    setFieldError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.message);
        setFieldError(result.fieldError ?? null);
        return;
      }
      setMessage(result.message);
      setShowReject(false);
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">Review actions</h2>
      <p className="mt-1 text-sm text-muted">
        Current status:{" "}
        <span className="font-medium capitalize text-foreground">{status}</span>
      </p>

      {message && (
        <div
          role="status"
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
        >
          {message}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {status === "pending" && !showReject && (
        <div className="mt-5 flex flex-col gap-3">
          <Button
            type="button"
            size="md"
            disabled={isPending}
            onClick={() => run(() => approveListing(listingId))}
          >
            {isPending ? "Working…" : "Approve & Publish"}
          </Button>
          <Button
            type="button"
            size="md"
            variant="secondary"
            disabled={isPending}
            onClick={() => {
              setShowReject(true);
              setError(null);
              setMessage(null);
            }}
          >
            Reject
          </Button>
        </div>
      )}

      {status === "pending" && showReject && (
        <div className="mt-5 space-y-3">
          <label
            htmlFor="rejectionReason"
            className="block text-sm font-medium text-foreground"
          >
            Reason for rejection
          </label>
          <textarea
            id="rejectionReason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Explain what the seller should fix (min. 10 characters)."
            disabled={isPending}
          />
          {fieldError && (
            <p className="text-sm text-red-700">{fieldError}</p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setShowReject(false);
                setReason("");
                setFieldError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={() =>
                run(() => rejectListing(listingId, reason))
              }
            >
              {isPending ? "Rejecting…" : "Reject Listing"}
            </Button>
          </div>
        </div>
      )}

      {status === "published" && (
        <div className="mt-5">
          <Button
            type="button"
            size="md"
            variant="secondary"
            disabled={isPending}
            onClick={() => run(() => markListingSold(listingId))}
          >
            {isPending ? "Working…" : "Mark as Sold"}
          </Button>
        </div>
      )}

      {status === "rejected" && (
        <p className="mt-4 text-sm text-muted">
          This listing was rejected. The seller can edit and resubmit for review.
        </p>
      )}

      {status === "draft" && (
        <p className="mt-4 text-sm text-muted">
          This listing is still a draft and has not been submitted for review.
        </p>
      )}

      {status === "sold" && (
        <p className="mt-4 text-sm text-muted">This listing is marked as sold.</p>
      )}
    </div>
  );
}
