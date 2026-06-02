import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/services/guards";
import {
  managerFlagSelect,
  normalizeManagerFlag,
  type ManagerFlagRow,
} from "./get-manager-flags";

const updateManagerFlagInputSchema = z.object({
  resolutionNotes: z.string().trim().min(1).nullable().optional(),
  status: z.enum(["reviewing", "resolved"]),
});

export type UpdateManagerFlagInput = z.input<
  typeof updateManagerFlagInputSchema
>;

export async function updateManagerFlag(
  id: string,
  input: UpdateManagerFlagInput,
): Promise<ManagerFlagRow> {
  const parsedInput = updateManagerFlagInputSchema.parse(input);
  const { profile } = await requireRole(["manager"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("manager_flags")
    .update({
      assigned_manager_user_id: profile.id,
      resolution_notes: parsedInput.resolutionNotes ?? null,
      resolved_at:
        parsedInput.status === "resolved" ? new Date().toISOString() : null,
      status: parsedInput.status,
    })
    .eq("id", id)
    .eq("team_id", profile.team_id)
    .select(managerFlagSelect)
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update manager flag: ${error?.message ?? "No manager flag was returned."}`,
    );
  }

  return normalizeManagerFlag(data as unknown as Parameters<typeof normalizeManagerFlag>[0]);
}
