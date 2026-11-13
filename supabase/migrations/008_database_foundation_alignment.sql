-- MedIntel Prompt 012 — schema alignment (PREPARED, not auto-applied)
-- Additive only: IF NOT EXISTS / DO NOT DROP. Reuses existing tables where present.
-- Apply via Supabase Dashboard SQL Editor (or authenticated CLI) after review.
-- Never inserts into auth.users. All demo seeds belong in a later seed migration.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Taxonomy (homepage therapeutic areas + scientific specialty)
-- ---------------------------------------------------------------------------
create table if not exists public.therapeutic_areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  category text not null default 'therapeutic_area',
  is_active boolean not null default true,
  display_order integer not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.scientific_specialties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- Seed 10 TAs + 1 specialty (idempotent by slug)
insert into public.therapeutic_areas (slug, name, description, display_order, is_demo)
values
  ('general-medicine', 'General Medicine & Metabolic Disease', 'Metabolic, endocrine, and general medicine scientific focus.', 1, true),
  ('oncology', 'Oncology & Hematology', 'Solid tumor and hematologic malignancy scientific focus.', 2, true),
  ('immunology', 'Immunology & Inflammation', 'Immune-mediated and inflammatory disease scientific focus.', 3, true),
  ('rare-disease', 'Rare & Genetic Diseases', 'Rare and genetic disease scientific focus.', 4, true),
  ('neuroscience', 'Neuroscience & CNS', 'Central nervous system scientific focus.', 5, true),
  ('cardiovascular-renal', 'Cardiovascular & Renal', 'Cardiorenal scientific focus.', 6, true),
  ('infectious-disease', 'Infectious Diseases & Vaccines', 'Infectious disease and vaccine scientific focus.', 7, true),
  ('respiratory', 'Respiratory & Pulmonary', 'Respiratory and pulmonary scientific focus.', 8, true),
  ('ophthalmology', 'Ophthalmology', 'Ophthalmology scientific focus.', 9, true),
  ('dermatology', 'Dermatology & Aesthetics', 'Dermatology and aesthetics scientific focus.', 10, true)
on conflict (slug) do nothing;

insert into public.scientific_specialties (slug, name, description, display_order, is_demo)
values (
  'diagnostics-precision-medicine',
  'Diagnostics & Precision Medicine',
  'Cross-cutting diagnostics and precision medicine specialty.',
  1,
  true
)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- AI agent execution (no provider secrets stored)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_agent_definitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  category text,
  enabled boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_agent_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  agent_id uuid not null references public.ai_agent_definitions (id) on delete restrict,
  requested_by uuid references auth.users (id) on delete set null,
  related_resource_type text,
  related_resource_id uuid,
  status text not null default 'queued',
  model_provider text,
  model_name text,
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric(12, 6),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_code text,
  is_demo boolean not null default false
);

create index if not exists ai_agent_runs_org_started_idx
  on public.ai_agent_runs (organization_id, started_at desc);

create table if not exists public.ai_usage_budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  period text not null,
  budget_usd numeric(12, 2) not null default 0,
  request_limit integer not null default 0,
  enabled boolean not null default true,
  is_demo boolean not null default false,
  unique (organization_id, user_id, period)
);

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  agent_run_id uuid references public.ai_agent_runs (id) on delete set null,
  model_name text,
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric(12, 6),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pharmacovigilance demo (synthetic only)
-- ---------------------------------------------------------------------------
create table if not exists public.safety_case_demonstrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  case_reference text not null,
  narrative_summary text not null,
  completeness_score numeric(5, 2),
  status text not null default 'draft',
  is_demo boolean not null default true,
  dataset_source text not null default 'synthetic_medintel_demo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, case_reference)
);

create table if not exists public.safety_case_completeness_checks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.safety_case_demonstrations (id) on delete cascade,
  check_name text not null,
  passed boolean not null,
  notes text,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.safety_case_review_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.safety_case_demonstrations (id) on delete cascade,
  reviewer_id uuid references auth.users (id) on delete set null,
  action text not null,
  notes text,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Clinical development demo (synthetic only)
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_protocols (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  protocol_code text not null,
  title text not null,
  summary text,
  status text not null default 'draft',
  is_demo boolean not null default true,
  dataset_source text not null default 'synthetic_medintel_demo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, protocol_code)
);

create table if not exists public.protocol_eligibility_rules (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.clinical_protocols (id) on delete cascade,
  rule_text text not null,
  rule_type text not null default 'inclusion',
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.protocol_exception_demonstrations (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.clinical_protocols (id) on delete cascade,
  exception_summary text not null,
  status text not null default 'pending_review',
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.protocol_review_events (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.clinical_protocols (id) on delete cascade,
  reviewer_id uuid references auth.users (id) on delete set null,
  action text not null,
  notes text,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS enablement (policies refined in follow-up; fail-closed defaults)
-- ---------------------------------------------------------------------------
alter table public.therapeutic_areas enable row level security;
alter table public.scientific_specialties enable row level security;
alter table public.ai_agent_definitions enable row level security;
alter table public.ai_agent_runs enable row level security;
alter table public.ai_usage_budgets enable row level security;
alter table public.ai_usage_events enable row level security;
alter table public.safety_case_demonstrations enable row level security;
alter table public.safety_case_completeness_checks enable row level security;
alter table public.safety_case_review_events enable row level security;
alter table public.clinical_protocols enable row level security;
alter table public.protocol_eligibility_rules enable row level security;
alter table public.protocol_exception_demonstrations enable row level security;
alter table public.protocol_review_events enable row level security;

-- Authenticated read for taxonomy
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'therapeutic_areas' and policyname = 'ta_select_authenticated'
  ) then
    create policy ta_select_authenticated on public.therapeutic_areas
      for select to authenticated using (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'scientific_specialties' and policyname = 'specialty_select_authenticated'
  ) then
    create policy specialty_select_authenticated on public.scientific_specialties
      for select to authenticated using (true);
  end if;
end $$;
