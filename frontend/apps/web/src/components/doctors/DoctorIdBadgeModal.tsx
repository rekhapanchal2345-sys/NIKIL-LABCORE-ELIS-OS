"use client";

import React, { useRef, useState, useEffect } from "react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  X,
  Printer,
  Download,
  Share2,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  Award,
  Sparkles,
  QrCode as QrCodeIcon,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Stethoscope,
  MapPin,
  Calendar,
  CreditCard,
  FileBadge,
  CheckCircle,
} from "lucide-react";
import { DoctorProfileData } from "./DoctorQuickViewModal";
import { showSuccess } from "@/lib/notifications";

interface DoctorIdBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorProfileData | null;
}

export default function DoctorIdBadgeModal({
  isOpen,
  onClose,
  doctor,
}: DoctorIdBadgeModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const certRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<"card" | "certificate">("card");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const doctorName =
    doctor?.fullName ||
    doctor?.name ||
    [doctor?.firstName, doctor?.middleName, doctor?.lastName].filter(Boolean).join(" ") ||
    "Doctor";

  const cleanDocName = doctorName.startsWith("Dr") ? doctorName : `Dr. ${doctorName}`;
  const doctorCode = doctor?.doctorCode || `DOC-${doctor?.id || "REG"}`;
  const regNumber = doctor?.registrationNumber || doctor?.licenseNumber || "NMC-VERIFIED-2026";
  const clinic = doctor?.clinicName || "Apex Multispecialty Hospital";
  const clinicAddress =
    doctor?.clinicAddress ||
    [doctor?.address, doctor?.city, doctor?.state].filter(Boolean).join(", ") ||
    "Ring Road, Medical Complex, Ahmedabad - 380015";
  const phone = doctor?.phone || doctor?.whatsappNumber || "+91 98765 43210";
  const email = doctor?.email || "doctor.relations@labcore.in";
  const specialization = doctor?.specialization || "Consultant Physician";
  const qualification = doctor?.qualification || "MBBS, MD";

  const portalUrl = typeof window !== "undefined"
    ? `${window.location.origin}/portal/doctor/${doctorCode}`
    : `https://labcore.in/portal/doctor/${doctorCode}`;

  useEffect(() => {
    if (!doctor) return;
    const generateQR = async () => {
      try {
        const payload = JSON.stringify({
          type: "LABCORE_CLINICIAN_CREDENTIALS",
          code: doctorCode,
          name: cleanDocName,
          mci: regNumber,
          portal: portalUrl,
          lab: "LABCORE ENTERPRISE DIAGNOSTICS",
          nabl: "ISO 15189:2022",
        });
        const url = await QRCode.toDataURL(payload, {
          width: 200,
          margin: 1,
          color: {
            dark: "#0F172A",
            light: "#FFFFFF",
          },
        });
        setQrCodeDataUrl(url);
      } catch (err) {
        console.error("QR Code error:", err);
      }
    };
    generateQR();
  }, [doctor, doctorCode, cleanDocName, regNumber, portalUrl]);

  const handleDownloadPdf = async () => {
    const targetRef = activeView === "card" ? cardRef.current : certRef.current;
    if (!targetRef) return;
    setPdfGenerating(true);
    try {
      const canvas = await html2canvas(targetRef, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const isLandscape = activeView === "certificate";
      const pdf = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = isLandscape ? 297 : 210;
      const pageHeight = isLandscape ? 210 : 297;
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 10, 15, imgWidth, Math.min(imgHeight, pageHeight - 30));
      pdf.save(`Clinician_${activeView === "card" ? "Privilege_Card" : "Certificate"}_${doctorCode}.pdf`);
      showSuccess("PDF Document downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handlePrint = () => {
    const targetRef = activeView === "card" ? cardRef.current : certRef.current;
    if (!targetRef) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${cleanDocName} - LabCore Clinician Privilege Document</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', -apple-system, sans-serif;
              margin: 20mm;
              background: #FFFFFF;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            @media print {
              body { margin: 0; }
              @page { size: ${activeView === "certificate" ? "A4 landscape" : "A4 portrait"}; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          ${targetRef.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    showSuccess("Clinician Portal link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const rawPhone = phone.replace(/\D/g, "");
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const text = encodeURIComponent(
      `*LABCORE ENTERPRISE DIAGNOSTICS - CLINICIAN PRIVILEGE ACCREDITATION*\n\n` +
      `Respected ${cleanDocName},\n` +
      `Your digital clinician liaison ID credentials have been issued:\n\n` +
      `• *Practitioner:* ${cleanDocName} (${specialization})\n` +
      `• *LIS Clinician Code:* ${doctorCode}\n` +
      `• *Council Registration:* ${regNumber}\n` +
      `• *Chamber:* ${clinic}\n` +
      `• *Accreditation:* NABL ISO 15189:2022 Certified Partner\n\n` +
      `🔗 *Secure Clinician Portal Access:*\n${portalUrl}\n\n` +
      `_For critical panic test alerts and real-time specimen tracking, please bookmark your portal link._\n\n` +
      `LabCore Enterprise Diagnostics • 24x7 Helpline: +91 98765 43210`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  if (!isOpen || !doctor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[94vh]">
        
        {/* Header Bar - Light White Clinical Design */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shadow-xs">
              <FileBadge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  Doctor Privilege ID Badge & Accreditation
                </h3>
                <span className="font-mono text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                  {doctorCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Official Clinical Liaison Identification for <strong className="text-slate-800">{cleanDocName}</strong> • NABL ISO 15189:2022
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs font-bold mr-2">
              <button
                onClick={() => setActiveView("card")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeView === "card"
                    ? "bg-white text-sky-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Privilege Card
              </button>
              <button
                onClick={() => setActiveView("certificate")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeView === "certificate"
                    ? "bg-white text-sky-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Chamber Certificate
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              title="Print Badge"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={pdfGenerating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body Canvas */}
        <div className="p-6 overflow-y-auto bg-slate-50/70 flex flex-col items-center justify-center min-h-[460px]">
          
          {activeView === "card" ? (
            /* ========================================================
               1. POCKET SIZE PRIVILEGE IDENTITY CARD
               ======================================================== */
            <div
              ref={cardRef}
              className="w-full max-w-[480px] bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden relative"
              style={{ minHeight: "280px" }}
            >
              {/* Card Top Header Band */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between relative border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-sky-400 text-base">
                    L
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-wider uppercase text-white leading-tight">
                      LabCore Enterprise
                    </h4>
                    <p className="text-[10px] text-sky-300 font-bold tracking-tight">
                      CLINICAL REFERENCE NETWORK
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-md">
                    Accredited Partner
                  </span>
                  <p className="text-[8px] text-slate-400 mt-0.5">ISO 15189:2022 • CAP</p>
                </div>
              </div>

              {/* Card Main Body */}
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Doctor Avatar / Badge */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-sky-50 border-2 border-sky-200 flex items-center justify-center text-sky-700 text-2xl font-black shadow-xs">
                      {cleanDocName.replace(/^Dr\.\s*/i, "").charAt(0)}
                    </div>
                    <span className="text-[9px] font-mono font-black text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {doctorCode}
                    </span>
                  </div>

                  {/* Doctor Key Information */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-black text-slate-900 truncate">
                        {cleanDocName}
                      </h3>
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>

                    <p className="text-xs font-bold text-sky-700 mt-0.5">
                      {specialization} {qualification && `• ${qualification}`}
                    </p>

                    <div className="mt-2 space-y-1 text-[11px] text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>MCI/NMC Reg: <strong className="text-slate-800 font-mono">{regNumber}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Chamber: <strong className="text-slate-800">{clinic}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Ph: {phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scan QR for Live Portal */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-20 h-20 bg-white border border-slate-300 rounded-xl p-1 shadow-xs flex items-center justify-center">
                      {qrCodeDataUrl ? (
                        <img src={qrCodeDataUrl} alt="Doctor Portal QR" className="w-full h-full object-contain" />
                      ) : (
                        <QrCodeIcon className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <span className="text-[8px] font-extrabold text-slate-500 mt-1 uppercase tracking-tight">
                      Scan for Reports
                    </span>
                  </div>
                </div>

                {/* Card Micro Strip */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-semibold">
                  <span>Authorized Diagnostic Referral Partner</span>
                  <span className="font-mono text-slate-500">24x7 Helpline: +91 98765 43210</span>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================
               2. CHAMBER ACCREDITATION CERTIFICATE (A4 LANDSCAPE)
               ======================================================== */
            <div
              ref={certRef}
              className="w-full max-w-[720px] bg-white rounded-3xl border-2 border-slate-300 shadow-xl p-8 relative overflow-hidden"
              style={{ minHeight: "440px" }}
            >
              {/* Certificate Border Inset */}
              <div className="border border-slate-200 rounded-2xl p-6 relative bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-700 text-white flex items-center justify-center font-black text-xl shadow-xs">
                      L
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 tracking-tight">
                        LABCORE ENTERPRISE REFERENCE LABORATORIES
                      </h2>
                      <p className="text-[11px] font-bold text-teal-700 tracking-wide uppercase">
                        NABL ISO 15189:2022 ACCREDITED CLINICAL DIAGNOSTIC CENTER
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      CERT #{doctorCode}-2026
                    </span>
                  </div>
                </div>

                <div className="text-center my-6 space-y-2">
                  <span className="text-[10px] font-black tracking-widest text-sky-700 uppercase">
                    CERTIFICATE OF CLINICAL LIAISON ACCREDITATION
                  </span>
                  <p className="text-xs text-slate-500">
                    This official credential verifies that the medical practitioner registered below is an authorized partner of LabCore Enterprise Diagnostics:
                  </p>
                  
                  <div className="py-2">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                      {cleanDocName}
                    </h1>
                    <p className="text-xs font-bold text-slate-600">
                      {specialization} {qualification && `(${qualification})`}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-700">
                    <span>MCI / State Council Reg: <strong className="text-sky-800 font-mono">{regNumber}</strong></span>
                    <span>•</span>
                    <span>LIS Clinician ID: <strong className="text-sky-800 font-mono">{doctorCode}</strong></span>
                    <span>•</span>
                    <span>Chamber: <strong className="text-slate-900">{clinic}</strong></span>
                  </div>
                </div>

                {/* Bottom Details & Sign-off */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 items-end text-xs">
                  <div className="space-y-0.5 text-slate-500 text-[11px]">
                    <p className="font-bold text-slate-700">Practice Location:</p>
                    <p>{clinicAddress}</p>
                    <p>Phone: {phone}</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-white border border-slate-300 rounded-lg p-1 shadow-xs flex items-center justify-center">
                      {qrCodeDataUrl ? (
                        <img src={qrCodeDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                      ) : (
                        <QrCodeIcon className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 font-semibold">Live Clinician Portal</span>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="inline-block border-b-2 border-slate-400 w-32 mb-1"></div>
                    <p className="font-bold text-slate-900 text-xs">Medical Director</p>
                    <p className="text-[10px] text-slate-500">Quality Manager & Head Pathologist</p>
                    <p className="text-[9px] text-slate-400 font-mono">LABCORE ENTERPRISE LIS</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Action Bar */}
        <div className="bg-white px-6 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Share via WhatsApp</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedLink ? "Link Copied" : "Copy Portal Link"}</span>
            </button>

            <a
              href={portalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sky-700 hover:text-sky-900 text-xs font-bold hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Portal</span>
            </a>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
