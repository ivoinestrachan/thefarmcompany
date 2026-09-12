export type TeamMember = { id: string; name: string; email: string; role: string };

export type Farm = {
  id: string;
  name: string;
  location: string | null;
  center: { lat: number; lng: number };
  team: TeamMember[];
};

export type SessionUser = { id: string; name: string; email: string };

export type Report = {
  id: string;
  farmId: string;
  lat: number;
  lng: number;
  crop: string | null;
  issue: string | null;
  severity: "low" | "medium" | "high" | string;
  note: string | null;
  photo: string | null;
  status: "open" | "assigned" | "resolved" | string;
  createdAt: string;
  createdBy: string | null;
  assignedTo: { id: string; name: string } | null;
};
