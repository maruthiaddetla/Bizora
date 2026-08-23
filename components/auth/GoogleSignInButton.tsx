"use client";

import { useState } from "react";
import {
  AUTH_UNEXPECTED_ERROR,
  mapAuthErrorMessage,
} from "@/lib/auth/errors";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type GoogleSignInButtonProps = {
  nextPath?: string;
};

export function GoogleSignInButton({ nextPath = "/" }: GoogleSignInButtonProps) {
  const safeNext = getSafeNextPath(nextPath, "/");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (oauthError) {
        setError(mapAuthErrorMessage(oauthError));
      }
    } catch {
      setError(AUTH_UNEXPECTED_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        disabled={loading}
        onClick={handleGoogleSignIn}
      >
        {loading ? "Redirecting…" : "Continue with Google"}
      </Button>
    </div>
  );
}
