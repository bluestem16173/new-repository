-- MedIntel Phase 1 — Row Level Security
-- Mutations that approve responses are limited to medical_reviewer and admin.

alter table public.profiles enable row level security;
alter table public.medical_inquiries enable row level security;
alter table public.evidence_documents enable row level security;
alter table public.evidence_citations enable row level security;
alter table public.review_decisions enable row level security;
alter table public.audit_events enable row level security;
alter table public.competencies enable row level security;
alter table public.simulations enable row level security;
alter table public.coaching_plans enable row level security;

-- Profiles
create policy profiles_select_authenticated
  on public.profiles for select
  to authenticated
  using (true);

create policy profiles_update_self_or_admin
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.current_user_role() = 'admin')
  with check (id = auth.uid() or public.current_user_role() = 'admin');

-- Medical inquiries: authenticated users can read; create limited by role
create policy medical_inquiries_select
  on public.medical_inquiries for select
  to authenticated
  using (true);

create policy medical_inquiries_insert
  on public.medical_inquiries for insert
  to authenticated
  with check (
    created_by_id = auth.uid()
    and public.current_user_role() in (
      'admin',
      'medical_information_specialist',
      'medical_reviewer',
      'msl'
    )
  );

create policy medical_inquiries_update
  on public.medical_inquiries for update
  to authenticated
  using (
    public.current_user_role() = 'admin'
    or public.current_user_role() = 'medical_information_specialist'
    or public.current_user_role() = 'medical_reviewer'
    or (public.current_user_role() = 'msl' and created_by_id = auth.uid())
  )
  with check (
    case
      when status = 'approved' then
        public.current_user_role() in ('admin', 'medical_reviewer')
      else true
    end
  );

-- Evidence
create policy evidence_documents_select
  on public.evidence_documents for select
  to authenticated
  using (true);

create policy evidence_documents_write_specialists
  on public.evidence_documents for all
  to authenticated
  using (
    public.current_user_role() in (
      'admin',
      'medical_information_specialist',
      'medical_reviewer'
    )
  )
  with check (
    public.current_user_role() in (
      'admin',
      'medical_information_specialist',
      'medical_reviewer'
    )
  );

create policy evidence_citations_select
  on public.evidence_citations for select
  to authenticated
  using (true);

create policy evidence_citations_write
  on public.evidence_citations for all
  to authenticated
  using (
    public.current_user_role() in (
      'admin',
      'medical_information_specialist',
      'medical_reviewer'
    )
  )
  with check (
    public.current_user_role() in (
      'admin',
      'medical_information_specialist',
      'medical_reviewer'
    )
  );

-- Review decisions: only approvers may insert approvals/rejections
create policy review_decisions_select
  on public.review_decisions for select
  to authenticated
  using (true);

create policy review_decisions_insert_approvers
  on public.review_decisions for insert
  to authenticated
  with check (
    reviewer_id = auth.uid()
    and public.current_user_role() in ('admin', 'medical_reviewer')
  );

-- Audit: readable by operational roles; inserts via service/security definer preferred
create policy audit_events_select
  on public.audit_events for select
  to authenticated
  using (
    public.current_user_role() in (
      'admin',
      'medical_reviewer',
      'medical_information_specialist',
      'field_director'
    )
  );

create policy audit_events_insert_authenticated
  on public.audit_events for insert
  to authenticated
  with check (actor_id = auth.uid() or public.current_user_role() = 'admin');

-- Field Medical placeholders
create policy competencies_select
  on public.competencies for select
  to authenticated
  using (true);

create policy simulations_select
  on public.simulations for select
  to authenticated
  using (true);

create policy coaching_plans_select
  on public.coaching_plans for select
  to authenticated
  using (
    public.current_user_role() in ('admin', 'field_director', 'msl')
    and (
      public.current_user_role() in ('admin', 'field_director')
      or msl_user_id = auth.uid()
      or coach_user_id = auth.uid()
    )
  );

-- Harden approval transitions with a trigger (defense in depth with app RBAC)
create or replace function public.enforce_inquiry_approval_role()
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
      raise exception 'Only medical_reviewer or admin may approve inquiries';
    end if;
  end if;
  return new;
end;
$$;

create trigger medical_inquiries_enforce_approval
before update on public.medical_inquiries
for each row execute function public.enforce_inquiry_approval_role();
