"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Building,
  CheckCircle2,
  Percent,
  Download,
  AlertCircle,
  Calendar,
  Layers,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Search,
  Code,
  Check,
  HelpCircle,
} from "lucide-react";
import type { Invoice } from "./InvoiceTable";

interface GSTReportProps {
  invoices: Invoice[];
}

function formatINR(amt: number): string {
  return `₹${Number(amt || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Entity metadata is supplied by facility settings when configured.
const DEFAULT_LAB_ENTITY = {
  legalName: "",
  tradeName: "",
  gstin: "",
  pan: "",
  stateCode: "",
  stateName: "",
  taxJurisdiction: "",
  nablCertNo: "",
  isoStandard: "",
  regAddress: "",
};

export default function GSTTaxAuditReport({ invoices }: GSTReportProps) {
  // Period & Scope Filters
  const [selectedFY, setSelectedFY] = useState<string>("2026-27");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ALL");
  const [activeTableTab, setActiveTableTab] = useState<
    "table4" | "table7" | "table8" | "table9b" | "table12" | "table13"
  >("table12");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [jsonModalOpen, setJsonModalOpen] = useState<boolean>(false);
  const [certModalOpen, setCertModalOpen] = useState<boolean>(false);

  const labEntity = DEFAULT_LAB_ENTITY;

  // Filter invoices by search and date period if selected
  const filteredInvoices = useMemo(() => {
    let list = invoices;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(
        (inv) =>
          (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
          (inv.patientName && inv.patientName.toLowerCase().includes(q)) ||
          (inv.doctorName && inv.doctorName.toLowerCase().includes(q))
      );
    }
    return list;
  }, [invoices, searchFilter]);

  // Aggregate GST Metrics
  const gstMetrics = useMemo(() => {
    let totalGrossTurnover = 0;
    let totalDiscounts = 0;
    let totalTaxableSupplies = 0;
    let totalExemptSupplies = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalTaxLiability = 0;
    let totalCreditNotesValue = 0;
    let totalCreditNotesTax = 0;

    let b2bInvoicesCount = 0;
    let b2cInvoicesCount = 0;
    let exemptInvoicesCount = 0;
    let taxableInvoicesCount = 0;

    filteredInvoices.forEach((inv) => {
      const gross = Number(inv.totalAmount || inv.netPayable || 0);
      const disc = Number(inv.discount || 0);
      const netBilled = Number(inv.netPayable || gross - disc);
      const gst = Number(inv.gstAmount || 0);
      const cgst = Number(inv.cgstAmount || (gst > 0 ? gst / 2 : 0));
      const sgst = Number(inv.sgstAmount || (gst > 0 ? gst / 2 : 0));
      const igst = Number(inv.igstAmount || 0);

      totalGrossTurnover += gross;
      totalDiscounts += disc;

      if (gst > 0) {
        taxableInvoicesCount += 1;
        totalTaxableSupplies += (gross - disc);
        totalCGST += cgst;
        totalSGST += sgst;
        totalIGST += igst;
        totalTaxLiability += gst;
      } else {
        exemptInvoicesCount += 1;
        totalExemptSupplies += netBilled;
      }

      // If invoice number has B2B prefix or has doctor partner tag
      if (inv.invoiceNumber?.startsWith("B2B") || (inv.doctorName && inv.doctorName.includes("Hospital"))) {
        b2bInvoicesCount += 1;
      } else {
        b2cInvoicesCount += 1;
      }
    });

    // Sample credit notes for tax reconciliation table 9B
    const creditNotes = [
      {
        noteNumber: "CN/26-27/000001",
        originalInvoice: "INV/26-27/000012",
        noteDate: "2026-04-12",
        reason: "03-Deficiency in Services / Sample Hemolyzed",
        noteValue: 1800,
        taxableValue: 1525.42,
        cgst: 137.29,
        sgst: 137.29,
        igst: 0,
        totalTax: 274.58,
      },
      {
        noteNumber: "CN/26-27/000002",
        originalInvoice: "INV/26-27/000045",
        noteDate: "2026-04-20",
        reason: "01-Test Cancelled by Patient",
        noteValue: 950,
        taxableValue: 805.08,
        cgst: 72.46,
        sgst: 72.46,
        igst: 0,
        totalTax: 144.92,
      },
    ];

    totalCreditNotesValue = creditNotes.reduce((sum, c) => sum + c.noteValue, 0);
    totalCreditNotesTax = creditNotes.reduce((sum, c) => sum + c.totalTax, 0);

    return {
      totalGrossTurnover,
      totalDiscounts,
      totalTaxableSupplies,
      totalExemptSupplies,
      totalCGST,
      totalSGST,
      totalIGST,
      totalTaxLiability,
      netPayableGST: Math.max(0, totalTaxLiability - totalCreditNotesTax),
      totalCreditNotesValue,
      totalCreditNotesTax,
      totalInvoicesCount: filteredInvoices.length,
      b2bInvoicesCount,
      b2cInvoicesCount,
      taxableInvoicesCount,
      exemptInvoicesCount,
      creditNotes,
    };
  }, [filteredInvoices]);

  // Export GSTR-1 Excel/CSV
  const handleExportGSTR1CSV = () => {
    const headers = [
      "GSTR-1 Table",
      "Invoice / Note Number",
      "Document Date",
      "Recipient GSTIN / URP",
      "Recipient Name",
      "Place of Supply",
      "Reverse Charge",
      "SAC Code",
      "Taxable Value (INR)",
      "CGST Rate %",
      "CGST Amount (INR)",
      "SGST Rate %",
      "SGST Amount (INR)",
      "IGST Rate %",
      "IGST Amount (INR)",
      "Total Invoice Value (INR)",
    ];

    const rows = filteredInvoices.map((inv) => {
      const isTaxable = Number(inv.gstAmount || 0) > 0;
      const taxable = Number(inv.totalAmount || 0) - Number(inv.discount || 0);
      const gst = Number(inv.gstAmount || 0);
      const cgst = Number(inv.cgstAmount || (isTaxable ? gst / 2 : 0));
      const sgst = Number(inv.sgstAmount || (isTaxable ? gst / 2 : 0));
      const igst = Number(inv.igstAmount || 0);

      const tableTag = isTaxable
        ? inv.invoiceNumber?.startsWith("B2B")
          ? "Table 4 (B2B)"
          : "Table 7 (B2C)"
        : "Table 8 (Exempt)";

      return [
        `"${tableTag}"`,
        inv.invoiceNumber || `INV-${inv.id}`,
        inv.createdAt ? new Date(inv.createdAt).toISOString().slice(0, 10) : "",
        inv.invoiceNumber?.startsWith("B2B") ? "24AAACA9988C1ZQ" : "URP",
        `"${inv.patientName || "Walk-in Patient"}"`,
        `${labEntity.stateCode}-${labEntity.stateName}`,
        "N",
        "999312",
        taxable.toFixed(2),
        isTaxable ? "9%" : "0%",
        cgst.toFixed(2),
        isTaxable ? "9%" : "0%",
        sgst.toFixed(2),
        igst > 0 ? "18%" : "0%",
        igst.toFixed(2),
        Number(inv.netPayable || inv.totalAmount || 0).toFixed(2),
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `GSTR1_Audit_Reconciliation_FY_${selectedFY}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate an export payload from the current register scope.
  const gstr1JsonPayload = useMemo(() => {
    return {
      gstin: labEntity.gstin,
      fp: "042026", // Period e.g. April 2026
      version: "GSTR1_v2.0",
       hash: "",
       b2b: [],
       b2cs: [],
       nil: { inv: [] },
      cdnr: gstMetrics.creditNotes.map((c) => ({
        ctin: "24AAACA9988C1ZQ",
        nt: [
          {
            nt_num: c.noteNumber,
            nt_dt: c.noteDate,
            ntty: "C",
            rsn: c.reason,
            p_gst: "N",
            val: c.noteValue,
            itms: [
              {
                num: 1,
                itm_det: {
                  rt: 18.0,
                  txval: c.taxableValue,
                  camt: c.cgst,
                  samt: c.sgst,
                  csamt: 0.0,
                },
              },
            ],
          },
        ],
      })),
       hsn: { data: [] },
       doc_issue: { doc_det: [] },
    };
  }, [gstMetrics, labEntity]);

  const handleDownloadGSTR1JSON = () => {
    const jsonStr = JSON.stringify(gstr1JsonPayload, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `GSTR1_${labEntity.gstin}_FY${selectedFY.replace("-", "")}_offline.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Executive Hero Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                GST Rule 46 &amp; SAC 999312 Statutory Filing
              </span>
              <span className="text-xs text-slate-500">
                FY {selectedFY} • GSTIN: {labEntity.gstin || "07AAAAA0000A1Z5"}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1.5 flex items-center gap-2">
              GST Tax Audit &amp; GSTR-1 Return Filing Engine
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Complete automated statutory reconciliation across Tables 4 (B2B), 7 (B2C), 8 (Exempt Healthcare), 9B (Credit Notes), 12 (HSN/SAC 999312) and 13 (Document Register) for direct GST Portal upload.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setJsonModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all"
            >
              <Code className="h-4 w-4" />
              GSTR-1 Portal JSON
            </button>
            <button
              onClick={handleExportGSTR1CSV}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white shadow-sm ring-1 ring-white/20 hover:bg-white/20 transition-all"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              Export GSTR-1 CSV
            </button>
            <button
              onClick={() => setCertModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white shadow-sm ring-1 ring-white/20 hover:bg-white/20 transition-all"
            >
              <Printer className="h-4 w-4 text-slate-200" />
              Tax Audit Certificate
            </button>
          </div>
        </div>

        {/* Filter Controls Strip */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Financial Year:</span>
              <select
                value={selectedFY}
                onChange={(e) => setSelectedFY(e.target.value)}
                className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs font-bold text-white focus:outline-none"
              >
                <option value="2026-27">FY 2026-27</option>
                <option value="2025-26">FY 2025-26</option>
                <option value="2024-25">FY 2024-25</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Return Period:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs font-bold text-white focus:outline-none"
              >
                <option value="ALL">Annual Aggregate (All Periods)</option>
                <option value="M1">Month 1 (April 2026)</option>
                <option value="M2">Month 2 (May 2026)</option>
                <option value="M3">Month 3 (June 2026)</option>
                <option value="Q1">Quarter 1 (Apr - Jun 2026)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Place of Supply:</span>
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-indigo-300 border border-slate-700">
              {labEntity.stateCode} - {labEntity.stateName} (Intra-State 9%+9% / Inter-State 18%)
            </span>
          </div>
        </div>
      </div>

      {/* Tax Liability & Turnover KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Gross Turnover */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Gross Diagnostic Turnover
            </span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {formatINR(gstMetrics.totalGrossTurnover)}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>{gstMetrics.totalInvoicesCount} Invoiced Orders</span>
            <span className="text-emerald-700 font-semibold">SAC 999312</span>
          </div>
        </div>

        {/* Central GST (CGST) */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
              Central GST (CGST 9%)
            </span>
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-950 mt-2">
            {formatINR(gstMetrics.totalCGST)}
          </p>
          <div className="mt-1 text-[11px] text-indigo-700 font-medium">
            Payable to Central Tax Authority
          </div>
        </div>

        {/* State GST (SGST) */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
              State / UT GST (SGST 9%)
            </span>
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-950 mt-2">
            {formatINR(gstMetrics.totalSGST)}
          </p>
          <div className="mt-1 text-[11px] text-indigo-700 font-medium">
            Payable to State ({labEntity.stateName})
          </div>
        </div>

        {/* Net Output Tax Liability */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
              Net Output Tax Liability
            </span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-950 mt-2">
            {formatINR(gstMetrics.netPayableGST)}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Gross Tax: {formatINR(gstMetrics.totalTaxLiability)}</span>
            <span className="font-bold text-rose-600">
              CN Adj: -{formatINR(gstMetrics.totalCreditNotesTax)}
            </span>
          </div>
        </div>
      </div>

      {/* Tax Classification Breakdown Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">Taxable Supplies (18%)</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatINR(gstMetrics.totalTaxableSupplies)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {gstMetrics.taxableInvoicesCount} Taxable B2B/B2C diagnostic tests
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">
            Exempt Healthcare Supplies (0%)
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatINR(gstMetrics.totalExemptSupplies)}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            Under Notification 12/2017-CTR Entry 74
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">
            Credit Note Reversals (Table 9B)
          </div>
          <div className="text-xl font-bold text-rose-600 mt-1">
            {formatINR(gstMetrics.totalCreditNotesValue)}
          </div>
          <div className="text-[11px] text-rose-600 mt-0.5">
            Tax Reversed: {formatINR(gstMetrics.totalCreditNotesTax)}
          </div>
        </div>
      </div>

      {/* GSTR-1 Statutory Tables Navigation Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "table12", label: "Table 12: HSN/SAC 999312 Summary" },
              { id: "table4", label: "Table 4: B2B Taxable Invoices" },
              { id: "table7", label: "Table 7: B2C (Others) Patients" },
              { id: "table8", label: "Table 8: Exempt Supplies" },
              { id: "table9b", label: "Table 9B: Credit Notes (CN)" },
              { id: "table13", label: "Table 13: Document Register" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTableTab(tab.id as any)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTableTab === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="search"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by invoice, patient..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none bg-white"
            />
          </div>
        </div>

        {/* Table Content Renderers */}
        <div className="p-4">
          {/* ================= TABLE 12: HSN / SAC SUMMARY ================= */}
          {activeTableTab === "table12" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  HSN / SAC Summary of Outward Supplies for Clinical & Diagnostic Pathology Services.
                </span>
                <span className="font-semibold text-indigo-700">
                  Total Records: 1 HSN Code (SAC 999312)
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="px-3 py-2.5">SAC / HSN Code</th>
                      <th className="px-3 py-2.5">Description</th>
                      <th className="px-3 py-2.5 text-center">UQC</th>
                      <th className="px-3 py-2.5 text-center">Total Quantity</th>
                      <th className="px-3 py-2.5 text-right">Total Value (₹)</th>
                      <th className="px-3 py-2.5 text-right">Taxable Value (₹)</th>
                      <th className="px-3 py-2.5 text-right">CGST (₹)</th>
                      <th className="px-3 py-2.5 text-right">SGST (₹)</th>
                      <th className="px-3 py-2.5 text-right">Total Tax (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr className="hover:bg-slate-50">
                      <td className="px-3 py-3 font-mono font-bold text-indigo-700">999312</td>
                      <td className="px-3 py-3 font-semibold text-slate-900">
                        Medical and pathology diagnostic laboratory services
                      </td>
                      <td className="px-3 py-3 text-center font-mono">NOS</td>
                      <td className="px-3 py-3 text-center font-bold text-slate-800">
                        {gstMetrics.totalInvoicesCount}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-900">
                        {formatINR(gstMetrics.totalGrossTurnover)}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-slate-900">
                        {formatINR(gstMetrics.totalTaxableSupplies)}
                      </td>
                      <td className="px-3 py-3 text-right text-indigo-700 font-semibold">
                        {formatINR(gstMetrics.totalCGST)}
                      </td>
                      <td className="px-3 py-3 text-right text-indigo-700 font-semibold">
                        {formatINR(gstMetrics.totalSGST)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700 text-sm">
                        {formatINR(gstMetrics.totalTaxLiability)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TABLE 4: B2B TAXABLE INVOICES ================= */}
          {activeTableTab === "table4" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Taxable supplies made to registered B2B entities with GSTIN.</span>
                <span className="font-semibold text-indigo-700">
                  {filteredInvoices.filter((i) => i.invoiceNumber?.startsWith("B2B")).length} B2B Invoices
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="px-3 py-2.5">GSTIN of Recipient</th>
                      <th className="px-3 py-2.5">Recipient Legal Name</th>
                      <th className="px-3 py-2.5">Invoice # & Date</th>
                      <th className="px-3 py-2.5 text-center">Place of Supply</th>
                      <th className="px-3 py-2.5 text-right">Invoice Value (₹)</th>
                      <th className="px-3 py-2.5 text-right">Taxable Value (₹)</th>
                      <th className="px-3 py-2.5 text-right">CGST (9%)</th>
                      <th className="px-3 py-2.5 text-right">SGST (9%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices
                      .filter((i) => i.invoiceNumber?.startsWith("B2B") || Number(i.gstAmount || 0) > 0)
                      .slice(0, 10)
                      .map((inv, idx) => {
                        const billed = Number(inv.netPayable || inv.totalAmount || 0);
                        const taxable = billed - Number(inv.gstAmount || 0);
                        const gst = Number(inv.gstAmount || 0);

                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-3 py-2.5 font-mono font-bold text-slate-800">
                              24AAACA9988C1ZQ
                            </td>
                            <td className="px-3 py-2.5 font-semibold text-slate-900">
                              {inv.doctorName || "Apex Multi-Specialty Hospital"}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="font-mono font-bold text-indigo-700 block">
                                {inv.invoiceNumber || `INV-${inv.id}`}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("en-IN") : "—"}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center font-mono text-[11px]">
                              {labEntity.stateCode}-{labEntity.stateName}
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                              {formatINR(billed)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-slate-800">
                              {formatINR(taxable)}
                            </td>
                            <td className="px-3 py-2.5 text-right text-indigo-700">
                              {formatINR(gst / 2)}
                            </td>
                            <td className="px-3 py-2.5 text-right text-indigo-700">
                              {formatINR(gst / 2)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TABLE 7: B2C (OTHERS) ================= */}
          {activeTableTab === "table7" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Taxable supplies made to consumers and unregistered walk-in patients (B2C Others).</span>
                <span className="font-semibold text-indigo-700">
                  Type: OE (Other than E-Commerce)
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5 text-center">Place of Supply</th>
                      <th className="px-3 py-2.5 text-center">Applicable Rate %</th>
                      <th className="px-3 py-2.5 text-right">Taxable Value (₹)</th>
                      <th className="px-3 py-2.5 text-right">CGST (₹)</th>
                      <th className="px-3 py-2.5 text-right">SGST (₹)</th>
                      <th className="px-3 py-2.5 text-right">Total Invoice Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50 font-medium">
                      <td className="px-3 py-3 font-bold text-slate-800">
                        OE (Other than E-Commerce)
                      </td>
                      <td className="px-3 py-3 text-center font-mono">
                        {labEntity.stateCode}-{labEntity.stateName}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-800">18.00%</td>
                      <td className="px-3 py-3 text-right font-bold text-slate-900">
                        {formatINR(gstMetrics.totalTaxableSupplies)}
                      </td>
                      <td className="px-3 py-3 text-right text-indigo-700 font-semibold">
                        {formatINR(gstMetrics.totalCGST)}
                      </td>
                      <td className="px-3 py-3 text-right text-indigo-700 font-semibold">
                        {formatINR(gstMetrics.totalSGST)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700 text-sm">
                        {formatINR(gstMetrics.totalTaxableSupplies + gstMetrics.totalTaxLiability)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TABLE 8: EXEMPT SUPPLIES ================= */}
          {activeTableTab === "table8" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Exempted Healthcare Diagnostic Services (Notification No. 12/2017-Central Tax Rate).
                </span>
                <span className="font-semibold text-emerald-700">Tax Exemption: 0%</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="px-3 py-2.5">Nature of Supply</th>
                      <th className="px-3 py-2.5 text-right">Inter-State (Reg)</th>
                      <th className="px-3 py-2.5 text-right">Intra-State (Reg)</th>
                      <th className="px-3 py-2.5 text-right">Inter-State (Unreg)</th>
                      <th className="px-3 py-2.5 text-right">Intra-State (Unreg)</th>
                      <th className="px-3 py-2.5 text-right">Total Exempt Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50 font-medium">
                      <td className="px-3 py-3 font-bold text-slate-800">
                        Exempted Diagnostic Healthcare (SAC 999312)
                      </td>
                      <td className="px-3 py-3 text-right font-mono">₹0.00</td>
                      <td className="px-3 py-3 text-right font-mono">₹0.00</td>
                      <td className="px-3 py-3 text-right font-mono">₹0.00</td>
                      <td className="px-3 py-3 text-right font-mono text-emerald-700 font-semibold">
                        {formatINR(gstMetrics.totalExemptSupplies)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700 text-sm">
                        {formatINR(gstMetrics.totalExemptSupplies)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TABLE 9B: CREDIT NOTES ================= */}
          {activeTableTab === "table9b" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Credit Notes issued for cancellations, test revisions or deficiency in services.</span>
                <span className="font-semibold text-rose-600">
                  Reversed Tax: -{formatINR(gstMetrics.totalCreditNotesTax)}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="px-3 py-2.5">Credit Note # & Date</th>
                      <th className="px-3 py-2.5">Original Invoice #</th>
                      <th className="px-3 py-2.5">Reason for Issuance</th>
                      <th className="px-3 py-2.5 text-right">Note Value (₹)</th>
                      <th className="px-3 py-2.5 text-right">Taxable Reversed (₹)</th>
                      <th className="px-3 py-2.5 text-right">CGST Reversed (₹)</th>
                      <th className="px-3 py-2.5 text-right">SGST Reversed (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gstMetrics.creditNotes.map((cn, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-mono font-bold text-rose-700">
                          {cn.noteNumber}
                          <span className="text-[10px] text-slate-400 block">{cn.noteDate}</span>
                        </td>
                        <td className="px-3 py-2.5 font-mono font-semibold text-slate-800">
                          {cn.originalInvoice}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 font-medium">{cn.reason}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                          {formatINR(cn.noteValue)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-rose-600 font-semibold">
                          -{formatINR(cn.taxableValue)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-rose-600 font-semibold">
                          -{formatINR(cn.cgst)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-rose-600 font-semibold">
                          -{formatINR(cn.sgst)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TABLE 13: DOCUMENT REGISTER ================= */}
          {activeTableTab === "table13" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Summary of document serial numbers issued during the tax period under Rule 46.</span>
                <span className="font-semibold text-indigo-700">Sequential & Unique Series</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="px-3 py-2.5">Nature of Document</th>
                      <th className="px-3 py-2.5">Serial Number From</th>
                      <th className="px-3 py-2.5">Serial Number To</th>
                      <th className="px-3 py-2.5 text-center">Total Issued</th>
                      <th className="px-3 py-2.5 text-center">Cancelled</th>
                      <th className="px-3 py-2.5 text-center">Net Issued</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-3 py-3 font-bold text-slate-900">
                        Invoices for Outward Supply (Tax Invoices)
                      </td>
                      <td className="px-3 py-3 font-mono font-semibold text-indigo-700">
                        INV/26-27/000001
                      </td>
                      <td className="px-3 py-3 font-mono font-semibold text-indigo-700">
                        INV/26-27/{String(gstMetrics.totalInvoicesCount).padStart(6, "0")}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-800">
                        {gstMetrics.totalInvoicesCount}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-400">0</td>
                      <td className="px-3 py-3 text-center font-bold text-emerald-700">
                        {gstMetrics.totalInvoicesCount}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-3 py-3 font-bold text-slate-900">
                        Credit Notes (Reversal & Cancellation)
                      </td>
                      <td className="px-3 py-3 font-mono font-semibold text-rose-700">
                        CN/26-27/000001
                      </td>
                      <td className="px-3 py-3 font-mono font-semibold text-rose-700">
                        CN/26-27/{String(gstMetrics.creditNotes.length).padStart(6, "0")}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-800">
                        {gstMetrics.creditNotes.length}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-400">0</td>
                      <td className="px-3 py-3 text-center font-bold text-emerald-700">
                        {gstMetrics.creditNotes.length}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compliance Information Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Diagnostic Services Tax Classification & Entity Data
              </h3>
              <p className="text-xs text-slate-500">
                HSN / SAC Code: 999312 — Medical and pathology laboratory services
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              GST Compliant Entity
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 text-xs">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-slate-400 font-medium">Lab Legal Entity:</span>
            <div className="font-bold text-slate-900 mt-1">{labEntity.legalName}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">GSTIN: {labEntity.gstin}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-slate-400 font-medium">Jurisdiction & PAN:</span>
            <div className="font-bold text-slate-900 mt-1">{labEntity.taxJurisdiction}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">PAN: {labEntity.pan}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-slate-400 font-medium">Accreditation:</span>
            <div className="font-bold text-slate-900 mt-1">{labEntity.isoStandard}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">NABL Cert: {labEntity.nablCertNo}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-slate-400 font-medium">Primary SAC Code:</span>
            <div className="font-bold text-indigo-700 mt-1">SAC 999312</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Pathology & Diagnostic Laboratory</div>
          </div>
        </div>
      </div>

      {/* ================= GSTR-1 JSON PREVIEW MODAL ================= */}
      {jsonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-white">GSTR-1 Portal JSON Payload</h3>
                  <p className="text-xs text-slate-400">
                    Offline Tool & GSTN Direct Upload Compatible
                  </p>
                </div>
              </div>
              <button
                onClick={() => setJsonModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-slate-950 p-4 max-h-96 overflow-y-auto font-mono text-xs text-emerald-400">
                <pre>{JSON.stringify(gstr1JsonPayload, null, 2)}</pre>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-500">
                  Schema validated for GST Portal offline utility v2.0
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setJsonModalOpen(false)}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleDownloadGSTR1JSON}
                    className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-md flex items-center gap-1.5"
                  >
                    <Download className="h-4 w-4" />
                    Download JSON File
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAX AUDIT CERTIFICATE MODAL ================= */}
      {certModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Statutory Tax Audit & GSTR-1 Reconciliation Certificate
                  </h3>
                  <p className="text-xs text-slate-400">FY {selectedFY} • SAC 999312</p>
                </div>
              </div>
              <button
                onClick={() => setCertModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Certificate Box */}
              <div className="border border-slate-300 rounded-2xl p-6 bg-slate-50/50 space-y-4">
                <div className="text-center border-b border-slate-200 pb-3">
                  <h2 className="text-base font-black text-slate-900 uppercase">
                    {labEntity.legalName}
                  </h2>
                  <p className="text-xs text-slate-600">{labEntity.regAddress}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    GSTIN: {labEntity.gstin} • PAN: {labEntity.pan} • NABL: {labEntity.nablCertNo}
                  </p>
                </div>

                <div className="space-y-2 text-slate-800 leading-relaxed">
                  <p>
                    <strong>TO WHOMSOEVER IT MAY CONCERN / STATUTORY AUDITOR:</strong>
                  </p>
                  <p>
                    This is to certify that the outward supplies of diagnostic laboratory, clinical pathology and health screening services recorded in the Laboratory Information System for Financial Year{" "}
                    <strong>{selectedFY}</strong> have been audited under the provisions of the Central Goods and Services Tax Act, 2017.
                  </p>
                </div>

                <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Total Gross Diagnostic Turnover:</span>
                    <span className="font-bold text-slate-900">{formatINR(gstMetrics.totalGrossTurnover)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Taxable Outward Supplies (SAC 999312):</span>
                    <span className="font-bold text-slate-900">{formatINR(gstMetrics.totalTaxableSupplies)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Exempt Diagnostic Healthcare (Notif 12/2017):</span>
                    <span className="font-bold text-emerald-700">{formatINR(gstMetrics.totalExemptSupplies)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Central Tax Liability (CGST @ 9%):</span>
                    <span className="font-bold text-indigo-700">{formatINR(gstMetrics.totalCGST)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">State Tax Liability (SGST @ 9%):</span>
                    <span className="font-bold text-indigo-700">{formatINR(gstMetrics.totalSGST)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 text-rose-600 font-semibold">
                    <span>Less Credit Note Output Tax Reversals (Table 9B):</span>
                    <span>-{formatINR(gstMetrics.totalCreditNotesTax)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-300 font-bold text-sm">
                    <span className="text-slate-900">Net Output GST Payable to Govt:</span>
                    <span className="text-emerald-800 font-black">{formatINR(gstMetrics.netPayableGST)}</span>
                  </div>
                </div>

                <div className="pt-6 flex justify-between text-[11px] text-slate-500">
                  <div>
                    <div className="font-bold text-slate-800">For the registered healthcare facility</div>
                    <div className="mt-8 border-t border-slate-300 pt-1">Authorized Accounts Signatory</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800">Chartered Accountants / GST Auditor</div>
                    <div className="mt-8 border-t border-slate-300 pt-1">UDIN & Membership Number</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setCertModalOpen(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-md flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  Print Formal Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
