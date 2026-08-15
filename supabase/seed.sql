-- Bizora development seed data
-- Run AFTER 002_evolve_business_schema.sql
-- Uses stable UUIDs for idempotent upserts
--
-- Fictional DEMO businesses for local development / QA only.
-- Not real companies. Not real verified financials.
--
-- Dataset: 25 businesses → 20 published, 3 draft, 2 pending
-- Premium published: 8 | asking_price ≈ ₹20 lakh – ₹25 crore (numeric)
-- Location hierarchy: India → State → District → City → Locality (optional)

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
  ('d4000000-0000-4000-8000-000000000007', 'SaaS', 'saas', 'd4000000-0000-4000-8000-000000000003', true),
  ('d4000000-0000-4000-8000-000000000008', 'Retail', 'retail', null, true),
  ('d4000000-0000-4000-8000-000000000009', 'Healthcare', 'healthcare', null, true),
  ('d4000000-0000-4000-8000-000000000010', 'Education', 'education', null, true),
  ('d4000000-0000-4000-8000-000000000011', 'Services', 'services', null, true),
  ('d4000000-0000-4000-8000-000000000012', 'Automotive', 'automotive', null, true),
  ('d4000000-0000-4000-8000-000000000013', 'Beauty & Wellness', 'beauty-wellness', null, true)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  parent_id = excluded.parent_id,
  is_active = excluded.is_active;

-- ---------------------------------------------------------------------------
-- Businesses (numeric currency — format in UI)
-- Demo dataset (~25): 20 published, 3 draft, 2 pending; ~7 premium published
-- ---------------------------------------------------------------------------
insert into public.businesses (
  id, title, slug, description,
  asking_price, annual_revenue, annual_profit, ebitda,
  established_year, employees,
  category_id, state_id, district_id, city_id, locality_id,
  reason_for_sale, status, is_premium, is_verified
) values
  -- 001 published premium — Engineering / Manufacturing / Hyderabad IDA Uppal
  (
    'e5000000-0000-4000-8000-000000000001',
    'Nimbus Precision Engineering Works',
    'nimbus-precision-engineering-hyderabad',
    'Fictional demo listing. Precision engineering and manufacturing workshop with long-term B2B contracts, CNC capacity, and a skilled technician bench in IDA Uppal.',
    250000000, 320000000, 42000000, 68000000,
    2008, 85,
    'd4000000-0000-4000-8000-000000000006',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000004',
    'Founding partners approaching retirement with a full order book.',
    'published', true, true
  ),
  -- 002 published premium — Café / Secunderabad Begumpet
  (
    'e5000000-0000-4000-8000-000000000002',
    'Amber Bean Café & Roastery',
    'amber-bean-cafe-roastery-begumpet',
    'Fictional demo listing. Specialty café and small-batch coffee roastery with strong morning footfall, catering contracts, and a loyal café community in Begumpet.',
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
  -- 003 published — Restaurant / Hyderabad Madhapur
  (
    'e5000000-0000-4000-8000-000000000003',
    'Palm Grove South Indian Restaurant',
    'palm-grove-south-indian-restaurant-madhapur',
    'Fictional demo listing. Neighbourhood restaurant known for authentic South Indian thalis, breakfast service, and consistent lunch-hour cash flow in Madhapur.',
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
  -- 004 published premium — SaaS / Hyderabad Gachibowli
  (
    'e5000000-0000-4000-8000-000000000004',
    'LedgerLoop B2B SaaS Analytics',
    'ledgerloop-b2b-saas-analytics-gachibowli',
    'Fictional demo listing. Recurring-revenue SaaS analytics product for mid-market finance teams, with strong retention and a Gachibowli-based product engineering squad.',
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
  -- 005 draft — excluded from public search
  (
    'e5000000-0000-4000-8000-000000000005',
    'Draft Listing — Coastal Restaurant Concept',
    'draft-coastal-restaurant-concept',
    'Fictional draft only. Incomplete restaurant concept notes for Visakhapatnam. Must NOT appear in public search (status = draft).',
    5000000, null, null, null,
    2020, 5,
    'd4000000-0000-4000-8000-000000000004',
    'a1000000-0000-4000-8000-000000000002',
    'b2000000-0000-4000-8000-000000000003',
    'c3000000-0000-4000-8000-000000000004',
    null,
    null,
    'draft', false, false
  ),
  -- 006 published — Restaurant / Visakhapatnam
  (
    'e5000000-0000-4000-8000-000000000006',
    'Bayleaf Coastal Restaurant',
    'bayleaf-coastal-restaurant-visakhapatnam',
    'Fictional demo listing. Seafood-forward restaurant near the Visakhapatnam coastline with weekend dining demand and a trained kitchen team.',
    8500000, 16000000, 2100000, 3200000,
    2014, 24,
    'd4000000-0000-4000-8000-000000000004',
    'a1000000-0000-4000-8000-000000000002',
    'b2000000-0000-4000-8000-000000000003',
    'c3000000-0000-4000-8000-000000000004',
    null,
    'Owner focusing on a catering-only model.',
    'published', false, true
  ),
  -- 007 published premium — Food & Hospitality / Gachibowli
  (
    'e5000000-0000-4000-8000-000000000007',
    'Orbit Boutique Business Hotel',
    'orbit-boutique-business-hotel-gachibowli',
    'Fictional demo listing. Compact hospitality property targeting IT travellers in Gachibowli, with steady weekday occupancy and corporate meal contracts.',
    120000000, 78000000, 14000000, 21000000,
    2012, 46,
    'd4000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000001',
    'Promoters consolidating hospitality assets.',
    'published', true, true
  ),
  -- 008 published premium — Manufacturing / IDA Uppal
  (
    'e5000000-0000-4000-8000-000000000008',
    'Aether Auto Components Manufacturing',
    'aether-auto-components-manufacturing-ida-uppal',
    'Fictional demo listing. Tier-2 automotive components manufacturing unit with injection moulding lines, OEM purchase orders, and a compliant IDA Uppal facility.',
    85000000, 140000000, 18000000, 26000000,
    2009, 110,
    'd4000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000004',
    'Family transition — next generation pursuing other interests.',
    'published', true, true
  ),
  -- 009 published — Manufacturing / Uppal
  (
    'e5000000-0000-4000-8000-000000000009',
    'ForgeLine CNC Tooling Unit',
    'forgeling-cnc-tooling-unit-uppal',
    'Fictional demo listing. Compact CNC tooling and job-shop manufacturing business serving Hyderabad fabricators from an Uppal industrial shed.',
    42000000, 61000000, 7200000, 9800000,
    2011, 38,
    'd4000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000003',
    'Owner emigrating; plant remains fully staffed.',
    'published', false, false
  ),
  -- 010 published premium — IT & Technology / Madhapur
  (
    'e5000000-0000-4000-8000-000000000010',
    'Northstack Cloud IT Services',
    'northstack-cloud-it-services-madhapur',
    'Fictional demo listing. Managed cloud and IT infrastructure services firm with retainer clients across Hyderabad’s Madhapur tech corridor.',
    68000000, 52000000, 11000000, 15000000,
    2016, 41,
    'd4000000-0000-4000-8000-000000000003',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000002',
    'Founders exploring a strategic merger.',
    'published', true, true
  ),
  -- 011 published — IT & Technology / Gachibowli
  (
    'e5000000-0000-4000-8000-000000000011',
    'PixelForge Mobile App Studio',
    'pixelforge-mobile-app-studio-gachibowli',
    'Fictional demo listing. Productised mobile app development studio delivering Android and iOS builds for startups from a Gachibowli delivery centre.',
    25000000, 31000000, 4800000, 6100000,
    2017, 27,
    'd4000000-0000-4000-8000-000000000003',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000001',
    'Partners diverging on product roadmap priorities.',
    'published', false, false
  ),
  -- 012 published — Retail / Secunderabad Begumpet
  (
    'e5000000-0000-4000-8000-000000000012',
    'Thread & Loom Fashion Retail Store',
    'thread-loom-fashion-retail-begumpet',
    'Fictional demo listing. Multi-brand fashion retail store with strong festival season sales and an established Begumpet high-street frontage.',
    18000000, 42000000, 3600000, 5100000,
    2013, 16,
    'd4000000-0000-4000-8000-000000000008',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000002',
    'f1000000-0000-4000-8000-000000000005',
    'Lease transfer opportunity — owner relocating city.',
    'published', false, true
  ),
  -- 013 published — Café / Uppal (₹20 lakh floor for min-price tests)
  (
    'e5000000-0000-4000-8000-000000000013',
    'Maple Whisk Neighbourhood Café',
    'maple-whisk-neighbourhood-cafe-uppal',
    'Fictional demo listing. Compact neighbourhood café with bakery counter, student evening traffic, and low overheads in Uppal.',
    2000000, 4800000, 720000, 950000,
    2021, 6,
    'd4000000-0000-4000-8000-000000000005',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000003',
    'Owner accepting a full-time corporate role.',
    'published', false, false
  ),
  -- 014 published premium — Healthcare / Gachibowli
  (
    'e5000000-0000-4000-8000-000000000014',
    'CareNest Multispecialty Healthcare Clinic',
    'carenest-multispecialty-healthcare-gachibowli',
    'Fictional demo listing. Day-care healthcare clinic offering outpatient consultations, diagnostics referrals, and corporate health packages in Gachibowli.',
    55000000, 48000000, 9000000, 12000000,
    2015, 34,
    'd4000000-0000-4000-8000-000000000009',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000001',
    'Medical director relocating; operations team intact.',
    'published', true, true
  ),
  -- 015 published — Healthcare / Secunderabad
  (
    'e5000000-0000-4000-8000-000000000015',
    'PathVista Diagnostic Healthcare Lab',
    'pathvista-diagnostic-healthcare-secunderabad',
    'Fictional demo listing. Diagnostic healthcare laboratory with home collection routes across Secunderabad.',
    32000000, 39000000, 5500000, 7400000,
    2016, 29,
    'd4000000-0000-4000-8000-000000000009',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000002',
    'f1000000-0000-4000-8000-000000000005',
    'Investor exit after five-year hold.',
    'published', false, true
  ),
  -- 016 published — Education / Uppal
  (
    'e5000000-0000-4000-8000-000000000016',
    'BrightArc K-12 Education Coaching',
    'brightarc-k12-education-coaching-uppal',
    'Fictional demo listing. After-school education coaching institute for grades 8–12 with recurring term fees and a rented Uppal campus.',
    21000000, 26000000, 4100000, 5600000,
    2011, 21,
    'd4000000-0000-4000-8000-000000000010',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000003',
    'Founder retiring from classroom leadership.',
    'published', false, true
  ),
  -- 017 published — Education / Visakhapatnam
  (
    'e5000000-0000-4000-8000-000000000017',
    'SkillNest Professional Education Academy',
    'skillnest-professional-education-visakhapatnam',
    'Fictional demo listing. Skills and professional education academy offering weekend IT and soft-skills batches in Visakhapatnam.',
    14000000, 19000000, 2800000, 3600000,
    2018, 15,
    'd4000000-0000-4000-8000-000000000010',
    'a1000000-0000-4000-8000-000000000002',
    'b2000000-0000-4000-8000-000000000003',
    'c3000000-0000-4000-8000-000000000004',
    null,
    'Promoters expanding into online-only delivery.',
    'published', false, false
  ),
  -- 018 published — Services / Madhapur
  (
    'e5000000-0000-4000-8000-000000000018',
    'CleanRoute Facilities Management Services',
    'cleanroute-facilities-management-services-madhapur',
    'Fictional demo listing. Commercial facilities management and housekeeping services company with annual contracts across Madhapur offices.',
    38000000, 67000000, 6200000, 8900000,
    2010, 160,
    'd4000000-0000-4000-8000-000000000011',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000002',
    'Owner reducing operational intensity.',
    'published', false, true
  ),
  -- 019 published — Restaurant / Gachibowli
  (
    'e5000000-0000-4000-8000-000000000019',
    'Harvest Table Farm-to-Fork Restaurant',
    'harvest-table-farm-to-fork-restaurant-gachibowli',
    'Fictional demo listing. Contemporary restaurant concept emphasising seasonal menus, weekend brunch, and corporate lunch bookings in Gachibowli.',
    22000000, 35000000, 4300000, 5900000,
    2018, 26,
    'd4000000-0000-4000-8000-000000000004',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000001',
    'Chef-owner focusing on a cloud kitchen brand.',
    'published', false, false
  ),
  -- 020 published — Automotive / Uppal
  (
    'e5000000-0000-4000-8000-000000000020',
    'TorqueBay Multi-Brand Automotive Workshop',
    'torquebay-multibrand-automotive-workshop-uppal',
    'Fictional demo listing. Multi-brand automotive service workshop with alignment bay, detailing add-ons, and fleet accounts in Uppal.',
    16000000, 29000000, 3100000, 4400000,
    2012, 19,
    'd4000000-0000-4000-8000-000000000012',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000003',
    'Owner moving into spare-parts trading.',
    'published', false, true
  ),
  -- 021 published premium — Beauty & Wellness / Madhapur
  (
    'e5000000-0000-4000-8000-000000000021',
    'LumenSpa Beauty & Wellness Studio',
    'lumenspa-beauty-wellness-studio-madhapur',
    'Fictional demo listing. Premium beauty and wellness spa offering facial treatments, massage therapy, and membership packages in Madhapur.',
    28000000, 34000000, 5100000, 6800000,
    2017, 18,
    'd4000000-0000-4000-8000-000000000013',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000002',
    'Brand ready for multi-location franchisee.',
    'published', true, true
  ),
  -- 022 draft
  (
    'e5000000-0000-4000-8000-000000000022',
    'Draft — Quick-Service Restaurant Fit-Out',
    'draft-qsr-restaurant-fitout-hyderabad',
    'Fictional draft only. Placeholder notes for a quick-service restaurant fit-out. Excluded from public search (status = draft).',
    4500000, null, null, null,
    2022, 4,
    'd4000000-0000-4000-8000-000000000004',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000002',
    null,
    'draft', false, false
  ),
  -- 023 draft
  (
    'e5000000-0000-4000-8000-000000000023',
    'Draft — Sheet Metal Manufacturing Expansion',
    'draft-sheet-metal-manufacturing-expansion',
    'Fictional draft only. Internal manufacturing expansion worksheet. Excluded from public search (status = draft).',
    18000000, null, null, null,
    2014, 20,
    'd4000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000004',
    null,
    'draft', false, false
  ),
  -- 024 pending
  (
    'e5000000-0000-4000-8000-000000000024',
    'Pending Review — Organic Grocery Retail',
    'pending-organic-grocery-retail-secunderabad',
    'Fictional pending listing. Organic grocery retail concept awaiting marketplace review. Must NOT appear in public search (status = pending).',
    11000000, 17000000, 1500000, 2100000,
    2020, 9,
    'd4000000-0000-4000-8000-000000000008',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000002',
    'f1000000-0000-4000-8000-000000000005',
    'Seller submitted for review.',
    'pending', false, false
  ),
  -- 025 pending
  (
    'e5000000-0000-4000-8000-000000000025',
    'Pending Review — Urban Wellness Studio',
    'pending-urban-wellness-studio-gachibowli',
    'Fictional pending listing. Beauty and wellness studio franchise application awaiting review. Must NOT appear in public search (status = pending).',
    9000000, 12000000, 1400000, 1900000,
    2021, 8,
    'd4000000-0000-4000-8000-000000000013',
    'a1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000001',
    'Documents under verification.',
    'pending', false, false
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
-- Business images (published listings only)
-- 5 businesses have 2–3 images for gallery testing: 001, 002, 004, 007, 014
-- ---------------------------------------------------------------------------
delete from public.business_images
where business_id in (
  'e5000000-0000-4000-8000-000000000001',
  'e5000000-0000-4000-8000-000000000002',
  'e5000000-0000-4000-8000-000000000003',
  'e5000000-0000-4000-8000-000000000004',
  'e5000000-0000-4000-8000-000000000006',
  'e5000000-0000-4000-8000-000000000007',
  'e5000000-0000-4000-8000-000000000008',
  'e5000000-0000-4000-8000-000000000009',
  'e5000000-0000-4000-8000-000000000010',
  'e5000000-0000-4000-8000-000000000011',
  'e5000000-0000-4000-8000-000000000012',
  'e5000000-0000-4000-8000-000000000013',
  'e5000000-0000-4000-8000-000000000014',
  'e5000000-0000-4000-8000-000000000015',
  'e5000000-0000-4000-8000-000000000016',
  'e5000000-0000-4000-8000-000000000017',
  'e5000000-0000-4000-8000-000000000018',
  'e5000000-0000-4000-8000-000000000019',
  'e5000000-0000-4000-8000-000000000020',
  'e5000000-0000-4000-8000-000000000021'
);

insert into public.business_images (business_id, image_url, sort_order, is_primary) values
  ('e5000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80', 1, false),
  ('e5000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&q=80', 2, false),
  ('e5000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80', 1, false),
  ('e5000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000004', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000004', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80', 1, false),
  ('e5000000-0000-4000-8000-000000000006', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000007', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000007', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80', 1, false),
  ('e5000000-0000-4000-8000-000000000007', 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80', 2, false),
  ('e5000000-0000-4000-8000-000000000008', 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000009', 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000010', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000010', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80', 1, false),
  ('e5000000-0000-4000-8000-000000000011', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000012', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000013', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000014', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000014', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80', 1, false),
  ('e5000000-0000-4000-8000-000000000015', 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000016', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000017', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000018', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000019', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000020', 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&q=80', 0, true),
  ('e5000000-0000-4000-8000-000000000021', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80', 0, true);
