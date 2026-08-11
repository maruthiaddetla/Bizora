-- Sample row for homepage Premium Opportunities (first card)
-- id "1" matches the existing Business Details page route

insert into public.businesses (
  id,
  title,
  location,
  price,
  description,
  image_url,
  category,
  premium
) values (
  '1',
  'Engineering Business for Sale (Supabase)',
  'Hyderabad',
  '₹20.5 Cr',
  'Highly regarded engineering business with long-term contracts and skilled workforce. Loaded from Supabase.',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
  'Manufacturing',
  true
)
on conflict (id) do update set
  title = excluded.title,
  location = excluded.location,
  price = excluded.price,
  description = excluded.description,
  image_url = excluded.image_url,
  category = excluded.category,
  premium = excluded.premium,
  updated_at = now();
