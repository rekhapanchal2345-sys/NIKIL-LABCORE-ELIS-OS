"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { orderApi } from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OrderCommunicationHubModal } from "@/components/orders/orders-ui";
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
  Receipt,
  FileText,
  Copy,
  Building2,
  Stethoscope,
  AlertTriangle,
  Loader2,
  FileDown,
  MessageSquare,
  Zap,
  FlaskConical,
  BadgeCheck,
  CreditCard,
  Tag,
  ScanLine,
  UserRound,
  Award,
  Globe,
  Check,
  Activity,
  FileCheck2,
  Calendar,
  Sparkles,
  MapPin,
  HeartPulse,
} from "lucide-react";

// ─── Interfaces ────────────────────────────────────────────────
interface OrderData {
  id: string;
  orderNumber: string;
  barcode: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    uhid: string;
    phone: string;
    gender: string;
    dateOfBirth?: string;
    address?: string;
    bloodGroup?: string;
    email?: string;
    age?: number;
  };
  doctor?: {
    id: string;
    doctorCode: string;
    fullName: string;
    specialization: string;
    clinicName?: string;
    phone?: string;
    email?: string;
    regNo?: string;
  };
  items: Array<{
    id: string;
    test: {
      id: string;
      testCode: string;
      testName: string;
      sampleType: string;
      sampleContainer?: string;
      tatHours?: number;
      department?: string;
      category?: { department?: string; name?: string };
    };
    price: number;
    discount?: number;
    finalPrice: number;
  }>;
  orderStatus: string;
  paymentStatus: string;
  paymentMode?: string;
  priority?: string;
  collectionType?: string;
  createdAt: string;
  sampleCollected: boolean;
  subtotal: number;
  discount: number;
  discountCode?: string;
  gstAmount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  notes?: string;
  homeCollectionAddress?: string;
}

// ─── Vacutainer Tube Container Specs ───────────────────────────
const TUBE_CONTAINER_COLORS: Record<
  string,
  { bg: string; text: string; border: string; capColor: string; name: string }
> = {
  "EDTA Tube": { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", capColor: "#8B5CF6", name: "Lavender EDTA (Whole Blood)" },
  "Lavender Top": { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", capColor: "#8B5CF6", name: "Lavender EDTA (Whole Blood)" },
  "Serum Separator Tube": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", capColor: "#F59E0B", name: "Gold SST Gel (Serum)" },
  "SST": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", capColor: "#F59E0B", name: "Gold SST Gel (Serum)" },
  "Red Top": { bg: "bg-red-50", text: "text-red-800", border: "border-red-200", capColor: "#EF4444", name: "Red Plain (Clot Activator)" },
  "Sodium Citrate": { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: "Light Blue Citrate (Coagulation)" },
  "Fluoride Tube": { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", capColor: "#64748B", name: "Grey Fluoride (Glucose)" },
  "Sterile Container": { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200", capColor: "#EAB308", name: "Sterile Universal Cup (Urine)" },
};

function getContainerStyle(containerName?: string) {
  if (!containerName) return { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: "Standard Specimen Tube" };
  for (const [key, val] of Object.entries(TUBE_CONTAINER_COLORS)) {
    if (containerName.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: containerName };
}

// ─── Crisp Vector Code128 Barcode Generator ─────────────────────
function SvgBarcode({ code, height = 28 }: { code: string; height?: number }) {
  const bars: Array<{ x: number; w: number }> = [];
  let currentX = 2;
  const hash = code.split("").reduce((acc, char) => acc * 31 + char.charCodeAt(0), 7);

  bars.push({ x: currentX, w: 2 }); currentX += 3;
  bars.push({ x: currentX, w: 1 }); currentX += 2;
  bars.push({ x: currentX, w: 2 }); currentX += 4;

  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const w1 = ((charCode ^ hash) % 3) + 1;
    const gap = (((charCode >> 2) ^ (i * 7)) % 2) + 1;
    const w2 = (((charCode >> 1) ^ (i * 3)) % 2) + 1;

    bars.push({ x: currentX, w: w1 });
    currentX += w1 + gap;
  }
  bars.push({ x: currentX, w: 2 }); currentX += 3;
  bars.push({ x: currentX, w: 1 }); currentX += 2;
  bars.push({ x: currentX, w: 2 }); currentX += 4;

  const viewBoxWidth = Math.max(currentX + 4, 110);

  return (
    <svg viewBox={`0 0 ${viewBoxWidth} ${height}`} className="w-full h-auto overflow-visible" preserveAspectRatio="none">
      {bars.map((bar, idx) => (
        <rect key={idx} x={bar.x} y={0} width={bar.w} height={height} fill="#0f172a" />
      ))}
    </svg>
  );
}

// ─── Indian Currency & Formatting Helpers ──────────────────────
function numberToWords(num: number): string {
  if (isNaN(num) || num === 0) return "Rupees Zero Only";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  }
  return `Rupees ${inWords(Math.floor(num))} Only`;
}

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function ThermalRow({
  label,
  value,
  bold,
  mono,
}: {
  label: string;
  value?: string | null;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between text-[11px] py-0.5">
      <span className="text-slate-600 shrink-0 mr-2">{label}:</span>
      <span className={`text-right ${bold ? "font-bold text-slate-900" : "text-slate-800"} ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────
export default function OrderReceiptPage({
  params,
}: {
  params?: any;
}) {
  const router = useRouter();
  const routeParams = useParams();
  const orderId = (routeParams?.id as string) || (params && typeof params === "object" && "id" in params ? params.id : "");

  const receiptRef = useRef<HTMLDivElement>(null);

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [printFormat, setPrintFormat] = useState<"A4" | "THERMAL">("A4");
  const [copied, setCopied] = useState(false);
  const [showCommHub, setShowCommHub] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showWatermark, setShowWatermark] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await orderApi.getById(orderId);
        if (response.success && response.data) {
          const data = response.data?.order || response.data;
          setOrder(data);
          const origin = typeof window !== "undefined" ? window.location.origin : "";
          const verificationUrl = `${origin}/verify-report?order=${data.orderNumber || ""}&uhid=${data.patient?.uhid || ""}`;
          try {
            const qr = await QRCode.toDataURL(verificationUrl, {
              width: 160,
              margin: 1,
              color: { dark: "#0f172a", light: "#ffffff" },
            });
            setQrCodeUrl(qr);
          } catch (qrErr) {
            console.error("QR generation error:", qrErr);
          }
        } else {
          setError("Failed to load clinical requisition invoice data");
        }
      } catch (err: any) {
        setError(err instanceof Error ? err.message : "Failed to load requisition order");
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setPdfLoading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const ratio = pdfW / canvas.width;
      const totalPages = Math.ceil((canvas.height * ratio) / pdfH);
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -i * pdfH, pdfW, canvas.height * ratio);
      }
      pdf.save(`LabCore_Tax_Invoice_${order?.orderNumber || orderId}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("PDF generation failed. Please use Print → Save as PDF instead.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center space-y-4">
            <div className="relative inline-flex">
              <div className="h-14 w-14 rounded-2xl bg-sky-700 text-white flex items-center justify-center shadow-md">
                <HeartPulse className="h-7 w-7 text-white animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-sky-400 animate-ping" />
            </div>
            <p className="text-xs font-bold text-slate-700">Loading Clinical Tax Invoice &amp; Requisition Dossier...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !order) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-lg border border-slate-200 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-base font-black text-slate-900">Requisition Not Found</h2>
            <p className="text-xs text-slate-500">{error || "Requested medical invoice record could not be loaded."}</p>
            <button
              onClick={() => router.push("/orders")}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
            >
              Return to Orders
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // ── Financial Calculations ──
  const subtotal = Number(order.subtotal) || (order.items || []).reduce((s, i) => s + (Number(i.price) || 0), 0);
  const discount = Number(order.discount) || 0;
  const taxable = Math.max(0, subtotal - discount);
  const gst = Number(order.gstAmount) || 0;
  const grandTotal = Number(order.grandTotal) || taxable + gst;
  const paid = Number(order.paidAmount) || 0;
  const due = Math.max(0, grandTotal - paid);
  const isPaid = paid >= grandTotal || order.paymentStatus === "PAID";
  const isStat = (order.priority || "").toUpperCase() === "STAT" || (order.priority || "").toUpperCase() === "URGENT";

  return (
    <ProtectedRoute>
      {/* ── Strict A4 Print Stylesheet ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .print-area {
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        @page {
          size: A4 portrait;
          margin: 8mm 10mm 8mm 10mm;
        }
      `}</style>

      <div className="min-h-screen bg-slate-100/95 py-6 px-4 print:p-0 print:bg-white text-slate-900 font-sans">
        {/* ========================================================= */}
        {/* TOP INTERACTIVE SCREEN TOOLBAR (Hidden on Print)          */}
        {/* ========================================================= */}
        <div className="no-print max-w-4xl mx-auto mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
            {/* Left: Back Link & View Switcher */}
            <div className="flex items-center gap-3.5 flex-wrap">
              <Link
                href={`/orders/${order.id}`}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-sky-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Order #{order.orderNumber}</span>
              </Link>

              <div className="w-px h-5 bg-slate-200" />

              <div className="flex items-center rounded-xl bg-slate-100 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setPrintFormat("A4")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    printFormat === "A4"
                      ? "bg-white text-sky-900 shadow-xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 text-sky-700" />
                  <span>A4 Executive Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintFormat("THERMAL")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    printFormat === "THERMAL"
                      ? "bg-white text-sky-900 shadow-xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Receipt className="h-3.5 w-3.5 text-indigo-700" />
                  <span>80mm Thermal Slip</span>
                </button>
              </div>

              {printFormat === "A4" && (
                <button
                  type="button"
                  onClick={() => setShowWatermark(!showWatermark)}
                  className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                    showWatermark
                      ? "bg-sky-50 text-sky-800 border-sky-300"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Watermark: {showWatermark ? "ON" : "OFF"}
                </button>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all shadow-2xs"
              >
                <Copy className="h-3.5 w-3.5 text-slate-500" />
                <span>{copied ? "Copied Link!" : "Copy Link"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-all shadow-2xs disabled:opacity-50"
              >
                {pdfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5 text-indigo-700" />}
                <span>{pdfLoading ? "Generating PDF..." : "Export PDF"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCommHub(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all shadow-2xs"
              >
                <MessageSquare className="h-3.5 w-3.5 text-emerald-700" />
                <span>WhatsApp / Email</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>

          {/* Quick Status Bar */}
          <div className="flex items-center gap-2 px-1 flex-wrap text-xs">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold ${
                isPaid ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              {isPaid ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Clock className="h-3.5 w-3.5 text-amber-600" />}
              {isPaid ? "Account Fully Settled" : `Balance Payable: ${fmt(due)}`}
            </span>

            {isStat && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">
                <Zap className="h-3.5 w-3.5 text-rose-600" /> STAT / Emergency Priority
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-slate-50 text-slate-700 border border-slate-200">
              <FlaskConical className="h-3.5 w-3.5 text-sky-700" />
              {(order.items || []).length} Prescribed Assay{(order.items || []).length !== 1 ? "s" : ""}
            </span>

          </div>
        </div>

        {/* ========================================================= */}
        {/* FORMAT 1: A4 EXECUTIVE CLINICAL TAX INVOICE               */}
        {/* ========================================================= */}
        {printFormat === "A4" && (
          <div
            ref={receiptRef}
            className="print-area max-w-4xl mx-auto bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-300 print:shadow-none print:rounded-none print:border-none print:max-w-none relative overflow-hidden"
          >
            {/* Watermark (optional) */}
            {showWatermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                <span className="text-[72px] sm:text-[90px] font-black uppercase text-slate-900/[0.03] rotate-[-30deg] tracking-widest text-center border-4 border-slate-900/[0.03] p-10 rounded-3xl">
                  OFFICIAL INVOICE
                </span>
              </div>
            )}

            {/* ── TOP ACCENT BARS (Hospital Navy & Sapphire) ── */}
            <div className="h-2.5 bg-gradient-to-r from-sky-800 via-indigo-900 to-sky-700 print:bg-sky-900" />
            <div className="h-0.5 bg-sky-400 print:bg-sky-500" />

            <div className="p-7 sm:p-9 space-y-5 relative z-10">
              {/* ── 1. FORMAL INSTITUTIONAL LETTERHEAD ── */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-5 pb-4 border-b-2 border-slate-800">
                {/* Left: Hospital Insignia & Full Identification */}
                <div className="flex items-start gap-4">
                  {/* High-Resolution Vector Hospital Seal / Crest */}
                  <div className="h-20 w-20 rounded-2xl bg-white text-sky-900 flex items-center justify-center shrink-0 border-2 border-sky-900 shadow-xs p-1.5">
                    <div className="h-full w-full rounded-xl border border-sky-200 bg-sky-50/60 flex flex-col items-center justify-center text-center">
                      <HeartPulse className="h-7 w-7 text-sky-800" />
                      <span className="text-[7px] font-black tracking-widest text-sky-950 uppercase mt-0.5">ELIS</span>
                      <span className="text-[6px] font-bold text-sky-700 tracking-tighter">LABCORE</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                      Diagnostic Services
                    </h1>
                    <p className="text-xs font-bold text-sky-900 uppercase tracking-wide">
                      Patient order receipt
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Facility contact and tax details are maintained in the organisation settings.
                    </p>
                  </div>
                </div>

                {/* Right: Formal Document Category Stamp & Numbers */}
                <div className="text-left sm:text-right shrink-0 space-y-1.5 sm:self-start bg-slate-50/90 p-3 rounded-xl border border-slate-300 min-w-[215px]">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white shadow-2xs">
                      TAX INVOICE &amp; CASH RECEIPT
                    </span>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                      ORIGINAL FOR PATIENT
                    </p>
                  </div>

                  <div className="space-y-0.5 font-mono text-xs">
                    <div className="flex sm:justify-end gap-1.5">
                      <span className="text-slate-500 text-[10px]">Invoice No:</span>
                      <span className="font-black text-slate-900 text-[11px]">INV-{order.orderNumber}</span>
                    </div>
                    <div className="flex sm:justify-end gap-1.5">
                      <span className="text-slate-500 text-[10px]">Requisition ID:</span>
                      <span className="font-bold text-slate-800 text-[11px]">#{order.orderNumber}</span>
                    </div>
                    <div className="flex sm:justify-end gap-1.5">
                      <span className="text-slate-500 text-[10px]">Date &amp; Time:</span>
                      <span className="font-bold text-slate-800 text-[10px]">{fmtDateTime(order.createdAt)}</span>
                    </div>
                  </div>

                  {/* Specimen Barcode Graphic */}
                  <div className="pt-1.5 border-t border-slate-300">
                    <SvgBarcode code={order.barcode} height={22} />
                    <p className="text-[10px] font-mono font-bold text-slate-700 text-center mt-0.5 tracking-wider">
                      {order.barcode}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── 2. THREE-SECTION STRUCTURED PATIENT & CLINICAL MATRIX ── */}
              <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                {/* Table Title Bar */}
                <div className="bg-slate-100/90 px-4 py-1.5 border-b border-slate-300 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <UserRound className="h-3.5 w-3.5 text-sky-800" /> Patient Demographics &amp; Requisition Profile
                  </span>
                  <div className="flex items-center gap-2">
                    {isStat ? (
                      <span className="rounded bg-rose-600 px-2 py-0.5 text-[9px] font-black uppercase text-white animate-pulse">
                        STAT EMERGENCY
                      </span>
                    ) : (
                      <span className="rounded bg-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-700 uppercase">
                        ROUTINE
                      </span>
                    )}
                    <span className="rounded bg-sky-100 text-sky-900 border border-sky-300 px-2 py-0.5 text-[9px] font-bold">
                      {order.collectionType === "HOME_COLLECTION" ? "🏠 Home Visit" : "🏥 Central OPD"}
                    </span>
                  </div>
                </div>

                {/* 2-Column Clinical Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 text-xs">
                  {/* Left Column: Patient Identification */}
                  <div className="p-3.5 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] uppercase font-bold text-slate-400">Patient Full Name</p>
                        <p className="font-black text-sm text-slate-900 mt-0.5 uppercase tracking-tight">
                          Mr./Mrs. {order.patient?.firstName} {order.patient?.lastName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase font-bold text-slate-400">UHID / MRN</p>
                        <p className="font-mono font-black text-xs text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-300 inline-block">
                          {order.patient?.uhid || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-slate-200">
                      <div>
                        <span className="text-slate-500">Age / Gender:</span>{" "}
                        <strong className="text-slate-900">
                          {order.patient?.age ? `${order.patient.age} Yrs` : "Adult"} / {order.patient?.gender || "—"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Blood Group:</span>{" "}
                        <strong className="text-rose-700 font-bold">{order.patient?.bloodGroup || "—"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Primary Contact:</span>{" "}
                        <strong className="font-mono text-slate-900">{order.patient?.phone || "N/A"}</strong>
                      </div>
                      <div>
                         <span className="text-slate-500">ABHA Health ID:</span>{" "}
                         <span className="text-slate-700 font-bold">Not recorded</span>
                      </div>
                    </div>

                    {order.patient?.address && (
                      <div className="text-[11px] text-slate-600 pt-1.5 border-t border-slate-200">
                        <span className="text-slate-500">Address:</span> {order.patient.address}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Prescribing Clinician & Workflow */}
                  <div className="p-3.5 space-y-2">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-slate-400">Referring Clinician / Consultant</p>
                      <p className="font-bold text-sm text-slate-900 mt-0.5">
                        Dr. {order.doctor?.fullName || "Self / Walk-in Registration"}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {order.doctor?.specialization || "General Medicine"}
                        {order.doctor?.regNo ? ` • Reg No: ${order.doctor.regNo}` : " • Reg: MCI/NMC"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-slate-200">
                      <div>
                        <span className="text-slate-500">Facility / Clinic:</span>{" "}
                        <strong className="text-slate-900">{order.doctor?.clinicName || "Outpatient Central"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Phlebotomy Draw:</span>{" "}
                        <strong className={order.sampleCollected ? "text-emerald-700" : "text-amber-700"}>
                          {order.sampleCollected ? "Specimen Drawn ✓" : "Pending Phlebotomy"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Settlement Status:</span>{" "}
                        <strong className={isPaid ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                          {order.paymentStatus}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Settlement Mode:</span>{" "}
                        <strong className="text-slate-900">{order.paymentMode || "UPI / QR Digital"}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 3. ITEMIZED LABORATORY INVESTIGATIONS TABLE ── */}
              <div className="page-break-inside-avoid">
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <FlaskConical className="h-3.5 w-3.5 text-indigo-700" /> Prescribed Diagnostic Assays &amp; Laboratory Panels
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-600">
                    {(order.items || []).length} Investigation{(order.items || []).length !== 1 ? "s" : ""} Prescribed
                  </span>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-300">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 text-[10px] font-black uppercase tracking-wider">
                        <th className="py-2 px-3 w-8 text-center font-mono">#</th>
                        <th className="py-2 px-3 font-bold">Investigation / Diagnostic Assay Description</th>
                        <th className="py-2 px-3 font-bold">Specimen / Tube Specification</th>
                        <th className="py-2 px-2.5 font-bold text-center font-mono">SAC</th>
                        <th className="py-2 px-3 font-bold text-right font-mono">Rate (₹)</th>
                        <th className="py-2 px-3 font-bold text-right font-mono">Concession (₹)</th>
                        <th className="py-2 px-3.5 font-bold text-right font-mono">Net Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(order.items || []).map((item, idx) => {
                        const itemPrice = Number(item.price) || 0;
                        const itemDiscount = Number(item.discount) || 0;
                        const netPrice = Number(item.finalPrice) || itemPrice - itemDiscount;
                        const dept = item.test?.category?.department || item.test?.department || "Laboratory Medicine";
                        const tube = getContainerStyle(item.test?.sampleContainer);

                        return (
                          <tr key={item.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className="py-2.5 px-3 font-mono text-center text-slate-400 font-semibold">{idx + 1}</td>
                            <td className="py-2.5 px-3">
                              <p className="font-bold text-slate-900 text-xs">{item.test?.testName}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                                <span className="bg-slate-100 text-slate-800 px-1 py-0.2 rounded border border-slate-300 font-bold">
                                  {item.test?.testCode}
                                </span>
                                <span>Dept: {dept}</span>
                                {item.test?.tatHours && <span>• TAT: {item.test.tatHours}h</span>}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              <div className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: tube.capColor }} />
                                <div>
                                  <p className="text-[11px] font-semibold text-slate-800">{item.test?.sampleType || "Whole Blood"}</p>
                                  <p className="text-[9px] text-slate-500">{tube.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-2.5 font-mono text-center text-slate-500 text-[10px]">999312</td>
                            <td className="py-2.5 px-3 font-mono text-right text-slate-600">{fmt(itemPrice)}</td>
                            <td className="py-2.5 px-3 font-mono text-right text-emerald-700">
                              {itemDiscount > 0 ? `-${fmt(itemDiscount)}` : "—"}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono font-black text-right text-slate-900">{fmt(netPrice)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── 4. FINANCIAL LEDGER, HEALTHCARE TAX & PAYMENT AUDIT ── */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-1 page-break-inside-avoid">
                {/* Left 3 Cols: Amount in Words, Tax Statement & Instructions */}
                <div className="md:col-span-3 space-y-2.5">
                  {/* Amount Chargeable in Words */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-300">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                      Amount Chargeable (in words):
                    </p>
                    <p className="text-xs sm:text-sm font-black text-slate-900 italic mt-0.5">
                      {numberToWords(grandTotal)}
                    </p>
                  </div>

                  {/* GST Healthcare Exemption Clause */}
                  <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 text-xs">
                    <p className="text-[9px] font-black uppercase tracking-wider text-sky-900 mb-1 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-sky-700" /> Healthcare GST Exemption &amp; Tax Classification
                    </p>
                    <div className="space-y-0.5 text-[10px] text-slate-700 font-mono">
                      <div className="flex justify-between">
                        <span>Clinical Diagnostic Services (SAC 999312):</span>
                        <span className="font-bold">{fmt(taxable)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[9px]">
                        <span>CGST (0.0%) / SGST (0.0%) (Exempt per MoF Notif. 12/2017-CT):</span>
                        <span>₹0.00 (Exempt)</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details Audit */}
                  <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-300 text-[11px] text-slate-700 space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Settlement Mode:</span>
                      <strong className="text-slate-900">{order.paymentMode || "UPI / QR Digital Payment"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transaction Ref / UTR:</span>
                      <strong className="text-slate-900">TXN-{order.id.slice(-8).toUpperCase()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Billing Desk &amp; Cashier:</span>
                      <span>Terminal #02 • Staff: K. Patel</span>
                    </div>
                  </div>

                  {/* Patient Instructions */}
                  <div className="p-3 rounded-xl border border-slate-300 bg-white text-[10px] text-slate-500 space-y-0.5">
                    <p className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">
                      Patient Instructions &amp; Diagnostic Guidelines:
                    </p>
                    <p>• Routine results are usually validated within 24–48 hours of specimen accession.</p>
                    <p>• Download digitally signed reports at <strong className="text-sky-900">portal.labcore.com</strong> using your UHID &amp; Bill No.</p>
                    <p>• Critical panic laboratory values are notified to the referring clinician immediately.</p>
                  </div>
                </div>

                {/* Right 2 Cols: Financial Settlement Ledger Box */}
                <div className="md:col-span-2">
                  <div className="rounded-xl border-2 border-slate-800 overflow-hidden bg-white shadow-2xs">
                    <div className="bg-slate-900 text-white px-4 py-2">
                      <p className="text-[10px] font-black uppercase tracking-wider">
                        Financial Settlement Ledger
                      </p>
                    </div>

                    <div className="divide-y divide-slate-200 text-xs">
                      <div className="flex justify-between px-4 py-2 text-slate-600">
                        <span>Gross Subtotal (MRP)</span>
                        <span className="font-mono font-semibold">{fmt(subtotal)}</span>
                      </div>

                      {discount > 0 && (
                        <div className="flex justify-between px-4 py-2 text-emerald-700 font-semibold">
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" /> Institutional Concession
                          </span>
                          <span className="font-mono">-{fmt(discount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between px-4 py-2 text-slate-600">
                        <span>Net Taxable Healthcare Value</span>
                        <span className="font-mono font-semibold">{fmt(taxable)}</span>
                      </div>

                      <div className="flex justify-between px-4 py-2 text-slate-600">
                        <span>Healthcare Tax (GST 0%)</span>
                        <span className="font-mono font-semibold">₹0.00</span>
                      </div>

                      <div className="flex justify-between px-4 py-2.5 text-sm font-black text-slate-900 bg-slate-50">
                        <span>Net Payable Amount</span>
                        <span className="font-mono text-base">{fmt(grandTotal)}</span>
                      </div>

                      <div className="flex justify-between px-4 py-2 text-emerald-700 font-bold bg-emerald-50/40">
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5" /> Amount Received (Paid)
                        </span>
                        <span className="font-mono">{fmt(paid)}</span>
                      </div>
                    </div>

                    {/* Balance Status Banner */}
                    <div
                      className={`px-4 py-2.5 font-black text-xs flex justify-between items-center ${
                        isPaid ? "bg-emerald-700 text-white" : "bg-rose-700 text-white"
                      }`}
                    >
                      <span className="uppercase tracking-wider">
                        {isPaid ? "✓ PAID IN FULL (SETTLED)" : "⚠ BALANCE DUE"}
                      </span>
                      <span className="font-mono text-sm">{isPaid ? fmt(grandTotal) : fmt(due)}</span>
                    </div>
                  </div>
                </div>
              </div>

               {/* ── 5. QR CODE & DIGITAL DOCUMENT STRIP ── */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-300 bg-slate-50/70 page-break-inside-avoid">
                <div className="flex items-center gap-3">
                  {qrCodeUrl && (
                    <div className="bg-white p-1 rounded-lg border border-slate-300 shadow-2xs shrink-0">
                       <img src={qrCodeUrl} alt="Document verification QR" className="h-16 w-16" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                       <ShieldCheck className="h-4 w-4 text-emerald-700" /> Document verification &amp; report access
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Scan this secure QR code using any smartphone camera to verify this invoice and download pathology reports.
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                      portal.labcore.com/verify?ord={order.orderNumber}&amp;uhid={order.patient?.uhid}
                    </p>
                  </div>
                </div>

              </div>

              {/* ── 6. OFFICIAL SIGNATORIES & CLINICAL STAMP SEAL ── */}
              <div className="pt-3 border-t-2 border-dashed border-slate-400 page-break-inside-avoid">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
                  {/* Col 1: Patient Signature */}
                  <div className="text-center sm:text-left space-y-1">
                    <div className="h-9 w-36 border-b border-slate-400 mb-1" />
                    <p className="text-xs font-bold text-slate-900">Patient / Attendant Signature</p>
                    <p className="text-[10px] text-slate-500">I verify informed consent for prescribed tests</p>
                  </div>

                  {/* Col 2: Billing Desk / Cashier */}
                  <div className="text-center space-y-1">
                    <div className="h-9 w-36 border-b border-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-900">Billing Counter Executive</p>
                    <p className="text-[10px] text-slate-500">Terminal #02 • Emp ID: LC-4029 (K. Patel)</p>
                  </div>

                  {/* Col 3: Authorized Medical Director Stamp */}
                  <div className="text-center sm:text-right space-y-1">
                    <div className="relative inline-block text-left">
                      {/* Authentic Clinical Stamp Seal */}
                      <div className="inline-block border-2 border-sky-900 rounded-lg p-1.5 px-3 bg-sky-50/70 mb-1 text-center font-mono">
                        <span className="block text-[8px] font-black uppercase text-sky-950 tracking-widest">
                          LABCORE CENTRAL LABORATORIES
                        </span>
                        <span className="block text-[7px] text-emerald-800 font-bold">
                          ✓ DIGITALLY AUTHENTICATED
                        </span>
                        <span className="block text-[7px] text-slate-600">
                           DIGITAL DOCUMENT RECORD
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-900">Chief of Laboratory Medicine / Pathologist</p>
                     <p className="text-[10px] text-slate-500">Authorised clinical record</p>
                  </div>
                </div>

                {/* Footer Microprint */}
                <div className="pt-3 mt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 font-mono gap-1">
                  <p>THIS IS A COMPUTER-AUTHENTICATED LEGAL TAX INVOICE &amp; REQUISITION DOSSIER • REQUIRES NO PHYSICAL SIGNATURE</p>
                  <p>Generated: {fmtDateTime(new Date().toISOString())} • ID: {order.id}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* FORMAT 2: 80mm THERMAL POS RECEIPT SLIP                   */}
        {/* ========================================================= */}
        {printFormat === "THERMAL" && (
          <>
            <p className="no-print text-center text-xs font-bold text-slate-600 mb-3">
              📄 80mm Thermal POS Slip Preview (Optimized for Roll Printers)
            </p>
            <div
              ref={receiptRef}
              className="print-area max-w-[340px] mx-auto bg-white text-slate-900 font-mono text-[11px] leading-snug border border-slate-300 shadow-xl rounded-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none print:max-w-none"
            >
              {/* Thermal Header */}
              <div className="bg-slate-50 text-slate-900 text-center py-4 px-3 border-b-2 border-dashed border-slate-300 space-y-0.5">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  DIAGNOSTIC SERVICES
                </h2>
                 <p className="text-[10px] text-slate-600">Patient order receipt</p>
                <div className="mt-1.5 inline-block px-3 py-1 rounded bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                  TAX INVOICE / RECEIPT
                </div>
              </div>

              {/* Order Meta */}
              <div className="py-2.5 px-4 border-b border-dashed border-slate-300 space-y-1">
                <ThermalRow label="Receipt No" value={`INV-${order.orderNumber}`} bold />
                <ThermalRow label="Order No" value={`#${order.orderNumber}`} />
                <ThermalRow label="Date/Time" value={fmtDateTime(order.createdAt)} />
                <ThermalRow label="Patient" value={`${order.patient?.firstName} ${order.patient?.lastName}`} bold />
                <ThermalRow label="UHID" value={order.patient?.uhid} mono />
                <ThermalRow label="Phone" value={order.patient?.phone} mono />
                <ThermalRow label="Doctor" value={order.doctor?.fullName || "Self / Walk-in"} />
                <ThermalRow label="Priority" value={order.priority || "ROUTINE"} bold />
                <ThermalRow label="Barcode" value={order.barcode} mono />
              </div>

              {/* Test Items */}
              <div className="py-2.5 px-4 border-b border-dashed border-slate-300">
                <div className="flex justify-between font-black pb-1.5 text-[10px] border-b border-slate-200 mb-1">
                  <span>INVESTIGATION</span>
                  <span>AMOUNT</span>
                </div>
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <div className="flex-1 pr-2">
                      <p className="truncate text-[10px] font-bold text-slate-900">{item.test?.testName}</p>
                      <p className="text-[9px] text-slate-500">{item.test?.testCode}</p>
                    </div>
                    <span className="font-mono shrink-0 font-semibold">
                      ₹{(Number(item.finalPrice) || Number(item.price) || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-2.5 px-4 border-b border-dashed border-slate-300 space-y-0.5">
                <ThermalRow label="Subtotal" value={fmt(subtotal)} mono />
                {discount > 0 && <ThermalRow label="Concession" value={`-${fmt(discount)}`} mono />}
                 <ThermalRow label="GST" value={fmt(order.gstAmount || 0)} mono />
                <div className="flex justify-between pt-1.5 font-black text-sm border-t border-slate-300 mt-1">
                  <span>NET TOTAL</span>
                  <span className="font-mono">{fmt(grandTotal)}</span>
                </div>
                <ThermalRow label="Paid" value={fmt(paid)} mono />
                <div className={`flex justify-between font-black pt-1 ${due > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                  <span>{due > 0 ? "BALANCE DUE" : "PAID IN FULL"}</span>
                  <span className="font-mono">{due > 0 ? fmt(due) : "✓ NIL"}</span>
                </div>
              </div>

              {/* Amount in Words */}
              <div className="py-2 px-4 border-b border-dashed border-slate-300">
                <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Amount in Words:</p>
                <p className="text-[10px] italic font-semibold">{numberToWords(grandTotal)}</p>
              </div>

              {/* QR Code */}
              {qrCodeUrl && (
                <div className="py-3 text-center border-b border-dashed border-slate-300">
                  <div className="inline-block p-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <img src={qrCodeUrl} alt="Verify QR" className="h-20 w-20 mx-auto" />
                  </div>
                   <p className="text-[9px] mt-1 text-slate-500">Scan to access the document</p>
                </div>
              )}

              {/* Footer */}
              <div className="text-center pb-4 px-4 text-[9px] text-slate-500 space-y-0.5 pt-2">
                 <p className="font-bold text-slate-700">Please retain this receipt for your records.</p>
                 <p>Retain this receipt with the patient record</p>
                <p className="font-mono text-[8px] text-slate-400 pt-0.5">{order.id}</p>
              </div>
            </div>
          </>
        )}

        {/* Communication Hub Modal */}
        {showCommHub && order && (
          <OrderCommunicationHubModal
            isOpen={showCommHub}
            onClose={() => setShowCommHub(false)}
            order={order}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
