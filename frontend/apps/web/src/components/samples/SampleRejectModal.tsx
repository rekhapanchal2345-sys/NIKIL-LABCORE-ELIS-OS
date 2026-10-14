"use client";

import React, { useState } from "react";
import {
  X,
  XCircle,
  AlertTriangle,
  FlaskConical,
  User2,
  Loader2,
  ShieldAlert,
  RefreshCw,
  Clock,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";

interface Sample {
  id: string;
  sampleNumber: string;
  barcode: string;
  sampleType: string;
  priority?: string;
  order: {
    orderNumber: string;
    patient: { uhid: string; firstName: string; lastName: string };
    doctor?: { fullName: string };
  };
  test: { testCode: string; testName: string; sampleContainer: string };
}

// Rejection reasons by category (CLSI GP44 / ISO 15189 aligned)
const REJECTION_CATEGORIES = [
  {
    category: "Specimen Quality",
    icon: FlaskConical,
    color: "text-rose-600",
    reasons: [
      { value: "Hemolyzed Sample", desc: "Visible hemolysis — compromises test accuracy" },
      { value: "Lipemic Sample", desc: "High lipid content interfering with optical analysis" },
      { value: "Icterus", desc: "High bilirubin levels causing spectrophotometric interference" },
      { value: "Clotted Sample", desc: "Blood clot present in anticoagulated whole blood tube" },
      { value: "Fibrin Strands", desc: "Fibrin micro-clots affecting automated pipetting" },
    ],
  },
  {
    category: "Collection Error",
    icon: AlertTriangle,
    color: "text-amber-600",
    reasons: [
      { value: "Insufficient Quantity", desc: "QNS — quantity not sufficient for ordered test panel" },
      { value: "Wrong Container", desc: "Incorrect tube type or additive for test ordered" },
      { value: "Expired Sample", desc: "Sample collected too long ago; pre-analytical TAT exceeded" },
      { value: "Incorrect Ratio", desc: "Wrong blood:anticoagulant ratio in citrate tube" },
    ],
  },
  {
    category: "Labeling & Identification",
    icon: ShieldAlert,
    color: "text-orange-600",
    reasons: [
      { value: "Mislabeled Tube", desc: "Patient ID on label does not match requisition order" },
      { value: "Missing Label", desc: "No barcode or patient ID label on specimen tube" },
      { value: "Illegible Label", desc: "Label smudged, torn or barcode unreadable" },
      { value: "Patient ID Mismatch", desc: "Two identifiers do not match hospital EHR records" },
    ],
  },
  {
    category: "Container & Transport",
    icon: RefreshCw,
    color: "text-sky-600",
    reasons: [
      { value: "Leaking Container", desc: "Tube is leaking — biohazard and specimen loss risk" },
      { value: "Broken Tube", desc: "Tube physically damaged or cracked in centrifuge/transit" },
      { value: "Temperature Breach", desc: "Cold chain or transport temperature requirement violated" },
      { value: "Delay in Transport", desc: "Specimen received beyond acceptable stability window" },
    ],
  },
];

interface Props {
  sample: Sample | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, redrawRequired: boolean, urgency: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export default function SampleRejectModal({
  sample,
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  error = "",
}: Props) {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [redrawRequired, setRedrawRequired] = useState(true);
  const [urgency, setUrgency] = useState("ROUTINE");
  const [localError, setLocalError] = useState("");
  const [step, setStep] = useState<"select" | "confirm">("select");

  React.useEffect(() => {
    if (isOpen) {
      setReason("");
      setCustomReason("");
      setRedrawRequired(true);
      setUrgency("ROUTINE");
      setLocalError("");
      setStep("select");
    }
  }, [isOpen]);

  if (!isOpen || !sample) return null;

  const finalReason = reason === "Other" ? customReason.trim() : reason;
  const canProceed = Boolean(finalReason);

  const selectedReasonDesc = REJECTION_CATEGORIES
    .flatMap((c) => c.reasons)
    .find((r) => r.value === reason)?.desc;

  const handleProceed = () => {
    if (!finalReason) {
      setLocalError("Please select or specify a rejection reason.");
      return;
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!finalReason) return;
    try {
      await onConfirm(finalReason, redrawRequired, urgency);
    } catch {
      // parent handles
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="relative flex flex-col w-full max-w-xl max-h-[90vh] bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-rose-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h2 className="font-black text-rose-950 text-base">Reject Specimen (Non-Conformity)</h2>
              <p className="text-xs text-rose-800">
                {sample.sampleNumber} · {sample.order.patient.firstName} {sample.order.patient.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition shadow-sm"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-0 border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          {[
            { key: "select", label: "1. Select Reason" },
            { key: "confirm", label: "2. Review & Trigger Redraw" },
          ].map((s, i) => (
            <div
              key={s.key}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 ${
                step === s.key
                  ? "text-rose-700 border-rose-600"
                  : step === "confirm" && s.key === "select"
                  ? "text-emerald-700 border-emerald-500"
                  : "text-slate-400 border-transparent"
              }`}
            >
              {step === "confirm" && s.key === "select" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <span className="h-4 w-4 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-[9px] font-black text-slate-700">
                  {i + 1}
                </span>
              )}
              {s.label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === "select" ? (
            <>
              {/* Sample info */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Sample ID", value: sample.sampleNumber },
                  { label: "Test", value: sample.test.testCode },
                  { label: "Container", value: sample.test.sampleContainer },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{label}</p>
                    <p className="text-xs font-black text-slate-900 mt-0.5 truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Reason categories */}
              {REJECTION_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.category} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 bg-slate-50">
                      <Icon className={`h-3.5 w-3.5 ${cat.color}`} />
                      <span className={`text-[11px] font-black uppercase tracking-wider ${cat.color}`}>
                        {cat.category}
                      </span>
                    </div>
                    <div className="p-2 space-y-1">
                      {cat.reasons.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => { setReason(r.value); setLocalError(""); }}
                          className={`w-full flex items-start gap-3 rounded-xl p-2 text-left transition-all ${
                            reason === r.value
                              ? "border border-rose-400 bg-rose-50 text-rose-950 font-semibold"
                              : "border border-transparent hover:border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className={`h-4 w-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all ${
                            reason === r.value ? "border-rose-600 bg-rose-600" : "border-slate-300 bg-white"
                          }`}>
                            {reason === r.value && (
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{r.value}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{r.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Other / custom */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <button
                  type="button"
                  onClick={() => { setReason("Other"); setLocalError(""); }}
                  className={`w-full flex items-center gap-3 rounded-xl p-2 text-left transition-all ${
                    reason === "Other"
                      ? "border border-rose-400 bg-rose-50"
                      : "border border-transparent hover:border-slate-200"
                  }`}
                >
                  <div className={`h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                    reason === "Other" ? "border-rose-600 bg-rose-600" : "border-slate-300 bg-white"
                  }`}>
                    {reason === "Other" && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800">Other (specify below)</span>
                </button>
                {reason === "Other" && (
                  <textarea
                    autoFocus
                    value={customReason}
                    onChange={(e) => { setCustomReason(e.target.value); setLocalError(""); }}
                    placeholder="Enter detailed non-conformity explanation for lab records..."
                    rows={2}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-xs px-3 py-2 outline-none focus:border-rose-500 placeholder:text-slate-400 resize-none"
                  />
                )}
              </div>

              {localError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2.5">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-800 font-semibold">{localError}</p>
                </div>
              )}
            </>
          ) : (
            /* Confirmation step */
            <div className="space-y-4">
              {/* Warning */}
              <div className="rounded-xl border border-rose-300 bg-rose-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                  <p className="font-black text-rose-900">Confirm Specimen Rejection</p>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  This action will mark specimen{" "}
                  <strong className="text-slate-950 font-mono">{sample.sampleNumber}</strong> as rejected in the NABL audit log.
                  The patient and nursing ward will receive an automated redraw request.
                </p>
              </div>

              {/* Rejection summary */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Sample ID</span>
                  <span className="font-black font-mono text-slate-900">{sample.sampleNumber}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Patient</span>
                  <span className="font-bold text-slate-900">
                    {sample.order.patient.firstName} {sample.order.patient.lastName} ({sample.order.patient.uhid})
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Test Profile</span>
                  <span className="font-bold text-slate-900">{sample.test.testName}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-black">Logged Rejection Cause</span>
                  <p className="mt-1 text-sm font-black text-rose-700">{finalReason}</p>
                  {selectedReasonDesc && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{selectedReasonDesc}</p>
                  )}
                </div>
              </div>

              {/* Redraw options */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setRedrawRequired((v) => !v)}
                    className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      redrawRequired ? "border-sky-600 bg-sky-600" : "border-slate-300 bg-white"
                    }`}
                  >
                    {redrawRequired && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <span className="text-xs font-black text-slate-900">Generate Redraw Requisition</span>
                  <span className="text-[10px] text-slate-500">
                    (Auto-alerts phlebotomy team &amp; patient)
                  </span>
                </label>

                {redrawRequired && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-bold">Redraw Priority:</span>
                    <div className="flex gap-2">
                      {["ROUTINE", "URGENT", "STAT"].map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setUrgency(u)}
                          className={`rounded-lg px-2.5 py-1 text-[10px] font-black transition-all ${
                            urgency === u
                              ? u === "STAT"
                                ? "bg-rose-100 text-rose-800 border border-rose-300"
                                : "bg-sky-100 text-sky-800 border border-sky-300"
                              : "bg-slate-50 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={step === "confirm" ? () => setStep("select") : onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition shadow-sm"
          >
            {step === "confirm" ? "Back" : "Cancel"}
          </button>

          {step === "select" ? (
            <button
              type="button"
              onClick={handleProceed}
              disabled={!canProceed}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black transition-all shadow-sm"
            >
              Review Rejection
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black transition-all shadow-sm"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {loading ? "Logging Rejection..." : "Confirm & Trigger Redraw"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
