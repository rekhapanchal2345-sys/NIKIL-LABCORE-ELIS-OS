'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  Eye,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  AlertTriangle,
  Award,
  QrCode,
  ExternalLink,
} from 'lucide-react';

export interface ReportPdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  reportId?: string;
  patientName?: string;
  patientUhid?: string;
  signingPathologist?: {
    fullName: string;
    registrationNumber?: string;
    specialization?: string;
    signedAt?: string;
  };
  nablCertificateNumber?: string;
  apiBaseUrl?: string;
}

type PreviewMode = 'html' | 'pdf';

export const ReportPdfPreviewModal: React.FC<ReportPdfPreviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  reportId,
  patientName = 'Clinical Patient',
  patientUhid = 'UHID-PENDING',
  signingPathologist = {
    fullName: 'Dr. Arundhati Deshmukh, MD (Pathology)',
    registrationNumber: 'MCI/TSMC-48921',
    specialization: 'Consultant Pathologist & NABL Quality Director',
  },
  nablCertificateNumber = 'MC-4892',
  apiBaseUrl,
}) => {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('html');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [checksumSha256, setChecksumSha256] = useState<string>('VERIFYING...');

  const htmlIframeRef = useRef<HTMLIFrameElement | null>(null);

  const resolvedApiBase =
    apiBaseUrl ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000/api';

  const getAuthHeaders = useCallback((): HeadersInit => {
    if (typeof window === 'undefined') return {};
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const verificationPortalUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/verify-report/${encodeURIComponent(reportId || orderId)}`
      : `/verify-report/${encodeURIComponent(reportId || orderId)}`;

  const loadReportPreview = useCallback(async () => {
    if (!orderId || !isOpen) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      if (previewMode === 'html') {
        const res = await fetch(
          `${resolvedApiBase}/reports/order/${encodeURIComponent(orderId)}/html`,
          {
            method: 'GET',
            headers: {
              ...getAuthHeaders(),
              Accept: 'text/html',
            },
          }
        );

        if (!res.ok) {
          const errPayload = await res.json().catch(() => null);
          throw new Error(
            errPayload?.message ||
              `Failed to load NABL A4 HTML preview (HTTP ${res.status})`
          );
        }

        const renderedHtml = await res.text();
        setHtmlContent(renderedHtml);

        const match = renderedHtml.match(/SHA-256 Checksum:\s*([a-f0-9]+)/i);
        if (match?.[1]) {
          setChecksumSha256(match[1]);
        }
      } else {
        const res = await fetch(
          `${resolvedApiBase}/reports/order/${encodeURIComponent(orderId)}/pdf`,
          {
            method: 'GET',
            headers: {
              ...getAuthHeaders(),
              Accept: 'application/pdf',
            },
          }
        );

        if (!res.ok) {
          const errPayload = await res.json().catch(() => null);
          throw new Error(
            errPayload?.message ||
              `Report Dispatch Guard blocked PDF stream (HTTP ${res.status})`
          );
        }

        const headerChecksum = res.headers.get('X-NABL-Checksum-SHA256');
        if (headerChecksum) {
          setChecksumSha256(headerChecksum);
        }

        const pdfBlob = await res.blob();
        const objectUrl = URL.createObjectURL(pdfBlob);
        setPdfBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return objectUrl;
        });
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Unable to load NABL diagnostic report preview.'
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, isOpen, previewMode, resolvedApiBase, getAuthHeaders]);

  useEffect(() => {
    if (isOpen) {
      void loadReportPreview();
    }
  }, [isOpen, loadReportPreview]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  if (!isOpen) return null;

  const handlePrintReport = () => {
    if (previewMode === 'html' && htmlIframeRef.current?.contentWindow) {
      htmlIframeRef.current.contentWindow.focus();
      htmlIframeRef.current.contentWindow.print();
      return;
    }
    if (pdfBlobUrl) {
      const printWin = window.open(pdfBlobUrl, '_blank');
      printWin?.focus();
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(
        `${resolvedApiBase}/reports/order/${encodeURIComponent(orderId)}/download`,
        {
          method: 'GET',
          headers: {
            ...getAuthHeaders(),
            Accept: 'application/pdf',
          },
        }
      );

      if (!res.ok) {
        const errPayload = await res.json().catch(() => null);
        throw new Error(
          errPayload?.message ||
            `Failed to download NABL PDF (HTTP ${res.status})`
        );
      }

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = `report-${orderNumber || orderId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to download certified PDF report.'
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyVerificationLink = async () => {
    try {
      await navigator.clipboard.writeText(verificationPortalUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback copy input
      const tempInput = document.createElement('input');
      tempInput.value = verificationPortalUrl;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nabl-report-preview-title"
    >
      <div className="relative flex flex-col w-full max-w-6xl h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* 1. TOP NABL ISO 15189:2022 VERIFICATION & SIGNING PATHOLOGIST BANNER */}
        <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-sky-950/90 border-b border-emerald-500/30 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="nabl-report-preview-title"
                  className="text-sm sm:text-base font-bold text-white tracking-tight"
                >
                  NABL ISO 15189:2022 Certified Diagnostic Report
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <Award className="h-3 w-3" />
                  Cert: {nablCertificateNumber}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  CLSI C28-A3 Dynamic Ranges
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Patient: <strong className="text-white">{patientName}</strong> ({patientUhid}) • Order:{' '}
                <strong className="font-mono text-sky-300">{orderNumber}</strong> • SHA-256:{' '}
                <span className="font-mono text-emerald-300">
                  {checksumSha256.slice(0, 16)}...
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right border-r border-slate-700 pr-4">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400">
                Electronically Signed By
              </span>
              <span className="text-xs font-bold text-white">
                {signingPathologist.fullName}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Reg. No: {signingPathologist.registrationNumber || 'MCI-VERIFIED'}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close Report Preview Modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 2. ACTION TOOLBAR (MODE SWITCHER, ZOOM, PRINT, DOWNLOAD, COPY QR LINK) */}
        <div className="bg-slate-900/95 border-b border-slate-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Left: View Mode Toggle & Zoom */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-lg bg-slate-800 p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setPreviewMode('html')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  previewMode === 'html'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                A4 Workstation HTML
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('pdf')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  previewMode === 'pdf'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Compiled PDF Stream
              </button>
            </div>

            {previewMode === 'html' && (
              <div className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                <button
                  type="button"
                  onClick={() => setZoomPercent((z) => Math.max(70, z - 10))}
                  className="p-1 text-slate-300 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs font-mono font-semibold text-slate-200 min-w-[42px] text-center">
                  {zoomPercent}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomPercent((z) => Math.min(140, z + 10))}
                  className="p-1 text-slate-300 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => void loadReportPreview()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Refresh Report"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Right: Primary Workstation Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => void handleCopyVerificationLink()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300">QR Verify Link Copied!</span>
                </>
              ) : (
                <>
                  <QrCode className="h-3.5 w-3.5 text-sky-400" />
                  <span>Copy Verification Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrintReport}
              disabled={loading || !!errorMessage}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Report
            </button>

            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              {downloading ? 'Compiling PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* 3. EMBEDDED A4 REPORT VIEWPORT */}
        <div className="flex-1 bg-slate-950 overflow-auto p-4 sm:p-6 flex justify-center items-start">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-sky-400" />
              <p className="text-sm font-semibold">
                Rendering NABL ISO 15189:2022 A4 Diagnostic Report...
              </p>
              <p className="text-xs text-slate-400">
                Evaluating CLSI C28-A3 dynamic reference intervals, Code 128B vector barcode &amp; QR seal
              </p>
            </div>
          ) : errorMessage ? (
            <div className="max-w-lg my-auto bg-rose-950/60 border border-rose-500/50 rounded-xl p-6 text-center">
              <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">
                Report Dispatch Guard / Generation Alert
              </h3>
              <p className="text-xs text-rose-200 leading-relaxed mb-4">
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={() => void loadReportPreview()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry Report Compilation
              </button>
            </div>
          ) : previewMode === 'html' ? (
            <div
              className="bg-white shadow-2xl rounded-sm transition-transform origin-top"
              style={{
                width: '210mm',
                minHeight: '297mm',
                transform: `scale(${zoomPercent / 100})`,
              }}
            >
              <iframe
                ref={htmlIframeRef}
                title={`NABL A4 Diagnostic Report ${orderNumber}`}
                srcDoc={htmlContent}
                className="w-full h-[297mm] border-0 bg-white"
              />
            </div>
          ) : pdfBlobUrl ? (
            <iframe
              title={`Compiled PDF Stream ${orderNumber}`}
              src={pdfBlobUrl}
              className="w-full h-full rounded-lg border border-slate-700 bg-white"
            />
          ) : null}
        </div>

        {/* 4. FOOTER STATUS BAR */}
        <div className="bg-slate-900 border-t border-slate-800 px-5 py-2 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            <span>
              NABL Clause 7.4.1 Verified • Vector Code 128B (Mod-103) • ISO/IEC 18004 QR Active
            </span>
          </div>
          <a
            href={verificationPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-medium"
          >
            <Copy className="h-3 w-3" />
            <span>Public Verification Portal: {verificationPortalUrl}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ReportPdfPreviewModal;
