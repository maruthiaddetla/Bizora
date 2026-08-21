import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  CalendarDays,
  Globe,
  MapPin,
  UserRound,
} from "lucide-react";
import { ListingCard } from "@/components/home/ListingCard";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/Button";
import { fetchPublicSellerProfile } from "@/lib/repositories/profiles.repository";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatMemberSince(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { profile } = await fetchPublicSellerProfile(id);

  if (!profile) {
    return { title: "Seller not found" };
  }

  const titleBase = profile.companyName || profile.displayName;
  const description =
    profile.bio?.slice(0, 160) ||
    `${profile.displayName} on Bizora — ${profile.listingCount} published business listing${profile.listingCount === 1 ? "" : "s"}.`;

  return {
    title: titleBase,
    description,
    openGraph: {
      title: `${titleBase} | Bizora`,
      description,
    },
  };
}

function SellerProfileError() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Unable to load this seller
        </h1>
        <p className="mt-4 max-w-md text-muted">
          We couldn&apos;t load this seller profile right now. Please try again
          shortly.
        </p>
        <Button href="/listings" size="lg" className="mt-8">
          Browse Businesses
        </Button>
      </main>
      <Footer />
    </>
  );
}

export default async function PublicSellerPage({ params }: PageProps) {
  const { id } = await params;
  const { profile, error } = await fetchPublicSellerProfile(id);

  if (error) {
    return <SellerProfileError />;
  }

  if (!profile) {
    notFound();
  }

  const memberSince = formatMemberSince(profile.memberSince);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-surface">
        <div className="border-b border-border bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <p className="text-sm text-muted">
              <Link
                href="/listings"
                className="font-medium text-primary hover:text-primary-hover"
              >
                Listings
              </Link>
              <span className="mx-2">/</span>
              Seller
            </p>

            <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-surface ring-2 ring-border sm:h-28 sm:w-28">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="112px"
                    priority
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-muted">
                    <UserRound className="h-12 w-12" aria-hidden />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium uppercase tracking-wide text-muted">
                  {profile.companyName ? "Company" : "Seller"}
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {profile.displayName}
                </h1>
                {profile.companyName && (
                  <p className="mt-2 flex items-center gap-2 text-base text-muted">
                    <Building2 className="h-4 w-4 shrink-0" aria-hidden />
                    {profile.companyName}
                  </p>
                )}

                <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
                  {profile.city && (
                    <div className="flex items-center gap-1.5">
                      <dt className="sr-only">Location</dt>
                      <dd className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                        {profile.city}
                      </dd>
                    </div>
                  )}
                  {memberSince && (
                    <div className="flex items-center gap-1.5">
                      <dt className="sr-only">Member since</dt>
                      <dd className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                        Member since {memberSince}
                      </dd>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-1.5">
                      <dt className="sr-only">Website</dt>
                      <dd>
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary-hover"
                        >
                          <Globe className="h-4 w-4 shrink-0" aria-hidden />
                          Website
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>

                <p className="mt-4 text-sm font-medium text-foreground">
                  Published listings: {profile.listingCount}
                </p>
              </div>
            </div>

            {profile.bio && (
              <section className="mt-8 max-w-3xl" aria-labelledby="about-heading">
                <h2
                  id="about-heading"
                  className="text-lg font-semibold text-foreground"
                >
                  About
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-muted">
                  {profile.bio}
                </p>
              </section>
            )}
          </div>
        </div>

        <section
          className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
          aria-labelledby="listings-heading"
        >
          <h2
            id="listings-heading"
            className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            Businesses for sale
          </h2>
          <p className="mt-2 text-sm text-muted">
            Published listings from this seller.
          </p>

          {profile.listings.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-border bg-white px-6 py-12 text-center shadow-sm">
              <p className="text-base font-medium text-foreground">
                No published listings right now.
              </p>
              <Button href="/listings" variant="secondary" size="sm" className="mt-6">
                Browse all businesses
              </Button>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {profile.listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
