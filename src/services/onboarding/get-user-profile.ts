import { createClient } from "@/lib/supabase/server";

export interface UserProfileRow {
  id: string;
  team_id: string;
  name: string;
  email: string;
  role: "staff" | "lead" | "manager";
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export async function getUserProfile(): Promise<UserProfileRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, team_id, name, email, role, status, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }

  return data;
}
