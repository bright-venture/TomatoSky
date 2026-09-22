import type { Metadata } from "next";
import { requireEmployee } from "@/lib/auth/employee";
import { getMachine, getMachineReport, getSnapshot } from "@/lib/portal/machine-data";
import { ReportPrint } from "@/components/report-print";

export const metadata: Metadata = { title: "Maintenance report", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PrintPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string }> }) {
  const { id } = await params;
  const { v } = await searchParams;
  const { supabase } = await requireEmployee();
  const machine = /^[0-9a-f-]{36}$/i.test(id) ? await getMachine(supabase, id) : null;

  if (!machine) return <main className="machine-page"><div className="machine-card missing"><h1>Machine not found</h1><a className="text-link" href="/portal">Go to the portal</a></div></main>;

  // A specific saved version if requested, otherwise the machine's current report.
  const data = v && /^[0-9a-f-]{36}$/i.test(v) ? await getSnapshot(supabase, v) : await getMachineReport(supabase, machine.id);
  return <ReportPrint machine={{ name: machine.name, model: machine.model, assetTag: machine.assetTag, location: machine.location }} data={data} />;
}
