import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("security invariants", () => {
  it("keeps TWOFACTOR_API_KEY server-only", () => {
    const clientFiles = [
      "components/auth/PhoneSignUpFlow.tsx",
      "components/auth/PhoneSignInForm.tsx",
      "components/auth/ForgotPasswordFlow.tsx",
      "lib/supabase/client.ts",
    ];

    for (const file of clientFiles) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(source).not.toContain("TWOFACTOR_API_KEY");
      expect(source).not.toContain("NEXT_PUBLIC_TWOFACTOR");
    }
  });

  it("does not log OTP values in auth modules", () => {
    const authFiles = [
      "lib/auth/twofactor.ts",
      "lib/auth/phone-signup.actions.ts",
      "lib/auth/pending-signup.ts",
      "lib/auth/send-sms-hook.ts",
    ];

    for (const file of authFiles) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(source).not.toMatch(/console\.(log|info|debug|warn|error)/);
    }
  });

  it("keeps RESEND_API_KEY server-only", () => {
    const clientFiles = [
      "components/listing/EnquiryForm.tsx",
      "lib/supabase/client.ts",
    ];

    for (const file of clientFiles) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(source).not.toContain("RESEND_API_KEY");
      expect(source).not.toContain("NEXT_PUBLIC_RESEND");
    }
  });

  it("does not expose fake OTP success paths in signup flow", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/auth/PhoneSignUpFlow.tsx"),
      "utf8",
    );
    expect(source).not.toContain("verifyOtp");
    expect(source).not.toContain("auth.signUp");
  });
});
