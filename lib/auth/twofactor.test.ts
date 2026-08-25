import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  sendTwoFactorOtp,
  verifyTwoFactorOtp,
  TWOFACTOR_SIGNUP_TEMPLATE,
} from "@/lib/auth/twofactor";

describe("twofactor", () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.TWOFACTOR_API_KEY;

  beforeEach(() => {
    process.env.TWOFACTOR_API_KEY = "test-api-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalEnv === undefined) {
      delete process.env.TWOFACTOR_API_KEY;
    } else {
      process.env.TWOFACTOR_API_KEY = originalEnv;
    }
    vi.restoreAllMocks();
  });

  it("returns session id on successful AUTOGEN response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        Status: "Success",
        Details: "session-abc-123",
      }),
    });

    const result = await sendTwoFactorOtp("+919876543210");

    expect(result).toEqual({ ok: true, sessionId: "session-abc-123" });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        `/SMS/${encodeURIComponent("+919876543210")}/AUTOGEN/${encodeURIComponent(TWOFACTOR_SIGNUP_TEMPLATE)}`,
      ),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("maps AUTOGEN provider errors safely", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ Status: "Error", Details: "Invalid phone" }),
    });

    const result = await sendTwoFactorOtp("+919876543210");
    expect(result).toEqual({ ok: false, reason: "provider_error" });
  });

  it("returns misconfigured when API key is missing", async () => {
    delete process.env.TWOFACTOR_API_KEY;
    const result = await sendTwoFactorOtp("+919876543210");
    expect(result).toEqual({ ok: false, reason: "misconfigured" });
  });

  it("accepts only explicit OTP matched success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ Status: "Success", Details: "OTP Matched" }),
    });

    const result = await verifyTwoFactorOtp("session-abc", "123456");
    expect(result).toEqual({ ok: true });
  });

  it("treats OTP mismatch as invalid", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ Status: "Error", Details: "OTP Mismatch" }),
    });

    const result = await verifyTwoFactorOtp("session-abc", "000000");
    expect(result).toEqual({ ok: false, reason: "invalid_otp" });
  });

  it("treats expired OTP separately", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ Status: "Error", Details: "OTP Expired" }),
    });

    const result = await verifyTwoFactorOtp("session-abc", "123456");
    expect(result).toEqual({ ok: false, reason: "expired_otp" });
  });

  it("does not treat HTTP 200 alone as verification success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ Status: "Success", Details: "Pending" }),
    });

    const result = await verifyTwoFactorOtp("session-abc", "123456");
    expect(result).toEqual({ ok: false, reason: "provider_error" });
  });
});
