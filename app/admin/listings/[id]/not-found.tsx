import { Button } from "@/components/ui/Button";

export default function AdminNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-foreground">Listing not found</h1>
      <p className="mt-3 max-w-md text-muted">
        This listing does not exist or is no longer available for review.
      </p>
      <Button href="/admin/listings" className="mt-8">
        Back to listings
      </Button>
    </main>
  );
}
