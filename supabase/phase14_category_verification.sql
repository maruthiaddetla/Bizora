-- Verify category taxonomy after migration 014
-- Expect ~20 active business categories + commercial children

-- Active business categories (exclude commercial hierarchy)
select c.name, c.slug
from public.categories c
where c.is_active = true
  and c.slug <> 'commercial-spaces'
  and (
    c.parent_id is null
    or c.parent_id not in (
      select id from public.categories where slug = 'commercial-spaces'
    )
  )
order by c.name;

select count(*) as active_business_categories
from public.categories c
where c.is_active = true
  and c.slug <> 'commercial-spaces'
  and (
    c.parent_id is null
    or c.parent_id not in (
      select id from public.categories where slug = 'commercial-spaces'
    )
  );

-- Commercial children
select name, slug
from public.categories
where is_active = true
  and parent_id = (select id from public.categories where slug = 'commercial-spaces')
order by name;

-- No listings pointing at inactive categories
select b.id, b.title, b.category_id, c.slug, c.is_active
from public.businesses b
left join public.categories c on c.id = b.category_id
where c.is_active is distinct from true;
