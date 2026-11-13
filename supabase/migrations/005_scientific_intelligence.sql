-- Shared Scientific Intelligence Engine
-- Evidence documents/passages, AI draft versioning, claim review, simulation transcripts.
-- Retrieved content is untrusted. No automatic medical release. No real PHI.

create type public.si_verification_status as enum (
  'unverified',
  'illustrative_synthetic',
  'source_verified',
  'rejected'
);

create type public.si_claim_status as enum (
  'pending',
  'supported',
  'needs_revision',
  'unsupported'
);

create type public.si_simulation_category as enum (
  'trial_interpretation',
  'safety',
  'conflicting_evidence',
  'off_label_inquiry',
  'difficult_kol_engagement'
);

create table public.si_evidence_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  doi text,
  pmid text,
  publication_date date,
  source_url text,
  source_name text not null,
  version text not null default '1',
  verification_status public.si_verification_status not null default 'unverified',
  license_note text,
  ingested_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint si_evidence_identifier_present check (
    doi is not null or pmid is not null or verification_status = 'illustrative_synthetic'
  )
);

create table public.si_evidence_passages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.si_evidence_documents (id) on delete cascade,
  passage_key text not null,
  section_label text,
  content text not null,
  content_tsv tsvector generated always as (to_tsvector('english', content)) stored,
  created_at timestamptz not null default now(),
  unique (document_id, passage_key)
);

create index si_evidence_passages_tsv_idx on public.si_evidence_passages using gin (content_tsv);
create index si_evidence_documents_verify_idx on public.si_evidence_documents (verification_status);

create table public.si_retrieval_runs (
  id uuid primary key default gen_random_uuid(),
  query_text text not null,
  module text not null,
  entity_type text,
  entity_id uuid,
  result_count integer not null default 0,
  no_evidence boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.si_retrieval_hits (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.si_retrieval_runs (id) on delete cascade,
  document_id uuid not null references public.si_evidence_documents (id),
  passage_id uuid not null references public.si_evidence_passages (id),
  rank_score numeric(8,4) not null,
  created_at timestamptz not null default now()
);

-- Medical Information claim-level review (extends inquiry workflow)
create table public.si_response_drafts (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.medical_inquiries (id) on delete cascade,
  draft_version integer not null,
  evidence_document_versions jsonb not null default '[]'::jsonb,
  draft_text text not null,
  uncertainty_notes text,
  limitations_notes text,
  missing_evidence_notes text,
  safety_event_flag boolean not null default false,
  created_by_role text,
  created_at timestamptz not null default now(),
  unique (inquiry_id, draft_version)
);

create table public.si_response_claims (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.si_response_drafts (id) on delete cascade,
  claim_key text not null,
  claim_text text not null,
  citation_passage_ids uuid[] not null default '{}',
  status public.si_claim_status not null default 'pending',
  reviewer_notes text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (draft_id, claim_key)
);

-- Field Medical simulations
create table public.si_simulation_scenarios (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  category public.si_simulation_category not null,
  therapeutic_area public.fm_therapeutic_area not null,
  hcp_persona text not null,
  clinical_context text not null,
  learning_objectives text[] not null default '{}',
  rubric_version text not null,
  scenario_version text not null default '1',
  allowed_evidence_document_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.si_simulation_sessions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.si_simulation_scenarios (id),
  msl_id uuid references public.fm_msl_profiles (id),
  status text not null check (status in ('in_progress', 'completed', 'abandoned')) default 'in_progress',
  scenario_version text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.si_simulation_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.si_simulation_sessions (id) on delete cascade,
  turn_index integer not null,
  speaker text not null check (speaker in ('msl', 'hcp', 'system')),
  content text not null,
  cited_passage_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (session_id, turn_index)
);

create table public.si_simulation_evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.si_simulation_sessions (id) on delete cascade,
  rubric_version text not null,
  scientific_accuracy numeric(5,2),
  evidence_interpretation numeric(5,2),
  compliance numeric(5,2),
  communication numeric(5,2),
  uncertainty_handling numeric(5,2),
  critical_inaccuracy_flags text[] not null default '{}',
  provisional boolean not null default true,
  reviewer_validated boolean not null default false,
  reviewer_name text,
  validated_at timestamptz,
  raw_structured jsonb,
  created_at timestamptz not null default now()
);

alter table public.si_evidence_documents enable row level security;
alter table public.si_evidence_passages enable row level security;
alter table public.si_retrieval_runs enable row level security;
alter table public.si_retrieval_hits enable row level security;
alter table public.si_response_drafts enable row level security;
alter table public.si_response_claims enable row level security;
alter table public.si_simulation_scenarios enable row level security;
alter table public.si_simulation_sessions enable row level security;
alter table public.si_simulation_turns enable row level security;
alter table public.si_simulation_evaluations enable row level security;

create policy si_evidence_documents_select on public.si_evidence_documents
  for select to authenticated using (true);
create policy si_evidence_passages_select on public.si_evidence_passages
  for select to authenticated using (true);
create policy si_scenarios_select on public.si_simulation_scenarios
  for select to authenticated using (true);

create policy si_response_drafts_select on public.si_response_drafts
  for select to authenticated using (true);
create policy si_response_claims_select on public.si_response_claims
  for select to authenticated using (true);
create policy si_response_claims_update on public.si_response_claims
  for update to authenticated
  using (public.current_user_role() in ('admin', 'medical_reviewer'))
  with check (public.current_user_role() in ('admin', 'medical_reviewer'));

create policy si_sim_sessions_select on public.si_simulation_sessions
  for select to authenticated using (public.fm_is_leader() or true);
create policy si_sim_turns_select on public.si_simulation_turns
  for select to authenticated using (true);
create policy si_sim_eval_select on public.si_simulation_evaluations
  for select to authenticated using (true);
create policy si_sim_eval_validate on public.si_simulation_evaluations
  for update to authenticated
  using (public.current_user_role() in ('admin', 'field_director', 'medical_reviewer'))
  with check (public.current_user_role() in ('admin', 'field_director', 'medical_reviewer'));

create trigger si_evidence_documents_set_updated_at
before update on public.si_evidence_documents
for each row execute function public.set_updated_at();
