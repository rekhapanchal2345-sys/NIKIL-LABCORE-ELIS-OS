"use client";

import React, { useState, useCallback } from "react";
import {
  ShieldCheck,
  Printer,
  FileSignature,
  Lock,
  CloudUpload,
  ScrollText,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  HardDrive,
  Download,
  Key,
  Eye,
  Sliders,
  QrCode,
  ShieldAlert,
  Search,
} from "lucide-react";
import type {
  ReportLayoutData,
  AuditSecurityData,
} from "@/types/settings";

const INPUT_CLS =
  "w-full rounded-lg border border-slate-200 bg-white py-2 px-3.5 text-sm text-slate-900 placeholder:text-slate-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all duration-150";

const SELECT_CLS =
  "w-full rounded-lg border border-slate-200 bg-white py-2 px-3.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all duration-150 appearance-none";

function FieldLabel({
  label,
  required,
  hint,
}: {
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-1 mb-1">
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {hint && (
        <span title={hint} className="cursor-help">
          <Info className="h-3 w-3 text-slate-400" />
        </span>
      )}
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  badge,
  badgeVariant = "blue",
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "blue" | "green" | "amber" | "red";
  children: React.ReactNode;
}) {
  const badgeClasses = {
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
  }[badgeVariant];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-6">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 shadow-xs">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        {badge && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClasses}`}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const DEFAULT_REPORT_LAYOUT: ReportLayoutData = {
  printMode: "FULL_DIGITAL",
  paperSize: "A4",
  paperWidthMm: 210,
  paperHeightMm: 297,
  headerHeightMm: 45,
  footerHeightMm: 30,
  marginLeftMm: 15,
  marginRightMm: 15,
  marginTopMm: 10,
  marginBottomMm: 10,
  showHospitalLogo: true,
  showNablLogo: true,
  showNabhLogo: true,
  showAccreditationCredentials: true,
  showFacilityAddress: true,
  showContactInfo: true,
  footerDisclaimer: "This electronic diagnostic report is authorized and clinically verified under NABL ISO 15189:2022 guidelines. Not valid for medico-legal purposes unless countersigned.",
  showSignatoryBlock: true,
  showVerificationQr: true,
  qrCodePosition: "TOP_RIGHT",
  qrVerificationBaseUrl: "https://elis.hospital.internal/verify-report/",
  watermarkEnabled: false,
  watermarkText: "CONFIDENTIAL CLINICAL RECORD",
  watermarkOpacity: 0.08,
  preliminaryReportWatermark: true,
  duplicateCopyWatermark: true,
  reportFontFamily: "Inter, -apple-system, sans-serif",
  reportFontSizePt: 9.5,
  showReferenceRanges: true,
  highlightAbnormals: true,
  highlightCriticals: true,
  showDeltaFlag: true,
  showAnalyzerFlags: false,
};

const DEFAULT_SECURITY_DATA: AuditSecurityData = {
  sessionTimeoutMinutes: 15,
  maxConcurrentSessions: 2,
  forceLogoutOnBrowserClose: true,
  deviceFingerprintEnabled: true,
  minPasswordLength: 10,
  passwordExpiryDays: 90,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 30,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  passwordHistoryCount: 5,
  mfaEnabled: true,
  mfaMethod: "TOTP_APP",
  mfaRequiredForRoles: ["HOSPITAL_SUPER_ADMIN", "SENIOR_PATHOLOGIST", "CHIEF_BIOCHEMIST"],
  mfaGracePeriodHours: 24,
  auditLoginActivity: true,
  auditClinicalChanges: true,
  auditBillingChanges: true,
  auditConfigChanges: true,
  hipaaLoggingEnabled: true,
  dishaComplianceEnabled: true,
  dpdpConsentEnforcement: true,
  aadhaarMaskingEnabled: true,
  auditLogRetentionDays: 2555, // 7 years statutory requirement in India
  immutableAuditEnabled: true,
  autoBackupEnabled: true,
  backupFrequencyCron: "0 2 * * *", // 2:00 AM daily
  backupDestinationLocal: "/var/backups/elis/daily",
  backupDestinationCloud: "S3",
  backupCloudBucketPath: "s3://labcore-encrypted-backups/delhi-hub/",
  backupEncryptionAlgorithm: "AES-256-GCM",
  backupIntegrityCheck: true,
  backupRetentionDays: 365,
  lastBackupTimestamp: "Today, 02:00 AM IST",
  lastBackupSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
};

// Mock audit log records for live viewer
const SAMPLE_AUDIT_LOGS = [
  {
    id: "aud-001",
    timestamp: "2026-10-31 09:42:18",
    actor: "Dr. Vikram Seth (Senior Pathologist)",
    ipAddress: "192.168.10.104",
    module: "CLINICAL_SIGN_OFF",
    action: "REPORT_AUTHORIZED",
    details: "Authorized Lipid Profile & HbA1c for Patient MRN-902412",
    hash: "0x8fa1...c29b",
  },
  {
    id: "aud-002",
    timestamp: "2026-10-31 09:15:02",
    actor: "Ananya Roy (Billing Cashier)",
    ipAddress: "192.168.10.18",
    module: "BILLING_INVOICE",
    action: "DISCOUNT_APPLIED",
    details: "Applied 10% Senior Citizen discount on INV/26-27/000142",
    hash: "0x4b7c...910a",
  },
  {
    id: "aud-003",
    timestamp: "2026-10-31 08:30:45",
    actor: "Ramesh Sharma (Lab Technician)",
    ipAddress: "192.168.10.45",
    module: "ANALYZER_BATCH",
    action: "RESULT_RECALCULATED",
    details: "Rerun Serum Potassium on Mindray BS-240 (Dilution 1:2 applied)",
    hash: "0x2e8f...77d3",
  },
  {
    id: "aud-004",
    timestamp: "2026-10-30 23:58:12",
    actor: "SYSTEM_SCHEDULER",
    ipAddress: "127.0.0.1",
    module: "DISASTER_RECOVERY",
    action: "BACKUP_COMPLETED",
    details: "Automated snapshot verified: SHA-256 match confirmed",
    hash: "0x99a2...18fe",
  },
];

interface StationerySecuritySettingsProps {
  subSection?: string;
  initialReportLayout?: Partial<ReportLayoutData>;
  initialSecurityData?: Partial<AuditSecurityData>;
  saving?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onSave?: (reportLayout: ReportLayoutData, security: AuditSecurityData) => void;
}

export default function StationerySecuritySettings({
  subSection,
  initialReportLayout,
  initialSecurityData,
  saving = false,
  onDirtyChange,
  onSave,
}: StationerySecuritySettingsProps) {
  const [layout, setLayout] = useState<ReportLayoutData>(() => ({
    ...DEFAULT_REPORT_LAYOUT,
    ...initialReportLayout,
  }));

  const [sec, setSec] = useState<AuditSecurityData>(() => ({
    ...DEFAULT_SECURITY_DATA,
    ...initialSecurityData,
  }));

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (subSection === "security-report-layout") return "stationery";
    if (subSection === "security-audit") return "security";
    if (subSection === "security-backup") return "backup";
    if (subSection === "security-auditlog") return "auditlog";
    if (subSection === "security-consent-log") return "consentlog";
    return "stationery";
  });

  const [auditSearch, setAuditSearch] = useState("");

  
  React.useEffect(() => {
    if (subSection === "security-report-layout") setActiveTab("stationery");
    else if (subSection === "security-audit") setActiveTab("security");
    else if (subSection === "security-backup") setActiveTab("backup");
    else if (subSection === "security-auditlog") setActiveTab("auditlog");
    else if (subSection === "security-consent-log") setActiveTab("consentlog");
  }, [subSection]);

  const markDirty = useCallback(() => {
    onDirtyChange?.(true);
  }, [onDirtyChange]);

  const updateLayout = <K extends keyof ReportLayoutData>(
    field: K,
    value: ReportLayoutData[K]
  ) => {
    setLayout((prev) => {
      const next = { ...prev, [field]: value };
      markDirty();
      onSave?.(next, sec);
      return next;
    });
  };

  const updateSec = <K extends keyof AuditSecurityData>(
    field: K,
    value: AuditSecurityData[K]
  ) => {
    setSec((prev) => {
      const next = { ...prev, [field]: value };
      markDirty();
      onSave?.(layout, next);
      return next;
    });
  };

  const filteredLogs = SAMPLE_AUDIT_LOGS.filter(
    (log) =>
      log.actor.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.module.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Domain Header Banner */}
      <div className="rounded-xl border border-slate-200 bg-linear-to-r from-slate-100/80 via-white to-sky-50/40 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Stationery, Report Canvas & Security Governance
                </h2>
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-800">
                  <Lock className="h-3 w-3" />
                  HIPAA & DISHA Compliant
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Report canvas margins (mm), pre-printed vs digital letterhead mode, dynamic verification QR position, immutable audit trail, and automated AES-256 disaster recovery.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 border border-emerald-200">
              7-Yr Statutory Log Enforced
            </span>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("stationery")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "stationery"
              ? "bg-slate-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Printer className="h-3.5 w-3.5" />
          Report Canvas & Print Setup
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "security"
              ? "bg-slate-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          Security Policy & Session
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("backup")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "backup"
              ? "bg-slate-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CloudUpload className="h-3.5 w-3.5" />
          Backup & Disaster Recovery
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("auditlog")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "auditlog"
              ? "bg-slate-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ScrollText className="h-3.5 w-3.5" />
          Immutable Audit Log Viewer
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("consentlog")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "consentlog"
              ? "bg-slate-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileSignature className="h-3.5 w-3.5" />
          Consent & eSign Audit Trail
        </button>
      </div>

      {/* TAB 1: Report Canvas & Print Setup */}
      {(activeTab === "stationery" || subSection === "security-report-layout") && (
        <div className="space-y-6">
          <SectionCard
            title="Stationery Mode & Canvas Dimensions"
            description="Toggle between full digital PDF generation with hospital header/footer graphics vs pre-printed stationery letterhead mode."
            icon={Printer}
            badge={layout.printMode === "FULL_DIGITAL" ? "Full Digital PDF" : "Pre-Printed Letterhead"}
            badgeVariant={layout.printMode === "FULL_DIGITAL" ? "blue" : "amber"}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <FieldLabel label="Primary Printing Mode" required />
                  <select
                    value={layout.printMode}
                    onChange={(e) =>
                      updateLayout("printMode", e.target.value as any)
                    }
                    className={SELECT_CLS}
                  >
                    <option value="FULL_DIGITAL">
                      Full Digital PDF (System prints Hospital Logo, Address, Accreditation & Signatures)
                    </option>
                    <option value="PRE_PRINTED_SHEET">
                      Pre-Printed Letterhead Sheet (Header & Footer suppressed, Test Grid only)
                    </option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    In Pre-Printed mode, the system preserves exact millimeter top/bottom margins so tests don&apos;t overlap physical letterhead stationery.
                  </p>
                </div>

                <div>
                  <FieldLabel label="Paper Standard" />
                  <select
                    value={layout.paperSize}
                    onChange={(e) =>
                      updateLayout("paperSize", e.target.value as any)
                    }
                    className={SELECT_CLS}
                  >
                    <option value="A4">A4 Standard (210 × 297 mm)</option>
                    <option value="A4_LONG">A4 Legal / Long (210 × 330 mm)</option>
                    <option value="LETTER">US Letter (8.5 × 11 in)</option>
                  </select>
                </div>
              </div>

              {/* Exact Millimeter Margins Grid */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
                  Precise Canvas Margins & Letterhead Clearances (mm)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  <div>
                    <FieldLabel label="Header Margin" />
                    <div className="relative">
                      <input
                        type="number"
                        value={layout.headerHeightMm}
                        onChange={(e) =>
                          updateLayout("headerHeightMm", Number(e.target.value))
                        }
                        className={INPUT_CLS}
                      />
                      <span className="absolute right-2 top-2 text-xs text-slate-400">mm</span>
                    </div>
                  </div>

                  <div>
                    <FieldLabel label="Footer Margin" />
                    <div className="relative">
                      <input
                        type="number"
                        value={layout.footerHeightMm}
                        onChange={(e) =>
                          updateLayout("footerHeightMm", Number(e.target.value))
                        }
                        className={INPUT_CLS}
                      />
                      <span className="absolute right-2 top-2 text-xs text-slate-400">mm</span>
                    </div>
                  </div>

                  <div>
                    <FieldLabel label="Margin Top" />
                    <div className="relative">
                      <input
                        type="number"
                        value={layout.marginTopMm}
                        onChange={(e) =>
                          updateLayout("marginTopMm", Number(e.target.value))
                        }
                        className={INPUT_CLS}
                      />
                      <span className="absolute right-2 top-2 text-xs text-slate-400">mm</span>
                    </div>
                  </div>

                  <div>
                    <FieldLabel label="Margin Bottom" />
                    <div className="relative">
                      <input
                        type="number"
                        value={layout.marginBottomMm}
                        onChange={(e) =>
                          updateLayout("marginBottomMm", Number(e.target.value))
                        }
                        className={INPUT_CLS}
                      />
                      <span className="absolute right-2 top-2 text-xs text-slate-400">mm</span>
                    </div>
                  </div>

                  <div>
                    <FieldLabel label="Margin Left" />
                    <div className="relative">
                      <input
                        type="number"
                        value={layout.marginLeftMm}
                        onChange={(e) =>
                          updateLayout("marginLeftMm", Number(e.target.value))
                        }
                        className={INPUT_CLS}
                      />
                      <span className="absolute right-2 top-2 text-xs text-slate-400">mm</span>
                    </div>
                  </div>

                  <div>
                    <FieldLabel label="Margin Right" />
                    <div className="relative">
                      <input
                        type="number"
                        value={layout.marginRightMm}
                        onChange={(e) =>
                          updateLayout("marginRightMm", Number(e.target.value))
                        }
                        className={INPUT_CLS}
                      />
                      <span className="absolute right-2 top-2 text-xs text-slate-400">mm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code & Watermark */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-4">
                <div>
                  <FieldLabel label="Dynamic Verification QR Code Position" />
                  <select
                    value={layout.qrCodePosition}
                    onChange={(e) =>
                      updateLayout("qrCodePosition", e.target.value as any)
                    }
                    className={SELECT_CLS}
                  >
                    <option value="TOP_RIGHT">Top Right (Beside Patient Banner)</option>
                    <option value="BOTTOM_RIGHT">Bottom Right (Beside Pathologist Signatures)</option>
                    <option value="BOTTOM_LEFT">Bottom Left (Report Footer)</option>
                    <option value="BOTTOM_CENTER">Bottom Center</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Scanning the QR directs patients to the tamper-evident validation portal.
                  </p>
                </div>

                <div>
                  <FieldLabel label="Security Watermark Controls" />
                  <div className="space-y-2 mt-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={layout.preliminaryReportWatermark}
                        onChange={(e) =>
                          updateLayout("preliminaryReportWatermark", e.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-sky-600"
                      />
                      Watermark &apos;PRELIMINARY / PROVISIONAL&apos; on unverified results
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={layout.duplicateCopyWatermark}
                        onChange={(e) =>
                          updateLayout("duplicateCopyWatermark", e.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-sky-600"
                      />
                      Watermark &apos;DUPLICATE COPY&apos; on reprints
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* TAB 2: Security Policy & Session */}
      {(activeTab === "security" || subSection === "security-audit") && (
        <div className="space-y-6">
          <SectionCard
            title="Session Management & Idle Timeout (HIPAA / DISHA)"
            description="Enforce automatic workstation logout when laboratory or clinical terminals remain unattended."
            icon={Clock}
            badge="HIPAA Compliant"
            badgeVariant="green"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <FieldLabel
                  label="Idle Session Auto-Logout"
                  hint="Terminal locks automatically after this duration of inactivity."
                />
                <select
                  value={sec.sessionTimeoutMinutes}
                  onChange={(e) =>
                    updateSec("sessionTimeoutMinutes", Number(e.target.value))
                  }
                  className={SELECT_CLS}
                >
                  <option value={5}>5 Minutes (Strict ICU / Phlebotomy)</option>
                  <option value={15}>15 Minutes (Standard Laboratory)</option>
                  <option value={30}>30 Minutes (Pathologist Desk)</option>
                  <option value={60}>60 Minutes (Administrative)</option>
                </select>
              </div>

              <div>
                <FieldLabel label="Max Concurrent User Logins" />
                <select
                  value={sec.maxConcurrentSessions}
                  onChange={(e) =>
                    updateSec("maxConcurrentSessions", Number(e.target.value))
                  }
                  className={SELECT_CLS}
                >
                  <option value={1}>1 Session Only (Single Device Lock)</option>
                  <option value={2}>2 Sessions (Desktop + Tablet)</option>
                  <option value={3}>3 Sessions</option>
                </select>
              </div>

              <div>
                <FieldLabel label="Browser Tab Protection" />
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sec.forceLogoutOnBrowserClose}
                    onChange={(e) =>
                      updateSec("forceLogoutOnBrowserClose", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-sky-600"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Purge Auth Tokens on Browser Close
                  </span>
                </label>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Healthcare Privacy & Statutory Data Governance"
            description="Aadhaar identification masking and DPDP (Digital Personal Data Protection Act) patient consent enforcement."
            icon={ShieldAlert}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Mandatory Aadhaar Card Masking (UIDAI)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Store and print only the last 4 digits (e.g. •••• •••• 4812).
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={sec.aadhaarMaskingEnabled}
                    onChange={(e) =>
                      updateSec("aadhaarMaskingEnabled", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-sky-600"
                  />
                </label>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      DPDP Patient Consent Architecture
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Log explicit consent before transmitting diagnostic reports via SMS or WhatsApp.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={sec.dpdpConsentEnforcement}
                    onChange={(e) =>
                      updateSec("dpdpConsentEnforcement", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-sky-600"
                  />
                </label>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* TAB 3: Backup & Disaster Recovery */}
      {(activeTab === "backup" || subSection === "security-backup") && (
        <div className="space-y-6">
          <SectionCard
            title="Automated Encrypted Snapshots & Integrity Verification"
            description="Daily automated encrypted database snapshots with SHA-256 integrity hashing to prevent ransomware corruption or data loss."
            icon={HardDrive}
            badge="AES-256 Active"
            badgeVariant="green"
          >
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 uppercase">
                      Last Verified Snapshot Health
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Completed: <strong>{sec.lastBackupTimestamp}</strong> • Algorithm: <strong>{sec.backupEncryptionAlgorithm}</strong>
                    </p>
                    <p className="text-[11px] font-mono text-emerald-700 mt-1">
                      SHA-256: {sec.lastBackupSha256}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-emerald-300 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Verify Integrity
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div>
                  <FieldLabel label="Local NAS / SAN Backup Path" required />
                  <input
                    type="text"
                    value={sec.backupDestinationLocal}
                    onChange={(e) =>
                      updateSec("backupDestinationLocal", e.target.value)
                    }
                    className={`${INPUT_CLS} font-mono`}
                  />
                </div>

                <div>
                  <FieldLabel label="Secondary Cloud Bucket (Disaster Recovery)" />
                  <div className="flex items-center gap-2">
                    <select
                      value={sec.backupDestinationCloud}
                      onChange={(e) =>
                        updateSec("backupDestinationCloud", e.target.value as any)
                      }
                      className="w-32 rounded border border-slate-300 py-1.5 px-2 text-xs"
                    >
                      <option value="S3">AWS S3</option>
                      <option value="GCS">Google Cloud</option>
                      <option value="AZURE_BLOB">Azure Blob</option>
                      <option value="NONE">None</option>
                    </select>
                    <input
                      type="text"
                      value={sec.backupCloudBucketPath}
                      onChange={(e) =>
                        updateSec("backupCloudBucketPath", e.target.value)
                      }
                      className={`${INPUT_CLS} font-mono`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}


      {/* TAB 5: Consent & eSign Audit Trail */}
      {(activeTab === "consentlog" || subSection === "security-consent-log") && (
        <div className="space-y-6">
          {/* Overview Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Signed Dossiers</p>
              <p className="text-2xl font-black text-slate-900 mt-1">1,428</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Tamper-evident logs</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Integrity Verified</p>
              <p className="text-2xl font-black text-emerald-800 mt-1">100%</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">SHA-256 match confirmed</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">DPDP Act Compliant</p>
              <p className="text-2xl font-black text-sky-900 mt-1">Active</p>
              <p className="text-[11px] text-sky-600 mt-0.5">Section 6(1) consent ledger</p>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Legal Evidence Ready</p>
              <p className="text-2xl font-black text-violet-900 mt-1">Sec 65B</p>
              <p className="text-[11px] text-violet-600 mt-0.5">BSA 2023 certificate ready</p>
            </div>
          </div>

          <SectionCard
            title="Medicolegal eSign & Patient Consent Forensic Ledger"
            description="Forensic evidentiary log capturing every digital sign-off, patient informed consent, and diagnostic authorization with cryptographic hash, workstation IP, and witness timestamp."
            icon={FileSignature}
            badge="Forensic Audit Trail"
            badgeVariant="blue"
          >
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-md border border-slate-200">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 font-sans">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp (IST)</th>
                      <th className="py-2.5 px-3">Signer / Doctor</th>
                      <th className="py-2.5 px-3">Document / Episode</th>
                      <th className="py-2.5 px-3">Terminal IP & Device</th>
                      <th className="py-2.5 px-3">Witness Attestation</th>
                      <th className="py-2.5 px-3 text-right">SHA-256 Signature Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">2026-10-31 09:42:18</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="font-bold text-slate-900 block">Dr. A.K. Verma</span>
                        <span className="text-[10px] text-slate-500">Reg: G-48291 (Pathology)</span>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="font-semibold text-slate-800 block">Biopsy Final Authorization</span>
                        <span className="text-[10px] text-sky-700">MRN-2026-08149</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <span>192.168.1.45</span>
                        <span className="text-[10px] text-slate-400 block font-sans">Lab-Histo-WS01</span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">
                        <span className="text-emerald-700 font-medium">Sr. Tech R. Patel</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-sky-700 font-mono text-[10px]">
                        9a8f4c...7e21
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">2026-10-31 08:15:02</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="font-bold text-slate-900 block">Dr. Priya Kumar</span>
                        <span className="text-[10px] text-slate-500">Reg: G-39810 (Radiology)</span>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="font-semibold text-slate-800 block">CECT Abdomen Contrast Consent</span>
                        <span className="text-[10px] text-sky-700">MRN-2026-08122</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <span>192.168.1.62</span>
                        <span className="text-[10px] text-slate-400 block font-sans">CT-Console-02</span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">
                        <span className="text-emerald-700 font-medium">Attendant (Son)</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-sky-700 font-mono text-[10px]">
                        b3c109...f44a
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">2026-10-30 22:50:41</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="font-bold text-slate-900 block">Dr. Sneha Patel</span>
                        <span className="text-[10px] text-slate-500">Reg: G-52104 (Casualty Duty)</span>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="font-semibold text-slate-800 block">Emergency Blood Transfusion Release</span>
                        <span className="text-[10px] text-sky-700">MRN-2026-08098 (MLC-042)</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <span>192.168.1.18</span>
                        <span className="text-[10px] text-slate-400 block font-sans">Casualty-EMR-01</span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">
                        <span className="text-emerald-700 font-medium">Duty Nurse S. Menon</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-sky-700 font-mono text-[10px]">
                        f771da...91c8
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs text-slate-600 font-sans">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  All signatures are cryptographically bound to the document version and verified against the National Medical Commission registry.
                </span>
                <span className="font-bold text-slate-800">ISO 15189 Cl. 8.3 Compliant</span>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* TAB 4: Immutable Audit Log Viewer */}
      {(activeTab === "auditlog" || subSection === "security-auditlog") && (
        <div className="space-y-6">
          <SectionCard
            title="Cryptographic Immutable Audit Log Viewer"
            description="Forensic tracking of every clinical authorization, discount override, test cancellation, and analyzer result modification."
            icon={ScrollText}
            badge="Forensic Audit Trail"
            badgeVariant="blue"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Search by actor, action, or MRN..."
                    className={`${INPUT_CLS} pl-9 text-xs`}
                  />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Statutory Retention: <strong>{sec.auditLogRetentionDays} Days (7 Years)</strong>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp (IST)</th>
                      <th className="py-2.5 px-3">Actor & Role</th>
                      <th className="py-2.5 px-3">Terminal IP</th>
                      <th className="py-2.5 px-3">Module</th>
                      <th className="py-2.5 px-3">Event Action</th>
                      <th className="py-2.5 px-3">Forensic Details</th>
                      <th className="py-2.5 px-3 text-right">Crypto Seal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">
                          {log.actor}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {log.ipAddress}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700 font-semibold border border-slate-200">
                            {log.module}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">
                          {log.details}
                        </td>
                        <td className="py-2.5 px-3 text-right text-sky-700 font-mono">
                          {log.hash}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
