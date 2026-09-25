"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, MessageSquarePlus, MessageSquareText } from "lucide-react";
import { saveMaintenanceReport } from "@/lib/portal/maintenance";
import {
  CHECK_STATE_LABELS, MAINTENANCE_TYPES, MAINTENANCE_TYPE_LABELS,
  REPORT_STATUSES, REPORT_STATUS_LABELS, type Template, type MaintenanceReport,
} from "@/lib/portal/maintenance-templates";
import type { Machine } from "@/lib/portal/machine-types";

type Entry = { state?: string; note?: string };

export function MaintenanceReportForm({ machine, template, defaultTechnician, initial, isNew = false }: {
  machine: Machine;
  template: Template;
  defaultTechnician: string;
  initial: MaintenanceReport | null;
  isNew?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
  // Note fields stay hidden until asked for (or when a note already exists).
  const [openNotes, setOpenNotes] = useState<Set<string>>(() => new Set(Object.entries(initial?.checklist ?? {}).filter(([, e]) => e.note).map(([k]) => k)));

  function touch() { setSaved(false); }
  function setState(key: string, state: string) {
    touch();
    setChecklist(prev => {
      const cur = prev[key] ?? {};
      return { ...prev, [key]: { ...cur, state: cur.state === state ? undefined : state } };
    });
  }
  function setNote(key: string, note: string) {
    touch();
    setChecklist(prev => ({ ...prev, [key]: { ...(prev[key] ?? {}), note } }));
  }
  function openNote(key: string) { setOpenNotes(prev => new Set(prev).add(key)); }

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
        archivePrevious: isNew,
      });
      if (!result.ok) { setError(result.error ?? "Could not save the report."); return; }
      setSaved(true);
      // Drop "?new=1" so a reload shows the saved report instead of a blank one.
      router.replace(pathname);
      router.refresh();
    });
  }

  return <form className="mr-form" onSubmit={submit}>
    <section className="mr-block">
      <h3 className="mr-block-title">Details</h3>
      <div className="mr-grid">
        <label className="mr-field"><span>Technician</span><input value={technician} onChange={e => { touch(); setTechnician(e.target.value); }} maxLength={160} disabled={pending} required /></label>
        <label className="mr-field"><span>Date</span><input type="date" value={reportDate} onChange={e => { touch(); setReportDate(e.target.value); }} disabled={pending} required /></label>
        <label className="mr-field"><span>Operating hours</span><input value={operatingHours} onChange={e => { touch(); setOperatingHours(e.target.value); }} maxLength={40} inputMode="numeric" placeholder="e.g. 1240" disabled={pending} /></label>
        <label className="mr-field"><span>Site / location</span><input value={siteLocation} onChange={e => { touch(); setSiteLocation(e.target.value); }} maxLength={200} disabled={pending} /></label>
      </div>
      <div className="mr-sub">Maintenance type</div>
      <div className="mr-seg mr-seg-full" role="group" aria-label="Maintenance type">
        {MAINTENANCE_TYPES.map(t => <button type="button" key={t} className={`mr-seg-btn pick ${maintenanceType === t ? "on" : ""}`} disabled={pending} aria-pressed={maintenanceType === t} onClick={() => { touch(); setMaintenanceType(maintenanceType === t ? "" : t); }}>{MAINTENANCE_TYPE_LABELS[t]}</button>)}
      </div>
    </section>

    <section className="mr-block">
      <h3 className="mr-block-title">Maintenance checklist</h3>
      <p className="mr-block-sub">Mark {template.columns.map(c => CHECK_STATE_LABELS[c]).join(" or ")} where it applies. Leave a part blank if it is fine.</p>
      <div className="mr-items">
        {template.checklist.map(item => {
          const entry = checklist[item.key] ?? {};
          const noteShown = openNotes.has(item.key) || !!entry.note;
          return <div className="mr-item" key={item.key}>
            <div className="mr-item-main">
              <span className="mr-item-label">{item.label}</span>
              <div className="mr-item-controls">
                <div className="mr-seg" role="group" aria-label={item.label}>
                  {template.columns.map(s => <button type="button" key={s} className={`mr-seg-btn ${s} ${entry.state === s ? "on" : ""}`} disabled={pending} onClick={() => setState(item.key, s)} aria-pressed={entry.state === s}>{CHECK_STATE_LABELS[s]}</button>)}
                </div>
                <button type="button" className={`mr-note-btn ${noteShown ? "on" : ""}`} disabled={pending || noteShown} onClick={() => openNote(item.key)} aria-label={`Add a note for ${item.label}`} title="Add a note">
                  {noteShown ? <MessageSquareText size={16} /> : <MessageSquarePlus size={16} />}
                </button>
              </div>
            </div>
            {noteShown && <input className="mr-note" value={entry.note ?? ""} onChange={e => setNote(item.key, e.target.value)} maxLength={300} placeholder="Note" disabled={pending} autoFocus={!entry.note} aria-label={`${item.label} note`} />}
          </div>;
        })}
      </div>
    </section>

    <section className="mr-block">
      <h3 className="mr-block-title">Final function test</h3>
      <div className="mr-tiles" role="group" aria-label="Final function test">
        {template.functionTests.map(t => {
          const on = !!functionTest[t.key];
          return <button type="button" key={t.key} className={`mr-tile ${on ? "on" : ""}`} disabled={pending} aria-pressed={on} onClick={() => { touch(); setFunctionTest(prev => ({ ...prev, [t.key]: !prev[t.key] })); }}>
            <span className="mr-box" aria-hidden="true">{on && <Check size={13} strokeWidth={3} />}</span>{t.label}
          </button>;
        })}
      </div>
    </section>

    <section className="mr-block">
      <h3 className="mr-block-title">Findings</h3>
      <div className="mr-grid">
        <label className="mr-field"><span>Problem / fault found</span><textarea value={problemFound} onChange={e => { touch(); setProblemFound(e.target.value); }} maxLength={4000} rows={2} disabled={pending} /></label>
        <label className="mr-field"><span>Work performed</span><textarea value={workPerformed} onChange={e => { touch(); setWorkPerformed(e.target.value); }} maxLength={4000} rows={2} disabled={pending} /></label>
        <label className="mr-field"><span>Parts replaced</span><textarea value={partsReplaced} onChange={e => { touch(); setPartsReplaced(e.target.value); }} maxLength={4000} rows={2} disabled={pending} /></label>
        <label className="mr-field"><span>Parts still required</span><textarea value={partsRequired} onChange={e => { touch(); setPartsRequired(e.target.value); }} maxLength={4000} rows={2} disabled={pending} /></label>
      </div>
    </section>

    <section className="mr-block">
      <h3 className="mr-block-title">Outcome</h3>
      <div className="mr-sub">Machine status</div>
      <div className="mr-tiles mr-tiles-2" role="radiogroup" aria-label="Machine status">
        {REPORT_STATUSES.map(s => <button type="button" key={s} role="radio" aria-checked={machineStatus === s} className={`mr-tile status ${s} ${machineStatus === s ? "on" : ""}`} disabled={pending} onClick={() => { touch(); setMachineStatus(machineStatus === s ? "" : s); }}>
          <span className="mr-dot" aria-hidden="true" />{REPORT_STATUS_LABELS[s]}
        </button>)}
      </div>
      <div className="mr-grid">
        <label className="mr-field"><span>Next maintenance</span><input type="date" value={nextMaintenance} onChange={e => { touch(); setNextMaintenance(e.target.value); }} disabled={pending} /></label>
      </div>
    </section>

    {error && <p className="auth-error" role="alert">{error}</p>}
    <div className="mr-actions">
      {saved && <span className="machine-saved" role="status">Saved.</span>}
      <button type="submit" className="folder-add mr-save" disabled={pending}>{pending ? "Saving…" : "Save report"}</button>
    </div>
  </form>;
}
