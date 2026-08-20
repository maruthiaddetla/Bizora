import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bizora — India's Business Marketplace",
    template: "%s — Bizora",
  },
  description:
    "Browse published businesses for sale across India. Enquire as a buyer, list as a seller, and manage listings with admin review.",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Bizora",
    title: "Bizora — India's Business Marketplace",
    description:
      "Browse published businesses for sale across India. Enquire as a buyer, list as a seller, and manage listings with admin review.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bizora — India's Business Marketplace",
    description:
      "Browse published businesses for sale across India. Enquire as a buyer, list as a seller, and manage listings with admin review.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
