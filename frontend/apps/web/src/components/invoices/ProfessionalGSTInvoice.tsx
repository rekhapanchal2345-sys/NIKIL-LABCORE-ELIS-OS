"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { Invoice } from "./InvoiceTable";
import { Printer, Download, X, Loader2, Eye, CheckCircle, Phone, Mail, Globe, MapPin } from "lucide-react";

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
  method?: string;
  result?: string;
  unit?: string;
  referenceRange?: string;
  status?: string;
}

interface ProfessionalGSTInvoiceProps {
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
      accountName?: string;
      accountNumber?: string;
      ifsc?: string;
      branch?: string;
    };
    upiId?: string;
  };
  collectionInfo?: {
    collectedBy?: string;
    collectionDate?: string;
    collectionTime?: string;
    sampleType?: string;
    labBranch?: string;
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

function formatTime(date?: string) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
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

export default function ProfessionalGSTInvoice({
  invoice,
  items = [],
  taxAmount = 0,
  discountAmount = 0,
  notes,
  patientInfo,
  doctorInfo,
  payments = [],
  labInfo,
  collectionInfo,
  onClose,
}: ProfessionalGSTInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const laboratoryInfo = useMemo(() => labInfo || {
    name: "LabCore Diagnostics Pvt. Ltd.",
    address: "123 Healthcare Avenue, Medical District, City - 560001",
    phone: "+91-9876543210",
    gstin: "29ABCDE1234F1Z5",
    pan: "ABCDE1234F",
    email: "info@labcore.com",
    website: "www.labcore.com",
    bankDetails: {
      bankName: "HDFC Bank",
      accountName: "LabCore Diagnostics Pvt. Ltd.",
      accountNumber: "1234567890123",
      ifsc: "HDFC0001234",
      branch: "Main Branch, City"
    },
    upiId: "labcore@upi"
  }, [labInfo]);

  const collectionDetails = collectionInfo || {
    collectedBy: "Lab Technician",
    collectionDate: invoice.createdAt,
    collectionTime: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    sampleType: "Blood",
    labBranch: "Main Branch"
  };

  const total = Number(invoice.totalAmount || 0);
  const paid = Number(invoice.paidAmount || 0);
  const pending = invoice.pendingAmount !== undefined 
    ? Number(invoice.pendingAmount) 
    : Math.max(0, total - paid);

  const subtotal = items.reduce((sum, item) => sum + (item.taxableValue || item.total || 0), 0);
  const totalGST = items.reduce((sum, item) => sum + (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0), 0);
  const totalCGST = items.reduce((sum, item) => sum + (item.cgstAmount || 0), 0);
  const totalSGST = items.reduce((sum, item) => sum + (item.sgstAmount || 0), 0);
  const totalIGST = items.reduce((sum, item) => sum + (item.igstAmount || 0), 0);
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
            dark: '#1e3a8a',
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
                color: #1f2937;
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
                background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                padding: 25px;
                margin-bottom: 20px;
                border-radius: 8px;
              }
              .logo-section {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 15px;
              }
              .logo-box {
                width: 60px;
                height: 60px;
                background: white;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #1e3a8a;
                font-size: 28px;
                font-weight: 900;
              }
              .company-details h1 {
                font-size: 24px;
                font-weight: 800;
                color: white;
                margin: 0 0 4px 0;
              }
              .company-details .tagline {
                font-size: 10px;
                color: #93c5fd;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin: 0;
              }
              .contact-info {
                font-size: 9px;
                color: #dbeafe;
                line-height: 1.5;
                margin-top: 8px;
              }
              .invoice-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-top: 15px;
              }
              .invoice-title {
                font-size: 28px;
                font-weight: 900;
                color: white;
                letter-spacing: 2px;
                text-transform: uppercase;
              }
              .invoice-meta {
                text-align: right;
              }
              .invoice-number {
                font-size: 18px;
                font-weight: 800;
                color: white;
                background: rgba(255,255,255,0.2);
                padding: 6px 12px;
                border-radius: 6px;
                display: inline-block;
              }
              .meta-item {
                font-size: 9px;
                color: #dbeafe;
                margin-top: 3px;
              }
              .section {
                margin-bottom: 20px;
              }
              .section-title {
                font-size: 11px;
                font-weight: 800;
                color: #1e3a8a;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 2px solid #3b82f6;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
              }
              .info-item {
                margin-bottom: 8px;
              }
              .info-label {
                font-size: 8px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 2px;
                font-weight: 600;
              }
              .info-value {
                font-size: 11px;
                font-weight: 600;
                color: #1f2937;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                border-radius: 8px;
                overflow: hidden;
              }
              th {
                background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                color: white;
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                padding: 10px 8px;
                text-align: left;
              }
              td {
                padding: 10px 8px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 9px;
                background: white;
              }
              tr:nth-child(even) td {
                background: #f9fafb;
              }
              .amount-cell {
                text-align: right;
                font-weight: 700;
              }
              .center-cell {
                text-align: center;
                font-weight: 600;
              }
              .summary-section {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border: 2px solid #3b82f6;
                border-radius: 12px;
                padding: 20px;
                margin-top: 20px;
              }
              .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
                font-size: 10px;
                color: #374151;
              }
              .summary-row.total {
                border-top: 2px solid #1e3a8a;
                border-bottom: 2px solid #1e3a8a;
                padding: 12px 0;
                margin-top: 8px;
                font-size: 14px;
                font-weight: 900;
                color: #1e3a8a;
              }
              .summary-row.balance {
                font-size: 14px;
                font-weight: 900;
                color: #dc2626;
                padding-top: 8px;
              }
              .status-badge {
                display: inline-block;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 10px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border: 2px solid;
              }
              .payment-section {
                background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                border: 2px solid #10b981;
                border-radius: 10px;
                padding: 15px;
              }
              .notes-section {
                background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
                border: 2px solid #f59e0b;
                border-radius: 10px;
                padding: 15px;
              }
              .qr-section {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-top: 15px;
                padding: 15px;
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border-radius: 10px;
                border: 2px solid #1e3a8a;
              }
              .qr-code {
                width: 80px;
                height: 80px;
                border: 2px solid #1e3a8a;
                border-radius: 6px;
                background: white;
              }
              .verification-text {
                flex: 1;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #1e3a8a;
                text-align: center;
                font-size: 9px;
                color: #6b7280;
              }
              .footer-section {
                margin-bottom: 15px;
              }
              .footer-section h4 {
                font-size: 10px;
                font-weight: 800;
                color: #1e3a8a;
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .footer-section ul {
                list-style: none;
                text-align: left;
              }
              .footer-section li {
                margin-bottom: 3px;
              }
              .authorized-section {
                margin-top: 25px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
              }
              .signature-line {
                width: 180px;
                border-top: 2px solid #1e3a8a;
                padding-top: 8px;
                text-align: center;
                font-size: 9px;
                font-weight: 700;
                color: #1e3a8a;
              }
              .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 100px;
                font-weight: 900;
                color: rgba(30, 58, 138, 0.08);
                text-transform: uppercase;
                letter-spacing: 8px;
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
      
      // Header with gradient background
      pdf.setFillColor(30, 58, 138);
      pdf.rect(0, 0, pageWidth, 45, "F");
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text(laboratoryInfo.name || "LabCore Diagnostics", 15, 18);
      
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text("Enterprise Laboratory Information System", 15, 25);
      pdf.text(laboratoryInfo.address || "Laboratory address unavailable", 15, 30);
      pdf.text(`GSTIN: ${laboratoryInfo.gstin} | PAN: ${laboratoryInfo.pan}`, 15, 35);
      pdf.text(`Phone: ${laboratoryInfo.phone} | Email: ${laboratoryInfo.email}`, 15, 40);
      
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("TAX INVOICE", pageWidth - 15, 18, { align: "right" });
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.text(invoice.invoiceNumber || `INV-${invoice.id}`, pageWidth - 15, 25, { align: "right" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(`Date: ${formatDate(invoice.createdAt)}`, pageWidth - 15, 30, { align: "right" });
      pdf.text(`Time: ${formatTime(invoice.createdAt)}`, pageWidth - 15, 35, { align: "right" });
      
      pdf.setTextColor(0, 0, 0);
      
      let yPosition = 55;
      
      // Invoice Details
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("INVOICE DETAILS", 15, yPosition);
      yPosition += 8;
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(`Invoice No: ${invoice.invoiceNumber || `INV-${invoice.id}`}`, 15, yPosition);
      yPosition += 5;
      pdf.text(`Date: ${formatDate(invoice.createdAt)}`, 15, yPosition);
      yPosition += 5;
      pdf.text(`Time: ${formatTime(invoice.createdAt)}`, 15, yPosition);
      yPosition += 5;
      
      if (payments.length > 0) {
        pdf.text(`Payment Mode: ${payments[0].method.replace("_", " ")}`, 15, yPosition);
        yPosition += 5;
        if (payments[0].transactionId) {
          pdf.text(`Transaction ID: ${payments[0].transactionId}`, 15, yPosition);
          yPosition += 5;
        }
      }
      
      yPosition += 10;
      
      // Patient Information
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("PATIENT INFORMATION", 15, yPosition);
      yPosition += 8;
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(`Patient Name: ${invoice.patientName || "N/A"}`, 15, yPosition);
      yPosition += 5;
      pdf.text(`Patient ID: ${invoice.patientId || "N/A"}`, 15, yPosition);
      yPosition += 5;
      if (patientInfo?.age) {
        pdf.text(`Age/Gender: ${patientInfo.age}${patientInfo.gender ? `/${patientInfo.gender}` : ""}`, 15, yPosition);
        yPosition += 5;
      }
      if (patientInfo?.phone) {
        pdf.text(`Phone: ${patientInfo.phone}`, 15, yPosition);
        yPosition += 5;
      }
      if (patientInfo?.address) {
        pdf.text(`Address: ${patientInfo.address}`, 15, yPosition);
        yPosition += 5;
      }
      
      yPosition += 10;
      
      // Collection Information
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("COLLECTION INFORMATION", 15, yPosition);
      yPosition += 8;
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(`Collected By: ${collectionDetails.collectedBy}`, 15, yPosition);
      yPosition += 5;
      pdf.text(`Collection Date: ${formatDate(collectionDetails.collectionDate)}`, 15, yPosition);
      yPosition += 5;
      pdf.text(`Collection Time: ${collectionDetails.collectionTime}`, 15, yPosition);
      yPosition += 5;
      pdf.text(`Sample Type: ${collectionDetails.sampleType}`, 15, yPosition);
      yPosition += 5;
      if (doctorInfo?.name) {
        pdf.text(`Ref. Doctor: Dr. ${doctorInfo.name}${doctorInfo.qualification ? ` (${doctorInfo.qualification})` : ""}`, 15, yPosition);
        yPosition += 5;
      }
      pdf.text(`Lab Branch: ${collectionDetails.labBranch}`, 15, yPosition);
      
      yPosition += 10;
      
      // Test Results Table
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("TEST RESULTS", 15, yPosition);
      yPosition += 8;
      
      // Table header
      pdf.setFillColor(30, 58, 138);
      pdf.rect(15, yPosition - 4, pageWidth - 30, 6, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      pdf.text("Test Name", 17, yPosition);
      pdf.text("Method", 60, yPosition);
      pdf.text("Result", 85, yPosition);
      pdf.text("Unit", 110, yPosition);
      pdf.text("Ref. Range", 125, yPosition);
      pdf.text("Status", 155, yPosition);
      pdf.text("Amount", 175, yPosition, { align: "right" });
      
      yPosition += 6;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");
      
      // Table rows
      items.forEach((item, index) => {
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = 20;
          
          // Repeat header on new page
          pdf.setFillColor(30, 58, 138);
          pdf.rect(15, yPosition - 4, pageWidth - 30, 6, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(7);
          pdf.setFont("helvetica", "bold");
          pdf.text("Test Name", 17, yPosition);
          pdf.text("Method", 60, yPosition);
          pdf.text("Result", 85, yPosition);
          pdf.text("Unit", 110, yPosition);
          pdf.text("Ref. Range", 125, yPosition);
          pdf.text("Status", 155, yPosition);
          pdf.text("Amount", 175, yPosition, { align: "right" });
          
          yPosition += 6;
          pdf.setTextColor(0, 0, 0);
          pdf.setFont("helvetica", "normal");
        }
        
        if (index % 2 === 0) {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(15, yPosition - 3, pageWidth - 30, 5, "F");
        }
        
        pdf.setFontSize(7);
        pdf.text(item.testName || "N/A", 17, yPosition);
        pdf.text(item.method || "N/A", 60, yPosition);
        pdf.text(item.result || "N/A", 85, yPosition);
        pdf.text(item.unit || "N/A", 110, yPosition);
        pdf.text(item.referenceRange || "N/A", 125, yPosition);
        pdf.text(item.status || "N/A", 155, yPosition);
        pdf.text(formatCurrency(item.total), 175, yPosition, { align: "right" });
        
        yPosition += 5;
      });
      
      yPosition += 10;
      
      // Amount Summary
      pdf.setFillColor(240, 249, 255);
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 50, 2, 2, "FD");
      
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 58, 138);
      pdf.text("AMOUNT SUMMARY", 20, yPosition + 5);
      pdf.setTextColor(0, 0, 0);
      
      yPosition += 12;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      
      const summaryY = yPosition;
      pdf.text("Total Amount (Before Discount):", 20, summaryY);
      pdf.text(formatCurrency(subtotal + Number(discountAmount)), pageWidth - 20, summaryY, { align: "right" });
      
      pdf.text("Discount:", 20, summaryY + 6);
      pdf.text(formatCurrency(discountAmount), pageWidth - 20, summaryY + 6, { align: "right" });
      
      pdf.text("Taxable Amount:", 20, summaryY + 12);
      pdf.text(formatCurrency(subtotal), pageWidth - 20, summaryY + 12, { align: "right" });
      
      const totalCGST = items.reduce((sum, item) => sum + (item.cgstAmount || 0), 0);
      const totalSGST = items.reduce((sum, item) => sum + (item.sgstAmount || 0), 0);
      const totalIGST = items.reduce((sum, item) => sum + (item.igstAmount || 0), 0);
      
      if (totalCGST > 0) {
        pdf.text("CGST:", 20, summaryY + 18);
        pdf.text(formatCurrency(totalCGST), pageWidth - 20, summaryY + 18, { align: "right" });
      }
      if (totalSGST > 0) {
        pdf.text("SGST:", 20, summaryY + 24);
        pdf.text(formatCurrency(totalSGST), pageWidth - 20, summaryY + 24, { align: "right" });
      }
      if (totalIGST > 0) {
        pdf.text("IGST:", 20, summaryY + 30);
        pdf.text(formatCurrency(totalIGST), pageWidth - 20, summaryY + 30, { align: "right" });
      }
      
      pdf.text("Total Tax:", 20, summaryY + 36);
      pdf.text(formatCurrency(totalGST), pageWidth - 20, summaryY + 36, { align: "right" });
      
      pdf.setDrawColor(30, 58, 138);
      pdf.setLineWidth(0.5);
      pdf.line(20, summaryY + 40, pageWidth - 20, summaryY + 40);
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(30, 58, 138);
      pdf.text("Total Payable Amount:", 20, summaryY + 46);
      pdf.text(formatCurrency(grandTotal), pageWidth - 20, summaryY + 46, { align: "right" });
      pdf.setTextColor(0, 0, 0);
      
      yPosition += 55;
      
      // Payment Details
      if (payments.length > 0) {
        pdf.setFillColor(236, 253, 245);
        pdf.setDrawColor(16, 185, 129);
        pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 25, 2, 2, "FD");
        
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(16, 185, 129);
        pdf.text("PAYMENT DETAILS", 20, yPosition + 5);
        pdf.setTextColor(0, 0, 0);
        
        yPosition += 12;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        
        pdf.text(`Amount Paid: ${formatCurrency(paid)}`, 20, yPosition);
        pdf.text(`Payment Mode: ${payments[0].method.replace("_", " ")}`, 20, yPosition + 6);
        pdf.text(`Date: ${formatDate(payments[0].paidAt)}`, 20, yPosition + 12);
        
        if (payments[0].transactionId) {
          pdf.text(`Transaction ID: ${payments[0].transactionId}`, pageWidth - 20, yPosition, { align: "right" });
        }
        
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(16, 185, 129);
        pdf.text("✓ Payment Successful", pageWidth - 20, yPosition + 12, { align: "right" });
        pdf.setTextColor(0, 0, 0);
        
        yPosition += 30;
      }
      
      // Bank Details
      pdf.setFillColor(255, 251, 235);
      pdf.setDrawColor(245, 158, 11);
      pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 20, 2, 2, "FD");
      
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(245, 158, 11);
      pdf.text("BANK DETAILS (For Online Payments)", 20, yPosition + 5);
      pdf.setTextColor(0, 0, 0);
      
      yPosition += 12;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      
      pdf.text(`Bank Name: ${laboratoryInfo.bankDetails?.bankName || "N/A"}`, 20, yPosition);
      pdf.text(`Account Name: ${laboratoryInfo.bankDetails?.accountName || "N/A"}`, 20, yPosition + 5);
      pdf.text(`Account No.: ${laboratoryInfo.bankDetails?.accountNumber || "N/A"}`, 20, yPosition + 10);
      pdf.text(`IFSC Code: ${laboratoryInfo.bankDetails?.ifsc || "N/A"}`, pageWidth - 20, yPosition, { align: "right" });
      pdf.text(`WhatsApp: ${laboratoryInfo.phone} (Send payment screenshot)`, pageWidth - 20, yPosition + 5, { align: "right" });
      
      yPosition += 25;
      
      // Terms & Notes
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text("Terms & Notes:", 15, yPosition);
      yPosition += 5;
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      const terms = [
        "• Reports will be generated within 24-48 hours of sample collection",
        "• This is a computer-generated invoice and does not require physical signature",
        "• No refunds will be processed after sample collection",
        "• For any queries, please contact our support team"
      ];
      
      terms.forEach((term) => {
        pdf.text(term, 20, yPosition);
        yPosition += 4;
      });
      
      yPosition += 8;
      
      // Verification and Signatures
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("Verification and Signatures", 15, yPosition);
      yPosition += 10;
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text("Verified By: Dr. Priyanka Desai", 15, yPosition);
      pdf.text("Pathologist", 15, yPosition + 5);
      
      pdf.text("Authorized Signatory: Nikil Panchal", pageWidth - 20, yPosition, { align: "right" });
      pdf.text("Lab Director", pageWidth - 20, yPosition + 5, { align: "right" });
      
      // Footer
      yPosition = pageHeight - 20;
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 58, 138);
      pdf.text("NABL Accredited | ISO Certified | HIPAA Compliant", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 5;
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text("Your Health. Our Priority. Secure Accurate. Reliable", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 8;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(107, 114, 128);
      pdf.text("NEED HELP? Contact us at " + laboratoryInfo.phone + " | " + laboratoryInfo.email, pageWidth / 2, yPosition, { align: "center" });
      pdf.text("Working Hours: Mon-Sat 8AM-8PM, Sun 9AM-2PM", pageWidth / 2, yPosition + 4, { align: "center" });
      pdf.setTextColor(0, 0, 0);
      
      pdf.save(`LabCore_Invoice_${invoice.invoiceNumber || invoice.id}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading invoice...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <Printer className="h-4 w-4" />
          Print Invoice
        </button>

        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={generatingPDF}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          {generatingPDF ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download PDF
            </>
          )}
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        )}
      </div>

      {/* Professional Invoice Template */}
      <div 
        ref={invoiceRef} 
        className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <span className="text-3xl font-bold text-white">🔬</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  LabCore ENTERPRISE LIS
                </h1>
                <p className="text-blue-200 text-xs uppercase tracking-widest mt-1">
                  LabCore Diagnostics Pvt. Ltd.
                </p>
                <div className="flex items-center gap-4 mt-2 text-blue-100 text-xs">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {laboratoryInfo.phone}
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {laboratoryInfo.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {laboratoryInfo.website}
                  </div>
                </div>
                <div className="text-blue-200 text-xs mt-1">
                  {laboratoryInfo.address}
                </div>
                <div className="text-blue-200 text-xs mt-1">
                  GSTIN: {laboratoryInfo.gstin} | PAN: {laboratoryInfo.pan}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-white tracking-wider">
                TAX INVOICE
              </div>
              <div className="bg-white/20 backdrop-blur-sm inline-block px-3 py-1 rounded-lg mt-2">
                <div className="text-white font-bold text-sm">
                  {invoice.invoiceNumber || `INV-${invoice.id}`}
                </div>
              </div>
              <div className="text-blue-200 text-xs mt-2 space-y-1">
                <div>Date: {formatDate(invoice.createdAt)}</div>
                <div>Time: {formatTime(invoice.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Invoice Details Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Invoice No</p>
                <p className="font-bold text-gray-900 text-sm">{invoice.invoiceNumber || `INV-${invoice.id}`}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Date</p>
                <p className="text-gray-700 text-sm">{formatDate(invoice.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Time</p>
                <p className="text-gray-700 text-sm">{formatTime(invoice.createdAt)}</p>
              </div>
              {payments.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Payment Mode</p>
                  <p className="text-gray-700 text-sm">{payments[0].method.replace("_", " ")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Patient Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-900 mb-3">
              Patient Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Patient Name</p>
                <p className="font-bold text-gray-900 text-sm">{invoice.patientName || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Patient ID</p>
                <p className="font-mono text-xs text-gray-600">{invoice.patientId || "N/A"}</p>
              </div>
              {patientInfo?.age && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Age/Gender</p>
                  <p className="text-gray-700 text-sm">{patientInfo.age}{patientInfo.gender ? `/${patientInfo.gender}` : ""}</p>
                </div>
              )}
              {patientInfo?.phone && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Phone</p>
                  <p className="text-gray-700 text-sm">{patientInfo.phone}</p>
                </div>
              )}
              {patientInfo?.address && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Address</p>
                  <p className="text-gray-700 text-sm">{patientInfo.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Collection Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-900 mb-3">
              Collection Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Collected By</p>
                <p className="text-gray-700 text-sm">{collectionDetails.collectedBy}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Collection Date</p>
                <p className="text-gray-700 text-sm">{formatDate(collectionDetails.collectionDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Collection Time</p>
                <p className="text-gray-700 text-sm">{collectionDetails.collectionTime}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Sample Type</p>
                <p className="text-gray-700 text-sm">{collectionDetails.sampleType}</p>
              </div>
              {doctorInfo?.name && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Ref. Doctor</p>
                  <p className="text-gray-700 text-sm">Dr. {doctorInfo.name}{doctorInfo.qualification ? ` (${doctorInfo.qualification})` : ""}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Lab Branch</p>
                <p className="text-gray-700 text-sm">{collectionDetails.labBranch}</p>
              </div>
            </div>
          </div>

          {/* Verify Report Section */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div ref={qrCodeRef} className="flex-shrink-0">
                {generatingQR ? (
                  <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : null}
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-blue-900 mb-1">Verification Code</div>
                <div className="font-mono text-sm text-gray-700">{invoice.invoiceNumber || invoice.id}</div>
                <div className="text-xs text-gray-500 mt-2">Scan QR code to verify report authenticity</div>
              </div>
            </div>
          </div>

          {/* Test Results Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-900 border-b-2 border-blue-200 pb-2">
              Test Details
            </h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">Test Name</th>
                    <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">Method</th>
                    <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">Result</th>
                    <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">Unit</th>
                    <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">Reference Range</th>
                    <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={item.id || index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-2 font-medium text-gray-900">{item.testName || "N/A"}</td>
                      <td className="px-3 py-2 text-gray-600">{item.method || "N/A"}</td>
                      <td className="px-3 py-2 text-gray-900 font-semibold">{item.result || "N/A"}</td>
                      <td className="px-3 py-2 text-gray-600">{item.unit || "N/A"}</td>
                      <td className="px-3 py-2 text-gray-600">{item.referenceRange || "N/A"}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${statusClass(item.status)}`}>
                          {item.status || "N/A"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-gray-900">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Amount Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-900 mb-4">
              Amount Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Amount (Before Discount)</span>
                <span className="font-semibold text-gray-900">{formatCurrency(subtotal + Number(discountAmount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="font-semibold text-green-600">-{formatCurrency(discountAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taxable Amount</span>
                <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              
              {totalCGST > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">CGST</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(totalCGST)}</span>
                </div>
              )}
              {totalSGST > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">SGST</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(totalSGST)}</span>
                </div>
              )}
              {totalIGST > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IGST</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(totalIGST)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Tax</span>
                <span className="font-semibold text-gray-900">{formatCurrency(totalGST)}</span>
              </div>
              
              <div className="border-t-2 border-blue-900 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-base font-bold text-blue-900">Total Payable Amount</span>
                  <span className="text-2xl font-black text-blue-900">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 italic mt-2">
                Amount in words: {numberToWords(Math.round(grandTotal))} Rupees Only
              </div>
              
              {pending > 0 && (
                <div className="flex justify-between text-sm pt-2">
                  <span className="font-semibold text-gray-900">Balance Due</span>
                  <span className="font-bold text-red-600">{formatCurrency(pending)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          {payments.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-green-900">
                  Payment Details
                </h3>
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-bold">Payment Successful</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Amount Paid</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(paid)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Payment Mode</p>
                  <p className="text-gray-900 font-semibold">{payments[0].method.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Date</p>
                  <p className="text-gray-900">{formatDate(payments[0].paidAt)}</p>
                </div>
                {payments[0].transactionId && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Transaction ID</p>
                    <p className="font-mono text-sm text-gray-600">{payments[0].transactionId}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bank Details */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-yellow-900 mb-4">
              Bank Details (For Online Payments)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Bank Name</p>
                <p className="text-gray-900 font-semibold">{laboratoryInfo.bankDetails?.bankName || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Account Name</p>
                <p className="text-gray-900 font-semibold">{laboratoryInfo.bankDetails?.accountName || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Account No.</p>
                <p className="font-mono text-sm text-gray-600">{laboratoryInfo.bankDetails?.accountNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">IFSC Code</p>
                <p className="font-mono text-sm text-gray-600">{laboratoryInfo.bankDetails?.ifsc || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 uppercase font-semibold">WhatsApp (Send payment screenshot)</p>
                <p className="text-gray-900 font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {laboratoryInfo.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Terms & Notes */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-2">
              Terms & Notes
            </h3>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• Reports will be generated within 24-48 hours of sample collection</li>
              <li>• This is a computer-generated invoice and does not require physical signature</li>
              <li>• No refunds will be processed after sample collection</li>
              <li>• For any queries, please contact our support team</li>
              <li>• All prices are inclusive of applicable taxes</li>
              <li>• Please verify all details before payment</li>
            </ul>
          </div>

          {/* Verification and Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="space-y-2">
              <div className="border-b-2 border-gray-300 pb-2">
                <p className="text-sm font-bold text-gray-900">Verified By</p>
                <p className="text-xs text-gray-600">Dr. Priyanka Desai</p>
                <p className="text-xs text-gray-500">Pathologist</p>
              </div>
            </div>
            <div className="space-y-2 text-right">
              <div className="border-b-2 border-gray-300 pb-2">
                <p className="text-sm font-bold text-gray-900">Authorized Signatory</p>
                <p className="text-xs text-gray-600">Nikil Panchal</p>
                <p className="text-xs text-gray-500">Lab Director</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-4 text-xs font-bold text-blue-900">
              <span className="bg-blue-100 px-3 py-1 rounded-full">NABL Accredited</span>
              <span className="bg-blue-100 px-3 py-1 rounded-full">ISO Certified</span>
              <span className="bg-blue-100 px-3 py-1 rounded-full">HIPAA Compliant</span>
            </div>
            <p className="text-sm font-bold text-blue-900 uppercase tracking-widest">
              Your Health. Our Priority. Secure Accurate. Reliable
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>NEED HELP?</strong> Contact us at {laboratoryInfo.phone} | {laboratoryInfo.email}</p>
              <p>Working Hours: Mon-Sat 8AM-8PM, Sun 9AM-2PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}