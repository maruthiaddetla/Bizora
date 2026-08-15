import { NextResponse } from "next/server";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeNextPath(searchParams.get("next"), "/");

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.redirect(`${origin}/sign-in?error=config`);
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/sign-in?error=auth`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
