import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  recurringTaskPrioritySchema,
  recurringTaskStatusSchema,
  shiftTypeSchema,
} from "@/schemas";
import { requireRole } from "@/services/guards";
import type { RecurringTaskRow } from "./get-recurring-tasks";

const updateRecurringTaskInputSchema = z
  .object({
    description: z.string().trim().min(1).nullable().optional(),
    priority: recurringTaskPrioritySchema.optional(),
    shiftTypes: z.array(shiftTypeSchema).min(1).optional(),
    status: recurringTaskStatusSchema.optional(),
    title: z.string().trim().min(1).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one recurring task field is required.",
  });

export type UpdateRecurringTaskInput = z.input<
  typeof updateRecurringTaskInputSchema
>;

export async function updateRecurringTask(
  id: string,
  input: UpdateRecurringTaskInput,
): Promise<RecurringTaskRow> {
  const parsedInput = updateRecurringTaskInputSchema.parse(input);
  const { profile } = await requireRole(["manager"]);
  const supabase = await createClient();

  const updateValues = {
    ...(parsedInput.description !== undefined
      ? { description: parsedInput.description }
      : {}),
    ...(parsedInput.priority ? { priority: parsedInput.priority } : {}),
    ...(parsedInput.shiftTypes ? { shift_types: parsedInput.shiftTypes } : {}),
    ...(parsedInput.status ? { status: parsedInput.status } : {}),
    ...(parsedInput.title ? { title: parsedInput.title } : {}),
  };

  const { data, error } = await supabase
    .from("recurring_tasks")
    .update(updateValues)
    .eq("id", id)
    .eq("team_id", profile.team_id)
    .select(
      "id, team_id, title, description, shift_types, priority, status, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update recurring task: ${
        error?.message ?? "No recurring task was returned."
      }`,
    );
  }

  return data;
}
