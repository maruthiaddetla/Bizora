import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  isRecoveryType,
  recoverySuccessPath,
  resolveEmailConfirmNext,
} from "@/lib/auth/auth-callback";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { AUTH_SIGN_IN_PATH } from "@/lib/auth/routes";
import {
  BIZORA_PRODUCTION_SITE_URL,
  getPasswordResetRedirectTo,
  PASSWORD_RESET_CALLBACK_PATH,
  PASSWORD_RESET_PATH,
} from "@/lib/site";

const ORIGINAL_ENV = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  VERCEL_URL: process.env.VERCEL_URL,
  VERCEL_ENV: process.env.VERCEL_ENV,
};

function restoreEnv() {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

afterEach(() => {
  restoreEnv();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("password recovery redirect URL", () => {
  it("uses dedicated recovery callback path in production", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://bizoraindia.com");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    expect(getPasswordResetRedirectTo()).toBe(
      `https://bizoraindia.com${PASSWORD_RESET_CALLBACK_PATH}`,
    );
    expect(getPasswordResetRedirectTo()).not.toContain("localhost");
    expect(getPasswordResetRedirectTo()).toContain("/auth/callback/reset-password");
  });

  it("uses localhost only when explicitly configured for local development", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    expect(getPasswordResetRedirectTo()).toBe(
      `http://localhost:3000${PASSWORD_RESET_CALLBACK_PATH}`,
    );
  });

  it("falls back to production host in production runtime", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    expect(getPasswordResetRedirectTo().startsWith(BIZORA_PRODUCTION_SITE_URL)).toBe(
      true,
    );
    expect(getPasswordResetRedirectTo()).not.toContain("localhost");
  });
});

describe("password recovery callback route", () => {
  it("exchanges the code and redirects to reset-password, never sign-in", () => {
    const source = readFileSync(
      resolve(process.cwd(), "app/auth/callback/reset-password/route.ts"),
      "utf8",
    );
    expect(source).toContain("exchangeAuthParamsAndRedirect");
    expect(source).toContain("recoverySuccessPath");
    expect(source).toContain("passwordResetFailureRedirect");
    expect(source).not.toContain(`${AUTH_SIGN_IN_PATH}?error=auth`);
    expect(source).not.toContain('error=auth');
  });

  it("attaches session cookies to the redirect response", () => {
    const helper = readFileSync(
      resolve(process.cwd(), "lib/auth/auth-callback.ts"),
      "utf8",
    );
    expect(helper).toContain("response.cookies.set");
    expect(helper).toContain("exchangeCodeForSession");
    expect(helper).toContain("verifyOtp");
  });

  it("maps recovery success to /auth/reset-password", () => {
    expect(recoverySuccessPath()).toBe(PASSWORD_RESET_PATH);
    expect(PASSWORD_RESET_PATH).toBe("/auth/reset-password");
  });
});

describe("shared email confirmation callback", () => {
  it("still exchanges codes for normal email confirmation", () => {
    const source = readFileSync(
      resolve(process.cwd(), "app/auth/callback/route.ts"),
      "utf8",
    );
    expect(source).toContain("exchangeAuthParamsAndRedirect");
    expect(source).toContain("completeAuthProfile");
    expect(source).toContain("email_confirm");
  });

  it("treats type=recovery and next=/auth/reset-password as recovery", () => {
    expect(isRecoveryType("recovery")).toBe(true);
    expect(isRecoveryType("signup")).toBe(false);
    expect(resolveEmailConfirmNext("/auth/reset-password")).toBe(
      PASSWORD_RESET_PATH,
    );
  });

  it("rejects open redirects via next", () => {
    expect(getSafeNextPath("https://evil.example", "/")).toBe("/");
    expect(getSafeNextPath("//evil.example", "/")).toBe("/");
    expect(resolveEmailConfirmNext("https://evil.example")).toBe("/");
  });

  it("sends invalid recovery exchanges to forgot-password, not sign-in", () => {
    const source = readFileSync(
      resolve(process.cwd(), "app/auth/callback/route.ts"),
      "utf8",
    );
    expect(source).toContain("passwordResetFailureRedirect");
    expect(source).toMatch(
      /isPasswordRecovery[\s\S]*passwordResetFailureRedirect/,
    );
  });
});

describe("reset password page recovery session", () => {
  it("requires a valid session and allows updateUser({ password })", () => {
    const form = readFileSync(
      resolve(process.cwd(), "components/auth/EmailResetPasswordForm.tsx"),
      "utf8",
    );
    expect(form).toContain("getUser");
    expect(form).toContain("updateUser");
    expect(form).toContain("password: newPassword");
    expect(form).toContain("exchangeCodeForSession");
    expect(form).toContain("authSignInHref");
    expect(form).toContain("Sign in to Bizora");
    expect(form).toMatch(
      /async function handleSetPassword[\s\S]*getUser\(\)[\s\S]*if \(!user\)[\s\S]*updateUser/,
    );
  });
});

describe("phone auth unchanged", () => {
  it("does not wire password-recovery callback into phone flows", () => {
    const phoneForgot = readFileSync(
      resolve(process.cwd(), "components/auth/ForgotPasswordFlow.tsx"),
      "utf8",
    );
    const phoneSignUp = readFileSync(
      resolve(process.cwd(), "components/auth/PhoneSignUpFlow.tsx"),
      "utf8",
    );
    expect(phoneForgot).not.toContain("getPasswordResetRedirectTo");
    expect(phoneForgot).not.toContain("PASSWORD_RESET_CALLBACK_PATH");
    expect(phoneSignUp).not.toContain("PASSWORD_RESET_CALLBACK_PATH");
  });
});
