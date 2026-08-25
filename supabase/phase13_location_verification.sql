-- Verify India-wide location expansion (run after 013_india_wide_locations.sql)
-- Expect: 28 states (non-UT) + 8 UTs = 36 rows in public.states

select count(*) as state_ut_count from public.states;

select name, code
from public.states
order by name;

-- Target cities
select s.name as state, c.name as city
from public.cities c
join public.districts d on d.id = c.district_id
join public.states s on s.id = d.state_id
where (s.name, c.name) in (
  ('Telangana', 'Hyderabad'),
  ('Telangana', 'Secunderabad'),
  ('Karnataka', 'Bengaluru'),
  ('Maharashtra', 'Mumbai'),
  ('Tamil Nadu', 'Chennai'),
  ('Delhi', 'New Delhi'),
  ('Delhi', 'Delhi'),
  ('Andhra Pradesh', 'Visakhapatnam')
)
order by s.name, c.name;

-- Existing locality FKs still valid
select l.name as locality, c.name as city
from public.localities l
join public.cities c on c.id = l.city_id
where c.id in (
  'c3000000-0000-4000-8000-000000000001',
  'c3000000-0000-4000-8000-000000000002'
)
order by c.name, l.name;

-- Duplicate name check (states)
select name, count(*)
from public.states
group by name
having count(*) > 1;
