import type { Metadata } from "next";
import { requireEmployee } from "@/lib/auth/employee";
import { getMachine } from "@/lib/portal/machine-data";
import { MachineState } from "@/components/machine-state";

export const metadata: Metadata = { title: "Machine state", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MachinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Login + MFA are enforced here, so a scanned QR opens only for signed-in employees.
  const { supabase } = await requireEmployee();
  const machine = /^[0-9a-f-]{36}$/i.test(id) ? await getMachine(supabase, id) : null;

  if (!machine) return <main className="machine-page">
    <div className="machine-card missing">
      <h1>Machine not found</h1>
      <p>This machine may have been removed, or the code is invalid.</p>
      <a className="text-link" href="/portal">Go to the portal</a>
    </div>
  </main>;

  return <main className="machine-page"><MachineState machine={machine} /></main>;
}
