// File: frontend/apps/web/src/components/reports/ReportPdfPreviewModal.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Printer,
  Download,
  Copy,
  Check,
  FileText,
  Code2,
  ShieldCheck,
  FilePlus2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  History,
} from 'lucide-react';

export interface ReportPdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber?: string;
  reportId?: string;
  reportNumber?: string;
  patientName?: string;
  uhid?: string;
  patientUhid?: string;
  shortChecksum?: string;
  verificationUrl?: string;
  signingPathologist?: {
    fullName: string;
    registrationNumber?: string;
    specialization?: string;
    signedAt?: string;
  };
  nablCertificateNumber?: string;
  apiBaseUrl?: string;
  onAddendumCreated?: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const ReportPdfPreviewModal: React.FC<ReportPdfPreviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  reportId,
  reportNumber,
  patientName,
  uhid,
  patientUhid,
  shortChecksum: initialChecksum,
  verificationUrl: initialVerificationUrl,
  onAddendumCreated,
}) => {
  const effectiveUhid = uhid || patientUhid;
  const effectiveReportNumber = reportNumber || (orderNumber ? `Order #${orderNumber}` : undefined);

  const [viewMode, setViewMode] = useState<'PDF_STREAM' | 'INTERACTIVE_HTML'>('PDF_STREAM');
  const [zoom, setZoom] = useState<number>(100);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loadingHtml, setLoadingHtml] = useState<boolean>(false);
  const [regenerating, setRegenerating] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [resolvedReportId, setResolvedReportId] = useState<string>(reportId || '');
  const [shortChecksum, setShortChecksum] = useState<string>(initialChecksum || '');
  const [verificationUrl, setVerificationUrl] = useState<string>(initialVerificationUrl || '');
  const [versionLabel, setVersionLabel] = useState<string>('v1.0');
  const [cacheBuster, setCacheBuster] = useState<number>(Date.now());

  // Inline NABL ISO 15189:2022 Addendum Drawer State
  const [showAddendumDrawer, setShowAddendumDrawer] = useState<boolean>(false);
  const [addendumReason, setAddendumReason] = useState<string>(
    'Post-Analytical Clinical Correlation / Pathologist Comment'
  );
  const [addendumContent, setAddendumContent] = useState<string>('');
  const [submittingAddendum, setSubmittingAddendum] = useState<boolean>(false);
  const [addendumError, setAddendumError] = useState<string | null>(null);
  const [addendumSuccess, setAddendumSuccess] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const pdfFileUrl = `${API_BASE_URL}/api/reports/order/${encodeURIComponent(
    orderId
  )}/file?t=${cacheBuster}#zoom=${zoom}`;
  const pdfDownloadUrl = `${API_BASE_URL}/api/reports/order/${encodeURIComponent(
    orderId
  )}/file?download=1`;

  // Fetch report metadata to populate reportId, checksum, verificationUrl & version
  const fetchReportMetadata = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/reports/order/${encodeURIComponent(orderId)}`,
        { cache: 'no-store' }
      );
      if (!res.ok) return;
      const json = await res.json();
      const rep = json?.data;
      if (rep) {
        if (rep.id && !String(rep.id).startsWith('DRAFT-')) {
          setResolvedReportId(rep.id);
        }
        const rData = rep.reportData || {};
        if (rData.shortChecksum) setShortChecksum(rData.shortChecksum);
        if (rData.verificationUrl) setVerificationUrl(rData.verificationUrl);
        if (Array.isArray(rep.addendums) && rep.addendums.length > 0) {
          setVersionLabel(`v1.${rep.addendums.length}`);
        } else if (rData.version) {
          setVersionLabel(rData.version);
        }
      }
    } catch {
      // Non-fatal metadata fetch
    }
  }, [orderId]);

  const fetchInteractiveHtml = useCallback(async () => {
    if (!orderId) return;
    setLoadingHtml(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/reports/order/${encodeURIComponent(orderId)}/pdf?format=html&t=${cacheBuster}`
      );
      const text = await res.text();
      setHtmlContent(text);
    } catch {
      setHtmlContent('<div style="padding:24px;color:#ef4444;">Failed to load HTML preview.</div>');
    } finally {
      setLoadingHtml(false);
    }
  }, [orderId, cacheBuster]);

  useEffect(() => {
    if (isOpen) {
      fetchReportMetadata();
      if (viewMode === 'INTERACTIVE_HTML') {
        fetchInteractiveHtml();
      }
    }
  }, [isOpen, viewMode, fetchReportMetadata, fetchInteractiveHtml]);

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 25));
  const handleZoomOut = () => setZoom((z) => Math.max(50, z - 25));
  const handleZoomReset = () => setZoom(100);
  const handleFitWidth = () => setZoom(125);

  const handleSilentPrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } else {
      window.open(pdfFileUrl, '_blank');
    }
  };

  const handleForceRegenerate = async () => {
    setRegenerating(true);
    try {
      await fetch(
        `${API_BASE_URL}/api/reports/order/${encodeURIComponent(orderId)}/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ forceRegenerate: true }),
        }
      );
      setCacheBuster(Date.now());
      await fetchReportMetadata();
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopyVerificationUrl = () => {
    const targetUrl =
      verificationUrl ||
      `${window.location.origin}/verify-report/${resolvedReportId || orderId}${
        shortChecksum ? `?checksum=${shortChecksum}` : ''
      }`;
    navigator.clipboard.writeText(targetUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCreateAddendum = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddendumError(null);
    setAddendumSuccess(null);
    setSubmittingAddendum(true);

    try {
      const targetId = resolvedReportId || orderId;
      const response = await fetch(
        `${API_BASE_URL}/api/reports/${encodeURIComponent(targetId)}/addendum`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: addendumReason,
            content: addendumContent,
            authorId: 'PATHOLOGIST-SIGNATORY',
            authorName: 'Dr. Chief Consultant Pathologist, MD',
          }),
        }
      );

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Failed to record clinical addendum.');
      }

      setAddendumSuccess(
        `Addendum ${json.data?.addendum?.versionLabel || ''} recorded & PDF regenerated!`
      );
      setAddendumContent('');
      setCacheBuster(Date.now());
      await fetchReportMetadata();
      if (onAddendumCreated) onAddendumCreated();
      setTimeout(() => {
        setShowAddendumDrawer(false);
        setAddendumSuccess(null);
      }, 1400);
    } catch (err: any) {
      setAddendumError(err?.message || 'Error recording clinical addendum');
    } finally {
      setSubmittingAddendum(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-6">
      <div className="relative w-full max-w-7xl h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Workstation Toolbar */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Report Title & Cryptographic Fingerprint */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  {effectiveReportNumber || `Order #${orderId.slice(0, 8)}`}
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  {versionLabel}
                </span>
                {shortChecksum && (
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-emerald-300 border border-slate-700">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    SHA-256: {shortChecksum}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {patientName ? `${patientName} (${effectiveUhid || 'UHID'})` : 'NABL ISO 15189:2022 Certified A4 Diagnostic Report'}
              </p>
            </div>
          </div>

          {/* Center: Dual-Mode Switcher & Zoom Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('PDF_STREAM')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'PDF_STREAM'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Certified PDF
              </button>
              <button
                type="button"
                onClick={() => setViewMode('INTERACTIVE_HTML')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'INTERACTIVE_HTML'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Interactive NABL HTML
              </button>
            </div>

            {/* Zoom Bar */}
            <div className="inline-flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 rounded hover:bg-slate-800 text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-semibold text-slate-200 px-2 min-w-[48px] text-center">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 rounded hover:bg-slate-800 text-slate-300"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleFitWidth}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                title="Fit Width (125%)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                title="Reset Zoom (100%)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right: Clinical Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddendumDrawer((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
              title="Add NABL ISO 15189:2022 Clause 7.4.1.7 Clinical Addendum"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              Add Addendum
            </button>

            <button
              type="button"
              onClick={handleCopyVerificationUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied QR Link
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Verify URL
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleForceRegenerate}
              disabled={regenerating}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Re-Compile Persistent PDF"
            >
              <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin text-teal-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleSilentPrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5 text-teal-400" />
              Print
            </button>

            <a
              href={pdfDownloadUrl}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-lg shadow-teal-600/20 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Viewport & Optional Addendum Drawer */}
        <div className="flex-1 flex overflow-hidden bg-slate-950 relative">
          {/* Viewport */}
          <div className="flex-1 h-full overflow-auto flex justify-center p-4">
            {viewMode === 'PDF_STREAM' ? (
              <iframe
                ref={iframeRef}
                key={`${pdfFileUrl}-${zoom}`}
                src={pdfFileUrl}
                title="Certified NABL A4 PDF Report"
                className="w-full h-full rounded-xl border border-slate-800 bg-white shadow-2xl"
              />
            ) : loadingHtml ? (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                <RefreshCw className="w-7 h-7 animate-spin text-teal-400" />
                <span className="text-xs">Rendering Interactive NABL ISO 15189:2022 Sheet...</span>
              </div>
            ) : (
              <div
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 150ms ease',
                }}
                className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl rounded-lg overflow-hidden"
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={htmlContent}
                  title="Interactive NABL HTML Report"
                  className="w-full h-[1120px] border-0"
                />
              </div>
            )}
          </div>

          {/* Slide-Over NABL ISO 15189:2022 Clause 7.4.1.7 Addendum Drawer */}
          {showAddendumDrawer && (
            <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl z-20">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Issue Clinical Addendum (ISO 15189)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Clause 7.4.1.7 — Immutable Versioned Amendment
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddendumDrawer(false)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed">
                  Under <strong>NABL ISO 15189:2022 Clause 7.4.1.7</strong>, released reports cannot
                  be silently overwritten. Submitting this form appends a timestamped clinical
                  addendum, increments the report version, and recalculates the SHA-256 PDF digest.
                </div>

                <form onSubmit={handleCreateAddendum} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Amendment / Addendum Reason *
                    </label>
                    <select
                      value={addendumReason}
                      onChange={(e) => setAddendumReason(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="Post-Analytical Clinical Correlation / Pathologist Comment">
                        Post-Analytical Clinical Correlation / Pathologist Comment
                      </option>
                      <option value="Dilution / Repeat Assay Confirmation Note">
                        Dilution / Repeat Assay Confirmation Note
                      </option>
                      <option value="Clinician Requested Supplementary Interpretation">
                        Clinician Requested Supplementary Interpretation
                      </option>
                      <option value="Reference Interval Stratification Clarification">
                        Reference Interval Stratification Clarification
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Clinical Addendum Statement *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={addendumContent}
                      onChange={(e) => setAddendumContent(e.target.value)}
                      placeholder="Enter formal pathologist addendum note to be permanently attached to the report..."
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {addendumError && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{addendumError}</span>
                    </div>
                  )}

                  {addendumSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{addendumSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingAddendum}
                    className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <FilePlus2 className="w-4 h-4" />
                    {submittingAddendum
                      ? 'Signing & Regenerating PDF...'
                      : 'Sign & Publish Official Addendum'}
                  </button>
                </form>
              </div>

              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Audit Action: REPORT_ADDENDUM_ADDED</span>
                {resolvedReportId && (
                  <a
                    href={`/verify-report/${resolvedReportId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-400 hover:underline inline-flex items-center gap-1"
                  >
                    Open Public Portal
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPdfPreviewModal;
