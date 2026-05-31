-- MVP recurring task write policies.
-- Managers can create and update recurring task templates for their own team.
-- RLS still blocks cross-team writes, and no delete policy is added.

grant insert, update on public.recurring_tasks to authenticated;

create or replace function public.current_user_is_manager()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'manager'
      and status = 'active'
  )
$$;

comment on function public.current_user_is_manager() is
  'MVP RLS helper for manager-only writes. Replace or tighten when full role permissions are implemented.';

create policy "Managers can create recurring tasks for their team"
on public.recurring_tasks
for insert
to authenticated
with check (
  team_id = public.current_user_team_id()
  and public.current_user_is_manager()
);

create policy "Managers can update recurring tasks for their team"
on public.recurring_tasks
for update
to authenticated
using (
  team_id = public.current_user_team_id()
  and public.current_user_is_manager()
)
with check (
  team_id = public.current_user_team_id()
  and public.current_user_is_manager()
);
