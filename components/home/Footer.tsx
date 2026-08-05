import { Globe, Share2 } from "lucide-react";
import Link from "next/link";

const footerSections = {
  "Listing Tools": [
    { label: "Browse All Listings", href: "/listings" },
    { label: "New Listings", href: "/listings?sort=latest" },
    { label: "Premium Opportunities", href: "/listings?premium=true" },
    { label: "Franchises for Sale", href: "/listings?category=franchises" },
  ],
  Resources: [
    { label: "How to Buy a Business", href: "/resources/how-to-buy" },
    { label: "How to Sell a Business", href: "/resources/how-to-sell" },
    { label: "Business Articles", href: "/resources" },
    { label: "Businesses Wanted", href: "/wanted" },
  ],
  Directories: [
    { label: "Business Brokers", href: "/brokers" },
    { label: "Accountants Directory", href: "/accountants" },
    { label: "All Listings", href: "/listings" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
  ],
};

const socialLinks = [
  { label: "LinkedIn", href: "#", icon: Share2 },
  { label: "Facebook", href: "#", icon: Globe },
];

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
              The modern marketplace connecting business buyers, sellers, and
              brokers across India. Quality listings. Serious enquiries.
              Straightforward next steps.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:gap-12">
            {Object.entries(footerSections).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {links.map((link) => (
                    <li key={link.href}>
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
