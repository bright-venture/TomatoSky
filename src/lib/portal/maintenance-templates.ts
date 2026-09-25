// The two maintenance-report templates the company uses, transcribed from the
// printed Bright Service forms. Each machine's `model` selects one template.
// Client-safe (no server-only code) so both the form and the actions can import it.

export const MACHINE_MODELS = ["scrubmaster_b75r", "walk_behind_scrubber"] as const;
export type MachineModel = (typeof MACHINE_MODELS)[number];

export const MODEL_LABELS: Record<MachineModel, string> = {
  scrubmaster_b75r: "Hako Scrubmaster B75R",
  walk_behind_scrubber: "Hako Walk-Behind Scrubber Drier",
};

export const MAINTENANCE_TYPES = ["preventive", "repair", "breakdown"] as const;
export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];
export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  preventive: "Preventive", repair: "Repair", breakdown: "Breakdown",
};

export const REPORT_STATUSES = ["operational", "needs_maintenance", "waiting_parts", "out_of_service"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  operational: "Operational", needs_maintenance: "Needs maintenance", waiting_parts: "Waiting parts", out_of_service: "Out of service",
};

// A single checklist row. `state` is one of these (or unset) plus an optional note.
export const CHECK_STATES = ["ok", "repaired", "changed"] as const;
export type CheckState = (typeof CHECK_STATES)[number];
export const CHECK_STATE_LABELS: Record<CheckState, string> = { ok: "OK", repaired: "Repaired", changed: "Changed" };

export type ChecklistItem = { key: string; label: string };
export type FunctionTest = { key: string; label: string };
// `columns` are the mark columns this form uses (B75R has no OK column).
export type Template = { model: MachineModel; columns: readonly CheckState[]; checklist: ChecklistItem[]; functionTests: FunctionTest[] };

// Keys are stable position-based ids (c1, f1…). Reports snapshot the model, and the
// templates never renumber, so stored reports always resolve their labels.
function checklist(labels: string[]): ChecklistItem[] {
  return labels.map((label, i) => ({ key: `c${i + 1}`, label }));
}
function tests(labels: string[]): FunctionTest[] {
  return labels.map((label, i) => ({ key: `f${i + 1}`, label }));
}

export const TEMPLATES: Record<MachineModel, Template> = {
  scrubmaster_b75r: {
    model: "scrubmaster_b75r",
    columns: ["repaired", "changed"],
    checklist: checklist([
      "Battery",
      "Charge",
      "Electrical: Fuses / wiring / connectors / Control panel / display / switches",
      "Brush: Left brush",
      "Brush: Right brush",
      "Brush: Pad / pad holder",
      "Brush: Brush head / coupling",
      "Brush: Brush motor",
      "Brush: Brush-head sealing strip",
      "Brush: Deflecting roller",
      "Squeegee: Rear sealing blade",
      "Squeegee: Squeegee wheels / rollers",
      "Squeegee: Cleaning squeegee",
      "Vacuum: Suction hose",
      "Vacuum: Suction filter",
      "Vacuum: Vacuum motor / connections",
      "Fresh water: Fresh-water tank / cap / gasket",
      "Fresh water: Water hoses / valve / flow control",
      "Waste water: Recovery tank / lid / gasket",
      "Waste water: Drain hose / cap / gasket",
      "Machine: Cleanliness of the machine",
      "Drive: Drive motor / traction",
      "Drive: Drive wheels / castors / bearings",
      "Drive: Steering / brake / parking brake",
      "Controls: Accelerator pedal",
      "Safety: Seat / seat safety switch",
      "Body: Frame / protective covers / fasteners",
    ]),
    functionTests: tests(["Power ON", "Charges", "Forward / reverse", "Brakes", "Brushes", "Brush head lift", "Water flow", "Vacuum", "Squeegee", "No leaks", "No warnings", "Safe to operate"]),
  },
  walk_behind_scrubber: {
    model: "walk_behind_scrubber",
    columns: ["repaired", "changed"],
    checklist: checklist([
      "Brush: Scrubbing brush / pad",
      "Brush: Pad / brush holder",
      "Brush: Brush motor & head",
      "Brush: Brush skirt / splash guard",
      "Squeegee: Rear blade",
      "Squeegee: Squeegee wheels / rollers",
      "Vacuum: Suction hose",
      "Vacuum: Vacuum motor / suction filter",
      "Water: Fresh-water filter",
      "Water: Fresh-water tank / cap / seals",
      "Water: Recovery tank / lid / gasket",
      "Water: Drain hose / cap / gasket",
      "Water: Water hoses / valve / pump",
      "Water: Detergent system",
      "Battery",
      "Charger",
      "Electrical: Fuses / wiring / connectors",
      "Electrical: Control panel / switches",
      "Safety: Emergency stop / safety controls",
      "Drive: Drive motor / traction",
      "Drive: Main wheels / castors",
      "Drive: Wheel bearings",
      "Body: Frame / covers / fasteners",
    ]),
    functionTests: tests(["Power ON", "Brushes rotate", "Water flow", "Vacuum works", "Squeegee works", "Moves correctly", "No leaks", "No abnormal noise", "Safe to operate"]),
  },
};

// Shape of a stored report (camelCase). checklist maps item key -> entry.
// A row may carry a state, a note, or both (the paper's Notes column can be used alone).
export type ChecklistEntry = { state?: CheckState; note?: string };
export type MaintenanceReport = {
  id: string;
  machineId: string;
  model: MachineModel;
  reportDate: string;
  maintenanceType: MaintenanceType | null;
  operatingHours: string | null;
  siteLocation: string | null;
  machineStatus: ReportStatus | null;
  problemFound: string | null;
  workPerformed: string | null;
  partsReplaced: string | null;
  partsRequired: string | null;
  nextMaintenance: string | null;
  technicianName: string | null;
  checklist: Record<string, ChecklistEntry>;
  functionTest: Record<string, boolean>;
  createdAt: string;
  updatedAt: string | null;
};

// An archived, immutable snapshot of a report at one save.
export type ReportSnapshot = {
  id: string;
  machineId: string;
  model: MachineModel;
  reportDate: string | null;
  maintenanceType: MaintenanceType | null;
  operatingHours: string | null;
  siteLocation: string | null;
  machineStatus: ReportStatus | null;
  problemFound: string | null;
  workPerformed: string | null;
  partsReplaced: string | null;
  partsRequired: string | null;
  nextMaintenance: string | null;
  technicianName: string | null;
  checklist: Record<string, ChecklistEntry>;
  functionTest: Record<string, boolean>;
  savedAt: string;
};

export type ReportInput = {
  machineId: string;
  reportDate: string;
  maintenanceType: string | null;
  operatingHours: string | null;
  siteLocation: string | null;
  machineStatus: string | null;
  problemFound: string | null;
  workPerformed: string | null;
  partsReplaced: string | null;
  partsRequired: string | null;
  nextMaintenance: string | null;
  technicianName: string | null;
  checklist: Record<string, { state?: string; note?: string }>;
  functionTest: Record<string, boolean>;
};

export type ReportResult = { ok: boolean; error?: string };
