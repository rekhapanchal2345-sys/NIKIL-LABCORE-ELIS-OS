"use client";

import React, { useState } from "react";
import SettingsSection from "./SettingsSection";
import SettingsField from "./SettingsField";
import { getStoredSettings, setStoredSettings } from "@/lib/settingsStorage";
import { 
  Palette, 
  Sparkles, 
  Image as ImageIcon, 
  FileText, 
  Check, 
  CheckCircle2, 
  QrCode, 
  Award, 
  ShieldCheck, 
  Eye, 
  Upload 
} from "lucide-react";

export interface BrandingSettingsData {
  brandName: string;
  primaryColor: string;
  accentColor: string;
  reportHeaderStyle: string;
  showNablLogoOnReport: boolean;
  showQrCodeOnReport: boolean;
  showDigitalSignatureStamp: boolean;
  reportWatermarkText: string;
  footerDisclaimer: string;
  logoUrl: string;
}

interface BrandingSettingsProps {
  initialValues?: Partial<BrandingSettingsData>;
  saving?: boolean;
  onSave?: (values: BrandingSettingsData) => void;
}

export default function BrandingSettings({
  initialValues,
  saving = false,
  onSave,
}: BrandingSettingsProps) {
  const [values, setValues] = useState<BrandingSettingsData>(() => {
    const stored = getStoredSettings("branding");
    return {
      ...stored,
      ...initialValues,
    };
  });

  const [saved, setSaved] = useState(false);
  const profileSettings = getStoredSettings("profile");
  const labSettings = getStoredSettings("laboratory");

  const update = <K extends keyof BrandingSettingsData>(
    field: K,
    value: BrandingSettingsData[K]
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setSaved(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update("logoUrl", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const updated = setStoredSettings("branding", values);
    onSave?.(updated as BrandingSettingsData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  const presetColors = [
    { name: "Executive Slate", hex: "#0f172a" },
    { name: "Royal Medical Navy", hex: "#1e3a8a" },
    { name: "Cyan Clinical", hex: "#0284c7" },
    { name: "Emerald Diagnostic", hex: "#059669" },
    { name: "Amethyst Molecular", hex: "#7c3aed" },
    { name: "Crimson Healthcare", hex: "#be123c" },
  ];

  return (
    <div className="space-y-6">
      {saved && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 dark:border-emerald-900/50 dark:bg-emerald-950/40 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Branding styles and diagnostic report letterhead saved!</span>
        </div>
      )}

      {/* 1. Brand Identity & Header Styling */}
      <SettingsSection
        title="Report Letterhead & Visual Identity"
        description="Customize brand colors, logos, and report typography across all printed and PDF diagnostic test reports."
        icon={<Palette className="h-5 w-5" />}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <SettingsField label="Laboratory Brand Header Name" required>
              <input
                type="text"
                value={values.brandName}
                onChange={(e) => update("brandName", e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </SettingsField>

            {/* Logo Upload */}
            <SettingsField label="Hospital / Laboratory Official Logo">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-28 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-1.5 overflow-hidden">
                  {values.logoUrl ? (
                    <img src={values.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-semibold">No Logo</span>
                  )}
                </div>
                <label className="cursor-pointer rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2">
                  <Upload className="h-3.5 w-3.5" />
                  Upload Crest / Logo
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </SettingsField>

            {/* Palette Selection */}
            <div>
              <label className="block text-xs font-bold tracking-tight text-slate-700 dark:text-slate-300 uppercase mb-2">
                Primary Header Theme Color
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {presetColors.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => update("primaryColor", col.hex)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                      values.primaryColor === col.hex
                        ? "border-slate-900 bg-slate-900 text-white shadow-md dark:border-white dark:bg-white dark:text-slate-900"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-white/40 shadow-sm"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span>{col.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <SettingsField label="Diagnostic Report Disclaimer">
              <textarea
                rows={2}
                value={values.footerDisclaimer}
                onChange={(e) => update("footerDisclaimer", e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </SettingsField>
          </div>

          {/* 2. Real-Time Report Preview Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Live Report Letterhead Preview
                </span>
              </div>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                Patient PDF View
              </span>
            </div>

            {/* Simulated Medical Report */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-slate-900 text-left font-sans">
              {/* Header */}
              <div
                className="rounded-lg p-3 text-white flex items-center justify-between"
                style={{ backgroundColor: values.primaryColor }}
              >
                <div>
                  <h4 className="text-sm font-black tracking-tight uppercase">
                    {values.brandName || "LabCore Diagnostics"}
                  </h4>
                  <p className="text-[10px] opacity-80">
                    {labSettings.labAddress || "Apex Healthcare Tower, CG Road, Ahmedabad"}
                  </p>
                  <p className="text-[9px] opacity-75 font-mono">
                    NABL Accr: {labSettings.nablAccreditationNo || "MC-4819"} • ISO 15189:2022
                  </p>
                </div>
                {values.showNablLogoOnReport && (
                  <div className="rounded bg-white/10 px-2 py-1 text-center text-[9px] font-bold border border-white/20">
                    NABL ACCREDITED
                  </div>
                )}
              </div>

              {/* Patient Bar */}
              <div className="my-2.5 flex items-center justify-between border-b border-slate-100 pb-2 text-[10px] text-slate-600">
                <div>
                  <strong>Patient:</strong> Ramesh Patel (48 Y / M)
                </div>
                <div>
                  <strong>UHID:</strong> PAT-90412
                </div>
                <div>
                  <strong>Ref By:</strong> Dr. H. Trivedi, MD
                </div>
              </div>

              {/* Sample Test Line */}
              <div className="space-y-1 text-[11px] py-2">
                <div className="flex justify-between font-bold border-b border-slate-200 pb-1 text-[10px] text-slate-500">
                  <span>INVESTIGATION</span>
                  <span>RESULT</span>
                  <span>REFERENCE RANGE</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Hemoglobin (Hb)</span>
                  <span className="font-bold text-slate-900">14.2 g/dL</span>
                  <span className="text-slate-500">13.0 - 17.0</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Fasting Blood Sugar (FBS)</span>
                  <span className="font-bold text-slate-900">92 mg/dL</span>
                  <span className="text-slate-500">70 - 100</span>
                </div>
              </div>

              {/* Signature & Verification Seal */}
              <div className="mt-4 flex items-end justify-between border-t border-slate-200 pt-3 text-[10px]">
                {values.showQrCodeOnReport ? (
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <QrCode className="h-6 w-6 text-slate-800" />
                    <span className="text-[9px] leading-tight">
                      Scan to Verify<br />Report Online
                    </span>
                  </div>
                ) : <div />}

                <div className="text-right">
                  {values.showDigitalSignatureStamp && profileSettings.signature ? (
                    <div className="h-10 w-28 ml-auto flex items-center justify-end">
                      <img src={profileSettings.signature} alt="Sign" className="max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="font-serif italic text-slate-400">Jaya Ashapurama</div>
                  )}
                  <div className="font-bold text-slate-800 text-[10px] mt-0.5">
                    {profileSettings.firstName} {profileSettings.lastName}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {profileSettings.designation || "Chief Medical Technologist"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all"
        >
          <Check className="h-3.5 w-3.5" />
          Save Branding & Letterhead
        </button>
      </div>
    </div>
  );
}
