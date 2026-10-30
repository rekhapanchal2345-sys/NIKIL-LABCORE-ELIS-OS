'use client';

import React, { useState, useMemo } from 'react';
import {
  FileEdit,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  X,
  History,
  Lock,
  Loader2,
} from 'lucide-react';

export interface EditableParameterInput {
  parameterId?: string;
  parameterName: string;
  currentValue: string;
  unit?: string;
  referenceRange?: string;
  currentFlag?: string;
}

export interface ResultAmendmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultId: string;
  orderNumber: string;
  patientName: string;
  testName: string;
  parameters?: EditableParameterInput[];
  currentValues?: Array<{
    parameterId?: string;
    parameterName: string;
    value: string;
    unit?: string;
    flag?: string;
  }>;
  defaultDoctorId?: string;
  defaultDoctorName?: string;
  onAmendmentSuccess?: (amendmentReport: any) => void;
  onSuccess?: (nextVer: any) => void;
}

const AMENDMENT_CATEGORIES = [
  { value: 'TECHNICAL_CORRECTION', label: 'Technical / Analytical Correction' },
  { value: 'SAMPLE_REPEAT', label: 'Sample Re-assay / Dilution Repeat' },
  { value: 'CLINICAL_INTERPRETATION_UPDATE', label: 'Clinical Interpretation Update' },
  { value: 'TRANSCRIPTION_FIX', label: 'Data Transcription / Entry Correction' },
  { value: 'INSTRUMENT_FLAG_OVERRIDE', label: 'Analyzer Flag Clearance' },
];

export const ResultAmendmentModal: React.FC<ResultAmendmentModalProps> = ({
  isOpen,
  onClose,
  resultId,
  orderNumber,
  patientName,
  testName,
  parameters = [],
  currentValues = [],
  defaultDoctorId = 'DEFAULT_DOC',
  defaultDoctorName = 'Consultant Pathologist',
  onAmendmentSuccess,
  onSuccess,
}) => {
  const normalizedParameters = useMemo(() => {
    const list: EditableParameterInput[] = parameters.length > 0 ? parameters : (currentValues || []).map(cv => ({
      parameterId: cv.parameterId,
      parameterName: cv.parameterName,
      currentValue: cv.value,
      unit: cv.unit,
      currentFlag: cv.flag,
    }));
    return list.map((p) => ({
      parameterId: p.parameterId,
      parameterName: p.parameterName,
      currentValue: String(p.currentValue ?? ''),
      unit: p.unit,
      referenceRange: p.referenceRange,
      currentFlag: p.currentFlag,
    }));
  }, [parameters, currentValues]);

  const [editedValues, setEditedValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const p of normalizedParameters) {
      init[p.parameterName] = p.currentValue;
    }
    return init;
  });

  const [category, setCategory] = useState<string>('TECHNICAL_CORRECTION');
  const [reason, setReason] = useState<string>('');
  const [doctorId, setDoctorId] = useState<string>(defaultDoctorId);
  const [confirmReSeal, setConfirmReSeal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [completedLedger, setCompletedLedger] = useState<any | null>(null);

  if (!isOpen) return null;

  const changedParameters = normalizedParameters.filter(
    (p) => (editedValues[p.parameterName] ?? p.currentValue).trim() !== p.currentValue.trim()
  );

  const handleExecuteAmendment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (changedParameters.length === 0) {
      setError('Please edit at least one parameter value before committing an amendment.');
      return;
    }
    if (!reason || reason.trim().length < 10) {
      setError('A clinical justification of at least 10 characters is mandatory under NABL ISO 15189.');
      return;
    }
    if (!confirmReSeal) {
      setError('You must confirm re-issuing an updated cryptographic digital seal.');
      return;
    }

    setSubmitting(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      const payload = {
        resultId,
        doctorId,
        amendmentReason: reason.trim(),
        amendmentCategory: category,
        modifiedParameters: changedParameters.map((p) => ({
          parameterId: p.parameterId,
          parameterName: p.parameterName,
          oldValue: p.currentValue,
          newValue: editedValues[p.parameterName]?.trim(),
        })),
      };

      const { approvalApi } = await import('@/lib/api');
      const res = await approvalApi.amendResult(payload);
      const ledgerData = res?.data || {
        version: 'v1.1',
        revisionLabel: 'v1.1',
        amendedAt: new Date().toISOString(),
        ...payload,
      };
      setCompletedLedger(ledgerData);
      onAmendmentSuccess?.(ledgerData);
      onSuccess?.(ledgerData?.version || ledgerData?.revisionLabel || 'v1.1');
    } catch (err: any) {
      setError(err.message || 'Unexpected failure while executing result amendment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white text-slate-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-[#F8FAFC] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <FileEdit className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Post-Sign-Off Result Amendment Ledger (NABL Clause 7.4.3)
              </h3>
              <p className="text-xs text-slate-500">
                Patient: <strong className="text-[#0F172A]">{patientName}</strong> • Order:{' '}
                <span className="font-mono text-[#0284C7] font-bold">{orderNumber}</span> •{' '}
                {testName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 text-slate-400 hover:bg-gray-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleExecuteAmendment} className="max-h-[75vh] space-y-5 overflow-y-auto p-6">
          {/* Regulatory Notice */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <strong>Immutable Revision Control:</strong> Previously signed results
              cannot be overwritten silently. Submitting this form records an immutable{' '}
              <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">priorSnapshot → newSnapshot</code> diff and generates a new chained
              HMAC-SHA256 electronic signature.
            </div>
          </div>

          {/* Side-by-Side Parameter Comparison Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Side-by-Side Parameter Value Comparison (Current vs Amended)
            </h4>
            <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-[#F8FAFC] text-[11px] uppercase text-slate-600 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Parameter</th>
                    <th className="px-4 py-2.5">Prior Signed Value</th>
                    <th className="px-2 py-2.5 text-center"></th>
                    <th className="px-4 py-2.5">New Amended Value</th>
                    <th className="px-4 py-2.5">Ref. Interval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {normalizedParameters.map((param) => {
                    const newVal = editedValues[param.parameterName] ?? param.currentValue;
                    const isModified = newVal.trim() !== param.currentValue.trim();

                    return (
                      <tr
                        key={param.parameterName}
                        className={isModified ? 'bg-amber-50/70 font-semibold' : 'hover:bg-gray-50'}
                      >
                        <td className="px-4 py-3 font-semibold text-[#0F172A]">
                          {param.parameterName}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {param.currentValue} {param.unit ?? ''}
                          {param.currentFlag && (
                            <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-slate-700 border border-gray-200 font-bold">
                              {param.currentFlag}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <ArrowRight
                            className={`mx-auto h-4 w-4 ${
                              isModified ? 'text-amber-600 font-bold' : 'text-slate-400'
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
                                  ? 'border-amber-400 bg-amber-50 font-bold text-amber-900 ring-1 ring-amber-300'
                                  : 'border-gray-300 bg-white text-slate-800 focus:border-[#0284C7]'
                              }`}
                            />
                            <span className="text-slate-500">{param.unit ?? ''}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
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
              <label className="block text-xs font-semibold text-slate-700">
                Amendment Classification Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
              >
                {AMENDMENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Authorizing Pathologist ID *
              </label>
              <input
                type="text"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Signatory: <strong className="text-amber-700">{defaultDoctorName}</strong>
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Mandatory Clinical Justification / Root-Cause Reason (Min 10 chars) *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Post-dilution re-assay performed on Cobas c503 due to hyperlipemic sample interference; corrected value verified by repeat run."
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-3 text-xs text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
            />
          </div>

          {/* Re-Signing Confirmation Checkbox */}
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200 bg-[#F8FAFC] p-3.5 text-xs">
            <input
              type="checkbox"
              checked={confirmReSeal}
              onChange={(e) => setConfirmReSeal(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-slate-700">
              I attest that the amended parameter value(s) have been analytically
              verified and authorize generating a new chained{' '}
              <strong className="text-[#0F172A]">HMAC-SHA256 Digital Signature Seal</strong> superseding the prior
              report version.
            </span>
          </label>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {error}
            </div>
          )}

          {completedLedger && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Amendment Recorded — {completedLedger.revisionLabel}
              </div>
              <p className="mt-1 font-mono text-[11px] text-emerald-800">
                Chained Seal: {completedLedger.chainedHmacSeal?.slice(0, 32)}...
              </p>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <History className="h-4 w-4 text-amber-600" />
              <span>{changedParameters.length} parameter(s) modified</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || changedParameters.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Re-Sealing Revision...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Commit Amendment &amp; Re-Sign
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
