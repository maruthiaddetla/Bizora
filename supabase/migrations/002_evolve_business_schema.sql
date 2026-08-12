-- Bizora: evolve businesses schema + reference tables + images
-- Prerequisites: 001_create_businesses.sql (will be replaced)
-- Safe for POC: drops the old flat businesses table and recreates the foundation.

-- ---------------------------------------------------------------------------
-- Tear down proof-of-concept businesses table
-- ---------------------------------------------------------------------------
drop trigger if exists businesses_set_updated_at on public.businesses;
drop policy if exists "Public read access for businesses" on public.businesses;
drop table if exists public.businesses cascade;

-- ---------------------------------------------------------------------------
-- Shared trigger function (reuse if already exists from 001)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Location hierarchy
-- ---------------------------------------------------------------------------
create table public.states (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table public.districts (
  id uuid primary key default gen_random_uuid(),
  state_id uuid not null references public.states (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (state_id, name)
);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (district_id, name)
);

create index districts_state_id_idx on public.districts (state_id);
create index cities_district_id_idx on public.cities (district_id);

create table public.localities (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (city_id, name)
);

create index localities_city_id_idx on public.localities (city_id);

-- ---------------------------------------------------------------------------
-- Categories (parent/child)
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index categories_parent_id_idx on public.categories (parent_id);

-- ---------------------------------------------------------------------------
-- Businesses
-- ---------------------------------------------------------------------------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid,
  title text not null,
  slug text not null unique,
  description text,
  asking_price numeric,
  annual_revenue numeric,
  annual_profit numeric,
  ebitda numeric,
  established_year integer,
  employees integer,
  category_id uuid references public.categories (id) on delete set null,
  state_id uuid references public.states (id) on delete set null,
  district_id uuid references public.districts (id) on delete set null,
  city_id uuid references public.cities (id) on delete set null,
  locality_id uuid references public.localities (id) on delete set null,
  reason_for_sale text,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'published', 'sold')),
  is_premium boolean not null default false,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index businesses_status_premium_created_at_idx
  on public.businesses (status, is_premium, created_at desc);

create index businesses_category_id_idx on public.businesses (category_id);
create index businesses_city_id_idx on public.businesses (city_id);
create index businesses_locality_id_idx on public.businesses (locality_id);

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Business images
-- ---------------------------------------------------------------------------
create table public.business_images (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index business_images_business_id_idx
  on public.business_images (business_id, sort_order);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.states enable row level security;
alter table public.districts enable row level security;
alter table public.cities enable row level security;
alter table public.localities enable row level security;
alter table public.categories enable row level security;
alter table public.businesses enable row level security;
alter table public.business_images enable row level security;

create policy "Public read states"
  on public.states for select to anon, authenticated using (true);

create policy "Public read districts"
  on public.districts for select to anon, authenticated using (true);

create policy "Public read cities"
  on public.cities for select to anon, authenticated using (true);

create policy "Public read localities"
  on public.localities for select to anon, authenticated using (true);

create policy "Public read active categories"
  on public.categories for select to anon, authenticated
  using (is_active = true);

create policy "Public read published businesses"
  on public.businesses for select to anon, authenticated
  using (status = 'published');

create policy "Public read published business images"
  on public.business_images for select to anon, authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.status = 'published'
    )
  );

-- No anonymous INSERT / UPDATE / DELETE policies (authenticated seller policies later)
