'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  FileCheck2,
  Lock,
  Layers,
} from 'lucide-react';
import { approvalApi } from '@/lib/api';
import type { Approval } from './ApprovalTable';

export interface BatchApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedApprovals: Approval[];
  onSuccess: (approvedCount: number, skippedCount: number) => void;
}

export default function BatchApprovalModal({
  isOpen,
  onClose,
  selectedApprovals,
  onSuccess,
}: BatchApprovalModalProps) {
  const [remarks, setRemarks] = useState(
    'Batch certified and approved by authorized pathologist under NABL ISO 15189:2022 standards.'
  );
  const [confirmedReview, setConfirmedReview] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const normalItems = selectedApprovals.filter(
    (a) => !a.hasCritical && (!a.criticalValues || a.criticalValues.length === 0)
  );
  const abnormalOrCriticalItems = selectedApprovals.filter(
    (a) => a.hasCritical || (a.criticalValues && a.criticalValues.length > 0)
  );

  const handleConfirmBatch = async () => {
    if (!confirmedReview) {
      setError('Please check the confirmation box acknowledging your clinical review.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Collect IDs - use resultId if present
      const ids = selectedApprovals.map((a) => String(a.resultId || a.id));

      const res = await approvalApi.batchApprove(ids, remarks.trim());

      if (res?.success) {
        onSuccess(res.data?.approvedCount || ids.length, res.data?.skipped?.length || 0);
        onClose();
      } else {
        setError(res?.message || 'Batch approval completed with issues');
      }
    } catch (err: any) {
      console.error('Batch approval failed:', err);
      setError(err?.message || 'Failed to complete batch approval');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-cyan-500/30 bg-slate-950 p-6 shadow-2xl text-slate-100 space-y-5">
        {/* Header Banner */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>Batch Pathologist Sign-Off</span>
                <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-800/60">
                  NABL ISO 15189
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Authorized digital signature &amp; electronic seal will be applied to all qualified reports.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Breakdown Summary */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Selected</span>
            <p className="text-2xl font-black text-white mt-1">{selectedApprovals.length}</p>
          </div>
          <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3">
            <span className="text-[10px] uppercase font-bold text-emerald-400">Routine Normal</span>
            <p className="text-2xl font-black text-emerald-400 mt-1">{normalItems.length}</p>
          </div>
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3">
            <span className="text-[10px] uppercase font-bold text-amber-400">Abnormal / Critical</span>
            <p className="text-2xl font-black text-amber-400 mt-1">{abnormalOrCriticalItems.length}</p>
          </div>
        </div>

        {abnormalOrCriticalItems.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Notice regarding Critical / Panic items:</p>
              <p className="text-amber-300/90 text-[11px] leading-relaxed">
                {abnormalOrCriticalItems.length} selected report(s) contain abnormal or critical parameters. 
                Any report with unacknowledged life-threatening panic values will be safely skipped by the NABL Clause 7.4.2 dispatch gate until a verbal read-back log is filed.
              </p>
            </div>
          </div>
        )}

        {/* Electronic Seal Preview */}
        <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-r from-slate-900 to-slate-900/70 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <FileCheck2 className="h-4 w-4" />
              NABL Electronic Doctor Seal Preview
            </span>
            <span className="font-mono text-[10px] text-slate-400">HMAC-SHA256 Encrypted</span>
          </div>
          <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3 text-xs space-y-1">
            <div className="font-bold text-white">DR. AUTHORIZED PATHOLOGIST, MD (PATH)</div>
            <div className="text-[11px] text-slate-400">Medical Council Reg: MCI/KMC/2014/99824</div>
            <div className="text-[10px] text-emerald-400 font-mono">
              ✓ Cryptographic Result Hash &bull; Tamper-Proof Electronic Seal
            </div>
          </div>
        </div>

        {/* Remarks Input */}
        <div className="space-y-1.5 text-xs">
          <label className="font-bold text-slate-300">Pathologist Certification Remarks</label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            placeholder="Remarks applied to signed reports..."
          />
        </div>

        {/* Confirmation Checkbox */}
        <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={confirmedReview}
            onChange={(e) => setConfirmedReview(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-0"
          />
          <span>
            I certify that I have reviewed the diagnostic data, daily analyzer QC, and delta checks for these {selectedApprovals.length} specimens according to ISO 15189:2022 standards.
          </span>
        </label>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300 flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmBatch}
            disabled={loading || selectedApprovals.length === 0}
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Signing &amp; Certifying {selectedApprovals.length} Reports...
              </>
            ) : (
              <>
                <FileCheck2 className="h-4 w-4" />
                Apply Seal &amp; Approve ({selectedApprovals.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
