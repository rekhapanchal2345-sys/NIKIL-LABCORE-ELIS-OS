"use client";

import React, { useState } from "react";
import SettingsSection from "./SettingsSection";
import SettingsField from "./SettingsField";
import { getStoredSettings, setStoredSettings } from "@/lib/settingsStorage";
import { 
  Building2, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  Barcode, 
  Hash, 
  Check, 
  FileText, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  ExternalLink 
} from "lucide-react";

export interface LaboratorySettingsData {
  labName: string;
  legalName: string;
  labCode: string;
  nablAccreditationNo: string;
  nablExpiry: string;
  nablStatus: string;
  isoCertification: string;
  capNumber: string;
  icmrId: string;
  cliaId: string;
  gstin: string;
  accessionPrefix: string;
  patientPrefix: string;
  invoicePrefix: string;
  reportPrefix: string;
  defaultSampleType: string;
  defaultPriority: string;
  autoGeneratePatientId: boolean;
  autoGenerateAccessionNumber: boolean;
  autoGenerateInvoiceNumber: boolean;
  allowDuplicatePatients: boolean;
  requireResultApproval: boolean;
  enableCriticalValueAlerts: boolean;
  criticalValueNotification: boolean;
  chiefPathologist: string;
  labAddress: string;
  contactEmail: string;
  contactPhone: string;
}

interface LaboratorySettingsProps {
  initialValues?: Partial<LaboratorySettingsData>;
  saving?: boolean;
  onSave?: (values: LaboratorySettingsData) => void;
}

export default function LaboratorySettings({
  initialValues,
  saving = false,
  onSave,
}: LaboratorySettingsProps) {
  const [values, setValues] = useState<LaboratorySettingsData>(() => {
    const stored = getStoredSettings("laboratory");
    return {
      ...stored,
      ...initialValues,
    };
  });

  const [saved, setSaved] = useState(false);

  const update = <K extends keyof LaboratorySettingsData>(
    field: K,
    value: LaboratorySettingsData[K]
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    const updated = setStoredSettings("laboratory", values);
    onSave?.(updated as LaboratorySettingsData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  const Toggle = ({
    label,
    description,
    field,
  }: {
    label: string;
    description: string;
    field: keyof LaboratorySettingsData;
  }) => {
    const enabled = Boolean(values[field]);

    return (
      <div className="flex items-start justify-between gap-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-4 transition-all hover:border-slate-300">
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {label}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => update(field, (!enabled) as LaboratorySettingsData[typeof field])}
          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
            enabled ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
          }`}
          aria-label={`Toggle ${label}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {saved && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 dark:border-emerald-900/50 dark:bg-emerald-950/40 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Laboratory accreditation and accession preferences saved successfully!</span>
        </div>
      )}

      {/* 1. Verified Medical Accreditations Banner */}
      <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-900/90 via-slate-900 to-indigo-950 p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-cyan-400 backdrop-blur-md border border-white/20 shadow-inner">
              <Award className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Regulatory Accreditations & Licenses
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/40">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  NABL & CAP Verified Active
                </span>
              </div>
              <p className="mt-1 text-xs text-indigo-200/80">
                Official accreditation registry recognized by Quality Council of India (QCI) & International Laboratory Accreditation Cooperation (ILAC)
              </p>
            </div>
          </div>
        </div>

        {/* Accreditation Quick Cards */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold">NABL Accreditation</div>
            <div className="text-sm font-mono font-bold text-white mt-1">{values.nablAccreditationNo}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Valid thru: {values.nablExpiry}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold">Standard</div>
            <div className="text-sm font-bold text-white mt-1">{values.isoCertification}</div>
            <div className="text-[10px] text-cyan-300 mt-0.5">Medical Labs Quality</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold">CAP Registry No.</div>
            <div className="text-sm font-mono font-bold text-white mt-1">{values.capNumber}</div>
            <div className="text-[10px] text-slate-300 mt-0.5">College of American Pathologists</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold">ICMR Diagnostic ID</div>
            <div className="text-sm font-mono font-bold text-white mt-1">{values.icmrId}</div>
            <div className="text-[10px] text-slate-300 mt-0.5">Indian Council Medical Research</div>
          </div>
        </div>
      </div>

      {/* 2. Institutional Information */}
      <SettingsSection
        title="Laboratory Institutional Details"
        description="Official legal credentials, registered address, and Chief Pathologist details."
        icon={<Building2 className="h-5 w-5" />}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <SettingsField label="Laboratory Display Name" required>
            <input
              type="text"
              value={values.labName}
              onChange={(e) => update("labName", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </SettingsField>

          <SettingsField label="Legal Entity Name">
            <input
              type="text"
              value={values.legalName}
              onChange={(e) => update("legalName", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </SettingsField>

          <SettingsField label="Laboratory Short Code" badge="Accessioning Tag">
            <input
              type="text"
              value={values.labCode}
              onChange={(e) => update("labCode", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </SettingsField>

          <SettingsField label="GSTIN / Tax ID">
            <input
              type="text"
              value={values.gstin}
              onChange={(e) => update("gstin", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </SettingsField>

          <SettingsField label="Chief Pathologist / Medical Director">
            <input
              type="text"
              value={values.chiefPathologist}
              onChange={(e) => update("chiefPathologist", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </SettingsField>

          <SettingsField label="Official Helpline / Reception Phone">
            <input
              type="text"
              value={values.contactPhone}
              onChange={(e) => update("contactPhone", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </SettingsField>

          <div className="md:col-span-2">
            <SettingsField label="Registered Laboratory Address">
              <input
                type="text"
                value={values.labAddress}
                onChange={(e) => update("labAddress", e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </SettingsField>
          </div>
        </div>
      </SettingsSection>

      {/* 3. Barcoding & Accession Sequencing */}
      <SettingsSection
        title="Sample Accessioning & Prefix Formatting"
        description="Configure automatic numbering sequences for specimen barcodes, invoices, and reports."
        icon={<Barcode className="h-5 w-5" />}
      >
        <div className="grid gap-5 md:grid-cols-4">
          <SettingsField label="Accession Prefix">
            <input
              type="text"
              value={values.accessionPrefix}
              onChange={(e) => update("accessionPrefix", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <span className="mt-1 text-[10px] text-slate-400">Sample: {values.accessionPrefix}10482</span>
          </SettingsField>

          <SettingsField label="Patient UHID Prefix">
            <input
              type="text"
              value={values.patientPrefix}
              onChange={(e) => update("patientPrefix", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <span className="mt-1 text-[10px] text-slate-400">Sample: {values.patientPrefix}99042</span>
          </SettingsField>

          <SettingsField label="Invoice Prefix">
            <input
              type="text"
              value={values.invoicePrefix}
              onChange={(e) => update("invoicePrefix", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <span className="mt-1 text-[10px] text-slate-400">Sample: {values.invoicePrefix}2026-081</span>
          </SettingsField>

          <SettingsField label="Diagnostic Report Prefix">
            <input
              type="text"
              value={values.reportPrefix}
              onChange={(e) => update("reportPrefix", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <span className="mt-1 text-[10px] text-slate-400">Sample: {values.reportPrefix}DX-5501</span>
          </SettingsField>
        </div>

        <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
          <Toggle
            label="Auto-generate Accession Barcodes"
            description="Generate Code-128 barcode automatically when specimens are accessioned."
            field="autoGenerateAccessionNumber"
          />
          <Toggle
            label="Require Pathologist Result Approval"
            description="Strict signoff: No report released to patient portal before authorized signature."
            field="requireResultApproval"
          />
          <Toggle
            label="Automatic Patient UHID Generation"
            description="Automatically assign unique health identifier to all new registrations."
            field="autoGeneratePatientId"
          />
          <Toggle
            label="Allow Duplicate Patient Names"
            description="Permit registrations with identical patient names if phone/DOB differs."
            field="allowDuplicatePatients"
          />
        </div>
      </SettingsSection>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-slate-900/20 dark:shadow-indigo-600/30 hover:brightness-110 active:scale-95 transition-all"
        >
          <Check className="h-3.5 w-3.5" />
          Save Laboratory Settings
        </button>
      </div>
    </div>
  );
}