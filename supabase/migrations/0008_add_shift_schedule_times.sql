-- Add local clock-time fields for MVP shift scheduling.
-- Existing starts_at/ends_at timestamps stay in place for absolute ordering and
-- compatibility, while start_time/end_time support staff-facing schedule display.

alter table public.shifts
  add column start_time time,
  add column end_time time;

update public.shifts
set start_time = starts_at::time
where start_time is null;

update public.shifts
set end_time = ends_at::time
where end_time is null
  and ends_at is not null;

alter table public.shifts
  alter column start_time set not null;

comment on column public.shifts.start_time is
  'Local scheduled start time for the shift, stored separately from the absolute starts_at timestamp.';

comment on column public.shifts.end_time is
  'Optional local scheduled end time for the shift; may be null while a shift is still open-ended.';
