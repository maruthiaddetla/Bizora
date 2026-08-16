import { NavbarClient } from "@/components/home/NavbarClient";
import { getCurrentUser } from "@/lib/auth/session";

export async function Navbar() {
  const user = await getCurrentUser();
  const isAuthenticated = Boolean(user);
  const postListingHref = isAuthenticated
    ? "/dashboard/listings/new"
    : "/sign-in?next=/dashboard/listings/new";

  return (
    <NavbarClient
      isAuthenticated={isAuthenticated}
      postListingHref={postListingHref}
    />
  );
}
