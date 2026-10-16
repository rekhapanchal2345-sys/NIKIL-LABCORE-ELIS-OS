"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { invoiceApi } from "@/lib/api";
import {
  TrendingUp,
  CreditCard,
  AlertCircle,
  Percent,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Info,
  Layers,
  HelpCircle,
} from "lucide-react";
import type { Invoice } from "./InvoiceTable";

interface BillingMetricsData {
  totalRevenue: number;
  totalTaxableRevenue?: number;
  totalGstAmount?: number;
  totalBilledTurnover?: number;
  paidInvoices: {
    count: number;
    amount: number;
  };
  partialInvoices?: {
    count: number;
    paidAmount: number;
    dueAmount: number;
  };
  unpaidInvoices?: {
    count: number;
    dueAmount: number;
  };
  pendingDueAmount: number;
  discountsAndRefunds: {
    discounts: number;
    refunds: number;
    total: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
  totalInvoices?: number;
}

interface BillingMetricsProps {
  startDate?: string;
  endDate?: string;
  invoices?: Invoice[];
  activeStatusFilter?: string;
  onFilterStatus?: (status: string) => void;
}

function formatCurrency(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function BillingMetrics({
  startDate,
  endDate,
  invoices = [],
  activeStatusFilter = "",
  onFilterStatus,
}: BillingMetricsProps) {
  const [metrics, setMetrics] = useState<BillingMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"register" | "today">("register");

  // Calculate live dynamic metrics from active invoices register
  const liveRegisterMetrics = useMemo(() => {
    let totalBilled = 0;
    let totalCollected = 0;
    let totalDue = 0;
    let totalDiscount = 0;
    let totalGst = 0;
    let totalTaxable = 0;
    let paidCount = 0;
    let paidAmount = 0;
    let partialCount = 0;
    let partialPaidAmount = 0;
    let partialDueAmount = 0;
    let pendingCount = 0;
    let pendingDueAmount = 0;

    invoices.forEach((inv) => {
      const net = Number(inv.netPayable || inv.totalAmount || 0);
      const paid = Number(inv.paidAmount || 0);
      const due =
        inv.pendingAmount !== undefined
          ? Number(inv.pendingAmount)
          : Math.max(0, net - paid);
      const disc = Number(inv.discount || 0);
      const gst = Number(inv.gstAmount || 0);
      const taxable = Number(inv.taxAmount || Math.max(0, net - gst));

      totalBilled += net;
      totalCollected += paid;
      totalDue += due;
      totalDiscount += disc;
      totalGst += gst;
      totalTaxable += taxable;

      if (due <= 0 || inv.paymentStatus === "PAID") {
        paidCount++;
        paidAmount += net;
      } else if (paid > 0) {
        partialCount++;
        partialPaidAmount += paid;
        partialDueAmount += due;
      } else {
        pendingCount++;
        pendingDueAmount += due;
      }
    });

    const recoveryRate =
      totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

    return {
      totalBilled,
      totalCollected,
      totalDue,
      totalDiscount,
      totalGst,
      totalTaxable,
      paidCount,
      paidAmount,
      partialCount,
      partialPaidAmount,
      partialDueAmount,
      pendingCount,
      pendingDueAmount,
      recoveryRate,
      count: invoices.length,
    };
  }, [invoices]);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      const query = queryParams.toString();
      const response = await invoiceApi.getBillingMetrics(
        query ? `?${query}` : ""
      );

      if (response.success && response.data) {
        setMetrics(response.data);
      }
    } catch (err) {
      console.error("Error fetching billing metrics:", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Determine display values based on viewMode
  const isRegister = viewMode === "register";

  const displayTotalCollections = isRegister
    ? liveRegisterMetrics.totalCollected
    : metrics?.totalRevenue ?? liveRegisterMetrics.totalCollected;

  const displayBilledTurnover = isRegister
    ? liveRegisterMetrics.totalBilled
    : metrics?.totalBilledTurnover ?? liveRegisterMetrics.totalBilled;

  const displayPaidInvoicesCount = isRegister
    ? liveRegisterMetrics.paidCount
    : metrics?.paidInvoices.count ?? liveRegisterMetrics.paidCount;

  const displayPaidAmount = isRegister
    ? liveRegisterMetrics.paidAmount
    : metrics?.paidInvoices.amount ?? liveRegisterMetrics.paidAmount;

  const displayPendingDue = isRegister
    ? liveRegisterMetrics.totalDue
    : metrics?.pendingDueAmount ?? liveRegisterMetrics.totalDue;

  const displayTaxableRevenue = isRegister
    ? liveRegisterMetrics.totalTaxable
    : metrics?.totalTaxableRevenue ?? liveRegisterMetrics.totalTaxable;

  const displayGstTotal = isRegister
    ? liveRegisterMetrics.totalGst
    : metrics?.totalGstAmount ?? liveRegisterMetrics.totalGst;

  const displayDiscountTotal = isRegister
    ? liveRegisterMetrics.totalDiscount
    : metrics?.discountsAndRefunds.discounts ?? liveRegisterMetrics.totalDiscount;

  return (
    <div className="space-y-3">
      {/* Sub-bar with View Selector & Scope Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-slate-900 font-bold">Real-time Financial Telemetry</span>
          <span className="text-slate-300">•</span>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 font-mono shadow-sm">
            {liveRegisterMetrics.count} Register Invoices
          </span>
          {activeStatusFilter && (
            <>
              <span className="text-slate-300">•</span>
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                Filtered: {activeStatusFilter}
              </span>
              <button
                onClick={() => onFilterStatus && onFilterStatus("")}
                className="text-[11px] text-blue-600 hover:text-blue-800 underline font-medium"
              >
                Clear
              </button>
            </>
          )}
        </div>

        <div className="flex rounded-xl border border-slate-200 bg-white p-1 text-[11px] font-bold shadow-sm">
          <button
            onClick={() => setViewMode("register")}
            className={`rounded-lg px-3 py-1 transition-all ${viewMode === "register"
              ? "bg-blue-600 text-white shadow-sm font-bold"
              : "text-slate-600 hover:text-slate-900"
              }`}
          >
            Active Register View
          </button>
          <button
            onClick={() => setViewMode("today")}
            className={`rounded-lg px-3 py-1 transition-all ${viewMode === "today"
              ? "bg-blue-600 text-white shadow-sm font-bold"
              : "text-slate-600 hover:text-slate-900"
              }`}
          >
            Today's Window (IST)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* CARD 1: GROSS COLLECTIONS & TURNOVER */}
        <div
          onClick={() => onFilterStatus && onFilterStatus("")}
          className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 border-l-emerald-600 ${!activeStatusFilter
            ? "border-slate-200 bg-white ring-2 ring-emerald-500/20"
            : "border-slate-200 bg-white hover:bg-slate-50/70"
            }`}
          title="Click to reset filter and view all invoices"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Realized Collections
              </span>
              <span
                className="text-slate-400 hover:text-slate-600"
                title="Gross settled cash/bank/UPI payments received from patients and clients"
              >
                <HelpCircle className="h-3 w-3" />
              </span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 font-mono">
            {formatCurrency(displayTotalCollections)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Billed: {formatCurrency(displayBilledTurnover)}</span>
            <span className="font-bold text-emerald-700 font-mono">
              {liveRegisterMetrics.recoveryRate}% Realized
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${liveRegisterMetrics.recoveryRate}%` }}
            />
          </div>
        </div>

        {/* CARD 2: PAID INVOICES */}
        <div
          onClick={() => onFilterStatus && onFilterStatus(activeStatusFilter === "PAID" ? "" : "PAID")}
          className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-600 ${activeStatusFilter === "PAID"
            ? "border-slate-200 bg-white ring-2 ring-blue-500/20"
            : "border-slate-200 bg-white hover:bg-slate-50/70"
            }`}
          title="Click to filter by fully paid invoices"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Paid Invoices (100%)
              </span>
              <span
                className="text-slate-400 hover:text-slate-600"
                title="Invoices where total paid amount matches grand total with zero pending balance"
              >
                <HelpCircle className="h-3 w-3" />
              </span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 shadow-sm">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 font-mono">
            {displayPaidInvoicesCount}{" "}
            <span className="text-xs font-semibold text-slate-500 font-sans">
              invoices
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Value: {formatCurrency(displayPaidAmount)}</span>
            <span className="font-bold text-blue-700 font-mono">
              {liveRegisterMetrics.count > 0
                ? Math.round(
                  (displayPaidInvoicesCount / liveRegisterMetrics.count) * 100
                )
                : 100}
              % of Total
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{
                width: `${liveRegisterMetrics.count > 0
                  ? (displayPaidInvoicesCount / liveRegisterMetrics.count) * 100
                  : 100
                  }%`,
              }}
            />
          </div>
        </div>

        {/* CARD 3: PENDING / DUE BALANCE */}
        <div
          onClick={() =>
            onFilterStatus &&
            onFilterStatus(activeStatusFilter === "PENDING" ? "" : "PENDING")
          }
          className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 border-l-amber-500 ${activeStatusFilter === "PENDING" || activeStatusFilter === "PARTIAL"
            ? "border-slate-200 bg-white ring-2 ring-amber-500/20"
            : "border-slate-200 bg-white hover:bg-slate-50/70"
            }`}
          title="Click to filter by pending / overdue invoices"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Pending / Due Balance
              </span>
              <span
                className="text-slate-400 hover:text-slate-600"
                title="Uncollected debt balance awaiting settlement across partial and unpaid invoices"
              >
                <HelpCircle className="h-3 w-3" />
              </span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 shadow-sm">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-amber-900 font-mono">
            {formatCurrency(displayPendingDue)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>
              {liveRegisterMetrics.partialCount} Partial • {liveRegisterMetrics.pendingCount} Unpaid
            </span>
            <span
              className={`font-bold font-mono ${displayPendingDue > 0 ? "text-amber-700" : "text-emerald-700"
                }`}
            >
              {displayPendingDue > 0 ? "Action Required" : "Zero Arrears"}
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{
                width: `${liveRegisterMetrics.totalBilled > 0
                  ? Math.min(
                    100,
                    (displayPendingDue / liveRegisterMetrics.totalBilled) * 100
                  )
                  : 0
                  }%`,
              }}
            />
          </div>
        </div>

        {/* CARD 4: TAX & DISCOUNTS AUDIT */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all border-l-4 border-l-purple-600">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                Tax (GST) &amp; Discounts
              </span>
              <span
                className="text-slate-400 hover:text-slate-600"
                title="Bifurcated GST output liability and discounts granted under SAC 999312"
              >
                <HelpCircle className="h-3 w-3" />
              </span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-purple-200 bg-purple-50 text-purple-700 shadow-sm">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 font-mono">
            {formatCurrency(displayGstTotal)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>
              Taxable: {formatCurrency(displayTaxableRevenue)}
            </span>
            <span className="font-bold text-purple-700 font-mono">
              Disc: {formatCurrency(displayDiscountTotal)}
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
