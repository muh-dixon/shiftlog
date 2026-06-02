import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { userRoleSchema, userStatusSchema } from "@/schemas";
import { getUserProfile, type UserProfileRow } from "@/services/onboarding";

const joinTeamWithInviteInputSchema = z.object({
  code: z.string().trim().min(1),
  displayName: z.string().trim().min(1).optional(),
});

export interface JoinTeamWithInviteInput {
  code: string;
  displayName?: string;
}

export async function joinTeamWithInvite(
  input: JoinTeamWithInviteInput,
): Promise<UserProfileRow> {
  const { code, displayName } = joinTeamWithInviteInputSchema.parse(input);
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Cannot join a team without an authenticated user.");
  }

  const existingProfile = await getUserProfile();

  if (existingProfile) {
    throw new Error("A user profile already exists for the authenticated user.");
  }

  const { data: invite, error: inviteError } = await supabase
    .from("team_invites")
    .select("id, team_id, code, role, status, expires_at")
    .eq("code", code.toUpperCase())
    .eq("status", "active")
    .maybeSingle();

  if (inviteError) {
    throw new Error(`Failed to validate invite code: ${inviteError.message}`);
  }

  if (!invite) {
    throw new Error("Invite code was not found or is no longer active.");
  }

  if (invite.expires_at && new Date(invite.expires_at) <= new Date()) {
    throw new Error("Invite code has expired.");
  }

  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .insert({
      email: user.email ?? "",
      id: user.id,
      name: displayName ?? user.email ?? "ShiftLog User",
      role: userRoleSchema.parse("staff"),
      status: userStatusSchema.parse("active"),
      team_id: invite.team_id,
    })
    .select("id, team_id, name, email, role, status, created_at, updated_at")
    .single();

  if (profileError || !userProfile) {
    throw new Error(
      `Failed to join team: ${
        profileError?.message ?? "No user profile was returned."
      }`,
    );
  }

  return userProfile;
}
