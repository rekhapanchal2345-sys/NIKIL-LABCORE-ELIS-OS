"use client";

import React, { useRef, useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Printer,
  Download,
  X,
  Phone,
  Mail,
  Globe,
  User,
  ShieldCheck,
  FileText,
  Building,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Share2,
  Copy,
  Check,
  Award,
  Stethoscope,
  Maximize2,
  Minimize2,
  Receipt,
  Layers,
  Lock,
  CheckCheck,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";

export interface InvoiceItem {
  id?: string | number;
  testName?: string;
  testCode?: string;
  department?: string;
  hsnSacCode?: string;
  specimen?: string;
  quantity?: number;
  unitPrice?: number;
  unitRate?: number;
  amount?: number;
  total?: number;
  discount?: number;
  taxableValue?: number;
  cgstPercent?: number;
  cgstAmount?: number;
  sgstPercent?: number;
  sgstAmount?: number;
  gstPercent?: number;
}

export interface InvoiceData {
  id?: string | number;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceTime?: string;
  paymentMode?: string;
  transactionId?: string;
  patientName?: string;
  patientId?: string;
  patientUhid?: string;
  age?: string;
  gender?: string;
  bloodGroup?: string;
  phone?: string;
  email?: string;
  address?: string;
  collectedBy?: string;
  collectionDate?: string;
  collectionTime?: string;
  sampleType?: string;
  refDoctor?: string;
  refDoctorQualification?: string;
  refDoctorRegNo?: string;
  labBranch?: string;
  verifyCode?: string;
  items?: InvoiceItem[];
  subtotal?: number;
  discount?: number;
  taxableAmount?: number;
  cgstPercent?: number;
  cgstAmount?: number;
  sgstPercent?: number;
  sgstAmount?: number;
  igstPercent?: number;
  igstAmount?: number;
  totalTax?: number;
  grandTotal?: number;
  netPayable?: number;
  amountPaid?: number;
  paidAmount?: number;
  pendingAmount?: number;
  paymentDate?: string;
  paymentStatus?: "PAID" | "PENDING" | "PARTIAL" | string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  whatsappNumber?: string;
  verifiedBy?: string;
  verifierQualification?: string;
  verifierRegNo?: string;
  labManager?: string;
  companyName?: string;
  gstin?: string;
  panNumber?: string;
  stateCode?: string;
  placeOfSupply?: string;
}

interface PixelPerfectInvoiceProps {
  invoice: InvoiceData;
  labInfo?: {
    name?: string;
    tagline?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    gstin?: string;
    pan?: string;
    cin?: string;
    nablAccredited?: string;
    isoCertified?: string;
    hipaaCompliant?: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  onSwitchToThermal?: () => void;
  onClose?: () => void;
}

function formatCurrency(amount?: number): string {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date?: string): string {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date?: string): string {
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

function numberToWordsINR(amount: number): string {
  const num = Math.abs(Number(amount || 0));
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) {
    return "Indian Rupees Zero Only";
  }

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertTwoDigits(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    const t = tens[Math.floor(n / 10)];
    const o = ones[n % 10];
    return o ? `${t} ${o}` : t;
  }

  function convertThreeDigits(n: number): string {
    if (n === 0) return "";
    const h = Math.floor(n / 100);
    const rest = n % 100;
    const hStr = h ? `${ones[h]} Hundred` : "";
    const restStr = convertTwoDigits(rest);
    if (hStr && restStr) return `${hStr} and ${restStr}`;
    return hStr || restStr;
  }

  let words = "";
  let rem = integerPart;

  if (Math.floor(rem / 10000000) > 0) {
    words += `${convertTwoDigits(Math.floor(rem / 10000000))} Crore `;
    rem %= 10000000;
  }
  if (Math.floor(rem / 100000) > 0) {
    words += `${convertTwoDigits(Math.floor(rem / 100000))} Lakh `;
    rem %= 100000;
  }
  if (Math.floor(rem / 1000) > 0) {
    words += `${convertTwoDigits(Math.floor(rem / 1000))} Thousand `;
    rem %= 1000;
  }
  if (rem > 0) {
    words += convertThreeDigits(rem);
  }

  const rupeeString = words.trim() ? `Indian Rupees ${words.trim()}` : "";
  const paiseString = decimalPart > 0 ? ` and ${convertTwoDigits(decimalPart)} Paise` : "";

  return `${rupeeString || "Zero Rupees"}${paiseString} Only`;
}

export default function PixelPerfectInvoice({
  invoice,
  labInfo,
  onSwitchToThermal,
  onClose,
}: PixelPerfectInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [upiQrUrl, setUpiQrUrl] = useState<string>("");
  const [verifyQrUrl, setVerifyQrUrl] = useState<string>("");
  const [copyMode, setCopyMode] = useState<
    "ORIGINAL FOR RECIPIENT" | "DUPLICATE FOR TRANSPORTER" | "TRIPLICATE FOR SUPPLIER"
  >("ORIGINAL FOR RECIPIENT");
  const [zoomLevel, setZoomLevel] = useState<"fit" | "actual">("fit");
  const [copiedLink, setCopiedLink] = useState(false);

  const lab = {
    name: labInfo?.name || "Healthcare facility",
    tagline: labInfo?.tagline || "Patient billing statement",
    address: labInfo?.address || "",
    phone: labInfo?.phone || "",
    email: labInfo?.email || "",
    website: labInfo?.website || "",
    gstin: labInfo?.gstin || "",
    pan: labInfo?.pan || "",
    cin: labInfo?.cin || "",
    state: "",
    stateCode: "",
    nablAccredited: labInfo?.nablAccredited || "",
    isoCertified: labInfo?.isoCertified || "",
    bankName: labInfo?.bankName || "",
    accountName: labInfo?.accountName || "",
    accountNumber: labInfo?.accountNumber || "",
    ifscCode: labInfo?.ifscCode || "",
    upiId: labInfo?.upiId || "",
  };

  const invNumber = invoice.invoiceNumber || `INV-${invoice.id || "001"}`;
  const grandTotal = Number(invoice.grandTotal || invoice.netPayable || 0);
  const paidAmount = Number(invoice.paidAmount ?? invoice.amountPaid ?? 0);
  const pendingAmount =
    invoice.pendingAmount !== undefined
      ? Number(invoice.pendingAmount)
      : Math.max(0, grandTotal - paidAmount);
  const isPaid = pendingAmount <= 0;

  const verifyCode = invoice.verifyCode || "";
  const verificationUrl = invoice.id
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invoices/${invoice.id}`
    : "";

  // Dynamic Bharat UPI Payment string
  const upiPayAmount = pendingAmount > 0 ? pendingAmount : grandTotal;
  const upiPayload = lab.upiId
    ? `upi://pay?pa=${encodeURIComponent(lab.upiId)}&pn=${encodeURIComponent(
      lab.name
    )}&am=${upiPayAmount.toFixed(2)}&cu=INR&tr=${encodeURIComponent(
      invNumber
    )}&tn=${encodeURIComponent(`Invoice ${invNumber}`)}`
    : "";

  useEffect(() => {
    let active = true;
    Promise.all([
      upiPayload ? QRCode.toDataURL(upiPayload, {
        width: 130,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#0B2545", light: "#ffffff" },
      }) : Promise.resolve(""),
      verificationUrl ? QRCode.toDataURL(verificationUrl, {
        width: 100,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      }) : Promise.resolve(""),
    ])
      .then(([upiUrl, verifyUrl]) => {
        if (active) {
          setUpiQrUrl(upiUrl);
          setVerifyQrUrl(verifyUrl);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("QR Generation error:", err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [upiPayload, verificationUrl]);

  const handlePrint = () => {
    if (!invoiceRef.current) return;
    const content = invoiceRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print A4 invoice.");
      return;
    }

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Tax Invoice – ${invNumber}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  @page {
    size: A4 portrait;
    margin: 8mm;
  }
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0f172a;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    line-height: 1.4;
  }
  .a4-print-canvas {
    width: 194mm;
    margin: 0 auto;
    padding: 0;
    position: relative;
  }
  @media print {
    body {
      margin: 0;
      padding: 0;
    }
    .no-print {
      display: none !important;
    }
  }
</style>
</head>
<body>
  <div class="a4-print-canvas">
    ${content}
  </div>
</body>
</html>`);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Dear ${invoice.patientName || "Patient"},\n\n` +
        `Your invoice *#${invNumber}* for *${formatCurrency(
          grandTotal
        )}* is available from *${lab.name}*.\n\n` +
        `Payment Status: *${isPaid ? "PAID" : `DUE: ${formatCurrency(pendingAmount)}`}*\n` +
        (verificationUrl ? `View invoice: ${verificationUrl}\n\n` : "") +
        `Please contact the billing desk for assistance.`
    );
    const phone = (invoice.phone || "").replace(/[^0-9]/g, "");
    const targetUrl = phone
      ? `https://wa.me/${phone.length === 10 ? "91" + phone : phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(targetUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="flex w-full max-w-5xl flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[97vh]">
        {/* ── TOP TOOLBAR ── */}
        <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between border-b border-slate-200 bg-white px-5 py-3 text-slate-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  A4 Tax Invoice &amp; Bill of Supply
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                    isPaid
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {isPaid ? "PAID" : "BALANCE DUE"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                {invNumber} • {formatDate(invoice.invoiceDate)} • Mode: {invoice.paymentMode || "CASH"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
            {/* Copy Selector Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-0.5 text-xs font-bold border border-slate-200">
              <button
                onClick={() => setCopyMode("ORIGINAL FOR RECIPIENT")}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  copyMode === "ORIGINAL FOR RECIPIENT"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Original
              </button>
              <button
                onClick={() => setCopyMode("DUPLICATE FOR TRANSPORTER")}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  copyMode === "DUPLICATE FOR TRANSPORTER"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Duplicate
              </button>
              <button
                onClick={() => setCopyMode("TRIPLICATE FOR SUPPLIER")}
                className={`hidden md:inline rounded-lg px-2.5 py-1 transition-all ${
                  copyMode === "TRIPLICATE FOR SUPPLIER"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Triplicate
              </button>
            </div>

            {/* Quick Switch to Thermal POS */}
            {onSwitchToThermal && (
              <button
                type="button"
                onClick={onSwitchToThermal}
                title="Switch to 80mm/58mm POS Receipt"
                className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100 transition"
              >
                <Receipt className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Thermal Slip</span>
              </button>
            )}

            {/* Scale Toggle */}
            <button
              type="button"
              onClick={() => setZoomLevel(zoomLevel === "fit" ? "actual" : "fit")}
              title={zoomLevel === "fit" ? "Switch to 100% Actual Scale" : "Fit to screen"}
              className="hidden lg:flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              {zoomLevel === "fit" ? (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>100%</span>
                </>
              ) : (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span>Fit</span>
                </>
              )}
            </button>

            {/* WhatsApp Share */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              title="Share via WhatsApp"
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-[0.99]"
            >
              <Printer className="h-4 w-4" />
              <span>Print A4 Invoice</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── SCROLLABLE A4 WORKSPACE CANVAS ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-100/90">
          <div
            ref={invoiceRef}
            className={`relative bg-white rounded-xl shadow-md p-8 sm:p-12 border border-slate-200 text-slate-900 font-sans transition-all duration-300 ${
              zoomLevel === "actual" ? "w-[210mm] min-h-[297mm]" : "w-full max-w-[840px] min-h-[297mm]"
            }`}
          >
            {/* BACKGROUND SECURITY WATERMARK (PRINT FRIENDLY) */}
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.032] select-none"
              style={{
                backgroundImage: `radial-gradient(#0B2545 1.5px, transparent 1.5px)`,
                backgroundSize: "28px 28px",
              }}
            >
              <div className="rotate-[-32deg] text-center">
                <p className="text-7xl font-black uppercase tracking-widest text-slate-900">
                   {lab.name}
                </p>
                <p className="text-2xl font-bold uppercase tracking-wider text-slate-700 mt-2">
                   INVOICE COPY
                </p>
              </div>
            </div>

            {/* 1. INSTITUTIONAL LETTERHEAD & ACCREDITATIONS */}
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b-2 border-slate-900">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shrink-0">
                  <div className="text-center">
                    <span className="block text-2xl font-black leading-none tracking-tighter">LC</span>
                    <span className="text-[8px] font-bold tracking-widest uppercase text-blue-100">HOSP</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase" style={{color:'#1e1b4b'}}>
                    {lab.name}
                  </h1>
                  <p className="text-xs font-bold text-indigo-700 italic tracking-wide">
                    {lab.tagline}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-md leading-relaxed">
                    {lab.address}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-1.5 font-medium">
                    <span>Tel: <b>{lab.phone}</b></span>
                    <span>•</span>
                    <span>Email: <b>{lab.email}</b></span>
                    <span>•</span>
                    <span>Web: <b>{lab.website}</b></span>
                  </div>
                </div>
              </div>

               {/* Registered facility details */}
               <div className="flex flex-col sm:items-end gap-1.5 self-stretch sm:self-auto pt-1 sm:pt-0 shrink-0">
                 {lab.nablAccredited && (
                   <div className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-indigo-900 ring-1 ring-indigo-300" style={{background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)'}}>
                     <Award className="h-3.5 w-3.5 text-indigo-700" />
                     {lab.nablAccredited}
                   </div>
                 )}
                 {lab.gstin && <div className="text-[11px] font-black text-slate-700 uppercase tracking-wider mt-0.5">GSTIN: <span className="font-mono text-indigo-900">{lab.gstin}</span></div>}
                 {(lab.pan || lab.cin) && <div className="text-[10px] text-slate-500 font-mono">{[lab.pan && `PAN: ${lab.pan}`, lab.cin && `CIN: ${lab.cin}`].filter(Boolean).join(" • ")}</div>}
              </div>
            </div>

            {/* 2. STATUTORY TAX INVOICE STRIP WITH LEGAL REPUTATION */}
            <div className="relative z-10 my-4 flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-white shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold tracking-wider uppercase">
                  TAX INVOICE CUM BILL OF SUPPLY
                </span>
                <span className="text-[10px] text-slate-300 hidden sm:inline">
                  (Under Section 31 of CGST Act, 2017 & Rule 46 of CGST Rules, 2017)
                </span>
              </div>
              <span className="rounded-md border border-white/20 bg-white/10 px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                {copyMode}
              </span>
            </div>

            {/* 3. PATIENT DEMOGRAPHICS (BILL TO) & CLINICAL REFERENCE GRID */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 text-xs">
              {/* Patient (Bill To) Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-indigo-600" />
                    Patient Demographics (Bill To)
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-700">
                     UHID: {invoice.patientUhid || "—"}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Patient Full Name:</span>
                    <span className="font-bold text-slate-900">
                      {invoice.patientName || "Walk-in Patient"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Age / Gender / Blood:</span>
                    <span className="font-semibold text-slate-800">
                      {invoice.age && invoice.gender
                        ? `${invoice.age} Yrs / ${invoice.gender}`
                        : invoice.gender || "—"}{" "}
                      {invoice.bloodGroup ? `• (${invoice.bloodGroup})` : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact Number:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {invoice.phone || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Billing Address:</span>
                    <span className="font-medium text-slate-700 text-right max-w-[65%] truncate">
                       {invoice.address || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-200/80 text-[11px]">
                    <span className="text-slate-500">Place of Supply:</span>
                    <span className="font-bold text-indigo-950">
                       {lab.stateCode && lab.state ? `${lab.stateCode} - ${lab.state}` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Invoice & Clinical Metadata Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-indigo-600" />
                    Clinical Reference & Specimen Details
                  </span>
                  <span className="font-mono text-[11px] font-bold text-indigo-700">
                    {invNumber}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice Date & Time:</span>
                    <span className="font-semibold text-slate-900">
                      {formatDateTime(invoice.invoiceDate || invoice.paymentDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sample Specimen / ID:</span>
                    <span className="font-mono font-bold text-slate-800">
                       {invoice.sampleType || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Referring Clinician:</span>
                    <span className="font-bold text-indigo-950">
                       {invoice.refDoctor ? `Dr. ${invoice.refDoctor}` : "—"}
                      {invoice.refDoctorQualification ? ` (${invoice.refDoctorQualification})` : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Accession / Center:</span>
                    <span className="font-medium text-slate-800">
                       {invoice.labBranch || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-200/80 text-[11px]">
                    <span className="text-slate-500">Reverse Charge (RCM):</span>
                    <span className="font-semibold text-slate-800">
                      No (Tax payable on forward charge)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. INVESTIGATIONS TABLE */}
            <div className="relative z-10 mb-5 overflow-hidden rounded-xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 w-8 text-center">#</th>
                    <th className="py-3 px-3">Investigation / Profile Description</th>
                    <th className="py-3 px-3 text-center">HSN/SAC</th>
                    <th className="py-3 px-3 text-center">Qty</th>
                    <th className="py-3 px-3 text-right">Standard Rate (₹)</th>
                    <th className="py-3 px-3 text-right">Concession (₹)</th>
                    <th className="py-3 px-3 text-right">Taxable Value (₹)</th>
                    <th className="py-3 px-3 text-right">GST %</th>
                    <th className="py-3 px-3 text-right">Net Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, idx) => {
                      const rate = Number(item.unitPrice || item.unitRate || item.amount || 0);
                      const qty = item.quantity || 1;
                      const lineTotal = rate * qty;
                      const lineDisc = item.discount || 0;
                      const lineTaxable = Math.max(0, lineTotal - lineDisc);
                      const net = Number(item.total || item.amount || lineTaxable);
                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">
                              {item.testName || "Laboratory Diagnostic Investigation"}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              {item.testCode && <span className="font-mono font-semibold">Code: {item.testCode}</span>}
                              {item.department && <span>• Dept: {item.department}</span>}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                            {item.hsnSacCode || "999312"}
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold text-slate-800">
                            {qty}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700 font-mono">
                            {formatCurrency(rate)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                            {lineDisc > 0 ? `-${formatCurrency(lineDisc)}` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-800 font-mono">
                            {formatCurrency(lineTaxable)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 font-mono text-[11px]">
                            18%
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-indigo-950 font-mono">
                            {formatCurrency(net)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="py-2.5 px-3 text-center text-slate-500">1</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">
                          Diagnostic Laboratory Service Profile
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Comprehensive Clinical Pathology, Biochemistry & Automated Hematology
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                        999312
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-800">
                        1
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700 font-mono">
                        {formatCurrency(invoice.subtotal || grandTotal)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                        {invoice.discount ? `-${formatCurrency(invoice.discount)}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-800 font-mono">
                        {formatCurrency(invoice.taxableAmount || (invoice.subtotal || grandTotal) - (invoice.discount || 0))}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 font-mono text-[11px]">
                        18%
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-indigo-950 font-mono">
                        {formatCurrency(grandTotal)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 5. GST TAX ANALYSIS BREAKDOWN TABLE & FINANCIAL SUMMARY */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 items-start">
              {/* GST Tax Analysis Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    Statutory GST Analysis (SAC 999312)
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Healthcare Services
                  </span>
                </div>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-600 font-semibold border-b border-slate-200">
                      <th className="py-2 px-3">Tax Component</th>
                      <th className="py-2 px-3 text-center">Rate</th>
                      <th className="py-2 px-3 text-right">Tax Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    <tr>
                      <td className="py-2 px-3 text-slate-700">CGST (Central Goods & Services Tax)</td>
                      <td className="py-2 px-3 text-center font-mono font-semibold">9.00%</td>
                      <td className="py-2 px-3 text-right font-mono font-medium">
                        {formatCurrency(invoice.cgstAmount || (invoice.totalTax ? invoice.totalTax / 2 : 0))}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-700">SGST (State Goods & Services Tax)</td>
                      <td className="py-2 px-3 text-center font-mono font-semibold">9.00%</td>
                      <td className="py-2 px-3 text-right font-mono font-medium">
                        {formatCurrency(invoice.sgstAmount || (invoice.totalTax ? invoice.totalTax / 2 : 0))}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/90 font-bold border-t border-slate-200">
                      <td className="py-2.5 px-3 text-indigo-950">Total Output GST Collected</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-900">18.00%</td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-950 text-xs">
                        {formatCurrency(invoice.totalTax || (Number(invoice.cgstAmount || 0) + Number(invoice.sgstAmount || 0)))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Box */}
              <div className="rounded-xl border border-slate-300 p-4 bg-slate-50/80 shadow-xs">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Investigation Tariff:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatCurrency(invoice.subtotal || grandTotal)}
                    </span>
                  </div>

                  {invoice.discount !== undefined && invoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Tariff Concession / Discount:</span>
                      <span className="font-mono font-semibold">
                        -{formatCurrency(invoice.discount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Net Taxable Assessment Value:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatCurrency(
                        invoice.taxableAmount ||
                          (invoice.subtotal || grandTotal) - (invoice.discount || 0)
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Total Applicable GST (18%):</span>
                    <span className="font-mono font-semibold text-slate-800">
                      +{formatCurrency(
                        invoice.totalTax ||
                          (Number(invoice.cgstAmount || 0) + Number(invoice.sgstAmount || 0))
                      )}
                    </span>
                  </div>

                  {/* Grand Net Total */}
                  <div className="border-t-2 border-indigo-950 pt-2.5 mt-2 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                        GRAND TOTAL (NET BILL)
                      </span>
                      <p className="text-[10px] text-slate-500">
                        (Inclusive of all statutory taxes)
                      </p>
                    </div>
                    <span className="text-2xl font-black font-mono text-indigo-950">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>

                  {/* Amount In Words */}
                  <div className="pt-2 border-t border-slate-200 text-[11px] italic text-slate-700 bg-slate-50/60 p-2 rounded-lg mt-1">
                    <span className="font-bold not-italic text-indigo-950">
                      Amount in words:
                    </span>{" "}
                    {numberToWordsINR(grandTotal)}
                  </div>
                </div>
              </div>
            </div>

            {/* 6. PAYMENT AUDIT, BANK DETAILS & UPI QR */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 text-xs">
              {/* Payment Audit */}
              <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/70">
                <div className="text-[10px] font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>Payment Settlement</span>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                    isPaid
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}>
                    {isPaid ? "✓ FULLY PAID" : "PARTIAL / DUE"}
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span className="font-bold text-slate-800">{invoice.paymentMode || "CASH COUNTER"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-black text-emerald-700 font-mono">{formatCurrency(paidAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Balance Due:</span>
                    <span className={`font-black font-mono ${pendingAmount > 0 ? "text-red-600" : "text-slate-800"}`}>
                      {formatCurrency(pendingAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction / UTR Ref:</span>
                    <span className="font-mono text-slate-700 truncate max-w-[50%]">{invoice.transactionId || "TXN-DIRECT"}</span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/70">
                <div className="text-[10px] font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1.5 flex items-center gap-1">
                  <Building className="h-3 w-3 text-blue-600" />
                  Bank Remittance (NEFT/RTGS)
                </div>
                <div className="space-y-1 text-[11px] text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bank:</span>
                    <span className="font-semibold">{lab.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">A/C Name:</span>
                    <span className="font-semibold truncate max-w-[55%]">{lab.accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">A/C Number:</span>
                    <span className="font-mono font-bold text-slate-900">{lab.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IFSC Code:</span>
                    <span className="font-mono font-bold text-slate-900">{lab.ifscCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">UPI VPA:</span>
                    <span className="font-mono font-bold text-blue-700">{lab.upiId}</span>
                  </div>
                </div>
              </div>

              {/* UPI QR Card */}
              <div className="rounded-xl border border-slate-200 p-3 flex flex-col items-center justify-center text-center shadow-xs bg-slate-50/70">
                {upiQrUrl ? (
                  <img
                    src={upiQrUrl}
                    alt="Bharat UPI Payment QR"
                    className="w-24 h-24 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs object-contain"
                  />
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center bg-slate-100 rounded-xl text-[10px] text-slate-500">
                    Loading QR...
                  </div>
                )}
                <div className="mt-2 text-[10px] font-bold text-slate-900">
                  {pendingAmount > 0
                    ? `Scan & Pay Balance ₹${pendingAmount.toFixed(0)}`
                    : "Instant UPI Settlement"}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5 font-medium">
                  GPay • PhonePe • Paytm • BHIM
                </div>
              </div>
            </div>

            {/* 7. DUAL MEDICAL & ADMINISTRATIVE SIGNATORIES WITH VERIFICATION */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t-2 border-slate-200 items-end text-center text-xs">
              {/* Left: Cryptographic Security QR & Verification */}
              <div className="flex items-center gap-3 text-left">
                {verifyQrUrl && (
                  <img
                    src={verifyQrUrl}
                    alt="Verify QR"
                    className="w-16 h-16 rounded border border-slate-200 p-0.5 bg-white shrink-0"
                  />
                )}
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-800">
                    Verify Authenticity
                  </div>
                   <div className="text-[10px] text-slate-500">
                     Invoice record
                   </div>
                   {verificationUrl && <div className="text-[10px] font-mono text-indigo-800 font-bold break-all">{verificationUrl}</div>}
                  <div className="text-[9px] font-mono text-slate-500">
                    Hash: {verifyCode}
                  </div>
                </div>
              </div>

              {/* Center: Consultant Pathologist Signature */}
              <div className="flex flex-col items-center">
                <div className="h-10 flex items-center justify-center italic text-indigo-950 font-serif text-xl tracking-widest font-bold">
                   {invoice.verifiedBy || "Authorized signatory"}
                </div>
                <div className="w-40 border-t border-slate-400 mt-1 mb-1"></div>
                <div className="text-[11px] font-bold text-slate-900">
                   {invoice.verifierQualification || "Invoice approval record"}
                </div>
                <div className="text-[10px] text-slate-500">
                   {invoice.verifierRegNo ? `Registration: ${invoice.verifierRegNo}` : ""}
                </div>
              </div>

              {/* Right: Authorized Corporate Signatory */}
              <div className="flex flex-col items-center sm:items-end">
                <div className="h-10 flex items-center justify-center font-serif text-slate-700 text-sm italic font-semibold">
                   Authorized representative
                </div>
                <div className="w-40 border-t border-slate-400 mt-1 mb-1"></div>
                <div className="text-[11px] font-bold text-slate-900">
                  Authorized Signatory
                </div>
                <div className="text-[10px] text-slate-500">
                  For {lab.name}
                </div>
              </div>
            </div>

            {/* 8. LEGAL JURISDICTION & HEALTHCARE STATUTORY CLAUSE */}
            <div className="relative z-10 mt-6 pt-3 border-t border-slate-200 text-[10px] text-slate-500 text-center space-y-1">
              <p>
                 <b>Billing terms:</b> This invoice reflects the services and payment information recorded in the system. Please contact the billing desk for corrections, refunds or tax-document queries.
              </p>
              <p className="text-[9px] text-slate-400 font-medium">
                 This document is generated electronically from the invoice register.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
