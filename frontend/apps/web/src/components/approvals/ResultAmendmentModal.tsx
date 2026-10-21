'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  FileEdit,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  X,
  Lock,
  History,
  Loader2,
} from 'lucide-react';

export interface AmendableParameterItem {
  parameterId: string;
  parameterName: string;
  currentValue: string;
  unit: string | null;
  referenceRange: string | null;
  currentFlag: string | null;
}

export interface ResultAmendmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultId: string;
  orderNumber: string;
  patientName: string;
  testName: string;
  defaultDoctorId?: string;
  defaultDoctorName?: string;
  parameters?: AmendableParameterItem[];
  currentValues?: Array<{
    parameterId?: string;
    parameterName: string;
    value?: string;
    currentValue?: string;
    unit?: string | null;
    referenceRange?: string | null;
    flag?: string | null;
    currentFlag?: string | null;
  }>;
  onAmendmentCompleted?: (amendmentRecord: any) => void;
  onSuccess?: (nextVer?: any) => void;
}

const AMENDMENT_CATEGORIES = [
  {
    value: 'ANALYTICAL_RECHECK',
    label: 'Analytical Recheck / Repeat Run Verification',
  },
  {
    value: 'DILUTION_CORRECTION',
    label: 'Automated / Manual Serial Dilution Correction',
  },
  {
    value: 'TRANSCRIPTION_ERROR',
    label: 'Manual Data Entry / Transcription Correction',
  },
  {
    value: 'SAMPLE_INTEGRITY_REVIEW',
    label: 'Recollected / Clarified Specimen Re-Assay',
  },
  {
    value: 'CALIBRATION_DRIFT_CORRECTION',
    label: 'Post-Recalibration Analytical Adjustment',
  },
] as const;

export const ResultAmendmentModal: React.FC<ResultAmendmentModalProps> = ({
  isOpen,
  onClose,
  resultId,
  orderNumber,
  patientName,
  testName,
  defaultDoctorId = 'DEFAULT_DOC',
  defaultDoctorName = 'Consultant Pathologist',
  parameters,
  currentValues,
  onAmendmentCompleted,
  onSuccess,
}) => {
  const normalizedParameters: AmendableParameterItem[] = useMemo(() => {
    if (parameters && parameters.length > 0) return parameters;
    if (currentValues && currentValues.length > 0) {
      return currentValues.map((cv, idx) => ({
        parameterId: cv.parameterId || `param-${idx}`,
        parameterName: cv.parameterName,
        currentValue: String(cv.currentValue ?? cv.value ?? ''),
        unit: cv.unit ?? null,
        referenceRange: cv.referenceRange ?? null,
        currentFlag: cv.currentFlag ?? cv.flag ?? null,
      }));
    }
    return [];
  }, [parameters, currentValues]);

  const [editedValues, setEditedValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const p of normalizedParameters) {
      map[p.parameterName] = p.currentValue;
    }
    return map;
  });

  useEffect(() => {
    if (normalizedParameters.length > 0) {
      setEditedValues((prev) => {
        const next = { ...prev };
        for (const p of normalizedParameters) {
          if (next[p.parameterName] === undefined) {
            next[p.parameterName] = p.currentValue;
          }
        }
        return next;
      });
    }
  }, [normalizedParameters]);

  const [category, setCategory] = useState<string>('ANALYTICAL_RECHECK');
  const [reason, setReason] = useState<string>('');
  const [doctorId, setDoctorId] = useState<string>(defaultDoctorId);
  const [confirmReSeal, setConfirmReSeal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [completedLedger, setCompletedLedger] = useState<any | null>(null);

  if (!isOpen) return null;

  const changedParameters = normalizedParameters.filter(
    (p) =>
      editedValues[p.parameterName] !== undefined &&
      editedValues[p.parameterName].trim() !== p.currentValue.trim()
  );

  const handleExecuteAmendment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (changedParameters.length === 0) {
      setError('Please modify at least one parameter value to issue a formal amendment.');
      return;
    }
    if (reason.trim().length < 10) {
      setError(
        'NABL Clause 7.4.3 requires a clinical justification reason of at least 10 characters.'
      );
      return;
    }
    if (!confirmReSeal) {
      setError(
        'Please confirm the cryptographic re-signing attestation before executing the amendment.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      const response = await fetch(`${apiBase}/api/approvals/${resultId}/amend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          doctorId,
          category,
          reason: reason.trim(),
          parameterUpdates: changedParameters.map((p) => ({
            parameterId: p.parameterId,
            parameterName: p.parameterName,
            newValue: editedValues[p.parameterName].trim(),
            unit: p.unit ?? undefined,
            referenceRange: p.referenceRange ?? undefined,
          })),
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Failed to execute result amendment.');
      }

      setCompletedLedger(json.data);
      onAmendmentCompleted?.(json.data);
      onSuccess?.(json.data?.revisionVersion ?? 2);
    } catch (err: any) {
      setError(err.message || 'Failed to execute post-sign-off amendment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
              <FileEdit className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Post-Sign-Off Result Amendment Ledger (NABL Clause 7.4.3)
              </h3>
              <p className="text-xs text-slate-400">
                Patient: <strong className="text-slate-200">{patientName}</strong> • Order:{' '}
                <span className="font-mono text-amber-300">{orderNumber}</span> •{' '}
                {testName}
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

        {/* Form Body */}
        <form onSubmit={handleExecuteAmendment} className="max-h-[75vh] space-y-5 overflow-y-auto p-6">
          {/* Regulatory Notice */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs text-amber-200">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <strong>Immutable Revision Control:</strong> Previously signed results
              cannot be overwritten silently. Submitting this form records an immutable{' '}
              <code>priorSnapshot → newSnapshot</code> diff and generates a new chained
              HMAC-SHA256 electronic signature.
            </div>
          </div>

          {/* Side-by-Side Parameter Comparison Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Side-by-Side Parameter Value Comparison (Current vs Amended)
            </h4>
            <div className="mt-2 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-900/90 text-[11px] uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Parameter</th>
                    <th className="px-4 py-2.5">Prior Signed Value</th>
                    <th className="px-2 py-2.5 text-center"></th>
                    <th className="px-4 py-2.5">New Amended Value</th>
                    <th className="px-4 py-2.5">Ref. Interval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {normalizedParameters.map((param) => {
                    const newVal = editedValues[param.parameterName] ?? param.currentValue;
                    const isModified = newVal.trim() !== param.currentValue.trim();

                    return (
                      <tr
                        key={param.parameterName}
                        className={isModified ? 'bg-amber-500/10' : ''}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-200">
                          {param.parameterName}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {param.currentValue} {param.unit ?? ''}
                          {param.currentFlag && (
                            <span className="ml-1.5 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                              {param.currentFlag}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <ArrowRight
                            className={`mx-auto h-4 w-4 ${
                              isModified ? 'text-amber-400' : 'text-slate-600'
                            }`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={newVal}
                              onChange={(e) =>
                                setEditedValues((prev) => ({
                                  ...prev,
                                  [param.parameterName]: e.target.value,
                                }))
                              }
                              className={`w-32 rounded-lg border px-2.5 py-1.5 font-mono text-xs focus:outline-none ${
                                isModified
                                  ? 'border-amber-500 bg-amber-950/30 font-bold text-amber-200'
                                  : 'border-slate-700 bg-slate-900 text-slate-200'
                              }`}
                            />
                            <span className="text-slate-400">{param.unit ?? ''}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                          {param.referenceRange ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Amendment Reason & Category */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Amendment Classification Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                {AMENDMENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Authorizing Pathologist ID *
              </label>
              <input
                type="text"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Signatory: <strong className="text-amber-300">{defaultDoctorName}</strong>
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Mandatory Clinical Justification / Root-Cause Reason (Min 10 chars) *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Post-dilution re-assay performed on Cobas c503 due to hyperlipemic sample interference; corrected value verified by repeat run."
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Re-Signing Confirmation Checkbox */}
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs">
            <input
              type="checkbox"
              checked={confirmReSeal}
              onChange={(e) => setConfirmReSeal(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-slate-300">
              I attest that the amended parameter value(s) have been analytically
              verified and authorize generating a new chained{' '}
              <strong>HMAC-SHA256 Digital Signature Seal</strong> superseding the prior
              report version.
            </span>
          </label>

          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {completedLedger && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-xs text-emerald-200">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Amendment Recorded — {completedLedger.revisionLabel}
              </div>
              <p className="mt-1 font-mono text-[11px] text-emerald-300">
                Chained Seal: {completedLedger.chainedHmacSeal.slice(0, 32)}...
              </p>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <History className="h-4 w-4 text-amber-400" />
              <span>{changedParameters.length} parameter(s) modified</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || changedParameters.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Re-Sealing Revision...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Commit Amendment & Re-Sign
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResultAmendmentModal;
