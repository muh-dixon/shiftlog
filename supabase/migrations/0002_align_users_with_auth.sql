-- Align ShiftLog app profiles with Supabase Auth identities.
-- Supabase Auth owns credentials and sessions; public.users stores the
-- application profile, team membership, role, and status.

alter table public.users
  alter column id drop default;

comment on column public.users.id is
  'Matches auth.users.id. App profile rows are created after signup/onboarding using the authenticated user id rather than a generated UUID.';

alter table public.users
  add constraint users_id_auth_users_id_fk
  foreign key (id)
  references auth.users(id)
  on delete cascade
  not valid;

-- Keep the existing non-unique users_email_idx from the MVP schema.
-- Auth identity is keyed by auth.users.id, and email uniqueness scope remains
-- an implementation decision until invite/team membership rules are finalized.
comment on column public.users.email is
  'Profile email copied from Supabase Auth for display and lookup. Keep indexed, but do not enforce a public.users unique email constraint until email uniqueness scope is finalized.';

-- Auth profile creation remains application-controlled for the MVP. No auth
-- trigger is created here so onboarding can decide whether the user creates a
-- team or joins one before public.users is inserted.
