import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/services/guards";
import type { ShiftRow } from "./get-shifts";

export async function getCurrentShift(): Promise<ShiftRow | null> {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("shifts")
    .select(
      "id, team_id, lead_user_id, type, service_date, start_time, end_time, starts_at, ends_at, status, created_at, updated_at",
    )
    .eq("team_id", profile.team_id)
    .eq("service_date", today)
    .in("status", ["scheduled", "active"])
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch current shift: ${error.message}`);
  }

  return data;
}
