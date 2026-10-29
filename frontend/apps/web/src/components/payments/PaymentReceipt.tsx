"use client";

import React from "react";
import { Printer, X, ShieldCheck, Building2, CheckCircle2, Download } from "lucide-react";

export interface PaymentReceiptProps {
  payment: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentReceipt({ payment, isOpen, onClose }: PaymentReceiptProps) {
  if (!isOpen || !payment) return null;

  const amount = Number(payment.amount || 0);
  const invoiceTotal = Number(payment.invoiceTotal || amount);
  const balanceDue = Math.max(0, Number(payment.invoiceBalance || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Top Modal Action Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Official A4 Clinical Payment Receipt & Tax Voucher
              </h3>
              <p className="text-[11px] text-slate-500">
                NABL ISO 15189:2022 & NABH Compliant • SAC 999312 (Healthcare Nil GST)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f2d52] px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              Print A4 Receipt
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable A4 Receipt Sheet */}
        <div className="rounded-xl border border-slate-300 bg-white p-6 text-slate-900 space-y-5">
          {/* Institutional Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b-2 border-slate-900 pb-4 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#0f2d52]" />
                <h2 className="text-lg font-extrabold tracking-tight text-[#0f2d52]">
                  LABCORE ELIS CLINICAL HOSPITAL & DIAGNOSTIC CENTRE
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                123 Health Avenue, Medical District, Ahmedabad, Gujarat - 380009 | Tel: +91 79 4000 8800
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-600">
                <span>GSTIN: 24AABCL9901R1ZM</span>
                <span>•</span>
                <span>SAC Code: 999312</span>
                <span>•</span>
                <span className="font-semibold text-emerald-700">NABL Cert: MC-4892</span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                PAYMENT RECEIPT
              </span>
              <div className="mt-1.5 font-mono text-xs font-bold text-slate-900">
                Receipt #: {payment.receiptNumber || "RCP-2026-001"}
              </div>
              <div className="font-mono text-[11px] text-slate-500">
                Txn ID: {payment.transactionId || payment.id}
              </div>
            </div>
          </div>

          {/* Patient & Bill Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Patient Particulars
              </div>
              <div className="font-bold text-sm text-slate-900">{payment.patientName || "Walk-in Patient"}</div>
              <div className="font-mono text-slate-700">
                UHID: <strong>{payment.patientUhid || "UHID-2026-1001"}</strong>
              </div>
              <div className="text-slate-600">
                Age / Gender: {payment.patientAge || "—"} Yrs / {payment.patientGender || "—"}
              </div>
              <div className="text-slate-600 font-mono">Contact: {payment.phone || "—"}</div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Clinical & Billing Reference
              </div>
              <div className="font-mono text-slate-800">
                Order / Bill #: <strong>{payment.orderNumber || "ORD-2026-001"}</strong>
              </div>
              <div className="font-mono text-slate-800">
                Invoice #: <strong>{payment.invoiceNumber || "INV-2026-001"}</strong>
              </div>
              <div className="text-slate-700">
                Consultant: <strong>{payment.doctorName || "OPD Duty Consultant"}</strong>
              </div>
              <div className="text-slate-600">
                Department: {payment.department || "Clinical Pathology & Diagnostics"} ({payment.encounterType || "OPD"})
              </div>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 border-r border-slate-200">Clinical Service / Investigation</th>
                  <th className="px-4 py-2.5 border-r border-slate-200">SAC Code</th>
                  <th className="px-4 py-2.5 border-r border-slate-200">Tender Mode</th>
                  <th className="px-4 py-2.5 text-right">Amount Paid (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                <tr>
                  <td className="px-4 py-3 border-r border-slate-200">
                    <div className="font-bold text-slate-900">
                      {payment.testNames || "Clinical Diagnostic & Hospital Care Services"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Counter: {payment.counter || "Counter 01"} • Collected by: {payment.collectedBy || "Cashier Desk"}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700 border-r border-slate-200">
                    999312 (Nil GST)
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200">
                    <span className="font-bold text-slate-900">{payment.method || "CASH"}</span>
                    {payment.instrumentRef && (
                      <div className="font-mono text-[10px] text-slate-500">Ref: {payment.instrumentRef}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-extrabold text-emerald-700">
                    ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-300 text-xs font-bold">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right text-slate-600 border-r border-slate-200">
                    Gross Bill Value: ₹{invoiceTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })} | Net Balance Due: ₹{balanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-base font-extrabold text-slate-900">
                    ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Attestation Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-dashed border-slate-300 pt-4 text-[11px] text-slate-600 gap-3">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Verified Official Hospital / Diagnostic Receipt • Exempt under Notification No. 12/2017-CT (Rate)
            </div>
            <div className="text-right font-mono text-slate-700">
              Authorized Signatory: <strong>{payment.collectedBy || "Front Desk Cashier"}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
