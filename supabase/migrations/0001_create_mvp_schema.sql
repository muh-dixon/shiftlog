-- ShiftLog MVP schema draft.
-- This migration translates the TypeScript/Zod domain models into the first
-- Supabase/PostgreSQL relational design. Detailed RLS policies are intentionally
-- deferred until the auth/team membership model is finalized.

create extension if not exists pgcrypto;

create type public.user_role as enum ('staff', 'lead', 'manager');
create type public.user_status as enum ('active', 'inactive');
create type public.team_status as enum ('active', 'archived');
create type public.shift_type as enum ('morning', 'afternoon', 'closing');
create type public.shift_status as enum ('scheduled', 'active', 'completed', 'cancelled');
create type public.shift_log_status as enum ('draft', 'submitted', 'reviewed');
create type public.manager_attention_state as enum ('none', 'requested', 'flagged', 'resolved');
create type public.task_completion_state as enum ('completed', 'outstanding');
create type public.issue_severity as enum ('low', 'medium', 'high');
create type public.recurring_task_priority as enum ('low', 'normal', 'high');
create type public.recurring_task_status as enum ('active', 'paused', 'archived');
create type public.manager_flag_priority as enum ('normal', 'high', 'urgent');
create type public.manager_flag_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  status public.team_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.teams is
  'Service teams are the main tenant boundary for ShiftLog MVP data.';

create table public.users (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete restrict,
  name text not null,
  email text not null,
  role public.user_role not null default 'staff',
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, team_id)
);

comment on table public.users is
  'Application user profile records. Supabase Auth linkage is intentionally deferred.';

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete restrict,
  lead_user_id uuid,
  type public.shift_type not null,
  service_date date not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status public.shift_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, team_id),
  constraint shifts_lead_user_same_team_fk
    foreign key (lead_user_id, team_id)
    references public.users(id, team_id)
    on delete set null (lead_user_id),
  constraint shifts_ends_after_starts_check
    check (ends_at is null or ends_at >= starts_at)
);

comment on table public.shifts is
  'Morning, afternoon, or closing work periods that group handover logs.';

create table public.shift_logs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete restrict,
  shift_id uuid not null,
  user_id uuid not null,
  status public.shift_log_status not null default 'draft',
  completed_tasks jsonb not null default '[]'::jsonb,
  outstanding_tasks jsonb not null default '[]'::jsonb,
  equipment_issues jsonb not null default '[]'::jsonb,
  customer_incidents jsonb not null default '[]'::jsonb,
  notes text,
  manager_attention_state public.manager_attention_state not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, team_id),
  constraint shift_logs_shift_same_team_fk
    foreign key (shift_id, team_id)
    references public.shifts(id, team_id)
    on delete cascade,
  constraint shift_logs_user_same_team_fk
    foreign key (user_id, team_id)
    references public.users(id, team_id)
    on delete restrict,
  constraint shift_logs_completed_tasks_array_check
    check (jsonb_typeof(completed_tasks) = 'array'),
  constraint shift_logs_outstanding_tasks_array_check
    check (jsonb_typeof(outstanding_tasks) = 'array'),
  constraint shift_logs_equipment_issues_array_check
    check (jsonb_typeof(equipment_issues) = 'array'),
  constraint shift_logs_customer_incidents_array_check
    check (jsonb_typeof(customer_incidents) = 'array')
);

comment on table public.shift_logs is
  'Structured handover records. MVP task and issue arrays stay in jsonb and are validated by application schemas.';

create table public.recurring_tasks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete restrict,
  title text not null,
  description text,
  shift_types public.shift_type[] not null,
  priority public.recurring_task_priority not null default 'normal',
  status public.recurring_task_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_tasks_shift_types_not_empty_check
    check (cardinality(shift_types) > 0)
);

comment on table public.recurring_tasks is
  'Repeatable team checklist tasks that reset by applicable shift type.';

create table public.manager_flags (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete restrict,
  shift_log_id uuid not null,
  created_by_user_id uuid not null,
  assigned_manager_user_id uuid,
  reason text not null,
  priority public.manager_flag_priority not null default 'normal',
  status public.manager_flag_status not null default 'open',
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint manager_flags_shift_log_same_team_fk
    foreign key (shift_log_id, team_id)
    references public.shift_logs(id, team_id)
    on delete cascade,
  constraint manager_flags_created_by_same_team_fk
    foreign key (created_by_user_id, team_id)
    references public.users(id, team_id)
    on delete restrict,
  constraint manager_flags_assigned_manager_same_team_fk
    foreign key (assigned_manager_user_id, team_id)
    references public.users(id, team_id)
    on delete set null (assigned_manager_user_id)
);

comment on table public.manager_flags is
  'Escalated shift-log issues for manager review. Detailed approval policy comes with RLS policies later.';

create trigger set_teams_updated_at
before update on public.teams
for each row execute function public.set_updated_at();

create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger set_shifts_updated_at
before update on public.shifts
for each row execute function public.set_updated_at();

create trigger set_shift_logs_updated_at
before update on public.shift_logs
for each row execute function public.set_updated_at();

create trigger set_recurring_tasks_updated_at
before update on public.recurring_tasks
for each row execute function public.set_updated_at();

create trigger set_manager_flags_updated_at
before update on public.manager_flags
for each row execute function public.set_updated_at();

create index users_team_id_idx on public.users(team_id);
create index users_email_idx on public.users(email);

create index shifts_team_id_idx on public.shifts(team_id);
create index shifts_service_date_idx on public.shifts(service_date);
create index shifts_status_idx on public.shifts(status);
create index shifts_team_id_service_date_idx on public.shifts(team_id, service_date);

create index shift_logs_team_id_idx on public.shift_logs(team_id);
create index shift_logs_shift_id_idx on public.shift_logs(shift_id);
create index shift_logs_user_id_idx on public.shift_logs(user_id);
create index shift_logs_status_idx on public.shift_logs(status);
create index shift_logs_manager_attention_state_idx
  on public.shift_logs(manager_attention_state);

create index recurring_tasks_team_id_idx on public.recurring_tasks(team_id);
create index recurring_tasks_status_idx on public.recurring_tasks(status);

create index manager_flags_team_id_idx on public.manager_flags(team_id);
create index manager_flags_shift_log_id_idx on public.manager_flags(shift_log_id);
create index manager_flags_created_by_user_id_idx
  on public.manager_flags(created_by_user_id);
create index manager_flags_assigned_manager_user_id_idx
  on public.manager_flags(assigned_manager_user_id);
create index manager_flags_status_idx on public.manager_flags(status);
create index manager_flags_team_id_status_priority_idx
  on public.manager_flags(team_id, status, priority);

-- RLS is enabled now, but detailed policies are intentionally omitted until
-- auth and role behavior are implemented.
alter table public.teams enable row level security;
alter table public.users enable row level security;
alter table public.shifts enable row level security;
alter table public.shift_logs enable row level security;
alter table public.recurring_tasks enable row level security;
alter table public.manager_flags enable row level security;
