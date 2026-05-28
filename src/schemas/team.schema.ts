import { z } from "zod";
import type { Team } from "@/types";

const isoDateTimeSchema = z.string().datetime();
const idSchema = z.string().min(1);

export const teamStatusSchema = z.enum(["active", "archived"]);

export const teamSchema: z.ZodType<Team> = z.object({
  id: idSchema,
  name: z.string().min(1),
  location: z.string().min(1).optional(),
  status: teamStatusSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
