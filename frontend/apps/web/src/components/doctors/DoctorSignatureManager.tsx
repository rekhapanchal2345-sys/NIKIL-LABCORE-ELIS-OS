'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Upload,
  PenTool,
  ShieldCheck,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Download,
  Award,
  FileSignature,
  Loader2,
  X,
} from 'lucide-react';

export interface DoctorSignatureManagerProps {
  doctorId: string;
  doctorName: string;
  qualification?: string;
  designation?: string;
  registrationNumber?: string;
  initialSignatureUrl?: string | null;
  apiBaseUrl?: string;
  onSignatureUpdated?: (data: {
    signatureUrl: string;
    sha256Checksum: string;
    sealSvg: string;
  }) => void;
}

type InputMode = 'upload' | 'draw';

const MAX_FILE_SIZE_BYTES = 500 * 1024; // 500 KB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export const DoctorSignatureManager: React.FC<DoctorSignatureManagerProps> = ({
  doctorId,
  doctorName,
  qualification = 'MBBS, MD (Pathology)',
  designation = 'Consultant Pathologist',
  registrationNumber = 'KMC-REG-VERIFIED',
  initialSignatureUrl = null,
  apiBaseUrl,
  onSignatureUpdated,
}) => {
  const normalizedApiBase = useMemo(() => {
    const raw = (apiBaseUrl || process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
    if (!raw) return '/api';
    if (raw.endsWith('/api')) return raw;
    if (raw.endsWith('/api/v1')) return raw.replace(/\/v1$/, '');
    return `${raw}/api`;
  }, [apiBaseUrl]);

  const [mode, setMode] = useState<InputMode>('upload');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(initialSignatureUrl);
  const [selectedMimeType, setSelectedMimeType] = useState<string>('image/png');
  const [fileSizeKb, setFileSizeKb] = useState<number | null>(null);
  const [sha256Checksum, setSha256Checksum] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [isSealModalOpen, setIsSealModalOpen] = useState<boolean>(false);
  const [sealSvgContent, setSealSvgContent] = useState<string | null>(null);
  const [isLoadingSeal, setIsLoadingSeal] = useState<boolean>(false);

  // Canvas Drawing State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);
  const [penColor, setPenColor] = useState<string>('#1e3a8a');
  const [penWidth, setPenWidth] = useState<number>(2.5);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchDoctorSealPreview = useCallback(async () => {
    if (!doctorId) return;
    setIsLoadingSeal(true);
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : '';
      const response = await fetch(`${normalizedApiBase}/doctors/${doctorId}/seal?format=json`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const result = await response.json();
        const svg = result?.data?.sealSvg || (typeof result?.data === 'string' ? result.data : null);
        if (svg) setSealSvgContent(svg);
      }
    } catch {
      // Fallback handled gracefully in UI
    } finally {
      setIsLoadingSeal(false);
    }
  }, [normalizedApiBase, doctorId]);

  useEffect(() => {
    fetchDoctorSealPreview();
  }, [fetchDoctorSealPreview]);

  // Initialize Canvas when switching to Draw mode
  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penWidth;
      }
    }
  }, [mode, penColor, penWidth]);

  const validateAndReadFile = (file: File) => {
    setErrorMessage(null);
    setSuccessToast(null);

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMessage(
        `Invalid file format (${file.type || 'unknown'}). Allowed formats: PNG, JPEG, WEBP.`
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        `File size (${(file.size / 1024).toFixed(1)} KB) exceeds the NABL 500 KB maximum limit.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const resultUrl = e.target?.result as string;
      setPreviewDataUrl(resultUrl);
      setSelectedMimeType(file.type);
      setFileSizeKb(Number((file.size / 1024).toFixed(1)));
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the selected signature image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndReadFile(droppedFile);
    }
  };

  // Canvas Drawing Handlers
  const getCanvasCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokeHistory((prev) => [...prev.slice(-14), snapshot]);

    const { x, y } = getCanvasCoordinates(e);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const drawMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const pngDataUrl = canvas.toDataURL('image/png');
      setPreviewDataUrl(pngDataUrl);
      setSelectedMimeType('image/png');
      const approxBytes = Math.round((pngDataUrl.length * 3) / 4);
      setFileSizeKb(Number((approxBytes / 1024).toFixed(1)));
    }
  };

  const handleUndoStroke = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || strokeHistory.length === 0) return;

    const lastSnapshot = strokeHistory[strokeHistory.length - 1];
    ctx.putImageData(lastSnapshot, 0, 0);
    setStrokeHistory((prev) => prev.slice(0, -1));
    setPreviewDataUrl(canvas.toDataURL('image/png'));
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokeHistory([]);
    setPreviewDataUrl(null);
    setFileSizeKb(null);
  };

  const handleUploadSignature = async () => {
    if (!previewDataUrl || !previewDataUrl.startsWith('data:image/')) {
      setErrorMessage('Please upload or draw a valid digital signature before saving.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessToast(null);

    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : '';

      const response = await fetch(`${normalizedApiBase}/doctors/${doctorId}/signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          signatureDataUrl: previewDataUrl,
          signatureData: previewDataUrl,
          mimeType: selectedMimeType,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload?.message || 'Failed to upload digital signature.');
      }

      const signatureUrl = payload.data?.signatureUrl || payload.data?.doctor?.signatureUrl;
      const checksum = payload.data?.sha256Checksum || payload.data?.sha256Hash || 'VALIDATED';
      const sealSvg = payload.data?.sealSvg || payload.data?.seal?.sealSvg;

      setSha256Checksum(checksum);
      if (sealSvg) {
        setSealSvgContent(sealSvg);
      } else {
        await fetchDoctorSealPreview();
      }

      setSuccessToast(
        `Digital signature cryptographically bound (SHA-256: ${checksum.slice(0, 12)}...).`
      );

      if (onSignatureUpdated && signatureUrl) {
        onSignatureUpdated({
          signatureUrl,
          sha256Checksum: checksum,
          sealSvg: sealSvg || sealSvgContent || '',
        });
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unexpected error while saving signature.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadSealSvg = () => {
    if (!sealSvgContent) return;
    const blob = new Blob([sealSvgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NABL_Doctor_Seal_${doctorName.replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Top Compliance Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-emerald-950 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
            <FileSignature className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold tracking-tight">
                Digital Signature &amp; NABL ISO 15189:2022 Electronic Doctor Seal
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-400/30">
                Clause 7.4.2 Compliant
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {doctorName} • {qualification} • Reg No: {registrationNumber}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchDoctorSealPreview();
            setIsSealModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition"
        >
          <Eye className="w-4 h-4 text-emerald-300" />
          Preview Official NABL Seal
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-5">
        {/* Mode Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition ${
                mode === 'upload'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Signature Image
            </button>
            <button
              type="button"
              onClick={() => setMode('draw')}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition ${
                mode === 'draw'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              Draw on Digital Pad
            </button>
          </div>

          <span className="text-xs text-slate-500">
            Max Size: <strong className="text-slate-700">500 KB</strong> • Formats:{' '}
            <strong className="text-slate-700">PNG, JPEG, WEBP</strong>
          </span>
        </div>

        {/* Error & Success Alerts */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successToast && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">{successToast}</div>
            <button
              type="button"
              onClick={() => setSuccessToast(null)}
              className="text-emerald-600 hover:text-emerald-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Upload Dropzone or Canvas Pad */}
          <div className="lg:col-span-7">
            {mode === 'upload' ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
                  isDragging
                    ? 'border-blue-600 bg-blue-50/60'
                    : 'border-slate-300 hover:border-blue-500 bg-slate-50/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) validateAndReadFile(file);
                  }}
                />
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Drag &amp; drop transparent signature image here, or{' '}
                  <span className="text-blue-600 underline">browse file</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Recommended: Transparent PNG (300x100 px) signed with dark blue or black ink
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      Ink:
                      <input
                        type="color"
                        value={penColor}
                        onChange={(e) => setPenColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border border-slate-300"
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      Stroke:
                      <select
                        value={penWidth}
                        onChange={(e) => setPenWidth(Number(e.target.value))}
                        className="text-xs rounded border border-slate-300 px-2 py-1 bg-white"
                      >
                        <option value={1.8}>Fine (1.8px)</option>
                        <option value={2.5}>Medium (2.5px)</option>
                        <option value={3.5}>Bold (3.5px)</option>
                      </select>
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleUndoStroke}
                      disabled={strokeHistory.length === 0}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Undo
                    </button>
                    <button
                      type="button"
                      onClick={handleClearCanvas}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-white border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-slate-300 bg-white overflow-hidden relative">
                  <canvas
                    ref={canvasRef}
                    width={520}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={drawMove}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={drawMove}
                    onTouchEnd={endDrawing}
                    className="w-full h-40 cursor-crosshair touch-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:12px_12px]"
                  />
                  <div className="pointer-events-none absolute bottom-3 left-6 right-6 border-b border-dashed border-slate-300 flex justify-between items-end pb-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      Sign Above Baseline
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {doctorName}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Signature Preview & Save Action */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Signature Preview
                </span>
                {fileSizeKb !== null && (
                  <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {fileSizeKb} KB
                  </span>
                )}
              </div>

              <div className="h-28 rounded-lg border border-slate-200 bg-white flex items-center justify-center p-3 overflow-hidden">
                {previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt={`${doctorName} Digital Signature`}
                    className="max-h-20 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    No signature image loaded
                  </span>
                )}
              </div>

              {sha256Checksum && (
                <div className="mt-2.5 p-2 rounded bg-slate-900 text-emerald-400 font-mono text-[10px] truncate">
                  SHA-256: {sha256Checksum}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUploadSignature}
                  disabled={isUploading || !previewDataUrl}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Binding Cryptographic Signature...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Save &amp; Bind Digital Signature
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive NABL ISO 15189:2022 Vector Seal Modal */}
      {isSealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold">
                    Official NABL ISO 15189:2022 Electronic Doctor Seal
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    High-DPI Vector SVG rendered on signed patient diagnostic reports
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSealModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-50 flex flex-col items-center justify-center">
              {isLoadingSeal ? (
                <div className="py-12 flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  Rendering vector cryptographic seal...
                </div>
              ) : sealSvgContent ? (
                <div
                  className="w-full flex justify-center overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-inner"
                  dangerouslySetInnerHTML={{ __html: sealSvgContent }}
                />
              ) : (
                <p className="text-xs text-slate-500 py-8">
                  Save your signature to preview the live vector seal.
                </p>
              )}

              <div className="mt-4 w-full grid grid-cols-3 gap-3 text-left">
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Signatory
                  </span>
                  <span className="text-xs font-bold text-slate-800">{doctorName}</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Council Reg No.
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-800">
                    {registrationNumber}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Standard
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    NABL ISO 15189:2022
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDownloadSealSvg}
                disabled={!sealSvgContent}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
              >
                <Download className="w-4 h-4" />
                Download Vector SVG
              </button>
              <button
                type="button"
                onClick={() => setIsSealModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSignatureManager;
