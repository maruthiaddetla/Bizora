import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to get in touch about Bizora listings and accounts.",
  openGraph: {
    title: "Contact — Bizora",
    description: "How to get in touch about Bizora listings and accounts.",
  },
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Contact
          </h1>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
            <p>
              Bizora does not currently offer a general support inbox or live
              chat. Use the product flows below for the most common needs.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-foreground">Buyers:</span> open
                a published listing and use the enquiry form after signing in.
              </li>
              <li>
                <span className="font-medium text-foreground">Sellers:</span>{" "}
                manage listings and enquiry replies from your{" "}
                <Link href="/dashboard" className="font-medium text-primary hover:text-primary-hover">
                  dashboard
                </Link>
                .
              </li>
              <li>
                <span className="font-medium text-foreground">Accounts:</span>{" "}
                sign in or create an account via{" "}
                <Link href="/sign-in" className="font-medium text-primary hover:text-primary-hover">
                  Sign in
                </Link>{" "}
                /{" "}
                <Link href="/sign-up" className="font-medium text-primary hover:text-primary-hover">
                  Sign up
                </Link>
                .
              </li>
            </ul>
            <p>
              For privacy and terms information, see{" "}
              <Link href="/privacy" className="font-medium text-primary hover:text-primary-hover">
                Privacy
              </Link>{" "}
              and{" "}
              <Link href="/terms" className="font-medium text-primary hover:text-primary-hover">
                Terms
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
