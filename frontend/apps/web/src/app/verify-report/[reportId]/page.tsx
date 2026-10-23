// File: frontend/apps/web/src/app/verify-report/[reportId]/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  FileWarning,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  Download,
  ExternalLink,
  Lock,
  Fingerprint,
  FileText,
  User,
  Stethoscope,
  FlaskConical,
  Clock,
  History,
  Award,
  RefreshCw,
  QrCode,
  Building2,
} from 'lucide-react';

interface VerificationParameter {
  id: string;
  parameterName: string;
  loincCode: string;
  resultValue: string;
  unit: string;
  referenceRange: string;
  flag: 'N' | 'L' | 'H' | 'LL' | 'HH';
  isCritical: boolean;
  verifiedAt: string | null;
}

interface VerificationPanel {
  panelName: string;
  department: string;
  parameters: VerificationParameter[];
}

interface VerificationAddendum {
  id: string;
  versionLabel: string;
  reason: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

interface PublicVerificationPayload {
  valid: boolean;
  verificationStatus: 'AUTHENTIC' | 'AMENDED' | 'TAMPERED' | 'REVOKED' | 'NOT_FOUND';
  statusReason: string;
  verifiedAt: string;
  accreditation: {
    standard: string;
    certificateNumber: string;
    body: string;
    clauseCompliance: string;
  };
  cryptography: {
    algorithm: 'HMAC-SHA256';
    reportHashSha256: string | null;
    shortChecksum: string | null;
    hmacTokenPreview: string | null;
    tokenSignatureValid: boolean;
    checksumParityValid: boolean;
    diskIntegrityVerified: boolean;
  };
  report: {
    id: string;
    reportNumber: string;
    orderId: string;
    orderNumber: string;
    barcode: string;
    reportTitle: string;
    status: string;
    version: string;
    isAmended: boolean;
    amendmentCount: number;
    generatedAt: string | null;
    publishedAt: string | null;
    pdfStreamUrl: string;
    pdfDownloadUrl: string;
    verificationUrl: string | null;
  } | null;
  patient: {
    uhid: string;
    fullName: string;
    maskedName: string;
    age: number;
    gender: string;
    maskedPhone: string | null;
  } | null;
  clinicalContext: {
    referringDoctorName: string;
    referringDoctorRegNo: string | null;
    signatoryPathologistName: string;
    signatoryQualification: string;
    signatoryRegNo: string;
    specimenType: string;
    fastingStatus: string;
    orderPriority: string;
  } | null;
  panels: VerificationPanel[];
  addendums: VerificationAddendum[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function PublicReportVerificationPage() {
  const params = useParams<{ reportId: string }>();
  const searchParams = useSearchParams();

  const reportId = params?.reportId || '';
  const token = searchParams?.get('token') || '';
  const checksum = searchParams?.get('checksum') || '';

  const [data, setData] = useState<PublicVerificationPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFullPatientName, setShowFullPatientName] = useState<boolean>(false);

  const fetchVerification = useCallback(async () => {
    if (!reportId) return;
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();
      if (token) query.set('token', token);
      if (checksum) query.set('checksum', checksum);

      const url = `${API_BASE_URL}/api/reports/public/verify/${encodeURIComponent(
        reportId
      )}${query.toString() ? `?${query.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      const json = await response.json();
      if (json?.data) {
        setData(json.data);
      } else {
        setError(json?.message || 'Unable to verify diagnostic report.');
      }
    } catch (err: any) {
      setError(
        err?.message ||
          'Network error communicating with NIKIL-LABCORE Cryptographic Verification Authority.'
      );
    } finally {
      setLoading(false);
    }
  }, [reportId, token, checksum]);

  useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);

  const handleCopy = (value: string, label: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderFlagBadge = (flag: VerificationParameter['flag'], isCritical: boolean) => {
    if (flag === 'HH' || flag === 'LL' || isCritical) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/40">
          <AlertTriangle className="w-3 h-3" />
          {flag} (CRITICAL)
        </span>
      );
    }
    if (flag === 'H') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          ▲ HIGH (H)
        </span>
      );
    }
    if (flag === 'L') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
          ▼ LOW (L)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        NORMAL (N)
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mx-auto mb-5">
            <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">
            Verifying Cryptographic Report Seal...
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            Validating HMAC-SHA256 Digital Signature &amp; SHA-256 Document Checksum against NABL
            ISO 15189:2022 Registry (MC-6184)
          </p>
          <div className="mt-6 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-lg w-full bg-slate-900 border border-rose-500/40 rounded-2xl p-8 text-center shadow-2xl">
          <ShieldAlert className="w-14 h-14 text-rose-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white">Verification Service Unreachable</h1>
          <p className="text-sm text-slate-400 mt-2">{error || 'Unable to load report data.'}</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={fetchVerification}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition"
            >
              Retry Verification
            </button>
            <Link
              href="/verify-report"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
            >
              Manual Lookup
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isAuthentic = data.verificationStatus === 'AUTHENTIC';
  const isAmended = data.verificationStatus === 'AMENDED';
  const isTamperedOrInvalid =
    data.verificationStatus === 'TAMPERED' ||
    data.verificationStatus === 'REVOKED' ||
    data.verificationStatus === 'NOT_FOUND';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Regulatory Authority Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white">
                  NIKIL-LABCORE DIAGNOSTICS &amp; RESEARCH CENTRE
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  <Award className="w-3 h-3" />
                  NABL ISO 15189:2022 • MC-6184
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Public Cryptographic Report Authenticity &amp; Checksum Portal • DPDP Act 2023 Compliant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/verify-report"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              Verify Another Report
            </Link>
            {data.report && data.valid && (
              <a
                href={`${API_BASE_URL}${data.report.pdfStreamUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-lg shadow-teal-600/20 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                View Certified PDF
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* 1. Primary Cryptographic Status Banner */}
        {isAuthentic && (
          <div className="rounded-2xl bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-slate-900 border border-emerald-500/40 p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500 text-slate-950">
                      AUTHENTIC &amp; VERIFIED
                    </span>
                    <span className="text-xs font-mono text-emerald-300/90">
                      {data.accreditation.clauseCompliance}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white mt-1.5">
                    This Diagnostic Report is Cryptographically Authentic
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    {data.statusReason} • Verified at{' '}
                    <span className="font-mono text-emerald-300">
                      {new Date(data.verifiedAt).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>

              {data.report && (
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <a
                    href={`${API_BASE_URL}${data.report.pdfDownloadUrl}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-500/20"
                  >
                    <Download className="w-4 h-4" />
                    Download Certified PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {isAmended && (
          <div className="rounded-2xl bg-gradient-to-r from-amber-950/90 via-yellow-950/70 to-slate-900 border border-amber-500/50 p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                  <FileWarning className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 text-slate-950">
                      AMENDED REPORT • ADDENDUM ATTACHED ({data.report?.version})
                    </span>
                    <span className="text-xs font-mono text-amber-300">
                      NABL ISO 15189:2022 Clause 7.4.1.7
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white mt-1.5">
                    Authentic Report with Official Clinical Addendum(s)
                  </h1>
                  <p className="text-xs sm:text-sm text-amber-100/90 mt-1">
                    This report is cryptographically valid and contains{' '}
                    <strong>{data.addendums.length}</strong> post-publication clinical addendum(s)
                    recorded in accordance with ISO 15189:2022 Clause 7.4.1.7.
                  </p>
                </div>
              </div>

              {data.report && (
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <a
                    href={`${API_BASE_URL}${data.report.pdfDownloadUrl}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-amber-500/20"
                  >
                    <Download className="w-4 h-4" />
                    Download Amended PDF ({data.report.version})
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {isTamperedOrInvalid && (
          <div className="rounded-2xl bg-gradient-to-r from-rose-950/95 via-red-950/80 to-slate-900 border-2 border-rose-500/60 p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-8 h-8 text-rose-400" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500 text-white">
                    {data.verificationStatus === 'NOT_FOUND'
                      ? 'REPORT NOT FOUND'
                      : 'TAMPER DETECTED / SIGNATURE INVALID'}
                  </span>
                  <span className="text-xs font-mono text-rose-300">
                    HMAC-SHA256 Checksum Mismatch
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mt-1.5">
                  Warning: Cryptographic Verification Failed
                </h1>
                <p className="text-xs sm:text-sm text-rose-200/90 mt-1">
                  {data.statusReason} — Do NOT rely on printed values from an unverified document
                  for clinical decision-making. Contact NIKIL-LABCORE Quality Assurance immediately.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Patient, Order & Signatory Metadata Grid */}
        {data.report && data.patient && data.clinicalContext && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient Dossier Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Patient Demographics
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullPatientName((prev) => !prev)}
                  className="text-[11px] text-teal-400 hover:text-teal-300 underline"
                >
                  {showFullPatientName ? 'Mask Name (DPDP)' : 'Reveal Full Name'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Patient Name</span>
                  <span className="font-semibold text-white text-sm">
                    {showFullPatientName ? data.patient.fullName : data.patient.maskedName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">EMPI UHID</span>
                  <span className="font-mono font-bold text-teal-300">{data.patient.uhid}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Age / Biological Sex</span>
                  <span className="font-medium text-slate-200">
                    {data.patient.age} Yrs / {data.patient.gender}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Registered Mobile</span>
                  <span className="font-mono text-slate-300">
                    {data.patient.maskedPhone || 'Protected'}
                  </span>
                </div>
              </div>
            </div>

            {/* Accession & Specimen Metadata Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-teal-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Order &amp; Specimen Registry
                  </h2>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-800 text-teal-300 border border-slate-700">
                  {data.report.version}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Report Number</span>
                  <span className="font-mono font-semibold text-white">
                    {data.report.reportNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Order / Accession No.</span>
                  <span className="font-mono font-semibold text-teal-300">
                    {data.report.orderNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Specimen Matrix</span>
                  <span className="font-medium text-slate-200">
                    {data.clinicalContext.specimenType}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Released Timestamp</span>
                  <span className="font-mono text-slate-300">
                    {data.report.generatedAt
                      ? new Date(data.report.generatedAt).toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Signatory Pathologist & Referring Clinician Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Clinical Sign-Off Authority
                  </h2>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Digital Seal Active
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-500 block">Authorized Signatory Pathologist</span>
                  <span className="font-bold text-white text-sm">
                    {data.clinicalContext.signatoryPathologistName}
                  </span>
                  <span className="block text-slate-400">
                    {data.clinicalContext.signatoryQualification} • Reg:{' '}
                    <span className="font-mono text-teal-300">
                      {data.clinicalContext.signatoryRegNo}
                    </span>
                  </span>
                </div>
                <div className="pt-1 border-t border-slate-800/80">
                  <span className="text-slate-500 block">Referring Clinician</span>
                  <span className="font-medium text-slate-200">
                    {data.clinicalContext.referringDoctorName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. NABL ISO 15189:2022 Clause 7.4.1.7 Addendum History Timeline (if amended) */}
        {data.addendums && data.addendums.length > 0 && (
          <div className="bg-amber-950/20 border border-amber-500/40 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 pb-3">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-base font-bold text-white">
                    NABL ISO 15189:2022 Clause 7.4.1.7 — Official Clinical Addendum History
                  </h2>
                  <p className="text-xs text-amber-200/80">
                    Immutable post-publication amendments recorded with full version lineage and
                    pathologist attribution
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                {data.addendums.length} Addendum(s) Recorded
              </span>
            </div>

            <div className="space-y-3">
              {data.addendums.map((add) => (
                <div
                  key={add.id}
                  className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-400 text-slate-950">
                        {add.versionLabel}
                      </span>
                      <span className="text-xs font-semibold text-amber-300">{add.reason}</span>
                      <span className="text-xs text-slate-400">
                        • Signed by <strong className="text-slate-200">{add.authorName}</strong>
                      </span>
                    </div>
                    <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
                      {add.content}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {new Date(add.createdAt).toLocaleString()}
                    </span>
                    <span className="block text-[10px] font-mono text-slate-500 mt-1">
                      ID: {add.id.slice(0, 12)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Certified Clinical Panel Results Table */}
        {data.panels && data.panels.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">
                  Certified Diagnostic Results Snapshot (CLSI C28-A3 Stratified)
                </h2>
                <p className="text-xs text-slate-400">
                  Values below are cryptographically bound to the SHA-256 report digest at sign-off
                </p>
              </div>
              <span className="text-xs font-mono text-teal-400">
                LOINC International Coding Enabled
              </span>
            </div>

            <div className="divide-y divide-slate-800">
              {data.panels.map((panel, pIdx) => (
                <div key={pIdx} className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-teal-300 uppercase tracking-wider">
                      {panel.panelName}
                    </h3>
                    <span className="text-xs text-slate-400">{panel.department}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          <th className="py-2.5 pr-4">Test Parameter</th>
                          <th className="py-2.5 px-3">LOINC Code</th>
                          <th className="py-2.5 px-3">Observed Value</th>
                          <th className="py-2.5 px-3">Unit</th>
                          <th className="py-2.5 px-3">Biological Reference Interval</th>
                          <th className="py-2.5 pl-3 text-right">Clinical Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
                        {panel.parameters.map((param) => {
                          const isAbnormal = param.flag !== 'N';
                          return (
                            <tr
                              key={param.id}
                              className={
                                param.isCritical
                                  ? 'bg-rose-950/20'
                                  : isAbnormal
                                  ? 'bg-amber-950/10'
                                  : 'hover:bg-slate-800/40'
                              }
                            >
                              <td className="py-3 pr-4 font-medium text-white">
                                {param.parameterName}
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                                  {param.loincCode}
                                </span>
                              </td>
                              <td
                                className={`py-3 px-3 font-mono font-bold ${
                                  param.isCritical
                                    ? 'text-rose-400'
                                    : isAbnormal
                                    ? 'text-amber-300'
                                    : 'text-emerald-300'
                                }`}
                              >
                                {param.resultValue}
                              </td>
                              <td className="py-3 px-3 text-slate-400 font-mono text-xs">
                                {param.unit || '-'}
                              </td>
                              <td className="py-3 px-3 text-slate-300 font-mono text-xs">
                                {param.referenceRange}
                              </td>
                              <td className="py-3 pl-3 text-right">
                                {renderFlagBadge(param.flag, param.isCritical)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Cryptographic Telemetry & SHA-256 Checksum Inspector */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Fingerprint className="w-5 h-5 text-teal-400" />
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Cryptographic Signature &amp; SHA-256 Digest Inspector
                </h2>
                <p className="text-xs text-slate-400">
                  Tamper-evident cryptographic proof verifying document integrity since pathologist
                  release
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-800 text-teal-300 border border-slate-700">
              <Lock className="w-3.5 h-3.5" />
              {data.cryptography.algorithm}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">HMAC-SHA256 Token Signature</span>
                <span className="text-xs font-semibold text-white">
                  {data.cryptography.tokenSignatureValid ? 'Verified Valid' : 'Signature Mismatch'}
                </span>
              </div>
              {data.cryptography.tokenSignatureValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Short Verification Checksum</span>
                <span className="text-xs font-mono font-bold text-teal-300">
                  {data.cryptography.shortChecksum || 'N/A'}
                </span>
              </div>
              {data.cryptography.shortChecksum && (
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(data.cryptography.shortChecksum || '', 'shortChecksum')
                  }
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Copy Short Checksum"
                >
                  {copiedField === 'shortChecksum' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">On-Disk PDF Binary Parity</span>
                <span className="text-xs font-semibold text-white">
                  {data.cryptography.diskIntegrityVerified
                    ? '100% Bitwise Match'
                    : 'Unverified / Altered'}
                </span>
              </div>
              {data.cryptography.diskIntegrityVerified ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>
          </div>

          {data.cryptography.reportHashSha256 && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="overflow-hidden">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  Full SHA-256 Document Hash
                </span>
                <code className="text-xs font-mono text-emerald-300 break-all">
                  {data.cryptography.reportHashSha256}
                </code>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopy(data.cryptography.reportHashSha256 || '', 'sha256')
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 shrink-0 transition"
              >
                {copiedField === 'sha256' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied SHA-256
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Hash
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}