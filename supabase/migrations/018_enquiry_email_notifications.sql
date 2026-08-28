-- Bizora Phase 10A: seller enquiry email notifications (preferences + delivery ledger)
-- Additive; does not modify auth, listing lifecycle, or public seller privacy.
-- WhatsApp channels are intentionally omitted until a later phase.

-- ---------------------------------------------------------------------------
-- Notification preferences (1:1 with auth.users / profiles)
-- ---------------------------------------------------------------------------
create table public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row
  execute function public.set_updated_at();

comment on table public.notification_preferences is
  'Per-user notification channel preferences. WhatsApp fields deferred to a later phase.';

-- Default preferences for existing users
insert into public.notification_preferences (user_id)
select p.id
from public.profiles p
on conflict (user_id) do nothing;

-- Auto-create preferences when a profile is created (via auth signup trigger)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'buyer')
  on conflict (id) do nothing;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Notification delivery ledger (idempotent outbound channels)
-- ---------------------------------------------------------------------------
create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  channel text not null
    check (channel in ('email')),
  status text not null default 'PENDING'
    check (status in ('PENDING', 'SENT', 'FAILED', 'SKIPPED', 'DISABLED')),
  provider_message_id text,
  attempts integer not null default 0,
  last_error_code text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_deliveries_notification_channel_key
    unique (notification_id, channel)
);

create index notification_deliveries_notification_id_idx
  on public.notification_deliveries (notification_id);

create index notification_deliveries_status_idx
  on public.notification_deliveries (status);

create trigger notification_deliveries_set_updated_at
  before update on public.notification_deliveries
  for each row
  execute function public.set_updated_at();

comment on table public.notification_deliveries is
  'Outbound notification delivery attempts. Written server-side via service role only.';

-- ---------------------------------------------------------------------------
-- RLS: notification_preferences
-- ---------------------------------------------------------------------------
alter table public.notification_preferences enable row level security;

drop policy if exists "Users read own notification preferences" on public.notification_preferences;
drop policy if exists "Users update own notification preferences" on public.notification_preferences;
drop policy if exists "Admins read all notification preferences" on public.notification_preferences;

create policy "Users read own notification preferences"
  on public.notification_preferences
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users update own notification preferences"
  on public.notification_preferences
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins read all notification preferences"
  on public.notification_preferences
  for select
  to authenticated
  using (public.is_admin());

-- No INSERT for clients — created by handle_new_user / backfill.

-- ---------------------------------------------------------------------------
-- RLS: notification_deliveries (server-only writes; admin read for diagnostics)
-- ---------------------------------------------------------------------------
alter table public.notification_deliveries enable row level security;

drop policy if exists "Admins read notification deliveries" on public.notification_deliveries;

create policy "Admins read notification deliveries"
  on public.notification_deliveries
  for select
  to authenticated
  using (public.is_admin());

-- No INSERT/UPDATE/DELETE for authenticated clients — service role only.
