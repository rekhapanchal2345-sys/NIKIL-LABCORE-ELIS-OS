"use client";
import React from "react";

export function QRCodeModal({ isOpen, onClose, report }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Report Verification QR Code</h3>
        <p className="text-sm text-slate-600">Scan to verify digital authenticity for report {report?.reportNumber || report?.id || ""}.</p>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-slate-900 text-white">Close</button>
        </div>
      </div>
    </div>
  );
}
export default QRCodeModal;
