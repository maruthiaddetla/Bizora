import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function AdminAccessDenied() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-medium text-primary">403</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
        Access denied
      </h1>
      <p className="mt-3 max-w-md text-muted">
        You do not have permission to view the admin area. Admin access is
        assigned manually by Bizora operators.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/dashboard">Go to dashboard</Button>
        <Button href="/" variant="secondary">
          Back to home
        </Button>
      </div>
      <p className="mt-6 text-sm text-muted">
        Think this is a mistake?{" "}
        <Link href="/contact" className="font-medium text-primary hover:text-primary-hover">
          Contact support
        </Link>
      </p>
    </main>
  );
}
