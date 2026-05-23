import type { ShiftType } from "./shift";

export type RecurringTaskStatus = "active" | "paused" | "archived";

export type RecurringTaskPriority = "low" | "normal" | "high";

export interface RecurringTask {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  // Defines which shift checklists should receive this task when work resets.
  shiftTypes: ShiftType[];
  priority: RecurringTaskPriority;
  status: RecurringTaskStatus;
  createdAt: string;
  updatedAt: string;
}
