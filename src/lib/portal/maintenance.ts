"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireEmployee } from "@/lib/auth/employee";
import {
  TEMPLATES, MACHINE_MODELS, MAINTENANCE_TYPES, REPORT_STATUSES, CHECK_STATES,
  type MachineModel, type ReportInput, type ReportResult,
} from "./maintenance-templates";

function cleanId(value: unknown): string | null {
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length >= 1 && text.length <= max ? text : null;
}

function cleanDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}

function inList<T extends string>(value: unknown, list: readonly T[]): T | null {
  return typeof value === "string" && (list as readonly string[]).includes(value) ? value as T : null;
}

// Maps the report's machine status to the live badge status shown on the machine.
const LIVE_STATUS: Record<string, "running" | "idle" | "maintenance" | "down"> = {
  operational: "running", needs_maintenance: "maintenance", waiting_parts: "maintenance", out_of_service: "down",
};

// Any approved MFA employee (a technician) can submit a report for a machine.
export async function submitMaintenanceReport(input: ReportInput): Promise<ReportResult> {
  const { supabase, member, claims } = await requireEmployee();
  const machineId = cleanId(input.machineId);
  if (!machineId) return { ok: false, error: "Invalid machine." };

  const { data: machine, error: mErr } = await supabase.from("machines").select("id, model").eq("id", machineId).maybeSingle();
  if (mErr) return { ok: false, error: "Could not load the machine." };
  if (!machine) return { ok: false, error: "That machine no longer exists." };
  const model = inList(machine.model, MACHINE_MODELS) as MachineModel | null;
  if (!model) return { ok: false, error: "This machine has no report template. Ask an admin to set its model." };
  const template = TEMPLATES[model];

  // Validate the checklist against the template: keep only known rows with a state or a note.
  const validKeys = new Set(template.checklist.map(item => item.key));
  const checklist: Record<string, { state?: string; note?: string }> = {};
  for (const [key, entry] of Object.entries(input.checklist ?? {})) {
    if (!validKeys.has(key) || !entry) continue;
    const state = inList(entry.state, CHECK_STATES);
    const note = cleanText(entry.note, 300);
    if (!state && !note) continue;
    checklist[key] = { ...(state ? { state } : {}), ...(note ? { note } : {}) };
  }

  const testKeys = new Set(template.functionTests.map(test => test.key));
  const functionTest: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(input.functionTest ?? {})) {
    if (testKeys.has(key) && value === true) functionTest[key] = true;
  }

  const machineStatus = inList(input.machineStatus, REPORT_STATUSES);
  const { error } = await supabase.from("maintenance_reports").insert({
    machine_id: machineId,
    model,
    report_date: cleanDate(input.reportDate) ?? new Date().toISOString().slice(0, 10),
    maintenance_type: inList(input.maintenanceType, MAINTENANCE_TYPES),
    operating_hours: cleanText(input.operatingHours, 40),
    site_location: cleanText(input.siteLocation, 200),
    machine_status: machineStatus,
    problem_found: cleanText(input.problemFound, 4000),
    work_performed: cleanText(input.workPerformed, 4000),
    parts_replaced: cleanText(input.partsReplaced, 4000),
    parts_required: cleanText(input.partsRequired, 4000),
    next_maintenance: input.nextMaintenance ? cleanDate(input.nextMaintenance) : null,
    technician_name: cleanText(input.technicianName, 160) ?? member.display_name,
    checklist,
    function_test: functionTest,
  });
  if (error) return { ok: false, error: "Could not save the report. Please try again." };

  // Keep the machine's live status in sync with the report's outcome.
  const live = machineStatus ? LIVE_STATUS[machineStatus] : null;
  if (live) await supabase.from("machines").update({ status: live, updated_at: new Date().toISOString(), updated_by: claims.sub }).eq("id", machineId);

  revalidatePath(`/m/${machineId}`);
  revalidatePath("/portal");
  return { ok: true };
}

// Deleting a submitted report is admin-only (reports are otherwise immutable).
export async function deleteMaintenanceReport(input: { id: string }): Promise<ReportResult> {
  const { supabase } = await requireAdmin();
  const id = cleanId(input.id);
  if (!id) return { ok: false, error: "Invalid report." };
  const { error } = await supabase.from("maintenance_reports").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete the report. Please try again." };
  revalidatePath("/portal");
  return { ok: true };
}
