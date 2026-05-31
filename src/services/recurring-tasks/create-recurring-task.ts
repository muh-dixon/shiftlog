import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  recurringTaskPrioritySchema,
  recurringTaskStatusSchema,
  shiftTypeSchema,
} from "@/schemas";
import { requireRole } from "@/services/guards";
import type { RecurringTaskRow } from "./get-recurring-tasks";

const createRecurringTaskInputSchema = z.object({
  description: z.string().trim().min(1).optional(),
  priority: recurringTaskPrioritySchema.default("normal"),
  shiftTypes: z.array(shiftTypeSchema).min(1),
  status: recurringTaskStatusSchema.default("active"),
  title: z.string().trim().min(1),
});

export type CreateRecurringTaskInput = z.input<
  typeof createRecurringTaskInputSchema
>;

export async function createRecurringTask(
  input: CreateRecurringTaskInput,
): Promise<RecurringTaskRow> {
  const parsedInput = createRecurringTaskInputSchema.parse(input);
  const { profile } = await requireRole(["manager"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recurring_tasks")
    .insert({
      description: parsedInput.description ?? null,
      priority: parsedInput.priority,
      shift_types: parsedInput.shiftTypes,
      status: parsedInput.status,
      team_id: profile.team_id,
      title: parsedInput.title,
    })
    .select(
      "id, team_id, title, description, shift_types, priority, status, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create recurring task: ${
        error?.message ?? "No recurring task was returned."
      }`,
    );
  }

  return data;
}
