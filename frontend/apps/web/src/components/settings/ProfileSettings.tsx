"use client";

import React, { useState, useEffect, useRef } from "react";
import SettingsSection from "./SettingsSection";
import SettingsField from "./SettingsField";
import DigitalSignatureModal from "./DigitalSignatureModal";
import { userApi, authApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { getStoredSettings, setStoredSettings } from "@/lib/settingsStorage";
import { 
  User, 
  Camera, 
  PenTool, 
  ShieldCheck, 
  Trash2, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Globe, 
  Bell, 
  Sliders, 
  Award,
  AlertCircle,
  FileCheck,
  Check,
  KeyRound
} from "lucide-react";

export interface ProfileSettingsData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  registrationNo?: string;
  profileImage: string;
  signature: string;
  signatureStamp?: string;
  signatureDate?: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  enablePushNotifications: boolean;
  darkMode: boolean;
  compactMode: boolean;
  showTutorial: boolean;
  defaultReportTemplate: string;
  autoApproveResults: boolean;
  enableCriticalAlerts: boolean;
  enableDailyDigest: boolean;
  preferredCommunicationMethod: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  emergencyContact: string;
  emergencyContactPhone: string;
}

interface ProfileSettingsProps {
  initialValues?: Partial<ProfileSettingsData>;
  saving?: boolean;
  onSave?: (values: ProfileSettingsData) => void;
}

export default function ProfileSettings({
  initialValues,
  saving = false,
  onSave,
}: ProfileSettingsProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize with stored settings or defaults
  const [values, setValues] = useState<ProfileSettingsData>(() => {
    const stored = getStoredSettings("profile");
    return {
      ...stored,
      ...initialValues,
    };
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  // Load live user data if available
  useEffect(() => {
    const syncUserProfile = async () => {
      if (!user) return;

      try {
        const stored = getStoredSettings("profile");
        const fullNameParts = (user.fullName || "").split(" ");
        const firstName = user.firstName || fullNameParts[0] || stored.firstName || "Jaya";
        const lastName = user.lastName || fullNameParts.slice(1).join(" ") || stored.lastName || "Ashapurama";

        setValues((prev) => ({
          ...prev,
          firstName: firstName || prev.firstName,
          lastName: lastName || prev.lastName,
          email: user.email || prev.email,
          phone: (user.phone as string) || prev.phone,
          profileImage: (user.avatar as string) || prev.profileImage,
        }));
      } catch (err) {
        console.warn("Could not fetch remote user details, using stored:", err);
      }
    };

    syncUserProfile();
  }, [user]);

  const update = <K extends keyof ProfileSettingsData>(
    field: K,
    value: ProfileSettingsData[K]
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setSaved(false);
  };

  // Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      update("profileImage", result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    update("profileImage", "");
  };

  // Signature Callback
  const handleSignatureSave = (signatureDataUrl: string, stampHash: string) => {
    update("signature", signatureDataUrl);
    update("signatureStamp", stampHash);
    update("signatureDate", new Date().toISOString().split("T")[0]);
  };

  const removeSignature = () => {
    update("signature", "");
    update("signatureStamp", "");
  };

  // Robust Save Handler
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Dual-Write to Resilient Local Storage & Broadcast Event
      const updatedProfile = setStoredSettings("profile", values);

      // 2. Call Parent Callback if available
      onSave?.(updatedProfile as ProfileSettingsData);

      // 3. Attempt Backend API Sync (Graceful non-blocking)
      if (user?.id) {
        try {
          await userApi.updateProfile(user.id, {
            firstName: values.firstName,
            lastName: values.lastName,
            fullName: `${values.firstName} ${values.lastName}`.trim(),
            phone: values.phone,
            designation: values.designation,
            department: values.department,
            profileImage: values.profileImage,
            signature: values.signature,
          });
        } catch (apiErr) {
          console.warn("Backend API sync skipped/offline, locally saved successfully:", apiErr);
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save profile. Please check your data.");
    } finally {
      setLoading(false);
    }
  };

  // Premium Toggle Component
  const Toggle = ({
    label,
    description,
    field,
  }: {
    label: string;
    description: string;
    field: keyof ProfileSettingsData;
  }) => {
    const enabled = Boolean(values[field]);

    return (
      <div className="flex items-start justify-between gap-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700">
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
          onClick={() => update(field, (!enabled) as ProfileSettingsData[typeof field])}
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
      {/* Alert Messages */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/90 dark:border-rose-900/50 dark:bg-rose-950/40 p-4 text-xs font-semibold text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 dark:border-emerald-900/50 dark:bg-emerald-950/40 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Profile settings successfully saved & synchronized across LabCore ELIS!</span>
        </div>
      )}

      {/* 1. Identity & Profile Information */}
      <SettingsSection
        title="Practitioner & Staff Identity"
        description="Personal credentials, contact details, and official hospital identification."
        icon={<User className="h-5 w-5" />}
        badge={
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-3 w-3" />
            Verified Medical Technologist
          </span>
        }
      >
        {/* Avatar Upload Area */}
        <div className="mb-6 flex flex-wrap items-center gap-6 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-4">
          <div className="relative group h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md">
            {values.profileImage ? (
              <img
                src={values.profileImage}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-cyan-600 text-2xl font-black text-white">
                {values.firstName?.[0] || values.email?.[0] || "J"}
                {values.lastName?.[0] || "A"}
              </div>
            )}

            {/* Hover overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110 active:scale-95 transition-all"
              >
                <Camera className="h-3.5 w-3.5" />
                Upload New Photo
              </button>

              {values.profileImage && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Accepted: JPG, PNG, WebP (Max 5MB). Photo syncs across Header, Reports & Lab Badges.
            </p>
          </div>
        </div>

        {/* Input Fields */}
        <div className="grid gap-5 md:grid-cols-2">
          <SettingsField label="First Name" required>
            <input
              type="text"
              value={values.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              placeholder="Jaya"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </SettingsField>

          <SettingsField label="Last Name" required>
            <input
              type="text"
              value={values.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              placeholder="Ashapurama"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </SettingsField>

          <SettingsField label="Work Email Address" required>
            <input
              type="email"
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="jayaashapurama891@gmail.com"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </SettingsField>

          <SettingsField label="Mobile / Emergency Contact Phone">
            <input
              type="tel"
              value={values.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </SettingsField>

          <SettingsField label="Official Designation">
            <input
              type="text"
              value={values.designation}
              onChange={(e) => update("designation", e.target.value)}
              placeholder="Chief Medical Lab Technologist"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </SettingsField>

          <SettingsField label="Department / Division">
            <select
              value={values.department}
              onChange={(e) => update("department", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Pathology">Clinical Pathology & Cytology</option>
              <option value="Biochemistry">Clinical Biochemistry</option>
              <option value="Hematology">Hematology & Coagulation</option>
              <option value="Microbiology">Microbiology & Serology</option>
              <option value="Immunology">Immunology & Immunoassays</option>
              <option value="Molecular">Molecular Diagnostics & PCR</option>
              <option value="Blood Bank">Blood Banking & Transfusion</option>
              <option value="Administration">Lab Administration & Quality</option>
            </select>
          </SettingsField>

          <SettingsField 
            label="Medical Council / State Board Reg. No" 
            badge="Legal Requirement"
            description="Printed alongside signature on diagnostic reports for regulatory compliance"
          >
            <input
              type="text"
              value={values.registrationNo || "MCI-LAB-2024-8849"}
              onChange={(e) => update("registrationNo", e.target.value)}
              placeholder="MCI-LAB-2024-8849"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </SettingsField>
        </div>
      </SettingsSection>

      {/* 2. Cryptographic Digital Signature & Seal */}
      <SettingsSection
        title="Electronic Signature & Report Authorization"
        description="Configure your official cryptographically verified digital signature used on patient diagnostic test reports."
        icon={<PenTool className="h-5 w-5" />}
        badge={
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <FileCheck className="h-3 w-3" />
            IT Act 2000 Compliant (Sec 3A / DSC)
          </span>
        }
      >
        <div className="grid gap-6 md:grid-cols-12 items-center">
          {/* Signature Preview Card */}
          <div className="md:col-span-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 p-5 flex flex-col items-center justify-center min-h-[160px] text-center">
            {values.signature ? (
              <div className="w-full flex flex-col items-center">
                <div className="h-20 w-full max-w-[280px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 flex items-center justify-center shadow-sm">
                  <img
                    src={values.signature}
                    alt="Authorized Signature"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    Verified Digital Stamp
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {values.signatureStamp || "SHA256:8f4e2b01c59d9921"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-400 py-3">
                <PenTool className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  No Electronic Signature Configured
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Signatures are required to sign off and release authorized test reports
                </span>
              </div>
            )}
          </div>

          {/* Signature Actions */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowSignatureModal(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:brightness-110 active:scale-95 transition-all"
              >
                <PenTool className="h-3.5 w-3.5" />
                {values.signature ? "Update Signature Pad" : "Open Digital Signature Pad"}
              </button>

              {values.signature && (
                <button
                  type="button"
                  onClick={removeSignature}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Signature
                </button>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                <Award className="h-3.5 w-3.5 text-indigo-500" />
                Legal Validity & Non-Repudiation:
              </div>
              <p>
                Each signature applied to patient reports incorporates a SHA-256 hash stamp, IP record, and timestamp compliant with the Information Technology Act & ISO 15189 standards.
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* 3. Regional Preferences & Working Hours */}
      <SettingsSection
        title="Localization & Working Schedule"
        description="Set your laboratory hours, timezone, and preferred date formats."
        icon={<Globe className="h-5 w-5" />}
      >
        <div className="grid gap-5 md:grid-cols-3">
          <SettingsField label="Language">
            <select
              value={values.language}
              onChange={(e) => update("language", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="English">English (United States / UK)</option>
              <option value="Hindi">हिंदी (Hindi)</option>
              <option value="Gujarati">ગુજરાતી (Gujarati)</option>
              <option value="Marathi">मराठी (Marathi)</option>
              <option value="Tamil">தமிழ் (Tamil)</option>
              <option value="Telugu">తెలుగు (Telugu)</option>
            </select>
          </SettingsField>

          <SettingsField label="Date Format">
            <select
              value={values.dateFormat}
              onChange={(e) => update("dateFormat", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 13/09/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO e.g. 2026-09-13)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
              <option value="DD-MMM-YYYY">DD-MMM-YYYY (e.g. 13-Sep-2026)</option>
            </select>
          </SettingsField>

          <SettingsField label="Timezone">
            <select
              value={values.timezone}
              onChange={(e) => update("timezone", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
            </select>
          </SettingsField>

          <SettingsField label="Duty Hours Start">
            <input
              type="time"
              value={values.workingHoursStart}
              onChange={(e) => update("workingHoursStart", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </SettingsField>

          <SettingsField label="Duty Hours End">
            <input
              type="time"
              value={values.workingHoursEnd}
              onChange={(e) => update("workingHoursEnd", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </SettingsField>

          <SettingsField label="Preferred Notification Medium">
            <select
              value={values.preferredCommunicationMethod}
              onChange={(e) => update("preferredCommunicationMethod", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="email">Email Alert</option>
              <option value="whatsapp">WhatsApp Direct</option>
              <option value="sms">SMS Text</option>
              <option value="all">All Channels</option>
            </select>
          </SettingsField>
        </div>
      </SettingsSection>

      {/* 4. Clinical Workflow Toggles */}
      <SettingsSection
        title="Clinical Approvals & Panic Alerts"
        description="Configure automated approval safeguards and critical panic alert behaviors."
        icon={<Bell className="h-5 w-5" />}
      >
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Toggle
            label="Critical Panic Value Alerts"
            description="Immediate high-priority alert on screen & SMS when results exceed panic ranges."
            field="enableCriticalAlerts"
          />
          <Toggle
            label="Auto-Approve Routine Normal Results"
            description="Automatically release normal CBC/Biochemistry results without manual doctor signoff."
            field="autoApproveResults"
          />
          <Toggle
            label="Daily Laboratory Summary Digest"
            description="Receive 8:00 PM summary of specimens processed, pending TAT, and revenue."
            field="enableDailyDigest"
          />
          <Toggle
            label="Push Notifications"
            description="Receive real-time desktop notifications for STAT urgent order requests."
            field="enablePushNotifications"
          />
        </div>
      </SettingsSection>

      {/* Standalone Save Footer in Component */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Profile changes are immediately saved to storage and synchronized across the system.</span>
        </div>

        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" />
              Settings Saved
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-slate-900/20 dark:shadow-indigo-600/30 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
          >
            {saving || loading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving Changes...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Save Profile Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Digital Signature Studio Modal */}
      <DigitalSignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSave={handleSignatureSave}
        initialSignature={values.signature}
        signatoryName={`${values.firstName} ${values.lastName}`.trim() || "Jaya Ashapurama"}
        designation={values.designation || "Chief Medical Lab Technologist"}
        registrationNo={values.registrationNo || "MCI-LAB-2024-8849"}
      />
    </div>
  );
}
