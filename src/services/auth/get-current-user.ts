import type { UserResponse } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser(): Promise<UserResponse> {
  const supabase = await createClient();

  return supabase.auth.getUser();
}
