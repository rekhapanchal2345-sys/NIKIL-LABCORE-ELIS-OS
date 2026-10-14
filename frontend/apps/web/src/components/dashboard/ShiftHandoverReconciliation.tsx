"use client";

import { useState } from "react";
import { 
  IndianRupee, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  Users, 
  FileText, 
  X,
  FileCheck2,
  Calendar,
  Building2,
  UserCheck
} from "lucide-react";

interface ShiftHandoverProps {
  todayRevenue?: number;
  pendingPayments?: number;
}

export default function ShiftHandoverReconciliation({
  todayRevenue = 144950,
  pendingPayments = 12400,
}: ShiftHandoverProps) {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [outgoingOfficer, setOutgoingOfficer] = useState("Dr. Sandeep Deshmukh (Pathologist)");
  const [outgoingStaff, setOutgoingStaff] = useState("Anita Sharma (Head Cashier)");
  const [incomingOfficer, setIncomingOfficer] = useState("Dr. Meera Iyer (Evening Pathologist)");
  const [incomingStaff, setIncomingStaff] = useState("Karan Joshi (Evening MLT)");
  const [shiftRemarks, setShiftRemarks] = useState("All 3 critical panic values verified and notified. 16 blood culture bottles handed over in BacT/ALERT incubator.");

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  const cashBreakdown = [
    { note: "₹500 Notes", count: 32, total: 16000 },
    { note: "₹200 Notes", count: 8, total: 1600 },
    { note: "₹100 Notes", count: 7, total: 700 },
    { note: "₹50 Notes", count: 3, total: 150 },
  ];

  const totalCashCounted = cashBreakdown.reduce((sum, item) => sum + item.total, 0);
  const totalCashBilled = 18450;
  const cashVariance = totalCashCounted - totalCashBilled;

  const paymentChannels = [
    { name: "Cash Desk (Physical In Drawer)", amount: 18450, count: 18, icon: Banknote, color: "text-amber-600 bg-amber-50" },
    { name: "UPI / QR Code (PhonePe, GPay, Paytm)", amount: 54600, count: 42, icon: QrCode, color: "text-emerald-600 bg-emerald-50" },
    { name: "Debit / Credit Cards (EDC POS Batch)", amount: 36700, count: 19, icon: CreditCard, color: "text-sky-600 bg-sky-50" },
    { name: "IPD Hospital Bed Adjustments", amount: 35200, count: 12, icon: Building2, color: "text-indigo-600 bg-indigo-50" },
  ];

  const grandTotal = paymentChannels.reduce((sum, c) => sum + c.amount, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 via-white to-emerald-50/30">
        <div>
          <div className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-emerald-600" />
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
              Hospital Shift Handover & Day-Close Billing Reconciliation
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Morning Shift (08:00 - 16:00 IST)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical cash drawer verification against LIS ledger, digital settlement batch audit, and clinical specimen handover certification.
          </p>
        </div>

        <button
          onClick={() => setIsPrintModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
        >
          <Printer className="h-4 w-4" />
          <span>Print Shift Handover Voucher</span>
        </button>
      </div>

      {/* Grid: Financial Channel Breakdown + Cash Drawer Balancing */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Collections by Payment Channel (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Multi-Channel Financial Collections Today
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paymentChannels.map((ch, i) => {
              const Icon = ch.icon;
              return (
                <div key={i} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center border border-slate-200 ${ch.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-slate-500 block truncate">{ch.name}</span>
                    <span className="text-lg font-black text-slate-900 font-mono tracking-tight block">
                      {formatCurrency(ch.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {ch.count} transactions settled
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grand Total Strip */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                Total Day Shift Settlement
              </span>
              <span className="text-2xl font-black text-emerald-950 font-mono">
                {formatCurrency(grandTotal)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                Outstanding Patient / TPA Dues
              </span>
              <span className="text-sm font-bold text-amber-900 font-mono">
                {formatCurrency(pendingPayments)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Cash Drawer Physical Balancing (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Cash Drawer Physical Count Audit
            </h4>
            {cashVariance === 0 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" /> ₹0.00 Variance (Balanced)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                <AlertCircle className="h-3 w-3" /> Variance: {formatCurrency(cashVariance)}
              </span>
            )}
          </div>

          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
            {cashBreakdown.map((row, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-none">
                <span className="font-semibold text-slate-700">{row.note}</span>
                <span className="font-mono text-slate-500">× {row.count} pcs</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(row.total)}</span>
              </div>
            ))}

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold">
              <span className="text-slate-800">Counted Total in Drawer:</span>
              <span className="text-emerald-700 font-mono text-sm">{formatCurrency(totalCashCounted)}</span>
            </div>
          </div>

          {/* Clinical Shift Handover Memo */}
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Clinical Shift Handover Notes:
            </span>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              {shiftRemarks}
            </p>
          </div>
        </div>
      </div>

      {/* Printable Shift Handover Voucher Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                Shift Handover & Cash Reconciliation Certificate
              </h4>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="h-8 w-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Printable Body Content */}
            <div id="printable-shift-sheet" className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800">
              {/* Hospital Official Letterhead */}
              <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
                <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  APEX MULTI-SPECIALTY HOSPITAL & REFERENCE DIAGNOSTICS
                </h2>
                <p className="text-[11px] text-slate-600 font-semibold">
                  Department of Laboratory Medicine • NABL ISO 15189:2022 Accredited (MC-5421)
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Official Shift Handover & Accounts Day-Close Reconciliation Voucher
                </p>
              </div>

              {/* Shift Details */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Shift Timing:</span>
                  <span className="font-bold text-slate-900">Morning Shift (08:00 - 16:00 IST)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Date & Timestamp:</span>
                  <span className="font-bold text-slate-900">
                    {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} • {new Date().toLocaleTimeString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Collections Summary Table */}
              <div className="space-y-2">
                <h5 className="font-bold uppercase tracking-wider text-[11px] text-slate-700">
                  1. Revenue & Payment Reconciliation
                </h5>
                <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2 border-b">Payment Channel</th>
                      <th className="p-2 border-b text-center">Txn Count</th>
                      <th className="p-2 border-b text-right">Amount (INR)</th>
                      <th className="p-2 border-b text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentChannels.map((ch, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium">{ch.name}</td>
                        <td className="p-2 text-center font-mono">{ch.count}</td>
                        <td className="p-2 text-right font-mono font-bold">{formatCurrency(ch.amount)}</td>
                        <td className="p-2 text-center font-bold text-emerald-600">Reconciled</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold">
                      <td className="p-2 text-slate-900">Total Shift Collections</td>
                      <td className="p-2 text-center">91</td>
                      <td className="p-2 text-right text-emerald-700 font-mono text-xs">{formatCurrency(grandTotal)}</td>
                      <td className="p-2 text-center text-emerald-700">100% Balanced</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Clinical Specimen Handover Details */}
              <div className="space-y-2">
                <h5 className="font-bold uppercase tracking-wider text-[11px] text-slate-700">
                  2. Clinical Specimen & Quality Handover
                </h5>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                  <p>• <strong>Samples Accessioned:</strong> 148 Vacutainers (132 Completed, 16 In Progress / Incubating)</p>
                  <p>• <strong>NABL Critical Panic Values:</strong> 3 Flagged (100% Doctor Read-back notifications logged)</p>
                  <p>• <strong>Instrument Status:</strong> Sysmex, Cobas c311, Mindray CLIA all online with valid QC runs</p>
                  <p>• <strong>Special Instructions:</strong> {shiftRemarks}</p>
                </div>
              </div>

              {/* Signatures Dual Block */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-[11px]">
                <div className="border border-dashed border-slate-300 p-3 rounded-xl text-center space-y-4">
                  <p className="text-slate-500 font-semibold uppercase text-[10px]">Outgoing Shift In-Charge</p>
                  <div className="h-8" />
                  <p className="font-bold text-slate-900">{outgoingOfficer}</p>
                  <p className="text-[10px] text-slate-400">{outgoingStaff}</p>
                </div>

                <div className="border border-dashed border-slate-300 p-3 rounded-xl text-center space-y-4">
                  <p className="text-slate-500 font-semibold uppercase text-[10px]">Incoming Shift In-Charge</p>
                  <div className="h-8" />
                  <p className="font-bold text-slate-900">{incomingOfficer}</p>
                  <p className="text-[10px] text-slate-400">{incomingStaff}</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
