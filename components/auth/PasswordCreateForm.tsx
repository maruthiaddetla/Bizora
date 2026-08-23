"use client";

import { useState, type FormEvent } from "react";
import { authFieldClass } from "@/components/auth/PhoneInput";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { Button } from "@/components/ui/Button";

type PasswordCreateFormProps = {
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (password: string) => void | Promise<void>;
};

export function PasswordCreateForm({
  title = "Create password",
  subtitle = "Choose a password for your Bizora account.",
  submitLabel = "Continue",
  loading = false,
  error = null,
  onSubmit,
}: PasswordCreateFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setLocalError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      );
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    await onSubmit(password);
  }

  const displayError = error ?? localError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>

      {displayError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {displayError}
        </div>
      )}

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
          className={authFieldClass}
          minLength={MIN_PASSWORD_LENGTH}
          required
          disabled={loading}
        />
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
          className={authFieldClass}
          minLength={MIN_PASSWORD_LENGTH}
          required
          disabled={loading}
        />
        <span className="mt-1 block text-xs text-muted">
          At least {MIN_PASSWORD_LENGTH} characters.
        </span>
      </label>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
