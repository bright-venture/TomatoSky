// Shared types for the Machines module. Kept out of the "use server" actions file.
export const MACHINE_STATUSES = ["running", "idle", "maintenance", "down"] as const;
export type MachineStatus = (typeof MACHINE_STATUSES)[number];
export type Machine = {
  id: string;
  name: string;
  location: string | null;
  status: MachineStatus;
  notes: string | null;
  updatedAt: string;
};
export type MachineResult = { ok: boolean; error?: string };

export const STATUS_LABELS: Record<MachineStatus, string> = {
  running: "Running",
  idle: "Idle",
  maintenance: "Maintenance",
  down: "Down",
};
