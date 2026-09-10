import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getPasswordResetResendButtonState,
  mapPasswordResetRequestError,
  PASSWORD_RESET_RESEND_COOLDOWN_SECONDS,
  validateResetEmail,
} from "@/lib/auth/password-reset";
import { validatePasswordPair } from "@/lib/auth/password";
import {
  AUTH_PASSWORD_RESET_SENT,
  AUTH_PASSWORD_RESET_SENT_HEADING,
} from "@/lib/auth/errors";
import { AUTH_SIGN_IN_PATH } from "@/lib/auth/routes";
import { OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/auth/phone";
import {
  BIZORA_PRODUCTION_SITE_URL,
  getPasswordResetRedirectTo,
  PASSWORD_RESET_CALLBACK_PATH,
  PASSWORD_RESET_PATH,
} from "@/lib/site";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("email forgot-password link on login", () => {
  it("shows Forgot password? on the email login form", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/auth/EmailSignInForm.tsx"),
      "utf8",
    );
    expect(source).toContain("Forgot password?");
    expect(source).toContain("authForgotPasswordEmailHref");
  });

  it("places the forgot-password link below the password field", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/auth/EmailSignInForm.tsx"),
      "utf8",
    );
    const passwordIdx = source.indexOf('name="password"');
    const forgotIdx = source.indexOf("Forgot password?");
    const submitIdx = source.indexOf("Sign In with Email");
    expect(passwordIdx).toBeGreaterThan(-1);
    expect(forgotIdx).toBeGreaterThan(passwordIdx);
    expect(submitIdx).toBeGreaterThan(forgotIdx);
  });
});

describe("forgot-password page", () => {
  it("renders the email reset request page with expected copy", () => {
    const form = readFileSync(
      resolve(process.cwd(), "components/auth/EmailForgotPasswordForm.tsx"),
      "utf8",
    );
    expect(form).toContain("Reset your password");
    expect(form).toContain(
      "Enter the email address associated with your Bizora account",
    );
    expect(form).toContain("Send reset link");
    expect(form).toContain("Back to login");
    expect(form).toContain("resetPasswordForEmail");
  });

  it("shows reset-link-sent success state after a successful request", () => {
    const form = readFileSync(
      resolve(process.cwd(), "components/auth/EmailForgotPasswordForm.tsx"),
      "utf8",
    );
    expect(form).toContain('setView("sent")');
    expect(form).toContain("AUTH_PASSWORD_RESET_SENT_HEADING");
    expect(form).toContain("AUTH_PASSWORD_RESET_SENT");
    expect(form).toContain("getPasswordResetResendButtonState");
    expect(AUTH_PASSWORD_RESET_SENT_HEADING).toBe("Reset link sent");
    expect(
      getPasswordResetResendButtonState({ resendSeconds: 0, loading: false })
        .label,
    ).toBe("Resend reset link");
  });

  it("temporarily disables resend after success, then re-enables", () => {
    expect(PASSWORD_RESET_RESEND_COOLDOWN_SECONDS).toBe(
      OTP_RESEND_COOLDOWN_SECONDS,
    );
    expect(PASSWORD_RESET_RESEND_COOLDOWN_SECONDS).toBe(60);

    const cooling = getPasswordResetResendButtonState({
      resendSeconds: 45,
      loading: false,
    });
    expect(cooling.disabled).toBe(true);
    expect(cooling.label).toBe("Resend reset link (45s)");

    const ready = getPasswordResetResendButtonState({
      resendSeconds: 0,
      loading: false,
    });
    expect(ready.disabled).toBe(false);
    expect(ready.label).toBe("Resend reset link");

    const form = readFileSync(
      resolve(process.cwd(), "components/auth/EmailForgotPasswordForm.tsx"),
      "utf8",
    );
    expect(form).toContain("PASSWORD_RESET_RESEND_COOLDOWN_SECONDS");
    expect(form).toContain("getPasswordResetResendButtonState");
  });

  it("keeps Back to login on the canonical email sign-in route", () => {
    const form = readFileSync(
      resolve(process.cwd(), "components/auth/EmailForgotPasswordForm.tsx"),
      "utf8",
    );
    expect(form).toContain("authSignInHref");
    expect(form).toContain("AUTH_SIGN_IN_PATH");
    expect(form).toContain("Back to login");
    expect(AUTH_SIGN_IN_PATH).toBe("/sign-in");
    expect(form).not.toMatch(/href=["']\/login["']/);
  });

  it("requires a valid email before requesting a reset", () => {
    expect(validateResetEmail("")).toBe("Please enter your email address.");
    expect(validateResetEmail("not-an-email")).toBe(
      "Please enter a valid email address.",
    );
    expect(validateResetEmail("seller@example.com")).toBeNull();
  });

  it("calls resetPasswordForEmail with production-safe redirectTo", () => {
    const form = readFileSync(
      resolve(process.cwd(), "components/auth/EmailForgotPasswordForm.tsx"),
      "utf8",
    );
    expect(form).toContain("getPasswordResetRedirectTo");
    expect(form).toContain("resetPasswordForEmail");
    expect(form).not.toContain("window.location.origin");
  });
});

describe("password reset redirect URL", () => {
  it("uses production site URL and never localhost when configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://bizoraindia.com");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    const redirectTo = getPasswordResetRedirectTo();
    expect(redirectTo).toBe(
      `https://bizoraindia.com${PASSWORD_RESET_CALLBACK_PATH}`,
    );
    expect(redirectTo).not.toContain("localhost");
  });

  it("uses localhost for local development when configured", () => {
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
    const redirectTo = getPasswordResetRedirectTo();
    expect(redirectTo.startsWith(BIZORA_PRODUCTION_SITE_URL)).toBe(true);
    expect(redirectTo).not.toContain("localhost");
  });
});

describe("password reset privacy", () => {
  it("always uses a generic success message that does not reveal account existence", () => {
    expect(AUTH_PASSWORD_RESET_SENT).toContain(
      "If an account exists for this email address",
    );
    expect(AUTH_PASSWORD_RESET_SENT).toContain("inbox and spam folder");
    expect(AUTH_PASSWORD_RESET_SENT.toLowerCase()).not.toContain("not registered");
    expect(AUTH_PASSWORD_RESET_SENT.toLowerCase()).not.toContain(
      "no account",
    );

    const unknownUser = mapPasswordResetRequestError({
      message: "User not found",
      code: "user_not_found",
    });
    expect(unknownUser.revealGenericSuccess).toBe(true);
    expect(unknownUser.message).toBe(AUTH_PASSWORD_RESET_SENT);

    const ok = mapPasswordResetRequestError(null);
    expect(ok.message).toBe(AUTH_PASSWORD_RESET_SENT);
  });
});

describe("reset password page", () => {
  it("renders set-new-password UI and uses updateUser", () => {
    const page = readFileSync(
      resolve(process.cwd(), "app/auth/reset-password/page.tsx"),
      "utf8",
    );
    const form = readFileSync(
      resolve(process.cwd(), "components/auth/EmailResetPasswordForm.tsx"),
      "utf8",
    );
    expect(page).toContain("EmailResetPasswordForm");
    expect(form).toContain("Set a new password");
    expect(form).toContain("Update password");
    expect(form).toContain("updateUser");
    expect(form).toContain("getUser");
    expect(form).toContain("AUTH_PASSWORD_UPDATED");
    expect(form).toContain("Sign in to Bizora");
  });

  it("validates password requirements before update", () => {
    expect(validatePasswordPair("", "x")).toBe("Please enter a new password.");
    expect(validatePasswordPair("password1", "")).toBe(
      "Please confirm your new password.",
    );
    expect(validatePasswordPair("short", "short")).toMatch(/at least 8/i);
    expect(validatePasswordPair("password1", "password2")).toBe(
      "Your passwords don't match.",
    );
    expect(validatePasswordPair("password1", "password1")).toBeNull();
  });

  it("verifies recovery session before allowing password update", () => {
    const form = readFileSync(
      resolve(process.cwd(), "components/auth/EmailResetPasswordForm.tsx"),
      "utf8",
    );
    expect(form).toContain("getUser");
    expect(form).toContain('setView("invalid")');
    expect(form).toContain("updateUser({");
    expect(form).toContain("password: newPassword");
    // updateUser is only reached after an authenticated user check in handleSetPassword.
    expect(form).toMatch(
      /async function handleSetPassword[\s\S]*getUser\(\)[\s\S]*if \(!user\)[\s\S]*updateUser/,
    );
  });
});

describe("auth callback recovery handling", () => {
  it("routes recovery through dedicated callback that never uses sign-in error=auth", () => {
    const recovery = readFileSync(
      resolve(process.cwd(), "app/auth/callback/reset-password/route.ts"),
      "utf8",
    );
    const shared = readFileSync(
      resolve(process.cwd(), "app/auth/callback/route.ts"),
      "utf8",
    );
    const helper = readFileSync(
      resolve(process.cwd(), "lib/auth/auth-callback.ts"),
      "utf8",
    );
    expect(recovery).toContain("exchangeAuthParamsAndRedirect");
    expect(recovery).toContain("passwordResetFailureRedirect");
    expect(recovery).not.toContain("error=auth");
    expect(shared).toContain("passwordResetFailureRedirect");
    expect(helper).toContain("exchangeCodeForSession");
    expect(helper).toContain("/auth/forgot-password?error=invalid_link");
    expect(PASSWORD_RESET_PATH).toBe("/auth/reset-password");
  });
});

describe("existing auth flows remain intact", () => {
  it("keeps email login and signup paths", () => {
    const signIn = readFileSync(
      resolve(process.cwd(), "components/auth/EmailSignInForm.tsx"),
      "utf8",
    );
    const signUp = readFileSync(
      resolve(process.cwd(), "components/auth/EmailSignUpForm.tsx"),
      "utf8",
    );
    expect(signIn).toContain("signInWithPassword");
    expect(signUp).toContain("auth.signUp");
    expect(signUp).toContain("getAuthEmailRedirectTo");
  });

  it("keeps phone OTP forgot-password and signup unchanged", () => {
    const phoneForgot = readFileSync(
      resolve(process.cwd(), "components/auth/ForgotPasswordFlow.tsx"),
      "utf8",
    );
    const phoneSignIn = readFileSync(
      resolve(process.cwd(), "components/auth/PhoneSignInForm.tsx"),
      "utf8",
    );
    const phoneSignUp = readFileSync(
      resolve(process.cwd(), "components/auth/PhoneSignUpFlow.tsx"),
      "utf8",
    );
    expect(phoneForgot).toContain("signInWithOtp");
    expect(phoneForgot).toContain("verifyOtp");
    expect(phoneForgot).not.toContain("resetPasswordForEmail");
    expect(phoneSignIn).toContain("/forgot-password");
    expect(phoneSignUp).not.toContain("resetPasswordForEmail");
    expect(phoneSignUp).not.toContain("getPasswordResetRedirectTo");
  });
});
