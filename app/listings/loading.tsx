import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/80 ${className}`} />;
}

function ListingCardSkeleton() {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
      aria-hidden
    >
      <div className="aspect-[4/3] animate-pulse bg-surface" />
      <div className="space-y-3 p-4 sm:p-5">
        <div className="h-6 w-24 animate-pulse rounded bg-surface" />
        <div className="h-5 w-full animate-pulse rounded bg-surface" />
        <div className="h-4 w-full animate-pulse rounded bg-surface" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-surface" />
      </div>
    </div>
  );
}

export default function ListingsLoading() {
  return (
    <>
      <Navbar />
      <main className="bg-surface" aria-busy="true" aria-label="Loading listings">
        <div className="border-b border-border bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <Skeleton className="h-9 w-64 bg-surface" />
            <Skeleton className="mt-3 h-5 w-40 bg-surface" />
            <Skeleton className="mt-6 h-40 w-full bg-surface" />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <ListingCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
