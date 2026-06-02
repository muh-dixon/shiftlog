-- Manager Review Queue MVP.
-- Staff-created shift logs can create manager flags, while only managers can
-- update flag review status. No delete privileges are granted.

alter table public.manager_flags
  add column manager_attention_item_id text;

comment on column public.manager_flags.manager_attention_item_id is
  'Client-generated id for the manager attention item inside shift_logs.manager_attention_items. Used to prevent duplicate flags when a shift log is updated.';

create unique index manager_flags_shift_log_attention_item_unique_idx
  on public.manager_flags(shift_log_id, manager_attention_item_id)
  where manager_attention_item_id is not null;

grant select, insert, update on public.manager_flags to authenticated;

drop policy if exists "Team members can read manager flags" on public.manager_flags;

create policy "Team members can read manager flags for their team"
on public.manager_flags
for select
to authenticated
using (team_id = public.current_user_team_id());

create policy "Users can create manager flags from own shift logs"
on public.manager_flags
for insert
to authenticated
with check (
  team_id = public.current_user_team_id()
  and created_by_user_id = auth.uid()
  and exists (
    select 1
    from public.shift_logs
    where shift_logs.id = manager_flags.shift_log_id
      and shift_logs.team_id = manager_flags.team_id
      and shift_logs.user_id = auth.uid()
  )
);

create policy "Managers can update manager flags for their team"
on public.manager_flags
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
