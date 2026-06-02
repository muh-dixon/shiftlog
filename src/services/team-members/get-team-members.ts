import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/services/guards";

export interface TeamMemberRow {
  id: string;
  team_id: string;
  name: string;
  email: string;
  role: "staff" | "lead" | "manager";
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

const teamMemberSelect =
  "id, team_id, name, email, role, status, created_at, updated_at";

export async function getTeamMembers(): Promise<TeamMemberRow[]> {
  const { profile } = await requireRole(["manager"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select(teamMemberSelect)
    .eq("team_id", profile.team_id)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch team members: ${error.message}`);
  }

  return data ?? [];
}

export { teamMemberSelect };
