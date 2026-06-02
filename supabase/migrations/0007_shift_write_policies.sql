-- MVP shift write policies.
-- Managers can create and update shifts for their own team. Team-scoped SELECT
-- already exists from the MVP RLS migration, and no delete policy is added.

grant insert, update on public.shifts to authenticated;

create policy "Managers can create shifts for their team"
on public.shifts
for insert
to authenticated
with check (
  team_id = public.current_user_team_id()
  and public.current_user_is_manager()
);

create policy "Managers can update shifts for their team"
on public.shifts
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
