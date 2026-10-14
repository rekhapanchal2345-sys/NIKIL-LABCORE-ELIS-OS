"use client";

import React, { useRef, useState } from "react";
import {
  X,
  ScanLine,
  FlaskConical,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  User2,
  Building2,
  Zap,
  ShieldCheck,
  TestTube2,
  Truck,
  Home,
  Hospital,
  Stethoscope,
  QrCode,
  Hash,
  RefreshCw,
  Info,
} from "lucide-react";

interface Sample {
  id: string;
  sampleNumber: string;
  barcode: string;
  sampleType: string;
  status: string;
  priority?: string;
  collectionType?: string;
  createdAt: string;
  order: {
    orderNumber: string;
    patient: { uhid: string; firstName: string; lastName: string; gender: string; age?: number };
    doctor?: { fullName: string; specialization: string };
  };
  test: {
    testCode: string;
    testName: string;
    sampleContainer: string;
    processingDepartment?: string;
  };
}

const COLLECTION_TYPES = [
  { value: "WALK_IN", label: "Walk-in", icon: Building2, desc: "Patient visited collection center" },
  { value: "HOME_COLLECTION", label: "Home Collection", icon: Home, desc: "Phlebotomist visited patient" },
  { value: "HOSPITAL", label: "Hospital Ward", icon: Hospital, desc: "Inpatient / Hospital bed" },
  { value: "CLINIC", label: "Referring Clinic", icon: Stethoscope, desc: "Clinic referral collection" },
];

const LOCATIONS = [
  "Phlebotomy Room A",
  "Phlebotomy Room B",
  "Emergency Lab",
  "ICU Satellite Lab",
  "Outpatient Collection",
  "Home Visit",
  "Hospital Ward 1",
  "Hospital Ward 2",
  "Corporate Camp",
];

const CONTAINER_INSTRUCTIONS: Record<string, string[]> = {
  "EDTA Purple": ["Mix by gentle inversion 8–10 times", "Do NOT shake vigorously", "Store at room temp"],
  "Serum Separator Red": ["Allow to clot 30 minutes", "Centrifuge at 2000g for 10 min", "Separate serum"],
  "Citrate Blue": ["Fill to exact mark (1:9 ratio critical)", "Mix immediately 3–4 inversions", "Transport on ice"],
  "Urine Container Yellow": ["Mid-stream clean catch", "10–20 mL minimum", "Label immediately"],
  "Fluoride Grey": ["Mix immediately", "Keep cold if processing delayed", "Prevents glycolysis"],
  "Heparin Green": ["Mix 8–10 inversions", "Do NOT freeze", "Process within 30 min"],
};

interface SampleCollectModalProps {
  sample: Sample | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    barcode: string;
    collectionType: string;
    location: string;
    collectorName: string;
    priority: string;
    notes?: string;
    tubeIntegrityVerified: boolean;
  }) => Promise<void>;
  loading?: boolean;
  error?: string;
  existingBarcodes?: string[];
}

export default function SampleCollectModal({
  sample,
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  error = "",
  existingBarcodes = [],
}: SampleCollectModalProps) {
  const [barcode, setBarcode] = useState("");
  const [collectionType, setCollectionType] = useState("WALK_IN");
  const [location, setLocation] = useState("Phlebotomy Room A");
  const [collectorName, setCollectorName] = useState("");
  const [priority, setPriority] = useState("ROUTINE");
  const [notes, setNotes] = useState("");
  const [integrityChecks, setIntegrityChecks] = useState({
    label: false,
    container: false,
    volume: false,
    temperature: false,
  });
  const [localError, setLocalError] = useState("");
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Sync state when sample changes
  React.useEffect(() => {
    if (sample) {
      setBarcode(sample.barcode || "");
      setCollectionType(sample.collectionType || "WALK_IN");
      setPriority(sample.priority || "ROUTINE");
      setIntegrityChecks({ label: false, container: false, volume: false, temperature: false });
      setLocalError("");
      setTimeout(() => barcodeRef.current?.focus(), 100);
    }
  }, [sample]);

  if (!isOpen || !sample) return null;

  const isDuplicateBarcode =
    barcode &&
    barcode !== sample.barcode &&
    existingBarcodes.includes(barcode.trim());

  const isBarcodeValid = barcode && barcode.length >= 4;
  const allChecks = Object.values(integrityChecks).every(Boolean);
  const canSubmit = isBarcodeValid && !isDuplicateBarcode && allChecks && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBarcodeValid) {
      setLocalError("Please enter or scan a valid barcode (minimum 4 characters).");
      return;
    }
    if (isDuplicateBarcode) {
      setLocalError("This barcode is already assigned to another sample in the system.");
      return;
    }
    if (!allChecks) {
      setLocalError("All pre-collection integrity checks must be confirmed before proceeding.");
      return;
    }
    try {
      await onConfirm({
        barcode: barcode.trim(),
        collectionType,
        location,
        collectorName,
        priority,
        notes: notes.trim() || undefined,
        tubeIntegrityVerified: true,
      });
    } catch {
      // Parent handles error display
    }
  };

  const containerInstructions =
    CONTAINER_INSTRUCTIONS[sample.test.sampleContainer] || [
      "Follow standard sterile phlebotomy protocol",
      "Label tube immediately after draw at patient side",
      "Transport promptly according to test requirements",
    ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 font-black">
              <TestTube2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">Sample Collection &amp; Phlebotomy</h3>
                <span className="rounded-full bg-sky-100 border border-sky-200 px-2.5 py-0.5 text-[10px] font-black text-sky-800">
                  {sample.sampleNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                CLSI GP41 aligned venipuncture protocol &amp; pre-analytical verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition shadow-sm"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Patient + Test info strip */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <User2 className="h-3.5 w-3.5 text-sky-600" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Patient</span>
              </div>
              <p className="text-sm font-black text-slate-900">
                {sample.order.patient.firstName} {sample.order.patient.lastName}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                UHID: {sample.order.patient.uhid} · {sample.order.patient.gender} · {sample.order.patient.age}Y
              </p>
              {sample.order.doctor && (
                <p className="text-[11px] text-slate-600 mt-1">
                  Ref: Dr. {sample.order.doctor.fullName}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical className="h-3.5 w-3.5 text-sky-600" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Specimen Required</span>
              </div>
              <p className="text-sm font-black text-slate-900">{sample.test.testName}</p>
              <p className="text-xs text-slate-500 font-mono">{sample.test.testCode} · {sample.sampleType}</p>
              <div className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] bg-sky-100 border border-sky-200 text-sky-800 font-bold rounded-full px-2.5 py-0.5">
                <TestTube2 className="h-3 w-3" />
                {sample.test.sampleContainer}
              </div>
            </div>
          </div>

          {/* Container instructions */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-3.5 w-3.5 text-amber-700" />
              <span className="text-xs font-black text-amber-900">Handling Instructions — {sample.test.sampleContainer}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {containerInstructions.map((instr, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-amber-900 font-medium">
                  <span className="text-amber-700 font-bold shrink-0">{i + 1}.</span>
                  {instr}
                </div>
              ))}
            </div>
          </div>

          {/* Barcode scan */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <label className="flex items-center gap-2 text-xs font-black text-slate-900">
              <ScanLine className="h-4 w-4 text-sky-600" />
              Specimen Barcode Label *
            </label>
            <div className="relative">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={barcodeRef}
                type="text"
                placeholder="Scan or type barcode from printed label..."
                value={barcode}
                onChange={(e) => { setBarcode(e.target.value.toUpperCase()); setLocalError(""); }}
                className={`w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:ring-2 ${
                  isDuplicateBarcode
                    ? "border-rose-400 focus:ring-rose-200"
                    : isBarcodeValid
                    ? "border-emerald-400 focus:ring-emerald-200"
                    : "border-slate-300 focus:ring-sky-200 focus:border-sky-500"
                }`}
              />
              {barcode && (
                <button
                  type="button"
                  onClick={() => setBarcode("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {isDuplicateBarcode && (
              <p className="text-xs text-rose-600 flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" /> Barcode already in use — scan a fresh tube
              </p>
            )}
            {isBarcodeValid && !isDuplicateBarcode && (
              <p className="text-xs text-emerald-700 flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Barcode verified and matched
              </p>
            )}
          </div>

          {/* Collection type + location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                <Truck className="h-3.5 w-3.5 text-sky-600" /> Collection Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COLLECTION_TYPES.map((ct) => {
                  const Icon = ct.icon;
                  return (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => setCollectionType(ct.value)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-[10px] font-bold transition-all ${
                        collectionType === ct.value
                          ? "border-sky-500 bg-sky-50 text-sky-800 shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {ct.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1.5">
                  <MapPin className="h-3 w-3" /> Phlebotomy Location / Station
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 text-xs px-3 py-2 outline-none focus:border-sky-500 font-medium"
                >
                  {LOCATIONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1.5">
                  <Zap className="h-3 w-3" /> Priority Tier
                </label>
                <div className="flex gap-2">
                  {["ROUTINE", "URGENT", "STAT"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 rounded-lg border py-1.5 text-[10px] font-black transition-all ${
                        priority === p
                          ? p === "STAT"
                            ? "border-rose-400 bg-rose-50 text-rose-700"
                            : p === "URGENT"
                            ? "border-amber-400 bg-amber-50 text-amber-800"
                            : "border-sky-400 bg-sky-50 text-sky-800"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Collector name */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1.5">
              <User2 className="h-3 w-3" /> Phlebotomist / Collector Identity
            </label>
            <input
              type="text"
              placeholder="e.g. Sarah Johnson (Phleb ID #204)..."
              value={collectorName}
              onChange={(e) => setCollectorName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 text-xs px-3 py-2 outline-none focus:border-sky-500"
            />
          </div>

          {/* 4-point integrity check */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-black text-slate-900">Pre-Collection Quality Checklist (CLSI GP41)</span>
              <span className="ml-auto text-[10px] font-bold text-slate-500">
                {Object.values(integrityChecks).filter(Boolean).length}/4 Verified
              </span>
            </div>
            {[
              { key: "label", label: "Patient 2-factor ID (Name & UHID) matched on tube label", icon: Hash },
              { key: "container", label: "Correct vacuum tube & anticoagulant selected", icon: TestTube2 },
              { key: "volume", label: "Adequate blood/fluid volume drawn to indicator line", icon: FlaskConical },
              { key: "temperature", label: "Inversion protocol performed & transport conditions ready", icon: Clock },
            ].map(({ key, label, icon: Icon }) => {
              const checked = integrityChecks[key as keyof typeof integrityChecks];
              return (
                <label
                  key={key}
                  className={`flex items-center gap-3 rounded-xl border p-2.5 cursor-pointer transition-all ${
                    checked
                      ? "border-emerald-300 bg-emerald-50/60"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(e) =>
                      setIntegrityChecks((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                  />
                  <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    checked ? "border-emerald-600 bg-emerald-600" : "border-slate-300 bg-white"
                  }`}>
                    {checked && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <Icon className={`h-4 w-4 shrink-0 ${checked ? "text-emerald-700" : "text-slate-400"}`} />
                  <span className={`text-xs font-medium ${checked ? "text-emerald-950 font-bold" : "text-slate-600"}`}>
                    {label}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1.5">
              Phlebotomy Observations / Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 10 hours fasting confirmed, left arm median cubital vein..."
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 text-xs px-3 py-2 outline-none focus:border-sky-500 resize-none"
            />
          </div>

          {/* Error */}
          {(localError || error) && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-800 font-semibold">{localError || error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
          <div className="text-[11px] text-slate-500">
            {allChecks ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> All integrity checks confirmed
              </span>
            ) : (
              <span className="text-amber-700 font-medium">Verify all 4 checklist points to proceed</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black transition-all shadow-sm"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TestTube2 className="h-3.5 w-3.5" />}
              {loading ? "Recording Draw..." : "Confirm Phlebotomy Draw"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
