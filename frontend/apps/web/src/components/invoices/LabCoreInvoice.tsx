"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { Printer, Download, X, Loader2, Sparkles } from "lucide-react";

interface InvoiceItem {
  id: string | number;
  testName?: string;
  method?: string;
  result?: string;
  unit?: string;
  referenceRange?: string;
  status?: string;
  amount?: number;
}

interface LabCoreInvoiceProps {
  invoice: {
    id: string;
    invoiceNumber?: string;
    patientId?: string;
    patientName?: string;
    totalAmount?: number;
    paidAmount?: number;
    pendingAmount?: number;
    paymentStatus?: string;
    createdAt?: string;
    invoiceDate?: string;
    invoiceTime?: string;
    paymentMode?: string;
    transactionId?: string;
  };
  items?: InvoiceItem[];
  patientInfo?: {
    age?: string;
    gender?: string;
    phone?: string;
    address?: string;
    email?: string;
  };
  collectionInfo?: {
    collectedBy?: string;
    collectedByCode?: string;
    collectionDate?: string;
    collectionTime?: string;
    sampleType?: string;
    refDoctor?: string;
    doctorQualification?: string;
    labBranch?: string;
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
    email?: string;
    website?: string;
  };
  onClose?: () => void;
}

function formatCurrency(amount?: number) {
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

function formatTime(date?: string): string {
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

export default function LabCoreInvoice({
  invoice,
  items = [],
  patientInfo,
  collectionInfo,
  payments = [],
  labInfo,
  onClose,
}: LabCoreInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const laboratoryInfo = useMemo(() => labInfo || {
    name: "LabCore Diagnostics Pvt. Ltd.",
    address: "123 Health Avenue, Medical District, Ahmedabad, Gujarat - 380016, India",
    phone: "+91 98765 43210",
    email: "info@labcore.in",
    website: "www.labcore.in"
  }, [labInfo]);

  const total = Number(invoice.totalAmount || 0);
  const paid = Number(invoice.paidAmount || 0);
  const discount = 0;
  const subtotal = total;
  const cgst = total * 0.025;
  const sgst = total * 0.025;
  const igst = 0;
  const totalTax = cgst + sgst + igst;
  const grandTotal = total;

  const generateQRCode = useCallback(async () => {
    if (qrCodeRef.current && invoice.invoiceNumber) {
      try {
        const verifyCode = invoice.invoiceNumber.replace(/[^0-9]/g, '').slice(-7);
        const qrData = `https://www.labcore.in/verify?code=${verifyCode}`;
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
  }, [invoice.invoiceNumber]);

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
            <title>LabCore Invoice ${invoice.invoiceNumber}</title>
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
                background: #1e3a8a;
                padding: 20px;
                margin-bottom: 20px;
              }
              .company-details h1 {
                font-size: 20px;
                font-weight: 800;
                color: #ffffff;
                margin: 0 0 5px 0;
              }
              .company-details .contact-info {
                font-size: 9px;
                color: #e0e0e0;
                line-height: 1.4;
              }
              .invoice-header {
                background: #1e3a8a;
                padding: 15px;
                margin-bottom: 20px;
              }
              .invoice-title {
                font-size: 24px;
                font-weight: 800;
                color: #ffffff;
                text-transform: uppercase;
              }
              .invoice-meta {
                color: #ffffff;
                font-size: 10px;
                margin-top: 10px;
              }
              .section {
                margin-bottom: 20px;
              }
              .section-title {
                font-size: 11px;
                font-weight: 800;
                color: #1a1a2e;
                text-transform: uppercase;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 2px solid #1e3a8a;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
              }
              .info-item {
                padding: 10px;
                background: #f8f9fa;
                border-radius: 5px;
                border-left: 3px solid #1e3a8a;
              }
              .info-label {
                font-size: 8px;
                color: #6c757d;
                text-transform: uppercase;
                margin-bottom: 3px;
                font-weight: 700;
              }
              .info-value {
                font-size: 10px;
                font-weight: 700;
                color: #1a1a2e;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
              }
              th {
                background: #1e3a8a;
                color: #ffffff;
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                padding: 10px 8px;
                text-align: left;
              }
              td {
                padding: 8px;
                border-bottom: 1px solid #e9ecef;
                font-size: 9px;
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
                background: #f8f9fa;
                border-radius: 10px;
                padding: 15px;
                margin-top: 15px;
              }
              .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
                font-size: 10px;
                color: #1a1a2e;
              }
              .summary-row.total {
                border-top: 2px solid #1e3a8a;
                border-bottom: 2px solid #1e3a8a;
                padding: 10px 0;
                margin-top: 5px;
                font-size: 12px;
                font-weight: 800;
                color: #1e3a8a;
              }
              .total-section {
                background: #1e3a8a;
                border-radius: 10px;
                padding: 20px;
                margin-top: 15px;
                text-align: center;
              }
              .total-amount {
                font-size: 28px;
                font-weight: 800;
                color: #ffffff;
              }
              .total-words {
                font-size: 10px;
                color: #e0e0e0;
                margin-top: 5px;
              }
              .payment-section {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 15px;
                margin-top: 15px;
              }
              .qr-section {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-top: 15px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 10px;
                border: 2px solid #1a1a2e;
              }
              .qr-code {
                width: 80px;
                height: 80px;
                border: 2px solid #1a1a2e;
                border-radius: 5px;
                background: white;
              }
              .verification-text {
                flex: 1;
              }
              .verify-code {
                background: #1e3a8a;
                color: white;
                padding: 5px 15px;
                border-radius: 5px;
                font-weight: 700;
                display: inline-block;
                margin-top: 10px;
              }
              @media print {
                body { margin: 0; }
                .invoice-container { box-shadow: none; border: none; }
              }
            </style>
          </head>
          <body>
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
      
      // Header with dark blue
      pdf.setFillColor(30, 58, 138);
      pdf.rect(0, 0, pageWidth, 40, "F");
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text(laboratoryInfo.name || "LabCore Diagnostics Pvt. Ltd.", 15, 15);
      
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(laboratoryInfo.address || "123 Health Avenue, Medical District, Ahmedabad, Gujarat - 380016, India", 15, 22);
      pdf.text(`Phone: ${laboratoryInfo.phone || "+91 98765 43210"} | Email: ${laboratoryInfo.email || "info@labcore.in"}`, 15, 27);
      pdf.text(`Website: ${laboratoryInfo.website || "www.labcore.in"}`, 15, 32);
      
      // Invoice section
      pdf.setFillColor(30, 58, 138);
      pdf.rect(0, 40, pageWidth, 25, "F");
      
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.text("INVOICE", 15, 52);
      
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Invoice No: ${invoice.invoiceNumber || `INV-${invoice.id}`}`, 15, 58);
      pdf.text(`Invoice Date: ${formatDate(invoice.createdAt || new Date().toISOString())}`, 15, 63);
      
      pdf.text(`Payment Mode: ${invoice.paymentMode || 'CASH'}`, pageWidth - 15, 52, { align: "right" });
      pdf.text(`Transaction ID: ${invoice.transactionId || '—'}`, pageWidth - 15, 58, { align: "right" });
      
      pdf.setTextColor(0, 0, 0);
      
      let yPosition = 70;
      
      // Info grid
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 58, 138);
      pdf.text("PATIENT INFORMATION", 15, yPosition);
      yPosition += 8;
      
      pdf.setDrawColor(30, 58, 138);
      pdf.setLineWidth(0.5);
      pdf.line(15, yPosition, 60, yPosition);
      yPosition += 5;
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Patient Name: ${invoice.patientName || "—"}`, 15, yPosition);
      yPosition += 4;
      pdf.text(`Patient ID: ${invoice.patientId || "—"}`, 15, yPosition);
      yPosition += 4;
      if (patientInfo?.age) {
        pdf.text(`Age/Gender: ${patientInfo.age} / ${patientInfo.gender || "—"}`, 15, yPosition);
        yPosition += 4;
      }
      if (patientInfo?.phone) {
        pdf.text(`Phone: ${patientInfo.phone}`, 15, yPosition);
        yPosition += 4;
      }
      if (patientInfo?.address) {
        pdf.text(`Address: ${patientInfo.address}`, 15, yPosition);
        yPosition += 4;
      }
      
      // Collection info
      yPosition = 70;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 58, 138);
      pdf.text("COLLECTION INFORMATION", 70, yPosition);
      yPosition += 8;
      
      pdf.setDrawColor(30, 58, 138);
      pdf.line(70, yPosition, 125, yPosition);
      yPosition += 5;
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      if (collectionInfo?.collectedBy) {
        pdf.text(`Collected By: ${collectionInfo.collectedBy} (${collectionInfo.collectedByCode || "—"})`, 70, yPosition);
        yPosition += 4;
      }
      if (collectionInfo?.collectionDate) {
        pdf.text(`Collection Date: ${collectionInfo.collectionDate}`, 70, yPosition);
        yPosition += 4;
      }
      if (collectionInfo?.collectionTime) {
        pdf.text(`Collection Time: ${collectionInfo.collectionTime}`, 70, yPosition);
        yPosition += 4;
      }
      if (collectionInfo?.sampleType) {
        pdf.text(`Sample Type: ${collectionInfo.sampleType}`, 70, yPosition);
        yPosition += 4;
      }
      if (collectionInfo?.refDoctor) {
        pdf.text(`Ref. Doctor: ${collectionInfo.refDoctor} (${collectionInfo.doctorQualification || ""})`, 70, yPosition);
        yPosition += 4;
      }
      if (collectionInfo?.labBranch) {
        pdf.text(`Lab Branch: ${collectionInfo.labBranch}`, 70, yPosition);
        yPosition += 4;
      }
      
      // Verify report
      yPosition = 70;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 58, 138);
      pdf.text("VERIFY REPORT", 130, yPosition);
      yPosition += 8;
      
      pdf.setDrawColor(30, 58, 138);
      pdf.line(130, yPosition, pageWidth - 15, yPosition);
      yPosition += 5;
      
      try {
        const verifyCode = invoice.invoiceNumber?.replace(/[^0-9]/g, '').slice(-7) || "LC000000";
        const qrData = `https://www.labcore.in/verify?code=${verifyCode}`;
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          width: 80,
          margin: 1,
          color: {
            dark: '#1a1a2e',
            light: '#ffffff'
          }
        });
        
        pdf.addImage(qrCodeDataURL, "PNG", 140, yPosition, 25, 25);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 0, 0);
        pdf.text("Scan QR Code or visit", 130, yPosition + 30);
        pdf.text("www.labcore.in/verify", 130, yPosition + 35);
        
        pdf.setFillColor(30, 58, 138);
        pdf.roundedRect(130, yPosition + 38, 60, 8, 2, 2, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.text(`Enter Code: ${verifyCode}`, 135, yPosition + 44);
      } catch (qrError) {
        console.error("QR Code generation failed:", qrError);
      }
      
      yPosition = 110;
      
      // Test Results Table
      pdf.setFillColor(30, 58, 138);
      pdf.rect(15, yPosition, pageWidth - 30, 10, "F");
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text("#", 17, yPosition + 7);
      pdf.text("TEST NAME", 25, yPosition + 7);
      pdf.text("METHOD", 80, yPosition + 7);
      pdf.text("RESULT", 110, yPosition + 7);
      pdf.text("UNIT", 130, yPosition + 7);
      pdf.text("REFERENCE RANGE", 145, yPosition + 7);
      pdf.text("STATUS", 175, yPosition + 7);
      pdf.text("AMOUNT", pageWidth - 17, yPosition + 7, { align: "right" });
      
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
        pdf.text(item.testName || "Laboratory Test", 25, yPosition + 5);
        pdf.text(item.method || "—", 80, yPosition + 5);
        pdf.text(item.result || "—", 110, yPosition + 5);
        pdf.text(item.unit || "—", 130, yPosition + 5);
        pdf.text(item.referenceRange || "—", 145, yPosition + 5);
        pdf.text(item.status || "NORMAL", 175, yPosition + 5);
        pdf.setFont("helvetica", "bold");
        pdf.text(formatCurrency(item.amount || 0), pageWidth - 17, yPosition + 5, { align: "right" });
        
        yPosition += 8;
      });
      
      yPosition += 15;
      
      // Summary and Total sections
      pdf.setFillColor(30, 58, 138);
      pdf.roundedRect(15, yPosition, 80, 70, 3, 3, "F");
      
      pdf.setDrawColor(30, 58, 138);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(15, yPosition, 80, 70, 3, 3, "S");
      
      yPosition += 8;
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("AMOUNT SUMMARY", 20, yPosition);
      yPosition += 8;
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(`Total Amount (Before Discount): ${formatCurrency(subtotal)}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Discount (0.00%): ${formatCurrency(discount)}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Taxable Amount: ${formatCurrency(subtotal - discount)}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`CGST (2.5%): ${formatCurrency(cgst)}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`SGST (2.5%): ${formatCurrency(sgst)}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`IGST (0.0%): ${formatCurrency(igst)}`, 20, yPosition);
      yPosition += 5;
      
      pdf.setFillColor(255, 235, 59);
      pdf.rect(20, yPosition, 70, 8, "F");
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Total Tax: ${formatCurrency(totalTax)}`, 25, yPosition + 6);
      
      // Total Payable
      const totalY = yPosition + 15;
      pdf.setFillColor(30, 58, 138);
      pdf.roundedRect(pageWidth - 60, totalY, 45, 35, 3, 3, "F");
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("TOTAL PAYABLE", pageWidth - 55, totalY + 8);
      
      pdf.setFontSize(18);
      pdf.text(formatCurrency(grandTotal), pageWidth - 55, totalY + 20);
      
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      const amountWords = numberToWords(Math.round(grandTotal)) + " Only";
      pdf.text(`(${amountWords})`, pageWidth - 55, totalY + 28);
      
      // Payment Details
      yPosition += 80;
      pdf.setFillColor(248, 249, 250);
      pdf.roundedRect(15, yPosition, 80, 40, 3, 3, "F");
      
      pdf.setDrawColor(30, 58, 138);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(15, yPosition, 80, 40, 3, 3, "S");
      
      yPosition += 8;
      
      pdf.setTextColor(30, 58, 138);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("PAYMENT DETAILS", 20, yPosition);
      yPosition += 8;
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(`Amount Paid: ${formatCurrency(paid)}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Payment Mode: ${invoice.paymentMode || 'CASH'}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Payment Date: ${formatDate(invoice.createdAt || new Date().toISOString())} ${formatTime(invoice.createdAt || new Date().toISOString())}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Transaction ID: ${invoice.transactionId || '—'}`, 20, yPosition);
      
      pdf.save(`LabCoreInvoice-${invoice.invoiceNumber || invoice.id}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <Sparkles className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-700">Preparing LabCore invoice...</p>
        </div>
      </div>
    );
  }

  const verifyCode = invoice.invoiceNumber?.replace(/[^0-9]/g, '').slice(-7) || "LC000000";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-900 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
              <Sparkles className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">LabCore Invoice</h3>
              <p className="text-sm text-blue-200">
                Invoice: <span className="font-semibold">{invoice.invoiceNumber || `INV-${invoice.id}`}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose?.()}
            className="rounded-lg p-2 text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-100">
          <div 
            ref={invoiceRef} 
            className="bg-white rounded-xl shadow-2xl border border-blue-200 overflow-hidden"
          >
            {/* Company Header */}
            <div className="bg-blue-900 px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-800 rounded-xl flex items-center justify-center text-white text-2xl font-bold border-2 border-blue-600">
                    🔬
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-wide">LabCore ENTERPRISE LIS</h1>
                    <p className="text-blue-200 text-xs mt-1">{laboratoryInfo.name}</p>
                    <div className="mt-2 text-xs text-blue-200 space-y-1">
                      <p>{laboratoryInfo.address}</p>
                      <p>Phone: {laboratoryInfo.phone} | Email: {laboratoryInfo.email}</p>
                      <p>Website: {laboratoryInfo.website}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Section */}
            <div className="bg-blue-900 px-6 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold text-white">INVOICE</p>
                  <div className="mt-3 text-xs text-blue-200 space-y-1">
                    <p>Invoice No: {invoice.invoiceNumber || `INV-${invoice.id}`}</p>
                    <p>Invoice Date: {formatDate(invoice.createdAt)}</p>
                    <p>Invoice Time: {formatTime(invoice.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-blue-200 space-y-1">
                  <p>Payment Mode: {invoice.paymentMode || 'CASH'}</p>
                  <p>Transaction ID: {invoice.transactionId || '—'}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Three Column Info */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* Patient Information */}
                <div>
                  <h3 className="text-xs font-bold text-blue-900 uppercase mb-3 pb-2 border-b-2 border-blue-900">PATIENT INFORMATION</h3>
                  <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-900 space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Patient Name</p>
                      <p className="text-sm font-bold text-gray-900">{invoice.patientName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Patient ID</p>
                      <p className="text-sm font-bold text-gray-900">{invoice.patientId || "—"}</p>
                    </div>
                    {patientInfo?.age && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Age/Gender</p>
                        <p className="text-sm font-bold text-gray-900">{patientInfo.age} Years / {patientInfo.gender || "—"}</p>
                      </div>
                    )}
                    {patientInfo?.phone && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Phone</p>
                        <p className="text-sm font-bold text-gray-900">{patientInfo.phone}</p>
                      </div>
                    )}
                    {patientInfo?.address && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Address</p>
                        <p className="text-sm font-bold text-gray-900">{patientInfo.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Collection Information */}
                <div>
                  <h3 className="text-xs font-bold text-blue-900 uppercase mb-3 pb-2 border-b-2 border-blue-900">COLLECTION INFORMATION</h3>
                  <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-900 space-y-2">
                    {collectionInfo?.collectedBy && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Collected By</p>
                        <p className="text-sm font-bold text-gray-900">{collectionInfo.collectedBy} ({collectionInfo.collectedByCode || "—"})</p>
                      </div>
                    )}
                    {collectionInfo?.collectionDate && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Collection Date</p>
                        <p className="text-sm font-bold text-gray-900">{collectionInfo.collectionDate}</p>
                      </div>
                    )}
                    {collectionInfo?.collectionTime && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Collection Time</p>
                        <p className="text-sm font-bold text-gray-900">{collectionInfo.collectionTime}</p>
                      </div>
                    )}
                    {collectionInfo?.sampleType && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Sample Type</p>
                        <p className="text-sm font-bold text-gray-900">{collectionInfo.sampleType}</p>
                      </div>
                    )}
                    {collectionInfo?.refDoctor && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Ref. Doctor</p>
                        <p className="text-sm font-bold text-gray-900">{collectionInfo.refDoctor} ({collectionInfo.doctorQualification || ""})</p>
                      </div>
                    )}
                    {collectionInfo?.labBranch && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Lab Branch</p>
                        <p className="text-sm font-bold text-gray-900">{collectionInfo.labBranch}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verify Report */}
                <div>
                  <h3 className="text-xs font-bold text-blue-900 uppercase mb-3 pb-2 border-b-2 border-blue-900">VERIFY REPORT</h3>
                  <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-900">
                    <div ref={qrCodeRef} className="w-20 h-20 bg-white rounded-lg flex items-center justify-center border-2 border-blue-900 mx-auto mb-3">
                      {generatingQR ? (
                        <div className="text-xs text-gray-400 text-center">Generating QR...</div>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-600 text-center mb-2">Scan QR Code or visit www.labcore.in/verify</p>
                    <div className="bg-blue-900 text-white text-center py-2 px-3 rounded-lg text-xs font-bold">
                      Enter Code: {verifyCode}
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Results Table */}
              <div className="mb-6">
                <div className="overflow-x-auto rounded-lg shadow-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-900 text-white">
                        <th className="text-left py-3 px-3 text-xs font-bold uppercase">#</th>
                        <th className="text-left py-3 px-3 text-xs font-bold uppercase">Test Name</th>
                        <th className="text-left py-3 px-3 text-xs font-bold uppercase">Method</th>
                        <th className="text-left py-3 px-3 text-xs font-bold uppercase">Result</th>
                        <th className="text-left py-3 px-3 text-xs font-bold uppercase">Unit</th>
                        <th className="text-left py-3 px-3 text-xs font-bold uppercase">Reference Range</th>
                        <th className="text-left py-3 px-3 text-xs font-bold uppercase">Status</th>
                        <th className="text-right py-3 px-3 text-xs font-bold uppercase">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-gray-500 text-sm">
                            No tests found
                          </td>
                        </tr>
                      ) : (
                        items.map((item, index) => (
                          <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="py-3 px-3 text-sm font-bold text-gray-900">{index + 1}</td>
                            <td className="py-3 px-3 font-bold text-gray-900 text-sm">{item.testName || "Laboratory Test"}</td>
                            <td className="py-3 px-3 text-sm text-gray-700">{item.method || "—"}</td>
                            <td className="py-3 px-3 text-sm text-gray-700">{item.result || "—"}</td>
                            <td className="py-3 px-3 text-sm text-gray-700">{item.unit || "—"}</td>
                            <td className="py-3 px-3 text-sm text-gray-700">{item.referenceRange || "—"}</td>
                            <td className="py-3 px-3 text-sm font-bold text-green-600">{item.status || "NORMAL"}</td>
                            <td className="py-3 px-3 text-right font-bold text-gray-900 text-sm">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Amount Summary and Total */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Amount Summary */}
                <div>
                  <h3 className="text-xs font-bold text-blue-900 uppercase mb-3 pb-2 border-b-2 border-blue-900">AMOUNT SUMMARY</h3>
                  <div className="bg-blue-900 rounded-lg p-4 text-white space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Amount (Before Discount):</span>
                      <span className="font-bold">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Discount (0.00%):</span>
                      <span className="font-bold">{formatCurrency(discount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Taxable Amount:</span>
                      <span className="font-bold">{formatCurrency(subtotal - discount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>CGST (2.5%):</span>
                      <span className="font-bold">{formatCurrency(cgst)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>SGST (2.5%):</span>
                      <span className="font-bold">{formatCurrency(sgst)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>IGST (0.0%):</span>
                      <span className="font-bold">{formatCurrency(igst)}</span>
                    </div>
                    <div className="bg-yellow-400 text-black rounded px-3 py-2 flex justify-between text-sm font-bold mt-2">
                      <span>Total Tax:</span>
                      <span>{formatCurrency(totalTax)}</span>
                    </div>
                  </div>
                </div>

                {/* Total Payable */}
                <div>
                  <h3 className="text-xs font-bold text-blue-900 uppercase mb-3 pb-2 border-b-2 border-blue-900">TOTAL PAYABLE AMOUNT</h3>
                  <div className="bg-blue-900 rounded-lg p-6 text-center text-white">
                    <p className="text-4xl font-bold">{formatCurrency(grandTotal)}</p>
                    <p className="text-xs mt-2">({numberToWords(Math.round(grandTotal))} Only)</p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="text-xs font-bold text-blue-900 uppercase mb-3 pb-2 border-b-2 border-blue-900">PAYMENT DETAILS</h3>
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-900 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount Paid:</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(paid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment Mode:</span>
                    <span className="text-sm font-bold text-gray-900">{invoice.paymentMode || 'CASH'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment Date:</span>
                    <span className="text-sm font-bold text-gray-900">{formatDate(invoice.createdAt)}, {formatTime(invoice.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Transaction ID:</span>
                    <span className="text-sm font-bold text-gray-900">{invoice.transactionId || '—'}</span>
                  </div>
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
              className="flex items-center gap-2 rounded-lg border-2 border-blue-600 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-blue-100"
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              className="flex items-center gap-2 rounded-lg border-2 border-blue-600 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-blue-100 disabled:opacity-50"
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
              onClick={() => onClose?.()}
              className="rounded-lg border-2 border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}