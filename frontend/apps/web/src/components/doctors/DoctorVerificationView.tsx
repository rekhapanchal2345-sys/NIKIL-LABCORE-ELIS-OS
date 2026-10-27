"use client";

import React, { useState } from "react";
import {
  Microscope,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Search,
  Filter,
  Printer,
  Eye,
  FileCheck,
  ShieldCheck,
  Clock,
  Sparkles,
  ChevronRight,
  PhoneCall,
} from "lucide-react";
import PathologistReviewModal, {
  VerificationReportItem,
} from "./PathologistReviewModal";
import CriticalPanicCallLogModal, {
  CriticalCallLogEntry,
} from "./CriticalPanicCallLogModal";
import { showSuccess, showInfo } from "@/lib/notifications";

const INITIAL_REPORTS: VerificationReportItem[] = [
  {
    id: "rep-1",
    reportId: "REP-2026-88019",
    accessionNumber: "ACC-88019-01",
    barcode: "BC-8801901",
    patientName: "Mr. Harish Chandra",
    uhid: "UHID-2026-7910",
    age: 67,
    gender: "Male",
    referredByDoctor: "Dr. Vikram Seth (Intensivist)",
    testPanelName: "Complete Blood Count with Platelets & Differential",
    department: "Hematology",
    specimenType: "EDTA Whole Blood",
    instrumentId: "Sysmex XN-1000",
    collectedAt: "08:15 AM",
    analyzedAt: "08:42 AM",
    isPanic: true,
    deltaFlag: true,
    status: "PENDING_PATHOLOGIST",
    parameters: [
      { name: "Platelet Count", result: "18,000", unit: "/µL", referenceRange: "150,000 - 450,000", flag: "PANIC_LOW", deltaChange: "-62%" },
      { name: "Hemoglobin", result: "8.2", unit: "g/dL", referenceRange: "13.0 - 17.0", flag: "LOW", deltaChange: "-1.4" },
      { name: "Total Leukocyte Count (WBC)", result: "19,400", unit: "/µL", referenceRange: "4,000 - 11,000", flag: "PANIC_HIGH", deltaChange: "+48%" },
      { name: "Neutrophils %", result: "88", unit: "%", referenceRange: "40 - 70", flag: "HIGH" },
      { name: "Absolute Neutrophil Count (ANC)", result: "17,072", unit: "/µL", referenceRange: "2,000 - 7,000", flag: "PANIC_HIGH" },
    ],
  },
  {
    id: "rep-2",
    reportId: "REP-2026-88022",
    accessionNumber: "ACC-88022-02",
    barcode: "BC-8802202",
    patientName: "Smt. Sunita Devi",
    uhid: "UHID-2026-8812",
    age: 54,
    gender: "Female",
    referredByDoctor: "Dr. Rajesh Sharma (Cardiology)",
    testPanelName: "High Sensitivity Cardiac Troponin-I (hs-cTnI) & CK-MB",
    department: "Biochemistry",
    specimenType: "Serum Gel Separator",
    instrumentId: "Roche Cobas e411",
    collectedAt: "08:30 AM",
    analyzedAt: "08:58 AM",
    isPanic: true,
    deltaFlag: false,
    status: "PENDING_PATHOLOGIST",
    parameters: [
      { name: "hs-Troponin I", result: "840.5", unit: "pg/mL", referenceRange: "< 14.0", flag: "PANIC_HIGH", deltaChange: "+800%" },
      { name: "CK-MB Isoenzyme", result: "42.0", unit: "U/L", referenceRange: "< 24.0", flag: "HIGH" },
    ],
  },
  {
    id: "rep-3",
    reportId: "REP-2026-88025",
    accessionNumber: "ACC-88025-01",
    barcode: "BC-8802501",
    patientName: "Shri Rameshwar Patel",
    uhid: "UHID-2026-8815",
    age: 62,
    gender: "Male",
    referredByDoctor: "Dr. Ananya Sen (Endocrinology)",
    testPanelName: "Glycated Hemoglobin (HbA1c) & Fasting Plasma Glucose",
    department: "Biochemistry",
    specimenType: "EDTA & Sodium Fluoride",
    instrumentId: "Bio-Rad D-10 HPLC",
    collectedAt: "08:45 AM",
    analyzedAt: "09:20 AM",
    isPanic: false,
    deltaFlag: true,
    status: "PENDING_PATHOLOGIST",
    parameters: [
      { name: "HbA1c (Glycated Hb)", result: "10.4", unit: "%", referenceRange: "< 5.7", flag: "HIGH", deltaChange: "+1.2%" },
      { name: "Estimated Average Glucose (eAG)", result: "252", unit: "mg/dL", referenceRange: "< 117", flag: "HIGH" },
      { name: "Fasting Plasma Glucose", result: "214", unit: "mg/dL", referenceRange: "70 - 100", flag: "HIGH", deltaChange: "+32" },
    ],
  },
  {
    id: "rep-4",
    reportId: "REP-2026-88031",
    accessionNumber: "ACC-88031-01",
    barcode: "BC-8803101",
    patientName: "Mrs. Meenakshi Sundaram",
    uhid: "UHID-2026-8798",
    age: 49,
    gender: "Female",
    referredByDoctor: "Dr. Rajesh Sharma (Cardiology)",
    testPanelName: "Thyroid Profile Total (T3, T4, TSH Ultra)",
    department: "Biochemistry",
    specimenType: "Serum",
    instrumentId: "Abbott Architect i1000SR",
    collectedAt: "09:00 AM",
    analyzedAt: "09:35 AM",
    isPanic: false,
    deltaFlag: false,
    status: "APPROVED",
    parameters: [
      { name: "Total Triiodothyronine (T3)", result: "1.2", unit: "ng/mL", referenceRange: "0.8 - 2.0", flag: "NORMAL" },
      { name: "Total Thyroxine (T4)", result: "8.4", unit: "µg/dL", referenceRange: "5.1 - 14.1", flag: "NORMAL" },
      { name: "Thyroid Stimulating Hormone (TSH)", result: "2.84", unit: "µIU/mL", referenceRange: "0.35 - 4.94", flag: "NORMAL" },
    ],
    doctorRemarks: "Euthyroid profile. All values within normal biological reference intervals.",
  },
];

export default function DoctorVerificationView() {
  const [reports, setReports] = useState<VerificationReportItem[]>(INITIAL_REPORTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFilter, setFilterFilter] = useState<"ALL" | "PANIC" | "PENDING" | "APPROVED">("ALL");
  const [selectedReportForReview, setSelectedReportForReview] = useState<VerificationReportItem | null>(null);
  const [selectedReportForCallLog, setSelectedReportForCallLog] = useState<VerificationReportItem | null>(null);
  const [callLogs, setCallLogs] = useState<Record<string, CriticalCallLogEntry>>({
    "REP-2026-88022": {
      id: "call-log-init-1",
      reportId: "REP-2026-88022",
      accessionNumber: "ACC-88022-02",
      patientName: "Smt. Sunita Devi",
      uhid: "UHID-2026-8812",
      criticalParameters: "hs-Troponin I: 840.5 pg/mL (PANIC_HIGH)",
      recipientName: "Dr. Rajesh Sharma",
      recipientDesignation: "Chief Interventional Cardiologist",
      recipientPhone: "+91 98231 44512",
      wardOrClinic: "Cardiology Daycare / Emergency Chamber 102",
      callerName: "Dr. Rajiv Nair (Consultant Pathologist)",
      callerRole: "Pathologist On-Duty / Laboratory Director",
      timestamp: "09:02 AM (Today)",
      callOutcome: "INFORMED_READ_BACK_CONFIRMED",
      readBackConfirmed: true,
      clinicalInstructions: "Dr. Sharma informed. Patient shifted to Cath Lab for emergency coronary angiogram.",
    },
  });

  const handleSaveCallLog = (entry: CriticalCallLogEntry) => {
    setCallLogs((prev) => ({
      ...prev,
      [entry.reportId]: entry,
    }));
  };

  const handleSignOff = (reportId: string, remarks: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.reportId === reportId
          ? { ...r, status: "APPROVED", doctorRemarks: remarks }
          : r
      )
    );
    showSuccess(`Report ${reportId} officially signed-off and released with NABL seal.`);
  };

  const handleOrderReRun = (reportId: string, reason: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.reportId === reportId
          ? { ...r, status: "RE_TEST_ORDERED", doctorRemarks: `Re-Test: ${reason}` }
          : r
      )
    );
    showInfo(`Sample Re-Test flagged for Report ${reportId}. Worklist updated.`);
  };

  const panicReports = reports.filter(
    (r) => r.isPanic && r.status === "PENDING_PATHOLOGIST"
  );

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.reportId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.accessionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.testPanelName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterFilter === "ALL"
        ? true
        : filterFilter === "PANIC"
        ? r.isPanic && r.status === "PENDING_PATHOLOGIST"
        : filterFilter === "PENDING"
        ? r.status === "PENDING_PATHOLOGIST"
        : r.status === "APPROVED";

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      
      {/* ── Critical Panic Alerts Banner (Ultra Light Red Medical Alert) ── */}
      {panicReports.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-rose-900 text-sm">
                  {panicReports.length} Critical Panic Diagnostic Alerts Awaiting Pathologist Action
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900 uppercase">
                  STAT Life-Threatening
                </span>
              </div>
              <p className="text-xs text-rose-700 mt-0.5 font-medium">
                Extreme biological outliers require immediate clinical correlation, secondary validation, and telephonic alert to attending doctor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => {
                setSelectedReportForCallLog(panicReports[0]);
              }}
              className="px-3 py-2 rounded-xl border border-rose-300 bg-white hover:bg-rose-100 text-rose-800 font-bold text-xs shadow-2xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
              <span>Record NABL Call Log</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterFilter("PANIC");
                setSelectedReportForReview(panicReports[0]);
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition active:scale-95 whitespace-nowrap cursor-pointer"
            >
              Review STAT Alert Now
            </button>
          </div>
        </div>
      )}

      {/* ── Search & Filter Controls ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search reports by report ID, accession, patient name, UHID, test panel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-xs font-medium placeholder-slate-400 focus:border-sky-600 focus:outline-none bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterFilter === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              All ({reports.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterFilter("PANIC")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                filterFilter === "PANIC"
                  ? "bg-rose-600 text-white"
                  : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Panic ({panicReports.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterFilter("PENDING")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterFilter === "PENDING"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              Pending Sign-Off
            </button>
            <button
              type="button"
              onClick={() => setFilterFilter("APPROVED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterFilter === "APPROVED"
                  ? "bg-teal-600 text-white"
                  : "bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100"
              }`}
            >
              Approved Archive
            </button>
          </div>
        </div>
      </div>

      {/* ── Verification Worklist Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Report & Accession</th>
                <th className="py-3 px-4">Patient Demographics</th>
                <th className="py-3 px-4">Test Panel & Department</th>
                <th className="py-3 px-4">Abnormal / Panic Values</th>
                <th className="py-3 px-4">Analyzer ID</th>
                <th className="py-3 px-4">Sign-Off Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Microscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No reports in this verification filter.</p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => {
                  const isApproved = r.status === "APPROVED";
                  const isReTest = r.status === "RE_TEST_ORDERED";

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        r.isPanic && !isApproved ? "bg-rose-50/30" : ""
                      }`}
                    >
                      {/* Report & Accession */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{r.reportId}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {r.accessionNumber}
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{r.patientName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {r.uhid} • {r.age}y / {r.gender}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Ref: {r.referredByDoctor}
                        </div>
                      </td>

                      {/* Test Panel */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 line-clamp-1">{r.testPanelName}</div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {r.department} • {r.specimenType}
                        </div>
                      </td>

                      {/* Parameters Summary */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          {r.parameters.map((p, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-slate-600 font-medium">{p.name}:</span>
                              <span
                                className={`font-mono font-bold ${
                                  p.flag.includes("PANIC")
                                    ? "text-rose-700 font-black"
                                    : p.flag === "HIGH" || p.flag === "LOW"
                                    ? "text-amber-800"
                                    : "text-slate-700"
                                }`}
                              >
                                {p.result} {p.unit}
                              </span>
                              {p.flag.includes("PANIC") && (
                                <span className="text-[9px] px-1 rounded bg-rose-100 text-rose-800 font-black">
                                  🚨 PANIC
                                </span>
                              )}
                              {p.deltaChange && (
                                <span className="text-[9px] px-1 rounded bg-slate-100 text-slate-700 font-mono">
                                  Δ {p.deltaChange}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Analyzer */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs text-slate-800 font-semibold">{r.instrumentId}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Analyzed: {r.analyzedAt}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                            Signed & Released
                          </span>
                        ) : isReTest ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                            Re-Test Ordered
                          </span>
                        ) : r.isPanic ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                            Pending STAT Sign-Off
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            <Clock className="w-3.5 h-3.5 text-sky-600" />
                            Awaiting Review
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {r.isPanic && (
                            <button
                              type="button"
                              onClick={() => setSelectedReportForCallLog(r)}
                              title={
                                callLogs[r.reportId]
                                  ? `Call logged: ${callLogs[r.reportId].recipientName}`
                                  : "Record Telephonic Alert Call Log"
                              }
                              className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                                callLogs[r.reportId]
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                  : "border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800"
                              }`}
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">
                                {callLogs[r.reportId] ? "Called" : "Call Log"}
                              </span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedReportForReview(r)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition shadow-2xs ${
                              r.isPanic && !isApproved
                                ? "bg-rose-600 hover:bg-rose-700 text-white"
                                : isApproved
                                ? "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700"
                                : "bg-sky-600 hover:bg-sky-700 text-white"
                            }`}
                          >
                            {isApproved ? "View Report" : "Review & Sign"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pathologist Review Modal ── */}
      <PathologistReviewModal
        report={selectedReportForReview}
        isOpen={Boolean(selectedReportForReview)}
        onClose={() => setSelectedReportForReview(null)}
        onSignOff={handleSignOff}
        onOrderReRun={handleOrderReRun}
      />

      {/* ── Critical Panic Alert Call Log Modal (NABL ISO 15189) ── */}
      <CriticalPanicCallLogModal
        isOpen={Boolean(selectedReportForCallLog)}
        onClose={() => setSelectedReportForCallLog(null)}
        report={selectedReportForCallLog}
        onSaveLog={handleSaveCallLog}
      />

    </div>
  );
}
