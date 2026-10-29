"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { communicationApi } from "@/lib/api";
import { formatPatientFullName } from "@/lib/patient-utils";
import {
  MessageSquare, Mail, Send, Share2, Check, CheckCheck, CheckCircle2,
  Copy, Phone, ExternalLink, QrCode, Sparkles, AlertTriangle, FileText,
  Download, ShieldCheck, User, RefreshCw, X, Eye, ArrowRight, Lock,
  Paperclip, Activity, Wifi, BellRing, BadgeCheck, SlidersHorizontal,
  ChevronDown, ChevronUp,
} from "lucide-react";

export type DispatchChannel = "WHATSAPP" | "EMAIL" | "BOTH";
export type WhatsAppGateway = "cloudapi" | "twilio" | "direct" | "gupshup";
export type EmailGateway = "smtp" | "sendgrid" | "mailto";
export type RecipientTarget = "PATIENT" | "DOCTOR" | "CUSTOM";
export type ReportTemplate =
  | "REPORT_READY" | "CRITICAL_ALERT" | "REPORT_SUMMARY"
  | "FOLLOWUP_REMINDER" | "RESULT_ABNORMAL" | "DOWNLOAD_LINK";

interface ReportDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: {
    id: string; orderId: string; orderNumber: string;
    reportReferenceId: string; testName: string; testCode: string;
    status: string; publishedAt: string; criticalFlag?: boolean;
    patient: { id: string; firstName: string; middleName?: string; lastName: string; uhid: string; phone?: string; email?: string };
    doctor?: { id: string; fullName: string; email?: string; phone?: string } | null;
    approvedBy?: { fullName: string; employeeCode: string } | null;
    deliveryStatus: string; reportUrl?: string;
  };
  onSuccess?: (details: { channel: string; recipient: string }) => void;
}

const TEMPLATES: { id: ReportTemplate; label: string; icon: string; desc: string; critical?: boolean }[] = [
  { id: "REPORT_READY",      label: "Report Ready & Verified",  icon: "📑", desc: "Standard delivery with full report link" },
  { id: "REPORT_SUMMARY",    label: "Clinical Summary Snapshot", icon: "🔬", desc: "Condensed values snapshot with portal link" },
  { id: "CRITICAL_ALERT",    label: "Critical Value Alert",      icon: "🚨", desc: "Urgent priority critical/panic notification", critical: true },
  { id: "RESULT_ABNORMAL",   label: "Abnormal Result Notice",    icon: "⚠️", desc: "Flagged values needing doctor consultation" },
  { id: "FOLLOWUP_REMINDER", label: "Follow-up Reminder",       icon: "📅", desc: "Post-report consultation reminder" },
  { id: "DOWNLOAD_LINK",     label: "Secure Download Link Only", icon: "🔗", desc: "Minimal message with download link" },
];

function DeliveryTimeline({ deliveryStatus }: { deliveryStatus: string }) {
  const n = deliveryStatus.toUpperCase();
  const read = n.includes("READ");
  const delivered = read || n.includes("DELIVERED");
  const sent = delivered || n.includes("SENT") || n.includes("DISPATCHED");
  const steps = [
    { label: "Sent", active: sent, Icon: Send },
    { label: "Delivered", active: delivered, Icon: CheckCheck },
    { label: "Read", active: read, Icon: Eye },
  ];
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <React.Fragment key={s.label}>
          <div className={`flex items-center gap-1 text-[10px] font-bold ${s.active ? "text-emerald-700" : "text-slate-400"}`}>
            <s.Icon className="h-3 w-3" /><span>{s.label}</span>
          </div>
          {i < 2 && <div className={`h-px w-4 ${s.active && steps[i + 1].active ? "bg-emerald-400" : "bg-slate-200"}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function WhatsAppPreview({ message, name, timestamp }: { message: string; name: string; timestamp: string }) {
  const renderLine = (line: string, idx: number) => {
    const parts = line.split(/(\*[^*]+\*)/g);
    return (
      <p key={idx} className={`leading-snug ${line === "" ? "mt-1" : ""}`}>
        {parts.map((p, i) =>
          p.startsWith("*") && p.endsWith("*")
            ? <strong key={i}>{p.slice(1, -1)}</strong>
            : <span key={i}>{p}</span>
        )}
      </p>
    );
  };
  return (
    <div className="flex flex-col h-full bg-[#e5ddd5] rounded-2xl overflow-hidden shadow-inner">
      <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="h-9 w-9 rounded-full bg-emerald-300 flex items-center justify-center text-[#075e54] font-black text-sm">{name.slice(0, 2).toUpperCase()}</div>
        <div>
          <p className="text-white text-sm font-bold">{name}</p>
          <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" /><p className="text-emerald-200 text-[10px]">LabCore Diagnostics</p></div>
        </div>
        <div className="ml-auto flex gap-3 text-white/70"><Phone className="h-4 w-4" /><Wifi className="h-4 w-4" /></div>
      </div>
      <div className="flex justify-center py-2"><span className="bg-white/70 text-[10px] text-slate-600 font-semibold px-3 py-1 rounded-full">{timestamp}</span></div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="ml-auto max-w-[88%]">
          <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm px-3 py-2 shadow-sm text-[11px] text-slate-800 space-y-0.5">
            {message.split("\n").map(renderLine)}
            <div className="flex items-center justify-end gap-1 mt-1.5">
              <span className="text-[9px] text-slate-500">{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
              <CheckCheck className="h-3 w-3 text-blue-500" />
            </div>
          </div>
          <p className="text-[9px] text-slate-400 text-right mt-0.5">LabCore ELIS • Verified Dispatch</p>
        </div>
      </div>
      <div className="bg-[#f0f0f0] px-3 py-2 flex items-center gap-2 border-t border-slate-200 shrink-0">
        <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[10px] text-slate-400">Message preview...</div>
        <div className="h-8 w-8 rounded-full bg-[#075e54] flex items-center justify-center"><Send className="h-3.5 w-3.5 text-white" /></div>
      </div>
    </div>
  );
}

function EmailPreview({ subject, body, name, reportUrl }: { subject: string; body: string; name: string; reportUrl: string }) {
  const renderLine = (line: string, idx: number) => {
    if (line === "━━━━━━━━━━━━━━━━━━━━") return <hr key={idx} className="border-slate-200 my-2" />;
    const parts = line.split(/(\*[^*]+\*)/g).map((p, i) =>
      p.startsWith("*") && p.endsWith("*") ? <strong key={i} className="text-slate-900">{p.slice(1, -1)}</strong> : <span key={i}>{p}</span>
    );
    return line ? <p key={idx}>{parts}</p> : <div key={idx} className="h-2" />;
  };
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
        <div className="flex gap-1.5 mb-2">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="space-y-0.5 text-[10px]">
          <div className="flex gap-2"><span className="font-bold text-slate-400 w-8">From:</span><span className="text-slate-700 font-semibold">reports@labcore.in</span></div>
          <div className="flex gap-2"><span className="font-bold text-slate-400 w-8">To:</span><span className="text-slate-700">{name}</span></div>
          <div className="flex gap-2"><span className="font-bold text-slate-400 w-8">Sub:</span><span className="text-blue-700 font-bold truncate">{subject}</span></div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-r from-[#07152f] to-[#1e3a8a] px-5 py-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center font-black text-[#07152f] text-xs">LC</div>
          <div><p className="text-white font-black text-sm">LabCore Diagnostics</p><p className="text-blue-200 text-[10px]">NABL ISO 15189:2022 Accredited</p></div>
          <div className="ml-auto"><BadgeCheck className="h-5 w-5 text-cyan-300" /></div>
        </div>
        <div className="px-5 py-4 space-y-2 text-[11px] text-slate-700 leading-relaxed">
          {body.split("\n").map(renderLine)}
          <div className="pt-2">
            <a href={reportUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#07152f] to-[#1e3a8a] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-opacity">
              <FileText className="h-3.5 w-3.5" />Open Verified Report<ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-[9px] text-slate-400 space-y-1">
          <p>LabCore Diagnostic &amp; Research Centre · Vadodara - 390007</p>
          <p>Confidential medical communication. © {new Date().getFullYear()} LabCore Diagnostics.</p>
          <div className="flex items-center gap-1.5 pt-0.5"><Lock className="h-3 w-3 text-emerald-500" /><span className="text-emerald-600 font-semibold">Secure · Encrypted · Authenticated</span></div>
        </div>
      </div>
    </div>
  );
}

export default function ReportDispatchModal({ isOpen, onClose, report, onSuccess }: ReportDispatchModalProps) {
  const [channel, setChannel] = useState<DispatchChannel>("WHATSAPP");
  const [waGateway, setWaGateway] = useState<WhatsAppGateway>("direct");
  const [emailGateway, setEmailGateway] = useState<EmailGateway>("mailto");
  const [recipient, setRecipient] = useState<RecipientTarget>("PATIENT");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [targetName, setTargetName] = useState("");
  const [ccDoctor, setCcDoctor] = useState(false);
  const [template, setTemplate] = useState<ReportTemplate>("REPORT_READY");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachPdf, setAttachPdf] = useState(false);
  const [preview, setPreview] = useState<"WA" | "EMAIL" | "QR">("WA");
  const [qrUrl, setQrUrl] = useState("");
  const [showAdv, setShowAdv] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [log, setLog] = useState<{ ts: string; ch: string; to: string; st: string }[]>([]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://labcore.in";
  const reportUrl = report.reportUrl || `${origin}/reports/order/${report.orderId}`;
  const isCritical = !!(report.criticalFlag || report.status.toUpperCase().includes("CRITICAL") || report.status.toUpperCase().includes("PANIC"));
  const fullName = formatPatientFullName(report.patient);
  const today = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  useEffect(() => {
    if (recipient === "PATIENT") {
      setTargetName(fullName); setPhone(report.patient.phone || ""); setEmail(report.patient.email || "");
    } else if (recipient === "DOCTOR") {
      setTargetName(report.doctor?.fullName || "Referring Doctor"); setPhone(report.doctor?.phone || ""); setEmail(report.doctor?.email || "");
    }
  }, [recipient, report, fullName]);

  useEffect(() => {
    if (isOpen) {
      setSuccess(null); setError(null); setConsent(false); setLog([]);
      setTemplate(isCritical ? "CRITICAL_ALERT" : "REPORT_READY");
    }
  }, [isOpen, isCritical]);

  useEffect(() => {
    const pn = targetName || fullName;
    const on = report.orderNumber; const ref = report.reportReferenceId; const test = report.testName;
    const approver = report.approvedBy?.fullName || "Authorized Pathologist";
    const doc = report.doctor?.fullName || "Self-Referral";
    const pubDate = report.publishedAt
      ? new Date(report.publishedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "Recently";
    let sub = ""; let msg = "";
    switch (template) {
      case "REPORT_READY":
        sub = `Diagnostic Report Ready & Verified — Order #${on} | LabCore Diagnostics`;
        msg = `*LABCORE DIAGNOSTICS | VERIFIED REPORT DOSSIER* 📑\n━━━━━━━━━━━━━━━━━━━━\nDear *${pn}*,\n\nYour diagnostic report for Order *#${on}* has been *verified and published*.\n\n🔖 *REPORT DETAILS*\n• Reference: *${ref}*\n• Order: *#${on}* | UHID: *${report.patient.uhid}*\n• Test: *${test}*\n• Verified By: *${approver}*\n• Referring Doctor: *Dr. ${doc}*\n• Published: *${pubDate}*\n\n📥 *OPEN YOUR SECURE REPORT:*\n${reportUrl}\n\n🔐 Digitally signed · QR verified · Confidential\nConsult *Dr. ${doc}* for clinical interpretation.\nFor assistance: +91 265 234 5678\n_LabCore Diagnostics • Precision | Verified | Trusted_`;
        break;
      case "CRITICAL_ALERT":
        sub = `🚨 URGENT CRITICAL ALERT — Order #${on} — ${pn}`;
        msg = `*🚨 LABCORE CRITICAL DIAGNOSTIC ALERT 🚨*\n\nATTN: *${pn}* & Dr. *${doc}*\n\nA *CRITICAL / PANIC VALUE* has been flagged in Order *#${on}*.\n⚠️ *Test: ${test}* | Ref: *${ref}*\nVerified by: *${approver}*\n\n🚑 *IMMEDIATE CLINICAL CONSULTATION STRONGLY ADVISED*\n\nAccess critical report:\n${reportUrl}\n\nLabCore Emergency STAT Desk: +91-265-234-9999\nTimestamp: ${new Date().toLocaleString("en-IN")}`;
        break;
      case "REPORT_SUMMARY":
        sub = `Lab Report Summary — ${test} | Order #${on} | LabCore`;
        msg = `*LABCORE DIAGNOSTICS — REPORT SUMMARY* 🔬\n\nDear *${pn}*,\n\nSummary for Order *#${on}*:\n🧪 *Test: ${test}*\n• Ref: *${ref}* | Status: *${report.status}*\n• Verified by: *${approver}* | Date: *${pubDate}*\n\n📥 Full report:\n${reportUrl}\n\n_Consult Dr. ${doc} for interpretation._\nLabCore Diagnostics`;
        break;
      case "RESULT_ABNORMAL":
        sub = `⚠️ Abnormal Result — Order #${on} — ${pn} | LabCore`;
        msg = `*LABCORE DIAGNOSTICS | ABNORMAL RESULT NOTICE* ⚠️\n\nDear *${pn}*,\n\nOrder *#${on}* contains values *outside normal reference range*.\n🔬 *Test: ${test}* | Ref: *${ref}*\n\n⚕️ *Consult Dr. ${doc} immediately.*\n\n📥 Access report:\n${reportUrl}\n\nFor questions: +91 265 234 5678\n_LabCore Diagnostics • Precision Pathology_`;
        break;
      case "FOLLOWUP_REMINDER":
        sub = `Follow-up Reminder — ${pn} | LabCore`;
        msg = `*LABCORE | FOLLOW-UP REMINDER* 📅\n\nDear *${pn}*,\n\nReminder for post-report consultation for Order *#${on}*.\n🩺 *Dr. ${doc}* | Test: *${test}*\n\nReport: ${reportUrl}\n📞 Schedule: +91 265 234 5678\n_LabCore Diagnostics_`;
        break;
      case "DOWNLOAD_LINK":
        sub = `Lab Report Download — Order #${on} | LabCore`;
        msg = `Dear *${pn}*,\n\nYour verified report (Order *#${on}*) is ready.\n📥 *Download:*\n${reportUrl}\n\n_Ref: ${ref} | LabCore Diagnostics_`;
        break;
    }
    setSubject(sub); setBody(msg);
  }, [template, targetName, fullName, report, reportUrl]);

  useEffect(() => {
    if (!isOpen) return;
    const clean = phone.replace(/\D/g, "");
    const fmt = clean.length === 10 ? `91${clean}` : clean;
    const waLink = fmt ? `https://wa.me/${fmt}?text=${encodeURIComponent(body)}` : reportUrl;
    QRCode.toDataURL(waLink, { width: 240, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } }).then(setQrUrl).catch(console.error);
  }, [isOpen, phone, body, reportUrl]);

  const quality = useMemo(() => {
    const score = [/dear|hello|attn/i.test(body), body.includes(report.orderNumber), body.includes("http"), body.length >= 80].filter(Boolean).length;
    return {
      score,
      label: score >= 3 ? "Dispatch ready" : score === 2 ? "Review recommended" : "Needs review",
      cls: score >= 3 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : score === 2 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-rose-700 bg-rose-50 border-rose-200",
    };
  }, [body, report.orderNumber]);

  const openWhatsApp = useCallback(() => {
    const clean = phone.replace(/\D/g, ""); const fmt = clean.length === 10 ? `91${clean}` : clean;
    window.open(fmt ? `https://wa.me/${fmt}?text=${encodeURIComponent(body)}` : `https://wa.me/?text=${encodeURIComponent(body)}`, "_blank");
    setLog(p => [{ ts: new Date().toLocaleTimeString("en-IN"), ch: "WhatsApp Web", to: phone || "—", st: "Opened" }, ...p]);
    setSuccess("Opened in WhatsApp Web!"); onSuccess?.({ channel: "WHATSAPP", recipient: phone });
  }, [phone, body, onSuccess]);

  const openMailto = useCallback(() => {
    const cc = ccDoctor && report.doctor?.email ? `&cc=${encodeURIComponent(report.doctor.email)}` : "";
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}${cc}`, "_blank");
    setLog(p => [{ ts: new Date().toLocaleTimeString("en-IN"), ch: "Mail Client", to: email || "—", st: "Opened" }, ...p]);
    setSuccess("Opened in your email client!"); onSuccess?.({ channel: "EMAIL", recipient: email });
  }, [email, subject, body, ccDoctor, report.doctor, onSuccess]);

  const dispatch = useCallback(async () => {
    if (!consent) { setError("Please verify the recipient before dispatching."); return; }
    if ((channel === "WHATSAPP" || channel === "BOTH") && !/^\+?[\d\s\-(]{8,}$/.test(phone)) { setError("Enter a valid WhatsApp number."); return; }
    if ((channel === "EMAIL" || channel === "BOTH") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address."); return; }
    if (channel === "WHATSAPP" && waGateway === "direct") { openWhatsApp(); return; }
    if (channel === "EMAIL" && emailGateway === "mailto") { openMailto(); return; }
    setSending(true); setSuccess(null); setError(null);
    try {
      let pdf64: string | undefined;
      if (attachPdf) {
        const pdf = new jsPDF();
        pdf.setFillColor(7, 21, 47); pdf.rect(0, 0, 210, 28, "F");
        pdf.setTextColor(255, 255, 255); pdf.setFontSize(13);
        pdf.text("LABCORE DIAGNOSTICS — VERIFIED REPORT", 14, 12);
        pdf.setFontSize(8); pdf.text("NABL ISO 15189:2022 Accredited", 14, 20);
        pdf.setTextColor(25, 35, 55); pdf.setFontSize(9); let y = 38;
        [
          `Order: ${report.orderNumber}`, `Ref: ${report.reportReferenceId}`,
          `Patient: ${fullName}`, `UHID: ${report.patient.uhid}`,
          `Test: ${report.testName}`, `Status: ${report.status}`,
          `Verified by: ${report.approvedBy?.fullName || "Authorized Pathologist"}`,
          "", "Access full report:", reportUrl, "", "Confidential medical document.",
        ].forEach(line => {
          const w = pdf.splitTextToSize(line, 180);
          if (y > 280) { pdf.addPage(); y = 18; }
          pdf.text(w, 14, y); y += w.length * 5 + (line === "" ? 2 : 1);
        });
        pdf64 = pdf.output("datauristring").split(",")[1];
      }
      const filename = `LabCore_Report_${report.orderNumber}.pdf`;
      if (channel === "WHATSAPP" || channel === "BOTH") {
        await communicationApi.sendWhatsApp({ patientId: report.patient.id, to: phone, message: body, ...(pdf64 ? { pdfBase64: pdf64, filename } : {}) });
        setLog(p => [{ ts: new Date().toLocaleTimeString("en-IN"), ch: "WhatsApp API", to: phone, st: "Sent" }, ...p]);
      }
      if (channel === "EMAIL" || channel === "BOTH") {
        await communicationApi.sendEmail({ patientId: report.patient.id, to: email, subject, body, ...(pdf64 ? { attachments: [{ filename, content: pdf64, contentType: "application/pdf" }] } : {}) });
        setLog(p => [{ ts: new Date().toLocaleTimeString("en-IN"), ch: "Email SMTP", to: email, st: "Sent" }, ...p]);
      }
      setSuccess(channel === "BOTH" ? "✅ Dispatched via WhatsApp & Email!" : channel === "WHATSAPP" ? "✅ WhatsApp dispatched!" : "✅ Email dispatched!");
      onSuccess?.({ channel, recipient: channel === "EMAIL" ? email : phone });
      setTimeout(onClose, 1500);
    } catch (e: any) {
      setError(e.message || "Dispatch failed. Use the direct fallback buttons.");
    } finally { setSending(false); }
  }, [consent, channel, waGateway, emailGateway, phone, email, attachPdf, subject, body, report, fullName, reportUrl, onSuccess, onClose, openWhatsApp, openMailto]);

  const copyMsg = useCallback(() => { navigator.clipboard.writeText(body); setCopied(true); setTimeout(() => setCopied(false), 2000); }, [body]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[94vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden" style={{ animation: "slideUp 0.22s ease-out" }}>

        {/* HEADER */}
        <div className={`relative overflow-hidden px-6 py-4 flex items-center justify-between shrink-0 ${isCritical ? "bg-gradient-to-r from-rose-900 via-rose-800 to-red-900" : "bg-gradient-to-r from-[#07152f] via-[#122b55] to-[#0b6b68]"}`}>
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg ${isCritical ? "bg-gradient-to-br from-rose-300 to-red-400" : "bg-gradient-to-br from-cyan-300 to-emerald-400"} text-[#07152f]`}>
              {isCritical ? <BellRing className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-white">{isCritical ? "🚨 Critical Report Dispatch" : "Report Communication Hub"}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-cyan-100 border border-white/15 font-mono">{report.reportReferenceId}</span>
                {isCritical && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-400/30 text-rose-100 border border-rose-300/30 animate-pulse">CRITICAL</span>}
              </div>
              <p className="text-xs text-cyan-100/70 mt-0.5">WhatsApp &amp; Email dispatch with live preview • {report.testName} • {fullName}</p>
            </div>
          </div>
          <div className="relative flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white"><ShieldCheck className="h-3.5 w-3.5 text-cyan-300" /> Verified</span>
            <button type="button" onClick={onClose} className="h-8 w-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-colors"><X className="h-4 w-4" /></button>
          </div>
        </div>

        {/* CHANNEL TABS */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 bg-white flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="flex items-center rounded-xl bg-slate-100 p-1 gap-0.5">
            {([
              { ch: "WHATSAPP" as DispatchChannel, label: "WhatsApp", Icon: MessageSquare, cls: "bg-emerald-600" },
              { ch: "EMAIL" as DispatchChannel, label: "Email", Icon: Mail, cls: "bg-blue-600" },
              { ch: "BOTH" as DispatchChannel, label: "Omni-Channel", Icon: Sparkles, cls: "bg-gradient-to-r from-emerald-600 to-blue-600" },
            ]).map(({ ch, label, Icon, cls }) => (
              <button key={ch} type="button" onClick={() => { setChannel(ch); setPreview(ch === "EMAIL" ? "EMAIL" : "WA"); }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${channel === ch ? `${cls} text-white shadow-sm` : "text-slate-500 hover:text-slate-900"}`}>
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setPreview("QR")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${preview === "QR" ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-700 border border-purple-200"}`}>
              <QrCode className="h-3.5 w-3.5" /> Counter QR
            </button>
            <DeliveryTimeline deliveryStatus={report.deliveryStatus} />
          </div>
        </div>

        {/* STATUS STRIP */}
        <div className="grid grid-cols-4 gap-px bg-slate-100 border-b border-slate-200 shrink-0">
          {[
            { label: "Channel", value: channel === "BOTH" ? "Omni-channel" : channel, cls: channel === "EMAIL" ? "text-blue-700" : "text-emerald-700" },
            { label: "Recipient", value: recipient === "PATIENT" ? fullName.split(" ")[0] : recipient === "DOCTOR" ? (report.doctor?.fullName?.split(" ")[0] || "Doctor") : "Custom", cls: "text-violet-700" },
            { label: "Message", value: quality.label, cls: quality.score >= 3 ? "text-emerald-700" : "text-amber-700" },
            { label: "Verified", value: consent ? "✓ Confirmed" : "Awaiting", cls: consent ? "text-emerald-700" : "text-amber-700" },
          ].map(item => (
            <div key={item.label} className="bg-white px-4 py-2">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
              <p className={`mt-0.5 text-[11px] font-black truncate ${item.cls}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12">

            {/* LEFT CONTROLS */}
            <div className="lg:col-span-7 p-5 space-y-4 border-r border-slate-100">
              {/* Recipient */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-400" /> Target Recipient</span>
                  <div className="flex rounded-lg bg-slate-200 p-0.5 text-[11px] font-bold">
                    {(["PATIENT", "DOCTOR", "CUSTOM"] as RecipientTarget[]).map(t => (
                      <button key={t} type="button" onClick={() => setRecipient(t)}
                        className={`px-2 py-0.5 rounded-md transition-all ${recipient === t ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>
                        {t[0] + t.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <MessageSquare className="h-3 w-3 text-emerald-500 inline mr-1" />WhatsApp
                    </label>
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91-9876543210"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-emerald-400 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <Mail className="h-3 w-3 text-blue-500 inline mr-1" />Email
                    </label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="patient@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-400 outline-none transition" />
                  </div>
                </div>
                {report.doctor?.email && (
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={ccDoctor} onChange={e => setCcDoctor(e.target.checked)} className="h-3.5 w-3.5 rounded text-blue-600" />
                    Auto CC Dr. {report.doctor.fullName} ({report.doctor.email})
                  </label>
                )}
              </div>

              {/* Templates */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-400" /> Communication Template
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map(t => (
                    <button key={t.id} type="button" onClick={() => setTemplate(t.id)} title={t.desc}
                      className={`p-2.5 rounded-xl text-left border transition-all text-xs flex items-start gap-2 ${
                        template === t.id
                          ? t.critical ? "border-rose-400 bg-rose-50 text-rose-800 shadow-sm" : "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}>
                      <span className="text-sm shrink-0">{t.icon}</span>
                      <div className="min-w-0">
                        <span className="block font-bold truncate">{t.label}</span>
                        <span className="block text-[10px] opacity-70 mt-0.5 truncate">{t.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Subject */}
              {(channel === "EMAIL" || channel === "BOTH") && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-blue-500" /> Email Subject</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-400 outline-none transition" />
                </div>
              )}

              {/* Message Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-slate-400" /> Message Body</label>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${quality.cls}`}>{quality.label}</span>
                    <button type="button" onClick={copyMsg} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-700">
                      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}{copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={7}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition font-mono resize-none" />
                <p className="text-[10px] text-slate-400 mt-1">{body.length} chars • Use *bold* for WhatsApp formatting</p>
              </div>

              {/* Advanced Settings */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <button type="button" onClick={() => setShowAdv(!showAdv)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-2"><SlidersHorizontal className="h-3.5 w-3.5" /> Advanced Gateway &amp; Delivery Settings</span>
                  {showAdv ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showAdv && (
                  <div className="px-4 pb-4 pt-3 bg-white space-y-3">
                    {(channel === "WHATSAPP" || channel === "BOTH") && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">WhatsApp Gateway</p>
                        <div className="flex flex-wrap gap-1.5">
                          {([["direct", "⚡ Web Direct (Free)"], ["cloudapi", "Meta Cloud API"], ["twilio", "Twilio"], ["gupshup", "Gupshup"]] as [WhatsAppGateway, string][]).map(([v, l]) => (
                            <button key={v} type="button" onClick={() => setWaGateway(v)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${waGateway === v ? "bg-emerald-600 text-white border-emerald-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{l}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {(channel === "EMAIL" || channel === "BOTH") && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Gateway</p>
                        <div className="flex flex-wrap gap-1.5">
                          {([["mailto", "📧 Mail Client (Free)"], ["smtp", "Hospital SMTP"], ["sendgrid", "SendGrid"]] as [EmailGateway, string][]).map(([v, l]) => (
                            <button key={v} type="button" onClick={() => setEmailGateway(v)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${emailGateway === v ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{l}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={attachPdf} onChange={e => setAttachPdf(e.target.checked)} className="h-4 w-4 rounded text-indigo-600" />
                      <div>
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5 text-slate-400" /> Attach report as PDF</span>
                        <p className="text-[10px] text-slate-400">Auto-generates a PDF summary for this report</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Consent Gate */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">Verified Clinical Dispatch</p>
                    <p className="text-[10px] text-amber-700 mt-0.5">Confirm recipient before sending confidential patient data.</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); if (e.target.checked) setError(null); }} className="h-3.5 w-3.5 rounded border-amber-400 text-emerald-600" />
                  <span className="text-xs font-semibold text-amber-900">I have verified the recipient and channel details.</span>
                </label>
              </div>

              {success && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-800">{success}</span>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span className="text-xs font-semibold text-rose-800">{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={dispatch} disabled={sending || !consent}
                  className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-black text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCritical ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700"
                    : channel === "EMAIL" ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"}`}>
                  {sending ? <><RefreshCw className="h-4 w-4 animate-spin" /> Dispatching...</> : <><Send className="h-4 w-4" /> {channel === "WHATSAPP" ? "Send via WhatsApp" : channel === "EMAIL" ? "Send via Email" : "Dispatch Both"}</>}
                </button>
                {(channel === "WHATSAPP" || channel === "BOTH") && (
                  <button type="button" onClick={openWhatsApp}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all">
                    <ExternalLink className="h-4 w-4" /> WA Web
                  </button>
                )}
                {(channel === "EMAIL" || channel === "BOTH") && (
                  <button type="button" onClick={openMailto}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all">
                    <ExternalLink className="h-4 w-4" /> Mail
                  </button>
                )}
              </div>

              {/* Dispatch Log */}
              {log.length > 0 && (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Dispatch Log</span>
                  </div>
                  {log.map((e, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 text-[10px] border-t border-slate-50 first:border-0">
                      <span className="font-mono text-slate-400">{e.ts}</span>
                      <span className="font-semibold text-slate-600">{e.ch}</span>
                      <span className="text-slate-400 truncate max-w-20">{e.to}</span>
                      <span className="font-bold text-emerald-600">{e.st}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Preview */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="px-4 pt-4 pb-3 flex items-center gap-2 border-b border-slate-100 flex-wrap">
                {([
                  { tab: "WA" as const, label: "WhatsApp", Icon: MessageSquare, cls: "bg-emerald-600" },
                  { tab: "EMAIL" as const, label: "Email", Icon: Mail, cls: "bg-blue-600" },
                  { tab: "QR" as const, label: "QR Pickup", Icon: QrCode, cls: "bg-purple-600" },
                ]).map(({ tab, label, Icon, cls }) => (
                  <button key={tab} type="button" onClick={() => setPreview(tab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${preview === tab ? `${cls} text-white` : "text-slate-500 hover:bg-slate-100"}`}>
                    <Icon className="h-3 w-3" />{label}
                  </button>
                ))}
              </div>
              <div className="flex-1 p-4 min-h-[400px]">
                {preview === "WA" && <WhatsAppPreview message={body} name={fullName} timestamp={today} />}
                {preview === "EMAIL" && <EmailPreview subject={subject} body={body} name={fullName} reportUrl={reportUrl} />}
                {preview === "QR" && (
                  <div className="flex flex-col items-center justify-center h-full gap-5 bg-gradient-to-br from-slate-50 to-purple-50/60 rounded-2xl border border-slate-200 p-6">
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-1.5 text-xs font-black text-purple-700 mb-3"><QrCode className="h-4 w-4" /> Counter QR Pickup</div>
                      <p className="text-sm font-bold text-slate-800">Patient scans at the counter</p>
                      <p className="text-[11px] text-slate-500 mt-1">Opens WhatsApp with pre-filled message</p>
                    </div>
                    {qrUrl
                      ? <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-200"><img src={qrUrl} alt="WhatsApp QR" className="h-48 w-48" /></div>
                      : <div className="h-48 w-48 rounded-2xl bg-slate-100 animate-pulse" />}
                    <p className="text-[11px] text-slate-400 text-center">{fullName} • {report.orderNumber}</p>
                    {qrUrl && (
                      <a href={qrUrl} download={`QR_${report.reportReferenceId}.png`}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors">
                        <Download className="h-3.5 w-3.5" /> Download QR PNG
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="px-4 pb-4">
                <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-slate-50 p-3 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-indigo-700">Report Info</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                    <div><span className="text-slate-400">Test: </span><span className="font-semibold text-slate-700 truncate">{report.testName}</span></div>
                    <div><span className="text-slate-400">Status: </span><span className="font-semibold text-emerald-700">{report.status}</span></div>
                    <div><span className="text-slate-400">UHID: </span><span className="font-semibold text-slate-700">{report.patient.uhid}</span></div>
                    <div><span className="text-slate-400">Doctor: </span><span className="font-semibold text-slate-700 truncate">{report.doctor?.fullName || "—"}</span></div>
                    <div className="col-span-2"><span className="text-slate-400">Ref: </span><span className="font-mono font-semibold text-indigo-700">{report.reportReferenceId}</span></div>
                  </div>
                  <div className="pt-1 border-t border-indigo-100">
                    <a href={reportUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors truncate">
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      {reportUrl.length > 48 ? reportUrl.slice(0, 48) + "…" : reportUrl}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
