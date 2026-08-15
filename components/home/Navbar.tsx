import { NavbarClient } from "@/components/home/NavbarClient";
import { getCurrentUser } from "@/lib/auth/session";

export async function Navbar() {
  const user = await getCurrentUser();
  const isAuthenticated = Boolean(user);
  const postListingHref = isAuthenticated ? "/sell" : "/sign-in?next=/sell";

  return (
    <NavbarClient
      isAuthenticated={isAuthenticated}
      postListingHref={postListingHref}
    />
  );
}
