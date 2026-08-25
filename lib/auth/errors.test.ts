import { describe, expect, it } from "vitest";
import {
  AUTH_INVALID_PHONE,
  AUTH_OTP_INVALID,
  AUTH_SMS_UNAVAILABLE,
  isSmsProviderError,
  mapAuthErrorMessage,
  mapTwoFactorSendError,
  mapTwoFactorVerifyError,
} from "@/lib/auth/errors";

describe("auth errors", () => {
  it("does not classify invalid credentials as SMS unavailable", () => {
    const error = { code: "invalid_credentials", message: "Invalid login credentials" };
    expect(isSmsProviderError(error)).toBe(false);
    expect(mapAuthErrorMessage(error, "phone")).toBe(
      "Invalid mobile number or password.",
    );
  });

  it("does not classify invalid phone as SMS unavailable", () => {
    const error = { message: "Invalid phone number" };
    expect(isSmsProviderError(error)).toBe(false);
    expect(mapAuthErrorMessage(error, "phone")).toBe(
      "Please enter a valid mobile number.",
    );
  });

  it("still maps genuine SMS provider failures", () => {
    const error = { code: "sms_send_failed", message: "Error sending sms" };
    expect(isSmsProviderError(error)).toBe(true);
    expect(mapAuthErrorMessage(error, "phone")).toBe(AUTH_SMS_UNAVAILABLE);
  });

  it("maps 2Factor send failures to OTP send failure copy", () => {
    expect(mapTwoFactorSendError("provider_error")).toContain("verification code");
  });

  it("maps invalid OTP verification separately from expired OTP", () => {
    expect(mapTwoFactorVerifyError("invalid_otp")).toBe(AUTH_OTP_INVALID);
    expect(mapTwoFactorVerifyError("expired_otp")).toContain("expired");
  });

  it("maps invalid phone constant for signup validation", () => {
    expect(AUTH_INVALID_PHONE).toContain("10-digit");
  });
});
