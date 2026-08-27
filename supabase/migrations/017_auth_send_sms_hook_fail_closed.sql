-- Bizora: fail-closed Send SMS Auth Hook (no Twilio).
--
-- Why:
--   Hosted Supabase requires Phone auth enabled for
--   signInWithPassword({ phone, password }). Enabling Phone expects either a
--   built-in SMS provider (e.g. Twilio) or the Send SMS Auth Hook.
--
--   Bizora signup OTP is delivered exclusively by 2Factor (AUTOGEN/VERIFY) outside
--   Supabase Auth SMS. This hook deliberately refuses to deliver any
--   Supabase-generated Auth SMS so we never silently claim an SMS was sent.
--
-- Dashboard (after applying this migration):
--   1. Authentication → Hooks → Send SMS Hook
--      - Enable
--      - Hook type: Postgres
--      - Function: public.auth_send_sms_hook
--   2. Authentication → Providers → Phone
--      - Enable Phone provider
--      - Do NOT add Twilio credentials while the SMS hook is enabled
--        (if Save still validates Twilio fields, use Supabase's temporary
--        workaround: disable hook → enter format-valid dummy Twilio values →
--        enable Phone → Save → re-enable SMS hook)
--
-- Signup behavior:
--   Unchanged. sendPhoneSignupOtpAction still uses 2Factor only.
--   signInWithPassword({ phone, password }) can work once Phone is enabled.
--
-- Side effect:
--   Forgot-password flows that call supabase.auth.signInWithOtp({ phone })
--   will fail closed until migrated to 2Factor (they already cannot work with
--   Phone disabled / no SMS provider).

create or replace function public.auth_send_sms_hook(event jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
begin
  -- Do not read, store, or log OTP / phone contents from the event payload.
  -- Fail closed: Bizora does not deliver Supabase Auth SMS OTPs.
  return jsonb_build_object(
    'error',
    jsonb_build_object(
      'http_code', 403,
      'message',
      'Supabase Auth SMS delivery is disabled. Bizora uses an external OTP provider for verification codes.'
    )
  );
end;
$$;

comment on function public.auth_send_sms_hook(jsonb) is
  'Fail-closed Send SMS Auth Hook. Enables Phone provider without Twilio; refuses Supabase Auth SMS delivery because OTP is handled by 2Factor.';

revoke all on function public.auth_send_sms_hook(jsonb) from public;
revoke all on function public.auth_send_sms_hook(jsonb) from anon, authenticated;
grant execute on function public.auth_send_sms_hook(jsonb) to supabase_auth_admin;

grant usage on schema public to supabase_auth_admin;
