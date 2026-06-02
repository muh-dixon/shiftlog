import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/services/guards";

export interface ShiftLogRow {
  id: string;
  team_id: string;
  shift_id: string;
  user_id: string;
  status: "draft" | "submitted" | "reviewed";
  completed_tasks: unknown[];
  outstanding_tasks: unknown[];
  equipment_issues: unknown[];
  customer_incidents: unknown[];
  notes: string | null;
  manager_attention_items: unknown[];
  manager_attention_state: "none" | "requested" | "flagged" | "resolved";
  created_at: string;
  updated_at: string;
}

const shiftLogSelect =
  "id, team_id, shift_id, user_id, status, completed_tasks, outstanding_tasks, equipment_issues, customer_incidents, notes, manager_attention_items, manager_attention_state, created_at, updated_at";

export interface GetShiftLogsInput {
  excludeShiftId?: string;
  limit?: number;
  shiftId?: string;
}

export async function getShiftLogs(
  input: GetShiftLogsInput = {},
): Promise<ShiftLogRow[]> {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  let query = supabase
    .from("shift_logs")
    .select(shiftLogSelect)
    .eq("team_id", profile.team_id)
    .order("created_at", { ascending: false });

  if (input.shiftId) {
    query = query.eq("shift_id", input.shiftId);
  }

  if (input.excludeShiftId) {
    query = query.neq("shift_id", input.excludeShiftId);
  }

  if (input.limit) {
    query = query.limit(input.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch shift logs: ${error.message}`);
  }

  return data ?? [];
}

export { shiftLogSelect };
