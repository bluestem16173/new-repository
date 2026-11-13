-- REVIEW ONLY: not applied by this repair. Requires staging verification as authenticated users.
-- Existing roles remain app-wide; this adds tenant constraints rather than replacing workflow policies.
begin;
create or replace function public.has_current_org(target uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select target is not null and exists (
    select 1 from public.organization_memberships m
    join public.profiles p on p.id = m.profile_id
    where m.profile_id = auth.uid() and m.organization_id = target
      and p.organization_id = target
  );
$$;
revoke all on function public.has_current_org(uuid) from public;
grant execute on function public.has_current_org(uuid) to authenticated;

-- Remove recursive self-reference in membership SELECT policy.
drop policy if exists organization_memberships_select on public.organization_memberships;
create policy organization_memberships_select on public.organization_memberships
for select to authenticated using (profile_id = auth.uid());

-- No browser-authenticated account may provision its own role/tenant.
-- Provisioning uses a trusted administrator workflow outside ordinary profile editing.
create or replace function public.guard_profile_authority()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and (
    new.role is distinct from old.role or
    new.organization_id is distinct from old.organization_id or
    new.is_demo_user is distinct from old.is_demo_user or
    new.id is distinct from old.id
  ) then
    raise exception 'Profile authority fields require trusted administrative provisioning';
  end if;
  return new;
end;
$$;
create trigger profiles_guard_authority before update on public.profiles
for each row execute function public.guard_profile_authority();

create policy inquiry_tenant_guard on public.medical_inquiries as restrictive
for all to authenticated using (public.has_current_org(organization_id))
with check (public.has_current_org(organization_id));
create policy knowledge_tenant_guard on public.knowledge_items as restrictive
for all to authenticated using (public.has_current_org(organization_id))
with check (public.has_current_org(organization_id));
create policy security_audit_tenant_guard on public.security_audit_events as restrictive
for all to authenticated using (public.has_current_org(organization_id))
with check (public.has_current_org(organization_id) and actor_id = auth.uid());

-- Approval must be an independent human decision, including direct API inserts.
create or replace function public.guard_independent_knowledge_approval()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.owner_profile_id is distinct from old.owner_profile_id then
    raise exception 'Knowledge authorship cannot be reassigned through ordinary updates';
  end if;
  if new.status = 'approved' then
    if auth.uid() is null or public.current_user_role() not in ('admin', 'medical_reviewer')
       or new.owner_profile_id is null or new.owner_profile_id = auth.uid() or new.data_classification = 'restricted' then
      raise exception 'Independent authorized approval of nonrestricted knowledge required';
    end if;
  end if;
  return new;
end;
$$;
create trigger knowledge_independent_approval before insert or update on public.knowledge_items
for each row execute function public.guard_independent_knowledge_approval();
commit;
