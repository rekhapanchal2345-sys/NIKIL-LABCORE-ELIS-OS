'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  FileCheck2,
  Loader2,
  RefreshCw,
  X,
  Fingerprint,
} from 'lucide-react';

export interface SignOffParameterItem {
  id: string;
  parameterId: string;
  parameterName: string;
  value: string;
  unit?: string | null;
  referenceRange?: string | null;
  flag?: string | null; // NORMAL, HIGH, LOW, CRITICAL_HIGH, CRITICAL_LOW
}

export interface PathologistSignOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultId: string;
  patientName: string;
  patientUhid: string;
  testName: string;
  sampleBarcode?: string;
  initialInterpretation?: string;
  initialRemarks?: string;
  parameters: SignOffParameterItem[];
  doctorId?: string;
  apiBaseUrl?: string;
  onSignOffSuccess?: (signedData: {
    signatureId: string;
    resultId: string;
    signatureHash: string;
    dataSnapshotHash: string;
    sealSvg: string;
    signedAt: string;
  }) => void;
}

interface VerificationState {
  checked: boolean;
  isAuthentic: boolean;
  tamperDetected: boolean;
  verificationMessage: string;
  signatureHash: string | null;
  signedAt: string | null;
  sealSvg: string | null;
  discrepancies: string[];
}

export const PathologistSignOffModal: React.FC<PathologistSignOffModalProps> = ({
  isOpen,
  onClose,
  resultId,
  patientName,
  patientUhid,
  testName,
  sampleBarcode,
  initialInterpretation = '',
  initialRemarks = '',
  parameters,
  doctorId,
  apiBaseUrl,
  onSignOffSuccess,
}) => {
  const normalizedApiBase = useMemo(() => {
    const raw = (apiBaseUrl || process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
    if (!raw) return '/api';
    if (raw.endsWith('/api')) return raw;
    if (raw.endsWith('/api/v1')) return raw.replace(/\/v1$/, '');
    return `${raw}/api`;
  }, [apiBaseUrl]);

  const [interpretation, setInterpretation] = useState<string>(initialInterpretation);
  const [remarks, setRemarks] = useState<string>(initialRemarks);
  const [certifiedCheckbox, setCertifiedCheckbox] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [verification, setVerification] = useState<VerificationState>({
    checked: false,
    isAuthentic: false,
    tamperDetected: false,
    verificationMessage: 'Checking cryptographic signature state...',
    signatureHash: null,
    signedAt: null,
    sealSvg: null,
    discrepancies: [],
  });
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Categorize parameter counts for Pre-Sign-Off Review Checklist
  const summaryCounts = useMemo(() => {
    let normal = 0;
    let abnormal = 0;
    let critical = 0;

    for (const p of parameters) {
      const flag = (p.flag || 'NORMAL').toUpperCase();
      if (flag === 'CRITICAL_HIGH' || flag === 'CRITICAL_LOW' || flag === 'HH' || flag === 'LL' || flag === 'CRITICAL') {
        critical += 1;
      } else if (flag === 'HIGH' || flag === 'LOW' || flag === 'H' || flag === 'L' || flag === 'ABNORMAL') {
        abnormal += 1;
      } else {
        normal += 1;
      }
    }

    return { normal, abnormal, critical, total: parameters.length };
  }, [parameters]);

  const checkCryptographicStatus = useCallback(async () => {
    if (!resultId) return;
    setIsVerifying(true);
    try {
      const response = await fetch(`${normalizedApiBase}/approvals/${resultId}/verify-signature`);
      if (response.ok) {
        const payload = await response.json();
        const data = payload?.data;
        if (data) {
          setVerification({
            checked: true,
            isAuthentic: Boolean(data.isAuthentic),
            tamperDetected: Boolean(data.tamperDetected),
            verificationMessage: data.verificationMessage || '',
            signatureHash: data.signatureHash || null,
            signedAt: data.signedAt || null,
            sealSvg: data.sealSvg || null,
            discrepancies: Array.isArray(data.discrepancies) ? data.discrepancies : [],
          });
        }
      }
    } catch {
      // Non-blocking status check
    } finally {
      setIsVerifying(false);
    }
  }, [normalizedApiBase, resultId]);

  useEffect(() => {
    if (isOpen && resultId) {
      setInterpretation(initialInterpretation);
      setRemarks(initialRemarks);
      setErrorMsg(null);
      checkCryptographicStatus();
    }
  }, [isOpen, resultId, initialInterpretation, initialRemarks, checkCryptographicStatus]);

  if (!isOpen) return null;

  const handleExecuteSignOff = async () => {
    if (!certifiedCheckbox) {
      setErrorMsg(
        'You must accept the mandatory NABL ISO 15189:2022 clinical certification declaration before signing off.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : '';

      const response = await fetch(`${normalizedApiBase}/approvals/${resultId}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          doctorId,
          meaning: 'APPROVED / CLINICAL CERTIFICATION',
          interpretation,
          remarks,
          comments: remarks,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload?.message || 'Cryptographic sign-off failed.');
      }

      const signedData = payload.data;
      setVerification({
        checked: true,
        isAuthentic: true,
        tamperDetected: false,
        verificationMessage: payload.message || 'Result cryptographically signed and sealed.',
        signatureHash: signedData.signatureHash,
        signedAt: signedData.signedAt,
        sealSvg: signedData.sealSvg,
        discrepancies: [],
      });

      if (onSignOffSuccess) {
        onSignOffSuccess(signedData);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Error executing pathologist digital sign-off.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Top Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-emerald-950 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30">
              <Fingerprint className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                Pathologist Cryptographic Sign-Off &amp; NABL Electronic Seal
              </h2>
              <p className="text-xs text-slate-300">
                Patient: <strong className="text-white">{patientName}</strong> ({patientUhid}) • Test:{' '}
                <strong className="text-emerald-300">{testName}</strong>
                {sampleBarcode ? ` • Barcode: ${sampleBarcode}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Real-Time Cryptographic Tamper Status Banner */}
          <div
            className={`rounded-xl p-4 border flex flex-wrap items-center justify-between gap-4 ${
              verification.tamperDetected
                ? 'bg-red-50 border-red-300 text-red-900'
                : verification.isAuthentic
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-start gap-3">
              {verification.tamperDetected ? (
                <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              ) : verification.isAuthentic ? (
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Lock className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    {verification.tamperDetected
                      ? 'TAMPER DETECTED — CRYPTOGRAPHIC SEAL BROKEN'
                      : verification.isAuthentic
                      ? 'AUTHENTIC — HMAC-SHA256 SEAL VERIFIED'
                      : 'AWAITING PATHOLOGIST DIGITAL SIGNATURE'}
                  </span>
                </div>
                <p className="text-xs mt-0.5 opacity-90">{verification.verificationMessage}</p>
                {verification.tamperDetected && verification.discrepancies.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-xs font-semibold text-red-800 space-y-0.5">
                    {verification.discrepancies.map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={checkCryptographicStatus}
              disabled={isVerifying}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              Verify Integrity
            </button>
          </div>

          {/* Pre-Sign-Off Review Checklist Summary Cards */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              1. Pre-Sign-Off Clinical Parameter Review Checklist
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase text-emerald-700 block">
                    Normal Parameters
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-900">
                    {summaryCounts.normal}
                  </span>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase text-amber-700 block">
                    Abnormal (H / L)
                  </span>
                  <span className="text-2xl font-extrabold text-amber-900">
                    {summaryCounts.abnormal}
                  </span>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50/60 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase text-red-700 block">
                    Critical Panic (HH / LL)
                  </span>
                  <span className="text-2xl font-extrabold text-red-900">
                    {summaryCounts.critical}
                  </span>
                </div>
                <AlertOctagon className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Parameter Table Snapshot */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-4 font-bold">Parameter</th>
                  <th className="py-2.5 px-4 font-bold">Result Value</th>
                  <th className="py-2.5 px-4 font-bold">Unit</th>
                  <th className="py-2.5 px-4 font-bold">Reference Interval</th>
                  <th className="py-2.5 px-4 font-bold">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {parameters.map((param) => {
                  const flag = (param.flag || 'NORMAL').toUpperCase();
                  const isPanic = flag.includes('CRITICAL') || flag === 'HH' || flag === 'LL';
                  const isAbn = !isPanic && flag !== 'NORMAL';

                  return (
                    <tr
                      key={param.id || param.parameterId}
                      className={isPanic ? 'bg-red-50/50' : isAbn ? 'bg-amber-50/40' : 'bg-white'}
                    >
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {param.parameterName}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                        {param.value}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{param.unit || '-'}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">
                        {param.referenceRange || '-'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isPanic
                              ? 'bg-red-600 text-white'
                              : isAbn
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {flag}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Clinical Interpretation & Pathologist Remarks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Clinical Interpretation (Included in Canonical Hash)
              </label>
              <textarea
                rows={3}
                value={interpretation}
                onChange={(e) => setInterpretation(e.target.value)}
                placeholder="Enter clinical correlation or diagnostic impression..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pathologist Verification Remarks / Notes
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter internal/report sign-off remarks..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Rendered NABL Electronic Doctor Seal (if already signed) */}
          {verification.sealSvg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 flex flex-col items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
                Active NABL ISO 15189:2022 Cryptographic Electronic Seal
              </span>
              <div
                className="overflow-x-auto max-w-full"
                dangerouslySetInnerHTML={{ __html: verification.sealSvg }}
              />
            </div>
          )}

          {/* Mandatory NABL ISO 15189:2022 Certification Checkbox */}
          <label className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/70 border border-blue-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={certifiedCheckbox}
              onChange={(e) => setCertifiedCheckbox(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-blue-400 text-blue-700 focus:ring-blue-600"
            />
            <div className="text-xs text-slate-800 leading-relaxed">
              <span className="font-bold text-slate-900">
                I hereby certify under NABL ISO 15189:2022 norms that I have reviewed and verified
                these test results.
              </span>{' '}
              I understand that this action applies my legally binding electronic signature under{' '}
              <strong>FDA 21 CFR Part 11</strong> &amp; <strong>India IT Act 2000 (Section 4 &amp; 5)</strong>{' '}
              and locks the parameter snapshot with a tamper-evident SHA-256 HMAC seal.
            </div>
          </label>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecuteSignOff}
            disabled={isSubmitting || !certifiedCheckbox}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-700 to-emerald-600 hover:from-blue-800 hover:to-emerald-700 disabled:opacity-50 shadow-md transition"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Applying HMAC-SHA256 Seal...
              </>
            ) : (
              <>
                <FileCheck2 className="w-4 h-4" />
                Certify &amp; Digitally Sign Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PathologistSignOffModal;
