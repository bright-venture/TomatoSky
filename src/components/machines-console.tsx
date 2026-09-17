"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Check, Cpu, Pencil, Plus, Printer, QrCode, Trash2, X } from "lucide-react";
import { createMachine, deleteMachine, updateMachine } from "@/lib/portal/machines";
import { MACHINE_STATUSES, STATUS_LABELS, type Machine, type MachineResult } from "@/lib/portal/machine-types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export function MachinesConsole({ machines, isAdmin }: { machines: Machine[]; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("running");
  const [editing, setEditing] = useState<{ id: string; name: string; location: string } | null>(null);
  const [qr, setQr] = useState<Machine | null>(null);

  function run(action: () => Promise<MachineResult>, onDone?: () => void) {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok) { setError(result.error ?? "Something went wrong. Please try again."); return; }
      onDone?.();
      router.refresh();
    });
  }

  const qrUrl = qr ? `${SITE || (typeof window !== "undefined" ? window.location.origin : "")}/m/${qr.id}` : "";

  return <div className="machines">
    {error && <p className="folder-error" role="alert">{error}</p>}
    {isAdmin && <section className="portal-panel">
      <div className="panel-heading"><div><h2>Add a machine</h2><p>Each machine gets a printable QR that opens its live state page (employees must sign in).</p></div></div>
      <form className="inv-form" onSubmit={e => { e.preventDefault(); if (!name.trim()) return; run(() => createMachine({ name, location: location || null, status }), () => { setName(""); setLocation(""); setStatus("running"); }); }}>
        <div className="admin-field"><label htmlFor="mc-name">Name</label><input id="mc-name" value={name} onChange={e => setName(e.target.value)} maxLength={160} placeholder="Packing line 1" disabled={pending} required /></div>
        <div className="admin-field"><label htmlFor="mc-loc">Location <span className="opt">(optional)</span></label><input id="mc-loc" value={location} onChange={e => setLocation(e.target.value)} maxLength={160} placeholder="Warehouse A" disabled={pending} /></div>
        <div className="admin-field"><label htmlFor="mc-status">Status</label><select id="mc-status" value={status} onChange={e => setStatus(e.target.value)} disabled={pending}>{MACHINE_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
        <button className="folder-add" disabled={pending || !name.trim()}><Plus size={16} /> Add machine</button>
      </form>
    </section>}

    <section className="portal-panel">
      <div className="panel-heading"><div><h2>Machines</h2><p>{machines.length} {machines.length === 1 ? "machine" : "machines"}</p></div></div>
      <ul className="inv-list">
        {machines.length === 0 && <li className="inv-empty">No machines yet. Add one above.</li>}
        {machines.map(machine => editing?.id === machine.id ? <li key={machine.id} className="inv-row">
          <span className="inv-icon"><Cpu size={19} /></span>
          <div className="inv-edit">
            <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} maxLength={160} placeholder="Name" disabled={pending} aria-label="Machine name" />
            <input value={editing.location} onChange={e => setEditing({ ...editing, location: e.target.value })} maxLength={160} placeholder="Location" disabled={pending} aria-label="Location" />
            <button className="icon-btn" disabled={pending || !editing.name.trim()} onClick={() => run(() => updateMachine({ id: machine.id, name: editing.name, location: editing.location || null }), () => setEditing(null))} aria-label="Save"><Check size={16} /></button>
            <button type="button" className="icon-btn" onClick={() => setEditing(null)} disabled={pending} aria-label="Cancel"><X size={16} /></button>
          </div>
        </li> : <li key={machine.id} className="inv-row">
          <span className="inv-icon"><Cpu size={19} /></span>
          <div className="inv-identity"><strong>{machine.name}</strong><span>{machine.location ?? "No location"}</span></div>
          <span className={`status-badge ${machine.status}`}>{STATUS_LABELS[machine.status]}</span>
          <div className="inv-actions">
            {isAdmin ? <>
              <button type="button" className="inv-move-btn" onClick={() => setQr(machine)} disabled={pending}><QrCode size={15} /> QR</button>
              <button type="button" className="icon-btn" onClick={() => { setError(""); setEditing({ id: machine.id, name: machine.name, location: machine.location ?? "" }); }} disabled={pending} aria-label={`Edit ${machine.name}`}><Pencil size={15} /></button>
              <button type="button" className="icon-btn danger" onClick={() => { if (window.confirm(`Delete "${machine.name}"? This cannot be undone.`)) run(() => deleteMachine({ id: machine.id })); }} disabled={pending} aria-label={`Delete ${machine.name}`}><Trash2 size={15} /></button>
            </> : <a className="inv-move-btn" href={`/m/${machine.id}`}>View state</a>}
          </div>
        </li>)}
      </ul>
    </section>

    {qr && <div className="qr-overlay" role="dialog" aria-modal="true" aria-label={`QR code for ${qr.name}`}>
      <div className="qr-dialog">
        <div className="qr-print">
          <QRCodeSVG value={qrUrl} size={220} level="M" marginSize={2} />
          <strong>{qr.name}</strong>
          {qr.location && <span>{qr.location}</span>}
          <small>Scan to view machine state</small>
        </div>
        <p className="qr-url">{qrUrl}</p>
        <div className="qr-buttons">
          <button type="button" className="folder-add" onClick={() => window.print()}><Printer size={16} /> Print</button>
          <button type="button" className="qr-close" onClick={() => setQr(null)}>Close</button>
        </div>
      </div>
    </div>}
  </div>;
}
