"use client";

import { Heart, Share2 } from "lucide-react";
import { useCallback, useState } from "react";

type ListingActionsProps = {
  title: string;
};

export function ListingActions({ title }: ListingActionsProps) {
  const [shareLabel, setShareLabel] = useState("Share");

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

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled
        title="Favourites are coming soon"
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-muted shadow-sm opacity-70 cursor-not-allowed"
        aria-disabled="true"
        aria-label="Save listing — favourites coming soon"
      >
        <Heart className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Save (coming soon)</span>
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
  );
}
