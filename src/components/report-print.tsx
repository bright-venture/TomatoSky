"use client";

import { Fragment, useEffect } from "react";
import {
  TEMPLATES, MODEL_LABELS, MAINTENANCE_TYPES, MAINTENANCE_TYPE_LABELS,
  REPORT_STATUSES, REPORT_STATUS_LABELS, type MachineModel,
} from "@/lib/portal/maintenance-templates";

type PrintData = {
  reportDate: string | null;
  maintenanceType: string | null;
  operatingHours: string | null;
  siteLocation: string | null;
  machineStatus: string | null;
  problemFound: string | null;
  workPerformed: string | null;
  partsReplaced: string | null;
  partsRequired: string | null;
  nextMaintenance: string | null;
  technicianName: string | null;
  checklist: Record<string, { state?: string; note?: string }>;
  functionTest: Record<string, boolean>;
} | null;

const Box = ({ on, label }: { on: boolean; label?: string }) =>
  <span className="rp-check"><span className={`rp-box${on ? " on" : ""}`} />{label ? <span>{label}</span> : null}</span>;

export function ReportPrint({ machine, data }: {
  machine: { name: string; model: MachineModel | null; assetTag: string | null; location: string | null };
  data: PrintData;
}) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);

  const template = machine.model ? TEMPLATES[machine.model] : null;
  const d = data ?? { reportDate: null, maintenanceType: null, operatingHours: null, siteLocation: null, machineStatus: null, problemFound: null, workPerformed: null, partsReplaced: null, partsRequired: null, nextMaintenance: null, technicianName: null, checklist: {}, functionTest: {} };

  if (!template) return <div className="rp"><p>This machine has no report template.</p></div>;

  const groups: { group: string; items: typeof template.checklist }[] = [];
  for (const item of template.checklist) {
    const last = groups[groups.length - 1];
    if (last && last.group === item.group) last.items.push(item);
    else groups.push({ group: item.group, items: [item] });
  }

  return <div className="rp">
    <button type="button" className="rp-print no-print" onClick={() => window.print()}>Download / Print PDF</button>

    <h1 className="rp-title">BRIGHT SERVICE - {MODEL_LABELS[machine.model!].toUpperCase()}<br />MAINTENANCE REPORT</h1>

    <table className="rp-head">
      <tbody>
        <tr><th>Machine / Model</th><td>{MODEL_LABELS[machine.model!]}</td><th>Machine ID</th><td>{machine.assetTag ?? ""}</td></tr>
        <tr><th>Date</th><td>{d.reportDate ?? ""}</td><th>Technician</th><td>{d.technicianName ?? ""}</td></tr>
        <tr>
          <th>Maintenance Type</th>
          <td className="rp-inline">{MAINTENANCE_TYPES.map(t => <Box key={t} on={d.maintenanceType === t} label={MAINTENANCE_TYPE_LABELS[t]} />)}</td>
          <th>Operating Hours</th><td>{d.operatingHours ?? ""}</td>
        </tr>
        <tr><th>Site / Location</th><td colSpan={3}>{d.siteLocation ?? ""}</td></tr>
      </tbody>
    </table>

    <h2 className="rp-section">Maintenance Checklist</h2>
    <table className="rp-list">
      <thead><tr><th className="rp-part">Component / Part</th><th>OK</th><th>Repaired</th><th>Changed</th><th className="rp-notes">Notes</th></tr></thead>
      <tbody>
        {groups.map(({ group, items }) => <Fragment key={group}>
          <tr className="rp-group"><td colSpan={5}>{group}</td></tr>
          {items.map(item => {
            const e = d.checklist[item.key] ?? {};
            return <tr key={item.key}>
              <td>{item.label}</td>
              <td className="rp-c"><span className={`rp-box${e.state === "ok" ? " on" : ""}`} /></td>
              <td className="rp-c"><span className={`rp-box${e.state === "repaired" ? " on" : ""}`} /></td>
              <td className="rp-c"><span className={`rp-box${e.state === "changed" ? " on" : ""}`} /></td>
              <td className="rp-note">{e.note ?? ""}</td>
            </tr>;
          })}
        </Fragment>)}
      </tbody>
    </table>

    <h2 className="rp-section">Final Function Test</h2>
    <div className="rp-tests">{template.functionTests.map(t => <Box key={t.key} on={!!d.functionTest[t.key]} label={t.label} />)}</div>

    <table className="rp-foot">
      <tbody>
        <tr><th>Problem / Fault Found</th><td>{d.problemFound ?? ""}</td></tr>
        <tr><th>Work Performed</th><td>{d.workPerformed ?? ""}</td></tr>
        <tr><th>Parts Replaced</th><td>{d.partsReplaced ?? ""}</td></tr>
        <tr><th>Parts Still Required</th><td>{d.partsRequired ?? ""}</td></tr>
        <tr>
          <th>Machine Status</th>
          <td className="rp-inline">{REPORT_STATUSES.map(s => <Box key={s} on={d.machineStatus === s} label={REPORT_STATUS_LABELS[s]} />)}</td>
        </tr>
        <tr><th>Next Maintenance</th><td>{d.nextMaintenance ?? ""}</td></tr>
      </tbody>
    </table>

    <style>{`
      .rp{max-width:800px;margin:0 auto;padding:28px;color:#111;background:#fff;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.4}
      .rp-title{text-align:center;font-size:18px;font-weight:800;margin:0 0 16px;letter-spacing:.3px}
      .rp-section{font-size:13px;font-weight:700;margin:16px 0 6px;border-bottom:1px solid #111;padding-bottom:3px}
      .rp table{width:100%;border-collapse:collapse}
      .rp-head th,.rp-head td{border:1px solid #111;padding:5px 7px;text-align:left;vertical-align:top}
      .rp-head th{background:#eef1f5;width:15%;font-size:11px}
      .rp-list th,.rp-list td{border:1px solid #111;padding:4px 7px;font-size:11px}
      .rp-list thead th{background:#eef1f5;text-align:center}
      .rp-list th.rp-part{text-align:left;width:38%}
      .rp-list th.rp-notes{width:26%}
      .rp-list td.rp-c{text-align:center;width:11%}
      .rp-group td{background:#dfe4ea;font-weight:700;text-transform:uppercase;font-size:10px;letter-spacing:.5px}
      .rp-box{display:inline-block;width:12px;height:12px;border:1.5px solid #111;border-radius:2px;vertical-align:middle;position:relative}
      .rp-box.on::after{content:"";position:absolute;inset:1px;background:#111;border-radius:1px}
      .rp-check{display:inline-flex;align-items:center;gap:5px;margin-right:14px;white-space:nowrap}
      .rp-inline{display:flex;flex-wrap:wrap;gap:4px}
      .rp-tests{display:flex;flex-wrap:wrap;gap:6px 14px;border:1px solid #111;padding:10px}
      .rp-foot th,.rp-foot td{border:1px solid #111;padding:8px 7px;text-align:left;vertical-align:top}
      .rp-foot th{background:#eef1f5;width:22%;font-size:11px}
      .rp-note{white-space:pre-wrap}
      .rp-print{display:inline-block;margin-bottom:16px;background:#153c2e;color:#fff;border:0;border-radius:5px;padding:10px 18px;font-size:13px;cursor:pointer}
      @media print{.no-print{display:none!important}.rp{padding:0;max-width:none}@page{margin:12mm}}
    `}</style>
  </div>;
}
