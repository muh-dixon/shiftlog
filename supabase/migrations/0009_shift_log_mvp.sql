-- Shift Log MVP support.
-- Team members can create and update shift logs for their own team. Manager
-- review workflows are intentionally deferred.

alter table public.shift_logs
  add column manager_attention_items jsonb not null default '[]'::jsonb;

alter table public.shift_logs
  add constraint shift_logs_manager_attention_items_array_check
    check (jsonb_typeof(manager_attention_items) = 'array');

comment on column public.shift_logs.manager_attention_items is
  'MVP list of handover items that need manager attention. Review workflow policies are deferred.';

grant insert, update on public.shift_logs to authenticated;

create policy "Team members can create shift logs"
on public.shift_logs
for insert
to authenticated
with check (
  team_id = public.current_user_team_id()
  and user_id = auth.uid()
  and exists (
    select 1
    from public.shifts
    where shifts.id = shift_logs.shift_id
      and shifts.team_id = shift_logs.team_id
  )
);

create policy "Team members can update own shift logs"
on public.shift_logs
for update
to authenticated
using (
  team_id = public.current_user_team_id()
  and user_id = auth.uid()
)
with check (
  team_id = public.current_user_team_id()
  and user_id = auth.uid()
);
