export type NotificationDeliveryChannel = "email";

export type NotificationDeliveryStatus =
  | "PENDING"
  | "SENT"
  | "FAILED"
  | "SKIPPED"
  | "DISABLED";

export type NotificationDeliveryRow = {
  id: string;
  notification_id: string;
  channel: NotificationDeliveryChannel;
  status: NotificationDeliveryStatus;
  provider_message_id: string | null;
  attempts: number;
  last_error_code: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationPreferencesRow = {
  user_id: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  created_at: string;
  updated_at: string;
};
