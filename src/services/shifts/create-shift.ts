import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { shiftStatusSchema, shiftTypeSchema } from "@/schemas";
import { requireRole } from "@/services/guards";
import type { ShiftRow } from "./get-shifts";

const createShiftInputSchema = z.object({
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),
  endsAt: z.string().datetime().optional(),
  leadUserId: z.string().min(1).optional(),
  serviceDate: z.string().date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  startsAt: z.string().datetime(),
  status: shiftStatusSchema.default("scheduled"),
  type: shiftTypeSchema,
});

export type CreateShiftInput = z.input<typeof createShiftInputSchema>;

export async function createShift(
  input: CreateShiftInput,
): Promise<ShiftRow> {
  const parsedInput = createShiftInputSchema.parse(input);
  const { profile } = await requireRole(["manager"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shifts")
    .insert({
      end_time: parsedInput.endTime ?? null,
      ends_at: parsedInput.endsAt ?? null,
      lead_user_id: parsedInput.leadUserId ?? profile.id,
      service_date: parsedInput.serviceDate,
      start_time: parsedInput.startTime,
      starts_at: parsedInput.startsAt,
      status: parsedInput.status,
      team_id: profile.team_id,
      type: parsedInput.type,
    })
    .select(
      "id, team_id, lead_user_id, type, service_date, start_time, end_time, starts_at, ends_at, status, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create shift: ${error?.message ?? "No shift was returned."}`,
    );
  }

  return data;
}
