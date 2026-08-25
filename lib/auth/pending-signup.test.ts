import { describe, expect, it } from "vitest";
import {
  createPendingSignupRecord,
  decodePendingSignupForTests,
  encodePendingSignupForTests,
  isPendingSignupExpired,
  resendCooldownRemainingSeconds,
  type PendingSignupRecord,
} from "@/lib/auth/pending-signup";
import { OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/auth/phone";

const SECRET = "test-secret-key";

function baseRecord(overrides: Partial<PendingSignupRecord> = {}): PendingSignupRecord {
  return {
    v: 1,
    purpose: "phone_signup",
    phone: "+919876543210",
    password: "secure-password",
    otpSessionId: "session-1",
    expiresAt: Date.now() + 60_000,
    verifyAttempts: 0,
    sendAttempts: 1,
    lastSendAt: Date.now(),
    verified: false,
    nonce: "nonce-1",
    ...overrides,
  };
}

describe("pending-signup", () => {
  it("round-trips encrypted pending signup cookie payload", () => {
    const record = baseRecord();
    const encoded = encodePendingSignupForTests(record, SECRET);
    const decoded = decodePendingSignupForTests(encoded, SECRET);
    expect(decoded).toEqual(record);
  });

  it("rejects tampered cookie payloads", () => {
    const encoded = encodePendingSignupForTests(baseRecord(), SECRET);
    const tampered = `${encoded}x`;
    expect(decodePendingSignupForTests(tampered, SECRET)).toBeNull();
  });

  it("prevents replay across different phone numbers", () => {
    const previous = baseRecord({ phone: "+919876543210", sendAttempts: 1 });
    const next = createPendingSignupRecord({
      phone: "+919988776655",
      password: "secure-password",
      otpSessionId: "session-2",
      previous,
    });
    expect(next).toBeNull();
  });

  it("enforces resend cooldown server-side", () => {
    const record = baseRecord({ lastSendAt: Date.now() - 10_000 });
    expect(resendCooldownRemainingSeconds(record)).toBe(
      OTP_RESEND_COOLDOWN_SECONDS - 10,
    );
  });

  it("expires pending signup records", () => {
    const record = baseRecord({ expiresAt: Date.now() - 1 });
    expect(isPendingSignupExpired(record)).toBe(true);
  });
});
