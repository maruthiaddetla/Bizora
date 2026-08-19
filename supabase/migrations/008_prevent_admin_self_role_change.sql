-- Bizora Phase 5C: prevent admin self-downgrade via profiles UPDATE (PROF-5B).
-- Additive replacement of enforce_profile_role_guards only.
-- Does not modify migrations 001–007, RLS policies, or is_admin().

create or replace function public.enforce_profile_role_guards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  -- Admins may change another user's role. They may not change their own.
  if public.is_admin() then
    if tg_op = 'UPDATE'
       and new.role is distinct from old.role
       and new.id = auth.uid() then
      raise exception 'admins cannot change their own role';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    -- Controlled promotion via promote_to_seller() only
    if old.role = 'buyer'
       and new.role = 'seller'
       and current_setting('bizora.allow_seller_promotion', true) = 'on' then
      return new;
    end if;
    raise exception 'users cannot change their own role';
  end if;

  if tg_op = 'INSERT' and new.role is distinct from 'buyer' and new.id = auth.uid() then
    new.role := 'buyer';
  end if;

  return new;
end;
$$;
