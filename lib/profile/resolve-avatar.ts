import {
  PROFILE_AVATARS_BUCKET,
} from "@/lib/profile/constants";
import { SIGNED_URL_TTL_SECONDS } from "@/lib/business-images/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Resolve a signed display URL for a profile avatar storage path.
 */
export async function resolveProfileAvatarUrl(
  storagePath: string | null | undefined,
): Promise<string | null> {
  if (!storagePath) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(PROFILE_AVATARS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] profile avatar signed URL failed:", error?.message);
    }
    return null;
  }

  return data.signedUrl;
}
