import Link from "next/link";
import { Bell } from "lucide-react";

type NotificationBellProps = {
  unreadCount: number;
  variant?: "light" | "dark";
};

/**
 * Compact navbar control linking to /dashboard/notifications.
 */
export function NotificationBell({
  unreadCount,
  variant = "light",
}: NotificationBellProps) {
  const countLabel =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  const base =
    variant === "dark"
      ? "text-slate-300 hover:text-white focus-visible:ring-white/50"
      : "text-muted hover:bg-surface hover:text-foreground focus-visible:ring-primary";

  return (
    <Link
      href="/dashboard/notifications"
      className={`relative inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 ${base}`}
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : "Notifications"
      }
    >
      <Bell className="h-4 w-4 shrink-0" aria-hidden />
      {countLabel && (
        <span
          className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-md px-1 text-xs font-semibold tabular-nums ${
            variant === "dark"
              ? "bg-accent/20 text-accent"
              : "bg-primary/10 text-primary"
          }`}
        >
          {countLabel}
        </span>
      )}
    </Link>
  );
}
