-- Bizora Phase 4D fix: allow admins to read private business-images for review
-- Additive only. Does not modify migrations 001–005 or change bucket visibility.
--
-- Root cause: createSignedUrl for unpublished Storage objects failed for admins
-- because SELECT was limited to object-path owners or published businesses.
-- Admins already read business_images rows via table RLS; they need Storage SELECT
-- to mint signed URLs on the admin review page.

-- Admins may SELECT (download / createSignedUrl) objects in business-images.
-- No INSERT / UPDATE / DELETE granted here.
drop policy if exists "Admins read business images" on storage.objects;

create policy "Admins read business images"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'business-images'
    and public.is_admin()
  );
