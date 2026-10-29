"use client";

import React, { useState, useEffect } from "react";
import { X, Banknote, CreditCard, Smartphone, Landmark, CheckCircle2, Plus } from "lucide-react";

export interface CollectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  patients: any[];
  initialOrderId?: string;
  initialAmount?: string;
  onPaymentSuccess: (createdPayment?: any) => void;
  showNotification: (message: string, type?: "success" | "error") => void;
}

export default function CollectPaymentModal({
  isOpen,
  onClose,
  orders,
  initialOrderId = "",
  initialAmount = "",
  onPaymentSuccess,
  showNotification,
}: CollectPaymentModalProps) {
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrderId);
  const [amount, setAmount] = useState(initialAmount || "1250");
  const [method, setMethod] = useState<"CASH" | "UPI" | "CARD" | "NET_BANKING">("CASH");
  const [instrumentRef, setInstrumentRef] = useState("");
  const [counter, setCounter] = useState("Counter 01 (Main OPD)");

  useEffect(() => {
    if (initialOrderId) setSelectedOrderId(initialOrderId);
    if (initialAmount) setAmount(initialAmount);
  }, [initialOrderId, initialAmount, isOpen]);

  if (!isOpen) return null;

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount || 0);
    if (numericAmount <= 0) {
      showNotification("Please enter a valid payment collection amount.", "error");
      return;
    }

    const createdPayment = {
      id: `pay-${Date.now()}`,
      transactionId: `TXN-2026-${Date.now().toString().slice(-5)}`,
      receiptNumber: `RCP-2026-${Date.now().toString().slice(-4)}`,
      orderId: selectedOrder?.id || selectedOrderId || "ORD-2026-101",
      orderNumber: selectedOrder?.orderNumber || "ORD-2026-101",
      invoiceNumber: selectedOrder?.invoiceNumber || "INV-2026-101",
      patientName: selectedOrder?.patient
        ? `${selectedOrder.patient.firstName} ${selectedOrder.patient.lastName}`
        : selectedOrder?.patientName || "Walk-in Clinical Patient",
      patientUhid: selectedOrder?.patient?.uhid || "UHID-2026-1001",
      amount: numericAmount,
      method,
      instrumentRef: instrumentRef || (method === "CASH" ? "Physical Till Tender" : `UTR-${Date.now().toString().slice(-6)}`),
      status: "COMPLETED",
      paidAt: new Date().toISOString(),
      counter,
      collectedBy: "Jaya Ashapurama",
    };

    showNotification(
      `Receipt ${createdPayment.receiptNumber} generated for ₹${numericAmount.toLocaleString("en-IN")} (${method})!`,
      "success"
    );
    onPaymentSuccess(createdPayment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Collect Patient Bill & Issue Fiscal Receipt
              </h3>
              <p className="text-[11px] text-slate-500">
                Hospital OPD/IPD, Diagnostic Lab & Polyclinic Counter Collection Desk
              </p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Select Order / Invoice
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-sky-600"
              >
                <option value="">Walk-in / Direct OPD Bill</option>
                {orders.slice(0, 20).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber || o.id} — {o.patient ? `${o.patient.firstName} ${o.patient.lastName}` : o.patientName || "Patient"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Cashier Counter Register
              </label>
              <select
                value={counter}
                onChange={(e) => setCounter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-sky-600"
              >
                <option value="Counter 01 (Main OPD)">Counter 01 (Main OPD)</option>
                <option value="Counter 02 (IPD & ER)">Counter 02 (IPD & ER)</option>
                <option value="Counter 03 (Diagnostic Lab)">Counter 03 (Diagnostic Lab)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Tender Mode
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { id: "CASH", label: "Cash", icon: <Banknote className="h-3.5 w-3.5" /> },
                  { id: "UPI", label: "UPI / QR", icon: <Smartphone className="h-3.5 w-3.5" /> },
                  { id: "CARD", label: "Card POS", icon: <CreditCard className="h-3.5 w-3.5" /> },
                  { id: "NET_BANKING", label: "NEFT / RTGS", icon: <Landmark className="h-3.5 w-3.5" /> },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${
                    method === m.id
                      ? "border-[#0f2d52] bg-[#0f2d52] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Amount Received (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-mono font-extrabold text-slate-900 outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                UTR / Auth Code / Voucher Ref
              </label>
              <input
                type="text"
                value={instrumentRef}
                onChange={(e) => setInstrumentRef(e.target.value)}
                placeholder={method === "CASH" ? "Physical Cash Till" : "Enter 12-digit UTR / RRN"}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-mono text-slate-800 outline-none focus:border-sky-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              Post Receipt & Print
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
