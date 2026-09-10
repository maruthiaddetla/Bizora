import { type NextRequest, NextResponse } from "next/server";
import { completeAuthProfile } from "@/lib/auth/post-auth";
import {
  authConfigErrorRedirect,
  authExchangeErrorRedirect,
  createSupabaseCallbackClient,
  exchangeAuthParamsAndRedirect,
  isRecoveryType,
  logAuthCallbackDiagnostic,
  passwordResetFailureRedirect,
  recoverySuccessPath,
  resolveEmailConfirmNext,
} from "@/lib/auth/auth-callback";
import { getSiteUrl, PASSWORD_RESET_PATH } from "@/lib/site";

/**
 * Shared auth callback for email confirmation (and legacy recovery links that
 * still include next=/auth/reset-password or type=recovery).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const rawNext = requestUrl.searchParams.get("next");
  const type = requestUrl.searchParams.get("type");
  const next = resolveEmailConfirmNext(rawNext);

  const isPasswordRecovery =
    next === PASSWORD_RESET_PATH || isRecoveryType(type);

  const successPath = isPasswordRecovery ? recoverySuccessPath() : next;

  const result = await exchangeAuthParamsAndRedirect(request, successPath);

  logAuthCallbackDiagnostic({
    flow: isPasswordRecovery ? "password_recovery" : "email_confirm",
    hasCode: result.hasCode,
    hasTokenHash: result.hasTokenHash,
    type: result.type,
    nextPath: successPath,
    exchangeOk: result.ok,
    errorCode: result.errorCode,
  });

  if (!result.hasCode && !result.hasTokenHash) {
    // No auth params — send the user to a safe internal destination.
    return NextResponse.redirect(
      `${getSiteUrl().replace(/\/$/, "")}${successPath}`,
    );
  }

  if (!result.ok || !result.response) {
    if (result.errorCode === "misconfigured") {
      return authConfigErrorRedirect();
    }
    if (isPasswordRecovery) {
      return passwordResetFailureRedirect();
    }
    return authExchangeErrorRedirect();
  }

  // Email confirmation: ensure profile exists. Recovery: skip — reset page follows.
  if (!isPasswordRecovery) {
    const supabase = createSupabaseCallbackClient(request, result.response);
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await completeAuthProfile(supabase, user);
      }
    }
  }

  return result.response;
}
