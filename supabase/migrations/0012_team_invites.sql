-- Team Invite / Join Team MVP.
-- Managers can create invite codes for their team. Authenticated users without
-- profiles can use active codes during onboarding. No delete policy is added.

create table public.team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete restrict,
  code text not null unique,
  role public.user_role not null default 'staff',
  status text not null default 'active',
  created_by_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  constraint team_invites_status_check
    check (status in ('active', 'inactive')),
  constraint team_invites_role_not_manager_check
    check (role <> 'manager')
);

comment on table public.team_invites is
  'MVP invite codes that allow new authenticated users to join an existing ShiftLog team as staff.';

create index team_invites_code_idx on public.team_invites(code);
create index team_invites_team_id_idx on public.team_invites(team_id);
create index team_invites_status_idx on public.team_invites(status);

alter table public.team_invites enable row level security;

grant select, insert, update on public.team_invites to authenticated;

create policy "Managers can read team invites"
on public.team_invites
for select
to authenticated
using (
  team_id = public.current_user_team_id()
  and public.current_user_is_manager()
);

create policy "Authenticated users can read active invite codes"
on public.team_invites
for select
to authenticated
using (
  status = 'active'
  and (expires_at is null or expires_at > now())
);

create policy "Managers can create team invites"
on public.team_invites
for insert
to authenticated
with check (
  team_id = public.current_user_team_id()
  and created_by_user_id = auth.uid()
  and role <> 'manager'
  and public.current_user_is_manager()
);

create policy "Managers can update team invites"
on public.team_invites
for update
to authenticated
using (
  team_id = public.current_user_team_id()
  and public.current_user_is_manager()
)
with check (
  team_id = public.current_user_team_id()
  and role <> 'manager'
  and public.current_user_is_manager()
);
