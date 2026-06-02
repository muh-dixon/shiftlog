-- Team Management MVP policies.
-- Managers can view and update users on their own team. Existing own-profile
-- policies remain in place, and no delete privileges or policies are added.

create policy "Managers can read team members"
on public.users
for select
to authenticated
using (
  team_id = public.current_user_team_id()
  and public.current_user_is_manager()
);

create policy "Managers can update team members"
on public.users
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
