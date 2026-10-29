"use client";

import React, { useState, useEffect } from "react";
import type { Approval } from "./ApprovalTable";
import DeltaCheckViewer from "./DeltaCheckViewer";
import CriticalPanicCallModal from "./CriticalPanicCallModal";
import { approvalApi } from "@/lib/api";

interface ApprovalReviewModalProps {
  approval: Approval | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (approval: Approval) => void;
  onReject: (approval: Approval) => void;
  onRerun: (approval: Approval, reason: string) => void;
}

function FlagBadge({ flag }: { flag?: string }) {
  switch (flag) {
    case "CRITICAL":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
          🚨 Critical
        </span>
      );
    case "HIGH":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
          ▲ High
        </span>
      );
    case "LOW":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          ▼ Low
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Normal
        </span>
      );
  }
}

export default function ApprovalReviewModal({
  approval,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onRerun,
}: ApprovalReviewModalProps) {
  const [activeTab, setActiveTab] = useState<"parameters" | "delta" | "preview">("parameters");
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [rerunReason, setRerunReason] = useState("");
  const [showRerunForm, setShowRerunForm] = useState(false);
  const [clinicalRemarks, setClinicalRemarks] = useState("");
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callLogged, setCallLogged] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!isOpen || !approval?.resultId) return;

    const fetchResultDetails = async () => {
      try {
        setLoading(true);
        const res = await approvalApi.getById(String(approval.resultId));
        if (isMounted && res?.success && res?.data) {
          setDetails(res.data);
          setClinicalRemarks(res.data.remarks || res.data.interpretation || "");
          const hasAck = res.data.criticalAcknowledgments && res.data.criticalAcknowledgments.length > 0;
          setCallLogged(hasAck);
        }
      } catch (err) {
        console.error("Failed to fetch approval details in review modal:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchResultDetails();
    return () => {
      isMounted = false;
    };
  }, [isOpen, approval?.resultId]);

  if (!isOpen || !approval) return null;

  const hasCriticalValues = approval.criticalValues && approval.criticalValues.length > 0;

  const handleApprove = () => {
    if (hasCriticalValues && !callLogged) {
      setIsCallModalOpen(true);
      return;
    }
    onApprove({
      ...approval,
      remarks: clinicalRemarks,
    });
    onClose();
  };

  const handleRerunSubmit = () => {
    if (rerunReason.trim()) {
      onRerun(approval, rerunReason);
      setRerunReason("");
      setShowRerunForm(false);
      onClose();
    }
  };

  const criticalParamList = (details?.values || [])
    .filter((v: any) => v.flag === "CRITICAL")
    .map((v: any) => ({
      name: v.parameter?.parameterName || "Parameter",
      value: v.value,
      unit: v.parameter?.unit || "",
    }));

  const tabs = [
    { key: "parameters", label: `Laboratory Parameters (${details?.values?.length || 0})` },
    { key: "delta", label: "Δ Delta Check & History" },
    { key: "preview", label: "Report Preview" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-200">

          {/* ── Modal Header ── */}
          <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0284C7]/10 text-[#0284C7]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  Review & Authorize Laboratory Report
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-100 text-[#0284C7] border border-sky-200">
                    {approval.orderNumber}
                  </span>
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  {approval.testName} • {approval.testCode || "TEST"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 text-[#94A3B8] hover:bg-gray-100 hover:text-[#0F172A] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Patient Identity Banner ── */}
          <div className="bg-sky-50/60 px-6 py-3 border-b border-sky-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs text-[#475569]">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#0284C7] flex items-center justify-center text-white font-bold text-[10px]">
                  {(approval.patientName || "?").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="font-bold text-sm text-[#0F172A]">{approval.patientName}</span>
                  <span className="text-[#94A3B8] ml-2 font-mono text-[10px]">UHID: {approval.patientUhid || "—"}</span>
                </div>
              </div>
              <span className="text-[#94A3B8]">•</span>
              <span>{approval.patientAge ? `${approval.patientAge} Years` : "—"}</span>
              <span className="text-[#94A3B8]">•</span>
              <span>{approval.patientGender || "—"}</span>
            </div>

            {hasCriticalValues && (
              <div className="flex items-center gap-2">
                {callLogged ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Verbal Call Logged & Certified
                  </span>
                ) : (
                  <button
                    onClick={() => setIsCallModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DC2626] text-white shadow-sm hover:bg-[#B91C1C] transition-colors animate-pulse"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Log Doctor Panic Call
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Tabs Navigation ── */}
          <div className="border-b border-gray-200 px-6 bg-[#F8FAFC] flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors -mb-px ${
                  activeTab === tab.key
                    ? "border-[#0284C7] text-[#0284C7] bg-white"
                    : "border-transparent text-[#94A3B8] hover:text-[#475569] hover:bg-white/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Content Body ── */}
          <div className="p-6 max-h-[55vh] overflow-y-auto space-y-5 bg-white">
            {activeTab === "parameters" && (
              <div className="space-y-4">
                {/* Parameters Table */}
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-100 text-xs">
                    <thead className="bg-[#F8FAFC]">
                      <tr>
                        <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-[#475569]">Test Parameter</th>
                        <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-[#475569]">Measured Value</th>
                        <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-[#475569]">Reference Interval</th>
                        <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-[#475569]">Unit</th>
                        <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-[#475569]">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-[#94A3B8] text-xs">
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0284C7] border-t-transparent" />
                              Loading verified parameters...
                            </div>
                          </td>
                        </tr>
                      ) : (details?.values || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[#94A3B8] text-xs">
                            No parameter results entered.
                          </td>
                        </tr>
                      ) : (
                        details.values.map((v: any) => {
                          const refRange =
                            v.parameter?.referenceRanges?.[0]?.interpretation ||
                            `${v.parameter?.referenceRanges?.[0]?.normalLow ?? ""} - ${v.parameter?.referenceRanges?.[0]?.normalHigh ?? ""}`.trim() ||
                            "Not specified";

                          const isCriticalRow = v.flag === "CRITICAL";
                          const isAbnormalRow = v.flag === "HIGH" || v.flag === "LOW";

                          return (
                            <tr
                              key={v.id}
                              className={`transition-colors ${
                                isCriticalRow
                                  ? "bg-red-50 border-l-4 border-l-[#DC2626]"
                                  : isAbnormalRow
                                    ? "bg-amber-50/40"
                                    : "hover:bg-[#F8FAFC]"
                              }`}
                            >
                              <td className="py-3 px-4 font-semibold text-[#0F172A]">
                                {v.parameter?.parameterName || "Parameter"}
                              </td>
                              <td className={`py-3 px-4 font-bold ${
                                isCriticalRow ? "text-[#DC2626]" : isAbnormalRow ? "text-amber-700" : "text-[#0F172A]"
                              }`}>
                                {v.value}
                              </td>
                              <td className="py-3 px-4 text-[#475569]">{refRange}</td>
                              <td className="py-3 px-4 font-mono text-[#94A3B8]">{v.parameter?.unit || "—"}</td>
                              <td className="py-3 px-4">
                                <FlagBadge flag={v.flag} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Clinical Impression */}
                <div className="rounded-xl border border-gray-200 bg-[#F8FAFC] p-4 space-y-2">
                  <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider">
                    Pathologist Clinical Impression & Comments
                  </label>
                  <textarea
                    rows={2}
                    value={clinicalRemarks}
                    onChange={(e) => setClinicalRemarks(e.target.value)}
                    placeholder="Enter clinical interpretation, specimen notes, or follow-up advice..."
                    className="w-full rounded-lg border border-gray-300 p-3 text-xs bg-white text-[#0F172A] focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {activeTab === "delta" && (
              <DeltaCheckViewer resultId={String(approval.resultId)} />
            )}

            {activeTab === "preview" && (
              <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm space-y-6 font-sans">
                {/* Lab Letterhead */}
                <div className="border-b-2 border-[#0F172A] pb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-black text-[#0F172A] tracking-tight">LabCore Diagnostic Laboratories</h3>
                    <p className="text-xs text-[#475569] mt-0.5">NABL Accredited Laboratory • ISO 15189:2022 Certified</p>
                    <p className="text-[11px] text-[#94A3B8]">123 Healthcare Boulevard, Medical Enclave</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-[#0F172A]">{approval.orderNumber}</span>
                    <p className="text-xs text-[#94A3B8]">Report Status: Final Authorized</p>
                  </div>
                </div>

                {/* Patient / Sample Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-[#F8FAFC] p-4 rounded-xl border border-gray-200">
                  <div className="space-y-1.5">
                    <p><span className="text-[#94A3B8]">Patient:</span> <strong className="text-[#0F172A]">{approval.patientName}</strong></p>
                    <p><span className="text-[#94A3B8]">Age / Gender:</span> <span className="text-[#475569]">{approval.patientAge}Y / {approval.patientGender}</span></p>
                    <p><span className="text-[#94A3B8]">UHID:</span> <span className="font-mono text-[#475569]">{approval.patientUhid || "—"}</span></p>
                  </div>
                  <div className="space-y-1.5">
                    <p><span className="text-[#94A3B8]">Test:</span> <strong className="text-[#0F172A]">{approval.testName}</strong></p>
                    <p><span className="text-[#94A3B8]">Sample Date:</span> <span className="text-[#475569]">{approval.submittedAt ? new Date(approval.submittedAt).toLocaleDateString("en-IN") : "—"}</span></p>
                    <p><span className="text-[#94A3B8]">Referring Dr:</span> <span className="text-[#475569]">{details?.order?.doctor?.fullName || "Self / Routine"}</span></p>
                  </div>
                </div>

                {/* Results Preview Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#475569]">Investigation Findings</h4>
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead>
                      <tr className="border-b-2 border-gray-300 text-[#475569] font-semibold">
                        <th className="py-2 text-left text-[11px] uppercase tracking-wider">Test Description</th>
                        <th className="py-2 text-left text-[11px] uppercase tracking-wider">Result</th>
                        <th className="py-2 text-left text-[11px] uppercase tracking-wider">Units</th>
                        <th className="py-2 text-left text-[11px] uppercase tracking-wider">Reference Interval</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(details?.values || []).map((v: any) => (
                        <tr key={v.id} className="hover:bg-[#F8FAFC]">
                          <td className="py-2 font-medium text-[#0F172A]">{v.parameter?.parameterName}</td>
                          <td className="py-2 font-bold text-[#0F172A]">{v.value}</td>
                          <td className="py-2 font-mono text-[#94A3B8]">{v.parameter?.unit || "—"}</td>
                          <td className="py-2 text-[#475569]">{v.parameter?.referenceRanges?.[0]?.interpretation || "Normal"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Digital Signature Block */}
                <div className="pt-6 border-t border-gray-200 flex items-end justify-between">
                  <div className="text-xs text-[#94A3B8]">
                    <p>*** End of Diagnostic Laboratory Report ***</p>
                    <p className="text-[10px]">Electronically verified with cryptographic digital token.</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-block border border-gray-200 rounded-xl p-4 bg-[#F8FAFC] text-left min-w-[200px]">
                      <p className="text-xs font-bold text-[#0F172A]">Dr. Pathologist, MD (Pathology)</p>
                      <p className="text-[10px] text-[#94A3B8] mt-0.5">Reg No: MCI-58291 • Chief Pathologist</p>
                      <p className="text-[10px] text-[#059669] font-semibold mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Digital Signature Valid
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rerun Form */}
            {showRerunForm && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Request Sample Rerun / Re-test
                </h4>
                <textarea
                  rows={2}
                  value={rerunReason}
                  onChange={(e) => setRerunReason(e.target.value)}
                  placeholder="Specify clinical or technical reason for rerun (e.g. hemolyzed sample, delta check failure, clotted specimen)..."
                  className="w-full rounded-lg border border-amber-300 p-2.5 text-xs bg-white text-[#0F172A] focus:ring-2 focus:ring-amber-200 outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowRerunForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#475569] hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRerunSubmit}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors"
                  >
                    Submit Rerun Request
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer Controls ── */}
          <div className="border-t border-gray-200 bg-[#F8FAFC] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRerunForm(!showRerunForm)}
                className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 shadow-xs transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Request Rerun
              </button>
              <button
                type="button"
                onClick={() => onReject(approval)}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-[#DC2626] hover:bg-red-50 shadow-xs transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all ${
                  hasCriticalValues && !callLogged
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-[#059669] hover:bg-[#047857]"
                }`}
              >
                {hasCriticalValues && !callLogged ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Log Call & Authorize
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Authorize & Digitally Sign Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Verbal Call Logger Modal */}
      {isCallModalOpen && (
        <CriticalPanicCallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          resultId={String(approval.resultId)}
          orderNumber={approval.orderNumber}
          patientName={approval.patientName}
          criticalParameters={criticalParamList}
          onSuccess={() => {
            setCallLogged(true);
            setIsCallModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
