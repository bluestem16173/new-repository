-- MedIntel Enterprise Security Foundation
-- Data classification, organization scaffolding, tightened RLS, append-only security audit.
-- Reversible additive migration. No destructive resets. No secrets stored here.

create type public.data_classification as enum (
  'public_scientific',
  'internal_approved',
  'restricted'
);

create type public.ai_operating_mode as enum (
  'demo',
  'byok',
  'enterprise'
);

-- Organization tenancy scaffolding (future SSO/enterprise membership)
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  ai_mode public.ai_operating_mode not null default 'demo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  membership_role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

alter table public.profiles
  add column if not exists organization_id uuid references public.organizations (id),
  add column if not exists is_demo_user boolean not null default false;

alter table public.medical_inquiries
  add column if not exists data_classification public.data_classification
    not null default 'restricted',
  add column if not exists organization_id uuid references public.organizations (id);

alter table public.evidence_documents
  add column if not exists data_classification public.data_classification
    not null default 'public_scientific';

alter table public.knowledge_items
  add column if not exists data_classification public.data_classification
    not null default 'internal_approved',
  add column if not exists organization_id uuid references public.organizations (id);

alter table public.si_evidence_documents
  add column if not exists data_classification public.data_classification
    not null default 'public_scientific';

alter table public.si_response_drafts
  add column if not exists data_classification public.data_classification
    not null default 'restricted';

-- Append-only application security / consequential-action audit
create table if not exists public.security_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  organization_id uuid references public.organizations (id),
  event_type text not null,
  resource_type text not null,
  resource_id text,
  outcome text not null check (outcome in ('success', 'denied', 'error')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint security_audit_no_secrets check (
    not (metadata ? 'api_key')
    and not (metadata ? 'service_role_key')
    and not (metadata ? 'password')
  )
);

create index if not exists security_audit_events_created_idx
  on public.security_audit_events (created_at desc);
create index if not exists security_audit_events_actor_idx
  on public.security_audit_events (actor_id);

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.security_audit_events enable row level security;

create policy organizations_select_members
  on public.organizations for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid()
    )
    or id = (select organization_id from public.profiles where id = auth.uid())
  );

create policy organization_memberships_select
  on public.organization_memberships for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or profile_id = auth.uid()
    or organization_id in (
      select organization_id from public.organization_memberships m
      where m.profile_id = auth.uid()
    )
  );

create policy security_audit_select_admins
  on public.security_audit_events for select to authenticated
  using (public.current_user_role() in ('admin', 'field_director', 'medical_reviewer'));

create policy security_audit_insert_authenticated
  on public.security_audit_events for insert to authenticated
  with check (actor_id = auth.uid() or public.current_user_role() = 'admin');

-- No UPDATE/DELETE policies for security_audit_events → append-only for ordinary roles.

-- Tighten medical inquiry SELECT: remove blanket using(true)
drop policy if exists medical_inquiries_select on public.medical_inquiries;
create policy medical_inquiries_select
  on public.medical_inquiries for select
  to authenticated
  using (
    public.current_user_role() in (
      'admin',
      'medical_reviewer',
      'medical_information_specialist',
      'field_director'
    )
    or created_by_id = auth.uid()
    or assigned_to_id = auth.uid()
  );

-- Fix SI simulation session policy that previously OR'd true (effectively open)
drop policy if exists si_sim_sessions_select on public.si_simulation_sessions;
create policy si_sim_sessions_select
  on public.si_simulation_sessions for select
  to authenticated
  using (
    public.current_user_role() in ('admin', 'field_director', 'medical_reviewer', 'msl')
  );

-- Knowledge approval status changes: only approver roles
create or replace function public.enforce_knowledge_approval_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.user_role;
begin
  if tg_op = 'UPDATE'
     and new.status is distinct from old.status
     and new.status = 'approved' then
    select role into actor_role from public.profiles where id = auth.uid();
    if actor_role is null or actor_role not in ('admin', 'medical_reviewer') then
      raise exception 'Only medical_reviewer or admin may approve knowledge items';
    end if;
    if new.data_classification = 'restricted' then
      raise exception 'Restricted content cannot be published as reusable knowledge';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists knowledge_items_enforce_approval on public.knowledge_items;
create trigger knowledge_items_enforce_approval
before update on public.knowledge_items
for each row execute function public.enforce_knowledge_approval_role();

-- Seed a demo organization (synthetic portfolio tenant)
insert into public.organizations (id, slug, name, ai_mode)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'medintel-demo',
  'MedIntel Demo Organization',
  'demo'
)
on conflict (slug) do nothing;
