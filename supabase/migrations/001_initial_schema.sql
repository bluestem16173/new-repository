-- MedIntel Phase 1 — Medical Information Intelligence schema
-- UUID PKs, timestamps, FKs, workflow status, audit events.
-- Synthetic / operational data only — never store real PHI.

create extension if not exists "pgcrypto";

create type public.user_role as enum (
  'admin',
  'medical_reviewer',
  'medical_information_specialist',
  'msl',
  'field_director'
);

create type public.inquiry_status as enum (
  'draft',
  'submitted',
  'evidence_review',
  'response_drafted',
  'medical_review',
  'approved',
  'closed',
  'rejected',
  'needs_revision'
);

create type public.inquiry_priority as enum (
  'low',
  'medium',
  'high',
  'urgent'
);

create type public.inquiry_channel as enum (
  'email',
  'phone',
  'portal',
  'congress',
  'msl_field',
  'other'
);

create type public.requester_type as enum (
  'hcp',
  'patient',
  'caregiver',
  'internal',
  'other'
);

create type public.review_outcome as enum (
  'approved',
  'rejected',
  'needs_revision'
);

create type public.evidence_trust_label as enum (
  'illustrative_unverified',
  'internally_validated',
  'planned'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.user_role not null default 'medical_information_specialist',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medical_inquiries (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  title text not null,
  question_text text not null,
  product_name text not null,
  therapeutic_area text not null,
  requester_type public.requester_type not null,
  requester_name text not null,
  requester_organization text,
  channel public.inquiry_channel not null,
  priority public.inquiry_priority not null default 'medium',
  status public.inquiry_status not null default 'draft',
  assigned_to_id uuid references public.profiles (id),
  created_by_id uuid not null references public.profiles (id),
  response_draft text,
  rejection_reason text,
  revision_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  closed_at timestamptz,
  constraint medical_inquiries_no_phi_check check (
    char_length(question_text) <= 8000
  )
);

create table public.evidence_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_name text not null,
  source_url text,
  publication_year integer,
  authors text,
  abstract_summary text,
  trust_label public.evidence_trust_label not null default 'illustrative_unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidence_citations (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.medical_inquiries (id) on delete cascade,
  evidence_document_id uuid not null references public.evidence_documents (id),
  relevance_note text,
  created_by_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (inquiry_id, evidence_document_id)
);

create table public.review_decisions (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.medical_inquiries (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id),
  outcome public.review_outcome not null,
  comments text,
  decided_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor_id uuid references public.profiles (id),
  actor_role public.user_role,
  from_status public.inquiry_status,
  to_status public.inquiry_status,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Field Medical scaffold tables (planned module; minimal schema)
create table public.competencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  domain text not null,
  created_at timestamptz not null default now()
);

create table public.simulations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  competency_id uuid not null references public.competencies (id),
  scenario_summary text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz not null default now()
);

create table public.coaching_plans (
  id uuid primary key default gen_random_uuid(),
  msl_user_id uuid not null references public.profiles (id),
  coach_user_id uuid not null references public.profiles (id),
  focus_areas text[] not null default '{}',
  status text not null check (status in ('draft', 'active', 'completed')) default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index medical_inquiries_status_idx on public.medical_inquiries (status);
create index medical_inquiries_created_by_idx on public.medical_inquiries (created_by_id);
create index audit_events_entity_idx on public.audit_events (entity_type, entity_id);
create index evidence_citations_inquiry_idx on public.evidence_citations (inquiry_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger medical_inquiries_set_updated_at
before update on public.medical_inquiries
for each row execute function public.set_updated_at();

create trigger evidence_documents_set_updated_at
before update on public.evidence_documents
for each row execute function public.set_updated_at();

create trigger coaching_plans_set_updated_at
before update on public.coaching_plans
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;
