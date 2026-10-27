-- Bizora: private per-listing seller contact details + admin enquiry workspace
-- Additive. Does not expose contacts via public businesses SELECT (*).

-- ---------------------------------------------------------------------------
-- 1. Per-listing private contact (one row per business / revision)
-- ---------------------------------------------------------------------------
create table public.listing_seller_contacts (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  contact_name text,
  mobile_e164 text,
  email text,
  contact_type text
    check (
      contact_type is null
      or contact_type in ('owner', 'broker_agent', 'authorised_representative')
    ),
  sharing_authorised boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.listing_seller_contacts is
  'Private seller/contact details for a listing. Never exposed on public business reads.';
comment on column public.listing_seller_contacts.mobile_e164 is
  'Contact mobile in E.164 (e.g. +9198…). Nullable for legacy listings.';
comment on column public.listing_seller_contacts.sharing_authorised is
  'Seller confirms contact may be shared with suitable prospective buyers.';

create trigger listing_seller_contacts_set_updated_at
  before update on public.listing_seller_contacts
  for each row
  execute function public.set_updated_at();

alter table public.listing_seller_contacts enable row level security;

-- Owner or admin may read
create policy "Owners and admins read listing seller contacts"
  on public.listing_seller_contacts
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.businesses b
      where b.id = listing_seller_contacts.business_id
        and b.seller_id = auth.uid()
    )
  );

-- Insert/update only while listing is owner-editable, or admin
create policy "Owners insert contacts on editable listings"
  on public.listing_seller_contacts
  for insert
  to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.businesses b
      where b.id = listing_seller_contacts.business_id
        and b.seller_id = auth.uid()
        and b.status in ('draft', 'pending', 'rejected')
    )
  );

create policy "Owners update contacts on editable listings"
  on public.listing_seller_contacts
  for update
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.businesses b
      where b.id = listing_seller_contacts.business_id
        and b.seller_id = auth.uid()
        and b.status in ('draft', 'pending', 'rejected')
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.businesses b
      where b.id = listing_seller_contacts.business_id
        and b.seller_id = auth.uid()
        and b.status in ('draft', 'pending', 'rejected')
    )
  );

create policy "Owners and admins delete listing seller contacts"
  on public.listing_seller_contacts
  for delete
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.businesses b
      where b.id = listing_seller_contacts.business_id
        and b.seller_id = auth.uid()
        and b.status in ('draft', 'rejected')
    )
  );

-- No anon policies → anonymous cannot read/write

-- ---------------------------------------------------------------------------
-- 2. Admin-only enquiry notes (sellers must not see admin notes)
-- ---------------------------------------------------------------------------
create table public.enquiry_admin_notes (
  enquiry_id uuid primary key references public.enquiries (id) on delete cascade,
  notes text not null default '',
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.enquiry_admin_notes is
  'Private admin follow-up notes for an enquiry. Admin-only RLS.';

create trigger enquiry_admin_notes_set_updated_at
  before update on public.enquiry_admin_notes
  for each row
  execute function public.set_updated_at();

alter table public.enquiry_admin_notes enable row level security;

create policy "Admins manage enquiry notes"
  on public.enquiry_admin_notes
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Contact-sharing audit (admin-only)
-- ---------------------------------------------------------------------------
create table public.enquiry_contact_shares (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  shared_by uuid not null references public.profiles (id) on delete restrict,
  shared_at timestamptz not null default now(),
  note text
);

create index enquiry_contact_shares_enquiry_id_idx
  on public.enquiry_contact_shares (enquiry_id);
create index enquiry_contact_shares_business_id_idx
  on public.enquiry_contact_shares (business_id);
create index enquiry_contact_shares_shared_at_idx
  on public.enquiry_contact_shares (shared_at desc);

comment on table public.enquiry_contact_shares is
  'Audit log when an admin records sharing listing contact with a buyer.';

alter table public.enquiry_contact_shares enable row level security;

create policy "Admins manage enquiry contact shares"
  on public.enquiry_contact_shares
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Expand enquiry statuses for admin workflow (keep existing seller statuses)
-- ---------------------------------------------------------------------------
alter table public.enquiries
  drop constraint if exists enquiries_status_check;

alter table public.enquiries
  add constraint enquiries_status_check
  check (
    status in (
      'new',
      'read',
      'responded',
      'closed',
      'contacted',
      'qualified',
      'contact_shared'
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Revision approve: copy private contact from revision → published parent
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
  v_contact public.listing_seller_contacts%rowtype;
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

  delete from public.business_images
  where business_id = v_published.id;

  update public.business_images
  set business_id = v_published.id
  where business_id = v_revision.id;

  update public.businesses
  set
    title = v_revision.title,
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

  -- Merge private contact from revision onto published (if revision has a row)
  select * into v_contact
  from public.listing_seller_contacts
  where business_id = v_revision.id;

  if found then
    insert into public.listing_seller_contacts as c (
      business_id,
      contact_name,
      mobile_e164,
      email,
      contact_type,
      sharing_authorised
    )
    values (
      v_published.id,
      v_contact.contact_name,
      v_contact.mobile_e164,
      v_contact.email,
      v_contact.contact_type,
      v_contact.sharing_authorised
    )
    on conflict (business_id) do update
    set
      contact_name = excluded.contact_name,
      mobile_e164 = excluded.mobile_e164,
      email = excluded.email,
      contact_type = excluded.contact_type,
      sharing_authorised = excluded.sharing_authorised,
      updated_at = now();
  end if;

  -- Cascades listing_seller_contacts for the revision row
  delete from public.businesses where id = v_revision.id;

  return v_published;
end;
$$;

revoke all on function public.approve_listing_edit_revision(uuid) from public;
grant execute on function public.approve_listing_edit_revision(uuid) to authenticated;
