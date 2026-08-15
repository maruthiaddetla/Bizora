"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  AUTH_UNEXPECTED_ERROR,
  mapAuthErrorMessage,
} from "@/lib/auth/errors";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SignInFormProps = {
  nextPath?: string;
  initialError?: string | null;
};

export function SignInForm({
  nextPath = "/",
  initialError = null,
}: SignInFormProps) {
  const router = useRouter();
  const safeNext = getSafeNextPath(nextPath, "/");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (signInError) {
        setError(mapAuthErrorMessage(signInError));
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(AUTH_UNEXPECTED_ERROR);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        setError(
          "Your account is signed in, but your profile could not be loaded. Please contact support.",
        );
        return;
      }

      // Sync full_name from auth metadata once if profile name is empty.
      const metaName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name.trim()
          : "";
      if (metaName) {
        await supabase
          .from("profiles")
          .update({ full_name: metaName })
          .eq("id", user.id)
          .is("full_name", null);
      }

      router.push(safeNext);
      router.refresh();
    } catch {
      setError(AUTH_UNEXPECTED_ERROR);
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "h-12 w-full rounded-xl border border-border bg-white px-4 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Email
        </span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
          required
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Password
        </span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={fieldClass}
          required
        />
      </label>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign In"}
      </Button>

      <p className="text-center text-sm text-muted">
        New to Bizora?{" "}
        <Link
          href={`/sign-up?next=${encodeURIComponent(safeNext)}`}
          className="font-semibold text-primary hover:text-primary-hover"
        >
          Register free
        </Link>
      </p>
    </form>
  );
}
