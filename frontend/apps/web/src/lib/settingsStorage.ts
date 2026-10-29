export const defaultSettings: Record<string, any> = {
  profile: {
    firstName: "Nikil",
    lastName: "Panchal",
    email: "admin@labcore.com",
    phone: "+91 98765 43210",
    designation: "Chief Administrator & Consultant Pathologist",
    department: "Clinical Pathology & Laboratory Medicine",
    registrationNumber: "NMC-PATH-2026-9182",
    qualification: "MD (Pathology), FRCPath",
  },
  general: {
    labName: "LabCore Central Reference Diagnostic Laboratory",
    shortName: "LabCore ELIS",
    timezone: "Asia/Kolkata",
    currency: "INR",
    dateFormat: "DD/MM/YYYY",
    language: "en-IN",
    autoLogoutMinutes: 30,
  },
  laboratory: {
    labName: "LabCore Central Reference Diagnostic Laboratory",
    nablNumber: "MC-4129",
    capNumber: "CAP-729108",
    rohiniId: "ROHINI-881209",
    hfrId: "HFR-MH-PUN-04129",
    address: "123 Healthcare Avenue, Medical District, Pune - 411001",
    phone: "+91 98765 43210",
    email: "reports@labcore.com",
    autoVerifyEnabled: true,
    westgardStrictMode: true,
    panicSlaMinutes: 15,
  },
  users: {
    allowSelfRegistration: false,
    requireMfaForPathologists: true,
    defaultRole: "LAB_TECH",
    maxConcurrentSessions: 3,
  },
  billing: {
    gstEnabled: true,
    gstPercentage: 0,
    gstin: "27AABCL1234F1Z5",
    sacCode: "999312",
    invoicePrefix: "INV-2026-",
    receiptPrefix: "RCP-2026-",
    allowPartialPayment: true,
    requireApprovalForDiscountAbove: 15,
  },
  notifications: {
    whatsappEnabled: true,
    smsEnabled: true,
    emailEnabled: true,
    autoSendReportOnApproval: true,
    panicAlertVoiceCall: true,
    whatsappProvider: "META_CLOUD_API",
    smsSenderId: "LBCORE",
  },
  security: {
    mfaRequired: false,
    sessionTimeoutMinutes: 30,
    passwordMinLength: 12,
    ipWhitelistEnabled: false,
    auditLogImmutable: true,
    hipaaPrivacyMasking: false,
  },
  integrations: {
    abdmEnabled: true,
    abdmEnv: "SANDBOX",
    astmPort: 5000,
    hl7MllpPort: 2575,
    pacsDicomEnabled: true,
  },
  advanced: {
    enableDigitalTwin: true,
    enableOmniscientNexus: true,
    enableClinicalAiCdss: true,
    cacheTtlSeconds: 300,
  },
  data_retention: {
    clinicalReportsYears: 7,
    auditLogsDays: 365,
    analyzerRawPacketsDays: 90,
    autoArchiveEnabled: true,
  },
  branding: {
    primaryColor: "#0284c7",
    accentColor: "#0d9488",
    reportHeaderStyle: "NABL_PREMIUM",
    showQrOnReports: true,
    showDigitalSignature: true,
  },
  backup: {
    backupEnabled: true,
    scheduleCron: "0 2 * * *",
    retentionDays: 30,
    encryptionEnabled: true,
    lastBackupAt: new Date().toISOString(),
  },
};

export function getStoredSettings(tab: string): any {
  const base = defaultSettings[tab] || {};
  if (typeof window === "undefined") return { ...base };
  try {
    const raw = localStorage.getItem(`labcore_settings_${tab}`);
    if (raw) {
      return { ...base, ...JSON.parse(raw) };
    }
  } catch {}
  return { ...base };
}

export function setStoredSettings(tab: string, data: any): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`labcore_settings_${tab}`, JSON.stringify(data));
    if (tab === "profile") {
      window.dispatchEvent(new CustomEvent("labcore:profile-updated", { detail: data }));
    }
  } catch {}
}
