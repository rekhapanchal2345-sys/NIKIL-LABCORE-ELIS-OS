"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
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

interface PremiumGSTInvoiceProps {
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

export default function PremiumGSTInvoice({
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
}: PremiumGSTInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [generatingQR, setGeneratingQR] = useState(false);

  const laboratoryInfo = useMemo(() => labInfo || {
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
  }, [labInfo]);

  const total = Number(invoice.totalAmount || 0);
  const paid = Number(invoice.paidAmount || 0);
  const pending = invoice.pendingAmount !== undefined 
    ? Number(invoice.pendingAmount) 
    : Math.max(0, total - paid);

  // Fixed data integrity: ensure calculations are consistent
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
            dark: '#0A1628',
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
        qrCodeRef.current.innerHTML = '<div class="text-xs text-gray-400">QR Unavailable</div>';
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
              @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
              
              :root {
                --color-base: #FDFBF7;
                --color-accent: #0A1628;
                --color-accent-secondary: #1E3A5F;
                --color-accent-light: #2A4A6F;
                --color-text-primary: #0A1628;
                --color-text-secondary: #4A5568;
                --color-text-muted: #718096;
                --color-border: #E2E8F0;
                --color-border-light: #EDF2F7;
                --color-border-subtle: #F7FAFC;
                --color-success: #047857;
                --color-success-light: #D1FAE5;
                --color-warning: #B45309;
                --color-warning-light: #FEF3C7;
                --color-error: #B91C1C;
                --color-error-light: #FEE2E2;
                --font-serif: 'Cormorant Garamond', Georgia, serif;
                --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                --font-mono: 'JetBrains Mono', monospace;
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
                top: 6mm;
                left: 6mm;
                right: 6mm;
                bottom: 6mm;
                border: 2px solid var(--color-accent);
                pointer-events: none;
              }
              
              .invoice-content {
                position: relative;
                z-index: 2;
              }
              
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 32px;
                padding-bottom: 24px;
                border-bottom: 1px solid var(--color-border);
              }
              
              .company-branding {
                display: flex;
                align-items: center;
                gap: 16px;
              }
              
              .accent-bar {
                width: 3px;
                height: 48px;
                background: var(--color-accent);
              }
              
              .company-info {
                display: flex;
                flex-direction: column;
              }
              
              .company-name {
                font-family: var(--font-serif);
                font-size: 28px;
                font-weight: 400;
                color: var(--color-accent);
                letter-spacing: 0.3px;
                margin-bottom: 3px;
                line-height: 1.1;
              }
              
              .company-tagline {
                font-size: 8px;
                color: var(--color-text-secondary);
                text-transform: uppercase;
                letter-spacing: 2.5px;
                font-weight: 500;
                margin-bottom: 6px;
              }
              
              .company-meta {
                font-size: 9px;
                color: var(--color-text-muted);
                line-height: 1.4;
              }
              
              .invoice-meta {
                text-align: right;
              }
              
              .invoice-title {
                font-family: var(--font-serif);
                font-size: 16px;
                font-weight: 400;
                color: var(--color-accent);
                letter-spacing: 1.5px;
                margin-bottom: 6px;
                text-transform: uppercase;
              }
              
              .invoice-number {
                font-family: var(--font-mono);
                font-size: 11px;
                font-weight: 500;
                color: var(--color-accent);
                margin-bottom: 6px;
                letter-spacing: 0.5px;
              }
              
              .meta-row {
                display: flex;
                justify-content: flex-end;
                gap: 24px;
                font-size: 10px;
                color: var(--color-text-secondary);
              }
              
              .meta-item {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
              }
              
              .meta-label {
                font-size: 9px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--color-text-muted);
                margin-bottom: 2px;
              }
              
              .meta-value {
                font-weight: 500;
                color: var(--color-text-primary);
              }
              
              .status-badge {
                display: inline-flex;
                align-items: center;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 9px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                background: var(--color-base);
                border: 1px solid var(--color-border);
                margin-top: 8px;
              }
              
              .status-badge-paid {
                color: var(--color-success);
                border-color: var(--color-success-light);
                background: var(--color-success-light);
              }
              
              .status-badge-due {
                color: var(--color-warning);
                border-color: var(--color-warning-light);
                background: var(--color-warning-light);
              }
              
              .status-badge-overdue {
                color: var(--color-error);
                border-color: var(--color-error-light);
                background: var(--color-error-light);
              }
              
              .section-label {
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: var(--color-text-muted);
                margin-bottom: 8px;
              }
              
              .party-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 32px;
                margin-bottom: 32px;
              }
              
              .party-section {
                padding: 16px;
                background: var(--color-base);
                border: 1px solid var(--color-border);
              }
              
              .party-name {
                font-family: var(--font-serif);
                font-size: 13px;
                font-weight: 400;
                color: var(--color-accent);
                margin-bottom: 8px;
              }
              
              .party-detail {
                font-size: 10px;
                color: var(--color-text-secondary);
                margin-bottom: 4px;
                line-height: 1.4;
              }
              
              .party-detail strong {
                font-weight: 500;
                color: var(--color-text-primary);
              }
              
              .table-section {
                margin-bottom: 32px;
              }
              
              .invoice-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10px;
              }
              
              .invoice-table thead {
                border-bottom: 1px solid var(--color-accent);
              }
              
              .invoice-table th {
                font-family: var(--font-sans);
                font-size: 9px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: var(--color-text-muted);
                padding: 8px 16px;
                text-align: left;
              }
              
              .invoice-table th.text-right {
                text-align: right;
              }
              
              .invoice-table th.text-center {
                text-align: center;
              }
              
              .invoice-table td {
                padding: 16px;
                border-bottom: 1px solid var(--color-border);
                color: var(--color-text-primary);
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
                margin-bottom: 32px;
              }
              
              .summary-box {
                width: 280px;
                padding: 24px;
                background: var(--color-base);
                border: 1px solid var(--color-accent);
                box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.03);
              }
              
              .summary-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                font-size: 10px;
              }
              
              .summary-row.total {
                margin-top: 16px;
                padding-top: 16px;
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
                font-size: 22px;
                font-weight: 400;
                color: var(--color-accent);
                letter-spacing: 0.5px;
              }
              
              .grand-total-value {
                font-family: var(--font-serif);
                font-size: 22px;
                font-weight: 400;
                color: var(--color-accent);
                letter-spacing: 0.5px;
              }
              
              .amount-in-words {
                font-size: 9px;
                color: var(--color-text-muted);
                font-style: italic;
                margin-top: 8px;
                line-height: 1.4;
              }
              
              .balance-due {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid var(--color-border);
              }
              
              .balance-due .summary-label {
                font-weight: 600;
                color: var(--color-accent);
              }
              
              .balance-due .summary-value {
                font-weight: 700;
                color: var(--color-error);
              }
              
              .qr-section {
                display: flex;
                align-items: center;
                gap: 24px;
                margin-bottom: 32px;
                padding: 24px;
                background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
                border: 1px solid var(--color-border);
                position: relative;
              }
              
              .qr-section::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-image: radial-gradient(circle, #e5e7eb 1px, transparent 1px);
                background-size: 8px 8px;
                opacity: 0.5;
                pointer-events: none;
              }
              
              .qr-code {
                width: 64px;
                height: 64px;
                background: white;
                border: 1px solid var(--color-border);
                padding: 4px;
                position: relative;
                z-index: 1;
              }
              
              .qr-code img {
                width: 100%;
                height: 100%;
                display: block;
              }
              
              .qr-info {
                flex: 1;
                position: relative;
                z-index: 1;
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
                margin-bottom: 32px;
                padding: 16px;
                background: var(--color-base);
                border: 1px solid var(--color-border);
              }
              
              .bank-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
              }
              
              .bank-item {
                font-size: 10px;
              }
              
              .bank-label {
                font-size: 9px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: var(--color-text-muted);
                margin-bottom: 2px;
              }
              
              .bank-value {
                font-weight: 500;
                color: var(--color-text-primary);
              }
              
              .footer {
                margin-top: 32px;
                padding-top: 24px;
                border-top: 1px solid var(--color-border);
                text-align: center;
              }
              
              .footer-text {
                font-size: 9px;
                color: var(--color-text-muted);
                margin-bottom: 4px;
              }
              
              .footer-terms {
                font-size: 8px;
                color: var(--color-text-muted);
                line-height: 1.4;
                max-width: 80%;
                margin: 0 auto;
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
                .qr-section::before,
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
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Preparing premium invoice...</p>
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
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/5">
              <div className="h-5 w-0.5 bg-gradient-to-b from-slate-900 to-slate-700"></div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Premium GST Invoice</h3>
              <p className="text-sm text-slate-600">
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
        <div className="flex-1 overflow-auto p-6 bg-slate-100">
          <div className="max-w-4xl mx-auto">
            {/* Invoice Preview */}
            <div 
              ref={invoiceRef} 
              className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
              style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
            >
              <div className="p-8" style={{ background: '#FDFBF7' }}>
                {/* Header */}
                <header className="flex justify-between items-start mb-12 pb-8" style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <div className="flex items-center gap-6">
                    <div className="w-0.5 h-13" style={{ background: 'linear-gradient(180deg, #0A1628 0%, #1E3A5F 100%)' }}></div>
                    <div className="flex flex-col">
                      <h1 className="text-3xl font-normal" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#0A1628', letterSpacing: '0.3px', lineHeight: 1.1 }}>
                        {laboratoryInfo.name}
                      </h1>
                      <p className="text-xs uppercase tracking-widest" style={{ color: '#4A5568', fontWeight: 500, letterSpacing: '2.5px', fontSize: '8px' }}>
                        Enterprise Laboratory Information System
                      </p>
                      <div className="text-xs mt-2" style={{ color: '#718096', fontSize: '9px', lineHeight: 1.4 }}>
                        <p>{laboratoryInfo.address}</p>
                        <p>GSTIN: {laboratoryInfo.gstin} | PAN: {laboratoryInfo.pan}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <h2 className="text-base font-normal tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#0A1628', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                      Tax Invoice
                    </h2>
                    <p className="text-xs font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#0A1628', letterSpacing: '0.5px' }}>
                      {invoice.invoiceNumber || `INV-${invoice.id}`}
                    </p>
                    <div className="flex justify-end gap-6 mt-2 text-xs" style={{ color: '#4A5568' }}>
                      <div className="flex flex-col items-end">
                        <span className="text-xs uppercase tracking-wider" style={{ color: '#718096', fontSize: '8px', letterSpacing: '1.2px' }}>Date</span>
                        <span className="font-medium" style={{ color: '#0A1628' }}>{formatDate(invoice.createdAt)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs uppercase tracking-wider" style={{ color: '#718096', fontSize: '8px', letterSpacing: '1.2px' }}>Due Date</span>
                        <span className="font-medium" style={{ color: '#0A1628' }}>{formatDate(invoice.dueDate)}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mt-3 ${statusClass(invoice.paymentStatus || invoice.status)}`} style={{ fontSize: '8px', letterSpacing: '0.8px' }}>
                      {invoice.paymentStatus || invoice.status || "Pending"}
                    </span>
                  </div>
                </header>

                {/* Party Details */}
                <div className="grid grid-cols-2 gap-9 mb-12">
                  <div className="p-5 relative" style={{ background: '#FDFBF7', border: '1px solid #F7FAFC' }}>
                    <div className="absolute left-0 top-0 w-0.5 h-full" style={{ background: 'linear-gradient(180deg, #0A1628 0%, #1E3A5F 100%)' }}></div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#718096', fontSize: '9px', letterSpacing: '1.8px' }}>Bill To</p>
                    <h3 className="text-base font-normal mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#0A1628', lineHeight: 1.2 }}>
                      {invoice.patientName || "—"}
                    </h3>
                    <p className="text-xs mb-1" style={{ color: '#4A5568', lineHeight: 1.5 }}>
                      <strong>UHID:</strong> {invoice.patientUhid || "—"}
                    </p>
                    {patientInfo?.phone && (
                      <p className="text-xs mb-1" style={{ color: '#4A5568', lineHeight: 1.5 }}>
                        <strong>Phone:</strong> {patientInfo.phone}
                      </p>
                    )}
                    {patientInfo?.email && (
                      <p className="text-xs mb-1" style={{ color: '#4A5568', lineHeight: 1.5 }}>
                        <strong>Email:</strong> {patientInfo.email}
                      </p>
                    )}
                    {patientInfo?.address && (
                      <p className="text-xs" style={{ color: '#4A5568', lineHeight: 1.5 }}>{patientInfo.address}</p>
                    )}
                  </div>

                  <div className="p-5 relative" style={{ background: '#FDFBF7', border: '1px solid #F7FAFC' }}>
                    <div className="absolute left-0 top-0 w-0.5 h-full" style={{ background: 'linear-gradient(180deg, #0A1628 0%, #1E3A5F 100%)' }}></div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#718096', fontSize: '9px', letterSpacing: '1.8px' }}>Ship From</p>
                    <h3 className="text-base font-normal mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#0A1628', lineHeight: 1.2 }}>
                      {laboratoryInfo.name}
                    </h3>
                    <p className="text-xs mb-1" style={{ color: '#4A5568', lineHeight: 1.5 }}>
                      <strong>GSTIN:</strong> {laboratoryInfo.gstin}
                    </p>
                    <p className="text-xs mb-1" style={{ color: '#4A5568', lineHeight: 1.5 }}>
                      <strong>PAN:</strong> {laboratoryInfo.pan}
                    </p>
                    <p className="text-xs mb-1" style={{ color: '#4A5568', lineHeight: 1.5 }}>
                      <strong>Phone:</strong> {laboratoryInfo.phone}
                    </p>
                    <p className="text-xs mb-1" style={{ color: '#4A5568', lineHeight: 1.5 }}>
                      <strong>Email:</strong> {laboratoryInfo.email}
                    </p>
                    <p className="text-xs" style={{ color: '#4A5568', lineHeight: 1.5 }}>{laboratoryInfo.address}</p>
                  </div>
                </div>

                {/* Invoice Items Table */}
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Services / Tests</p>
                  <div className="overflow-x-auto rounded-lg" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: '1px solid #0B1B3A' }}>
                          <th className="py-2 px-4 font-semibold uppercase tracking-wider text-left" style={{ color: '#9CA3AF' }}>#</th>
                          <th className="py-2 px-4 font-semibold uppercase tracking-wider text-left" style={{ color: '#9CA3AF' }}>Description</th>
                          <th className="py-2 px-4 font-semibold uppercase tracking-wider text-center" style={{ color: '#9CA3AF' }}>HSN/SAC</th>
                          <th className="py-2 px-4 font-semibold uppercase tracking-wider text-center" style={{ color: '#9CA3AF' }}>Qty</th>
                          <th className="py-2 px-4 font-semibold uppercase tracking-wider text-right" style={{ color: '#9CA3AF' }}>Rate</th>
                          <th className="py-2 px-4 font-semibold uppercase tracking-wider text-right" style={{ color: '#9CA3AF' }}>Taxable</th>
                          <th className="py-2 px-4 font-semibold uppercase tracking-wider text-center" style={{ color: '#9CA3AF' }}>CGST%</th>
                          <th className="py-2 px-4 font-semibold uppercase tracking-wider text-right" style={{ color: '#9CA3AF' }}>CGST</th>
                          <th className="py-2 px-4 font-semibold uppercase tracking-wider text-center" style={{ color: '#9CA3AF' }}>SGST%</th>
                          <th className="py-2 px-4 font-semibold uppercase tracking-wider text-right" style={{ color: '#9CA3AF' }}>SGST</th>
                          <th className="py-2 px-4 font-semibold uppercase tracking-wider text-right" style={{ color: '#9CA3AF' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="py-8 text-center" style={{ color: '#6B7280' }}>
                              No items found
                            </td>
                          </tr>
                        ) : (
                          items.map((item, index) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                              <td className="py-4 px-4 font-semibold" style={{ color: '#0B1B3A' }}>{index + 1}</td>
                              <td className="py-4 px-4">
                                <p className="font-semibold text-sm" style={{ color: '#0B1B3A' }}>{item.testName || "Laboratory Service"}</p>
                                {item.testCode && (
                                  <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'monospace' }}>{item.testCode}</p>
                                )}
                              </td>
                              <td className="py-4 px-4 text-center font-semibold" style={{ color: '#0B1B3A' }}>{item.hsnSacCode || "999312"}</td>
                              <td className="py-4 px-4 text-center font-semibold" style={{ color: '#0B1B3A' }}>{item.quantity || 1}</td>
                              <td className="py-4 px-4 text-right font-medium tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.unitPrice)}</td>
                              <td className="py-4 px-4 text-right font-medium tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.taxableValue || item.total)}</td>
                              <td className="py-4 px-4 text-center font-semibold" style={{ color: '#0B1B3A' }}>{item.cgstPercent || 9}%</td>
                              <td className="py-4 px-4 text-right font-medium tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.cgstAmount)}</td>
                              <td className="py-4 px-4 text-center font-semibold" style={{ color: '#0B1B3A' }}>{item.sgstPercent || 9}%</td>
                              <td className="py-4 px-4 text-right font-medium tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.sgstAmount)}</td>
                              <td className="py-4 px-4 text-right font-semibold tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums', color: '#0B1B3A' }}>{formatCurrency(item.total)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="flex justify-end mb-12">
                  <div className="w-80 p-6 relative" style={{ background: '#FDFBF7', border: '1px solid #0A1628', boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.02)' }}>
                    <div className="absolute top-0 right-0 w-15 h-15" style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #0A1628 0%, transparent 70%)', opacity: 0.03 }}></div>
                    <div className="flex justify-between items-center mb-2 text-xs">
                      <span style={{ color: '#4A5568', fontWeight: 500 }}>Subtotal</span>
                      <span className="font-semibold tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums', color: '#0A1628' }}>{formatCurrency(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center mb-2 text-xs">
                        <span style={{ color: '#4A5568', fontWeight: 500 }}>Total Discount</span>
                        <span className="font-semibold tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums', color: '#B91C1C' }}>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-2 text-xs">
                      <span style={{ color: '#4A5568', fontWeight: 500 }}>Total Taxable Value</span>
                      <span className="font-semibold tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums', color: '#0A1628' }}>{formatCurrency(subtotal - Number(discountAmount))}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2 text-xs">
                      <span style={{ color: '#4A5568', fontWeight: 500 }}>Total GST</span>
                      <span className="font-semibold tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums', color: '#0A1628' }}>{formatCurrency(totalGST)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-6 mt-6" style={{ borderTop: '1px solid #1E3A5F' }}>
                      <span className="font-normal" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '22px', color: '#0A1628', letterSpacing: '0.5px' }}>Grand Total</span>
                      <span className="font-normal tabular-nums" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '22px', fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums', color: '#0A1628', letterSpacing: '0.5px' }}>{formatCurrency(grandTotal)}</span>
                    </div>
                    <p className="text-xs italic mt-2" style={{ color: '#718096', lineHeight: 1.4, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      {numberToWords(Math.round(grandTotal))} Rupees Only
                    </p>
                    <div className="mt-6 pt-6" style={{ borderTop: '1px solid #E2E8F0' }}>
                      <div className="flex justify-between items-center mb-2 text-xs">
                        <span className="font-semibold" style={{ color: '#0A1628' }}>Amount Paid</span>
                        <span className="font-semibold tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums', color: '#047857' }}>{formatCurrency(paid)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold" style={{ color: '#0A1628' }}>Balance Due</span>
                        <span className="font-bold tabular-nums" style={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums', color: '#B91C1C' }}>{formatCurrency(pending)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="flex items-center gap-6 mb-8 p-6 relative" style={{ background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)', border: '1px solid #E5E7EB' }}>
                  <div className="absolute inset-0 opacity-50 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                    backgroundSize: '8px 8px'
                  }}></div>
                  <div className="w-16 h-16 bg-white p-1 relative z-10" style={{ border: '1px solid #E5E7EB' }}>
                    <div ref={qrCodeRef} className="w-full h-full flex items-center justify-center">
                      {generatingQR ? (
                        <div className="text-xs text-gray-400 text-center">Generating...</div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex-1 relative z-10">
                    <h4 className="text-xs font-semibold mb-1" style={{ color: '#0B1B3A' }}>Invoice Verification</h4>
                    <p className="text-xs" style={{ color: '#6B7280', lineHeight: 1.4 }}>
                      Scan this QR code to verify invoice authenticity and GST compliance. Invoice: {invoice.invoiceNumber || `INV-${invoice.id}`}
                    </p>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="p-5 mb-12 relative" style={{ background: '#FDFBF7', border: '1px solid #F7FAFC' }}>
                  <div className="absolute left-0 top-0 w-0.5 h-full" style={{ background: 'linear-gradient(180deg, #1E3A5F 0%, #2A4A6F 100%)' }}></div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#718096', fontSize: '9px', letterSpacing: '1.8px' }}>Bank Details</p>
                  <div className="grid grid-cols-2 gap-5 text-xs">
                    <div>
                      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#718096', fontSize: '8px', letterSpacing: '0.8px' }}>Bank Name</p>
                      <p className="font-medium" style={{ color: '#0A1628' }}>{laboratoryInfo.bankDetails?.bankName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#718096', fontSize: '8px', letterSpacing: '0.8px' }}>Account Number</p>
                      <p className="font-medium" style={{ color: '#0A1628' }}>{laboratoryInfo.bankDetails?.accountNumber || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#718096', fontSize: '8px', letterSpacing: '0.8px' }}>IFSC Code</p>
                      <p className="font-medium" style={{ color: '#0A1628' }}>{laboratoryInfo.bankDetails?.ifsc || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#718096', fontSize: '8px', letterSpacing: '0.8px' }}>Branch</p>
                      <p className="font-medium" style={{ color: '#0A1628' }}>{laboratoryInfo.bankDetails?.branch || "—"}</p>
                    </div>
                    {laboratoryInfo.upiId && (
                      <div className="col-span-2">
                        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#718096', fontSize: '8px', letterSpacing: '0.8px' }}>UPI ID</p>
                        <p className="font-medium" style={{ color: '#0A1628' }}>{laboratoryInfo.upiId}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 text-center" style={{ borderTop: '1px solid #E2E8F0' }}>
                  <p className="text-xs mb-1" style={{ color: '#718096' }}>This is a computer-generated tax invoice. For queries, please contact the laboratory billing department.</p>
                  <p className="text-xs leading-relaxed max-w-[80%] mx-auto" style={{ color: '#718096' }}>
                    Terms & Conditions: Payment is due within 30 days from invoice date. Goods once sold will not be taken back. 
                    Subject to local jurisdiction only. This is a computer-generated invoice and does not require signature.
                  </p>
                  
                  <div className="flex justify-end items-end mt-8">
                    <div className="text-center" style={{ width: '180px', borderTop: '1px solid #0A1628', paddingTop: '4px' }}>
                      <p className="text-xs font-medium" style={{ color: '#718096' }}>For {laboratoryInfo.name}</p>
                      <p className="text-xs" style={{ color: '#718096', fontSize: '8px', marginTop: '2px' }}>Authorized Signatory</p>
                    </div>
                  </div>
                  
                  <p className="text-xs mt-6" style={{ color: '#718096' }}>Generated on {new Date().toLocaleString()}</p>
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
              className="flex items-center gap-2 rounded-lg border border-slate-900 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Invoice
            </button>

            <button
              onClick={() => onClose?.()}
              className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}