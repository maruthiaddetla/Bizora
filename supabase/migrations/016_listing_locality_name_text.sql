-- Free-text locality for listing create/edit forms.
-- businesses.locality_id remains a UUID FK for legacy/search filter data;
-- sellers now enter an optional locality name as plain text.

alter table public.businesses
  add column if not exists locality_name text;

comment on column public.businesses.locality_name is
  'Optional free-text locality/area entered by the seller (e.g. Banjara Hills).';
