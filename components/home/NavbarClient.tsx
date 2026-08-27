"use client";

import { ChevronDown, Heart, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { signOutAction } from "@/lib/auth/actions";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/Button";

const navLinks = [
  { label: "Businesses for Sale", href: "/listings?type=business" },
  { label: "Commercial Spaces", href: "/listings?type=commercial_space" },
  { label: "How It Works", href: "/about" },
  { label: "Resources", href: "/sell" },
];

type NavbarClientProps = {
  isAuthenticated: boolean;
  /** True only when server has resolved profiles.role === "admin". */
  showAdminDashboard?: boolean;
  postListingHref: string;
  unreadNotificationCount?: number;
};

export function NavbarClient({
  isAuthenticated,
  showAdminDashboard = false,
  postListingHref,
  unreadNotificationCount = 0,
}: NavbarClientProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const businessListHref = isAuthenticated
    ? "/dashboard/listings/new/business"
    : "/sign-in?next=/dashboard/listings/new/business";
  const commercialListHref = isAuthenticated
    ? "/dashboard/listings/new/commercial"
    : "/sign-in?next=/dashboard/listings/new/commercial";
  const favouritesHref = isAuthenticated
    ? "/dashboard/favorites"
    : "/sign-in?next=/dashboard/favorites";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white">
      <nav
        className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy hover:bg-surface lg:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cta text-sm font-bold text-white shadow-sm">
              B
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-bold tracking-tight text-navy sm:text-xl">
                BIZORA
              </span>
              <span className="hidden text-[11px] font-medium text-primary sm:block">
                Buy a Business. Find a Space.
              </span>
            </span>
          </Link>
        </div>

        <ul className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href + link.label}>
              <Link
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-navy/80 transition-colors hover:bg-surface hover:text-navy"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href={favouritesHref}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-navy/80 hover:bg-surface hover:text-navy"
          >
            <Heart className="h-4 w-4" aria-hidden />
            Favourites
          </Link>

          {isAuthenticated ? (
            <div className="relative">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setAccountMenuOpen((open) => !open);
                  setListMenuOpen(false);
                }}
                className="inline-flex items-center gap-1"
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
              >
                Account
                <ChevronDown className="h-4 w-4" aria-hidden />
              </Button>
              {accountMenuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default bg-transparent"
                    aria-label="Close account menu"
                    onClick={() => setAccountMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 min-w-[180px] rounded-xl border border-border bg-white py-1 shadow-lg">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2.5 text-sm font-medium text-navy hover:bg-surface"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {showAdminDashboard ? (
                      <Link
                        href="/admin"
                        className="block px-4 py-2.5 text-sm font-medium text-navy hover:bg-surface"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    ) : null}
                    <form action={signOutAction}>
                      <button
                        type="submit"
                        className="block w-full px-4 py-2.5 text-left text-sm font-medium text-navy hover:bg-surface"
                      >
                        Sign Out
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Button href="/sign-in" variant="secondary" size="sm">
              Login / Register
            </Button>
          )}

          <div className="relative">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setListMenuOpen((open) => !open);
                setAccountMenuOpen(false);
              }}
              className="inline-flex items-center gap-1 bg-primary hover:bg-primary-hover"
              aria-expanded={listMenuOpen}
              aria-haspopup="menu"
            >
              List Your Business
              <ChevronDown className="h-4 w-4" aria-hidden />
            </Button>
            {listMenuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default bg-transparent"
                  aria-label="Close menu"
                  onClick={() => setListMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-2 min-w-[230px] rounded-xl border border-border bg-white py-1 shadow-lg">
                  <Link
                    href={businessListHref}
                    className="block px-4 py-2.5 text-sm font-medium text-navy hover:bg-surface"
                    onClick={() => setListMenuOpen(false)}
                  >
                    Sell a Business
                  </Link>
                  <Link
                    href={commercialListHref}
                    className="block px-4 py-2.5 text-sm font-medium text-navy hover:bg-surface"
                    onClick={() => setListMenuOpen(false)}
                  >
                    List a Commercial Space
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          {isAuthenticated && (
            <NotificationBell unreadCount={unreadNotificationCount} />
          )}
          <Link
            href={isAuthenticated ? "/dashboard" : "/sign-in"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface text-sm font-semibold text-navy"
            aria-label={isAuthenticated ? "Dashboard" : "Login / Register"}
            >
            {isAuthenticated ? "D" : "L"}
          </Link>
        </div>
      </nav>

      <div
        className={`fixed inset-0 top-[68px] z-40 flex flex-col bg-white transition-transform duration-300 lg:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href + link.label}>
                <Link
                  href={link.href}
                  className="block rounded-lg px-3 py-3 text-lg font-medium text-navy"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={favouritesHref}
                className="block rounded-lg px-3 py-3 text-lg font-medium text-navy"
                onClick={() => setMenuOpen(false)}
              >
                Favourites
              </Link>
            </li>
          </ul>

          <div className="mt-auto flex flex-col gap-3 border-t border-border pt-6">
            <Button href={postListingHref} size="lg" className="w-full bg-primary">
              List with Bizora
            </Button>
            {isAuthenticated ? (
              <>
                <Button href="/dashboard" variant="secondary" size="lg" className="w-full">
                  Dashboard
                </Button>
                {showAdminDashboard ? (
                  <Button href="/admin" variant="secondary" size="lg" className="w-full">
                    Admin Dashboard
                  </Button>
                ) : null}
                <form action={signOutAction} className="w-full">
                  <Button type="submit" variant="ghost" size="lg" className="w-full">
                    Sign Out
                  </Button>
                </form>
              </>
            ) : (
              <Button href="/sign-in" variant="secondary" size="lg" className="w-full">
                Login / Register
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
