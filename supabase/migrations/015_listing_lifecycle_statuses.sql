-- Bizora Phase 15: listing lifecycle — leased, withdrawn, closed_at, published_at
-- + controlled status transition RPC + public-safe closed listing read

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------
alter table public.businesses
  add column if not exists closed_at timestamptz,
  add column if not exists published_at timestamptz;

comment on column public.businesses.closed_at is
  'Set when status becomes sold, leased, or withdrawn.';
comment on column public.businesses.published_at is
  'Set when status becomes published (first or subsequent publish).';

-- ---------------------------------------------------------------------------
-- Expand status check (preserve existing rows)
-- ---------------------------------------------------------------------------
alter table public.businesses
  drop constraint if exists businesses_status_check;

alter table public.businesses
  add constraint businesses_status_check
  check (
    status in (
      'draft',
      'pending',
      'published',
      'rejected',
      'sold',
      'leased',
      'withdrawn'
    )
  );

-- Backfill timestamps for existing data
update public.businesses
set published_at = coalesce(reviewed_at, created_at)
where status = 'published'
  and published_at is null;

update public.businesses
set closed_at = coalesce(reviewed_at, updated_at)
where status = 'sold'
  and closed_at is null;

-- ---------------------------------------------------------------------------
-- Keep published_at / closed_at consistent on status changes
-- ---------------------------------------------------------------------------
create or replace function public.sync_listing_lifecycle_timestamps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'published' then
      new.published_at := coalesce(new.published_at, now());
      new.closed_at := null;
    elsif new.status in ('sold', 'leased', 'withdrawn') then
      new.closed_at := coalesce(new.closed_at, now());
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists businesses_sync_lifecycle_timestamps on public.businesses;

create trigger businesses_sync_lifecycle_timestamps
  before update of status on public.businesses
  for each row
  execute function public.sync_listing_lifecycle_timestamps();

-- ---------------------------------------------------------------------------
-- Controlled status transitions (seller + admin)
-- Does not broaden direct UPDATE RLS for sellers.
-- ---------------------------------------------------------------------------
create or replace function public.transition_listing_status(
  p_listing_id uuid,
  p_new_status text
)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.businesses;
  v_uid uuid := auth.uid();
  v_is_admin boolean := public.is_admin();
begin
  if v_uid is null then
    raise exception 'authentication required';
  end if;

  if p_new_status not in (
    'sold', 'leased', 'withdrawn', 'pending', 'published'
  ) then
    raise exception 'unsupported status transition target: %', p_new_status;
  end if;

  select * into v_row
  from public.businesses
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'listing not found';
  end if;

  if not v_is_admin and v_row.seller_id is distinct from v_uid then
    raise exception 'not authorized';
  end if;

  -- Seller-allowed transitions
  if not v_is_admin then
    if p_new_status in ('sold', 'leased', 'withdrawn') then
      if v_row.status is distinct from 'published' then
        raise exception 'only published listings can be closed';
      end if;
    elsif p_new_status = 'pending' then
      if v_row.status is distinct from 'withdrawn' then
        raise exception 'only withdrawn listings can be republished by sellers';
      end if;
    else
      raise exception 'sellers cannot set status to %', p_new_status;
    end if;
  else
    -- Admin corrections / close / reopen
    if p_new_status in ('sold', 'leased', 'withdrawn') then
      if v_row.status not in ('published', 'sold', 'leased', 'withdrawn') then
        raise exception 'listing cannot be closed from status %', v_row.status;
      end if;
    elsif p_new_status = 'published' then
      if v_row.status not in ('sold', 'leased', 'withdrawn', 'pending') then
        raise exception 'listing cannot be published from status %', v_row.status;
      end if;
    elsif p_new_status = 'pending' then
      if v_row.status not in ('withdrawn', 'sold', 'leased', 'rejected', 'draft') then
        raise exception 'listing cannot move to pending from status %', v_row.status;
      end if;
    end if;
  end if;

  update public.businesses b
  set
    status = p_new_status,
    submitted_at = case
      when p_new_status = 'pending' then coalesce(b.submitted_at, now())
      else b.submitted_at
    end,
    rejection_reason = case
      when p_new_status = 'pending' then null
      else b.rejection_reason
    end,
    reviewed_at = case
      when v_is_admin and p_new_status in ('sold', 'leased', 'withdrawn', 'published')
        then now()
      else b.reviewed_at
    end,
    reviewed_by = case
      when v_is_admin and p_new_status in ('sold', 'leased', 'withdrawn', 'published')
        then v_uid
      else b.reviewed_by
    end,
    updated_at = now()
  where b.id = p_listing_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.transition_listing_status(uuid, text) from public;
grant execute on function public.transition_listing_status(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Public-safe closed listing summary (no seller contact / private fields)
-- ---------------------------------------------------------------------------
create or replace function public.get_public_closed_listing(p_listing_id uuid)
returns table (
  id uuid,
  title text,
  status text,
  listing_type text,
  category_name text,
  location_label text,
  primary_image_url text,
  closed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select
    b.id,
    b.title,
    b.status,
    b.listing_type,
    c.name as category_name,
    nullif(
      trim(
        both ', '
        from concat_ws(
          ', ',
          nullif(l.name, ''),
          nullif(ci.name, ''),
          nullif(s.name, '')
        )
      ),
      ''
    ) as location_label,
    (
      select coalesce(bi.image_url, null)
      from public.business_images bi
      where bi.business_id = b.id
      order by bi.is_primary desc, bi.sort_order asc
      limit 1
    ) as primary_image_url,
    b.closed_at
  from public.businesses b
  left join public.categories c on c.id = b.category_id
  left join public.localities l on l.id = b.locality_id
  left join public.cities ci on ci.id = b.city_id
  left join public.states s on s.id = b.state_id
  where b.id = p_listing_id
    and b.status in ('sold', 'leased', 'withdrawn');
end;
$$;

revoke all on function public.get_public_closed_listing(uuid) from public;
grant execute on function public.get_public_closed_listing(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Notifications: optional leased favourites notice (mirrors sold)
-- ---------------------------------------------------------------------------
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (
    type in (
      'listing_submitted',
      'listing_approved',
      'listing_rejected',
      'new_enquiry',
      'enquiry_response',
      'listing_sold',
      'listing_leased',
      'listing_resubmitted'
    )
  );

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
  if old.status is not distinct from new.status then
    return new;
  end if;

  v_title := coalesce(nullif(trim(new.title), ''), 'Your listing');

  -- draft → pending: listing_submitted → admins
  if old.status = 'draft' and new.status = 'pending' then
    perform public.notify_admins(
      'listing_submitted',
      'New listing submitted',
      format('"%s" was submitted for review.', v_title),
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

  -- withdrawn → pending: republish for review → admins
  if old.status = 'withdrawn' and new.status = 'pending' then
    perform public.notify_admins(
      'listing_resubmitted',
      'Listing resubmitted for review',
      format('"%s" was republished for review after withdrawal.', v_title),
      new.id,
      null
    );
    return new;
  end if;

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

  if old.status = 'published' and new.status = 'leased' then
    for r in
      select f.user_id
      from public.favorites f
      where f.business_id = new.id
    loop
      perform public.notify_user(
        r.user_id,
        'listing_leased',
        'Saved listing marked as leased',
        format('A listing you saved, "%s", has been marked as leased.', v_title),
        new.id,
        null
      );
    end loop;
    return new;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Update seller guards so RPC transitions are not blocked by the trigger.
-- Direct client UPDATE RLS still limits sellers to draft/rejected rows.
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

  -- Seller status transitions:
  --   draft|rejected → draft|rejected|pending
  --   published → sold|leased|withdrawn
  --   withdrawn → pending (republish for review)
  if new.status is distinct from old.status then
    if old.status in ('draft', 'rejected')
       and new.status in ('draft', 'rejected', 'pending') then
      null;
    elsif old.status = 'published'
       and new.status in ('sold', 'leased', 'withdrawn') then
      null;
    elsif old.status = 'withdrawn' and new.status = 'pending' then
      null;
    else
      raise exception 'sellers cannot change status from % to %', old.status, new.status;
    end if;
  end if;

  if new.status = 'pending' and old.status in ('draft', 'rejected', 'withdrawn') then
    new.submitted_at := coalesce(new.submitted_at, now());
    if old.status in ('rejected', 'withdrawn') then
      new.rejection_reason := null;
    end if;
  end if;

  return new;
end;
$$;
