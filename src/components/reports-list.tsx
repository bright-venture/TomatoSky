"use client";

import { useMemo } from "react";
import { ArrowUpRight, ClipboardList } from "lucide-react";
import type { Machine } from "@/lib/portal/machine-types";
import { MODEL_LABELS, REPORT_STATUS_LABELS, type MaintenanceReport } from "@/lib/portal/maintenance-templates";

// One report per machine. The Reports section lists every machine with its report;
// opening a report goes to the machine's report page (the same page the QR opens).
export function ReportsList({ machines, reports, brandId }: { machines: Machine[]; reports: MaintenanceReport[]; brandId: string }) {
  const byMachine = useMemo(() => new Map(reports.map(r => [r.machineId, r])), [reports]);
  const visible = machines.filter(m => !brandId || m.brandId === brandId);

  return <section className="portal-panel">
    <div className="panel-heading"><div><h2>Maintenance reports</h2><p>{visible.length} {visible.length === 1 ? "machine" : "machines"}{brandId ? " in this brand" : ""}. One report per machine. Open it to view or edit.</p></div></div>
    <ul className="inv-list">
      {visible.length === 0 && <li className="inv-empty">No machines yet. Add a machine in Inventory → Machines to create its report.</li>}
      {visible.map(machine => {
        const report = byMachine.get(machine.id);
        return <li key={machine.id} className="inv-row">
          <span className="inv-icon"><ClipboardList size={19} /></span>
          <div className="inv-identity">
            <strong>{machine.name}</strong>
            <span>{machine.model ? MODEL_LABELS[machine.model] : "No model"}{machine.assetTag ? ` · ID ${machine.assetTag}` : ""}</span>
          </div>
          {report?.machineStatus
            ? <span className={`report-tag ${report.machineStatus}`}>{REPORT_STATUS_LABELS[report.machineStatus]}</span>
            : <span className="report-tag none">Not started</span>}
          <div className="inv-actions">
            <span className="report-updated">{report?.updatedAt ? `Edited ${report.updatedAt.slice(0, 10)}` : "-"}</span>
            <a className="inv-move-btn" href={`/m/${machine.id}`}>Open report <ArrowUpRight size={15} /></a>
          </div>
        </li>;
      })}
    </ul>
  </section>;
}
