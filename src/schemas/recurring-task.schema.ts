import { z } from "zod";
import type { RecurringTask } from "@/types";
import { shiftTypeSchema } from "./shift.schema";

const isoDateTimeSchema = z.string().datetime();
const idSchema = z.string().min(1);

export const recurringTaskStatusSchema = z.enum([
  "active",
  "paused",
  "archived",
]);

export const recurringTaskPrioritySchema = z.enum(["low", "normal", "high"]);

export const recurringTaskSchema: z.ZodType<RecurringTask> = z.object({
  id: idSchema,
  teamId: idSchema,
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  shiftTypes: z.array(shiftTypeSchema).min(1),
  priority: recurringTaskPrioritySchema,
  status: recurringTaskStatusSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
