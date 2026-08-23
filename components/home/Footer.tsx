import Link from "next/link";

const footerSections = {
  "Listing Tools": [
    { label: "Businesses for Sale", href: "/listings?type=business" },
    { label: "Commercial Spaces", href: "/listings?type=commercial_space" },
    { label: "New Listings", href: "/listings?sort=newest" },
    { label: "List with Bizora", href: "/dashboard/listings/new" },
  ],
  Account: [
    { label: "Sign In", href: "/sign-in" },
    { label: "Register", href: "/sign-up" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "My Profile", href: "/dashboard/profile" },
    { label: "Notifications", href: "/dashboard/notifications" },
    { label: "My Enquiries", href: "/dashboard/enquiries" },
    { label: "Favourites", href: "/dashboard/favorites" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-hero-from text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
                B
              </span>
              <span className="text-xl font-bold text-white">Bizora</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Buy a business. Find the right space. An India-focused marketplace
              for businesses for sale and commercial premises in Hyderabad.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:gap-12">
            {Object.entries(footerSections).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {links.map((link) => (
                    <li key={`${title}-${link.href}`}>
                      <Link
                        href={link.href}
                        className="text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Bizora. All rights reserved.
          </p>
          <p className="text-xs text-slate-600">
            An India-focused business marketplace
          </p>
        </div>
      </div>
    </footer>
  );
}
