import { redirect } from "next/navigation";
import type { UserRole } from "@/types";
import {
  requireProfile,
  type RequireProfileResult,
} from "./require-profile";

export async function requireRole(
  allowedRoles: ReadonlyArray<UserRole>,
): Promise<RequireProfileResult> {
  const result = await requireProfile();

  if (!allowedRoles.includes(result.profile.role)) {
    redirect("/dashboard");
  }

  return result;
}
