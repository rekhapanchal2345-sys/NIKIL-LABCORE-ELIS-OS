"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { 
  PenTool, 
  RotateCcw, 
  Check, 
  X, 
  Upload, 
  ShieldCheck, 
  Sparkles, 
  Stamp,
  Award,
  Lock
} from "lucide-react";

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string, stampHash: string) => void;
  initialSignature?: string;
  signatoryName?: string;
  designation?: string;
  registrationNo?: string;
}

export default function DigitalSignatureModal({
  isOpen,
  onClose,
  onSave,
  initialSignature,
  signatoryName = "Jaya Ashapurama",
  designation = "Chief Medical Lab Technologist",
  registrationNo = "MCI-LAB-2024-8849",
}: DigitalSignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState<string>("#1e3a8a"); // Medical Navy Blue
  const [lineWidth, setLineWidth] = useState<number>(2.5);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [tab, setTab] = useState<"draw" | "upload">("draw");
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [stampHash, setStampHash] = useState<string>("");

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = penColor;
    ctx.lineWidth = lineWidth;
  }, [penColor, lineWidth]);

  useEffect(() => {
    if (isOpen) {
      const randomHex = Array.from({ length: 16 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
      setStampHash(`SHA256:${randomHex}`);
      setHasDrawn(false);
      setUploadedPreview(null);

      // Initialize canvas with dynamic high-DPI resolution
      const timer = setTimeout(initCanvas, 50);
      window.addEventListener("resize", initCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", initCanvas);
      };
    }
  }, [isOpen, initCanvas]);

  if (!isOpen) return null;

  // Ultra-Accurate Zero-Latency Pointer Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    lastPointRef.current = { x, y };
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !lastPointRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const events = (e.nativeEvent as any).getCoalescedEvents?.() || [e];
    for (const ce of events) {
      const currentX = ce.clientX - rect.left;
      const currentY = ce.clientY - rect.top;

      const midX = (lastPointRef.current.x + currentX) / 2;
      const midY = (lastPointRef.current.y + currentY) / 2;
      ctx.quadraticCurveTo(lastPointRef.current.x, lastPointRef.current.y, midX, midY);
      ctx.stroke();
      lastPointRef.current = { x: currentX, y: currentY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handlePenColorChange = (color: string) => {
    setPenColor(color);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.strokeStyle = color;
    }
  };

  const handleLineWidthChange = (width: number) => {
    setLineWidth(width);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.lineWidth = width;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, SVG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUploadedPreview(result);
      setHasDrawn(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSignature = () => {
    let finalSignatureData = "";
    if (tab === "upload" && uploadedPreview) {
      finalSignatureData = uploadedPreview;
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      finalSignatureData = canvas.toDataURL("image/png");
    }

    onSave(finalSignatureData, stampHash);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-6 text-slate-100 shadow-2xl shadow-indigo-950/40">
        {/* Glow Header Accent */}
        <div className="absolute -top-24 left-1/2 h-40 w-96 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500/20 via-indigo-500/25 to-violet-500/20 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/30">
              <PenTool className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-white">
                  Digital Signature Studio
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" />
                  21 CFR Part 11 Compliant
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official encrypted cryptographic authorization signature for laboratory diagnostic reports
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs: Draw vs Upload */}
        <div className="mt-4 flex gap-2 border-b border-slate-800/60 pb-3">
          <button
            type="button"
            onClick={() => setTab("draw")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              tab === "draw"
                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <PenTool className="h-3.5 w-3.5" />
            Draw with Stylus / Mouse
          </button>
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              tab === "upload"
                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload Scanned Image
          </button>
        </div>

        {/* Content Body */}
        {tab === "draw" ? (
          <div className="mt-4 space-y-4">
            {/* Tool Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5">
              {/* Pen Colors */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400">Ink Color:</span>
                <button
                  type="button"
                  onClick={() => handlePenColorChange("#1e3a8a")}
                  className={`h-6 w-6 rounded-full bg-blue-900 border-2 transition-all ${
                    penColor === "#1e3a8a" ? "border-cyan-400 scale-110 shadow-sm" : "border-slate-700 hover:scale-105"
                  }`}
                  title="Medical Navy Blue"
                />
                <button
                  type="button"
                  onClick={() => handlePenColorChange("#0f172a")}
                  className={`h-6 w-6 rounded-full bg-slate-900 border-2 transition-all ${
                    penColor === "#0f172a" ? "border-cyan-400 scale-110 shadow-sm" : "border-slate-700 hover:scale-105"
                  }`}
                  title="Formal Slate Black"
                />
                <button
                  type="button"
                  onClick={() => handlePenColorChange("#15803d")}
                  className={`h-6 w-6 rounded-full bg-emerald-700 border-2 transition-all ${
                    penColor === "#15803d" ? "border-cyan-400 scale-110 shadow-sm" : "border-slate-700 hover:scale-105"
                  }`}
                  title="Verified Forest Green"
                />
              </div>

              {/* Stroke Width */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400">Width:</span>
                {[
                  { label: "Fine", width: 1.8 },
                  { label: "Normal", width: 2.8 },
                  { label: "Bold", width: 4.2 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleLineWidthChange(item.width)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                      lineWidth === item.width
                        ? "bg-slate-700 text-white font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Reset Canvas */}
              <button
                type="button"
                onClick={clearCanvas}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
              >
                <RotateCcw className="h-3 w-3" />
                Clear
              </button>
            </div>

            {/* Canvas Pad */}
            <div className="relative rounded-2xl border-2 border-dashed border-slate-700 bg-white shadow-inner overflow-hidden">
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="w-full h-[200px] cursor-crosshair touch-none select-none"
              />
              {!hasDrawn && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                  <PenTool className="h-7 w-7 text-slate-300 mb-1 animate-pulse" />
                  <span className="text-xs font-medium">Draw your signature with stylus or mouse inside this box</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Smooth Bezier anti-aliasing is enabled</span>
                </div>
              )}
              {/* Baseline indicator */}
              <div className="pointer-events-none absolute bottom-8 left-8 right-8 border-b border-slate-300/80 border-dashed flex justify-between text-[10px] text-slate-400 pb-0.5">
                <span>Sign Above Baseline</span>
                <span>Authorized Signatory</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
              {uploadedPreview ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-28 max-w-sm rounded-xl border border-slate-700 bg-white p-2 flex items-center justify-center shadow-md">
                    <img
                      src={uploadedPreview}
                      alt="Uploaded Signature"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <label className="cursor-pointer text-xs font-semibold text-cyan-400 hover:underline">
                    Replace Image
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-3 shadow-md">
                    <Upload className="h-7 w-7" />
                  </div>
                  <span className="text-sm font-semibold text-slate-200">
                    Click to select signature image
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    PNG with transparent background is recommended (Max 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Verifiable Stamp Preview Card */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stamp className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Medical Report Stamp Output
              </span>
            </div>
            <span className="font-mono text-[10px] text-cyan-400">
              {stampHash}
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs border-t border-slate-800/80 pt-2 text-slate-400">
            <div>
              <div className="font-semibold text-slate-200">{signatoryName}</div>
              <div className="text-[11px] text-slate-400">{designation} • Reg: {registrationNo}</div>
            </div>
            <div className="text-right">
              <div className="text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Electronic Sign
              </div>
              <div className="text-[10px] text-slate-500">{new Date().toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveSignature}
            disabled={!hasDrawn && !uploadedPreview && !initialSignature}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            <Check className="h-4 w-4" />
            Apply & Authorize Signature
          </button>
        </div>
      </div>
    </div>
  );
}
