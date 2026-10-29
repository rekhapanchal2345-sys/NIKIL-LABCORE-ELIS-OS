"use client";

import React, { useState } from "react";
import { X, Clock, CheckCircle2 } from "lucide-react";

export interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedCash: number;
  counterName: string;
  cashierName: string;
  onShiftClosed: (closingData: { physicalCash: number; variance: number; notes: string }) => void;
  showNotification: (message: string, type?: "success" | "error") => void;
}

export default function ShiftHandoverModal({
  isOpen,
  onClose,
  expectedCash,
  counterName,
  cashierName,
  onShiftClosed,
}: ShiftHandoverModalProps) {
  const [physicalCash, setPhysicalCash] = useState(String(expectedCash || 40850));
  const [notes, setNotes] = useState("Shift till counted and verified with Relieving Cashier.");

  if (!isOpen) return null;

  const numericPhysical = Number(physicalCash || 0);
  const variance = numericPhysical - Number(expectedCash || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onShiftClosed({ physicalCash: numericPhysical, variance, notes });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Close Shift Till & Handover</h3>
              <p className="text-[11px] text-slate-500">{counterName} • {cashierName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex justify-between items-center">
            <span className="font-semibold text-slate-600">System Expected Cash:</span>
            <span className="font-mono text-sm font-extrabold text-slate-900">
              ₹{Number(expectedCash || 0).toLocaleString("en-IN")}
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Physical Counted Cash in Drawer (₹) *
            </label>
            <input
              type="number"
              required
              value={physicalCash}
              onChange={(e) => setPhysicalCash(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-base font-bold text-slate-900 outline-none focus:border-sky-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Handover Remarks
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-sky-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f2d52] px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Confirm Shift Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
