# ShiftLog DB Schema V1

## 1. Purpose

This document translates the MVP TypeScript domain models and Zod schemas into a first relational database design for Supabase/PostgreSQL.

It is a planning document only. It does not define SQL, Supabase migrations, client code, auth logic, or Row Level Security policies yet.

The TypeScript models use camelCase field names. The database plan uses PostgreSQL-style snake_case column names.

## 2. Table Overview

MVP tables:

- `teams`
- `users`
- `shifts`
- `shift_logs`
- `recurring_tasks`
- `manager_flags`

Primary relationship flow:

```text
teams
  |
  v
users

teams
  |
  v
shifts
  |
  v
shift_logs
  |
  v
manager_flags

teams
  |
  v
recurring_tasks
```

## 3. Enum Strategy

Planned PostgreSQL enums:

| Enum | Values | Used By |
| --- | --- | --- |
| `user_role` | `staff`, `lead`, `manager` | `users.role` |
| `user_status` | `active`, `inactive` | `users.status` |
| `team_status` | `active`, `archived` | `teams.status` |
| `shift_type` | `morning`, `afternoon`, `closing` | `shifts.type`, `recurring_tasks.shift_types` |
| `shift_status` | `scheduled`, `active`, `completed`, `cancelled` | `shifts.status` |
| `shift_log_status` | `draft`, `submitted`, `reviewed` | `shift_logs.status` |
| `manager_attention_state` | `none`, `requested`, `flagged`, `resolved` | `shift_logs.manager_attention_state` |
| `task_completion_state` | `completed`, `outstanding` | JSON task entries in `shift_logs` |
| `issue_severity` | `low`, `medium`, `high` | JSON equipment/customer issue entries in `shift_logs` |
| `recurring_task_priority` | `low`, `normal`, `high` | `recurring_tasks.priority` |
| `recurring_task_status` | `active`, `paused`, `archived` | `recurring_tasks.status` |
| `manager_flag_priority` | `normal`, `high`, `urgent` | `manager_flags.priority` |
| `manager_flag_status` | `open`, `reviewing`, `resolved`, `dismissed` | `manager_flags.status` |

JSON fields inside `shift_logs` may initially validate enum-like values at the application layer with Zod. A later migration can normalize task and issue arrays into dedicated tables if reporting requirements grow.

## 4. Table Details

## teams

### Primary Key

- `id` UUID primary key

### Important Columns

- `name` text
- `location` text
- `status` `team_status`
- `created_at` timestamptz
- `updated_at` timestamptz

### Foreign Keys

- None for MVP.

### Required Fields

- `id`
- `name`
- `status`
- `created_at`
- `updated_at`

### Optional Fields

- `location`

### Timestamp Fields

- `created_at`
- `updated_at`

### Relationships

- One team has many users.
- One team has many shifts.
- One team has many shift logs through shifts.
- One team has many recurring tasks.
- One team has many manager flags through shift logs.

## users

### Primary Key

- `id` UUID primary key

### Important Columns

- `team_id` UUID
- `name` text
- `email` text
- `role` `user_role`
- `status` `user_status`
- `created_at` timestamptz
- `updated_at` timestamptz

### Foreign Keys

- `team_id` references `teams.id`

### Required Fields

- `id`
- `team_id`
- `name`
- `email`
- `role`
- `status`
- `created_at`
- `updated_at`

### Optional Fields

- None for the MVP model.

### Timestamp Fields

- `created_at`
- `updated_at`

### Relationships

- Each user belongs to one team.
- A user may lead shifts through `shifts.lead_user_id`.
- A user may author shift logs through `shift_logs.user_id`.
- A user may create manager flags through `manager_flags.created_by_user_id`.
- A manager user may be assigned manager flags through `manager_flags.assigned_manager_user_id`.

## shifts

### Primary Key

- `id` UUID primary key

### Important Columns

- `team_id` UUID
- `lead_user_id` UUID
- `type` `shift_type`
- `service_date` date
- `starts_at` timestamptz
- `ends_at` timestamptz
- `status` `shift_status`
- `created_at` timestamptz
- `updated_at` timestamptz

### Foreign Keys

- `team_id` references `teams.id`
- `lead_user_id` references `users.id`

### Required Fields

- `id`
- `team_id`
- `type`
- `service_date`
- `starts_at`
- `status`
- `created_at`
- `updated_at`

### Optional Fields

- `lead_user_id`
- `ends_at`

### Timestamp Fields

- `starts_at`
- `ends_at`
- `created_at`
- `updated_at`

### Relationships

- Each shift belongs to one team.
- A shift may have one lead user.
- A shift has many shift logs.

## shift_logs

### Primary Key

- `id` UUID primary key

### Important Columns

- `team_id` UUID
- `shift_id` UUID
- `user_id` UUID
- `status` `shift_log_status`
- `completed_tasks` jsonb
- `outstanding_tasks` jsonb
- `equipment_issues` jsonb
- `customer_incidents` jsonb
- `notes` text
- `manager_attention_state` `manager_attention_state`
- `created_at` timestamptz
- `updated_at` timestamptz

### Foreign Keys

- `team_id` references `teams.id`
- `shift_id` references `shifts.id`
- `user_id` references `users.id`

### Required Fields

- `id`
- `team_id`
- `shift_id`
- `user_id`
- `status`
- `completed_tasks`
- `outstanding_tasks`
- `equipment_issues`
- `customer_incidents`
- `manager_attention_state`
- `created_at`
- `updated_at`

### Optional Fields

- `notes`

### Timestamp Fields

- `created_at`
- `updated_at`

### Relationships

- Each shift log belongs to one team.
- Each shift log belongs to one shift.
- Each shift log is authored by one user.
- A shift log may have many manager flags.

### JSONB Field Notes

- `completed_tasks` stores task entries completed during the shift.
- `outstanding_tasks` stores task entries that must carry forward.
- `equipment_issues` stores equipment problems and service impact.
- `customer_incidents` stores customer incident summaries and follow-up state.

These fields match the MVP domain model and keep the first schema lean. They can be normalized later if analytics, filtering, or per-task assignment becomes more complex.

## recurring_tasks

### Primary Key

- `id` UUID primary key

### Important Columns

- `team_id` UUID
- `title` text
- `description` text
- `shift_types` `shift_type[]`
- `priority` `recurring_task_priority`
- `status` `recurring_task_status`
- `created_at` timestamptz
- `updated_at` timestamptz

### Foreign Keys

- `team_id` references `teams.id`

### Required Fields

- `id`
- `team_id`
- `title`
- `shift_types`
- `priority`
- `status`
- `created_at`
- `updated_at`

### Optional Fields

- `description`

### Timestamp Fields

- `created_at`
- `updated_at`

### Relationships

- Each recurring task belongs to one team.
- Recurring tasks may generate or inform checklist entries in shift logs.

## manager_flags

### Primary Key

- `id` UUID primary key

### Important Columns

- `team_id` UUID
- `shift_log_id` UUID
- `created_by_user_id` UUID
- `assigned_manager_user_id` UUID
- `reason` text
- `priority` `manager_flag_priority`
- `status` `manager_flag_status`
- `resolution_notes` text
- `created_at` timestamptz
- `updated_at` timestamptz
- `resolved_at` timestamptz

### Foreign Keys

- `team_id` references `teams.id`
- `shift_log_id` references `shift_logs.id`
- `created_by_user_id` references `users.id`
- `assigned_manager_user_id` references `users.id`

### Required Fields

- `id`
- `team_id`
- `shift_log_id`
- `created_by_user_id`
- `reason`
- `priority`
- `status`
- `created_at`
- `updated_at`

### Optional Fields

- `assigned_manager_user_id`
- `resolution_notes`
- `resolved_at`

### Timestamp Fields

- `created_at`
- `updated_at`
- `resolved_at`

### Relationships

- Each manager flag belongs to one shift log.
- Each manager flag belongs to one team.
- Each manager flag is created by one user.
- Each manager flag may be assigned to one manager user.

## 5. Relationship Rules

- Users belong to teams through `users.team_id`.
- Shifts belong to teams through `shifts.team_id`.
- Shift logs belong to shifts through `shift_logs.shift_id`.
- Shift logs belong to teams through `shift_logs.team_id`.
- Shift logs belong to users through `shift_logs.user_id`.
- Recurring tasks belong to teams through `recurring_tasks.team_id`.
- Manager flags belong to shift logs through `manager_flags.shift_log_id`.
- Manager flags belong to teams through `manager_flags.team_id`.
- Manager flags belong to users through `manager_flags.created_by_user_id`.
- Manager flags may be assigned to users through `manager_flags.assigned_manager_user_id`.

For data integrity, `team_id` values on child records should match the team of their parent records. For example, a `shift_logs.team_id` value should match the related `shifts.team_id`.

## 6. Index Strategy

Recommended MVP indexes:

- `users.team_id` for team membership checks and RLS filtering.
- `users.email` for future login/profile lookup. Consider uniqueness before auth implementation.
- `shifts.team_id` for team-scoped shift lists.
- `shifts.service_date` for dashboard and handover date filtering.
- `shifts.status` for active/completed shift queries.
- Composite `shifts(team_id, service_date)` for team schedule views.
- `shift_logs.team_id` for team-scoped log queries and RLS filtering.
- `shift_logs.shift_id` for loading logs for a specific shift.
- `shift_logs.user_id` for user-authored log history.
- `shift_logs.status` for draft/submitted/reviewed workflow queries.
- `shift_logs.manager_attention_state` for manager review queues.
- `recurring_tasks.team_id` for team checklists.
- `recurring_tasks.status` for active checklist generation.
- `manager_flags.team_id` for manager team review.
- `manager_flags.shift_log_id` for loading flags attached to a log.
- `manager_flags.created_by_user_id` for user-created escalation history.
- `manager_flags.assigned_manager_user_id` for assigned manager queues.
- `manager_flags.status` for open/reviewing/resolved filtering.
- Composite `manager_flags(team_id, status, priority)` for manager review dashboards.

## 7. Row Level Security Plan

No RLS SQL is defined in this document. The planned RLS model is:

- Users can only access records that belong to their team.
- Team membership is the primary access boundary for `users`, `shifts`, `shift_logs`, `recurring_tasks`, and `manager_flags`.
- Managers can review manager flags for their team.
- Admins can manage team-level settings, team members, and recurring task setup.
- Staff can create shift logs for their team.
- Staff can request manager attention through shift logs or manager flags.
- Staff cannot approve, resolve, or dismiss manager flags unless their role later permits it.
- Leads may eventually have elevated shift-closing permissions, but this should be defined before policies are written.

The migration phase should decide whether roles are stored only in `users.role` or synchronized with Supabase auth claims.

## 8. Deletion / Archive Strategy

Operational records should generally not be hard-deleted in the MVP because handover history and manager review trails are part of the product value.

Recommended approach:

- Archive teams with `teams.status = archived`.
- Deactivate users with `users.status = inactive`.
- Cancel or complete shifts with `shifts.status`.
- Keep shift logs as historical records. If removal is needed, add a future archival or deletion marker rather than hard-deleting.
- Preserve manager flags for auditability. Use `manager_flags.status = resolved` or `dismissed`, with `resolved_at` and `resolution_notes`.
- Recurring tasks can be paused or archived using `recurring_tasks.status`.

Hard deletion should be reserved for development cleanup, mistaken test data, or future privacy/compliance workflows that are explicitly designed.

## 9. Open Questions

- Should `users.id` match Supabase Auth user IDs, or should the app keep a separate profile ID with an `auth_user_id` column?
- Should users be limited to one team for the MVP, or should membership become a join table before launch?
- Should `users.email` be unique globally or only unique within a team?
- Should `shift_logs.completed_tasks`, `outstanding_tasks`, `equipment_issues`, and `customer_incidents` remain JSONB for V1, or should any of them be normalized immediately?
- Should `recurring_tasks.shift_types` use a PostgreSQL enum array, a join table, or separate boolean columns?
- Should `manager_attention_state` on `shift_logs` be derived from `manager_flags`, or stored directly for simpler dashboard queries?
- What role should be allowed to mark a shift as completed?
- Should manager flag assignment be required once a flag moves from `open` to `reviewing`?
- Should archived records include explicit `archived_at` and `archived_by_user_id` fields in V1?
- What exact admin role model is needed: team admin, manager, or both?
