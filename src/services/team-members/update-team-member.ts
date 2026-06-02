import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/services/guards";
import { teamMemberSelect, type TeamMemberRow } from "./get-team-members";

const updateTeamMemberInputSchema = z
  .object({
    role: z.enum(["staff", "manager"]).optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one team member field is required.",
  });

export type UpdateTeamMemberInput = z.input<
  typeof updateTeamMemberInputSchema
>;

export async function updateTeamMember(
  memberId: string,
  input: UpdateTeamMemberInput,
): Promise<TeamMemberRow> {
  const parsedInput = updateTeamMemberInputSchema.parse(input);
  const { profile } = await requireRole(["manager"]);

  if (memberId === profile.id && parsedInput.status === "inactive") {
    throw new Error("Managers cannot deactivate their own profile.");
  }

  if (memberId === profile.id && parsedInput.role === "staff") {
    throw new Error("Managers cannot demote their own profile.");
  }

  const supabase = await createClient();
  const updateValues = {
    ...(parsedInput.role ? { role: parsedInput.role } : {}),
    ...(parsedInput.status ? { status: parsedInput.status } : {}),
  };

  const { data, error } = await supabase
    .from("users")
    .update(updateValues)
    .eq("id", memberId)
    .eq("team_id", profile.team_id)
    .select(teamMemberSelect)
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update team member: ${error?.message ?? "No team member was returned."}`,
    );
  }

  return data;
}
