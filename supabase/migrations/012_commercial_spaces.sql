-- Bizora Phase 9: Commercial Spaces marketplace vertical
-- Additive; does not modify migrations 001–011.
-- Extends public.businesses with listing_type and commercial-space fields.

-- ---------------------------------------------------------------------------
-- Listing type
-- ---------------------------------------------------------------------------
alter table public.businesses
  add column if not exists listing_type text not null default 'business';

alter table public.businesses
  drop constraint if exists businesses_listing_type_check;

alter table public.businesses
  add constraint businesses_listing_type_check
  check (listing_type in ('business', 'commercial_space'));

create index if not exists businesses_listing_type_status_idx
  on public.businesses (listing_type, status, is_premium, created_at desc);

-- ---------------------------------------------------------------------------
-- Commercial space fields (nullable — business listings ignore these)
-- ---------------------------------------------------------------------------
alter table public.businesses
  add column if not exists space_type text,
  add column if not exists listing_purpose text,
  add column if not exists monthly_rent numeric,
  add column if not exists security_deposit numeric,
  add column if not exists area_sqft numeric,
  add column if not exists floor text,
  add column if not exists parking_spaces integer,
  add column if not exists furnished text,
  add column if not exists lease_term_months integer,
  add column if not exists available_from date,
  add column if not exists business_usage text;

alter table public.businesses
  drop constraint if exists businesses_space_type_check;

alter table public.businesses
  add constraint businesses_space_type_check
  check (
    space_type is null
    or space_type in (
      'retail_shop',
      'restaurant_cafe',
      'office',
      'warehouse',
      'industrial',
      'commercial_land',
      'other'
    )
  );

alter table public.businesses
  drop constraint if exists businesses_listing_purpose_check;

alter table public.businesses
  add constraint businesses_listing_purpose_check
  check (
    listing_purpose is null
    or listing_purpose in ('rent', 'lease')
  );

alter table public.businesses
  drop constraint if exists businesses_furnished_check;

alter table public.businesses
  add constraint businesses_furnished_check
  check (
    furnished is null
    or furnished in ('furnished', 'semi_furnished', 'unfurnished', 'not_applicable')
  );

alter table public.businesses
  drop constraint if exists businesses_monthly_rent_nonneg;

alter table public.businesses
  add constraint businesses_monthly_rent_nonneg
  check (monthly_rent is null or monthly_rent >= 0);

alter table public.businesses
  drop constraint if exists businesses_security_deposit_nonneg;

alter table public.businesses
  add constraint businesses_security_deposit_nonneg
  check (security_deposit is null or security_deposit >= 0);

alter table public.businesses
  drop constraint if exists businesses_area_sqft_positive;

alter table public.businesses
  add constraint businesses_area_sqft_positive
  check (area_sqft is null or area_sqft > 0);

alter table public.businesses
  drop constraint if exists businesses_parking_spaces_nonneg;

alter table public.businesses
  add constraint businesses_parking_spaces_nonneg
  check (parking_spaces is null or parking_spaces >= 0);

alter table public.businesses
  drop constraint if exists businesses_lease_term_months_positive;

alter table public.businesses
  add constraint businesses_lease_term_months_positive
  check (lease_term_months is null or lease_term_months > 0);

-- Ensure existing rows remain business listings
update public.businesses
set listing_type = 'business'
where listing_type is distinct from 'business'
  and listing_type is null;

-- ---------------------------------------------------------------------------
-- Commercial space categories (parent + children)
-- ---------------------------------------------------------------------------
insert into public.categories (id, name, slug, parent_id, is_active) values
  (
    'd4000000-0000-4000-8000-000000000020',
    'Commercial Spaces',
    'commercial-spaces',
    null,
    true
  )
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  parent_id = excluded.parent_id,
  is_active = excluded.is_active;

insert into public.categories (id, name, slug, parent_id, is_active) values
  (
    'd4000000-0000-4000-8000-000000000021',
    'Retail / Shop',
    'commercial-retail-shop',
    'd4000000-0000-4000-8000-000000000020',
    true
  ),
  (
    'd4000000-0000-4000-8000-000000000022',
    'Restaurant / Café',
    'commercial-restaurant-cafe',
    'd4000000-0000-4000-8000-000000000020',
    true
  ),
  (
    'd4000000-0000-4000-8000-000000000023',
    'Office',
    'commercial-office',
    'd4000000-0000-4000-8000-000000000020',
    true
  ),
  (
    'd4000000-0000-4000-8000-000000000024',
    'Warehouse',
    'commercial-warehouse',
    'd4000000-0000-4000-8000-000000000020',
    true
  ),
  (
    'd4000000-0000-4000-8000-000000000025',
    'Industrial',
    'commercial-industrial',
    'd4000000-0000-4000-8000-000000000020',
    true
  ),
  (
    'd4000000-0000-4000-8000-000000000026',
    'Commercial Land',
    'commercial-land',
    'd4000000-0000-4000-8000-000000000020',
    true
  ),
  (
    'd4000000-0000-4000-8000-000000000027',
    'Other',
    'commercial-other',
    'd4000000-0000-4000-8000-000000000020',
    true
  )
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  parent_id = excluded.parent_id,
  is_active = excluded.is_active;

-- ---------------------------------------------------------------------------
-- Commercial space integrity (pending / published / sold)
-- ---------------------------------------------------------------------------
create or replace function public.enforce_commercial_space_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.listing_type is distinct from 'commercial_space' then
    return new;
  end if;

  if new.status in ('pending', 'published', 'sold') then
    if new.space_type is null then
      raise exception 'space_type is required for % commercial listings', new.status;
    end if;
    if new.listing_purpose is null then
      raise exception 'listing_purpose is required for % commercial listings', new.status;
    end if;
    if new.monthly_rent is null or new.monthly_rent <= 0 then
      raise exception 'monthly_rent must be greater than zero for % commercial listings', new.status;
    end if;
    if new.area_sqft is null or new.area_sqft <= 0 then
      raise exception 'area_sqft must be greater than zero for % commercial listings', new.status;
    end if;
    if new.category_id is null then
      raise exception 'category is required for % commercial listings', new.status;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists businesses_commercial_space_integrity on public.businesses;

create trigger businesses_commercial_space_integrity
  before insert or update on public.businesses
  for each row
  execute function public.enforce_commercial_space_integrity();

-- ---------------------------------------------------------------------------
-- Seller guards: listing_type immutable for non-admins
-- ---------------------------------------------------------------------------
create or replace function public.enforce_business_seller_guards()
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

  if tg_op = 'UPDATE' and new.seller_id is distinct from old.seller_id then
    raise exception 'sellers cannot change seller_id';
  end if;

  if tg_op = 'UPDATE' and new.listing_type is distinct from old.listing_type then
    raise exception 'sellers cannot change listing_type';
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

  if new.status is distinct from old.status then
    if new.status not in ('draft', 'rejected', 'pending') then
      raise exception 'sellers cannot set status to %', new.status;
    end if;
    if old.status not in ('draft', 'rejected') then
      raise exception 'sellers can only change status from draft or rejected';
    end if;
  end if;

  if new.status = 'pending' and old.status in ('draft', 'rejected') then
    new.submitted_at := coalesce(new.submitted_at, now());
    if old.status = 'rejected' then
      new.rejection_reason := null;
    end if;
  end if;

  return new;
end;
$$;
