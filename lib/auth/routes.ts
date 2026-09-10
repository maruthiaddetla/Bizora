/**
 * Canonical authentication routes for Bizora.
 * Keep navbar, auth forms, and redirects aligned with these paths.
 */
export const AUTH_SIGN_IN_PATH = "/sign-in";
export const AUTH_SIGN_UP_PATH = "/sign-up";
export const AUTH_FORGOT_PASSWORD_PHONE_PATH = "/forgot-password";
export const AUTH_FORGOT_PASSWORD_EMAIL_PATH = "/auth/forgot-password";
export const AUTH_RESET_PASSWORD_PATH = "/auth/reset-password";
export const AUTH_CALLBACK_PATH = "/auth/callback";

export function authSignInHref(nextPath?: string): string {
  if (!nextPath || nextPath === "/") {
    return AUTH_SIGN_IN_PATH;
  }
  return `${AUTH_SIGN_IN_PATH}?next=${encodeURIComponent(nextPath)}`;
}

export function authSignUpHref(nextPath?: string): string {
  if (!nextPath || nextPath === "/") {
    return AUTH_SIGN_UP_PATH;
  }
  return `${AUTH_SIGN_UP_PATH}?next=${encodeURIComponent(nextPath)}`;
}

export function authForgotPasswordEmailHref(nextPath?: string): string {
  if (!nextPath || nextPath === "/") {
    return AUTH_FORGOT_PASSWORD_EMAIL_PATH;
  }
  return `${AUTH_FORGOT_PASSWORD_EMAIL_PATH}?next=${encodeURIComponent(nextPath)}`;
}
