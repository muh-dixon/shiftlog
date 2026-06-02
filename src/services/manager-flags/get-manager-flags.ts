import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/services/guards";

export interface ManagerFlagRow {
  id: string;
  team_id: string;
  shift_log_id: string;
  manager_attention_item_id: string | null;
  created_by_user_id: string;
  assigned_manager_user_id: string | null;
  reason: string;
  priority: "normal" | "high" | "urgent";
  status: "open" | "reviewing" | "resolved" | "dismissed";
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  shift_logs?: {
    id: string;
    shift_id: string;
    user_id: string;
    notes: string | null;
    created_at: string;
    shifts?: {
      id: string;
      type: "morning" | "afternoon" | "closing";
      service_date: string;
      status: "scheduled" | "active" | "completed" | "cancelled";
      start_time: string;
      end_time: string | null;
    } | null;
  } | null;
}

type ShiftRelation = NonNullable<ManagerFlagRow["shift_logs"]>["shifts"];
type ShiftLogRelation = Omit<
  NonNullable<ManagerFlagRow["shift_logs"]>,
  "shifts"
> & {
  shifts?: ShiftRelation | ShiftRelation[] | null;
};
type RawManagerFlagRow = Omit<ManagerFlagRow, "shift_logs"> & {
  shift_logs?: ShiftLogRelation | ShiftLogRelation[] | null;
};

export const managerFlagSelect =
  "id, team_id, shift_log_id, manager_attention_item_id, created_by_user_id, assigned_manager_user_id, reason, priority, status, resolution_notes, created_at, updated_at, resolved_at, shift_logs(id, shift_id, user_id, notes, created_at, shifts(id, type, service_date, status, start_time, end_time))";

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function normalizeManagerFlag(row: RawManagerFlagRow): ManagerFlagRow {
  const shiftLog = firstOrNull(row.shift_logs);

  return {
    ...row,
    shift_logs: shiftLog
      ? {
          ...shiftLog,
          shifts: firstOrNull(shiftLog.shifts),
        }
      : null,
  };
}

export async function getManagerFlags(): Promise<ManagerFlagRow[]> {
  const { profile } = await requireRole(["manager"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("manager_flags")
    .select(managerFlagSelect)
    .eq("team_id", profile.team_id)
    .in("status", ["open", "reviewing", "resolved"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch manager flags: ${error.message}`);
  }

  return ((data ?? []) as unknown as RawManagerFlagRow[]).map(
    normalizeManagerFlag,
  );
}
