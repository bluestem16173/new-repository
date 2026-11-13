-- MedIntel Field Medical Excellence schema
-- Synthetic workforce / competency data only — never store real patient information.
-- Tables are prefixed fm_ to avoid colliding with Phase 1 scaffold placeholders.

create type public.fm_therapeutic_area as enum (
  'oncology',
  'inflammation',
  'rare_disease',
  'general_medicine'
);

create type public.fm_readiness_status as enum (
  'not_started',
  'in_progress',
  'eligible',
  'approved',
  'deferred',
  'denied'
);

create type public.fm_assessment_validation as enum (
  'pending_review',
  'validated',
  'rejected',
  'expired',
  'superseded'
);

create type public.fm_coaching_plan_status as enum (
  'draft',
  'active',
  'completed',
  'cancelled'
);

create type public.fm_coaching_activity_status as enum (
  'planned',
  'in_progress',
  'completed',
  'cancelled'
);

create type public.fm_readiness_decision_outcome as enum (
  'approved',
  'deferred',
  'denied'
);

create table public.fm_field_directors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id),
  employee_code text not null unique,
  full_name text not null,
  email text not null unique,
  primary_therapeutic_area public.fm_therapeutic_area not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fm_msl_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id),
  employee_code text not null unique,
  full_name text not null,
  email text not null unique,
  therapeutic_area public.fm_therapeutic_area not null,
  field_director_id uuid not null references public.fm_field_directors (id),
  onboarding_start_date date not null,
  region text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fm_competencies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  domain text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fm_competency_requirements (
  id uuid primary key default gen_random_uuid(),
  competency_id uuid not null references public.fm_competencies (id),
  therapeutic_area public.fm_therapeutic_area not null,
  rubric_version text not null,
  passing_score numeric(5,2) not null check (passing_score >= 0 and passing_score <= 100),
  effective_from date not null,
  effective_to date,
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  constraint fm_competency_requirements_dates check (
    effective_to is null or effective_to >= effective_from
  ),
  unique (competency_id, therapeutic_area, rubric_version, effective_from)
);

create table public.fm_assessments (
  id uuid primary key default gen_random_uuid(),
  msl_id uuid not null references public.fm_msl_profiles (id) on delete cascade,
  competency_id uuid not null references public.fm_competencies (id),
  requirement_id uuid references public.fm_competency_requirements (id),
  rubric_version text not null,
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  passed boolean not null,
  validation_status public.fm_assessment_validation not null default 'pending_review',
  assessed_at timestamptz not null,
  valid_until timestamptz,
  reviewer_id uuid references public.fm_field_directors (id),
  evidence_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fm_readiness_decisions (
  id uuid primary key default gen_random_uuid(),
  msl_id uuid not null references public.fm_msl_profiles (id) on delete cascade,
  outcome public.fm_readiness_decision_outcome not null,
  decided_by_director_id uuid not null references public.fm_field_directors (id),
  decided_at timestamptz not null,
  rationale text not null,
  evidence_summary text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- At most one active approved readiness decision per MSL
create unique index fm_readiness_one_active_approval
  on public.fm_readiness_decisions (msl_id)
  where outcome = 'approved' and is_active = true;

create table public.fm_coaching_plans (
  id uuid primary key default gen_random_uuid(),
  msl_id uuid not null references public.fm_msl_profiles (id) on delete cascade,
  director_id uuid not null references public.fm_field_directors (id),
  title text not null,
  focus_competency_id uuid references public.fm_competencies (id),
  status public.fm_coaching_plan_status not null default 'draft',
  objective text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fm_coaching_activities (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.fm_coaching_plans (id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz not null,
  completed_at timestamptz,
  status public.fm_coaching_activity_status not null default 'planned',
  outcome_notes text,
  reassessment_scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fm_coaching_completed_requires_timestamp check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed')
  )
);

create table public.fm_simulations (
  id uuid primary key default gen_random_uuid(),
  competency_id uuid not null references public.fm_competencies (id),
  title text not null,
  scenario_summary text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz not null default now()
);

create table public.fm_simulation_attempts (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.fm_simulations (id),
  msl_id uuid not null references public.fm_msl_profiles (id) on delete cascade,
  attempted_at timestamptz not null,
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  passed boolean not null,
  facilitator_notes text,
  created_at timestamptz not null default now()
);

create table public.fm_audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor_role text,
  actor_name text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index fm_msl_profiles_ta_idx on public.fm_msl_profiles (therapeutic_area);
create index fm_msl_profiles_director_idx on public.fm_msl_profiles (field_director_id);
create index fm_assessments_msl_comp_idx on public.fm_assessments (msl_id, competency_id, assessed_at desc);
create index fm_assessments_validation_idx on public.fm_assessments (validation_status);
create index fm_coaching_activities_due_idx on public.fm_coaching_activities (due_at);
create index fm_coaching_activities_status_idx on public.fm_coaching_activities (status);
create index fm_readiness_decisions_msl_idx on public.fm_readiness_decisions (msl_id, decided_at desc);
create index fm_audit_events_entity_idx on public.fm_audit_events (entity_type, entity_id);

create trigger fm_field_directors_set_updated_at
before update on public.fm_field_directors
for each row execute function public.set_updated_at();

create trigger fm_msl_profiles_set_updated_at
before update on public.fm_msl_profiles
for each row execute function public.set_updated_at();

create trigger fm_competencies_set_updated_at
before update on public.fm_competencies
for each row execute function public.set_updated_at();

create trigger fm_assessments_set_updated_at
before update on public.fm_assessments
for each row execute function public.set_updated_at();

create trigger fm_coaching_plans_set_updated_at
before update on public.fm_coaching_plans
for each row execute function public.set_updated_at();

create trigger fm_coaching_activities_set_updated_at
before update on public.fm_coaching_activities
for each row execute function public.set_updated_at();

-- Prevent MSL self-approval of readiness (director must differ from MSL profile link when both set)
create or replace function public.fm_enforce_readiness_approver()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  msl_profile uuid;
  director_profile uuid;
  actor_role public.user_role;
begin
  select profile_id into msl_profile from public.fm_msl_profiles where id = new.msl_id;
  select profile_id into director_profile from public.fm_field_directors where id = new.decided_by_director_id;

  if msl_profile is not null and director_profile is not null and msl_profile = director_profile then
    raise exception 'MSL cannot self-approve readiness';
  end if;

  if auth.uid() is not null then
    select role into actor_role from public.profiles where id = auth.uid();
    if actor_role is null or actor_role not in ('admin', 'field_director', 'medical_reviewer') then
      raise exception 'Unauthorized readiness approver role';
    end if;
    if actor_role = 'field_director' and director_profile is distinct from auth.uid() then
      raise exception 'Field directors may only approve for their own director record';
    end if;
  end if;

  return new;
end;
$$;

create trigger fm_readiness_enforce_approver
before insert or update on public.fm_readiness_decisions
for each row execute function public.fm_enforce_readiness_approver();
