-- Bizora Phase 7: in-app notifications
-- Additive; does not modify migrations 001–009 or weaken existing RLS on other tables.
-- Notifications are created only by security-definer triggers (never by client INSERT).

-- ---------------------------------------------------------------------------
-- Notifications table
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  business_id uuid null references public.businesses (id) on delete cascade,
  enquiry_id uuid null references public.enquiries (id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (
    type in (
      'listing_submitted',
      'listing_approved',
      'listing_rejected',
      'new_enquiry',
      'enquiry_response',
      'listing_sold',
      'listing_resubmitted'
    )
  )
);

create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index notifications_user_unread_created_idx
  on public.notifications (user_id, is_read, created_at desc);

create index notifications_business_id_idx
  on public.notifications (business_id);

create index notifications_enquiry_id_idx
  on public.notifications (enquiry_id);

-- ---------------------------------------------------------------------------
-- UPDATE: allow only is_read to change; never trust client for other columns
-- ---------------------------------------------------------------------------
create or replace function public.enforce_notification_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not public.is_admin() and old.user_id is distinct from auth.uid() then
    raise exception 'cannot update another user''s notification';
  end if;

  if new.user_id is distinct from old.user_id
     or new.type is distinct from old.type
     or new.title is distinct from old.title
     or new.message is distinct from old.message
     or new.business_id is distinct from old.business_id
     or new.enquiry_id is distinct from old.enquiry_id
     or new.created_at is distinct from old.created_at
  then
    raise exception 'only is_read can be updated on notifications';
  end if;

  new.user_id := old.user_id;
  new.type := old.type;
  new.title := old.title;
  new.message := old.message;
  new.business_id := old.business_id;
  new.enquiry_id := old.enquiry_id;
  new.created_at := old.created_at;

  return new;
end;
$$;

drop trigger if exists notifications_update_guard on public.notifications;

create trigger notifications_update_guard
  before update on public.notifications
  for each row
  execute function public.enforce_notification_update();

-- ---------------------------------------------------------------------------
-- Helpers (security definer): insert notifications without trusting clients
-- ---------------------------------------------------------------------------
create or replace function public.notify_user(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_business_id uuid default null,
  p_enquiry_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return;
  end if;

  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    business_id,
    enquiry_id
  )
  values (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_business_id,
    p_enquiry_id
  );
end;
$$;

create or replace function public.notify_admins(
  p_type text,
  p_title text,
  p_message text,
  p_business_id uuid default null,
  p_enquiry_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select p.id
    from public.profiles p
    where p.role = 'admin'
  loop
    perform public.notify_user(
      r.id,
      p_type,
      p_title,
      p_message,
      p_business_id,
      p_enquiry_id
    );
  end loop;
end;
$$;

revoke all on function public.notify_user(uuid, text, text, text, uuid, uuid) from public;
revoke all on function public.notify_admins(text, text, text, uuid, uuid) from public;
-- Invoked only from other security-definer triggers in this schema.

-- ---------------------------------------------------------------------------
-- Business status → notifications
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_business_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_reason text;
  r record;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if old.status is not distinct from new.status then
    return new;
  end if;

  v_title := coalesce(nullif(trim(new.title), ''), 'Untitled listing');

  -- draft → pending: listing_submitted → admins
  if old.status = 'draft' and new.status = 'pending' then
    perform public.notify_admins(
      'listing_submitted',
      'Listing submitted for review',
      format('"%s" was submitted for review and is waiting for approval.', v_title),
      new.id,
      null
    );
    return new;
  end if;

  -- rejected → pending: listing_resubmitted → admins
  if old.status = 'rejected' and new.status = 'pending' then
    perform public.notify_admins(
      'listing_resubmitted',
      'Listing resubmitted for review',
      format('"%s" was resubmitted for review after rejection.', v_title),
      new.id,
      null
    );
    return new;
  end if;

  -- pending → published: listing_approved → seller
  if old.status = 'pending' and new.status = 'published' then
    perform public.notify_user(
      new.seller_id,
      'listing_approved',
      'Listing approved',
      format('Your listing "%s" has been approved and is now published.', v_title),
      new.id,
      null
    );
    return new;
  end if;

  -- pending → rejected: listing_rejected → seller
  if old.status = 'pending' and new.status = 'rejected' then
    v_reason := coalesce(nullif(trim(new.rejection_reason), ''), 'No reason provided.');
    perform public.notify_user(
      new.seller_id,
      'listing_rejected',
      'Listing rejected',
      format('Your listing "%s" was rejected. Reason: %s', v_title, v_reason),
      new.id,
      null
    );
    return new;
  end if;

  -- published → sold: listing_sold → users who favourited the business
  if old.status = 'published' and new.status = 'sold' then
    for r in
      select f.user_id
      from public.favorites f
      where f.business_id = new.id
    loop
      perform public.notify_user(
        r.user_id,
        'listing_sold',
        'Saved listing marked as sold',
        format('A business you saved, "%s", has been marked as sold.', v_title),
        new.id,
        null
      );
    end loop;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists businesses_notify_status on public.businesses;

create trigger businesses_notify_status
  after update of status on public.businesses
  for each row
  execute function public.notify_on_business_status_change();

-- ---------------------------------------------------------------------------
-- Enquiry events → notifications
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_enquiry_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
begin
  select coalesce(nullif(trim(b.title), ''), 'a listing')
  into v_title
  from public.businesses b
  where b.id = new.business_id;

  -- Recipient from trusted enquiry.seller_id (set by insert guard)
  perform public.notify_user(
    new.seller_id,
    'new_enquiry',
    'New enquiry received',
    format('You have a new enquiry about "%s".', coalesce(v_title, 'a listing')),
    new.business_id,
    new.id
  );

  return new;
end;
$$;

drop trigger if exists enquiries_notify_insert on public.enquiries;

create trigger enquiries_notify_insert
  after insert on public.enquiries
  for each row
  execute function public.notify_on_enquiry_insert();

create or replace function public.notify_on_enquiry_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if new.status is distinct from 'responded' then
    return new;
  end if;

  if old.status is not distinct from 'responded' then
    return new;
  end if;

  select coalesce(nullif(trim(b.title), ''), 'a listing')
  into v_title
  from public.businesses b
  where b.id = new.business_id;

  perform public.notify_user(
    new.buyer_id,
    'enquiry_response',
    'Seller responded to your enquiry',
    format('The seller responded to your enquiry about "%s".', coalesce(v_title, 'a listing')),
    new.business_id,
    new.id
  );

  return new;
end;
$$;

drop trigger if exists enquiries_notify_response on public.enquiries;

create trigger enquiries_notify_response
  after update of status on public.enquiries
  for each row
  execute function public.notify_on_enquiry_response();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists "Users read own notifications" on public.notifications;
drop policy if exists "Admins read all notifications" on public.notifications;
drop policy if exists "Users update own notification is_read" on public.notifications;
drop policy if exists "Users delete own notifications" on public.notifications;

create policy "Users read own notifications"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins read all notifications"
  on public.notifications
  for select
  to authenticated
  using (public.is_admin());

create policy "Users update own notification is_read"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own notifications"
  on public.notifications
  for delete
  to authenticated
  using (user_id = auth.uid());

-- No INSERT policy for authenticated/anon — only security-definer triggers insert.
-- No anonymous access.
