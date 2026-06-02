import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/services/guards";

export interface ShiftRow {
  id: string;
  team_id: string;
  lead_user_id: string | null;
  type: "morning" | "afternoon" | "closing";
  service_date: string;
  start_time: string;
  end_time: string | null;
  starts_at: string;
  ends_at: string | null;
  status: "scheduled" | "active" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export async function getShifts(): Promise<ShiftRow[]> {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shifts")
    .select(
      "id, team_id, lead_user_id, type, service_date, start_time, end_time, starts_at, ends_at, status, created_at, updated_at",
    )
    .eq("team_id", profile.team_id)
    .order("service_date", { ascending: false })
    .order("starts_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch shifts: ${error.message}`);
  }

  return data ?? [];
}
