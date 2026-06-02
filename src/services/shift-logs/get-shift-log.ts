import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/services/guards";
import { shiftLogSelect, type ShiftLogRow } from "./get-shift-logs";

export async function getShiftLog(id: string): Promise<ShiftLogRow | null> {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shift_logs")
    .select(shiftLogSelect)
    .eq("id", id)
    .eq("team_id", profile.team_id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch shift log: ${error.message}`);
  }

  return data;
}
