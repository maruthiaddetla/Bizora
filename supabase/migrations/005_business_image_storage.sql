-- Bizora Phase 4C-2B: business image Storage + tighter image RLS
-- Additive; does not modify seed data or prior migrations.
--
-- Bucket: business-images (PRIVATE)
-- Object path: {auth.uid()}/{business_id}/{image_uuid}.{ext}
-- Canonical path stored in business_images.storage_path (not signed URLs).
-- Seed Unsplash rows keep storage_path NULL and use external image_url.

-- ---------------------------------------------------------------------------
-- business_images: storage_path for Storage-backed images
-- ---------------------------------------------------------------------------
alter table public.business_images
  add column if not exists storage_path text;

comment on column public.business_images.storage_path is
  'Path within business-images bucket: {user_id}/{business_id}/{image_id}.ext. Null for external URLs (seed).';

create unique index if not exists business_images_storage_path_uidx
  on public.business_images (storage_path)
  where storage_path is not null;

-- At most one primary image per business
create unique index if not exists business_images_one_primary_uidx
  on public.business_images (business_id)
  where is_primary;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.owner_can_edit_business_images(p_business_id uuid)
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
      and b.status in ('draft', 'rejected')
  );
$$;

revoke all on function public.owner_can_edit_business_images(uuid) from public;
grant execute on function public.owner_can_edit_business_images(uuid) to authenticated, anon;

create or replace function public.storage_business_id(object_name text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  parts text[];
  business_text text;
begin
  parts := storage.foldername(object_name);
  if array_length(parts, 1) is null or array_length(parts, 1) < 2 then
    return null;
  end if;
  business_text := parts[2];
  if business_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return null;
  end if;
  return business_text::uuid;
end;
$$;

revoke all on function public.storage_business_id(text) from public;
grant execute on function public.storage_business_id(text) to authenticated, anon;

-- Max 8 images per business
create or replace function public.enforce_business_image_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  image_count integer;
begin
  select count(*)::integer into image_count
  from public.business_images
  where business_id = new.business_id;

  if tg_op = 'INSERT' and image_count >= 8 then
    raise exception 'maximum of 8 images per business';
  end if;

  return new;
end;
$$;

drop trigger if exists business_images_count_guard on public.business_images;

create trigger business_images_count_guard
  before insert on public.business_images
  for each row
  execute function public.enforce_business_image_count();

-- Controlled primary flip
create or replace function public.set_primary_business_image(p_image_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select bi.business_id into v_business_id
  from public.business_images bi
  where bi.id = p_image_id;

  if v_business_id is null then
    raise exception 'image not found';
  end if;

  if not public.is_admin() and not public.owner_can_edit_business_images(v_business_id) then
    raise exception 'not allowed to change primary image';
  end if;

  update public.business_images
  set is_primary = false
  where business_id = v_business_id
    and is_primary = true
    and id is distinct from p_image_id;

  update public.business_images
  set is_primary = true
  where id = p_image_id
    and business_id = v_business_id;

  return true;
end;
$$;

revoke all on function public.set_primary_business_image(uuid) from public;
grant execute on function public.set_primary_business_image(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Tighten business_images write RLS: draft/rejected only for owners
-- ---------------------------------------------------------------------------
drop policy if exists "Owners insert own business images" on public.business_images;
drop policy if exists "Owners update own business images" on public.business_images;
drop policy if exists "Owners delete own business images" on public.business_images;

create policy "Owners insert own business images"
  on public.business_images
  for insert
  to authenticated
  with check (
    public.is_admin()
    or public.owner_can_edit_business_images(business_id)
  );

create policy "Owners update own business images"
  on public.business_images
  for update
  to authenticated
  using (
    public.is_admin()
    or public.owner_can_edit_business_images(business_id)
  )
  with check (
    public.is_admin()
    or public.owner_can_edit_business_images(business_id)
  );

create policy "Owners delete own business images"
  on public.business_images
  for delete
  to authenticated
  using (
    public.is_admin()
    or public.owner_can_edit_business_images(business_id)
  );

-- ---------------------------------------------------------------------------
-- Storage bucket (private)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-images',
  'business-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies
drop policy if exists "Owners upload business images" on storage.objects;
drop policy if exists "Owners update business images" on storage.objects;
drop policy if exists "Owners delete business images" on storage.objects;
drop policy if exists "Owners read own business images" on storage.objects;
drop policy if exists "Public read published business images" on storage.objects;

create policy "Owners upload business images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'business-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.owner_can_edit_business_images(public.storage_business_id(name))
  );

create policy "Owners update business images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'business-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.owner_can_edit_business_images(public.storage_business_id(name))
  )
  with check (
    bucket_id = 'business-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.owner_can_edit_business_images(public.storage_business_id(name))
  );

create policy "Owners delete business images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'business-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.owner_can_edit_business_images(public.storage_business_id(name))
  );

-- Owners can download their own objects (any listing status they own)
create policy "Owners read own business images"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'business-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_business_owner(public.storage_business_id(name))
  );

-- Published listing objects are readable so signed URLs work for public pages
create policy "Public read published business images"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'business-images'
    and exists (
      select 1
      from public.businesses b
      where b.id = public.storage_business_id(name)
        and b.status = 'published'
    )
  );
