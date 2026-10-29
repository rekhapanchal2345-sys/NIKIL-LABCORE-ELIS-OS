"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  RotateCcw,
  Printer,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  FileText,
  DollarSign
} from "lucide-react";
import { refundsApi, paymentApi } from "@/lib/api";
import { formatIndianRupees } from "@/lib/money";

interface RefundRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments: any[];
  initialPaymentId?: string;
  initialAmount?: string;
  onRefundSuccess: (refundData: any) => void;
  showNotification: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function RefundRequestModal({
  isOpen,
  onClose,
  payments,
  initialPaymentId,
  initialAmount,
  onRefundSuccess,
  showNotification,
}: RefundRequestModalProps) {
  const [paymentId, setPaymentId] = useState(initialPaymentId || "");
  const [amount, setAmount] = useState(initialAmount || "");
  const [reasonCategory, setReasonCategory] = useState("Test Cancelled by Clinician");
  const [customReason, setCustomReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("ORIGINAL_METHOD");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialPaymentId) setPaymentId(initialPaymentId);
    if (initialAmount) setAmount(initialAmount);
  }, [initialPaymentId, initialAmount]);

  const selectedPayment = payments.find((p) => p.id === paymentId);

  const formatCurrency = (val: number) => {
    return formatIndianRupees(val || 0);
  };

  // Print GST Credit Note / Refund Voucher Slip
  const handlePrintCreditNote = (refundData: any) => {
    const printWin = window.open("", "_blank");
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Credit_Note_${refundData.refundNumber}</title>
          <style>
            @page { size: 80mm auto; margin: 4mm; }
            body { font-family: monospace; font-size: 11px; color: #000; padding: 4px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 13px;">LABCORE DIAGNOSTICS & HOSPITAL OS</div>
          <div class="center bold">GST CREDIT NOTE / REFUND VOUCHER</div>
          <div class="center" style="font-size: 9px;">OFFICIAL REFUND DISBURSEMENT</div>
          <div class="divider"></div>
          <div class="row"><span>Credit Note No:</span><span class="bold">${refundData.refundNumber}</span></div>
          <div class="row"><span>Date:</span><span>${new Date().toLocaleString()}</span></div>
          <div class="row"><span>Original Receipt:</span><span>${refundData.receiptNumber}</span></div>
          <div class="row"><span>Patient:</span><span class="bold">${refundData.patientName}</span></div>
          <div class="divider"></div>
          <div class="row bold" style="font-size: 13px;">
            <span>Refund Amount:</span>
            <span>₹${refundData.amount.toLocaleString("en-IN")}</span>
          </div>
          <div class="row"><span>Refund Mode:</span><span>${refundData.refundMethod}</span></div>
          <div class="row"><span>Reason:</span><span>${refundData.reason}</span></div>
          <div class="divider"></div>
          <div style="margin-top: 25px;" class="row">
            <span>Patient/Receiver: __________</span>
            <span>Auth Signatory: __________</span>
          </div>
          <div class="center" style="margin-top: 10px; font-size: 8px;">THANK YOU • LABCORE FINANCE</div>
        </body>
      </html>
    `);

    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentId) {
      alert("Please select the original transaction to process a refund.");
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      alert("Please enter a valid refund amount.");
      return;
    }

    if (selectedPayment && amt > selectedPayment.amount) {
      alert(`Refund amount cannot exceed original transaction total of ${formatCurrency(selectedPayment.amount)}.`);
      return;
    }

    const fullReason = customReason
      ? `${reasonCategory}: ${customReason}`
      : reasonCategory;

    try {
      setSubmitting(true);

      const refundNumber = `REF-${Date.now().toString().slice(-6)}`;

      await refundsApi
        .create({
          paymentId,
          amount: amt,
          reason: fullReason,
          refundMethod,
        })
        .catch(async () => {
          return await paymentApi.refund(paymentId, {
            amount: amt,
            reason: fullReason,
            method: refundMethod,
          });
        });

      const refundPayload = {
        id: refundNumber,
        refundNumber,
        paymentId,
        receiptNumber: selectedPayment?.receiptNumber || `REC-${paymentId}`,
        patientName: selectedPayment?.patientName || "Patient",
        amount: amt,
        reason: fullReason,
        refundMethod,
        status: "COMPLETED",
        createdAt: new Date().toISOString(),
      };

      showNotification(`Refund of ${formatCurrency(amt)} authorized successfully!`, "success");
      onRefundSuccess(refundPayload);
      handlePrintCreditNote(refundPayload);
      onClose();
    } catch (err: any) {
      console.error("Refund error:", err);
      alert(err.message || "Failed to process refund.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-slate-200/90 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Issue Refund & Credit Note</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Authorize reverse transaction & generate official refund credit note</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Transaction */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Original Transaction <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={paymentId}
              onChange={(e) => {
                const pId = e.target.value;
                setPaymentId(pId);
                const p = payments.find((item) => item.id === pId);
                if (p) setAmount(String(p.amount));
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
            >
              <option value="">Select Transaction to Refund</option>
              {payments
                .filter((p) => p.status === "PAID" || p.status === "PARTIALLY_PAID")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.receiptNumber} • {p.patientName} • {formatCurrency(p.amount)} ({p.method})
                  </option>
                ))}
            </select>
          </div>

          {/* Transaction Info Banner */}
          {selectedPayment && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Patient:</span>
                <strong className="text-slate-900">{selectedPayment.patientName} ({selectedPayment.patientUhid || "—"})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Original Amount:</span>
                <strong className="font-mono text-emerald-700 font-bold">{formatCurrency(selectedPayment.amount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Payment Mode:</span>
                <span className="font-bold text-slate-800">{selectedPayment.method}</span>
              </div>
            </div>
          )}

          {/* Refund Amount & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Refund Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono font-bold text-rose-600 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Refund Disbursement Mode
              </label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
              >
                <option value="ORIGINAL_METHOD">Original Payment Method</option>
                <option value="CASH">Cash Till</option>
                <option value="UPI">UPI Reversal</option>
                <option value="WALLET_CREDIT">Patient Wallet Balance</option>
              </select>
            </div>
          </div>

          {/* Reason Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Standard Refund Reason
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
            >
              <option value="Test Cancelled by Clinician">Test Cancelled by Clinician</option>
              <option value="Duplicate Billing Entry">Duplicate Billing Entry</option>
              <option value="Sample Hemolyzed / Unsuitable">Sample Hemolyzed / Unsuitable</option>
              <option value="Patient Walkout / Cancelled">Patient Walkout / Cancelled</option>
              <option value="Billing Discount Adjusted">Billing Discount Adjusted</option>
              <option value="Other / Clinical Decision">Other / Clinical Decision</option>
            </select>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Specific Reason Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Patient requested cancellation before phlebotomy draw"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:from-rose-500 hover:to-pink-500 active:scale-95 disabled:opacity-50 transition"
            >
              {submitting ? "Processing..." : "Authorize Refund & Print Slip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
