import { describe, expect, it } from "vitest";
import { normalizeIndianPhone } from "@/lib/auth/phone";
import { AUTH_PHONE_ALREADY_REGISTERED } from "@/lib/auth/errors";

describe("phone signup validation helpers", () => {
  it("rejects invalid phone numbers", () => {
    expect(normalizeIndianPhone("123")).toBeNull();
    expect(normalizeIndianPhone("5123456789")).toBeNull();
  });

  it("normalizes valid Indian mobiles to E.164", () => {
    expect(normalizeIndianPhone("9876543210")).toBe("+919876543210");
  });

  it("exposes a safe already-registered message", () => {
    expect(AUTH_PHONE_ALREADY_REGISTERED).toContain("already registered");
    expect(AUTH_PHONE_ALREADY_REGISTERED.toLowerCase()).not.toContain("otp");
  });
});
