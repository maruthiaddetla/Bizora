import { AdminNav } from "@/components/admin/AdminNav";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { Footer } from "@/components/home/Footer";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, isAdmin } = await requireAdmin("/admin");

  if (!isAdmin) {
    return (
      <>
        <AdminAccessDenied />
        <Footer />
      </>
    );
  }

  return (
    <>
      <AdminNav adminName={profile?.full_name} />
      {children}
      <Footer />
    </>
  );
}
