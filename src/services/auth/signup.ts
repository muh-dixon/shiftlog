import type { AuthResponse } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export interface SignupInput {
  email: string;
  password: string;
}

export async function signup({
  email,
  password,
}: SignupInput): Promise<AuthResponse> {
  const supabase = await createClient();

  const result = await supabase.auth.signUp({
    email,
    password,
  });

  // TODO: After signup, route the user into onboarding.
  // TODO: Create the public.users profile only after team creation or invite join.
  return result;
}
