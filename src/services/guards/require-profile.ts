import type { User as SupabaseUser } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import {
  getUserProfile,
  type UserProfileRow,
} from "@/services/onboarding";
import { requireAuth } from "./require-auth";

export interface RequireProfileResult {
  authUser: SupabaseUser;
  profile: UserProfileRow;
}

export async function requireProfile(): Promise<RequireProfileResult> {
  const authUser = await requireAuth();
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/onboarding");
  }

  return {
    authUser,
    profile,
  };
}
