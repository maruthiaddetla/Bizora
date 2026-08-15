-- Phase 4A verification queries (run in Supabase SQL Editor after migration)
-- These are NOT executed by the app. Paste individually after applying 003_*.sql.

-- 1) profiles table exists
select to_regclass('public.profiles') as profiles_table;

-- 2) seller_id FK
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.businesses'::regclass
  and conname = 'businesses_seller_id_fkey';

-- 3) status values allowed
select pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.businesses'::regclass
  and conname = 'businesses_status_check';

-- 4) RLS policies on businesses / images / profiles
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'businesses', 'business_images')
order by tablename, policyname;

-- 5) Public published visibility (anon): count published
-- Expect: matches seed published count (20) when using anon key / no JWT
select count(*) as published_count
from public.businesses
where status = 'published';

-- 6) Owner visibility — requires an authenticated seller JWT.
-- After creating a test user + profile and a draft listing owned by them:
--   select id, title, status from public.businesses where seller_id = auth.uid();

-- 7) Seller cannot publish — expect exception from trigger/RLS:
--   update public.businesses
--   set status = 'published'
--   where id = '<owned-draft-id>';

-- 8) Seller cannot modify another seller's listing — expect 0 rows / RLS denial:
--   update public.businesses
--   set title = 'hacked'
--   where seller_id <> auth.uid();
