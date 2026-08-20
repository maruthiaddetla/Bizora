import { redirect } from "next/navigation";

/** /dashboard/listings has no index; seller listings live on /dashboard. */
export default function DashboardListingsIndexPage() {
  redirect("/dashboard");
}
