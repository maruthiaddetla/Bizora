"use client";

import { useState, type FormEvent } from "react";
import {
  ONBOARDING_INTENTS,
  type OnboardingIntentId,
} from "@/lib/auth/onboarding";
import { Button } from "@/components/ui/Button";
import { authFieldClass } from "@/components/auth/PhoneInput";

type OnboardingFormProps = {
  onSubmit: (data: {
    fullName: string;
    intent: OnboardingIntentId;
  }) => Promise<void>;
  loading?: boolean;
  error?: string | null;
};

export function OnboardingForm({
  onSubmit,
  loading = false,
  error = null,
}: OnboardingFormProps) {
  const [fullName, setFullName] = useState("");
  const [intent, setIntent] = useState<OnboardingIntentId>("buy_business");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = fullName.trim();
    if (!trimmed) return;
    await onSubmit({ fullName: trimmed, intent });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Tell us about yourself
        </h2>
        <p className="mt-1 text-sm text-muted">
          This helps us personalise your Bizora experience. You can buy or sell
          at any time.
        </p>
      </div>

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
          Full name
        </span>
        <input
          type="text"
          name="fullName"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={authFieldClass}
          required
        />
      </label>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-foreground">
          What are you looking to do?
        </legend>
        <div className="grid gap-2">
          {ONBOARDING_INTENTS.map((option) => (
            <label
              key={option.id}
              className={[
                "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                intent === option.id
                  ? "border-primary bg-primary-light/40 text-navy"
                  : "border-border bg-white text-foreground hover:border-primary/30",
              ].join(" ")}
            >
              <input
                type="radio"
                name="intent"
                value={option.id}
                checked={intent === option.id}
                onChange={() => setIntent(option.id)}
                className="h-4 w-4 accent-primary"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Continuing…" : "Continue"}
      </Button>
    </form>
  );
}
