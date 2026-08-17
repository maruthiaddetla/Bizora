-- Phase 4D verification queries
-- Admin review & listing moderation
-- Mark PASS only after executing against your live project.
-- No migration 006 was required; uses existing is_admin() + RLS from 003.

-- Setup
-- 1. Promote a test user to admin manually:
--    update public.profiles set role = 'admin' where id = '<admin_user_uuid>';
-- 2. Use a separate seller user for listing submission tests.
-- 3. Do not reassign seed businesses.

-- 1. Anonymous cannot access /admin
-- App: open /admin while signed out → redirect to /sign-in?next=/admin

-- 2. Authenticated buyer cannot access /admin
-- App: sign in as buyer → /admin → Access denied (403)

-- 3. Seller cannot access /admin
-- App: sign in as seller → /admin → Access denied

-- 4. Admin can access admin listings
-- App: sign in as admin → /admin and /admin/listings load

-- 5. Seller cannot publish own listing
-- As seller JWT:
-- update public.businesses
-- set status = 'published'
-- where id = '<own_pending_or_draft_id>';
-- Expected: blocked by seller guards and/or RLS (0 rows / exception)

-- 6. Seller cannot approve another listing
-- As seller JWT:
-- update public.businesses
-- set status = 'published', reviewed_by = auth.uid(), reviewed_at = now()
-- where id = '<other_pending_id>';
-- Expected: 0 rows / exception

-- 7. Seller cannot modify reviewed_by
-- As seller on own draft/rejected:
-- update public.businesses set reviewed_by = auth.uid() where id = '<own_id>';
-- Expected: ERROR sellers cannot change review fields

-- 8. Seller cannot modify reviewed_at
-- update public.businesses set reviewed_at = now() where id = '<own_id>';
-- Expected: ERROR sellers cannot change review fields

-- 9. Seller cannot set published directly
-- update public.businesses set status = 'published' where id = '<own_draft_id>';
-- Expected: ERROR / RLS denial

-- 10. Admin can approve pending listing
-- As admin JWT / app Approve & Publish:
-- update ... status='published', reviewed_by=auth.uid(), reviewed_at=now(), rejection_reason=null
-- where id = '<pending_id>' and status = 'pending';
-- Expected: 1 row; listing appears on public /listings

-- 11. Admin can reject pending listing
-- App Reject with reason ≥ 10 chars
-- Expected: status=rejected, rejection_reason set, reviewed_* set

-- 12. Rejection requires reason
-- App: reject with empty / short reason
-- Expected: validation error (min 10 characters); status remains pending

-- 13. Pending listings remain hidden from public search
-- set role anon;
-- select count(*) from public.businesses where status = 'pending';
-- Expected: 0
-- reset role;

-- 14. Rejected listings remain hidden from public search
-- set role anon;
-- select count(*) from public.businesses where status = 'rejected';
-- Expected: 0
-- reset role;

-- 15. Published listings are publicly searchable
-- set role anon;
-- select count(*) from public.businesses where status = 'published';
-- Expected: count > 0
-- reset role;

-- 16. Only admins can populate reviewed_by/reviewed_at through workflow
-- Sellers blocked by enforce_business_seller_guards.
-- Admins bypass and set fields via approveListing / rejectListing.

-- Execution log
-- [ ] 1 anon /admin — NOT RUN IN AGENT
-- [ ] 2 buyer /admin — NOT RUN IN AGENT
-- [ ] 3 seller /admin — NOT RUN IN AGENT
-- [ ] 4 admin access — NOT RUN IN AGENT
-- [ ] 5 seller cannot publish — NOT RUN IN AGENT
-- [ ] 6 seller cannot approve other — NOT RUN IN AGENT
-- [ ] 7 seller cannot set reviewed_by — NOT RUN IN AGENT
-- [ ] 8 seller cannot set reviewed_at — NOT RUN IN AGENT
-- [ ] 9 seller cannot set published — NOT RUN IN AGENT
-- [ ] 10 admin approve — NOT RUN IN AGENT
-- [ ] 11 admin reject — NOT RUN IN AGENT
-- [ ] 12 rejection reason required — NOT RUN IN AGENT
-- [ ] 13 pending hidden — NOT RUN IN AGENT
-- [ ] 14 rejected hidden — NOT RUN IN AGENT
-- [ ] 15 published public — NOT RUN IN AGENT
-- [ ] 16 review fields admin-only — NOT RUN IN AGENT
