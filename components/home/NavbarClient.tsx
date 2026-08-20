"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";

const navLinks = [
  { label: "Buy a Business", href: "/listings" },
  { label: "Sell a Business", href: "/sell" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

type NavbarClientProps = {
  isAuthenticated: boolean;
  postListingHref: string;
};

export function NavbarClient({
  isAuthenticated,
  postListingHref,
}: NavbarClientProps) {
  const [menuOpen, setMenuOpen] = useState(false);

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
          <Link
            href="/about"
            className="rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Contact
          </Link>
          <span className="text-white/20">|</span>
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-sm font-medium transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                Dashboard
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-sm font-medium transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="rounded-sm font-medium transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-sm font-medium text-accent transition-colors hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
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
          <Link
            href="/"
            className="flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
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
                  href={
                    link.href === "/sell" && !isAuthenticated
                      ? "/sign-in?next=/sell"
                      : link.href
                  }
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-2 lg:flex">
            {isAuthenticated && (
              <Button href="/dashboard" variant="secondary" size="sm">
                Dashboard
              </Button>
            )}
            <Button href={postListingHref} size="sm">
              Post a Listing
            </Button>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </div>

      <div
        id="mobile-menu"
        className={`fixed inset-0 top-16 z-40 flex flex-col bg-white transition-transform duration-300 ease-in-out lg:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={
                    link.href === "/sell" && !isAuthenticated
                      ? "/sign-in?next=/sell"
                      : link.href
                  }
                  className="block rounded-lg px-3 py-3 text-lg font-medium text-foreground transition-colors hover:bg-surface"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-col gap-3 border-t border-border pt-6">
            {isAuthenticated ? (
              <>
                <Button
                  href="/dashboard"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Button>
                <Button
                  href={postListingHref}
                  size="lg"
                  className="w-full"
                  onClick={() => setMenuOpen(false)}
                >
                  Post a Listing
                </Button>
                <form action={signOutAction} className="w-full">
                  <Button
                    type="submit"
                    variant="ghost"
                    size="lg"
                    className="w-full"
                  >
                    Sign Out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button
                  href="/sign-in"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </Button>
                <Button
                  href="/sign-up"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => setMenuOpen(false)}
                >
                  Register Free
                </Button>
                <Button
                  href={postListingHref}
                  size="lg"
                  className="w-full"
                  onClick={() => setMenuOpen(false)}
                >
                  Post a Listing
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 top-16 z-30 bg-slate-900/20 lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  );
}
