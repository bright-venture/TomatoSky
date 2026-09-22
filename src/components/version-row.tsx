"use client";

import { FileDown, Trash2 } from "lucide-react";
import {
  TEMPLATES, MAINTENANCE_TYPE_LABELS, REPORT_STATUS_LABELS, CHECK_STATE_LABELS,
  type ReportSnapshot, type CheckState,
} from "@/lib/portal/maintenance-templates";

// A read-only, expandable saved version (snapshot). Shown on the machine report
// page and in the portal Reports section. Optional admin delete.
export function VersionRow({ version, isAdmin, pending, onDelete }: {
  version: ReportSnapshot;
  isAdmin: boolean;
  pending: boolean;
  onDelete: () => void;
}) {
  const template = TEMPLATES[version.model];
  const labels = new Map(template.checklist.map(i => [i.key, i.label]));
  const testLabels = new Map(template.functionTests.map(t => [t.key, t.label]));
  const flagged = Object.entries(version.checklist).filter(([, e]) => e.state || e.note);
  const passed = template.functionTests.filter(t => version.functionTest[t.key]);

  return <details className="mr-report">
    <summary>
      <span className="mr-report-date">{version.savedAt.slice(0, 16).replace("T", " ")}</span>
      <span className="mr-report-meta">
        {version.maintenanceType && <em>{MAINTENANCE_TYPE_LABELS[version.maintenanceType]}</em>}
        {version.machineStatus && <em className="mr-status-tag">{REPORT_STATUS_LABELS[version.machineStatus]}</em>}
        <span>{version.technicianName ?? "-"}</span>
      </span>
    </summary>
    <div className="mr-report-body">
      {flagged.length > 0 && <div className="mr-report-block">
        <h4>Checklist</h4>
        <ul className="v-items">{flagged.map(([key, e]) => <li key={key} className="v-item">
          <div className="v-item-head">
            <span className="v-item-label">{labels.get(key) ?? key}</span>
            {e.state && <span className={`mr-state-tag ${e.state}`}>{CHECK_STATE_LABELS[e.state as CheckState]}</span>}
          </div>
          {e.note && <p className="v-item-note">{e.note}</p>}
        </li>)}</ul>
      </div>}
      {passed.length > 0 && <div className="mr-report-block"><h4>Function test</h4><p>{passed.map(t => testLabels.get(t.key)).join(" · ")}</p></div>}
      {version.problemFound && <div className="mr-report-block"><h4>Problem / fault found</h4><p>{version.problemFound}</p></div>}
      {version.workPerformed && <div className="mr-report-block"><h4>Work performed</h4><p>{version.workPerformed}</p></div>}
      {version.partsReplaced && <div className="mr-report-block"><h4>Parts replaced</h4><p>{version.partsReplaced}</p></div>}
      {version.partsRequired && <div className="mr-report-block"><h4>Parts still required</h4><p>{version.partsRequired}</p></div>}
      <div className="mr-report-foot">
        {version.operatingHours && <span>Hours: {version.operatingHours}</span>}
        {version.siteLocation && <span>Site: {version.siteLocation}</span>}
        {version.nextMaintenance && <span>Next: {version.nextMaintenance}</span>}
        <span className="mr-foot-actions">
          <a className="mr-pdf" href={`/m/${version.machineId}/print?v=${version.id}`} target="_blank" rel="noopener"><FileDown size={13} /> PDF</a>
          {isAdmin && <button type="button" className="icon-btn danger" onClick={onDelete} disabled={pending} aria-label="Delete version"><Trash2 size={14} /></button>}
        </span>
      </div>
    </div>
  </details>;
}
