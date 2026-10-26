"use client";

import React, { useState } from "react";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Building,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  User,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { showSuccess, showInfo } from "@/lib/notifications";

export interface ReferralDoctorItem {
  id: string | number;
  doctorCode: string;
  name: string;
  specialization: string;
  clinicName: string;
  phone: string;
  referredPatientsCount: number;
  monthlyPatientsCount: number;
  totalBilledRevenue: number;
  commissionRate: number;
  totalEarnedCommission: number;
  settledCommission: number;
  pendingBalance: number;
  bankAccount: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
  };
  status: "SETTLED" | "PENDING_PAYOUT";
}

const INITIAL_REFERRALS: ReferralDoctorItem[] = [
  {
    id: "doc-ref-1",
    doctorCode: "DOC-2026-001",
    name: "Dr. Arvind K. Trivedi",
    specialization: "General Physician & Diabetologist",
    clinicName: "Trivedi Diabetes & Care Clinic, Anand",
    phone: "+91 98250 11420",
    referredPatientsCount: 142,
    monthlyPatientsCount: 28,
    totalBilledRevenue: 184500,
    commissionRate: 15,
    totalEarnedCommission: 27675,
    settledCommission: 20000,
    pendingBalance: 7675,
    bankAccount: {
      accountNumber: "912010048192301",
      ifsc: "UTIB0000412",
      bankName: "Axis Bank Ltd",
    },
    status: "PENDING_PAYOUT",
  },
  {
    id: "doc-ref-2",
    doctorCode: "DOC-2026-004",
    name: "Dr. Meera Vasudevan",
    specialization: "Obstetrician & Gynecologist",
    clinicName: "Matruchhaya Women's Hospital, Vadodara",
    phone: "+91 98980 55210",
    referredPatientsCount: 96,
    monthlyPatientsCount: 19,
    totalBilledRevenue: 142000,
    commissionRate: 12,
    totalEarnedCommission: 17040,
    settledCommission: 17040,
    pendingBalance: 0,
    bankAccount: {
      accountNumber: "50100234192831",
      ifsc: "HDFC0001024",
      bankName: "HDFC Bank",
    },
    status: "SETTLED",
  },
  {
    id: "doc-ref-3",
    doctorCode: "DOC-2026-008",
    name: "Dr. Sanjay Bhatt",
    specialization: "Orthopedic Surgeon & Arthroscopy",
    clinicName: "Shreeji Bone & Joint Center, Nadiad",
    phone: "+91 94260 77123",
    referredPatientsCount: 68,
    monthlyPatientsCount: 14,
    totalBilledRevenue: 98400,
    commissionRate: 15,
    totalEarnedCommission: 14760,
    settledCommission: 10000,
    pendingBalance: 4760,
    bankAccount: {
      accountNumber: "38920194821",
      ifsc: "SBIN0001245",
      bankName: "State Bank of India",
    },
    status: "PENDING_PAYOUT",
  },
  {
    id: "doc-ref-4",
    doctorCode: "DOC-2026-012",
    name: "Dr. Kirit S. Parikh",
    specialization: "Pediatrician & Neonatologist",
    clinicName: "Vatsalya Children Clinic, Ahmedabad",
    phone: "+91 98790 33412",
    referredPatientsCount: 114,
    monthlyPatientsCount: 22,
    totalBilledRevenue: 128000,
    commissionRate: 10,
    totalEarnedCommission: 12800,
    settledCommission: 12800,
    pendingBalance: 0,
    bankAccount: {
      accountNumber: "629104819201",
      ifsc: "ICIC0000034",
      bankName: "ICICI Bank",
    },
    status: "SETTLED",
  },
];

interface DoctorReferralLedgerViewProps {
  onOpenPayoutModal?: (doctor: any) => void;
  onOpenTariffSheet?: (doctor: any) => void;
  onOpenRequisitionSlip?: (doctor: any) => void;
}

export default function DoctorReferralLedgerView({
  onOpenPayoutModal,
  onOpenTariffSheet,
  onOpenRequisitionSlip,
}: DoctorReferralLedgerViewProps) {
  const [referrals, setReferrals] = useState<ReferralDoctorItem[]>(INITIAL_REFERRALS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "SETTLED">("ALL");

  const totalRevenue = referrals.reduce((acc, r) => acc + r.totalBilledRevenue, 0);
  const totalEarned = referrals.reduce((acc, r) => acc + r.totalEarnedCommission, 0);
  const totalSettled = referrals.reduce((acc, r) => acc + r.settledCommission, 0);
  const totalPending = referrals.reduce((acc, r) => acc + r.pendingBalance, 0);

  const filteredReferrals = referrals.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.doctorCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.clinicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.specialization.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL"
        ? true
        : filterStatus === "PENDING"
        ? r.pendingBalance > 0
        : r.pendingBalance === 0;

    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = [
      "Doctor Code",
      "Doctor Name",
      "Specialization",
      "Clinic / Hospital",
      "Phone",
      "Total Cases",
      "Total Revenue (INR)",
      "Commission Rate %",
      "Earned Incentive (INR)",
      "Settled (INR)",
      "Pending Balance (INR)",
      "Bank Account",
      "IFSC Code",
    ];

    const rows = filteredReferrals.map((r) => [
      r.doctorCode,
      `"${r.name}"`,
      `"${r.specialization}"`,
      `"${r.clinicName}"`,
      r.phone,
      r.referredPatientsCount,
      r.totalBilledRevenue,
      r.commissionRate,
      r.totalEarnedCommission,
      r.settledCommission,
      r.pendingBalance,
      `"${r.bankAccount.accountNumber}"`,
      r.bankAccount.ifsc,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `referral_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showSuccess("Referral Ledger Statement exported to CSV successfully.");
  };

  return (
    <div className="space-y-4">
      {/* ── Financial Ledger KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Gross Referred Revenue</span>
            <DollarSign className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">₹{totalRevenue.toLocaleString()}</span>
            <span className="text-xs text-sky-600 font-medium">Billed Diagnosed</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Referral Incentives</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">₹{totalEarned.toLocaleString()}</span>
            <span className="text-xs text-indigo-600 font-medium">Contracted Commissions</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Disbursed / Settled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-800">₹{totalSettled.toLocaleString()}</span>
            <span className="text-xs text-emerald-600 font-medium">Paid Vouchers</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Pending Commission Balance</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-800">₹{totalPending.toLocaleString()}</span>
            <span className="text-xs text-amber-600 font-medium">Unsettled Due</span>
          </div>
        </div>

      </div>

      {/* ── Search, Filter & Export Controls ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search referring doctor, clinic, code, specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-xs font-medium placeholder-slate-400 focus:border-sky-600 focus:outline-none bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              All Partners ({referrals.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("PENDING")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                filterStatus === "PENDING"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              Pending Payouts
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("SETTLED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === "SETTLED"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              Fully Settled
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5"
              title="Export Ledger"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

        </div>
      </div>

      {/* ── B2B Referral Ledger Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Doctor & Clinic Partner</th>
                <th className="py-3 px-4">Referred Cases</th>
                <th className="py-3 px-4">Billed Revenue</th>
                <th className="py-3 px-4">Rate & Earned</th>
                <th className="py-3 px-4">Disbursed (Paid)</th>
                <th className="py-3 px-4">Pending Due</th>
                <th className="py-3 px-4 text-right">Settlement Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No referral partners match this query.</p>
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((r) => {
                  const hasPending = r.pendingBalance > 0;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Doctor Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{r.name}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {r.specialization}
                        </div>
                        <div className="text-[11px] text-sky-700 font-semibold mt-0.5">
                          🏥 {r.clinicName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Code: {r.doctorCode} • Phone: {r.phone}
                        </div>
                      </td>

                      {/* Cases */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 text-sm">
                          {r.referredPatientsCount}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {r.monthlyPatientsCount} this month
                        </div>
                      </td>

                      {/* Billed Revenue */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          ₹{r.totalBilledRevenue.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          From paid investigations
                        </div>
                      </td>

                      {/* Rate & Earned */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          ₹{r.totalEarnedCommission.toLocaleString()}
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 inline-block mt-0.5">
                          {r.commissionRate}% Contract
                        </span>
                      </td>

                      {/* Disbursed */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-emerald-800">
                          ₹{r.settledCommission.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Verified vouchers
                        </div>
                      </td>

                      {/* Pending Due */}
                      <td className="py-3.5 px-4">
                        {hasPending ? (
                          <div>
                            <div className="font-black text-amber-800 text-sm">
                              ₹{r.pendingBalance.toLocaleString()}
                            </div>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Awaiting Payout
                            </span>
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-slate-400">₹0</div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ All Clear
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {hasPending && (
                            <button
                              type="button"
                              onClick={() => onOpenPayoutModal && onOpenPayoutModal(r)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs"
                              title="Disburse Referral Commission"
                            >
                              Settle Payout
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenRequisitionSlip && onOpenRequisitionSlip(r)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                            title="Generate Doctor Requisition Pad"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-600" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenTariffSheet && onOpenTariffSheet(r)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                            title="B2B Diagnostic Tariff Rate Master"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
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

    </div>
  );
}
