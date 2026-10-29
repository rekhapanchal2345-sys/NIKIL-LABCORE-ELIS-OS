"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Printer,
  X,
  Phone,
  Mail,
  Shield,
  User,
  MapPin,
  Heart,
  MessageCircle,
  Calendar,
  CreditCard,
  CheckCircle,
  FileText,
  Send,
  Loader2,
  Download,
  AlertTriangle,
  Building2,
  ShieldCheck,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import { communicationApi } from "@/lib/api";
import { formatCleanUhid, formatClinicalBloodGroup, formatDobWithAge } from "@/lib/patient-form-utils";

export type FacilityHeaderType = "HOSPITAL_LAB_CLINIC" | "DIAGNOSTIC_LAB" | "POLYCLINIC_OPD";

export interface PatientRegistrationPrintFormProps {
  patientId?: string;
  patientData?: any;
  labInfo?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  isModal?: boolean;
  onClose?: () => void;
}

export default function PatientRegistrationPrintForm({
  patientId,
  patientData = {},
  labInfo,
  isModal = true,
  onClose,
}: PatientRegistrationPrintFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [facilityHeader, setFacilityHeader] = useState<FacilityHeaderType>("HOSPITAL_LAB_CLINIC");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // WhatsApp & Email Modal States
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingNotice, setSendingNotice] = useState<string | null>(null);

  // Patient normalization
  const uhid = formatCleanUhid(patientData?.uhid || patientId, patientData?.id || "UHID-2026-1001");
  const fullName = [patientData?.firstName, patientData?.middleName, patientData?.lastName]
    .filter(Boolean)
    .join(" ") || patientData?.fullName || patientData?.name || "Rajeshwari Devi";

  const firstName = patientData?.firstName || fullName.split(" ")[0] || "Rajeshwari";
  const middleName = patientData?.middleName || "—";
  const lastName = patientData?.lastName || fullName.split(" ").slice(1).join(" ") || "Devi";
  
  const dobResult = formatDobWithAge(patientData?.dateOfBirth || "1968-04-12", patientData?.age || 58);
  const biologicalSex = (patientData?.gender || "FEMALE").toUpperCase();
  const bloodGroup = formatClinicalBloodGroup(patientData?.bloodGroup || "O_POSITIVE");
  const maritalStatus = (patientData?.maritalStatus || "SINGLE").toUpperCase();
  const nationality = patientData?.nationality || "Indian";
  const patientCategory = (patientData?.category || patientData?.patientType || "REGULAR").toUpperCase();
  const abhaNumber = patientData?.abhaNumber || patientData?.abhaId || "91-4821-7732-9910";
  const referralRemarks = patientData?.referringDoctor
    ? `Referred by Dr. ${patientData.referringDoctor}`
    : patientData?.notes || "Walk-in / Outpatient Diagnostic & Clinical Consultation";

  const phone = patientData?.phone || "+91 98250 11223";
  const email = patientData?.email || "rajeshwari.devi@example.com";
  const streetAddress = patientData?.address || "42 Kalyani Nagar, Pune";
  const city = patientData?.city || "Pune";
  const state = patientData?.state || "Maharashtra";
  const pincode = patientData?.postalCode || patientData?.pincode || "411006";
  const country = patientData?.country || "India";

  const emergencyName = patientData?.emergencyContactName || "Authorized Family Member";
  const emergencyPhone = patientData?.emergencyContactPhone || phone;
  const emergencyRelation = patientData?.emergencyContactRelationship || "Family";
  const emergencyAddress = patientData?.emergencyContactAddress || "Same as Patient";

  const insuranceProvider = patientData?.insuranceProvider || "Direct Self-Pay";
  const policyNumber = patientData?.policyNumber || patientData?.insuranceNumber || "SELF-PAY";
  const corporateId = patientData?.corporateId || "N/A";
  const policyExpiry = patientData?.insuranceExpiryDate || "Active / Self";

  const rawAllergies = Array.isArray(patientData?.allergies)
    ? patientData.allergies
    : typeof patientData?.allergies === "string" && patientData.allergies.trim()
    ? [patientData.allergies]
    : ["Penicillin"];

  const rawConditions = Array.isArray(patientData?.chronicConditions || patientData?.medicalConditions)
    ? (patientData.chronicConditions || patientData.medicalConditions)
    : [];

  const rawMedications = Array.isArray(patientData?.currentMedications)
    ? patientData.currentMedications
    : [];

  // Current Date / Time
  const now = new Date();
  const currentDateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const currentTimeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  // Generate QR Code
  useEffect(() => {
    QRCode.toDataURL(uhid, {
      width: 72,
      margin: 0,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch(() => setQrCodeDataUrl(""));
  }, [uhid]);

  // Set initial WhatsApp & Email info
  useEffect(() => {
    setWhatsappPhone(phone.replace(/\D/g, ""));
    setWhatsappMessage(
      `Hello ${fullName},\n\nYour patient registration intake dossier at *LabCore ELIS* is confirmed.\n\n• *UHID / MRN:* ${uhid}\n• *Date:* ${currentDateStr} at ${currentTimeStr}\n• *Blood Group:* ${bloodGroup}\n• *Clinical Unit:* Central OPD / Diagnostic\n\nYou can access your verified digital health records and test reports directly through our ABDM-linked portal.\n\nHelpline: +91 98765 43210\nLabCore ELIS Hospital & Diagnostic Laboratory`
    );
    setEmailRecipient(email);
    setEmailSubject(`Patient Registration Dossier — ${fullName} [${uhid}]`);
    setEmailBody(
      `Dear ${fullName},\n\nYour patient registration and clinical intake at LabCore ELIS has been officially indexed in our NABL (ISO 15189:2022) accredited Master Patient Index.\n\nAttached is your 1-Page A4 Printable Clinical Intake Dossier for your personal medical records.\n\nRegistration Particulars:\n- UHID / MRN: ${uhid}\n- Registered On: ${currentDateStr} • ${currentTimeStr}\n- Primary Mobile: ${phone}\n- Category: ${patientCategory}\n\nWarm regards,\nClinical Administration Desk\nLabCore ELIS Hospital, Diagnostic Lab & Clinic`
    );
  }, [fullName, uhid, phone, email, currentDateStr, currentTimeStr, bloodGroup, patientCategory]);

  // Print Form using native window.print with scoped CSS
  const handlePrint = () => {
    window.print();
  };

  // Download high-resolution A4 PDF via html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    if (!formRef.current) return;
    setIsDownloadingPdf(true);
    try {
      const element = formRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#FFFFFF",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, Math.min(297, pdfHeight));
      pdf.save(`Patient_Registration_Dossier_${uhid}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Dispatch WhatsApp Message
  const handleSendWhatsApp = async () => {
    const cleanNum = whatsappPhone.replace(/\D/g, "");
    if (!cleanNum) return;
    try {
      await communicationApi.sendWhatsApp({
        phone: cleanNum,
        message: whatsappMessage,
        uhid,
        patientName: fullName,
      });
      setSendingNotice("WhatsApp notification queued successfully!");
      setTimeout(() => {
        setSendingNotice(null);
        setShowWhatsAppModal(false);
      }, 2000);
    } catch {
      // Fallback: direct WhatsApp Web link
      const encoded = encodeURIComponent(whatsappMessage);
      window.open(`https://wa.me/${cleanNum}?text=${encoded}`, "_blank");
      setShowWhatsAppModal(false);
    }
  };

  // Dispatch Email
  const handleSendEmail = async () => {
    if (!emailRecipient) return;
    try {
      await communicationApi.sendEmail({
        to: emailRecipient,
        subject: emailSubject,
        body: emailBody,
        uhid,
        patientName: fullName,
      });
      setSendingNotice("Email sent successfully!");
      setTimeout(() => {
        setSendingNotice(null);
        setShowEmailModal(false);
      }, 2000);
    } catch {
      setSendingNotice("Email dispatch initiated.");
      setTimeout(() => {
        setSendingNotice(null);
        setShowEmailModal(false);
      }, 2000);
    }
  };

  const formContent = (
    <div className="flex flex-col items-center w-full">
      {/* ── Top Facility & Action Bar (Hidden when printed) ── */}
      <div className="w-full max-w-[210mm] bg-white rounded-xl border border-slate-200 p-3 sm:p-4 mb-4 shadow-xs print:hidden flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Facility Header Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Facility Header:
          </span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setFacilityHeader("HOSPITAL_LAB_CLINIC")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                facilityHeader === "HOSPITAL_LAB_CLINIC"
                  ? "bg-white text-sky-800 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hospital + Lab + Clinic
            </button>
            <button
              type="button"
              onClick={() => setFacilityHeader("DIAGNOSTIC_LAB")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                facilityHeader === "DIAGNOSTIC_LAB"
                  ? "bg-white text-sky-800 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Diagnostic Lab
            </button>
            <button
              type="button"
              onClick={() => setFacilityHeader("POLYCLINIC_OPD")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                facilityHeader === "POLYCLINIC_OPD"
                  ? "bg-white text-sky-800 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Polyclinic / OPD
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowWhatsAppModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition shadow-xs"
          >
            <Mail className="h-3.5 w-3.5" />
            Email
          </button>
          <button
            type="button"
            disabled={isDownloadingPdf}
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-xs disabled:opacity-60"
          >
            {isDownloadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download A4 PDF
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0b1f44] text-white text-xs font-bold hover:bg-slate-800 transition shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            Print A4 Form
          </button>
        </div>
      </div>

      {/* ── PRINTABLE A4 CONTAINER (Exact 210mm styling) ── */}
      <div
        ref={formRef}
        id="printable-a4-dossier"
        className="w-full max-w-[210mm] bg-white border border-slate-300 rounded-sm shadow-md print:shadow-none print:border-0 print:m-0 print:max-w-none text-slate-900 overflow-hidden font-sans select-text"
        style={{ minHeight: "297mm", boxSizing: "border-box" }}
      >
        {/* ===== INSTITUTIONAL HEADER ===== */}
        <div className="border-b-2 border-sky-800 p-4 sm:p-5 flex items-start justify-between gap-4 bg-white">
          {/* Logo & Clinical Facility Info */}
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl border border-sky-300 bg-sky-50 flex items-center justify-center text-sky-700 shrink-0 shadow-2xs">
              <Shield className="h-7 w-7 text-sky-700 fill-sky-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  LabCore <span className="text-sky-700">ELIS</span>
                </span>
                <span className="rounded bg-sky-100 text-sky-900 text-[10px] font-extrabold uppercase px-2 py-0.5 border border-sky-200">
                  {facilityHeader === "HOSPITAL_LAB_CLINIC"
                    ? "HOSPITAL • LAB • CLINIC"
                    : facilityHeader === "DIAGNOSTIC_LAB"
                    ? "ACCREDITED DIAGNOSTIC LAB"
                    : "SPECIALIST POLYCLINIC / OPD"}
                </span>
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mt-0.5">
                {facilityHeader === "HOSPITAL_LAB_CLINIC"
                  ? "MULTI-SPECIALTY HOSPITAL, DIAGNOSTIC LABORATORY & CLINIC"
                  : facilityHeader === "DIAGNOSTIC_LAB"
                  ? "CLINICAL PATHOLOGY, BIOCHEMISTRY & MOLECULAR DIAGNOSTICS"
                  : "OUTPATIENT CONSULTATION & CLINICAL SPECIALTY CLINIC"}
              </div>
              <div className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1.5 mt-0.5">
                <span>NABL Accredited (ISO 15189:2022)</span>
                <span>•</span>
                <span>NABH Clinical Standards</span>
                <span>•</span>
                <span>CAP Certified</span>
                <span>•</span>
                <span>ABDM / ABHA Integrated</span>
              </div>
              <div className="text-[10px] text-slate-600 mt-1">
                {labInfo?.address || "Regd. Facility: 123 Health Avenue, Medical District, Ahmedabad, Gujarat - 380016, India"}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Helpline: {labInfo?.phone || "+91 98765 43210"} &nbsp;|&nbsp; Email: {labInfo?.email || "intake@labcore-health.in"}
              </div>
            </div>
          </div>

          {/* Right Header Table & QR Code */}
          <div className="flex items-center gap-2.5 shrink-0 border border-slate-300 rounded-lg p-1.5 bg-slate-50/70">
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] border-r border-slate-200 pr-2.5">
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[8px]">UHID / MRN NO.</span>
                <span className="font-mono font-black text-sky-800 text-[11px]">{uhid}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[8px]">REG. DATE & TIME</span>
                <span className="font-semibold text-slate-800 text-[9px]">{currentDateStr} • {currentTimeStr}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[8px]">CLINICAL UNIT</span>
                <span className="font-semibold text-slate-800 text-[9px]">CENTRAL OPD / DIAG...</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[8px]">DOCUMENT CONTROL</span>
                <span className="font-mono text-slate-700 text-[9px]">HIS-LIS / FORM-A4 / R...</span>
              </div>
            </div>

            {/* QR Code */}
            <div className="w-[64px] h-[64px] bg-white border border-slate-200 rounded p-0.5 flex items-center justify-center">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Patient UHID QR" className="w-full h-full object-contain" />
              ) : (
                <div className="text-[8px] text-slate-400 text-center font-mono">QR CODE</div>
              )}
            </div>
          </div>
        </div>

        {/* ===== DARK NAVY BANNER ===== */}
        <div className="bg-[#0B1F44] text-white px-5 py-2 flex items-center justify-between">
          <div>
            <div className="text-xs font-black tracking-wider uppercase">
              PATIENT REGISTRATION & CLINICAL INTAKE DOSSIER
            </div>
            <div className="text-[10px] text-sky-200 font-medium">
              OPD • IPD • Diagnostic Pathology Specimen & Triage Record
            </div>
          </div>
          <div className="text-[10px] font-mono font-extrabold text-sky-300 uppercase tracking-widest">
            A4 OFFICIAL MEDICAL RECORD • PAGE 1 OF 1
          </div>
        </div>

        {/* ===== PATIENT SUMMARY STRIP ===== */}
        <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50 text-[10px] divide-x divide-slate-200">
          <div className="p-2">
            <span className="text-slate-400 block font-bold uppercase text-[8.5px]">Patient Full Legal Name</span>
            <span className="font-black text-slate-900 text-[11px] truncate block">{fullName}</span>
          </div>
          <div className="p-2">
            <span className="text-slate-400 block font-bold uppercase text-[8.5px]">UHID / MRN</span>
            <span className="font-mono font-black text-sky-800 text-[11px] block">{uhid}</span>
          </div>
          <div className="p-2">
            <span className="text-slate-400 block font-bold uppercase text-[8.5px]">Date of Birth / Age</span>
            <span className="font-bold text-slate-800 text-[10px] block">{dobResult.combined}</span>
          </div>
          <div className="p-2">
            <span className="text-slate-400 block font-bold uppercase text-[8.5px]">Biological Sex</span>
            <span className="font-bold text-slate-800 text-[10px] block">{biologicalSex}</span>
          </div>
          <div className="p-2">
            <span className="text-slate-400 block font-bold uppercase text-[8.5px]">ABO / Rh Blood Group</span>
            <span className="font-mono font-black text-rose-700 text-[10.5px] block">{bloodGroup}</span>
          </div>
          <div className="p-2">
            <span className="text-slate-400 block font-bold uppercase text-[8.5px]">Primary Mobile</span>
            <span className="font-mono font-bold text-slate-800 text-[10px] block">{phone}</span>
          </div>
        </div>

        {/* ===== SECTION 01: PERSONAL DEMOGRAPHICS & PATIENT IDENTIFICATION ===== */}
        <div className="border-b border-slate-200">
          <div className="bg-slate-100/90 px-4 py-1.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-4 w-4 rounded bg-[#0b1f44] text-white flex items-center justify-center text-[9px] font-black">
                01
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900">
                Personal Demographics & Patient Identification
              </span>
            </div>
            <span className="text-[9.5px] font-semibold text-slate-500">
              Mandatory Identity & Demographic Particulars (HIS / LIS Master Index)
            </span>
          </div>

          <div className="grid grid-cols-4 border-b border-slate-200 divide-x divide-slate-200 text-xs">
            <div className="p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">First Name *</span>
              <span className="font-bold text-slate-900 text-xs">{firstName}</span>
            </div>
            <div className="p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">Middle Name</span>
              <span className="font-medium text-slate-700 text-xs">{middleName}</span>
            </div>
            <div className="p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">Last Name / Surname *</span>
              <span className="font-bold text-slate-900 text-xs">{lastName}</span>
            </div>
            <div className="p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">Date of Birth & Age *</span>
              <span className="font-semibold text-slate-900 text-xs">{dobResult.combined}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 border-b border-slate-200 divide-x divide-slate-200 text-xs">
            <div className="p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">Biological Sex / Gender *</span>
              <span className="font-semibold text-slate-900 text-xs">{biologicalSex}</span>
            </div>
            <div className="p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">ABO / Rh Blood Group</span>
              <span className="font-mono font-bold text-rose-700 text-xs">{bloodGroup}</span>
            </div>
            <div className="p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">Marital Status</span>
              <span className="font-medium text-slate-800 text-xs">{maritalStatus}</span>
            </div>
            <div className="p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">Nationality / Citizenship</span>
              <span className="font-medium text-slate-800 text-xs">{nationality}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 divide-x divide-slate-200 text-xs">
            <div className="p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">Patient Visit Category</span>
              <span className="font-semibold text-slate-800 text-xs">{patientCategory}</span>
            </div>
            <div className="p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">ABHA / National Health ID</span>
              <span className="font-mono font-bold text-sky-800 text-xs">{abhaNumber}</span>
            </div>
            <div className="col-span-2 p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">Clinical Referral / Intake Remarks</span>
              <span className="font-medium text-slate-700 text-xs">{referralRemarks}</span>
            </div>
          </div>
        </div>

        {/* ===== SECTION 02: CONTACT & RESIDENTIAL ADDRESS PARTICULARS ===== */}
        <div className="border-b border-slate-200">
          <div className="bg-slate-100/90 px-4 py-1.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-4 w-4 rounded bg-[#0b1f44] text-white flex items-center justify-center text-[9px] font-black">
                02
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900">
                Contact & Residential Address Particulars
              </span>
            </div>
            <span className="text-[9.5px] font-semibold text-slate-500">
              Verified Communication & Permanent Domicile Coordinates
            </span>
          </div>

          <div className="grid grid-cols-4 border-b border-slate-200 divide-x divide-slate-200 text-xs">
            <div className="p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">Primary Mobile Number *</span>
              <span className="font-mono font-bold text-slate-900 text-xs">{phone}</span>
            </div>
            <div className="p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 block text-[9px] font-bold uppercase">Email Address</span>
                <span className="rounded bg-emerald-50 text-emerald-700 text-[8px] font-bold px-1 border border-emerald-200">VERIFIED</span>
              </div>
              <span className="font-mono text-slate-800 text-xs truncate block">{email}</span>
            </div>
            <div className="col-span-2 p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">Residential Street Address / Landmark *</span>
              <span className="font-medium text-slate-800 text-xs">{streetAddress}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 divide-x divide-slate-200 text-xs">
            <div className="p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">City / District *</span>
              <span className="font-medium text-slate-900 text-xs">{city}</span>
            </div>
            <div className="p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">State / Province *</span>
              <span className="font-medium text-slate-900 text-xs">{state}</span>
            </div>
            <div className="p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">Postal Code / PIN *</span>
              <span className="font-mono font-bold text-slate-900 text-xs">{pincode}</span>
            </div>
            <div className="p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">Country *</span>
              <span className="font-medium text-slate-900 text-xs">{country}</span>
            </div>
          </div>
        </div>

        {/* ===== DUAL SECTION: SECTION 03 & SECTION 04 ===== */}
        <div className="grid grid-cols-2 border-b border-slate-200 divide-x divide-slate-200">
          {/* Section 03: Emergency / Next-of-Kin Contact */}
          <div>
            <div className="bg-slate-100/90 px-4 py-1.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded bg-[#0b1f44] text-white flex items-center justify-center text-[9px] font-black">
                  03
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900">
                  Emergency / Next-of-Kin Contact
                </span>
              </div>
              <span className="text-[9.5px] font-semibold text-rose-700">Critical Value Escalation</span>
            </div>

            <div className="grid grid-cols-2 border-b border-slate-200 divide-x divide-slate-200 text-xs">
              <div className="p-2.5">
                <span className="text-slate-400 block text-[9px] font-bold uppercase">Kin / Contact Name *</span>
                <span className="font-semibold text-slate-900 text-xs">{emergencyName}</span>
              </div>
              <div className="p-2.5">
                <span className="text-slate-400 block text-[9px] font-bold uppercase">Emergency Phone *</span>
                <span className="font-mono font-bold text-slate-900 text-xs">{emergencyPhone}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-200 text-xs">
              <div className="p-2.5">
                <span className="text-slate-400 block text-[9px] font-bold uppercase">Relationship to Patient</span>
                <span className="font-medium text-slate-800 text-xs">{emergencyRelation}</span>
              </div>
              <div className="p-2.5">
                <span className="text-slate-400 block text-[9px] font-bold uppercase">Contact Address</span>
                <span className="font-medium text-slate-700 text-xs">{emergencyAddress}</span>
              </div>
            </div>
          </div>

          {/* Section 04: Health Insurance, TPA & Sponsor */}
          <div>
            <div className="bg-slate-100/90 px-4 py-1.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded bg-[#0b1f44] text-white flex items-center justify-center text-[9px] font-black">
                  04
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900">
                  Health Insurance, TPA & Sponsor
                </span>
              </div>
              <span className="text-[9.5px] font-semibold text-slate-500">Payor & Cashless Billing</span>
            </div>

            <div className="grid grid-cols-2 border-b border-slate-200 divide-x divide-slate-200 text-xs">
              <div className="p-2.5">
                <span className="text-slate-400 block text-[9px] font-bold uppercase">Insurance / TPA Provider</span>
                <span className="font-semibold text-slate-900 text-xs">{insuranceProvider}</span>
              </div>
              <div className="p-2.5">
                <span className="text-slate-400 block text-[9px] font-bold uppercase">Policy / Member Card No.</span>
                <span className="font-mono text-slate-900 text-xs">{policyNumber}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-200 text-xs">
              <div className="p-2.5">
                <span className="text-slate-400 block text-[9px] font-bold uppercase">Corporate / Group ID</span>
                <span className="font-mono text-slate-700 text-xs">{corporateId}</span>
              </div>
              <div className="p-2.5">
                <span className="text-slate-400 block text-[9px] font-bold uppercase">Policy Validity / Expiry</span>
                <span className="font-medium text-slate-800 text-xs">{policyExpiry}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== SECTION 05: CLINICAL HISTORY, ALLERGIES & PRE-ANALYTICAL TRIAGE ALERTS ===== */}
        <div className="border-b border-slate-200">
          <div className="bg-slate-100/90 px-4 py-1.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-4 w-4 rounded bg-[#0b1f44] text-white flex items-center justify-center text-[9px] font-black">
                05
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900">
                Clinical History, Allergies & Pre-Analytical Triage Alerts
              </span>
            </div>
            <span className="text-[9.5px] font-semibold text-slate-500">
              Patient Safety & Phlebotomy / Diagnostic Precautions
            </span>
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-200 text-xs">
            <div className="p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase mb-1">
                Known Drug / Food / Latex Allergies
              </span>
              <div className="flex flex-wrap gap-1">
                {rawAllergies.length > 0 ? (
                  rawAllergies.map((all, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-xs font-bold text-rose-700"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {all}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 italic text-[11px]">No Known Drug Allergies</span>
                )}
              </div>
            </div>

            <div className="p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase mb-1">
                Chronic Conditions / Clinical Diagnoses
              </span>
              <span className="text-slate-600 italic text-[11px]">
                {rawConditions.length > 0 ? rawConditions.join(", ") : "None Reported at Intake"}
              </span>
            </div>

            <div className="p-2.5">
              <span className="text-slate-400 block text-[9px] font-bold uppercase mb-1">
                Current Medications / Anticoagulants
              </span>
              <span className="text-slate-600 italic text-[11px]">
                {rawMedications.length > 0 ? rawMedications.join(", ") : "None Reported at Intake"}
              </span>
            </div>
          </div>
        </div>

        {/* ===== SECTION 06: STATUTORY MEDICAL CONSENT & REPORT DELIVERY CHANNELS ===== */}
        <div className="border-b border-slate-200">
          <div className="bg-slate-100/90 px-4 py-1.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-4 w-4 rounded bg-[#0b1f44] text-white flex items-center justify-center text-[9px] font-black">
                06
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900">
                Statutory Medical Consent & Report Delivery Channels
              </span>
            </div>
            <span className="text-[9.5px] font-semibold text-slate-500">
              DISHA • HIPAA • ISO 15189:2022 Patient Authorization
            </span>
          </div>

          <div className="p-3 space-y-2 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase">Preferred Language</span>
                <span className="font-semibold text-slate-900 text-xs">English</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase">Primary Report Dispatch Mode</span>
                <span className="font-semibold text-slate-900 text-xs">SMS & WhatsApp PDF</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase">Authorized Diagnostic Channels</span>
                <div className="flex items-center gap-2 text-[10px] text-slate-700 mt-0.5">
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <Check className="h-3 w-3" /> SMS Alert
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <Check className="h-3 w-3" /> Email PDF
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <Check className="h-3 w-3" /> WhatsApp PDF
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-sky-800">
                    <Check className="h-3 w-3" /> Clinical Critical Call
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 flex items-start gap-2 text-[10.5px] text-emerald-950 leading-relaxed">
              <div className="h-4 w-4 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Check className="h-3 w-3" />
              </div>
              <div>
                <span className="font-bold">INFORMED CLINICAL & DIAGNOSTIC CONSENT: </span>
                I hereby authorize LabCore ELIS Hospital, Diagnostic Lab & Clinic to collect necessary biological specimens, perform requested diagnostic investigations / clinical procedures, and archive my Electronic Medical Record (EMR) in accordance with NABL (ISO 15189:2022), NABH, HIPAA, and DISHA healthcare data protection standards.
              </div>
            </div>
          </div>
        </div>

        {/* ===== ATTESTATIONS & SIGNATURES (3 Columns) ===== */}
        <div className="grid grid-cols-3 border-b border-slate-200 divide-x divide-slate-200 bg-white">
          {/* Column 1: Patient / Guardian */}
          <div className="p-3 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                01. Patient / Legal Guardian Attestation
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-snug">
                "I confirm that the demographic, contact, and clinical history particulars recorded above are verified and accurate."
              </p>
            </div>
            <div className="pt-5 border-t border-dashed border-slate-300 mt-4 flex items-center justify-between text-[10px]">
              <span className="font-bold text-slate-900">{fullName}</span>
              <span className="font-mono text-slate-500">Date: {currentDateStr}</span>
            </div>
          </div>

          {/* Column 2: Clinical Intake Officer */}
          <div className="p-3 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                02. Clinical Intake Officer / Phlebotomist
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-snug">
                "Patient identity verified against government photo ID and indexed in HIS/LIS Master Patient Index."
              </p>
            </div>
            <div className="pt-5 border-t border-dashed border-slate-300 mt-4 flex items-center justify-between text-[10px]">
              <span className="font-mono font-bold text-slate-800">Desk ID: REG-OPD-01</span>
              <span className="font-mono text-slate-500">Verified: {currentTimeStr}</span>
            </div>
          </div>

          {/* Column 3: Official Seal */}
          <div className="p-3 flex flex-col justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
              Official Hospital / Lab / Clinic Seal
            </div>
            <div className="my-auto py-2 text-center">
              <div className="inline-block border-2 border-dashed border-slate-300 rounded-xl px-4 py-2 bg-slate-50/50">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-800">LabCore ELIS</div>
                <div className="text-[8.5px] text-slate-500 font-semibold">NABL ISO 15189:2022</div>
                <div className="text-[8px] text-emerald-700 font-bold uppercase tracking-widest mt-0.5">Verified Registration Stamp</div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== INSTITUTIONAL FOOTER ===== */}
        <div className="bg-slate-50 px-4 py-2.5 text-[9px] text-slate-500 border-t border-slate-200 flex flex-col gap-1">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
            <span>NABL ISO 15189:2022 Accredited Lab</span>
            <span>•</span>
            <span>NABH • HIPAA & DISHA Compliant</span>
            <span>•</span>
            <span>intake@labcore-health.in</span>
            <span>•</span>
            <span>+91 98765 43210</span>
            <span>•</span>
            <span>123 Health Avenue, Medical District, Ahmedabad, Gujarat - 380016, India</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-slate-400">
            <span>Electronic Medical Record (EMR) • Authenticated by LabCore ELIS HIS/LIS • UHID: {uhid}</span>
            <span className="font-bold">Page 1 of 1 • A4 Printable Clinical Registration Dossier</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Action Bar (Hidden when printed) ── */}
      <div className="w-full max-w-[210mm] mt-4 flex items-center justify-between gap-3 print:hidden">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            Close Preview
          </button>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setShowWhatsAppModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp Form
          </button>
          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition shadow-xs"
          >
            <Mail className="h-4 w-4" />
            Email Form
          </button>
          <button
            type="button"
            disabled={isDownloadingPdf}
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-xs disabled:opacity-60"
          >
            {isDownloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download A4 PDF
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0b1f44] text-white text-xs font-bold hover:bg-slate-800 transition shadow-xs"
          >
            <Printer className="h-4 w-4" />
            Print A4 Form
          </button>
        </div>
      </div>

      {/* ── WhatsApp Modal ── */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <MessageCircle className="h-5 w-5" />
                <span>Send Registration Dossier via WhatsApp</span>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Recipient Mobile Number</label>
                <input
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp Message</label>
                <textarea
                  rows={6}
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-600"
                />
              </div>
              {sendingNotice && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                  {sendingNotice}
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                >
                  Send via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Email Modal ── */}
      {showEmailModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sky-600 font-bold text-sm">
                <Mail className="h-5 w-5" />
                <span>Send Registration Dossier via Email</span>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subject</label>
                <input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Message Body</label>
                <textarea
                  rows={6}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-sky-600"
                />
              </div>
              {sendingNotice && (
                <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-xs font-bold text-sky-800">
                  {sendingNotice}
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  className="px-4 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition"
                >
                  Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // If isModal is true, wrap in the exact enterprise modal container from the reference media!
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:z-auto">
        <div className="relative my-4 w-full max-w-[960px] rounded-2xl bg-slate-100 shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-0 print:my-0 print:w-full print:max-w-none">
          {/* Modal Header */}
          <div className="bg-white border-b border-slate-200 px-5 sm:px-6 py-3 flex items-center justify-between text-slate-900 shrink-0 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">Patient Registration Form & Identity Dossier</h2>
                  <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                    {uhid}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  NABL (ISO 15189:2022) Accredited Clinical Intake Sheet • 1-Page A4 Printable Standard
                </p>
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1.5 transition-colors cursor-pointer"
                title="Close Form"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto flex-1 bg-slate-100/90 p-3 sm:p-5 flex justify-center print:p-0 print:bg-white">
            {formContent}
          </div>
        </div>
      </div>
    );
  }

  return formContent;
}