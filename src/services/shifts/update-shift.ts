import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { shiftStatusSchema, shiftTypeSchema } from "@/schemas";
import { requireRole } from "@/services/guards";
import type { ShiftRow } from "./get-shifts";

const updateShiftInputSchema = z
  .object({
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable()
      .optional(),
    endsAt: z.string().datetime().nullable().optional(),
    leadUserId: z.string().min(1).nullable().optional(),
    serviceDate: z.string().date().optional(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    startsAt: z.string().datetime().optional(),
    status: shiftStatusSchema.optional(),
    type: shiftTypeSchema.optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one shift field is required.",
  });

export type UpdateShiftInput = z.input<typeof updateShiftInputSchema>;

export async function updateShift(
  id: string,
  input: UpdateShiftInput,
): Promise<ShiftRow> {
  const parsedInput = updateShiftInputSchema.parse(input);
  const { profile } = await requireRole(["manager"]);
  const supabase = await createClient();

  const updateValues = {
    ...(parsedInput.endTime !== undefined ? { end_time: parsedInput.endTime } : {}),
    ...(parsedInput.endsAt !== undefined ? { ends_at: parsedInput.endsAt } : {}),
    ...(parsedInput.leadUserId !== undefined
      ? { lead_user_id: parsedInput.leadUserId }
      : {}),
    ...(parsedInput.serviceDate ? { service_date: parsedInput.serviceDate } : {}),
    ...(parsedInput.startTime ? { start_time: parsedInput.startTime } : {}),
    ...(parsedInput.startsAt ? { starts_at: parsedInput.startsAt } : {}),
    ...(parsedInput.status ? { status: parsedInput.status } : {}),
    ...(parsedInput.type ? { type: parsedInput.type } : {}),
  };

  const { data, error } = await supabase
    .from("shifts")
    .update(updateValues)
    .eq("id", id)
    .eq("team_id", profile.team_id)
    .select(
      "id, team_id, lead_user_id, type, service_date, start_time, end_time, starts_at, ends_at, status, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update shift: ${error?.message ?? "No shift was returned."}`,
    );
  }

  return data;
}
