import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  AUTH_SEND_SMS_HOOK_DISABLED_MESSAGE,
  buildFailClosedSendSmsHookResponse,
  shouldFailClosedSupabaseAuthSms,
} from "@/lib/auth/send-sms-hook";

describe("send-sms-hook fail-closed contract", () => {
  it("always rejects Supabase Auth SMS delivery", () => {
    expect(shouldFailClosedSupabaseAuthSms()).toBe(true);
  });

  it("returns a 403 error payload without claiming SMS success", () => {
    const response = buildFailClosedSendSmsHookResponse();
    expect(response.error.http_code).toBe(403);
    expect(response.error.message).toBe(AUTH_SEND_SMS_HOOK_DISABLED_MESSAGE);
    expect(JSON.stringify(response)).not.toMatch(/"otp"/i);
  });

  it("does not expose 2Factor or Twilio configuration in the hook module", () => {
    const source = readFileSync(
      resolve(process.cwd(), "lib/auth/send-sms-hook.ts"),
      "utf8",
    );
    expect(source).not.toContain("TWOFACTOR_API_KEY");
    expect(source).not.toContain("TWILIO");
    expect(source).not.toContain("NEXT_PUBLIC_TWOFACTOR");
  });

  it("keeps signup on 2Factor and away from Supabase signInWithOtp", () => {
    const signup = readFileSync(
      resolve(process.cwd(), "lib/auth/phone-signup.actions.ts"),
      "utf8",
    );
    expect(signup).toContain("sendTwoFactorOtp");
    expect(signup).toContain("verifyTwoFactorOtp");
    expect(signup).not.toContain("signInWithOtp");
  });
});
