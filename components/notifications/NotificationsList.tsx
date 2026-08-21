"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/actions";
import type { NotificationView } from "@/lib/repositories/notifications.repository";
import { Button } from "@/components/ui/Button";

type NotificationsListProps = {
  notifications: NotificationView[];
};

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function NotificationsList({ notifications }: NotificationsListProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [markAllPending, startMarkAll] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (notifications.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-base font-medium text-foreground">
          You have no notifications yet.
        </p>
        <p className="mt-2 text-sm text-muted">
          Updates about listings and enquiries will appear here.
        </p>
        <Button href="/dashboard" variant="secondary" size="sm" className="mt-6">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const hasUnread = notifications.some((n) => !n.isRead);

  async function onOpen(notification: NotificationView) {
    if (pendingId) return;
    setError(null);
    setPendingId(notification.id);
    try {
      if (!notification.isRead) {
        const result = await markNotificationRead(notification.id);
        if (!result.ok) {
          setError(result.message);
          return;
        }
      }
      if (notification.href) {
        router.push(notification.href);
      } else {
        router.refresh();
      }
    } finally {
      setPendingId(null);
    }
  }

  function onMarkAll() {
    setError(null);
    startMarkAll(async () => {
      const result = await markAllNotificationsRead();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {hasUnread && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={markAllPending}
            onClick={onMarkAll}
          >
            {markAllPending ? "Updating…" : "Mark all as read"}
          </Button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        {notifications.map((notification) => {
          const busy = pendingId === notification.id;
          return (
            <li key={notification.id}>
              <button
                type="button"
                disabled={busy}
                onClick={() => onOpen(notification)}
                className={`flex w-full flex-col gap-1 px-4 py-4 text-left transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-5 ${
                  notification.isRead ? "bg-white" : "bg-primary/5"
                } ${busy ? "opacity-70" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!notification.isRead && (
                        <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                      )}
                      <p
                        className={`text-sm sm:text-base ${
                          notification.isRead
                            ? "font-medium text-foreground"
                            : "font-semibold text-foreground"
                        }`}
                      >
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          Unread
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">{notification.message}</p>
                  </div>
                  <time
                    dateTime={notification.createdAt}
                    className="shrink-0 text-xs text-muted"
                  >
                    {formatWhen(notification.createdAt)}
                  </time>
                </div>
                {notification.href && (
                  <span className="mt-1 text-xs font-medium text-primary">
                    View details →
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="text-center text-sm text-muted">
        Prefer the dashboard?{" "}
        <Link
          href="/dashboard"
          className="font-medium text-primary hover:text-primary-hover"
        >
          Go to Dashboard
        </Link>
      </p>
    </div>
  );
}
