"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { authFieldClass } from "@/components/auth/PhoneInput";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
};

export function OtpInput({
  value,
  onChange,
  disabled = false,
  id = "otp",
}: OtpInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(raw: string) {
    onChange(raw.replace(/\D/g, "").slice(0, 6));
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !value) {
      event.preventDefault();
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        name="otp"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        className={`${authFieldClass} text-center text-2xl font-semibold tracking-[0.35em] tabular-nums`}
        disabled={disabled}
        maxLength={6}
        aria-label="6-digit verification code"
        placeholder="······"
      />
      <p className="mt-2 text-center text-xs text-muted">
        Enter the 6-digit code
      </p>
    </div>
  );
}
