import { TEMPLATES, MODEL_LABELS, CHECK_STATE_LABELS, type MachineModel } from "./maintenance-templates";

type PdfData = {
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

type PdfMachine = { name: string; model: MachineModel | null; assetTag: string | null; location: string | null };

const HEAD_FILL: [number, number, number] = [238, 241, 245];

// Builds a real, downloadable PDF that mirrors the Bright Service paper form.
// jsPDF/autotable are imported on demand so they never weigh down the main bundle.
export async function downloadReportPdf(machine: PdfMachine, data: PdfData) {
  if (!machine.model) return;
  const model = machine.model;
  const template = TEMPLATES[model];
  const d = data ?? { reportDate: null, maintenanceType: null, operatingHours: null, siteLocation: null, machineStatus: null, problemFound: null, workPerformed: null, partsReplaced: null, partsRequired: null, nextMaintenance: null, technicianName: null, checklist: {}, functionTest: {} };

  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const finalY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  let y = 46;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`BRIGHT SERVICE - ${MODEL_LABELS[model].toUpperCase()}`, pageW / 2, y, { align: "center" });
  y += 17;
  doc.text("MAINTENANCE REPORT", pageW / 2, y, { align: "center" });
  y += 12;

  const type = (t: string) => (d.maintenanceType === t ? "[X]" : "[  ]");
  const label = (t: string) => ({ content: t, styles: { fontStyle: "bold" as const, fillColor: HEAD_FILL } });
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4, lineColor: [17, 17, 17], lineWidth: 0.5 },
    body: [
      [label("Machine / Model"), MODEL_LABELS[model], label("Machine ID"), machine.assetTag ?? ""],
      [label("Date"), d.reportDate ?? "", label("Technician"), d.technicianName ?? ""],
      [label("Maintenance Type"), `${type("preventive")} Preventive   ${type("repair")} Repair   ${type("breakdown")} Breakdown`, label("Operating Hours"), d.operatingHours ?? ""],
      [label("Site / Location"), { content: d.siteLocation ?? "", colSpan: 3 }],
    ],
    columnStyles: { 0: { cellWidth: 96 }, 2: { cellWidth: 96 } },
    margin: { left: margin, right: margin },
  });
  y = finalY() + 18;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Maintenance Checklist", margin, y);
  y += 4;

  const cols = template.columns;
  const head = [["Component / Part", ...cols.map(c => CHECK_STATE_LABELS[c]), "Notes"]];
  const body = template.checklist.map(item => {
    const e = d.checklist[item.key] ?? {};
    return [item.label, ...cols.map(c => (e.state === c ? "X" : "")), e.note ?? ""];
  });
  const columnStyles: Record<number, { cellWidth?: number | "auto"; halign?: "center" }> = { 0: { cellWidth: cols.length === 2 ? 232 : 200 } };
  cols.forEach((_, i) => { columnStyles[i + 1] = { cellWidth: 58, halign: "center" }; });
  autoTable(doc, {
    startY: y + 6,
    theme: "grid",
    head,
    body,
    styles: { fontSize: 8.5, cellPadding: 3, lineColor: [17, 17, 17], lineWidth: 0.5 },
    headStyles: { fillColor: HEAD_FILL, textColor: 20, halign: "center" },
    columnStyles,
    margin: { left: margin, right: margin },
  });
  y = finalY() + 18;

  if (y > pageH - 130) { doc.addPage(); y = 46; }
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Final Function Test", margin, y);
  y += 14;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const tests = template.functionTests.map(t => `${d.functionTest[t.key] ? "[X]" : "[  ]"} ${t.label}`).join("     ");
  const testLines = doc.splitTextToSize(tests, pageW - margin * 2);
  doc.text(testLines, margin, y);
  y += testLines.length * 12 + 10;

  const status = (s: string) => (d.machineStatus === s ? "[X]" : "[  ]");
  if (y > pageH - 120) { doc.addPage(); y = 46; }
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 5, valign: "top", lineColor: [17, 17, 17], lineWidth: 0.5 },
    body: [
      [label("Problem / Fault Found"), d.problemFound ?? ""],
      [label("Work Performed"), d.workPerformed ?? ""],
      [label("Parts Replaced"), d.partsReplaced ?? ""],
      [label("Parts Still Required"), d.partsRequired ?? ""],
      [label("Machine Status"), `${status("operational")} Operational    ${status("needs_maintenance")} Needs maintenance    ${status("waiting_parts")} Waiting parts    ${status("out_of_service")} Out of service`],
      [label("Next Maintenance"), d.nextMaintenance ?? ""],
    ],
    columnStyles: { 0: { cellWidth: 130 } },
    margin: { left: margin, right: margin },
  });

  const safe = `${machine.name} - maintenance report${d.reportDate ? " " + d.reportDate : ""}`.replace(/[\\/:*?"<>|]/g, "-");
  doc.save(`${safe}.pdf`);
}
