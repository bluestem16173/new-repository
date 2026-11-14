-- Field Medical RLS
-- Directors manage assigned MSLs; reviewers/admins have broader access.
-- MSLs cannot approve their own readiness (also enforced by trigger).

alter table public.fm_field_directors enable row level security;
alter table public.fm_msl_profiles enable row level security;
alter table public.fm_competencies enable row level security;
alter table public.fm_competency_requirements enable row level security;
alter table public.fm_assessments enable row level security;
alter table public.fm_readiness_decisions enable row level security;
alter table public.fm_coaching_plans enable row level security;
alter table public.fm_coaching_activities enable row level security;
alter table public.fm_simulations enable row level security;
alter table public.fm_simulation_attempts enable row level security;
alter table public.fm_audit_events enable row level security;

create or replace function public.fm_is_leader()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'field_director', 'medical_reviewer');
$$;

create or replace function public.fm_director_id_for_user()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.fm_field_directors where profile_id = auth.uid() limit 1;
$$;

-- Read policies
create policy fm_field_directors_select on public.fm_field_directors
  for select to authenticated using (true);

create policy fm_msl_profiles_select on public.fm_msl_profiles
  for select to authenticated using (
    public.fm_is_leader()
    or profile_id = auth.uid()
    or field_director_id = public.fm_director_id_for_user()
  );

create policy fm_competencies_select on public.fm_competencies
  for select to authenticated using (true);

create policy fm_competency_requirements_select on public.fm_competency_requirements
  for select to authenticated using (true);

create policy fm_assessments_select on public.fm_assessments
  for select to authenticated using (
    public.fm_is_leader()
    or exists (
      select 1 from public.fm_msl_profiles m
      where m.id = msl_id and (m.profile_id = auth.uid() or m.field_director_id = public.fm_director_id_for_user())
    )
  );

create policy fm_readiness_select on public.fm_readiness_decisions
  for select to authenticated using (
    public.fm_is_leader()
    or exists (
      select 1 from public.fm_msl_profiles m
      where m.id = msl_id and (m.profile_id = auth.uid() or m.field_director_id = public.fm_director_id_for_user())
    )
  );

create policy fm_coaching_plans_select on public.fm_coaching_plans
  for select to authenticated using (
    public.fm_is_leader()
    or exists (
      select 1 from public.fm_msl_profiles m
      where m.id = msl_id and (m.profile_id = auth.uid() or m.field_director_id = public.fm_director_id_for_user())
    )
  );

create policy fm_coaching_activities_select on public.fm_coaching_activities
  for select to authenticated using (
    exists (
      select 1 from public.fm_coaching_plans p
      join public.fm_msl_profiles m on m.id = p.msl_id
      where p.id = plan_id
        and (
          public.fm_is_leader()
          or m.profile_id = auth.uid()
          or m.field_director_id = public.fm_director_id_for_user()
        )
    )
  );

create policy fm_simulations_select on public.fm_simulations
  for select to authenticated using (true);

create policy fm_simulation_attempts_select on public.fm_simulation_attempts
  for select to authenticated using (
    public.fm_is_leader()
    or exists (
      select 1 from public.fm_msl_profiles m
      where m.id = msl_id and (m.profile_id = auth.uid() or m.field_director_id = public.fm_director_id_for_user())
    )
  );

create policy fm_audit_select on public.fm_audit_events
  for select to authenticated using (public.fm_is_leader());

-- Write policies (leaders / assigned directors)
create policy fm_msl_profiles_write on public.fm_msl_profiles
  for all to authenticated
  using (
    public.current_user_role() = 'admin'
    or field_director_id = public.fm_director_id_for_user()
  )
  with check (
    public.current_user_role() = 'admin'
    or field_director_id = public.fm_director_id_for_user()
  );

create policy fm_assessments_write on public.fm_assessments
  for all to authenticated
  using (public.fm_is_leader())
  with check (public.fm_is_leader());

create policy fm_readiness_insert on public.fm_readiness_decisions
  for insert to authenticated
  with check (
    public.current_user_role() in ('admin', 'field_director', 'medical_reviewer')
    and (
      public.current_user_role() <> 'field_director'
      or decided_by_director_id = public.fm_director_id_for_user()
    )
  );

create policy fm_coaching_plans_write on public.fm_coaching_plans
  for all to authenticated
  using (
    public.current_user_role() = 'admin'
    or director_id = public.fm_director_id_for_user()
  )
  with check (
    public.current_user_role() = 'admin'
    or director_id = public.fm_director_id_for_user()
  );

create policy fm_coaching_activities_write on public.fm_coaching_activities
  for all to authenticated
  using (
    exists (
      select 1 from public.fm_coaching_plans p
      where p.id = plan_id
        and (
          public.current_user_role() = 'admin'
          or p.director_id = public.fm_director_id_for_user()
        )
    )
  )
  with check (
    exists (
      select 1 from public.fm_coaching_plans p
      where p.id = plan_id
        and (
          public.current_user_role() = 'admin'
          or p.director_id = public.fm_director_id_for_user()
        )
    )
  );

create policy fm_audit_insert on public.fm_audit_events
  for insert to authenticated
  with check (public.fm_is_leader() or public.current_user_role() = 'admin');
