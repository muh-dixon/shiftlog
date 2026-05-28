# ShiftLog Auth and Onboarding Plan

## 1. Purpose

This document defines the planned authentication and onboarding architecture for ShiftLog before implementing auth UI, protected routes, server actions, API routes, or RLS policies.

The MVP database schema is deployed. This plan explains how Supabase Auth should connect to the existing `public.users`, `public.teams`, and role-based access model.

## 2. Supabase Auth Strategy

ShiftLog should use Supabase Auth for identity, session handling, email/password login, and SSR-compatible cookie refresh.

Planned approach:

- Supabase Auth owns credentials and session lifecycle.
- `auth.users` stores the identity record managed by Supabase.
- `public.users` stores the ShiftLog app profile, team membership, role, and status.
- The app should use the existing Supabase SSR helpers for server and browser clients.
- Route protection should rely on verified server-side session checks, not client-only state.
- RLS policies should later enforce team-scoped access at the database layer.

The service role key should not be used in client code or normal app request paths.

## 3. Mapping `auth.users` to `public.users`

MVP decision:

- Use `public.users.id = auth.users.id`.
- Treat Supabase Auth user ID as the canonical user identity.
- Keep team membership, role, and status in `public.users`.
- Create the `public.users` profile only after the user has completed team creation or team join onboarding.
- Create the profile row with the authenticated user's ID after signup/onboarding, not with a generated UUID.
- Defer automatic Auth triggers for MVP so onboarding can decide whether the user creates a team or joins one before a `public.users` row exists.

Benefits:

- Simpler joins and RLS checks.
- No extra `auth_user_id` column needed for MVP.
- Easier server-side lookup of the current app profile.

Potential caveat:

- If a signed-up user has not completed onboarding, they may exist in `auth.users` but not yet in `public.users`.

## 4. Signup Flow

Planned signup flow:

1. User enters name, email, and password.
2. Supabase Auth creates an `auth.users` record.
3. User is sent to onboarding.
4. User chooses one path:
   - Create a new team.
   - Join an existing team by invite.
5. App creates the matching `public.users` row with `id = auth.users.id`.
6. App redirects the user to the correct post-onboarding route.

Initial role defaults:

- New team creator should become the team admin or manager, depending on final role model.
- Invite-based joiners should default to `staff` unless the invite specifies a higher role.

## 5. Login Flow

Planned login flow:

1. User submits email and password.
2. Supabase Auth verifies credentials and creates a session.
3. Middleware refreshes auth cookies on future requests.
4. Server-side route logic loads the user's `public.users` profile.
5. If no profile exists, redirect to onboarding.
6. If profile exists but `status = inactive`, block access and show an account-disabled state.
7. If profile and team are active, redirect to the dashboard or requested route.

## 6. Logout / Session Flow

Planned logout flow:

1. User triggers logout.
2. App calls Supabase Auth sign-out.
3. Auth cookies are cleared.
4. User is redirected to `/login`.

Session refresh strategy:

- Root middleware refreshes Supabase cookies.
- Server components and server actions should create a fresh server client per request.
- Authorization decisions should use verified user identity from Supabase Auth and the current `public.users` row.

## 7. Team Creation Flow

Planned team creation flow:

1. Authenticated user without a `public.users` profile chooses "Create team."
2. User enters team name and optional location.
3. App creates a `teams` row with `status = active`.
4. App creates a `users` row linked to the new team using the authenticated user's ID.
5. App assigns the creator an elevated role.
6. App redirects to the dashboard.

Recommended MVP creator role:

- Use `manager` if the database role enum remains `staff | lead | manager`.
- Add a future `admin` role or separate team membership permissions if admin behavior needs to differ from manager behavior.

## 8. Invite / Join Team Flow

The deployed MVP schema does not yet include invite tables or invite tokens.

Planned flow:

1. Manager or admin creates an invite for a team.
2. Invite includes team ID, intended role, expiration, and single-use state.
3. New user signs up or existing user logs in.
4. User enters or opens invite token.
5. App validates that the invite is active and unexpired.
6. App creates or updates the user's `public.users` profile for that team.
7. Invite is marked used.

MVP simplification option:

- Use a manually shared team join code before building full invite tracking.

Schema implication:

- A future `team_invites` table is likely needed before implementing a robust invite flow.

## 9. Role Assignment Rules

Current deployed roles:

- `staff`
- `lead`
- `manager`

Planned role behavior:

- New team creators receive `manager` for MVP.
- Managers can assign `staff`, `lead`, or `manager` within their team.
- Staff cannot change roles.
- Leads may eventually manage shift-level workflows but should not manage team settings by default.
- Inactive users should not access protected app routes.

Admin note:

- The requested architecture includes admin permissions, but the deployed `user_role` enum does not include `admin`.
- Admin should either become a new enum value in a later migration or be modeled separately as a team-level permission.

## 10. Staff vs Manager vs Admin Permissions

## Staff

Staff should be able to:

- View their team's dashboard and handover data.
- Create shift logs.
- Add completed tasks, outstanding tasks, equipment issues, customer incidents, and notes.
- Request manager attention.
- View recurring tasks for their team.

Staff should not be able to:

- Resolve manager flags.
- Manage recurring task templates.
- Manage team members.
- Change roles.

## Lead

Leads should be able to:

- Do everything staff can do.
- Lead or close assigned shifts if that workflow is added.
- Help coordinate outstanding shift tasks.

Lead-specific permissions are not fully defined yet.

## Manager

Managers should be able to:

- Review all team shift logs.
- Review, assign, resolve, or dismiss manager flags.
- Manage recurring task templates.
- View team-level reporting.
- Invite users if invite functionality is implemented.

## Admin

Admin is a planned permission concept, not currently represented in the deployed role enum.

Admins may eventually be able to:

- Manage team settings.
- Manage users and roles.
- Archive teams.
- Configure team-level onboarding and recurring task defaults.

## 11. Middleware Protection Strategy

The current middleware should remain focused on refreshing Supabase auth cookies.

Planned protection strategy:

- Keep cookie/session refresh in middleware.
- Avoid heavy authorization checks in middleware.
- Avoid database queries in middleware unless a route requires a lightweight optimistic redirect.
- Use server-side route/layout checks for authoritative protection.
- Keep public routes accessible: `/login`, `/signup`, and any invite landing route.
- Redirect authenticated users without a profile to onboarding.

This keeps middleware reliable and avoids turning it into the main authorization layer.

## 12. Protected Route Strategy

Protected app areas should use server-side guards in layouts or page-level loaders.

Planned route groups:

- Public: login, signup, invite landing, password reset.
- Onboarding: team creation and join flow for authenticated users without a profile.
- App: dashboard, handover, manager views.

Protection checks:

1. Verify Supabase Auth session.
2. Load `public.users` profile by authenticated user ID.
3. Confirm `users.status = active`.
4. Confirm related team exists and `teams.status = active`.
5. Check route-level role requirements.

Manager-only views should require `role = manager` or future admin permission.

## 13. Required Session Data After Login

After login, the app should be able to resolve:

- `authUserId`
- `email`
- `public.users.id`
- `teamId`
- `role`
- `userStatus`
- `teamStatus`
- `displayName`

This data should be loaded server-side when needed rather than trusted from local storage.

## 14. Planned Onboarding Sequence

Recommended MVP sequence:

1. User signs up.
2. User confirms email if email confirmation is enabled.
3. App checks for `public.users` profile.
4. If missing, send user to onboarding.
5. User creates a team or joins by invite.
6. App creates the `public.users` profile using `auth.users.id`.
7. App verifies team and user status.
8. App redirects to dashboard.
9. User can access role-appropriate app routes.

## 15. Risks and Edge Cases

- Auth user exists without a `public.users` profile.
- User belongs to an archived team.
- User profile is inactive.
- Invite is expired, already used, or belongs to a different email.
- User attempts to join multiple teams, but MVP schema only supports one team per user.
- Manager/admin distinction is not yet represented in the database enum.
- Middleware refresh may succeed while profile lookup fails.
- Role changes during an active session need to take effect quickly.
- RLS policies must avoid exposing cross-team records.
- Email uniqueness scope is still undecided.
- Deleting auth users could orphan app records unless handled carefully.

## 16. Open Implementation Questions

- Should an Auth trigger eventually create a partial profile, or should onboarding remain fully application-controlled?
- Should the database add an `admin` role or use a separate permissions table?
- Should team membership become a join table before invite flows are implemented?
- What table should store team invites and join codes?
- Should invites be restricted to a specific email address?
- Should email confirmation be required before onboarding?
- What should happen when a manager invites another manager?
- Can leads close shifts, or is that manager-only?
- Should inactive users be signed out automatically or shown a blocked account page?
- Should onboarding be implemented with server actions or route handlers?
- Which routes are public once invite and password reset flows exist?
- What exact RLS policies are needed for staff, lead, manager, and future admin behavior?
