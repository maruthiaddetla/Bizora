"use client";

import { Heart, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { toggleFavorite } from "@/lib/favorites/actions";

type ListingActionsProps = {
  title: string;
  businessId: string;
  initialFavorited?: boolean;
  isAuthenticated: boolean;
  signInHref: string;
};

export function ListingActions({
  title,
  businessId,
  initialFavorited = false,
  isAuthenticated,
  signInHref,
}: ListingActionsProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [error, setError] = useState<string | null>(null);
  const [shareLabel, setShareLabel] = useState("Share");
  const [isPending, startTransition] = useTransition();

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareLabel("Link copied!");
      setTimeout(() => setShareLabel("Share"), 2000);
    } catch {
      /* user cancelled or clipboard denied */
    }
  }, [title]);

  const handleFavorite = useCallback(() => {
    if (!isAuthenticated) {
      router.push(signInHref);
      return;
    }

    if (isPending) return;

    setError(null);
    startTransition(async () => {
      const result = await toggleFavorite(businessId);
      if (!result.ok) {
        setError(result.message);
        if (typeof result.favorited === "boolean") {
          setFavorited(result.favorited);
        }
        return;
      }
      setFavorited(result.favorited);
    });
  }, [businessId, isAuthenticated, isPending, router, signInHref]);

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleFavorite}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
          aria-pressed={favorited}
          aria-label={favorited ? "Remove from saved businesses" : "Save business"}
        >
          <Heart
            className={`h-4 w-4 ${favorited ? "fill-red-500 text-red-500" : ""}`}
            aria-hidden
          />
          <span className="hidden sm:inline">
            {isPending ? "Saving…" : favorited ? "Saved" : "Save"}
          </span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Share listing"
        >
          <Share2 className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">{shareLabel}</span>
        </button>
      </div>
      {error && (
        <p className="max-w-xs text-right text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
