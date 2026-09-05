import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  BIZORA_PRODUCTION_SITE_URL,
  getAuthEmailRedirectTo,
  getSiteUrl,
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
});

describe("getSiteUrl", () => {
  it("uses NEXT_PUBLIC_SITE_URL for production", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://bizoraindia.com/";
    process.env.VERCEL_ENV = "production";
    expect(getSiteUrl()).toBe("https://bizoraindia.com");
  });

  it("uses localhost when explicitly configured for local development", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    delete process.env.VERCEL_ENV;
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("never falls back to localhost in a production runtime", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;
    process.env.VERCEL_ENV = "production";
    expect(getSiteUrl()).toBe(BIZORA_PRODUCTION_SITE_URL);
    expect(getSiteUrl()).not.toContain("localhost");
  });

  it("falls back to localhost only outside production when unset", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_ENV;
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});

describe("getAuthEmailRedirectTo", () => {
  it("builds a production auth callback URL for email confirmation", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://bizoraindia.com";
    expect(getAuthEmailRedirectTo("/dashboard")).toBe(
      "https://bizoraindia.com/auth/callback?next=%2Fdashboard",
    );
  });

  it("builds a localhost auth callback URL for local development", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    expect(getAuthEmailRedirectTo("/")).toBe(
      "http://localhost:3000/auth/callback?next=%2F",
    );
  });

  it("never embeds localhost when production site URL is configured", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://bizoraindia.com";
    const redirectTo = getAuthEmailRedirectTo("/");
    expect(redirectTo.startsWith("https://bizoraindia.com/auth/callback")).toBe(
      true,
    );
    expect(redirectTo).not.toContain("localhost");
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
    expect(source).toContain("exchangeCodeForSession");
    expect(source).toContain('searchParams.get("code")');
  });
});
