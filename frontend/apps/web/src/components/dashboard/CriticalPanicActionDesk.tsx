"use client";

import { useState } from "react";
import { 
  AlertTriangle, 
  PhoneCall, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  X, 
  UserCheck, 
  FileText, 
  Send,
  Building2,
  Stethoscope,
  ExternalLink,
  ChevronRight
} from "lucide-react";

export interface PanicItem {
  id: string;
  patientName: string;
  uhid: string;
  ageGender: string;
  wardOrBed: string;
  doctorName: string;
  doctorPhone: string;
  testName: string;
  parameterName: string;
  resultValue: string;
  unit: string;
  referenceRange: string;
  criticalThreshold: string;
  flagType: "HIGH" | "LOW";
  flaggedAt: string;
  elapsedMins: number;
  callStatus: "NOTIFIED" | "PENDING" | "ESCALATED";
  notifiedTo?: string;
  notifiedAt?: string;
  readBackConfirmed?: boolean;
  actionAdvised?: string;
}

interface CriticalPanicActionDeskProps {
  alerts?: any[];
  loading?: boolean;
}

export default function CriticalPanicActionDesk({ alerts = [], loading = false }: CriticalPanicActionDeskProps) {
  const [selectedPanic, setSelectedPanic] = useState<PanicItem | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial realistic sample data representing clinical hospital emergencies
  const [panicList, setPanicList] = useState<PanicItem[]>([
    {
      id: "panic-1",
      patientName: "Rameshwar Prasad Gupta",
      uhid: "UHID-2026-9042",
      ageGender: "62Y / Male",
      wardOrBed: "ICU Bed #04 (Bedside)",
      doctorName: "Dr. Arvind Kulkarni (Cardiology)",
      doctorPhone: "+91 98201 44552",
      testName: "Serum Electrolytes (ISE)",
      parameterName: "Serum Potassium (K+)",
      resultValue: "6.9",
      unit: "mmol/L",
      referenceRange: "3.5 - 5.1 mmol/L",
      criticalThreshold: "> 6.5 mmol/L (Severe Hyperkalemia)",
      flagType: "HIGH",
      flaggedAt: "12:04 PM",
      elapsedMins: 11,
      callStatus: "PENDING",
    },
    {
      id: "panic-2",
      patientName: "Meenakshi Sundaram",
      uhid: "UHID-2026-8819",
      ageGender: "34Y / Female",
      wardOrBed: "OPD Emergency Triage",
      doctorName: "Dr. Shreya Sengupta (Hematology)",
      doctorPhone: "+91 97112 33411",
      testName: "Complete Blood Count (CBC 5-Diff)",
      parameterName: "Platelet Count",
      resultValue: "14,000",
      unit: "/µL",
      referenceRange: "1,50,000 - 4,50,000 /µL",
      criticalThreshold: "< 20,000 /µL (Severe Thrombocytopenia)",
      flagType: "LOW",
      flaggedAt: "11:50 AM",
      elapsedMins: 25,
      callStatus: "NOTIFIED",
      notifiedTo: "Dr. Shreya Sengupta",
      notifiedAt: "11:58 AM",
      readBackConfirmed: true,
      actionAdvised: "Platelet concentrate transfusion requisitioned urgently; patient admitted to Day Care",
    },
    {
      id: "panic-3",
      patientName: "Gajanan M. Rao",
      uhid: "UHID-2026-9103",
      ageGender: "58Y / Male",
      wardOrBed: "Casualty / CCU Step-down",
      doctorName: "Dr. Rajeshwar Nair (Intensivist)",
      doctorPhone: "+91 98400 99881",
      testName: "High Sensitivity Troponin-I",
      parameterName: "Cardiac Troponin-I (hs-cTnI)",
      resultValue: "0.48",
      unit: "ng/mL",
      referenceRange: "< 0.04 ng/mL",
      criticalThreshold: "> 0.10 ng/mL (Acute Myocardial Infarction)",
      flagType: "HIGH",
      flaggedAt: "12:12 PM",
      elapsedMins: 3,
      callStatus: "PENDING",
    },
  ]);

  // Form State for Doctor Notification Modal
  const [callerName, setCallerName] = useState("Dr. Sandeep Deshmukh (Pathologist)");
  const [spokenTo, setSpokenTo] = useState("");
  const [readBackChecked, setReadBackChecked] = useState(false);
  const [clinicalRemarks, setClinicalRemarks] = useState("");

  const handleOpenLogModal = (item: PanicItem) => {
    setSelectedPanic(item);
    setSpokenTo(item.doctorName);
    setReadBackChecked(item.readBackConfirmed ?? false);
    setClinicalRemarks(item.actionAdvised ?? "");
    setIsLogModalOpen(true);
  };

  const handleSaveNotification = () => {
    if (!selectedPanic) return;

    if (!readBackChecked) {
      alert("NABL ISO 15189 Mandate: Verbal Read-Back Confirmation is required before certifying call log.");
      return;
    }

    const nowStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    setPanicList((prev) =>
      prev.map((item) =>
        item.id === selectedPanic.id
          ? {
              ...item,
              callStatus: "NOTIFIED",
              notifiedTo: spokenTo || item.doctorName,
              notifiedAt: nowStr,
              readBackConfirmed: true,
              actionAdvised: clinicalRemarks || "Verbal read-back confirmed; clinician acknowledged panic value.",
            }
          : item
      )
    );

    setIsLogModalOpen(false);
    setToastMessage(`✓ Panic notification logged & verified for ${selectedPanic.patientName} (${selectedPanic.uhid})`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleSendWhatsApp = (item: PanicItem) => {
    const text = `🚨 *URGENT MEDICAL ALERT - LABCORE CLINICAL LIS*\n\n*Critical Panic Value Flagged*\n*Patient:* ${item.patientName} (${item.uhid})\n*Location:* ${item.wardOrBed}\n*Consultant:* ${item.doctorName}\n\n*Test:* ${item.testName}\n*Parameter:* ${item.parameterName}\n*Observed Value:* *${item.resultValue} ${item.unit}* [${item.flagType === "HIGH" ? "CRITICALLY ELEVATED" : "CRITICALLY LOW"}]\n*Ref Range:* ${item.referenceRange}\n*NABL Limit:* ${item.criticalThreshold}\n\n*Mandatory NABL Action:* Please acknowledge with verbal read-back to Lab Duty Desk: Ext 401 / +91 98200 12345.`;
    window.open(`https://api.whatsapp.com/send?phone=${item.doctorPhone.replace(/[^0-9]/g, "")}&text=${encodeURIComponent(text)}`, "_blank");
  };

  const pendingCount = panicList.filter((p) => p.callStatus === "PENDING").length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Toast */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 text-center animate-fade-in flex items-center justify-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-rose-50/60 via-white to-amber-50/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                NABL ISO 15189:2022 Critical / Panic Values Action Desk
              </h3>
              {pendingCount > 0 ? (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                  {pendingCount} Awaiting Clinician Notification
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  All Panic Calls Documented
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Clause 7.3.7 Mandate: Results breaching biological life-threatening thresholds must be telephonically communicated to treating doctor within 15 minutes with verbal read-back.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 font-bold">
            <Clock className="h-3.5 w-3.5 text-amber-600" /> Target SLA: &lt; 15 mins
          </span>
        </div>
      </div>

      {/* Panic Value Cards List */}
      <div className="divide-y divide-slate-100">
        {panicList.map((item) => (
          <div
            key={item.id}
            className={`p-4 sm:p-5 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
              item.callStatus === "PENDING"
                ? "bg-rose-50/30 hover:bg-rose-50/60"
                : "bg-white hover:bg-slate-50/60"
            }`}
          >
            {/* Left Column: Patient & Ward */}
            <div className="space-y-1 min-w-[240px]">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                  item.flagType === "HIGH" ? "bg-rose-600 text-white" : "bg-amber-600 text-white"
                }`}>
                  Critical {item.flagType}
                </span>
                <span className="font-extrabold text-sm text-slate-900">
                  {item.patientName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                <span className="font-mono font-bold text-slate-700">{item.uhid}</span>
                <span>•</span>
                <span>{item.ageGender}</span>
                <span>•</span>
                <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                  {item.wardOrBed}
                </span>
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-0.5">
                <Stethoscope className="h-3.5 w-3.5 text-sky-600" />
                <span>Treating: <strong>{item.doctorName}</strong></span>
              </div>
            </div>

            {/* Middle Column: Test, Parameter, Observed Panic Value */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1 min-w-[280px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500">{item.testName}</span>
                <span className="text-[10px] text-slate-400">Flagged {item.flaggedAt}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-xs text-slate-800">{item.parameterName}:</span>
                <span className="text-lg font-black text-rose-600 font-mono tracking-tight">
                  {item.resultValue} <span className="text-xs font-semibold text-slate-600">{item.unit}</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-1">
                <span>Norm: {item.referenceRange}</span>
                <span className="text-rose-700 font-semibold">{item.criticalThreshold}</span>
              </div>
            </div>

            {/* Status & SLA Elapsed */}
            <div className="text-xs space-y-1 min-w-[160px]">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-600 font-medium">Elapsed:</span>
                <span className={`font-bold font-mono ${item.elapsedMins > 15 ? "text-rose-600" : "text-amber-600"}`}>
                  {item.elapsedMins} mins
                </span>
              </div>

              {item.callStatus === "NOTIFIED" ? (
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Read-Back Verified ({item.notifiedAt})</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-lg animate-pulse">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                  <span>Call Notification Required</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-end lg:self-center">
              <button
                onClick={() => handleSendWhatsApp(item)}
                title="Send Urgent WhatsApp Message to Doctor"
                className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              <button
                onClick={() => handleOpenLogModal(item)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                  item.callStatus === "NOTIFIED"
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "bg-rose-600 text-white hover:bg-rose-700 animate-pulse"
                }`}
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>{item.callStatus === "NOTIFIED" ? "View Call Log" : "Log Doctor Call"}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: NABL Doctor Notification & Read-back Logger */}
      {isLogModalOpen && selectedPanic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-rose-50 via-white to-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <PhoneCall className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Log Clinician Telephonic Notification
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    NABL ISO 15189:2022 Mandated Verbal Read-Back Protocol
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Alert Summary Box */}
              <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-rose-950 text-sm">
                    {selectedPanic.patientName}
                  </span>
                  <span className="font-mono font-bold text-rose-800 text-[11px]">
                    {selectedPanic.uhid}
                  </span>
                </div>
                <p className="text-slate-600">
                  {selectedPanic.wardOrBed} • Treating: {selectedPanic.doctorName} ({selectedPanic.doctorPhone})
                </p>
                <div className="pt-2 border-t border-rose-200/80 flex items-baseline justify-between">
                  <span className="font-semibold text-rose-900">{selectedPanic.parameterName}:</span>
                  <span className="font-black text-rose-700 text-base font-mono">
                    {selectedPanic.resultValue} {selectedPanic.unit}
                  </span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    1. Notifying Lab Officer
                  </label>
                  <input
                    type="text"
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    2. Clinician / Recipient Spoken With
                  </label>
                  <input
                    type="text"
                    value={spokenTo}
                    onChange={(e) => setSpokenTo(e.target.value)}
                    placeholder="Doctor Name or RMO on Duty"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-sky-500 font-medium"
                  />
                </div>

                {/* Verbal Read-Back Checkbox */}
                <div className="p-3 rounded-xl border-2 border-sky-300 bg-sky-50/50">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={readBackChecked}
                      onChange={(e) => setReadBackChecked(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <span className="font-extrabold text-slate-900 block text-xs">
                        Verbal Read-Back Confirmed (Mandatory)
                      </span>
                      <span className="text-[11px] text-slate-600 leading-normal block mt-0.5">
                        I certify that the clinician repeated the patient identity, UHID, and panic value back to me to ensure zero transcription error.
                      </span>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    3. Clinical Instructions / Action Advised by Doctor
                  </label>
                  <textarea
                    rows={2}
                    value={clinicalRemarks}
                    onChange={(e) => setClinicalRemarks(e.target.value)}
                    placeholder="e.g., Transfusion ordered; Emergency shift to CCU; Repeat sample advised in 2 hrs."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-sky-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotification}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Certify & Save NABL Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
