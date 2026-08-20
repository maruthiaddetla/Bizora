-- Bizora Phase 6: buyer favourites / saved businesses
-- Additive; does not modify migrations 001–008 or existing RLS on other tables.

-- ---------------------------------------------------------------------------
-- Favorites table
-- ---------------------------------------------------------------------------
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_user_business_unique unique (user_id, business_id)
);

create index favorites_user_id_idx on public.favorites (user_id);
create index favorites_business_id_idx on public.favorites (business_id);
create index favorites_created_at_idx on public.favorites (created_at desc);

-- ---------------------------------------------------------------------------
-- INSERT: force user_id = auth.uid(); only published businesses
-- ---------------------------------------------------------------------------
create or replace function public.enforce_favorite_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  -- Never trust client-provided user_id
  new.user_id := auth.uid();

  select b.status
  into v_status
  from public.businesses b
  where b.id = new.business_id;

  if not found then
    raise exception 'business not found';
  end if;

  if v_status is distinct from 'published' then
    raise exception 'only published businesses can be saved';
  end if;

  return new;
end;
$$;

drop trigger if exists favorites_insert_guard on public.favorites;

create trigger favorites_insert_guard
  before insert on public.favorites
  for each row
  execute function public.enforce_favorite_insert();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.favorites enable row level security;

drop policy if exists "Users read own favorites" on public.favorites;
drop policy if exists "Users insert own favorites" on public.favorites;
drop policy if exists "Users delete own favorites" on public.favorites;

create policy "Users read own favorites"
  on public.favorites
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users insert own favorites"
  on public.favorites
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.status = 'published'
    )
  );

create policy "Users delete own favorites"
  on public.favorites
  for delete
  to authenticated
  using (user_id = auth.uid());

-- No anonymous policies; no UPDATE policy (immutable rows aside from delete)
