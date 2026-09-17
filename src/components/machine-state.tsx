"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Cpu } from "lucide-react";
import { updateMachineState } from "@/lib/portal/machines";
import { MACHINE_STATUSES, STATUS_LABELS, type Machine } from "@/lib/portal/machine-types";

export function MachineState({ machine }: { machine: Machine }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Machine["status"]>(machine.status);
  const [notes, setNotes] = useState(machine.notes ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function save() {
    setError(""); setSaved(false);
    startTransition(async () => {
      const result = await updateMachineState({ id: machine.id, status, notes: notes || null });
      if (!result.ok) { setError(result.error ?? "Could not save the state."); return; }
      setSaved(true);
      router.refresh();
    });
  }

  return <div className="machine-card">
    <span className="machine-icon"><Cpu size={26} /></span>
    <p className="eyebrow">MACHINE STATE</p>
    <h1>{machine.name}</h1>
    {machine.location && <p className="machine-loc">{machine.location}</p>}
    <span className={`status-badge big ${status}`}>{STATUS_LABELS[status]}</span>

    <label htmlFor="ms-status">Status</label>
    <select id="ms-status" value={status} onChange={e => { setStatus(e.target.value as Machine["status"]); setSaved(false); }} disabled={pending}>
      {MACHINE_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
    </select>

    <label htmlFor="ms-notes">Notes</label>
    <textarea id="ms-notes" value={notes} onChange={e => { setNotes(e.target.value); setSaved(false); }} maxLength={1000} rows={4} placeholder="Add a note about this machine…" disabled={pending} />

    {error && <p className="auth-error" role="alert">{error}</p>}
    {saved && <p className="machine-saved" role="status">Saved.</p>}
    <button className="button button-dark machine-save" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save state"}</button>

    <p className="machine-updated">Last updated {machine.updatedAt.slice(0, 16).replace("T", " ")}</p>
    <a className="text-link machine-back" href="/portal">Back to portal</a>
  </div>;
}
