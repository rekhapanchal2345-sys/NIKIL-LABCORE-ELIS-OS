"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { Invoice } from "./InvoiceTable";
import { Printer, Download, X, Loader2, Eye, Sparkles, Crown } from "lucide-react";

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

interface LuxuryGSTInvoiceProps {
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
    return "bg-emerald-100 text-emerald-800 border-emerald-300";
  }
  if (value === "overdue" || value === "cancelled" || value === "failed") {
    return "bg-red-100 text-red-800 border-red-300";
  }
  if (value === "partial" || value === "pending") {
    return "bg-amber-100 text-amber-800 border-amber-300";
  }
  return "bg-gray-100 text-gray-800 border-gray-300";
}

export default function LuxuryGSTInvoice({
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
}: LuxuryGSTInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(true);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

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

  const subtotal = total - Number(taxAmount) + Number(discountAmount);
  const totalGST = Number(taxAmount);
  const grandTotal = total;

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
            dark: '#1a1a2e',
            light: '#ffffff'
          }
        });
        
        const img = document.createElement('img');
        img.src = qrCodeDataURL;
        img.style.width = '80px';
        img.style.height = '80px';
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
              @page {
                size: A4;
                margin: 10mm;
              }
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 11px;
                color: #1a1a2e;
                background: white;
                line-height: 1.4;
              }
              .invoice-container {
                max-width: 210mm;
                margin: 0 auto;
                padding: 20px;
                background: white;
                border: 1px solid #e5e7eb;
              }
              .header {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                padding: 30px;
                margin-bottom: 25px;
                position: relative;
                overflow: hidden;
              }
              .header::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -50%;
                width: 100%;
                height: 100%;
                background: radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%);
                border-radius: 50%;
              }
              .logo-section {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 20px;
                position: relative;
                z-index: 1;
              }
              .logo-box {
                width: 70px;
                height: 70px;
                background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%);
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #1a1a2e;
                font-size: 32px;
                font-weight: 900;
                box-shadow: 0 8px 32px rgba(255, 215, 0, 0.3);
                border: 2px solid rgba(255, 215, 0, 0.5);
              }
              .company-details h1 {
                font-size: 28px;
                font-weight: 900;
                color: #ffffff;
                letter-spacing: 1px;
                margin: 0 0 5px 0;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
              }
              .company-details .tagline {
                font-size: 10px;
                color: #ffd700;
                text-transform: uppercase;
                letter-spacing: 3px;
                margin: 0 0 8px 0;
                font-weight: 700;
              }
              .company-details .contact-info {
                font-size: 10px;
                color: #e0e0e0;
                line-height: 1.6;
              }
              .invoice-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-top: 25px;
                position: relative;
                z-index: 1;
              }
              .invoice-title {
                font-size: 36px;
                font-weight: 900;
                color: #ffd700;
                letter-spacing: 4px;
                text-transform: uppercase;
                text-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
              }
              .invoice-meta {
                text-align: right;
              }
              .invoice-number {
                font-size: 20px;
                font-weight: 800;
                color: #ffffff;
                margin-bottom: 8px;
                background: rgba(255, 215, 0, 0.2);
                padding: 8px 16px;
                border-radius: 8px;
                display: inline-block;
                border: 1px solid rgba(255, 215, 0, 0.3);
              }
              .meta-item {
                font-size: 10px;
                color: #e0e0e0;
                margin-top: 4px;
              }
              .section {
                margin-bottom: 25px;
              }
              .section-title {
                font-size: 12px;
                font-weight: 900;
                color: #1a1a2e;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 3px solid #ffd700;
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
              }
              .info-item {
                margin-bottom: 10px;
                padding: 12px;
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border-radius: 8px;
                border-left: 3px solid #ffd700;
              }
              .info-label {
                font-size: 9px;
                color: #6c757d;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 4px;
                font-weight: 700;
              }
              .info-value {
                font-size: 12px;
                font-weight: 700;
                color: #1a1a2e;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                border-radius: 12px;
                overflow: hidden;
              }
              th {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                color: #ffd700;
                font-size: 10px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 1px;
                padding: 14px 12px;
                text-align: left;
                border-bottom: 2px solid #ffd700;
              }
              td {
                padding: 12px;
                border-bottom: 1px solid #e9ecef;
                font-size: 10px;
                background: white;
              }
              tr:nth-child(even) td {
                background: #f8f9fa;
              }
              .amount-cell {
                text-align: right;
                font-weight: 800;
                color: #1a1a2e;
              }
              .center-cell {
                text-align: center;
                font-weight: 700;
              }
              .summary-section {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 16px;
                padding: 25px;
                margin-top: 25px;
                border: 2px solid #ffd700;
                box-shadow: 0 8px 32px rgba(26, 26, 46, 0.2);
              }
              .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                font-size: 11px;
                color: #e0e0e0;
              }
              .summary-row.total {
                border-top: 2px solid #ffd700;
                border-bottom: 2px solid #ffd700;
                padding: 15px 0;
                margin-top: 10px;
                font-size: 16px;
                font-weight: 900;
                color: #ffd700;
              }
              .summary-row.balance {
                font-size: 16px;
                font-weight: 900;
                color: #ff6b6b;
                padding-top: 10px;
              }
              .status-badge {
                display: inline-block;
                padding: 8px 20px;
                border-radius: 30px;
                font-size: 11px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 1px;
                border: 2px solid;
              }
              .payment-section {
                background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
                border: 2px solid #4caf50;
                border-radius: 12px;
                padding: 15px;
              }
              .notes-section {
                background: linear-gradient(135deg, #fff9e6 0%, #ffefb8 100%);
                border: 2px solid #ffd700;
                border-radius: 12px;
                padding: 15px;
              }
              .qr-section {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-top: 20px;
                padding: 20px;
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border-radius: 12px;
                border: 2px solid #1a1a2e;
              }
              .qr-code {
                width: 80px;
                height: 80px;
                border: 2px solid #1a1a2e;
                border-radius: 8px;
                background: white;
              }
              .verification-text {
                flex: 1;
              }
              .footer {
                margin-top: 40px;
                padding-top: 25px;
                border-top: 3px solid #1a1a2e;
                text-align: center;
                font-size: 9px;
                color: #6c757d;
              }
              .footer-section {
                margin-bottom: 20px;
              }
              .footer-section h4 {
                font-size: 11px;
                font-weight: 900;
                color: #1a1a2e;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .footer-section ul {
                list-style: none;
                text-align: left;
              }
              .footer-section li {
                margin-bottom: 4px;
              }
              .authorized-section {
                margin-top: 35px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
              }
              .signature-line {
                width: 200px;
                border-top: 2px solid #1a1a2e;
                padding-top: 10px;
                text-align: center;
                font-size: 10px;
                font-weight: 700;
                color: #1a1a2e;
              }
              .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 120px;
                font-weight: 900;
                color: rgba(255, 215, 0, 0.08);
                text-transform: uppercase;
                letter-spacing: 10px;
                pointer-events: none;
                z-index: 0;
              }
              @media print {
                body { margin: 0; }
                .invoice-container { box-shadow: none; border: none; }
                .watermark { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${invoice.paymentStatus?.toLowerCase() === 'paid' ? '<div class="watermark">PAID</div>' : ''}
            <div class="invoice-container">
              ${printContent}
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

  const handleDownloadPDF = async () => {
    try {
      setGeneratingPDF(true);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Premium Header with dark theme
      pdf.setFillColor(26, 26, 46);
      pdf.rect(0, 0, pageWidth, 50, "F");
      
      // Gold accent line
      pdf.setFillColor(255, 215, 0);
      pdf.rect(0, 50, pageWidth, 2, "F");
      
      pdf.setTextColor(255, 215, 0);
      pdf.setFontSize(30);
      pdf.setFont("helvetica", "bold");
      pdf.text(laboratoryInfo.name || "LABCORE ELIS", 15, 20);
      
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(255, 255, 255);
      pdf.text("Enterprise Laboratory Information System", 15, 27);
      pdf.text(laboratoryInfo.address || "123 Healthcare Avenue, Medical District, City - 560001", 15, 32);
      pdf.text(`GSTIN: ${laboratoryInfo.gstin} | PAN: ${laboratoryInfo.pan}`, 15, 37);
      pdf.text(`Phone: ${laboratoryInfo.phone} | Email: ${laboratoryInfo.email}`, 15, 42);
      
      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 215, 0);
      pdf.text("TAX INVOICE", pageWidth - 15, 20, { align: "right" });
      
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.text(invoice.invoiceNumber || `INV-${invoice.id}`, pageWidth - 15, 28, { align: "right" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(`Date: ${formatDate(invoice.createdAt)}`, pageWidth - 15, 34, { align: "right" });
      pdf.text(`Due: ${formatDate(invoice.dueDate)}`, pageWidth - 15, 40, { align: "right" });
      
      pdf.setTextColor(0, 0, 0);
      
      let yPosition = 60;
      
      // Bill To Section with premium styling
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(26, 26, 46);
      pdf.text("◆ BILL TO / PATIENT DETAILS", 15, yPosition);
      yPosition += 10;
      
      pdf.setDrawColor(255, 215, 0);
      pdf.setLineWidth(0.5);
      pdf.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 8;
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Patient Name: ${invoice.patientName || "—"}`, 15, yPosition);
      yPosition += 5;
      pdf.text(`UHID: ${invoice.patientUhid || "—"}`, 15, yPosition);
      yPosition += 5;
      if (patientInfo?.phone) {
        pdf.text(`Phone: ${patientInfo.phone}`, 15, yPosition);
        yPosition += 5;
      }
      if (patientInfo?.address) {
        pdf.text(`Address: ${patientInfo.address}`, 15, yPosition);
        yPosition += 5;
      }
      
      // Doctor/Institution Details
      if (doctorInfo?.name) {
        yPosition += 8;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(26, 26, 46);
        pdf.text("◆ REFERRING DOCTOR / INSTITUTION", 15, yPosition);
        yPosition += 10;
        
        pdf.setDrawColor(255, 215, 0);
        pdf.line(15, yPosition, pageWidth - 15, yPosition);
        yPosition += 8;
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Dr. ${doctorInfo.name}`, 15, yPosition);
        yPosition += 5;
        if (doctorInfo.qualification) {
          pdf.text(doctorInfo.qualification, 15, yPosition);
          yPosition += 5;
        }
        if (doctorInfo.gstin) {
          pdf.text(`GSTIN: ${doctorInfo.gstin}`, 15, yPosition);
          yPosition += 5;
        }
      }
      
      yPosition += 12;
      
      // Invoice Items Table with premium header
      pdf.setFillColor(26, 26, 46);
      pdf.rect(15, yPosition, pageWidth - 30, 10, "F");
      
      pdf.setTextColor(255, 215, 0);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text("#", 17, yPosition + 6);
      pdf.text("Description", 25, yPosition + 6);
      pdf.text("HSN/SAC", 70, yPosition + 6);
      pdf.text("Qty", 95, yPosition + 6);
      pdf.text("Rate", 110, yPosition + 6);
      pdf.text("Taxable", 130, yPosition + 6);
      pdf.text("CGST%", 150, yPosition + 6);
      pdf.text("CGST", 165, yPosition + 6);
      pdf.text("SGST%", 180, yPosition + 6);
      pdf.text("SGST", 195, yPosition + 6);
      pdf.text("Total", pageWidth - 17, yPosition + 6, { align: "right" });
      
      pdf.setTextColor(0, 0, 0);
      yPosition += 10;
      
      items.forEach((item, index) => {
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = 20;
        }
        
        if (index % 2 === 0) {
          pdf.setFillColor(248, 249, 250);
          pdf.rect(15, yPosition, pageWidth - 30, 8, "F");
        }
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.text(String(index + 1), 17, yPosition + 5);
        pdf.text(item.testName || "Laboratory Service", 25, yPosition + 5);
        pdf.text(item.hsnSacCode || "999312", 70, yPosition + 5);
        pdf.text(String(item.quantity || 1), 95, yPosition + 5);
        pdf.text(formatCurrency(item.unitPrice), 110, yPosition + 5);
        pdf.text(formatCurrency(item.taxableValue || item.total), 130, yPosition + 5);
        pdf.text(String(item.cgstPercent || 9) + "%", 150, yPosition + 5);
        pdf.text(formatCurrency(item.cgstAmount), 165, yPosition + 5);
        pdf.text(String(item.sgstPercent || 9) + "%", 180, yPosition + 5);
        pdf.text(formatCurrency(item.sgstAmount), 195, yPosition + 5);
        pdf.setFont("helvetica", "bold");
        pdf.text(formatCurrency(item.total), pageWidth - 17, yPosition + 5, { align: "right" });
        
        yPosition += 8;
      });
      
      yPosition += 12;
      
      // Premium Summary Section
      const summaryX = pageWidth - 80;
      pdf.setFillColor(26, 26, 46);
      pdf.roundedRect(summaryX - 10, yPosition - 5, 75, 85, 3, 3, "F");
      
      pdf.setDrawColor(255, 215, 0);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(summaryX - 10, yPosition - 5, 75, 85, 3, 3, "S");
      
      yPosition += 5;
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text("Subtotal", summaryX, yPosition);
      pdf.setFont("helvetica", "bold");
      pdf.text(formatCurrency(subtotal), pageWidth - 17, yPosition, { align: "right" });
      yPosition += 6;
      
      if (discountAmount > 0) {
        pdf.setFont("helvetica", "normal");
        pdf.text("Total Discount", summaryX, yPosition);
        pdf.setTextColor(255, 107, 107);
        pdf.setFont("helvetica", "bold");
        pdf.text(`-${formatCurrency(discountAmount)}`, pageWidth - 17, yPosition, { align: "right" });
        pdf.setTextColor(255, 255, 255);
        yPosition += 6;
      }
      
      pdf.setFont("helvetica", "normal");
      pdf.text("Total Taxable Value", summaryX, yPosition);
      pdf.setFont("helvetica", "bold");
      pdf.text(formatCurrency(subtotal - discountAmount), pageWidth - 17, yPosition, { align: "right" });
      yPosition += 6;
      
      pdf.setFont("helvetica", "normal");
      pdf.text("Total GST", summaryX, yPosition);
      pdf.setFont("helvetica", "bold");
      pdf.text(formatCurrency(totalGST), pageWidth - 17, yPosition, { align: "right" });
      yPosition += 6;
      
      pdf.setDrawColor(255, 215, 0);
      pdf.line(summaryX - 5, yPosition, pageWidth - 15, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 215, 0);
      pdf.text("Grand Total", summaryX, yPosition);
      pdf.text(formatCurrency(grandTotal), pageWidth - 17, yPosition, { align: "right" });
      yPosition += 8;
      
      // Amount in words
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(255, 255, 255);
      const amountWords = numberToWords(Math.round(grandTotal)) + " Rupees Only";
      pdf.text(`Amount in Words: ${amountWords}`, 15, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text("Amount Paid", summaryX, yPosition);
      pdf.setTextColor(76, 175, 80);
      pdf.setFont("helvetica", "bold");
      pdf.text(formatCurrency(paid), pageWidth - 17, yPosition, { align: "right" });
      pdf.setTextColor(255, 255, 255);
      yPosition += 6;
      
      pdf.setDrawColor(255, 215, 0);
      pdf.line(summaryX - 5, yPosition, pageWidth - 15, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 107, 107);
      pdf.text("Balance Due", summaryX, yPosition);
      pdf.text(formatCurrency(pending), pageWidth - 17, yPosition, { align: "right" });
      pdf.setTextColor(0, 0, 0);
      
      // Payment Status Badge
      const status = invoice.paymentStatus || invoice.status || "Pending";
      let badgeColor: [number, number, number] = [255, 193, 7]; // amber
      if (status.toLowerCase() === 'paid') badgeColor = [76, 175, 80]; // green
      else if (status.toLowerCase() === 'overdue') badgeColor = [244, 67, 54]; // red

      pdf.setFillColor(...badgeColor);
      pdf.roundedRect(pageWidth - 60, yPosition + 5, 45, 8, 2, 2, "F");
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text(status.toUpperCase(), pageWidth - 37, yPosition + 10, { align: "center" });
      pdf.setTextColor(0, 0, 0);
      
      yPosition += 20;
      
      // Bank Details
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(26, 26, 46);
      pdf.text("◆ BANK DETAILS", 15, yPosition);
      yPosition += 8;
      
      pdf.setDrawColor(255, 215, 0);
      pdf.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 8;
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Bank: ${laboratoryInfo.bankDetails?.bankName || "—"}`, 15, yPosition);
      yPosition += 4;
      pdf.text(`A/C No: ${laboratoryInfo.bankDetails?.accountNumber || "—"}`, 15, yPosition);
      yPosition += 4;
      pdf.text(`IFSC: ${laboratoryInfo.bankDetails?.ifsc || "—"}`, 15, yPosition);
      yPosition += 4;
      pdf.text(`Branch: ${laboratoryInfo.bankDetails?.branch || "—"}`, 15, yPosition);
      yPosition += 4;
      if (laboratoryInfo.upiId) {
        pdf.text(`UPI: ${laboratoryInfo.upiId}`, 15, yPosition);
        yPosition += 4;
      }
      
      // Payment History
      if (payments.length > 0) {
        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(26, 26, 46);
        pdf.text("◆ PAYMENT HISTORY", 15, yPosition);
        yPosition += 8;
        
        pdf.setDrawColor(255, 215, 0);
        pdf.line(15, yPosition, pageWidth - 15, yPosition);
        yPosition += 8;
        
        payments.forEach((payment) => {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(0, 0, 0);
          pdf.text(`${formatDate(payment.paidAt)} - ${payment.method}`, 15, yPosition);
          pdf.text(formatCurrency(payment.amount), pageWidth - 17, yPosition, { align: "right" });
          yPosition += 4;
        });
      }
      
      // Terms & Conditions
      yPosition = pageHeight - 50;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(26, 26, 46);
      pdf.text("◆ TERMS & CONDITIONS", 15, yPosition);
      yPosition += 5;
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(0, 0, 0);
      pdf.text("1. Payment is due within 30 days from invoice date.", 15, yPosition);
      yPosition += 3;
      pdf.text("2. Goods once sold will not be taken back.", 15, yPosition);
      yPosition += 3;
      pdf.text("3. Subject to local jurisdiction only.", 15, yPosition);
      yPosition += 3;
      pdf.text("4. This is a computer-generated invoice and does not require signature.", 15, yPosition);
      
      // Footer
      yPosition = pageHeight - 15;
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(108, 117, 125);
      pdf.text(`Generated by LabCore ELIS | ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: "center" });
      pdf.setTextColor(0, 0, 0);
      
      // Generate QR Code
      try {
        const qrData = JSON.stringify({
          invoice: invoice.invoiceNumber,
          gstin: laboratoryInfo.gstin,
          amount: grandTotal,
          date: invoice.createdAt
        });
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          width: 80,
          margin: 1,
          color: {
            dark: '#1a1a2e',
            light: '#ffffff'
          }
        });
        
        pdf.addImage(qrCodeDataURL, "PNG", pageWidth - 30, pageHeight - 45, 20, 20);
        pdf.setFontSize(5);
        pdf.text("Scan to verify", pageWidth - 20, pageHeight - 23, { align: "center" });
      } catch (qrError) {
        console.error("QR Code generation failed:", qrError);
      }
      
      pdf.save(`TaxInvoice-${invoice.invoiceNumber || invoice.id}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  useEffect(() => {
    setPreviewMode(true);
  }, []);

  const handlePreviewPrint = () => {
    setPreviewMode(false);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const handlePreviewDownload = async () => {
    await handleDownloadPDF();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <Sparkles className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-700">Preparing luxury invoice...</p>
        </div>
      </div>
    );
  }

  if (previewMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-900 to-slate-800 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                <Crown className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Luxury A4 GST Invoice</h3>
                <p className="text-sm text-amber-400">
                  Invoice: <span className="font-semibold">{invoice.invoiceNumber || `INV-${invoice.id}`}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setPreviewMode(false);
                onClose?.();
              }}
              className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6 bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="max-w-4xl mx-auto">
              {/* Invoice Preview */}
              <div 
                ref={invoiceRef} 
                className="bg-white rounded-xl shadow-2xl border border-amber-200 overflow-hidden"
              >
                {/* Premium Header */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl"></div>
                  
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-slate-900 text-4xl font-black shadow-lg shadow-amber-500/30 border-2 border-amber-400">
                        LC
                      </div>
                      <div>
                        <h1 className="text-3xl font-black text-white tracking-wide">{laboratoryInfo.name}</h1>
                        <p className="text-amber-400 text-sm uppercase tracking-widest mt-2 font-bold">Enterprise Laboratory Information System</p>
                        <div className="mt-3 text-xs text-slate-300 space-y-1">
                          <p>{laboratoryInfo.address}</p>
                          <p>GSTIN: {laboratoryInfo.gstin} | PAN: {laboratoryInfo.pan}</p>
                          <p>Phone: {laboratoryInfo.phone} | Email: {laboratoryInfo.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-5xl font-black text-amber-400 tracking-wider">TAX INVOICE</p>
                      <div className="mt-3 bg-amber-500/20 border border-amber-500/30 rounded-lg px-4 py-2 inline-block">
                        <p className="text-amber-400 text-lg font-bold">{invoice.invoiceNumber || `INV-${invoice.id}`}</p>
                      </div>
                      <div className="mt-3 text-xs text-slate-300 space-y-1">
                        <p>Date: {formatDate(invoice.createdAt)}</p>
                        <p>Due: {formatDate(invoice.dueDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {/* Bill To Section */}
                  <div className="mb-8">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 pb-3 border-b-3 border-amber-500 flex items-center gap-2">
                      <span className="text-amber-500">◆</span> Bill To / Patient Details
                    </h3>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-l-4 border-amber-500">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Patient Name</p>
                        <p className="font-bold text-slate-900">{invoice.patientName || "—"}</p>
                      </div>
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-l-4 border-amber-500">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">UHID</p>
                        <p className="font-bold text-slate-900">{invoice.patientUhid || "—"}</p>
                      </div>
                      {patientInfo?.phone && (
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-l-4 border-amber-500">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Phone</p>
                          <p className="font-bold text-slate-900">{patientInfo.phone}</p>
                        </div>
                      )}
                      {patientInfo?.email && (
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-l-4 border-amber-500">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Email</p>
                          <p className="font-bold text-slate-900">{patientInfo.email}</p>
                        </div>
                      )}
                      {patientInfo?.address && (
                        <div className="col-span-2 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-l-4 border-amber-500">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Address</p>
                          <p className="font-bold text-slate-900">{patientInfo.address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Doctor/Institution Section */}
                  {doctorInfo?.name && (
                    <div className="mb-8">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 pb-3 border-b-3 border-amber-500 flex items-center gap-2">
                        <span className="text-amber-500">◆</span> Referring Doctor / Institution
                      </h3>
                      <div className="grid grid-cols-2 gap-5">
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-l-4 border-amber-500">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Doctor Name</p>
                          <p className="font-bold text-slate-900">Dr. {doctorInfo.name}</p>
                        </div>
                        {doctorInfo.qualification && (
                          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-l-4 border-amber-500">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Qualification</p>
                            <p className="font-bold text-slate-900">{doctorInfo.qualification}</p>
                          </div>
                        )}
                        {doctorInfo.gstin && (
                          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-l-4 border-amber-500">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">GSTIN</p>
                            <p className="font-bold text-slate-900">{doctorInfo.gstin}</p>
                          </div>
                        )}
                        {doctorInfo.address && (
                          <div className="col-span-2 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-l-4 border-amber-500">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Address</p>
                            <p className="font-bold text-slate-900">{doctorInfo.address}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Invoice Items Table */}
                  <div className="mb-8">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 pb-3 border-b-3 border-amber-500 flex items-center gap-2">
                      <span className="text-amber-500">◆</span> Services / Tests
                    </h3>
                    <div className="overflow-x-auto rounded-xl shadow-lg">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                            <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-wider">#</th>
                            <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-wider">Description</th>
                            <th className="text-center py-4 px-4 text-xs font-black uppercase tracking-wider">HSN/SAC</th>
                            <th className="text-center py-4 px-4 text-xs font-black uppercase tracking-wider">Qty</th>
                            <th className="text-right py-4 px-4 text-xs font-black uppercase tracking-wider">Rate</th>
                            <th className="text-right py-4 px-4 text-xs font-black uppercase tracking-wider">Taxable</th>
                            <th className="text-center py-4 px-4 text-xs font-black uppercase tracking-wider">CGST%</th>
                            <th className="text-right py-4 px-4 text-xs font-black uppercase tracking-wider">CGST</th>
                            <th className="text-center py-4 px-4 text-xs font-black uppercase tracking-wider">SGST%</th>
                            <th className="text-right py-4 px-4 text-xs font-black uppercase tracking-wider">SGST</th>
                            <th className="text-right py-4 px-4 text-xs font-black uppercase tracking-wider">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {items.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="py-8 text-center text-slate-500 text-sm">
                                No items found
                              </td>
                            </tr>
                          ) : (
                            items.map((item, index) => (
                              <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                <td className="py-4 px-4 text-sm font-bold text-slate-900">{index + 1}</td>
                                <td className="py-4 px-4">
                                  <p className="font-bold text-slate-900 text-sm">{item.testName || "Laboratory Service"}</p>
                                  {item.testCode && (
                                    <p className="text-xs text-slate-400 font-mono">{item.testCode}</p>
                                  )}
                                </td>
                                <td className="py-4 px-4 text-center text-sm text-slate-700 font-bold">{item.hsnSacCode || "999312"}</td>
                                <td className="py-4 px-4 text-center text-sm text-slate-700 font-bold">{item.quantity || 1}</td>
                                <td className="py-4 px-4 text-right text-sm text-slate-700 font-bold">{formatCurrency(item.unitPrice)}</td>
                                <td className="py-4 px-4 text-right text-sm text-slate-700 font-bold">{formatCurrency(item.taxableValue || item.total)}</td>
                                <td className="py-4 px-4 text-center text-sm text-slate-700 font-bold">{item.cgstPercent || 9}%</td>
                                <td className="py-4 px-4 text-right text-sm text-slate-700 font-bold">{formatCurrency(item.cgstAmount)}</td>
                                <td className="py-4 px-4 text-center text-sm text-slate-700 font-bold">{item.sgstPercent || 9}%</td>
                                <td className="py-4 px-4 text-right text-sm text-slate-700 font-bold">{formatCurrency(item.sgstAmount)}</td>
                                <td className="py-4 px-4 text-right font-black text-slate-900 text-sm">{formatCurrency(item.total)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Premium Summary Section */}
                  <div className="mb-8">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border-2 border-amber-500 shadow-xl">
                      <div className="space-y-4 max-w-xs ml-auto">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">Subtotal</span>
                          <span className="font-bold text-white">{formatCurrency(subtotal)}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Total Discount</span>
                            <span className="font-bold text-red-400">-{formatCurrency(discountAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">Total Taxable Value</span>
                          <span className="font-bold text-white">{formatCurrency(subtotal - discountAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">Total GST</span>
                          <span className="font-bold text-white">{formatCurrency(totalGST)}</span>
                        </div>
                        <div className="flex justify-between pt-4 border-t-2 border-amber-500">
                          <span className="font-black text-amber-400 text-lg">Grand Total</span>
                          <span className="font-black text-amber-400 text-lg">{formatCurrency(grandTotal)}</span>
                        </div>
                        <div className="text-xs text-slate-400 italic">
                          {numberToWords(Math.round(grandTotal))} Rupees Only
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">Amount Paid</span>
                          <span className="font-bold text-green-400">{formatCurrency(paid)}</span>
                        </div>
                        <div className="flex justify-between pt-4 border-t border-slate-600">
                          <span className="font-black text-white text-lg">Balance Due</span>
                          <span className="font-black text-red-400 text-lg">{formatCurrency(pending)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Status Badge */}
                  <div className="mb-8 flex justify-end">
                    <span className={`inline-flex items-center px-8 py-4 rounded-full text-sm font-black uppercase tracking-wider border-2 shadow-lg ${statusClass(invoice.paymentStatus || invoice.status)}`}>
                      {invoice.paymentStatus || invoice.status || "Pending"}
                    </span>
                  </div>

                  {/* Bank Details */}
                  <div className="mb-8">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 pb-3 border-b-3 border-amber-500 flex items-center gap-2">
                      <span className="text-amber-500">◆</span> Bank Details
                    </h3>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 rounded-xl p-5">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-green-700 uppercase tracking-wider mb-1 font-bold">Bank Name</p>
                          <p className="font-bold text-slate-900">{laboratoryInfo.bankDetails?.bankName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-green-700 uppercase tracking-wider mb-1 font-bold">Account Number</p>
                          <p className="font-bold text-slate-900">{laboratoryInfo.bankDetails?.accountNumber || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-green-700 uppercase tracking-wider mb-1 font-bold">IFSC Code</p>
                          <p className="font-bold text-slate-900">{laboratoryInfo.bankDetails?.ifsc || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-green-700 uppercase tracking-wider mb-1 font-bold">Branch</p>
                          <p className="font-bold text-slate-900">{laboratoryInfo.bankDetails?.branch || "—"}</p>
                        </div>
                        {laboratoryInfo.upiId && (
                          <div className="col-span-2">
                            <p className="text-xs text-green-700 uppercase tracking-wider mb-1 font-bold">UPI ID</p>
                            <p className="font-bold text-slate-900">{laboratoryInfo.upiId}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment History */}
                  {payments.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 pb-3 border-b-3 border-amber-500 flex items-center gap-2">
                        <span className="text-amber-500">◆</span> Payment History
                      </h3>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 rounded-xl p-5 space-y-3">
                        {payments.map((payment, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <div>
                              <span className="font-bold text-slate-900">{formatDate(payment.paidAt)}</span>
                              <span className="text-slate-600 mx-2">•</span>
                              <span className="text-slate-700 font-bold">{payment.method}</span>
                              {payment.transactionId && (
                                <span className="text-slate-500 text-xs ml-2">({payment.transactionId})</span>
                              )}
                            </div>
                            <span className="font-bold text-green-700">{formatCurrency(payment.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {notes && (
                    <div className="mb-8">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 pb-3 border-b-3 border-amber-500 flex items-center gap-2">
                        <span className="text-amber-500">◆</span> Notes
                      </h3>
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-500 rounded-xl p-5">
                        <p className="text-sm text-slate-800 whitespace-pre-wrap font-medium">{notes}</p>
                      </div>
                    </div>
                  )}

                  {/* QR Code Verification */}
                  <div className="flex items-center gap-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border-2 border-slate-900">
                    <div ref={qrCodeRef} className="w-24 h-24 bg-white rounded-xl flex items-center justify-center border-2 border-slate-900 shadow-lg">
                      {generatingQR ? (
                        <div className="text-xs text-slate-400 text-center">Generating QR...</div>
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Invoice Verification
                      </h4>
                      <p className="text-xs text-slate-600 mt-2">Scan this QR code to verify invoice authenticity and GST compliance</p>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{invoice.invoiceNumber || `INV-${invoice.id}`}</p>
                    </div>
                  </div>
                </div>

                {/* Premium Footer */}
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 px-8 py-6 border-t-3 border-slate-900">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="text-amber-500">◆</span> Terms & Conditions
                      </h4>
                      <ul className="text-xs text-slate-700 space-y-1">
                        <li>1. Payment is due within 30 days from invoice date.</li>
                        <li>2. Goods once sold will not be taken back.</li>
                        <li>3. Subject to local jurisdiction only.</li>
                        <li>4. This is a computer-generated invoice and does not require signature.</li>
                      </ul>
                    </div>
                    <div className="text-right">
                      <div className="inline-block border-t-2 border-slate-900 pt-3 px-8">
                        <p className="text-xs font-bold text-slate-900">For {laboratoryInfo.name}</p>
                        <p className="text-xs text-slate-600 mt-1">Authorized Signatory</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 text-center space-y-1">
                    <p className="text-xs text-slate-600 font-bold">This is a computer-generated tax invoice.</p>
                    <p className="text-xs text-slate-600">For queries, please contact the laboratory billing department.</p>
                    <p className="text-xs text-slate-400">Generated on {new Date().toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 px-6 py-4 bg-white rounded-b-2xl">
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                onClick={handlePreviewPrint}
                className="flex items-center gap-2 rounded-lg border-2 border-amber-500 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-700 shadow-lg transition hover:bg-amber-100"
              >
                <Printer className="w-4 h-4" />
                Print Luxury Invoice
              </button>

              <button
                onClick={handlePreviewDownload}
                disabled={generatingPDF}
                className="flex items-center gap-2 rounded-lg border-2 border-amber-500 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-700 shadow-lg transition hover:bg-amber-100 disabled:opacity-50"
              >
                {generatingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setPreviewMode(false);
                  onClose?.();
                }}
                className="rounded-lg border-2 border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 no-print">
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-lg border-2 border-amber-500 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-700 shadow-lg transition hover:bg-amber-100"
        >
          <Printer className="w-4 h-4" />
          Print Luxury Invoice
        </button>

        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={generatingPDF}
          className="flex items-center gap-2 rounded-lg border-2 border-amber-500 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-700 shadow-lg transition hover:bg-amber-100 disabled:opacity-50"
        >
          {generatingPDF ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download PDF
            </>
          )}
        </button>
      </div>

      {/* Hidden Print Template */}
      <div 
        ref={invoiceRef} 
        className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl border border-amber-200 overflow-hidden hidden"
      >
        {/* Premium Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl"></div>
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-slate-900 text-4xl font-black shadow-lg shadow-amber-500/30 border-2 border-amber-400">
                LC
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-wide">{laboratoryInfo.name}</h1>
                <p className="text-amber-400 text-sm uppercase tracking-widest mt-2 font-bold">Enterprise Laboratory Information System</p>
                <div className="mt-3 text-xs text-slate-300 space-y-1">
                  <p>{laboratoryInfo.address}</p>
                  <p>GSTIN: {laboratoryInfo.gstin} | PAN: {laboratoryInfo.pan}</p>
                  <p>Phone: {laboratoryInfo.phone} | Email: {laboratoryInfo.email}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-5xl font-black text-amber-400 tracking-wider">TAX INVOICE</p>
              <div className="mt-3 bg-amber-500/20 border border-amber-500/30 rounded-lg px-4 py-2 inline-block">
                <p className="text-amber-400 text-lg font-bold">{invoice.invoiceNumber || `INV-${invoice.id}`}</p>
              </div>
              <div className="mt-3 text-xs text-slate-300 space-y-1">
                <p>Date: {formatDate(invoice.createdAt)}</p>
                <p>Due: {formatDate(invoice.dueDate)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Bill To Section */}
          <div className="mb-8">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 pb-3 border-b-3 border-amber-500 flex items-center gap-2">
              <span className="text-amber-500">◆</span> Bill To / Patient Details
            </h3>
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-l-4 border-amber-500">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Patient Name</p>
                <p className="font-bold text-slate-900">{invoice.patientName || "—"}</p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-l-4 border-amber-500">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">UHID</p>
                <p className="font-bold text-slate-900">{invoice.patientUhid || "—"}</p>
              </div>
              {patientInfo?.phone && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-l-4 border-amber-500">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Phone</p>
                  <p className="font-bold text-slate-900">{patientInfo.phone}</p>
                </div>
              )}
              {patientInfo?.email && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-l-4 border-amber-500">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Email</p>
                  <p className="font-bold text-slate-900">{patientInfo.email}</p>
                </div>
              )}
              {patientInfo?.address && (
                <div className="col-span-2 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-l-4 border-amber-500">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Address</p>
                  <p className="font-bold text-slate-900">{patientInfo.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Doctor/Institution Section */}
          {doctorInfo?.name && (
            <div className="mb-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 pb-3 border-b-3 border-amber-500 flex items-center gap-2">
                <span className="text-amber-500">◆</span> Referring Doctor / Institution
              </h3>
              <div className="grid grid-cols-2 gap-5">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-l-4 border-amber-500">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Doctor Name</p>
                  <p className="font-bold text-slate-900">Dr. {doctorInfo.name}</p>
                </div>
                {doctorInfo.qualification && (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-l-4 border-amber-500">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Qualification</p>
                    <p className="font-bold text-slate-900">{doctorInfo.qualification}</p>
                  </div>
                )}
                {doctorInfo.gstin && (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-l-4 border-amber-500">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">GSTIN</p>
                    <p className="font-bold text-slate-900">{doctorInfo.gstin}</p>
                  </div>
                )}
                {doctorInfo.address && (
                  <div className="col-span-2 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-l-4 border-amber-500">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Address</p>
                    <p className="font-bold text-slate-900">{doctorInfo.address}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invoice Items Table */}
          <div className="mb-8">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 pb-3 border-b-3 border-amber-500 flex items-center gap-2">
              <span className="text-amber-500">◆</span> Services / Tests
            </h3>
            <div className="overflow-x-auto rounded-xl shadow-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                    <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-wider">#</th>
                    <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-wider">Description</th>
                    <th className="text-center py-4 px-4 text-xs font-black uppercase tracking-wider">HSN/SAC</th>
                    <th className="text-center py-4 px-4 text-xs font-black uppercase tracking-wider">Qty</th>
                    <th className="text-right py-4 px-4 text-xs font-black uppercase tracking-wider">Rate</th>
                    <th className="text-right py-4 px-4 text-xs font-black uppercase tracking-wider">Taxable</th>
                    <th className="text-center py-4 px-4 text-xs font-black uppercase tracking-wider">CGST%</th>
                    <th className="text-right py-4 px-4 text-xs font-black uppercase tracking-wider">CGST</th>
                    <th className="text-center py-4 px-4 text-xs font-black uppercase tracking-wider">SGST%</th>
                    <th className="text-right py-4 px-4 text-xs font-black uppercase tracking-wider">SGST</th>
                    <th className="text-right py-4 px-4 text-xs font-black uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-500 text-sm">
                        No items found
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="py-4 px-4 text-sm font-bold text-slate-900">{index + 1}</td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-900 text-sm">{item.testName || "Laboratory Service"}</p>
                          {item.testCode && (
                            <p className="text-xs text-slate-400 font-mono">{item.testCode}</p>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center text-sm text-slate-700 font-bold">{item.hsnSacCode || "999312"}</td>
                        <td className="py-4 px-4 text-center text-sm text-slate-700 font-bold">{item.quantity || 1}</td>
                        <td className="py-4 px-4 text-right text-sm text-slate-700 font-bold">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-4 px-4 text-right text-sm text-slate-700 font-bold">{formatCurrency(item.taxableValue || item.total)}</td>
                        <td className="py-4 px-4 text-center text-sm text-slate-700 font-bold">{item.cgstPercent || 9}%</td>
                        <td className="py-4 px-4 text-right text-sm text-slate-700 font-bold">{formatCurrency(item.cgstAmount)}</td>
                        <td className="py-4 px-4 text-center text-sm text-slate-700 font-bold">{item.sgstPercent || 9}%</td>
                        <td className="py-4 px-4 text-right text-sm text-slate-700 font-bold">{formatCurrency(item.sgstAmount)}</td>
                        <td className="py-4 px-4 text-right font-black text-slate-900 text-sm">{formatCurrency(item.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Premium Summary Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border-2 border-amber-500 shadow-xl">
              <div className="space-y-4 max-w-xs ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Subtotal</span>
                  <span className="font-bold text-white">{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Total Discount</span>
                    <span className="font-bold text-red-400">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Total Taxable Value</span>
                  <span className="font-bold text-white">{formatCurrency(subtotal - discountAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Total GST</span>
                  <span className="font-bold text-white">{formatCurrency(totalGST)}</span>
                </div>
                <div className="flex justify-between pt-4 border-t-2 border-amber-500">
                  <span className="font-black text-amber-400 text-lg">Grand Total</span>
                  <span className="font-black text-amber-400 text-lg">{formatCurrency(grandTotal)}</span>
                </div>
                <div className="text-xs text-slate-400 italic">
                  {numberToWords(Math.round(grandTotal))} Rupees Only
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Amount Paid</span>
                  <span className="font-bold text-green-400">{formatCurrency(paid)}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-slate-600">
                  <span className="font-black text-white text-lg">Balance Due</span>
                  <span className="font-black text-red-400 text-lg">{formatCurrency(pending)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status Badge */}
          <div className="mb-8 flex justify-end">
            <span className={`inline-flex items-center px-8 py-4 rounded-full text-sm font-black uppercase tracking-wider border-2 shadow-lg ${statusClass(invoice.paymentStatus || invoice.status)}`}>
              {invoice.paymentStatus || invoice.status || "Pending"}
            </span>
          </div>

          {/* Bank Details */}
          <div className="mb-8">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 pb-3 border-b-3 border-amber-500 flex items-center gap-2">
              <span className="text-amber-500">◆</span> Bank Details
            </h3>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 rounded-xl p-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-green-700 uppercase tracking-wider mb-1 font-bold">Bank Name</p>
                  <p className="font-bold text-slate-900">{laboratoryInfo.bankDetails?.bankName || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700 uppercase tracking-wider mb-1 font-bold">Account Number</p>
                  <p className="font-bold text-slate-900">{laboratoryInfo.bankDetails?.accountNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700 uppercase tracking-wider mb-1 font-bold">IFSC Code</p>
                  <p className="font-bold text-slate-900">{laboratoryInfo.bankDetails?.ifsc || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700 uppercase tracking-wider mb-1 font-bold">Branch</p>
                  <p className="font-bold text-slate-900">{laboratoryInfo.bankDetails?.branch || "—"}</p>
                </div>
                {laboratoryInfo.upiId && (
                  <div className="col-span-2">
                    <p className="text-xs text-green-700 uppercase tracking-wider mb-1 font-bold">UPI ID</p>
                    <p className="font-bold text-slate-900">{laboratoryInfo.upiId}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 pb-3 border-b-3 border-amber-500 flex items-center gap-2">
                <span className="text-amber-500">◆</span> Payment History
              </h3>
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 rounded-xl p-5 space-y-3">
                {payments.map((payment, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-bold text-slate-900">{formatDate(payment.paidAt)}</span>
                      <span className="text-slate-600 mx-2">•</span>
                      <span className="text-slate-700 font-bold">{payment.method}</span>
                      {payment.transactionId && (
                        <span className="text-slate-500 text-xs ml-2">({payment.transactionId})</span>
                      )}
                    </div>
                    <span className="font-bold text-green-700">{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {notes && (
            <div className="mb-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 pb-3 border-b-3 border-amber-500 flex items-center gap-2">
                <span className="text-amber-500">◆</span> Notes
              </h3>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-500 rounded-xl p-5">
                <p className="text-sm text-slate-800 whitespace-pre-wrap font-medium">{notes}</p>
              </div>
            </div>
          )}

          {/* QR Code Verification */}
          <div className="flex items-center gap-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border-2 border-slate-900">
            <div ref={qrCodeRef} className="w-24 h-24 bg-white rounded-xl flex items-center justify-center border-2 border-slate-900 shadow-lg">
              {generatingQR ? (
                <div className="text-xs text-slate-400 text-center">Generating QR...</div>
              ) : null}
            </div>
            <div className="flex-1">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Invoice Verification
              </h4>
              <p className="text-xs text-slate-600 mt-2">Scan this QR code to verify invoice authenticity and GST compliance</p>
              <p className="text-xs text-slate-400 mt-1 font-mono">{invoice.invoiceNumber || `INV-${invoice.id}`}</p>
            </div>
          </div>
        </div>

        {/* Premium Footer */}
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 px-8 py-6 border-t-3 border-slate-900">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="text-amber-500">◆</span> Terms & Conditions
              </h4>
              <ul className="text-xs text-slate-700 space-y-1">
                <li>1. Payment is due within 30 days from invoice date.</li>
                <li>2. Goods once sold will not be taken back.</li>
                <li>3. Subject to local jurisdiction only.</li>
                <li>4. This is a computer-generated invoice and does not require signature.</li>
              </ul>
            </div>
            <div className="text-right">
              <div className="inline-block border-t-2 border-slate-900 pt-3 px-8">
                <p className="text-xs font-bold text-slate-900">For {laboratoryInfo.name}</p>
                <p className="text-xs text-slate-600 mt-1">Authorized Signatory</p>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center space-y-1">
            <p className="text-xs text-slate-600 font-bold">This is a computer-generated tax invoice.</p>
            <p className="text-xs text-slate-600">For queries, please contact the laboratory billing department.</p>
            <p className="text-xs text-slate-400">Generated on {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}