import { z } from "zod";
import type { User } from "@/types";

const isoDateTimeSchema = z.string().datetime();
const idSchema = z.string().min(1);

export const userRoleSchema = z.enum(["staff", "lead", "manager"]);

export const userStatusSchema = z.enum(["active", "inactive"]);

export const userSchema: z.ZodType<User> = z.object({
  id: idSchema,
  teamId: idSchema,
  name: z.string().min(1),
  email: z.string().email(),
  role: userRoleSchema,
  status: userStatusSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
