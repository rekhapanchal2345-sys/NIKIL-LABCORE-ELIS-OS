"use client";

import React from "react";
import { X, Printer, RotateCcw, ShieldCheck, Receipt, CheckCircle2 } from "lucide-react";

export interface PaymentDetailModalProps {
  paymentId: string;
  onClose: () => void;
  onOpenReceipt: (payment: any) => void;
  onInitiateRefund: (paymentId: string, amount: number) => void;
}

export default function PaymentDetailModal({
  paymentId,
  onClose,
  onOpenReceipt,
  onInitiateRefund,
}: PaymentDetailModalProps) {
  if (!paymentId) return null;

  const mockRecord = {
    id: paymentId,
    transactionId: `TXN-${paymentId.slice(-6).toUpperCase()}`,
    receiptNumber: `RCP-2026-${paymentId.slice(-4).toUpperCase()}`,
    patientName: "Clinical Patient Record",
    patientUhid: "UHID-2026-1001",
    amount: 1450,
    method: "UPI",
    status: "COMPLETED",
    paidAt: new Date().toISOString(),
    counter: "Counter 01 (Main OPD)",
    collectedBy: "Jaya Ashapurama",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transaction Audit Inspection</h3>
              <p className="text-[11px] text-slate-500 font-mono">Record ID: {paymentId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Receipt Number</span>
              <div className="mt-0.5 font-mono font-bold text-slate-900">{mockRecord.receiptNumber}</div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Verification Status</span>
              <div className="mt-0.5 inline-flex items-center gap-1 font-bold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> {mockRecord.status}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Counter & Cashier</span>
              <div className="mt-0.5 font-semibold text-slate-800">{mockRecord.counter}</div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Tax Classification</span>
              <div className="mt-0.5 font-mono text-slate-700">SAC 999312 (Nil GST)</div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => onInitiateRefund(paymentId, mockRecord.amount)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Initiate Refund
          </button>
          <button
            type="button"
            onClick={() => onOpenReceipt(mockRecord)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f2d52] px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            <Printer className="h-3.5 w-3.5" />
            Open A4 Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
