"use client";

import React, { useState } from "react";
import { X, Wallet, CheckCircle2 } from "lucide-react";

export interface AdvanceDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: any[];
  initialPatientId?: string;
  onAdvanceSuccess: () => void;
  showNotification: (message: string, type?: "success" | "error") => void;
}

export default function AdvanceDepositModal({
  isOpen,
  onClose,
  onAdvanceSuccess,
  showNotification,
}: AdvanceDepositModalProps) {
  const [amount, setAmount] = useState("5000");
  const [method, setMethod] = useState("UPI");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showNotification(`Patient advance deposit of ₹${Number(amount).toLocaleString("en-IN")} (${method}) credited to wallet!`, "success");
    onAdvanceSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700">
              <Wallet className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Collect Patient Advance Deposit</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Advance Deposit Amount (₹) *
            </label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-base font-bold text-slate-900"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Payment Mode
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-semibold text-slate-800"
            >
              <option value="CASH">Cash Tender</option>
              <option value="UPI">BharatQR / UPI</option>
              <option value="CARD">Card POS (EDC)</option>
              <option value="NET_BANKING">NEFT / RTGS</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700">
              Cancel
            </button>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Credit Wallet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
