-- Allow edit revisions to reference the same Storage object as the published
-- listing without duplicating bytes. Paths stay unique per listing.
-- Global unique on storage_path blocked revision image clones (PGRST / 23505).

drop index if exists public.business_images_storage_path_uidx;

create unique index if not exists business_images_business_storage_path_uidx
  on public.business_images (business_id, storage_path)
  where storage_path is not null;

comment on index public.business_images_business_storage_path_uidx is
  'Storage path unique per listing so published + revision can share the same object.';
