import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  BIZORA_LOCAL_SITE_URL,
  BIZORA_PRODUCTION_SITE_URL,
  getAuthEmailRedirectTo,
  getPasswordResetRedirectTo,
  getSiteUrl,
  PASSWORD_RESET_CALLBACK_PATH,
  PASSWORD_RESET_PATH,
} from "@/lib/site";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSiteUrl", () => {
  it("uses NEXT_PUBLIC_SITE_URL for production", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://bizoraindia.com/");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    expect(getSiteUrl()).toBe("https://bizoraindia.com");
  });

  it("uses localhost when explicitly configured for local development", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("forces localhost during local nextdev even if production SITE_URL is set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://bizoraindia.com");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    expect(getSiteUrl()).toBe(BIZORA_LOCAL_SITE_URL);
    expect(getPasswordResetRedirectTo()).toBe(
      `${BIZORA_LOCAL_SITE_URL}${PASSWORD_RESET_CALLBACK_PATH}`,
    );
  });

  it("never falls back to localhost in a production runtime", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    expect(getSiteUrl()).toBe(BIZORA_PRODUCTION_SITE_URL);
    expect(getSiteUrl()).not.toContain("localhost");
  });

  it("falls back to localhost only outside production when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("NODE_ENV", "test");
    expect(getSiteUrl()).toBe(BIZORA_LOCAL_SITE_URL);
  });
});

describe("getAuthEmailRedirectTo", () => {
  it("builds a production auth callback URL for email confirmation", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://bizoraindia.com");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    expect(getAuthEmailRedirectTo("/dashboard")).toBe(
      "https://bizoraindia.com/auth/callback?next=%2Fdashboard",
    );
  });

  it("builds a localhost auth callback URL for local development", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    expect(getAuthEmailRedirectTo("/")).toBe(
      "http://localhost:3000/auth/callback?next=%2F",
    );
  });

  it("never embeds localhost when production site URL is configured in production", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://bizoraindia.com");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    const redirectTo = getAuthEmailRedirectTo("/");
    expect(redirectTo.startsWith("https://bizoraindia.com/auth/callback")).toBe(
      true,
    );
    expect(redirectTo).not.toContain("localhost");
  });
});

describe("getPasswordResetRedirectTo", () => {
  it("routes password recovery through dedicated recovery callback", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://bizoraindia.com");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    expect(getPasswordResetRedirectTo()).toBe(
      "https://bizoraindia.com/auth/callback/reset-password",
    );
  });

  it("points local development reset emails at localhost callback", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://bizoraindia.com");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    expect(getPasswordResetRedirectTo()).toBe(
      "http://localhost:3000/auth/callback/reset-password",
    );
  });
});

describe("local recovery routes exist", () => {
  it("keeps App Router files for recovery callback and reset page", () => {
    expect(
      existsSync(
        resolve(process.cwd(), "app/auth/callback/reset-password/route.ts"),
      ),
    ).toBe(true);
    expect(
      existsSync(resolve(process.cwd(), "app/auth/reset-password/page.tsx")),
    ).toBe(true);
    expect(PASSWORD_RESET_CALLBACK_PATH).toBe("/auth/callback/reset-password");
    expect(PASSWORD_RESET_PATH).toBe("/auth/reset-password");
  });
});

describe("email signup redirect wiring", () => {
  it("email signup supplies emailRedirectTo via getAuthEmailRedirectTo", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/auth/EmailSignUpForm.tsx"),
      "utf8",
    );
    expect(source).toContain("getAuthEmailRedirectTo");
    expect(source).toContain("emailRedirectTo");
    expect(source).not.toContain("window.location.origin");
    expect(source).toContain("auth.signUp");
  });

  it("phone signup flow is unchanged and does not use emailRedirectTo", () => {
    const phoneFlow = readFileSync(
      resolve(process.cwd(), "components/auth/PhoneSignUpFlow.tsx"),
      "utf8",
    );
    const phoneActions = readFileSync(
      resolve(process.cwd(), "lib/auth/phone-signup.actions.ts"),
      "utf8",
    );
    expect(phoneFlow).not.toContain("emailRedirectTo");
    expect(phoneActions).not.toContain("emailRedirectTo");
    expect(phoneFlow).not.toContain("getAuthEmailRedirectTo");
  });

  it("auth callback route exchanges the confirmation code", () => {
    const source = readFileSync(
      resolve(process.cwd(), "app/auth/callback/route.ts"),
      "utf8",
    );
    const helper = readFileSync(
      resolve(process.cwd(), "lib/auth/auth-callback.ts"),
      "utf8",
    );
    expect(source).toContain("exchangeAuthParamsAndRedirect");
    expect(helper).toContain("exchangeCodeForSession");
  });
});
