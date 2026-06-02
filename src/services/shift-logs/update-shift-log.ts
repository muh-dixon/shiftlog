import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  customerIncidentSchema,
  equipmentIssueSchema,
  managerAttentionItemSchema,
  managerAttentionStateSchema,
  shiftLogStatusSchema,
  shiftTaskEntrySchema,
} from "@/schemas";
import { requireProfile } from "@/services/guards";
import { shiftLogSelect, type ShiftLogRow } from "./get-shift-logs";

const updateShiftLogInputSchema = z
  .object({
    completedTasks: z.array(shiftTaskEntrySchema).optional(),
    customerIncidents: z.array(customerIncidentSchema).optional(),
    equipmentIssues: z.array(equipmentIssueSchema).optional(),
    managerAttentionItems: z.array(managerAttentionItemSchema).optional(),
    managerAttentionState: managerAttentionStateSchema.optional(),
    notes: z.string().trim().min(1).nullable().optional(),
    outstandingTasks: z.array(shiftTaskEntrySchema).optional(),
    status: shiftLogStatusSchema.optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one shift log field is required.",
  });

export type UpdateShiftLogInput = z.input<typeof updateShiftLogInputSchema>;

export async function updateShiftLog(
  id: string,
  input: UpdateShiftLogInput,
): Promise<ShiftLogRow> {
  const parsedInput = updateShiftLogInputSchema.parse(input);
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const updateValues = {
    ...(parsedInput.completedTasks
      ? { completed_tasks: parsedInput.completedTasks }
      : {}),
    ...(parsedInput.customerIncidents
      ? { customer_incidents: parsedInput.customerIncidents }
      : {}),
    ...(parsedInput.equipmentIssues
      ? { equipment_issues: parsedInput.equipmentIssues }
      : {}),
    ...(parsedInput.managerAttentionItems
      ? { manager_attention_items: parsedInput.managerAttentionItems }
      : {}),
    ...(parsedInput.managerAttentionState
      ? { manager_attention_state: parsedInput.managerAttentionState }
      : {}),
    ...(parsedInput.notes !== undefined ? { notes: parsedInput.notes } : {}),
    ...(parsedInput.outstandingTasks
      ? { outstanding_tasks: parsedInput.outstandingTasks }
      : {}),
    ...(parsedInput.status ? { status: parsedInput.status } : {}),
  };

  const { data, error } = await supabase
    .from("shift_logs")
    .update(updateValues)
    .eq("id", id)
    .eq("team_id", profile.team_id)
    .select(shiftLogSelect)
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update shift log: ${error?.message ?? "No shift log was returned."}`,
    );
  }

  return data;
}
