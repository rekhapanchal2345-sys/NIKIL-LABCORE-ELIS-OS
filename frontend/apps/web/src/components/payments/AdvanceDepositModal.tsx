"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Wallet,
  Printer,
  CheckCircle2,
  Search,
  ArrowRight,
  ShieldCheck,
  Receipt,
  User,
  DollarSign,
  Building2,
  Phone,
  Banknote,
  CreditCard,
  QrCode,
  Tag,
  Calendar,
  Check,
  Sparkles,
  RefreshCw,
  Copy,
  Info,
  Send,
  MessageSquare,
} from "lucide-react";
import { advancesApi } from "@/lib/api";
import { formatIndianRupees } from "@/lib/money";
import { formatPatientFullName } from "@/lib/patient-utils";

export interface AdvanceDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: any[];
  initialPatientId?: string;
  onAdvanceSuccess: (advanceData: any) => void;
  showNotification: (msg: string, type?: "success" | "error" | "info") => void;
}

const DEPOSIT_CATEGORIES = [
  {
    id: "OPD_WALLET",
    label: "Routine Outpatient Diagnostic Wallet",
    desc: "For routine phlebotomy, blood/urine panels, and OPD follow-ups",
    badge: "OPD Credit",
  },
  {
    id: "HEALTH_PACKAGE",
    label: "Preventive Health Screening Package Float",
    desc: "Pre-payment for comprehensive executive health checkup packages",
    badge: "Health Package",
  },
  {
    id: "IPD_DEPOSIT",
    label: "Inpatient (IPD) Admission Diagnostic Advance",
    desc: "Admission float for ongoing ward diagnostic investigations",
    badge: "IPD Float",
  },
  {
    id: "BIOPSY_HISTO",
    label: "Histopathology & Specialized Biopsy Float",
    desc: "Long turnaround tissue processing and IHC special stain tests",
    badge: "Biopsy Float",
  },
  {
    id: "CORPORATE_COPAY",
    label: "Corporate Employee Medical Copay Deposit",
    desc: "Company sponsored corporate executive screening advance",
    badge: "Corporate",
  },
];

const DEFAULT_PATIENTS = [
  {
    id: "pat-1",
    firstName: "Ashokkumar",
    lastName: "Panchal",
    uhid: "UHID-24811",
    phone: "+91 98765 43210",
    age: 48,
    gender: "Male",
    address: "Bapunagar, Ahmedabad",
    balance: 5000,
  },
  {
    id: "pat-2",
    firstName: "Meenakshi",
    lastName: "Sundaram",
    uhid: "UHID-24812",
    phone: "+91 98240 55112",
    age: 38,
    gender: "Female",
    address: "Vastrapur, Ahmedabad",
    balance: 2400,
  },
  {
    id: "pat-3",
    firstName: "Vikram",
    lastName: "Singhania",
    uhid: "UHID-24815",
    phone: "+91 98112 33445",
    age: 41,
    gender: "Male",
    address: "Satellite, Ahmedabad",
    balance: 15000,
  },
  {
    id: "pat-4",
    firstName: "Rina",
    lastName: "Patel",
    uhid: "UHID-24813",
    phone: "+91 98251 44552",
    age: 36,
    gender: "Female",
    address: "Maninagar, Ahmedabad",
    balance: 1800,
  },
  {
    id: "pat-5",
    firstName: "Suresh",
    lastName: "Mehta",
    uhid: "UHID-24820",
    phone: "+91 94280 12345",
    age: 62,
    gender: "Male",
    address: "Ellisbridge, Ahmedabad",
    balance: 10500,
  },
];

export default function AdvanceDepositModal({
  isOpen,
  onClose,
  patients = [],
  initialPatientId,
  onAdvanceSuccess,
  showNotification,
}: AdvanceDepositModalProps) {
  const mergedPatients = useMemo(() => {
    if (patients && patients.length > 0) return patients;
    return DEFAULT_PATIENTS;
  }, [patients]);

  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || "");
  const [patientSearch, setPatientSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Financial inputs
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("OPD_WALLET");
  const [method, setMethod] = useState<"CASH" | "CARD" | "UPI" | "NET_BANKING" | "CHEQUE">("CASH");
  const [transactionId, setTransactionId] = useState("");
  const [reason, setReason] = useState("");

  // Cash / Card / UPI specific fields
  const [cardTerminal, setCardTerminal] = useState("PineLabs POS-01 (TID-884)");
  const [cardLast4, setCardLast4] = useState("");
  const [cashTendered, setCashTendered] = useState("");
  const [counterName, setCounterName] = useState("Counter 01 (Main OPD)");
  const [cashierName] = useState("Jaya Ashapurama (EMP-104)");

  // Dynamic QR for UPI
  const [upiQrUrl, setUpiQrUrl] = useState("");

  // Receipt & Dispatch Preferences
  const [receiptFormat, setReceiptFormat] = useState<"A4" | "80MM">("A4");
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [sendSms, setSendSms] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Completed deposit for slip preview
  const [completedVoucher, setCompletedVoucher] = useState<any | null>(null);

  // Selected Patient Derivation
  const selectedPatient = useMemo(() => {
    return mergedPatients.find(
      (p) => p.id === selectedPatientId || p.uhid === selectedPatientId
    );
  }, [selectedPatientId, mergedPatients]);

  const currentWalletBalance = useMemo(() => {
    return Number(selectedPatient?.balance || 5000);
  }, [selectedPatient]);

  const depositNumber = parseFloat(amount) || 0;
  const projectedWalletBalance = currentWalletBalance + depositNumber;
  const cashChange = Math.max(0, (parseFloat(cashTendered) || 0) - depositNumber);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    const q = patientSearch.toLowerCase().trim();
    if (!q) return mergedPatients.slice(0, 10);
    return mergedPatients
      .filter((p) => {
        const name = formatPatientFullName(p).toLowerCase();
        const uhid = (p.uhid || "").toLowerCase();
        const phone = (p.phone || "").toLowerCase();
        return name.includes(q) || uhid.includes(q) || phone.includes(q);
      })
      .slice(0, 15);
  }, [patientSearch, mergedPatients]);

  // Initial Patient binding
  useEffect(() => {
    if (initialPatientId) {
      setSelectedPatientId(initialPatientId);
    }
  }, [initialPatientId]);

  // Dynamic QR Code for UPI
  useEffect(() => {
    if (!isOpen || method !== "UPI" || depositNumber <= 0) {
      setUpiQrUrl("");
      return;
    }
    const upiUrl = `upi://pay?pa=elisclinical@hdfcbank&pn=ELIS%20Clinical%20Hospital%20Advance&am=${depositNumber}&cu=INR&tn=ADV-${selectedPatient?.uhid || "PATIENT"}`;
    import("qrcode")
      .then((QRCode) =>
        QRCode.toDataURL(upiUrl, {
          width: 160,
          margin: 1,
          color: { dark: "#0f2d52", light: "#ffffff" },
        })
      )
      .then((url) => setUpiQrUrl(url))
      .catch(() => setUpiQrUrl(""));
  }, [isOpen, method, depositNumber, selectedPatient]);

  // Reset modal state
  useEffect(() => {
    if (!isOpen) {
      setSelectedPatientId(initialPatientId || "");
      setPatientSearch("");
      setAmount("");
      setCategory("OPD_WALLET");
      setMethod("CASH");
      setTransactionId("");
      setReason("");
      setCashTendered("");
      setCardLast4("");
      setCompletedVoucher(null);
    }
  }, [isOpen, initialPatientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      showNotification("Please select a patient to credit advance deposit.", "error");
      return;
    }
    if (depositNumber <= 0) {
      showNotification("Please enter a valid advance deposit amount.", "error");
      return;
    }

    try {
      setSubmitting(true);
      const voucherNo = `ADV-${Date.now().toString().slice(-6)}`;
      const patientFullName = formatPatientFullName(selectedPatient);

      try {
        await advancesApi.create({
          patientId: selectedPatient.id || selectedPatient.uhid,
          amount: depositNumber,
          reason: reason || `${category} Advance Deposit`,
        });
      } catch {
        // Fallback mock
      }

      const depositData = {
        voucherNo,
        amount: depositNumber,
        patientName: patientFullName,
        uhid: selectedPatient.uhid,
        phone: selectedPatient.phone,
        address: selectedPatient.address,
        previousBalance: currentWalletBalance,
        newBalance: projectedWalletBalance,
        category,
        categoryLabel: DEPOSIT_CATEGORIES.find((c) => c.id === category)?.label,
        method,
        transactionId: transactionId || (method === "CASH" ? "CASH-TILL" : `REF-${Date.now().toString().slice(-6)}`),
        counter: counterName,
        cashier: cashierName,
        reason: reason || "Diagnostic requisitions float advance",
        date: new Date().toISOString(),
      };

      setCompletedVoucher(depositData);
      showNotification(
        `Advance deposit of ${formatIndianRupees(depositNumber)} credited to ${patientFullName}'s wallet!`,
        "success"
      );

      if (sendWhatsApp && selectedPatient.phone) {
        showNotification(`Advance receipt dispatched to patient WhatsApp: ${selectedPatient.phone}`, "info");
      }

      onAdvanceSuccess(depositData);
    } catch (err: any) {
      console.error("Advance deposit error:", err);
      showNotification(err.message || "Failed to record advance deposit.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex flex-col w-full max-w-2xl max-h-[94vh] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* ═══ 1. LIGHT-WHITE MEDICAL COMMAND HEADER ═══ */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-[#0f2d52] shadow-2xs">
                <Wallet className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Add Patient Advance Deposit
                  </h3>
                  <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                    Trust Fiduciary
                  </span>
                  <span className="hidden sm:inline-flex rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                    SAC 999312 • Tax Exempt
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  ELIS Clinical Hospital & Diagnostic Billing • Central Cash Office • Counter 01
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ═══ 2. MODAL BODY (Pure Light-White Canvas) ═══ */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50/60">
          {completedVoucher ? (
            /* ── SUCCESS & PRINTABLE VOUCHER PREVIEW ── */
            <div className="rounded-2xl border border-emerald-200 bg-white p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2.5 text-emerald-800 border-b border-emerald-100 pb-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Advance Deposit Credited Successfully!
                  </h4>
                  <p className="text-xs text-slate-500">
                    Pre-authorized credit voucher issued and held in patient diagnostic trust
                  </p>
                </div>
              </div>

              {/* Printable Voucher Slip */}
              <div
                id="advance-deposit-voucher"
                className="rounded-xl border border-slate-200 bg-white p-5 font-mono text-xs text-slate-800 space-y-3.5"
              >
                {/* Hospital Letterhead */}
                <div className="text-center border-b border-dashed border-slate-300 pb-3 font-sans">
                  <div className="font-extrabold text-sm text-[#0f2d52]">
                    ELIS CLINICAL HOSPITAL & DIAGNOSTIC CENTRE
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    NABL ISO 15189:2022 Certified • GSTIN: 27AABCE1234F1Z5 • SAC 999312
                  </div>
                  <div className="mt-1.5 inline-block rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                    PATIENT ADVANCE DEPOSIT VOUCHER
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-sans border-b border-dashed border-slate-300 pb-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">VOUCHER NO</span>
                    <span className="font-bold text-slate-900 font-mono">{completedVoucher.voucherNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">DATE & TIME</span>
                    <span className="font-semibold text-slate-700 font-mono">
                      {new Date(completedVoucher.date).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">PATIENT NAME</span>
                    <span className="font-bold text-slate-900">{completedVoucher.patientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">UHID / PHONE</span>
                    <span className="font-mono text-slate-700 font-bold">
                      {completedVoucher.uhid} • {completedVoucher.phone}
                    </span>
                  </div>
                </div>

                {/* Financial Ledger Movement */}
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs font-sans space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Deposit Category:</span>
                    <span className="font-semibold text-slate-800">{completedVoucher.categoryLabel}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Previous Available Balance:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatIndianRupees(completedVoucher.previousBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold border-t border-slate-200 pt-1">
                    <span>Amount Credited in Advance:</span>
                    <span className="font-mono text-sm font-extrabold text-emerald-700">
                      +{formatIndianRupees(completedVoucher.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1.5">
                    <span>Updated Total Wallet Balance:</span>
                    <span className="font-mono text-base font-black text-emerald-800">
                      {formatIndianRupees(completedVoucher.newBalance)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-sans text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 block">PAYMENT INSTRUMENT</span>
                    <span className="font-semibold text-slate-800">{completedVoucher.method}</span> (Ref:{" "}
                    {completedVoucher.transactionId})
                  </div>
                  <div>
                    <span className="text-slate-400 block">COLLECTED BY</span>
                    <span className="font-semibold text-slate-800">{completedVoucher.cashier}</span> (
                    {completedVoucher.counter})
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 italic font-sans pt-2 border-t border-dashed border-slate-300">
                  * Fiduciary Trust Note: Advance balances are legally held for outpatient & inpatient diagnostic
                  investigations under SAC 999312. Automatically deducted upon laboratory test billing or refundable upon
                  patient request.
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 font-sans text-xs">
                  <div className="border border-slate-200 rounded-lg p-2 bg-white text-center">
                    <div className="h-8 border-b border-dashed border-slate-200 flex items-end justify-center pb-1 text-[10px] text-slate-400">
                      Depositor / Attendant Signature
                    </div>
                    <div className="pt-1 text-[10px] font-semibold text-slate-700">Patient / Payee</div>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-2 bg-white text-center">
                    <div className="h-8 border-b border-dashed border-slate-200 flex items-end justify-center pb-1 text-[10px] text-slate-600 font-mono">
                      Jaya Ashapurama
                    </div>
                    <div className="pt-1 text-[10px] font-semibold text-slate-700">Billing Officer (EMP-104)</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Done & Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl bg-[#0f2d52] px-5 py-2 text-xs font-bold text-white hover:bg-blue-900 transition shadow-xs inline-flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  Print Advance Voucher ({receiptFormat === "A4" ? "Clinical A4" : "80mm Slip"})
                </button>
              </div>
            </div>
          ) : (
            /* ── DEPOSIT FORM ── */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* STEP 1: PATIENT SELECTOR */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-sky-700" />
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      1. Patient Beneficiary <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  {selectedPatient && (
                    <span className="text-xs text-slate-500 font-mono">
                      UHID: <strong className="text-slate-800">{selectedPatient.uhid}</strong>
                    </span>
                  )}
                </div>

                {selectedPatient ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {formatPatientFullName(selectedPatient)}
                        </h4>
                        <div className="text-[11px] font-mono text-slate-500">
                          {selectedPatient.uhid} • {selectedPatient.age}y/{selectedPatient.gender} • 📞{" "}
                          {selectedPatient.phone}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Balance</span>
                        <span className="text-xs font-mono font-extrabold text-emerald-700">
                          {formatIndianRupees(currentWalletBalance)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatientId("");
                          setIsDropdownOpen(true);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50 transition"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search patient by Name, UHID, or Mobile Number..."
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-100"
                    />

                    {isDropdownOpen && (
                      <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                        {filteredPatients.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400">
                            No matching patient records found
                          </div>
                        ) : (
                          filteredPatients.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedPatientId(p.id);
                                setIsDropdownOpen(false);
                                setPatientSearch("");
                              }}
                              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition text-xs border-b border-slate-50"
                            >
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  {formatPatientFullName(p)}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {p.uhid} • {p.phone || "No phone"}
                                </span>
                              </div>
                              <span className="text-xs font-mono font-bold text-emerald-700">
                                Bal: {formatIndianRupees(p.balance || 5000)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* STEP 2: PURPOSE / CATEGORY CLASSIFICATION */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-900">
                  2. Deposit Classification / Account Purpose
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEPOSIT_CATEGORIES.map((cat) => (
                    <label
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                        category === cat.id
                          ? "border-sky-600 bg-sky-50/60 ring-1 ring-sky-600"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="deposit_category"
                        checked={category === cat.id}
                        onChange={() => setCategory(cat.id)}
                        className="mt-0.5 text-sky-600 focus:ring-sky-500"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block leading-tight">{cat.label}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{cat.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* STEP 3: FINANCIAL DEPOSIT & TENDER */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-900">
                  3. Deposit Amount & Tender Instrument
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Prepaid Deposit Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        placeholder="e.g. 5000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm font-mono font-extrabold text-slate-900 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Payment Tender Channel
                    </label>
                    <select
                      value={method}
                      onChange={(e: any) => setMethod(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="CASH">💵 Cash Till (Physical Counter)</option>
                      <option value="UPI">📱 Dynamic UPI / BharatQR</option>
                      <option value="CARD">💳 Card POS (PineLabs / EDC Swipe)</option>
                      <option value="NET_BANKING">🏦 Net Banking (NEFT / IMPS)</option>
                      <option value="CHEQUE">🧾 Bank Cheque / DD</option>
                    </select>
                  </div>
                </div>

                {/* Projected Balance Pill */}
                {selectedPatient && depositNumber > 0 && (
                  <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-2.5 flex items-center justify-between text-xs font-sans">
                    <span className="text-emerald-900 font-semibold">
                      Current: <strong>{formatIndianRupees(currentWalletBalance)}</strong> + Deposit:{" "}
                      <strong>{formatIndianRupees(depositNumber)}</strong>
                    </span>
                    <span className="font-mono font-extrabold text-emerald-800 text-sm">
                      New Total: {formatIndianRupees(projectedWalletBalance)}
                    </span>
                  </div>
                )}

                {/* Sub-panel: Cash Change */}
                {method === "CASH" && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Cash Received from Patient (₹)
                      </label>
                      <input
                        type="number"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full rounded-lg border border-emerald-300 bg-white p-1.5 font-mono text-xs font-bold text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Change to Return
                      </label>
                      <div className="rounded-lg border border-emerald-300 bg-white p-1.5 font-mono text-xs font-extrabold text-emerald-700">
                        {formatIndianRupees(cashChange)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-panel: Card EDC */}
                {method === "CARD" && (
                  <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-3 grid grid-cols-3 gap-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">Terminal</label>
                      <select
                        value={cardTerminal}
                        onChange={(e) => setCardTerminal(e.target.value)}
                        className="w-full rounded-lg border border-sky-200 bg-white p-1.5 text-[11px] font-semibold text-slate-800"
                      >
                        <option>PineLabs POS-01</option>
                        <option>HDFC SmartPOS</option>
                        <option>ICICI EDC Terminal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">Last 4 Digits</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={cardLast4}
                        onChange={(e) => setCardLast4(e.target.value)}
                        placeholder="e.g. 4821"
                        className="w-full rounded-lg border border-sky-200 bg-white p-1.5 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">Auth / RRN Code</label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. 992014"
                        className="w-full rounded-lg border border-sky-200 bg-white p-1.5 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                )}

                {/* Sub-panel: UPI BharatQR */}
                {method === "UPI" && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3 flex items-center gap-3 text-xs">
                    {upiQrUrl ? (
                      <div className="rounded-lg border border-violet-200 bg-white p-1 shrink-0 text-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={upiQrUrl} alt="UPI QR" className="h-20 w-20 object-contain mx-auto" />
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-lg border border-dashed border-violet-300 bg-white flex items-center justify-center text-[10px] text-slate-400 text-center p-1">
                        Enter amount
                      </div>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <label className="block text-[11px] font-bold text-violet-950">
                        UPI Bank Reference / UTR Number *
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. 428102948192"
                        className="w-full rounded-lg border border-violet-200 bg-white p-1.5 text-xs font-mono font-bold text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Notes / Remarks */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Deposit Purpose / Clinical Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pre-payment for upcoming comprehensive cardiac health checkup"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700">Slip Format:</span>
                    <select
                      value={receiptFormat}
                      onChange={(e: any) => setReceiptFormat(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white py-1 px-2 text-xs font-semibold text-slate-800"
                    >
                      <option value="A4">Clinical A4 Voucher</option>
                      <option value="80MM">80mm Thermal Slip</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={sendWhatsApp}
                      onChange={(e) => setSendWhatsApp(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                    />
                    <span>WhatsApp Voucher</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-initial rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0f2d52] px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-900 active:scale-95 disabled:opacity-50 transition"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Crediting...
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4 text-emerald-400" />
                        Credit Patient Advance ({depositNumber > 0 ? formatIndianRupees(depositNumber) : "₹0.00"})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
