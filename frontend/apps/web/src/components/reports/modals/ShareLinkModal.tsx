"use client";
import React from "react";

export function ShareLinkModal({ isOpen, onClose, report }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Share Secure Report Link</h3>
        <p className="text-sm text-slate-600">Generate time-limited encrypted link for {report?.reportNumber || "report"}.</p>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white">Done</button>
        </div>
      </div>
    </div>
  );
}
export default ShareLinkModal;
