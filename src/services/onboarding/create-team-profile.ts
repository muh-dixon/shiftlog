import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { teamStatusSchema, userRoleSchema, userStatusSchema } from "@/schemas";
import { getUserProfile, type UserProfileRow } from "./get-user-profile";

const createTeamProfileInputSchema = z.object({
  displayName: z.string().trim().min(1).optional(),
  teamName: z.string().trim().min(1),
});

export interface CreateTeamProfileInput {
  teamName: string;
  displayName?: string;
}

export interface TeamRow {
  id: string;
  name: string;
  location: string | null;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface CreateTeamProfileResult {
  team: TeamRow;
  userProfile: UserProfileRow;
}

export async function createTeamProfile(
  input: CreateTeamProfileInput,
): Promise<CreateTeamProfileResult> {
  const { displayName, teamName } = createTeamProfileInputSchema.parse(input);
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Cannot create team profile without an authenticated user.");
  }

  const existingProfile = await getUserProfile();

  if (existingProfile) {
    throw new Error("A user profile already exists for the authenticated user.");
  }

  const teamId = crypto.randomUUID();
  const { error: teamError } = await supabase.from("teams").insert({
    id: teamId,
    name: teamName,
    status: teamStatusSchema.parse("active"),
  });

  if (teamError) {
    throw new Error(`Failed to create team: ${teamError.message}`);
  }

  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .insert({
      email: user.email ?? "",
      id: user.id,
      name: displayName ?? user.email ?? "ShiftLog User",
      role: userRoleSchema.parse("manager"),
      status: userStatusSchema.parse("active"),
      team_id: teamId,
    })
    .select("id, team_id, name, email, role, status, created_at, updated_at")
    .single();

  if (profileError || !userProfile) {
    throw new Error(
      `Failed to create user profile: ${
        profileError?.message ?? "No user profile was returned."
      }`,
    );
  }

  const { data: team, error: teamFetchError } = await supabase
    .from("teams")
    .select("id, name, location, status, created_at, updated_at")
    .eq("id", teamId)
    .single();

  if (teamFetchError || !team) {
    throw new Error(
      `Failed to fetch created team: ${
        teamFetchError?.message ?? "No team was returned."
      }`,
    );
  }

  return {
    team,
    userProfile,
  };
}
