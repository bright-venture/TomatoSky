"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Cpu, FileDown, History, Trash2 } from "lucide-react";
import { MaintenanceReportForm } from "./maintenance-report-form";
import { VersionRow } from "./version-row";
import { deleteMaintenanceReport, deleteReportSnapshot } from "@/lib/portal/maintenance";
import { STATUS_LABELS, type Machine } from "@/lib/portal/machine-types";
import { TEMPLATES, MODEL_LABELS, type MaintenanceReport, type ReportSnapshot } from "@/lib/portal/maintenance-templates";

export function MachineState({ machine, report, versions, defaultTechnician, isAdmin }: {
  machine: Machine;
  report: MaintenanceReport | null;
  versions: ReportSnapshot[];
  defaultTechnician: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const template = machine.model ? TEMPLATES[machine.model] : null;

  function removeReport() {
    if (!report || !window.confirm("Are you sure you want to delete this machine's report? It will be reset to blank. This cannot be undone.")) return;
    startTransition(async () => {
      await deleteMaintenanceReport({ id: report.id });
      router.refresh();
    });
  }

  function removeVersion(id: string) {
    if (!window.confirm("Are you sure you want to delete this saved version? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteReportSnapshot({ id });
      router.refresh();
    });
  }

  return <div className="machine-card wide">
    <span className="machine-icon"><Cpu size={26} /></span>
    <p className="eyebrow">MACHINE REPORT</p>
    <h1>{machine.name}</h1>
    <p className="machine-loc">
      {machine.model ? MODEL_LABELS[machine.model] : "No model set"}
      {machine.assetTag ? ` · ID ${machine.assetTag}` : ""}
      {machine.location ? ` · ${machine.location}` : ""}
    </p>
    <span className={`status-badge big ${machine.status}`}>{STATUS_LABELS[machine.status]}</span>

    <div className="mr-meta-line">
      {report?.updatedAt
        ? <span>Last edited {report.updatedAt.slice(0, 16).replace("T", " ")}{report.technicianName ? ` · ${report.technicianName}` : ""}</span>
        : <span>New report - not saved yet.</span>}
      <span className="mr-foot-actions">
        {template && <a className="mr-pdf" href={`/m/${machine.id}/print`} target="_blank" rel="noopener"><FileDown size={13} /> PDF</a>}
        {isAdmin && report && <button type="button" className="icon-btn danger" onClick={removeReport} disabled={pending} aria-label="Delete report"><Trash2 size={15} /></button>}
      </span>
    </div>

    {!template
      ? <p className="machine-notice">This machine has no report template yet. Ask an administrator to set its model in the portal.</p>
      : <MaintenanceReportForm machine={machine} template={template} defaultTechnician={defaultTechnician} initial={report} />}

    {template && <div className="mr-history">
      <div className="mr-history-head"><History size={17} /> <strong>Saved versions</strong><span>{versions.length}</span></div>
      {versions.length === 0 ? <p className="mr-history-empty">No saved versions yet. Each time the report is saved, a copy is archived here.</p>
        : versions.map(version => <VersionRow key={version.id} version={version} isAdmin={isAdmin} pending={pending} onDelete={() => removeVersion(version.id)} />)}
    </div>}

    <a className="text-link machine-back" href="/portal">Back to portal</a>
  </div>;
}
