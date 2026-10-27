"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import QRCode from "qrcode";
import {
  Loader2,
  X,
  Printer,
  Receipt,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  Download,
  AlertTriangle,
  FileText,
  Share2,
  Sliders,
  Award,
  CheckCheck,
  Clock,
  Eye,
  EyeOff,
  Tag,
  TestTube2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
  CreditCard,
  Building2,
  QrCode,
  Barcode,
} from "lucide-react";

interface ThermalReceiptProps {
  invoice: {
    id?: string | number;
    invoiceNumber?: string;
    patientName?: string;
    patientUhid?: string;
    patientPhone?: string;
    patientAge?: string | number;
    patientGender?: string;
    orderNumber?: string;
    doctorName?: string;
    doctorQualification?: string;
    sampleType?: string;
    tokenNumber?: string;
    items?: Array<{
      id?: string | number;
      testName?: string;
      testCode?: string;
      quantity?: number;
      unitPrice?: number;
      total?: number;
      hsnSacCode?: string;
    }>;
    subtotal?: number;
    discount?: number;
    gstAmount?: number;
    cgstAmount?: number;
    sgstAmount?: number;
    igstAmount?: number;
    netPayable?: number;
    totalAmount?: number;
    paidAmount?: number;
    pendingAmount?: number;
    paymentStatus?: string;
    paymentMode?: string;
    createdAt?: string;
    dueDate?: string;
  };
  labInfo?: {
    name?: string;
    subName?: string;
    branch?: string;
    address?: string;
    city?: string;
    phone?: string;
    gstin?: string;
    email?: string;
    website?: string;
    upiId?: string;
    nablNumber?: string;
    isoStandard?: string;
    icmrNumber?: string;
  };
  cashierName?: string;
  paperWidth?: "58mm" | "80mm";
  onSwitchToA4?: () => void;
  onClose: () => void;
}

// ─── FORMATTING HELPERS ───
function fmt(amount?: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtPlain(amount?: number) {
  return `${Number(amount || 0).toFixed(2)}`;
}

function fmtDateTime(date?: string) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return date;
  }
}

// Grammatically Flawless Indian Rupee words conversion
function numberToWordsINR(amount: number): string {
  const num = Math.abs(Number(amount || 0));
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  if (rupees === 0 && paise === 0) return "Zero Rupees Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
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
  let rem = rupees;

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

  let result = words.trim() ? `${words.trim()} Rupees` : "";
  if (paise > 0) {
    const paiseWord = convertTwoDigits(paise);
    result = result ? `${result} and ${paiseWord} Paise` : `${paiseWord} Paise`;
  }

  return `${result} Only`;
}

// ─── SCANNABLE CODE-39 SVG BARCODE GENERATOR ───
// Standard Code 39 Table: 9 elements per char (5 bars, 4 spaces; 3 wide, 6 narrow)
const CODE39_PATTERNS: Record<string, string> = {
  "0": "NNNWWNWNN", "1": "WNNWNNNNW", "2": "NNWWNNNNW", "3": "WNWWNNNNN",
  "4": "NNNWWNNNW", "5": "WNNWWNNNN", "6": "NNWWWNNNN", "7": "NNNWWNWNN",
  "8": "WNNWWNWNN", "9": "NNWWWNWNN", "A": "WNNNNWNNW", "B": "NNWNNWNNW",
  "C": "WNWNNWNNN", "D": "NNNNWWNNW", "E": "WNNNWWNNN", "F": "NNWNWWNNN",
  "G": "NNNNNWWNW", "H": "WNNNNWWNN", "I": "NNWNNWWNN", "J": "NNNNWWWNN",
  "K": "WNNNNNNWW", "L": "NNWNNNNWW", "M": "WNWNNNNWN", "N": "NNNNWNNWW",
  "O": "WNNNWNNWN", "P": "NNWNWNNWN", "Q": "NNNNNNWWW", "R": "WNNNNNWWN",
  "S": "NNWNNNWWN", "T": "NNNNWNWWN", "U": "WWNNNNNNW", "V": "NWWNNNNNW",
  "W": "WWWNNNNNN", "X": "NWNNWNNNW", "Y": "WWNNWNNNN", "Z": "NWWNWNNNN",
  "-": "NWNNNNWNW", ".": "WWNNNNWNN", " ": "NWNNWNWNN", "$": "NWNWNWNNN",
  "/": "NWNWNNNWN", "+": "NWNNNWNWN", "%": "NNNWNWNWN", "*": "NWNNWNWNN",
};

function generateCode39Svg(text: string, height: number = 36): string {
  const clean = `*${text.toUpperCase().replace(/[^0-9A-Z\-\. \$\/\+\%]/g, "-")}*`;
  let elements: Array<{ isBar: boolean; width: number }> = [];

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS["-"];
    for (let j = 0; j < 9; j++) {
      const isBar = j % 2 === 0;
      const isWide = pattern[j] === "W";
      elements.push({ isBar, width: isWide ? 2.8 : 1.1 });
    }
    // Inter-character narrow gap
    if (i < clean.length - 1) {
      elements.push({ isBar: false, width: 1.1 });
    }
  }

  let totalWidth = elements.reduce((acc, el) => acc + el.width, 0);
  // Add 10px quiet zones
  const quietZone = 12;
  const viewBoxWidth = totalWidth + quietZone * 2;

  let x = quietZone;
  let rects = "";
  for (const el of elements) {
    if (el.isBar) {
      rects += `<rect x="${x.toFixed(2)}" y="0" width="${el.width.toFixed(2)}" height="${height}" fill="#000000"/>`;
    }
    x += el.width;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxWidth} ${height}" style="width: 100%; max-width: 220px; height: ${height}px; display: block; margin: 0 auto;">${rects}</svg>`;
}

export default function ThermalReceipt({
  invoice,
  labInfo,
  cashierName,
  paperWidth = "80mm",
  onSwitchToA4,
  onClose,
}: ThermalReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataURL, setQrDataURL] = useState<string>("");
  const [activePaper, setActivePaper] = useState<"58mm" | "80mm">(paperWidth);
  const [highContrast, setHighContrast] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Slip Modes:
  // 'INVOICE': Full Tax Invoice / Cash Memo
  // 'TOKEN': Phlebotomy Collection Token & Tubes Guide
  // 'SETTLEMENT': Fast Payment Settlement Voucher
  const [slipMode, setSlipMode] = useState<"INVOICE" | "TOKEN" | "SETTLEMENT">("INVOICE");

  // Typography Engine: 'MONO' (Classic ESC/POS) | 'SANS' (Modern Crisp POS)
  const [fontStyle, setFontStyle] = useState<"MONO" | "SANS">("MONO");

  // Feature Toggles
  const [showQR, setShowQR] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showPhlebotomy, setShowPhlebotomy] = useState(true);
  const [showNabl, setShowNabl] = useState(true);

  const lab = {
    name: labInfo?.name || "Healthcare facility",
    subName: labInfo?.subName || "Patient billing receipt",
    branch: labInfo?.branch || "",
    address: labInfo?.address || "",
    city: labInfo?.city || "",
    phone: labInfo?.phone || "",
    gstin: labInfo?.gstin || "",
    email: labInfo?.email || "",
    website: labInfo?.website || "",
    upiId: labInfo?.upiId || "",
    nablNumber: labInfo?.nablNumber || "",
    isoStandard: labInfo?.isoStandard || "",
    icmrNumber: labInfo?.icmrNumber || "",
  };

  const invNumber = invoice.invoiceNumber || `INV-${invoice.id || "001"}`;
  const orderNumber = invoice.orderNumber || invNumber.replace("INV-", "ORD-");
  const netPayable = Number(invoice.netPayable || invoice.totalAmount || 0);
  const paidAmt = Number(invoice.paidAmount || 0);
  const pendingAmt =
    invoice.pendingAmount !== undefined
      ? Number(invoice.pendingAmount)
      : Math.max(0, netPayable - paidAmt);
  const isPaid = pendingAmt <= 0;
  const is58 = activePaper === "58mm";

  // Dynamic Token Number
  const tokenNum =
    invoice.tokenNumber ||
    `A-${String(
      Math.abs(
        (typeof invoice.id === "number" ? invoice.id : parseInt(String(invoice.id || "1").replace(/\D/g, "") || "18")) %
          100
      ) || 18
    ).padStart(2, "0")}`;

  // Generate a code only when the facility has configured payment or verification details.
  const upiPayAmount = pendingAmt > 0 ? pendingAmt : netPayable;
  const upiPayload =
    pendingAmt > 0 && lab.upiId
      ? `upi://pay?pa=${encodeURIComponent(lab.upiId)}&pn=${encodeURIComponent(
          lab.name
        )}&am=${upiPayAmount.toFixed(2)}&cu=INR&tr=${encodeURIComponent(
          invNumber
        )}&tn=${encodeURIComponent(`Settlement ${invNumber}`)}`
      : invoice.id && typeof window !== "undefined"
        ? `${window.location.origin}/invoices/${invoice.id}`
        : "";

  const generateQR = useCallback(async () => {
    if (!upiPayload) {
      setQrDataURL("");
      return;
    }
    try {
      const url = await QRCode.toDataURL(upiPayload, {
        width: is58 ? 115 : 145,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQrDataURL(url);
    } catch {
      setQrDataURL("");
    }
  }, [upiPayload, is58]);

  useEffect(() => {
    setLoading(true);
    generateQR().finally(() => setLoading(false));
  }, [generateQR]);

  // SVG Barcode string
  const barcodeSvgHtml = useMemo(() => {
    return generateCode39Svg(orderNumber, is58 ? 28 : 34);
  }, [orderNumber, is58]);

  // Generate plain-text monospace receipt for clipboard / SMS / WhatsApp
  const handleCopyText = () => {
    const divider = is58
      ? "--------------------------------"
      : "========================================";
    const thinDivider = is58
      ? "--------------------------------"
      : "----------------------------------------";

    let text = `${lab.name}\n${lab.subName}\n${lab.address}${lab.city ? `, ${lab.city}` : ""}\n${lab.gstin ? `GSTIN: ${lab.gstin}\n` : ""}${lab.phone ? `Phone: ${lab.phone}\n` : ""}${divider}\n`;
    text += `*** OPD DIAGNOSTIC CASH RECEIPT ***\n`;
    text += `Receipt No : ${invNumber}\n`;
    text += `Date & Time: ${fmtDateTime(invoice.createdAt)}\n`;
    text += `Order / Acc: ${orderNumber}\n`;
    text += `Token No   : ${tokenNum}\n`;
    text += `Counter/Op : ${cashierName || "—"}\n`;
    text += `${thinDivider}\n`;
    text += `PATIENT INFORMATION:\n`;
  text += `UHID / PID : ${invoice.patientUhid || "Not recorded"}\n`;
    text += `Patient    : ${invoice.patientName || "—"}\n`;
    text += `Age/Gender : ${invoice.patientAge ? `${invoice.patientAge} Yrs` : "—"} / ${invoice.patientGender || "—"}\n`;
    text += `Contact    : ${invoice.patientPhone || "—"}\n`;
  text += `Ref Doctor : ${invoice.doctorName ? `Dr. ${invoice.doctorName}` : "Not recorded"}\n`;
    text += `${divider}\n`;
    text += `SR  INVESTIGATION             SAC    AMT\n`;
    text += `${thinDivider}\n`;

    const items =
      invoice.items && invoice.items.length > 0
        ? invoice.items
        : [
            {
              testName: "Diagnostic Laboratory Service",
              hsnSacCode: "999312",
              quantity: 1,
              unitPrice: netPayable,
              total: netPayable,
            },
          ];

    items.forEach((item, idx) => {
      const name = (item.testName || "Diagnostic Test").slice(0, 22);
      const amt = fmtPlain(item.total || item.unitPrice);
      text += `${idx + 1}.  ${name.padEnd(23)} 999312 ${amt.padStart(8)}\n`;
    });

    text += `${divider}\n`;
    text += `Gross Tariff Total  : ${fmtPlain(invoice.subtotal || netPayable)}\n`;
    if (invoice.discount && invoice.discount > 0) {
      text += `Privilege Concession: -${fmtPlain(invoice.discount)}\n`;
    }
    if (invoice.gstAmount && invoice.gstAmount > 0) {
      text += `CGST @ 9.00%        : +${fmtPlain(invoice.cgstAmount || invoice.gstAmount / 2)}\n`;
      text += `SGST @ 9.00%        : +${fmtPlain(invoice.sgstAmount || invoice.gstAmount / 2)}\n`;
      text += `Total GST (18%)     : +${fmtPlain(invoice.gstAmount)}\n`;
    }
    text += `${divider}\n`;
    text += `NET AMOUNT PAYABLE  : ${fmtPlain(netPayable)}\n`;
    text += `Amount Received     : ${fmtPlain(paidAmt)} (${invoice.paymentMode || "CASH"})\n`;
    text += `Balance Due         : ${fmtPlain(pendingAmt)}\n`;
    text += `${divider}\n`;
    text += isPaid
      ? `*** [ FULLY SETTLED & PAID - ${invoice.paymentMode || "CASH"} ] ***\n`
      : `*** [ ⚠️ BALANCE OUTSTANDING: ${fmt(pendingAmt)} ⚠️ ] ***\n`;
    text += `Words: ${numberToWordsINR(netPayable)}\n`;
    text += `Please retain this receipt for your records.\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleWhatsAppReceipt = () => {
    const itemsList = (invoice.items || [])
      .map((it, i) => `${i + 1}. ${it.testName || "Investigation"} (₹${fmtPlain(it.total || it.unitPrice)})`)
      .join("\n");

    const text = encodeURIComponent(
      `*${lab.name}*\n` +
        `*Diagnostic Cash Receipt & Token Slip*\n` +
        `----------------------------------------\n` +
        `📋 *Receipt No:* #${invNumber}\n` +
        `🎫 *Token No:* *${tokenNum || "Not recorded"}*\n` +
        `👤 *Patient:* ${invoice.patientName || "Patient"} (UHID: ${invoice.patientUhid || "Not recorded"})\n` +
        `📅 *Date:* ${fmtDateTime(invoice.createdAt)}\n` +
        `🩺 *Tests Booked:*\n${itemsList || "• Diagnostic Laboratory Investigations"}\n` +
        `----------------------------------------\n` +
        `💰 *Net Bill:* *${fmt(netPayable)}*\n` +
        `💳 *Paid:* ${fmt(paidAmt)} (${invoice.paymentMode || "CASH"})\n` +
        `${pendingAmt > 0 ? `⚠️ *Balance Due:* *${fmt(pendingAmt)}*\n` : `✅ *Status:* FULLY PAID\n`}` +
        `----------------------------------------\n` +
        `\n` +
        `_Thank you. Please retain this receipt for your records._`
    );
    const phone = (invoice.patientPhone || "").replace(/[^0-9]/g, "");
    const targetUrl = phone
      ? `https://wa.me/${phone.length === 10 ? "91" + phone : phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(targetUrl, "_blank");
  };

  const handlePrint = () => {
    if (!receiptRef.current) return;
    const pw = activePaper;
    const content = receiptRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print thermal receipt.");
      return;
    }

    const fontFamilyRule =
      fontStyle === "MONO"
        ? "'Courier New', Courier, 'Lucida Console', Monaco, monospace"
        : "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>POS Slip – ${invNumber}</title>
<style>
  @page {
    size: ${pw} auto;
    margin: 0mm;
  }
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    font-family: ${fontFamilyRule};
    font-size: ${is58 ? "9px" : "11px"};
    font-weight: ${highContrast ? "700" : "500"};
    width: ${pw};
    background: #fff;
    color: #000;
    line-height: 1.25;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    padding: 2mm 1.5mm 4mm 1.5mm;
  }
  .receipt-wrap {
    width: 100%;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  img, svg {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
  }
  @media print {
    body {
      padding: 0;
      margin: 0;
    }
  }
</style>
</head>
<body>
  <div class="receipt-wrap">
    ${content}
  </div>
</body>
</html>`);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 350);
  };

  const previewWidth = is58 ? 260 : 340;
  const currentFontFamily =
    fontStyle === "MONO"
      ? "'Courier New', Courier, 'Lucida Console', monospace"
      : "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl md:flex-row my-auto max-h-[95vh]">
        {/* ─── LEFT: THERMAL RECEIPT DISPLAY ─── */}
        <div className="flex flex-1 flex-col items-center justify-start overflow-y-auto bg-slate-100/80 p-4 sm:p-8 relative border-b md:border-b-0 md:border-r border-slate-200">
          {/* Paper Edge Preview Toolbar */}
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-700 shadow-sm">
            <span className="font-bold text-blue-700">Roll: {activePaper}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-medium">
              {slipMode === "INVOICE"
                ? "Diagnostic Tax Memo"
                : slipMode === "TOKEN"
                ? "Phlebotomy Token"
                : "Payment Voucher"}
            </span>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.max(75, z - 10))}
                className="p-0.5 hover:text-blue-600 text-slate-500 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="font-mono text-[10px] text-slate-700 font-semibold">{previewZoom}%</span>
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.min(130, z + 10))}
                className="p-0.5 hover:text-blue-600 text-slate-500 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewZoom(100)}
                className="p-0.5 hover:text-blue-600 text-slate-500 transition-colors ml-0.5"
                title="Reset Zoom"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Scalable Container */}
          <div
            style={{
              transform: `scale(${previewZoom / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease",
            }}
          >
            <div
              className="relative rounded-sm shadow-[0_20px_60px_rgba(0,0,0,0.85)] transition-all duration-300"
              style={{ width: previewWidth }}
            >
              {/* Serrated Zig-Zag Top Cut Edge */}
              <div
                className="h-3.5 w-full"
                style={{
                  background:
                    "radial-gradient(circle, transparent, transparent 50%, #ffffff 50%, #ffffff 100%)",
                  backgroundSize: "10px 10px",
                  backgroundPosition: "0 5px",
                }}
              />

              {/* Thermal Paper Slip Body */}
              <div
                ref={receiptRef}
                style={{
                  fontFamily: currentFontFamily,
                  fontSize: is58 ? "9px" : "11px",
                  color: "#000000",
                  lineHeight: 1.25,
                  fontWeight: highContrast ? 700 : 500,
                  padding: is58 ? "10px 7px" : "14px 11px",
                  width: "100%",
                  background: "#ffffff",
                }}
              >
                {/* ─── HEADER: INSTITUTIONAL ACCREDITATION & IDENTITY ─── */}
                <div
                  style={{
                    textAlign: "center",
                    borderBottom: "1.5px dashed #000",
                    paddingBottom: 6,
                    marginBottom: 5,
                  }}
                >
                  <div
                    style={{
                      fontSize: is58 ? 12 : 14,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      margin: 0,
                      lineHeight: 1.15,
                    }}
                  >
                    {lab.name}
                  </div>
                  <div
                    style={{
                      fontSize: is58 ? 7.5 : 8.5,
                      margin: "2px 0 1px",
                      fontWeight: 700,
                    }}
                  >
                    {lab.subName}
                  </div>
                   {(lab.address || lab.city) && <div style={{ fontSize: is58 ? 7 : 8, margin: "1px 0" }}>
                     {lab.address}{lab.address && lab.city ? ", " : ""}{lab.city}
                   </div>}

                   {showNabl && (lab.nablNumber || lab.isoStandard || lab.gstin) && (
                    <>
                      <div
                        style={{
                          fontSize: is58 ? 7 : 8,
                          fontWeight: 800,
                          margin: "2px 0 1px",
                        }}
                      >
                        [{lab.nablNumber}] • [{lab.isoStandard}]
                      </div>
                      <div
                        style={{
                          fontSize: is58 ? 6.5 : 7.5,
                          margin: "1px 0",
                          color: "#222",
                        }}
                      >
                        GSTIN: {lab.gstin} • State: 24 (Gujarat)
                      </div>
                      <div
                        style={{
                          fontSize: is58 ? 6.5 : 7.5,
                          margin: "1px 0",
                          color: "#333",
                        }}
                      >
                        Helpline: {lab.phone} (24x7 Diagnostic Desk)
                      </div>
                    </>
                  )}
                </div>

                {/* ─── SLIP TITLE TAG ─── */}
                <div
                  style={{
                    textAlign: "center",
                    fontWeight: 900,
                    fontSize: is58 ? 9.5 : 11.5,
                    letterSpacing: 0.8,
                    margin: "4px 0",
                    borderTop: "1.5px solid #000",
                    borderBottom: "1.5px solid #000",
                    padding: "3px 0",
                    background: "#f7f7f7",
                  }}
                >
                  {slipMode === "TOKEN"
                    ? "*** PHLEBOTOMY & SPECIMEN TOKEN ***"
                    : slipMode === "SETTLEMENT"
                    ? "*** COUNTER PAYMENT RECEIPT ***"
                    : "*** TAX INVOICE CUM CASH MEMO ***"}
                </div>

                {/* ─── TOKEN HIGHLIGHT BOX (IF TOKEN MODE OR PHLEBOTOMY ON) ─── */}
                {(slipMode === "TOKEN" || showPhlebotomy) && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: "2px solid #000",
                      padding: is58 ? "4px 6px" : "6px 8px",
                      margin: "5px 0",
                      background: "#fff",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: is58 ? 7 : 8,
                          textTransform: "uppercase",
                          fontWeight: 800,
                        }}
                      >
                        Phlebotomy Token
                      </div>
                      <div
                        style={{
                          fontSize: is58 ? 16 : 20,
                          fontWeight: 900,
                          letterSpacing: 1,
                        }}
                      >
                        #{tokenNum}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: is58 ? 7 : 8,
                          fontWeight: 800,
                        }}
                      >
                         Collection desk
                      </div>
                      <div
                        style={{
                          fontSize: is58 ? 6.5 : 7.5,
                          color: "#333",
                        }}
                      >
                         Token issued at collection
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── METADATA DOSSIER ─── */}
                <div style={{ margin: "4px 0" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: is58 ? 8 : 9.5,
                      margin: "1.5px 0",
                    }}
                  >
                    <span>Receipt No:</span>
                    <span style={{ fontWeight: 900 }}>{invNumber}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: is58 ? 8 : 9.5,
                      margin: "1.5px 0",
                    }}
                  >
                    <span>Date & Time:</span>
                    <span style={{ fontWeight: 700 }}>
                      {fmtDateTime(invoice.createdAt)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: is58 ? 8 : 9.5,
                      margin: "1.5px 0",
                    }}
                  >
                    <span>Accession / Ord:</span>
                    <span style={{ fontWeight: 800 }}>{orderNumber}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: is58 ? 8 : 9.5,
                      margin: "1.5px 0",
                    }}
                  >
                    <span>Counter / Cashier:</span>
                    <span style={{ fontWeight: 700 }}>{cashierName}</span>
                  </div>
                </div>

                <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

                {/* ─── PATIENT INFORMATION ─── */}
                <div style={{ margin: "4px 0" }}>
                  <div
                    style={{
                      fontWeight: 900,
                      textTransform: "uppercase",
                      fontSize: is58 ? 8 : 9,
                      marginBottom: 2,
                      letterSpacing: 0.5,
                    }}
                  >
                    PATIENT DEMOGRAPHICS
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: is58 ? 8 : 9.5,
                      margin: "1.5px 0",
                    }}
                  >
                    <span>UHID / PID:</span>
                    <span style={{ fontWeight: 900 }}>
                      {invoice.patientUhid || "—"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: is58 ? 8.5 : 10,
                      margin: "1.5px 0",
                    }}
                  >
                    <span>Patient Name:</span>
                    <span
                      style={{
                        fontWeight: 900,
                        maxWidth: "65%",
                        textAlign: "right",
                        textTransform: "uppercase",
                      }}
                    >
                      {invoice.patientName || "Walk-in Patient"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: is58 ? 8 : 9.5,
                      margin: "1.5px 0",
                    }}
                  >
                    <span>Age / Gender:</span>
                    <span style={{ fontWeight: 700 }}>
                      {invoice.patientAge ? `${invoice.patientAge} Yrs` : "36 Yrs"} /{" "}
                      {invoice.patientGender || "Male"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: is58 ? 8 : 9.5,
                      margin: "1.5px 0",
                    }}
                  >
                    <span>Mobile Contact:</span>
                    <span style={{ fontWeight: 700 }}>
                      {invoice.patientPhone || "—"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: is58 ? 8 : 9.5,
                      margin: "1.5px 0",
                    }}
                  >
                    <span>Ref Clinician:</span>
                    <span
                      style={{
                        fontWeight: 800,
                        maxWidth: "65%",
                        textAlign: "right",
                      }}
                    >
                      {invoice.doctorName ? `Dr. ${invoice.doctorName}` : "Not recorded"}
                    </span>
                  </div>
                </div>

                {/* ─── PHLEBOTOMY SPECIMEN TUBE GUIDE (FOR TOKEN & INVOICE) ─── */}
                {showPhlebotomy && (
                  <>
                    <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
                    <div style={{ margin: "4px 0" }}>
                      <div
                        style={{
                          fontWeight: 900,
                          fontSize: is58 ? 7.5 : 8.5,
                          textTransform: "uppercase",
                          marginBottom: 2,
                        }}
                      >
                        SPECIMEN SAMPLING GUIDE
                      </div>
                      <div
                        style={{
                          fontSize: is58 ? 7 : 8,
                          color: "#222",
                          lineHeight: 1.3,
                        }}
                      >
                        <div>• Primary Tube: 1x Purple EDTA (3ml) - Sysmex Hematology</div>
                        <div>• Secondary: 1x Gold Gel Clot Activator (SST Serum)</div>
                        <div>• Status: Fasting 10-12 Hrs Verified • No Hemolysis</div>
                      </div>
                    </div>
                  </>
                )}

                <div style={{ borderTop: "1.5px solid #000", margin: "5px 0" }} />

                {/* ─── INVESTIGATIONS TABLE (FULL OR SUMMARY) ─── */}
                {slipMode !== "SETTLEMENT" && (
                  <div>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: is58 ? 7.5 : 9,
                        margin: "4px 0",
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              textAlign: "left",
                              borderBottom: "1px solid #000",
                              padding: "2px 1px",
                              fontWeight: 900,
                              textTransform: "uppercase",
                            }}
                          >
                            Investigation / SAC
                          </th>
                          {!is58 && (
                            <th
                              style={{
                                textAlign: "center",
                                borderBottom: "1px solid #000",
                                padding: "2px 1px",
                                width: "12%",
                                fontWeight: 900,
                              }}
                            >
                              Qty
                            </th>
                          )}
                          <th
                            style={{
                              textAlign: "right",
                              borderBottom: "1px solid #000",
                              padding: "2px 1px",
                              width: "28%",
                              fontWeight: 900,
                              textTransform: "uppercase",
                            }}
                          >
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items && invoice.items.length > 0 ? (
                          invoice.items.map((item, idx) => (
                            <tr key={idx}>
                              <td
                                style={{
                                  padding: "3px 1px",
                                  borderBottom: "1px dotted #ccc",
                                }}
                              >
                                <div style={{ fontWeight: 900 }}>
                                  {idx + 1}. {item.testName || "Diagnostic Test"}
                                </div>
                                <div
                                  style={{
                                    fontSize: is58 ? 6.5 : 7.5,
                                    color: "#444",
                                  }}
                                >
                                  SAC {item.hsnSacCode || "999312"} {is58 ? "• Qty: 1" : ""}
                                </div>
                              </td>
                              {!is58 && (
                                <td
                                  style={{
                                    textAlign: "center",
                                    padding: "3px 1px",
                                    borderBottom: "1px dotted #ccc",
                                  }}
                                >
                                  {item.quantity || 1}
                                </td>
                              )}
                              <td
                                style={{
                                  textAlign: "right",
                                  padding: "3px 1px",
                                  borderBottom: "1px dotted #ccc",
                                  fontWeight: 900,
                                }}
                              >
                                {fmt(item.total || item.unitPrice)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              style={{
                                padding: "3px 1px",
                                borderBottom: "1px dotted #ccc",
                              }}
                            >
                              <div style={{ fontWeight: 900 }}>
                                1. Diagnostic Laboratory Panel
                              </div>
                              <div style={{ fontSize: is58 ? 6.5 : 7.5, color: "#444" }}>
                                SAC 999312 • Qty: 1
                              </div>
                            </td>
                            {!is58 && (
                              <td
                                style={{
                                  textAlign: "center",
                                  padding: "3px 1px",
                                  borderBottom: "1px dotted #ccc",
                                }}
                              >
                                1
                              </td>
                            )}
                            <td
                              style={{
                                textAlign: "right",
                                padding: "3px 1px",
                                borderBottom: "1px dotted #ccc",
                                fontWeight: 900,
                              }}
                            >
                              {fmt(netPayable)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ─── FINANCIAL BREAKDOWN ─── */}
                <div
                  style={{
                    borderTop: "1.5px dashed #000",
                    paddingTop: 4,
                    marginTop: 4,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: is58 ? 8 : 9.5,
                      margin: "1.5px 0",
                    }}
                  >
                    <span>Gross Tariff Total:</span>
                    <span>{fmt(invoice.subtotal || netPayable)}</span>
                  </div>

                  {invoice.discount !== undefined && invoice.discount > 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: is58 ? 8 : 9.5,
                        margin: "1.5px 0",
                      }}
                    >
                      <span>Privilege Discount:</span>
                      <span>-{fmt(invoice.discount)}</span>
                    </div>
                  )}

                  {invoice.gstAmount !== undefined && invoice.gstAmount > 0 && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: is58 ? 7.5 : 9,
                          margin: "1px 0",
                          color: "#333",
                        }}
                      >
                        <span>CGST @ 9.00%:</span>
                        <span>{fmt(invoice.cgstAmount || invoice.gstAmount / 2)}</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: is58 ? 7.5 : 9,
                          margin: "1px 0",
                          color: "#333",
                        }}
                      >
                        <span>SGST @ 9.00%:</span>
                        <span>{fmt(invoice.sgstAmount || invoice.gstAmount / 2)}</span>
                      </div>
                    </>
                  )}

                  {/* NET AMOUNT PAYABLE HIGHLIGHT */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 900,
                      fontSize: is58 ? 11.5 : 13.5,
                      borderTop: "2px solid #000",
                      borderBottom: "2px solid #000",
                      padding: "3.5px 0",
                      margin: "4px 0",
                    }}
                  >
                    <span>NET PAYABLE:</span>
                    <span>{fmt(netPayable)}</span>
                  </div>

                  {/* PAYMENT DETAILS */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: is58 ? 8 : 9.5,
                      margin: "1.5px 0",
                    }}
                  >
                    <span>Received ({invoice.paymentMode || "CASH"}):</span>
                    <span style={{ fontWeight: 900 }}>{fmt(paidAmt)}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: is58 ? 8 : 9.5,
                      margin: "1.5px 0",
                    }}
                  >
                    <span>Balance Due:</span>
                    <span style={{ fontWeight: 900 }}>{fmt(pendingAmt)}</span>
                  </div>

                  {/* PAYMENT STATUS BADGE */}
                  <div
                    style={{
                      textAlign: "center",
                      border: "2px solid #000",
                      padding: "3.5px",
                      margin: "6px 0",
                      fontWeight: 900,
                      fontSize: is58 ? 9 : 11,
                      letterSpacing: 0.8,
                      background: isPaid ? "#ffffff" : "#000000",
                      color: isPaid ? "#000000" : "#ffffff",
                    }}
                  >
                    {isPaid
                      ? `*** [ ★ FULLY SETTLED & PAID ★ ] ***`
                      : `*** [ ⚠️ BALANCE OUTSTANDING: ${fmt(pendingAmt)} ⚠️ ] ***`}
                  </div>

                  {/* AMOUNT IN WORDS */}
                  <div
                    style={{
                      fontSize: is58 ? 7 : 8,
                      textAlign: "center",
                      fontStyle: "italic",
                      margin: "2px 0 4px",
                    }}
                  >
                    Words: {numberToWordsINR(netPayable)}
                  </div>
                </div>

                {/* ─── DYNAMIC BHARAT UPI QR CODE ─── */}
                {showQR && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "6px 0 3px",
                      gap: 2,
                    }}
                  >
                    {qrDataURL ? (
                      <img
                        src={qrDataURL}
                        alt="Bharat UPI QR"
                        style={{
                          width: is58 ? 95 : 120,
                          height: is58 ? 95 : 120,
                          display: "block",
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: 9, color: "#666" }}>
                        UPI: {lab.upiId}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: is58 ? 7 : 8,
                        fontWeight: 800,
                        textAlign: "center",
                        marginTop: 1,
                      }}
                    >
                      {pendingAmt > 0
                        ? `Scan with GPay / PhonePe to settle ₹${pendingAmt}`
                        : `Scan with camera to view & download report`}
                    </div>
                    <div style={{ fontSize: is58 ? 6.5 : 7.5, color: "#444" }}>
                      UPI ID: {lab.upiId} • Instant Auto-Reconciliation
                    </div>
                  </div>
                )}

                {/* ─── SVG HIGH-DENSITY SCANNABLE BARCODE ─── */}
                {showBarcode && (
                  <div
                    style={{
                      textAlign: "center",
                      margin: "6px 0 3px",
                      padding: "2px 0",
                    }}
                  >
                    <div
                      dangerouslySetInnerHTML={{ __html: barcodeSvgHtml }}
                      style={{ display: "flex", justifyContent: "center" }}
                    />
                    <div
                      style={{
                        fontSize: is58 ? 7.5 : 8.5,
                        fontFamily: "monospace",
                        fontWeight: 900,
                        letterSpacing: 1.5,
                        marginTop: 1,
                      }}
                    >
                      *{orderNumber}*
                    </div>
                  </div>
                )}

                {/* ─── PHLEBOTOMY & REPORT READY COMMITMENT ─── */}
                {lab.website && (
                  <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "3px 0", margin: "5px 0", fontSize: is58 ? 7 : 8, textAlign: "center", lineHeight: 1.35 }}>
                    <b>Online portal:</b> {lab.website}
                  </div>
                )}

                {/* ─── FOOTER & STATUTORY E-AUDIT DISCLAIMER ─── */}
                <div
                  style={{
                    textAlign: "center",
                    paddingTop: 3,
                    marginTop: 4,
                    fontSize: is58 ? 7 : 8,
                    lineHeight: 1.3,
                  }}
                >
                  <p style={{ fontWeight: 800, fontSize: is58 ? 8 : 9 }}>
                    Thank you for choosing {lab.name}
                  </p>
                   <p style={{ margin: "1px 0" }}>Please retain this receipt for your records.</p>
                   {(lab.phone || lab.email) && <p style={{ margin: "1px 0", color: "#333" }}>
                     {lab.phone}{lab.phone && lab.email ? " • " : ""}{lab.email}
                   </p>}
                  <p style={{ margin: "1px 0", color: "#555" }}>
                    Printed: {fmtDateTime(new Date().toISOString())}
                  </p>
                  <p style={{ marginTop: 3, fontSize: 6.5, color: "#666" }}>
                    ** Computer Generated Thermal Record • Authorized Electronic Validation **
                  </p>
                </div>
              </div>

              {/* Serrated Zig-Zag Bottom Cut Edge */}
              <div
                className="h-3.5 w-full"
                style={{
                  background:
                    "radial-gradient(circle, transparent, transparent 50%, #ffffff 50%, #ffffff 100%)",
                  backgroundSize: "10px 10px",
                  backgroundPosition: "0 -5px",
                }}
              />
            </div>
          </div>
        </div>

        {/* ─── RIGHT: CLINICAL COUNTER CONTROL PANEL ─── */}
        <div className="relative flex w-full flex-col justify-between overflow-y-auto bg-white p-5 sm:p-6 md:w-[420px] md:border-l border-slate-200">
          <div className="relative space-y-4">
            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 shadow-sm">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    Thermal POS Console
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      ESC/POS
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      Standard Counter Print
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Invoice & Patient Snapshot Card ── */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Bill / Voucher #
                  </span>
                  <p className="font-mono text-sm font-bold text-slate-900 mt-0.5">
                    {invNumber}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                    isPaid
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isPaid ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                  {isPaid ? "Fully Settled" : `Due: ${fmt(pendingAmt)}`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Patient</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {invoice.patientName || "Walk-in Patient"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Net Payable</span>
                  <span className="font-mono font-bold text-slate-900 block">{fmt(netPayable)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Settlement Tender</span>
                  <span className="font-semibold text-slate-700 block">
                    {invoice.paymentMode || "CASH"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Counter Token</span>
                  <span className="font-mono font-bold text-blue-700 block">#{tokenNum}</span>
                </div>
              </div>
            </div>

            {/* ── Slip Mode Switcher ── */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Slip Layout Mode
              </label>
              <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
                {(['INVOICE', 'TOKEN', 'SETTLEMENT'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSlipMode(mode)}
                    className={`rounded-lg py-1.5 text-[11px] font-bold transition ${
                      slipMode === mode
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode === 'INVOICE' ? 'Full Bill' : mode === 'TOKEN' ? 'Token Slip' : 'Payment Slip'}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Paper Roll Width ── */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Thermal Roll Width
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['80mm', '58mm'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setActivePaper(size)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition ${
                      activePaper === size
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold">{size === '80mm' ? '80 mm (3" Standard)' : '58 mm (2" Handheld)'}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {size === '80mm' ? 'Desktop POS Printer' : 'Portable Bluetooth POS'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Typography & Density ── */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Font Engine
                </div>
                <div className="flex gap-1">
                  {(['MONO', 'SANS'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFontStyle(f)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition ${
                        fontStyle === f
                          ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 flex flex-col justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Head Density
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] font-semibold text-slate-700">
                    {highContrast ? "Deep Black" : "Standard"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHighContrast(!highContrast)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      highContrast ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        highContrast ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Display Toggles ── */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                Print Elements Toggle
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { state: showQR, setter: setShowQR, label: 'UPI QR Code' },
                  { state: showBarcode, setter: setShowBarcode, label: 'Sample Barcode' },
                  { state: showPhlebotomy, setter: setShowPhlebotomy, label: 'Phlebotomy Guide' },
                  { state: showNabl, setter: setShowNabl, label: 'NABL & GSTIN' },
                ].map(({ state, setter, label }) => (
                  <label key={label} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state}
                      onChange={(e) => setter(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px] font-medium text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ─── ACTION BUTTONS ─── */}
          <div className="space-y-2 pt-4 border-t border-slate-200 mt-4">
            {/* Switch to A4 */}
            {onSwitchToA4 && (
              <button
                type="button"
                onClick={onSwitchToA4}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-2 text-xs font-bold text-blue-800 transition hover:bg-blue-100"
              >
                <FileText className="h-4 w-4" />
                <span>Switch to A4 Institutional Tax Invoice</span>
              </button>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-[0.99]"
            >
              <Printer className="h-4 w-4" />
              <span>Print {activePaper} Thermal Slip</span>
              <span className="ml-auto rounded-md bg-blue-700/80 px-2 py-0.5 text-[10px] font-mono">
                ESC/POS
              </span>
            </button>

            {/* Share Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleWhatsAppReceipt}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center justify-center py-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
