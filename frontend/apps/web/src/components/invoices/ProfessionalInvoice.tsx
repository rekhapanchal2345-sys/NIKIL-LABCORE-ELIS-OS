"use client";

import React, { useRef } from "react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { Invoice } from "./InvoiceTable";

interface InvoiceItem {
  id: string | number;
  testName?: string;
  testCode?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  amount?: number;
}

interface ProfessionalInvoiceProps {
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
  };
  doctorInfo?: {
    name?: string;
    qualification?: string;
  };
  payments?: Array<{
    amount: number;
    method: string;
    transactionId?: string;
    paidAt: string;
  }>;
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

function statusClass(status?: string) {
  const value = status?.toLowerCase();
  if (value === "paid" || value === "completed") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (value === "overdue" || value === "cancelled" || value === "failed") {
    return "bg-red-50 text-red-700 border-red-200";
  }
  if (value === "partial" || value === "pending") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-gray-50 text-gray-700 border-gray-200";
}

export default function ProfessionalInvoice({
  invoice,
  items = [],
  taxAmount = 0,
  discountAmount = 0,
  notes,
  patientInfo,
  doctorInfo,
  payments = [],
}: ProfessionalInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const total = Number(invoice.totalAmount || 0);
  const paid = Number(invoice.paidAmount || 0);
  const pending = invoice.pendingAmount !== undefined 
    ? Number(invoice.pendingAmount) 
    : Math.max(0, total - paid);

  const handlePrint = () => {
    if (invoiceRef.current) {
      const printContent = invoiceRef.current.innerHTML;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
              @page {
                size: A4;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 20px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 12px;
                color: #1f2937;
                background: white;
              }
              .invoice-container {
                max-width: 210mm;
                margin: 0 auto;
                padding: 20px;
                background: white;
              }
              .header {
                border-bottom: 2px solid #6366f1;
                padding-bottom: 20px;
                margin-bottom: 20px;
              }
              .logo-section {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 15px;
              }
              .logo-icon {
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                font-weight: bold;
              }
              .company-name {
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
                letter-spacing: 0.5px;
              }
              .company-tagline {
                font-size: 11px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .invoice-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
              }
              .invoice-title {
                font-size: 28px;
                font-weight: 800;
                color: #6366f1;
                letter-spacing: 2px;
              }
              .invoice-meta {
                text-align: right;
              }
              .invoice-number {
                font-size: 18px;
                font-weight: 700;
                color: #1f2937;
              }
              .meta-item {
                font-size: 11px;
                color: #6b7280;
                margin-top: 4px;
              }
              .section {
                margin-bottom: 20px;
              }
              .section-title {
                font-size: 13px;
                font-weight: 700;
                color: #6366f1;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e5e7eb;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
              }
              .info-item {
                margin-bottom: 8px;
              }
              .info-label {
                font-size: 10px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 2px;
              }
              .info-value {
                font-size: 12px;
                font-weight: 600;
                color: #1f2937;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
              }
              th {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                padding: 10px 12px;
                text-align: left;
              }
              td {
                padding: 10px 12px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 12px;
              }
              .amount-cell {
                text-align: right;
                font-weight: 600;
              }
              .summary-section {
                background: #f9fafb;
                border-radius: 8px;
                padding: 15px;
                margin-top: 15px;
              }
              .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
                font-size: 12px;
              }
              .summary-row.total {
                border-top: 2px solid #6366f1;
                padding-top: 10px;
                margin-top: 5px;
                font-size: 14px;
                font-weight: 800;
              }
              .summary-row.balance {
                font-size: 14px;
                font-weight: 800;
                color: #dc2626;
              }
              .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                font-size: 10px;
                color: #6b7280;
              }
              .notes-section {
                background: #f9fafb;
                border-radius: 8px;
                padding: 12px;
                margin-top: 15px;
              }
              .payment-section {
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                border-radius: 8px;
                padding: 12px;
                margin-top: 15px;
              }
              .qr-section {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-top: 15px;
                padding: 15px;
                background: #f9fafb;
                border-radius: 8px;
              }
              .qr-code {
                width: 80px;
                height: 80px;
              }
              .verification-text {
                font-size: 10px;
                color: #6b7280;
              }
              @media print {
                body { margin: 0; }
                .invoice-container { box-shadow: none; }
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
      }
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header
      pdf.setFillColor(99, 102, 241);
      pdf.rect(0, 0, pageWidth, 40, "F");
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text("Healthcare facility", 15, 20);
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("Patient billing statement", 15, 28);
      
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("INVOICE", pageWidth - 15, 20, { align: "right" });
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(invoice.invoiceNumber || `INV-${invoice.id}`, pageWidth - 15, 28, { align: "right" });
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      let yPosition = 50;
      
      // Invoice Details
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("Invoice Details", 15, yPosition);
      yPosition += 8;
      
      pdf.setFont("helvetica", "normal");
      pdf.text(`Invoice Number: ${invoice.invoiceNumber || `INV-${invoice.id}`}`, 15, yPosition);
      yPosition += 5;
      pdf.text(`Invoice Date: ${formatDate(invoice.createdAt)}`, 15, yPosition);
      yPosition += 5;
      pdf.text(`Due Date: ${formatDate(invoice.dueDate)}`, 15, yPosition);
      yPosition += 5;
      pdf.text(`Order Number: ${invoice.orderNumber || `ORD-${invoice.orderId}`}`, 15, yPosition);
      yPosition += 5;
      
      // Status
      const status = invoice.paymentStatus || invoice.status || "Pending";
      pdf.setFillColor(245, 158, 11);
      pdf.roundedRect(pageWidth - 50, yPosition - 4, 35, 6, 1, 1, "F");
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text(status.toUpperCase(), pageWidth - 32, yPosition, { align: "center" });
      pdf.setTextColor(0, 0, 0);
      
      yPosition += 15;
      
      // Patient Information
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("Patient Information", 15, yPosition);
      yPosition += 8;
      
      pdf.setFont("helvetica", "normal");
      pdf.text(`Patient Name: ${invoice.patientName || "—"}`, 15, yPosition);
      yPosition += 5;
      pdf.text(`Patient ID: ${invoice.patientId || "—"}`, 15, yPosition);
      yPosition += 5;
      if (patientInfo?.age) {
        pdf.text(`Age: ${patientInfo.age}`, 15, yPosition);
        yPosition += 5;
      }
      if (patientInfo?.gender) {
        pdf.text(`Gender: ${patientInfo.gender}`, 15, yPosition);
        yPosition += 5;
      }
      
      yPosition += 10;
      
      // Doctor Information
      if (doctorInfo?.name) {
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text("Referring Doctor", 15, yPosition);
        yPosition += 8;
        
        pdf.setFont("helvetica", "normal");
        pdf.text(`Dr. ${doctorInfo.name}`, 15, yPosition);
        yPosition += 5;
        if (doctorInfo.qualification) {
          pdf.text(doctorInfo.qualification, 15, yPosition);
          yPosition += 5;
        }
        yPosition += 10;
      }
      
      // Line Items Table
      yPosition += 5;
      pdf.setFillColor(99, 102, 241);
      pdf.rect(15, yPosition, pageWidth - 30, 7, "F");
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text("Test/Service", 17, yPosition + 5);
      pdf.text("Qty", 80, yPosition + 5);
      pdf.text("Unit Price", 100, yPosition + 5);
      pdf.text("Discount", 130, yPosition + 5);
      pdf.text("Amount", pageWidth - 17, yPosition + 5, { align: "right" });
      
      pdf.setTextColor(0, 0, 0);
      yPosition += 7;
      
      items.forEach((item) => {
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFont("helvetica", "normal");
        pdf.text(item.testName || "Laboratory Service", 17, yPosition + 5);
        pdf.text(String(item.quantity || 1), 80, yPosition + 5);
        pdf.text(formatCurrency(item.unitPrice), 100, yPosition + 5);
        pdf.text(formatCurrency(item.discount), 130, yPosition + 5);
        pdf.setFont("helvetica", "bold");
        pdf.text(formatCurrency(item.amount), pageWidth - 17, yPosition + 5, { align: "right" });
        
        yPosition += 7;
      });
      
      yPosition += 10;
      
      // Summary
      const summaryX = pageWidth - 70;
      pdf.setDrawColor(229, 231, 235);
      pdf.line(summaryX - 5, yPosition, pageWidth - 15, yPosition);
      yPosition += 8;
      
      pdf.setFont("helvetica", "normal");
      pdf.text("Subtotal", summaryX, yPosition);
      pdf.setFont("helvetica", "bold");
      pdf.text(formatCurrency(total - Number(taxAmount) + Number(discountAmount)), pageWidth - 17, yPosition, { align: "right" });
      yPosition += 6;
      
      if (discountAmount > 0) {
        pdf.setFont("helvetica", "normal");
        pdf.text("Discount", summaryX, yPosition);
        pdf.setTextColor(220, 38, 38);
        pdf.text(`-${formatCurrency(discountAmount)}`, pageWidth - 17, yPosition, { align: "right" });
        pdf.setTextColor(0, 0, 0);
        yPosition += 6;
      }
      
      if (taxAmount > 0) {
        pdf.setFont("helvetica", "normal");
        pdf.text("Tax (GST)", summaryX, yPosition);
        pdf.setFont("helvetica", "bold");
        pdf.text(formatCurrency(taxAmount), pageWidth - 17, yPosition, { align: "right" });
        yPosition += 6;
      }
      
      pdf.setDrawColor(99, 102, 241);
      pdf.setLineWidth(0.5);
      pdf.line(summaryX - 5, yPosition, pageWidth - 15, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("Total", summaryX, yPosition);
      pdf.text(formatCurrency(total), pageWidth - 17, yPosition, { align: "right" });
      yPosition += 6;
      
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text("Paid", summaryX, yPosition);
      pdf.setTextColor(22, 163, 74);
      pdf.text(formatCurrency(paid), pageWidth - 17, yPosition, { align: "right" });
      pdf.setTextColor(0, 0, 0);
      yPosition += 6;
      
      pdf.setDrawColor(229, 231, 235);
      pdf.line(summaryX - 5, yPosition, pageWidth - 15, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(220, 38, 38);
      pdf.text("Balance Due", summaryX, yPosition);
      pdf.text(formatCurrency(pending), pageWidth - 17, yPosition, { align: "right" });
      pdf.setTextColor(0, 0, 0);
      
      // Payment Information
      if (payments.length > 0) {
        yPosition += 15;
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text("Payment History", 15, yPosition);
        yPosition += 8;
        
        payments.forEach((payment) => {
          pdf.setFont("helvetica", "normal");
          pdf.text(`${formatDate(payment.paidAt)} - ${payment.method}`, 15, yPosition);
          pdf.text(formatCurrency(payment.amount), pageWidth - 17, yPosition, { align: "right" });
          yPosition += 5;
        });
      }
      
      // Footer
      yPosition = pageHeight - 30;
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(107, 114, 128);
      pdf.text("This is a computer-generated invoice. No signature required.", pageWidth / 2, yPosition, { align: "center" });
      pdf.text("For queries, please contact the laboratory billing department.", pageWidth / 2, yPosition + 5, { align: "center" });
      pdf.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, yPosition + 10, { align: "center" });
      
      // Generate QR Code
      try {
        const qrData = `INV-${invoice.invoiceNumber || invoice.id}`;
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          width: 80,
          margin: 1,
        });
        
        pdf.addImage(qrCodeDataURL, "PNG", pageWidth - 30, pageHeight - 45, 20, 20);
        pdf.setFontSize(6);
        pdf.text("Scan to verify", pageWidth - 20, pageHeight - 23, { align: "center" });
      } catch (qrError) {
        console.error("QR Code generation failed:", qrError);
      }
      
      pdf.save(`Invoice-${invoice.invoiceNumber || invoice.id}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 no-print">
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Invoice
        </button>

        <button
          type="button"
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF
        </button>
      </div>

      {/* Professional Invoice Template */}
      <div 
        ref={invoiceRef} 
        className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-white text-2xl font-bold backdrop-blur-sm">
                LC
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">Healthcare facility</h1>
                <p className="text-indigo-100 text-sm uppercase tracking-widest">Patient billing statement</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white tracking-wider">INVOICE</p>
              <p className="text-indigo-100 text-sm mt-1">{invoice.invoiceNumber || `INV-${invoice.id}`}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Invoice Meta */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Invoice Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Invoice Number:</span>
                  <span className="font-semibold text-gray-900 text-sm">{invoice.invoiceNumber || `INV-${invoice.id}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Invoice Date:</span>
                  <span className="font-semibold text-gray-900 text-sm">{formatDate(invoice.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Due Date:</span>
                  <span className="font-semibold text-gray-900 text-sm">{formatDate(invoice.dueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Order Number:</span>
                  <span className="font-semibold text-gray-900 text-sm">{invoice.orderNumber || `ORD-${invoice.orderId}`}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Payment Status</h3>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border ${statusClass(invoice.paymentStatus || invoice.status)}`}>
                {invoice.paymentStatus || invoice.status || "Pending"}
              </span>
            </div>
          </div>

          {/* Patient Information */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">Patient Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Patient Name</p>
                <p className="font-semibold text-gray-900">{invoice.patientName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Patient ID</p>
                <p className="font-semibold text-gray-900">{invoice.patientId || "—"}</p>
              </div>
              {patientInfo?.age && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Age</p>
                  <p className="font-semibold text-gray-900">{patientInfo.age}</p>
                </div>
              )}
              {patientInfo?.gender && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Gender</p>
                  <p className="font-semibold text-gray-900">{patientInfo.gender}</p>
                </div>
              )}
              {patientInfo?.phone && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                  <p className="font-semibold text-gray-900">{patientInfo.phone}</p>
                </div>
              )}
              {patientInfo?.address && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Address</p>
                  <p className="font-semibold text-gray-900">{patientInfo.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Doctor Information */}
          {doctorInfo?.name && (
            <div className="mb-8">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">Referring Doctor</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Doctor Name</p>
                  <p className="font-semibold text-gray-900">Dr. {doctorInfo.name}</p>
                </div>
                {doctorInfo.qualification && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Qualification</p>
                    <p className="font-semibold text-gray-900">{doctorInfo.qualification}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Line Items */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">Services & Tests</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider">Test/Service</th>
                    <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider">Qty</th>
                    <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider">Unit Price</th>
                    <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider">Discount</th>
                    <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">
                        No items found
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900 text-sm">{item.testName || "Laboratory Service"}</p>
                          {item.testCode && (
                            <p className="text-xs text-gray-400 font-mono">{item.testCode}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-700">{item.quantity || 1}</td>
                        <td className="py-3 px-4 text-right text-sm text-gray-700">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 px-4 text-right text-sm text-gray-700">{formatCurrency(item.discount)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 text-sm">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-8">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="space-y-3 max-w-xs ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(total - Number(taxAmount) + Number(discountAmount))}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (GST)</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t-2 border-indigo-600">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900 text-lg">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid</span>
                  <span className="font-semibold text-green-600">{formatCurrency(paid)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-300">
                  <span className="font-bold text-gray-900">Balance Due</span>
                  <span className="font-bold text-red-600 text-lg">{formatCurrency(pending)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">Payment History</h3>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                {payments.map((payment, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-semibold text-gray-900">{formatDate(payment.paidAt)}</span>
                      <span className="text-gray-600 mx-2">•</span>
                      <span className="text-gray-700">{payment.method}</span>
                      {payment.transactionId && (
                        <span className="text-gray-500 text-xs ml-2">({payment.transactionId})</span>
                      )}
                    </div>
                    <span className="font-semibold text-green-700">{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {notes && (
            <div className="mb-8">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">Notes</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{notes}</p>
              </div>
            </div>
          )}

          {/* QR Code Verification */}
          <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
            <div ref={qrCodeRef} className="w-20 h-20 bg-white rounded-lg flex items-center justify-center">
              <div className="text-xs text-gray-400 text-center">QR Code</div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-sm">Invoice Verification</h4>
              <p className="text-xs text-gray-500 mt-1">Scan this QR code to verify invoice authenticity</p>
              <p className="text-xs text-gray-400 mt-1 font-mono">{invoice.invoiceNumber || `INV-${invoice.id}`}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <div className="text-center space-y-1">
            <p className="text-xs text-gray-500">This is a computer-generated invoice. No signature required.</p>
            <p className="text-xs text-gray-500">For queries, please contact the laboratory billing department.</p>
            <p className="text-xs text-gray-400">Generated on {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
