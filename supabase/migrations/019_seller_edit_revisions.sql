-- Bizora: seller edit for pending listings + published edit revisions
-- Additive. Published listings stay live via a sibling draft/pending revision
-- linked by supersedes_id. Admin approve merges the revision onto the published row.

-- ---------------------------------------------------------------------------
-- Revision link (nullable). Points from edit-copy → live published listing.
-- ---------------------------------------------------------------------------
alter table public.businesses
  add column if not exists supersedes_id uuid
    references public.businesses (id) on delete cascade;

create index if not exists businesses_supersedes_id_idx
  on public.businesses (supersedes_id)
  where supersedes_id is not null;

-- At most one open revision per published listing
create unique index if not exists businesses_one_open_revision_per_published
  on public.businesses (supersedes_id)
  where supersedes_id is not null
    and status in ('draft', 'pending', 'rejected');

comment on column public.businesses.supersedes_id is
  'When set, this row is an edit revision of the referenced published listing.';

-- ---------------------------------------------------------------------------
-- Sellers may only link a revision to their own currently-published listing.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_listing_revision_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent public.businesses;
begin
  if new.supersedes_id is null then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select * into v_parent
  from public.businesses
  where id = new.supersedes_id;

  if not found then
    raise exception 'revision target listing not found';
  end if;

  if v_parent.seller_id is distinct from auth.uid() then
    raise exception 'cannot create a revision of another seller listing';
  end if;

  if v_parent.status is distinct from 'published' then
    raise exception 'revisions are only allowed for published listings';
  end if;

  if new.seller_id is distinct from auth.uid() then
    raise exception 'seller_id must equal the authenticated user';
  end if;

  if tg_op = 'UPDATE'
     and new.supersedes_id is distinct from old.supersedes_id then
    raise exception 'cannot change supersedes_id';
  end if;

  return new;
end;
$$;

drop trigger if exists businesses_revision_link on public.businesses;

create trigger businesses_revision_link
  before insert or update on public.businesses
  for each row
  execute function public.enforce_listing_revision_link();

-- ---------------------------------------------------------------------------
-- Sellers may UPDATE pending rows (field edits) while staying pending/draft/rejected.
-- Published rows are still not directly updatable — edits use a revision insert.
-- ---------------------------------------------------------------------------
drop policy if exists "Sellers update own draft or rejected businesses" on public.businesses;

create policy "Sellers update own draft rejected or pending businesses"
  on public.businesses
  for update
  to authenticated
  using (
    seller_id = auth.uid()
    and status in ('draft', 'rejected', 'pending')
  )
  with check (
    seller_id = auth.uid()
    and status in ('draft', 'rejected', 'pending')
  );

-- ---------------------------------------------------------------------------
-- Image edits allowed for pending as well (draft / rejected / pending)
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
      and b.status in ('draft', 'rejected', 'pending')
  );
$$;

revoke all on function public.owner_can_edit_business_images(uuid) from public;
grant execute on function public.owner_can_edit_business_images(uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Admin merge: apply pending revision onto published parent, then remove revision.
-- ---------------------------------------------------------------------------
create or replace function public.approve_listing_edit_revision(p_revision_id uuid)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_revision public.businesses;
  v_published public.businesses;
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.is_admin() then
    raise exception 'admin authentication required';
  end if;

  select * into v_revision
  from public.businesses
  where id = p_revision_id
  for update;

  if not found then
    raise exception 'revision not found';
  end if;

  if v_revision.status is distinct from 'pending' then
    raise exception 'only pending revisions can be approved';
  end if;

  if v_revision.supersedes_id is null then
    raise exception 'listing is not an edit revision';
  end if;

  select * into v_published
  from public.businesses
  where id = v_revision.supersedes_id
  for update;

  if not found then
    raise exception 'published listing not found';
  end if;

  if v_published.status is distinct from 'published' then
    raise exception 'target listing is no longer published';
  end if;

  if v_published.seller_id is distinct from v_revision.seller_id then
    raise exception 'revision seller does not match published listing';
  end if;

  -- Replace published images with revision images (reassign rows)
  delete from public.business_images
  where business_id = v_published.id;

  update public.business_images
  set business_id = v_published.id
  where business_id = v_revision.id;

  update public.businesses
  set
    title = v_revision.title,
    -- Keep published slug stable for any future slug-based links;
    -- revision slug is disposable.
    description = v_revision.description,
    asking_price = v_revision.asking_price,
    annual_revenue = v_revision.annual_revenue,
    annual_profit = v_revision.annual_profit,
    ebitda = v_revision.ebitda,
    established_year = v_revision.established_year,
    employees = v_revision.employees,
    category_id = v_revision.category_id,
    state_id = v_revision.state_id,
    district_id = v_revision.district_id,
    city_id = v_revision.city_id,
    locality_id = v_revision.locality_id,
    locality_name = v_revision.locality_name,
    reason_for_sale = v_revision.reason_for_sale,
    listing_type = v_revision.listing_type,
    space_type = v_revision.space_type,
    listing_purpose = v_revision.listing_purpose,
    monthly_rent = v_revision.monthly_rent,
    security_deposit = v_revision.security_deposit,
    area_sqft = v_revision.area_sqft,
    floor = v_revision.floor,
    parking_spaces = v_revision.parking_spaces,
    furnished = v_revision.furnished,
    lease_term_months = v_revision.lease_term_months,
    available_from = v_revision.available_from,
    business_usage = v_revision.business_usage,
    reviewed_at = now(),
    reviewed_by = v_uid,
    rejection_reason = null,
    updated_at = now()
  where id = v_published.id
  returning * into v_published;

  delete from public.businesses where id = v_revision.id;

  return v_published;
end;
$$;

revoke all on function public.approve_listing_edit_revision(uuid) from public;
grant execute on function public.approve_listing_edit_revision(uuid) to authenticated;
