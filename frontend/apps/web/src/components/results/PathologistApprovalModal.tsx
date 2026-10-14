"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface PathologistApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (signatureData: string) => void;
  resultDetails: {
    patientName: string;
    testName: string;
    criticalValues?: string[];
  };
  loading?: boolean;
}

export default function PathologistApprovalModal({
  isOpen,
  onClose,
  onApprove,
  resultDetails,
  loading = false,
}: PathologistApprovalModalProps) {
  const [signature, setSignature] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

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
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(initCanvas, 50);
      window.addEventListener("resize", initCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", initCanvas);
      };
    }
  }, [isOpen, initCanvas]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignature("");
    }
  };

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
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL());
    }
  };

  const handleApprove = () => {
    if (signature) {
      onApprove(signature);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Pathologist Approval & Digital Signature
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Review the test results below and provide your digital signature for approval.
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Result Summary</h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Patient:</span>
              <span className="text-sm font-medium text-gray-900">{resultDetails.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Test:</span>
              <span className="text-sm font-medium text-gray-900">{resultDetails.testName}</span>
            </div>
            {resultDetails.criticalValues && resultDetails.criticalValues.length > 0 && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-800">Critical Values Detected:</p>
                <ul className="mt-1 list-inside list-disc text-sm text-red-700">
                  {resultDetails.criticalValues.map((value, index) => (
                    <li key={index}>{value}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900">
            Digital Signature
          </label>
          <p className="mt-1 text-xs text-gray-600">
            Draw your signature in the box below using your mouse or touch screen.
          </p>
          <div className="mt-2 rounded-lg border-2 border-gray-300">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-[150px] cursor-crosshair bg-white touch-none select-none rounded-lg"
            />
          </div>
          <button
            onClick={handleClear}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Clear Signature
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900">
            Approval Remarks (Optional)
          </label>
          <textarea
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Add any additional notes or remarks..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={loading || !signature}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Approving..." : "Approve & Sign"}
          </button>
        </div>
      </div>
    </div>
  );
}