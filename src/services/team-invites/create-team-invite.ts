import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/services/guards";
import { teamInviteSelect, type TeamInviteRow } from "./get-team-invites";

function createInviteCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function createTeamInvite(): Promise<TeamInviteRow> {
  const { profile } = await requireRole(["manager"]);
  const supabase = await createClient();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase
      .from("team_invites")
      .insert({
        code: createInviteCode(),
        created_by_user_id: profile.id,
        role: "staff",
        status: "active",
        team_id: profile.team_id,
      })
      .select(teamInviteSelect)
      .single();

    if (!error && data) {
      return data;
    }

    if (!error.message.toLowerCase().includes("duplicate")) {
      throw new Error(`Failed to create invite code: ${error.message}`);
    }
  }

  throw new Error("Failed to create a unique invite code. Please try again.");
}
