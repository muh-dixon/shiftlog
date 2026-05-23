export type ShiftType = "morning" | "afternoon" | "closing";

export type ShiftStatus = "scheduled" | "active" | "completed" | "cancelled";

export interface Shift {
  id: string;
  teamId: string;
  // Identifies the person responsible for closing or handing over the shift.
  leadUserId?: string;
  type: ShiftType;
  serviceDate: string;
  startsAt: string;
  endsAt?: string;
  status: ShiftStatus;
  createdAt: string;
  updatedAt: string;
}
