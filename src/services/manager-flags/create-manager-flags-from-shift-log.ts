import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { managerAttentionItemSchema } from "@/schemas";
import { requireProfile } from "@/services/guards";
import type { ShiftLogRow } from "@/services/shift-logs";

const managerAttentionItemsSchema = z.array(managerAttentionItemSchema);

export async function createManagerFlagsFromShiftLog(
  shiftLog: ShiftLogRow,
): Promise<void> {
  const { profile } = await requireProfile();

  if (shiftLog.team_id !== profile.team_id || shiftLog.user_id !== profile.id) {
    throw new Error("Cannot create manager flags for another user's shift log.");
  }

  const managerAttentionItems = managerAttentionItemsSchema.parse(
    shiftLog.manager_attention_items,
  );

  if (managerAttentionItems.length === 0) {
    return;
  }

  const supabase = await createClient();
  const { data: existingFlags, error: existingError } = await supabase
    .from("manager_flags")
    .select("manager_attention_item_id")
    .eq("team_id", profile.team_id)
    .eq("shift_log_id", shiftLog.id);

  if (existingError) {
    throw new Error(
      `Failed to check existing manager flags: ${existingError.message}`,
    );
  }

  const existingItemIds = new Set(
    (existingFlags ?? [])
      .map((flag) => flag.manager_attention_item_id)
      .filter(Boolean),
  );
  const flagsToCreate = managerAttentionItems
    .filter((item) => !existingItemIds.has(item.id))
    .map((item) => ({
      created_by_user_id: profile.id,
      manager_attention_item_id: item.id,
      priority: "normal" as const,
      reason: item.summary,
      shift_log_id: shiftLog.id,
      status: "open" as const,
      team_id: profile.team_id,
    }));

  if (flagsToCreate.length === 0) {
    return;
  }

  const { error } = await supabase.from("manager_flags").insert(flagsToCreate);

  if (error) {
    throw new Error(`Failed to create manager flags: ${error.message}`);
  }
}
