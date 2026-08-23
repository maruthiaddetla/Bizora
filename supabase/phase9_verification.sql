-- Bizora Phase 9: Commercial Spaces verification
-- Run AFTER applying 012_commercial_spaces.sql
-- Uses service role or authenticated test accounts as noted per test.

-- ---------------------------------------------------------------------------
-- 1–4. Anonymous visibility (published yes; draft/pending/rejected no)
-- Run with anon key / no JWT:
-- ---------------------------------------------------------------------------
-- select id, title, listing_type, status from public.businesses
-- where listing_type = 'commercial_space' and status = 'published';
-- Expected: only published commercial rows visible via RLS

-- select id from public.businesses
-- where listing_type = 'commercial_space' and status in ('draft','pending','rejected');
-- Expected: 0 rows for anon

-- ---------------------------------------------------------------------------
-- 5–9. Seller commercial draft lifecycle (authenticated seller)
-- ---------------------------------------------------------------------------
-- insert into public.businesses (
--   title, slug, seller_id, status, listing_type,
--   space_type, listing_purpose, monthly_rent, area_sqft
-- ) values (
--   'Test Commercial Draft', 'test-commercial-draft', auth.uid(), 'draft', 'commercial_space',
--   'office', 'rent', 50000, 1200
-- );
-- Expected: success

-- update public.businesses set title = 'Updated Draft'
-- where seller_id = auth.uid() and listing_type = 'commercial_space' and status = 'draft';
-- Expected: success for owner

-- update public.businesses set title = 'Hijack'
-- where listing_type = 'commercial_space' and seller_id <> auth.uid();
-- Expected: RLS blocks or 0 rows updated

-- update public.businesses set status = 'published'
-- where seller_id = auth.uid() and listing_type = 'commercial_space';
-- Expected: trigger/RLS exception — sellers cannot publish directly

-- ---------------------------------------------------------------------------
-- 10–12. Admin approve/reject/resubmit
-- ---------------------------------------------------------------------------
-- As admin: update status = 'published' where status = 'pending' and listing_type = 'commercial_space';
-- Expected: success

-- As admin: update status = 'rejected', rejection_reason = 'Incomplete photos'
-- Expected: success

-- As seller: update status = 'pending' from rejected after fixing fields
-- Expected: success when required commercial fields + images present

-- ---------------------------------------------------------------------------
-- 13–14. Buyer favourite + enquiry
-- ---------------------------------------------------------------------------
-- insert into public.favorites (user_id, business_id)
-- select auth.uid(), id from public.businesses
-- where listing_type = 'commercial_space' and status = 'published' limit 1;
-- Expected: success for buyer

-- insert into public.enquiries (business_id, buyer_id, message)
-- select id, auth.uid(), 'Is this space still available?'
-- from public.businesses
-- where listing_type = 'commercial_space' and status = 'published' limit 1;
-- Expected: success; seller_id derived from businesses.seller_id via trigger

-- ---------------------------------------------------------------------------
-- 15–16. Notifications + images (manual app verification)
-- ---------------------------------------------------------------------------
-- Submit commercial listing → seller/admin notification rows created (010 triggers)
-- Upload image to business-images bucket for owned commercial draft
-- Expected: same ownership rules as business listings

-- ---------------------------------------------------------------------------
-- 17. Max image count (unchanged from 005 — manual app test)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 18. Public seller profile includes commercial listing
-- ---------------------------------------------------------------------------
-- select id, title, listing_type from public.businesses
-- where seller_id = '<seller_uuid>' and status = 'published';
-- Expected: both business and commercial_space rows when published

-- ---------------------------------------------------------------------------
-- 19–20. Existing business behaviour unchanged
-- ---------------------------------------------------------------------------
select
  count(*) filter (where listing_type = 'business') as business_rows,
  count(*) filter (where listing_type is null) as null_type_rows
from public.businesses;
-- Expected: null_type_rows = 0; business_rows = total existing seed count

-- Verify business-only submit still requires asking_price (app + existing triggers)
select id, title, listing_type, asking_price, monthly_rent
from public.businesses
where listing_type = 'business' and status = 'published'
limit 5;
-- Expected: asking_price populated; commercial columns null

-- listing_type immutability for sellers
-- update public.businesses set listing_type = 'commercial_space'
-- where seller_id = auth.uid() and listing_type = 'business';
-- Expected: exception 'sellers cannot change listing_type'
