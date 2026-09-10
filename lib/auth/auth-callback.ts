import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { AUTH_SIGN_IN_PATH } from "@/lib/auth/routes";
import { getSiteUrl, PASSWORD_RESET_PATH } from "@/lib/site";

export type AuthCallbackExchangeResult = {
  ok: boolean;
  /** Redirect response with session cookies attached when ok. */
  response: NextResponse | null;
  errorCode?: string;
  hasCode: boolean;
  hasTokenHash: boolean;
  type: string | null;
};

function absoluteAppUrl(pathWithQuery: string): string {
  const base = getSiteUrl().replace(/\/$/, "");
  const path = pathWithQuery.startsWith("/")
    ? pathWithQuery
    : `/${pathWithQuery}`;
  return `${base}${path}`;
}

function sanitizeAuthErrorCode(
  error: { message?: string; code?: string; name?: string } | null,
): string {
  const code = (error?.code ?? error?.name ?? "").toLowerCase();
  if (code) return code.slice(0, 64);
  const message = (error?.message ?? "").toLowerCase();
  if (message.includes("verifier")) return "pkce_verifier";
  if (message.includes("expired")) return "expired";
  if (message.includes("invalid")) return "invalid";
  return "exchange_failed";
}

/**
 * Build a Supabase server client that writes auth cookies onto a specific
 * NextResponse (required for Route Handler redirects on Next.js 15+).
 */
export function createSupabaseCallbackClient(
  request: NextRequest,
  response: NextResponse,
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

/**
 * Exchange a PKCE `code` or `token_hash`+`type` from the request, attaching
 * session cookies to a redirect response aimed at `successPath`.
 */
export async function exchangeAuthParamsAndRedirect(
  request: NextRequest,
  successPath: string,
): Promise<AuthCallbackExchangeResult> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  const hasCode = Boolean(code);
  const hasTokenHash = Boolean(token_hash);

  if (!hasCode && !(hasTokenHash && type)) {
    return {
      ok: false,
      response: null,
      errorCode: "missing_code",
      hasCode,
      hasTokenHash,
      type,
    };
  }

  const successUrl = absoluteAppUrl(successPath);
  const response = NextResponse.redirect(successUrl);
  const supabase = createSupabaseCallbackClient(request, response);

  if (!supabase) {
    return {
      ok: false,
      response: null,
      errorCode: "misconfigured",
      hasCode,
      hasTokenHash,
      type,
    };
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return {
        ok: false,
        response: null,
        errorCode: sanitizeAuthErrorCode(error),
        hasCode,
        hasTokenHash,
        type,
      };
    }

    return {
      ok: true,
      response,
      hasCode,
      hasTokenHash,
      type,
    };
  }

  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: token_hash!,
  });

  if (error) {
    return {
      ok: false,
      response: null,
      errorCode: sanitizeAuthErrorCode(error),
      hasCode,
      hasTokenHash,
      type,
    };
  }

  return {
    ok: true,
    response,
    hasCode,
    hasTokenHash,
    type,
  };
}

export function resolveEmailConfirmNext(
  rawNext: string | null,
): string {
  return getSafeNextPath(rawNext, "/");
}

export function isRecoveryType(type: string | null | undefined): boolean {
  return (type ?? "").toLowerCase() === "recovery";
}

export function passwordResetFailureRedirect(): NextResponse {
  return NextResponse.redirect(
    absoluteAppUrl("/auth/forgot-password?error=invalid_link"),
  );
}

export function authConfigErrorRedirect(): NextResponse {
  return NextResponse.redirect(
    absoluteAppUrl(`${AUTH_SIGN_IN_PATH}?error=config`),
  );
}

export function authExchangeErrorRedirect(): NextResponse {
  return NextResponse.redirect(
    absoluteAppUrl(`${AUTH_SIGN_IN_PATH}?error=auth`),
  );
}

export function recoverySuccessPath(): string {
  return PASSWORD_RESET_PATH;
}

/** Safe diagnostic fields only — never tokens or full URLs with secrets. */
export function logAuthCallbackDiagnostic(fields: {
  flow: "email_confirm" | "password_recovery";
  hasCode: boolean;
  hasTokenHash: boolean;
  type: string | null;
  nextPath: string;
  exchangeOk: boolean;
  errorCode?: string;
}): void {
  console.warn("[Bizora] auth callback", {
    flow: fields.flow,
    hasCode: fields.hasCode,
    hasTokenHash: fields.hasTokenHash,
    type: fields.type,
    nextPath: fields.nextPath,
    exchangeOk: fields.exchangeOk,
    errorCode: fields.errorCode ?? null,
  });
}
