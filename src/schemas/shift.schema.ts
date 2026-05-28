import { z } from "zod";
import type { Shift } from "@/types";

const isoDateTimeSchema = z.string().datetime();
const idSchema = z.string().min(1);

export const shiftTypeSchema = z.enum(["morning", "afternoon", "closing"]);

export const shiftStatusSchema = z.enum([
  "scheduled",
  "active",
  "completed",
  "cancelled",
]);

export const shiftSchema: z.ZodType<Shift> = z.object({
  id: idSchema,
  teamId: idSchema,
  leadUserId: idSchema.optional(),
  type: shiftTypeSchema,
  serviceDate: z.string().date(),
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema.optional(),
  status: shiftStatusSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
