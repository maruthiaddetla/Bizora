import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { toLocalIndianPhone } from "@/lib/auth/phone";
import type { OnboardingIntentId } from "@/lib/auth/onboarding";

type CompleteAuthOptions = {
  fullName?: string;
  onboardingIntent?: OnboardingIntentId;
};

/**
 * Sync auth metadata → profiles after a successful session is established.
 * Does not change role — buyer remains default until promote_to_seller().
 */
export async function completeAuthProfile(
  supabase: SupabaseClient,
  user: User,
  options: CompleteAuthOptions = {},
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      ok: false,
      message:
        "Your account is signed in, but your profile could not be loaded. Please contact support.",
    };
  }

  const metaName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const nextName = options.fullName?.trim() || metaName;

  const profilePatch: {
    full_name?: string;
    phone?: string;
  } = {};

  if (nextName && !profile.full_name?.trim()) {
    profilePatch.full_name = nextName;
  }

  const localPhone = user.phone ? toLocalIndianPhone(user.phone) : null;
  if (localPhone) {
    profilePatch.phone = localPhone;
  }

  if (Object.keys(profilePatch).length > 0) {
    await supabase.from("profiles").update(profilePatch).eq("id", user.id);
  } else if (metaName && !profile.full_name?.trim()) {
    await supabase
      .from("profiles")
      .update({ full_name: metaName })
      .eq("id", user.id)
      .is("full_name", null);
  }

  if (options.fullName || options.onboardingIntent) {
    const userMeta: Record<string, string> = {};
    if (options.fullName) {
      userMeta.full_name = options.fullName.trim();
    }
    if (options.onboardingIntent) {
      userMeta.onboarding_intent = options.onboardingIntent;
    }
    if (Object.keys(userMeta).length > 0) {
      await supabase.auth.updateUser({ data: userMeta });
    }
  }

  return { ok: true };
}

export function userNeedsOnboarding(
  profileFullName: string | null | undefined,
  user: User,
): boolean {
  const profileName = profileFullName?.trim();
  if (profileName) return false;

  const metaName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";

  return !metaName;
}
