"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import QRCode from "qrcode";
import type { Invoice } from "./InvoiceTable";

interface InvoiceItem {
  id: string | number;
  testName?: string;
  testCode?: string;
  hsnSacCode?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  taxableValue?: number;
  cgstPercent?: number;
  cgstAmount?: number;
  sgstPercent?: number;
  sgstAmount?: number;
  igstPercent?: number;
  igstAmount?: number;
  total?: number;
}

interface RefinedGSTInvoiceProps {
  invoice: Invoice;
  items?: InvoiceItem[];
  taxAmount?: number;
  discountAmount?: number;
  notes?: string;
  patientInfo?: {
    age?: string;
    gender?: string;
    phone?: string;
    address?: string;
    email?: string;
  };
  doctorInfo?: {
    name?: string;
    qualification?: string;
    gstin?: string;
    address?: string;
  };
  payments?: Array<{
    amount: number;
    method: string;
    transactionId?: string;
    paidAt: string;
  }>;
  labInfo?: {
    name?: string;
    address?: string;
    phone?: string;
    gstin?: string;
    pan?: string;
    email?: string;
    website?: string;
    bankDetails?: {
      bankName?: string;
      accountNumber?: string;
      ifsc?: string;
      branch?: string;
    };
    upiId?: string;
  };
  onClose?: () => void;
}

function formatCurrency(amount?: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date?: string) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "");
  }
  
  function convert(n: number): string {
    if (n === 0) return "Zero";
    
    let result = "";
    
    if (Math.floor(n / 10000000) > 0) {
      result += convertLessThanThousand(Math.floor(n / 10000000)) + " Crore ";
      n %= 10000000;
    }
    
    if (Math.floor(n / 100000) > 0) {
      result += convertLessThanThousand(Math.floor(n / 100000)) + " Lakh ";
      n %= 100000;
    }
    
    if (Math.floor(n / 1000) > 0) {
      result += convertLessThanThousand(Math.floor(n / 1000)) + " Thousand ";
      n %= 1000;
    }
    
    result += convertLessThanThousand(n);
    
    return result.trim();
  }
  
  return convert(num);
}

function statusClass(status?: string) {
  const value = status?.toLowerCase();
  if (value === "paid" || value === "completed") {
    return "status-badge-paid";
  }
  if (value === "overdue" || value === "cancelled" || value === "failed") {
    return "status-badge-overdue";
  }
  if (value === "partial" || value === "pending") {
    return "status-badge-due";
  }
  return "status-badge-due";
}

export default function RefinedGSTInvoice({
  invoice,
  items = [],
  taxAmount = 0,
  discountAmount = 0,
  notes,
  patientInfo,
  doctorInfo,
  payments = [],
  labInfo,
  onClose,
}: RefinedGSTInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [generatingQR, setGeneratingQR] = useState(false);

  const laboratoryInfo = labInfo || {
    name: "LABCORE ELIS",
    address: "123 Healthcare Avenue, Medical District, City - 560001",
    phone: "+91-9876543210",
    gstin: "29ABCDE1234F1Z5",
    pan: "ABCDE1234F",
    email: "billing@labcore.com",
    website: "www.labcore.com",
    bankDetails: {
      bankName: "ABC Bank",
      accountNumber: "1234567890123",
      ifsc: "ABCD0123456",
      branch: "Main Branch, City"
    },
    upiId: "labcore@upi"
  };

  const total = Number(invoice.totalAmount || 0);
  const paid = Number(invoice.paidAmount || 0);
  const pending = invoice.pendingAmount !== undefined 
    ? Number(invoice.pendingAmount) 
    : Math.max(0, total - paid);

  // Fixed data integrity
  const subtotal = items.reduce((sum, item) => sum + (item.taxableValue || item.total || 0), 0);
  const totalGST = items.reduce((sum, item) => sum + (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0), 0);
  const grandTotal = subtotal + totalGST - Number(discountAmount);

  const generateQRCode = useCallback(async () => {
    if (qrCodeRef.current && invoice.invoiceNumber) {
      try {
        const qrData = JSON.stringify({
          inv: invoice.invoiceNumber,
          gst: laboratoryInfo.gstin,
          amt: grandTotal,
          dt: invoice.createdAt?.split('T')[0]
        });
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          width: 100,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#0D4F4A',
            light: '#ffffff'
          }
        });
        
        const img = document.createElement('img');
        img.src = qrCodeDataURL;
        img.style.width = '64px';
        img.style.height = '64px';
        img.alt = 'Invoice QR Code';
        qrCodeRef.current.innerHTML = '';
        qrCodeRef.current.appendChild(img);
      } catch (error) {
        console.error('QR Code generation failed:', error);
        if (qrCodeRef.current) {
          qrCodeRef.current.innerHTML = '<div class="text-xs text-gray-400">QR Unavailable</div>';
        }
      }
    }
  }, [invoice.invoiceNumber, invoice.createdAt, laboratoryInfo.gstin, grandTotal]);

  useEffect(() => {
    setGeneratingQR(true);
    generateQRCode().finally(() => {
      setGeneratingQR(false);
      setLoading(false);
    });
  }, [generateQRCode]);

  const handlePrint = () => {
    if (invoiceRef.current) {
      const printContent = invoiceRef.current.innerHTML;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>TAX INVOICE ${invoice.invoiceNumber}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap');
              
              :root {
                --color-accent: #0D4F4A;
                --color-accent-light: #1A6B65;
                --color-accent-tint: rgba(13, 79, 74, 0.08);
                --color-accent-border: rgba(13, 79, 74, 0.2);
                --color-text-primary: #1A1A1A;
                --color-text-secondary: #4A4A4A;
                --color-text-muted: #6B6B6B;
                --color-base: #FAFAF8;
                --color-white: #FFFFFF;
                --color-gray-light: #F5F5F5;
                --color-border: #E0E0E0;
                --color-border-light: #F0F0F0;
                --color-success: #0D4F4A;
                --color-success-bg: rgba(13, 79, 74, 0.1);
                --color-warning: #B45309;
                --color-warning-bg: rgba(180, 83, 9, 0.1);
                --color-error: #B91C1C;
                --color-error-bg: rgba(185, 28, 28, 0.1);
                --font-serif: 'Cormorant Garamond', Georgia, serif;
                --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                --spacing-section: 32px;
                --spacing-field: 8px;
                --spacing-tight: 20px;
                --spacing-snug: 24px;
              }
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: var(--font-sans);
                font-size: 11px;
                color: var(--color-text-primary);
                background: var(--color-base);
                line-height: 1.5;
                -webkit-font-smoothing: antialiased;
              }
              
              .invoice-page {
                width: 210mm;
                min-height: 297mm;
                margin: 0 auto;
                padding: 15mm;
                background: white;
                position: relative;
              }
              
              .invoice-page::before {
                content: '';
                position: absolute;
                top: 8mm;
                left: 8mm;
                right: 8mm;
                bottom: 8mm;
                border: 2px solid var(--color-accent);
                pointer-events: none;
                z-index: 1;
                opacity: 0.6;
              }
              
              .invoice-content {
                position: relative;
                z-index: 2;
              }
              
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: var(--spacing-section);
                padding-bottom: var(--spacing-section);
                border-bottom: 1px solid var(--color-border);
              }
              
              .company-branding {
                display: flex;
                align-items: center;
                gap: 16px;
              }
              
              .accent-bar {
                width: 2px;
                height: 48px;
                background: var(--color-accent);
              }
              
              .company-info {
                display: flex;
                flex-direction: column;
              }
              
              .company-name {
                font-family: var(--font-serif);
                font-size: 26px;
                font-weight: 500;
                color: var(--color-accent);
                letter-spacing: 0.3px;
                margin-bottom: 4px;
                line-height: 1.1;
              }
              
              .company-tagline {
                font-size: 9px;
                color: var(--color-text-secondary);
                text-transform: uppercase;
                letter-spacing: 2px;
                font-weight: 500;
              }
              
              .invoice-meta {
                text-align: right;
                position: relative;
              }
              
              .invoice-title {
                font-family: var(--font-serif);
                font-size: 14px;
                font-weight: 500;
                color: var(--color-text-primary);
                letter-spacing: 1px;
                margin-bottom: 8px;
                text-transform: uppercase;
              }
              
              .invoice-number-row {
                display: flex;
                align-items: center;
                gap: 12px;
                justify-content: flex-end;
                margin-bottom: 8px;
              }
              
              .invoice-number {
                font-family: var(--font-sans);
                font-size: 12px;
                font-weight: 600;
                color: var(--color-text-primary);
                letter-spacing: 0.5px;
              }
              
              .status-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 9px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.6px;
                border: 1px solid var(--color-accent-border);
                background: var(--color-accent-tint);
                color: var(--color-accent);
              }
              
              .status-badge svg {
                width: 12px;
                height: 12px;
              }
              
              .status-badge-paid {
                border-color: var(--color-success);
                background: var(--color-success-bg);
                color: var(--color-success);
              }
              
              .status-badge-due {
                border-color: var(--color-warning);
                background: var(--color-warning-bg);
                color: var(--color-warning);
              }
              
              .status-badge-overdue {
                border-color: var(--color-error);
                background: var(--color-error-bg);
                color: var(--color-error);
              }
              
              .meta-row {
                display: flex;
                justify-content: flex-end;
                gap: 24px;
                font-size: 10px;
                color: var(--color-text-secondary);
                margin-top: 8px;
              }
              
              .meta-item {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
              }
              
              .meta-label {
                font-size: 8px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--color-text-muted);
                margin-bottom: 2px;
                font-weight: 500;
              }
              
              .meta-value {
                font-weight: 500;
                color: var(--color-text-primary);
              }
              
              .section-label {
                font-size: 9px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: var(--color-accent);
                margin-bottom: 12px;
                font-family: var(--font-sans);
              }
              
              .party-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                margin-bottom: var(--spacing-section);
              }
              
              .party-section {
                padding: 0;
              }
              
              .party-name {
                font-family: var(--font-serif);
                font-size: 14px;
                font-weight: 500;
                color: var(--color-text-primary);
                margin-bottom: var(--spacing-field);
                line-height: 1.3;
              }
              
              .party-detail {
                font-size: 10px;
                color: var(--color-text-secondary);
                margin-bottom: var(--spacing-field);
                line-height: 1.4;
              }
              
              .party-detail strong {
                font-weight: 500;
                color: var(--color-text-primary);
              }
              
              .table-section {
                margin-bottom: var(--spacing-section);
              }
              
              .invoice-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10px;
              }
              
              .invoice-table thead {
                border-bottom: 2px solid var(--color-accent);
              }
              
              .invoice-table th {
                font-family: var(--font-sans);
                font-size: 8px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                color: var(--color-accent);
                padding: 12px 16px;
                text-align: left;
                background: transparent;
              }
              
              .invoice-table th.text-right {
                text-align: right;
              }
              
              .invoice-table th.text-center {
                text-align: center;
              }
              
              .invoice-table td {
                padding: 16px;
                border-bottom: 1px solid var(--color-border-light);
                color: var(--color-text-primary);
                vertical-align: top;
              }
              
              .invoice-table td.text-right {
                text-align: right;
              }
              
              .invoice-table td.text-center {
                text-align: center;
              }
              
              .invoice-table tr:last-child td {
                border-bottom: none;
              }
              
              .invoice-table tbody tr:nth-child(even) {
                background: rgba(0, 0, 0, 0.02);
              }
              
              .tabular-nums {
                font-feature-settings: "tnum";
                font-variant-numeric: tabular-nums;
              }
              
              .amount {
                font-weight: 500;
              }
              
              .total-amount {
                font-weight: 600;
              }
              
              .summary-section {
                display: flex;
                justify-content: flex-end;
                margin-bottom: var(--spacing-section);
              }
              
              .summary-box {
                width: 280px;
                padding: var(--spacing-tight);
                background: var(--color-accent-tint);
                border: 1px solid var(--color-accent);
                position: relative;
              }
              
              .summary-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--spacing-field);
                font-size: 10px;
              }
              
              .summary-row:last-child {
                margin-bottom: 0;
              }
              
              .summary-row.total {
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid var(--color-accent);
              }
              
              .summary-label {
                color: var(--color-text-secondary);
                font-weight: 500;
              }
              
              .summary-value {
                font-weight: 600;
                color: var(--color-text-primary);
              }
              
              .grand-total {
                font-family: var(--font-serif);
                font-size: 14px;
                font-weight: 500;
                color: var(--color-accent);
              }
              
              .grand-total-value {
                font-family: var(--font-serif);
                font-size: 34px;
                font-weight: 500;
                color: var(--color-accent);
                line-height: 1;
              }
              
              .amount-in-words {
                font-size: 9px;
                color: var(--color-text-muted);
                font-style: italic;
                margin-top: var(--spacing-field);
                line-height: 1.3;
                font-family: var(--font-serif);
              }
              
              .balance-due {
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid var(--color-border);
              }
              
              .balance-due .summary-label {
                font-weight: 600;
                color: var(--color-text-primary);
              }
              
              .balance-due .summary-value {
                font-weight: 700;
                color: var(--color-error);
              }
              
              .qr-section {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: var(--spacing-section);
                padding: 20px;
                background: var(--color-gray-light);
                border: 1px solid var(--color-border);
              }
              
              .qr-code {
                width: 64px;
                height: 64px;
                background: white;
                border: 1px solid var(--color-border);
                padding: 4px;
              }
              
              .qr-code img {
                width: 100%;
                height: 100%;
                display: block;
              }
              
              .qr-info {
                flex: 1;
              }
              
              .qr-title {
                font-size: 10px;
                font-weight: 600;
                color: var(--color-accent);
                margin-bottom: 4px;
              }
              
              .qr-description {
                font-size: 9px;
                color: var(--color-text-secondary);
                line-height: 1.4;
              }
              
              .bank-details {
                margin-bottom: var(--spacing-section);
              }
              
              .bank-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px 24px;
              }
              
              .bank-item {
                font-size: 10px;
              }
              
              .bank-label {
                font-size: 8px;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                color: var(--color-text-muted);
                margin-bottom: 2px;
                font-weight: 500;
              }
              
              .bank-value {
                font-weight: 500;
                color: var(--color-text-primary);
              }
              
              .footer {
                margin-top: var(--spacing-section);
                padding-top: var(--spacing-section);
                border-top: 1px solid var(--color-border);
                text-align: center;
              }
              
              .footer-content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                margin-bottom: 16px;
              }
              
              .footer-section {
                text-align: left;
              }
              
              .footer-text {
                font-size: 11px;
                color: var(--color-text-muted);
                margin-bottom: 4px;
                line-height: 1.4;
              }
              
              .footer-terms {
                font-size: 9px;
                color: var(--color-text-muted);
                line-height: 1.4;
              }
              
              .footer-signature {
                margin-top: 16px;
                display: flex;
                justify-content: flex-end;
              }
              
              .signature-line {
                width: 180px;
                border-top: 1px solid var(--color-accent);
                padding-top: 8px;
                text-align: center;
              }
              
              .signature-text {
                font-size: 10px;
                color: var(--color-text-muted);
                font-weight: 500;
              }
              
              @media print {
                body {
                  margin: 0;
                  background: white;
                }
                
                .invoice-page {
                  box-shadow: none;
                  margin: 0;
                  width: 100%;
                  page-break-after: always;
                }
                
                .invoice-page::before,
                .status-badge {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
              
              @page {
                size: A4;
                margin: 0;
              }
            </style>
          </head>
          <body>
            <div class="invoice-page">
              <div class="invoice-content">
                ${printContent}
              </div>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
        onClose?.();
      }
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Preparing refined invoice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
              <div className="h-5 w-0.5 bg-emerald-700"></div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Refined GST Invoice</h3>
              <p className="text-sm text-gray-600">
                Invoice: <span className="font-medium">{invoice.invoiceNumber || `INV-${invoice.id}`}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose?.()}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            {/* Invoice Preview */}
            <div 
              ref={invoiceRef} 
              className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
              style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
            >
              <div className="p-8" style={{ background: '#FAFAF8' }}>
                {/* Header */}
                <header className="flex justify-between items-start mb-8 pb-8" style={{ borderBottom: '1px solid #E0E0E0' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-0.5 h-12" style={{ background: '#0D4F4A' }}></div>
                    <div className="flex flex-col">
                      <h1 className="text-2xl font-medium" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#0D4F4A', letterSpacing: '0.3px', lineHeight: 1.1 }}>
                        {laboratoryInfo.name}
                      </h1>
                      <p className="text-xs uppercase tracking-widest" style={{ color: '#4A4A4A', fontWeight: 500, letterSpacing: '2px', fontSize: '9px' }}>
                        Enterprise Laboratory Information System
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <h2 className="text-sm font-medium tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#1A1A1A', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      Tax Invoice
                    </h2>
                    <div className="flex items-center gap-3 justify-end mt-2">
                      <span className="text-xs font-semibold" style={{ color: '#1A1A1A', letterSpacing: '0.5px' }}>
                        {invoice.invoiceNumber || `INV-${invoice.id}`}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${statusClass(invoice.paymentStatus || invoice.status)}`} style={{ fontSize: '9px', letterSpacing: '0.6px' }}>
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        {invoice.paymentStatus || invoice.status || "Pending"}
                      </span>
                    </div>
                    <div className="flex justify-end gap-6 mt-2 text-xs" style={{ color: '#4A4A4A' }}>
                      <div className="flex flex-col items-end">
                        <span className="text-xs uppercase tracking-wider" style={{ color: '#6B6B6B', fontSize: '8px', letterSpacing: '1px' }}>Date</span>
                        <span className="font-medium" style={{ color: '#1A1A1A' }}>{formatDate(invoice.createdAt)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs uppercase tracking-wider" style={{ color: '#6B6B6B', fontSize: '8px', letterSpacing: '1px' }}>Due Date</span>
                        <span className="font-medium" style={{ color: '#1A1A1A' }}>{formatDate(invoice.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                </header>

                {/* Party Details - Equal Width Columns */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="party-section">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#0D4F4A', fontSize: '9px', letterSpacing: '1.5px' }}>Bill To</p>
                    <h3 className="text-sm font-medium mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#1A1A1A', lineHeight: 1.3 }}>
                      {invoice.patientName || "—"}
                    </h3>
                    <p className="text-xs mb-2" style={{ color: '#4A4A4A', lineHeight: 1.4 }}>
                      <strong>UHID:</strong> {invoice.patientUhid || "—"}
                    </p>
                    {patientInfo?.phone && (
                      <p className="text-xs mb-2" style={{ color: '#4A4A4A', lineHeight: 1.4 }}>
                        <strong>Phone:</strong> {patientInfo.phone}
                      </p>
                    )}
                    {patientInfo?.email && (
                      <p className="text-xs mb-2" style={{ color: '#4A4A4A', lineHeight: 1.4 }}>
                        <strong>Email:</strong> {patientInfo.email}
                      </p>
                    )}
                    {patientInfo?.address && (
                      <p className="text-xs" style={{ color: '#4A4A4A', lineHeight: 1.4 }}>{patientInfo.address}</p>
                    )}
                  </div>

                  <div className="party-section">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#0D4F4A', fontSize: '9px', letterSpacing: '1.5px' }}>Ship From</p>
                    <h3 className="text-sm font-medium mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#1A1A1A', lineHeight: 1.3 }}>
                      {laboratoryInfo.name}
                    </h3>
                    <p className="text-xs mb-2" style={{ color: '#4A4A4A', lineHeight: 1.4 }}>
                      <strong>GSTIN:</strong> {laboratoryInfo.gstin}
                    </p>
                    <p className="text-xs mb-2" style={{ color: '#4A4A4A', lineHeight: 1.4 }}>
                      <strong>PAN:</strong> {laboratoryInfo.pan}
                    </p>
                    <p className="text-xs mb-2" style={{ color: '#4A4A4A', lineHeight: 1.4 }}>
                      <strong>Phone:</strong> {laboratoryInfo.phone}
                    </p>
                    <p className="text-xs mb-2" style={{ color: '#4A4A4A', lineHeight: 1.4 }}>
                      <strong>Email:</strong> {laboratoryInfo.email}
                    </p>
                    <p className="text-xs" style={{ color: '#4A4A4A', lineHeight: 1.4 }}>{laboratoryInfo.address}</p>
                  </div>
                </div>

                {/* Invoice Items Table */}
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#0D4F4A', fontSize: '9px', letterSpacing: '1.5px' }}>Services / Tests</p>
                  <div className="overflow-x-auto rounded-lg">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: '2px solid #0D4F4A' }}>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider text-left" style={{ color: '#0D4F4A', fontSize: '8px', letterSpacing: '0.8px' }}>#</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider text-left" style={{ color: '#0D4F4A', fontSize: '8px', letterSpacing: '0.8px' }}>Description</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center" style={{ color: '#0D4F4A', fontSize: '8px', letterSpacing: '0.8px' }}>HSN/SAC</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center" style={{ color: '#0D4F4A', fontSize: '8px', letterSpacing: '0.8px' }}>Qty</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right" style={{ color: '#0D4F4A', fontSize: '8px', letterSpacing: '0.8px' }}>Rate</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right" style={{ color: '#0D4F4A', fontSize: '8px', letterSpacing: '0.8px' }}>Taxable</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center" style={{ color: '#0D4F4A', fontSize: '8px', letterSpacing: '0.8px' }}>CGST%</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right" style={{ color: '#0D4F4A', fontSize: '8px', letterSpacing: '0.8px' }}>CGST</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center" style={{ color: '#0D4F4A', fontSize: '8px', letterSpacing: '0.8px' }}>SGST%</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right" style={{ color: '#0D4F4A', fontSize: '8px', letterSpacing: '0.8px' }}>SGST</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right" style={{ color: '#0D4F4A', fontSize: '8px', letterSpacing: '0.8px' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="py-8 text-center" style={{ color: '#6B6B6B' }}>
                              No items found
                            </td>
                          </tr>
                        ) : (
                          items.map((item, index) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #F0F0F0' }} className={index % 2 === 0 ? "" : "bg-gray-50"}>
                              <td className="py-4 px-4 font-semibold" style={{ color: '#1A1A1A' }}>{index + 1}</td>
                              <td className="py-4 px-4">
                                <p className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>{item.testName || "Laboratory Service"}</p>
                                {item.testCode && (
                                  <p className="text-xs" style={{ color: '#6B6B6B' }}>{item.testCode}</p>
                                )}
                              </td>
                              <td className="py-4 px-4 text-center font-semibold" style={{ color: '#1A1A1A' }}>{item.hsnSacCode || "999312"}</td>
                              <td className="py-4 px-4 text-center font-semibold" style={{ color: '#1A1A1A' }}>{item.quantity || 1}</td>
                              <td className="py-4 px-4 text-right font-medium tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.unitPrice)}</td>
                              <td className="py-4 px-4 text-right font-medium tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.taxableValue || item.total)}</td>
                              <td className="py-4 px-4 text-center font-semibold" style={{ color: '#1A1A1A' }}>{item.cgstPercent || 9}%</td>
                              <td className="py-4 px-4 text-right font-medium tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.cgstAmount)}</td>
                              <td className="py-4 px-4 text-center font-semibold" style={{ color: '#1A1A1A' }}>{item.sgstPercent || 9}%</td>
                              <td className="py-4 px-4 text-right font-medium tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.sgstAmount)}</td>
                              <td className="py-4 px-4 text-right font-semibold tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums', color: '#1A1A1A' }}>{formatCurrency(item.total)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary Section - Snug Fit */}
                <div className="flex justify-end mb-8">
                  <div className="w-72 p-5" style={{ background: 'rgba(13, 79, 74, 0.08)', border: '1px solid #0D4F4A' }}>
                    <div className="flex justify-between items-center mb-2 text-xs">
                      <span style={{ color: '#4A4A4A', fontWeight: 500 }}>Subtotal</span>
                      <span className="font-semibold tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums', color: '#1A1A1A' }}>{formatCurrency(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center mb-2 text-xs">
                        <span style={{ color: '#4A4A4A', fontWeight: 500 }}>Total Discount</span>
                        <span className="font-semibold tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums', color: '#B91C1C' }}>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-2 text-xs">
                      <span style={{ color: '#4A4A4A', fontWeight: 500 }}>Total Taxable Value</span>
                      <span className="font-semibold tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums', color: '#1A1A1A' }}>{formatCurrency(subtotal - Number(discountAmount))}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2 text-xs">
                      <span style={{ color: '#4A4A4A', fontWeight: 500 }}>Total GST</span>
                      <span className="font-semibold tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums', color: '#1A1A1A' }}>{formatCurrency(totalGST)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 mt-3" style={{ borderTop: '1px solid #0D4F4A' }}>
                      <span className="font-medium" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '14px', color: '#0D4F4A' }}>Grand Total</span>
                      <span className="font-medium tabular-nums" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '34px', fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums', color: '#0D4F4A', lineHeight: 1 }}>{formatCurrency(grandTotal)}</span>
                    </div>
                    <p className="text-xs italic mt-2" style={{ color: '#6B6B6B', lineHeight: 1.3, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      {numberToWords(Math.round(grandTotal))} Rupees Only
                    </p>
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid #E0E0E0' }}>
                      <div className="flex justify-between items-center mb-2 text-xs">
                        <span className="font-semibold" style={{ color: '#1A1A1A' }}>Amount Paid</span>
                        <span className="font-semibold tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums', color: '#0D4F4A' }}>{formatCurrency(paid)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold" style={{ color: '#1A1A1A' }}>Balance Due</span>
                        <span className="font-bold tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums', color: '#B91C1C' }}>{formatCurrency(pending)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="flex items-center gap-5 mb-8 p-5" style={{ background: '#F5F5F5', border: '1px solid #E0E0E0' }}>
                  <div className="w-16 h-16 bg-white p-1" style={{ border: '1px solid #E0E0E0' }}>
                    <div ref={qrCodeRef} className="w-full h-full flex items-center justify-center">
                      {generatingQR ? (
                        <div className="text-xs text-gray-400 text-center">Generating...</div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold mb-1" style={{ color: '#0D4F4A' }}>Invoice Verification</h4>
                    <p className="text-xs" style={{ color: '#4A4A4A', lineHeight: 1.4 }}>
                      Scan this QR code to verify invoice authenticity and GST compliance. Invoice: {invoice.invoiceNumber || `INV-${invoice.id}`}
                    </p>
                  </div>
                </div>

                {/* Bank Details - Tight 2-Column Grid */}
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#0D4F4A', fontSize: '9px', letterSpacing: '1.5px' }}>Bank Details</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
                    <div>
                      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#6B6B6B', fontSize: '8px', letterSpacing: '0.8px' }}>Bank Name</p>
                      <p className="font-medium" style={{ color: '#1A1A1A' }}>{laboratoryInfo.bankDetails?.bankName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#6B6B6B', fontSize: '8px', letterSpacing: '0.8px' }}>Account Number</p>
                      <p className="font-medium" style={{ color: '#1A1A1A' }}>{laboratoryInfo.bankDetails?.accountNumber || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#6B6B6B', fontSize: '8px', letterSpacing: '0.8px' }}>IFSC Code</p>
                      <p className="font-medium" style={{ color: '#1A1A1A' }}>{laboratoryInfo.bankDetails?.ifsc || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#6B6B6B', fontSize: '8px', letterSpacing: '0.8px' }}>Branch</p>
                      <p className="font-medium" style={{ color: '#1A1A1A' }}>{laboratoryInfo.bankDetails?.branch || "—"}</p>
                    </div>
                    {laboratoryInfo.upiId && (
                      <div className="col-span-2">
                        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#6B6B6B', fontSize: '8px', letterSpacing: '0.8px' }}>UPI ID</p>
                        <p className="font-medium" style={{ color: '#1A1A1A' }}>{laboratoryInfo.upiId}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer - Tight Layout */}
                <div className="mt-8 pt-8 text-center" style={{ borderTop: '1px solid #E0E0E0' }}>
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <div className="text-left">
                      <p className="text-xs mb-1" style={{ color: '#6B6B6B', lineHeight: 1.4 }}>This is a computer-generated tax invoice.</p>
                      <p className="text-xs" style={{ color: '#6B6B6B', lineHeight: 1.4, fontSize: '9px' }}>
                        Payment due within 30 days. Subject to local jurisdiction.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="inline-block text-left" style={{ width: '180px', borderTop: '1px solid #0D4F4A', paddingTop: '8px' }}>
                        <p className="text-xs font-medium" style={{ color: '#6B6B6B' }}>For {laboratoryInfo.name}</p>
                        <p className="text-xs" style={{ color: '#6B6B6B', fontSize: '9px', marginTop: '2px' }}>Authorized Signatory</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: '#6B6B6B', marginTop: '8px' }}>Generated on {new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 px-6 py-4 bg-white rounded-b-2xl">
          <div className="flex flex-wrap gap-3 justify-end">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg border border-gray-900 bg-gray-50 px-5 py-3 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Invoice
            </button>

            <button
              onClick={() => onClose?.()}
              className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}