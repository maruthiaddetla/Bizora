import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  getTwoFactorSignupTemplate,
  sendTwoFactorOtp,
  verifyTwoFactorOtp,
  TWOFACTOR_SIGNUP_TEMPLATE,
} from "@/lib/auth/twofactor";

describe("twofactor", () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.TWOFACTOR_API_KEY;
  const originalTemplate = process.env.TWOFACTOR_SMS_TEMPLATE;

  beforeEach(() => {
    process.env.TWOFACTOR_API_KEY = "test-api-key";
    delete process.env.TWOFACTOR_SMS_TEMPLATE;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) {
      delete process.env.TWOFACTOR_API_KEY;
    } else {
      process.env.TWOFACTOR_API_KEY = originalApiKey;
    }
    if (originalTemplate === undefined) {
      delete process.env.TWOFACTOR_SMS_TEMPLATE;
    } else {
      process.env.TWOFACTOR_SMS_TEMPLATE = originalTemplate;
    }
    vi.restoreAllMocks();
  });

  it("defaults the signup template name to OTP1", () => {
    expect(TWOFACTOR_SIGNUP_TEMPLATE).toBe("OTP1");
    expect(getTwoFactorSignupTemplate()).toBe("OTP1");
  });

  it("uses OTP1 in the AUTOGEN request by default", async () => {
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
        `/SMS/${encodeURIComponent("+919876543210")}/AUTOGEN/${encodeURIComponent("OTP1")}`,
      ),
      expect.objectContaining({ method: "GET" }),
    );
    const calledUrl = String(vi.mocked(global.fetch).mock.calls[0][0]);
    expect(calledUrl).toContain("/AUTOGEN/OTP1");
    expect(calledUrl).not.toContain("New%20user%20sign%20up");
  });

  it("allows overriding the AUTOGEN template via TWOFACTOR_SMS_TEMPLATE", async () => {
    process.env.TWOFACTOR_SMS_TEMPLATE = "OTP1";
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ Status: "Success", Details: "session-xyz" }),
    });

    await sendTwoFactorOtp("+919876543210");

    expect(getTwoFactorSignupTemplate()).toBe("OTP1");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/AUTOGEN/OTP1"),
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

  it("does not change the VERIFY endpoint path", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ Status: "Success", Details: "OTP Matched" }),
    });

    await verifyTwoFactorOtp("session-abc", "123456");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/SMS/VERIFY/session-abc/123456"),
      expect.objectContaining({ method: "GET" }),
    );
  });
});
