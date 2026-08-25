import { toLocalIndianPhone } from "@/lib/auth/phone";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Check whether a phone number is already registered.
 * Uses profiles.phone (local 10-digit) first; createUser still guards auth.users.
 * Server-only; uses service role.
 */
export async function isPhoneAlreadyRegistered(e164Phone: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;

  const localPhone = toLocalIndianPhone(e164Phone);
  if (!localPhone) return false;

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", localPhone)
    .maybeSingle();

  return Boolean(profile?.id);
}

export type CreateConfirmedPhoneUserResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "already_registered" | "creation_failed" | "misconfigured" };

/**
 * Create a phone-confirmed Supabase Auth user via admin API.
 * Does not send Supabase SMS.
 */
export async function createConfirmedPhoneUser(
  e164Phone: string,
  password: string,
): Promise<CreateConfirmedPhoneUserResult> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { ok: false, reason: "misconfigured" };
  }

  const { data, error } = await admin.auth.admin.createUser({
    phone: e164Phone,
    password,
    phone_confirm: true,
  });

  if (error) {
    const message = (error.message ?? "").toLowerCase();
    const code = (error.code ?? "").toLowerCase();
    if (
      code === "user_already_exists" ||
      message.includes("already registered") ||
      message.includes("already exists") ||
      message.includes("duplicate")
    ) {
      return { ok: false, reason: "already_registered" };
    }
    return { ok: false, reason: "creation_failed" };
  }

  if (!data.user?.id) {
    return { ok: false, reason: "creation_failed" };
  }

  return { ok: true, userId: data.user.id };
}
