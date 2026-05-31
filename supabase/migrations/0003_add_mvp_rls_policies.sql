-- ShiftLog MVP RLS policies.
-- These policies unblock the current authenticated/onboarding flow and keep
-- access scoped to the signed-in user's own profile/team. They are intentionally
-- simple and should be tightened when full role and invite behavior is built.

create or replace function public.current_user_team_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select team_id
  from public.users
  where id = auth.uid()
    and status = 'active'
  limit 1
$$;

comment on function public.current_user_team_id() is
  'MVP RLS helper for resolving the authenticated user profile team. Used by team-scoped policies and may be replaced or tightened later.';

create policy "Users can read own profile"
on public.users
for select
to authenticated
using (id = auth.uid());

create policy "Users can create own profile"
on public.users
for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update own profile"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users can read own team"
on public.teams
for select
to authenticated
using (id = public.current_user_team_id());

create policy "Authenticated users can create teams"
on public.teams
for insert
to authenticated
with check (auth.uid() is not null);

create policy "Team members can read shifts"
on public.shifts
for select
to authenticated
using (team_id = public.current_user_team_id());

create policy "Team members can read shift logs"
on public.shift_logs
for select
to authenticated
using (team_id = public.current_user_team_id());

create policy "Team members can read recurring tasks"
on public.recurring_tasks
for select
to authenticated
using (team_id = public.current_user_team_id());

create policy "Team members can read manager flags"
on public.manager_flags
for select
to authenticated
using (team_id = public.current_user_team_id());
