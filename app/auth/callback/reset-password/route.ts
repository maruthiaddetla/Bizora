import { type NextRequest } from "next/server";
import {
  exchangeAuthParamsAndRedirect,
  logAuthCallbackDiagnostic,
  passwordResetFailureRedirect,
  recoverySuccessPath,
} from "@/lib/auth/auth-callback";

/**
 * Dedicated password-recovery callback.
 * Uses a path that does not rely on a fragile `next` query param surviving
 * Supabase's redirect, and attaches session cookies to the redirect response.
 */
export async function GET(request: NextRequest) {
  const result = await exchangeAuthParamsAndRedirect(
    request,
    recoverySuccessPath(),
  );

  logAuthCallbackDiagnostic({
    flow: "password_recovery",
    hasCode: result.hasCode,
    hasTokenHash: result.hasTokenHash,
    type: result.type,
    nextPath: recoverySuccessPath(),
    exchangeOk: result.ok,
    errorCode: result.errorCode,
  });

  if (!result.ok || !result.response) {
    return passwordResetFailureRedirect();
  }

  return result.response;
}
