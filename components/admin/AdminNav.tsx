import Link from "next/link";
import { signOutAction } from "@/lib/auth/actions";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/listings", label: "Listings" },
];

type AdminNavProps = {
  adminName?: string | null;
};

export function AdminNav({ adminName }: AdminNavProps) {
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            href="/admin"
            className="text-lg font-bold tracking-tight text-foreground"
          >
            Bizora Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-medium text-muted transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/"
              className="font-medium text-muted transition-colors hover:text-foreground"
            >
              Public site
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {adminName && (
            <span className="text-muted">
              Signed in as{" "}
              <span className="font-medium text-foreground">{adminName}</span>
            </span>
          )}
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-border bg-white px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-surface"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
