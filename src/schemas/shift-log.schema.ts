import { z } from "zod";
import type {
  CustomerIncident,
  EquipmentIssue,
  ManagerAttentionItem,
  ShiftLog,
  ShiftTaskEntry,
} from "@/types";

const isoDateTimeSchema = z.string().datetime();
const idSchema = z.string().min(1);

export const shiftLogStatusSchema = z.enum(["draft", "submitted", "reviewed"]);

export const taskCompletionStateSchema = z.enum(["completed", "outstanding"]);

export const equipmentIssueSeveritySchema = z.enum(["low", "medium", "high"]);

export const customerIncidentSeveritySchema = z.enum(["low", "medium", "high"]);

export const managerAttentionStateSchema = z.enum([
  "none",
  "requested",
  "flagged",
  "resolved",
]);

export const shiftTaskEntrySchema: z.ZodType<ShiftTaskEntry> = z.object({
  id: idSchema,
  title: z.string().min(1),
  state: taskCompletionStateSchema,
  recurringTaskId: idSchema.optional(),
  notes: z.string().min(1).optional(),
});

export const equipmentIssueSchema: z.ZodType<EquipmentIssue> = z.object({
  id: idSchema,
  description: z.string().min(1),
  severity: equipmentIssueSeveritySchema,
  affectsService: z.boolean(),
});

export const customerIncidentSchema: z.ZodType<CustomerIncident> = z.object({
  id: idSchema,
  summary: z.string().min(1),
  severity: customerIncidentSeveritySchema,
  followUpRequired: z.boolean(),
});

export const managerAttentionItemSchema: z.ZodType<ManagerAttentionItem> =
  z.object({
    id: idSchema,
    summary: z.string().min(1),
  });

export const shiftLogSchema: z.ZodType<ShiftLog> = z.object({
  id: idSchema,
  teamId: idSchema,
  shiftId: idSchema,
  userId: idSchema,
  status: shiftLogStatusSchema,
  completedTasks: z.array(shiftTaskEntrySchema),
  outstandingTasks: z.array(shiftTaskEntrySchema),
  equipmentIssues: z.array(equipmentIssueSchema),
  customerIncidents: z.array(customerIncidentSchema),
  notes: z.string().min(1).optional(),
  managerAttentionItems: z.array(managerAttentionItemSchema),
  managerAttentionState: managerAttentionStateSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
