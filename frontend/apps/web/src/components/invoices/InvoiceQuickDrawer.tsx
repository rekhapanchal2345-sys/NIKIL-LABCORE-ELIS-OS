"use client";

import React, { useState } from "react";
import {
  X,
  FileText,
  Printer,
  CreditCard,
  Send,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Phone,
  Mail,
  Building,
  DollarSign,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import type { Invoice } from "./InvoiceTable";

interface InvoiceQuickDrawerProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onCollectPayment?: (invoice: Invoice) => void;
  onPrint?: (invoice: Invoice, type: "thermal" | "a4") => void;
  onSendBill?: (invoice: Invoice, method: "whatsapp" | "email") => void;
  onRefund?: (invoice: Invoice) => void;
}

function formatDoctorName(name?: string): string {
  if (!name) return "";
  const cleaned = name.trim().replace(/^(dr\.?|dr\b)\s+/i, "").replace(/^(dr\.?|dr\b)\s+/i, "").trim();
  return cleaned ? `Dr. ${cleaned}` : "";
}

function maskPhoneNumber(phone?: string, unmask = false): string {
  if (!phone) return "";
  if (unmask) return phone;
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.length >= 10) {
    const prefix = cleaned.slice(0, Math.max(2, cleaned.length - 7));
    const end = cleaned.slice(-2);
    return `${prefix}•••••${end}`;
  }
  return phone;
}

export default function InvoiceQuickDrawer({
  invoice,
  isOpen,
  onClose,
  onCollectPayment,
  onPrint,
  onSendBill,
  onRefund,
}: InvoiceQuickDrawerProps) {
  const [unmaskPhone, setUnmaskPhone] = useState(false);

  if (!isOpen || !invoice) return null;

  const totalAmount = Number(invoice.totalAmount || 0);
  const discount = Number(invoice.discount || 0);
  const gstAmount = Number(invoice.gstAmount || 0);
  const netPayable = Number(invoice.netPayable || 0);
  const paidAmount = Number(invoice.paidAmount || 0);
  const pendingAmount = Number(invoice.pendingAmount ?? Math.max(0, netPayable - paidAmount));
  const isPaid = pendingAmount <= 0;
  const doctorDisplay = formatDoctorName(invoice.doctorName);

  const formatINR = (amount: number) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-out sm:border-l sm:border-slate-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 text-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-600 shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-slate-900 font-mono">
                  {invoice.invoiceNumber || "Invoice Details"}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${isPaid
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : pendingAmount > 0 && paidAmount > 0
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                >
                  {invoice.paymentStatus || (isPaid ? "PAID" : "PENDING")}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Order #{invoice.orderNumber || "—"} • Created:{" "}
                {invoice.createdAt ? new Date(invoice.createdAt).toLocaleString("en-IN") : "—"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Action Pills Bar */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 p-2.5 border border-slate-200 shadow-sm">
            {!isPaid && onCollectPayment && (
              <button
                onClick={() => onCollectPayment(invoice)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Collect ₹{pendingAmount.toFixed(0)}
              </button>
            )}

            {onPrint && (
              <>
                <button
                  onClick={() => onPrint(invoice, "thermal")}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-sm hover:bg-amber-100 transition-all"
                >
                  <Printer className="h-3.5 w-3.5 text-amber-600" />
                  Thermal Slip
                </button>
                <button
                  onClick={() => onPrint(invoice, "a4")}
                  className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 shadow-sm hover:bg-blue-100 transition-all"
                >
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  A4 Tax Invoice
                </button>
              </>
            )}

            {onSendBill && (
              <button
                onClick={() => onSendBill(invoice, "whatsapp")}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-600 shadow-sm hover:bg-emerald-50 transition-colors"
              >
                <Send className="h-3.5 w-3.5 text-emerald-600" />
                WhatsApp
              </button>
            )}

            {paidAmount > 0 && onRefund && (
              <button
                onClick={() => onRefund(invoice)}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-100 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Refund
              </button>
            )}
          </div>

          {/* Financial Summary Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
                  Total Billable
                </span>
                <p className="text-xl font-black text-slate-900 font-mono">{formatINR(netPayable)}</p>
                <span className="text-[11px] text-slate-500">
                  Base: {formatINR(totalAmount)} • Tax: {formatINR(gstAmount)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
                  {isPaid ? "Status" : "Outstanding Due"}
                </span>
                {isPaid ? (
                  <div className="flex items-center justify-end gap-1.5 text-emerald-700 font-bold mt-1">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Settled In Full</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-xl font-black text-rose-600 font-mono">{formatINR(pendingAmount)}</p>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      Paid: {formatINR(paidAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tax & Discount Breakdown */}
            <div className="grid grid-cols-4 gap-2 pt-3 text-center text-xs">
              <div className="rounded-xl bg-slate-50 p-2 border border-slate-200">
                <div className="text-[10px] text-slate-500">Subtotal</div>
                <div className="font-semibold text-slate-900 font-mono">{formatINR(totalAmount)}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2 border border-slate-200">
                <div className="text-[10px] text-slate-500">Discount</div>
                <div className="font-semibold text-rose-600 font-mono">
                  {discount > 0 ? `-${formatINR(discount)}` : "₹0"}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2 border border-slate-200">
                <div className="text-[10px] text-slate-500">GST (18%)</div>
                <div className="font-semibold text-blue-700 font-mono">{formatINR(gstAmount)}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2 border border-slate-200">
                <div className="text-[10px] text-slate-500">Mode</div>
                <div className="font-semibold text-slate-700">{invoice.paymentMode || "—"}</div>
              </div>
            </div>
          </div>

          {/* Patient & Doctor Information */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Patient Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2.5 text-blue-600">
                <User className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Patient Details</h3>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {invoice.patientName || "Walk-in Patient"}
              </p>
              {invoice.patientUhid && (
                <p className="text-xs font-mono text-blue-700 font-medium mt-0.5">
                  UHID: {invoice.patientUhid}
                </p>
              )}
              {invoice.patientPhone && (
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span>{maskPhoneNumber(invoice.patientPhone, unmaskPhone)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUnmaskPhone(!unmaskPhone)}
                    className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                    title={unmaskPhone ? "Mask Phone" : "Unmask Phone (DPDP Act)"}
                  >
                    {unmaskPhone ? (
                      <>
                        <EyeOff className="h-3 w-3" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" />
                        <span>Show</span>
                      </>
                    )}
                  </button>
                </div>
              )}
              {invoice.patientEmail && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <Mail className="h-3 w-3 text-slate-400" />
                  <span className="truncate">{invoice.patientEmail}</span>
                </div>
              )}
            </div>

            {/* Doctor Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2.5 text-indigo-600">
                <Building className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Referring Doctor</h3>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {doctorDisplay || "Direct Walk-in / Self"}
              </p>
              {invoice.doctorEmail && (
                <p className="text-xs text-slate-500 mt-1">{invoice.doctorEmail}</p>
              )}
            </div>
          </div>

          {/* Diagnostic Test Items List */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Diagnostic Services ({(invoice as any).items?.length || invoice.samples?.length || 1})
              </h3>
               <span className="text-[11px] text-slate-500">Service codes shown per line item</span>
            </div>

            <div className="divide-y divide-slate-100">
              {((invoice as any).items || []).length > 0 ? (
                ((invoice as any).items || []).map((item: any, idx: number) => (
                  <div key={item.id || idx} className="flex items-center justify-between px-4 py-3 text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{item.testName || "Laboratory Investigation"}</p>
                      {item.testCode && (
                        <p className="text-[10px] font-mono text-slate-500">Code: {item.testCode}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 font-mono">{formatINR(item.total || item.unitPrice || 0)}</p>
                      <p className="text-[10px] text-slate-400">Qty: {item.quantity || 1}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-slate-500 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">Diagnostic Investigation Services</p>
                    <p className="text-[10px] text-slate-400">Order #{invoice.orderNumber || "—"}</p>
                  </div>
                  <div className="font-bold text-slate-900 font-mono">{formatINR(totalAmount)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Receipts Timeline */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Payment Transactions
              </h3>
              <span className="text-xs font-semibold text-emerald-700 font-mono">
                Realized: {formatINR(paidAmount)}
              </span>
            </div>

            {((invoice as any).payments || []).length > 0 ? (
              <div className="space-y-2">
                {((invoice as any).payments || []).map((p: any, idx: number) => (
                  <div
                    key={p.id || idx}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs border border-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <div>
                        <div className="font-semibold text-slate-800">
                          {p.method || "CASH"} Payment • <span className="font-mono">{formatINR(p.amount)}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {p.paidAt ? new Date(p.paidAt).toLocaleString("en-IN") : "—"}{" "}
                          {p.transactionId && `• Ref: ${p.transactionId}`}
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      SUCCESS
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-xs text-amber-800">
                No payment transactions recorded yet. Balance of {formatINR(pendingAmount)} is pending.
              </div>
            )}
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="border-t border-slate-200 bg-white px-6 py-3.5 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Invoice ID: <span className="font-mono text-blue-700 font-semibold">{invoice.id}</span>
          </span>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </>
  );
}
