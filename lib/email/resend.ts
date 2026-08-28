import { Resend } from "resend";

const DEFAULT_FROM = "Bizora <notifications@bizoraindia.com>";

let resendClient: Resend | null | undefined;

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getEmailFromAddress(): string {
  const configured = process.env.EMAIL_FROM?.trim();
  return configured || DEFAULT_FROM;
}

/**
 * Server-only Resend client. Never import from client components.
 */
export function createResendClient(): Resend | null {
  if (resendClient !== undefined) {
    return resendClient;
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    resendClient = null;
    return null;
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

/** Reset cached client (tests only). */
export function resetResendClientForTests(): void {
  resendClient = undefined;
}

export type SendTransactionalEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendTransactionalEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; errorCode: string };

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput,
): Promise<SendTransactionalEmailResult> {
  const client = createResendClient();
  if (!client) {
    return { ok: false, errorCode: "email_not_configured" };
  }

  const { data, error } = await client.emails.send({
    from: getEmailFromAddress(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    return { ok: false, errorCode: error.name || "resend_send_failed" };
  }

  if (!data?.id) {
    return { ok: false, errorCode: "resend_missing_message_id" };
  }

  return { ok: true, messageId: data.id };
}
