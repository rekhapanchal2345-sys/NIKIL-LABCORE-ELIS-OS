"use client";

import React, { useState } from "react";
import {
  X,
  FlaskConical,
  Barcode,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Layers,
  Thermometer,
  ShieldCheck,
  Activity,
  ArrowRight,
  Sparkles,
  QrCode,
  Clock,
  User,
  Check,
  Copy
} from "lucide-react";

export interface AccessioningOrder {
  id: string;
  orderNumber: string;
  barcode: string;
  priority?: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    uhid: string;
    gender: string;
    age?: number;
    phone?: string;
  };
  doctor?: {
    fullName: string;
    specialization?: string;
  };
  items: Array<{
    id: string;
    test: {
      id: string;
      testCode: string;
      testName: string;
      sampleType: string;
      sampleContainer?: string;
      processingDepartment?: string;
    };
  }>;
  orderStatus: string;
}

interface SpecimenAccessioningModalProps {
  order: AccessioningOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onAccessionSuccess?: (accessionData: any) => void;
}

const TUBE_CONTAINERS: Record<string, { name: string; capColor: string; bg: string; text: string; border: string; desc: string }> = {
  "EDTA": { name: "Lavender EDTA (K2/K3)", capColor: "#8B5CF6", bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", desc: "Hematology & HbA1c" },
  "SST": { name: "Gold / Yellow SST Gel", capColor: "#F59E0B", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", desc: "Serum Biochemistry & Serology" },
  "CITRATE": { name: "Light Blue Sodium Citrate", capColor: "#0284C7", bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", desc: "Coagulation & PT/INR" },
  "FLUORIDE": { name: "Grey Sodium Fluoride", capColor: "#64748B", bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", desc: "Glucose & Lactate" },
  "PLAIN": { name: "Red Plain / Clot Activator", capColor: "#EF4444", bg: "bg-red-50", text: "text-red-800", border: "border-red-200", desc: "Cross-Match & Drug Levels" },
  "URINE": { name: "Sterile Cup Container", capColor: "#EAB308", bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200", desc: "Urine Routine & Culture" },
};

function resolveTubeSpec(testName: string = "", sampleType: string = ""): typeof TUBE_CONTAINERS["EDTA"] {
  const t = testName.toLowerCase();
  const s = sampleType.toLowerCase();
  if (t.includes("cbc") || t.includes("esr") || t.includes("hba1c") || t.includes("platelet") || t.includes("blood group")) {
    return TUBE_CONTAINERS["EDTA"];
  }
  if (t.includes("glucose") || t.includes("sugar") || t.includes("fbs") || t.includes("ppbs") || t.includes("rbs")) {
    return TUBE_CONTAINERS["FLUORIDE"];
  }
  if (t.includes("pt") || t.includes("inr") || t.includes("aptt") || t.includes("coag") || t.includes("d-dimer")) {
    return TUBE_CONTAINERS["CITRATE"];
  }
  if (s.includes("urine") || t.includes("urine")) {
    return TUBE_CONTAINERS["URINE"];
  }
  return TUBE_CONTAINERS["SST"];
}

export default function SpecimenAccessioningModal({
  order,
  isOpen,
  onClose,
  onAccessionSuccess,
}: SpecimenAccessioningModalProps) {
  const [rackId, setRackId] = useState("RACK-CENTRIFUGE-B1");
  const [slotPosition, setSlotPosition] = useState("Slot 08");
  const [specimenIntegrity, setSpecimenIntegrity] = useState<"NORMAL" | "HEMOLYZED" | "LIPEMIC" | "ICTERIC" | "QNS">("NORMAL");
  const [volumeChecked, setVolumeChecked] = useState(true);
  const [centrifugeSpeed, setCentrifugeSpeed] = useState("3500 RPM / 10 Mins");
  const [labelCopies, setLabelCopies] = useState(2);
  const [accessioning, setAccessioning] = useState(false);
  const [copiedBarcode, setCopiedBarcode] = useState(false);

  if (!isOpen || !order) return null;

  const isStat = order.priority === "STAT" || order.priority === "URGENT";

  // Group unique tubes required
  const tubesMap = new Map<string, { spec: typeof TUBE_CONTAINERS["EDTA"]; tests: string[] }>();
  order.items.forEach((item) => {
    const spec = resolveTubeSpec(item.test.testName, item.test.sampleType);
    if (!tubesMap.has(spec.name)) {
      tubesMap.set(spec.name, { spec, tests: [] });
    }
    tubesMap.get(spec.name)!.tests.push(item.test.testCode || item.test.testName);
  });
  const tubes = Array.from(tubesMap.values());

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(order.barcode);
    setCopiedBarcode(true);
    setTimeout(() => setCopiedBarcode(false), 2000);
  };

  const handleConfirmAccession = async () => {
    setAccessioning(true);
    try {
      await new Promise((res) => setTimeout(res, 600));
      if (onAccessionSuccess) {
        onAccessionSuccess({
          orderId: order.id,
          rackId,
          slotPosition,
          specimenIntegrity,
          tubesAccessioned: tubes.length,
        });
      }
      onClose();
    } finally {
      setAccessioning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-sky-50/80 via-white to-teal-50/50 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-100/80 px-2.5 py-0.5 rounded-full border border-sky-200">
                  Laboratory Accessioning Desk
                </span>
                {isStat && (
                  <span className="text-xs font-black uppercase text-white bg-rose-600 px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                    ⚡ STAT EMERGENCY
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                Specimen Intake &amp; Centrifuge Verification
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Patient & Order Demographics Summary Banner */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Demographics</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {order.patient.firstName} {order.patient.lastName}
              </p>
              <p className="text-xs text-slate-600 font-mono mt-0.5">
                UHID: <span className="font-bold text-slate-800">{order.patient.uhid}</span>
              </p>
              <p className="text-[11px] text-slate-500">
                {order.patient.age || "—"} yrs · {order.patient.gender}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requisition Details</p>
              <p className="text-sm font-mono font-bold text-sky-700 mt-0.5">
                {order.orderNumber}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-mono text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                  {order.barcode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyBarcode}
                  className="text-slate-400 hover:text-slate-700 p-1"
                  title="Copy barcode"
                >
                  {copiedBarcode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Referring Clinician</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {order.doctor?.fullName || "Self / OPD Walk-in"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {order.doctor?.specialization || "General Medicine & Health Check"}
              </p>
            </div>
          </div>

          {/* Vacutainer Tubes Required & Inspection Status */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Barcode className="h-4 w-4 text-sky-600" />
                Required Specimen Vacutainers ({tubes.length} Containers)
              </h3>
              <span className="text-xs text-slate-500 font-medium">Verify cap color &amp; label integrity</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tubes.map((tube, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border p-3.5 ${tube.spec.bg} ${tube.spec.border} flex flex-col justify-between`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-4 w-4 rounded-full shadow-xs flex-shrink-0"
                        style={{ backgroundColor: tube.spec.capColor }}
                      />
                      <div>
                        <p className={`text-xs font-black ${tube.spec.text}`}>
                          {tube.spec.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {tube.spec.desc}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-white/90 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full shadow-2xs">
                      #{idx + 1}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-medium truncate max-w-[170px]">
                      Tests: {tube.tests.join(", ")}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Specimen Integrity & Pre-Analytical Quality Checks */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              Pre-Analytical Quality &amp; HIL Indices Inspection
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                  Specimen Visual Integrity
                </label>
                <select
                  value={specimenIntegrity}
                  onChange={(e) => setSpecimenIntegrity(e.target.value as any)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500"
                >
                  <option value="NORMAL">Normal Clear Specimen (Accept for Analysis)</option>
                  <option value="HEMOLYZED">Hemolyzed (Red/Pinkish Free Hb - Notify Chem)</option>
                  <option value="LIPEMIC">Lipemic (Milky White Turbidity)</option>
                  <option value="ICTERIC">Icteric (Dark Yellow/Orange Bilirubin)</option>
                  <option value="QNS">QNS (Quantity Not Sufficient - Request Redraw)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                  Centrifuge Program / Speed
                </label>
                <select
                  value={centrifugeSpeed}
                  onChange={(e) => setCentrifugeSpeed(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500"
                >
                  <option value="3500 RPM / 10 Mins">Standard Serum Separation: 3,500 RPM / 10 Mins</option>
                  <option value="3000 RPM / 15 Mins">Citrate Platelet-Poor Plasma: 3,000 RPM / 15 Mins</option>
                  <option value="UNSPUN_EDTA">Whole Blood Unspun (Direct Sysmex CBC)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                  Centrifuge Batch / Tray Rack ID
                </label>
                <input
                  type="text"
                  value={rackId}
                  onChange={(e) => setRackId(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500"
                  placeholder="e.g. RACK-CENTRIFUGE-B1"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                  Rack Position / Slot Allocation
                </label>
                <input
                  type="text"
                  value={slotPosition}
                  onChange={(e) => setSlotPosition(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500"
                  placeholder="e.g. Slot 08"
                />
              </div>
            </div>
          </div>

          {/* Thermal Label Print Options */}
          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                <Printer className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Thermal Cryo-Vial Barcode Labels</p>
                <p className="text-[10px] text-slate-500">2-up thermal sticker print with Code128 barcode + UHID + assay names</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Copies:</span>
              <select
                value={labelCopies}
                onChange={(e) => setLabelCopies(Number(e.target.value))}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none"
              >
                <option value={1}>1 Per Tube</option>
                <option value={2}>2 (Tube + Aliquot)</option>
                <option value={3}>3 Copies</option>
              </select>
              <button
                type="button"
                onClick={() => window.open(`/orders/${order.id}/barcode`, "_blank")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-2xs transition-all"
              >
                <Printer className="h-3.5 w-3.5 text-sky-600" />
                <span>Test Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={accessioning}
              onClick={handleConfirmAccession}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 px-5 py-2.5 text-xs font-black text-white shadow-md hover:from-sky-700 hover:to-indigo-700 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{accessioning ? "Accessioning Sample..." : "Confirm Intake & Route to Analyzers"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
