"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Cpu, ClipboardList, Plus, Trash2 } from "lucide-react";
import { MaintenanceReportForm } from "./maintenance-report-form";
import { deleteMaintenanceReport } from "@/lib/portal/maintenance";
import { STATUS_LABELS, type Machine } from "@/lib/portal/machine-types";
import {
  TEMPLATES, MODEL_LABELS, MAINTENANCE_TYPE_LABELS, REPORT_STATUS_LABELS, CHECK_STATE_LABELS,
  type MaintenanceReport, type CheckState,
} from "@/lib/portal/maintenance-templates";

export function MachineState({ machine, reports, defaultTechnician, isAdmin }: {
  machine: Machine;
  reports: MaintenanceReport[];
  defaultTechnician: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const template = machine.model ? TEMPLATES[machine.model] : null;

  function removeReport(id: string) {
    if (!window.confirm("Are you sure you want to delete this maintenance report? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteMaintenanceReport({ id });
      router.refresh();
    });
  }

  return <div className="machine-card wide">
    <span className="machine-icon"><Cpu size={26} /></span>
    <p className="eyebrow">MACHINE</p>
    <h1>{machine.name}</h1>
    <p className="machine-loc">
      {machine.model ? MODEL_LABELS[machine.model] : "No model set"}
      {machine.assetTag ? ` · ID ${machine.assetTag}` : ""}
      {machine.location ? ` · ${machine.location}` : ""}
    </p>
    <span className={`status-badge big ${machine.status}`}>{STATUS_LABELS[machine.status]}</span>

    {!template ? <p className="machine-notice">This machine has no report template yet. Ask an administrator to set its model in the portal.</p>
      : open ? <MaintenanceReportForm machine={machine} template={template} defaultTechnician={defaultTechnician} onDone={() => setOpen(false)} />
      : <button className="button button-dark machine-save" onClick={() => setOpen(true)}><Plus size={17} /> New maintenance report</button>}

    <div className="mr-history">
      <div className="mr-history-head"><ClipboardList size={17} /> <strong>Maintenance history</strong><span>{reports.length}</span></div>
      {reports.length === 0 ? <p className="mr-history-empty">No reports yet. The first report will appear here after it is submitted.</p>
        : reports.map(report => <ReportRow key={report.id} report={report} isAdmin={isAdmin} pending={pending} onDelete={() => removeReport(report.id)} />)}
    </div>

    <a className="text-link machine-back" href="/portal">Back to portal</a>
  </div>;
}

function ReportRow({ report, isAdmin, pending, onDelete }: { report: MaintenanceReport; isAdmin: boolean; pending: boolean; onDelete: () => void }) {
  const template = TEMPLATES[report.model];
  const labels = new Map(template.checklist.map(i => [i.key, i.label]));
  const testLabels = new Map(template.functionTests.map(t => [t.key, t.label]));
  const flagged = Object.entries(report.checklist).filter(([, e]) => e.state || e.note);
  const passed = template.functionTests.filter(t => report.functionTest[t.key]);

  return <details className="mr-report">
    <summary>
      <span className="mr-report-date">{report.reportDate}</span>
      <span className="mr-report-meta">
        {report.maintenanceType && <em>{MAINTENANCE_TYPE_LABELS[report.maintenanceType]}</em>}
        {report.machineStatus && <em className="mr-status-tag">{REPORT_STATUS_LABELS[report.machineStatus]}</em>}
        <span>{report.technicianName ?? "—"}</span>
      </span>
    </summary>
    <div className="mr-report-body">
      {flagged.length > 0 && <div className="mr-report-block">
        <h4>Checklist</h4>
        <ul>{flagged.map(([key, e]) => <li key={key}><span>{labels.get(key) ?? key}</span>{e.state && <span className={`mr-state-tag ${e.state}`}>{CHECK_STATE_LABELS[e.state as CheckState]}</span>}{e.note && <em>{e.note}</em>}</li>)}</ul>
      </div>}
      {passed.length > 0 && <div className="mr-report-block"><h4>Function test</h4><p>{passed.map(t => testLabels.get(t.key)).join(" · ")}</p></div>}
      {report.problemFound && <div className="mr-report-block"><h4>Problem / fault found</h4><p>{report.problemFound}</p></div>}
      {report.workPerformed && <div className="mr-report-block"><h4>Work performed</h4><p>{report.workPerformed}</p></div>}
      {report.partsReplaced && <div className="mr-report-block"><h4>Parts replaced</h4><p>{report.partsReplaced}</p></div>}
      {report.partsRequired && <div className="mr-report-block"><h4>Parts still required</h4><p>{report.partsRequired}</p></div>}
      <div className="mr-report-foot">
        {report.operatingHours && <span>Hours: {report.operatingHours}</span>}
        {report.siteLocation && <span>Site: {report.siteLocation}</span>}
        {report.nextMaintenance && <span>Next: {report.nextMaintenance}</span>}
        {isAdmin && <button type="button" className="icon-btn danger" onClick={onDelete} disabled={pending} aria-label="Delete report"><Trash2 size={14} /></button>}
      </div>
    </div>
  </details>;
}
