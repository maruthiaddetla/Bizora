-- Phase 4C-2B verification queries
-- Run after applying supabase/migrations/005_business_image_storage.sql
-- Replace placeholders. Mark PASS only after executing against your project.

-- Setup
-- 1. Apply migration 005
-- 2. Use Seller A / Seller B JWTs or the app UI
-- 3. Do not modify seed Unsplash business_images rows

-- 1. Owner can upload image to own draft
-- App: edit own draft → Add Photos
-- SQL after upload:
-- select id, business_id, storage_path, is_primary, sort_order
-- from public.business_images
-- where business_id = '<owned_draft_id>';
-- Expected: row with storage_path like '{auth.uid()}/{business_id}/{uuid}.ext'

-- 2. Owner cannot upload to another owner's business
-- insert into public.business_images (business_id, image_url, storage_path, sort_order, is_primary)
-- values ('<other_owner_draft_id>', 'x', 'path', 0, true);
-- Expected: RLS denial / 0 rows or error

-- 3. Owner cannot upload when business is pending
-- (Set listing pending first, then attempt insert/upload)
-- Expected: owner_can_edit_business_images = false; insert denied

-- 4. Owner cannot upload when business is published
-- Expected: insert denied

-- 5. Owner can delete image from own draft
-- delete from public.business_images where id = '<owned_image_id>';
-- Expected: 1 row deleted; Storage object removed via app action

-- 6. Owner cannot delete another owner's image
-- As Seller B: delete from public.business_images where id = '<seller_a_image_id>';
-- Expected: 0 rows

-- 7. Owner cannot change primary on another business
-- select public.set_primary_business_image('<other_owner_image_id>');
-- Expected: ERROR not allowed

-- 8. Owner cannot reorder another business's images
-- As Seller B: update public.business_images set sort_order = 99 where id = '<seller_a_image_id>';
-- Expected: 0 rows

-- 9. Anonymous user cannot upload
-- set role anon;
-- insert into storage.objects ... / insert business_images ...
-- Expected: denial
-- reset role;

-- 10. Anonymous user cannot access private unpublished images
-- set role anon;
-- select * from storage.objects where bucket_id = 'business-images' and name like '%/<draft_business_id>/%';
-- Expected: 0 rows (draft not published)
-- Also: createSignedUrl for draft path as anon should fail
-- reset role;

-- 11. Published images remain visible through the public listing
-- App: open /listings/<published_id>
-- Seed Unsplash URLs still render; Storage-backed published images resolve via signed URL

-- 12. Only one primary image exists
-- select business_id, count(*) filter (where is_primary) as primary_count
-- from public.business_images
-- group by business_id
-- having count(*) filter (where is_primary) > 1;
-- Expected: 0 rows (unique index + set_primary_business_image)

-- 13. Maximum 8 images enforced
-- Attempt 9th insert for one business
-- Expected: ERROR maximum of 8 images per business (or app message)

-- 14. Invalid file type rejected
-- App/server: upload SVG/GIF/PDF
-- Expected: friendly rejection (magic-byte check)

-- 15. File > 5 MB rejected
-- App/server: upload > 5MB
-- Expected: friendly rejection

-- 16. Submit with zero images rejected
-- submitListingForReview with no business_images
-- Expected: field error "Please upload at least one business photo."

-- 17. Submit with no primary image rejected
-- If somehow images exist without primary:
-- Expected: "Please select a primary business photo."

-- Seed integrity
-- select count(*) from public.business_images where storage_path is null;
-- Expected: seed Unsplash rows unchanged (storage_path null)

-- Execution log (fill after running)
-- [ ] 1 upload own draft — NOT RUN IN AGENT
-- [ ] 2 cannot upload other owner — NOT RUN IN AGENT
-- [ ] 3 cannot upload pending — NOT RUN IN AGENT
-- [ ] 4 cannot upload published — NOT RUN IN AGENT
-- [ ] 5 delete own draft image — NOT RUN IN AGENT
-- [ ] 6 cannot delete other owner — NOT RUN IN AGENT
-- [ ] 7 cannot set primary other — NOT RUN IN AGENT
-- [ ] 8 cannot reorder other — NOT RUN IN AGENT
-- [ ] 9 anon cannot upload — NOT RUN IN AGENT
-- [ ] 10 anon cannot access unpublished storage — NOT RUN IN AGENT
-- [ ] 11 published still visible — NOT RUN IN AGENT
-- [ ] 12 one primary — NOT RUN IN AGENT
-- [ ] 13 max 8 — NOT RUN IN AGENT
-- [ ] 14 invalid type — NOT RUN IN AGENT
-- [ ] 15 oversize — NOT RUN IN AGENT
-- [ ] 16 submit zero images — NOT RUN IN AGENT
-- [ ] 17 submit no primary — NOT RUN IN AGENT
