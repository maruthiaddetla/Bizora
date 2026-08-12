-- Bizora development seed data
-- Run AFTER 002_evolve_business_schema.sql
-- Uses stable UUIDs for idempotent upserts
--
-- Location hierarchy:
--   India → State → District → City → Locality (optional)

-- ---------------------------------------------------------------------------
-- Locations: Telangana + Andhra Pradesh sample
-- ---------------------------------------------------------------------------
insert into public.states (id, name, code) values
  ('a1000000-0000-4000-8000-000000000001', 'Telangana', 'TS'),
  ('a1000000-0000-4000-8000-000000000002', 'Andhra Pradesh', 'AP')
on conflict (id) do update set name = excluded.name, code = excluded.code;

insert into public.districts (id, state_id, name) values
  ('b2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Hyderabad'),
  ('b2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002', 'Visakhapatnam')
on conflict (id) do update set state_id = excluded.state_id, name = excluded.name;

-- Cities only — NOT localities/neighbourhoods
insert into public.cities (id, district_id, name) values
  ('c3000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001', 'Hyderabad'),
  ('c3000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000001', 'Secunderabad'),
  ('c3000000-0000-4000-8000-000000000004', 'b2000000-0000-4000-8000-000000000003', 'Visakhapatnam')
on conflict (id) do update set district_id = excluded.district_id, name = excluded.name;

-- Localities under Hyderabad city
insert into public.localities (id, city_id, name) values
  ('f1000000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000001', 'Gachibowli'),
  ('f1000000-0000-4000-8000-000000000002', 'c3000000-0000-4000-8000-000000000001', 'Madhapur'),
  ('f1000000-0000-4000-8000-000000000003', 'c3000000-0000-4000-8000-000000000001', 'Uppal'),
  ('f1000000-0000-4000-8000-000000000004', 'c3000000-0000-4000-8000-000000000001', 'IDA Uppal')
on conflict (id) do update set city_id = excluded.city_id, name = excluded.name;

-- Localities under Secunderabad city
insert into public.localities (id, city_id, name) values
  ('f1000000-0000-4000-8000-000000000005', 'c3000000-0000-4000-8000-000000000002', 'Begumpet')
on conflict (id) do update set city_id = excluded.city_id, name = excluded.name;

-- ---------------------------------------------------------------------------
-- Categories (parent + child)
-- ---------------------------------------------------------------------------
insert into public.categories (id, name, slug, parent_id, is_active) values
  ('d4000000-0000-4000-8000-000000000001', 'Food & Hospitality', 'food-hospitality', null, true),
  ('d4000000-0000-4000-8000-000000000002', 'Manufacturing', 'manufacturing', null, true),
  ('d4000000-0000-4000-8000-000000000003', 'IT & Technology', 'it-technology', null, true),
  ('d4000000-0000-4000-8000-000000000004', 'Restaurant', 'restaurant', 'd4000000-0000-4000-8000-000000000001', true),
  ('d4000000-0000-4000-8000-000000000005', 'Café', 'cafe', 'd4000000-0000-4000-8000-000000000001', true),
  ('d4000000-0000-4000-8000-000000000006', 'Engineering', 'engineering', 'd4000000-0000-4000-8000-000000000002', true),
  ('d4000000-0000-4000-8000-000000000007', 'SaaS', 'saas', 'd4000000-0000-4000-8000-000000000003', true)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  parent_id = excluded.parent_id,
  is_active = excluded.is_active;

-- ---------------------------------------------------------------------------
-- Businesses (numeric currency — format in UI)
-- ---------------------------------------------------------------------------
insert into public.businesses (
  id, title, slug, description,
  asking_price, annual_revenue, annual_profit, ebitda,
  established_year, employees,
  category_id, state_id, district_id, city_id, locality_id,
  reason_for_sale, status, is_premium, is_verified
) values
  (
    'e5000000-0000-4000-8000-000000000001',
    'Engineering Business for Sale',
    'engineering-business-hyderabad',
    'Highly regarded precision engineering business with long-term contracts and skilled workforce. Loaded from Supabase.',
    205000000, 320000000, 42000000, 68000000,
    2008, 85,
    'd4000000-0000-4000-8000-000000000006',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000004',
    'Founding partners approaching retirement with a full order book.',
    'published', true, true
  ),
  (
    'e5000000-0000-4000-8000-000000000002',
    'Premium Café & Roastery',
    'premium-cafe-roastery-hyderabad',
    'Award-winning specialty coffee brand with strong foot traffic and loyal customer base.',
    74000000, 95000000, 12000000, 18000000,
    2015, 22,
    'd4000000-0000-4000-8000-000000000005',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000002',
    'f1000000-0000-4000-8000-000000000005',
    'Owner relocating abroad.',
    'published', true, true
  ),
  (
    'e5000000-0000-4000-8000-000000000003',
    'South Indian Restaurant Chain',
    'south-indian-restaurant-hyderabad',
    '15 years trading with strong local following and consistent cash flow.',
    11500000, 20000000, 2800000, 4200000,
    2010, 18,
    'd4000000-0000-4000-8000-000000000004',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000002',
    'Seeking a strategic buyer to expand the brand.',
    'published', false, true
  ),
  (
    'e5000000-0000-4000-8000-000000000004',
    'B2B SaaS Analytics Platform',
    'b2b-saas-analytics-platform',
    'Profitable recurring-revenue software business with 94% retention and clean financials.',
    100000000, 45000000, 15000000, 22000000,
    2018, 14,
    'd4000000-0000-4000-8000-000000000007',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000001',
    'Founders pursuing a new venture.',
    'published', true, false
  ),
  (
    'e5000000-0000-4000-8000-000000000005',
    'Draft Listing — Not Public',
    'draft-listing-internal',
    'This record should NOT appear on the public site (status = draft).',
    5000000, null, null, null,
    2020, 5,
    'd4000000-0000-4000-8000-000000000004',
    'a1000000-0000-4000-8000-000000000002',
    'b2000000-0000-4000-8000-000000000003',
    'c3000000-0000-4000-8000-000000000004',
    null,
    null,
    'draft', false, false
  )
on conflict (id) do update set
  title = excluded.title,
  slug = excluded.slug,
  description = excluded.description,
  asking_price = excluded.asking_price,
  annual_revenue = excluded.annual_revenue,
  annual_profit = excluded.annual_profit,
  ebitda = excluded.ebitda,
  established_year = excluded.established_year,
  employees = excluded.employees,
  category_id = excluded.category_id,
  state_id = excluded.state_id,
  district_id = excluded.district_id,
  city_id = excluded.city_id,
  locality_id = excluded.locality_id,
  reason_for_sale = excluded.reason_for_sale,
  status = excluded.status,
  is_premium = excluded.is_premium,
  is_verified = excluded.is_verified,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Business images
-- ---------------------------------------------------------------------------
delete from public.business_images
where business_id in (
  'e5000000-0000-4000-8000-000000000001',
  'e5000000-0000-4000-8000-000000000002',
  'e5000000-0000-4000-8000-000000000003',
  'e5000000-0000-4000-8000-000000000004'
);

insert into public.business_images (business_id, image_url, sort_order, is_primary) values
  ('e5000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80', 1, false),
  ('e5000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000004', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', 0, true);
