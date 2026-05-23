export type UserRole = "staff" | "lead" | "manager";

export type UserStatus = "active" | "inactive";

export interface User {
  id: string;
  // Keeps each MVP user scoped to the team whose shifts and logs they can work with.
  teamId: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}
