-- Bizora Phase 4C-2A: location integrity + controlled seller promotion
-- Additive; does not modify seed data or prior migrations.

-- ---------------------------------------------------------------------------
-- Location hierarchy integrity for businesses
-- Draft/rejected: incomplete location OK; any provided IDs must be consistent.
-- Pending/published/sold: state + district + city required and consistent.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_business_location_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_district_state uuid;
  v_city_district uuid;
  v_locality_city uuid;
begin
  if new.status in ('pending', 'published', 'sold') then
    if new.state_id is null then
      raise exception 'state is required for % listings', new.status;
    end if;
    if new.district_id is null then
      raise exception 'district is required for % listings', new.status;
    end if;
    if new.city_id is null then
      raise exception 'city is required for % listings', new.status;
    end if;
  end if;

  if new.district_id is not null then
    if new.state_id is null then
      raise exception 'state is required when district is set';
    end if;
    select state_id into v_district_state
    from public.districts
    where id = new.district_id;
    if v_district_state is null then
      raise exception 'invalid district';
    end if;
    if v_district_state is distinct from new.state_id then
      raise exception 'district does not belong to the selected state';
    end if;
  end if;

  if new.city_id is not null then
    if new.district_id is null then
      raise exception 'district is required when city is set';
    end if;
    select district_id into v_city_district
    from public.cities
    where id = new.city_id;
    if v_city_district is null then
      raise exception 'invalid city';
    end if;
    if v_city_district is distinct from new.district_id then
      raise exception 'city does not belong to the selected district';
    end if;
  end if;

  if new.locality_id is not null then
    if new.city_id is null then
      raise exception 'city is required when locality is set';
    end if;
    select city_id into v_locality_city
    from public.localities
    where id = new.locality_id;
    if v_locality_city is null then
      raise exception 'invalid locality';
    end if;
    if v_locality_city is distinct from new.city_id then
      raise exception 'locality does not belong to the selected city';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists businesses_location_integrity on public.businesses;

create trigger businesses_location_integrity
  before insert or update on public.businesses
  for each row
  execute function public.enforce_business_location_integrity();

-- ---------------------------------------------------------------------------
-- Controlled buyer → seller promotion (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
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
    -- Controlled promotion via promote_to_seller() only
    if old.role = 'buyer'
       and new.role = 'seller'
       and current_setting('bizora.allow_seller_promotion', true) = 'on' then
      return new;
    end if;
    raise exception 'users cannot change their own role';
  end if;

  if tg_op = 'INSERT' and new.role is distinct from 'buyer' and new.id = auth.uid() then
    new.role := 'buyer';
  end if;

  return new;
end;
$$;

create or replace function public.promote_to_seller()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  -- Flag allows buyer → seller only inside this function
  perform set_config('bizora.allow_seller_promotion', 'on', true);

  update public.profiles
  set role = 'seller',
      updated_at = now()
  where id = auth.uid()
    and role = 'buyer';

  get diagnostics updated_count = row_count;
  return updated_count > 0;
end;
$$;

revoke all on function public.promote_to_seller() from public;
grant execute on function public.promote_to_seller() to authenticated;
