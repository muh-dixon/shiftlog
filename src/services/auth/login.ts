import type { AuthTokenResponsePassword } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export interface LoginInput {
  email: string;
  password: string;
}

export async function login({
  email,
  password,
}: LoginInput): Promise<AuthTokenResponsePassword> {
  const supabase = await createClient();

  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}
