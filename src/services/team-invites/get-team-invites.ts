import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/services/guards";

export interface TeamInviteRow {
  id: string;
  team_id: string;
  code: string;
  role: "staff" | "lead" | "manager";
  status: "active" | "inactive";
  created_by_user_id: string | null;
  created_at: string;
  expires_at: string | null;
}

const teamInviteSelect =
  "id, team_id, code, role, status, created_by_user_id, created_at, expires_at";

export async function getTeamInvites(): Promise<TeamInviteRow[]> {
  const { profile } = await requireRole(["manager"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_invites")
    .select(teamInviteSelect)
    .eq("team_id", profile.team_id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch team invites: ${error.message}`);
  }

  return data ?? [];
}

export { teamInviteSelect };
