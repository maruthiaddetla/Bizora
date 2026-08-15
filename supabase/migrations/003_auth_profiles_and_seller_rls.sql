-- Bizora Phase 4A: profiles, ownership FK, listing workflow fields, RLS foundation
-- Safe additive migration against current schema + seed data.
-- Does NOT assign owners to existing seed listings (seller_id stays nullable).

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'buyer'
    check (role in ('buyer', 'seller', 'broker', 'admin')),
  full_name text,
  phone text,
  company_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup (idempotent)
-- ---------------------------------------------------------------------------
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
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER, fixed search_path — avoid RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

create or replace function public.is_business_owner(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.businesses b
    where b.id = p_business_id
      and b.seller_id = auth.uid()
  );
$$;

revoke all on function public.is_business_owner(uuid) from public;
grant execute on function public.is_business_owner(uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Business ownership FK + index (nullable for seed/demo listings)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'businesses_seller_id_fkey'
  ) then
    alter table public.businesses
      add constraint businesses_seller_id_fkey
      foreign key (seller_id)
      references public.profiles (id)
      on delete set null;
  end if;
end $$;

create index if not exists businesses_seller_id_idx
  on public.businesses (seller_id);

-- ---------------------------------------------------------------------------
-- Listing workflow fields
-- ---------------------------------------------------------------------------
alter table public.businesses
  add column if not exists rejection_reason text,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles (id);

-- Expand status check to include rejected (preserve existing rows)
alter table public.businesses
  drop constraint if exists businesses_status_check;

alter table public.businesses
  add constraint businesses_status_check
  check (status in ('draft', 'pending', 'published', 'rejected', 'sold'));

-- ---------------------------------------------------------------------------
-- Guard: sellers cannot escalate privileges / self-publish
-- Admins (and service role) bypass via is_admin()
-- ---------------------------------------------------------------------------
create or replace function public.enforce_business_seller_guards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service role / no JWT: allow (migrations, seeds, trusted server jobs)
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  -- Ownership immutable for non-admins
  if tg_op = 'UPDATE' and new.seller_id is distinct from old.seller_id then
    raise exception 'sellers cannot change seller_id';
  end if;

  if tg_op = 'INSERT' then
    if new.seller_id is distinct from auth.uid() then
      raise exception 'seller_id must equal the authenticated user';
    end if;
    if new.status is distinct from 'draft' then
      raise exception 'new listings must start as draft';
    end if;
    if new.is_premium is true then
      raise exception 'sellers cannot set is_premium';
    end if;
    if new.is_verified is true then
      raise exception 'sellers cannot set is_verified';
    end if;
    if new.reviewed_by is not null or new.reviewed_at is not null then
      raise exception 'sellers cannot set review fields';
    end if;
    return new;
  end if;

  -- UPDATE guards for non-admins
  if new.is_premium is distinct from old.is_premium then
    raise exception 'sellers cannot change is_premium';
  end if;

  if new.is_verified is distinct from old.is_verified then
    raise exception 'sellers cannot change is_verified';
  end if;

  if new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at then
    raise exception 'sellers cannot change review fields';
  end if;

  -- Status transitions sellers may perform:
  --   draft|rejected → draft|rejected|pending
  -- Sellers may NOT set published or sold.
  if new.status is distinct from old.status then
    if new.status not in ('draft', 'rejected', 'pending') then
      raise exception 'sellers cannot set status to %', new.status;
    end if;
    if old.status not in ('draft', 'rejected') then
      raise exception 'sellers can only change status from draft or rejected';
    end if;
  end if;

  -- Clear rejection metadata when resubmitting
  if new.status = 'pending' and old.status in ('draft', 'rejected') then
    new.submitted_at := coalesce(new.submitted_at, now());
    if old.status = 'rejected' then
      new.rejection_reason := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists businesses_seller_guards on public.businesses;

create trigger businesses_seller_guards
  before insert or update on public.businesses
  for each row
  execute function public.enforce_business_seller_guards();

-- Prevent non-admins from changing their own role to admin/seller escalation abuse
create or replace function public.enforce_profile_role_guards()
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

  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    raise exception 'users cannot change their own role';
  end if;

  if tg_op = 'INSERT' and new.role is distinct from 'buyer' and new.id = auth.uid() then
    -- Signup trigger runs as definer with no auth.uid() typically;
    -- if a user somehow inserts, force buyer.
    new.role := 'buyer';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_role_guards on public.profiles;

create trigger profiles_role_guards
  before insert or update on public.profiles
  for each row
  execute function public.enforce_profile_role_guards();

-- ---------------------------------------------------------------------------
-- RLS: profiles
-- ---------------------------------------------------------------------------
drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Admins read all profiles" on public.profiles;

create policy "Users read own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "Users update own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- No insert policy for authenticated users — created by trigger / service role

-- ---------------------------------------------------------------------------
-- RLS: businesses (replace / extend existing read policy)
-- ---------------------------------------------------------------------------
drop policy if exists "Public read published businesses" on public.businesses;
drop policy if exists "Owners read own businesses" on public.businesses;
drop policy if exists "Admins read all businesses" on public.businesses;
drop policy if exists "Sellers insert own draft businesses" on public.businesses;
drop policy if exists "Sellers update own draft or rejected businesses" on public.businesses;
drop policy if exists "Admins update businesses" on public.businesses;
drop policy if exists "Sellers delete own draft or rejected businesses" on public.businesses;
drop policy if exists "Admins delete businesses" on public.businesses;

-- SELECT: published for everyone; own rows for owners; all for admin
create policy "Public read published businesses"
  on public.businesses
  for select
  to anon, authenticated
  using (
    status = 'published'
    or seller_id = auth.uid()
    or public.is_admin()
  );

create policy "Sellers insert own draft businesses"
  on public.businesses
  for insert
  to authenticated
  with check (
    seller_id = auth.uid()
    and status = 'draft'
  );

create policy "Sellers update own draft or rejected businesses"
  on public.businesses
  for update
  to authenticated
  using (
    seller_id = auth.uid()
    and status in ('draft', 'rejected')
  )
  with check (
    seller_id = auth.uid()
    and status in ('draft', 'rejected', 'pending')
  );

create policy "Admins update businesses"
  on public.businesses
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Sellers delete own draft or rejected businesses"
  on public.businesses
  for delete
  to authenticated
  using (
    seller_id = auth.uid()
    and status in ('draft', 'rejected')
  );

create policy "Admins delete businesses"
  on public.businesses
  for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- RLS: business_images
-- ---------------------------------------------------------------------------
drop policy if exists "Public read published business images" on public.business_images;
drop policy if exists "Owners read own business images" on public.business_images;
drop policy if exists "Owners insert own business images" on public.business_images;
drop policy if exists "Owners update own business images" on public.business_images;
drop policy if exists "Owners delete own business images" on public.business_images;
drop policy if exists "Admins manage business images" on public.business_images;

create policy "Public read published business images"
  on public.business_images
  for select
  to anon, authenticated
  using (
    public.is_admin()
    or public.is_business_owner(business_id)
    or exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.status = 'published'
    )
  );

create policy "Owners insert own business images"
  on public.business_images
  for insert
  to authenticated
  with check (
    public.is_admin()
    or public.is_business_owner(business_id)
  );

create policy "Owners update own business images"
  on public.business_images
  for update
  to authenticated
  using (
    public.is_admin()
    or public.is_business_owner(business_id)
  )
  with check (
    public.is_admin()
    or public.is_business_owner(business_id)
  );

create policy "Owners delete own business images"
  on public.business_images
  for delete
  to authenticated
  using (
    public.is_admin()
    or public.is_business_owner(business_id)
  );
