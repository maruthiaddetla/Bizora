-- Bizora Phase 8: seller public profiles + avatar storage
-- Additive; does not modify migrations 001–010.
-- Does not weaken existing ownership RLS on businesses / enquiries / favorites / notifications.

-- ---------------------------------------------------------------------------
-- Profile columns for public seller MVP
-- company_name already exists (003). full_name remains the signup name fallback.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists display_name text,
  add column if not exists bio text,
  add column if not exists avatar_storage_path text,
  add column if not exists website text,
  add column if not exists city text;

comment on column public.profiles.display_name is
  'Public display name; falls back to full_name when null/blank.';
comment on column public.profiles.bio is
  'Public seller/about bio (max length enforced in app).';
comment on column public.profiles.avatar_storage_path is
  'Path within profile-avatars bucket: {user_id}/avatar.{ext}.';
comment on column public.profiles.website is
  'Optional public website URL.';
comment on column public.profiles.city is
  'Optional public city label (free text for MVP).';

-- ---------------------------------------------------------------------------
-- Immutable profile fields on UPDATE (id, role via existing guards, created_at)
-- ---------------------------------------------------------------------------
create or replace function public.enforce_profile_column_guards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id then
      raise exception 'cannot change profile id';
    end if;
    if new.created_at is distinct from old.created_at then
      raise exception 'cannot change created_at';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_column_guards on public.profiles;

create trigger profiles_column_guards
  before update on public.profiles
  for each row
  execute function public.enforce_profile_column_guards();

-- Role changes remain governed by enforce_profile_role_guards (004/008)
-- and promote_to_seller() — left unchanged.

-- ---------------------------------------------------------------------------
-- Public seller profile view (safe columns only — no email/phone/role)
-- security_invoker=false so the view owner bypasses row RLS while exposing
-- only the projected columns. Authenticated users still use profiles for
-- their own private fields via existing SELECT policy.
-- ---------------------------------------------------------------------------
drop view if exists public.public_seller_profiles;

create view public.public_seller_profiles
with (security_invoker = false)
as
select
  p.id,
  coalesce(
    nullif(trim(p.display_name), ''),
    nullif(trim(p.full_name), ''),
    'Seller'
  ) as display_name,
  nullif(trim(p.company_name), '') as company_name,
  nullif(trim(p.bio), '') as bio,
  p.avatar_storage_path,
  nullif(trim(p.website), '') as website,
  nullif(trim(p.city), '') as city,
  p.created_at as member_since
from public.profiles p
where p.role in ('seller', 'broker', 'admin');

revoke all on public.public_seller_profiles from public;
grant select on public.public_seller_profiles to anon, authenticated;

comment on view public.public_seller_profiles is
  'Safe public seller fields only. No email, phone, role, or auth.users data.';

-- ---------------------------------------------------------------------------
-- Storage bucket: profile-avatars (private; SELECT allowed for display)
-- Path: {auth.uid()}/avatar.{ext}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Owners upload profile avatars" on storage.objects;
drop policy if exists "Owners update profile avatars" on storage.objects;
drop policy if exists "Owners delete profile avatars" on storage.objects;
drop policy if exists "Public read profile avatars" on storage.objects;

create policy "Owners upload profile avatars"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners update profile avatars"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners delete profile avatars"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow signed URL generation / read for public profile pages
create policy "Public read profile avatars"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'profile-avatars');
