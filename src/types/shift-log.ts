export type ShiftLogStatus = "draft" | "submitted" | "reviewed";

export type TaskCompletionState = "completed" | "outstanding";

export type EquipmentIssueSeverity = "low" | "medium" | "high";

export type CustomerIncidentSeverity = "low" | "medium" | "high";

export type ManagerAttentionState = "none" | "requested" | "flagged" | "resolved";

export interface ShiftTaskEntry {
  id: string;
  title: string;
  state: TaskCompletionState;
  // Connects checklist items back to a recurring task when the item came from one.
  recurringTaskId?: string;
  notes?: string;
}

export interface EquipmentIssue {
  id: string;
  description: string;
  severity: EquipmentIssueSeverity;
  // Helps the next shift understand whether work can continue safely.
  affectsService: boolean;
}

export interface CustomerIncident {
  id: string;
  summary: string;
  severity: CustomerIncidentSeverity;
  // Stores whether the incident still needs follow-up after handover.
  followUpRequired: boolean;
}

export interface ManagerAttentionItem {
  id: string;
  summary: string;
}

export interface ShiftLog {
  id: string;
  teamId: string;
  shiftId: string;
  userId: string;
  status: ShiftLogStatus;
  completedTasks: ShiftTaskEntry[];
  outstandingTasks: ShiftTaskEntry[];
  equipmentIssues: EquipmentIssue[];
  customerIncidents: CustomerIncident[];
  notes?: string;
  managerAttentionItems: ManagerAttentionItem[];
  // Mirrors the product need to surface manager-review items without auth or workflow code yet.
  managerAttentionState: ManagerAttentionState;
  createdAt: string;
  updatedAt: string;
}
