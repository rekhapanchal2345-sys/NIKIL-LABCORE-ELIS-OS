"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import {
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  X,
  Smartphone,
  FileText,
  Receipt as ReceiptIcon,
  ShieldCheck,
  ExternalLink,
  Building2,
  User,
  Phone,
  Calendar,
  CreditCard,
  Clock,
  Sparkles,
  Info,
  Mail,
  SlidersHorizontal,
  Send,
  ZoomIn,
  ZoomOut,
  Maximize2,
  BadgeCheck,
  Eye,
  EyeOff,
  ChevronDown,
  MessageSquare,
  CheckCircle2,
  Hash,
  Stethoscope,
  Activity,
  Droplet,
  Award,
  FileCheck2,
  MapPin,
  Layers,
  Globe,
  Scissors,
  Hospital,
  Shield,
  AlertCircle,
} from "lucide-react";

export type FacilityType = "HOSPITAL" | "LAB" | "CLINIC";
export type CopyMode =
  | "ORIGINAL FOR PATIENT"
  | "DUPLICATE FOR HOSPITAL / LAB"
  | "TRIPLICATE FOR TPA / INSURANCE";

export type ReceiptItem = {
  name: string;
  code?: string;
  department?: string;
  sampleType?: string;
  tubeColor?: string;
  tubeName?: string;
  sacCode?: string;
  price: number;
  discount?: number;
  taxGst?: number;
  netPrice?: number;
};

export type ReceiptPayment = {
  id: string;
  receiptNumber: string;
  orderId?: string;
  orderNumber?: string;
  patientId?: string;
  patientName: string;
  patientUhid?: string;
  patientPhone?: string | null;
  patientEmail?: string | null;
  patientAge?: number | null;
  patientGender?: string | null;
  patientAddress?: string | null;
  patientBloodGroup?: string | null;
  abhaId?: string | null;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceTotal?: number;
  invoicePaid?: number;
  invoiceBalance?: number;
  amount: number;
  method: "CASH" | "CARD" | "UPI" | "NET_BANKING" | "CHEQUE" | "OTHER";
  status:
    | "PENDING"
    | "PARTIAL"
    | "PARTIALLY_PAID"
    | "PAID"
    | "REFUNDED"
    | "FAILED"
    | "CANCELLED";
  transactionId?: string | null;
  remarks?: string | null;
  paidAt: string;
  createdAt?: string;
  collectedBy?: string;
  counter?: string;
  settlement?: string;
  terminalId?: string;
  bankRrn?: string;
  receivedBy?: {
    id: string;
    fullName: string;
    employeeCode: string;
    role?: string;
  } | null;
  doctorName?: string | null;
  doctorQualification?: string | null;
  doctorRegistrationNo?: string | null;
  branchName?: string | null;
  items?: ReceiptItem[];
  splitDetails?: Array<{
    method: string;
    amount: number;
    transactionId?: string;
  }>;
};

interface PaymentReceiptProps {
  payment: ReceiptPayment;
  onClose?: () => void;
  onOpenViewDetails?: () => void;
  initialFacilityType?: FacilityType;
}

export function formatCurrency(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: string | number) {
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return String(date || "—");
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: string | number) {
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return String(date || "—");
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function getMethodIcon(method: string) {
  switch (method) {
    case "CASH":
      return "💵";
    case "CARD":
      return "💳";
    case "UPI":
      return "📱";
    case "NET_BANKING":
      return "🏦";
    case "CHEQUE":
      return "🧾";
    default:
      return "💰";
  }
}

// Convert numbers into Indian English Words (Lakhs & Crores)
export function numberToWordsINR(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "Zero Rupees Only";
  const a = [
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
  const b = [
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

  const formatTens = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
  };

  const formatHundreds = (n: number): string => {
    if (n === 0) return "";
    let str = "";
    if (Math.floor(n / 100) > 0) {
      str += a[Math.floor(n / 100)] + " Hundred";
      if (n % 100 !== 0) str += " and ";
    }
    str += formatTens(n % 100);
    return str;
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  const crore = Math.floor(integerPart / 10000000);
  let remainder = integerPart % 10000000;
  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  const thousand = Math.floor(remainder / 1000);
  const hundred = remainder % 1000;

  let words = "";
  if (crore > 0) words += formatHundreds(crore) + " Crore ";
  if (lakh > 0) words += formatHundreds(lakh) + " Lakh ";
  if (thousand > 0) words += formatHundreds(thousand) + " Thousand ";
  if (hundred > 0) words += formatHundreds(hundred) + " ";

  words = words.trim();
  if (!words) words = "Zero";

  let result = words + " Rupees";
  if (decimalPart > 0) {
    result += " and " + formatHundreds(decimalPart) + " Paise";
  }
  return result + " Only";
}

// Deterministic crisp SVG barcode generator
function BarcodeSvg({ value, height = 30 }: { value: string; height?: number }) {
  const bars = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    const widths: number[] = [];
    let state = Math.abs(hash) || 1234567;
    for (let i = 0; i < 36; i++) {
      state = (state * 1664525 + 1013904223) % 4294967296;
      widths.push((state % 3) + 1);
    }
    return widths;
  }, [value]);

  return (
    <div className="flex flex-col items-center select-none print:scale-95">
      <div
        className="flex items-center gap-[1.5px] bg-white px-1 py-0.5 rounded border border-slate-200/80"
        style={{ height }}
      >
        {bars.map((w, i) => (
          <span
            key={i}
            className="bg-slate-900 h-full inline-block"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>
      <span className="text-[8.5px] font-mono tracking-widest text-slate-600 font-semibold mt-0.5">
        *{value.toUpperCase()}*
      </span>
    </div>
  );
}

// Official Medical Facility Vector Crest Logo (Hospital, Diagnostic Lab, Clinic)
function MedicalFacilityLogo({
  facilityType = "HOSPITAL",
  className = "w-12 h-12 shrink-0",
  size = 48,
}: {
  facilityType?: FacilityType;
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        maxWidth: `${size}px`,
        maxHeight: `${size}px`,
      }}
      className={className}
    >
      <defs>
        {/* Heraldic Shield Gradients */}
        <linearGradient id="shieldGrad" x1="4" y1="4" x2="68" y2="68" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0a2540" />
          <stop offset="0.55" stopColor="#0f2d52" />
          <stop offset="1" stopColor="#0d416b" />
        </linearGradient>
        <linearGradient id="goldAccent" x1="10" y1="10" x2="62" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="medicalTealGrad" x1="16" y1="16" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#059669" />
          <stop offset="0.6" stopColor="#0d9488" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="crossGrad" x1="22" y1="22" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#f0fdfa" />
        </linearGradient>
      </defs>

      {/* Main Heraldic Hospital / Clinical Shield */}
      <path
        d="M36 4L64 14V36C64 52 52 64 36 68C20 64 8 52 8 36V14L36 4Z"
        fill="url(#shieldGrad)"
        stroke="#38bdf8"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />

      {/* Inner Thin Border */}
      <path
        d="M36 8L60 16.5V36C60 49.5 50 59.5 36 63.5C22 59.5 12 49.5 12 36V16.5L36 8Z"
        stroke="#ffffff"
        strokeOpacity="0.18"
        strokeWidth="1"
      />

      {/* Concentric Clinical Orbital Orbit */}
      <circle cx="36" cy="35" r="21" stroke="#38bdf8" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="3 3" />

      {/* Pristine Medical Cross Symbol */}
      <path
        d="M31 20H41V29H50V39H41V48H31V39H22V29H31V20Z"
        fill="url(#crossGrad)"
        filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))"
      />

      {/* Center Medical Emblem specific to facility */}
      {facilityType === "HOSPITAL" && (
        <>
          {/* Rod of Asclepius & Medical Laurel */}
          <path
            d="M36 18V50"
            stroke="#0a2540"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M31 26C36 24 37 30 35 34C33 38 41 40 36 46"
            stroke="#059669"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="36" cy="18" r="2.5" fill="#f59e0b" />
        </>
      )}

      {facilityType === "LAB" && (
        <>
          {/* Stylized DNA Molecular Strands & Diagnostic Core */}
          <path
            d="M26 26C29 29 43 41 46 44M46 26C43 29 29 41 26 44"
            stroke="url(#medicalTealGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <circle cx="36" cy="35" r="4.5" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="26" cy="26" r="2.5" fill="#38bdf8" />
          <circle cx="46" cy="44" r="2.5" fill="#38bdf8" />
          <circle cx="46" cy="26" r="2.5" fill="#34d399" />
          <circle cx="26" cy="44" r="2.5" fill="#34d399" />
        </>
      )}

      {facilityType === "CLINIC" && (
        <>
          {/* Clinical Stethoscope & Care Pulse */}
          <path
            d="M28 27V36C28 40.5 31.5 44 36 44C40.5 44 44 40.5 44 36V27"
            stroke="#0d9488"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M36 44V49"
            stroke="#0d9488"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="36" cy="50" r="3" fill="#0a2540" stroke="#ffffff" strokeWidth="1.2" />
          <circle cx="28" cy="26" r="2" fill="#0284c7" />
          <circle cx="44" cy="26" r="2" fill="#0284c7" />
        </>
      )}

      {/* Base Accent Star */}
      <circle cx="36" cy="60" r="2" fill="#38bdf8" />
    </svg>
  );
}

// Facility Preset Configurations for Hospital, Diagnostic Lab, Clinic
export const FACILITY_PRESETS: Record<
  FacilityType,
  {
    orgName: string;
    orgSubtitle: string;
    tagline: string;
    badgeTitle: string;
    accreditations: string[];
    gstin: string;
    ceaReg: string;
    cin: string;
    address: string;
    emergencyContact: string;
    landline: string;
    email: string;
    website: string;
    signatoryRole: string;
    signatoryName: string;
    signatoryQualifications: string;
    signatoryReg: string;
    documentHeading: string;
    colorTheme: {
      primary: string;
      accent: string;
      lightAccent: string;
    };
  }
> = {
  HOSPITAL: {
    orgName: "LabCore Multi-Specialty Hospital & Research Institute",
    orgSubtitle: "Department of Laboratory Medicine, Molecular Pathology & Hospital Diagnostics",
    tagline: "NABH Accredited Tertiary Care Hospital • 24x7 Critical Care, Trauma & Diagnostics",
    badgeTitle: "Hospital Tax Invoice & Money Receipt",
    accreditations: [
      "NABH ACCREDITED HOSPITAL",
      "NABL ISO 15189:2022 (MC-2849)",
      "ICMR APPROVED",
      "ABDM / ABHA ENABLED",
    ],
    gstin: "24AABCL8891C1Z4",
    ceaReg: "CEA/KA/BLR/9812",
    cin: "U85110KA2021PTC148920",
    address: "14/A, Healthcare Innovation Boulevard, Indiranagar, Bengaluru, Karnataka - 560038",
    emergencyContact: "1800-419-5222",
    landline: "+91 80 4910 5000",
    email: "billing@labcore.org",
    website: "https://labcore-elis.cloud",
    signatoryRole: "Medical Superintendent & Director of Medicine",
    signatoryName: "Dr. Rajesh Vora",
    signatoryQualifications: "MD (Med), FICP, FCCP • Chief Medical Officer",
    signatoryReg: "MCI Reg: MCI-48291 • KMC-2018-842",
    documentHeading: "OFFICIAL HOSPITAL TAX INVOICE & CASH RECEIPT",
    colorTheme: {
      primary: "#0a2540",
      accent: "#0284c7",
      lightAccent: "#f0f9ff",
    },
  },
  LAB: {
    orgName: "LabCore Advanced Diagnostics & Reference Laboratories",
    orgSubtitle: "Center for Molecular Pathology, Genomics & High-Throughput Diagnostic Medicine",
    tagline: "NABL Accredited Medical Testing Laboratory • MC-2849 • ISO 15189:2022 Standards",
    badgeTitle: "Clinical Diagnostic Cash Receipt",
    accreditations: [
      "NABL ISO 15189:2022 (MC-2849)",
      "ICMR APPROVED REFERENCE LAB",
      "CAP PROFICIENCY TESTED",
      "EQAS BIO-RAD CERTIFIED",
    ],
    gstin: "24AABCL8891C1Z4",
    ceaReg: "CEA/KA/BLR/9812",
    cin: "U85110KA2021PTC148920",
    address: "Diagnostic Reference Tower, 8th Main, Indiranagar, Bengaluru, Karnataka - 560038",
    emergencyContact: "1800-419-5222",
    landline: "+91 80 4910 5022",
    email: "reports@labcore.org",
    website: "https://labcore-elis.cloud",
    signatoryRole: "Chief Pathologist & Laboratory Director",
    signatoryName: "Dr. Rajesh Vora",
    signatoryQualifications: "MD (Pathology) • Senior Consultant Pathologist",
    signatoryReg: "MCI Reg: MCI-48291 • Reg No: 58291-KMC",
    documentHeading: "CLINICAL TAX INVOICE & CASH RECEIPT",
    colorTheme: {
      primary: "#0a2540",
      accent: "#059669",
      lightAccent: "#ecfdf5",
    },
  },
  CLINIC: {
    orgName: "LabCore Specialty Polyclinic & Family Healthcare",
    orgSubtitle: "Comprehensive Outpatient Specialist Clinics, Day Care & Preventive Diagnostics",
    tagline: "Registered Clinical Establishment • Dedicated Daycare & Preventive Health Checkups",
    badgeTitle: "Clinic Consultation & Investigation Receipt",
    accreditations: [
      "CLINICAL ESTABLISHMENT ACT",
      "ISO 9001:2015 CERTIFIED",
      "ABHA DIGITAL HEALTH MISSION",
      "QUALITY ACCREDITED CLINIC",
    ],
    gstin: "24AABCL8891C1Z4",
    ceaReg: "CLN/KA/BLR/9412",
    cin: "U85110KA2021PTC148920",
    address: "Suite 102, Metro Clinical Plaza, CMH Road, Indiranagar, Bengaluru - 560038",
    emergencyContact: "1800-419-5222",
    landline: "+91 80 4910 5050",
    email: "clinic@labcore.org",
    website: "https://labcore-elis.cloud",
    signatoryRole: "Consultant Physician & Medical Lead",
    signatoryName: "Dr. Arvind Sharma",
    signatoryQualifications: "MBBS, MD (Internal Medicine) • Consultant Physician",
    signatoryReg: "KMC Reg: 73921 • IMA-2019-382",
    documentHeading: "CLINIC CONSULTATION & DIAGNOSTIC RECEIPT",
    colorTheme: {
      primary: "#0a2540",
      accent: "#0d9488",
      lightAccent: "#f0fdfa",
    },
  },
};

export default function PaymentReceipt({
  payment,
  onClose,
  onOpenViewDetails,
  initialFacilityType = "HOSPITAL",
}: PaymentReceiptProps) {
  const [activeFormat, setActiveFormat] = useState<
    "A4" | "THERMAL" | "WHATSAPP" | "EMAIL" | "SMS"
  >("A4");
  const [facilityType, setFacilityType] = useState<FacilityType>(initialFacilityType);
  const [copyMode, setCopyMode] = useState<CopyMode>("ORIGINAL FOR PATIENT");
  const [thermalWidth, setThermalWidth] = useState<"80mm" | "58mm">("80mm");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [upiQrCodeDataUrl, setUpiQrCodeDataUrl] = useState<string>("");
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Customization Toggles for A4 Print
  const [showItemRates, setShowItemRates] = useState(true);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(true);
  const [showWatermarkStamp, setShowWatermarkStamp] = useState(true);
  const [showBarcodes, setShowBarcodes] = useState(true);
  const [showAmountInWords, setShowAmountInWords] = useState(true);
  const [showClinicalNotes, setShowClinicalNotes] = useState(true);
  const [showSecurityBackground, setShowSecurityBackground] = useState(true);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Email state
  const [recipientEmail, setRecipientEmail] = useState(
    payment.patientEmail || "patient@example.com"
  );
  const [emailSubject, setEmailSubject] = useState(
    `LabCore Receipt #${payment.receiptNumber} - Payment Confirmation`
  );
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // Thermal Cut Animation simulation
  const [isSimulatingCut, setIsSimulatingCut] = useState(false);

  const a4Ref = useRef<HTMLDivElement>(null);
  const thermalRef = useRef<HTMLDivElement>(null);

  // Selected Facility Config
  const facility = FACILITY_PRESETS[facilityType];

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fallback / default items if not provided by backend
  const displayItems: ReceiptItem[] =
    payment.items && payment.items.length > 0
      ? payment.items
      : [
          {
            name: "Complete Blood Count (CBC) with 5-Part Differential & Absolute Counts",
            code: "HEM-01",
            department: "Hematology & Clinical Pathology",
            sampleType: "Whole Blood EDTA",
            tubeColor: "#8b5cf6",
            tubeName: "Lavender EDTA Tube",
            sacCode: "999312",
            price: payment.amount >= 1500 ? 550 : payment.amount,
            discount: 0,
            taxGst: 0,
            netPrice: payment.amount >= 1500 ? 550 : payment.amount,
          },
          ...(payment.amount > 600
            ? [
                {
                  name: "HbA1c (Glycosylated Hemoglobin) by HPLC Automated Gold Standard",
                  code: "BIO-04",
                  department: "Clinical Biochemistry & Metabolic Diagnostics",
                  sampleType: "Whole Blood EDTA / Fluoride",
                  tubeColor: "#64748b",
                  tubeName: "Grey Fluoride Tube",
                  sacCode: "999312",
                  price: Math.min(650, Math.max(0, payment.amount - 550)),
                  discount: 0,
                  taxGst: 0,
                  netPrice: Math.min(650, Math.max(0, payment.amount - 550)),
                },
              ]
            : []),
          ...(payment.amount > 1400
            ? [
                {
                  name: "Comprehensive Lipid Profile with Cardiac Risk Ratios (Total, HDL, LDL, VLDL)",
                  code: "BIO-08",
                  department: "Clinical Biochemistry",
                  sampleType: "Serum Gel SST",
                  tubeColor: "#eab308",
                  tubeName: "Gold SST Tube",
                  sacCode: "999312",
                  price: Math.max(0, payment.amount - 1200),
                  discount: 0,
                  taxGst: 0,
                  netPrice: Math.max(0, payment.amount - 1200),
                },
              ]
            : []),
        ];

  const cashierName =
    payment.receivedBy?.fullName || payment.collectedBy || "Jaya Ashapurama";
  const cashierCode = payment.receivedBy?.employeeCode || "EMP-104";
  const counterName = payment.counter || "Counter 01 (Billing Desk)";
  const doctorReferral = payment.doctorName || "Self / Direct Walk-in";
  const doctorReg = payment.doctorRegistrationNo || "MCI-48291";

  // Financial Balance Integrity
  const invoiceTotal = payment.invoiceTotal || payment.amount;
  const isPaidInFull =
    payment.status === "PAID" ||
    payment.amount >= invoiceTotal ||
    (payment.invoicePaid !== undefined && payment.invoicePaid >= invoiceTotal);

  let balanceDue = 0;
  if (!isPaidInFull) {
    if (typeof payment.invoiceBalance === "number" && payment.invoiceBalance >= 0) {
      balanceDue = payment.invoiceBalance;
    } else {
      balanceDue = Math.max(0, invoiceTotal - payment.amount);
    }
  }

  // Generate Verification QR and Dynamic UPI QR
  useEffect(() => {
    let isMounted = true;

    const generateQRs = async () => {
      try {
        // Verification QR (Audit traceability)
        const verifyData = `https://labcore-elis.cloud/verify-receipt?rec=${encodeURIComponent(
          payment.receiptNumber
        )}&tx=${encodeURIComponent(payment.transactionId || payment.id)}&amt=${payment.amount}&fac=${facilityType}`;
        const verifyUrl = await QRCode.toDataURL(verifyData, {
          width: 140,
          margin: 1,
          color: { dark: "#0a2540", light: "#ffffff" },
        });

        // UPI Payment QR
        const upiPayAmount = balanceDue > 0 ? balanceDue : payment.amount;
        const upiPayString = `upi://pay?pa=labcore@icici&pn=${encodeURIComponent(
          facility.orgName
        )}&am=${upiPayAmount}&cu=INR&tn=REC-${encodeURIComponent(
          payment.receiptNumber
        )}`;
        const upiUrl = await QRCode.toDataURL(upiPayString, {
          width: 160,
          margin: 1,
          color: { dark: "#0a2540", light: "#ffffff" },
        });

        if (isMounted) {
          setQrCodeDataUrl(verifyUrl);
          setUpiQrCodeDataUrl(upiUrl);
        }
      } catch (err) {
        console.error("Error generating receipt QR codes:", err);
      }
    };

    generateQRs();
    return () => {
      isMounted = false;
    };
  }, [payment, balanceDue, facilityType, facility.orgName]);

  // Copy receipt summary text
  const handleCopyText = async () => {
    const summaryText = `*${facility.orgName}*
*${facility.documentHeading} (${copyMode})*
----------------------------------------
Receipt No: ${payment.receiptNumber}
Date & Time: ${formatDateTime(payment.paidAt)}
Patient Name: ${payment.patientName}
UHID: ${payment.patientUhid || "UHID-N/A"}
Age / Sex: ${payment.patientAge || "—"} Yrs / ${payment.patientGender || "—"}
Order No: ${payment.orderNumber || "ORD-N/A"}
Invoice No: ${payment.invoiceNumber || "INV-N/A"}
Amount Paid: ${formatCurrency(payment.amount)} (${numberToWordsINR(payment.amount)})
Balance Due: ${balanceDue > 0 ? formatCurrency(balanceDue) : "PAID IN FULL (ZERO DUES)"}
Payment Mode: ${payment.method}
Status: ${payment.status}
Cashier: ${cashierName} (${counterName})
Ref Doctor: ${doctorReferral}
Facility: ${facility.orgName}
Helpline: ${facility.emergencyContact}
----------------------------------------
Track Online & Download Certified Reports: https://labcore-elis.cloud/verify-receipt?rec=${payment.receiptNumber}`;

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert("Receipt text copied to clipboard!");
    }
  };

  // Copy share link
  const handleCopyLink = async () => {
    const link = `https://labcore-elis.cloud/verify-receipt?rec=${payment.receiptNumber}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      alert("Receipt link copied!");
    }
  };

  // WhatsApp Share Action
  const handleShareWhatsApp = () => {
    const rawPhone = (payment.patientPhone || "").replace(/\D/g, "");
    const phoneWithCountry =
      rawPhone.length === 10
        ? `91${rawPhone}`
        : rawPhone.length === 12
        ? rawPhone
        : "";

    const message = encodeURIComponent(
      `*Hello ${payment.patientName},*\n\nThank you for choosing *${facility.orgName}*.\nYour payment of *${formatCurrency(
        payment.amount
      )}* (${numberToWordsINR(payment.amount)}) has been successfully confirmed.\n\n📄 *Receipt No:* ${payment.receiptNumber}\n🏥 *Order No:* ${
        payment.orderNumber || "N/A"
      }\n💳 *Payment Mode:* ${payment.method}\n📅 *Date:* ${formatDateTime(payment.paidAt)}\n💰 *Balance Due:* ${
        balanceDue > 0 ? formatCurrency(balanceDue) : "₹0.00 (PAID IN FULL)"
      }\n\n🔗 *Download Official PDF Receipt & Track Reports:* \nhttps://labcore-elis.cloud/verify-receipt?rec=${
        payment.receiptNumber
      }\n\n_${facility.tagline}_`
    );

    const whatsappUrl = phoneWithCountry
      ? `https://wa.me/${phoneWithCountry}?text=${message}`
      : `https://wa.me/?text=${message}`;

    window.open(whatsappUrl, "_blank");
  };

  // Simulate Email Receipt send
  const handleSendEmail = () => {
    if (!recipientEmail) {
      alert("Please enter a valid recipient email.");
      return;
    }
    setEmailSending(true);
    setTimeout(() => {
      setEmailSending(false);
      setEmailSentSuccess(true);
      setTimeout(() => setEmailSentSuccess(false), 4000);
    }, 1200);
  };

  // Trigger Thermal Paper Cut simulation
  const handleSimulateCut = () => {
    setIsSimulatingCut(true);
    setTimeout(() => setIsSimulatingCut(false), 1500);
  };

  // Ultra-Crisp Browser Print Handler with Complete Stylesheet Injection
  const handlePrint = () => {
    const targetEl =
      activeFormat === "THERMAL" ? thermalRef.current : a4Ref.current;
    if (!targetEl) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print receipt.");
      return;
    }

    const isThermal = activeFormat === "THERMAL";
    const rollWidth = thermalWidth === "58mm" ? "58mm" : "80mm";
    const printableWidth = thermalWidth === "58mm" ? "54mm" : "76mm";

    // Grab all active stylesheets from head to ensure identical Tailwind rendering
    const headStyles = Array.from(
      document.querySelectorAll("link[rel='stylesheet'], style")
    )
      .map((el) => el.outerHTML)
      .join("\n");

    const printCss = `
      @page {
        size: ${isThermal ? `${rollWidth} auto` : "A4 portrait"};
        margin: ${isThermal ? "2mm" : "6mm 8mm"};
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff !important;
        color: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }
      .no-print {
        display: none !important;
      }
      .a4-container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 auto !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
        background: #ffffff !important;
      }
      tr {
        page-break-inside: avoid;
      }
      .break-avoid {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      ${
        isThermal
          ? `.thermal-slip { width: ${printableWidth} !important; margin: 0 auto; font-family: monospace !important; }`
          : ""
      }
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${isThermal ? "POS_Receipt" : "Clinical_A4_Receipt"}_${payment.receiptNumber}</title>
          ${headStyles}
          <style>${printCss}</style>
        </head>
        <body class="bg-white text-slate-900">
          <div class="${isThermal ? "thermal-slip" : "a4-container"}">
            ${targetEl.innerHTML}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 450);
  };

  // High-Resolution jsPDF Vector PDF Download matching the selected Facility
  const handleDownloadPDF = async () => {
    try {
      setLoadingPdf(true);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Top Navy Header Banner
      pdf.setFillColor(10, 37, 64);
      pdf.rect(0, 0, pageWidth, 38, "F");

      // Brand Logo & Facility Name
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text(facility.orgName.toUpperCase(), 14, 12);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(190, 220, 245);
      pdf.text(facility.orgSubtitle, 14, 17.5);
      pdf.text(
        `${facility.accreditations.join(" • ")}`,
        14,
        22.5
      );
      pdf.text(
        `${facility.address.slice(0, 85)}`,
        14,
        27.5
      );
      pdf.text(
        `Helpdesk: ${facility.emergencyContact} • GSTIN: ${facility.gstin} • CEA: ${facility.ceaReg}`,
        14,
        32.5
      );

      // Top Right Document Title Box
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(pageWidth - 72, 7, 58, 24, 2, 2, "F");
      pdf.setTextColor(10, 37, 64);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.text("TAX INVOICE / CASH RECEIPT", pageWidth - 43, 12.5, { align: "center" });
      pdf.setFontSize(6);
      pdf.setTextColor(71, 85, 105);
      pdf.text(copyMode.toUpperCase(), pageWidth - 43, 16.5, { align: "center" });

      pdf.setFontSize(8);
      pdf.setTextColor(10, 37, 64);
      pdf.setFont("helvetica", "bold");
      pdf.text(payment.receiptNumber, pageWidth - 43, 21.5, { align: "center" });
      pdf.setFontSize(6.5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 116, 139);
      pdf.text(formatDateTime(payment.paidAt), pageWidth - 43, 26.5, { align: "center" });

      // Demographics Section (Structured 3-column info)
      let yPos = 44;
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(14, yPos, pageWidth - 28, 28, 2, 2, "FD");

      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(10, 37, 64);
      pdf.text("PATIENT DEMOGRAPHICS", 18, yPos + 5.5);
      pdf.text("CLINICAL & REFERRAL", (pageWidth / 3) + 12, yPos + 5.5);
      pdf.text("BILLING & ENCOUNTER", ((pageWidth / 3) * 2) + 6, yPos + 5.5);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(51, 65, 85);

      // Column 1: Patient
      pdf.text(`Name: ${payment.patientName}`, 18, yPos + 11);
      pdf.text(`UHID: ${payment.patientUhid || "—"}`, 18, yPos + 16);
      pdf.text(
        `Age/Sex: ${payment.patientAge ? `${payment.patientAge} Yrs` : "—"} / ${payment.patientGender || "—"} ${
          payment.patientBloodGroup ? `(${payment.patientBloodGroup})` : ""
        }`,
        18,
        yPos + 21
      );
      pdf.text(`Phone: ${payment.patientPhone || "—"}`, 18, yPos + 25.5);

      // Column 2: Clinical
      const c2X = (pageWidth / 3) + 12;
      pdf.text(`Doctor: ${doctorReferral}`, c2X, yPos + 11);
      pdf.text(`Reg: ${doctorReg}`, c2X, yPos + 16);
      pdf.text(`Dept: ${displayItems[0]?.department?.slice(0, 22) || "Pathology"}`, c2X, yPos + 21);
      pdf.text("Status: Collected & Barcoded", c2X, yPos + 25.5);

      // Column 3: Billing
      const c3X = ((pageWidth / 3) * 2) + 6;
      pdf.text(`Order: ${payment.orderNumber || "—"}`, c3X, yPos + 11);
      pdf.text(`Invoice: ${payment.invoiceNumber || "—"}`, c3X, yPos + 16);
      pdf.text(`Mode: ${payment.method} (${payment.status})`, c3X, yPos + 21);
      pdf.text(`Cashier: ${cashierName.slice(0, 16)}`, c3X, yPos + 25.5);

      // Items Table Header
      yPos += 33;
      pdf.setFillColor(241, 245, 249);
      pdf.rect(14, yPos, pageWidth - 28, 7.5, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(30, 41, 59);

      pdf.text("#", 18, yPos + 5);
      pdf.text("Investigation / Clinical Service Description", 26, yPos + 5);
      pdf.text("SAC Code", 108, yPos + 5);
      pdf.text("Department", 130, yPos + 5);
      pdf.text("Amount (INR)", pageWidth - 18, yPos + 5, { align: "right" });

      // Items Table Rows
      yPos += 7.5;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.2);

      displayItems.forEach((item, index) => {
        if (index % 2 === 1) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(14, yPos, pageWidth - 28, 7.5, "F");
        }

        pdf.setTextColor(100, 116, 139);
        pdf.text(String(index + 1), 18, yPos + 5);

        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "bold");
        pdf.text(item.name.slice(0, 48), 26, yPos + 5);

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 116, 139);
        pdf.text(item.sacCode || "999312", 108, yPos + 5);
        pdf.text((item.department || "Pathology").slice(0, 22), 130, yPos + 5);

        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(15, 23, 42);
        pdf.text(formatCurrency(item.netPrice || item.price), pageWidth - 18, yPos + 5, {
          align: "right",
        });

        yPos += 7.5;
      });

      yPos += 5;

      // Amount in Words Banner
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(14, yPos, pageWidth - 28, 10, 1.5, 1.5, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(10, 37, 64);
      pdf.text("Amount in Words (INR):", 18, yPos + 4.5);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(51, 65, 85);
      pdf.text(numberToWordsINR(payment.amount), 18, yPos + 8);

      yPos += 14;

      // Financial Calculation Block
      const calcBoxWidth = 86;
      const calcBoxX = pageWidth - 14 - calcBoxWidth;
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(calcBoxX, yPos, calcBoxWidth, 36, 2, 2, "FD");

      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 116, 139);
      pdf.text("Order Grand Total:", calcBoxX + 6, yPos + 7.5);
      pdf.setTextColor(15, 23, 42);
      pdf.setFont("helvetica", "bold");
      pdf.text(formatCurrency(invoiceTotal), pageWidth - 20, yPos + 7.5, {
        align: "right",
      });

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 116, 139);
      pdf.text("Clinical Concession:", calcBoxX + 6, yPos + 13.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text("(-) ₹0.00", pageWidth - 20, yPos + 13.5, { align: "right" });

      pdf.text("Amount Received (This Receipt):", calcBoxX + 6, yPos + 21);
      pdf.setTextColor(16, 149, 83);
      pdf.setFont("helvetica", "bold");
      pdf.text(formatCurrency(payment.amount), pageWidth - 20, yPos + 21, {
        align: "right",
      });

      pdf.setDrawColor(203, 213, 225);
      pdf.line(calcBoxX + 6, yPos + 25, pageWidth - 20, yPos + 25);

      pdf.setFont("helvetica", "bold");
      if (balanceDue > 0) {
        pdf.setTextColor(220, 38, 38);
        pdf.text("Balance Due / Outstanding:", calcBoxX + 6, yPos + 31.5);
        pdf.text(formatCurrency(balanceDue), pageWidth - 20, yPos + 31.5, { align: "right" });
      } else {
        pdf.setTextColor(16, 149, 83);
        pdf.text("Balance Due: ZERO DUES", calcBoxX + 6, yPos + 31.5);
        pdf.text("₹0.00 (PAID IN FULL)", pageWidth - 20, yPos + 31.5, { align: "right" });
      }

      // Verification QR Code on Left
      if (qrCodeDataUrl) {
        try {
          pdf.addImage(qrCodeDataUrl, "PNG", 18, yPos, 32, 32);
          pdf.setFontSize(6.8);
          pdf.setTextColor(100, 116, 139);
          pdf.setFont("helvetica", "normal");
          pdf.text("Scan QR Code to verify clinical", 18, yPos + 35);
          pdf.text("authenticity & download digital report", 18, yPos + 38);
        } catch {
          // ignore qr image issue
        }
      }

      // Bottom Digital Signatures & Disclaimers
      yPos = pageHeight - 32;
      pdf.setDrawColor(226, 232, 240);
      pdf.line(14, yPos, pageWidth - 14, yPos);

      // Signatures
      pdf.setFontSize(7.2);
      pdf.setTextColor(10, 37, 64);
      pdf.setFont("helvetica", "bold");
      pdf.text(cashierName, 18, yPos + 5.5);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.2);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Authorized Cashier (${cashierCode})`, 18, yPos + 9.5);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.2);
      pdf.setTextColor(10, 37, 64);
      pdf.text(facility.signatoryName, pageWidth - 18, yPos + 5.5, { align: "right" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.2);
      pdf.setTextColor(100, 116, 139);
      pdf.text(facility.signatoryRole, pageWidth - 18, yPos + 9.5, { align: "right" });
      pdf.text(facility.signatoryReg, pageWidth - 18, yPos + 13, { align: "right" });

      // Statutory Disclaimer
      pdf.setFontSize(5.8);
      pdf.setTextColor(120, 130, 140);
      pdf.text(
        "Health Care Services exempt from GST vide Central Tax Notification No. 12/2017 (Rate), SAC 999312. Valid without physical signature under Section 65B of IT Act 2000.",
        14,
        yPos + 21
      );

      pdf.save(`${facilityType}_Receipt_${payment.receiptNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setLoadingPdf(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-2 sm:p-4 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[96vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══ TOP FLOATING CONTROL BAR ═══ */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/95 px-4 sm:px-6 py-2.5">
          {/* Format Tabs Switcher */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-200/80 p-1 text-xs font-semibold text-slate-700">
            <button
              type="button"
              onClick={() => setActiveFormat("A4")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                activeFormat === "A4"
                  ? "bg-white text-[#0a2540] shadow-sm font-bold ring-1 ring-slate-200"
                  : "hover:text-slate-900"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-blue-700" />
              <span>Clinical A4</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFormat("THERMAL")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                activeFormat === "THERMAL"
                  ? "bg-white text-[#0a2540] shadow-sm font-bold ring-1 ring-slate-200"
                  : "hover:text-slate-900"
              }`}
            >
              <ReceiptIcon className="h-3.5 w-3.5 text-slate-700" />
              <span>Thermal POS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFormat("WHATSAPP")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                activeFormat === "WHATSAPP"
                  ? "bg-white text-emerald-800 shadow-sm font-bold ring-1 ring-emerald-200"
                  : "hover:text-slate-900"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFormat("EMAIL")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                activeFormat === "EMAIL"
                  ? "bg-white text-blue-700 shadow-sm font-bold ring-1 ring-blue-200"
                  : "hover:text-slate-900"
              }`}
            >
              <Mail className="h-3.5 w-3.5 text-blue-600" />
              <span>Email</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFormat("SMS")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                activeFormat === "SMS"
                  ? "bg-white text-indigo-700 shadow-sm font-bold ring-1 ring-indigo-200"
                  : "hover:text-slate-900"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
              <span>SMS</span>
            </button>
          </div>

          {/* Action Tools & Facility Mode */}
          <div className="flex items-center gap-2">
            {activeFormat === "A4" && (
              /* Facility Type Preset Switcher (Hospital / Lab / Clinic) */
              <div className="hidden lg:flex items-center rounded-xl bg-slate-200/90 p-1 text-xs font-semibold">
                <span className="text-[10px] uppercase font-bold text-slate-500 px-2 tracking-wider">
                  Facility:
                </span>
                <button
                  type="button"
                  onClick={() => setFacilityType("HOSPITAL")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                    facilityType === "HOSPITAL"
                      ? "bg-white text-[#0a2540] shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Hospital Letterhead Mode"
                >
                  <Hospital className="h-3 w-3 text-blue-600" />
                  <span>Hospital</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFacilityType("LAB")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                    facilityType === "LAB"
                      ? "bg-white text-[#0a2540] shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Diagnostic Laboratory Letterhead Mode"
                >
                  <Activity className="h-3 w-3 text-emerald-600" />
                  <span>Diagnostic Lab</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFacilityType("CLINIC")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                    facilityType === "CLINIC"
                      ? "bg-white text-[#0a2540] shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Polyclinic & Healthcare Mode"
                >
                  <Stethoscope className="h-3 w-3 text-teal-600" />
                  <span>Clinic</span>
                </button>
              </div>
            )}

            {onOpenViewDetails && (
              <button
                type="button"
                onClick={onOpenViewDetails}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100 transition"
                title="Inspect transaction audit & ledger"
              >
                <Eye className="h-3.5 w-3.5 text-blue-700" />
                <span>View Details</span>
              </button>
            )}

            {activeFormat === "THERMAL" && (
              <div className="flex items-center rounded-xl bg-slate-200/80 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setThermalWidth("80mm")}
                  className={`px-2 py-1 rounded-lg ${
                    thermalWidth === "80mm"
                      ? "bg-white font-bold text-slate-900 shadow-xs"
                      : "text-slate-600"
                  }`}
                >
                  80mm
                </button>
                <button
                  type="button"
                  onClick={() => setThermalWidth("58mm")}
                  className={`px-2 py-1 rounded-lg ${
                    thermalWidth === "58mm"
                      ? "bg-white font-bold text-slate-900 shadow-xs"
                      : "text-slate-600"
                  }`}
                >
                  58mm
                </button>
              </div>
            )}

            {activeFormat === "A4" && (
              <>
                {/* A4 Zoom Controls */}
                <div className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-200/80 p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                    className="p-1 rounded-lg text-slate-700 hover:bg-white hover:shadow-xs transition"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="px-1.5 font-mono text-[11px] font-bold text-slate-700 w-9 text-center">
                    {zoomLevel}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(120, z + 10))}
                    className="p-1 rounded-lg text-slate-700 hover:bg-white hover:shadow-xs transition"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition ${
                      zoomLevel === 100
                        ? "bg-white text-blue-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Reset to 100%"
                  >
                    100%
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCustomizer(!showCustomizer)}
                  className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition ${
                    showCustomizer
                      ? "border-blue-600 bg-blue-50 text-blue-800 font-bold"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  title="Toggle receipt display fields"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-blue-700" />
                  <span className="hidden sm:inline">Customize</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50/90 px-3.5 py-1.5 text-xs font-bold text-blue-950 hover:bg-blue-100 active:scale-95 transition shadow-xs"
              title="Print A4 receipt directly"
            >
              <Printer className="h-3.5 w-3.5 text-blue-700" />
              <span>Print A4</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={loadingPdf}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0a2540] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0f2d52] disabled:opacity-50 active:scale-95 transition"
            >
              <Download className="h-3.5 w-3.5" />
              {loadingPdf ? "Generating..." : "PDF"}
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 active:scale-95 transition"
              title="Send to patient via WhatsApp"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 active:scale-95 transition"
              title="Copy receipt summary text"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:scale-95 transition"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* ═══ EXPANDABLE CUSTOMIZATION TOOLBAR ═══ */}
        {showCustomizer && activeFormat === "A4" && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-blue-50/70 border-b border-blue-100 text-xs text-slate-700 animate-in slide-in-from-top-2">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold text-[#0a2540] uppercase text-[10px] tracking-wider flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3 text-blue-700" /> Controls:
              </span>

              {/* Copy Mode Selector */}
              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold">Copy:</span>
                <select
                  value={copyMode}
                  onChange={(e) => setCopyMode(e.target.value as CopyMode)}
                  className="bg-transparent text-[11px] font-bold text-[#0a2540] outline-none cursor-pointer"
                >
                  <option value="ORIGINAL FOR PATIENT">Original (Patient Copy)</option>
                  <option value="DUPLICATE FOR HOSPITAL / LAB">Duplicate (Hospital/Lab Records)</option>
                  <option value="TRIPLICATE FOR TPA / INSURANCE">Triplicate (TPA / Insurance)</option>
                </select>
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showItemRates}
                  onChange={(e) => setShowItemRates(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>Test Item Rates</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showTaxBreakdown}
                  onChange={(e) => setShowTaxBreakdown(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>SAC & Tax Columns</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showAmountInWords}
                  onChange={(e) => setShowAmountInWords(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>Amount in Words</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showWatermarkStamp}
                  onChange={(e) => setShowWatermarkStamp(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>Revenue Seal</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBarcodes}
                  onChange={(e) => setShowBarcodes(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>Accession Barcode</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showSecurityBackground}
                  onChange={(e) => setShowSecurityBackground(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>Security Watermark</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showClinicalNotes}
                  onChange={(e) => setShowClinicalNotes(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>Statutory Policies</span>
              </label>
            </div>

            {/* Mobile facility selector inside customize */}
            <div className="flex lg:hidden items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Preset:</span>
              <button
                type="button"
                onClick={() => setFacilityType("HOSPITAL")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  facilityType === "HOSPITAL" ? "bg-[#0a2540] text-white" : "bg-slate-200"
                }`}
              >
                Hospital
              </button>
              <button
                type="button"
                onClick={() => setFacilityType("LAB")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  facilityType === "LAB" ? "bg-[#0a2540] text-white" : "bg-slate-200"
                }`}
              >
                Lab
              </button>
              <button
                type="button"
                onClick={() => setFacilityType("CLINIC")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  facilityType === "CLINIC" ? "bg-[#0a2540] text-white" : "bg-slate-200"
                }`}
              >
                Clinic
              </button>
            </div>
          </div>
        )}

        {/* ═══ SCROLLABLE RECEIPT BODY ═══ */}
        <div className="flex-1 overflow-y-auto bg-slate-100/90 p-3 sm:p-5 lg:p-7 flex justify-center items-start min-h-0">
          {/* FORMAT 1: CLINICAL A4 INVOICE */}
          {activeFormat === "A4" && (
            <div
              ref={a4Ref}
              style={{
                transform: zoomLevel === 100 ? "none" : `scale(${zoomLevel / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.2s ease",
                width: "100%",
                maxWidth: "840px",
              }}
              className="a4-container relative rounded-2xl bg-white p-5 sm:p-8 shadow-2xl border border-slate-300 text-slate-800 overflow-hidden"
            >
              {/* Subtle Security Radial Background Dot Pattern (Authentic Clinical Security Paper) */}
              {showSecurityBackground && (
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.025] select-none"
                  style={{
                    backgroundImage: `radial-gradient(#0a2540 1px, transparent 1px)`,
                    backgroundSize: "20px 20px",
                  }}
                />
              )}

              {/* Faint Center Watermark Stamp */}
              {showSecurityBackground && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] select-none">
                  <div className="rotate-[-28deg] text-center">
                    <p className="text-6xl font-black uppercase tracking-widest text-[#0a2540]">
                      {facility.orgName.split(" ")[0]} HEALTHCARE
                    </p>
                    <p className="text-xl font-bold uppercase tracking-wider text-slate-800 mt-2">
                      {facility.tagline}
                    </p>
                  </div>
                </div>
              )}

              {/* Top Accent Strip with Medical Navy -> Teal -> Cyan Gradient */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#0a2540] via-[#0d9488] to-[#0284c7] rounded-t-xl mb-3 relative z-10" />

              {/* ═══ 1. INSTITUTIONAL LETTERHEAD & MEDICAL BRAND HEADER ═══ */}
              <div className="relative z-10 flex flex-row items-center justify-between gap-4 border-b-2 border-[#0a2540] pb-3">
                {/* Left: Professional Emblem + Facility Brand + Accreditations */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] shrink-0 flex items-center justify-center">
                    <MedicalFacilityLogo
                      facilityType={facilityType}
                      size={48}
                      className="w-12 h-12 shrink-0 drop-shadow-xs"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-base sm:text-lg font-black tracking-tight text-[#0a2540] uppercase leading-tight truncate">
                      {facility.orgName}
                    </h1>
                    <p className="text-[10px] font-bold text-teal-800 tracking-wide mt-0.5 truncate">
                      {facility.orgSubtitle}
                    </p>

                    {/* Accreditations Badges Strip */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {facility.accreditations.map((badge, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-[8.5px] font-extrabold text-slate-800 ring-1 ring-slate-300/80 uppercase tracking-tight flex items-center gap-1"
                        >
                          <ShieldCheck className="h-2.5 w-2.5 text-teal-700 shrink-0" />
                          {badge}
                        </span>
                      ))}
                    </div>

                    {/* Statutory Regulatory & Contact Row */}
                    <div className="text-[9.5px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>GSTIN: <strong className="text-slate-700 font-mono">{facility.gstin}</strong></span>
                      <span>•</span>
                      <span>Reg No: <strong className="text-slate-700 font-mono">{facility.ceaReg}</strong></span>
                      <span>•</span>
                      <span>Emergency: <strong className="text-[#0a2540] font-mono">{facility.emergencyContact}</strong></span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                      {facility.address} • Web: <span className="font-mono text-blue-700">{facility.website}</span>
                    </p>
                  </div>
                </div>

                {/* Right: Tax Receipt Document Box & Barcode */}
                <div className="text-right shrink-0">
                  <div className="inline-block rounded-xl bg-slate-50 px-3 py-1.5 text-center border border-slate-300 shadow-xs">
                    <div className="text-[9.5px] font-black uppercase tracking-wider text-[#0a2540]">
                      {facility.badgeTitle}
                    </div>
                    <div className="text-[8px] font-bold text-emerald-700 uppercase tracking-tight">
                      {copyMode}
                    </div>
                  </div>

                  <div className="mt-1 text-xs sm:text-sm font-black font-mono text-[#0a2540] tracking-tight">
                    {payment.receiptNumber}
                  </div>
                  <div className="text-[9.5px] text-slate-600 font-medium mt-0.5 flex items-center justify-end gap-1">
                    <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>{formatDateTime(payment.paidAt)}</span>
                  </div>

                  {/* Accession Barcode */}
                  {showBarcodes && (
                    <div className="mt-1 flex flex-col items-end">
                      <BarcodeSvg value={payment.receiptNumber} height={24} />
                    </div>
                  )}
                </div>
              </div>

              {/* ═══ 2. CLINICAL DOSSIER & PATIENT DEMOGRAPHICS (3 Clean Structured Columns) ═══ */}
              <div className="relative z-10 mt-3 grid gap-3 rounded-xl border border-slate-200/90 bg-slate-50/75 p-3 sm:grid-cols-3 text-xs shadow-xs break-avoid">
                {/* Column 1: Patient Demographics */}
                <div className="space-y-1">
                  <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#0a2540] flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-blue-700" /> Patient Demographics
                    </span>
                    <span className="font-mono text-[#0a2540] bg-blue-100/80 px-1.5 py-0.2 rounded font-bold text-[9px]">
                      {payment.patientUhid || "UHID-N/A"}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 tracking-tight pt-0.5">
                    {payment.patientName}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-medium text-[10.5px]">
                    <span>
                      {payment.patientAge ? `${payment.patientAge} Yrs` : "—"} / {payment.patientGender || "—"}
                    </span>
                    {payment.patientBloodGroup && (
                      <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded ring-1 ring-rose-200 text-[9px] flex items-center gap-0.5">
                        <Droplet className="h-2 w-2 fill-rose-500 text-rose-500" />
                        {payment.patientBloodGroup}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-600 flex items-center gap-1 text-[10.5px]">
                    <Phone className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{payment.patientPhone || "No Phone Registered"}</span>
                  </div>
                  {payment.patientAddress && (
                    <div className="text-slate-500 text-[9.5px] truncate">
                      {payment.patientAddress}
                    </div>
                  )}
                  {payment.abhaId && (
                    <div className="text-[9.5px] text-teal-800 font-mono font-medium">
                      ABHA: {payment.abhaId}
                    </div>
                  )}
                </div>

                {/* Column 2: Clinical & Referral Information */}
                <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-3">
                  <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#0a2540] border-b border-slate-200 pb-1 flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-blue-700" /> Clinical & Referral
                  </div>
                  <div>
                    <span className="text-[9.5px] text-slate-500 block">Consultant / Referring Doctor:</span>
                    <span className="font-bold text-slate-900 block text-xs">{doctorReferral}</span>
                    <span className="text-[9.5px] text-slate-500 font-mono">Reg: {doctorReg}</span>
                  </div>
                  <div className="pt-0.5">
                    <span className="text-[9.5px] text-slate-500 block">Primary Department:</span>
                    <span className="font-semibold text-slate-800 text-[10.5px]">
                      {displayItems[0]?.department || "Clinical Pathology"}
                    </span>
                  </div>
                  <div className="text-[9.5px] text-slate-600 flex items-center gap-1">
                    <span>Accession Status:</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded ring-1 ring-emerald-200 text-[8.5px]">
                      Collected & Barcoded
                    </span>
                  </div>
                </div>

                {/* Column 3: Billing Specifications */}
                <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-3">
                  <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#0a2540] border-b border-slate-200 pb-1 flex items-center gap-1">
                    <CreditCard className="h-3 w-3 text-blue-700" /> Billing Specifications
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[10px]">Order No:</span>
                    <span className="font-mono font-bold text-slate-900 text-[10.5px]">
                      {payment.orderNumber || "ORD-N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[10px]">Invoice Ref:</span>
                    <span className="font-mono font-bold text-slate-900 text-[10.5px]">
                      {payment.invoiceNumber || "INV-N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[10px]">Txn / UTR:</span>
                    <span className="font-mono text-slate-800 truncate max-w-[120px] text-[10px]" title={payment.transactionId || payment.id}>
                      {payment.transactionId || payment.id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[10px]">Payment Mode:</span>
                    <span className="inline-flex items-center gap-1 rounded bg-slate-200/80 px-1.5 py-0.2 text-[9.5px] font-bold text-slate-800">
                      <span>{getMethodIcon(payment.method)}</span>
                      {payment.method}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[10px]">Billing Desk:</span>
                    <span className="text-slate-800 font-medium text-[10px]">
                      {cashierName} ({counterName})
                    </span>
                  </div>
                </div>
              </div>

              {/* ═══ 3. ITEMIZED INVESTIGATIONS & CLINICAL CHARGES TABLE ═══ */}
              <div className="relative z-10 mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs break-avoid">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-[9.5px] font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-200">
                      <th className="py-1.5 px-3 text-center w-8">#</th>
                      <th className="py-1.5 px-3">Diagnostic Investigation & Test Code</th>
                      {showTaxBreakdown && <th className="py-1.5 px-3 text-center w-20">SAC Code</th>}
                      <th className="py-1.5 px-3">Department & Specimen Matrix</th>
                      {showItemRates && (
                        <th className="py-1.5 px-3 text-right w-24">Standard Rate</th>
                      )}
                      <th className="py-1.5 px-3 text-right w-24">Net Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayItems.map((item, idx) => (
                      <tr
                        key={idx}
                        className={`transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-blue-50/30`}
                      >
                        <td className="py-1.5 px-3 text-center font-mono text-slate-400 font-bold text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-3">
                          <div className="font-bold text-slate-900 text-[11px]">
                            {item.name}
                          </div>
                          <div className="text-[9px] font-mono text-slate-500 flex items-center gap-1 mt-0.2">
                            <span>Code: {item.code || `LAB-${idx + 1}`}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-teal-700 font-semibold">LIS Verified</span>
                          </div>
                        </td>
                        {showTaxBreakdown && (
                          <td className="py-1.5 px-3 text-center font-mono text-slate-600 text-[10px]">
                            {item.sacCode || "999312"}
                          </td>
                        )}
                        <td className="py-1.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full ring-1 ring-black/10 shrink-0"
                              style={{ backgroundColor: item.tubeColor || "#8b5cf6" }}
                              title={item.tubeName || item.sampleType || "Specimen Matrix"}
                            />
                            <span className="font-semibold text-slate-800 text-[10px]">
                              {item.department || "Clinical Pathology"}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-500 block">
                            {item.tubeName ? `${item.tubeName} (${item.sampleType || "Blood"})` : (item.sampleType || "Whole Blood EDTA")}
                          </span>
                        </td>
                        {showItemRates && (
                          <td className="py-1.5 px-3 text-right font-mono text-slate-600 text-[11px]">
                            {formatCurrency(item.price)}
                          </td>
                        )}
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900 text-[11px]">
                          {formatCurrency(item.netPrice || item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ═══ 4. AMOUNT IN WORDS BANNER ═══ */}
              {showAmountInWords && (
                <div className="relative z-10 mt-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-1.5 text-xs text-slate-700 flex flex-wrap items-center gap-2 shadow-xs break-avoid">
                  <span className="font-black text-[#0a2540] uppercase text-[9.5px] tracking-wider shrink-0 flex items-center gap-1">
                    <Shield className="h-3 w-3 text-blue-700" /> Amount Received (in Words):
                  </span>
                  <span className="font-semibold italic text-[#0a2540] text-[11px]">
                    {numberToWordsINR(payment.amount)}
                  </span>
                </div>
              )}

              {/* ═══ 5. FINANCIAL RECONCILIATION & QR TRACEABILITY GRID ═══ */}
              <div className="relative z-10 mt-3 grid gap-3 sm:grid-cols-2 items-stretch break-avoid">
                {/* Left: Dynamic Traceability / UPI QR Code Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 flex flex-col justify-between shadow-xs">
                  <div className="flex items-start gap-2.5">
                    {qrCodeDataUrl ? (
                      <img
                        src={balanceDue > 0 && upiQrCodeDataUrl ? upiQrCodeDataUrl : qrCodeDataUrl}
                        alt="Receipt QR"
                        className="w-16 h-16 rounded-lg border border-white bg-white p-1 shadow-sm shrink-0"
                        style={{ width: "64px", height: "64px", minWidth: "64px", minHeight: "64px" }}
                      />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-lg bg-slate-200 animate-pulse shrink-0"
                        style={{ width: "64px", height: "64px", minWidth: "64px", minHeight: "64px" }}
                      />
                    )}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1 font-black text-[#0a2540] text-[11px]">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>
                          {balanceDue > 0 ? "Instant UPI Settlement QR" : "NABL Digital Traceability QR"}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-slate-600 leading-tight">
                        {balanceDue > 0
                          ? `Scan with GPay/PhonePe to clear remaining balance of ${formatCurrency(balanceDue)} immediately.`
                          : "Scan to verify clinical authenticity & download certified digital reports from LabCore Cloud."}
                      </p>
                      <div className="pt-0.5 font-mono text-[8.5px] text-slate-500">
                        Auth Token: <span className="font-bold text-slate-700">{payment.transactionId || `AUTH-${payment.id.slice(-8)}`}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-200 text-[8.5px] text-slate-500 leading-tight">
                    * Healthcare diagnostic services are exempt from Goods & Services Tax (GST) vide Central Tax Notification No. 12/2017 (Rate), SAC Code 999312.
                  </div>
                </div>

                {/* Right: Itemized Financial Reconciliation Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3 space-y-1 text-xs shadow-xs flex flex-col justify-between">
                  <div className="space-y-0.8 text-[10.5px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Order Grand Total:</span>
                      <strong className="font-mono text-slate-900 text-xs">
                        {formatCurrency(invoiceTotal)}
                      </strong>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Clinical Concession / Discount:</span>
                      <span className="font-mono text-slate-700">(-) ₹0.00</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Taxable Billable Value:</span>
                      <span className="font-mono text-slate-800">{formatCurrency(invoiceTotal)}</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>GST (CGST 0% + SGST 0% - Exempt):</span>
                      <span className="font-mono text-slate-700">₹0.00</span>
                    </div>

                    <div className="border-t border-slate-200 pt-1 flex justify-between items-center text-emerald-900 font-extrabold text-xs">
                      <span className="text-slate-800">Amount Received (This Receipt):</span>
                      <span className="font-mono text-xs sm:text-sm text-emerald-700 font-black">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-1 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 text-[10.5px]">Balance Due / Outstanding:</span>
                    {balanceDue > 0 ? (
                      <span className="font-mono font-black text-rose-600 text-xs sm:text-sm">
                        {formatCurrency(balanceDue)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-black font-mono text-emerald-800 ring-1 ring-emerald-300">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                        ₹0.00 (PAID IN FULL • ZERO DUES)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ═══ 6. OFFICIAL REVENUE WATERMARK SEAL ═══ */}
              {showWatermarkStamp && (
                <div className="relative z-10 my-3 flex items-center justify-center break-avoid">
                  <div className="relative inline-flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-600/80 bg-emerald-50/50 px-6 py-2 text-center text-emerald-950 shadow-xs rotate-[-1deg] select-none">
                    <div className="flex items-center gap-1.5 text-[10.5px] font-black tracking-widest uppercase text-emerald-950">
                      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                      {facility.orgName.toUpperCase()} • REVENUE RECOGNIZED
                    </div>
                    <div className="text-[9px] font-mono font-semibold text-emerald-800 mt-0.2">
                      NABL ACCREDITED MC-2849 • DATE: {formatDate(payment.paidAt)} • {counterName}
                    </div>
                    <div className="text-[8px] text-emerald-700 uppercase tracking-wider font-medium">
                      Electronic Audit Signature • Verified Digital Cash Receipt • Zero Dues
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ 7. AUTHORIZED SIGNATORIES BLOCK (3 Columns) ═══ */}
              <div className="relative z-10 mt-3 border-t-2 border-slate-200 pt-3 text-xs text-slate-600 break-avoid">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  {/* Signatory 1: Patient / Attendant Acknowledgement */}
                  <div className="space-y-0.5 text-center sm:text-left">
                    <div className="font-mono text-[10px] font-bold text-slate-800">
                      {payment.patientName}
                    </div>
                    <div className="h-5 flex items-center justify-center sm:justify-start">
                      <span className="font-serif italic text-[10px] text-slate-400">
                        Patient / Payer Signature
                      </span>
                    </div>
                    <div className="border-t border-slate-300 pt-0.5">
                      <div className="text-[9px] font-bold text-slate-800 uppercase tracking-wider">
                        Patient / Authorized Attendant
                      </div>
                      <div className="text-[8px] text-slate-400 font-mono">
                        UHID: {payment.patientUhid || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Signatory 2: Billing Cashier / POS Authentication */}
                  <div className="space-y-0.5 text-center">
                    <div className="font-mono text-[10px] font-bold text-slate-800">
                      {cashierName}
                    </div>
                    <div className="h-5 flex items-center justify-center">
                      <span className="font-serif italic text-[10px] text-slate-500">
                        Digitally Logged at POS Terminal
                      </span>
                    </div>
                    <div className="border-t border-slate-300 pt-0.5">
                      <div className="text-[9px] font-bold text-slate-800 uppercase tracking-wider">
                        Authorized Billing Cashier
                      </div>
                      <div className="text-[8px] text-slate-400 font-mono">
                        Emp ID: {cashierCode} • {counterName}
                      </div>
                    </div>
                  </div>

                  {/* Signatory 3: Chief Pathologist / Medical Superintendent */}
                  <div className="space-y-0.5 text-center sm:text-right">
                    <div className="font-serif italic text-xs font-bold text-[#0a2540]">
                      {facility.signatoryName}
                    </div>
                    <div className="h-5 flex items-center justify-center sm:justify-end">
                      <span className="font-serif italic text-[10px] text-emerald-700 font-medium">
                        Digitally Validated Signatory
                      </span>
                    </div>
                    <div className="border-t border-slate-300 pt-0.5">
                      <div className="text-[9px] font-bold text-slate-800 uppercase tracking-wider">
                        {facility.signatoryRole}
                      </div>
                      <div className="text-[8px] text-slate-500 font-mono">
                        {facility.signatoryReg}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═══ 8. STATUTORY CLINICAL POLICIES & TERMS ═══ */}
                {showClinicalNotes && (
                  <div className="mt-2.5 border-t border-slate-200/80 pt-2 space-y-0.5 text-[8.5px] text-slate-500 leading-tight">
                    <p>
                      • <strong>GST Exemption Notice:</strong> Health care services provided by clinical establishments are exempt from Goods & Services Tax (GST) vide Central Tax Notification No. 12/2017 (Rate), SAC Code 999312.
                    </p>
                    <p>
                      • <strong>Online Report Download:</strong> Authenticated digital reports can be tracked and downloaded at <span className="font-mono text-blue-700 font-semibold">{facility.website}</span> using Patient UHID and Receipt Number.
                    </p>
                    <p>
                      • <strong>Specimen Preservation SOP:</strong> Diagnostic specimens are preserved strictly in accordance with NABL ISO 15189:2022 standards for 48–72 hours post testing.
                    </p>
                    <p>
                      • <strong>Statutory Validity:</strong> This is a computer-generated tax invoice & electronic money receipt valid under Section 65B of Indian Evidence Act.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FORMAT 2: THERMAL POS RECEIPT */}
          {activeFormat === "THERMAL" && (
            <div className="flex flex-col items-center justify-center">
              {/* Width & Action bar for Thermal */}
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSimulateCut}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition"
                >
                  <Scissors className="h-3.5 w-3.5 text-slate-500" />
                  <span>Simulate Paper Cut</span>
                </button>
              </div>

              {/* Thermal Slip */}
              <div
                ref={thermalRef}
                style={{
                  width: thermalWidth === "58mm" ? "260px" : "340px",
                  transition: "all 0.3s ease",
                }}
                className={`relative rounded-lg bg-white p-4 shadow-2xl border border-slate-300 font-mono text-xs text-slate-900 ${
                  isSimulatingCut ? "translate-y-2 opacity-90" : ""
                }`}
              >
                {/* Thermal Header */}
                <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-3">
                  <div className="font-black text-sm tracking-tight">
                    {facility.orgName.toUpperCase()}
                  </div>
                  <div className="text-[10px] leading-tight text-slate-600">
                    {facility.tagline}
                    <br />
                    Helpline: {facility.emergencyContact}
                  </div>
                  <div className="pt-1 text-[11px] font-bold">
                    ** PAYMENT RECEIPT **
                  </div>
                </div>

                {/* Info Block */}
                <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Receipt:</span>
                    <span className="font-bold">{payment.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{formatDateTime(payment.paidAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Patient:</span>
                    <span className="font-bold truncate max-w-[170px]">
                      {payment.patientName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>UHID:</span>
                    <span>{payment.patientUhid || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order #:</span>
                    <span>{payment.orderNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{cashierName}</span>
                  </div>
                </div>

                {/* Items Mini Table */}
                <div className="py-2 border-b border-dashed border-slate-400">
                  <div className="flex justify-between font-bold text-[10px] pb-1">
                    <span>ITEM / TEST</span>
                    <span>AMOUNT</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    {displayItems.map((item, i) => (
                      <div key={i} className="flex justify-between items-start gap-2">
                        <span className="truncate max-w-[190px]">
                          {i + 1}. {item.name}
                        </span>
                        <span className="font-bold shrink-0">
                          {formatCurrency(item.netPrice || item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(invoiceTotal)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-emerald-800">
                    <span>PAID ({payment.method}):</span>
                    <span>{formatCurrency(payment.amount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[11px]">
                    <span>Balance Due:</span>
                    <span>{balanceDue > 0 ? formatCurrency(balanceDue) : "₹0.00 (PAID)"}</span>
                  </div>
                </div>

                {/* QR Code in Thermal */}
                <div className="py-3 flex flex-col items-center justify-center text-center">
                  {upiQrCodeDataUrl && (
                    <img
                      src={balanceDue > 0 ? upiQrCodeDataUrl : qrCodeDataUrl}
                      alt="QR"
                      className="h-24 w-24 p-1"
                    />
                  )}
                  <span className="text-[9px] text-slate-500 mt-1">
                    {balanceDue > 0 ? "Scan to Pay Balance" : "Scan to Download Report"}
                  </span>
                </div>

                {/* Barcode in Thermal */}
                <div className="pt-1 pb-3 flex flex-col items-center">
                  <BarcodeSvg value={payment.receiptNumber} height={26} />
                </div>

                {/* Thermal Footer */}
                <div className="text-center text-[10px] text-slate-500 space-y-1 border-t border-dashed border-slate-400 pt-2">
                  <p>*** THANK YOU ***</p>
                  <p>For inquiries: {facility.email}</p>
                  <p>Reports: {facility.website}</p>
                  <div className="pt-2 text-[9px] text-slate-400">
                    - - - - - - - - - - - - - - - ✂ - - - - - - - - - - - - - - -
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FORMAT 3: WHATSAPP SHARE PREVIEW & SENDER */}
          {activeFormat === "WHATSAPP" && (
            <div className="flex justify-center">
              <div className="w-full max-w-md rounded-3xl bg-slate-100 p-3.5 shadow-xl border-4 border-slate-300">
                {/* Smartphone Screen Mockup */}
                <div className="rounded-2xl bg-[#0b141a] p-3 text-white">
                  {/* WhatsApp Top Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
                        LC
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1">
                          <span>{facility.orgName.slice(0, 24)}...</span>
                          <BadgeCheck className="h-3 w-3 text-emerald-400" />
                        </div>
                        <div className="text-[10px] text-emerald-400">
                          Official Business Account
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400">9:41 AM</div>
                  </div>

                  {/* WhatsApp Message Bubble */}
                  <div className="mt-3 rounded-2xl rounded-tl-none bg-[#202c33] p-3.5 text-xs text-slate-200 space-y-2 shadow-md">
                    <p>
                      Hello <strong>{payment.patientName}</strong>, 👋
                    </p>
                    <p>
                      Your payment of{" "}
                      <strong className="text-emerald-400 font-bold">
                        {formatCurrency(payment.amount)}
                      </strong>{" "}
                      has been confirmed at <strong>{facility.orgName}</strong>.
                    </p>

                    <div className="rounded-xl bg-[#111b21] p-2.5 border border-white/5 space-y-1 font-mono text-[11px]">
                      <div>📄 Receipt No: {payment.receiptNumber}</div>
                      <div>🏥 Order No: {payment.orderNumber || "ORD-N/A"}</div>
                      <div>💳 Payment Mode: {payment.method}</div>
                      <div>
                        💰 Balance:{" "}
                        <span className={balanceDue > 0 ? "text-amber-400" : "text-emerald-400"}>
                          {balanceDue > 0 ? formatCurrency(balanceDue) : "₹0.00 (PAID)"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-emerald-950/50 border border-emerald-800/40 p-2.5 text-[11px] text-emerald-300">
                      <strong>🔗 Download Official Tax Receipt & Reports:</strong>
                      <div className="truncate text-emerald-400 underline font-medium">
                        https://labcore-elis.cloud/verify-receipt?rec={payment.receiptNumber}
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-slate-400 flex items-center justify-end gap-1">
                      <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="text-blue-400 font-bold">✓✓</span>
                    </div>
                  </div>

                  {/* Direct Actions */}
                  <div className="mt-4 space-y-2">
                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 active:scale-95 transition"
                    >
                      <Share2 className="h-4 w-4" />
                      Send to Patient WhatsApp ({payment.patientPhone || "Now"})
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 transition"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      Copy Formatted Message Text
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FORMAT 4: EMAIL RECEIPT DISPATCH */}
          {activeFormat === "EMAIL" && (
            <div className="flex justify-center">
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Email Official Tax Receipt</h3>
                    <p className="text-[11px] text-slate-500">
                      Dispatches high-resolution PDF and verified download credentials
                    </p>
                  </div>
                </div>

                {emailSentSuccess && (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Official Tax Receipt successfully emailed to <strong>{recipientEmail}</strong>!</span>
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Recipient Email Address
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600 space-y-1.5">
                    <div className="font-bold text-slate-800">Dispatch Package Components:</div>
                    <p>• High-Resolution Vector PDF: <code>{facilityType}_Receipt_{payment.receiptNumber}.pdf</code></p>
                    <p>• Verified Patient UHID: <code>{payment.patientUhid || "UHID-N/A"}</code></p>
                    <p>• Live Online Report Tracking & NABL Verification Link</p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={emailSending}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-600 disabled:opacity-50 transition active:scale-95"
                  >
                    {emailSending ? (
                      <>
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Dispatching PDF...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Send Receipt Email
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy URL
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FORMAT 5: SMS TRANSACTIONAL ALERT PREVIEW */}
          {activeFormat === "SMS" && (
            <div className="flex justify-center">
              <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Transactional SMS Alert</h3>
                    <p className="text-[11px] text-slate-500">
                      TRAI DLT compliant billing notification template
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 font-mono text-xs text-slate-800 space-y-2">
                  <div className="flex justify-between text-[10px] text-indigo-900 font-bold uppercase">
                    <span>Sender: VK-LABCOR</span>
                    <span>DLT Header Approved</span>
                  </div>
                  <p className="leading-relaxed">
                    Dear {payment.patientName}, received {formatCurrency(payment.amount)} for Order {payment.orderNumber || "ORD-N/A"} via {payment.method}. Receipt: {payment.receiptNumber}. View receipt & test updates at: https://labcore-elis.cloud/r/{payment.receiptNumber} - {facility.orgName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 active:scale-95 transition"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy SMS Text
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}