-- Fix MVP onboarding team creation.
-- A signed-in user creates their first team before public.users exists, so this
-- INSERT policy must not depend on current_user_team_id() or any profile lookup.

drop policy if exists "Authenticated users can create teams" on public.teams;

create policy "Authenticated users can create teams during onboarding"
on public.teams
for insert
to authenticated
with check (true);

comment on policy "Authenticated users can create teams during onboarding"
on public.teams is
  'MVP onboarding policy: authenticated users may create their first team before their public.users profile/team_id exists. Tighten later when invite/admin flows are implemented.';
