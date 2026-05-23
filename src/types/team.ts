export type TeamStatus = "active" | "archived";

export interface Team {
  id: string;
  name: string;
  // Optional label for a site, department, or service area.
  location?: string;
  status: TeamStatus;
  createdAt: string;
  updatedAt: string;
}
