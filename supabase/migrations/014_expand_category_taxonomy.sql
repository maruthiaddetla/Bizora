-- Bizora: Expand India-wide category taxonomy
-- Safe against existing production data:
--   - Preserves category UUIDs referenced by listings where possible
--   - Remaps overlapping legacy categories before deactivating them
--   - Does not modify RLS or unrelated tables
-- Idempotent: safe to re-run

-- ---------------------------------------------------------------------------
-- 1) Remap listings off overlapping legacy categories
--    Café → Restaurants & Cafés (former Restaurant id)
--    Food & Hospitality → Restaurants & Cafés
-- ---------------------------------------------------------------------------
update public.businesses
set category_id = 'd4000000-0000-4000-8000-000000000004'
where category_id = 'd4000000-0000-4000-8000-000000000005';

update public.businesses
set category_id = 'd4000000-0000-4000-8000-000000000004'
where category_id = 'd4000000-0000-4000-8000-000000000001';

-- ---------------------------------------------------------------------------
-- 2) Flatten + rename retained business categories (same IDs)
-- ---------------------------------------------------------------------------
update public.categories
set
  name = 'Restaurants & Cafés',
  slug = 'restaurants-cafes',
  parent_id = null,
  is_active = true
where id = 'd4000000-0000-4000-8000-000000000004';

update public.categories
set
  name = 'Manufacturing',
  slug = 'manufacturing',
  parent_id = null,
  is_active = true
where id = 'd4000000-0000-4000-8000-000000000002';

update public.categories
set
  name = 'IT & Technology',
  slug = 'it-technology',
  parent_id = null,
  is_active = true
where id = 'd4000000-0000-4000-8000-000000000003';

update public.categories
set
  name = 'Construction & Engineering',
  slug = 'construction-engineering',
  parent_id = null,
  is_active = true
where id = 'd4000000-0000-4000-8000-000000000006';

update public.categories
set
  name = 'SaaS & Software',
  slug = 'saas-software',
  parent_id = null,
  is_active = true
where id = 'd4000000-0000-4000-8000-000000000007';

update public.categories
set
  name = 'Retail & Shops',
  slug = 'retail-shops',
  parent_id = null,
  is_active = true
where id = 'd4000000-0000-4000-8000-000000000008';

update public.categories
set
  name = 'Healthcare & Medical',
  slug = 'healthcare-medical',
  parent_id = null,
  is_active = true
where id = 'd4000000-0000-4000-8000-000000000009';

update public.categories
set
  name = 'Education & Training',
  slug = 'education-training',
  parent_id = null,
  is_active = true
where id = 'd4000000-0000-4000-8000-000000000010';

update public.categories
set
  name = 'Professional Services',
  slug = 'professional-services',
  parent_id = null,
  is_active = true
where id = 'd4000000-0000-4000-8000-000000000011';

update public.categories
set
  name = 'Automotive',
  slug = 'automotive',
  parent_id = null,
  is_active = true
where id = 'd4000000-0000-4000-8000-000000000012';

update public.categories
set
  name = 'Beauty & Wellness',
  slug = 'beauty-wellness',
  parent_id = null,
  is_active = true
where id = 'd4000000-0000-4000-8000-000000000013';

-- ---------------------------------------------------------------------------
-- 3) Deactivate overlapping legacy parents / duplicates (IDs retained)
-- ---------------------------------------------------------------------------
update public.categories
set
  name = 'Food & Hospitality (legacy)',
  slug = 'food-hospitality-legacy',
  parent_id = null,
  is_active = false
where id = 'd4000000-0000-4000-8000-000000000001';

update public.categories
set
  name = 'Café (legacy)',
  slug = 'cafe-legacy',
  parent_id = null,
  is_active = false
where id = 'd4000000-0000-4000-8000-000000000005';

-- ---------------------------------------------------------------------------
-- 4) Insert additional India-wide business categories
-- ---------------------------------------------------------------------------
insert into public.categories (id, name, slug, parent_id, is_active) values
  ('d4000000-0000-4000-8000-000000000030', 'Hotels & Hospitality', 'hotels-hospitality', null, true),
  ('d4000000-0000-4000-8000-000000000031', 'Logistics & Transport', 'logistics-transport', null, true),
  ('d4000000-0000-4000-8000-000000000032', 'Agriculture & Farming', 'agriculture-farming', null, true),
  ('d4000000-0000-4000-8000-000000000033', 'Real Estate & Property Services', 'real-estate-property', null, true),
  ('d4000000-0000-4000-8000-000000000034', 'Wholesale & Distribution', 'wholesale-distribution', null, true),
  ('d4000000-0000-4000-8000-000000000035', 'Cleaning & Facility Services', 'cleaning-facility', null, true),
  ('d4000000-0000-4000-8000-000000000036', 'Printing & Signage', 'printing-signage', null, true),
  ('d4000000-0000-4000-8000-000000000037', 'Fitness & Sports', 'fitness-sports', null, true),
  ('d4000000-0000-4000-8000-000000000038', 'Other Businesses', 'other-businesses', null, true)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  parent_id = excluded.parent_id,
  is_active = excluded.is_active;

-- ---------------------------------------------------------------------------
-- 5) Refresh commercial-space category labels + add missing space types
--    Parent slug `commercial-spaces` remains the partition key in app code.
-- ---------------------------------------------------------------------------
update public.categories
set name = 'Retail Shops', slug = 'commercial-retail-shops', is_active = true
where id = 'd4000000-0000-4000-8000-000000000021';

update public.categories
set name = 'Restaurant / Café Spaces', slug = 'commercial-restaurant-cafe', is_active = true
where id = 'd4000000-0000-4000-8000-000000000022';

update public.categories
set name = 'Office Spaces', slug = 'commercial-office', is_active = true
where id = 'd4000000-0000-4000-8000-000000000023';

update public.categories
set name = 'Warehouses', slug = 'commercial-warehouse', is_active = true
where id = 'd4000000-0000-4000-8000-000000000024';

update public.categories
set name = 'Industrial Spaces', slug = 'commercial-industrial', is_active = true
where id = 'd4000000-0000-4000-8000-000000000025';

update public.categories
set name = 'Commercial Land', slug = 'commercial-land', is_active = true
where id = 'd4000000-0000-4000-8000-000000000026';

update public.categories
set name = 'Other Commercial Spaces', slug = 'commercial-other', is_active = true
where id = 'd4000000-0000-4000-8000-000000000027';

insert into public.categories (id, name, slug, parent_id, is_active) values
  (
    'd4000000-0000-4000-8000-000000000028',
    'Showrooms',
    'commercial-showrooms',
    'd4000000-0000-4000-8000-000000000020',
    true
  ),
  (
    'd4000000-0000-4000-8000-000000000029',
    'Co-working Spaces',
    'commercial-coworking',
    'd4000000-0000-4000-8000-000000000020',
    true
  ),
  (
    'd4000000-0000-4000-8000-000000000040',
    'Hotel / Hospitality Spaces',
    'commercial-hotel-hospitality',
    'd4000000-0000-4000-8000-000000000020',
    true
  ),
  (
    'd4000000-0000-4000-8000-000000000041',
    'Medical / Clinic Spaces',
    'commercial-medical-clinic',
    'd4000000-0000-4000-8000-000000000020',
    true
  ),
  (
    'd4000000-0000-4000-8000-000000000042',
    'Educational Spaces',
    'commercial-educational',
    'd4000000-0000-4000-8000-000000000020',
    true
  )
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  parent_id = excluded.parent_id,
  is_active = excluded.is_active;
