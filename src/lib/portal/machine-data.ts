import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Machine, MachineStatus } from "./machine-types";

function toMachine(row: Record<string, unknown>): Machine {
  return {
    id: row.id as string,
    name: row.name as string,
    location: (row.location as string | null) ?? null,
    status: row.status as MachineStatus,
    notes: (row.notes as string | null) ?? null,
    updatedAt: row.updated_at as string,
  };
}

// All machines, scoped by the caller's RLS. Non-fatal: empty if not migrated yet.
export async function getMachines(supabase: SupabaseClient): Promise<Machine[]> {
  const { data } = await supabase.from("machines").select("id, name, location, status, notes, updated_at").order("name");
  return (data ?? []).map(toMachine);
}

// A single machine for the scanned state page. Null if missing or not permitted.
export async function getMachine(supabase: SupabaseClient, id: string): Promise<Machine | null> {
  const { data } = await supabase.from("machines").select("id, name, location, status, notes, updated_at").eq("id", id).maybeSingle();
  return data ? toMachine(data) : null;
}
