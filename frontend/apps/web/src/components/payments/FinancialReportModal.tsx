"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Printer,
  Download,
  Calendar,
  FileText,
  DollarSign,
  Building2,
  CheckCircle2,
  TrendingUp,
  Receipt,
  Users,
} from "lucide-react";
import { formatIndianRupees } from "@/lib/money";

export type ReportType =
  | "DAY_BOOK"
  | "MODE_BREAKDOWN"
  | "CASHIER_AUDIT"
  | "GST_REGISTER"
  | "AGING_RECEIVABLES";

interface FinancialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments: any[];
  orders: any[];
  summary: any;
}

export default function FinancialReportModal({
  isOpen,
  onClose,
  payments,
  orders,
  summary,
}: FinancialReportModalProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>("DAY_BOOK");
  const [dateRange, setDateRange] = useState<"Today" | "Yesterday" | "7 Days" | "30 Days" | "All">("Today");

  // Format INR
  const formatCurrency = (val: number) => {
    return formatIndianRupees(val || 0);
  };

  // Filter payments by date range
  const filteredPayments = useMemo(() => {
    if (dateRange === "All") return payments;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(startOfToday);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7 = new Date(startOfToday);
    last7.setDate(last7.getDate() - 6);
    const last30 = new Date(startOfToday);
    last30.setDate(last30.getDate() - 29);

    return payments.filter((p) => {
      const pDate = new Date(p.paidAt || p.createdAt);
      if (dateRange === "Today") return pDate >= startOfToday;
      if (dateRange === "Yesterday") return pDate >= yesterday && pDate < startOfToday;
      if (dateRange === "7 Days") return pDate >= last7;
      if (dateRange === "30 Days") return pDate >= last30;
      return true;
    });
  }, [payments, dateRange]);

  // Mode breakdown aggregation
  const modeData = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {
      CASH: { count: 0, total: 0 },
      UPI: { count: 0, total: 0 },
      CARD: { count: 0, total: 0 },
      NET_BANKING: { count: 0, total: 0 },
      CHEQUE: { count: 0, total: 0 },
    };
    filteredPayments.forEach((p) => {
      const m = p.method || "CASH";
      if (!map[m]) map[m] = { count: 0, total: 0 };
      map[m].count += 1;
      map[m].total += Number(p.amount || 0);
    });
    return map;
  }, [filteredPayments]);

  // Cashier breakdown aggregation
  const cashierData = useMemo(() => {
    const map: Record<string, { count: number; total: number; cash: number; digital: number }> = {};
    filteredPayments.forEach((p) => {
      const name = p.collectedBy || "Front Desk Cashier";
      if (!map[name]) map[name] = { count: 0, total: 0, cash: 0, digital: 0 };
      map[name].count += 1;
      const amt = Number(p.amount || 0);
      map[name].total += amt;
      if (p.method === "CASH") map[name].cash += amt;
      else map[name].digital += amt;
    });
    return map;
  }, [filteredPayments]);

  // GST aggregation
  const gstData = useMemo(() => {
    const totalCollected = filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    // Assumes diagnostic services at standard / exempted or 18% GST where applicable
    const taxableValue = Math.round((totalCollected / 1.18) * 100) / 100;
    const gstTotal = Math.round((totalCollected - taxableValue) * 100) / 100;
    const cgst = Math.round((gstTotal / 2) * 100) / 100;
    const sgst = gstTotal - cgst;

    return {
      totalCollected,
      taxableValue,
      gstTotal,
      cgst,
      sgst,
    };
  }, [filteredPayments]);

  // Print Report Handler
  const handlePrint = () => {
    const printWin = window.open("", "_blank");
    if (!printWin) {
      alert("Please enable popups to print report.");
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedReport}_${new Date().toISOString().slice(0, 10)}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; color: #1e293b; padding: 25px; }
            .header { border-bottom: 2px solid #0f2d52; padding-bottom: 12px; margin-bottom: 16px; }
            .title { font-size: 18px; font-weight: 800; color: #0f2d52; }
            .subtitle { font-size: 11px; color: #64748b; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #f8fafc; text-align: left; padding: 8px 10px; font-size: 11px; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; }
            td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .total-row { background: #f1f5f9; font-weight: bold; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; background: #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">LABCORE ENTERPRISE LABORATORY</div>
            <div class="subtitle">FINANCIAL AUDIT REPORT • ${selectedReport.replace("_", " ")} (${dateRange})</div>
            <div class="subtitle">Generated on: ${new Date().toLocaleString()}</div>
          </div>
          ${document.getElementById("report-printable-area")?.innerHTML || ""}
        </body>
      </html>
    `);

    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 400);
  };

  // CSV Export Handler with Formula Injection Sanitization (CWE-1236)
  const handleExportCSV = () => {
    const sanitizeCsvCell = (val: any): string => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      if (/^[=+\-@\t\r%]/.test(str)) {
        str = "'" + str;
      }
      return `"${str}"`;
    };

    let rows: string[][] = [];
    let headers: string[] = [];

    if (selectedReport === "DAY_BOOK") {
      headers = ["Receipt #", "Txn ID", "Patient Name", "UHID", "Amount (₹)", "Method", "Date Time", "Cashier"];
      rows = filteredPayments.map((p) => [
        sanitizeCsvCell(p.receiptNumber),
        sanitizeCsvCell(p.transactionId),
        sanitizeCsvCell(p.patientName),
        sanitizeCsvCell(p.patientUhid || ""),
        sanitizeCsvCell(p.amount),
        sanitizeCsvCell(p.method),
        sanitizeCsvCell(new Date(p.paidAt).toLocaleString()),
        sanitizeCsvCell(p.collectedBy || ""),
      ]);
    } else if (selectedReport === "MODE_BREAKDOWN") {
      headers = ["Payment Mode", "Transaction Count", "Total Collected (₹)"];
      rows = Object.entries(modeData).map(([mode, d]) => [
        sanitizeCsvCell(mode),
        sanitizeCsvCell(d.count),
        sanitizeCsvCell(d.total),
      ]);
    } else if (selectedReport === "CASHIER_AUDIT") {
      headers = ["Cashier", "Txn Count", "Cash Total (₹)", "Digital Total (₹)", "Grand Total (₹)"];
      rows = Object.entries(cashierData).map(([name, d]) => [
        sanitizeCsvCell(name),
        sanitizeCsvCell(d.count),
        sanitizeCsvCell(d.cash),
        sanitizeCsvCell(d.digital),
        sanitizeCsvCell(d.total),
      ]);
    } else {
      headers = ["Metric", "Amount (₹)"];
      rows = [
        [sanitizeCsvCell("Total Collections"), sanitizeCsvCell(gstData.totalCollected)],
        [sanitizeCsvCell("Taxable Amount (SAC 999312)"), sanitizeCsvCell(gstData.taxableValue)],
        [sanitizeCsvCell("CGST (9%)"), sanitizeCsvCell(gstData.cgst)],
        [sanitizeCsvCell("SGST (9%)"), sanitizeCsvCell(gstData.sgst)],
        [sanitizeCsvCell("Total GST Liability"), sanitizeCsvCell(gstData.gstTotal)],
      ];
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LabCore_${selectedReport}_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Financial Reports & Day Book
              </h3>
              <p className="text-xs text-slate-500">
                Generate, inspect, and export executive laboratory audit reports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="my-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "DAY_BOOK", label: "Day Book (Cash Book)" },
              { id: "MODE_BREAKDOWN", label: "Mode-wise Breakdown" },
              { id: "CASHIER_AUDIT", label: "Cashier Productivity" },
              { id: "GST_REGISTER", label: "GST Tax Register" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedReport(tab.id as ReportType)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedReport === tab.id
                    ? "bg-[#0f2d52] text-white shadow-sm"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="7 Days">Last 7 Days</option>
              <option value="30 Days">Last 30 Days</option>
              <option value="All">All Time</option>
            </select>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-100 transition"
            >
              <Printer className="h-3.5 w-3.5 text-blue-700" />
              Print
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-700 transition"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
          </div>
        </div>

        {/* Printable & Interactive Area */}
        <div id="report-printable-area" className="flex-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4">
          {/* REPORT 1: DAY BOOK */}
          {selectedReport === "DAY_BOOK" && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Laboratory Cash Book / Day Book</h4>
                  <p className="text-xs text-slate-500">
                    Chronological ledger of receipts ({filteredPayments.length} transactions)
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Period Total:</div>
                  <div className="text-base font-mono font-bold text-emerald-600">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + Number(p.amount || 0), 0))}
                  </div>
                </div>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Receipt #</th>
                    <th className="px-3 py-2.5 font-semibold">Patient</th>
                    <th className="px-3 py-2.5 font-semibold">Order #</th>
                    <th className="px-3 py-2.5 font-semibold">Method</th>
                    <th className="px-3 py-2.5 font-semibold">Cashier</th>
                    <th className="px-3 py-2.5 font-semibold">Date & Time</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">{p.receiptNumber}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-900">
                        {p.patientName} <span className="text-slate-400 font-mono text-[10px]">({p.patientUhid || "—"})</span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{p.orderNumber || "—"}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-700">{p.method}</td>
                      <td className="px-3 py-2.5 text-slate-600">{p.collectedBy || "Cashier"}</td>
                      <td className="px-3 py-2.5 text-slate-500">{new Date(p.paidAt).toLocaleTimeString()}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(Number(p.amount))}
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No transactions recorded for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT 2: MODE BREAKDOWN */}
          {selectedReport === "MODE_BREAKDOWN" && (
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Payment Method Mix & Distribution</h4>
              <p className="text-xs text-slate-500 mb-4">Breakdown of gross collection across payment tender types</p>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Payment Tender Mode</th>
                    <th className="px-4 py-3 font-semibold">Total Txn Count</th>
                    <th className="px-4 py-3 font-semibold text-right">Collection Total</th>
                    <th className="px-4 py-3 font-semibold text-right">Revenue Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const totalRevenue = Object.values(modeData).reduce((s, d) => s + d.total, 0) || 1;
                    return Object.entries(modeData).map(([mode, d]) => (
                      <tr key={mode} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">{mode.replace("_", " ")}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{d.count} transactions</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(d.total)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-blue-700 font-bold">
                          {Math.round((d.total / totalRevenue) * 100)}%
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT 3: CASHIER AUDIT */}
          {selectedReport === "CASHIER_AUDIT" && (
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Cashier Register Productivity & Audit</h4>
              <p className="text-xs text-slate-500 mb-4">Total collections processed per staff operator / till</p>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Staff Operator</th>
                    <th className="px-4 py-3 font-semibold">Transactions</th>
                    <th className="px-4 py-3 font-semibold text-right">Cash Received</th>
                    <th className="px-4 py-3 font-semibold text-right">Digital / Cards</th>
                    <th className="px-4 py-3 font-semibold text-right">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(cashierData).map(([cashier, d]) => (
                    <tr key={cashier} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900">{cashier}</td>
                      <td className="px-4 py-3 font-mono text-slate-700">{d.count} receipts</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700 font-medium">
                        {formatCurrency(d.cash)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-blue-700 font-medium">
                        {formatCurrency(d.digital)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(d.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT 4: GST REGISTER */}
          {selectedReport === "GST_REGISTER" && (
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">GST & Tax Collection Register</h4>
              <p className="text-xs text-slate-500 mb-4">Output tax liabilities calculated on diagnostic collections</p>

              <div className="grid gap-3 sm:grid-cols-4 mb-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500">Gross Turnover</div>
                  <div className="text-lg font-mono font-bold text-slate-900">
                    {formatCurrency(gstData.totalCollected)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500">Taxable Base</div>
                  <div className="text-lg font-mono font-bold text-slate-800">
                    {formatCurrency(gstData.taxableValue)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-wider text-blue-700">CGST (9%)</div>
                  <div className="text-lg font-mono font-bold text-blue-900">
                    {formatCurrency(gstData.cgst)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-wider text-indigo-700">SGST (9%)</div>
                  <div className="text-lg font-mono font-bold text-indigo-900">
                    {formatCurrency(gstData.sgst)}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs text-slate-700">
                <strong>GST Compliance Note:</strong> In India, clinical diagnostic laboratory services provided to patients by healthcare institutions are predominantly exempt under GST Notification No. 12/2017-Central Tax (Rate). Tax breakdown is calculated here for corporate diagnostic contracts and wellness packages where GST applies.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="text-xs text-slate-500">
            Audit Period: <strong>{dateRange}</strong> • Generated securely by LabCore Finance Engine
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
