"use client";

import React, { useState, useMemo } from "react";
import {
  Clock,
  AlertCircle,
  AlertTriangle,
  Send,
  CreditCard,
  Phone,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  DollarSign,
  User,
  Copy,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  ShieldCheck,
  Flame,
  CheckSquare,
  Square,
  FileText,
} from "lucide-react";
import type { Invoice } from "./InvoiceTable";
import { showInvoiceToast } from "./InvoiceToast";
import { paymentsApi, invoiceApi } from "@/lib/api";

interface DueAgingProps {
  invoices: Invoice[];
  onCollectPayment?: (invoice: Invoice) => void;
  onSendBill?: (invoice: Invoice, method: "whatsapp" | "email") => void;
  onRefresh?: () => void;
}

type AgingBucket = "all" | "0-30" | "31-60" | "61-90" | "90+";

interface AgingInvoice extends Invoice {
  daysOverdue: number;
  bucket: "0-30" | "31-60" | "61-90" | "90+";
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

export default function DueAgingTracker({
  invoices,
  onCollectPayment,
  onSendBill,
  onRefresh,
}: DueAgingProps) {
  const [selectedBucket, setSelectedBucket] = useState<AgingBucket>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unmaskedRows, setUnmaskedRows] = useState<Record<string | number, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [writeOffModalInvoice, setWriteOffModalInvoice] = useState<AgingInvoice | null>(null);
  const [writeOffReason, setWriteOffReason] = useState<string>("Small rounding balance waiver");
  const [isWritingOff, setIsWritingOff] = useState(false);

  // Filter only invoices with pending amounts
  const overdueInvoices = useMemo<AgingInvoice[]>(() => {
    const today = new Date().getTime();

    return invoices
      .filter((inv) => {
        const pending = Number(inv.pendingAmount ?? (Number(inv.netPayable || 0) - Number(inv.paidAmount || 0)));
        return pending > 0 && inv.status !== "REFUNDED";
      })
      .map((inv) => {
        const createdDate = inv.createdAt ? new Date(inv.createdAt).getTime() : today;
        const diffDays = Math.max(0, Math.floor((today - createdDate) / (1000 * 60 * 60 * 24)));

        let bucket: "0-30" | "31-60" | "61-90" | "90+";
        if (diffDays <= 30) bucket = "0-30";
        else if (diffDays <= 60) bucket = "31-60";
        else if (diffDays <= 90) bucket = "61-90";
        else bucket = "90+";

        return {
          ...inv,
          daysOverdue: diffDays,
          bucket,
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [invoices]);

  // Bucket statistics
  const stats = useMemo(() => {
    const b0_30 = overdueInvoices.filter((i) => i.bucket === "0-30");
    const b31_60 = overdueInvoices.filter((i) => i.bucket === "31-60");
    const b61_90 = overdueInvoices.filter((i) => i.bucket === "61-90");
    const b90_plus = overdueInvoices.filter((i) => i.bucket === "90+");

    const sumPending = (list: AgingInvoice[]) =>
      list.reduce((acc, i) => acc + Number(i.pendingAmount || 0), 0);

    const totalOverdue = sumPending(overdueInvoices);

    return {
      totalOverdue,
      totalCount: overdueInvoices.length,
      b0_30: { count: b0_30.length, amount: sumPending(b0_30) },
      b31_60: { count: b31_60.length, amount: sumPending(b31_60) },
      b61_90: { count: b61_90.length, amount: sumPending(b61_90) },
      b90_plus: { count: b90_plus.length, amount: sumPending(b90_plus) },
    };
  }, [overdueInvoices]);

  // Filter by selected bucket and search query
  const filteredList = useMemo(() => {
    return overdueInvoices.filter((item) => {
      if (selectedBucket !== "all" && item.bucket !== selectedBucket) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = (item.patientName || "").toLowerCase().includes(query);
        const matchUhid = (item.patientUhid || "").toLowerCase().includes(query);
        const matchInv = (item.invoiceNumber || "").toLowerCase().includes(query);
        const matchPhone = (item.patientPhone || "").toLowerCase().includes(query);
        return matchName || matchUhid || matchInv || matchPhone;
      }
      return true;
    });
  }, [overdueInvoices, selectedBucket, searchQuery]);

  const toggleUnmaskPhone = (id: string | number) => {
    setUnmaskedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleSelect = (id: string | number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map((i) => i.id));
    }
  };

  const formatINR = (amt: number) => {
    return `₹${Number(amt || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleSendWhatsAppReminder = (inv: AgingInvoice) => {
    const patientName = inv.patientName || "Patient";
    const amount = Number(inv.pendingAmount || 0).toFixed(2);
    const invNo = inv.invoiceNumber || "";
    const phone = (inv.patientPhone || "").replace(/[^0-9]/g, "");

    const message = encodeURIComponent(
      `Dear ${patientName},\nThis is a payment reminder for the pending balance of ₹${amount} for invoice #${invNo} (${inv.daysOverdue} days overdue).\n\nPlease contact the billing desk for payment assistance.\nThank you.`
    );

    if (phone) {
      window.open(`https://wa.me/${phone.startsWith("91") ? phone : "91" + phone}?text=${message}`, "_blank");
      showInvoiceToast("success", `Opened WhatsApp demand for #${invNo}`);
    } else {
      showInvoiceToast("error", `Patient phone number missing for invoice #${invNo}`);
    }
  };

  const handleBatchWhatsAppDemand = () => {
    const selected = filteredList.filter((i) => selectedIds.includes(i.id));
    if (selected.length === 0) return;
    handleSendWhatsAppReminder(selected[0]);
    showInvoiceToast("info", `Initiated WhatsApp demand 1 of ${selected.length}`);
  };

  const handleCopyPaymentLink = (inv: AgingInvoice) => {
    const text = `Invoice #${inv.invoiceNumber} | Balance due: ₹${Number(inv.pendingAmount || 0).toFixed(2)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(String(inv.id));
    setTimeout(() => setCopiedId(null), 2000);
    showInvoiceToast("success", "Copied invoice balance reference");
  };

  const handleExecuteWriteOff = async () => {
    if (!writeOffModalInvoice) return;
    setIsWritingOff(true);
    try {
      const pendingAmt = Number(writeOffModalInvoice.pendingAmount || 0);
      
      // Record write-off clearance payment
      await paymentsApi.create({
        orderId: writeOffModalInvoice.orderId,
        amount: pendingAmt,
        method: "CASH",
        remarks: `Authorized Debt Write-off: ${writeOffReason} (Amount: ₹${pendingAmt})`,
      });

      showInvoiceToast(
        "success",
        `Invoice #${writeOffModalInvoice.invoiceNumber} balance of ₹${pendingAmt} written off successfully`
      );
      setWriteOffModalInvoice(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("Write-off error:", err);
      showInvoiceToast("error", err.message || "Failed to write off balance");
    } finally {
      setIsWritingOff(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Invoice Number",
      "Patient Name",
      "UHID",
      "Phone",
      "Referring Doctor",
      "Issue Date",
      "Days Overdue",
      "Aging Bucket",
      "Total Amount",
      "Paid Amount",
      "Due Balance",
    ];

    const rows = filteredList.map((i) => [
      i.invoiceNumber || "",
      `"${i.patientName || ""}"`,
      i.patientUhid || "",
      i.patientPhone || "",
      `"${formatDoctorName(i.doctorName) || ""}"`,
      i.createdAt ? new Date(i.createdAt).toLocaleDateString("en-IN") : "",
      i.daysOverdue,
      i.bucket,
      i.totalAmount || 0,
      i.paidAmount || 0,
      i.pendingAmount || 0,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Due_Aging_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showInvoiceToast("success", `Exported ${filteredList.length} aging records to CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                Accounts Receivable (A/R)
              </span>
              <span className="text-xs text-slate-500">
                Total Overdue Accounts: {stats.totalCount}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
              Outstanding Dues &amp; Aging Debt Tracker
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated 0-30, 31-60, 61-90, and 90+ days aging buckets, batch WhatsApp payment demands, and balance reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-all"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Export Aging CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aging Bucket Interactive Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 0-30 Days */}
        <div
          onClick={() => setSelectedBucket(selectedBucket === "0-30" ? "all" : "0-30")}
          className={`cursor-pointer rounded-xl border p-5 transition-all shadow-sm ${
            selectedBucket === "0-30"
              ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400/40"
              : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              0 - 30 DAYS
            </span>
            <span className="text-xs font-bold text-slate-500">{stats.b0_30.count} Invoices</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3 font-mono">{formatINR(stats.b0_30.amount)}</p>
          <div className="mt-2 text-[11px] text-emerald-700 font-medium">
            Recent / Normal Credit Period
          </div>
        </div>

        {/* 31-60 Days */}
        <div
          onClick={() => setSelectedBucket(selectedBucket === "31-60" ? "all" : "31-60")}
          className={`cursor-pointer rounded-xl border p-5 transition-all shadow-sm ${
            selectedBucket === "31-60"
              ? "border-amber-500 bg-amber-50 ring-2 ring-amber-400/40"
              : "border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              31 - 60 DAYS
            </span>
            <span className="text-xs font-bold text-slate-500">{stats.b31_60.count} Invoices</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3 font-mono">{formatINR(stats.b31_60.amount)}</p>
          <div className="mt-2 text-[11px] text-amber-700 font-medium">Follow-up Reminder Required</div>
        </div>

        {/* 61-90 Days */}
        <div
          onClick={() => setSelectedBucket(selectedBucket === "61-90" ? "all" : "61-90")}
          className={`cursor-pointer rounded-xl border p-5 transition-all shadow-sm ${
            selectedBucket === "61-90"
              ? "border-orange-500 bg-orange-50 ring-2 ring-orange-400/40"
              : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800">
              61 - 90 DAYS
            </span>
            <span className="text-xs font-bold text-slate-500">{stats.b61_90.count} Invoices</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3 font-mono">{formatINR(stats.b61_90.amount)}</p>
          <div className="mt-2 text-[11px] text-orange-700 font-medium">Urgent Collection Escalation</div>
        </div>

        {/* 90+ Days */}
        <div
          onClick={() => setSelectedBucket(selectedBucket === "90+" ? "all" : "90+")}
          className={`cursor-pointer rounded-xl border p-5 transition-all shadow-sm ${
            selectedBucket === "90+"
              ? "border-rose-500 bg-rose-50 ring-2 ring-rose-400/40"
              : "border-slate-200 bg-white hover:border-rose-200 hover:bg-rose-50/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
              90+ DAYS
            </span>
            <span className="text-xs font-bold text-slate-500">{stats.b90_plus.count} Invoices</span>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-3 font-mono">{formatINR(stats.b90_plus.amount)}</p>
          <div className="mt-2 text-[11px] text-rose-700 font-medium">Critical Delinquent / Bad Debt</div>
        </div>
      </div>

      {/* Batch Operations Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-slate-900 p-3.5 text-white shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-lg bg-rose-600 px-2.5 py-1 font-bold text-white">
              {selectedIds.length} Selected
            </span>
            <span className="text-slate-300">
              Batch debt actions for selected accounts:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchWhatsAppDemand}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
              Batch WhatsApp Demand
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="rounded-lg p-1 text-slate-400 hover:text-white"
            >
              ✕ Clear
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Bucket Filter:
          </span>
          <div className="flex gap-1">
            {(["all", "0-30", "31-60", "61-90", "90+"] as AgingBucket[]).map((bucket) => (
              <button
                key={bucket}
                onClick={() => setSelectedBucket(bucket)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  selectedBucket === bucket
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {bucket === "all" ? "All Buckets" : `${bucket} d`}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient name, UHID, phone, invoice #..."
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Overdue Accounts Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredList.length > 0 && selectedIds.length === filteredList.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-4 py-3">Patient & UHID (DPDP)</th>
                <th className="px-4 py-3">Invoice & Date</th>
                <th className="px-4 py-3">Aging Risk</th>
                <th className="px-4 py-3 text-right">Total (₹)</th>
                <th className="px-4 py-3 text-right">Paid (₹)</th>
                <th className="px-4 py-3 text-right">Due Balance (₹)</th>
                <th className="px-4 py-3 text-right min-w-[210px]">Action & Recovery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                    <p className="text-sm font-bold text-slate-700">No overdue accounts found</p>
                    <p className="text-xs text-slate-400">All collections in this credit bucket are settled!</p>
                  </td>
                </tr>
              ) : (
                filteredList.map((inv) => {
                  const isUnmasked = Boolean(unmaskedRows[inv.id]);
                  const isSelected = selectedIds.includes(inv.id);
                  const isSmallDue = Number(inv.pendingAmount || 0) <= 50;

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? "bg-indigo-50/60" : ""
                      }`}
                    >
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(inv.id)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{inv.patientName || "Walk-in Patient"}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          {inv.patientUhid && (
                            <span className="font-mono text-indigo-600 font-semibold">
                              {inv.patientUhid}
                            </span>
                          )}
                          {inv.patientPhone && (
                            <span className="font-mono text-slate-600 inline-flex items-center gap-1">
                              • {maskPhoneNumber(inv.patientPhone, isUnmasked)}
                              <button
                                type="button"
                                onClick={() => toggleUnmaskPhone(inv.id)}
                                className="text-slate-400 hover:text-slate-700 p-0.5"
                                title={isUnmasked ? "Mask Phone" : "Unmask Phone (DPDP Act)"}
                              >
                                {isUnmasked ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </button>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-slate-900">
                          {inv.invoiceNumber}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("en-IN") : "—"}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            inv.bucket === "0-30"
                              ? "bg-emerald-100 text-emerald-800"
                              : inv.bucket === "31-60"
                              ? "bg-amber-100 text-amber-800"
                              : inv.bucket === "61-90"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {inv.daysOverdue} Days Due ({inv.bucket})
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">
                        {formatINR(inv.netPayable || inv.totalAmount || 0)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-emerald-600 font-medium">
                        {formatINR(inv.paidAmount || 0)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-black text-rose-600 text-sm">
                        {formatINR(inv.pendingAmount || 0)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onCollectPayment && (
                            <button
                              onClick={() => onCollectPayment(inv)}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors"
                            >
                              Collect
                            </button>
                          )}
                          <button
                            onClick={() => handleSendWhatsAppReminder(inv)}
                            title="Send WhatsApp Payment Demand"
                            className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 transition-colors"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleCopyPaymentLink(inv)}
                            title="Copy UPI Payment Link"
                            className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600 hover:bg-slate-200 transition-colors"
                          >
                            {copiedId === String(inv.id) ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {/* Small balance write-off trigger */}
                          <button
                            onClick={() => setWriteOffModalInvoice(inv)}
                            title="Write-off / Bad Debt Waiver"
                            className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 transition-colors"
                          >
                            Write-Off
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Small Balance & Bad Debt Write-Off Modal */}
      {writeOffModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                Authorize Debt Write-Off
              </h3>
              <button
                type="button"
                onClick={() => setWriteOffModalInvoice(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-rose-50 p-4 border border-rose-200 text-xs space-y-2 text-rose-900">
              <div className="flex justify-between font-bold">
                <span>Invoice Number:</span>
                <span className="font-mono">{writeOffModalInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Patient:</span>
                <span>{writeOffModalInvoice.patientName}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-rose-700 border-t border-rose-200 pt-1.5">
                <span>Write-Off Due Amount:</span>
                <span className="font-mono">{formatINR(writeOffModalInvoice.pendingAmount || 0)}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-700">Write-Off Justification Note *</label>
              <select
                value={writeOffReason}
                onChange={(e) => setWriteOffReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value="Small rounding balance waiver">Small rounding balance waiver (≤ ₹50)</option>
                <option value="Approved Manager Bad Debt Provision">Approved Manager Bad Debt Provision</option>
                <option value="Clinical Investigation Dispute Waiver">Clinical Investigation Dispute Waiver</option>
                <option value="Deceased / Indigent Patient Concession">Deceased / Indigent Patient Concession</option>
              </select>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                disabled={isWritingOff}
                onClick={handleExecuteWriteOff}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow hover:bg-rose-500 disabled:opacity-50 transition-colors"
              >
                {isWritingOff ? "Executing..." : "Confirm & Write-Off"}
              </button>
              <button
                type="button"
                onClick={() => setWriteOffModalInvoice(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
