"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { Approval } from "./ApprovalTable";
import DeltaCheckViewer from "./DeltaCheckViewer";
import CriticalPanicCallModal from "./CriticalPanicCallModal";
import LeveyJenningsChart from "../qc/LeveyJenningsChart";
import { approvalApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { getRoleLabel } from "@/lib/auth";
import { Stethoscope, ShieldCheck, AlertOctagon, CheckCircle2, RefreshCw } from "lucide-react";

interface DoctorWorkstationViewProps {
  approvals: Approval[];
  loading?: boolean;
  onApprove: (approval: Approval) => void;
  onReject: (approval: Approval) => void;
  /** Opens the page-level "return for rerun" reason dialog. */
  onRequestRerun: (approval: Approval) => void;
  onRefresh: () => void;
}

export default function DoctorWorkstationView({
  approvals,
  loading = false,
  onApprove,
  onReject,
  onRequestRerun,
  onRefresh,
}: DoctorWorkstationViewProps) {
  const { user } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedDetails, setSelectedDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [showQcModal, setShowQcModal] = useState(false);
  const [clinicalRemarks, setClinicalRemarks] = useState("");
  const [callLogged, setCallLogged] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "critical" | "abnormal" | "normal">("all");

  const currentApproval = approvals[selectedIndex] || null;

  // Fetch full details when selectedApproval changes
  useEffect(() => {
    let isMounted = true;
    if (!currentApproval?.resultId) {
      setSelectedDetails(null);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoadingDetails(true);
        const res = await approvalApi.getById(String(currentApproval.resultId));
        if (isMounted && res?.success && res?.data) {
          setSelectedDetails(res.data);
          setClinicalRemarks(res.data.remarks || res.data.interpretation || "");
          const hasAck = res.data.criticalAcknowledgments && res.data.criticalAcknowledgments.length > 0;
          setCallLogged(hasAck);
        }
      } catch (err) {
        console.error("Failed to load details for workstation:", err);
      } finally {
        if (isMounted) setLoadingDetails(false);
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [currentApproval?.resultId]);

  // Keyboard navigation shortcuts ([J] Next, [K] Prev, [A] Approve)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "j" || e.key === "ArrowDown") {
        setSelectedIndex((prev) => Math.min(approvals.length - 1, prev + 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [approvals.length]);

  const filteredApprovals = approvals.filter((app) => {
    if (filterMode === "critical") return app.criticalValues && app.criticalValues.length > 0;
    if (filterMode === "abnormal") return (app.abnormalCount || 0) > 0;
    if (filterMode === "normal") return !app.abnormalCount || app.abnormalCount === 0;
    return true;
  });

  const hasCritical = currentApproval?.criticalValues && currentApproval.criticalValues.length > 0;

  const handleApplyMacro = (macroText: string) => {
    setClinicalRemarks((prev) =>
      prev ? `${prev.trim()}. ${macroText}` : macroText
    );
  };

  const handleApproveWithRemarks = async () => {
    if (!currentApproval) return;
    if (hasCritical && !callLogged) {
      setIsCallModalOpen(true);
      return;
    }
    onApprove({
      ...currentApproval,
      remarks: clinicalRemarks,
    });
  };

  const criticalParamList = (selectedDetails?.values || [])
    .filter((v: any) => v.flag === "CRITICAL")
    .map((v: any) => ({
      name: v.parameter?.parameterName || "Parameter",
      value: v.value,
      unit: v.parameter?.unit || "",
    }));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col h-[820px]">
      {/* Top Workstation Control Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-[#F8FAFC] px-6 py-3 text-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-[#0F766E] border border-teal-200 font-bold shadow-xs">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide flex items-center gap-2 text-[#0F172A]">
              Pathologist Diagnostic Workstation
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
                Split-View Mode
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Keyboard: <kbd className="px-1 py-0.2 bg-white rounded border border-gray-300 font-mono text-slate-700">↓ / J</kbd> Next • <kbd className="px-1 py-0.2 bg-white rounded border border-gray-300 font-mono text-slate-700">↑ / K</kbd> Previous
            </p>
          </div>
        </div>

        {/* Filter Tabs in Workstation */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
              filterMode === "all" ? "bg-white text-[#0284C7] shadow-xs border border-gray-200" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All ({approvals.length})
          </button>
          <button
            onClick={() => setFilterMode("critical")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              filterMode === "critical"
                ? "bg-[#DC2626] text-white shadow-xs"
                : "text-slate-600 hover:text-red-700"
            }`}
          >
            <span>Critical</span>
            {approvals.filter((a) => (a.criticalValues?.length || 0) > 0).length > 0 && (
              <span className="px-1.5 py-0.2 bg-white/20 text-white text-[10px] rounded-full font-bold">
                {approvals.filter((a) => (a.criticalValues?.length || 0) > 0).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilterMode("abnormal")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
              filterMode === "abnormal" ? "bg-[#D97706] text-white shadow-xs" : "text-slate-600 hover:text-amber-800"
            }`}
          >
            Abnormal
          </button>
          <button
            onClick={() => setFilterMode("normal")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
              filterMode === "normal" ? "bg-[#059669] text-white shadow-xs" : "text-slate-600 hover:text-emerald-800"
            }`}
          >
            Normal
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-12 flex-1 overflow-hidden">
        {/* Left Column: Queue List (35%) */}
        <div className="col-span-12 md:col-span-4 border-r border-gray-200 bg-[#F8FAFC] flex flex-col h-full overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-white flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Verification Queue ({filteredApprovals.length})
            </span>
            <button
              onClick={onRefresh}
              className="text-xs text-[#0284C7] font-semibold hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2 space-y-1.5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 rounded-xl bg-white border border-gray-200 animate-pulse space-y-2">
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                  <div className="h-3 w-40 bg-gray-100 rounded" />
                </div>
              ))
            ) : filteredApprovals.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="text-xs font-medium">No results matching filter</p>
              </div>
            ) : (
              filteredApprovals.map((app, index) => {
                const isSelected = approvals[selectedIndex]?.id === app.id;
                const isCritical = (app.criticalValues?.length || 0) > 0;
                const isAbnormal = (app.abnormalCount || 0) > 0;

                return (
                  <div
                    key={app.id}
                    onClick={() => {
                      const origIndex = approvals.findIndex((a) => a.id === app.id);
                      if (origIndex !== -1) setSelectedIndex(origIndex);
                    }}
                    className={`cursor-pointer rounded-xl p-3 border transition-all duration-150 ${
                      isSelected
                        ? "border-[#0284C7] bg-sky-50/70 shadow-xs ring-1 ring-[#0284C7]"
                        : isCritical
                        ? "border-red-200 bg-red-50/40 hover:bg-red-50/80"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#0F172A] font-mono">
                            {app.orderNumber}
                          </span>
                          {isCritical ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-[#DC2626] border border-red-200">
                              CRITICAL
                            </span>
                          ) : isAbnormal ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              {app.abnormalCount} Abnormal
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Normal
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-800 mt-1 truncate">
                          {app.patientName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {app.patientUhid || "No UHID"} • {app.patientAge ? `${app.patientAge}Y` : ""} {app.patientGender}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {app.submittedAt
                            ? new Date(app.submittedAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                        <span className="text-[11px] font-semibold text-[#0284C7] block mt-1 truncate max-w-[110px]">
                          {app.testName}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Review & Diagnostic Workstation (65%) */}
        <div className="col-span-12 md:col-span-8 bg-white flex flex-col h-full overflow-hidden">
          {currentApproval ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Header Details Card */}
              <div className="rounded-2xl border border-gray-200 bg-[#F8FAFC] p-4 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-[#0F172A]">
                        {currentApproval.testName}
                      </h3>
                      <span className="rounded-md bg-white border border-gray-200 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600">
                        {currentApproval.testCode || "TEST"}
                      </span>
                      <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-[#0284C7]">
                        {currentApproval.status || "Pending"}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span><strong>Patient:</strong> {currentApproval.patientName}</span>
                      <span>•</span>
                      <span><strong>UHID:</strong> <span className="font-mono">{currentApproval.patientUhid || "—"}</span></span>
                      <span>•</span>
                      <span><strong>Demographics:</strong> {currentApproval.patientAge}Y / {currentApproval.patientGender}</span>
                      <span>•</span>
                      <span><strong>Order:</strong> <span className="font-mono font-bold text-[#0F172A]">{currentApproval.orderNumber}</span></span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Submitted By</span>
                    <span className="text-xs font-bold text-[#0F172A] block">
                      {currentApproval.submittedBy || "—"}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      {currentApproval.submittedAt
                        ? new Date(currentApproval.submittedAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Critical Alert Protocol Strip (if critical values exist) */}
              {hasCritical && (
                <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4 shadow-xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DC2626] text-white text-xs font-bold">
                      !
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-red-950 flex items-center gap-2">
                        Life-Threatening Critical Panic Value Detected
                        {callLogged ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Verbal Call Logged & Certified
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-200 text-red-900 border border-red-300">
                            Action Required: Doctor Verbal Notification
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-red-800 mt-0.5">
                        {currentApproval.criticalValues?.join(", ")} exceeds emergency panic limits. Verbal read-back required before releasing.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsCallModalOpen(true)}
                    className="rounded-xl bg-[#DC2626] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#B91C1C] transition-colors whitespace-nowrap flex items-center gap-1.5"
                  >
                    <span>{callLogged ? "View call-back log" : "Log call-back"}</span>
                  </button>
                </div>
              )}

              {/* Real Parameters Table */}
              <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                <div className="bg-[#F8FAFC] px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Laboratory Result Parameters ({selectedDetails?.values?.length || 0})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {selectedDetails?.test?.method ? `Method: ${selectedDetails.test.method}` : ""}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-[#F8FAFC] text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4 text-left">Test Parameter</th>
                        <th className="py-2.5 px-4 text-left">Observed Value</th>
                        <th className="py-2.5 px-4 text-left">Biological Reference Interval</th>
                        <th className="py-2.5 px-4 text-left">Unit</th>
                        <th className="py-2.5 px-4 text-left">Status Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white font-medium">
                      {loadingDetails ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            Loading verified parameters...
                          </td>
                        </tr>
                      ) : (selectedDetails?.values || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            No parameter values entered yet.
                          </td>
                        </tr>
                      ) : (
                        selectedDetails.values.map((v: any) => {
                          const isCrit = v.flag === "CRITICAL";
                          const isHigh = v.flag === "HIGH";
                          const isLow = v.flag === "LOW";

                          const refRange =
                            v.parameter?.referenceRanges?.[0]?.interpretation ||
                            `${v.parameter?.referenceRanges?.[0]?.normalLow ?? ""} - ${v.parameter?.referenceRanges?.[0]?.normalHigh ?? ""}`.trim() ||
                            "Not specified";

                          return (
                            <tr
                              key={v.id}
                              className={`transition-colors ${
                                isCrit
                                  ? "bg-red-50/70 font-bold"
                                  : isHigh || isLow
                                  ? "bg-amber-50/50"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <td className="py-3 px-4 text-[#0F172A] font-semibold">
                                {v.parameter?.parameterName || "Parameter"}
                              </td>
                              <td className={`py-3 px-4 text-sm font-bold ${isCrit ? "text-[#DC2626]" : isHigh || isLow ? "text-amber-800" : "text-[#0F172A]"}`}>
                                {v.value}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {refRange}
                              </td>
                              <td className="py-3 px-4 text-slate-500 font-mono">
                                {v.parameter?.unit || "—"}
                              </td>
                              <td className="py-3 px-4">
                                {isCrit ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DC2626] text-white shadow-xs">
                                    CRITICAL
                                  </span>
                                ) : isHigh ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                                    ▲ HIGH
                                  </span>
                                ) : isLow ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    ▼ LOW
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    NORMAL
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Delta Check & Trend Section */}
              <DeltaCheckViewer resultId={String(currentApproval.resultId)} />

              {/* Clinical Interpretation & Macros Builder */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Pathologist Impression & Clinical Remarks
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Will be imprinted on final patient report
                  </span>
                </div>

                {/* Macro Preset Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] text-slate-500 self-center font-medium mr-1">Quick Macros:</span>
                  {[
                    "Normal complete report with biological reference limits.",
                    "Microcytic hypochromic red cell picture observed.",
                    "Suboptimal glycemic control; correlate with HbA1c.",
                    "Platelet clumps noted on smear; fresh EDTA sample advised.",
                    "Advise clinical correlation and follow-up after 48 hours.",
                  ].map((macro, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyMacro(macro)}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50 transition-colors"
                    >
                      + {macro.slice(0, 32)}...
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={clinicalRemarks}
                  onChange={(e) => setClinicalRemarks(e.target.value)}
                  placeholder="Enter custom clinical impression, microscopy remarks, or consultation recommendations..."
                  className="w-full rounded-xl border border-gray-300 p-3 text-xs focus:border-[#0284C7] focus:ring-2 focus:ring-sky-100 outline-none text-[#0F172A]"
                />
              </div>

              {/* Pathologist Digital Signature Preview */}
              <div className="rounded-xl border border-dashed border-gray-300 bg-[#F8FAFC] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200 font-bold flex items-center justify-center text-sm shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#0F172A]">
                      Authorizing signatory: {user?.fullName || "Signed-in user"}
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      {getRoleLabel(user?.role, "Pathologist")} • Signing applies your registered electronic seal
                    </p>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Electronic seal</span>
                  <p className="text-[10px] text-slate-400">Applied when the report is authorized</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">Select an item from the queue</p>
                <p className="text-xs text-slate-400 mt-1">
                  Choose a verified result from the left pane to review parameters and authorize.
                </p>
              </div>
            </div>
          )}

          {/* Fixed Action Footer */}
          {currentApproval && (
            <div className="p-4 border-t border-gray-200 bg-[#F8FAFC] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRequestRerun(currentApproval)}
                  className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50 shadow-xs transition-colors"
                >
                  Return for rerun
                </button>
                <button
                  onClick={() => onReject(currentApproval)}
                  className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-[#DC2626] hover:bg-red-50 shadow-xs transition-colors"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => setShowQcModal(true)}
                  className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-bold text-[#0F766E] hover:bg-teal-100 shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>QC chart</span>
                </button>
                <Link
                  href={`/approvals/${currentApproval.id}`}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-gray-100 shadow-xs transition-colors"
                >
                  Full report view
                </Link>
              </div>

              <div className="flex items-center gap-3">
                {hasCritical && !callLogged && (
                  <span className="text-xs font-bold text-[#DC2626] flex items-center gap-1">
                    Call-back log required before approval
                  </span>
                )}
                <button
                  onClick={handleApproveWithRemarks}
                  className={`rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-all flex items-center gap-2 ${
                    hasCritical && !callLogged
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-[#059669] hover:bg-[#047857]"
                  }`}
                >
                  <span>
                    {hasCritical && !callLogged ? "Log call-back & authorize" : "Authorize & sign report"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Critical Verbal Call Logger Modal */}
      {isCallModalOpen && currentApproval && (
        <CriticalPanicCallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          resultId={String(currentApproval.resultId)}
          orderNumber={currentApproval.orderNumber}
          patientName={currentApproval.patientName}
          criticalParameters={criticalParamList}
          onSuccess={() => {
            setCallLogged(true);
            setIsCallModalOpen(false);
          }}
        />
      )}

      {/* Levey-Jennings QC Modal */}
      {showQcModal && currentApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <LeveyJenningsChart
              approvalId={String(currentApproval.resultId)}
              testCode={currentApproval.testName || "K"}
              onClose={() => setShowQcModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
