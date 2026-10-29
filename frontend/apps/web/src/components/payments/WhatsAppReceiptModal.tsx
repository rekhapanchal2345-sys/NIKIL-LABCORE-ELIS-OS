"use client";

import React from "react";
import { X, MessageSquare, CheckCircle2 } from "lucide-react";

export interface WhatsAppReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  showNotification: (message: string, type?: "success" | "error") => void;
}

export default function WhatsAppReceiptModal({
  isOpen,
  onClose,
  data,
  showNotification,
}: WhatsAppReceiptModalProps) {
  if (!isOpen || !data) return null;

  const handleDispatch = () => {
    showNotification(
      `WhatsApp ${data.type === "REMINDER" ? "payment reminder" : "digital receipt"} dispatched to ${data.patientName} (${data.phone || "registered mobile"})!`,
      "success"
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
              <MessageSquare className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              WhatsApp {data.type === "REMINDER" ? "Balance Reminder" : "Receipt"} Dispatch
            </h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5">
          <div>
            Patient: <strong>{data.patientName}</strong> ({data.uhid || "UHID"})
          </div>
          <div>
            Mobile: <span className="font-mono">{data.phone || "+91 98201 11223"}</span>
          </div>
          <div>
            Amount: <strong className="font-mono text-emerald-700">₹{Number(data.amount || 0).toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDispatch}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Send WhatsApp Message
          </button>
        </div>
      </div>
    </div>
  );
}
