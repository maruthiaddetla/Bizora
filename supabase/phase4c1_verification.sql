-- Phase 4C-1 verification notes (run in Supabase SQL Editor / Auth tests)
-- These document ownership expectations. Live JWT tests require real seller sessions.
-- Do not claim these passed unless you executed them with authenticated clients.

-- ---------------------------------------------------------------------------
-- 1) Seller A can see Seller A listings (as Seller A JWT)
-- ---------------------------------------------------------------------------
-- select id, title, status, seller_id
-- from public.businesses
-- where seller_id = auth.uid()
-- order by updated_at desc;

-- ---------------------------------------------------------------------------
-- 2) Seller A cannot see Seller B listings (as Seller A JWT)
-- ---------------------------------------------------------------------------
-- Expected: 0 rows when substituting Seller B's UUID for <seller_b_id>
-- select id, title
-- from public.businesses
-- where seller_id = '<seller_b_id>';

-- ---------------------------------------------------------------------------
-- 3) Seller B cannot see Seller A listings (as Seller B JWT)
-- ---------------------------------------------------------------------------
-- Expected: 0 rows when substituting Seller A's UUID for <seller_a_id>
-- select id, title
-- from public.businesses
-- where seller_id = '<seller_a_id>';

-- ---------------------------------------------------------------------------
-- 4) Anonymous users cannot see drafts
-- ---------------------------------------------------------------------------
-- Using anon key / no JWT:
-- select count(*) as draft_visible
-- from public.businesses
-- where status = 'draft';
-- Expected: 0 (RLS only allows published for public SELECT)

-- ---------------------------------------------------------------------------
-- 5) Public users can still see published listings
-- ---------------------------------------------------------------------------
-- select count(*) as published_visible
-- from public.businesses
-- where status = 'published';
-- Expected: matches seed published count (e.g. 20)

-- ---------------------------------------------------------------------------
-- 6) Admin can see all listings (as admin JWT, profiles.role = 'admin')
-- ---------------------------------------------------------------------------
-- select status, count(*)
-- from public.businesses
-- group by status
-- order by status;
-- Expected: includes draft/pending/rejected/published/sold when admin policy applies

-- ---------------------------------------------------------------------------
-- App-layer ownership (Bizora repository)
-- ---------------------------------------------------------------------------
-- fetchMyBusinesses(user.id) always adds:
--   .eq('seller_id', sellerId)
-- RLS remains the security boundary; the eq filter is defence in depth.
