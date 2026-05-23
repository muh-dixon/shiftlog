export type ManagerFlagStatus = "open" | "reviewing" | "resolved" | "dismissed";

export type ManagerFlagPriority = "normal" | "high" | "urgent";

export interface ManagerFlag {
  id: string;
  teamId: string;
  shiftLogId: string;
  createdByUserId: string;
  // Optional until a specific manager claims or is assigned the review.
  assignedManagerUserId?: string;
  reason: string;
  priority: ManagerFlagPriority;
  status: ManagerFlagStatus;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}
