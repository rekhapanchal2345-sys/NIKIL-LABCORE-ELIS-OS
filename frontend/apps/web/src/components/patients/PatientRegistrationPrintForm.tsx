"use client";

import React, { useRef, useEffect, useState } from "react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Printer,
  X,
  Phone,
  Mail,
  Shield,
  User,
  MapPin,
  Heart,
  MessageCircle,
  Calendar,
  CreditCard,
  Globe,
  CheckCircle,
  FileText,
  Send,
  Loader2,
  ExternalLink,
  Sparkles,
  Paperclip,
  Check,
  Download,
  FileCheck,
  AlertCircle,
  Eye,
  Key,
  Copy,
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Share2,
  Smartphone,
  History,
  Languages,
  CheckCheck,
  Clock,
} from "lucide-react";
import { communicationApi } from "@/lib/api";

// =======================================================
// CSS VARIABLES & PERFECT A4 LAYOUT (ZERO CLIPPING & BALANCED SPACING)
// =======================================================

const printFormStyles = `
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

  .print-form-page {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: #F1F5F9;
    color: var(--color-clinic-text-main);
    line-height: 1.3;
    padding: 16px 0;
    margin: 0;
    width: 100%;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
  }

  .print-form-container {
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

  /* ===== LIGHT-WHITE HOSPITAL HEADER ===== */
  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 18px 10px 18px;
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
    width: 40px;
    height: 40px;
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
    width: 22px;
    height: 22px;
    color: var(--color-clinic-blue);
    stroke: var(--color-clinic-blue);
  }

  .brand-title {
    font-size: 19px;
    font-weight: 900;
    color: var(--color-clinic-slate);
    line-height: 1.1;
    letter-spacing: -0.4px;
  }

  .brand-title span {
    color: var(--color-clinic-blue);
  }

  .brand-tagline {
    font-size: 8.5px;
    color: var(--color-clinic-text-muted);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-top: 1px;
  }

  .brand-accreditation {
    font-size: 8px;
    color: var(--color-clinic-teal);
    font-weight: 700;
    letter-spacing: 0.4px;
    margin-top: 1px;
  }

  .header-center {
    text-align: center;
    flex: 1;
    padding: 0 10px;
  }

  .form-title {
    font-size: 19px;
    font-weight: 900;
    color: var(--color-clinic-slate);
    text-transform: uppercase;
    letter-spacing: 1px;
    line-height: 1.15;
    margin: 0;
  }

  .form-subtitle {
    font-size: 9.5px;
    color: var(--color-clinic-text-muted);
    font-weight: 600;
    margin-top: 2px;
  }

  .form-dossier-tag {
    display: inline-block;
    font-size: 8px;
    font-weight: 700;
    color: var(--color-clinic-blue-dark);
    background: var(--color-clinic-blue-light);
    border: 1px solid #BAE6FD;
    padding: 1px 7px;
    border-radius: 10px;
    margin-top: 3px;
    letter-spacing: 0.5px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .qr-box {
    width: 52px;
    height: 52px;
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
    width: 48px;
    height: 48px;
    display: block;
    object-fit: contain;
  }

  .qr-fallback {
    font-size: 8px;
    color: var(--color-clinic-text-muted);
    text-align: center;
  }

  .header-id-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  .uhid-pill {
    background: #F8FAFC;
    border: 1.5px solid var(--color-clinic-border-strong);
    border-radius: 6px;
    padding: 2px 7px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .uhid-label {
    font-size: 8.5px;
    font-weight: 800;
    color: var(--color-clinic-text-muted);
    text-transform: uppercase;
  }

  .uhid-val {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
    font-weight: 800;
    color: var(--color-clinic-blue-dark);
    letter-spacing: 0.5px;
  }

  .datetime-stamp {
    font-size: 8.5px;
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

  /* ===== FORM BODY ===== */
  .form-body {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 0;
    padding: 0;
  }

  .form-section {
    padding: 8px 18px;
    border-bottom: 1px solid var(--color-clinic-border);
    background: #FFFFFF;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .section-badge {
    background: var(--color-clinic-slate);
    color: #FFFFFF;
    font-size: 9px;
    font-weight: 800;
    padding: 1.5px 6px;
    border-radius: 4px;
    letter-spacing: 0.5px;
    flex-shrink: 0;
    line-height: 1.3;
  }

  .section-title {
    font-size: 11px;
    font-weight: 800;
    color: var(--color-clinic-slate);
    text-transform: uppercase;
    letter-spacing: 0.7px;
    line-height: 1;
  }

  .section-header-rule {
    flex: 1;
    height: 1px;
    background: var(--color-clinic-border);
    margin-left: 6px;
  }

  /* ===== DUAL SECTION (SIDE BY SIDE 50/50) ===== */
  .dual-section-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid var(--color-clinic-border);
    background: #FFFFFF;
    width: 100%;
  }

  .dual-section-left {
    padding: 8px 16px 8px 18px;
    border-right: 1px solid var(--color-clinic-border);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  .dual-section-right {
    padding: 8px 18px 8px 16px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  /* ===== GRIDS & FIELDS ===== */
  .grid-4-col {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px 14px;
    width: 100%;
  }

  .grid-3-col {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px 14px;
    width: 100%;
  }

  .grid-2-col {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px 14px;
    width: 100%;
  }

  .col-span-2 {
    grid-column: span 2;
  }

  .col-span-3 {
    grid-column: span 3;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    min-width: 0;
    width: 100%;
    overflow: visible;
  }

  .field-label {
    font-size: 8.5px;
    font-weight: 700;
    color: var(--color-clinic-text-muted);
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    gap: 3.5px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    overflow: visible !important;
    line-height: 1.2;
    min-height: 13px;
  }

  .field-required {
    color: var(--color-clinic-red);
    font-weight: 800;
    margin-left: 1px;
  }

  .field-icon {
    width: 10px;
    height: 10px;
    color: var(--color-clinic-blue);
    flex-shrink: 0;
    display: inline-block;
  }

  .field-value {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-clinic-text-main);
    padding-bottom: 2px;
    border-bottom: 1px solid var(--color-clinic-border-strong);
    min-height: 19px;
    line-height: 1.25;
    display: flex;
    align-items: center;
    white-space: nowrap;
    overflow: visible !important;
    width: 100%;
  }

  .field-value.empty {
    color: #94A3B8;
    font-weight: 500;
  }

  /* Inline email badges */
  .email-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 2.5px;
    padding: 1px 5px;
    background: #DCFCE7;
    color: #15803D;
    border-radius: 10px;
    font-size: 7.5px;
    font-weight: 700;
    margin-left: 4px;
    text-transform: none;
  }

  .email-quick-action {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 1px 6px;
    background: #EFF6FF;
    color: #2563EB;
    border: 1px solid #BFDBFE;
    border-radius: 4px;
    font-size: 8.5px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
    margin-left: auto;
  }

  .email-quick-action:hover {
    background: #2563EB;
    color: white;
  }

  /* ===== PREFERENCES & CONSENT ===== */
  .preferences-row {
    display: grid;
    grid-template-columns: 1fr 1fr 2fr;
    gap: 8px 14px;
    align-items: end;
    width: 100%;
  }

  .notification-list {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-bottom: 2px;
    min-height: 19px;
    width: 100%;
  }

  .notification-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 9.5px;
    font-weight: 600;
    color: var(--color-clinic-text-main);
    white-space: nowrap;
  }

  .notification-checkbox {
    width: 13px;
    height: 13px;
    border: 1.5px solid var(--color-clinic-border-strong);
    border-radius: 3px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 8.5px;
    font-weight: 800;
    line-height: 1;
    flex-shrink: 0;
  }

  .notification-checkbox.checked {
    background: var(--color-clinic-blue);
    border-color: var(--color-clinic-blue);
    color: #FFFFFF;
  }

  .notification-checkbox.unchecked {
    background: #FFFFFF;
    border-color: var(--color-clinic-border-strong);
    color: transparent;
  }

  .consent-box {
    background: #F0FDF4;
    border: 1px solid #BBF7D0;
    border-radius: 5px;
    padding: 5px 10px;
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    box-sizing: border-box;
  }

  .consent-checkbox {
    width: 14px;
    height: 14px;
    border: 1.5px solid var(--color-clinic-green);
    background: var(--color-clinic-green);
    color: #FFFFFF;
    border-radius: 3px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 800;
    line-height: 1;
    flex-shrink: 0;
  }

  .consent-checkbox.unchecked {
    background: #FFFFFF;
    border-color: var(--color-clinic-border-strong);
    color: transparent;
  }

  .consent-text {
    font-size: 8.5px;
    color: #166534;
    line-height: 1.3;
    font-weight: 600;
  }

  /* ===== DUAL SIGNATURE & STAMP SECTION ===== */
  .signature-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    padding: 10px 18px 8px 18px;
    background: #FFFFFF;
    box-sizing: border-box;
    flex-shrink: 0;
    width: 100%;
    border-bottom: 1px solid var(--color-clinic-border);
  }

  .signature-card {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 100%;
  }

  .signature-title {
    font-size: 8.5px;
    font-weight: 800;
    color: var(--color-clinic-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  .signature-statement {
    font-size: 8px;
    color: #64748B;
    line-height: 1.25;
    font-style: italic;
    min-height: 20px;
  }

  .signature-draw-area {
    height: 28px;
    border-bottom: 1.5px solid var(--color-clinic-slate);
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding-bottom: 2px;
    width: 100%;
  }

  .signature-meta {
    font-size: 9px;
    font-weight: 600;
    color: var(--color-clinic-text-main);
  }

  .stamp-box-inline {
    border: 1px dashed var(--color-clinic-border-strong);
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 7.5px;
    font-weight: 700;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* ===== LIGHT-WHITE CLINICAL FOOTER ===== */
  .footer {
    background: #F8FAFC;
    border-top: 1.5px solid var(--color-clinic-border-strong);
    padding: 8px 18px;
    color: var(--color-clinic-slate);
    box-sizing: border-box;
    flex-shrink: 0;
    width: 100%;
  }

  .footer-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--color-clinic-border);
  }

  .footer-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 8.5px;
    font-weight: 600;
    color: #475569;
  }

  .footer-icon {
    width: 11px;
    height: 11px;
    color: var(--color-clinic-blue);
    flex-shrink: 0;
  }

  .footer-divider {
    width: 1px;
    height: 11px;
    background: var(--color-clinic-border-strong);
  }

  .footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 4px;
    width: 100%;
  }

  .footer-security {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 8px;
    color: #64748B;
    font-weight: 500;
  }

  .footer-page-index {
    font-size: 8px;
    font-weight: 700;
    color: var(--color-clinic-blue-dark);
    letter-spacing: 0.4px;
  }

  /* ===== ON-SCREEN ACTION BAR ===== */
  .action-buttons {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: #FFFFFF;
    border-top: 1px solid var(--color-clinic-border);
    width: 100%;
    box-sizing: border-box;
  }

  .btn {
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .btn-secondary {
    background: #FFFFFF;
    color: var(--color-clinic-slate);
    border: 1px solid var(--color-clinic-border-strong);
  }

  .btn-secondary:hover {
    background: #F8FAFC;
    border-color: #94A3B8;
  }

  .btn-whatsapp {
    background: #059669;
    color: #FFFFFF;
  }

  .btn-whatsapp:hover {
    background: #047857;
    box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);
    transform: translateY(-1px);
  }

  .btn-email {
    background: var(--color-clinic-blue);
    color: #FFFFFF;
  }

  .btn-email:hover {
    background: var(--color-clinic-blue-dark);
    box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);
    transform: translateY(-1px);
  }

  .btn-primary {
    background: var(--color-clinic-slate);
    color: #FFFFFF;
  }

  .btn-primary:hover {
    background: #1E293B;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.2);
    transform: translateY(-1px);
  }

  /* ===== EXACT 1-PAGE A4 PRINT SPECIFICATION ===== */
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

    .no-print,
    .action-buttons,
    .print-button,
    .email-header-button,
    .whatsapp-header-button,
    .email-quick-action,
    .email-status-pill {
      display: none !important;
    }

    aside,
    nav,
    header:not(.form-header),
    [class*="sidebar"],
    [class*="Sidebar"],
    div[class*="fixed"][class*="inset-0"] > div > div[class*="bg-gradient"] {
      display: none !important;
    }

    .fixed.inset-0,
    div[class*="fixed"][class*="inset-0"] {
      position: static !important;
      background: transparent !important;
      padding: 0 !important;
      margin: 0 !important;
      display: block !important;
      width: 100% !important;
    }

    .fixed.inset-0 > div,
    div[class*="fixed"][class*="inset-0"] > div {
      position: static !important;
      max-width: 100% !important;
      width: 100% !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #FFFFFF !important;
    }

    .print-form-page {
      padding: 0 !important;
      margin: 0 !important;
      background: #FFFFFF !important;
      width: 100% !important;
      display: block !important;
    }

    .print-form-container {
      max-width: 100% !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
      display: block !important;
      background: #FFFFFF !important;
    }

    .form-body {
      display: block !important;
      width: 100% !important;
    }

    .form-section,
    .dual-section-row,
    .signature-section,
    .footer {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      width: 100% !important;
    }
  }
`;

// =======================================================
// TYPES
// =======================================================

export interface PatientFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  maritalStatus: string;
  nationality: string;
  patientType: string;
  additionalInformation: string;

  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;

  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  emergencyContactAddress: string;

  allergies: string;
  medicalConditions: string;
  currentMedications: string;
  insuranceProvider: string;
  insuranceNumber: string;
  insuranceGroupNumber: string;
  insuranceExpiryDate: string;

  preferredLanguage: string;
  preferredCommunicationMethod: string;
  notificationPreferences: string[];
  privacyConsent: boolean;
  corporateId?: string;
}

interface PatientRegistrationPrintFormProps {
  patientData?: PatientFormData;
  patientId?: string;
  labInfo?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  onClose?: () => void;
  onSave?: (data: PatientFormData) => Promise<void>;
  onSendEmail?: (emailData: any) => Promise<void>;
  onSendWhatsApp?: (whatsAppData: any) => Promise<void>;
  autoOpenModal?: "whatsapp" | "email" | null;
}

// =======================================================
// UTILITY FUNCTIONS
// =======================================================

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

function formatDisplayValue(value?: any): string {
  if (value === null || value === undefined || value === "" || value === "null" || value === "undefined") return "—";
  if (typeof value === "object") {
    if (value.name) return String(value.name);
    if (value.label) return String(value.label);
    if (value.title) return String(value.title);
    return "—";
  }
  return String(value);
}

function formatBloodGroupDisplay(bloodGroup?: string | null): string {
  if (!bloodGroup) return "—";
  const bloodGroupMap: { [key: string]: string } = {
    A_POSITIVE: "A+",
    A_NEGATIVE: "A-",
    B_POSITIVE: "B+",
    B_NEGATIVE: "B-",
    AB_POSITIVE: "AB+",
    AB_NEGATIVE: "AB-",
    O_POSITIVE: "O+",
    O_NEGATIVE: "O-",
  };
  return bloodGroupMap[bloodGroup] || bloodGroup;
}

// =======================================================
// MAIN COMPONENT
// =======================================================

export default function PatientRegistrationPrintForm({
  patientData,
  patientId,
  labInfo,
  onClose,
  onSave,
  onSendEmail,
  onSendWhatsApp,
  autoOpenModal,
}: PatientRegistrationPrintFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrCodeError, setQrCodeError] = useState(false);

  // Advanced View Modes & Multilingual State
  const [whatsappActiveTab, setWhatsappActiveTab] = useState<"editor" | "preview" | "history">("editor");
  const [emailActiveTab, setEmailActiveTab] = useState<"editor" | "preview" | "history">("editor");
  const [whatsappLanguage, setWhatsappLanguage] = useState<"en" | "hi" | "gu">("en");
  const [emailLanguage, setEmailLanguage] = useState<"en" | "hi" | "gu">("en");

  // Communication Delivery Tracking & History Logs State
  const [commLogs, setCommLogs] = useState<any[]>([]);
  const [loadingCommLogs, setLoadingCommLogs] = useState(false);
  const [recipientMode, setRecipientMode] = useState<"patient" | "emergency" | "custom">("patient");

  // Advanced WhatsApp Composer Modal State with Attached / Hosted PDF
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [whatsappTemplate, setWhatsappTemplate] = useState<"registration" | "welcome" | "test_instructions" | "summary">("registration");
  const [whatsappAttachPdf, setWhatsappAttachPdf] = useState(true);
  const [hostedPdfUrl, setHostedPdfUrl] = useState<string | null>(null);
  const [pdfHosting, setPdfHosting] = useState(false);
  const [whatsappSending, setWhatsappSending] = useState(false);
  const [whatsappSentSuccess, setWhatsappSentSuccess] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [whatsappStatusNotice, setWhatsappStatusNotice] = useState<string | null>(null);
  const [whatsappCopiedNotice, setWhatsappCopiedNotice] = useState(false);
  const [whatsappLinkCopiedNotice, setWhatsappLinkCopiedNotice] = useState(false);

  // WhatsApp API / Twilio inline configuration state
  const [showWhatsAppConfig, setShowWhatsAppConfig] = useState(false);
  const [whatsappProviderInput, setWhatsappProviderInput] = useState("twilio");
  const [whatsappApiKeyInput, setWhatsappApiKeyInput] = useState("");
  const [whatsappApiSecretInput, setWhatsappApiSecretInput] = useState("");
  const [whatsappSenderIdInput, setWhatsappSenderIdInput] = useState("whatsapp:+14155238886");
  const [whatsappTesting, setWhatsappTesting] = useState(false);
  const [whatsappTestStatus, setWhatsappTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Email Composer Modal State with Attached PDF
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailCc, setEmailCc] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailTemplate, setEmailTemplate] = useState<"registration" | "welcome" | "test_instructions" | "summary">("registration");
  const [attachPdf, setAttachPdf] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // SMTP Settings & Gmail App Password configuration state
  const [showSmtpConfig, setShowSmtpConfig] = useState(false);
  const [smtpPasswordInput, setSmtpPasswordInput] = useState("");
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestStatus, setSmtpTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const [formData, setFormData] = useState<PatientFormData>(
    patientData || {
      firstName: "",
      middleName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      bloodGroup: "",
      maritalStatus: "",
      nationality: "Indian",
      patientType: "Outpatient",
      additionalInformation: "",

      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",

      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      emergencyContactAddress: "",

      allergies: "",
      medicalConditions: "",
      currentMedications: "",
      insuranceProvider: "",
      insuranceNumber: "",
      insuranceGroupNumber: "",
      insuranceExpiryDate: "",

      preferredLanguage: "English",
      preferredCommunicationMethod: "Phone",
      notificationPreferences: [],
      privacyConsent: false,
    }
  );

  useEffect(() => {
    if (patientData) {
      setFormData((prev) => ({ ...prev, ...patientData }));
    }
  }, [patientData]);

  useEffect(() => {
    let isMounted = true;
    const generateQR = async () => {
      try {
        const qrData = patientId ? `PAT-${patientId.slice(0, 8)}` : `PAT-${Date.now()}`;
        const dataUrl = await QRCode.toDataURL(qrData, {
          width: 70,
          margin: 0,
          color: {
            dark: "#0B1F44",
            light: "#FFFFFF",
          },
        });
        if (isMounted) setQrCodeDataUrl(dataUrl);
      } catch (error) {
        console.error("Error generating QR code:", error);
        if (isMounted) setQrCodeError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    generateQR();
    return () => {
      isMounted = false;
    };
  }, [patientId]);

  useEffect(() => {
    if (autoOpenModal === "whatsapp") {
      openWhatsAppComposer("registration");
    } else if (autoOpenModal === "email") {
      openEmailComposer("registration");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenModal]);

  // Fetch communication history for patient
  const fetchCommunicationLogs = async () => {
    const effectivePatientId = patientId || formData.phone || "PAT-REG";
    setLoadingCommLogs(true);
    try {
      const res = await communicationApi.getHistory(effectivePatientId);
      if (res && res.success && res.data?.communications) {
        setCommLogs(res.data.communications);
      } else {
        setCommLogs([]);
      }
    } catch (e) {
      console.warn("Could not fetch communication history:", e);
      setCommLogs([]);
    } finally {
      setLoadingCommLogs(false);
    }
  };

  const laboratoryInfo = {
    name: labInfo?.name || "LabCore ELIS Laboratory Information System",
    address: labInfo?.address || "123 Health Avenue, Medical District, Ahmedabad, Gujarat - 380016, India",
    phone: labInfo?.phone || "+91 98765 43210",
    email: labInfo?.email || "info@labcore.in",
    website: labInfo?.website || "www.labcore.in",
  };

  // Helper to insert live patient variables into message text
  const insertVariable = (variableKey: string, target: "whatsapp" | "email") => {
    let valueToInsert = "";
    switch (variableKey) {
      case "patientName":
        valueToInsert = patientFullName;
        break;
      case "uhid":
        valueToInsert = patientId ? `PAT-${patientId.slice(0, 8)}` : "PAT-REG";
        break;
      case "bloodGroup":
        valueToInsert = formatBloodGroupDisplay(formData.bloodGroup);
        break;
      case "phone":
        valueToInsert = formData.phone || "N/A";
        break;
      case "datetime":
        valueToInsert = `${dt.date} at ${dt.time}`;
        break;
      case "helpline":
        valueToInsert = laboratoryInfo.phone;
        break;
      case "address":
        valueToInsert = laboratoryInfo.address;
        break;
      case "emergency":
        valueToInsert = `${formData.emergencyContactName || "N/A"} (${formData.emergencyContactPhone || "N/A"})`;
        break;
      case "pdfLink":
        valueToInsert = hostedPdfUrl || "[Registration Form PDF Link]";
        break;
      default:
        valueToInsert = "";
    }

    if (target === "whatsapp") {
      setWhatsappMessage((prev) => prev ? `${prev} ${valueToInsert}` : valueToInsert);
    } else {
      setEmailBody((prev) => prev ? `${prev} ${valueToInsert}` : valueToInsert);
    }
  };

  const generateQRCode = async () => {
    try {
      const qrData = patientId ? `PAT-${patientId.slice(0, 8)}` : `PAT-${Date.now()}`;
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 70,
        margin: 0,
        color: {
          dark: "#0B1F44",
          light: "#FFFFFF",
        },
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
      setQrCodeError(true);
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return {
      date: now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const dt = getCurrentDateTime();
  const patientFullName = `${formData.firstName} ${formData.middleName ? formData.middleName + " " : ""}${formData.lastName}`.trim() || "Patient";
  const patientSafeFilename = `Patient_Registration_Form_${patientFullName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

  // High-Resolution PDF Generator with exact aspect ratio & zero label slicing
  const generateFormPdfBase64 = async (): Promise<string | null> => {
    if (!formRef.current) return null;
    setPdfGenerating(true);
    try {
      const formElement = formRef.current;

      const canvas = await html2canvas(formElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 794, // Standard A4 width at 96 DPI
        onclone: (clonedDoc) => {
          const container = clonedDoc.querySelector(".print-form-container") as HTMLElement;
          if (container) {
            container.style.border = "none";
            container.style.boxShadow = "none";
            container.style.margin = "0";
            container.style.width = "794px";
            container.style.maxWidth = "794px";
          }
          // Fix html2canvas label clipping: ensure labels and values are fully unconstrained
          const allLabels = clonedDoc.querySelectorAll(".field-label, .field-value");
          allLabels.forEach((el: any) => {
            el.style.overflow = "visible";
            el.style.textOverflow = "clip";
            el.style.lineHeight = "1.3";
          });
          const formBody = clonedDoc.querySelector(".form-body") as HTMLElement;
          if (formBody) {
            formBody.style.justifyContent = "flex-start";
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
      // Calculate true proportional height to prevent vertical stretching and gaps
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight));

      const pdfDataUri = pdf.output("datauristring");
      const base64Data = pdfDataUri.split(",")[1];
      setPdfBase64(base64Data);
      return base64Data;
    } catch (err) {
      console.error("Failed to generate PDF for attachment:", err);
      return null;
    } finally {
      setPdfGenerating(false);
    }
  };

  // Direct PDF Download
  const handleDownloadPdf = async () => {
    if (!formRef.current) return;
    setPdfGenerating(true);
    try {
      const formElement = formRef.current;

      const canvas = await html2canvas(formElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 794,
        onclone: (clonedDoc) => {
          const container = clonedDoc.querySelector(".print-form-container") as HTMLElement;
          if (container) {
            container.style.border = "none";
            container.style.boxShadow = "none";
            container.style.margin = "0";
            container.style.width = "794px";
            container.style.maxWidth = "794px";
          }
          const allLabels = clonedDoc.querySelectorAll(".field-label, .field-value");
          allLabels.forEach((el: any) => {
            el.style.overflow = "visible";
            el.style.textOverflow = "clip";
            el.style.lineHeight = "1.3";
          });
          const formBody = clonedDoc.querySelector(".form-body") as HTMLElement;
          if (formBody) {
            formBody.style.justifyContent = "flex-start";
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
      pdf.save(patientSafeFilename);
    } catch (err) {
      console.error("Error downloading PDF:", err);
    } finally {
      setPdfGenerating(false);
    }
  };

  // Helper to normalize Indian and international WhatsApp phone numbers
  const normalizePhoneNumber = (rawPhone: string) => {
    let clean = (rawPhone || "").replace(/\D/g, "");
    if (clean.startsWith("0")) clean = clean.substring(1);
    if (clean.length === 10) clean = `91${clean}`;
    return clean;
  };

  // Advanced clinical WhatsApp templates generator with rich Markdown and Multilingual formatting
  const generateWhatsAppTemplateContent = (
    template: "registration" | "welcome" | "test_instructions" | "summary",
    patientName: string,
    phoneNum: string,
    existingHostedUrl?: string | null,
    lang: "en" | "hi" | "gu" = whatsappLanguage
  ) => {
    const pdfUrl = existingHostedUrl || hostedPdfUrl;
    
    // Multi-lingual PDF attachment label
    let pdfAttachmentSection = "";
    if (lang === "hi") {
      pdfAttachmentSection = pdfUrl
        ? `\n📄 *आधिकारिक पंजीकरण फॉर्म (PDF डाउनलोड करें):*\n${pdfUrl}\n`
        : `\n📄 *आधिकारिक पंजीकरण फॉर्म (PDF):* [लिंक तैयार हो रहा है...]\n`;
    } else if (lang === "gu") {
      pdfAttachmentSection = pdfUrl
        ? `\n📄 *સત્તાવાર દર્દી નોંધણી ફોર્મ (PDF ડાઉનલોડ):*\n${pdfUrl}\n`
        : `\n📄 *સત્તાવાર દર્દી નોંધણી ફોર્મ (PDF):* [લિંક તૈયાર થઈ રહી છે...]\n`;
    } else {
      pdfAttachmentSection = pdfUrl
        ? `\n📄 *Official Patient Registration Form (Download PDF):*\n${pdfUrl}\n`
        : `\n📄 *Official Patient Registration Form (PDF):* [Link generating...]\n`;
    }

    if (lang === "hi") {
      if (template === "welcome") {
        setWhatsappMessage(
          `🏥 *${laboratoryInfo.name.toUpperCase()}*\n` +
          `_एनबीएल एवं सीएपी मान्यता प्राप्त संदर्भ प्रयोगशाला | ISO 15189:2022_\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🌟 *मरीज़ डिजिटल स्वास्थ्य खाता (EHR) सक्रियण सूचना*\n\n` +
          `आदरणीय *${patientName}*,\n\n` +
          `*${laboratoryInfo.name}* में आपका स्वागत है। आपका इलेक्ट्रॉनिक स्वास्थ्य खाता LIS प्रणाली में ${dt.date} को ${dt.time} बजे आधिकारिक रूप से सक्रिय कर दिया गया है।\n\n` +
          `📋 *मरीज़ पंजीकरण एवं पहचान सारांश:*\n` +
          `• *मरीज़ का नाम:* ${patientName}\n` +
          `• *यूनिवर्सल हेल्थ आईडी (UHID):* ${patientId ? `PAT-${patientId.slice(0, 8)}` : "PAT-REG"}\n` +
          `• *पंजीकृत मोबाइल:* ${formData.phone || phoneNum || "N/A"}\n` +
          `• *रक्त समूह:* ${formatBloodGroupDisplay(formData.bloodGroup)}\n` +
          `• *खाता स्थिति:* सक्रिय व क्लिनिकली सत्यापित\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          pdfAttachmentSection +
          `\n✨ *डिजिटल पोर्टल की मुख्य सुविधाएं:*\n` +
          `1️⃣ *रियल-टाइम ट्रैकिंग:* सैंपल की बारकोड प्रोसेसिंग से लेकर पैथोलॉजिस्ट सत्यापन तक की स्थिति देखें।\n` +
          `2️⃣ *आजीवन रिकॉर्ड अभिलेखागार:* अपने पिछले सभी पैथोलॉजी व रेडियोलॉजी रिपोर्ट्स 24/7 सुरक्षित डाउनलोड करें।\n` +
          `3️⃣ *डिजिटल जीएसटी बिलिंग:* बीमा व टैक्स दावों के लिए प्रमाणित इनवॉइस डाउनलोड करें।\n` +
          `4️⃣ *प्राथमिकता सेवा:* क्यूआर कोड द्वारा त्वरित सैंपल संग्रहण।\n\n` +
          `🔒 *गोपनीयता:* 256-बिट एसएसएल एन्क्रिप्शन एवं DISHA/HIPAA मानकों द्वारा सुरक्षित।\n\n` +
          `📞 *24/7 मरीज़ सहायता डेस्क:* ${laboratoryInfo.phone}\n` +
          `📍 *मुख्य सुविधा केंद्र:* ${laboratoryInfo.address}\n\n` +
          `_सटीक निदान • विश्वसनीय चिकित्सा सेवा • LabCore ELIS_`
        );
      } else if (template === "test_instructions") {
        setWhatsappMessage(
          `🏥 *${laboratoryInfo.name.toUpperCase()}*\n` +
          `_गुणवत्ता आश्वासन प्रभाग एवं क्लिनिकल पैथोलॉजी विभाग_\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🧪 *क्लिनिकल प्रोटोकॉल: जांच-पूर्व उपवास व तैयारी निर्देश*\n\n` +
          `आदरणीय *${patientName}*,\n\n` +
          `अपनी आगामी नैदानिक जांचों (UHID: *${patientId ? `PAT-${patientId.slice(0, 8)}` : "PAT-REG"}*) में पूर्ण सटीक परिणाम सुनिश्चित करने हेतु कृपया इन नियमों का कड़ाई से पालन करें:\n\n` +
          `⚠️ *अनिवार्य पूर्व-विश्लेषणात्मक दिशानिर्देश:*\n` +
          `1️⃣ *उपवास (10 से 12 घंटे):* फास्टिंग ब्लड शुगर, लिपिड प्रोफाइल, LFT व मेटाबॉलिक प्रोफाइल हेतु 10–12 घंटे का पूर्ण उपवास अनिवार्य है।\n` +
          `2️⃣ *तरल पदार्थ:* नसों के सुचारू रक्त प्रवाह हेतु सादा जल पीना अनुशंसित है। चाय, कॉफी, दूध, जूस या धूम्रपान पूर्णतः वर्जित है।\n` +
          `3️⃣ *दवाइयों का नियम:* अपनी नियमित दवाएं (रक्तचाप, हृदय रोग) सादे पानी के साथ जारी रखें, जब तक डॉक्टर ने रोकने को न कहा हो।\n` +
          `4️⃣ *विशेष जांच:* थायरॉइड (TSH) की दवा सैंपल देने के बाद लें। डायबिटीज़ की सुबह की दवा/इंसुलिन सैंपल व नाश्ते के बाद ही लें।\n` +
          `5️⃣ *समय:* लैब में निर्धारित समय से 10–15 मिनट पूर्व पहुंचें, या होम कलेक्शन हेतु पता तैयार रखें।\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          pdfAttachmentSection +
          `\n📞 *फ्लेबोटोमी कोऑर्डिनेटर:* ${laboratoryInfo.phone}\n` +
          `_उचित पूर्व-तैयारी सैंपल पुनर्संग्रहण की आवश्यकता को समाप्त करती है._`
        );
      } else if (template === "summary") {
        setWhatsappMessage(
          `🏥 *${laboratoryInfo.name.toUpperCase()}*\n` +
          `_अस्पताल प्रशासन एवं मरीज़ प्रवेश प्रभाग_\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🧾 *सत्यापित मरीज़ पंजीकरण विवरण व आधिकारिक सारांश*\n\n` +
          `आदरणीय *${patientName}*,\n\n` +
          `*${laboratoryInfo.name}* में आपका मरीज़ पंजीकरण सफलता से सत्यापित व अभिलेखित हो चुका है:\n\n` +
          `📋 *मरीज़ प्रोफाइल विवरण:*\n` +
          `• *मरीज़ का नाम:* ${patientName}\n` +
          `• *UHID नंबर:* ${patientId ? `PAT-${patientId.slice(0, 8)}` : "PAT-REG"}\n` +
          `• *जन्म तिथि व लिंग:* ${formatDate(formData.dateOfBirth)} (${formData.gender || "N/A"})\n` +
          `• *रक्त समूह (Blood Group):* ${formatBloodGroupDisplay(formData.bloodGroup)}\n` +
          `• *पंजीकृत मोबाइल:* ${formData.phone || phoneNum || "N/A"}\n` +
          `• *आपातकालीन संपर्क:* ${formData.emergencyContactName || "N/A"} (${formData.emergencyContactPhone || "N/A"})\n` +
          `• *बीमा / टीपीए संदर्भ:* ${formData.insuranceProvider || "Direct Outpatient"}\n` +
          `• *पंजीकरण समय:* ${dt.date} • ${dt.time}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          pdfAttachmentSection +
          `\n🔒 *प्रमाणीकरण:* अधिकृत 1-पृष्ठीय क्लिनिकल फॉर्म पीडीएफ आपके रिकॉर्ड हेतु संलग्न है।\n\n` +
          `📞 *हेल्पलाइन व पूछताछ:* ${laboratoryInfo.phone} | ${laboratoryInfo.email}\n` +
          `📍 *पता:* ${laboratoryInfo.address}\n\n` +
          `_LabCore ELIS — Accurate Information • Better Care_`
        );
      } else {
        setWhatsappMessage(
          `🏥 *${laboratoryInfo.name.toUpperCase()}*\n` +
          `_एनबीएल एवं सीएपी मान्यता प्राप्त संदर्भ प्रयोगशाला | ISO 15189:2022_\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `📋 *आधिकारिक मरीज़ पंजीकरण एवं क्लिनिकल डॉसियर पुष्टि*\n\n` +
          `आदरणीय *${patientName}*,\n\n` +
          `सादर नमस्कार। *${laboratoryInfo.name}* में आपका आधिकारिक मरीज़ पंजीकरण एवं स्वास्थ्य डॉसियर सफलतापूर्वक दर्ज व सत्यापित हो चुका है।\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `*मरीज़ पहचान एवं नैदानिक प्रोफाइल*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `• *मरीज़ का नाम:* ${patientName}\n` +
          `• *यूनिवर्सल हेल्थ आईडी (UHID):* ${patientId ? `PAT-${patientId.slice(0, 8)}` : "PAT-REG"}\n` +
          `• *जन्म तिथि एवं लिंग:* ${formatDate(formData.dateOfBirth)} (${formData.gender || "N/A"})\n` +
          `• *प्रमाणित रक्त समूह:* ${formatBloodGroupDisplay(formData.bloodGroup)}\n` +
          `• *संपर्क मोबाइल:* ${formData.phone || phoneNum || "N/A"}\n` +
          `• *आवासीय पता:* ${formData.address || "N/A"}, ${formData.city || "Ahmedabad"}\n` +
          `• *आपातकालीन संपर्क:* ${formData.emergencyContactName || "N/A"} (${formData.emergencyContactPhone || "N/A"})\n` +
          `• *स्वास्थ्य बीमा / कॉर्पोरेट:* ${formData.insuranceProvider || "N/A"} (${formData.insuranceNumber || "N/A"})\n` +
          `• *पंजीकरण दिनांक व समय:* ${dt.date} को ${dt.time} बजे\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          pdfAttachmentSection +
          `\n🔒 *सुरक्षा व गोपनीयता:* आपका मेडिकल रिकॉर्ड 256-बिट क्रिप्टोग्राफिक एन्क्रिप्शन एवं HIPAA/DISHA मानकों के अंतर्गत पूर्णतः सुरक्षित है।\n\n` +
          `📞 *24/7 क्लिनिकल हेल्पलाइन:* ${laboratoryInfo.phone}\n` +
          `📍 *प्रयोगशाला केंद्र:* ${laboratoryInfo.address}\n\n` +
          `_साक्ष्य-आधारित चिकित्सा एवं सटीक निदान • LabCore ELIS_`
        );
      }
    } else if (lang === "gu") {
      if (template === "welcome") {
        setWhatsappMessage(
          `🏥 *${laboratoryInfo.name.toUpperCase()}*\n` +
          `_NABL અને CAP પ્રમાણિત ક્લિનિકલ લેબોરેટરી | ISO 15189:2022 સ્ટાન્ડર્ડ_\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🌟 *દર્દી ડિજિટલ હેલ્થ એકાઉન્ટ (EHR) સક્રિયકરણ નોટિસ*\n\n` +
          `આદરણીય *${patientName}*,\n\n` +
          `*${laboratoryInfo.name}* માં આપનું સ્વાગત છે. આપનું ઇલેક્ટ્રોનિક હેલ્થ રેકોર્ડ ખાતું LIS સિસ્ટમમાં ${dt.date} ના રોજ ${dt.time} કલાકે સફળતાપૂર્વક સક્રિય કરવામાં આવ્યું છે.\n\n` +
          `📋 *દર્દી ઓળખ અને પ્રોફાઇલ વિગત:*\n` +
          `• *દર્દીનું નામ:* ${patientName}\n` +
          `• *પ્રાથમિક UHID:* ${patientId ? `PAT-${patientId.slice(0, 8)}` : "PAT-REG"}\n` +
          `• *નોંધાયેલ મોબાઇલ:* ${formData.phone || phoneNum || "N/A"}\n` +
          `• *બ્લડ ગ્રૂપ:* ${formatBloodGroupDisplay(formData.bloodGroup)}\n` +
          `• *ખાતા સ્થિતિ:* સક્રિય અને ચકાસાયેલ\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          pdfAttachmentSection +
          `\n✨ *ડિજિટલ પેશન્ટ પોર્ટલના લાભો:*\n` +
          `1️⃣ *રીઅલ-ટાઇમ ટ્રેકિંગ:* નમૂના સ્વીકૃતિથી લઈને પેથોલોજિસ્ટ મંજૂરી સુધી પ્રગતિ જુઓ.\n` +
          `2️⃣ *ઐતિહાસિક રિપોર્ટ આર્કાઇવ:* જૂના તમામ લેબ પરિણામો 24/7 સુરક્ષિત ડાઉનલોડ કરો.\n` +
          `3️⃣ *ટેક્સ ઇન્વૉઇસ:* વીમા વળતર માટે કમ્પ્યુટરાઇઝ્ડ જીએસટી બિલ મેળવો.\n` +
          `4️⃣ *પ્રાથમિકતા સેવા:* QR કોડ દ્વારા ઝડપી સેમ્પલિંગ.\n\n` +
          `🔒 *ગોપનીયતા:* 256-બીટ એન્ક્રિપ્શન અને HIPAA/DISHA દ્વારા સંપૂર્ણ સુરક્ષિત.\n\n` +
          `📞 *સહાય હેલ્પલાઇન:* ${laboratoryInfo.phone}\n` +
          `📍 *સરનામું:* ${laboratoryInfo.address}\n\n` +
          `_ચોક્કસ નિદાન • ઉત્તમ આરોગ્ય સેવા • LabCore ELIS_`
        );
      } else if (template === "test_instructions") {
        setWhatsappMessage(
          `🏥 *${laboratoryInfo.name.toUpperCase()}*\n` +
          `_ક્વોલિટી એશ્યોરન્સ ડિવિઝન અને ક્લિનિકલ પેથોલોજી_\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🧪 *ક્લિનિકલ પ્રોટોકોલ: તપાસ પૂર્વે ઉપવાસ અને તૈયારીની માર્ગદર્શિકા*\n\n` +
          `આદરણીય *${patientName}*,\n\n` +
          `આપની લેબોરેટરી તપાસ (UHID: *${patientId ? `PAT-${patientId.slice(0, 8)}` : "PAT-REG"}*) માં સંપૂર્ણ ચોક્કસાઈ સુનિશ્ચિત કરવા માટે કૃપા કરીને આ તબીબી નિયમોનું પાલન કરો:\n\n` +
          `⚠️ *ફરજિયાત પૂર્વ-વિશ્લેષણાત્મક માર્ગદર્શિકા:*\n` +
          `1️⃣ *ઉપવાસ (10 થી 12 કલાક):* ફાસ્ટિંગ સુગર, લિપિડ પ્રોફાઇલ, LFT કે મેટાબોલિક પેનલ માટે 10–12 કલાક સંપૂર્ણ ઉપવાસ જરૂરી છે.\n` +
          `2️⃣ *પ્રવાહી સેવન:* સરળ નસ સેમ્પલિંગ માટે સાદું પાણી પીવું જરૂરી છે. ચા, કોફી, દૂધ, જ્યુસ કે ધૂમ્રપાન સદંતર વર્જ્ય છે.\n` +
          `3️⃣ *દવાઓ:* નિયમિત બ્લડપ્રેશર કે હૃદયની દવાઓ સાદા પાણી સાથે ચાલુ રાખવી.\n` +
          `4️⃣ *વિશેષ તપાસ:* થાયરોઇડ (TSH) ની સવારની દવા સેમ્પલ આપ્યા બાદ લેવી. ડાયાબિટીસની સવારની દવા સેમ્પલ અને નાસ્તા પછી જ લેવી.\n` +
          `5️⃣ *સમય:* સેમ્પલ કલેક્શનના નિયત સમય કરતાં 10–15 મિનિટ વહેલા પધારવું.\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          pdfAttachmentSection +
          `\n📞 *ફ્લેબોટોમી હેલ્પડેસ્ક:* ${laboratoryInfo.phone}\n` +
          `_યોગ્ય પૂર્વ તૈયારીથી ફરીથી સેમ્પલ લેવાની જરૂરિયાત રહેતી નથી._`
        );
      } else if (template === "summary") {
        setWhatsappMessage(
          `🏥 *${laboratoryInfo.name.toUpperCase()}*\n` +
          `_હોસ્પિટલ વહીવટ અને પેશન્ટ એડમિનિસ્ટ્રેશન_\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🧾 *ચકાસાયેલ દર્દી નોંધણી સારાંશ અને પહોંચ*\n\n` +
          `આદરણીય *${patientName}*,\n\n` +
          `*${laboratoryInfo.name}* માં આપની દર્દી નોંધણી સફળતાપૂર્વક સિસ્ટમમાં સંગ્રહિત કરવામાં આવી છે:\n\n` +
          `📋 *પ્રોફાઇલ સારાંશ વિગત:*\n` +
          `• *દર્દીનું નામ:* ${patientName}\n` +
          `• *UHID નંબર:* ${patientId ? `PAT-${patientId.slice(0, 8)}` : "PAT-REG"}\n` +
          `• *જન્મ તારીખ અને જાતિ:* ${formatDate(formData.dateOfBirth)} (${formData.gender || "N/A"})\n` +
          `• *બ્લડ ગ્રૂપ:* ${formatBloodGroupDisplay(formData.bloodGroup)}\n` +
          `• *મોબાઇલ નંબર:* ${formData.phone || phoneNum || "N/A"}\n` +
          `• *ઇમરજન્સી સંપર્ક:* ${formData.emergencyContactName || "N/A"} (${formData.emergencyContactPhone || "N/A"})\n` +
          `• *વીમા કંપની:* ${formData.insuranceProvider || "Direct Outpatient"}\n` +
          `• *નોંધણી સમય:* ${dt.date} • ${dt.time}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          pdfAttachmentSection +
          `\n🔒 *પ્રમાણપત્ર:* સત્તાવાર 1-પાનાનું મેડિકલ રજીસ્ટ્રેશન ફોર્મ PDF આપના રેકોર્ડ માટે જોડાયેલ છે.\n\n` +
          `📞 *હેલ્પલાઇન:* ${laboratoryInfo.phone} | ${laboratoryInfo.email}\n` +
          `📍 *સરનામું:* ${laboratoryInfo.address}\n\n` +
          `_LabCore ELIS — Accurate Information • Better Care_`
        );
      } else {
        setWhatsappMessage(
          `🏥 *${laboratoryInfo.name.toUpperCase()}*\n` +
          `_NABL અને CAP પ્રમાણિત ક્લિનિકલ લેબોરેટરી | ISO 15189:2022 સ્ટાન્ડર્ડ_\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `📋 *સત્તાવાર દર્દી નોંધણી અને ક્લિનિકલ ડૉસિયર પુષ્ટિકરણ*\n\n` +
          `આદરણીય *${patientName}*,\n\n` +
          `નમસ્તે. *${laboratoryInfo.name}* માં આપનું સત્તાવાર દર્દી રજીસ્ટ્રેશન અને આરોગ્ય રેકોર્ડ સફળતાપૂર્વક નોંધાયેલ છે.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `*દર્દી ઓળખ અને ક્લિનિકલ પ્રોફાઇલ*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `• *દર્દીનું પૂરું નામ:* ${patientName}\n` +
          `• *યુનિવર્સલ હેલ્થ ID (UHID):* ${patientId ? `PAT-${patientId.slice(0, 8)}` : "PAT-REG"}\n` +
          `• *જન્મ તારીખ અને જાતિ:* ${formatDate(formData.dateOfBirth)} (${formData.gender || "N/A"})\n` +
          `• *ચકાસાયેલ બ્લડ ગ્રૂપ:* ${formatBloodGroupDisplay(formData.bloodGroup)}\n` +
          `• *મોબાઇલ નંબર:* ${formData.phone || phoneNum || "N/A"}\n` +
          `• *રહેઠાણનું સરનામું:* ${formData.address || "N/A"}, ${formData.city || "Ahmedabad"}\n` +
          `• *ઇમરજન્સી સંપર્ક:* ${formData.emergencyContactName || "N/A"} (${formData.emergencyContactPhone || "N/A"})\n` +
          `• *આરોગ્ય વીમો (TPA):* ${formData.insuranceProvider || "N/A"} (${formData.insuranceNumber || "N/A"})\n` +
          `• *નોંધણી સમય:* ${dt.date} ના ${dt.time} કલાકે\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          pdfAttachmentSection +
          `\n🔒 *ડેટા સુરક્ષા:* આપનો તબીબી રેકોર્ડ 256-બીટ SSL એન્ક્રિપ્શન અને HIPAA/DISHA સ્ટાન્ડર્ડ્સ હેઠળ સુરક્ષિત છે.\n\n` +
          `📞 *24/7 ક્લિનિકલ હેલ્પલાઇન:* ${laboratoryInfo.phone}\n` +
          `📍 *લેબોરેટરી કેન્દ્ર:* ${laboratoryInfo.address}\n\n` +
          `_સાબિતી આધારિત નિદાન અને આરોગ્ય રક્ષા • LabCore ELIS_`
        );
      }
    } else {
      // English (default - High-level professional clinical writing)
      if (template === "welcome") {
        setWhatsappMessage(
          `*🏥 ${laboratoryInfo.name.toUpperCase()}*\n` +
          `_Department of Laboratory Medicine & Patient Services_\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `*DIGITAL HEALTH RECORD (EHR) ACTIVATION ADVISORY*\n\n` +
          `Dear *${patientName}*,\n\n` +
          `Welcome to *${laboratoryInfo.name}*. Your personalized Electronic Health Record (EHR) has been initialized and activated in our Laboratory Information System (LIS) as of ${dt.date} at ${dt.time}.\n\n` +
          `📋 *ACCOUNT & CREDENTIAL OVERVIEW:*\n` +
          `• *Patient Full Name:* ${patientName}\n` +
          `• *Assigned UHID:* \`${patientId ? `PAT-${patientId.slice(0, 8)}` : "PAT-REG"}\`\n` +
          `• *Primary Contact:* ${formData.phone || phoneNum || "N/A"}\n` +
          `• *Verified Blood Group:* ${formatBloodGroupDisplay(formData.bloodGroup)}\n` +
          `• *Clinical Status:* Active Outpatient Registration\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          pdfAttachmentSection +
          `\n✨ *DIGITAL PORTAL CAPABILITIES & CONVENIENCES:*\n` +
          `1️⃣ *Real-Time Tracking:* Track biological sample progression from barcode accessioning to pathologist verification.\n` +
          `2️⃣ *Cumulative Archive:* Retrieve historical pathology & radiology reports 24/7 with cryptographic QR verification.\n` +
          `3️⃣ *Financial Invoices:* Access itemized GST-compliant invoices and tax receipts for insurance reimbursement.\n` +
          `4️⃣ *Priority Phlebotomy:* Expedited queueing with digital token and QR registration.\n\n` +
          `🔒 *Security Notice:* Protected under 256-bit SSL encryption, DISHA, and HIPAA healthcare compliance.\n\n` +
          `📞 *Patient Support Concierge:* ${laboratoryInfo.phone}\n` +
          `📍 *Central Facility:* ${laboratoryInfo.address}\n\n` +
          `_Dedicated to Precision Diagnostics & Compassionate Care._`
        );
      } else if (template === "test_instructions") {
        setWhatsappMessage(
          `*🏥 ${laboratoryInfo.name.toUpperCase()}*\n` +
          `_Quality Assurance Division & Clinical Pathology_\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `*CLINICAL PROTOCOL: PRE-ANALYTICAL INVESTIGATION GUIDELINES*\n\n` +
          `Dear *${patientName}*,\n\n` +
          `To ensure maximum analytical accuracy and eliminate pre-analytical biological interference in your upcoming diagnostic investigations (UHID: *${patientId ? `PAT-${patientId.slice(0, 8)}` : "PAT-REG"}*), please adhere strictly to these clinical protocols:\n\n` +
          `⚠️ *MANDATORY PRE-ANALYTICAL DIRECTIVES:*\n` +
          `1️⃣ *Fasting Protocol (10–12 Hours):* Strict overnight fasting is mandatory for Fasting Blood Sugar (FBS), Lipid Profile, Comprehensive Metabolic Panels, and Liver Function Tests (LFT).\n` +
          `2️⃣ *Hydration Guidelines:* Plain drinking water is permitted and strongly encouraged to maintain vascular hydration for smooth venipuncture. Avoid tea, coffee, milk, juices, caffeine, or nicotine.\n` +
          `3️⃣ *Prescription Medications:* Continue essential chronic maintenance medications (such as anti-hypertensives or cardiac medications) with water unless explicitly restricted by your treating doctor.\n` +
          `4️⃣ *Special Assays:* If undergoing Thyroid testing (TSH, FT3, FT4), defer morning thyroid medication until AFTER specimen collection. Diabetics should defer morning insulin/oral hypoglycemics until after the fasting sample.\n` +
          `5️⃣ *Collection Readiness:* Please report 10–15 minutes prior to scheduled collection, or keep your residence accessible for certified home phlebotomy cold-chain transport.\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          pdfAttachmentSection +
          `\n📞 *Phlebotomy Helpdesk:* ${laboratoryInfo.phone}\n` +
          `_Adherence to pre-analytical protocols minimizes sample recollection._`
        );
      } else if (template === "summary") {
        setWhatsappMessage(
          `*🏥 ${laboratoryInfo.name.toUpperCase()}*\n` +
          `_Hospital Administration & Patient Intake Records_\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `*CONFIRMED CLINICAL REGISTRATION SUMMARY & RECEIPT*\n\n` +
          `Dear *${patientName}*,\n\n` +
          `Your patient intake dossier and diagnostic registration summary have been successfully reconciled and archived in our Laboratory Information System:\n\n` +
          `📋 *RECONCILED REGISTRATION PARTICULARS:*\n` +
          `• *Patient Legal Name:* ${patientName}\n` +
          `• *System UHID / Identifier:* ${patientId ? `PAT-${patientId.slice(0, 8)}` : "PAT-REG"}\n` +
          `• *Demographics & DOB:* ${formatDate(formData.dateOfBirth)} (${formData.gender || "N/A"})\n` +
          `• *Serological Blood Group:* ${formatBloodGroupDisplay(formData.bloodGroup)}\n` +
          `• *Registered Mobile Contact:* ${formData.phone || phoneNum || "N/A"}\n` +
          `• *Primary Emergency Contact:* ${formData.emergencyContactName || "N/A"} (${formData.emergencyContactPhone || "N/A"})\n` +
          `• *Insurance / Requisition Ref:* ${formData.insuranceProvider || "Direct Outpatient Consultation"}\n` +
          `• *Registration Timestamp:* ${dt.date} at ${dt.time}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          pdfAttachmentSection +
          `\n🔒 The authorized 1-Page Medical Registration Form PDF has been generated and compiled for your permanent health records.\n\n` +
          `📞 *Laboratory Operations:* ${laboratoryInfo.phone} | ${laboratoryInfo.email}\n` +
          `📍 *Facility Address:* ${laboratoryInfo.address}\n\n` +
          `_Accredited Diagnostic Excellence • LabCore ELIS_`
        );
      } else {
        setWhatsappMessage(
          `*🏥 ${laboratoryInfo.name.toUpperCase()}*\n` +
          `_Accredited Clinical Reference Laboratory | ISO 15189:2022 & NABL Standards_\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `*OFFICIAL PATIENT REGISTRATION DOSSIER & RECORD*\n\n` +
          `Dear *${patientName}*,\n\n` +
          `Greetings. Your clinical intake and official medical health registration with *${laboratoryInfo.name}* have been formally processed and validated in the Laboratory Information System (LIS).\n\n` +
          `📋 *PATIENT IDENTIFICATION & INTAKE SUMMARY:*\n` +
          `• *Full Legal Name:* ${patientName}\n` +
          `• *Universal Health ID (UHID):* \`${patientId ? `PAT-${patientId.slice(0, 8)}` : "PAT-REG"}\`\n` +
          `• *Demographics:* ${formatDate(formData.dateOfBirth)} | ${formData.gender || "N/A"}\n` +
          `• *Verified Blood Group:* ${formatBloodGroupDisplay(formData.bloodGroup)}\n` +
          `• *Registered Mobile:* ${formData.phone || phoneNum || "N/A"}\n` +
          `• *Residential Address:* ${formData.address || "N/A"}, ${formData.city || "Ahmedabad"}\n` +
          `• *Emergency Medical Contact:* ${formData.emergencyContactName || "N/A"} (${formData.emergencyContactPhone || "N/A"})\n` +
          `• *Health Insurance / TPA:* ${formData.insuranceProvider || "N/A"} (Policy: ${formData.insuranceNumber || "N/A"})\n` +
          `• *Intake Timestamp:* ${dt.date} at ${dt.time}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          pdfAttachmentSection +
          `\n🔒 *SECURITY & COMPLIANCE SEAL:*\n` +
          `Your diagnostic dossier is digitally secured under 256-Bit SSL encryption, DISHA, and HIPAA clinical confidentiality protocols.\n\n` +
          `📞 *24x7 Clinical Helpline & Dispatch Desk:* ${laboratoryInfo.phone}\n` +
          `📍 *Central Diagnostic Facility:* ${laboratoryInfo.address}\n\n` +
          `_Empowering Evidence-Based Medicine • LabCore ELIS_`
        );
      }
    }
  };

  // Open WhatsApp Composer and prepare PDF hosting
  const openWhatsAppComposer = (initialTemplate: "registration" | "welcome" | "test_instructions" | "summary" = "registration") => {
    const rawPhone = formData.phone || "";
    const cleanPhone = normalizePhoneNumber(rawPhone);
    setWhatsappPhone(cleanPhone);
    setWhatsappTemplate(initialTemplate);
    setWhatsappActiveTab("editor");
    setRecipientMode("patient");
    setWhatsappError(null);
    setWhatsappStatusNotice(null);
    setWhatsappSentSuccess(false);
    setShowWhatsAppConfig(false);
    setWhatsappTestStatus(null);
    fetchCommunicationLogs();

    generateWhatsAppTemplateContent(initialTemplate, patientFullName, cleanPhone, hostedPdfUrl, whatsappLanguage);
    setShowWhatsAppModal(true);

    // Pre-generate and host PDF in background so link is live
    setTimeout(async () => {
      let b64 = pdfBase64;
      if (!b64) {
        b64 = await generateFormPdfBase64();
      }
      if (b64 && !hostedPdfUrl) {
        setPdfHosting(true);
        try {
          const uploadRes = await communicationApi.uploadPdf({
            filename: patientSafeFilename,
            content: b64,
          });
          if (uploadRes && uploadRes.success && uploadRes.data?.url) {
            const publicUrl = uploadRes.data.url;
            setHostedPdfUrl(publicUrl);
            generateWhatsAppTemplateContent(initialTemplate, patientFullName, cleanPhone, publicUrl);
          }
        } catch (e) {
          console.warn("Could not pre-host PDF:", e);
        } finally {
          setPdfHosting(false);
        }
      }
    }, 100);
  };

  // Open in WhatsApp Web or Desktop App with pre-filled text & hosted PDF link
  const handleOpenWhatsAppWeb = async () => {
    handleDownloadPdf();
    let targetPhone = normalizePhoneNumber(whatsappPhone);
    const encText = encodeURIComponent(whatsappMessage);
    const waUrl = targetPhone
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encText}`
      : `https://api.whatsapp.com/send?text=${encText}`;
    window.open(waUrl, "_blank");
    setWhatsappStatusNotice(
      `✓ WhatsApp opened with pre-filled message and document PDF link! The PDF form (${patientSafeFilename}) was also downloaded to your computer.`
    );
  };

  // Direct send WhatsApp via backend provider
  const handleSendDirectWhatsApp = async () => {
    const targetPhone = normalizePhoneNumber(whatsappPhone);
    if (!targetPhone || targetPhone.length < 10) {
      setWhatsappError("Please enter a valid 10-digit or international WhatsApp phone number.");
      return;
    }

    setWhatsappSending(true);
    setWhatsappError(null);
    setWhatsappStatusNotice(null);

    try {
      let currentPdf = pdfBase64;
      if (whatsappAttachPdf && !currentPdf) {
        currentPdf = await generateFormPdfBase64();
      }

      if (onSendWhatsApp) {
        await onSendWhatsApp({
          to: targetPhone,
          message: whatsappMessage.trim(),
          patientId: patientId || `pat-${Date.now()}`,
          pdfBase64: currentPdf || undefined,
          filename: patientSafeFilename,
          mediaUrl: hostedPdfUrl || undefined,
        });
        setWhatsappSentSuccess(true);
        setWhatsappStatusNotice(`WhatsApp message dispatched to +${targetPhone}!`);
        setTimeout(() => {
          setWhatsappSentSuccess(false);
          setShowWhatsAppModal(false);
        }, 2200);
      } else {
        const effectivePatientId = patientId || `pat-${Date.now()}`;
        const response = await communicationApi.sendWhatsApp({
          patientId: effectivePatientId,
          to: targetPhone,
          message: whatsappMessage.trim(),
          pdfBase64: whatsappAttachPdf ? currentPdf || undefined : undefined,
          filename: patientSafeFilename,
          mediaUrl: hostedPdfUrl || undefined,
        });

        if (response && response.success && response.data?.status !== "FAILED") {
          setWhatsappSentSuccess(true);
          const returnedUrl = response.data?.mediaUrl || hostedPdfUrl;
          if (returnedUrl) setHostedPdfUrl(returnedUrl);

          setWhatsappStatusNotice(`✓ WhatsApp message dispatched successfully to +${targetPhone} with Registration PDF!`);
          setTimeout(() => {
            setWhatsappSentSuccess(false);
            setShowWhatsAppModal(false);
          }, 2500);
        } else {
          const rawErr = response?.message || response?.data?.errorMessage || "WhatsApp API dispatch failed";
          setWhatsappError(rawErr);
          if (rawErr.includes("credentials") || rawErr.includes("not configured") || rawErr.includes("Twilio") || rawErr.includes("Provider")) {
            setShowWhatsAppConfig(true);
          }
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || "Error during WhatsApp dispatch";
      setWhatsappError(errMsg);
      if (errMsg.includes("credentials") || errMsg.includes("Twilio") || errMsg.includes("API")) {
        setShowWhatsAppConfig(true);
      }
    } finally {
      setWhatsappSending(false);
    }
  };

  // Test and save WhatsApp configuration (Twilio, etc.)
  const handleTestAndSaveWhatsApp = async () => {
    if (!whatsappApiKeyInput.trim() || !whatsappApiSecretInput.trim()) {
      setWhatsappTestStatus({ success: false, message: "Please enter Twilio Account SID and Auth Token." });
      return;
    }
    setWhatsappTesting(true);
    setWhatsappTestStatus(null);
    try {
      const res = await communicationApi.testWhatsApp({
        whatsappProvider: whatsappProviderInput,
        whatsappApiKey: whatsappApiKeyInput.trim(),
        whatsappApiSecret: whatsappApiSecretInput.trim(),
        whatsappSenderId: whatsappSenderIdInput.trim() || "whatsapp:+14155238886",
      });

      if (res && res.success) {
        await communicationApi.updateWhatsAppSettings({
          whatsappProvider: whatsappProviderInput,
          whatsappApiKey: whatsappApiKeyInput.trim(),
          whatsappApiSecret: whatsappApiSecretInput.trim(),
          whatsappSenderId: whatsappSenderIdInput.trim() || "whatsapp:+14155238886",
        });
        setWhatsappTestStatus({
          success: true,
          message: "✓ Twilio WhatsApp API verified and saved! Direct dispatch is active.",
        });
        setWhatsappError(null);
      } else {
        setWhatsappTestStatus({
          success: false,
          message: res?.message || "WhatsApp API verification failed. Please check credentials.",
        });
      }
    } catch (err: any) {
      setWhatsappTestStatus({
        success: false,
        message: err?.message || "Connection error during WhatsApp API test.",
      });
    } finally {
      setWhatsappTesting(false);
    }
  };

  const handleCopyWhatsAppMessage = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setWhatsappCopiedNotice(true);
    setTimeout(() => setWhatsappCopiedNotice(false), 2000);
  };

  const handleCopyPdfLink = () => {
    if (hostedPdfUrl) {
      navigator.clipboard.writeText(hostedPdfUrl);
      setWhatsappLinkCopiedNotice(true);
      setTimeout(() => setWhatsappLinkCopiedNotice(false), 2000);
    }
  };

  // Open Email Composer and kick off background PDF attachment preparation
  const openEmailComposer = (initialTemplate: "registration" | "welcome" | "test_instructions" | "summary" = "registration") => {
    const recipient = formData.email || "";
    setEmailTo(recipient);
    setEmailTemplate(initialTemplate);
    setEmailError(null);
    setStatusNotice(null);
    setEmailSentSuccess(false);
    setShowSmtpConfig(false);
    setSmtpTestStatus(null);

    generateTemplateContent(initialTemplate, patientFullName, recipient);
    setShowEmailModal(true);

    // Trigger PDF generation in background so it's ready immediately
    setTimeout(() => {
      generateFormPdfBase64();
    }, 100);
  };

  // Advanced clinical email templates with accredited pathology standards
  const generateTemplateContent = (
    template: "registration" | "welcome" | "test_instructions" | "summary",
    patientName: string,
    recipient: string
  ) => {
    const uhidTag = patientId ? `PAT-${patientId.slice(0, 8)}` : "PAT-REG";

    if (template === "welcome") {
      setEmailSubject(`[EHR PORTAL ACTIVATION] Patient Digital Health Record & Credentials - ${patientName} | UHID: ${uhidTag}`);
      setEmailBody(
        `CONFIDENTIAL CLINICAL COMMUNICATION | ELECTRONIC HEALTH RECORD (EHR)\n` +
        `================================================================================\n` +
        `INSTITUTION       : ${laboratoryInfo.name.toUpperCase()}\n` +
        `ACCREDITATION     : NABL ACCREDITED MEDICAL LABORATORY | ISO 15189:2022 | CAP COMPLIANT\n` +
        `DIVISION          : Health Informatics & Patient Digital Access Services\n` +
        `================================================================================\n\n` +
        `Dear ${patientName},\n\n` +
        `Welcome to ${laboratoryInfo.name}. Your personalized Electronic Health Record (EHR) dossier has been formally initialized and activated within our Enterprise Laboratory Information System (LIS) as of ${dt.date} at ${dt.time}.\n\n` +
        `Your diagnostic profile is now linked to a centralized clinical repository designed for lifelong health record management, high-precision diagnostic tracking, and cryptographically verified report delivery.\n\n` +
        `--------------------------------------------------------------------------------\n` +
        `1. PATIENT ACCOUNT & CLINICAL IDENTIFIERS\n` +
        `--------------------------------------------------------------------------------\n` +
        `• Patient Full Name       : ${patientName}\n` +
        `• Universal Health ID     : ${uhidTag}\n` +
        `• Registered Phone Number : ${formData.phone || "N/A"}\n` +
        `• Primary Email Address   : ${recipient || "N/A"}\n` +
        `• Serological Blood Group : ${formatBloodGroupDisplay(formData.bloodGroup)}\n` +
        `• Demographic Profile     : ${formatDate(formData.dateOfBirth)} (${formData.gender || "Not Specified"})\n` +
        `• Clinical Intake Stream  : ${formData.patientType || "Outpatient Clinical Diagnostics"}\n` +
        `• Account Validation      : Active & Verified by LIS Admissions\n\n` +
        `--------------------------------------------------------------------------------\n` +
        `2. ENTERPRISE PATIENT PORTAL PRIVILEGES & DIGITAL SERVICES\n` +
        `--------------------------------------------------------------------------------\n` +
        `Your authenticated EHR profile grants continuous 24/7 access to the following clinical services:\n` +
        `• Real-Time Specimen Tracking : Monitor biological specimen custody from phlebotomy accessioning to senior pathologist verification.\n` +
        `• Lifetime Diagnostic Archive : Access cumulative historical test results, trend analysis, and reference range charts at any time.\n` +
        `• Tamper-Evident QR Security  : Every digital pathology report contains an SHA-256 cryptographic verification seal for authenticity.\n` +
        `• Statutory Billing & Ledger  : Instantly retrieve GST-compliant itemized invoices and payment vouchers for insurance claims.\n` +
        `• Priority Sample Dispatch    : Accelerated check-in via digital QR token at all affiliated collection centers.\n\n` +
        `--------------------------------------------------------------------------------\n` +
        `3. ATTACHED CLINICAL CREDENTIALS\n` +
        `--------------------------------------------------------------------------------\n` +
        `Your official 1-Page Patient Registration Form and Medical ID dossier is attached to this email:\n` +
        `📎 Attached Document: ${patientSafeFilename}\n\n` +
        `--------------------------------------------------------------------------------\n` +
        `4. STATUTORY MEDICAL PRIVACY & CONFIDENTIALITY SAFEGUARD\n` +
        `--------------------------------------------------------------------------------\n` +
        `NOTICE OF CONFIDENTIALITY: This electronic transmission, including any attachments, contains confidential health information protected under the Digital Information Security in Healthcare Act (DISHA), HIPAA privacy rules, and ISO/IEC 27001 cybersecurity frameworks. If you are not the intended recipient, please immediately notify the sender and delete this transmission.\n\n` +
        `For concierge scheduling, home phlebotomy dispatch, or clinical assistance:\n` +
        `• 24/7 Patient Support Desk : ${laboratoryInfo.phone}\n` +
        `• Clinical Services Inquiries: ${laboratoryInfo.email}\n` +
        `• Central Diagnostic Center  : ${laboratoryInfo.address}\n\n` +
        `Sincerely,\n` +
        `Department of Health Informatics & Patient Services\n` +
        `${laboratoryInfo.name}\n` +
        `Dedicated to Diagnostic Precision & Evidence-Based Clinical Care`
      );
    } else if (template === "test_instructions") {
      setEmailSubject(`[CLINICAL DIRECTIVE] Mandatory Pre-Analytical Investigation Protocols & Fasting Advisory - ${patientName}`);
      setEmailBody(
        `PRE-ANALYTICAL CLINICAL DIRECTIVE & SPECIMEN INTEGRITY PROTOCOL\n` +
        `================================================================================\n` +
        `INSTITUTION   : ${laboratoryInfo.name.toUpperCase()}\n` +
        `ACCREDITATION : NABL (ISO 15189:2022) • CAP Certified Reference Laboratory\n` +
        `DEPARTMENT    : Quality Assurance Division & Clinical Pathology\n` +
        `================================================================================\n\n` +
        `Dear ${patientName},\n\n` +
        `Thank you for registering with ${laboratoryInfo.name}. To guarantee maximum analytical accuracy and avoid physiological interference with your upcoming diagnostic investigations (UHID: ${uhidTag}), please strictly adhere to the following pre-analytical preparation protocols:\n\n` +
        `--------------------------------------------------------------------------------\n` +
        `1. MANDATORY FASTING DIRECTIVES (10 TO 12 HOURS)\n` +
        `--------------------------------------------------------------------------------\n` +
        `• Fasting Investigations: Overnight fasting (10–12 hours) is strictly required for Fasting Blood Glucose, Lipid Profiles (Cholesterol, Triglycerides, HDL, LDL), Liver Function Tests (LFT), and Comprehensive Metabolic Panels.\n` +
        `• Permitted Fluids      : Plain drinking water is permitted and strongly recommended to preserve adequate vascular volume for smooth venipuncture.\n` +
        `• Prohibited Consumables: Tea, coffee, milk, energy drinks, juices, chewing gum, alcohol, and tobacco/nicotine must be avoided completely prior to sample collection.\n\n` +
        `--------------------------------------------------------------------------------\n` +
        `2. MEDICATION PROTOCOLS & TIMING ADVISORY\n` +
        `--------------------------------------------------------------------------------\n` +
        `• Chronic Maintenance Therapy: Continue critical daily medications (e.g., anti-hypertensives, cardiac medications) with plain water unless specifically instructed otherwise by your attending physician.\n` +
        `• Thyroid Profile (TSH/FT3/FT4): Withhold morning thyroid hormone medication until AFTER your blood sample has been drawn.\n` +
        `• Diabetic Regimens: Withhold morning oral hypoglycemic tablets or insulin injections until your fasting sample is collected and breakfast is taken.\n\n` +
        `--------------------------------------------------------------------------------\n` +
        `3. SPECIMEN COLLECTION LOGISTICS & REPORT RELEASE\n` +
        `--------------------------------------------------------------------------------\n` +
        `• Walk-in Phlebotomy : Please present to our laboratory 10–15 minutes prior to scheduled collection.\n` +
        `• Home Phlebotomy    : Certified phlebotomists will maintain cold-chain specimen preservation (2°C - 8°C).\n` +
        `• Report Delivery    : Following dual-analyzer processing and senior pathologist authorization, your verified digital PDF report will be delivered to ${recipient} and via secure WhatsApp.\n\n` +
        `--------------------------------------------------------------------------------\n` +
        `4. REQUISITION PARTICULARS & ATTACHMENT\n` +
        `--------------------------------------------------------------------------------\n` +
        `• Patient Legal Name : ${patientName}\n` +
        `• System Identifier  : ${uhidTag}\n` +
        `• Registered Phone   : ${formData.phone || "N/A"}\n` +
        `• Registration Date  : ${dt.date} at ${dt.time}\n` +
        `📎 Attached Dossier  : ${patientSafeFilename}\n\n` +
        `Strict adherence to pre-analytical protocols minimizes specimen recollection and guarantees optimal diagnostic fidelity.\n\n` +
        `For questions regarding test preparation or specimen collection timings:\n` +
        `• Phlebotomy Operations Desk : ${laboratoryInfo.phone}\n` +
        `• Specimen Dispatch Unit     : ${laboratoryInfo.email}\n\n` +
        `Respectfully,\n` +
        `Quality Assurance Division & Clinical Pathology\n` +
        `${laboratoryInfo.name}`
      );
    } else if (template === "summary") {
      setEmailSubject(`[CLINICAL SUMMARY & RECEIPT] Reconciled Diagnostic Registration Dossier - ${patientName} | UHID: ${uhidTag}`);
      setEmailBody(
        `OFFICIAL RECONCILED REGISTRATION SUMMARY & FINANCIAL LEDGER RECEIPT\n` +
        `================================================================================\n` +
        `INSTITUTION   : ${laboratoryInfo.name.toUpperCase()}\n` +
        `ACCREDITATION : NABL ACCREDITED • ISO 15189:2022 REFERENCE LABORATORY\n` +
        `DIVISION      : Hospital Administration & Patient Intake Records\n` +
        `================================================================================\n\n` +
        `Dear ${patientName},\n\n` +
        `Your patient intake profile and diagnostic registration record have been successfully reconciled and archived in our Enterprise Laboratory Information System (LIS):\n\n` +
        `--------------------------------------------------------------------------------\n` +
        `1. VERIFIED PATIENT REGISTRATION PARTICULARS\n` +
        `--------------------------------------------------------------------------------\n` +
        `• Full Legal Name       : ${patientName}\n` +
        `• Universal Health ID   : ${uhidTag}\n` +
        `• Date of Birth & Gender: ${formatDate(formData.dateOfBirth)} (${formData.gender || "Not Specified"})\n` +
        `• Serological Group     : ${formatBloodGroupDisplay(formData.bloodGroup)}\n` +
        `• Primary Mobile Number : ${formData.phone || "N/A"}\n` +
        `• Registered Email      : ${recipient || "N/A"}\n` +
        `• Emergency Contact     : ${formData.emergencyContactName || "N/A"} (${formData.emergencyContactPhone || "N/A"})\n` +
        `• Insurer / TPA Ref     : ${formData.insuranceProvider || "Direct Outpatient Consultation"}\n` +
        `• Intake Timestamp      : ${dt.date} at ${dt.time}\n\n` +
        `--------------------------------------------------------------------------------\n` +
        `2. MEDICAL RECORDS VERIFICATION & ARCHIVAL STATUS\n` +
        `--------------------------------------------------------------------------------\n` +
        `• LIS Dossier Status    : Formally Authenticated & Digitally Signed\n` +
        `• Cryptographic QR Code : Embedded & Active on Registration PDF\n` +
        `• Phlebotomy Queue      : Priority Outpatient Access Assigned\n` +
        `• Specimen Safety Seal  : Barcode Pre-Assigned\n\n` +
        `📎 Attached File: ${patientSafeFilename} (Authorized 1-Page Clinical Registration Dossier)\n\n` +
        `--------------------------------------------------------------------------------\n` +
        `3. PATIENT SUPPORT & CONTACT DETAILS\n` +
        `--------------------------------------------------------------------------------\n` +
        `• Central Helpdesk : ${laboratoryInfo.phone}\n` +
        `• Patient Records  : ${laboratoryInfo.email}\n` +
        `• Clinical Campus  : ${laboratoryInfo.address}\n\n` +
        `Respectfully,\n` +
        `Department of Medical Records & Patient Administration\n` +
        `${laboratoryInfo.name}\n` +
        `Accurate Diagnostic Information • Superior Clinical Outcomes`
      );
    } else {
      // "registration" - Default comprehensive clinical dossier
      setEmailSubject(`[CONFIDENTIAL MEDICAL DOSSIER] Official Patient Registration & Laboratory Intake Confirmation - ${patientName} | UHID: ${uhidTag}`);
      setEmailBody(
        `CONFIDENTIAL MEDICAL COMMUNICATION & CLINICAL INTAKE DOSSIER\n` +
        `================================================================================\n` +
        `INSTITUTION       : ${laboratoryInfo.name.toUpperCase()}\n` +
        `ACCREDITATION     : NABL (ISO 15189:2022) • CAP Certified • ICMR Registered\n` +
        `CLINICAL DIVISION : Division of Laboratory Medicine & Patient Access Services\n` +
        `================================================================================\n\n` +
        `Dear ${patientName},\n\n` +
        `This is an official clinical confirmation that your patient intake dossier has been successfully authenticated, validated, and formally registered in the Enterprise Laboratory Information System (LIS) of ${laboratoryInfo.name} on ${dt.date} at ${dt.time}.\n\n` +
        `A cryptographically generated and authorized 1-Page Official Patient Medical Registration Form & Identification Dossier has been compiled and attached to this dispatch for your permanent health records.\n\n` +
        `--------------------------------------------------------------------------------\n` +
        `1. PATIENT DEMOGRAPHICS & CLINICAL IDENTIFIERS\n` +
        `--------------------------------------------------------------------------------\n` +
        `• Full Legal Name       : ${patientName}\n` +
        `• Universal Health ID   : ${uhidTag}\n` +
        `• Date of Birth & Age   : ${formatDate(formData.dateOfBirth)} (${formData.gender || "Not Specified"})\n` +
        `• Serological Group     : ${formatBloodGroupDisplay(formData.bloodGroup)}\n` +
        `• Primary Contact Phone : ${formData.phone || "N/A"}\n` +
        `• Registered Email      : ${recipient || "N/A"}\n` +
        `• Permanent Residence   : ${formData.address || "N/A"}, ${formData.city || "Ahmedabad"}, ${formData.state || "Gujarat"} - ${formData.postalCode || "N/A"}\n` +
        `• Patient Intake Stream : ${formData.patientType || "Outpatient Diagnostic Care"}\n\n` +
        `--------------------------------------------------------------------------------\n` +
        `2. EMERGENCY CONTACT & SPONSOR/INSURANCE PARTICULARS\n` +
        `--------------------------------------------------------------------------------\n` +
        `• Emergency Contact     : ${formData.emergencyContactName || "N/A"} (${formData.emergencyContactRelationship || "Primary Kin"})\n` +
        `• Emergency Telephone   : ${formData.emergencyContactPhone || "N/A"}\n` +
        `• Medical Insurer / TPA : ${formData.insuranceProvider || "Direct Outpatient / Self-Pay"}\n` +
        `• Policy / Member ID    : ${formData.insuranceNumber || "N/A"}\n` +
        `• Corporate Sponsor ID  : ${formData.corporateId || "N/A"}\n\n` +
        `--------------------------------------------------------------------------------\n` +
        `3. SECURE DIGITAL HEALTH ARCHIVE & PATIENT ACCESS\n` +
        `--------------------------------------------------------------------------------\n` +
        `Your registered profile grants immediate authenticated access to the LabCore ELIS Patient Portal:\n` +
        `• Real-Time Diagnostic Tracking: Track biological specimens from accessioning, through automated analytical processing, to Pathologist clinical sign-off.\n` +
        `• Cumulative Diagnostic Archive: Review and securely download lifetime historical pathology, microbiology, and molecular diagnostic reports 24/7.\n` +
        `• Cryptographic QR Authenticity: Every report is embedded with an SHA-256 digital signature guaranteeing forensic tamper-evidence.\n` +
        `• Itemized Financial Invoices: Access GST-compliant digital invoices for medical insurance reimbursement and tax compliance.\n\n` +
        `--------------------------------------------------------------------------------\n` +
        `4. STATUTORY MEDICAL PRIVACY & CONFIDENTIALITY NOTICE\n` +
        `--------------------------------------------------------------------------------\n` +
        `This communication and any accompanying attachments contain Protected Health Information (PHI) governed by strict statutory confidentiality protocols under DISHA, HIPAA, and ISO/IEC 27001 data protection standards. If you are not the intended recipient, any disclosure, copying, or distribution is strictly prohibited.\n\n` +
        `📎 ATTACHED CLINICAL ASSET:\n` +
        `Official 1-Page Patient Registration Form (PDF): ${patientSafeFilename}\n\n` +
        `For medical scheduling, phlebotomy inquiries, or laboratory assistance:\n` +
        `• 24/7 Clinical Concierge Desk : ${laboratoryInfo.phone}\n` +
        `• Central Laboratory Inquiries: ${laboratoryInfo.email}\n` +
        `• Reference Facility Address   : ${laboratoryInfo.address}\n\n` +
        `Respectfully delivered,\n` +
        `Office of Patient Intake & Medical Records Administration\n` +
        `${laboratoryInfo.name}\n` +
        `Empowering Evidence-Based Medicine & Clinical Diagnostic Excellence`
      );
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo.trim()) {
      setEmailError("Please enter a valid recipient email address.");
      return;
    }

    setEmailSending(true);
    setEmailError(null);
    setStatusNotice(null);

    try {
      // Ensure PDF is generated before dispatching
      let currentPdf = pdfBase64;
      if (attachPdf && !currentPdf) {
        currentPdf = await generateFormPdfBase64();
      }

      const attachments = [];
      if (attachPdf && currentPdf) {
        attachments.push({
          filename: patientSafeFilename,
          content: currentPdf,
          contentType: "application/pdf",
        });
      }

      if (onSendEmail) {
        await onSendEmail({
          to: emailTo.trim(),
          cc: emailCc.trim() || undefined,
          subject: emailSubject.trim(),
          body: emailBody.trim(),
          patientId: patientId || `pat-${Date.now()}`,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
        setEmailSentSuccess(true);
        setStatusNotice(`Email sent to ${emailTo.trim()} with attached PDF.`);
        setTimeout(() => {
          setEmailSentSuccess(false);
          setShowEmailModal(false);
        }, 2200);
      } else {
        const effectivePatientId = patientId || `pat-${Date.now()}`;
        const response = await communicationApi.sendEmail({
          patientId: effectivePatientId,
          to: emailTo.trim(),
          subject: emailSubject.trim(),
          body: emailBody.trim(),
          attachments: attachments.length > 0 ? attachments : undefined,
        });

        if (response && response.success && response.data?.status !== "FAILED") {
          setEmailSentSuccess(true);
          setStatusNotice(`✓ Email delivered successfully to ${emailTo.trim()} with ${patientSafeFilename} attached!`);
          setTimeout(() => {
            setEmailSentSuccess(false);
            setShowEmailModal(false);
          }, 2500);
        } else {
          const rawErr = response?.message || response?.data?.errorMessage || "Email dispatch failed";
          setEmailError(rawErr);
          // If SMTP auth error (Gmail App Password missing), auto-reveal the config box!
          if (rawErr.includes("Application-specific password") || rawErr.includes("Invalid login") || rawErr.includes("534-5.7.9")) {
            setShowSmtpConfig(true);
          }
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || "Error during email dispatch";
      setEmailError(errMsg);
      if (errMsg.includes("Application-specific password") || errMsg.includes("Invalid login") || errMsg.includes("534-5.7.9") || errMsg.includes("SMTP")) {
        setShowSmtpConfig(true);
      }
    } finally {
      setEmailSending(false);
    }
  };

  // Live PDF preview in new window
  const handlePreviewPdf = async () => {
    if (!formRef.current) return;
    setPdfGenerating(true);
    try {
      const formElement = formRef.current;
      const canvas = await html2canvas(formElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 794,
        onclone: (clonedDoc) => {
          const allLabels = clonedDoc.querySelectorAll(".field-label, .field-value");
          allLabels.forEach((el: any) => {
            el.style.overflow = "visible";
            el.style.textOverflow = "clip";
            el.style.lineHeight = "1.3";
          });
          const formBody = clonedDoc.querySelector(".form-body") as HTMLElement;
          if (formBody) {
            formBody.style.justifyContent = "flex-start";
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

      const blob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (err) {
      console.error("Error previewing PDF:", err);
    } finally {
      setPdfGenerating(false);
    }
  };

  // Copy email body text
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(emailBody);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  // Web Gmail dispatch with downloaded PDF
  const handleSendViaWebGmail = async () => {
    await handleDownloadPdf();
    const encTo = encodeURIComponent(emailTo);
    const encSub = encodeURIComponent(emailSubject);
    const encBody = encodeURIComponent(emailBody);
    const encCc = emailCc ? `&cc=${encodeURIComponent(emailCc)}` : "";
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encTo}${encCc}&su=${encSub}&body=${encBody}`;
    window.open(gmailUrl, "_blank");
    setStatusNotice(`PDF (${patientSafeFilename}) was downloaded to your computer! Web Gmail composer opened. Drag & drop the PDF into the draft to attach it.`);
  };

  // WhatsApp dispatch with downloaded PDF
  const handleShareViaWhatsApp = async () => {
    await handleDownloadPdf();
    const cleanPhone = (formData.phone || "").replace(/[^0-9]/g, "");
    const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const waText = encodeURIComponent(
      `Hello ${patientFullName},\n\n` +
      `Your official Patient Registration with ${laboratoryInfo.name} has been processed.\n\n` +
      `• Registration Date: ${dt.date} at ${dt.time}\n` +
      `• Attached Form: ${patientSafeFilename}\n` +
      `• Helpline: ${laboratoryInfo.phone}\n\n` +
      `The official registration PDF has been generated and downloaded.`
    );
    const waUrl = waPhone
      ? `https://api.whatsapp.com/send?phone=${waPhone}&text=${waText}`
      : `https://api.whatsapp.com/send?text=${waText}`;
    window.open(waUrl, "_blank");
    setStatusNotice(`PDF (${patientSafeFilename}) downloaded! WhatsApp opened. You can now attach the file directly in the chat.`);
  };

  // Test and save Gmail App Password
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
          emailFromName: "LabCore Enterprise LIS",
        });
        setSmtpTestStatus({
          success: true,
          message: "✓ Gmail App Password verified and saved! You can now send emails with attachments directly.",
        });
        setEmailError(null);
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

  // Enhanced fallback: Auto-downloads the PDF to patient/staff device and opens the pre-filled email draft
  const handleDirectMailClientFallback = () => {
    handleDownloadPdf();
    const encSubject = encodeURIComponent(emailSubject);
    const encBody = encodeURIComponent(emailBody);
    const ccParam = emailCc ? `&cc=${encodeURIComponent(emailCc)}` : "";
    window.open(`mailto:${emailTo}?subject=${encSubject}${ccParam}&body=${encBody}`, "_blank");

    setStatusNotice(
      `PDF form (${patientSafeFilename}) was downloaded to your computer! Note: mailto cannot auto-attach files, please drag the downloaded PDF into your email client draft.`
    );
  };

  const handlePrint = () => {
    const formEl = formRef.current;
    if (!formEl) {
      window.print();
      return;
    }

    let iframe = document.getElementById("print-form-iframe") as HTMLIFrameElement | null;
    if (iframe) {
      iframe.remove();
    }

    iframe = document.createElement("iframe");
    iframe.id = "print-form-iframe";
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
          <title>PATIENT REGISTRATION FORM - ${patientFullName} [${patientId ? `PAT-${patientId.slice(0, 8)}` : "UHID"}]</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            ${printFormStyles}
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
            .no-print, .action-buttons, .print-button, .whatsapp-header-button, .email-header-button, .email-quick-action, .email-status-pill {
              display: none !important;
            }
            .print-form-container {
              box-shadow: none !important;
              border: 1px solid #CBD5E1 !important;
              max-width: 100% !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box !important;
            }
            .form-body {
              display: block !important;
              width: 100% !important;
            }
            .form-section,
            .dual-section-row,
            .signature-section,
            .footer {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              width: 100% !important;
            }
          </style>
        </head>
        <body>
          <div class="print-form-container">
            ${formEl.innerHTML}
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

  const handleSave = async () => {
    if (onSave) {
      try {
        await onSave(formData);
      } catch (error) {
        console.error("Error saving form:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-xs text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{printFormStyles}</style>

      <div className="print-form-page">
        <div className="print-form-container" ref={formRef}>
          {/* LIGHT-WHITE HOSPITAL & LAB HEADER */}
          <div className="form-header">
            <div className="header-left">
              <div className="clinic-logo-badge">
                <Shield size={22} className="text-sky-600" />
              </div>
              <div>
                <div className="brand-title">
                  LabCore <span>ELIS</span>
                </div>
                <div className="brand-tagline">Clinical Diagnostic Laboratory Information System</div>
                <div className="brand-accreditation">NABL ACCREDITED (ISO 15189:2022) • CAP CERTIFIED • ABDM/ABHA COMPLIANT</div>
              </div>
            </div>

            <div className="header-center">
              <h1 className="form-title">PATIENT REGISTRATION FORM</h1>
              <div className="form-subtitle">Comprehensive Clinical Intake & Medical Record Slip</div>
              <div className="form-dossier-tag">Accredited Outpatient Intake • LIS-REG-A4</div>
            </div>

            <div className="header-right">
              <div className="qr-box">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt="Patient QR Code" />
                ) : qrCodeError ? (
                  <div className="qr-fallback">QR Error</div>
                ) : (
                  <div className="qr-fallback">...</div>
                )}
              </div>
              <div className="header-id-block">
                <div className="uhid-pill">
                  <span className="uhid-label">UHID:</span>
                  <span className="uhid-val">{patientId ? `PAT-${patientId.slice(0, 8)}` : "PAT-REG"}</span>
                </div>
                <div className="datetime-stamp">{dt.date} • {dt.time}</div>
              </div>
              <div className="header-actions no-print">
                <button
                  className="whatsapp-header-button"
                  onClick={() => openWhatsAppComposer("registration")}
                  type="button"
                  title="Send Registration Form & Attached PDF via WhatsApp"
                >
                  <MessageCircle size={12} />
                  WHATSAPP
                </button>
                <button
                  className="email-header-button"
                  onClick={() => openEmailComposer("registration")}
                  type="button"
                  title="Send Registration Form & Attached PDF via Email"
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

          {/* FORM BODY (BALANCED CLINICAL SECTIONS - EXACT 1-PAGE FIT) */}
          <div className="form-body">
            {/* SECTION 01: PERSONAL DEMOGRAPHICS & IDENTIFICATION */}
            <div className="form-section">
              <div className="section-header">
                <div className="section-badge">01</div>
                <div className="section-title">PERSONAL DEMOGRAPHICS & IDENTIFICATION</div>
                <div className="section-header-rule"></div>
              </div>

              {/* Row 1: Legal Name Details */}
              <div className="grid-3-col" style={{ marginBottom: "6px" }}>
                <div className="form-field">
                  <div className="field-label">
                    <User className="field-icon" />
                    First Name <span className="field-required">*</span>
                  </div>
                  <div className={`field-value ${!formData.firstName ? "empty" : ""}`}>
                    {formatDisplayValue(formData.firstName)}
                  </div>
                </div>

                <div className="form-field">
                  <div className="field-label">
                    <User className="field-icon" />
                    Middle Name
                  </div>
                  <div className={`field-value ${!formData.middleName ? "empty" : ""}`}>
                    {formatDisplayValue(formData.middleName)}
                  </div>
                </div>

                <div className="form-field">
                  <div className="field-label">
                    <User className="field-icon" />
                    Last Name <span className="field-required">*</span>
                  </div>
                  <div className={`field-value ${!formData.lastName ? "empty" : ""}`}>
                    {formatDisplayValue(formData.lastName)}
                  </div>
                </div>
              </div>

              {/* Row 2: Demographics */}
              <div className="grid-4-col" style={{ marginBottom: "6px" }}>
                <div className="form-field">
                  <div className="field-label">
                    <Calendar className="field-icon" />
                    Date of Birth <span className="field-required">*</span>
                  </div>
                  <div className={`field-value ${!formData.dateOfBirth ? "empty" : ""}`}>
                    {formatDate(formData.dateOfBirth)}
                  </div>
                </div>

                <div className="form-field">
                  <div className="field-label">
                    <User className="field-icon" />
                    Gender <span className="field-required">*</span>
                  </div>
                  <div className={`field-value ${!formData.gender ? "empty" : ""}`}>
                    {formatDisplayValue(formData.gender)}
                  </div>
                </div>

                <div className="form-field">
                  <div className="field-label">
                    <Heart className="field-icon" />
                    Blood Group
                  </div>
                  <div className={`field-value ${!formData.bloodGroup ? "empty" : ""}`}>
                    {formatBloodGroupDisplay(formData.bloodGroup)}
                  </div>
                </div>

                <div className="form-field">
                  <div className="field-label">
                    <User className="field-icon" />
                    Marital Status
                  </div>
                  <div className={`field-value ${!formData.maritalStatus ? "empty" : ""}`}>
                    {formatDisplayValue(formData.maritalStatus)}
                  </div>
                </div>
              </div>

              {/* Row 3: Nationality, Type, Additional Info */}
              <div className="grid-4-col">
                <div className="form-field">
                  <div className="field-label">
                    <Globe className="field-icon" />
                    Nationality
                  </div>
                  <div className={`field-value ${!formData.nationality ? "empty" : ""}`}>
                    {formatDisplayValue(formData.nationality || "Indian")}
                  </div>
                </div>

                <div className="form-field">
                  <div className="field-label">
                    <User className="field-icon" />
                    Patient Category
                  </div>
                  <div className={`field-value ${!formData.patientType ? "empty" : ""}`}>
                    {formatDisplayValue(formData.patientType || "Outpatient")}
                  </div>
                </div>

                <div className="form-field col-span-2">
                  <div className="field-label">
                    <User className="field-icon" />
                    Clinical / Additional Information
                  </div>
                  <div className={`field-value ${!formData.additionalInformation ? "empty" : ""}`}>
                    {formatDisplayValue(formData.additionalInformation || "None Recorded")}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 02: CONTACT & RESIDENTIAL PARTICULARS */}
            <div className="form-section">
              <div className="section-header">
                <div className="section-badge">02</div>
                <div className="section-title">CONTACT & RESIDENTIAL PARTICULARS</div>
                <div className="section-header-rule"></div>
              </div>

              {/* Row 1: Contact Details */}
              <div className="grid-3-col" style={{ marginBottom: "6px" }}>
                <div className="form-field">
                  <div className="field-label">
                    <Phone className="field-icon" />
                    Primary Phone Number <span className="field-required">*</span>
                  </div>
                  <div className={`field-value ${!formData.phone ? "empty" : ""}`}>
                    {formatDisplayValue(formData.phone)}
                  </div>
                </div>

                <div className="form-field">
                  <div className="field-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "3.5px" }}>
                      <Mail className="field-icon" />
                      Email Address
                    </span>
                    {formData.email && (
                      <span className="email-status-pill no-print" title="Verified Delivery Channel">
                        <CheckCircle size={7.5} /> Verified
                      </span>
                    )}
                  </div>
                  <div
                    className={`field-value ${!formData.email ? "empty" : ""}`}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <span>{formatDisplayValue(formData.email)}</span>
                    {formData.email && (
                      <button
                        type="button"
                        onClick={() => openEmailComposer("registration")}
                        className="email-quick-action no-print"
                        title="Send form with PDF attachment to patient"
                      >
                        <Mail size={9} /> Send PDF
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-field">
                  <div className="field-label">
                    <MapPin className="field-icon" />
                    Residential Street Address <span className="field-required">*</span>
                  </div>
                  <div className={`field-value ${!formData.address ? "empty" : ""}`}>
                    {formatDisplayValue(formData.address)}
                  </div>
                </div>
              </div>

              {/* Row 2: Location Grid */}
              <div className="grid-4-col">
                <div className="form-field">
                  <div className="field-label">
                    <MapPin className="field-icon" />
                    City <span className="field-required">*</span>
                  </div>
                  <div className={`field-value ${!formData.city ? "empty" : ""}`}>
                    {formatDisplayValue(formData.city)}
                  </div>
                </div>

                <div className="form-field">
                  <div className="field-label">
                    <MapPin className="field-icon" />
                    State <span className="field-required">*</span>
                  </div>
                  <div className={`field-value ${!formData.state ? "empty" : ""}`}>
                    {formatDisplayValue(formData.state)}
                  </div>
                </div>

                <div className="form-field">
                  <div className="field-label">
                    <MapPin className="field-icon" />
                    Postal Code / PIN <span className="field-required">*</span>
                  </div>
                  <div className={`field-value ${!formData.postalCode ? "empty" : ""}`}>
                    {formatDisplayValue(formData.postalCode)}
                  </div>
                </div>

                <div className="form-field">
                  <div className="field-label">
                    <Globe className="field-icon" />
                    Country <span className="field-required">*</span>
                  </div>
                  <div className={`field-value ${!formData.country ? "empty" : ""}`}>
                    {formatDisplayValue(formData.country || "India")}
                  </div>
                </div>
              </div>
            </div>

            {/* DUAL SECTION: 03. EMERGENCY CONTACT & 04. HEALTH INSURANCE & SPONSOR */}
            <div className="dual-section-row">
              {/* LEFT: EMERGENCY CONTACT */}
              <div className="dual-section-left">
                <div className="section-header">
                  <div className="section-badge">03</div>
                  <div className="section-title">EMERGENCY CLINICAL CONTACT</div>
                  <div className="section-header-rule"></div>
                </div>

                <div className="grid-2-col" style={{ marginBottom: "6px" }}>
                  <div className="form-field">
                    <div className="field-label">
                      <User className="field-icon" />
                      Contact Name <span className="field-required">*</span>
                    </div>
                    <div className={`field-value ${!formData.emergencyContactName ? "empty" : ""}`}>
                      {formatDisplayValue(formData.emergencyContactName)}
                    </div>
                  </div>

                  <div className="form-field">
                    <div className="field-label">
                      <Phone className="field-icon" />
                      Emergency Phone <span className="field-required">*</span>
                    </div>
                    <div className={`field-value ${!formData.emergencyContactPhone ? "empty" : ""}`}>
                      {formatDisplayValue(formData.emergencyContactPhone)}
                    </div>
                  </div>
                </div>

                <div className="grid-2-col">
                  <div className="form-field">
                    <div className="field-label">
                      <User className="field-icon" />
                      Relationship to Patient
                    </div>
                    <div className={`field-value ${!formData.emergencyContactRelationship ? "empty" : ""}`}>
                      {formatDisplayValue(formData.emergencyContactRelationship || "Family Kin")}
                    </div>
                  </div>

                  <div className="form-field">
                    <div className="field-label">
                      <MapPin className="field-icon" />
                      Contact Address
                    </div>
                    <div className={`field-value ${!formData.emergencyContactAddress ? "empty" : ""}`}>
                      {formatDisplayValue(formData.emergencyContactAddress || "Same as Patient")}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: HEALTH INSURANCE & SPONSOR */}
              <div className="dual-section-right">
                <div className="section-header">
                  <div className="section-badge">04</div>
                  <div className="section-title">HEALTH INSURANCE & SPONSOR</div>
                  <div className="section-header-rule"></div>
                </div>

                <div className="grid-2-col" style={{ marginBottom: "6px" }}>
                  <div className="form-field">
                    <div className="field-label">
                      <CreditCard className="field-icon" />
                      Insurance / TPA Provider
                    </div>
                    <div className={`field-value ${!formData.insuranceProvider ? "empty" : ""}`}>
                      {formatDisplayValue(formData.insuranceProvider || "Direct Self-Pay")}
                    </div>
                  </div>

                  <div className="form-field">
                    <div className="field-label">
                      <CreditCard className="field-icon" />
                      Policy / Card Number
                    </div>
                    <div className={`field-value ${!formData.insuranceNumber ? "empty" : ""}`}>
                      {formatDisplayValue(formData.insuranceNumber)}
                    </div>
                  </div>
                </div>

                <div className="grid-2-col">
                  <div className="form-field">
                    <div className="field-label">
                      <CreditCard className="field-icon" />
                      Corporate / Group ID
                    </div>
                    <div className={`field-value ${!formData.insuranceGroupNumber ? "empty" : ""}`}>
                      {formatDisplayValue(formData.insuranceGroupNumber)}
                    </div>
                  </div>

                  <div className="form-field">
                    <div className="field-label">
                      <Calendar className="field-icon" />
                      Policy Expiry Date
                    </div>
                    <div className={`field-value ${!formData.insuranceExpiryDate ? "empty" : ""}`}>
                      {formatDate(formData.insuranceExpiryDate)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 05: CLINICAL HISTORY & PRE-ANALYTICAL ALERTS */}
            <div className="form-section">
              <div className="section-header">
                <div className="section-badge">05</div>
                <div className="section-title">CLINICAL HISTORY & PRE-ANALYTICAL ALERTS</div>
                <div className="section-header-rule"></div>
              </div>

              <div className="grid-3-col">
                <div className="form-field">
                  <div className="field-label">
                    <Heart className="field-icon" />
                    Known Drug & Environmental Allergies
                  </div>
                  <div className={`field-value ${!formData.allergies ? "empty" : ""}`}>
                    {formData.allergies ? (
                      <span style={{ color: "#DC2626", fontWeight: 700 }}>{formData.allergies}</span>
                    ) : (
                      "No Known Drug Allergies Reported"
                    )}
                  </div>
                </div>

                <div className="form-field">
                  <div className="field-label">
                    <Heart className="field-icon" />
                    Medical Conditions / Diagnoses
                  </div>
                  <div className={`field-value ${!formData.medicalConditions ? "empty" : ""}`}>
                    {formatDisplayValue(formData.medicalConditions || "None Reported")}
                  </div>
                </div>

                <div className="form-field">
                  <div className="field-label">
                    <Heart className="field-icon" />
                    Current Prescribed Medications
                  </div>
                  <div className={`field-value ${!formData.currentMedications ? "empty" : ""}`}>
                    {formatDisplayValue(formData.currentMedications || "None Reported")}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 06: REGULATORY MEDICAL CONSENT & NOTIFICATION */}
            <div className="form-section">
              <div className="section-header">
                <div className="section-badge">06</div>
                <div className="section-title">REGULATORY MEDICAL CONSENT & NOTIFICATION</div>
                <div className="section-header-rule"></div>
              </div>

              <div className="preferences-row">
                <div className="form-field">
                  <div className="field-label">
                    <Globe className="field-icon" />
                    Preferred Language
                  </div>
                  <div className={`field-value ${!formData.preferredLanguage ? "empty" : ""}`}>
                    {formatDisplayValue(formData.preferredLanguage || "English")}
                  </div>
                </div>

                <div className="form-field">
                  <div className="field-label">
                    <MessageCircle className="field-icon" />
                    Preferred Mode
                  </div>
                  <div className={`field-value ${!formData.preferredCommunicationMethod ? "empty" : ""}`}>
                    {formatDisplayValue(formData.preferredCommunicationMethod || "SMS & WhatsApp")}
                  </div>
                </div>

                <div className="form-field">
                  <div className="field-label">Authorized Notification Channels</div>
                  <div className="notification-list">
                    <div className="notification-item">
                      <span className="notification-checkbox checked">✓</span>
                      <span>SMS</span>
                    </div>

                    <div className="notification-item">
                      <span className={`notification-checkbox ${formData.email ? "checked" : "unchecked"}`}>
                        ✓
                      </span>
                      <span>Email</span>
                    </div>

                    <div className="notification-item">
                      <span className="notification-checkbox checked">✓</span>
                      <span>WhatsApp</span>
                    </div>

                    <div className="notification-item">
                      <span className="notification-checkbox unchecked">✓</span>
                      <span>Phone Call</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="consent-box">
                <span className="consent-checkbox">✓</span>
                <span className="consent-text">
                  I hereby consent to the collection, electronic archival, and clinical processing of my diagnostic healthcare data in accordance with statutory medical confidentiality protocols (DISHA, HIPAA, and ISO/IEC 27001 data protection standards).
                </span>
              </div>
            </div>
          </div>

          {/* DUAL SIGNATURE & CLINICAL STAMP SECTION */}
          <div className="signature-section">
            <div className="signature-card">
              <div className="signature-title">Patient / Legal Guardian Attestation</div>
              <div className="signature-statement">
                &ldquo;I certify that the demographic, clinical history, and contact particulars provided above are complete, true, and correct.&rdquo;
              </div>
              <div className="signature-draw-area">
                <div className="signature-meta">{patientFullName}</div>
                <div className="signature-meta">Date: {dt.date}</div>
              </div>
            </div>

            <div className="signature-card">
              <div className="signature-title">Authorized Clinical Intake Officer / Phlebotomist</div>
              <div className="signature-statement">
                &ldquo;Identity verified against official photo ID. Records authenticated in LIS repository.&rdquo;
              </div>
              <div className="signature-draw-area">
                <div className="signature-meta">Officer ID: REG-DESK-01 • {dt.time}</div>
                <div className="stamp-box-inline">Facility Stamp</div>
              </div>
            </div>
          </div>

          {/* LIGHT-WHITE CLINICAL FOOTER */}
          <div className="footer">
            <div className="footer-row">
              <div className="footer-item">
                <Shield className="footer-icon" />
                <span>ISO 15189:2022 Reference Lab</span>
              </div>
              <div className="footer-divider"></div>
              <div className="footer-item">
                <CheckCircle className="footer-icon" />
                <span>HIPAA & DISHA Compliant</span>
              </div>
              <div className="footer-divider"></div>
              <div className="footer-item">
                <Mail className="footer-icon" />
                <span>{laboratoryInfo.email}</span>
              </div>
              <div className="footer-divider"></div>
              <div className="footer-item">
                <Phone className="footer-icon" />
                <span>{laboratoryInfo.phone}</span>
              </div>
              <div className="footer-divider"></div>
              <div className="footer-item">
                <MapPin className="footer-icon" />
                <span>{laboratoryInfo.address}</span>
              </div>
            </div>

            <div className="footer-bottom">
              <div className="footer-security">
                <Shield className="footer-icon" />
                <span>Electronic Medical Record (EMR) • Cryptographically Authenticated by LabCore ELIS LIS • Confidential Document</span>
              </div>
              <div className="footer-page-index">
                Page 1 of 1 • Single-Sheet Clinical Dossier
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS (SCREEN ONLY) */}
          <div className="action-buttons no-print">
            {onClose && (
              <button onClick={onClose} className="btn btn-secondary" type="button">
                <X size={14} />
                Close
              </button>
            )}
            <button
              onClick={() => openWhatsAppComposer("registration")}
              className="btn btn-whatsapp"
              type="button"
              title="Compose and dispatch patient WhatsApp message with PDF"
            >
              <MessageCircle size={14} />
              WhatsApp Form
            </button>
            <button
              onClick={() => openEmailComposer("registration")}
              className="btn btn-email"
              type="button"
              title="Compose and send patient email with PDF attached"
            >
              <Mail size={14} />
              Email Form
            </button>
            <button
              onClick={handleDownloadPdf}
              className="btn btn-secondary"
              type="button"
              title="Download high-resolution 1-Page A4 PDF"
              disabled={pdfGenerating}
            >
              {pdfGenerating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Download PDF
            </button>
            {onSave && (
              <button onClick={handleSave} className="btn btn-secondary" type="button">
                <FileText size={14} />
                Save Draft
              </button>
            )}
            <button onClick={handlePrint} className="btn btn-primary" type="button">
              <Printer size={14} />
              Print Form
            </button>
          </div>
        </div>

        {/* =======================================================
            ADVANCED EMAIL COMPOSER MODAL WITH ATTACHED FORM PDF
            ======================================================= */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[94vh]">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 px-6 py-4 text-white flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight">Patient Email Dispatcher</h3>
                    <p className="text-xs text-blue-100 font-medium">
                      Sending registration document & PDF to <span className="font-semibold text-white">{patientFullName}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSmtpConfig(!showSmtpConfig)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      showSmtpConfig
                        ? "bg-white text-blue-900 shadow-sm"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                    title="Configure SMTP / Gmail App Password"
                  >
                    <Key size={13} />
                    <span>SMTP Setup</span>
                  </button>
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Template Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Select Email Template
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">4 Ready-to-Send Formats</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEmailTemplate("registration");
                        generateTemplateContent("registration", patientFullName, emailTo);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        emailTemplate === "registration"
                          ? "border-blue-600 bg-blue-50 text-blue-900 shadow-xs ring-2 ring-blue-500/20"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <FileText size={13} className="text-blue-600" />
                        Registration
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">Official form copy</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEmailTemplate("welcome");
                        generateTemplateContent("welcome", patientFullName, emailTo);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        emailTemplate === "welcome"
                          ? "border-purple-600 bg-purple-50 text-purple-900 shadow-xs ring-2 ring-purple-500/20"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Sparkles size={13} className="text-purple-600" />
                        Portal
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">Welcome & portal</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEmailTemplate("test_instructions");
                        generateTemplateContent("test_instructions", patientFullName, emailTo);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        emailTemplate === "test_instructions"
                          ? "border-teal-600 bg-teal-50 text-teal-900 shadow-xs ring-2 ring-teal-500/20"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Heart size={13} className="text-teal-600" />
                        Pre-Test
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">Fasting instructions</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEmailTemplate("summary");
                        generateTemplateContent("summary", patientFullName, emailTo);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        emailTemplate === "summary"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs ring-2 ring-indigo-500/20"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle size={13} className="text-indigo-600" />
                        Summary
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">Quick receipt</div>
                    </button>
                  </div>
                </div>

                {/* Recipient Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Recipient Email (To) <span className="text-orange-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="patient@example.com"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      CC (Optional - Doctor / Guardian)
                    </label>
                    <input
                      type="email"
                      value={emailCc}
                      onChange={(e) => setEmailCc(e.target.value)}
                      placeholder="doctor@hospital.in"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Subject Line */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Email Subject Line <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Email Body */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Email Message Content
                    </label>
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                    >
                      {copiedNotice ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy Message</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg text-xs font-mono text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none leading-relaxed resize-none"
                  ></textarea>
                </div>

                {/* =======================================================
                    ATTACHMENT CARD (PATIENT REGISTRATION PDF)
                    ======================================================= */}
                <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={attachPdf}
                        onChange={(e) => setAttachPdf(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Attach Patient Registration Form PDF
                      </span>
                    </label>

                    <div className="flex items-center gap-2">
                      {pdfGenerating ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full animate-pulse">
                          <Loader2 size={10} className="animate-spin" /> Rendering Crisp PDF...
                        </span>
                      ) : pdfBase64 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          <FileCheck size={11} /> PDF Ready & Attached ✓
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => generateFormPdfBase64()}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline"
                        >
                          Generate PDF
                        </button>
                      )}
                    </div>
                  </div>

                  {attachPdf && (
                    <div className="flex items-center justify-between bg-white border border-blue-200/90 rounded-lg p-2.5 shadow-xs">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0 font-black text-[10px] border border-red-200">
                          PDF
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-slate-800 truncate" title={patientSafeFilename}>
                            {patientSafeFilename}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            A4 Medical Document • 1-Page Layout • Uncut Headers & Labels
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={handlePreviewPdf}
                          disabled={pdfGenerating}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                          title="Preview the exact rendered PDF in a new tab"
                        >
                          <Eye size={12} />
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadPdf}
                          disabled={pdfGenerating}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors shadow-xs"
                          title="Download copy of this PDF to your computer"
                        >
                          <Download size={12} />
                          Download
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* =======================================================
                    INLINE SMTP & GMAIL APP PASSWORD SETUP DRAWER
                    ======================================================= */}
                {showSmtpConfig && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span className="text-xs font-bold text-amber-900">
                          Gmail SMTP Setup (App Password Required)
                        </span>
                      </div>
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1"
                      >
                        Generate Google App Password ↗
                      </a>
                    </div>

                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Google requires a <strong>16-character App Password</strong> (e.g. <code className="bg-amber-100 px-1 rounded">abcd efgh ijkl mnop</code>) to send emails with attachments from software. Standard account passwords are blocked by Google.
                    </p>

                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={smtpPasswordInput}
                        onChange={(e) => setSmtpPasswordInput(e.target.value)}
                        placeholder="Paste 16-character App Password"
                        className="flex-1 px-3 py-1.5 border border-amber-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleTestAndSaveSmtp}
                        disabled={smtpTesting || !smtpPasswordInput.trim()}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
                      >
                        {smtpTesting ? (
                          <>
                            <Loader2 size={12} className="animate-spin" /> Verifying...
                          </>
                        ) : (
                          <>
                            <Check size={12} /> Verify & Save
                          </>
                        )}
                      </button>
                    </div>

                    {smtpTestStatus && (
                      <div
                        className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                          smtpTestStatus.success
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-red-100 text-red-800 border border-red-300"
                        }`}
                      >
                        {smtpTestStatus.success ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                        <span>{smtpTestStatus.message}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* =======================================================
                    MULTI-CHANNEL QUICK DISPATCH OPTIONS
                    ======================================================= */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Quick Sharing Channels
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={handleSendViaWebGmail}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/60 text-slate-700 flex items-center justify-between transition-all group"
                      title="Downloads PDF & opens Web Gmail with recipient, subject, and body ready"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                          M
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-slate-800">Web Gmail</div>
                          <div className="text-[10px] text-slate-500">Opens in browser</div>
                        </div>
                      </div>
                      <ExternalLink size={12} className="text-slate-400 group-hover:text-red-600" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowEmailModal(false);
                        openWhatsAppComposer(emailTemplate);
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/60 text-slate-700 flex items-center justify-between transition-all group"
                      title="Open Advanced WhatsApp Dispatcher with PDF"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <MessageCircle size={15} />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-slate-800">WhatsApp</div>
                          <div className="text-[10px] text-slate-500">Advanced Dispatcher</div>
                        </div>
                      </div>
                      <ExternalLink size={12} className="text-slate-400 group-hover:text-emerald-600" />
                    </button>

                    <button
                      type="button"
                      onClick={handleDirectMailClientFallback}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/60 text-slate-700 flex items-center justify-between transition-all group"
                      title="Downloads PDF & opens Outlook or desktop default mail client"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Mail size={15} />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-slate-800">Mail Client</div>
                          <div className="text-[10px] text-slate-500">Outlook / Desktop</div>
                        </div>
                      </div>
                      <ExternalLink size={12} className="text-slate-400 group-hover:text-blue-600" />
                    </button>
                  </div>
                </div>

                {/* Status Notices */}
                {statusNotice && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium flex items-start gap-2 animate-in fade-in">
                    <AlertCircle size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{statusNotice}</span>
                  </div>
                )}

                {emailError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium space-y-2 animate-in fade-in">
                    <div className="flex items-start gap-2">
                      <X size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-bold">Email Dispatch Error: </span>
                        <span>{emailError}</span>
                      </div>
                    </div>
                    {emailError.includes("Application-specific password") || emailError.includes("Invalid login") ? (
                      <div className="bg-white/80 p-2.5 rounded-lg border border-red-200 text-[11px] text-red-800 flex items-center justify-between">
                        <span>Click <strong>SMTP Setup</strong> above to enter your Gmail 16-character App Password.</span>
                        <button
                          type="button"
                          onClick={() => setShowSmtpConfig(true)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-[10px] transition-colors"
                        >
                          Setup Password
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}

                {emailSentSuccess && !statusNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2 animate-in zoom-in-95">
                    <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>Registration Form & PDF successfully sent to {emailTo}!</span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePreviewPdf}
                  disabled={pdfGenerating}
                  className="text-xs text-slate-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Eye size={13} />
                  Preview Form PDF
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    disabled={emailSending}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={emailSending || !emailTo.trim() || pdfGenerating}
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 inline-flex items-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {emailSending ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Sending Email with Attached PDF...
                      </>
                    ) : emailSentSuccess ? (
                      <>
                        <Check size={14} />
                        Dispatched with PDF!
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        Send Email with Form PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            ADVANCED WHATSAPP DISPATCHER MODAL WITH DIRECT PDF
            ======================================================= */}
        {showWhatsAppModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[94vh]">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 px-6 py-4 text-white flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner relative">
                    <MessageCircle className="w-5 h-5 text-white" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight">Patient WhatsApp Dispatcher (Advanced)</h3>
                    <p className="text-xs text-emerald-100 font-medium">
                      Direct send with Registration PDF to <span className="font-semibold text-white">{patientFullName}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWhatsAppConfig(!showWhatsAppConfig)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      showWhatsAppConfig
                        ? "bg-white text-emerald-900 shadow-sm"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                    title="Configure Twilio / WhatsApp Business API"
                  >
                    <Key size={13} />
                    <span>API Setup</span>
                  </button>
                  <button
                    onClick={() => setShowWhatsAppModal(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Template Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Select WhatsApp Template
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">4 Ready-to-Send Formats</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setWhatsappTemplate("registration");
                        generateWhatsAppTemplateContent("registration", patientFullName, whatsappPhone, hostedPdfUrl);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        whatsappTemplate === "registration"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <FileText size={13} className="text-emerald-600" />
                        Registration
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">Official form & PDF</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setWhatsappTemplate("welcome");
                        generateWhatsAppTemplateContent("welcome", patientFullName, whatsappPhone, hostedPdfUrl);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        whatsappTemplate === "welcome"
                          ? "border-teal-600 bg-teal-50 text-teal-900 shadow-xs ring-2 ring-teal-500/20"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Sparkles size={13} className="text-teal-600" />
                        Portal
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">Welcome & portal</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setWhatsappTemplate("test_instructions");
                        generateWhatsAppTemplateContent("test_instructions", patientFullName, whatsappPhone, hostedPdfUrl);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        whatsappTemplate === "test_instructions"
                          ? "border-cyan-600 bg-cyan-50 text-cyan-900 shadow-xs ring-2 ring-cyan-500/20"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Heart size={13} className="text-cyan-600" />
                        Pre-Test
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">Fasting guidelines</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setWhatsappTemplate("summary");
                        generateWhatsAppTemplateContent("summary", patientFullName, whatsappPhone, hostedPdfUrl);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        whatsappTemplate === "summary"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle size={13} className="text-emerald-600" />
                        Summary
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">Quick receipt</div>
                    </button>
                  </div>
                </div>

                {/* Recipient Phone Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Recipient WhatsApp Phone Number <span className="text-orange-500">*</span>
                    </label>
                    {whatsappPhone && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle size={11} /> +{normalizePhoneNumber(whatsappPhone)}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={whatsappPhone}
                      onChange={(e) => {
                        setWhatsappPhone(e.target.value);
                        generateWhatsAppTemplateContent(whatsappTemplate, patientFullName, e.target.value, hostedPdfUrl);
                      }}
                      placeholder="e.g. 917202885030 or 9876543210"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    10-digit Indian numbers auto-prefix with country code 91. Enter international numbers with country code.
                  </p>
                </div>

                {/* WhatsApp Message Body */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      WhatsApp Message Content
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {whatsappMessage.length} characters
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyWhatsAppMessage}
                        className="text-[11px] text-emerald-600 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
                      >
                        {whatsappCopiedNotice ? (
                          <>
                            <Check size={12} className="text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy Text</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={6}
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg text-xs font-mono text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none leading-relaxed resize-none"
                  ></textarea>
                </div>

                {/* =======================================================
                    ATTACHMENT CARD (PATIENT REGISTRATION PDF & HOSTED LINK)
                    ======================================================= */}
                <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={whatsappAttachPdf}
                        onChange={(e) => setWhatsappAttachPdf(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Include Official Registration Form PDF & Direct Link
                      </span>
                    </label>

                    <div className="flex items-center gap-2">
                      {pdfGenerating || pdfHosting ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-teal-700 bg-teal-100 px-2.5 py-0.5 rounded-full animate-pulse">
                          <Loader2 size={10} className="animate-spin" /> Rendering & Hosting PDF...
                        </span>
                      ) : (pdfBase64 || hostedPdfUrl) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          <FileCheck size={11} /> PDF Ready & Hosted ✓
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            const b64 = await generateFormPdfBase64();
                            if (b64) {
                              setPdfHosting(true);
                              try {
                                const up = await communicationApi.uploadPdf({ filename: patientSafeFilename, content: b64 });
                                if (up?.data?.url) {
                                  setHostedPdfUrl(up.data.url);
                                  generateWhatsAppTemplateContent(whatsappTemplate, patientFullName, whatsappPhone, up.data.url);
                                }
                              } finally {
                                setPdfHosting(false);
                              }
                            }
                          }}
                          className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                        >
                          Generate PDF
                        </button>
                      )}
                    </div>
                  </div>

                  {whatsappAttachPdf && (
                    <div className="flex items-center justify-between bg-white border border-emerald-200/90 rounded-lg p-2.5 shadow-xs">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0 font-black text-[10px] border border-red-200">
                          PDF
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-slate-800 truncate" title={patientSafeFilename}>
                            {patientSafeFilename}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            A4 Medical Document • 1-Page Layout • Hosted on LabCore Secure Server
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={handlePreviewPdf}
                          disabled={pdfGenerating}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                          title="Preview the exact rendered PDF in a new tab"
                        >
                          <Eye size={12} />
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadPdf}
                          disabled={pdfGenerating}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors shadow-xs"
                          title="Download copy of this PDF to your computer"
                        >
                          <Download size={12} />
                          Download
                        </button>
                        {hostedPdfUrl && (
                          <button
                            type="button"
                            onClick={handleCopyPdfLink}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 transition-colors shadow-xs"
                            title="Copy direct permanent link to the hosted PDF document"
                          >
                            <Copy size={12} />
                            {whatsappLinkCopiedNotice ? "Copied!" : "Link"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* =======================================================
                    INLINE TWILIO / WHATSAPP API SETUP DRAWER
                    ======================================================= */}
                {showWhatsAppConfig && (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-bold text-emerald-900">
                          WhatsApp Provider API Configuration (Twilio / Meta Cloud)
                        </span>
                      </div>
                      <a
                        href="https://www.twilio.com/console"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        Twilio Console ↗
                      </a>
                    </div>

                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      For automated background API dispatch, enter your Twilio Account SID and Auth Token. (Alternatively, you can always click <strong>Open in WhatsApp Web</strong> below to send instantly with zero configuration!)
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={whatsappApiKeyInput}
                        onChange={(e) => setWhatsappApiKeyInput(e.target.value)}
                        placeholder="Twilio Account SID (e.g. AC...)"
                        className="px-3 py-1.5 border border-emerald-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <input
                        type="password"
                        value={whatsappApiSecretInput}
                        onChange={(e) => setWhatsappApiSecretInput(e.target.value)}
                        placeholder="Twilio Auth Token"
                        className="px-3 py-1.5 border border-emerald-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={whatsappSenderIdInput}
                        onChange={(e) => setWhatsappSenderIdInput(e.target.value)}
                        placeholder="Sender Number (e.g. whatsapp:+14155238886)"
                        className="flex-1 px-3 py-1.5 border border-emerald-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleTestAndSaveWhatsApp}
                        disabled={whatsappTesting || !whatsappApiKeyInput.trim() || !whatsappApiSecretInput.trim()}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
                      >
                        {whatsappTesting ? (
                          <>
                            <Loader2 size={12} className="animate-spin" /> Verifying...
                          </>
                        ) : (
                          <>
                            <Check size={12} /> Verify & Save
                          </>
                        )}
                      </button>
                    </div>

                    {whatsappTestStatus && (
                      <div
                        className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                          whatsappTestStatus.success
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-red-100 text-red-800 border border-red-300"
                        }`}
                      >
                        {whatsappTestStatus.success ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                        <span>{whatsappTestStatus.message}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Notices */}
                {whatsappStatusNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-start gap-2 animate-in fade-in">
                    <CheckCircle size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{whatsappStatusNotice}</span>
                  </div>
                )}

                {whatsappError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium space-y-2 animate-in fade-in">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-bold">WhatsApp Dispatch Notice: </span>
                        <span>{whatsappError}</span>
                      </div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-lg border border-red-200 text-[11px] text-slate-700 flex items-center justify-between">
                      <span>No API credentials? You can send immediately via <strong>Open in WhatsApp Web</strong> without setup.</span>
                      <button
                        type="button"
                        onClick={handleOpenWhatsAppWeb}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] transition-colors inline-flex items-center gap-1"
                      >
                        <ExternalLink size={11} /> Open WhatsApp Web
                      </button>
                    </div>
                  </div>
                )}

                {whatsappSentSuccess && !whatsappStatusNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2 animate-in zoom-in-95">
                    <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>Registration Form & PDF link successfully sent via WhatsApp!</span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePreviewPdf}
                  disabled={pdfGenerating}
                  className="text-xs text-slate-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Eye size={13} />
                  Preview Form PDF
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowWhatsAppModal(false)}
                    disabled={whatsappSending}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenWhatsAppWeb}
                    className="px-3.5 py-2 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs"
                    title="Opens WhatsApp Web or mobile app directly with preloaded text & hosted PDF link"
                  >
                    <ExternalLink size={13} />
                    Open in WhatsApp Web
                  </button>

                  <button
                    type="button"
                    onClick={handleSendDirectWhatsApp}
                    disabled={whatsappSending || !whatsappPhone.trim() || pdfGenerating}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/20 inline-flex items-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {whatsappSending ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Dispatching via WhatsApp...
                      </>
                    ) : whatsappSentSuccess ? (
                      <>
                        <Check size={14} />
                        Dispatched with PDF!
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        Send Direct (API)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}