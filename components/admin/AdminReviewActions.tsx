"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approveListing,
  markListingLeased,
  markListingSold,
  rejectListing,
  reopenListingPending,
  reopenListingPublished,
  withdrawListing,
} from "@/lib/admin/actions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import {
  confirmCopyForCloseAction,
  type CloseActionKind,
} from "@/lib/listing-lifecycle/helpers";
import type { BusinessStatus } from "@/lib/supabase/database.types";

type AdminReviewActionsProps = {
  listingId: string;
  status: BusinessStatus;
};

type PendingConfirm =
  | { kind: CloseActionKind }
  | { kind: "reopen_published" }
  | { kind: "reopen_pending" };

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
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null,
  );

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
      setPendingConfirm(null);
      router.refresh();
    });
  }

  const confirmMeta = pendingConfirm
    ? pendingConfirm.kind === "reopen_published"
      ? {
          title: "Republish this listing?",
          message:
            "This will make the listing available in public search again.",
          confirmLabel: "Confirm Republish",
        }
      : pendingConfirm.kind === "reopen_pending"
        ? {
            title: "Send this listing back to review?",
            message:
              "This will move the listing to pending review and remove it from public availability if it was closed.",
            confirmLabel: "Confirm Pending",
          }
        : confirmCopyForCloseAction(pendingConfirm.kind)
    : null;

  const isClosed =
    status === "sold" || status === "leased" || status === "withdrawn";

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
          {fieldError && <p className="text-sm text-red-700">{fieldError}</p>}
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
              onClick={() => run(() => rejectListing(listingId, reason))}
            >
              {isPending ? "Rejecting…" : "Reject Listing"}
            </Button>
          </div>
        </div>
      )}

      {status === "published" && (
        <div className="mt-5 flex flex-col gap-3">
          <Button
            type="button"
            size="md"
            variant="secondary"
            disabled={isPending}
            onClick={() => setPendingConfirm({ kind: "sold" })}
          >
            Mark as Sold
          </Button>
          <Button
            type="button"
            size="md"
            variant="secondary"
            disabled={isPending}
            onClick={() => setPendingConfirm({ kind: "leased" })}
          >
            Mark as Leased
          </Button>
          <Button
            type="button"
            size="md"
            variant="ghost"
            disabled={isPending}
            onClick={() => setPendingConfirm({ kind: "withdrawn" })}
          >
            Withdraw
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

      {isClosed && (
        <div className="mt-5 flex flex-col gap-3">
          <p className="text-sm text-muted">
            This listing is closed ({status}). You can correct the status below.
          </p>
          <Button
            type="button"
            size="md"
            disabled={isPending}
            onClick={() => setPendingConfirm({ kind: "reopen_published" })}
          >
            Reopen as Published
          </Button>
          <Button
            type="button"
            size="md"
            variant="secondary"
            disabled={isPending}
            onClick={() => setPendingConfirm({ kind: "reopen_pending" })}
          >
            Move to Pending Review
          </Button>
          {status !== "sold" && (
            <Button
              type="button"
              size="md"
              variant="ghost"
              disabled={isPending}
              onClick={() => setPendingConfirm({ kind: "sold" })}
            >
              Mark as Sold
            </Button>
          )}
          {status !== "leased" && (
            <Button
              type="button"
              size="md"
              variant="ghost"
              disabled={isPending}
              onClick={() => setPendingConfirm({ kind: "leased" })}
            >
              Mark as Leased
            </Button>
          )}
          {status !== "withdrawn" && (
            <Button
              type="button"
              size="md"
              variant="ghost"
              disabled={isPending}
              onClick={() => setPendingConfirm({ kind: "withdrawn" })}
            >
              Mark as Withdrawn
            </Button>
          )}
        </div>
      )}

      {confirmMeta && pendingConfirm && (
        <ConfirmDialog
          open
          title={confirmMeta.title}
          message={confirmMeta.message}
          confirmLabel={confirmMeta.confirmLabel}
          loading={isPending}
          onCancel={() => {
            if (!isPending) setPendingConfirm(null);
          }}
          onConfirm={() => {
            const kind = pendingConfirm.kind;
            if (kind === "sold") run(() => markListingSold(listingId));
            else if (kind === "leased") run(() => markListingLeased(listingId));
            else if (kind === "withdrawn") run(() => withdrawListing(listingId));
            else if (kind === "reopen_published")
              run(() => reopenListingPublished(listingId));
            else run(() => reopenListingPending(listingId));
          }}
        />
      )}
    </div>
  );
}
