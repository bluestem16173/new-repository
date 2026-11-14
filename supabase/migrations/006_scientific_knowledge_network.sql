-- Scientific Knowledge Network
-- Approved reusable scientific content, separate from restricted field inquiries.
-- No real PHI/KOL identifiers. No LLM-executed SQL. Parameterized app retrieval only.
-- pgvector deferred: keyword/FTS + structured metadata matching for Phase 1–2.

create type public.kn_item_status as enum (
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'retired',
  'needs_rereview'
);

create type public.kn_applicability as enum (
  'approved_for_reuse',
  'similar_not_applicable',
  'requires_adaptation',
  'insufficient_context'
);

create type public.kn_currency_status as enum (
  'current',
  'aging',
  'outdated',
  'unknown'
);

create type public.kn_match_decision as enum (
  'accepted',
  'rejected',
  'adapted',
  'escalated',
  'viewed'
);

create type public.kn_review_decision as enum (
  'submitted',
  'approved',
  'rejected',
  'returned',
  'retired',
  'flagged_rereview'
);

-- Approved reusable knowledge (de-identified; no restricted field transcripts)
create table public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  question_summary text not null,
  therapeutic_area text not null,
  product_name text,
  indication text,
  disease_state text,
  jurisdiction text not null default 'US',
  status public.kn_item_status not null default 'draft',
  applicability_scope text not null default 'Labeled scientific exchange within stated product/indication only.',
  currency_status public.kn_currency_status not null default 'unknown',
  current_version integer not null default 1,
  source_inquiry_id uuid references public.medical_inquiries (id) on delete set null,
  owner_profile_id uuid references public.profiles (id),
  approved_by_id uuid references public.profiles (id),
  approved_at timestamptz,
  published_at timestamptz,
  search_tsv tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint knowledge_items_summary_len check (char_length(question_summary) <= 4000)
);

create table public.knowledge_item_versions (
  id uuid primary key default gen_random_uuid(),
  knowledge_item_id uuid not null references public.knowledge_items (id) on delete cascade,
  version_number integer not null,
  answer_text text not null,
  uncertainty_notes text,
  limitations_notes text,
  deidentification_notes text not null default 'De-identified synthetic/demo scientific content. No real HCP or patient identifiers.',
  created_by_id uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (knowledge_item_id, version_number),
  constraint knowledge_versions_answer_len check (char_length(answer_text) <= 16000)
);

create table public.knowledge_evidence_links (
  id uuid primary key default gen_random_uuid(),
  knowledge_item_id uuid not null references public.knowledge_items (id) on delete cascade,
  version_number integer not null,
  si_document_id uuid references public.si_evidence_documents (id) on delete set null,
  si_passage_id uuid references public.si_evidence_passages (id) on delete set null,
  evidence_document_id uuid references public.evidence_documents (id) on delete set null,
  citation_note text,
  created_at timestamptz not null default now()
);

create table public.knowledge_matches (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid references public.medical_inquiries (id) on delete set null,
  knowledge_item_id uuid not null references public.knowledge_items (id) on delete cascade,
  query_text text not null,
  relevance_score numeric(8,4) not null,
  relevance_rationale text not null,
  matched_concepts text[] not null default '{}',
  applicability public.kn_applicability not null,
  currency_status public.kn_currency_status not null,
  applicability_warnings text[] not null default '{}',
  recommended_next_action text not null,
  created_by_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.knowledge_reuse_events (
  id uuid primary key default gen_random_uuid(),
  knowledge_item_id uuid not null references public.knowledge_items (id) on delete cascade,
  match_id uuid references public.knowledge_matches (id) on delete set null,
  inquiry_id uuid references public.medical_inquiries (id) on delete set null,
  decision public.kn_match_decision not null,
  actor_profile_id uuid references public.profiles (id),
  verification_notes text,
  adaptation_notes text,
  search_duration_ms integer,
  verification_duration_ms integer,
  created_at timestamptz not null default now()
);

create table public.knowledge_review_events (
  id uuid primary key default gen_random_uuid(),
  knowledge_item_id uuid not null references public.knowledge_items (id) on delete cascade,
  version_number integer not null,
  decision public.kn_review_decision not null,
  reviewer_profile_id uuid references public.profiles (id),
  notes text,
  created_at timestamptz not null default now()
);

create table public.knowledge_search_events (
  id uuid primary key default gen_random_uuid(),
  query_text text not null,
  therapeutic_area text,
  product_name text,
  result_count integer not null default 0,
  actor_profile_id uuid references public.profiles (id),
  inquiry_id uuid references public.medical_inquiries (id) on delete set null,
  duration_ms integer,
  created_at timestamptz not null default now()
);

-- Editable scenario assumptions for leadership ROI simulator (not observed savings)
create table public.knowledge_value_assumptions (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  msl_workforce_size numeric(10,2) not null default 50,
  monthly_research_inquiries_per_msl numeric(10,2) not null default 8,
  eligible_reuse_percentage numeric(6,4) not null default 0.25,
  net_minutes_saved_per_reuse numeric(10,2) not null default 45,
  loaded_hourly_labor_cost numeric(10,2) not null default 150,
  notes text not null default 'Scenario Estimate inputs only. Not observed employer performance.',
  updated_by_id uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index knowledge_items_status_idx on public.knowledge_items (status);
create index knowledge_items_ta_idx on public.knowledge_items (therapeutic_area);
create index knowledge_items_product_idx on public.knowledge_items (product_name);
create index knowledge_items_tsv_idx on public.knowledge_items using gin (search_tsv);
create index knowledge_matches_item_idx on public.knowledge_matches (knowledge_item_id);
create index knowledge_reuse_item_idx on public.knowledge_reuse_events (knowledge_item_id);
create index knowledge_search_created_idx on public.knowledge_search_events (created_at desc);

create or replace function public.knowledge_items_refresh_tsv()
returns trigger
language plpgsql
as $$
begin
  new.search_tsv :=
    to_tsvector(
      'english',
      coalesce(new.title, '') || ' ' ||
      coalesce(new.question_summary, '') || ' ' ||
      coalesce(new.product_name, '') || ' ' ||
      coalesce(new.indication, '') || ' ' ||
      coalesce(new.disease_state, '') || ' ' ||
      coalesce(new.therapeutic_area, '')
    );
  new.updated_at := now();
  return new;
end;
$$;

create trigger knowledge_items_tsv_trigger
before insert or update of title, question_summary, product_name, indication, disease_state, therapeutic_area
on public.knowledge_items
for each row execute function public.knowledge_items_refresh_tsv();

-- RLS
alter table public.knowledge_items enable row level security;
alter table public.knowledge_item_versions enable row level security;
alter table public.knowledge_evidence_links enable row level security;
alter table public.knowledge_matches enable row level security;
alter table public.knowledge_reuse_events enable row level security;
alter table public.knowledge_review_events enable row level security;
alter table public.knowledge_search_events enable row level security;
alter table public.knowledge_value_assumptions enable row level security;

-- Approved reusable content readable by authenticated Medical Affairs roles
create policy knowledge_items_select
  on public.knowledge_items for select
  to authenticated
  using (
    status = 'approved'
    or public.current_user_role() in ('admin', 'medical_reviewer', 'medical_information_specialist')
    or owner_profile_id = auth.uid()
  );

create policy knowledge_items_insert
  on public.knowledge_items for insert
  to authenticated
  with check (
    public.current_user_role() in (
      'admin',
      'medical_reviewer',
      'medical_information_specialist'
    )
  );

create policy knowledge_items_update
  on public.knowledge_items for update
  to authenticated
  using (
    public.current_user_role() in ('admin', 'medical_reviewer', 'medical_information_specialist')
  )
  with check (
    case
      when status = 'approved' then
        public.current_user_role() in ('admin', 'medical_reviewer')
      else
        public.current_user_role() in ('admin', 'medical_reviewer', 'medical_information_specialist')
    end
  );

create policy knowledge_versions_select
  on public.knowledge_item_versions for select
  to authenticated
  using (
    exists (
      select 1 from public.knowledge_items ki
      where ki.id = knowledge_item_id
        and (
          ki.status = 'approved'
          or public.current_user_role() in ('admin', 'medical_reviewer', 'medical_information_specialist')
          or ki.owner_profile_id = auth.uid()
        )
    )
  );

create policy knowledge_versions_write
  on public.knowledge_item_versions for all
  to authenticated
  using (
    public.current_user_role() in ('admin', 'medical_reviewer', 'medical_information_specialist')
  )
  with check (
    public.current_user_role() in ('admin', 'medical_reviewer', 'medical_information_specialist')
  );

create policy knowledge_evidence_select
  on public.knowledge_evidence_links for select
  to authenticated
  using (true);

create policy knowledge_evidence_write
  on public.knowledge_evidence_links for all
  to authenticated
  using (
    public.current_user_role() in ('admin', 'medical_reviewer', 'medical_information_specialist')
  )
  with check (
    public.current_user_role() in ('admin', 'medical_reviewer', 'medical_information_specialist')
  );

create policy knowledge_matches_select
  on public.knowledge_matches for select
  to authenticated
  using (true);

create policy knowledge_matches_insert
  on public.knowledge_matches for insert
  to authenticated
  with check (
    public.current_user_role() in (
      'admin', 'medical_reviewer', 'medical_information_specialist', 'msl', 'field_director'
    )
  );

create policy knowledge_reuse_select
  on public.knowledge_reuse_events for select
  to authenticated
  using (true);

create policy knowledge_reuse_insert
  on public.knowledge_reuse_events for insert
  to authenticated
  with check (
    public.current_user_role() in (
      'admin', 'medical_reviewer', 'medical_information_specialist', 'msl', 'field_director'
    )
  );

create policy knowledge_review_select
  on public.knowledge_review_events for select
  to authenticated
  using (
    public.current_user_role() in ('admin', 'medical_reviewer', 'medical_information_specialist')
  );

create policy knowledge_review_insert
  on public.knowledge_review_events for insert
  to authenticated
  with check (
    public.current_user_role() in ('admin', 'medical_reviewer')
  );

create policy knowledge_search_select
  on public.knowledge_search_events for select
  to authenticated
  using (
    public.current_user_role() in ('admin', 'medical_reviewer', 'medical_information_specialist', 'field_director')
    or actor_profile_id = auth.uid()
  );

create policy knowledge_search_insert
  on public.knowledge_search_events for insert
  to authenticated
  with check (true);

create policy knowledge_assumptions_select
  on public.knowledge_value_assumptions for select
  to authenticated
  using (true);

create policy knowledge_assumptions_write
  on public.knowledge_value_assumptions for all
  to authenticated
  using (public.current_user_role() in ('admin', 'field_director'))
  with check (public.current_user_role() in ('admin', 'field_director'));
