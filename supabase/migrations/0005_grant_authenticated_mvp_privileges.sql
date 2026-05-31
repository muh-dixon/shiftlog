-- MVP authenticated role grants.
-- RLS policies still decide which rows authenticated users can access.
-- No delete privileges are granted in the MVP.

grant usage on schema public to authenticated;

grant select, insert, update on public.users to authenticated;
grant select, insert, update on public.teams to authenticated;

grant select on public.shifts to authenticated;
grant select on public.shift_logs to authenticated;
grant select on public.recurring_tasks to authenticated;
grant select on public.manager_flags to authenticated;
