"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Cpu, FileDown, History, Trash2 } from "lucide-react";
import { MaintenanceReportForm } from "./maintenance-report-form";
import { VersionRow } from "./version-row";
import { deleteMaintenanceReport, deleteReportSnapshot } from "@/lib/portal/maintenance";
import { downloadReportPdf } from "@/lib/portal/report-pdf";
import { STATUS_LABELS, type Machine } from "@/lib/portal/machine-types";
import { TEMPLATES, MODEL_LABELS, type MaintenanceReport, type ReportSnapshot } from "@/lib/portal/maintenance-templates";

export function MachineState({ machine, report, versions, defaultTechnician, isAdmin, startNew = false }: {
  machine: Machine;
  report: MaintenanceReport | null;
  versions: ReportSnapshot[];
  defaultTechnician: string;
  isAdmin: boolean;
  startNew?: boolean;
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

  // Back goes to the previous page. Only when there is none (opened straight from
  // a QR scan) or it was the sign-in flow does it fall back to the Reports list.
  function goBack() {
    let previousIsSignIn = false;
    try {
      const ref = document.referrer ? new URL(document.referrer) : null;
      previousIsSignIn = !!ref && ref.origin === window.location.origin && /^\/(login|auth)(\/|$)/.test(ref.pathname);
    } catch { /* unparsable referrer: treat as normal history */ }
    if (window.history.length > 1 && !previousIsSignIn) window.history.back();
    else window.location.assign("/portal?section=Reports");
  }

  return <div className="machine-card wide">
    <button type="button" className="mr-back" onClick={goBack}><ArrowLeft size={16} /> Back</button>
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
      {startNew
        ? <span className="mr-meta-text"><small>New report</small><span>The current one stays in Saved versions.</span></span>
        : report?.updatedAt
          ? <span className="mr-meta-text"><small>Last edited</small><span>{report.updatedAt.slice(0, 16).replace("T", " ")}{report.technicianName ? ` · ${report.technicianName}` : ""}</span></span>
          : <span className="mr-meta-text"><small>New report</small><span>Not saved yet.</span></span>}
      {!startNew && <span className="mr-foot-actions">
        {template && <button type="button" className="mr-pdf" onClick={() => downloadReportPdf(machine, report)}><FileDown size={13} /> PDF</button>}
        {isAdmin && report && <button type="button" className="icon-btn danger" onClick={removeReport} disabled={pending} aria-label="Delete report"><Trash2 size={15} /></button>}
      </span>}
    </div>

    {!template
      ? <p className="machine-notice">This machine has no report template yet. Ask an administrator to set its model in the portal.</p>
      : <MaintenanceReportForm key={startNew ? "new" : "current"} machine={machine} template={template} defaultTechnician={defaultTechnician} initial={startNew ? null : report} isNew={startNew} />}

    {template && <div className="mr-history">
      <div className="mr-history-head"><History size={17} /> <strong>Saved versions</strong><span>{versions.length}</span></div>
      {versions.length === 0 ? <p className="mr-history-empty">No saved versions yet. Each time the report is saved, a copy is archived here.</p>
        : versions.map(version => <VersionRow key={version.id} version={version} machine={machine} isAdmin={isAdmin} pending={pending} onDelete={() => removeVersion(version.id)} />)}
    </div>}

    <a className="text-link machine-back" href="/portal">Back to portal</a>
  </div>;
}
