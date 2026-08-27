/**
 * Contract for Bizora's fail-closed Supabase Send SMS Auth Hook.
 * Signup OTP remains 2Factor AUTOGEN/VERIFY — this hook must never claim
 * Supabase Auth SMS was delivered.
 */

export const AUTH_SEND_SMS_HOOK_DISABLED_MESSAGE =
  "Supabase Auth SMS delivery is disabled. Bizora uses an external OTP provider for verification codes.";

export type AuthSendSmsHookErrorResponse = {
  error: {
    http_code: number;
    message: string;
  };
};

/** Payload returned by public.auth_send_sms_hook for every Supabase SMS attempt. */
export function buildFailClosedSendSmsHookResponse(): AuthSendSmsHookErrorResponse {
  return {
    error: {
      http_code: 403,
      message: AUTH_SEND_SMS_HOOK_DISABLED_MESSAGE,
    },
  };
}

/**
 * Bizora does not deliver Supabase-generated Auth SMS OTPs through this hook.
 * Any verified Send SMS hook invocation must be rejected (fail closed).
 */
export function shouldFailClosedSupabaseAuthSms(): true {
  return true;
}
