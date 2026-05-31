import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/services/guards";

export interface RecurringTaskRow {
  id: string;
  team_id: string;
  title: string;
  description: string | null;
  shift_types: Array<"morning" | "afternoon" | "closing">;
  priority: "low" | "normal" | "high";
  status: "active" | "paused" | "archived";
  created_at: string;
  updated_at: string;
}

export async function getRecurringTasks(): Promise<RecurringTaskRow[]> {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recurring_tasks")
    .select(
      "id, team_id, title, description, shift_types, priority, status, created_at, updated_at",
    )
    .eq("team_id", profile.team_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch recurring tasks: ${error.message}`);
  }

  return data ?? [];
}
