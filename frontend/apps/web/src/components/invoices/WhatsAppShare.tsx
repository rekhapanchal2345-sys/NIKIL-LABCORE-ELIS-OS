"use client";

import React, { useState, useRef } from "react";
import { MessageCircle, CheckCircle, AlertCircle, Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import QRCode from "qrcode";

interface WhatsAppShareProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string | number;
    invoiceNumber?: string;
    patientName?: string;
    patientPhone?: string;
    patientEmail?: string;
    netPayable?: number;
    totalAmount?: number;
    dueDate?: string;
    createdAt?: string;
  } | null;
  labInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  onGeneratePDF?: () => Promise<Blob>;
}

export default function WhatsAppShare({
  isOpen,
  onClose,
  invoice,
  labInfo,
  onGeneratePDF,
}: WhatsAppShareProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const laboratoryInfo = {
    name: labInfo?.name || "Healthcare facility",
    phone: labInfo?.phone || "",
    email: labInfo?.email || ""
  };

  const formatCurrency = (amount?: number) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const generatePDF = async () => {
    try {
      setLoading(true);
      setError(null);

      let pdfBlob: Blob;

      if (onGeneratePDF) {
        try {
          pdfBlob = await onGeneratePDF();
        } catch (customPdfError) {
          console.error("Custom PDF generation failed, falling back to default:", customPdfError);
          pdfBlob = await generateDefaultPDF();
        }
      } else {
        pdfBlob = await generateDefaultPDF();
      }

      const pdfUrl = URL.createObjectURL(pdfBlob);
      setGeneratedPdfUrl(pdfUrl);
      setPdfGenerated(true);
      return pdfBlob;
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("Failed to generate PDF. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultPDF = async (): Promise<Blob> => {
    // Fallback: Generate a simple PDF
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text(laboratoryInfo.name, 15, 20);
    
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Invoice: ${invoice?.invoiceNumber || `INV-${invoice?.id}`}`, 15, 30);
    pdf.text(`Date: ${formatDate(invoice?.createdAt)}`, 15, 35);
    pdf.text(`Patient: ${invoice?.patientName || "—"}`, 15, 40);
    pdf.text(`Amount: ${formatCurrency(invoice?.netPayable)}`, 15, 45);
    
    pdf.setFontSize(8);
    pdf.text("Generated from the invoice register", 15, 60);
    
    return pdf.output("blob");
  };

  const sendViaWhatsApp = async () => {
    if (!invoice?.patientPhone) {
      setError("Patient phone number is not available. Please update patient information.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Validate phone number
      const cleanPhone = invoice.patientPhone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setError("Invalid phone number. Please update patient information with a valid 10-digit number.");
        return;
      }

      // Generate PDF if not already generated
      if (!pdfGenerated) {
        await generatePDF();
      }

      // Ensure phone number has country code (default to India +91)
      const phoneNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : 
                         (cleanPhone.startsWith('91') && cleanPhone.length === 12) ? cleanPhone : 
                         cleanPhone;

      // Create professional message with better formatting
      const message = encodeURIComponent(
        `🧾 *INVOICE NOTIFICATION*\n\n` +
        `Dear ${invoice.patientName},\n\n` +
        `Your invoice ${invoice.invoiceNumber || `INV-${invoice.id}`} for ${formatCurrency(invoice.netPayable)} is ready.\n\n` +
        `📋 *Invoice Details:*\n` +
        `• Invoice No: ${invoice.invoiceNumber || `INV-${invoice.id}`}\n` +
        `• Date: ${formatDate(invoice.createdAt)}\n` +
        `• Amount: ${formatCurrency(invoice.netPayable)}\n` +
        `• Due Date: ${formatDate(invoice.dueDate)}\n\n` +
        `📎 *Please find the invoice PDF attached.*\n\n` +
        `Thank you for choosing ${laboratoryInfo.name}.\n\n` +
        `📞 For queries: ${laboratoryInfo.phone}\n` +
        `📧 Email: ${laboratoryInfo.email}`
      );

      // Try multiple WhatsApp URL patterns for better compatibility
      const whatsappUrls = [
        `https://wa.me/${phoneNumber}?text=${message}`,
        `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${message}`,
        `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${message}`
      ];

      // Try to open WhatsApp, fall back to next URL if current one fails
      let whatsappOpened = false;
      for (const url of whatsappUrls) {
        try {
          const newWindow = window.open(url, '_blank');
          if (newWindow) {
            whatsappOpened = true;
            break;
          }
        } catch (e) {
          console.warn(`Failed to open ${url}, trying next option...`);
          continue;
        }
      }

      if (!whatsappOpened) {
        throw new Error("Unable to open WhatsApp. Please check your browser settings or try manually.");
      }

      setSuccess(true);
      
      // Auto-close after showing success
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      console.error("WhatsApp share failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to open WhatsApp. Please try again.";
      setError(errorMessage);
      
      // Provide fallback instructions
      if (errorMessage.includes("Unable to open")) {
        setError(errorMessage + " You can manually share by downloading the PDF and sending it via WhatsApp.");
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (generatedPdfUrl) {
      const link = document.createElement('a');
      link.href = generatedPdfUrl;
      link.download = `Invoice-${invoice?.invoiceNumber || invoice?.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!isOpen || !invoice) return null;

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Opened!</h2>
          <p className="text-gray-600 mb-4">
            Please attach the downloaded PDF and send the message.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl my-8">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Send via WhatsApp</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Invoice: <span className="font-semibold">{invoice.invoiceNumber}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Invoice Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Invoice Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice Number:</span>
                <span className="font-medium text-gray-900">{invoice.invoiceNumber || `INV-${invoice.id}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Patient:</span>
                <span className="font-medium text-gray-900">{invoice.patientName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(invoice.netPayable)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</span>
              </div>
            </div>
          </div>

          {/* Recipient Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Recipient</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Patient Name:</span>
                <span className="font-medium text-gray-900">{invoice.patientName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className={`font-medium ${invoice.patientPhone ? 'text-gray-900' : 'text-red-600'}`}>
                  {invoice.patientPhone || "Not available"}
                </span>
              </div>
              {invoice.patientEmail && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{invoice.patientEmail}</span>
                </div>
              )}
            </div>
            {!invoice.patientPhone && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700 font-medium">⚠️ Patient phone number is required</p>
                <p className="text-xs text-red-600 mt-1">Please update patient information with a valid phone number to use WhatsApp sharing.</p>
              </div>
            )}
          </div>

          {/* Message Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Message Preview</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
              Dear {invoice.patientName},

Your invoice {invoice.invoiceNumber || `INV-${invoice.id}`} for {formatCurrency(invoice.netPayable)} is attached.

Invoice Details:
• Invoice No: {invoice.invoiceNumber || `INV-${invoice.id}`}
• Date: {formatDate(invoice.createdAt)}
• Amount: {formatCurrency(invoice.netPayable)}
• Due Date: {formatDate(invoice.dueDate)}

Thank you for choosing {laboratoryInfo.name}.

For queries, contact us at {laboratoryInfo.phone} or {laboratoryInfo.email}.
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Instructions</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>1. The invoice PDF will be generated automatically</li>
              <li>2. WhatsApp will open with a pre-formatted professional message</li>
              <li>3. Download and attach the PDF to the WhatsApp message</li>
              <li>4. Send the message to the patient</li>
              <li>5. If WhatsApp doesn't open, try downloading the PDF and sharing manually</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={sendViaWhatsApp}
              disabled={loading || !invoice.patientPhone}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </span>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  Open WhatsApp & Send
                </>
              )}
            </button>

            {pdfGenerated && (
              <button
                onClick={downloadPDF}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF Only
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
