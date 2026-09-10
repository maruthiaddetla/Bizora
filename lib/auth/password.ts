export const MIN_PASSWORD_LENGTH = 8;

/**
 * Shared password + confirmation rules for signup and password reset.
 * Returns a user-facing message, or null when valid.
 */
export function validatePasswordPair(
  password: string,
  confirmPassword: string,
): string | null {
  if (!password) {
    return "Please enter a new password.";
  }
  if (!confirmPassword) {
    return "Please confirm your new password.";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password !== confirmPassword) {
    return "Your passwords don't match.";
  }
  return null;
}
