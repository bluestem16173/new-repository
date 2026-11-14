-- Harden Data Room API grants after 013.
-- Idempotent: safe if 013 already applied. Does not weaken RLS or grant anon SELECT.

begin;

grant usage on type public.data_room_workflow_type to authenticated, service_role;

grant select, insert, update on public.data_room_packages to authenticated, service_role;
grant select, insert on public.data_room_access_events to authenticated, service_role;

revoke all on public.data_room_packages from anon;
revoke all on public.data_room_access_events from anon;

commit;
