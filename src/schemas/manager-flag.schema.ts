import { z } from "zod";
import type { ManagerFlag } from "@/types";

const isoDateTimeSchema = z.string().datetime();
const idSchema = z.string().min(1);

export const managerFlagStatusSchema = z.enum([
  "open",
  "reviewing",
  "resolved",
  "dismissed",
]);

export const managerFlagPrioritySchema = z.enum(["normal", "high", "urgent"]);

export const managerFlagSchema: z.ZodType<ManagerFlag> = z.object({
  id: idSchema,
  teamId: idSchema,
  shiftLogId: idSchema,
  createdByUserId: idSchema,
  assignedManagerUserId: idSchema.optional(),
  reason: z.string().min(1),
  priority: managerFlagPrioritySchema,
  status: managerFlagStatusSchema,
  resolutionNotes: z.string().min(1).optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  resolvedAt: isoDateTimeSchema.optional(),
});
