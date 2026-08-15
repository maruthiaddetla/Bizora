import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-surface">
        <div className="mx-auto flex w-full max-w-md flex-col px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted sm:text-base">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
