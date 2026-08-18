-- Phase 4E verification queries
-- Buyer ↔ seller enquiries
-- Mark PASS only after executing against your live project.
-- Requires migration 007_enquiries.sql applied.

-- Setup
-- 1. buyer_a, buyer_b: two distinct buyer accounts (role buyer)
-- 2. seller_a: seller with a published listing (seller_id set, status published)
-- 3. admin: profiles.role = 'admin'
-- 4. seed listing: published business with seller_id IS NULL
-- 5. draft_id / pending_id: non-published listings owned by seller_a
--
-- Use Supabase SQL editor with JWT simulation:
--   select set_config('request.jwt.claim.sub', '<user_uuid>', true);
-- Or test via app + direct SQL as authenticated role.

-- ---------------------------------------------------------------------------
-- 1. Anonymous cannot create enquiry
-- ---------------------------------------------------------------------------
-- set role anon;
-- insert into public.enquiries (business_id, buyer_id, seller_id, message)
-- values ('<published_business_id>', '<buyer_a>', '<seller_a>', 'Test message here');
-- Expected: RLS violation / not authenticated trigger error
-- reset role;

-- App: open /listings/<published_id> signed out → Sign In to Enquire (no form submit)

-- ---------------------------------------------------------------------------
-- 2. Buyer can create enquiry for published listing
-- ---------------------------------------------------------------------------
-- As buyer_a JWT / app Contact Seller form:
-- insert into public.enquiries (business_id, buyer_id, message)
-- values ('<published_business_id>', auth.uid(), 'I am interested in this business.');
-- Expected: 1 row; seller_id derived from businesses.seller_id; status = new

-- ---------------------------------------------------------------------------
-- 3. Buyer cannot create enquiry for draft
-- ---------------------------------------------------------------------------
-- As buyer_a:
-- insert into public.enquiries (business_id, buyer_id, message)
-- values ('<draft_business_id>', auth.uid(), 'Draft listing enquiry test.');
-- Expected: ERROR enquiries only allowed for published businesses

-- ---------------------------------------------------------------------------
-- 4. Buyer cannot create enquiry for pending
-- ---------------------------------------------------------------------------
-- As buyer_a:
-- insert into public.enquiries (business_id, buyer_id, message)
-- values ('<pending_business_id>', auth.uid(), 'Pending listing enquiry test.');
-- Expected: ERROR enquiries only allowed for published businesses

-- ---------------------------------------------------------------------------
-- 5. Buyer cannot spoof seller_id
-- ---------------------------------------------------------------------------
-- As buyer_a on published listing:
-- insert into public.enquiries (business_id, buyer_id, seller_id, message)
-- values ('<published_business_id>', auth.uid(), '<wrong_seller_uuid>', 'Spoof test message.');
-- Expected: seller_id overwritten by trigger to businesses.seller_id (not wrong uuid)

-- Verify:
-- select seller_id from public.enquiries where buyer_id = '<buyer_a>' order by created_at desc limit 1;
-- Expected: seller_id = businesses.seller_id for that business

-- ---------------------------------------------------------------------------
-- 6. Buyer A cannot read Buyer B's enquiries
-- ---------------------------------------------------------------------------
-- As buyer_a JWT:
-- select * from public.enquiries where buyer_id = '<buyer_b>';
-- Expected: 0 rows (RLS hides other buyers' enquiries)

-- ---------------------------------------------------------------------------
-- 7. Seller can read enquiries for own listing
-- ---------------------------------------------------------------------------
-- As seller_a JWT:
-- select * from public.enquiries where seller_id = auth.uid();
-- Expected: rows for enquiries on seller_a listings only

-- ---------------------------------------------------------------------------
-- 8. Seller cannot read another seller's enquiries
-- ---------------------------------------------------------------------------
-- As seller_a JWT:
-- select * from public.enquiries where seller_id = '<other_seller_uuid>';
-- Expected: 0 rows

-- ---------------------------------------------------------------------------
-- 9. Seller can respond to own enquiry
-- ---------------------------------------------------------------------------
-- As seller_a on open enquiry:
-- update public.enquiries
-- set seller_response = 'Thanks for your interest, happy to discuss.',
--     status = 'responded',
--     responded_at = now()
-- where id = '<enquiry_id>' and seller_id = auth.uid();
-- Expected: 1 row updated

-- App: /dashboard/enquiries/<id> → Send Response

-- ---------------------------------------------------------------------------
-- 10. Seller cannot modify buyer_id
-- ---------------------------------------------------------------------------
-- As seller_a:
-- update public.enquiries set buyer_id = '<other_buyer>' where id = '<enquiry_id>';
-- Expected: ERROR cannot change buyer_id

-- ---------------------------------------------------------------------------
-- 11. Seller cannot modify seller_id
-- ---------------------------------------------------------------------------
-- As seller_a:
-- update public.enquiries set seller_id = '<other_seller>' where id = '<enquiry_id>';
-- Expected: ERROR cannot change seller_id

-- ---------------------------------------------------------------------------
-- 12. Seller cannot modify business_id
-- ---------------------------------------------------------------------------
-- As seller_a:
-- update public.enquiries set business_id = '<other_business>' where id = '<enquiry_id>';
-- Expected: ERROR cannot change business_id

-- ---------------------------------------------------------------------------
-- 13. Seller cannot respond after closed
-- ---------------------------------------------------------------------------
-- Close first:
-- update public.enquiries set status = 'closed' where id = '<enquiry_id>' and seller_id = auth.uid();
-- Then:
-- update public.enquiries
-- set seller_response = 'Another reply', status = 'responded'
-- where id = '<enquiry_id>';
-- Expected: ERROR closed enquiries cannot be modified

-- ---------------------------------------------------------------------------
-- 14. Buyer can read own enquiry and seller response
-- ---------------------------------------------------------------------------
-- As buyer_a JWT:
-- select message, seller_response, status from public.enquiries
-- where buyer_id = auth.uid() and id = '<enquiry_id>';
-- Expected: 1 row with buyer message and seller_response visible

-- App: /dashboard/enquiries shows sent enquiry + seller reply

-- ---------------------------------------------------------------------------
-- 15. Admin can read enquiries
-- ---------------------------------------------------------------------------
-- As admin JWT:
-- select count(*) from public.enquiries;
-- Expected: count >= test enquiries created

-- ---------------------------------------------------------------------------
-- 16. Seed listings with seller_id null cannot receive enquiries
-- ---------------------------------------------------------------------------
-- As buyer_a:
-- insert into public.enquiries (business_id, buyer_id, message)
-- values ('<seed_published_null_seller_id>', auth.uid(), 'Seed listing enquiry test.');
-- Expected: ERROR business has no seller

-- App: /listings/<seed_id> → "Seller contact is currently unavailable."

-- ---------------------------------------------------------------------------
-- Additional: mark as read (new → read)
-- ---------------------------------------------------------------------------
-- As seller_a on status = new:
-- update public.enquiries set status = 'read' where id = '<enquiry_id>' and status = 'new';
-- Expected: 1 row; app auto-marks read when seller opens detail page

-- ---------------------------------------------------------------------------
-- Public regression (manual app checks)
-- ---------------------------------------------------------------------------
-- /, /listings, /listings/[id], /sign-in, /sign-up,
-- /dashboard, /dashboard/listings/new, /dashboard/listings/[id]/edit,
-- /dashboard/listings/[id]/preview, /admin, /admin/listings
-- Expected: all load without regression
