import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/supabase/database.types";
import type { User } from "@supabase/supabase-js";

export type AuthUserContext = {
  user: User;
  profile: ProfileRow | null;
};

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
}

export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone, company_name, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Require an authenticated user for protected server routes.
 * Redirects to /sign-in?next=... when unauthenticated.
 */
export async function requireUser(nextPath = "/"): Promise<AuthUserContext> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone, company_name, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    profile: profile ?? null,
  };
}

/**
 * Require an authenticated admin (profiles.role = admin).
 * Unauthenticated → sign-in. Non-admin → null profile role (caller handles UI).
 */
export async function requireAdmin(
  nextPath = "/admin",
): Promise<AuthUserContext & { isAdmin: boolean }> {
  const ctx = await requireUser(nextPath);
  return {
    ...ctx,
    isAdmin: ctx.profile?.role === "admin",
  };
}
