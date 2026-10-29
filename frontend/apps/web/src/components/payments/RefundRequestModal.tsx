"use client";

import React, { useState, useEffect } from "react";
import { X, RotateCcw, CheckCircle2 } from "lucide-react";

export interface RefundRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments: any[];
  initialPaymentId?: string;
  initialAmount?: string;
  onRefundSuccess: () => void;
  showNotification: (message: string, type?: "success" | "error") => void;
}

export default function RefundRequestModal({
  isOpen,
  onClose,
  initialPaymentId = "",
  initialAmount = "",
  onRefundSuccess,
  showNotification,
}: RefundRequestModalProps) {
  const [amount, setAmount] = useState(initialAmount || "450");
  const [reason, setReason] = useState("Doctor Cancelled / Modified Diagnostic Test");

  useEffect(() => {
    if (initialAmount) setAmount(initialAmount);
  }, [initialAmount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showNotification(
      `Credit Note & Refund request for ₹${Number(amount).toLocaleString("en-IN")} logged (${initialPaymentId || "Direct"})!`,
      "success"
    );
    onRefundSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700">
              <RotateCcw className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Issue Statutory Credit Note / Refund</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Refund / Credit Note Value (₹) *
            </label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-base font-bold text-rose-700"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Clinical / Billing Reversal Reason
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700">
              Cancel
            </button>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 font-bold text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Submit Credit Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
