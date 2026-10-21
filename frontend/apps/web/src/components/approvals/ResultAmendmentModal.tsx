'use client';

import React, { useState } from 'react';
import {
  FileEdit,
  AlertTriangle,
  FileCheck2,
  AlertOctagon,
  History,
  ShieldAlert,
} from 'lucide-react';
import { approvalApi } from '@/lib/api';

export interface ResultValueItem {
  parameterId: string;
  parameterName: string;
  value: string;
  unit?: string;
  flag?: string;
}

export interface ResultAmendmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultId: string;
  orderNumber: string;
  patientName: string;
  testName: string;
  currentValues: ResultValueItem[];
  onSuccess: (versionNumber: number) => void;
}

export default function ResultAmendmentModal({
  isOpen,
  onClose,
  resultId,
  orderNumber,
  patientName,
  testName,
  currentValues,
  onSuccess,
}: ResultAmendmentModalProps) {
  const [amendmentReason, setAmendmentReason] = useState('');
  const [amendmentType, setAmendmentType] = useState<
    'CLINICAL_CORRECTION' | 'SAMPLE_RE_ASSAYED' | 'TRANSCRIPTION_ERROR' | 'DILUTION_FACTOR_CORRECTED' | 'OTHER'
  >('CLINICAL_CORRECTION');

  // Value modifications map: parameterId -> { value, flag }
  const [modifiedValues, setModifiedValues] = useState<Record<string, { value: string; flag: string }>>(() => {
    const initial: Record<string, { value: string; flag: string }> = {};
    currentValues.forEach((v) => {
      initial[v.parameterId] = {
        value: v.value || '',
        flag: v.flag || 'NORMAL',
      };
    });
    return initial;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleValueChange = (parameterId: string, value: string) => {
    setModifiedValues((prev) => ({
      ...prev,
      [parameterId]: {
        ...prev[parameterId],
        value,
      },
    }));
  };

  const handleFlagChange = (parameterId: string, flag: string) => {
    setModifiedValues((prev) => ({
      ...prev,
      [parameterId]: {
        ...prev[parameterId],
        flag,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amendmentReason.trim() || amendmentReason.trim().length < 5) {
      setError('A comprehensive amendment reason (minimum 5 characters) is required under ISO 15189.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        amendmentReason: amendmentReason.trim(),
        amendmentType,
        updatedValues: Object.entries(modifiedValues).map(([parameterId, val]) => ({
          parameterId,
          value: val.value,
          flag: val.flag,
        })),
      };

      const res = await approvalApi.amendResult(resultId, payload);

      if (res?.success) {
        onSuccess(res.data?.versionNumber || 2);
        onClose();
      } else {
        setError(res?.message || 'Failed to apply result amendment');
      }
    } catch (err: any) {
      console.error('Failed to amend result:', err);
      setError(err?.message || 'Error occurred while saving amendment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-2xl border border-amber-500/30 bg-slate-950 p-6 shadow-2xl text-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg">
              <FileEdit className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>Post-Sign-Off Diagnostic Result Amendment</span>
                <span className="rounded-full bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-800/60">
                  NABL ISO 15189 Clause 7.4.1.3
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {orderNumber} &bull; {patientName} &bull; {testName}
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

        {/* NABL Warning Banner */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs text-amber-200 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-300">NABL Clinical Governance Notice:</p>
            <p className="text-amber-200/90 leading-relaxed text-[11px]">
              Amending an approved report creates an immutable version bump, archives the historical raw values snapshot in the laboratory audit ledger, and invalidates prior PDF dispatches. A new cryptographically sealed report will be generated.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason & Type Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-300">Amendment Category</label>
              <select
                value={amendmentType}
                onChange={(e) => setAmendmentType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="CLINICAL_CORRECTION">Clinical Review Correction</option>
                <option value="SAMPLE_RE_ASSAYED">Sample Re-Assayed / Dilution</option>
                <option value="TRANSCRIPTION_ERROR">Transcription / Typo Correction</option>
                <option value="DILUTION_FACTOR_CORRECTED">Dilution Factor Re-Calculated</option>
                <option value="OTHER">Other Clinical Justification</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5 text-xs">
              <label className="font-bold text-slate-300">
                Mandatory Clinical Reason / Justification
              </label>
              <input
                type="text"
                required
                value={amendmentReason}
                onChange={(e) => setAmendmentReason(e.target.value)}
                placeholder="e.g. Specimen re-run with 1:10 dilution due to hook effect..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Parameter Values Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Diagnostic Parameter Corrections
            </h4>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400">
                    <th className="p-3">Biomarker / Analyte</th>
                    <th className="p-3">Prior Value</th>
                    <th className="p-3">Corrected Value</th>
                    <th className="p-3">Clinical Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {currentValues.map((param) => {
                    const currentMod = modifiedValues[param.parameterId] || {
                      value: param.value,
                      flag: param.flag || 'NORMAL',
                    };
                    const isChanged = currentMod.value !== param.value || currentMod.flag !== param.flag;

                    return (
                      <tr key={param.parameterId} className={isChanged ? 'bg-amber-950/20' : ''}>
                        <td className="p-3">
                          <span className="font-bold text-white">{param.parameterName}</span>
                          {param.unit && <span className="text-slate-400 text-[10px] ml-1">({param.unit})</span>}
                        </td>
                        <td className="p-3 font-mono text-slate-400">
                          {param.value} {param.unit}
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={currentMod.value}
                            onChange={(e) => handleValueChange(param.parameterId, e.target.value)}
                            className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={currentMod.flag}
                            onChange={(e) => handleFlagChange(param.parameterId, e.target.value)}
                            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white focus:border-amber-500 focus:outline-none"
                          >
                            <option value="NORMAL">NORMAL</option>
                            <option value="HIGH">HIGH (H)</option>
                            <option value="LOW">LOW (L)</option>
                            <option value="CRITICAL">CRITICAL (PANIC)</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300 flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-600/30 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating Amendment &amp; Re-Signing...
                </>
              ) : (
                <>
                  <FileCheck2 className="h-4 w-4" />
                  Certify Amendment &amp; Re-Sign
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
