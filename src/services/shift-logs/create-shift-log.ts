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

const createShiftLogInputSchema = z.object({
  completedTasks: z.array(shiftTaskEntrySchema).default([]),
  customerIncidents: z.array(customerIncidentSchema).default([]),
  equipmentIssues: z.array(equipmentIssueSchema).default([]),
  managerAttentionItems: z.array(managerAttentionItemSchema).default([]),
  managerAttentionState: managerAttentionStateSchema.optional(),
  notes: z.string().trim().min(1).optional(),
  outstandingTasks: z.array(shiftTaskEntrySchema).default([]),
  shiftId: z.string().min(1),
  status: shiftLogStatusSchema.default("submitted"),
}).refine(
  (input) =>
    input.completedTasks.length > 0 ||
    input.outstandingTasks.length > 0 ||
    input.equipmentIssues.length > 0 ||
    input.customerIncidents.length > 0 ||
    input.managerAttentionItems.length > 0 ||
    Boolean(input.notes),
  {
    message: "Add at least one shift log detail before submitting.",
  },
);

export type CreateShiftLogInput = z.input<typeof createShiftLogInputSchema>;

export async function createShiftLog(
  input: CreateShiftLogInput,
): Promise<ShiftLogRow> {
  const parsedInput = createShiftLogInputSchema.parse(input);
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const managerAttentionState =
    parsedInput.managerAttentionState ??
    (parsedInput.managerAttentionItems.length > 0 ? "requested" : "none");
  const shiftLogValues = {
    completed_tasks: parsedInput.completedTasks,
    customer_incidents: parsedInput.customerIncidents,
    equipment_issues: parsedInput.equipmentIssues,
    manager_attention_items: parsedInput.managerAttentionItems,
    manager_attention_state: managerAttentionState,
    notes: parsedInput.notes ?? null,
    outstanding_tasks: parsedInput.outstandingTasks,
    shift_id: parsedInput.shiftId,
    status: parsedInput.status,
    team_id: profile.team_id,
    user_id: profile.id,
  };

  const { data: existingLog, error: existingError } = await supabase
    .from("shift_logs")
    .select("id")
    .eq("team_id", profile.team_id)
    .eq("shift_id", parsedInput.shiftId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to check existing shift log: ${existingError.message}`);
  }

  if (existingLog) {
    const { data, error } = await supabase
      .from("shift_logs")
      .update(shiftLogValues)
      .eq("id", existingLog.id)
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

  const { data, error } = await supabase
    .from("shift_logs")
    .insert(shiftLogValues)
    .select(shiftLogSelect)
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create shift log: ${error?.message ?? "No shift log was returned."}`,
    );
  }

  return data;
}
