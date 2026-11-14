-- Data Room packages — share illustrative Workflow Studio deliverables with authenticated colleagues.
-- No PHI. Packages are illustrative/demo labeled. RLS: sender, same-org members, or explicit invite email.

begin;

create type public.data_room_workflow_type as enum (
  'kol-meeting-prep',
  'manager-education',
  'mi-inquiry',
  'leadership-briefing',
  'other'
);

create table public.data_room_packages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id),
  sender_profile_id uuid not null references public.profiles (id),
  sender_email text not null,
  sender_display_name text not null,
  title text not null,
  summary text not null,
  workflow_type public.data_room_workflow_type not null,
  sections jsonb not null default '[]'::jsonb,
  demo_label text not null default 'Illustrative Demo Data — Not for clinical decision-making',
  oversight_label text not null,
  access_emails text[] not null default '{}',
  audit_created_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint data_room_packages_title_len check (char_length(title) between 1 and 240),
  constraint data_room_packages_summary_len check (char_length(summary) between 1 and 4000),
  constraint data_room_packages_sections_is_array check (jsonb_typeof(sections) = 'array')
);

create index data_room_packages_org_idx
  on public.data_room_packages (organization_id, created_at desc);
create index data_room_packages_sender_idx
  on public.data_room_packages (sender_profile_id, created_at desc);
create index data_room_packages_access_emails_idx
  on public.data_room_packages using gin (access_emails);

create table public.data_room_access_events (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.data_room_packages (id) on delete cascade,
  actor_profile_id uuid references public.profiles (id),
  actor_email text not null,
  event_type text not null,
  created_at timestamptz not null default now(),
  constraint data_room_access_events_type_check check (
    event_type in ('created', 'viewed', 'listed')
  )
);

alter table public.data_room_packages enable row level security;
alter table public.data_room_access_events enable row level security;

create or replace function public.can_access_data_room_package(pkg public.data_room_packages)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and (
      pkg.sender_profile_id = auth.uid()
      or (
        pkg.organization_id is not null
        and public.has_current_org(pkg.organization_id)
      )
      or exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and lower(p.email) = any (
            select lower(unnest(pkg.access_emails))
          )
      )
    );
$$;

revoke all on function public.can_access_data_room_package(public.data_room_packages)
  from public, anon;
grant execute on function public.can_access_data_room_package(public.data_room_packages)
  to authenticated;

create policy data_room_packages_select
  on public.data_room_packages
  for select
  to authenticated
  using (public.can_access_data_room_package(data_room_packages));

create policy data_room_packages_insert
  on public.data_room_packages
  for insert
  to authenticated
  with check (
    sender_profile_id = auth.uid()
    and (
      organization_id is null
      or public.has_current_org(organization_id)
    )
  );

create policy data_room_packages_update_sender
  on public.data_room_packages
  for update
  to authenticated
  using (sender_profile_id = auth.uid())
  with check (sender_profile_id = auth.uid());

create policy data_room_access_events_select
  on public.data_room_access_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.data_room_packages p
      where p.id = package_id
        and public.can_access_data_room_package(p)
    )
  );

create policy data_room_access_events_insert
  on public.data_room_access_events
  for insert
  to authenticated
  with check (
    actor_profile_id = auth.uid()
    and exists (
      select 1 from public.data_room_packages p
      where p.id = package_id
        and public.can_access_data_room_package(p)
    )
  );

revoke all on public.data_room_packages from anon;
revoke all on public.data_room_access_events from anon;
grant select, insert, update on public.data_room_packages to authenticated;
grant select, insert on public.data_room_access_events to authenticated;

commit;
