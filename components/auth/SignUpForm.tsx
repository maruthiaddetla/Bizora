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
const MIN_PASSWORD_LENGTH = 8;

type SignUpFormProps = {
  nextPath?: string;
};

export function SignUpForm({ nextPath = "/" }: SignUpFormProps) {
  const router = useRouter();
  const safeNext = getSafeNextPath(nextPath, "/");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
          },
          emailRedirectTo,
        },
      });

      if (signUpError) {
        setError(mapAuthErrorMessage(signUpError));
        return;
      }

      // Identities empty often means the email is already registered (Supabase soft-fail).
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setError(
          "An account with this email already exists. Try signing in instead.",
        );
        return;
      }

      if (data.session && data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ full_name: trimmedName })
          .eq("id", data.user.id);

        if (profileError && process.env.NODE_ENV === "development") {
          console.warn("[Bizora] profile full_name update failed:", profileError.message);
        }

        router.push(safeNext);
        router.refresh();
        return;
      }

      setInfo(
        "Account created. Please check your email to confirm your address before signing in.",
      );
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
      {info && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          {info}
        </div>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Full name
        </span>
        <input
          type="text"
          name="fullName"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={fieldClass}
          required
        />
      </label>

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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={fieldClass}
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
        <span className="mt-1 block text-xs text-muted">
          At least {MIN_PASSWORD_LENGTH} characters.
        </span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Confirm password
        </span>
        <input
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={fieldClass}
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      </label>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Register"}
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          href={`/sign-in?next=${encodeURIComponent(safeNext)}`}
          className="font-semibold text-primary hover:text-primary-hover"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
