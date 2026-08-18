-- Bizora Phase 4E: buyer ↔ seller enquiries
-- Additive; does not modify migrations 001–006 or seed data.

-- ---------------------------------------------------------------------------
-- Enquiries table
-- ---------------------------------------------------------------------------
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  status text not null default 'new'
    check (status in ('new', 'read', 'responded', 'closed')),
  seller_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz
);

create index enquiries_business_id_idx on public.enquiries (business_id);
create index enquiries_buyer_id_idx on public.enquiries (buyer_id);
create index enquiries_seller_id_idx on public.enquiries (seller_id);
create index enquiries_status_idx on public.enquiries (status);
create index enquiries_created_at_idx on public.enquiries (created_at desc);

create trigger enquiries_set_updated_at
  before update on public.enquiries
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- INSERT: derive seller_id from business; enforce published + ownership rules
-- ---------------------------------------------------------------------------
create or replace function public.enforce_enquiry_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not public.is_admin() then
    if new.buyer_id is distinct from auth.uid() then
      raise exception 'buyer_id must equal the authenticated user';
    end if;
  end if;

  select b.seller_id, b.status
  into v_seller_id, v_status
  from public.businesses b
  where b.id = new.business_id;

  if not found then
    raise exception 'business not found';
  end if;

  if v_seller_id is null then
    raise exception 'business has no seller';
  end if;

  if v_status is distinct from 'published' then
    raise exception 'enquiries only allowed for published businesses';
  end if;

  if new.buyer_id = v_seller_id then
    raise exception 'cannot send enquiry on own listing';
  end if;

  -- Always derive seller_id from the business (never trust client)
  new.seller_id := v_seller_id;
  new.status := 'new';
  new.seller_response := null;
  new.responded_at := null;

  return new;
end;
$$;

drop trigger if exists enquiries_insert_guard on public.enquiries;

create trigger enquiries_insert_guard
  before insert on public.enquiries
  for each row
  execute function public.enforce_enquiry_insert();

-- ---------------------------------------------------------------------------
-- UPDATE: sellers may respond/read/close; buyers cannot mutate; admins bypass
-- ---------------------------------------------------------------------------
create or replace function public.enforce_enquiry_update_guards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if new.buyer_id is distinct from old.buyer_id then
    raise exception 'cannot change buyer_id';
  end if;

  if new.seller_id is distinct from old.seller_id then
    raise exception 'cannot change seller_id';
  end if;

  if new.business_id is distinct from old.business_id then
    raise exception 'cannot change business_id';
  end if;

  if new.created_at is distinct from old.created_at then
    raise exception 'cannot change created_at';
  end if;

  if new.message is distinct from old.message then
    raise exception 'cannot change enquiry message';
  end if;

  -- Buyer cannot update enquiries
  if old.buyer_id = auth.uid() and old.seller_id is distinct from auth.uid() then
    raise exception 'buyers cannot update enquiries';
  end if;

  -- Seller updates on own enquiries only (RLS also enforces seller_id)
  if old.seller_id = auth.uid() then
    if old.status = 'closed' then
      if new.status is distinct from old.status
         or new.seller_response is distinct from old.seller_response
         or new.responded_at is distinct from old.responded_at then
        raise exception 'closed enquiries cannot be modified';
      end if;
    end if;

    if new.status not in ('read', 'responded', 'closed') then
      raise exception 'invalid enquiry status transition';
    end if;

    if new.status = 'responded' then
      if new.seller_response is null or length(trim(new.seller_response)) = 0 then
        raise exception 'seller response is required when status is responded';
      end if;
      if new.responded_at is null then
        new.responded_at := now();
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enquiries_update_guard on public.enquiries;

create trigger enquiries_update_guard
  before update on public.enquiries
  for each row
  execute function public.enforce_enquiry_update_guards();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.enquiries enable row level security;

create policy "Buyers read own enquiries"
  on public.enquiries
  for select
  to authenticated
  using (
    buyer_id = auth.uid()
    or public.is_admin()
  );

create policy "Sellers read own enquiries"
  on public.enquiries
  for select
  to authenticated
  using (
    seller_id = auth.uid()
    or public.is_admin()
  );

create policy "Buyers insert own enquiries"
  on public.enquiries
  for insert
  to authenticated
  with check (
    buyer_id = auth.uid()
  );

create policy "Sellers update own enquiries"
  on public.enquiries
  for update
  to authenticated
  using (
    seller_id = auth.uid()
    or public.is_admin()
  )
  with check (
    seller_id = auth.uid()
    or public.is_admin()
  );

create policy "Admins manage enquiries"
  on public.enquiries
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
