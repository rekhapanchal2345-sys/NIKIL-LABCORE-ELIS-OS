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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30">
              <FileSignature className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Transactional Batch Approval & Electronic Seal Engine
              </h3>
              <p className="text-xs text-slate-400">
                NABL ISO 15189:2022 Clause 7.4.2 • Automatic Critical Panic Isolation Active
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[75vh] space-y-5 overflow-y-auto p-6">
          {/* KPI Summary Boxes */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
              <span className="text-xs text-slate-400">Total Selected</span>
              <p className="mt-1 text-2xl font-bold text-white">
                {normalizedCandidates.length}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
              <span className="text-xs text-emerald-300">
                Cleared for Electronic Seal
              </span>
              <p className="mt-1 text-2xl font-bold text-emerald-400">
                {eligibleForApproval.length}
              </p>
            </div>
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3.5">
              <span className="text-xs text-rose-300">
                Isolated Unacknowledged Panics
              </span>
              <p className="mt-1 text-2xl font-bold text-rose-400">
                {isolatedUnacknowledgedPanics.length}
              </p>
            </div>
          </div>

          {/* Mandatory Panic Isolation Safeguard Banner */}
          {isolatedUnacknowledgedPanics.length > 0 && (
            <div className="rounded-xl border border-rose-500/50 bg-rose-950/30 p-4">
              <div className="flex items-start gap-3">
                <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                    NABL Clause 7.4.2 Safeguard: {isolatedUnacknowledgedPanics.length}{' '}
                    Critical Panic Result(s) Isolated
                  </h4>
                  <p className="mt-1 text-xs text-rose-200/90">
                    Critical panic values (HH / LL) cannot be batch-approved without a
                    documented telephonic read-back to the ordering physician. These items
                    will be automatically held back while your remaining{' '}
                    <strong>{eligibleForApproval.length}</strong> cleared result(s) are signed.
                  </p>
                  <div className="mt-3 space-y-1.5">
                    {isolatedUnacknowledgedPanics.map((item) => (
                      <div
                        key={item.resultId}
                        className="flex items-center justify-between rounded-lg border border-rose-500/30 bg-slate-950/80 px-3 py-2 text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">{item.patientName}</span>{' '}
                          <span className="text-slate-400">({item.orderNumber})</span> —{' '}
                          <span className="font-semibold text-rose-400">{item.testName}</span>
                        </div>
                        {onOpenPanicReadBackModal && (
                          <button
                            type="button"
                            onClick={() => onOpenPanicReadBackModal(item)}
                            className="inline-flex items-center gap-1 rounded-md bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-600"
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Results Ready for Cryptographic Sign-Off ({eligibleForApproval.length})
            </h4>
            <div className="mt-2 max-h-48 divide-y divide-slate-800 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60">
              {eligibleForApproval.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-500">
                  No results in the current selection are cleared for batch sign-off.
                </p>
              ) : (
                eligibleForApproval.map((item) => (
                  <div
                    key={item.resultId}
                    className="flex items-center justify-between px-4 py-2.5 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-100">
                        {item.patientName}
                      </span>{' '}
                      <span className="font-mono text-slate-400">
                        [{item.orderNumber}]
                      </span>
                      <p className="text-[11px] text-slate-400">{item.testName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.isCriticalPanic && item.readBackCompleted && (
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                          Read-Back Verified
                        </span>
                      )}
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          item.triageColor === 'RED'
                            ? 'bg-rose-500/20 text-rose-400'
                            : item.triageColor === 'YELLOW'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-400'
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
              <label className="block text-xs font-semibold text-slate-300">
                Authorizing Pathologist ID
              </label>
              <input
                type="text"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                placeholder="Enter Doctor ID"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Signatory: <strong className="text-cyan-400">{defaultDoctorName}</strong>
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Batch Sign-Off Clinical Endorsement
              </label>
              <input
                type="text"
                value={clinicalComments}
                onChange={(e) => setClinicalComments(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {executionReport && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-xs text-emerald-200">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Batch Electronic Seal Complete
              </div>
              <p className="mt-1">
                Approved: <strong>{executionReport.approvedCount}</strong> • Isolated
                Panics: <strong>{executionReport.isolatedPanicCount}</strong> • Signed by:{' '}
                <strong>{executionReport.doctorName}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Lock className="h-3.5 w-3.5 text-cyan-400" />
            <span>HMAC-SHA256 Tamper-Evident Seal per Result</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Close
            </button>
            <button
              type="button"
              disabled={submitting || eligibleForApproval.length === 0}
              onClick={handleBatchSignOff}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
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
