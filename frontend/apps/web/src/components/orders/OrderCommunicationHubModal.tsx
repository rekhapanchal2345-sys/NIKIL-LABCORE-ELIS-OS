"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { communicationApi, laboratorySettingsApi } from "@/lib/api";
import { formatPatientFullName } from "@/lib/patient-utils";
import {
  MessageSquare,
  Mail,
  Send,
  Share2,
  Check,
  CheckCheck,
  CheckCircle2,
  Copy,
  Phone,
  ExternalLink,
  QrCode,
  Sparkles,
  AlertTriangle,
  FileText,
  Download,
  ShieldCheck,
  User,
  Stethoscope,
  RefreshCw,
  X,
  ChevronRight,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  Layers,
  ArrowRight,
  Info,
  Settings2,
  Key,
  Server,
  Lock,
  Radio,
  Cpu,
  SlidersHorizontal,
} from "lucide-react";

export type CommunicationChannel = "WHATSAPP" | "EMAIL" | "BOTH";

export type DiagnosticTemplateKey =
  | "ORDER_CONFIRMATION"
  | "SAMPLE_COLLECTED"
  | "PROCESSING_QUEUE"
  | "REPORT_READY"
  | "CRITICAL_PANEL"
  | "PAYMENT_RECEIPT"
  | "HOME_COLLECTION_SLOT";

interface OrderCommunicationHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  reportUrl?: string;
  defaultTemplate?: DiagnosticTemplateKey;
  onSuccess?: (details: { channel: string; recipient: string; message: string }) => void;
}

export function OrderCommunicationHubModal({
  isOpen,
  onClose,
  order,
  reportUrl: reportUrlOverride,
  defaultTemplate = "ORDER_CONFIRMATION",
  onSuccess,
}: OrderCommunicationHubModalProps) {
  // Channel Tab
  const [activeChannel, setActiveChannel] = useState<CommunicationChannel>("WHATSAPP");

  // Gateway / Protocol Routing Options
  const [whatsappGateway, setWhatsappGateway] = useState<"cloudapi" | "twilio" | "direct" | "gupshup">("cloudapi");
  const [emailGateway, setEmailGateway] = useState<"smtp" | "sendgrid" | "mailto">("smtp");
  const [showGatewaySettings, setShowGatewaySettings] = useState(false);

  // Recipient selector: 'PATIENT' | 'DOCTOR' | 'CUSTOM'
  const [recipientTarget, setRecipientTarget] = useState<"PATIENT" | "DOCTOR" | "CUSTOM">("PATIENT");
  const [targetPhone, setTargetPhone] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [targetName, setTargetName] = useState("");
  const [ccDoctor, setCcDoctor] = useState(false);

  // Template Key
  const [selectedTemplate, setSelectedTemplate] = useState<DiagnosticTemplateKey>(defaultTemplate);

  // Message and Subject
  const [emailSubject, setEmailSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [customFastingNote, setCustomFastingNote] = useState("10-12 hours overnight fasting (water allowed)");

  // Live preview mode: 'WHATSAPP_CHAT' | 'EMAIL_PREVIEW' | 'QR_MODAL'
  const [previewTab, setPreviewTab] = useState<"MOBILE" | "EMAIL_HTML" | "QR_CODE">("MOBILE");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // Sending status
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deliveryConsent, setDeliveryConsent] = useState(false);
  const messageEditorRef = useRef<HTMLTextAreaElement>(null);

  // Initialize recipient details from order
  useEffect(() => {
    if (!order) return;

    if (recipientTarget === "PATIENT") {
      setTargetName(formatPatientFullName(order.patient));
      setTargetPhone(order.patient?.phone || "");
      setTargetEmail(order.patient?.email || "");
    } else if (recipientTarget === "DOCTOR") {
      setTargetName(order.doctor?.fullName || "Referring Doctor");
      setTargetPhone(order.doctor?.phone || "");
      setTargetEmail(order.doctor?.email || "");
    }
  }, [order, recipientTarget]);

  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate(defaultTemplate);
      setSendSuccess(null);
      setSendError(null);
      setDeliveryConsent(false);
    }
  }, [defaultTemplate, isOpen, order?.id]);

  // Host URL helper
  const appOrigin = useMemo(() => {
    return typeof window !== "undefined" ? window.location.origin : "";
  }, []);

  // Compute test names and pricing
  const testNamesList = useMemo(() => {
    if (!order?.items || !Array.isArray(order.items)) return "Investigation details unavailable";
    return order.items.map((i: any) => i.test?.testName || "Investigation details unavailable").join(", ");
  }, [order]);

  const receiptUrl = `${appOrigin}/orders/${order?.id}/receipt`;
  const reportUrl = reportUrlOverride || order?.reportUrl || `${appOrigin}/orders/${order?.id}/report`;
  const trackingUrl = `${appOrigin}/orders/${order?.id}`;
  const secureDocumentUrl = selectedTemplate === "REPORT_READY" ? reportUrl : receiptUrl;
  const messageQuality = useMemo(() => {
    const hasGreeting = /dear|hello|namaste/i.test(messageBody);
    const hasOrderReference = Boolean(order?.orderNumber && messageBody.includes(order.orderNumber));
    const hasSecureLink = messageBody.includes("http");
    const score = [hasGreeting, hasOrderReference, hasSecureLink, messageBody.length >= 80].filter(Boolean).length;
    return {
      score,
      label: score >= 3 ? "Dispatch ready" : score === 2 ? "Review recommended" : "Needs review",
      tone: score >= 3 ? "text-emerald-700 dark:text-emerald-300" : score === 2 ? "text-amber-700 dark:text-amber-300" : "text-rose-700 dark:text-rose-300",
    };
  }, [messageBody, order?.orderNumber]);

  // Generate dynamic message content based on template
  useEffect(() => {
    if (!order) return;

    const patientName = targetName || (order.patient ? formatPatientFullName(order.patient) : "Valued Patient");
    const orderNo = order.orderNumber || "ORD-0000";
    const billTotal = order.grandTotal || 0;
    const paid = order.paidAmount || 0;
    const balanceDue = order.dueAmount ?? Math.max(0, billTotal - paid);
    const doctor = order.doctor?.fullName || "Self Referral";

    let subject = "";
    let body = "";

    switch (selectedTemplate) {
      case "ORDER_CONFIRMATION":
        subject = `Order Confirmation & Receipt #${orderNo} - ${patientName} | LabCore Diagnostics`;
        body =
          `*LABCORE DIAGNOSTICS & PATHOLOGY LAB*\n` +
          `*Order Requisition Confirmed* 🧾\n\n` +
          `Dear *${patientName}*,\n\n` +
          `Thank you for choosing LabCore ELIS. Your pathology order *#${orderNo}* has been successfully registered.\n\n` +
          `📋 *Prescribed Tests:*\n${testNamesList}\n\n` +
          `💰 *Billing Summary:*\n` +
          `• Total Amount: ₹${billTotal}\n` +
          `• Amount Paid: ₹${paid}\n` +
          `• Balance Due: ₹${balanceDue}\n\n` +
          `📍 *Specimen Collection Venue:*\n${order.collectionType === "HOME_COLLECTION" ? "Home Visit Phlebotomist" : "Central Lab Walk-in Desk"}\n\n` +
           `🔬 *Specimen Barcode:* ${order.barcode || "Not assigned"}\n` +
          `👨‍⚕️ *Consultant/Doctor:* ${doctor}\n\n` +
          `📲 *View & Download Official Receipt:*\n${receiptUrl}\n\n` +
          `Track live testing progress here:\n${trackingUrl}\n\n` +
           `_LabCore Diagnostics • Please retain this order reference for support._`;
        break;

      case "SAMPLE_COLLECTED":
        subject = `Specimen Accessioned #${orderNo} - Testing Underway | LabCore Diagnostics`;
        body =
          `*LABCORE DIAGNOSTICS - SPECIMEN LOGGED* 🩸\n\n` +
          `Dear *${patientName}*,\n\n` +
          `Your biological specimens for Order *#${orderNo}* have been successfully collected and received at our central diagnostic testing facility.\n\n` +
          `🧪 *Sample Barcode:* ${order.barcode || "Accessioned"}\n` +
          `🔬 *Tests In Queue:* ${testNamesList}\n` +
           `The specimen is available for the next configured laboratory workflow step.\n\n` +
           `You will receive a notification when the report is released.\n\n` +
          `Live Order Status: ${trackingUrl}\n\n` +
          `_LabCore ELIS Laboratory • Quality & Precision_`;
        break;

      case "PROCESSING_QUEUE":
        subject = `Analyzer Processing Status - Order #${orderNo} | LabCore`;
        body =
          `*LABCORE ELIS - TESTS IN ANALYZER RUN* ⚙️\n\n` +
          `Dear *${patientName}*,\n\n` +
          `Your diagnostic samples for Order *#${orderNo}* are currently being analyzed on our high-throughput clinical laboratory analyzers.\n\n` +
          `• Order ID: *#${orderNo}*\n` +
          `• Turnaround Standard: Standard priority quality control in effect.\n` +
          `• Tests: ${testNamesList}\n\n` +
          `Pathology verification is expected within normal turnaround times. Access your order portal at ${trackingUrl}.`;
        break;

      case "REPORT_READY":
        const reportResults = Array.isArray(order.results) ? order.results : [];
        const reportValues = reportResults.flatMap((result: any) =>
          Array.isArray(result.values)
            ? result.values.slice(0, 8).map((value: any) =>
                `• ${value.parameter?.parameterName || "Parameter"}: ${value.value || "—"}${value.parameter?.unit ? ` ${value.parameter.unit}` : ""}${value.flag ? ` [${value.flag}]` : ""}`
              )
            : []
        );
        const flaggedValues = reportValues.filter((value: string) => /\[(HIGH|LOW|CRITICAL|PANIC|ABNORMAL)\]/i.test(value));
        const verifiedBy = reportResults.find((result: any) => result.approvedBy)?.approvedBy?.fullName;
        const totalParameters = reportResults.reduce(
          (total: number, result: any) => total + (Array.isArray(result.values) ? result.values.length : 0),
          0
        );
        const verifiedAt = reportResults.find((result: any) => result.approvedAt || result.verifiedAt)?.approvedAt ||
          reportResults.find((result: any) => result.verifiedAt)?.verifiedAt;
        subject = `Diagnostic Report Published & Verified #${orderNo} - ${patientName} | LabCore`;
        body =
          `*LABCORE DIAGNOSTICS | VERIFIED REPORT DOSSIER* 📑\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `Dear *${patientName}*,\n\n` +
          `Your diagnostic report for Order *#${orderNo}* is *COMPLETED, VERIFIED & PUBLISHED* by our clinical laboratory team.\n\n` +
          `🧾 *REPORT IDENTITY*\n` +
          `• Order Reference: *#${orderNo}*\n` +
          `• Patient UHID: *${order.patient?.uhid || "On file"}*\n` +
          `• Specimen Barcode: *${order.barcode || "On file"}*\n` +
          `• Report Status: *${order.reportStatus || "VERIFIED"}*\n` +
          `• Tests / Package: *${testNamesList}*\n` +
          `• Referring Doctor: *${doctor}*\n` +
          `• Patient Profile: *${order.patient?.gender || "—"}${order.patient?.age ? `, ${order.patient.age} years` : ""}*\n` +
          `• Report Published: *${order.reportedAt ? new Date(order.reportedAt).toLocaleString("en-IN") : "Recently"}*\n\n` +
          `🛡️ *QUALITY & VERIFICATION*\n` +
          `• Parameters reported: *${totalParameters || "Available in report"}*\n` +
           (verifiedBy ? `• Clinical verification: *${verifiedBy}*\n` : "") +
           (verifiedAt ? `• Verification timestamp: *${new Date(verifiedAt).toLocaleString("en-IN")}*\n` : "") +
           `• Collection status: *${order.collectedAt ? "Specimen collected and accessioned" : "See report for accession details"}*\n\n` +
          (reportValues.length
            ? `🔬 *CLINICAL SNAPSHOT*\n${reportValues.join("\n")}\n` +
              (flaggedValues.length ? `⚠️ *Attention:* ${flaggedValues.length} value(s) require clinical review. Please consult your doctor.\n` : `✅ No flagged values detected in the shared snapshot.\n`) +
              `\n`
            : "") +
          `📥 *OPEN VERIFIED DIGITAL REPORT*\n${reportUrl}\n\n` +
           `🔐 *PRIVACY*\n` +
           `• This message contains confidential medical information.\n` +
           `• Share the report only with authorized care providers.\n\n` +
          `Please share this report with your consulting physician (*${doctor}*) for clinical interpretation.\n\n` +
           `_LabCore Diagnostics • Please retain this order reference for support._`;
        break;

      case "CRITICAL_PANEL":
        subject = `🚨 URGENT: Critical Diagnostic Alert - Order #${orderNo} - ${patientName}`;
        body =
          `*🚨 LABCORE CRITICAL VALUE CLINICAL ALERT 🚨*\n\n` +
          `ATTN: *${patientName}* & Dr. *${doctor}*\n\n` +
          `This is an immediate high-priority notification regarding pathology Order *#${orderNo}*.\n\n` +
          `Critical alert criteria have been flagged for prescribed tests: *${testNamesList}*.\n\n` +
          `Immediate clinical consultation with your attending physician or hospital emergency unit is strongly advised.\n\n` +
          `Access verified preliminary values immediately:\n${reportUrl}\n\n` +
           `Please contact the ordering clinician or the configured laboratory support channel.\n` +
           `Timestamp: ${new Date().toLocaleTimeString("en-IN")}`;
        break;

      case "PAYMENT_RECEIPT":
        subject = `Payment Receipt & Balance Statement #${orderNo} | LabCore Diagnostics`;
        body =
          `*LABCORE DIAGNOSTICS - PAYMENT STATEMENT* 💳\n\n` +
          `Dear *${patientName}*,\n\n` +
          `Payment summary for diagnostic Order *#${orderNo}*:\n\n` +
          `• Total Invoice Amount: ₹${billTotal}\n` +
          `• Amount Received: ₹${paid}\n` +
          `• Outstanding Balance Due: *₹${balanceDue}*\n\n` +
          `${
            balanceDue > 0
              ? `You can clear your remaining balance online via UPI or credit card, or at our front-desk collection counter.\n`
              : `Your account is fully settled. Thank you for prompt payment!\n`
          }\n` +
          `Download official GST Tax Invoice:\n${receiptUrl}\n\n` +
           `Please retain this order reference for billing support.`;
        break;

      case "HOME_COLLECTION_SLOT":
        subject = `Phlebotomy Home Visit Scheduled #${orderNo} - ${patientName} | LabCore`;
        body =
          `*LABCORE PHLEBOTOMY HOME COLLECTION SCHEDULED* 🏠\n\n` +
          `Dear *${patientName}*,\n\n` +
          `Your home specimen collection appointment has been confirmed for Order *#${orderNo}*.\n\n` +
          `📅 *Scheduled Date:* ${order.collectionDate || new Date().toISOString().split("T")[0]}\n` +
          `⏰ *Time Window:* ${order.collectionTimeSlot || "08:00 - 10:00 AM"}\n` +
          `📍 *Address:* ${order.homeCollectionAddress || order.patient?.address || "Patient Address"}\n\n` +
          `⚠️ *Preparation Protocol:*\n${customFastingNote}\n\n` +
           `Please keep the patient identity document and any preparation instructions available for collection.`;
        break;
    }

    setEmailSubject(subject);
    setMessageBody(body);
  }, [order, selectedTemplate, targetName, testNamesList, receiptUrl, reportUrl, trackingUrl, customFastingNote]);

  // Generate QR Code data for mobile instant pickup
  useEffect(() => {
    if (!order) return;
    const cleanPhone = targetPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageBody)}`;

    QRCode.toDataURL(waUrl, {
      width: 220,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error("QR Code Error:", err));
  }, [order, targetPhone, messageBody]);

  if (!isOpen || !order) return null;

  // Insert Variable Token into Message
  const handleInsertToken = (token: string) => {
    setMessageBody((prev) => `${prev} ${token}`);
  };

  const insertMessageBlock = (block: string) => {
    const editor = messageEditorRef.current;
    if (!editor) {
      setMessageBody((prev) => `${prev}\n\n${block}`);
      return;
    }
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    setMessageBody((prev) => `${prev.slice(0, start)}${block}${prev.slice(end)}`);
    requestAnimationFrame(() => {
      editor.focus();
      const cursor = start + block.length;
      editor.setSelectionRange(cursor, cursor);
    });
  };

  // Launch WhatsApp Web / App directly
  const handleLaunchWhatsAppDirect = () => {
    const cleanPhone = targetPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageBody)}`
      : `https://wa.me/?text=${encodeURIComponent(messageBody)}`;
    window.open(url, "_blank");

    if (onSuccess) {
      onSuccess({
        channel: "WHATSAPP",
        recipient: targetPhone,
        message: messageBody,
      });
    }
  };

  // Open default mail client (mailto:)
  const handleLaunchMailto = () => {
    const to = targetEmail || "";
    const cc = ccDoctor && order.doctor?.email ? `&cc=${encodeURIComponent(order.doctor.email)}` : "";
    const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(messageBody)}${cc}`;
    window.open(mailtoUrl, "_blank");

    if (onSuccess) {
      onSuccess({
        channel: "EMAIL",
        recipient: targetEmail,
        message: messageBody,
      });
    }
  };

  // Copy text to clipboard
  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(messageBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Official Dispatch via Backend API (Server-Side SMTP & Twilio/Meta WhatsApp)
  const handleSendViaServerApi = async () => {
    if (!deliveryConsent) {
      setSendError("Please confirm the recipient and clinical communication details before dispatch.");
      return;
    }

    if ((activeChannel === "WHATSAPP" || activeChannel === "BOTH") && !/^\+?[0-9\s\-()]{8,}$/.test(targetPhone)) {
      setSendError("Enter a valid WhatsApp phone number before dispatch.");
      return;
    }

    if ((activeChannel === "EMAIL" || activeChannel === "BOTH") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setSendError("Enter a valid recipient email address before dispatch.");
      return;
    }

    setSending(true);
    setSendSuccess(null);
    setSendError(null);

    try {
      const patientId = order.patient?.id || order.patientId;
      let reportPdfBase64: string | undefined;

      if (selectedTemplate === "REPORT_READY") {
        const pdf = new jsPDF();
        const patientName = order.patient ? formatPatientFullName(order.patient) : "Patient";
        const lines = [
          "LABCORE DIAGNOSTICS",
          "VERIFIED CLINICAL REPORT DOSSIER",
          `Order Reference: ${order.orderNumber || "—"}`,
          `Patient: ${patientName}`,
          `UHID: ${order.patient?.uhid || "—"}`,
          `Specimen Barcode: ${order.barcode || "—"}`,
          `Doctor: ${order.doctor?.fullName || "—"}`,
          "",
          "TESTS / PACKAGE",
          testNamesList,
          "",
          "CLINICAL VALUES",
          ...(Array.isArray(order.results)
            ? order.results.flatMap((result: any) =>
                Array.isArray(result.values)
                  ? result.values.map((value: any) =>
                      `${value.parameter?.parameterName || "Parameter"}: ${value.value || "—"} ${value.parameter?.unit || ""} ${value.flag ? `[${value.flag}]` : ""}`
                    )
                  : []
              )
            : ["Values available in secure report portal."]),
          "",
          "SECURITY",
          "Digitally verified clinical communication. Confidential medical record.",
          `Secure report: ${reportUrl}`,
        ];
        pdf.setFillColor(7, 21, 47);
        pdf.rect(0, 0, 210, 28, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.text(lines[0], 14, 12);
        pdf.setFontSize(9);
        pdf.text(lines[1], 14, 20);
        pdf.setTextColor(25, 35, 55);
        pdf.setFontSize(9);
        let y = 40;
        lines.slice(2).forEach((line) => {
          const wrapped = pdf.splitTextToSize(line, 180);
          if (y > 280) {
            pdf.addPage();
            y = 18;
          }
          pdf.text(wrapped, 14, y);
          y += wrapped.length * 5 + (line === "" ? 2 : 1);
        });
        reportPdfBase64 = pdf.output("datauristring").split(",")[1];
      }
      let waSuccess = false;
      let emailSuccess = false;
      const reportAttachmentName = `LabCore_Report_${order.orderNumber || "report"}.pdf`;
      const sendWhatsAppWithPdf = selectedTemplate === "REPORT_READY" && Boolean(reportPdfBase64);
      const sendEmailWithPdf = selectedTemplate === "REPORT_READY" && Boolean(reportPdfBase64);

      // Send WhatsApp
      if (activeChannel === "WHATSAPP" || activeChannel === "BOTH") {
        if (!targetPhone) {
          throw new Error("Patient phone number is missing for WhatsApp dispatch.");
        }
        if (whatsappGateway === "direct" && !sendWhatsAppWithPdf) {
          handleLaunchWhatsAppDirect();
          waSuccess = true;
        } else {
          await communicationApi.sendWhatsApp({
            patientId,
            to: targetPhone,
            message: messageBody,
            ...(reportPdfBase64 ? { pdfBase64: reportPdfBase64, filename: reportAttachmentName } : {}),
          });
          waSuccess = true;
        }
      }

      // Send Email
      if (activeChannel === "EMAIL" || activeChannel === "BOTH") {
        if (!targetEmail) {
          throw new Error("Recipient email address is required to dispatch email.");
        }
        if (emailGateway === "mailto" && !sendEmailWithPdf) {
          handleLaunchMailto();
          emailSuccess = true;
        } else {
          await communicationApi.sendEmail({
            patientId,
            to: targetEmail,
            subject: emailSubject,
            body: messageBody,
            ...(reportPdfBase64
              ? {
                  attachments: [{
                    filename: reportAttachmentName,
                    content: reportPdfBase64,
                    contentType: "application/pdf",
                  }],
                }
              : {}),
          });
          emailSuccess = true;
        }
      }

      const successMsg =
        activeChannel === "BOTH"
          ? "Successfully dispatched via both WhatsApp and Official Email!"
          : activeChannel === "WHATSAPP"
          ? (whatsappGateway === "direct" && !sendWhatsAppWithPdf ? "Opened in WhatsApp Web successfully!" : "WhatsApp message with PDF delivered successfully.")
          : (emailGateway === "mailto" && !sendEmailWithPdf ? "Opened in default email client!" : "Email with PDF attachment sent successfully.");

      setSendSuccess(successMsg);

      if (onSuccess) {
        onSuccess({
          channel: activeChannel,
          recipient: activeChannel === "EMAIL" ? targetEmail : targetPhone,
          message: messageBody,
        });
      }

      if ((!sendWhatsAppWithPdf || waSuccess) && (!sendEmailWithPdf || emailSuccess)) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      console.error("Communication Dispatch Error:", err);
      // Fallback message
      setSendError(
        err.message || "Failed to dispatch via server gateway. You can still use 'Open in WhatsApp' directly."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* ========================================================= */}
        {/* MODAL HEADER */}
        {/* ========================================================= */}
        <div className="relative overflow-hidden px-6 py-4 bg-gradient-to-r from-[#07152f] via-[#122b55] to-[#0b6b68] border-b border-cyan-400/20 flex items-center justify-between shrink-0">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-cyan-300/15 blur-2xl" />
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-300 to-emerald-400 text-[#07152f] flex items-center justify-center shadow-lg shadow-cyan-950/40">
              <Share2 className="h-5 w-5" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  Diagnostic Communication Hub
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-300/15 text-cyan-100 border border-cyan-200/20 font-mono">
                  {order.orderNumber}
                </span>
                {order.priority === "STAT" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-400/20 text-rose-100 border border-rose-300/30 animate-pulse">
                    STAT
                  </span>
                )}
              </div>
              <p className="text-xs text-cyan-100/70">
                Automated multichannel dispatch • WhatsApp Cloud & SMTP Email with live preview
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-cyan-50">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />
              Secure dispatch
            </span>
            <button
              type="button"
              onClick={() => setShowGatewaySettings(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Configure WhatsApp API & SMTP Gateways"
            >
              <Settings2 className="h-3.5 w-3.5 text-cyan-200" />
              <span>API & SMTP Gateways</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CHANNEL SELECTOR TABS */}
        {/* ========================================================= */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap bg-white dark:bg-slate-900">
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveChannel("WHATSAPP");
                setPreviewTab("MOBILE");
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeChannel === "WHATSAPP"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>WhatsApp Direct</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveChannel("EMAIL");
                setPreviewTab("EMAIL_HTML");
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeChannel === "EMAIL"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Official Email</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveChannel("BOTH");
                setPreviewTab("MOBILE");
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeChannel === "BOTH"
                  ? "bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Omni-Channel (Both)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewTab("QR_CODE")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                previewTab === "QR_CODE"
                  ? "bg-purple-600 text-white"
                  : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Counter QR Pickup</span>
            </button>
          </div>
        </div>

        {/* PREMIUM DISPATCH STATUS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-200/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800">
          {[
            {
              label: "Channel",
              value: activeChannel === "BOTH" ? "Omni-channel" : activeChannel === "WHATSAPP" ? "WhatsApp" : "Email",
              tone: activeChannel === "EMAIL" ? "text-blue-700 dark:text-blue-300" : "text-emerald-700 dark:text-emerald-300",
            },
            {
              label: "Recipient",
              value: recipientTarget === "PATIENT" ? "Patient" : recipientTarget === "DOCTOR" ? "Doctor" : "Custom",
              tone: "text-violet-700 dark:text-violet-300",
            },
            {
              label: "Message",
              value: messageQuality.label,
              tone: messageQuality.tone,
            },
            {
              label: "Security",
              value: deliveryConsent ? "Verified" : "Awaiting check",
              tone: deliveryConsent ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300",
            },
          ].map((item) => (
            <div key={item.label} className="bg-white px-4 py-2.5 dark:bg-slate-900">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
              <p className={`mt-0.5 truncate text-[11px] font-black ${item.tone}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* ========================================================= */}
        {/* GATEWAY PROTOCOL & API OPTIONS BAR */}
        {/* ========================================================= */}
        <div className="px-6 py-2 bg-gradient-to-r from-slate-50 via-emerald-50/20 to-blue-50/20 dark:from-slate-900/60 dark:to-slate-800/40 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            {/* WhatsApp Options */}
            {(activeChannel === "WHATSAPP" || activeChannel === "BOTH") && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                  <span>WhatsApp API:</span>
                </span>
                <div className="inline-flex rounded-lg bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setWhatsappGateway("cloudapi")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      whatsappGateway === "cloudapi"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    Meta Cloud API
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhatsappGateway("twilio")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      whatsappGateway === "twilio"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    Twilio Gateway
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhatsappGateway("direct")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      whatsappGateway === "direct"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                    title="Free 1-Click WhatsApp Web without API credentials"
                  >
                    ⚡ Web Direct (Free)
                  </button>
                </div>
              </div>
            )}

            {/* Email SMTP Options */}
            {(activeChannel === "EMAIL" || activeChannel === "BOTH") && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-blue-600" />
                  <span>Email SMTP:</span>
                </span>
                <div className="inline-flex rounded-lg bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setEmailGateway("smtp")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      emailGateway === "smtp"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    Hospital SMTP Server
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailGateway("sendgrid")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      emailGateway === "sendgrid"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    SendGrid Cloud
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailGateway("mailto")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      emailGateway === "mailto"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    Desktop Mail Client
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Configure Trigger */}
          <button
            type="button"
            onClick={() => setShowGatewaySettings(true)}
            className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 ml-auto transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span>Configure Credentials</span>
          </button>
        </div>



        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Controls & Content Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Target Recipient Selector */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Target Recipient
                </span>
                <div className="flex rounded-lg bg-slate-200 dark:bg-slate-700 p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setRecipientTarget("PATIENT")}
                    className={`px-2 py-0.5 rounded-md ${
                      recipientTarget === "PATIENT" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientTarget("DOCTOR")}
                    className={`px-2 py-0.5 rounded-md ${
                      recipientTarget === "DOCTOR" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    Doctor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientTarget("CUSTOM")}
                    className={`px-2 py-0.5 rounded-md ${
                      recipientTarget === "CUSTOM" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Mobile Number (WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder="+91-9876543210"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {order.doctor?.email && (
                <label className="flex items-center gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ccDoctor}
                    onChange={(e) => setCcDoctor(e.target.checked)}
                    className="h-3.5 w-3.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    Auto CC Attending Doctor ({order.doctor.fullName} - {order.doctor.email})
                  </span>
                </label>
              )}

              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 dark:border-amber-900/70 dark:bg-amber-950/20">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Verified clinical dispatch
                  </p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-amber-700 dark:text-amber-400">
                    Confirm the recipient before sending patient report or billing information.
                  </p>
                  <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                    <input
                      type="checkbox"
                      checked={deliveryConsent}
                      onChange={(e) => {
                        setDeliveryConsent(e.target.checked);
                        if (e.target.checked) setSendError(null);
                      }}
                      className="h-3.5 w-3.5 rounded border-amber-400 text-emerald-600 focus:ring-emerald-500"
                    />
                    I verified this recipient and channel.
                  </label>
                </div>
              </div>
            </div>

            {/* Template Selector Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Select Diagnostic Communication Template
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "ORDER_CONFIRMATION", label: "Receipt & Order Confirmed", icon: "🧾" },
                  { id: "SAMPLE_COLLECTED", label: "Specimen Accessioned", icon: "🩸" },
                  { id: "REPORT_READY", label: "Report Verified Ready", icon: "📑" },
                  { id: "CRITICAL_PANEL", label: "Critical Panic Alert", icon: "🚨" },
                  { id: "PAYMENT_RECEIPT", label: "Balance Due Reminder", icon: "💳" },
                  { id: "HOME_COLLECTION_SLOT", label: "Home Visit Phlebotomist", icon: "🏠" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(t.id as any)}
                    className={`p-2.5 rounded-xl text-left border transition-all text-xs font-semibold flex items-center gap-2 ${
                      selectedTemplate === t.id
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-xs scale-[1.01]"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <span className="text-base">{t.icon}</span>
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* If Home Collection: Fasting & Instructions Input */}
            {selectedTemplate === "HOME_COLLECTION_SLOT" && (
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-200 mb-1">
                  Patient Preparation / Fasting Notice
                </label>
                <input
                  type="text"
                  value={customFastingNote}
                  onChange={(e) => setCustomFastingNote(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 focus:outline-none"
                />
              </div>
            )}

            {/* Email Subject Line (for Email & Both modes) */}
            {(activeChannel === "EMAIL" || activeChannel === "BOTH") && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Message Body Editor */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Premium Report Message Composer
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {messageBody.length} characters • {selectedTemplate === "REPORT_READY" ? "Clinical report detail mode" : "Diagnostic communication mode"}
                </span>
              </div>

              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-2 py-1.5 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: "Heading", value: "\n*REPORT UPDATE*\n" },
                    { label: "Section", value: "\n━━━━━━━━━━━━━━━━━━━━\n" },
                    { label: "Bullet", value: "\n• " },
                    { label: "Attention", value: "\n⚠️ *Clinical attention:* " },
                    { label: "Security", value: "\n🔐 *Security:* " },
                  ].map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => insertMessageBlock(action.value)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-cyan-700 dark:hover:bg-cyan-950/40"
                    >
                      + {action.label}
                    </button>
                  ))}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Markdown composer</span>
              </div>

              <textarea
                ref={messageEditorRef}
                rows={7}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                aria-label="Premium report message content"
                className="w-full p-3 text-xs font-sans rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white focus:ring-2 focus:ring-cyan-500 leading-relaxed"
              />

              <div className="mt-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="font-black uppercase tracking-wider text-slate-400">Smart message quality</span>
                  <span className={`font-black ${messageQuality.tone}`}>
                    {messageQuality.score}/4 checks passed
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      messageQuality.score >= 3 ? "bg-gradient-to-r from-emerald-500 to-cyan-400" :
                      messageQuality.score === 2 ? "bg-amber-400" : "bg-rose-400"
                    }`}
                    style={{ width: `${messageQuality.score * 25}%` }}
                  />
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-slate-400">
                  <span className={/dear|hello|namaste/i.test(messageBody) ? "text-emerald-600" : ""}>Greeting</span>
                  <span className={order?.orderNumber && messageBody.includes(order.orderNumber) ? "text-emerald-600" : ""}>Order reference</span>
                  <span className={messageBody.includes("http") ? "text-emerald-600" : ""}>Secure link</span>
                  <span className={messageBody.length >= 80 ? "text-emerald-600" : ""}>Readable length</span>
                </div>
              </div>

              {selectedTemplate === "REPORT_READY" && (
                <div className="mt-2 flex items-start gap-2 rounded-xl border border-cyan-200 bg-cyan-50/70 px-3 py-2 dark:border-cyan-900/70 dark:bg-cyan-950/20">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                  <div className="text-[10px] leading-relaxed text-cyan-800 dark:text-cyan-300">
                    <p>
                      Report mode includes patient identity, specimen traceability, verification metadata, clinical flags,
                      secure access link, and confidentiality guidance. Confirm only the intended recipient before dispatch.
                    </p>
                    <p className="mt-1 font-black">PDF attachment: generated and attached automatically for Email and WhatsApp dispatch.</p>
                  </div>
                </div>
              )}

              {/* Dynamic Variables Pill Bar */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Insert Variables:
                </span>
                {[
                  { tag: "{patientName}", label: "Patient" },
                  { tag: "{orderNumber}", label: "Order #" },
                  { tag: "{testsList}", label: "Tests" },
                  { tag: "{grandTotal}", label: "Total Bill" },
                  { tag: "{balanceDue}", label: "Balance" },
                  { tag: "{doctorName}", label: "Doctor" },
                  { tag: "{receiptUrl}", label: "Receipt Link" },
                  { tag: "{reportUrl}", label: "Report Link" },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleInsertToken(item.tag)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 hover:text-slate-900"
                  >
                    +{item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Banners */}
            {sendSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{sendSuccess}</span>
              </div>
            )}

            {sendError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{sendError}</span>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Live Visual Previews (5 cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-emerald-600" />
              Live Visual Preview
            </span>

            {/* TAB 1: WHATSAPP MOBILE CHAT MOCKUP */}
            {previewTab === "MOBILE" && (
              <div className="flex-1 rounded-3xl bg-[#0b141a] border border-slate-800 shadow-xl overflow-hidden flex flex-col min-h-[460px]">
                {/* Chat Top Bar */}
                <div className="px-3.5 py-2.5 bg-[#202c33] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
                      LC
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold leading-tight">LabCore Diagnostics</span>
                        <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 text-[9px] flex items-center justify-center">
                          ✓
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-400">Verified Business Account</p>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                {/* Chat Message Bubble Canvas */}
                <div
                  className="flex-1 p-3.5 overflow-y-auto space-y-3"
                  style={{
                    backgroundColor: "#0b141a",
                    backgroundImage: `radial-gradient(#1f2c34 1px, transparent 1px)`,
                    backgroundSize: "16px 16px",
                  }}
                >
                  {/* Security Notice */}
                  <div className="py-1 px-2.5 rounded-lg bg-[#182229] text-[#8696a0] text-[10px] text-center max-w-[280px] mx-auto shadow-xs">
                     Message preview. Delivery status is confirmed by the configured channel after dispatch.
                  </div>

                  {/* Speech Bubble */}
                  <div className="max-w-[310px] ml-auto rounded-2xl rounded-tr-xs bg-[#005c4b] text-[#e9edef] p-3 shadow-md text-xs leading-relaxed font-sans whitespace-pre-line relative">
                    <p className="text-[11.5px]">{messageBody}</p>

                    <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-[#8696a0]">
                      <span>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                      <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                    </div>
                  </div>

                   {/* Message link preview */}
                  <div className="max-w-[310px] ml-auto space-y-1">
                    <div className="py-1.5 px-3 rounded-xl bg-[#202c33] text-emerald-400 text-[11px] font-bold text-center border border-slate-700 hover:bg-[#2a3942] cursor-pointer shadow-xs">
                       Open receipt link
                    </div>
                    <div className="py-1.5 px-3 rounded-xl bg-[#202c33] text-emerald-400 text-[11px] font-bold text-center border border-slate-700 hover:bg-[#2a3942] cursor-pointer shadow-xs">
                       Open order tracking link
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: HTML EMAIL PREVIEW */}
            {previewTab === "EMAIL_HTML" && (
              <div className="flex-1 rounded-3xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 overflow-y-auto min-h-[460px]">
                <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                  {/* Email Header */}
                  <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-4 text-white text-center">
                    <h4 className="font-black text-sm tracking-wider uppercase">LabCore Diagnostics</h4>
                     <p className="text-[10px] text-blue-200 mt-0.5">Order communication preview</p>
                  </div>

                  {/* Email Body */}
                  <div className="p-4 space-y-3">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                      <p className="text-[10px] text-slate-400 uppercase font-mono">Subject</p>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">{emailSubject}</p>
                    </div>

                    <div className="whitespace-pre-line text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                      {messageBody}
                    </div>

                    <a
                      href={secureDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center py-2.5 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md hover:bg-blue-700 transition-colors"
                    >
                      {selectedTemplate === "REPORT_READY" ? "Open Verified Report" : "Download Official Receipt"}
                    </a>
                  </div>

                  {/* Email Footer */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400">
                    <p className="font-semibold">LabCore ELIS Enterprise • Digital Health Communications</p>
                    <p className="mt-0.5">Confidential medical record. Do not forward unauthorized.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: COUNTER QR CODE (PATIENT SCANS AT RECEPTION) */}
            {previewTab === "QR_CODE" && (
              <div className="flex-1 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center min-h-[460px]">
                <div className="p-4 bg-white rounded-3xl shadow-xl border border-slate-200 mb-4">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="Patient WhatsApp Scan QR" className="h-48 w-48 mx-auto" />
                  ) : (
                    <div className="h-48 w-48 flex items-center justify-center text-slate-400">
                      Generating QR...
                    </div>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Patient Direct Camera Scan
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Have the patient scan this QR code with their mobile phone camera at the lab reception desk to receive this instant message in their WhatsApp.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODAL FOOTER & ACTION BUTTONS */}
        {/* ========================================================= */}
        <div className="px-6 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="hidden xl:flex items-center gap-1.5 mr-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <ShieldCheck className={`h-3.5 w-3.5 ${deliveryConsent ? "text-emerald-600" : "text-amber-500"}`} />
              <span>{deliveryConsent ? "Recipient verified" : "Verification required"}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyClipboard}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
              <span>{copied ? "Copied!" : "Copy Text"}</span>
            </button>

            {activeChannel === "WHATSAPP" || activeChannel === "BOTH" ? (
              <button
                type="button"
                onClick={selectedTemplate === "REPORT_READY" ? handleSendViaServerApi : handleLaunchWhatsAppDirect}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
              >
                {selectedTemplate === "REPORT_READY" ? <Send className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                <span>{selectedTemplate === "REPORT_READY" ? "Send WhatsApp + PDF" : "Open in WhatsApp Web"}</span>
              </button>
            ) : null}

            {activeChannel === "EMAIL" || activeChannel === "BOTH" ? (
              <button
                type="button"
                onClick={selectedTemplate === "REPORT_READY" ? handleSendViaServerApi : handleLaunchMailto}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
              >
                {selectedTemplate === "REPORT_READY" ? <Send className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                <span>{selectedTemplate === "REPORT_READY" ? "Send Email + PDF" : "Open Mail App"}</span>
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Close
            </button>

            <button
              type="button"
              disabled={sending}
              onClick={handleSendViaServerApi}
              className={`px-5 py-2 rounded-xl text-xs font-black text-white shadow-md flex items-center gap-2 transition-all ${
                activeChannel === "WHATSAPP"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : activeChannel === "EMAIL"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gradient-to-r from-emerald-600 to-blue-600 hover:opacity-90"
              } disabled:opacity-50`}
            >
              {sending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>
                    {activeChannel === "BOTH"
                      ? "Dispatch WhatsApp + Email"
                      : activeChannel === "WHATSAPP"
                      ? "Send Official WhatsApp"
                      : "Send Official Email"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// BULK MULTI-ORDER COMMUNICATION MODAL
// ==========================================

export function BulkOrderCommunicationModal({
  isOpen,
  onClose,
  orders,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  onSuccess?: () => void;
}) {
  const [channel, setChannel] = useState<"WHATSAPP" | "EMAIL" | "BOTH">("WHATSAPP");
  const [template, setTemplate] = useState<DiagnosticTemplateKey>("REPORT_READY");
  const [customNote, setCustomNote] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [recipientCheck, setRecipientCheck] = useState(false);

  if (!isOpen || orders.length === 0) return null;

  const handleBulkDispatch = async () => {
    if (!recipientCheck) return;
    setSending(true);
    setProgress(0);
    setSuccessCount(0);
    setFailedCount(0);

    let sent = 0;
    let failed = 0;
    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      try {
        const patientId = o.patient?.id || o.patientId;
        const name = o.patient ? formatPatientFullName(o.patient) : "Patient";
        const testList = (o.items || []).map((it: any) => it.test?.testName).join(", ");
        const reportUrl = `${window.location.origin}/reports/order/${o.id}`;

        const msg =
          `Dear ${name},\n\n` +
          `Your diagnostic lab test reports for Order #${o.orderNumber} (${testList}) are now verified & ready.\n\n` +
          `Download Report: ${reportUrl}\n\n` +
          `${customNote ? `${customNote}\n\n` : ""}` +
          `LabCore Diagnostics`;

        const needsWhatsApp = channel === "WHATSAPP" || channel === "BOTH";
        const needsEmail = channel === "EMAIL" || channel === "BOTH";
        if (needsWhatsApp && !o.patient?.phone) {
          throw new Error(`Missing WhatsApp number for ${name || o.orderNumber}`);
        }
        if (needsEmail && !o.patient?.email) {
          throw new Error(`Missing email address for ${name || o.orderNumber}`);
        }

        if (needsWhatsApp) {
          await communicationApi.sendWhatsApp({
            patientId,
            to: o.patient.phone,
            message: msg,
          });
        }

        if (needsEmail) {
          await communicationApi.sendEmail({
            patientId,
            to: o.patient.email,
            subject: `Verified Lab Report #${o.orderNumber} - ${name} | LabCore`,
            body: msg,
          });
        }

        sent++;
        setSuccessCount(sent);
      } catch (err) {
        console.error("Bulk dispatch item error:", err);
        failed++;
        setFailedCount(failed);
      }
      setProgress(Math.round(((i + 1) / orders.length) * 100));
    }

    setSending(false);
    if (onSuccess && sent > 0) onSuccess();
    if (failed === 0) setTimeout(() => onClose(), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="relative overflow-hidden px-6 py-5 bg-gradient-to-r from-[#07152f] via-[#152b59] to-[#0b6b68]">
          <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-cyan-300/20 blur-2xl" />
          <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-300 to-emerald-400 text-[#07152f] flex items-center justify-center shadow-lg">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Verified Report Dispatch
              </h3>
              <p className="text-xs text-cyan-100/75">
                Premium multi-channel delivery for {orders.length} selected report{orders.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white/60 hover:bg-white/15 hover:text-white">
            <X className="h-4 w-4" />
          </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-px bg-slate-200 dark:bg-slate-800">
          <div className="bg-white px-4 py-2.5 dark:bg-slate-900"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Selected</p><p className="text-sm font-black text-cyan-700 dark:text-cyan-300">{orders.length}</p></div>
          <div className="bg-white px-4 py-2.5 dark:bg-slate-900"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Mode</p><p className="text-sm font-black text-violet-700 dark:text-violet-300">Verified</p></div>
          <div className="bg-white px-4 py-2.5 dark:bg-slate-900"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Security</p><p className={`text-sm font-black ${recipientCheck ? "text-emerald-700" : "text-amber-700"}`}>{recipientCheck ? "Ready" : "Review"}</p></div>
          <div className="bg-white px-4 py-2.5 dark:bg-slate-900"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Failures</p><p className={`text-sm font-black ${failedCount ? "text-rose-700" : "text-slate-700 dark:text-slate-200"}`}>{failedCount}</p></div>
        </div>

        <div className="space-y-4 p-6">
        {/* Channel Switcher */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Dispatch Medium
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "WHATSAPP", label: "WhatsApp" },
              { id: "EMAIL", label: "Email" },
              { id: "BOTH", label: "Both Channels" },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannel(c.id as any)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  channel === c.id
                    ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
                    : "border-slate-200 dark:border-slate-800 text-slate-600"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Notification Type
          </label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-semibold focus:outline-none"
          >
            <option value="REPORT_READY">Diagnostic Reports Published & Verified</option>
            <option value="ORDER_CONFIRMATION">Order Registered & Digital Receipt</option>
            <option value="PAYMENT_RECEIPT">Payment Reminder / Statement</option>
          </select>
        </div>

        {/* Custom note */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Optional Custom Staff Remark
          </label>
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="e.g. Please collect hardcopy report from counter #3"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none"
          />
        </div>

        {/* Selected Orders Mini List */}
        <div className="max-h-32 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 p-2 text-xs">
          {orders.map((o) => (
            <div key={o.id} className="py-1 flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                #{o.orderNumber} • {formatPatientFullName(o.patient)}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {channel === "EMAIL" ? o.patient?.email || "No email" : o.patient?.phone || "No phone"}
              </span>
            </div>

          ))}
        </div>

        <div className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-indigo-50 p-3 dark:border-cyan-900/70 dark:from-cyan-950/30 dark:to-indigo-950/30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">Dispatch intelligence</p>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                {channel === "BOTH" ? "Each recipient will receive through WhatsApp and Email." : `Each recipient will receive through ${channel === "WHATSAPP" ? "WhatsApp" : "Email"}.`}
              </p>
            </div>
            <ShieldCheck className="h-6 w-6 shrink-0 text-cyan-600" />
          </div>
          {failedCount > 0 && (
            <p className="mt-2 rounded-lg bg-rose-100 px-2 py-1.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
              {failedCount} recipient{failedCount === 1 ? "" : "s"} failed. Review contact details and retry the remaining dispatch.
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-[10px] font-semibold text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          <input type="checkbox" checked={recipientCheck} onChange={(e) => setRecipientCheck(e.target.checked)} className="mt-0.5 h-3.5 w-3.5 rounded text-emerald-600" />
          I verified the selected patients and approve dispatch of confidential report links through the chosen channel.
        </label>

        {/* Progress Bar */}
        {sending && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span>Dispatching: {successCount} of {orders.length} complete</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={handleBulkDispatch}
            className="px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5"
          >
            {sending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            <span>{recipientCheck ? `Dispatch ${orders.length} Verified Report${orders.length === 1 ? "" : "s"}` : "Verify recipients to dispatch"}</span>
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
