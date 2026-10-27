"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Printer,
  FileText,
  CreditCard,
  Send,
  MessageCircle,
  RotateCcw,
  Receipt,
  User,
  Stethoscope,
  Building,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Download,
  Share2,
  QrCode,
  Tag,
  Bed,
} from "lucide-react";
import type { Invoice } from "./InvoiceTable";
import PixelPerfectInvoice from "./PixelPerfectInvoice";
import ThermalReceipt from "./ThermalReceipt";
import AdvancedPaymentModal from "./AdvancedPaymentModal";
import RefundModal from "./RefundModal";
import WhatsAppShare from "./WhatsAppShare";
import EmailShare from "./EmailShare";
import { invoiceApi, paymentsApi } from "@/lib/api";
import { showInvoiceToast } from "./InvoiceToast";

export interface InvoiceItem {
  id: string | number;
  testName?: string;
  testCode?: string;
  department?: string;
  hsnSacCode?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  amount?: number;
}

export interface InvoiceDetailsProps {
  invoice: Invoice;
  items?: InvoiceItem[];
  taxAmount?: number;
  discountAmount?: number;
  notes?: string;
  patientInfo?: {
    age?: string;
    gender?: string;
    phone?: string;
    address?: string;
    email?: string;
  };
  doctorInfo?: {
    name?: string;
    qualification?: string;
    gstin?: string;
    address?: string;
  };
  payments?: Array<{
    amount: number;
    method: string;
    transactionId?: string;
    paidAt: string;
    receivedBy?: string;
  }>;
  onEdit?: () => void;
  onDelete?: () => void;
  onRecordPayment?: () => void;
}

function formatCurrency(amount?: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(date?: string) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function maskPhoneNumber(phone?: string, unmask = false): string {
  if (!phone) return "—";
  if (unmask) return phone;
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.length >= 10) {
    const prefix = cleaned.slice(0, Math.max(2, cleaned.length - 7));
    const end = cleaned.slice(-2);
    return `${prefix}•••••${end}`;
  }
  return phone;
}

function formatDoctorName(name?: string): string {
  if (!name) return "";
  const cleaned = name.trim().replace(/^(dr\.?|dr\b)\s+/i, "").replace(/^(dr\.?|dr\b)\s+/i, "").trim();
  return cleaned ? `Dr. ${cleaned}` : "";
}

export default function InvoiceDetails({
  invoice,
  items = [],
  taxAmount = 0,
  discountAmount = 0,
  notes,
  patientInfo,
  doctorInfo,
  payments = [],
  onEdit,
  onDelete,
  onRecordPayment,
}: InvoiceDetailsProps) {
  const [unmaskPhone, setUnmaskPhone] = useState(false);

  // Modals state
  const [a4ModalOpen, setA4ModalOpen] = useState(false);
  const [thermalModalOpen, setThermalModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const total = Number(invoice.totalAmount || 0);
  const discount = Number(discountAmount || invoice.discount || 0);
  const gst = Number(taxAmount || invoice.gstAmount || 0);
  const netPayable = Number(invoice.netPayable || total + gst - discount);
  const paid = Number(invoice.paidAmount || 0);
  const pending = Number(
    invoice.pendingAmount !== undefined ? invoice.pendingAmount : Math.max(0, netPayable - paid)
  );
  const isPaid = pending <= 0;
  const doctorDisplayName = formatDoctorName(doctorInfo?.name || invoice.doctorName);

  // Fallback items if none provided
  const lineItems =
    items.length > 0
      ? items
      : invoice.items && invoice.items.length > 0
      ? invoice.items
      : [
          {
            id: "1",
            testName: "Diagnostic Laboratory & Healthcare Service",
            testCode: "SVC-001",
            hsnSacCode: "999312",
            quantity: 1,
            unitPrice: netPayable || total,
            amount: netPayable || total,
          },
        ];

  const handleCollectPaymentSubmit = async (data: any) => {
    try {
      const response = await paymentsApi.create({
        orderId: (invoice.orderId || invoice.id) as string,
        amount: data.amount,
        method: data.paymentMethod as any,
        transactionId: data.transactionId,
        remarks: data.remarks || "Counter Balance Settlement",
      });

      if (response.success) {
        showInvoiceToast("success", `Payment of ₹${data.amount} recorded successfully`);
        setPaymentModalOpen(false);
        window.location.reload();
      } else {
        throw new Error(response.message || "Failed to record payment");
      }
    } catch (err: any) {
      showInvoiceToast("error", err.message || "Payment recording failed");
    }
  };

  const handleRefundSubmit = async (data: any) => {
    try {
      await invoiceApi.processRefund({
        invoiceId: invoice.id as string,
        ...data,
      });
      showInvoiceToast("success", `Refund of ₹${data.amount} processed successfully`);
      setRefundModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      showInvoiceToast("error", err.message || "Refund processing failed");
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* 1. Hospital Facility & Invoice Meta Banner */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 shadow-xs">
                <Receipt className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                    {invoice.invoiceNumber || `INV-${invoice.id}`}
                  </h1>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      isPaid
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : pending > 0 && paid > 0
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {isPaid ? "Fully Paid" : pending > 0 && paid > 0 ? "Partially Paid" : "Unpaid / Due"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>
                    Billed on: <strong className="text-slate-700">{formatDateTime(invoice.createdAt)}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Order Ref: <strong className="text-slate-700 font-mono">{invoice.orderNumber || "—"}</strong>
                  </span>
                  <span>•</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600 border border-slate-200">
                    Station: Counter #1
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setThermalModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 shadow-xs hover:bg-amber-100 transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-amber-600" />
              <span>Thermal Slip (80mm)</span>
            </button>

            <button
              type="button"
              onClick={() => setA4ModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 shadow-xs hover:bg-blue-100 transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              <span>A4 Tax Invoice</span>
            </button>

            {pending > 0 && (
              <button
                type="button"
                onClick={() => setPaymentModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Collect Due ({formatCurrency(pending)})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setWhatsappModalOpen(true)}
              className="flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 bg-white text-emerald-600 hover:bg-emerald-50 shadow-xs transition-colors"
              title="Share bill on WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setEmailModalOpen(true)}
              className="flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 bg-white text-blue-600 hover:bg-blue-50 shadow-xs transition-colors"
              title="Send bill via Email"
            >
              <Send className="h-4 w-4" />
            </button>

            {paid > 0 && (
              <button
                type="button"
                onClick={() => setRefundModalOpen(true)}
                className="flex items-center gap-1 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 shadow-xs transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Refund</span>
              </button>
            )}
          </div>
        </div>

        {/* Facility Credentials Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4 text-xs text-slate-500">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Facility Name</span>
            <span className="font-semibold text-slate-800">LabCore Medical & Diagnostic Center</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Accreditation</span>
            <span className="font-semibold text-slate-800">NABL ISO 15189 • NABH Entry-Level</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Clinical Reg #</span>
            <span className="font-mono font-semibold text-slate-800">CEA-DL-2024-8841</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">GSTIN / Tax ID</span>
            <span className="font-mono font-semibold text-slate-800">07AAAAA0000A1Z5</span>
          </div>
        </div>
      </section>

      {/* 2. Patient Demographics & Clinical Encounter Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-2">
          <User className="h-4 w-4 text-blue-600" />
          Patient Demographics & Encounter Profile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name</span>
            <span className="font-bold text-sm text-slate-900 block mt-0.5">
              {invoice.patientName || "Walk-in Patient"}
            </span>
            <div className="flex items-center gap-2 text-slate-500 font-mono mt-0.5">
              <span className="text-blue-700 font-semibold">UHID: {invoice.patientUhid || "—"}</span>
              <span>•</span>
              <span>{patientInfo?.gender || invoice.patientInfo?.gender || "—"}</span>
              {patientInfo?.age && <span>• {patientInfo.age}</span>}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Phone</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono font-medium text-slate-800">
                {maskPhoneNumber(patientInfo?.phone || invoice.patientPhone, unmaskPhone)}
              </span>
              <button
                type="button"
                onClick={() => setUnmaskPhone(!unmaskPhone)}
                className="text-slate-400 hover:text-blue-600"
                title={unmaskPhone ? "Mask phone" : "Reveal phone (DPDP Act)"}
              >
                {unmaskPhone ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {patientInfo?.email && (
              <span className="text-[11px] text-slate-400 block mt-0.5">{patientInfo.email}</span>
            )}
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Referring Clinician</span>
            <span className="font-bold text-slate-900 block mt-0.5">
              {doctorDisplayName || "Self / Walk-in"}
            </span>
            {doctorInfo?.qualification && (
              <span className="text-[11px] text-slate-500 block mt-0.5">{doctorInfo.qualification}</span>
            )}
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Encounter / Tariff Type</span>
            <span className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-200 px-2 py-0.5 font-bold text-blue-700 text-xs mt-1">
              {invoice.paymentMode === "TPA" ? "Cashless Insurance / TPA" : "General OPD / Private"}
            </span>
            {patientInfo?.address && (
              <span className="text-[11px] text-slate-500 block mt-1 line-clamp-1">{patientInfo.address}</span>
            )}
          </div>
        </div>
      </section>

      {/* 3. Itemized Clinical Services Table */}
      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            Itemized Clinical Services & Tests ({lineItems.length} items)
          </h2>
          <span className="text-[11px] font-mono text-slate-500">SAC: 999312 / 999311</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/90">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Service / Investigation Name</th>
                <th className="px-5 py-3">SAC / Code</th>
                <th className="px-5 py-3 text-center">Qty</th>
                <th className="px-5 py-3 text-right">Unit Rate (₹)</th>
                <th className="px-5 py-3 text-right">Concession</th>
                <th className="px-5 py-3 text-right">Taxable</th>
                <th className="px-5 py-3 text-right">Net Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {lineItems.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-400">{idx + 1}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900">{item.testName || "Healthcare Service"}</div>
                    {item.testCode && (
                      <div className="text-[10px] font-mono text-slate-400">{item.testCode}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-600">{item.hsnSacCode || "999312"}</td>
                  <td className="px-5 py-3.5 text-center font-mono font-bold">{item.quantity || 1}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-600">
                    {formatCurrency(item.unitPrice || item.amount || 0)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-emerald-700">
                    {item.discount ? `-${formatCurrency(item.discount)}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-600">
                    {formatCurrency((item.unitPrice || item.amount || 0) * (item.quantity || 1) - (item.discount || 0))}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(item.amount || (item.unitPrice || 0) * (item.quantity || 1))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Financial Settlement & Tax Summary Grid */}
        <div className="border-t border-slate-200 bg-slate-50/60 p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-2 max-w-md text-xs text-slate-500">
              <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">
                Statutory & Tax Declaration
              </span>
              <p>
                Healthcare services provided by clinical establishments are exempt from GST in accordance with
                Notification No. 12/2017 - Central Tax (Rate) under SAC 999312 / 999311.
              </p>
              {notes && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-slate-700">
                  <strong className="block text-[10px] text-slate-400 uppercase">Encounter Notes:</strong>
                  <span>{notes}</span>
                </div>
              )}
            </div>

            <div className="w-full lg:w-80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Services Gross Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(total)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Concession / Discount:</span>
                  <span className="font-mono">-{formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Taxable Value:</span>
                <span className="font-mono font-medium text-slate-900">
                  {formatCurrency(Math.max(0, total - discount))}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>GST Tax (Exempt 0%):</span>
                <span className="font-mono font-medium text-slate-900">{formatCurrency(gst)}</span>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>Net Payable:</span>
                <span className="font-mono text-base font-black text-blue-900">{formatCurrency(netPayable)}</span>
              </div>

              <div className="flex justify-between text-xs text-emerald-700 font-bold">
                <span>Amount Realized / Paid:</span>
                <span className="font-mono">{formatCurrency(paid)}</span>
              </div>

              {pending > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 flex justify-between font-bold text-rose-700">
                  <span>Outstanding Balance Due:</span>
                  <span className="font-mono text-sm">{formatCurrency(pending)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Payments & Real-World Settlement Tender History */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            Tender Receipts & Settlement Audit Trail ({payments.length} transactions)
          </h2>
          {pending > 0 && (
            <button
              type="button"
              onClick={() => setPaymentModalOpen(true)}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              + Collect Remaining Due
            </button>
          )}
        </div>

        {payments.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No payments have been recorded for this invoice yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Date & Time</th>
                  <th className="px-4 py-2.5">Payment Method</th>
                  <th className="px-4 py-2.5">Transaction Ref / UTR</th>
                  <th className="px-4 py-2.5">Cashier</th>
                  <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                  <th className="px-4 py-2.5 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-700 font-medium">{formatDateTime(p.paidAt)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 font-bold text-[10px] text-slate-700">
                        {p.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{p.transactionId || "Counter Direct"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.receivedBy || "Cashier Counter #1"}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setThermalModalOpen(true)}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Receipt Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MODALS INTEGRATION */}
      {/* 1. Thermal Receipt (80mm/58mm POS) */}
      {thermalModalOpen && (
        <ThermalReceipt
          invoice={{
            invoiceNumber: invoice.invoiceNumber,
            patientName: invoice.patientName,
            patientUhid: invoice.patientUhid,
            patientPhone: invoice.patientPhone,
            patientAge: patientInfo?.age || invoice.patientInfo?.age,
            patientGender: patientInfo?.gender || invoice.patientInfo?.gender,
            orderNumber: invoice.orderNumber,
            doctorName: doctorDisplayName,
            items: lineItems.map((item) => ({
              testName: item.testName,
              testCode: item.testCode,
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || item.amount || 0,
              total: item.amount || (item.unitPrice || 0) * (item.quantity || 1),
              hsnSacCode: item.hsnSacCode || "999312",
            })),
            subtotal: total,
            discount: discount,
            gstAmount: gst,
            cgstAmount: (invoice as any)?.cgstAmount || (gst ? gst / 2 : 0),
            sgstAmount: (invoice as any)?.sgstAmount || (gst ? gst / 2 : 0),
            igstAmount: (invoice as any)?.igstAmount || 0,
            netPayable: netPayable,
            paidAmount: paid,
            pendingAmount: pending,
            paymentStatus: isPaid ? "PAID" : "PENDING",
            paymentMode: invoice.paymentMode,
            createdAt: invoice.createdAt,
            dueDate: invoice.dueDate,
          }}
          cashierName={payments[0]?.receivedBy || "Counter Cashier"}
          labInfo={{
            name: "LabCore Healthcare Facility",
          }}
          paperWidth="80mm"
          onSwitchToA4={() => {
            setThermalModalOpen(false);
            setA4ModalOpen(true);
          }}
          onClose={() => setThermalModalOpen(false)}
        />
      )}

      {/* 2. Pixel Perfect A4 Tax Invoice */}
      {a4ModalOpen && (
        <PixelPerfectInvoice
          invoice={{
            id: String(invoice.id),
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.createdAt,
            invoiceTime: invoice.createdAt,
            paymentMode: (invoice.paymentMode as string) || "CASH",
            transactionId: payments[0]?.transactionId || invoice.orderNumber,
            patientName: invoice.patientName,
            patientId: invoice.patientId == null ? undefined : String(invoice.patientId),
            patientUhid: invoice.patientUhid,
            age: patientInfo?.age || invoice.patientInfo?.age,
            gender: patientInfo?.gender || invoice.patientInfo?.gender,
            phone: invoice.patientPhone,
            address: patientInfo?.address || invoice.patientInfo?.address,
            collectedBy: payments[0]?.receivedBy,
            collectionDate: invoice.createdAt,
            refDoctor: doctorDisplayName,
            refDoctorQualification: doctorInfo?.qualification,
            items: lineItems.map((item: any) => ({
              id: item.id,
              testName: item.testName || "Diagnostic Investigation",
              testCode: item.testCode,
              hsnSacCode: item.hsnSacCode || "999312",
              quantity: item.quantity || 1,
              unitPrice: Number(item.unitPrice || item.total || 0),
              unitRate: Number(item.unitPrice || item.total || 0),
              amount: Number(item.total || item.amount || item.unitPrice || 0),
              discount: item.discount || 0,
              taxableValue: Number(item.taxableValue || item.total || item.amount || 0),
            })),
            subtotal: total,
            discount: discount,
            taxableAmount: Math.max(0, total - discount),
            cgstAmount: (invoice as any)?.cgstAmount || (gst ? gst / 2 : 0),
            sgstAmount: (invoice as any)?.sgstAmount || (gst ? gst / 2 : 0),
            igstAmount: (invoice as any)?.igstAmount || 0,
            totalTax: gst,
            netPayable: netPayable,
            paidAmount: paid,
            pendingAmount: pending,
            paymentStatus: isPaid ? "PAID" : "PENDING",
          }}
          onSwitchToThermal={() => {
            setA4ModalOpen(false);
            setThermalModalOpen(true);
          }}
          onClose={() => setA4ModalOpen(false)}
        />
      )}

      {/* 3. Advanced Payment Collection Modal */}
      <AdvancedPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        invoice={{
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          orderNumber: invoice.orderNumber,
          patientName: invoice.patientName,
          patientUhid: invoice.patientUhid,
          patientPhone: invoice.patientPhone,
          patientEmail: invoice.patientEmail,
          pendingAmount: pending,
          netPayable: netPayable,
          totalAmount: total,
          paidAmount: paid,
          discount: discount,
          gstAmount: gst,
          paymentMode: invoice.paymentMode,
          createdAt: invoice.createdAt,
        }}
        existingPayments={payments as any}
        onPaymentSubmit={handleCollectPaymentSubmit}
        onGenerateReceipt={() => {
          setPaymentModalOpen(false);
          setThermalModalOpen(true);
        }}
      />

      {/* 4. Refund Modal */}
      <RefundModal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        invoice={invoice}
        onRefundSubmit={handleRefundSubmit}
      />

      {/* 5. WhatsApp Share Modal */}
      <WhatsAppShare
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        invoice={invoice as any}
      />

      {/* 6. Email Share Modal */}
      <EmailShare
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        invoice={invoice as any}
      />
    </div>
  );
}
