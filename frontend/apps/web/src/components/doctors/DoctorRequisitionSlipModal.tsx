"use client";

import React, { useRef, useState, useEffect } from "react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  X,
  Printer,
  Download,
  FileText,
  ShieldCheck,
  Building,
  Phone,
  QrCode as QrCodeIcon,
  CheckCircle,
  Sparkles,
  Stethoscope,
  Share2,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Activity,
  AlertCircle,
  Check,
  Loader2,
  Copy,
  ExternalLink,
  Shield,
  FlaskConical,
  Microscope,
  MessageCircle,
  Key,
  Paperclip,
  Send,
  Languages,
  Eye,
  User,
  Heart,
  CreditCard,
  RefreshCw,
  Award,
} from "lucide-react";
import type { DoctorProfileData } from "./DoctorQuickViewModal";
import { communicationApi } from "@/lib/api";

// =======================================================
// CSS VARIABLES & PIXEL-PERFECT A4 PRINT STYLES
// =======================================================
const doctorRequisitionPrintStyles = `
  :root {
    --color-clinic-slate: #0F172A;
    --color-clinic-navy: #1E293B;
    --color-clinic-blue: #0284C7;
    --color-clinic-blue-dark: #0369A1;
    --color-clinic-blue-light: #F0F9FF;
    --color-clinic-teal: #0D9488;
    --color-clinic-green: #16A34A;
    --color-clinic-border: #E2E8F0;
    --color-clinic-border-strong: #CBD5E1;
    --color-clinic-text-main: #0F172A;
    --color-clinic-text-muted: #64748B;
    --color-clinic-bg-subtle: #F8FAFC;
    --color-clinic-white: #FFFFFF;
    --color-clinic-red: #DC2626;
  }

  .slip-print-page {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: var(--color-clinic-text-main);
    line-height: 1.25;
    padding: 0;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .slip-container {
    width: 210mm;
    max-width: 210mm;
    margin: 0 auto;
    background: #FFFFFF;
    border: 1px solid var(--color-clinic-border-strong);
    border-radius: 4px;
    box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: visible;
  }

  /* ===== HEADER: DIAGNOSTIC LAB & ACCREDITATION ===== */
  .slip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px 8px 16px;
    background: #FFFFFF;
    border-bottom: 2px solid var(--color-clinic-blue);
    flex-shrink: 0;
    gap: 12px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .clinic-logo-badge {
    width: 38px;
    height: 38px;
    background: #F0F9FF;
    border: 1.5px solid #BAE6FD;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-clinic-blue);
    flex-shrink: 0;
  }

  .clinic-logo-badge svg {
    width: 20px;
    height: 20px;
    color: var(--color-clinic-blue);
    stroke: var(--color-clinic-blue);
  }

  .brand-title {
    font-size: 16px;
    font-weight: 900;
    color: var(--color-clinic-slate);
    line-height: 1.1;
    letter-spacing: -0.3px;
  }

  .brand-title span {
    color: var(--color-clinic-blue);
  }

  .brand-accreditation {
    font-size: 8px;
    color: var(--color-clinic-teal);
    font-weight: 800;
    letter-spacing: 0.5px;
    margin-top: 1px;
    text-transform: uppercase;
  }

  .brand-contacts {
    font-size: 7.5px;
    color: var(--color-clinic-text-muted);
    font-weight: 500;
    margin-top: 1.5px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .qr-box {
    width: 48px;
    height: 48px;
    border: 1px solid var(--color-clinic-border-strong);
    border-radius: 6px;
    padding: 2px;
    background: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .qr-box img {
    width: 44px;
    height: 44px;
    display: block;
    object-fit: contain;
  }

  .header-meta-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  .slip-badge-pill {
    background: #F0F9FF;
    border: 1px solid #BAE6FD;
    border-radius: 5px;
    padding: 2px 7px;
    font-size: 8px;
    font-weight: 800;
    color: var(--color-clinic-blue-dark);
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .slip-number-code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 10px;
    font-weight: 800;
    color: var(--color-clinic-slate);
    letter-spacing: 0.5px;
  }

  .datetime-stamp {
    font-size: 8px;
    color: var(--color-clinic-text-muted);
    font-weight: 600;
    white-space: nowrap;
  }

  /* Screen-only header actions */
  .header-actions {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .print-button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 11px;
    background: var(--color-clinic-slate);
    color: #FFFFFF;
    border: none;
    border-radius: 6px;
    font-size: 10.5px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    transition: all 0.15s ease;
  }

  .print-button:hover {
    background: #1E293B;
    transform: translateY(-1px);
  }

  .whatsapp-header-button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 11px;
    background: #059669;
    color: #FFFFFF;
    border: none;
    border-radius: 6px;
    font-size: 10.5px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(5, 150, 105, 0.2);
    transition: all 0.15s ease;
  }

  .whatsapp-header-button:hover {
    background: #047857;
    transform: translateY(-1px);
  }

  .email-header-button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 11px;
    background: var(--color-clinic-blue);
    color: #FFFFFF;
    border: none;
    border-radius: 6px;
    font-size: 10.5px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(2, 132, 199, 0.2);
    transition: all 0.15s ease;
  }

  .email-header-button:hover {
    background: var(--color-clinic-blue-dark);
    transform: translateY(-1px);
  }

  /* ===== DUAL DEMOGRAPHIC SECTION (50/50 CLINICIAN & PATIENT) ===== */
  .demographic-dual-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid var(--color-clinic-border);
    background: #FFFFFF;
    width: 100%;
  }

  .doctor-demographic-card {
    padding: 7px 14px 7px 16px;
    border-right: 1px solid var(--color-clinic-border);
    background: #F8FAFC;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .patient-demographic-card {
    padding: 7px 16px 7px 14px;
    background: #FFFFFF;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .card-section-label {
    font-size: 8px;
    font-weight: 800;
    color: var(--color-clinic-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .doctor-name-title {
    font-size: 12.5px;
    font-weight: 900;
    color: var(--color-clinic-slate);
    line-height: 1.15;
  }

  .doctor-spec-qual {
    font-size: 8.5px;
    font-weight: 600;
    color: #334155;
    line-height: 1.2;
  }

  .doctor-reg-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 8px;
    font-weight: 700;
    color: var(--color-clinic-blue-dark);
    margin-top: 1px;
  }

  .doctor-clinic-info {
    font-size: 8px;
    color: var(--color-clinic-text-muted);
    line-height: 1.25;
    margin-top: 1px;
  }

  .patient-row-line {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 8.5px;
  }

  .patient-field-label {
    font-weight: 700;
    color: var(--color-clinic-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.4px;
    font-size: 8px;
    white-space: nowrap;
  }

  .patient-fill-line {
    flex: 1;
    border-bottom: 1px solid #94A3B8;
    height: 14px;
    min-height: 14px;
  }

  .sample-status-options {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 8px;
    font-weight: 600;
    color: var(--color-clinic-slate);
  }

  /* ===== SECTION BAR ===== */
  .section-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 16px;
    background: #F8FAFC;
    border-bottom: 1px solid var(--color-clinic-border);
  }

  .section-bar-title {
    font-size: 9.5px;
    font-weight: 800;
    color: var(--color-clinic-slate);
    text-transform: uppercase;
    letter-spacing: 0.7px;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .section-bar-tag {
    font-size: 8px;
    font-weight: 600;
    color: var(--color-clinic-text-muted);
    font-style: italic;
  }

  /* ===== 6-PANEL HIGH-THROUGHPUT INVESTIGATION MATRIX ===== */
  .investigations-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px 10px;
    padding: 8px 16px;
    background: #FFFFFF;
    border-bottom: 1px solid var(--color-clinic-border);
    box-sizing: border-box;
  }

  .panel-box {
    background: #F8FAFC;
    border: 1px solid var(--color-clinic-border);
    border-radius: 5px;
    padding: 6px 8px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 3.5px;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 8.5px;
    font-weight: 800;
    color: var(--color-clinic-slate);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #CBD5E1;
    padding-bottom: 3px;
    margin-bottom: 1px;
  }

  .panel-badge {
    background: var(--color-clinic-blue);
    color: #FFFFFF;
    font-size: 7.5px;
    font-weight: 800;
    padding: 1px 4px;
    border-radius: 3px;
    line-height: 1;
  }

  .panel-test-list {
    display: flex;
    flex-direction: column;
    gap: 2.5px;
  }

  .test-check-item {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    font-size: 8px;
    font-weight: 600;
    color: #1E293B;
    line-height: 1.2;
    cursor: pointer;
  }

  .test-checkbox-square {
    width: 9.5px;
    height: 9.5px;
    border: 1.2px solid #94A3B8;
    background: #FFFFFF;
    border-radius: 2px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  /* ===== SPECIAL CLINICAL DIRECTIVES ===== */
  .directives-box {
    padding: 6px 16px;
    background: #FFFFFF;
    border-bottom: 1px solid var(--color-clinic-border);
    box-sizing: border-box;
  }

  .directives-label {
    font-size: 8px;
    font-weight: 800;
    color: var(--color-clinic-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
  }

  .directives-ruled-line {
    height: 18px;
    border-bottom: 1px dotted #CBD5E1;
    width: 100%;
  }

  /* ===== PRIORITY, PHLEBOTOMY & DUAL ATTESTATION ===== */
  .attestation-dual-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding: 7px 16px;
    background: #FFFFFF;
    border-bottom: 1px solid var(--color-clinic-border);
    box-sizing: border-box;
  }

  .priority-phlebotomy-block {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 4px;
  }

  .priority-options-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 8px;
    font-weight: 700;
  }

  .priority-stat-pill {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 1.5px 6px;
    background: #FEF2F2;
    border: 1px solid #FECACA;
    color: #DC2626;
    border-radius: 4px;
    font-weight: 800;
    letter-spacing: 0.3px;
  }

  .priority-routine-pill {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: #334155;
  }

  .phlebotomy-log-strip {
    background: #F8FAFC;
    border: 1px dashed var(--color-clinic-border-strong);
    border-radius: 4px;
    padding: 3px 8px;
    font-size: 7.5px;
    color: #475569;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .doctor-signature-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
  }

  .doctor-sign-area {
    height: 28px;
    width: 170px;
    border-bottom: 1.5px solid var(--color-clinic-slate);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    margin-bottom: 2px;
  }

  .doctor-sign-img {
    height: 26px;
    object-fit: contain;
  }

  .doctor-sign-title {
    font-size: 9px;
    font-weight: 800;
    color: var(--color-clinic-slate);
  }

  .doctor-sign-mci {
    font-size: 7.5px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: var(--color-clinic-text-muted);
  }

  /* ===== OFFICIAL ACCREDITED FOOTER ===== */
  .slip-footer {
    background: #F8FAFC;
    border-top: 1.5px solid var(--color-clinic-border-strong);
    padding: 6px 16px;
    color: var(--color-clinic-slate);
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .footer-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-bottom: 3px;
    border-bottom: 1px solid var(--color-clinic-border);
  }

  .footer-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 8px;
    font-weight: 600;
    color: #475569;
  }

  .footer-divider {
    width: 1px;
    height: 10px;
    background: var(--color-clinic-border-strong);
  }

  .footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 3px;
    width: 100%;
  }

  .footer-security {
    font-size: 7.5px;
    color: #64748B;
    font-weight: 500;
  }

  .footer-page-index {
    font-size: 7.5px;
    font-weight: 800;
    color: var(--color-clinic-blue-dark);
    letter-spacing: 0.4px;
  }

  /* ===== PRINT SPECIFICATION (EXACT 1-PAGE A4) ===== */
  @media print {
    @page {
      size: A4 portrait;
      margin: 4mm 6mm;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #FFFFFF !important;
      width: 100% !important;
      height: 100% !important;
      overflow: visible !important;
    }

    .no-print {
      display: none !important;
    }

    .slip-container {
      box-shadow: none !important;
      border: 1px solid #CBD5E1 !important;
      max-width: 100% !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
    }

    .demographic-dual-grid,
    .investigations-grid,
    .directives-box,
    .attestation-dual-row,
    .slip-footer {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      width: 100% !important;
    }
  }
`;

interface DoctorRequisitionSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorProfileData | null;
  autoOpenModal?: "whatsapp" | "email";
}

export default function DoctorRequisitionSlipModal({
  isOpen,
  onClose,
  doctor,
  autoOpenModal,
}: DoctorRequisitionSlipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Advanced WhatsApp Dispatcher Modal State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [whatsappTemplate, setWhatsappTemplate] = useState<"requisition_slip" | "portal_activation" | "test_directory" | "commission_statement">("requisition_slip");
  const [whatsappLanguage, setWhatsappLanguage] = useState<"en" | "hi" | "gu">("en");
  const [whatsappAttachPdf, setWhatsappAttachPdf] = useState(true);
  const [whatsappSending, setWhatsappSending] = useState(false);
  const [whatsappSentSuccess, setWhatsappSentSuccess] = useState(false);
  const [whatsappNotice, setWhatsappNotice] = useState<string | null>(null);

  // Advanced Email Dispatcher Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailTemplate, setEmailTemplate] = useState<"requisition_slip" | "portal_activation" | "test_directory" | "commission_statement">("requisition_slip");
  const [emailLanguage, setEmailLanguage] = useState<"en" | "hi" | "gu">("en");
  const [emailAttachPdf, setEmailAttachPdf] = useState(true);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

  // SMTP Settings
  const [showSmtpConfig, setShowSmtpConfig] = useState(false);
  const [smtpPasswordInput, setSmtpPasswordInput] = useState("");
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestStatus, setSmtpTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const docName =
    doctor?.fullName ||
    doctor?.name ||
    [doctor?.firstName, doctor?.middleName, doctor?.lastName].filter(Boolean).join(" ") ||
    "Doctor";

  const doctorCode = doctor?.doctorCode || `DOC-${doctor?.id || "REG"}`;
  const regNumber = doctor?.registrationNumber || doctor?.licenseNumber || "NMC-VERIFIED";
  const clinic = doctor?.clinicName || "Apex Multispecialty Hospital";
  const clinicAddress =
    doctor?.clinicAddress ||
    [doctor?.address, doctor?.city, doctor?.state].filter(Boolean).join(", ") ||
    "Ring Road, Medical Complex, Ahmedabad - 380015";

  const currentDateFormatted = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const currentTimeFormatted = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const doctorSafeFilename = `Official_Lab_Requisition_Pad_${doctorCode}_${docName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

  // Generate diagnostic verification QR code
  useEffect(() => {
    if (!doctor) return;
    const generateQR = async () => {
      try {
        const qrPayload = JSON.stringify({
          slip: `TRF-${doctorCode}-${new Date().getFullYear()}`,
          doc: docName,
          code: doctorCode,
          mci: regNumber,
          clinic: clinic,
          date: new Date().toISOString().split("T")[0],
          lab: "LABCORE ENTERPRISE DIAGNOSTICS",
        });
        const url = await QRCode.toDataURL(qrPayload, {
          width: 140,
          margin: 1,
          color: {
            dark: "#0F172A",
            light: "#FFFFFF",
          },
        });
        setQrCodeDataUrl(url);
      } catch (err) {
        console.error("QR Code error:", err);
      }
    };
    generateQR();
  }, [doctor, doctorCode, docName, regNumber, clinic]);

  // Handle auto-open modal prop
  useEffect(() => {
    if (!isOpen || !doctor) return;
    if (autoOpenModal === "whatsapp") {
      openWhatsAppComposer("requisition_slip");
    } else if (autoOpenModal === "email") {
      openEmailComposer("requisition_slip");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, autoOpenModal, doctor]);

  // High-Resolution 1-Click A4 PDF Generator
  const generatePdfBase64 = async (): Promise<string | null> => {
    if (!printRef.current) return null;
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 794,
        onclone: (clonedDoc) => {
          const container = clonedDoc.querySelector(".slip-container") as HTMLElement;
          if (container) {
            container.style.border = "none";
            container.style.boxShadow = "none";
            container.style.margin = "0";
            container.style.width = "794px";
            container.style.maxWidth = "794px";
          }
        },
        ignoreElements: (el) => el.classList.contains("no-print"),
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight));
      const uri = pdf.output("datauristring");
      return uri.split(",")[1];
    } catch (err) {
      console.error("Error generating PDF base64:", err);
      return null;
    }
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setPdfGenerating(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 794,
        onclone: (clonedDoc) => {
          const container = clonedDoc.querySelector(".slip-container") as HTMLElement;
          if (container) {
            container.style.border = "none";
            container.style.boxShadow = "none";
            container.style.margin = "0";
            container.style.width = "794px";
            container.style.maxWidth = "794px";
          }
        },
        ignoreElements: (el) => el.classList.contains("no-print"),
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight));
      pdf.save(doctorSafeFilename);
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setPdfGenerating(false);
    }
  };

  // High-Fidelity Isolated Off-screen Iframe Print Engine
  const handlePrint = () => {
    const formEl = printRef.current;
    if (!formEl) {
      window.print();
      return;
    }

    let iframe = document.getElementById("doctor-requisition-print-iframe") as HTMLIFrameElement | null;
    if (iframe) {
      iframe.remove();
    }

    iframe = document.createElement("iframe");
    iframe.id = "doctor-requisition-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.left = "-10000px";
    iframe.style.top = "0";
    iframe.style.width = "210mm";
    iframe.style.height = "297mm";
    iframe.style.border = "0";
    iframe.style.zIndex = "-1000";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>OFFICIAL LAB INVESTIGATION REQUISITION PAD - ${docName} (${doctorCode})</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            ${doctorRequisitionPrintStyles}
            @page {
              size: A4 portrait;
              margin: 4mm 6mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #FFFFFF !important;
              width: 100% !important;
              height: 100% !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
            .slip-container {
              box-shadow: none !important;
              border: 1px solid #CBD5E1 !important;
              max-width: 100% !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box !important;
            }
            .demographic-dual-grid,
            .investigations-grid,
            .directives-box,
            .attestation-dual-row,
            .slip-footer {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              width: 100% !important;
            }
          </style>
        </head>
        <body>
          <div class="slip-print-page">
            <div class="slip-container">
              ${formEl.innerHTML}
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe?.contentWindow?.focus();
        iframe?.contentWindow?.print();
      } catch (err) {
        console.error("Iframe print error, falling back to window.print():", err);
        window.print();
      }
    }, 250);
  };

  // =======================================================
  // DOCTOR WHATSAPP TEMPLATES GENERATOR
  // =======================================================
  const generateDoctorWhatsAppContent = (
    template: "requisition_slip" | "portal_activation" | "test_directory" | "commission_statement",
    lang: "en" | "hi" | "gu" = whatsappLanguage
  ) => {
    if (lang === "hi") {
      if (template === "requisition_slip") {
        return (
          `*आधिकारिक लैब जांच मांग-पत्र (REQUISITION PAD)*\n` +
          `*लैबकोर एंटरप्राइज डायग्नोस्टिक्स - NABL मान्यता प्राप्त (ISO 15189:2022)*\n\n` +
          `आदरणीय डॉ. ${docName} जी,\n\n` +
          `लैबकोर डायग्नोस्टिक सेंटर की ओर से सादर प्रणाम।\n` +
          `आपके क्लीनिकल अभ्यास के लिए आपका विशेष 1-पेज अधिकृत टेस्ट रिक्विजिशन पैड (TRF-A4) तैयार किया गया है:\n\n` +
          `• *रिक्विजिशन स्लिप:* SLIP #${doctorCode}-2026\n` +
          `• *चिकित्सक का नाम:* डॉ. ${docName} (${doctor?.specialization || "परामर्शदाता"})\n` +
          `• *पंजीकरण नंबर:* MCI/NMC ${regNumber} | कोड: ${doctorCode}\n` +
          `• *क्लीनिक/अस्पताल:* ${clinic}\n` +
          `• *हेल्पलाइन नंबर:* +91 98765 43210\n\n` +
          `📎 संलग्न: आधिकारिक 1-पेज A4 रिक्विजिशन पैड PDF (${doctorSafeFilename})\n\n` +
          `मरीजों की जांच रिपोर्ट वरिष्ठ पैथोलॉजिस्ट अनुमोदन के बाद आपके डॉक्टर पोर्टल और व्हाट्सएप पर स्वतः भेज दी जाएगी।\n\n` +
          `_लैबकोर एंटरप्राइज डायग्नोस्टिक्स — सटीक जांच • सुरक्षित परिणाम_`
        );
      }
      if (template === "portal_activation") {
        return (
          `*डॉक्टर LIS डिजिटल पोर्टल एक्टिवेशन*\n` +
          `*लैबकोर एंटरप्राइज डायग्नोस्टिक्स*\n\n` +
          `आदरणीय डॉ. ${docName} जी,\n\n` +
          `आपके डायग्नोस्टिक रेफरल पार्टनर खाते को सक्रिय कर दिया गया है:\n\n` +
          `• *डॉक्टर रेफरल कोड:* ${doctorCode}\n` +
          `• *लॉगिन पोर्टल:* https://labcore.in/doctor-portal\n` +
          `• *विशेषता:* मरीज की रिपोर्ट की लाइव ट्रैकिंग, क्रिटिकल अलर्ट एवं मासिक सारांश।\n\n` +
          `24x7 क्लिनिकल समन्वय: +91 98765 43210`
        );
      }
    }

    if (lang === "gu") {
      if (template === "requisition_slip") {
        return (
          `*સત્તાવાર લેબ તપાસ માંગણી-પત્ર (REQUISITION PAD)*\n` +
          `*લેબકોર એન્ટરપ્રાઇઝ ડાયગ્નોસ્ટિક્સ - NABL (ISO 15189:2022)*\n\n` +
          `આદરણીય ડૉ. ${docName},\n\n` +
          `લેબકોર ડાયગ્નોસ્ટિક સેન્ટર તરફથી નમસ્કાર.\n` +
          `આપના ક્લિનિકલ રેફરલ્સ માટે ખાસ ૧-પેજ A4 ટેસ્ટ રિક્વિઝિશન પેડ તૈયાર કરવામાં આવ્યું છે:\n\n` +
          `• *સ્લિપ નંબર:* SLIP #${doctorCode}-2026\n` +
          `• *ડૉક્ટરનું નામ:* ડૉ. ${docName} (${doctor?.specialization || "નિષ્ણાત"})\n` +
          `• *MCI રજિસ્ટ્રેશન:* ${regNumber} | કોડ: ${doctorCode}\n` +
          `• *હોસ્પિટલ/ક્લિનિક:* ${clinic}\n` +
          `• *સહાયતા નંબર:* +91 98765 43210\n\n` +
          `📎 સાથે જોડેલ: ૧-પેજ A4 રિક્વિઝિશન પેડ PDF (${doctorSafeFilename})\n\n` +
          `દર્દીઓના ટેસ્ટ રિપોર્ટ સીધા આપના પોર્ટલ અને વ્હોટ્સએપ પર મોકલવામાં આવશે.`
        );
      }
    }

    // Default English Templates
    if (template === "requisition_slip") {
      return (
        `*OFFICIAL CLINICAL INVESTIGATION REQUISITION PAD (TRF)*\n` +
        `*LABCORE ENTERPRISE DIAGNOSTICS & REFERENCE LABORATORIES*\n` +
        `NABL Accredited (ISO 15189:2022) • CAP Certified Reference Laboratory\n\n` +
        `Respected Dr. ${docName},\n\n` +
        `Greetings from LabCore Enterprise Diagnostics.\n` +
        `Please find attached your customized 1-Page Official Diagnostic Investigation Requisition Pad (TRF-A4):\n\n` +
        `• *Requisition Identifier:* SLIP #${doctorCode}-${new Date().getFullYear()}\n` +
        `• *Authorizing Clinician:* Dr. ${docName} (${doctor?.specialization || "Consultant Physician"})\n` +
        `• *Medical Council Reg  :* MCI/NMC ${regNumber} | LIS Code: ${doctorCode}\n` +
        `• *Consulting Chamber   :* ${clinic}\n` +
        `• *Chamber Location     :* ${clinicAddress}\n` +
        `• *24x7 Lab Helpline    :* +91 98765 43210\n\n` +
        `📄 *Attached Document:* ${doctorSafeFilename}\n\n` +
        `_Clinical reports are auto-dispatched to your Clinician Portal, WhatsApp & registered Email immediately upon senior pathologist verification._\n\n` +
        `Dedicated to Diagnostic Precision & Evidence-Based Clinical Care.\n` +
        `Department of Medical Informatics • LabCore Diagnostics`
      );
    }

    if (template === "portal_activation") {
      return (
        `*CLINICIAN EHR PORTAL ACTIVATION & PARTNERSHIP ONBOARDING*\n` +
        `*LABCORE ENTERPRISE DIAGNOSTICS (ISO 15189:2022)*\n\n` +
        `Dear Dr. ${docName},\n\n` +
        `We are honored to welcome you to the LabCore Diagnostic Referral Network. Your secure clinician portal has been activated:\n\n` +
        `• *Doctor ID / Code :* ${doctorCode}\n` +
        `• *Medical License  :* ${regNumber}\n` +
        `• *Clinician Portal :* https://labcore.in/clinician-portal\n` +
        `• *Live Features    :* Instant Real-time Pathological Results, Cumulative Patient Trends, Panic Alerts (SMS/WhatsApp), and Electronic Requisition.\n\n` +
        `For clinical inquiries or specimen pickup logistics: +91 98765 43210`
      );
    }

    if (template === "test_directory") {
      return (
        `*NABL ACCREDITED DIAGNOSTIC DIRECTORY & SAMPLE LOGISTICS*\n` +
        `*LABCORE ENTERPRISE DIAGNOSTICS*\n\n` +
        `Dear Dr. ${docName},\n\n` +
        `LabCore Diagnostics provides comprehensive diagnostic profiling for your patients:\n\n` +
        `• *Routine Profiles   :* Complete Blood Count, LFT, KFT/RFT, Lipid Profile, HbA1c.\n` +
        `• *Advanced Assays    :* Vitamin D3, B12, Hormones, Thyroid Panels, Viral Screens.\n` +
        `• *Critical Value Desk:* Immediate telephonic alert for panic physiological values.\n` +
        `• *Home Phlebotomy    :* Temperature-controlled cold chain sample logistics.\n\n` +
        `Central Phlebotomy Coordination Desk: +91 98765 43210`
      );
    }

    // template === "commission_statement"
    return (
      `*MONTHLY REFERRAL PERFORMANCE & SETTLEMENT STATEMENT*\n` +
      `*LABCORE ENTERPRISE DIAGNOSTICS*\n\n` +
      `Dear Dr. ${docName},\n\n` +
      `Your monthly diagnostic referral summary is ready for review:\n\n` +
      `• *Practitioner :* Dr. ${docName} (${doctorCode})\n` +
      `• *Statement Date:* ${currentDateFormatted}\n` +
      `• *Commission Ledger:* Accounts settled and verified in accordance with laboratory referral policy.\n\n` +
      `For ledger queries, please contact accounts@labcore.in or +91 98765 43210.`
    );
  };

  // =======================================================
  // DOCTOR EMAIL TEMPLATES GENERATOR
  // =======================================================
  const generateDoctorEmailContent = (
    template: "requisition_slip" | "portal_activation" | "test_directory" | "commission_statement",
    lang: "en" | "hi" | "gu" = emailLanguage
  ) => {
    if (template === "requisition_slip") {
      setEmailSubject(`[OFFICIAL CLINICAL DOSSIER] Official Lab Investigation Requisition Pad - Dr. ${docName} | Code: ${doctorCode}`);
      setEmailBody(
        `OFFICIAL CLINICAL INVESTIGATION REQUISITION PAD & REFERRAL SLIP\n` +
        `================================================================================\n` +
        `INSTITUTION   : LABCORE ENTERPRISE DIAGNOSTICS & CLINICAL REFERENCE LABORATORIES\n` +
        `ACCREDITATION : NABL ACCREDITED (ISO 15189:2022) • CAP CERTIFIED • ABDM/ABHA\n` +
        `DEPARTMENT    : Clinician Relations & Medical Informatics\n` +
        `================================================================================\n\n` +
        `Dear Dr. ${docName},\n\n` +
        `Greetings from LabCore Enterprise Diagnostics.\n\n` +
        `We are pleased to provide you with your customized, high-resolution Official Laboratory Investigation Requisition Pad (TRF-A4). This document has been configured with your medical council credentials, chamber address, and pre-formatted diagnostic investigation panels to streamline rapid outpatient and clinical test prescriptions.\n\n` +
        `--------------------------------------------------------------------------------\n` +
        `1. AUTHORIZING CLINICIAN PARTICULARS\n` +
        `--------------------------------------------------------------------------------\n` +
        `• Practicing Clinician : Dr. ${docName}\n` +
        `• Medical Specialty    : ${doctor?.specialization || "Consultant Physician"} ${doctor?.qualification ? `(${doctor?.qualification})` : ""}\n` +
        `• Council Registration : MCI / State Medical Council: ${regNumber}\n` +
        `• LIS Clinician Code   : ${doctorCode}\n` +
        `• Consulting Chamber   : ${clinic}\n` +
        `• Facility Address     : ${clinicAddress}\n` +
        `• Registered Phone     : ${doctor?.phone || "Not recorded"}\n\n` +
        `--------------------------------------------------------------------------------\n` +
        `2. REQUISITION PAD FEATURES & DIAGNOSTIC DIRECTORY\n` +
        `--------------------------------------------------------------------------------\n` +
        `• Standard 1-Page A4 Printable Standard: Formatted with exact margins and zero vertical overflow.\n` +
        `• 6 Core Clinical Investigation Matrices: Complete Hematology, Liver & Renal Biochemistry, Diabetes & Metabolic, Thyroid & Hormones, Serology & Infectious Immunology, and Clinical Pathology.\n` +
        `• Specimen Logistics: Includes pre-analytical fasting indicators, STAT 1-2 hour urgent alert protocol, and home phlebotomy requisition checkboxes.\n` +
        `• Counter Barcode & QR Code: Scannable at all laboratory intake counters for immediate sample accessioning.\n\n` +
        `--------------------------------------------------------------------------------\n` +
        `3. ATTACHED CLINICAL FILE\n` +
        `--------------------------------------------------------------------------------\n` +
        `📎 Attached Requisition Slip (PDF): ${doctorSafeFilename}\n\n` +
        `Reports generated for your referred patients are automatically authorized with dual-pathologist validation and transmitted in real-time to your Clinician Portal, WhatsApp, and registered Email.\n\n` +
        `For direct consultations, STAT phlebotomy requests, or critical panic alerts:\n` +
        `• 24x7 Diagnostic Helpline : +91 98765 43210\n` +
        `• Pathologist Consultation : info@labcore.in\n` +
        `• Central Reference Lab    : Ground Floor, Diagnostic Wing, Opp. Civil Hospital\n\n` +
        `Respectfully,\n` +
        `Medical Director & Quality Assurance Team\n` +
        `LabCore Enterprise Diagnostics\n` +
        `Committed to Evidence-Based Clinical Medicine & Diagnostic Precision`
      );
    } else if (template === "portal_activation") {
      setEmailSubject(`[CREDENTIALS DISPATCH] Clinician Portal Activation & Digital LIS Integration - Dr. ${docName}`);
      setEmailBody(
        `CLINICIAN EHR PORTAL ACCESS & INTEGRATION NOTICE\n` +
        `================================================================================\n` +
        `Dear Dr. ${docName},\n\n` +
        `Your clinician digital portal with LabCore Enterprise Diagnostics is now active.\n\n` +
        `• LIS Doctor Code : ${doctorCode}\n` +
        `• Medical License : ${regNumber}\n` +
        `• Portal Address  : https://labcore.in/clinician-portal\n\n` +
        `Features include live report viewing, cumulative trend charts, and panic alert dispatches.\n\n` +
        `LabCore Clinician Relations Desk\n` +
        `Tel: +91 98765 43210`
      );
    } else if (template === "test_directory") {
      setEmailSubject(`[CLINICAL DIRECTORY] NABL Accredited Investigation Directory & Specimen Protocol Guide - Dr. ${docName}`);
      setEmailBody(
        `NABL ACCREDITED DIAGNOSTIC DIRECTORY & LOGISTICS GUIDE\n` +
        `================================================================================\n` +
        `Dear Dr. ${docName},\n\n` +
        `Please find our comprehensive clinical test directory and pre-analytical specimen protocols attached.\n\n` +
        `LabCore Enterprise Diagnostics`
      );
    } else {
      setEmailSubject(`[FINANCIAL SUMMARY] Monthly Referral Performance & Accounts Settlement Ledger - Dr. ${docName}`);
      setEmailBody(
        `MONTHLY REFERRAL SETTLEMENT & ACCOUNT LEDGER\n` +
        `================================================================================\n` +
        `Dear Dr. ${docName},\n\n` +
        `Your monthly referral statement has been processed.\n\n` +
        `Accounts Division • LabCore Diagnostics`
      );
    }
  };

  const openWhatsAppComposer = (template: "requisition_slip" | "portal_activation" | "test_directory" | "commission_statement") => {
    setWhatsappTemplate(template);
    setWhatsappPhone(doctor?.phone || doctor?.whatsappNumber || "");
    const content = generateDoctorWhatsAppContent(template, whatsappLanguage);
    setWhatsappMessage(content);
    setShowWhatsAppModal(true);
  };

  const openEmailComposer = (template: "requisition_slip" | "portal_activation" | "test_directory" | "commission_statement") => {
    setEmailTemplate(template);
    setEmailTo(doctor?.email || "");
    generateDoctorEmailContent(template, emailLanguage);
    setShowEmailModal(true);
  };

  // Dispatch WhatsApp message
  const handleSendWhatsApp = async () => {
    const rawPhone = whatsappPhone.replace(/\D/g, "");
    if (!rawPhone) {
      alert("Please enter a valid phone number with country code.");
      return;
    }
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    setWhatsappSending(true);
    setWhatsappNotice(null);

    try {
      let b64: string | null = null;
      if (whatsappAttachPdf) {
        b64 = await generatePdfBase64();
      }

      const res = await communicationApi.sendWhatsApp({
        patientId: `DOC-${doctor?.id || "REG"}`,
        to: cleanPhone,
        message: whatsappMessage,
        pdfBase64: b64 || undefined,
        filename: doctorSafeFilename,
      });

      if (res && res.success) {
        setWhatsappSentSuccess(true);
        setWhatsappNotice(`✓ WhatsApp message sent to Dr. ${docName} (+${cleanPhone})!`);
        setTimeout(() => {
          setWhatsappSentSuccess(false);
          setShowWhatsAppModal(false);
        }, 2200);
      } else {
        // Fallback to Web WhatsApp
        handleSendViaWebWhatsApp();
      }
    } catch (e) {
      handleSendViaWebWhatsApp();
    } finally {
      setWhatsappSending(false);
    }
  };

  const handleSendViaWebWhatsApp = async () => {
    const rawPhone = whatsappPhone.replace(/\D/g, "");
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    if (whatsappAttachPdf) {
      await handleDownloadPdf();
    }
    const encText = encodeURIComponent(whatsappMessage);
    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encText}`
      : `https://api.whatsapp.com/send?text=${encText}`;
    window.open(waUrl, "_blank");
    setWhatsappNotice(`WhatsApp opened! ${whatsappAttachPdf ? `PDF (${doctorSafeFilename}) was downloaded to your computer to attach.` : ""}`);
  };

  // Dispatch Email message
  const handleSendEmail = async () => {
    if (!emailTo.trim()) {
      alert("Please enter a valid email address.");
      return;
    }
    setEmailSending(true);
    setEmailNotice(null);

    try {
      let attachments: any[] = [];
      if (emailAttachPdf) {
        const b64 = await generatePdfBase64();
        if (b64) {
          attachments.push({
            filename: doctorSafeFilename,
            content: b64,
            contentType: "application/pdf",
          });
        }
      }

      const res = await communicationApi.sendEmail({
        patientId: `DOC-${doctor?.id || "REG"}`,
        to: emailTo.trim(),
        subject: emailSubject.trim(),
        body: emailBody.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (res && res.success && res.data?.status !== "FAILED") {
        setEmailSentSuccess(true);
        setEmailNotice(`✓ Email delivered successfully to Dr. ${docName} (${emailTo.trim()})!`);
        setTimeout(() => {
          setEmailSentSuccess(false);
          setShowEmailModal(false);
        }, 2200);
      } else {
        // Fallback to Web Gmail
        handleSendViaWebGmail();
      }
    } catch (e) {
      handleSendViaWebGmail();
    } finally {
      setEmailSending(false);
    }
  };

  const handleSendViaWebGmail = async () => {
    if (emailAttachPdf) {
      await handleDownloadPdf();
    }
    const encTo = encodeURIComponent(emailTo);
    const encSub = encodeURIComponent(emailSubject);
    const encBody = encodeURIComponent(emailBody);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encTo}&su=${encSub}&body=${encBody}`;
    window.open(gmailUrl, "_blank");
    setEmailNotice(`Web Gmail opened! ${emailAttachPdf ? `PDF (${doctorSafeFilename}) was downloaded to attach to your draft.` : ""}`);
  };

  // SMTP Settings test
  const handleTestAndSaveSmtp = async () => {
    if (!smtpPasswordInput.trim()) {
      setSmtpTestStatus({ success: false, message: "Please enter your 16-character Gmail App Password." });
      return;
    }
    setSmtpTesting(true);
    setSmtpTestStatus(null);
    try {
      const cleanPassword = smtpPasswordInput.trim().replace(/\s+/g, "");
      const res = await communicationApi.testSmtp({
        smtpPassword: cleanPassword,
        smtpUser: "nikilpanchal5@gmail.com",
        smtpHost: "smtp.gmail.com",
        smtpPort: 587,
      });

      if (res && res.success) {
        await communicationApi.updateSmtpSettings({
          smtpPassword: cleanPassword,
          smtpUser: "nikilpanchal5@gmail.com",
          smtpHost: "smtp.gmail.com",
          smtpPort: 587,
          emailFromEmail: "nikilpanchal5@gmail.com",
          emailFromName: "LabCore Enterprise Diagnostics",
        });
        setSmtpTestStatus({
          success: true,
          message: "✓ Gmail App Password verified and saved! Direct email sending is active.",
        });
      } else {
        setSmtpTestStatus({
          success: false,
          message: res?.message || "Verification failed. Check your App Password.",
        });
      }
    } catch (err: any) {
      setSmtpTestStatus({
        success: false,
        message: err?.message || "Connection error during SMTP test.",
      });
    } finally {
      setSmtpTesting(false);
    }
  };

  if (!isOpen || !doctor) return null;

  return (
    <>
      <style>{doctorRequisitionPrintStyles}</style>

      {/* MODAL WRAPPER (LIGHT-WHITE CLINICAL CHROME) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
        <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-4 flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200">
          
          {/* Light-White Header Bar */}
          <div className="bg-white px-6 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 no-print">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Official Lab Investigation Requisition Pad
                  </h3>
                  <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                    {doctorCode}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Customized Clinical Referral Slip for <strong className="text-slate-700">{docName}</strong> • NABL ISO 15189:2022 Format
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openWhatsAppComposer("requisition_slip")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Send via WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => openEmailComposer("requisition_slip")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Send via Email"
              >
                <Mail className="w-3.5 h-3.5 text-sky-600" />
                <span>Email</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={pdfGenerating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                title="Download 1-Page A4 PDF"
              >
                {pdfGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" /> : <Download className="w-3.5 h-3.5 text-sky-600" />}
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Print 1-Page A4 Requisition Pad"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                title="Close Window"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Document Scroll Area */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/90 flex justify-center">
            
            {/* EXACT 1-PAGE A4 REQUISITION SLIP CONTAINER */}
            <div className="slip-container" ref={printRef}>
              
              {/* ===== HEADER: DIAGNOSTIC LAB & NABL ACCREDITATION ===== */}
              <div className="slip-header">
                <div className="header-left">
                  <div className="clinic-logo-badge">
                    <FlaskConical />
                  </div>
                  <div>
                    <div className="brand-title">
                      LabCore <span>ENTERPRISE DIAGNOSTICS</span>
                    </div>
                    <div className="brand-accreditation">
                      NABL ACCREDITED (ISO 15189:2022) • CAP CERTIFIED • ABDM/ABHA COMPLIANT REFERENCE LAB
                    </div>
                    <div className="brand-contacts">
                      Central Diagnostic Center, Ground Floor, Diagnostic Wing • 24x7 Helpline: +91 98765 43210 • info@labcore.in • www.labcore.in
                    </div>
                  </div>
                </div>

                <div className="header-right">
                  <div className="qr-box">
                    {qrCodeDataUrl ? (
                      <img src={qrCodeDataUrl} alt="Requisition Barcode QR" />
                    ) : (
                      <QrCodeIcon className="w-7 h-7 text-slate-300" />
                    )}
                  </div>
                  <div className="header-meta-block">
                    <span className="slip-badge-pill">TEST REQUISITION PAD (TRF)</span>
                    <span className="slip-number-code">SLIP #{doctorCode}-{new Date().getFullYear()}</span>
                    <span className="datetime-stamp">{currentDateFormatted} • {currentTimeFormatted}</span>
                  </div>

                  {/* Screen Header Quick Action Buttons */}
                  <div className="header-actions no-print">
                    <button
                      className="whatsapp-header-button"
                      onClick={() => openWhatsAppComposer("requisition_slip")}
                      type="button"
                      title="Send Requisition Pad via WhatsApp"
                    >
                      <MessageCircle size={12} />
                      WHATSAPP
                    </button>
                    <button
                      className="email-header-button"
                      onClick={() => openEmailComposer("requisition_slip")}
                      type="button"
                      title="Send Requisition Pad via Email"
                    >
                      <Mail size={12} />
                      EMAIL
                    </button>
                    <button className="print-button" onClick={handlePrint} type="button">
                      <Printer size={12} />
                      PRINT
                    </button>
                  </div>
                </div>
              </div>

              {/* ===== DUAL DEMOGRAPHIC SECTION (50/50 CLINICIAN & PATIENT) ===== */}
              <div className="demographic-dual-grid">
                
                {/* LEFT: AUTHORIZING CLINICIAN */}
                <div className="doctor-demographic-card">
                  <div className="card-section-label">
                    <Stethoscope className="w-3 h-3 text-sky-600" />
                    <span>AUTHORIZING CLINICIAN / PRESCRIBING PRACTITIONER</span>
                  </div>
                  
                  <div className="doctor-name-title">Dr. {docName}</div>
                  
                  <div className="doctor-spec-qual">
                    {doctor.specialization || "Consultant Physician"} {doctor.qualification ? `• ${doctor.qualification}` : "• MBBS, MD"}
                  </div>

                  <div className="doctor-reg-badge">
                    <span>MCI/NMC: {regNumber}</span>
                    <span>•</span>
                    <span>LIS CODE: {doctorCode}</span>
                  </div>

                  <div className="doctor-clinic-info">
                    <strong>Chamber:</strong> {clinic}
                    <br />
                    <strong>Location:</strong> {clinicAddress}
                    {doctor.phone && ` • Ph: ${doctor.phone}`}
                  </div>
                </div>

                {/* RIGHT: DIAGNOSTIC SUBJECT / PATIENT PARTICULARS */}
                <div className="patient-demographic-card">
                  <div className="card-section-label">
                    <Activity className="w-3 h-3 text-sky-600" />
                    <span>DIAGNOSTIC SUBJECT / PATIENT INTAKE RECORD</span>
                  </div>

                  <div className="patient-row-line">
                    <span className="patient-field-label">Patient Full Name:</span>
                    <div className="patient-fill-line"></div>
                  </div>

                  <div className="patient-row-line">
                    <span className="patient-field-label">Age / Sex:</span>
                    <span style={{ fontSize: "8px", color: "#64748B" }}>_____ Yrs • [ ] M [ ] F [ ] O</span>
                    <span className="patient-field-label" style={{ marginLeft: "auto" }}>Mobile:</span>
                    <div className="patient-fill-line" style={{ flex: "0 0 110px" }}></div>
                  </div>

                  <div className="patient-row-line">
                    <span className="patient-field-label">Date:</span>
                    <span style={{ fontSize: "8px", fontWeight: "700", color: "#0F172A" }}>{currentDateFormatted}</span>
                    <span className="patient-field-label" style={{ marginLeft: "6px" }}>Fast Status:</span>
                    <div className="sample-status-options">
                      <span>[ ] Fasting (10-12h)</span>
                      <span>[ ] PP</span>
                      <span>[ ] Random</span>
                    </div>
                  </div>

                  <div className="patient-row-line">
                    <span className="patient-field-label">Clinical Indication:</span>
                    <div className="patient-fill-line"></div>
                  </div>
                </div>
              </div>

              {/* ===== SECTION HEADER BAR ===== */}
              <div className="section-bar">
                <div className="section-bar-title">
                  <Microscope className="w-3.5 h-3.5 text-sky-600" />
                  <span>RECOMMENDED DIAGNOSTIC INVESTIGATIONS (TICK OR CHECK DESIRED PANELS)</span>
                </div>
                <div className="section-bar-tag">
                  High-Throughput Diagnostic Directory • NABL Certified Assays
                </div>
              </div>

              {/* ===== 6-PANEL COMPACT CLINICAL INVESTIGATIONS MATRIX ===== */}
              <div className="investigations-grid">
                
                {/* 1. HEMATOLOGY & COAGULATION */}
                <div className="panel-box">
                  <div className="panel-header">
                    <span className="panel-badge">1</span>
                    <span>HEMATOLOGY & COMPLETE BLOOD WORK</span>
                  </div>
                  <div className="panel-test-list">
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Complete Blood Count (CBC) + ESR</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Peripheral Smear Examination (PS)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Blood Grouping & Rh Factor (ABO/Rh)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Prothrombin Time (PT / INR) + APTT</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Serum Ferritin & Iron Studies</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Absolute Eosinophil Count (AEC)</span>
                    </label>
                  </div>
                </div>

                {/* 2. BIOCHEMISTRY & ORGAN FUNCTION */}
                <div className="panel-box">
                  <div className="panel-header">
                    <span className="panel-badge">2</span>
                    <span>BIOCHEMISTRY & ORGAN FUNCTION</span>
                  </div>
                  <div className="panel-test-list">
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Liver Function Test (LFT Complete)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Kidney Function Test (KFT / RFT with Urea/Creat)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Lipid Profile (Chol, HDL, LDL, Triglycerides)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Serum Electrolytes (Na+, K+, Cl-)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Serum Uric Acid / Calcium / Phosphorus</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Cardiac Markers (Troponin-I / hs-CRP)</span>
                    </label>
                  </div>
                </div>

                {/* 3. DIABETES & METABOLIC */}
                <div className="panel-box">
                  <div className="panel-header">
                    <span className="panel-badge">3</span>
                    <span>DIABETES, METABOLIC & PANCREAS</span>
                  </div>
                  <div className="panel-test-list">
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Fasting Blood Glucose (FBS)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Post Prandial Blood Glucose (PPBS)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>HbA1c (Glycated Hemoglobin with eAG)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Urine Microalbumin / Creatinine Ratio (UACR)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Serum Amylase & Serum Lipase</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Fasting Insulin / HOMA-IR Index</span>
                    </label>
                  </div>
                </div>

                {/* 4. THYROID, HORMONES & VITAMINS */}
                <div className="panel-box">
                  <div className="panel-header">
                    <span className="panel-badge">4</span>
                    <span>THYROID, HORMONES & VITAMINS</span>
                  </div>
                  <div className="panel-test-list">
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Thyroid Profile (Total T3, Total T4, TSH)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Free Thyroid Profile (FT3, FT4, Ultrasensitive TSH)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Vitamin D3 (25-Hydroxy Cholecalciferol)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Vitamin B12 (Cyanocobalamin)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Serum PSA (Total & Free) - Male</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Serum Beta-hCG (Quantitative Assays)</span>
                    </label>
                  </div>
                </div>

                {/* 5. INFECTIOUS SEROLOGY & IMMUNOLOGY */}
                <div className="panel-box">
                  <div className="panel-header">
                    <span className="panel-badge">5</span>
                    <span>INFECTIOUS SEROLOGY & IMMUNOLOGY</span>
                  </div>
                  <div className="panel-test-list">
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Dengue Duo (NS1 Antigen + IgM/IgG Antibodies)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Widal Slide & Tube Agglutination</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Malaria Antigen (Pv / Pf Rapid Card Test)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>C-Reactive Protein (CRP Quantitative)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Viral Screen (HIV I & II, HBsAg, Anti-HCV)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Typhidot IgM / RA Factor / ASO Titre</span>
                    </label>
                  </div>
                </div>

                {/* 6. URINE, STOOL & MICROBIOLOGY */}
                <div className="panel-box">
                  <div className="panel-header">
                    <span className="panel-badge">6</span>
                    <span>URINE, STOOL & CLINICAL PATHOLOGY</span>
                  </div>
                  <div className="panel-test-list">
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Urine Routine & Microscopic Examination (R/M)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Urine Culture & Antibiotic Sensitivity (Automated)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Stool Routine & Occult Blood Examination (FOBT)</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Sputum for AFB / Gram Stain Examination</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>High Vaginal Swab (HVS) / Pap Smear Screen</span>
                    </label>
                    <label className="test-check-item">
                      <div className="test-checkbox-square"></div>
                      <span>Semen Analysis (WHO 2021 Reference Criteria)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* ===== SPECIAL CLINICAL INSTRUCTIONS & CUSTOM TESTS ===== */}
              <div className="directives-box">
                <div className="directives-label">
                  ADDITIONAL TESTS / SPECIAL CLINICAL INSTRUCTIONS / ATTENDING PHYSICIAN NOTES:
                </div>
                <div className="directives-ruled-line"></div>
              </div>

              {/* ===== PRIORITY, PHLEBOTOMY LOGISTICS & DUAL ATTESTATION ===== */}
              <div className="attestation-dual-row">
                
                {/* LEFT: PRIORITY & PHLEBOTOMY SPECIMEN ACKNOWLEDGMENT */}
                <div className="priority-phlebotomy-block">
                  <div className="priority-options-row">
                    <span className="priority-routine-pill">
                      [ ] Routine OPD (Same Day Digital Release)
                    </span>
                    <span className="priority-stat-pill">
                      [ ] STAT / CRITICAL ALERT (1-2 Hours Turnaround)
                    </span>
                    <span style={{ color: "#475569" }}>
                      [ ] Home Collection
                    </span>
                  </div>

                  <div className="phlebotomy-log-strip">
                    <span>
                      <strong>Phlebotomy Verification:</strong> Drawn By: ______________
                    </span>
                    <span>
                      Tubes: [ ] EDTA  [ ] SST  [ ] Citrate  [ ] Fluoride
                    </span>
                    <span>
                      Time: ________
                    </span>
                  </div>
                </div>

                {/* RIGHT: AUTHORIZING CLINICIAN SIGNATURE & FACILITY STAMP */}
                <div className="doctor-signature-block">
                  <div className="doctor-sign-area">
                    {doctor.signatureUrl ? (
                      <img src={doctor.signatureUrl} alt="Signature" className="doctor-sign-img" />
                    ) : (
                      <span style={{ fontSize: "8px", color: "#94A3B8", fontStyle: "italic" }}>
                        Clinician Signature & Clinic Stamp
                      </span>
                    )}
                  </div>
                  <div className="doctor-sign-title">Dr. {docName}</div>
                  <div className="doctor-sign-mci">
                    MCI/NMC: {regNumber} • DOC ID: {doctorCode}
                  </div>
                </div>
              </div>

              {/* ===== ACCREDITED LIGHT-WHITE CLINICAL FOOTER ===== */}
              <div className="slip-footer">
                <div className="footer-row">
                  <div className="footer-item">
                    <Shield className="w-2.5 h-2.5 text-sky-600" />
                    <span>NABL (ISO 15189:2022) Reference Lab</span>
                  </div>
                  <div className="footer-divider"></div>
                  <div className="footer-item">
                    <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                    <span>HIPAA & DISHA Compliant e-Requisition</span>
                  </div>
                  <div className="footer-divider"></div>
                  <div className="footer-item">
                    <Mail className="w-2.5 h-2.5 text-sky-600" />
                    <span>info@labcore.in</span>
                  </div>
                  <div className="footer-divider"></div>
                  <div className="footer-item">
                    <Phone className="w-2.5 h-2.5 text-sky-600" />
                    <span>+91 98765 43210</span>
                  </div>
                  <div className="footer-divider"></div>
                  <div className="footer-item">
                    <MapPin className="w-2.5 h-2.5 text-sky-600" />
                    <span>Ground Floor, Diagnostic Center</span>
                  </div>
                </div>

                <div className="footer-bottom">
                  <div className="footer-security">
                    Electronic Requisition Pad (TRF-A4) • Validated reports automatically dispatched via WhatsApp, Email & Clinician Portal upon senior pathologist authorization.
                  </div>
                  <div className="footer-page-index">
                    Page 1 of 1 • Single-Sheet Clinical Pad
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Modal Bottom Action Bar */}
          <div className="bg-white px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0 no-print">
            <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Accredited Clinical Requisition format ready for high-resolution print or PDF export • 1-Page A4 Standard</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Close Preview
              </button>

              <button
                type="button"
                onClick={() => openWhatsAppComposer("requisition_slip")}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Compose and dispatch WhatsApp message to Doctor"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Pad</span>
              </button>

              <button
                type="button"
                onClick={() => openEmailComposer("requisition_slip")}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Compose and dispatch Email to Doctor"
              >
                <Mail className="w-4 h-4" />
                <span>Email Pad</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={pdfGenerating}
                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {pdfGenerating ? <Loader2 className="w-4 h-4 animate-spin text-sky-600" /> : <Download className="w-4 h-4 text-sky-600" />}
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Requisition Pad</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* =======================================================
          DOCTOR WHATSAPP COMPOSER MODAL (WITH PDF ATTACHMENT)
          ======================================================= */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[94vh]">
            {/* Modal Header */}
            <div className="bg-white px-6 py-4 text-slate-900 border-b border-slate-200 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shadow-xs">
                  <MessageCircle className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Doctor WhatsApp Dispatcher</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Sending Official Requisition Slip & PDF to <span className="font-semibold text-slate-800">Dr. {docName}</span> ({doctorCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Template Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Doctor Clinical Template
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-medium">Language:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setWhatsappLanguage("en");
                        setWhatsappMessage(generateDoctorWhatsAppContent(whatsappTemplate, "en"));
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${whatsappLanguage === "en" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWhatsappLanguage("hi");
                        setWhatsappMessage(generateDoctorWhatsAppContent(whatsappTemplate, "hi"));
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${whatsappLanguage === "hi" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      HI
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWhatsappLanguage("gu");
                        setWhatsappMessage(generateDoctorWhatsAppContent(whatsappTemplate, "gu"));
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${whatsappLanguage === "gu" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      GU
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWhatsappTemplate("requisition_slip");
                      setWhatsappMessage(generateDoctorWhatsAppContent("requisition_slip", whatsappLanguage));
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      whatsappTemplate === "requisition_slip"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <FileText size={13} className="text-emerald-600" />
                      Requisition Pad
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">Official Slip & PDF</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWhatsappTemplate("portal_activation");
                      setWhatsappMessage(generateDoctorWhatsAppContent("portal_activation", whatsappLanguage));
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      whatsappTemplate === "portal_activation"
                        ? "border-teal-600 bg-teal-50 text-teal-900 shadow-xs ring-2 ring-teal-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Sparkles size={13} className="text-teal-600" />
                      Portal Login
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">Credentials & LIS</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWhatsappTemplate("test_directory");
                      setWhatsappMessage(generateDoctorWhatsAppContent("test_directory", whatsappLanguage));
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      whatsappTemplate === "test_directory"
                        ? "border-cyan-600 bg-cyan-50 text-cyan-900 shadow-xs ring-2 ring-cyan-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Stethoscope size={13} className="text-cyan-600" />
                      Test Directory
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">Profiles & Protocols</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWhatsappTemplate("commission_statement");
                      setWhatsappMessage(generateDoctorWhatsAppContent("commission_statement", whatsappLanguage));
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      whatsappTemplate === "commission_statement"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs ring-2 ring-indigo-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Award size={13} className="text-indigo-600" />
                      Statement
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">Referral Ledger</div>
                  </button>
                </div>
              </div>

              {/* Recipient Phone */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Doctor WhatsApp Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="e.g. 9723561529 or +91 9723561529"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* PDF Attachment Option */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">Attach Official Requisition Slip PDF</span>
                    <span className="text-[10px] text-emerald-700">{doctorSafeFilename}</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappAttachPdf}
                    onChange={(e) => setWhatsappAttachPdf(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Message Editor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Message Preview & Edit
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(whatsappMessage);
                      alert("Message copied to clipboard!");
                    }}
                    className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <Copy size={11} /> Copy Text
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl font-mono text-slate-800 focus:border-emerald-600 focus:outline-none leading-relaxed"
                />
              </div>

              {whatsappNotice && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                  {whatsappNotice}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendViaWebWhatsApp}
                  className="px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-xl transition-all cursor-pointer"
                >
                  Open in Web WhatsApp
                </button>

                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  disabled={whatsappSending}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {whatsappSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Send via API</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          DOCTOR EMAIL COMPOSER MODAL (WITH PDF ATTACHMENT)
          ======================================================= */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[94vh]">
            {/* Modal Header */}
            <div className="bg-white px-6 py-4 text-slate-900 border-b border-slate-200 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shadow-xs">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Doctor Email Dispatcher</h3>
                  <p className="text-xs text-sky-100 font-medium">
                    Sending Official Requisition Slip & PDF to <span className="font-semibold text-slate-800">Dr. {docName}</span> ({doctorCode})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSmtpConfig(!showSmtpConfig)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    showSmtpConfig ? "bg-white text-blue-900 shadow-sm" : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                  title="Configure SMTP / Gmail App Password"
                >
                  <Key size={13} />
                  <span>SMTP Setup</span>
                </button>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* SMTP Inline Config */}
              {showSmtpConfig && (
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-sky-600" />
                      Gmail App Password Configuration
                    </span>
                    <span className="text-[10px] text-sky-700">Host: smtp.gmail.com:587</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={smtpPasswordInput}
                      onChange={(e) => setSmtpPasswordInput(e.target.value)}
                      placeholder="Enter 16-character Gmail App Password"
                      className="flex-1 px-3 py-1.5 text-xs border border-sky-300 rounded-lg font-mono focus:border-sky-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleTestAndSaveSmtp}
                      disabled={smtpTesting}
                      className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {smtpTesting ? <Loader2 size={12} className="animate-spin" /> : "Verify & Save"}
                    </button>
                  </div>
                  {smtpTestStatus && (
                    <p className={`text-xs ${smtpTestStatus.success ? "text-emerald-700" : "text-red-600"}`}>
                      {smtpTestStatus.message}
                    </p>
                  )}
                </div>
              )}

              {/* Template Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Doctor Clinical Template
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Formal Correspondence</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailTemplate("requisition_slip");
                      generateDoctorEmailContent("requisition_slip");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      emailTemplate === "requisition_slip"
                        ? "border-sky-600 bg-sky-50 text-sky-900 shadow-xs ring-2 ring-sky-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <FileText size={13} className="text-sky-600" />
                      Requisition Pad
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">Attached PDF & Credentials</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmailTemplate("portal_activation");
                      generateDoctorEmailContent("portal_activation");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      emailTemplate === "portal_activation"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs ring-2 ring-indigo-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Sparkles size={13} className="text-indigo-600" />
                      Portal Onboarding
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">LIS Portal Credentials</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmailTemplate("test_directory");
                      generateDoctorEmailContent("test_directory");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      emailTemplate === "test_directory"
                        ? "border-teal-600 bg-teal-50 text-teal-900 shadow-xs ring-2 ring-teal-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Stethoscope size={13} className="text-teal-600" />
                      Test Catalog
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">Protocols & Directory</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmailTemplate("commission_statement");
                      generateDoctorEmailContent("commission_statement");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      emailTemplate === "commission_statement"
                        ? "border-purple-600 bg-purple-50 text-purple-900 shadow-xs ring-2 ring-purple-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Award size={13} className="text-purple-600" />
                      Statement
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">Monthly Ledger</div>
                  </button>
                </div>
              </div>

              {/* Recipient Email & Subject */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Doctor Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="e.g. doctor@hospital.com"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-sky-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium focus:border-sky-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* PDF Attachment Option */}
              <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-sky-600" />
                  <div>
                    <span className="text-xs font-bold text-sky-950 block">Attach Official Requisition Slip PDF</span>
                    <span className="text-[10px] text-sky-700">{doctorSafeFilename}</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailAttachPdf}
                    onChange={(e) => setEmailAttachPdf(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              {/* Message Editor */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Email Body
                </label>
                <textarea
                  rows={8}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl font-mono text-slate-800 focus:border-sky-600 focus:outline-none leading-relaxed"
                />
              </div>

              {emailNotice && (
                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-800">
                  {emailNotice}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendViaWebGmail}
                  className="px-3.5 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50 border border-sky-200 rounded-xl transition-all cursor-pointer"
                >
                  Open Web Gmail
                </button>

                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={emailSending}
                  className="flex items-center gap-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {emailSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Send via API</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
