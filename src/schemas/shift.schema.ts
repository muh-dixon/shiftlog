import { z } from "zod";
import type { Shift } from "@/types";

const isoDateTimeSchema = z.string().datetime();
const idSchema = z.string().min(1);
const clockTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
  message: "Expected time in HH:mm format.",
});

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
  startTime: clockTimeSchema,
  endTime: clockTimeSchema.optional(),
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema.optional(),
  status: shiftStatusSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
