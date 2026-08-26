"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { ListingStatusBadge } from "@/components/dashboard/ListingStatusBadge";
import { ListingTypeBadge } from "@/components/search/ListingsMarketplaceTabs";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import {
  markListingLeasedAction,
  markListingSoldAction,
  republishWithdrawnListingAction,
  withdrawListingAction,
} from "@/lib/listing-lifecycle/actions";
import {
  confirmCopyForCloseAction,
  primaryCloseActionForListingType,
  type CloseActionKind,
} from "@/lib/listing-lifecycle/helpers";
import type { SellerListingView } from "@/lib/repositories/businesses.types";

type MyListingsSectionProps = {
  listings: SellerListingView[];
};

type ListingFilter = "all" | "business" | "commercial_space";

type PendingAction = {
  listingId: string;
  kind: CloseActionKind | "republish";
};

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function MyListingsSection({ listings }: MyListingsSectionProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<ListingFilter>("all");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "all") return listings;
    return listings.filter((listing) => listing.listingType === filter);
  }, [filter, listings]);

  const confirmMeta = pendingAction
    ? pendingAction.kind === "republish"
      ? {
          title: "Republish this listing?",
          message:
            "This will submit the listing for review again. It will not appear publicly until approved.",
          confirmLabel: "Confirm Republish",
        }
      : confirmCopyForCloseAction(pendingAction.kind)
    : null;

  function runConfirmedAction() {
    if (!pendingAction) return;
    const { listingId, kind } = pendingAction;
    setActionError(null);
    startTransition(async () => {
      const result =
        kind === "sold"
          ? await markListingSoldAction(listingId)
          : kind === "leased"
            ? await markListingLeasedAction(listingId)
            : kind === "withdrawn"
              ? await withdrawListingAction(listingId)
              : await republishWithdrawnListingAction(listingId);

      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setPendingAction(null);
      router.refresh();
    });
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-14 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-foreground">
          No listings yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-muted">
          List a business for sale or a commercial space when you&apos;re ready.
        </p>
        <Button href="/dashboard/listings/new" size="md" className="mt-6">
          Create a listing
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["business", "Businesses"],
            ["commercial_space", "Commercial Spaces"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={[
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              filter === value
                ? "border-primary bg-primary text-white"
                : "border-border bg-white text-muted hover:text-foreground",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {actionError}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
          No listings in this filter.
        </div>
      ) : (
        filtered.map((listing) => {
          const isClosed =
            listing.status === "sold" ||
            listing.status === "leased" ||
            listing.status === "withdrawn";
          const canViewPublic =
            listing.status === "published" || isClosed;
          const canEdit =
            listing.status === "draft" || listing.status === "rejected";
          const showPreview =
            listing.status === "pending" ||
            listing.status === "draft" ||
            listing.status === "rejected" ||
            listing.status === "published" ||
            isClosed;
          const primaryClose =
            listing.status === "published"
              ? primaryCloseActionForListingType(listing.listingType)
              : null;

          return (
            <article
              key={listing.id}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-surface sm:h-28 sm:w-40">
                  <Image
                    src={listing.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 160px"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="mb-1">
                        <ListingTypeBadge listingType={listing.listingType} />
                      </div>
                      <h3 className="truncate text-lg font-semibold text-foreground">
                        {listing.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted">{listing.category}</p>
                      <p className="mt-0.5 text-sm text-muted">{listing.location}</p>
                    </div>
                    <ListingStatusBadge status={listing.status} audience="seller" />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <p className="text-base font-semibold text-accent">
                      {listing.price ?? "Price on request"}
                    </p>
                    <p className="text-sm text-muted">
                      Updated {formatUpdatedAt(listing.updatedAt)}
                    </p>
                  </div>

                  {listing.status === "pending" && (
                    <p className="mt-3 text-sm text-amber-800">
                      Your listing is under review.
                    </p>
                  )}

                  {listing.status === "rejected" && listing.rejectionReason && (
                    <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
                      <span className="font-semibold">Changes required: </span>
                      {listing.rejectionReason}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {canEdit && (
                      <Button
                        href={`/dashboard/listings/${listing.id}/edit`}
                        size="sm"
                      >
                        Edit
                      </Button>
                    )}
                    {showPreview && (
                      <Button
                        href={`/dashboard/listings/${listing.id}/preview`}
                        size="sm"
                        variant="secondary"
                      >
                        Preview
                      </Button>
                    )}
                    {canViewPublic && (
                      <Button
                        href={`/listings/${listing.id}`}
                        size="sm"
                        variant="ghost"
                      >
                        View public page
                      </Button>
                    )}
                    {primaryClose === "sold" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={isPending}
                        onClick={() =>
                          setPendingAction({
                            listingId: listing.id,
                            kind: "sold",
                          })
                        }
                      >
                        Mark as Sold
                      </Button>
                    )}
                    {primaryClose === "leased" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={isPending}
                        onClick={() =>
                          setPendingAction({
                            listingId: listing.id,
                            kind: "leased",
                          })
                        }
                      >
                        Mark as Leased
                      </Button>
                    )}
                    {listing.status === "published" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() =>
                          setPendingAction({
                            listingId: listing.id,
                            kind: "withdrawn",
                          })
                        }
                      >
                        Withdraw
                      </Button>
                    )}
                    {listing.status === "withdrawn" && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={isPending}
                        onClick={() =>
                          setPendingAction({
                            listingId: listing.id,
                            kind: "republish",
                          })
                        }
                      >
                        Republish
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })
      )}

      {confirmMeta && (
        <ConfirmDialog
          open={Boolean(pendingAction)}
          title={confirmMeta.title}
          message={confirmMeta.message}
          confirmLabel={confirmMeta.confirmLabel}
          loading={isPending}
          onCancel={() => {
            if (!isPending) setPendingAction(null);
          }}
          onConfirm={runConfirmedAction}
        />
      )}
    </div>
  );
}
