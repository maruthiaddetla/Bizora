"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { signOutAction } from "@/lib/auth/actions";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/Button";

const navLinks = [
  { label: "Businesses for Sale", href: "/listings?type=business" },
  { label: "Commercial Spaces", href: "/listings?type=commercial_space" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

type NavbarClientProps = {
  isAuthenticated: boolean;
  postListingHref: string;
  unreadNotificationCount?: number;
};

export function NavbarClient({
  isAuthenticated,
  postListingHref,
  unreadNotificationCount = 0,
}: NavbarClientProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [listMenuOpen, setListMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50">
      <div className="hidden border-b border-white/10 bg-hero-from text-sm text-slate-300 sm:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-end gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/about" className="rounded-sm transition-colors hover:text-white">
            About
          </Link>
          <Link href="/contact" className="rounded-sm transition-colors hover:text-white">
            Contact
          </Link>
          <span className="text-white/20">|</span>
          {isAuthenticated ? (
            <>
              <NotificationBell unreadCount={unreadNotificationCount} variant="dark" />
              <Link href="/dashboard" className="font-medium hover:text-white">
                Dashboard
              </Link>
              <form action={signOutAction}>
                <button type="submit" className="font-medium hover:text-white">
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="font-medium hover:text-white">
                Sign In
              </Link>
              <Link href="/sign-up" className="font-medium text-accent hover:text-emerald-300">
                Register Free
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="border-b border-border/80 bg-white/95 backdrop-blur-md">
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
          aria-label="Main navigation"
        >
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
              B
            </span>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Bizora
            </span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-2 lg:flex">
            {isAuthenticated && (
              <>
                <NotificationBell unreadCount={unreadNotificationCount} />
                <Button href="/dashboard/favorites" variant="ghost" size="sm">
                  Favourites
                </Button>
                <Button href="/dashboard" variant="secondary" size="sm">
                  Dashboard
                </Button>
              </>
            )}
            <div className="relative">
              <Button
                type="button"
                size="sm"
                onClick={() => setListMenuOpen((open) => !open)}
                className="inline-flex items-center gap-1"
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
                  <div className="absolute right-0 top-full z-50 mt-2 min-w-[220px] rounded-xl border border-border bg-white py-1 shadow-lg">
                    <Link
                      href={
                        isAuthenticated
                          ? "/dashboard/listings/new/business"
                          : "/sign-in?next=/dashboard/listings/new/business"
                      }
                      className="block px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
                      onClick={() => setListMenuOpen(false)}
                    >
                      Sell a Business
                    </Link>
                    <Link
                      href={
                        isAuthenticated
                          ? "/dashboard/listings/new/commercial"
                          : "/sign-in?next=/dashboard/listings/new/commercial"
                      }
                      className="block px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
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
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </div>

      <div
        className={`fixed inset-0 top-16 z-40 flex flex-col bg-white transition-transform duration-300 lg:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg px-3 py-3 text-lg font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {isAuthenticated && (
              <li>
                <Link
                  href="/dashboard/favorites"
                  className="block rounded-lg px-3 py-3 text-lg font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  Favourites
                </Link>
              </li>
            )}
          </ul>

          <div className="mt-auto flex flex-col gap-3 border-t border-border pt-6">
            <Button href={postListingHref} size="lg" className="w-full">
              Create a listing
            </Button>
            {isAuthenticated ? (
              <form action={signOutAction} className="w-full">
                <Button type="submit" variant="ghost" size="lg" className="w-full">
                  Sign Out
                </Button>
              </form>
            ) : (
              <>
                <Button href="/sign-in" variant="secondary" size="lg" className="w-full">
                  Sign In
                </Button>
                <Button href="/sign-up" variant="secondary" size="lg" className="w-full">
                  Register Free
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
