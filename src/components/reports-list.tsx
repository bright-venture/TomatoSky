"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ClipboardList, History } from "lucide-react";
import { VersionRow } from "./version-row";
import { deleteReportSnapshot } from "@/lib/portal/maintenance";
import type { Machine } from "@/lib/portal/machine-types";
import { MODEL_LABELS, REPORT_STATUS_LABELS, type MaintenanceReport, type ReportSnapshot } from "@/lib/portal/maintenance-templates";

// One report per machine. The Reports section lists every machine with its report;
// each row can expand to show that machine's saved versions, without opening the form.
export function ReportsList({ machines, reports, snapshots, brandId, isAdmin }: {
  machines: Machine[];
  reports: MaintenanceReport[];
  snapshots: ReportSnapshot[];
  brandId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [openId, setOpenId] = useState<string | null>(null);
  const [sort, setSort] = useState("name-asc");

  const byMachine = useMemo(() => new Map(reports.map(r => [r.machineId, r])), [reports]);
  const versionsByMachine = useMemo(() => {
    const map = new Map<string, ReportSnapshot[]>();
    for (const s of snapshots) { const list = map.get(s.machineId) ?? []; list.push(s); map.set(s.machineId, list); }
    return map;
  }, [snapshots]);

  // Natural, case-insensitive name compare so "Machine 2" sorts before "Machine 10".
  const byName = (a: Machine, b: Machine) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
  const STATUS_RANK: Record<string, number> = { out_of_service: 0, needs_maintenance: 1, waiting_parts: 2, operational: 3 };

  const visible = useMemo(() => {
    const arr = machines.filter(m => !brandId || m.brandId === brandId);
    if (sort === "name-desc") arr.sort((a, b) => byName(b, a));
    else if (sort === "edited") arr.sort((a, b) => (byMachine.get(b.id)?.updatedAt ?? "").localeCompare(byMachine.get(a.id)?.updatedAt ?? "") || byName(a, b));
    else if (sort === "status") arr.sort((a, b) => (STATUS_RANK[byMachine.get(a.id)?.machineStatus ?? ""] ?? 9) - (STATUS_RANK[byMachine.get(b.id)?.machineStatus ?? ""] ?? 9) || byName(a, b));
    else arr.sort(byName);
    return arr;
  }, [machines, brandId, sort, byMachine]);

  function removeVersion(id: string) {
    if (!window.confirm("Are you sure you want to delete this saved version? This cannot be undone.")) return;
    startTransition(async () => { await deleteReportSnapshot({ id }); router.refresh(); });
  }

  return <section className="portal-panel">
    <div className="panel-heading">
      <div><h2>Maintenance reports</h2><p>{visible.length} {visible.length === 1 ? "machine" : "machines"}{brandId ? " in this brand" : ""}. Open a report to edit, or expand its saved versions.</p></div>
      <div className="list-sort"><label htmlFor="rep-sort">Sort</label><select id="rep-sort" value={sort} onChange={e => setSort(e.target.value)}>
        <option value="name-asc">Name (A-Z)</option>
        <option value="name-desc">Name (Z-A)</option>
        <option value="edited">Recently edited</option>
        <option value="status">Status</option>
      </select></div>
    </div>
    <ul className="inv-list">
      {visible.length === 0 && <li className="inv-empty">No machines yet. Add a machine in Inventory → Machines to create its report.</li>}
      {visible.map(machine => {
        const report = byMachine.get(machine.id);
        const versions = versionsByMachine.get(machine.id) ?? [];
        const open = openId === machine.id;
        return <li key={machine.id} className="report-item">
          <div className="inv-row">
            <span className="inv-icon"><ClipboardList size={19} /></span>
            <div className="inv-identity">
              <strong>{machine.name}</strong>
              <span>{machine.model ? MODEL_LABELS[machine.model] : "No model"}{machine.assetTag ? ` · ID ${machine.assetTag}` : ""}</span>
            </div>
            {report?.machineStatus
              ? <span className={`report-tag ${report.machineStatus}`}>{REPORT_STATUS_LABELS[report.machineStatus]}</span>
              : <span className="report-tag none">Not started</span>}
            <div className="inv-actions">
              <button type="button" className="inv-move-btn" onClick={() => setOpenId(open ? null : machine.id)} aria-expanded={open}><History size={15} /> Versions ({versions.length})</button>
              <a className="inv-move-btn" href={`/m/${machine.id}`}>Open report <ArrowUpRight size={15} /></a>
            </div>
          </div>
          {open && <div className="report-versions">
            {versions.length === 0 ? <p className="mr-history-empty">No saved versions yet. A copy is archived each time the report is saved.</p>
              : versions.map(version => <VersionRow key={version.id} version={version} isAdmin={isAdmin} pending={pending} onDelete={() => removeVersion(version.id)} />)}
          </div>}
        </li>;
      })}
    </ul>
  </section>;
}
