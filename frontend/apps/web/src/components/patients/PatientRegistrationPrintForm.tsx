"use client";

import React from "react";
import {
  Printer,
  X,
  Building2,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  User,
  HeartPulse,
  CheckCircle2,
  FileText,
} from "lucide-react";
import {
  formatCleanUhid,
  formatClinicalBloodGroup,
  formatDobWithAge,
  normalizeListField,
} from "@/lib/patient-form-utils";

export interface PatientRegistrationPrintFormProps {
  patientId?: string;
  patientData: any;
  labInfo?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  onClose?: () => void;
}

export default function PatientRegistrationPrintForm({
  patientId,
  patientData = {},
  labInfo,
  onClose,
}: PatientRegistrationPrintFormProps) {
  const cleanUhid = formatCleanUhid(patientData?.uhid || patientId, patientData?.id);
  const bloodGroup = formatClinicalBloodGroup(patientData?.bloodGroup);
  const dobDisplay = formatDobWithAge(patientData?.dateOfBirth, patientData?.age);
  const allergies = normalizeListField(patientData?.allergies, "No Known Drug / Food Allergies");
  const conditions = normalizeListField(patientData?.chronicConditions || patientData?.medicalConditions, "None Reported");
  const medications = normalizeListField(patientData?.currentMedications, "None Reported");

  const fullName = [patientData?.firstName, patientData?.middleName, patientData?.lastName]
    .filter(Boolean)
    .join(" ") || "Rajeshwari Devi";

  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 print:shadow-none print:border-0 print:p-0">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 mb-5 print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              A4 Clinical Patient Registration & Intake Sheet
            </h2>
            <p className="text-[11px] text-slate-500">
              Hospital, Diagnostic Lab & Polyclinic Standard • Single-Page A4 Printable Dossier
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f2d52] px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            <Printer className="h-3.5 w-3.5" />
            Print A4 Form
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" />
              Close
            </button>
          )}
        </div>
      </div>

      {/* Printable A4 Sheet Container */}
      <div className="rounded-xl border border-slate-300 bg-white overflow-hidden">
        {/* Institutional Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-slate-800 bg-slate-50/70 px-6 py-4 gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-white text-[#0f2d52] shadow-2xs">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-[#0f2d52]">
                  {labInfo?.name || "LabCore ELIS Hospital, Diagnostic Lab & Polyclinic"}
                </h1>
                <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  NABL ISO 15189:2022 & NABH
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {labInfo?.address || "123 Health Avenue, Medical District, Ahmedabad, Gujarat - 380016, India"}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 mt-1 font-mono">
                <span>Tel: {labInfo?.phone || "+91 98765 43210"}</span>
                <span>•</span>
                <span>Email: {labInfo?.email || "intake@labcore-health.in"}</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
            <span className="inline-block rounded-md bg-[#0f2d52] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              PATIENT REGISTRATION DOSSIER
            </span>
            <div className="mt-1.5 font-mono text-sm font-extrabold text-slate-900">
              UHID: {cleanUhid}
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              Reg Date: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>

        {/* Section 01: Personal Demographics & Identification */}
        <div className="border-b border-slate-200">
          <div className="bg-slate-100/90 px-4 py-1.5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
              01. Personal Demographics & Clinical Identification
            </span>
            <span className="text-[10px] font-mono font-semibold text-slate-500">EMR / HIS Master Index</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs">
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase text-slate-400">Patient Full Name</div>
              <div className="mt-1 font-bold text-slate-900">{fullName}</div>
            </div>
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase text-slate-400">Date of Birth & Age</div>
              <div className="mt-1 font-semibold text-slate-800">{dobDisplay}</div>
            </div>
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase text-slate-400">Biological Sex</div>
              <div className="mt-1 font-semibold text-slate-800">{patientData?.gender || "FEMALE"}</div>
            </div>
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase text-slate-400">ABO / Rh Blood Group</div>
              <div className="mt-1 font-mono font-bold text-rose-700">{bloodGroup}</div>
            </div>
          </div>
        </div>

        {/* Section 02: Contact & Residential Particulars */}
        <div className="border-b border-slate-200">
          <div className="bg-slate-100/90 px-4 py-1.5 border-b border-slate-200">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
              02. Contact & Residential Particulars
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs">
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase text-slate-400">Primary Mobile Number</div>
              <div className="mt-1 font-mono font-bold text-slate-900">{patientData?.phone || "+91 98250 11223"}</div>
            </div>
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase text-slate-400">Email Address</div>
              <div className="mt-1 font-medium text-slate-800">{patientData?.email || "patient@example.com"}</div>
            </div>
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase text-slate-400">Residential Address</div>
              <div className="mt-1 font-medium text-slate-800">
                {[patientData?.address, patientData?.city, patientData?.state, patientData?.postalCode]
                  .filter(Boolean)
                  .join(", ") || "42 Kalyani Nagar, Pune, Maharashtra"}
              </div>
            </div>
          </div>
        </div>

        {/* Section 03 & 04: Emergency Contact & Insurance / Sponsor */}
        <div className="border-b border-slate-200">
          <div className="bg-slate-100/90 px-4 py-1.5 border-b border-slate-200">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
              03. Emergency Kin Contact & Health Insurance / TPA Sponsor
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs">
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase text-slate-400">Emergency Contact Name</div>
              <div className="mt-1 font-semibold text-slate-800">{patientData?.emergencyContactName || "Next of Kin"}</div>
            </div>
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase text-slate-400">Relationship & Phone</div>
              <div className="mt-1 font-mono text-slate-800">
                {patientData?.emergencyContactRelationship || "Spouse / Family"} • {patientData?.emergencyContactPhone || "—"}
              </div>
            </div>
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase text-slate-400">Insurance / TPA Provider</div>
              <div className="mt-1 font-semibold text-slate-800">{patientData?.insuranceProvider || "Direct Self-Pay"}</div>
            </div>
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase text-slate-400">Policy / Card Number</div>
              <div className="mt-1 font-mono text-slate-800">{patientData?.insurancePolicyNumber || "N/A"}</div>
            </div>
          </div>
        </div>

        {/* Section 05: Clinical History & Pre-Analytical Alerts */}
        <div className="border-b border-slate-200">
          <div className="bg-slate-100/90 px-4 py-1.5 border-b border-slate-200">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
              04. Clinical History, Allergies & Pre-Analytical Alerts
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs">
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase text-slate-400">Known Drug / Food Allergies</div>
              <div className="mt-1 font-bold text-rose-700">{allergies}</div>
            </div>
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase text-slate-400">Chronic Conditions / Diagnoses</div>
              <div className="mt-1 font-semibold text-slate-800">{conditions}</div>
            </div>
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase text-slate-400">Current Medications</div>
              <div className="mt-1 font-semibold text-slate-800">{medications}</div>
            </div>
          </div>
        </div>

        {/* Section 06: Statutory Consent & Signatures */}
        <div className="p-4 bg-slate-50/50 text-xs space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 text-[11px] text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              I hereby consent to clinical examination, diagnostic specimen collection, and electronic medical record archival in accordance with NABL ISO 15189:2022 and statutory healthcare confidentiality standards.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-3 text-xs">
            <div className="border-t border-slate-300 pt-2">
              <div className="font-bold text-slate-800">{fullName}</div>
              <div className="text-[10px] text-slate-500">Patient / Legal Guardian Signature</div>
            </div>
            <div className="border-t border-slate-300 pt-2 text-right">
              <div className="font-bold text-slate-800">Front Desk Registration Officer</div>
              <div className="text-[10px] text-slate-500">Authorized Hospital / Lab Seal & Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
