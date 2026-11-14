-- Review and apply only with approval. Uses existing public.profiles, not a parallel user_profiles table.
begin;
alter table public.profiles alter column role set default 'msl';
create or replace function public.provision_registered_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, organization_id, is_demo_user)
  values (new.id, new.email,
    coalesce(nullif(left(trim(new.raw_user_meta_data ->> 'full_name'), 100), ''), 'New member'),
    'msl', null, false)
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.provision_registered_profile() from public, anon, authenticated;
create trigger auth_user_provision_profile after insert on auth.users
for each row execute function public.provision_registered_profile();

-- Nonmembers can only inspect their own profile. Restrictive policies combine
-- with existing role/workflow policies; they never grant a new capability.
create policy profiles_tenant_guard on public.profiles as restrictive
for select to authenticated using (id = auth.uid() or public.has_current_org(organization_id));

-- Generic guard for pre-existing tables without organization columns. A pending
-- account gets no operational access even through direct PostgREST calls.
do $$
declare tbl text;
begin
  for tbl in select tablename from pg_tables where schemaname = 'public'
    and tablename not in ('profiles', 'organizations', 'organization_memberships')
  loop
    execute format('create policy pending_account_guard on public.%I as restrictive for all to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and public.has_current_org(p.organization_id))) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and public.has_current_org(p.organization_id)))', tbl);
  end loop;
end;
$$;
commit;
