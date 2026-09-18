"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveMaintenanceReport } from "@/lib/portal/maintenance";
import {
  CHECK_STATES, CHECK_STATE_LABELS, MAINTENANCE_TYPES, MAINTENANCE_TYPE_LABELS,
  REPORT_STATUSES, REPORT_STATUS_LABELS, type Template, type MaintenanceReport,
} from "@/lib/portal/maintenance-templates";
import type { Machine } from "@/lib/portal/machine-types";

type Entry = { state?: string; note?: string };

export function MaintenanceReportForm({ machine, template, defaultTechnician, initial }: {
  machine: Machine;
  template: Template;
  defaultTechnician: string;
  initial: MaintenanceReport | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [technician, setTechnician] = useState(initial?.technicianName ?? defaultTechnician);
  const [reportDate, setReportDate] = useState(initial?.reportDate ?? new Date().toISOString().slice(0, 10));
  const [maintenanceType, setMaintenanceType] = useState<string>(initial?.maintenanceType ?? "");
  const [operatingHours, setOperatingHours] = useState(initial?.operatingHours ?? "");
  const [siteLocation, setSiteLocation] = useState(initial?.siteLocation ?? machine.location ?? "");
  const [checklist, setChecklist] = useState<Record<string, Entry>>(initial?.checklist ?? {});
  const [functionTest, setFunctionTest] = useState<Record<string, boolean>>(initial?.functionTest ?? {});
  const [problemFound, setProblemFound] = useState(initial?.problemFound ?? "");
  const [workPerformed, setWorkPerformed] = useState(initial?.workPerformed ?? "");
  const [partsReplaced, setPartsReplaced] = useState(initial?.partsReplaced ?? "");
  const [partsRequired, setPartsRequired] = useState(initial?.partsRequired ?? "");
  const [nextMaintenance, setNextMaintenance] = useState(initial?.nextMaintenance ?? "");
  const [machineStatus, setMachineStatus] = useState<string>(initial?.machineStatus ?? "");

  const grouped = useMemo(() => {
    const out: { group: string; items: Template["checklist"] }[] = [];
    for (const item of template.checklist) {
      const last = out[out.length - 1];
      if (last && last.group === item.group) last.items.push(item);
      else out.push({ group: item.group, items: [item] });
    }
    return out;
  }, [template]);

  function setState(key: string, state: string) {
    setSaved(false);
    setChecklist(prev => {
      const cur = prev[key] ?? {};
      return { ...prev, [key]: { ...cur, state: cur.state === state ? undefined : state } };
    });
  }
  function setNote(key: string, note: string) {
    setSaved(false);
    setChecklist(prev => ({ ...prev, [key]: { ...(prev[key] ?? {}), note } }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await saveMaintenanceReport({
        machineId: machine.id,
        reportDate,
        maintenanceType: maintenanceType || null,
        operatingHours: operatingHours || null,
        siteLocation: siteLocation || null,
        machineStatus: machineStatus || null,
        problemFound: problemFound || null,
        workPerformed: workPerformed || null,
        partsReplaced: partsReplaced || null,
        partsRequired: partsRequired || null,
        nextMaintenance: nextMaintenance || null,
        technicianName: technician || null,
        checklist,
        functionTest,
      });
      if (!result.ok) { setError(result.error ?? "Could not save the report."); return; }
      setSaved(true);
      router.refresh();
    });
  }

  return <form className="mr-form" onSubmit={submit}>
    <div className="mr-grid">
      <label className="mr-field"><span>Technician</span><input value={technician} onChange={e => setTechnician(e.target.value)} maxLength={160} disabled={pending} required /></label>
      <label className="mr-field"><span>Date</span><input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} disabled={pending} required /></label>
      <label className="mr-field"><span>Operating hours</span><input value={operatingHours} onChange={e => setOperatingHours(e.target.value)} maxLength={40} placeholder="e.g. 1240" disabled={pending} /></label>
      <label className="mr-field mr-wide"><span>Site / location</span><input value={siteLocation} onChange={e => setSiteLocation(e.target.value)} maxLength={200} disabled={pending} /></label>
    </div>

    <fieldset className="mr-chips" disabled={pending}>
      <legend>Maintenance type</legend>
      {MAINTENANCE_TYPES.map(t => <button type="button" key={t} className={`mr-chip ${maintenanceType === t ? "on" : ""}`} onClick={() => setMaintenanceType(maintenanceType === t ? "" : t)}>{MAINTENANCE_TYPE_LABELS[t]}</button>)}
    </fieldset>

    <div className="mr-section-title">Maintenance checklist</div>
    <div className="mr-check-legend">Tap a mark per part — OK, Repaired, or Changed. Add a note as needed.</div>
    <div className="mr-check">
      {grouped.map(({ group, items }) => <Fragment key={group}>
        <div className="mr-group">{group}</div>
        {items.map(item => {
          const entry = checklist[item.key] ?? {};
          return <div className="mr-row" key={item.key}>
            <span className="mr-label">{item.label}</span>
            <span className="mr-states">
              {CHECK_STATES.map(s => <button type="button" key={s} className={`mr-state ${s} ${entry.state === s ? "on" : ""}`} disabled={pending} onClick={() => setState(item.key, s)} aria-pressed={entry.state === s} aria-label={`${item.label}: ${CHECK_STATE_LABELS[s]}`}>{CHECK_STATE_LABELS[s]}</button>)}
            </span>
            <input className="mr-note" value={entry.note ?? ""} onChange={e => setNote(item.key, e.target.value)} maxLength={300} placeholder="Notes" disabled={pending} aria-label={`${item.label} notes`} />
          </div>;
        })}
      </Fragment>)}
    </div>

    <div className="mr-section-title">Final function test</div>
    <fieldset className="mr-chips wrap" disabled={pending}>
      {template.functionTests.map(t => <button type="button" key={t.key} className={`mr-chip ${functionTest[t.key] ? "on" : ""}`} onClick={() => setFunctionTest(prev => ({ ...prev, [t.key]: !prev[t.key] }))} aria-pressed={!!functionTest[t.key]}>{t.label}</button>)}
    </fieldset>

    <div className="mr-grid">
      <label className="mr-field mr-wide"><span>Problem / fault found</span><textarea value={problemFound} onChange={e => setProblemFound(e.target.value)} maxLength={4000} rows={2} disabled={pending} /></label>
      <label className="mr-field mr-wide"><span>Work performed</span><textarea value={workPerformed} onChange={e => setWorkPerformed(e.target.value)} maxLength={4000} rows={2} disabled={pending} /></label>
      <label className="mr-field mr-wide"><span>Parts replaced</span><textarea value={partsReplaced} onChange={e => setPartsReplaced(e.target.value)} maxLength={4000} rows={2} disabled={pending} /></label>
      <label className="mr-field mr-wide"><span>Parts still required</span><textarea value={partsRequired} onChange={e => setPartsRequired(e.target.value)} maxLength={4000} rows={2} disabled={pending} /></label>
    </div>

    <fieldset className="mr-chips wrap" disabled={pending}>
      <legend>Machine status</legend>
      {REPORT_STATUSES.map(s => <button type="button" key={s} className={`mr-chip ${machineStatus === s ? "on" : ""}`} onClick={() => setMachineStatus(machineStatus === s ? "" : s)}>{REPORT_STATUS_LABELS[s]}</button>)}
    </fieldset>

    <div className="mr-grid">
      <label className="mr-field"><span>Next maintenance</span><input type="date" value={nextMaintenance} onChange={e => setNextMaintenance(e.target.value)} disabled={pending} /></label>
    </div>

    {error && <p className="auth-error" role="alert">{error}</p>}
    <div className="mr-actions">
      {saved && <span className="machine-saved" role="status">Saved.</span>}
      <button type="submit" className="button button-dark" disabled={pending}>{pending ? "Saving…" : "Save report"}</button>
    </div>
  </form>;
}
