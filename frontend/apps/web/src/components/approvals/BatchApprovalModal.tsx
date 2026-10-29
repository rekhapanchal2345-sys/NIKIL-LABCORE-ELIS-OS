'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  X,
  FileSignature,
  PhoneCall,
  Loader2,
  Lock,
} from 'lucide-react';

export interface BatchQueueCandidate {
  resultId: string;
  orderNumber: string;
  patientName: string;
  patientUhid: string;
  testName: string;
  triageColor: 'RED' | 'YELLOW' | 'GREEN';
  isCriticalPanic: boolean;
  readBackCompleted: boolean;
  recipientDoctorName?: string;
}

export interface BatchApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedResults?: BatchQueueCandidate[];
  selectedApprovals?: any[];
  defaultDoctorId?: string;
  defaultDoctorName?: string;
  onBatchCompleted?: (summary: any) => void;
  onSuccess?: (approvedCount?: any, skippedCount?: any) => void;
  onOpenPanicReadBackModal?: (candidate: BatchQueueCandidate) => void;
}

export const BatchApprovalModal: React.FC<BatchApprovalModalProps> = ({
  isOpen,
  onClose,
  selectedResults,
  selectedApprovals,
  defaultDoctorId = 'DEFAULT_DOC',
  defaultDoctorName = 'Consultant Pathologist',
  onBatchCompleted,
  onSuccess,
  onOpenPanicReadBackModal,
}) => {
  const [doctorId, setDoctorId] = useState<string>(defaultDoctorId);
  const [clinicalComments, setClinicalComments] = useState<string>(
    'Verified & released under NABL ISO 15189:2022 Pathologist Sign-Off Protocol.'
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [executionReport, setExecutionReport] = useState<any | null>(null);

  const normalizedCandidates: BatchQueueCandidate[] = useMemo(() => {
    if (selectedResults && selectedResults.length > 0) return selectedResults;
    if (selectedApprovals && selectedApprovals.length > 0) {
      return selectedApprovals.map((a: any) => ({
        resultId: a.resultId || a.id || a.result?.id || '',
        orderNumber: a.orderNumber || a.order?.orderNumber || a.orderId || 'ORD-UNKNOWN',
        patientName: a.patientName || (a.patient ? `${a.patient.firstName || ''} ${a.patient.lastName || ''}`.trim() : 'Patient'),
        patientUhid: a.patientUhid || a.patient?.uhid || a.patientId || 'UHID-NA',
        testName: a.testName || a.test?.testName || a.test?.name || 'Diagnostic Test',
        triageColor: a.triageColor || (a.isCritical || a.flag === 'CRITICAL' ? 'RED' : 'GREEN'),
        isCriticalPanic: Boolean(a.isCriticalPanic ?? a.isCritical ?? (a.flag === 'CRITICAL')),
        readBackCompleted: Boolean(a.readBackCompleted ?? a.readBackVerified),
        recipientDoctorName: a.recipientDoctorName,
      }));
    }
    return [];
  }, [selectedResults, selectedApprovals]);

  const { eligibleForApproval, isolatedUnacknowledgedPanics } =
    useMemo(() => {
      const eligible: BatchQueueCandidate[] = [];
      const isolated: BatchQueueCandidate[] = [];
      const ackPanics: BatchQueueCandidate[] = [];

      for (const item of normalizedCandidates) {
        if (item.isCriticalPanic && !item.readBackCompleted) {
          isolated.push(item);
        } else {
          eligible.push(item);
          if (item.isCriticalPanic && item.readBackCompleted) {
            ackPanics.push(item);
          }
        }
      }

      return {
        eligibleForApproval: eligible,
        isolatedUnacknowledgedPanics: isolated,
        acknowledgedPanics: ackPanics,
      };
    }, [normalizedCandidates]);

  if (!isOpen) return null;

  const handleBatchSignOff = async () => {
    if (eligibleForApproval.length === 0) {
      setError(
        'No eligible results to approve. All selected items are unacknowledged critical panic results.'
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      const response = await fetch(`${apiBase}/api/approvals/batch-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          resultIds: normalizedCandidates.map((r) => r.resultId),
          doctorId,
          clinicalComments,
          overridePanicIsolation: false,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Batch approval request failed.');
      }

      setExecutionReport(json.data);
      onBatchCompleted?.(json.data);
      onSuccess?.(json.data?.approvedCount ?? eligibleForApproval.length, json.data?.skippedCount ?? 0);
    } catch (err: any) {
      setError(err.message || 'Unexpected error during batch digital sign-off.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-[#F8FAFC] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#059669]/10 text-[#059669]">
              <FileSignature className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Batch Approval & Electronic Seal Engine
              </h3>
              <p className="text-xs text-[#94A3B8]">
                NABL ISO 15189:2022 Clause 7.4.2 • Critical Panic Isolation Active
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 text-[#94A3B8] hover:bg-gray-100 hover:text-[#0F172A] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="max-h-[72vh] space-y-5 overflow-y-auto p-6">

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-200 bg-[#F8FAFC] p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Total Selected</span>
              <p className="mt-1.5 text-2xl font-black text-[#0F172A]">
                {normalizedCandidates.length}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                Cleared for Sign-Off
              </span>
              <p className="mt-1.5 text-2xl font-black text-[#059669]">
                {eligibleForApproval.length}
              </p>
            </div>
            <div className={`rounded-xl border p-4 ${isolatedUnacknowledgedPanics.length > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-[#F8FAFC]'}`}>
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${isolatedUnacknowledgedPanics.length > 0 ? 'text-red-600' : 'text-[#94A3B8]'}`}>
                Isolated Panics
              </span>
              <p className={`mt-1.5 text-2xl font-black ${isolatedUnacknowledgedPanics.length > 0 ? 'text-[#DC2626]' : 'text-[#0F172A]'}`}>
                {isolatedUnacknowledgedPanics.length}
              </p>
            </div>
          </div>

          {/* Critical Panic Isolation Safeguard Banner */}
          {isolatedUnacknowledgedPanics.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0 text-[#DC2626]" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#DC2626]">
                    NABL Clause 7.4.2: {isolatedUnacknowledgedPanics.length} Critical Panic Result(s) Isolated
                  </h4>
                  <p className="mt-1 text-xs text-red-700">
                    Critical panic values (HH / LL) cannot be batch-approved without a
                    documented telephonic read-back to the ordering physician. These items
                    will be automatically held back while your remaining{' '}
                    <strong>{eligibleForApproval.length}</strong> cleared result(s) are signed.
                  </p>
                  <div className="mt-3 space-y-1.5">
                    {isolatedUnacknowledgedPanics.map((item) => (
                      <div
                        key={item.resultId}
                        className="flex items-center justify-between rounded-lg border border-red-200 bg-white px-3 py-2 text-xs shadow-xs"
                      >
                        <div>
                          <span className="font-bold text-[#0F172A]">{item.patientName}</span>{' '}
                          <span className="text-[#94A3B8] font-mono">({item.orderNumber})</span>{' '}
                          —{' '}
                          <span className="font-semibold text-[#DC2626]">{item.testName}</span>
                        </div>
                        {onOpenPanicReadBackModal && (
                          <button
                            type="button"
                            onClick={() => onOpenPanicReadBackModal(item)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#DC2626] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#B91C1C] transition-colors"
                          >
                            <PhoneCall className="h-3 w-3" />
                            Log Read-Back
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Eligible Results List */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#475569] mb-2">
              Results Ready for Cryptographic Sign-Off ({eligibleForApproval.length})
            </h4>
            <div className="max-h-48 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 bg-white">
              {eligibleForApproval.length === 0 ? (
                <p className="p-4 text-center text-xs text-[#94A3B8]">
                  No results in the current selection are cleared for batch sign-off.
                </p>
              ) : (
                eligibleForApproval.map((item) => (
                  <div
                    key={item.resultId}
                    className="flex items-center justify-between px-4 py-2.5 text-xs hover:bg-[#F8FAFC] transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-[#0F172A]">
                        {item.patientName}
                      </span>{' '}
                      <span className="font-mono text-[#94A3B8]">
                        [{item.orderNumber}]
                      </span>
                      <p className="text-[11px] text-[#94A3B8]">{item.testName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.isCriticalPanic && item.readBackCompleted && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                          Read-Back Verified
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.triageColor === 'RED'
                            ? 'bg-red-100 text-red-700'
                            : item.triageColor === 'YELLOW'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {item.triageColor}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Signing Pathologist & Comments */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Authorizing Pathologist ID
              </label>
              <input
                type="text"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 outline-none transition-colors"
                placeholder="Enter Doctor ID"
              />
              <p className="mt-1 text-[11px] text-[#94A3B8]">
                Signatory: <strong className="text-[#0284C7]">{defaultDoctorName}</strong>
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Batch Sign-Off Clinical Endorsement
              </label>
              <input
                type="text"
                value={clinicalComments}
                onChange={(e) => setClinicalComments(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Success Report */}
          {executionReport && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
              <div className="flex items-center gap-2 font-bold text-[#059669] mb-1">
                <CheckCircle2 className="h-4 w-4" />
                Batch Electronic Seal Complete
              </div>
              <p>
                Approved: <strong>{executionReport.approvedCount}</strong> • Isolated
                Panics: <strong>{executionReport.isolatedPanicCount}</strong> • Signed by:{' '}
                <strong>{executionReport.doctorName}</strong>
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-[#F8FAFC] px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <Lock className="h-3.5 w-3.5 text-[#0284C7]" />
            <span>HMAC-SHA256 Tamper-Evident Seal per Result</span>
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
              disabled={submitting || eligibleForApproval.length === 0}
              onClick={handleBatchSignOff}
              className="inline-flex items-center gap-2 rounded-lg bg-[#059669] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#047857] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing Batch...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Sign & Approve {eligibleForApproval.length} Result(s)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchApprovalModal;
