import { NavbarClient } from "@/components/home/NavbarClient";
import { authSignInHref } from "@/lib/auth/routes";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";
import { countUnreadNotifications } from "@/lib/repositories/notifications.repository";

export async function Navbar() {
  const user = await getCurrentUser();
  const isAuthenticated = Boolean(user);
  const profile = isAuthenticated ? await getCurrentProfile() : null;
  const showAdminDashboard = profile?.role === "admin";
  const postListingHref = isAuthenticated
    ? "/dashboard/listings/new"
    : authSignInHref("/dashboard/listings/new");
  const unreadCount =
    user != null ? await countUnreadNotifications(user.id) : 0;

  return (
    <NavbarClient
      isAuthenticated={isAuthenticated}
      showAdminDashboard={showAdminDashboard}
      postListingHref={postListingHref}
      unreadNotificationCount={unreadCount}
    />
  );
}
