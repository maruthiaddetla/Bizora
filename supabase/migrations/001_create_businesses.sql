-- Bizora: initial businesses table
-- Run in Supabase SQL Editor or via Supabase CLI migrations

create table if not exists public.businesses (
  id text primary key,
  title text not null,
  location text not null,
  price text,
  description text not null,
  image_url text not null,
  category text not null,
  premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists businesses_premium_created_at_idx
  on public.businesses (premium, created_at desc);

alter table public.businesses enable row level security;

create policy "Public read access for businesses"
  on public.businesses
  for select
  to anon, authenticated
  using (true);

-- Keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists businesses_set_updated_at on public.businesses;

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row
  execute function public.set_updated_at();
