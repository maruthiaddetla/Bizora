import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface ${className}`} />;
}

export default function BusinessDetailLoading() {
  return (
    <>
      <Navbar />
      <main className="bg-white" aria-busy="true" aria-label="Loading business details">
        <div className="border-b border-border bg-surface/50">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="mb-6 space-y-3 sm:mb-8">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-full max-w-xl" />
          </div>

          <Skeleton className="aspect-[4/3] w-full sm:h-[420px] sm:aspect-auto lg:h-[480px]" />

          <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <Skeleton className="h-10 w-40" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="hidden h-96 lg:block" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
