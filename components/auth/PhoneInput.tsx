"use client";

import { DEFAULT_PHONE_COUNTRY } from "@/lib/auth/phone";

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
};

const fieldClass =
  "h-12 w-full rounded-xl border border-border bg-white px-4 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function PhoneInput({
  value,
  onChange,
  disabled = false,
  id = "phone",
}: PhoneInputProps) {
  function handleChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, DEFAULT_PHONE_COUNTRY.localLength);
    onChange(digits);
  }

  return (
    <div className="flex gap-2">
      <div
        className="flex h-12 shrink-0 items-center rounded-xl border border-border bg-surface px-3 text-sm font-medium text-navy"
        aria-hidden
      >
        {DEFAULT_PHONE_COUNTRY.dialCode}
      </div>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        name="phone"
        placeholder="Mobile number"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className={fieldClass}
        disabled={disabled}
        maxLength={DEFAULT_PHONE_COUNTRY.localLength}
        aria-label="Mobile number"
      />
    </div>
  );
}

export const authFieldClass = fieldClass;
