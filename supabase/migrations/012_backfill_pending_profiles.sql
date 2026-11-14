-- Requires explicit production approval. Existing Auth identities only;
-- no Auth users, memberships, role upgrades, or tenant assignments are created.
begin;
insert into public.profiles (id, email, full_name, role, organization_id, is_demo_user)
select u.id, u.email,
  coalesce(nullif(left(trim(u.raw_user_meta_data ->> 'full_name'), 100), ''), 'New member'),
  'msl'::public.user_role, null, false
from auth.users u
where u.email is not null
  and not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
commit;
