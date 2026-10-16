"use client";

import React, { useState, useMemo } from "react";
import { Mail, CheckCircle, AlertCircle, Send, Loader2, Paperclip } from "lucide-react";

interface EmailShareProps {
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
  doctorInfo?: {
    name?: string;
    email?: string;
  };
  labInfo?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    bankDetails?: {
      bankName?: string;
    };
    upiId?: string;
    website?: string;
  };
  onGeneratePDF?: () => Promise<Blob>;
}

export default function EmailShare({
  isOpen,
  onClose,
  invoice,
  doctorInfo,
  labInfo,
  onGeneratePDF,
}: EmailShareProps) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const laboratoryInfo = useMemo(() => labInfo || {
    name: "LABCORE ELIS",
    address: "123 Healthcare Avenue, Medical District",
    phone: "+91-9876543210",
    email: "billing@labcore.com"
  }, [labInfo]);

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
      month: "long",
      year: "numeric",
    });
  };

  React.useEffect(() => {
    if (isOpen && invoice) {
      // Pre-fill form with invoice data
      setTo(invoice.patientEmail || "");
      setCc(doctorInfo?.email || "");
      setSubject(`Invoice ${invoice.invoiceNumber || `INV-${invoice.id}`} from ${laboratoryInfo.name}`);
      
      // Enhanced professional email template with HTML formatting
      const emailBody = `Dear Valued Customer,\n\n` +
        `Hope this email finds you well. We are pleased to send you the invoice for your recent laboratory services at ${laboratoryInfo.name}.\n\n` +
        `📋 **INVOICE SUMMARY**\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `• Invoice Number: ${invoice.invoiceNumber || `INV-${invoice.id}`}\n` +
        `• Invoice Date: ${formatDate(invoice.createdAt)}\n` +
        `• Due Date: ${formatDate(invoice.dueDate)}\n` +
        `• Total Amount: ${formatCurrency(invoice.netPayable)}\n` +
        `• Patient Name: ${invoice.patientName || "—"}\n\n` +
        `📎 **DOCUMENTS ATTACHED**\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `• Detailed Tax Invoice (PDF)\n\n` +
        `💳 **PAYMENT INFORMATION**\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Bank: ${laboratoryInfo.bankDetails?.bankName || "Contact us for details"}\n` +
        `${laboratoryInfo.upiId ? `UPI ID: ${laboratoryInfo.upiId}\n` : ''}` +
        `For payment assistance, please contact our billing department.\n\n` +
        `If you have any questions or need clarification about this invoice, please don't hesitate to contact us. Our team is here to assist you.\n\n` +
        `Thank you for choosing ${laboratoryInfo.name}. We value your trust and look forward to serving you again.\n\n` +
        `Best regards,\n` +
        `Billing Department\n` +
        `${laboratoryInfo.name}\n` +
        `${laboratoryInfo.address}\n` +
        `📞 Phone: ${laboratoryInfo.phone}\n` +
        `📧 Email: ${laboratoryInfo.email}\n` +
        `${laboratoryInfo.website ? `🌐 Website: ${laboratoryInfo.website}\n` : ''}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `This is a computer-generated email. Please do not reply directly to this message.\n` +
        `For queries, please contact our billing department at ${laboratoryInfo.phone}.`;
      
      setBody(emailBody);
      setError(null);
      setSuccess(false);
      setPdfGenerated(false);
      setPdfBlob(null);
    }
  }, [isOpen, invoice, doctorInfo, laboratoryInfo]);

  const generatePDF = async () => {
    try {
      setLoading(true);
      setError(null);

      let blob: Blob;

      if (onGeneratePDF) {
        try {
          blob = await onGeneratePDF();
        } catch (customPdfError) {
          console.error("Custom PDF generation failed, falling back to default:", customPdfError);
          blob = await generateDefaultPDF();
        }
      } else {
        blob = await generateDefaultPDF();
      }

      setPdfBlob(blob);
      setPdfGenerated(true);
      return blob;
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("Failed to generate PDF. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultPDF = async (): Promise<Blob> => {
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(laboratoryInfo.name || "LabCore Laboratory", 15, 20);
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(laboratoryInfo.address || "Laboratory address", 15, 25);
      pdf.text(`Phone: ${laboratoryInfo.phone}`, 15, 30);
      pdf.text(`Email: ${laboratoryInfo.email}`, 15, 35);
      
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("TAX INVOICE", pageWidth - 15, 20, { align: "right" });
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Invoice: ${invoice?.invoiceNumber || `INV-${invoice?.id}`}`, pageWidth - 15, 26, { align: "right" });
      pdf.text(`Date: ${formatDate(invoice?.createdAt)}`, pageWidth - 15, 31, { align: "right" });
      
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Bill To:", 15, 50);
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(invoice?.patientName || "—", 15, 55);
      if (invoice?.patientEmail) {
        pdf.text(invoice.patientEmail, 15, 60);
      }
      
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Amount Due:", 15, 75);
      
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text(formatCurrency(invoice?.netPayable), 15, 82);
      
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text("Generated by LabCore ELIS", 15, 280);
      
      return pdf.output("blob");
    } catch (jsPdfError) {
      console.error("jsPDF import error:", jsPdfError);
      throw new Error("PDF library not available. Please ensure jspdf is installed.");
    }
  };

  const sendEmail = async () => {
    if (!to.trim()) {
      setError("Recipient email address is required");
      return;
    }

    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }

    if (!body.trim()) {
      setError("Email body is required");
      return;
    }

    try {
      setSending(true);
      setError(null);

      // Generate PDF if not already generated
      if (!pdfGenerated || !pdfBlob) {
        await generatePDF();
      }

      // Try to use communication service if available
      try {
        const { communicationService } = await import('@/lib/communicationService');
        
        // Convert PDF blob to base64 for sending
        const pdfBase64 = pdfBlob ? await blobToBase64(pdfBlob) : null;

        // Use the communication service to send email
        const patientId = invoice?.id?.toString() || "unknown";
        
        const emailData: any = {
          patientId,
          to: to.trim(),
          subject: subject.trim(),
          body: body.trim(),
        };

        // Add PDF attachment if generated
        if (pdfBase64) {
          emailData.attachments = [{
            filename: `Invoice_${invoice?.invoiceNumber || invoice?.id}.pdf`,
            content: pdfBase64,
            contentType: 'application/pdf',
          }];
        }

        const result = await communicationService.sendEmail(
          patientId,
          to.trim(),
          subject.trim(),
          body.trim(),
          emailData.attachments
        );

        if (result.success) {
          setSuccess(true);
          
          // Log the email action
          console.log("Email sent successfully:", {
            invoiceId: invoice?.id,
            invoiceNumber: invoice?.invoiceNumber,
            patientId: patientId,
            to: to.trim(),
            subject: subject.trim(),
            hasAttachment: !!pdfBase64,
            timestamp: new Date().toISOString()
          });

          // Auto-close after showing success
          setTimeout(() => {
            onClose();
          }, 2000);
          return;
        } else {
          throw new Error(result.error || "Email service failed");
        }
      } catch (commError) {
        console.warn("Communication service not available, falling back to mailto:", commError);
        
        // Fallback: Open email client with mailto link
        // Note: mailto doesn't support attachments, so we'll inform the user
        openEmailClient();
        
        // Show a message about manual attachment
        setError("Email client opened. Please manually attach the downloaded PDF.");
        setTimeout(() => {
          setError(null);
        }, 5000);
        
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (err) {
      console.error("Email sending failed:", err);
      setError("Failed to send email. Please try again or use the email client option.");
    } finally {
      setSending(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]; // Remove data URL prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const openEmailClient = () => {
    if (!to.trim()) {
      setError("Recipient email address is required");
      return;
    }

    const mailtoLink = `mailto:${to.trim()}?cc=${encodeURIComponent(cc.trim())}&subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body.trim())}`;
    window.open(mailtoLink, '_blank');
    
    // Inform user about manual PDF attachment
    if (pdfGenerated) {
      setTimeout(() => {
        setError("Email client opened. Please attach the downloaded PDF manually.");
        setTimeout(() => setError(null), 5000);
      }, 1000);
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Sent Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Invoice has been sent to {to}
          </p>
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl my-8">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Send via Email</h2>
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
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Invoice Number:</span>
                <span className="ml-2 font-medium text-gray-900">{invoice.invoiceNumber || `INV-${invoice.id}`}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-semibold text-gray-900">{formatCurrency(invoice.netPayable)}</span>
              </div>
              <div>
                <span className="text-gray-600">Patient:</span>
                <span className="ml-2 font-medium text-gray-900">{invoice.patientName || "—"}</span>
              </div>
              <div>
                <span className="text-gray-600">Due Date:</span>
                <span className="ml-2 font-medium text-gray-900">{formatDate(invoice.dueDate)}</span>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); sendEmail(); }}>
            <div className="space-y-4">
              {/* To */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  To <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
                {!invoice.patientEmail && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Patient email not on file. Please enter manually.
                  </p>
                )}
              </div>

              {/* CC */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  CC (Optional)
                </label>
                <input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="doctor@example.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {doctorInfo?.email && !cc && (
                  <button
                    type="button"
                    onClick={() => setCc(doctorInfo.email || "")}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    + Add referring doctor's email
                  </button>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Email message"
                  rows={8}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  required
                />
              </div>

              {/* PDF Attachment Status */}
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    Invoice PDF
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {pdfGenerated ? (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Ready
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={generatePDF}
                      disabled={loading}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate PDF"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={openEmailClient}
                  disabled={!to.trim() || sending}
                  className="flex items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Open Email Client
                </button>
                <button
                  type="submit"
                  disabled={sending || !to.trim() || !subject.trim() || !body.trim()}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-lg"
                >
                  {sending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Directly
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}