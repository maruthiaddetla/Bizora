import { Button } from "@/components/ui/Button";

export default function EnquiryNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-foreground">Enquiry not found</h1>
      <p className="mt-3 max-w-md text-muted">
        This enquiry does not exist or you do not have access to it.
      </p>
      <Button href="/dashboard/enquiries" className="mt-8">
        Back to enquiries
      </Button>
    </main>
  );
}
