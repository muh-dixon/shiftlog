import type { User as SupabaseUser } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/auth";

export async function requireAuth(): Promise<SupabaseUser> {
  const {
    data: { user },
    error,
  } = await getCurrentUser();

  if (error || !user) {
    redirect("/login");
  }

  return user;
}
