import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function logout(): Promise<{ error: AuthError | null }> {
  const supabase = await createClient();

  return supabase.auth.signOut();
}
