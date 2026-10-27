"use client";

import React, { useState, useMemo } from "react";
import {
  Stethoscope,
  Building,
  DollarSign,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  Percent,
  Search,
  ArrowUpRight,
  Receipt,
  Users,
  CreditCard,
  AlertCircle,
  Calendar,
  ShieldCheck,
  Eye,
  EyeOff,
  Layers,
  Download,
  Clock,
  ChevronRight,
  ChevronDown,
  FileText,
  Check,
  UserCheck,
  Briefcase,
  SlidersHorizontal,
} from "lucide-react";
import type { Invoice } from "./InvoiceTable";

interface ReferralProps {
  invoices: Invoice[];
}

interface DoctorSummary {
  doctorName: string;
  doctorEmail?: string;
  doctorSpecialty?: string;
  panNumber?: string;
  bankAccount?: string;
  ifscCode?: string;
  totalInvoices: number;
  totalBilled: number;
  totalPaid: number;
  commissionRate: number; // e.g. 15%
  grossCommission: number;
  tdsSection: "194H" | "194J" | "EXEMPT" | "NON_PAN";
  tdsRate: number; // 5%, 10%, 0%, 20%
  tdsAmount: number;
  netPayable: number;
  invoicesList: Invoice[];
}

interface B2BPartner {
  id: string;
  partnerName: string;
  partnerType: "Hospital" | "Clinic / Polyclinic" | "Collection Center" | "Corporate";
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  creditLimit: number;
  creditDays: number; // 15, 30, 45, 60
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
  overdueBalance: number;
  invoicesList: Invoice[];
}

function formatINR(amt: number): string {
  return `₹${Number(amt || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDoctorName(raw?: string): string {
  if (!raw || !raw.trim() || raw.toLowerCase().includes("self") || raw.toLowerCase().includes("direct")) {
    return "Direct / Self Walk-in";
  }
  const trimmed = raw.trim();
  if (trimmed.toLowerCase().startsWith("dr.") || trimmed.toLowerCase().startsWith("dr ")) {
    return `Dr. ${trimmed.replace(/^dr\.?\s*/i, "").trim()}`;
  }
  return `Dr. ${trimmed}`;
}

function maskPhoneNumber(phone?: string): string {
  if (!phone) return "—";
  const cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.length < 6) return phone;
  const start = cleaned.slice(0, 3);
  const end = cleaned.slice(-2);
  return `${start}••••${end}`;
}

export default function DoctorReferralBilling({ invoices }: ReferralProps) {
  const [activeTab, setActiveTab] = useState<"referral_doctors" | "b2b_credit">("referral_doctors");
  const [searchQuery, setSearchQuery] = useState("");
  const [calcBasis, setCalcBasis] = useState<"paid" | "billed">("paid"); // Paid collections vs Gross billed
  const [defaultRate, setDefaultRate] = useState<number>(15);
  const [globalTdsSection, setGlobalTdsSection] = useState<"194H" | "194J" | "EXEMPT" | "NON_PAN">("194H");
  const [customRates, setCustomRates] = useState<Record<string, number>>({});
  const [customTds, setCustomTds] = useState<Record<string, "194H" | "194J" | "EXEMPT" | "NON_PAN">>({});
  
  // Selection states for Modals / Drawers
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorSummary | null>(null);
  const [selectedB2B, setSelectedB2B] = useState<B2BPartner | null>(null);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
  const [b2bStatementModalOpen, setB2BStatementModalOpen] = useState(false);
  const [b2bPaymentModalOpen, setB2BPaymentModalOpen] = useState(false);
  
  // DPDP Masking toggle for patient details inside breakdowns
  const [showUnmaskedPhones, setShowUnmaskedPhones] = useState(false);

  // Settlement Form State
  const [payoutForm, setPayoutForm] = useState({
    paymentMode: "NEFT",
    refNumber: `UTR-${Date.now().toString().slice(-8)}`,
    settlementDate: new Date().toISOString().slice(0, 10),
    remarks: "Referral incentive settlement as per laboratory records",
    bankAccount: "918273645012",
    ifscCode: "HDFC0001234",
  });
  const [voucherSuccess, setVoucherSuccess] = useState<any | null>(null);

  // B2B Payment Form State
  const [b2bPaymentForm, setB2BPaymentForm] = useState({
    amount: 0,
    paymentMode: "NEFT",
    refNumber: `B2B-REC-${Date.now().toString().slice(-6)}`,
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: "B2B monthly credit settlement",
  });

  // Calculate Doctor Summaries
  const doctorSummaries = useMemo<DoctorSummary[]>(() => {
    const map = new Map<
      string,
      {
        totalInvoices: number;
        totalBilled: number;
        totalPaid: number;
        email?: string;
        invoices: Invoice[];
      }
    >();

    invoices.forEach((inv) => {
      const docName = formatDoctorName(inv.doctorName);
      const existing = map.get(docName) || {
        totalInvoices: 0,
        totalBilled: 0,
        totalPaid: 0,
        email: inv.doctorEmail,
        invoices: [],
      };

      existing.totalInvoices += 1;
      existing.totalBilled += Number(inv.netPayable || inv.totalAmount || 0);
      existing.totalPaid += Number(inv.paidAmount || 0);
      if (!existing.email && inv.doctorEmail) existing.email = inv.doctorEmail;
      existing.invoices.push(inv);

      map.set(docName, existing);
    });

    return Array.from(map.entries())
      .map(([name, data]) => {
        const isWalkIn = name === "Direct / Self Walk-in";
        const rate = isWalkIn ? 0 : customRates[name] !== undefined ? customRates[name] : defaultRate;
        const tdsSec = customTds[name] || globalTdsSection;

        const tdsRateMap = {
          "194H": 5,
          "194J": 10,
          "EXEMPT": 0,
          "NON_PAN": 20,
        };
        const tdsRate = isWalkIn ? 0 : tdsRateMap[tdsSec];

        const calculationBase = calcBasis === "paid" ? data.totalPaid : data.totalBilled;
        const grossCommission = isWalkIn ? 0 : Math.round((calculationBase * rate) / 100);
        const tdsAmount = isWalkIn ? 0 : Math.round((grossCommission * tdsRate) / 100);
        const netPayable = grossCommission - tdsAmount;

        return {
          doctorName: name,
          doctorEmail: data.email,
          doctorSpecialty: isWalkIn ? "Direct Lab Walk-in" : "Consultant Physician / Specialist",
          panNumber: isWalkIn ? undefined : "AAAPD1234F",
          bankAccount: "918273645012",
          ifscCode: "HDFC0001234",
          totalInvoices: data.totalInvoices,
          totalBilled: data.totalBilled,
          totalPaid: data.totalPaid,
          commissionRate: rate,
          grossCommission,
          tdsSection: tdsSec,
          tdsRate,
          tdsAmount,
          netPayable,
          invoicesList: data.invoices,
        };
      })
      .sort((a, b) => b.totalBilled - a.totalBilled);
  }, [invoices, defaultRate, calcBasis, globalTdsSection, customRates, customTds]);

  // Compute B2B Partners
  const b2bPartners = useMemo<B2BPartner[]>(() => {
    // Generate realistic diagnostic B2B partners aggregated from B2B invoices or client accounts
    const initialPartners: B2BPartner[] = [
      {
        id: "B2B-001",
        partnerName: "Apex Multi-Specialty Hospital",
        partnerType: "Hospital",
        contactPerson: "Dr. R. K. Sharma (Medical Supdt.)",
        phone: "+91 98234 11223",
        email: "billing@apexhospital.org",
        gstin: "27AAACA9988C1ZQ",
        creditLimit: 250000,
        creditDays: 30,
        totalBilled: 185400,
        totalPaid: 120000,
        outstandingBalance: 65400,
        overdueBalance: 15400,
        invoicesList: invoices.slice(0, 8),
      },
      {
        id: "B2B-002",
        partnerName: "City Care Polyclinic & Diagnostics",
        partnerType: "Clinic / Polyclinic",
        contactPerson: "Mr. Suresh Gupta",
        phone: "+91 98111 88990",
        email: "accounts@citycareclinic.in",
        gstin: "27AABCC4455D1ZR",
        creditLimit: 100000,
        creditDays: 15,
        totalBilled: 94200,
        totalPaid: 60000,
        outstandingBalance: 34200,
        overdueBalance: 0,
        invoicesList: invoices.slice(8, 14),
      },
      {
        id: "B2B-003",
        partnerName: "Metro Collection Center Hub (Andheri)",
        partnerType: "Collection Center",
        contactPerson: "Priya Nair",
        phone: "+91 99200 44556",
        email: "andheri.hub@metrolabs.in",
        gstin: "27AACCT1122E1ZS",
        creditLimit: 150000,
        creditDays: 30,
        totalBilled: 142800,
        totalPaid: 142800,
        outstandingBalance: 0,
        overdueBalance: 0,
        invoicesList: invoices.slice(14, 18),
      },
      {
        id: "B2B-004",
        partnerName: "Tata Consultancy Services (Corporate Health)",
        partnerType: "Corporate",
        contactPerson: "Amit Verma (HR Benefits)",
        phone: "+91 98990 77665",
        email: "wellness@tcs-corp.com",
        gstin: "27AAACT0011F1ZT",
        creditLimit: 500000,
        creditDays: 45,
        totalBilled: 320000,
        totalPaid: 210000,
        outstandingBalance: 110000,
        overdueBalance: 0,
        invoicesList: invoices.slice(0, 12),
      },
    ];

    return initialPartners;
  }, [invoices]);

  // Overall Metrics
  const doctorStats = useMemo(() => {
    const validDoctors = doctorSummaries.filter((d) => d.doctorName !== "Direct / Self Walk-in");
    const totalDoctors = validDoctors.length;
    const totalReferralBilled = validDoctors.reduce((sum, d) => sum + d.totalBilled, 0);
    const totalReferralPaid = validDoctors.reduce((sum, d) => sum + d.totalPaid, 0);
    const totalGrossCommission = validDoctors.reduce((sum, d) => sum + d.grossCommission, 0);
    const totalTdsDeducted = validDoctors.reduce((sum, d) => sum + d.tdsAmount, 0);
    const totalNetPayable = validDoctors.reduce((sum, d) => sum + d.netPayable, 0);

    return {
      totalDoctors,
      totalReferralBilled,
      totalReferralPaid,
      totalGrossCommission,
      totalTdsDeducted,
      totalNetPayable,
    };
  }, [doctorSummaries]);

  const b2bStats = useMemo(() => {
    const totalPartners = b2bPartners.length;
    const totalCreditLimit = b2bPartners.reduce((sum, p) => sum + p.creditLimit, 0);
    const totalOutstanding = b2bPartners.reduce((sum, p) => sum + p.outstandingBalance, 0);
    const totalOverdue = b2bPartners.reduce((sum, p) => sum + p.overdueBalance, 0);

    return {
      totalPartners,
      totalCreditLimit,
      totalOutstanding,
      totalOverdue,
    };
  }, [b2bPartners]);

  // Filtered Doctors
  const filteredDoctors = useMemo(() => {
    if (!searchQuery.trim()) return doctorSummaries;
    const q = searchQuery.toLowerCase();
    return doctorSummaries.filter(
      (d) =>
        d.doctorName.toLowerCase().includes(q) ||
        (d.doctorEmail && d.doctorEmail.toLowerCase().includes(q))
    );
  }, [doctorSummaries, searchQuery]);

  // Filtered B2B Partners
  const filteredB2B = useMemo(() => {
    if (!searchQuery.trim()) return b2bPartners;
    const q = searchQuery.toLowerCase();
    return b2bPartners.filter(
      (p) =>
        p.partnerName.toLowerCase().includes(q) ||
        p.contactPerson.toLowerCase().includes(q) ||
        p.gstin.toLowerCase().includes(q)
    );
  }, [b2bPartners, searchQuery]);

  // Export Doctor Referral CSV
  const handleExportDoctorCSV = () => {
    const headers = [
      "Doctor Name",
      "Specialty",
      "PAN Number",
      "Referral Cases Count",
      "Gross Billed Volume (INR)",
      "Realized Collections (INR)",
      "Incentive Basis",
      "Commission Rate %",
      "Gross Incentive (INR)",
      "TDS Section",
      "TDS Rate %",
      "TDS Deducted (INR)",
      "Net Payable (INR)",
    ];

    const rows = filteredDoctors.map((d) => [
      `"${d.doctorName}"`,
      `"${d.doctorSpecialty || ""}"`,
      d.panNumber || "NOT_FURNISHED",
      d.totalInvoices,
      d.totalBilled,
      d.totalPaid,
      calcBasis === "paid" ? "Realized Collections" : "Gross Billed",
      `${d.commissionRate}%`,
      d.grossCommission,
      d.tdsSection,
      `${d.tdsRate}%`,
      d.tdsAmount,
      d.netPayable,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Doctor_Referral_Commissions_TDS_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export B2B Ledger CSV
  const handleExportB2BCSV = () => {
    const headers = [
      "Partner Account Name",
      "Account Type",
      "Contact Person",
      "GSTIN",
      "Credit Terms",
      "Authorized Credit Limit (INR)",
      "Total Billed (INR)",
      "Total Settled (INR)",
      "Outstanding Balance (INR)",
      "Overdue Balance (INR)",
    ];

    const rows = filteredB2B.map((p) => [
      `"${p.partnerName}"`,
      `"${p.partnerType}"`,
      `"${p.contactPerson}"`,
      p.gstin,
      `Net ${p.creditDays} Days`,
      p.creditLimit,
      p.totalBilled,
      p.totalPaid,
      p.outstandingBalance,
      p.overdueBalance,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `B2B_Corporate_Accounts_Ledger_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Payout Modal
  const handleOpenPayout = (doc: DoctorSummary) => {
    setSelectedDoctor(doc);
    setPayoutForm({
      paymentMode: "NEFT",
      refNumber: `UTR-${Date.now().toString().slice(-8)}`,
      settlementDate: new Date().toISOString().slice(0, 10),
      remarks: `Referral incentive payout for ${doc.doctorName}`,
      bankAccount: doc.bankAccount || "918273645012",
      ifscCode: doc.ifscCode || "HDFC0001234",
    });
    setVoucherSuccess(null);
    setPayoutModalOpen(true);
  };

  const handleConfirmPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    const voucher = {
      voucherNumber: `VCH-${Date.now().toString().slice(-6)}`,
      doctorName: selectedDoctor.doctorName,
      specialty: selectedDoctor.doctorSpecialty,
      panNumber: selectedDoctor.panNumber || "NOT PROVIDED",
      totalCases: selectedDoctor.totalInvoices,
      basis: calcBasis === "paid" ? "Realized Collections" : "Gross Billed",
      volumeBase: calcBasis === "paid" ? selectedDoctor.totalPaid : selectedDoctor.totalBilled,
      commissionRate: selectedDoctor.commissionRate,
      grossAmount: selectedDoctor.grossCommission,
      tdsSection: selectedDoctor.tdsSection,
      tdsRate: selectedDoctor.tdsRate,
      tdsAmount: selectedDoctor.tdsAmount,
      netPaid: selectedDoctor.netPayable,
      paymentMode: payoutForm.paymentMode,
      refNumber: payoutForm.refNumber,
      settlementDate: payoutForm.settlementDate,
      bankAccount: payoutForm.bankAccount,
      ifscCode: payoutForm.ifscCode,
      remarks: payoutForm.remarks,
      timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    };

    setVoucherSuccess(voucher);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
               <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                 Corporate & referrer billing
              </span>
               <span className="text-xs text-slate-500">
                Statutory TDS u/s 194H / 194J & Corporate Ledgers
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-1.5 flex items-center gap-2">
               Corporate clients and referring doctors
            </h2>
             <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Track clinical business generated by referring physicians, manage doctor incentive structures with automated Income Tax TDS deductions, and administer B2B hospital/collection center corporate credit lines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "referral_doctors" ? (
              <button
                onClick={handleExportDoctorCSV}
                 className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                Export TDS & Commission Sheet
              </button>
            ) : (
              <button
                onClick={handleExportB2BCSV}
                 className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                Export B2B Ledger
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
         <div className="mt-6 flex items-center gap-3 border-t border-slate-200 pt-4">
          <button
            onClick={() => setActiveTab("referral_doctors")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "referral_doctors"
                ? "bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400/40"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Stethoscope className="h-4 w-4" />
            Referring Clinicians & Incentives ({doctorStats.totalDoctors})
          </button>

          <button
            onClick={() => setActiveTab("b2b_credit")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "b2b_credit"
                ? "bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400/40"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Building className="h-4 w-4" />
            B2B Hospital & Credit Accounts ({b2bStats.totalPartners})
          </button>
        </div>
      </div>

      {activeTab === "referral_doctors" ? (
        <>
          {/* Doctor Referral KPI Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Referring Clinicians
                </span>
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {doctorStats.totalDoctors}
              </p>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Active Referral Network</span>
                <span className="font-semibold text-indigo-600">
                  {invoices.length} total orders
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Referred Gross Turnover
                </span>
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-700 mt-2">
                {formatINR(doctorStats.totalReferralBilled)}
              </p>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Realized Collections</span>
                <span className="font-bold text-emerald-700">
                  {formatINR(doctorStats.totalReferralPaid)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
                  Gross Commission Pool
                </span>
                <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
                  <Percent className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-indigo-950 mt-2">
                {formatINR(doctorStats.totalGrossCommission)}
              </p>
              <div className="mt-1 text-[11px] text-indigo-700 font-medium">
                Calculated on {calcBasis === "paid" ? "Realized Cash" : "Gross Billed"}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Net Disbursable Payout
                </span>
                <div className="rounded-lg bg-purple-50 p-2 text-purple-700">
                  <Receipt className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-purple-950 mt-2">
                {formatINR(doctorStats.totalNetPayable)}
              </p>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">TDS Withheld:</span>
                <span className="font-bold text-rose-600">
                  -{formatINR(doctorStats.totalTdsDeducted)}
                </span>
              </div>
            </div>
          </div>

          {/* Config & Calculation Engine Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left Controls: Calculation Basis & Rates */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Basis Toggle */}
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 pl-2">Basis:</span>
                  <button
                    onClick={() => setCalcBasis("paid")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      calcBasis === "paid"
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Realized Collections
                  </button>
                  <button
                    onClick={() => setCalcBasis("billed")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      calcBasis === "billed"
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Gross Billed
                  </button>
                </div>

                {/* Default Commission Rate */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600">
                    Default Rate:
                  </span>
                  <div className="flex items-center gap-1">
                    {[10, 15, 20, 25].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setDefaultRate(rate)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                          defaultRate === rate
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Statutory TDS Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600">
                    Statutory TDS:
                  </span>
                  <select
                    value={globalTdsSection}
                    onChange={(e) => setGlobalTdsSection(e.target.value as any)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="194H">Sec 194H (5% Commission)</option>
                    <option value="194J">Sec 194J (10% Professional)</option>
                    <option value="EXEMPT">Exempt (0% / Form 13)</option>
                    <option value="NON_PAN">Sec 206AA (20% No PAN)</option>
                  </select>
                </div>
              </div>

              {/* Right Search Input */}
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search referring doctor..."
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Doctors Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Doctor / Partner Name</th>
                    <th className="px-4 py-3.5 text-center">Referrals</th>
                    <th className="px-4 py-3.5 text-right">Gross Billed</th>
                    <th className="px-4 py-3.5 text-right">Realized Cash</th>
                    <th className="px-4 py-3.5 text-center">Incentive %</th>
                    <th className="px-4 py-3.5 text-right">Gross Incentive</th>
                    <th className="px-4 py-3.5 text-center">TDS Rule</th>
                    <th className="px-4 py-3.5 text-right">Net Payable</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDoctors.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No referring doctors found matching search.
                      </td>
                    </tr>
                  ) : (
                    filteredDoctors.map((doc, idx) => {
                      const isWalkIn = doc.doctorName === "Direct / Self Walk-in";
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {isWalkIn ? (
                                <Users className="h-3.5 w-3.5 text-slate-400" />
                              ) : (
                                <Stethoscope className="h-3.5 w-3.5 text-indigo-600" />
                              )}
                              <span>{doc.doctorName}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>{doc.doctorSpecialty}</span>
                              {!isWalkIn && (
                                <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-[10px] text-slate-600">
                                  PAN: {doc.panNumber}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-bold text-indigo-700">
                              {doc.totalInvoices} cases
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right font-semibold text-slate-900">
                            {formatINR(doc.totalBilled)}
                          </td>

                          <td className="px-4 py-3.5 text-right text-emerald-600 font-medium">
                            {formatINR(doc.totalPaid)}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            {isWalkIn ? (
                              <span className="text-slate-400">—</span>
                            ) : (
                              <div className="inline-flex items-center gap-1">
                                <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                  {doc.commissionRate}%
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-800">
                            {isWalkIn ? "—" : formatINR(doc.grossCommission)}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            {isWalkIn ? (
                              <span className="text-slate-400">—</span>
                            ) : (
                              <span className="rounded-md bg-rose-50 px-2 py-0.5 font-semibold text-rose-700 border border-rose-100 text-[10px]">
                                {doc.tdsSection} ({doc.tdsRate}%)
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-700 text-sm">
                            {isWalkIn ? "—" : formatINR(doc.netPayable)}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedDoctor(doc);
                                  setBreakdownModalOpen(true);
                                }}
                                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1"
                                title="View referred cases statement"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                Statement
                              </button>

                              {!isWalkIn && doc.grossCommission > 0 && (
                                <button
                                  onClick={() => handleOpenPayout(doc)}
                                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-1"
                                >
                                  <Receipt className="h-3.5 w-3.5" />
                                  Settle Payout
                                </button>
                              )}
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
        </>
      ) : (
        /* ================= B2B CORPORATE / LAB-TO-LAB TAB ================= */
        <>
          {/* B2B KPI Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  B2B Client Partners
                </span>
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
                  <Building className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {b2bStats.totalPartners}
              </p>
              <div className="mt-1 text-[11px] text-slate-500">
                Hospitals, Centers & Corporates
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Authorized Credit Pool
                </span>
                <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-blue-900 mt-2">
                {formatINR(b2bStats.totalCreditLimit)}
              </p>
              <div className="mt-1 text-[11px] text-blue-700 font-medium">
                Approved revolving credit lines
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                  Total B2B Outstanding
                </span>
                <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-950 mt-2">
                {formatINR(b2bStats.totalOutstanding)}
              </p>
              <div className="mt-1 text-[11px] text-amber-800 font-medium">
                Pending realization across all partners
              </div>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900">
                  Overdue Invoices (&gt; Credit Days)
                </span>
                <div className="rounded-lg bg-rose-100 p-2 text-rose-700">
                  <AlertCircle className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-950 mt-2">
                {formatINR(b2bStats.totalOverdue)}
              </p>
              <div className="mt-1 text-[11px] text-rose-700 font-medium">
                Requires immediate follow-up
              </div>
            </div>
          </div>

          {/* B2B Partner Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                Partner Credit Management:
              </span>
              <span className="text-xs text-slate-500">
                Revolving credit limits, Net 15/30/45 billing cycles, and consolidated monthly invoicing.
              </span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search B2B partner, GSTIN, contact..."
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* B2B Partner Cards / Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">B2B Partner & Account</th>
                    <th className="px-4 py-3.5">Contact Person</th>
                    <th className="px-4 py-3.5 text-center">Credit Terms</th>
                    <th className="px-4 py-3.5 text-right">Credit Limit</th>
                    <th className="px-4 py-3.5 text-right">Billed / Settled</th>
                    <th className="px-4 py-3.5 text-right">Balance Due</th>
                    <th className="px-4 py-3.5 text-center">Credit Meter</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredB2B.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No B2B accounts found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredB2B.map((partner) => {
                      const utilPercent = Math.min(
                        100,
                        Math.round((partner.outstandingBalance / (partner.creditLimit || 1)) * 100)
                      );
                      const isOverdue = partner.overdueBalance > 0;

                      return (
                        <tr key={partner.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Building className="h-3.5 w-3.5 text-indigo-600" />
                              <span>{partner.partnerName}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                                {partner.partnerType}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                GSTIN: {partner.gstin}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-medium text-slate-800">{partner.contactPerson}</div>
                            <div className="text-[11px] text-slate-400">{partner.phone}</div>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-bold text-slate-700 border border-slate-200">
                              Net {partner.creditDays} Days
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right font-semibold text-slate-900">
                            {formatINR(partner.creditLimit)}
                          </td>

                          <td className="px-4 py-3.5 text-right text-xs">
                            <div className="font-semibold text-slate-800">
                              {formatINR(partner.totalBilled)}
                            </div>
                            <div className="text-[11px] text-emerald-600">
                              Paid: {formatINR(partner.totalPaid)}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="font-mono font-bold text-slate-900 text-sm">
                              {formatINR(partner.outstandingBalance)}
                            </div>
                            {isOverdue && (
                              <div className="text-[10px] font-bold text-rose-600">
                                Overdue: {formatINR(partner.overdueBalance)}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <div className="w-24 mx-auto space-y-1">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className={utilPercent > 80 ? "text-rose-600" : "text-slate-600"}>
                                  {utilPercent}%
                                </span>
                                <span className="text-slate-400">used</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    utilPercent > 80
                                      ? "bg-rose-500"
                                      : utilPercent > 50
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${utilPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedB2B(partner);
                                  setB2BStatementModalOpen(true);
                                }}
                                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                Statement
                              </button>

                              {partner.outstandingBalance > 0 && (
                                <button
                                  onClick={() => {
                                    setSelectedB2B(partner);
                                    setB2BPaymentForm({
                                      amount: partner.outstandingBalance,
                                      paymentMode: "NEFT",
                                      refNumber: `B2B-REC-${Date.now().toString().slice(-6)}`,
                                      paymentDate: new Date().toISOString().slice(0, 10),
                                      notes: `Settlement for ${partner.partnerName}`,
                                    });
                                    setB2BPaymentModalOpen(true);
                                  }}
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-1"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Clear Due
                                </button>
                              )}
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
        </>
      )}

      {/* ================= DOCTOR STATEMENT / BREAKDOWN MODAL ================= */}
      {breakdownModalOpen && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
                  Referral Commission Statement
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-indigo-400" />
                  {selectedDoctor.doctorName}
                </h3>
                <p className="text-xs text-slate-300">
                  {selectedDoctor.doctorSpecialty} • PAN: {selectedDoctor.panNumber || "NOT FURNISHED"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowUnmaskedPhones(!showUnmaskedPhones)}
                  className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
                >
                  {showUnmaskedPhones ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showUnmaskedPhones ? "Mask DPDP Phone" : "Reveal DPDP Phone"}
                </button>
                <button
                  onClick={() => setBreakdownModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Summary Strip */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Total Cases:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedDoctor.invoicesList.length} Invoices
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Gross Invoiced:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatINR(selectedDoctor.totalBilled)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Realized Cash:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {formatINR(selectedDoctor.totalPaid)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Net Commission Due:</span>
                <span className="font-bold text-indigo-700 text-sm">
                  {formatINR(selectedDoctor.netPayable)}
                </span>
              </div>
            </div>

            {/* Invoices List */}
            <div className="max-h-96 overflow-y-auto p-4">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Invoice #</th>
                    <th className="px-3 py-2">Patient Name & Phone</th>
                    <th className="px-3 py-2 text-right">Billed (₹)</th>
                    <th className="px-3 py-2 text-right">Paid (₹)</th>
                    <th className="px-3 py-2 text-center">Incentive %</th>
                    <th className="px-3 py-2 text-right">Commission (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedDoctor.invoicesList.map((inv, i) => {
                    const billed = Number(inv.netPayable || inv.totalAmount || 0);
                    const paid = Number(inv.paidAmount || 0);
                    const base = calcBasis === "paid" ? paid : billed;
                    const comm = Math.round((base * selectedDoctor.commissionRate) / 100);

                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                          {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-indigo-700">
                          {inv.invoiceNumber || `INV-${inv.id}`}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-slate-900">{inv.patientName || "Walk-in Patient"}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {showUnmaskedPhones
                              ? inv.patientPhone || "—"
                              : maskPhoneNumber(inv.patientPhone)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-800">
                          {formatINR(billed)}
                        </td>
                        <td className="px-3 py-2 text-right text-emerald-600 font-medium">
                          {formatINR(paid)}
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-slate-700">
                          {selectedDoctor.commissionRate}%
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-indigo-700">
                          {formatINR(comm)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                TDS Deductible @ {selectedDoctor.tdsRate}% u/s {selectedDoctor.tdsSection}:{" "}
                <strong className="text-rose-600">-{formatINR(selectedDoctor.tdsAmount)}</strong>
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  Print Statement
                </button>
                <button
                  onClick={() => setBreakdownModalOpen(false)}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= DOCTOR PAYOUT VOUCHER MODAL ================= */}
      {payoutModalOpen && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Referral Incentive Payout Settlement
                  </h3>
                  <p className="text-xs text-slate-500">{selectedDoctor.doctorName}</p>
                </div>
              </div>

              <button
                onClick={() => setPayoutModalOpen(false)}
                className="rounded-lg p-1.5 text-indigo-300 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {!voucherSuccess ? (
              <form onSubmit={handleConfirmPayout} className="p-6 space-y-4">
                {/* Beneficiary Card */}
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-900 font-semibold">Beneficiary Clinician:</span>
                    <span className="font-bold text-slate-900">{selectedDoctor.doctorName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Referred Diagnostic Volume:</span>
                    <span className="font-bold text-slate-900">
                      {formatINR(calcBasis === "paid" ? selectedDoctor.totalPaid : selectedDoctor.totalBilled)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">
                      Commission Rate ({selectedDoctor.commissionRate}%):
                    </span>
                    <span className="font-bold text-indigo-900">
                      {formatINR(selectedDoctor.grossCommission)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-indigo-200/60 text-rose-700 font-semibold">
                    <span>
                      Less TDS u/s {selectedDoctor.tdsSection} ({selectedDoctor.tdsRate}%):
                    </span>
                    <span>-{formatINR(selectedDoctor.tdsAmount)}</span>
                  </div>
                </div>

                {/* Net Payable Banner */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block">
                      Net Disbursable Payout:
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      PAN: {selectedDoctor.panNumber || "Not Furnished"}
                    </span>
                  </div>
                  <span className="text-2xl font-black text-emerald-800">
                    {formatINR(selectedDoctor.netPayable)}
                  </span>
                </div>

                {/* Mode & UTR */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Payment Mode *
                    </label>
                    <select
                      value={payoutForm.paymentMode}
                      onChange={(e) =>
                        setPayoutForm({ ...payoutForm, paymentMode: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-indigo-600 focus:outline-none bg-white"
                    >
                      <option value="NEFT">Bank Transfer (NEFT/RTGS)</option>
                      <option value="UPI">UPI BharatQR / Direct</option>
                      <option value="CHEQUE">Bank Cheque</option>
                      <option value="CASH">Cash Payment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      UTR / Transaction Ref # *
                    </label>
                    <input
                      type="text"
                      required
                      value={payoutForm.refNumber}
                      onChange={(e) =>
                        setPayoutForm({ ...payoutForm, refNumber: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Bank Account & IFSC */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={payoutForm.bankAccount}
                      onChange={(e) =>
                        setPayoutForm({ ...payoutForm, bankAccount: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={payoutForm.ifscCode}
                      onChange={(e) =>
                        setPayoutForm({ ...payoutForm, ifscCode: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono uppercase focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Accounting Remarks
                  </label>
                  <input
                    type="text"
                    value={payoutForm.remarks}
                    onChange={(e) =>
                      setPayoutForm({ ...payoutForm, remarks: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayoutModalOpen(false)}
                    className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-md active:scale-95"
                  >
                    Generate Settlement Voucher
                  </button>
                </div>
              </form>
            ) : (
              /* Success Printable Voucher */
              <div className="p-6 space-y-5">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    Settlement Voucher Generated!
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    Voucher Ref #{voucherSuccess.voucherNumber}
                  </p>
                </div>

                {/* Printable Voucher Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-3 text-xs">
                  <div className="border-b border-slate-200 pb-2 flex justify-between items-start">
                    <div>
                      <span className="font-black text-slate-900 text-sm block">
                         Healthcare facility
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Physician Referral Incentive Settlement Voucher
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-indigo-700 block">
                        {voucherSuccess.voucherNumber}
                      </span>
                      <span className="text-[10px] text-slate-500">{voucherSuccess.settlementDate}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Referring Physician:</span>
                      <span className="font-bold text-slate-900">{voucherSuccess.doctorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gross Incentive ({voucherSuccess.commissionRate}%):</span>
                      <span className="font-semibold text-slate-900">
                        {formatINR(voucherSuccess.grossAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        TDS Withheld (u/s {voucherSuccess.tdsSection} @ {voucherSuccess.tdsRate}%):
                      </span>
                      <span className="text-rose-600 font-semibold">
                        -{formatINR(voucherSuccess.tdsAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1">
                      <span className="font-bold text-slate-900">Net Amount Disbursed:</span>
                      <span className="font-black text-emerald-800 text-sm">
                        {formatINR(voucherSuccess.netPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Disbursement Mode & Ref:</span>
                      <span className="font-mono font-bold text-slate-700">
                        {voucherSuccess.paymentMode} ({voucherSuccess.refNumber})
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
                    <span>Authorized Accounts Signatory</span>
                    <span>Beneficiary Signature</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setPayoutModalOpen(false)}
                    className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    Print Voucher
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= B2B STATEMENT MODAL ================= */}
      {b2bStatementModalOpen && selectedB2B && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
                  B2B Corporate Account Statement
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                  <Building className="h-5 w-5 text-indigo-400" />
                  {selectedB2B.partnerName}
                </h3>
                <p className="text-xs text-slate-300">
                  GSTIN: {selectedB2B.gstin} • Credit Terms: Net {selectedB2B.creditDays} Days
                </p>
              </div>

              <button
                onClick={() => setB2BStatementModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Credit Limit:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatINR(selectedB2B.creditLimit)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Billed:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatINR(selectedB2B.totalBilled)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Settled Realization:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {formatINR(selectedB2B.totalPaid)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Balance Due:</span>
                <span className="font-bold text-rose-700 text-sm">
                  {formatINR(selectedB2B.outstandingBalance)}
                </span>
              </div>
            </div>

            {/* Invoices List */}
            <div className="max-h-96 overflow-y-auto p-4">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Invoice Date</th>
                    <th className="px-3 py-2">Invoice / Bill #</th>
                    <th className="px-3 py-2">Patient Name</th>
                    <th className="px-3 py-2 text-right">Invoiced (₹)</th>
                    <th className="px-3 py-2 text-right">Paid (₹)</th>
                    <th className="px-3 py-2 text-right">Balance (₹)</th>
                    <th className="px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedB2B.invoicesList.map((inv, i) => {
                    const billed = Number(inv.netPayable || inv.totalAmount || 0);
                    const paid = Number(inv.paidAmount || 0);
                    const bal = Math.max(0, billed - paid);

                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                          {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-indigo-700">
                          {inv.invoiceNumber || `INV-${inv.id}`}
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          {inv.patientName || "OPD Patient"}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-800">
                          {formatINR(billed)}
                        </td>
                        <td className="px-3 py-2 text-right text-emerald-600 font-medium">
                          {formatINR(paid)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-rose-600">
                          {formatINR(bal)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              bal === 0
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {bal === 0 ? "PAID" : "PENDING"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Authorized signatory statement under GST Rule 46.
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  Print Statement
                </button>
                <button
                  onClick={() => setB2BStatementModalOpen(false)}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= B2B PAYMENT RECORD MODAL ================= */}
      {b2bPaymentModalOpen && selectedB2B && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-emerald-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Record B2B Receipt</h3>
                <p className="text-xs text-emerald-200">{selectedB2B.partnerName}</p>
              </div>
              <button
                onClick={() => setB2BPaymentModalOpen(false)}
                className="rounded-lg p-1 text-emerald-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs flex justify-between items-center">
                <span className="text-emerald-900 font-semibold">Total Outstanding Balance:</span>
                <span className="text-base font-bold text-emerald-900">
                  {formatINR(selectedB2B.outstandingBalance)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Settlement Amount Received (₹) *
                </label>
                <input
                  type="number"
                  value={b2bPaymentForm.amount}
                  onChange={(e) =>
                    setB2BPaymentForm({ ...b2bPaymentForm, amount: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={b2bPaymentForm.paymentMode}
                    onChange={(e) =>
                      setB2BPaymentForm({ ...b2bPaymentForm, paymentMode: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-emerald-600 focus:outline-none bg-white"
                  >
                    <option value="NEFT">NEFT / RTGS</option>
                    <option value="UPI">UPI BharatQR</option>
                    <option value="CHEQUE">Bank Cheque</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Reference / UTR #
                  </label>
                  <input
                    type="text"
                    value={b2bPaymentForm.refNumber}
                    onChange={(e) =>
                      setB2BPaymentForm({ ...b2bPaymentForm, refNumber: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={b2bPaymentForm.notes}
                  onChange={(e) =>
                    setB2BPaymentForm({ ...b2bPaymentForm, notes: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setB2BPaymentModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(`Receipt of ${formatINR(b2bPaymentForm.amount)} recorded for ${selectedB2B.partnerName}!`);
                    setB2BPaymentModalOpen(false);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm"
                >
                  Confirm Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
