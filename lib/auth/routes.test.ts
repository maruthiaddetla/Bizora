import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  AUTH_FORGOT_PASSWORD_EMAIL_PATH,
  AUTH_SIGN_IN_PATH,
  AUTH_SIGN_UP_PATH,
  authForgotPasswordEmailHref,
  authSignInHref,
} from "@/lib/auth/routes";

describe("canonical auth routes", () => {
  it("keeps /sign-in as the existing canonical sign-in page", () => {
    expect(AUTH_SIGN_IN_PATH).toBe("/sign-in");
    expect(existsSync(resolve(process.cwd(), "app/sign-in/page.tsx"))).toBe(
      true,
    );
    expect(existsSync(resolve(process.cwd(), "app/sign-up/page.tsx"))).toBe(
      true,
    );
  });

  it("does not invent a duplicate login route", () => {
    expect(existsSync(resolve(process.cwd(), "app/login/page.tsx"))).toBe(
      false,
    );
    expect(existsSync(resolve(process.cwd(), "app/auth/sign-in/page.tsx"))).toBe(
      false,
    );
  });
});

describe("Login/Register navigation", () => {
  it("points Login/Register at the canonical /sign-in route file", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/home/NavbarClient.tsx"),
      "utf8",
    );
    expect(source).toContain("Login / Register");
    expect(source).toContain("AUTH_SIGN_IN_PATH");
    expect(source).not.toMatch(/href=["']\/login["']/);
    expect(source).not.toMatch(/href=["']\/auth\/sign-in["']/);
  });
});

describe("forgot/reset password sign-in links", () => {
  it("uses canonical sign-in for Back to login", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/auth/EmailForgotPasswordForm.tsx"),
      "utf8",
    );
    expect(source).toContain("Back to login");
    expect(source).toContain("authSignInHref");
    expect(authSignInHref("/")).toBe(AUTH_SIGN_IN_PATH);
    expect(authSignInHref("/dashboard")).toBe(
      `${AUTH_SIGN_IN_PATH}?next=${encodeURIComponent("/dashboard")}`,
    );
  });

  it("uses canonical sign-in after successful password reset", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/auth/EmailResetPasswordForm.tsx"),
      "utf8",
    );
    expect(source).toContain("Sign in to Bizora");
    expect(source).toContain("authSignInHref");
  });

  it("keeps email forgot-password on /auth/forgot-password", () => {
    expect(AUTH_FORGOT_PASSWORD_EMAIL_PATH).toBe("/auth/forgot-password");
    expect(authForgotPasswordEmailHref("/")).toBe(
      AUTH_FORGOT_PASSWORD_EMAIL_PATH,
    );
    expect(AUTH_SIGN_UP_PATH).toBe("/sign-up");
  });
});
