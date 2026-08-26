"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label="Close dialog"
        disabled={loading}
        onClick={() => {
          if (!loading) onCancel();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl"
      >
        <h2
          id={titleId}
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          {title}
        </h2>
        <p id={descId} className="mt-2 text-sm leading-relaxed text-muted">
          {message}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <Button type="button" size="sm" disabled={loading} onClick={onConfirm}>
            {loading ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
