import prisma from "../../lib/prisma";
import { cacheService, CacheKeys, CacheTags, CacheTTL } from "../cache/cache.service";

export interface LaboratorySettingsData {
  id?: string;
  labName?: string;
  labPhone?: string;
  labEmail?: string;
  labAddress?: string;
  labCity?: string;
  labState?: string;
  labPincode?: string;
  labWebsite?: string;
  labSupportEmail?: string;
  labEmergencyPhone?: string;
  // Email
  emailProvider?: string;
  emailApiKey?: string;
  emailApiSecret?: string;
  emailFromEmail?: string;
  emailFromName?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSsl?: boolean;
  emailMaxRetries?: number;
  emailRetryIntervalMinutes?: number;
  emailDailyLimit?: number;
  emailReportEnabled?: boolean;
  emailAppointmentEnabled?: boolean;
  emailCriticalAlertEnabled?: boolean;
  // SMS
  smsProvider?: string;
  smsApiKey?: string;
  smsApiSecret?: string;
  smsSenderId?: string;
  smsDltEntityId?: string;
  smsDltTemplateId?: string;
  smsMaxRetries?: number;
  smsReportEnabled?: boolean;
  smsAppointmentEnabled?: boolean;
  smsCriticalAlertEnabled?: boolean;
  // WhatsApp
  whatsappProvider?: string;
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
  whatsappWebhookUrl?: string;
  whatsappVerifyToken?: string;
  whatsappBusinessProfileId?: string;
  whatsappAIEnabled?: boolean;
  whatsappTemplateReportId?: string;
  whatsappTemplateAppointmentId?: string;
  whatsappTemplateCriticalId?: string;
  // Voice Calls
  callProvider?: string;
  callApiKey?: string;
  callApiSecret?: string;
  callCallerId?: string;
  callIvrEnabled?: boolean;
  callRecordingEnabled?: boolean;
  // Notifications & Escalation
  notificationCriticalThresholdMinutes?: number;
  notificationEscalationEnabled?: boolean;
  notificationEscalationAfterMinutes?: number;
  notificationEscalationEmail?: string;
  notificationQuietHoursEnabled?: boolean;
  notificationQuietStart?: string;
  notificationQuietEnd?: string;
  notificationBatchEnabled?: boolean;
  notificationBatchIntervalMinutes?: number;
  // DPDP Act 2023
  dpdpConsentEnabled?: boolean;
  dpdpConsentLanguages?: string[];
  dpdpRetentionDays?: number;
  dpdpOptOutSmsEnabled?: boolean;
  dpdpOptOutEmailEnabled?: boolean;
  dpdpOptOutWhatsappEnabled?: boolean;
  dpdpDataFiduciaryName?: string;
  dpdpGrievanceEmail?: string;
  dpdpGrievancePhone?: string;
  // General toggles
  enableAutomatedNotifications?: boolean;
  enablePatientNotifications?: boolean;
  enableDoctorNotifications?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// In-memory fallback cache to ensure zero-downtime even during DB initialisation
let inMemorySettingsCache: LaboratorySettingsData = {
  id: "default-settings",
  labName: "LabCore Enterprise LIS",
  labPhone: "9723561529",
  labEmail: "nikilpanchal5@gmail.com",
  labAddress: "Main Diagnostic Wing, Health City",
  labCity: "Surat",
  labState: "Gujarat",
  labPincode: "395001",
  emailProvider: process.env.EMAIL_PROVIDER || "smtp",
  emailFromEmail: process.env.EMAIL_FROM_EMAIL || "nikilpanchal5@gmail.com",
  emailFromName: process.env.EMAIL_FROM_NAME || "LabCore Enterprise LIS",
  smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
  smtpPort: parseInt(process.env.SMTP_PORT || "587", 10),
  smtpUser: process.env.SMTP_USER || "nikilpanchal5@gmail.com",
  smtpSsl: true,
  smsProvider: process.env.SMS_PROVIDER || "custom",
  whatsappProvider: process.env.WHATSAPP_PROVIDER || "custom",
  callProvider: process.env.CALL_PROVIDER || "custom",
  enableAutomatedNotifications: true,
  enablePatientNotifications: true,
  enableDoctorNotifications: false,
  notificationCriticalThresholdMinutes: 15,
  notificationEscalationEnabled: true,
  notificationEscalationAfterMinutes: 30,
  notificationQuietHoursEnabled: false,
  notificationQuietStart: "22:00",
  notificationQuietEnd: "07:00",
  dpdpConsentEnabled: true,
  dpdpConsentLanguages: ["en", "hi"],
  dpdpRetentionDays: 180,
  dpdpOptOutSmsEnabled: true,
  dpdpOptOutEmailEnabled: true,
  dpdpOptOutWhatsappEnabled: true,
};

let tableEnsured = false;

async function ensureSettingsTable(): Promise<void> {
  if (tableEnsured) return;
  try {
    const count = await prisma.laboratorySettings.count();
    if (count === 0) {
      await prisma.laboratorySettings.create({
        data: {
          id: 'default-settings',
          labName: 'LabCore Enterprise LIS',
          labPhone: '9723561529',
          labEmail: 'nikilpanchal5@gmail.com'
        }
      });
    }
    tableEnsured = true;
  } catch (err) {
    console.warn("Notice: laboratory_settings default row creation skipped or non-fatal error:", err);
  }
}

export const getLaboratorySettings = async (): Promise<LaboratorySettingsData> => {
  return cacheService.remember(
    CacheKeys.laboratorySettings(),
    CacheTTL.THIRTY_MINUTES,
    async () => {
      try {
        await ensureSettingsTable();

        const row = await prisma.laboratorySettings.findFirst();

        if (row) {
          const parsed: LaboratorySettingsData = {
            id: row.id,
            labName: row.labName || inMemorySettingsCache.labName,
            labPhone: row.labPhone || inMemorySettingsCache.labPhone,
            labEmail: row.labEmail || inMemorySettingsCache.labEmail,
            labAddress: row.labAddress || undefined,
            labCity: row.labCity || undefined,
            labState: row.labState || undefined,
            labPincode: row.labPincode || undefined,
            emailProvider: row.emailProvider || "custom",
            emailApiKey: row.emailApiKey || undefined,
            emailFromEmail: row.emailFromEmail || undefined,
            emailFromName: row.emailFromName || undefined,
            smtpHost: row.smtpHost || undefined,
            smtpPort: row.smtpPort ? Number(row.smtpPort) : 587,
            smtpUser: row.smtpUser || undefined,
            smtpPassword: row.smtpPassword || undefined,
            smsProvider: row.smsProvider || "custom",
            smsApiKey: row.smsApiKey || undefined,
            smsApiSecret: row.smsApiSecret || undefined,
            smsSenderId: row.smsSenderId || undefined,
            whatsappProvider: row.whatsappProvider || "custom",
            whatsappPhoneNumberId: row.whatsappPhoneNumberId || undefined,
            whatsappAccessToken: row.whatsappAccessToken || undefined,
            whatsappWebhookUrl: row.whatsappWebhookUrl || undefined,
            whatsappVerifyToken: row.whatsappVerifyToken || undefined,
            whatsappBusinessProfileId: row.whatsappBusinessProfileId || undefined,
            whatsappAIEnabled: row.whatsappAIEnabled ?? false,
            callProvider: row.callProvider || "custom",
            callApiKey: row.callApiKey || undefined,
            callApiSecret: row.callApiSecret || undefined,
            callCallerId: row.callCallerId || undefined,
            enableAutomatedNotifications: row.enableAutomatedNotifications ?? true,
            enablePatientNotifications: row.enablePatientNotifications ?? true,
            enableDoctorNotifications: row.enableDoctorNotifications ?? false,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          };

          // Update in-memory fallback cache
          inMemorySettingsCache = { ...inMemorySettingsCache, ...parsed };
          return parsed;
        }
      } catch (error) {
        console.warn("Database query for laboratory settings failed, using resilient fallback cache:", error);
      }

      return inMemorySettingsCache;
    },
    [CacheTags.SETTINGS]
  );
};

export const updateLaboratorySettings = async (data: LaboratorySettingsData): Promise<LaboratorySettingsData> => {
  // Update in-memory cache immediately
  inMemorySettingsCache = {
    ...inMemorySettingsCache,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  try {
    await ensureSettingsTable();

    const existing = await prisma.laboratorySettings.findFirst();
    if (existing) {
      await prisma.laboratorySettings.update({
        where: { id: existing.id },
        data: {
          labName: data.labName,
          labPhone: data.labPhone,
          labEmail: data.labEmail,
          labAddress: data.labAddress,
          labCity: data.labCity,
          labState: data.labState,
          labPincode: data.labPincode,
          emailProvider: data.emailProvider,
          emailApiKey: data.emailApiKey,
          emailFromEmail: data.emailFromEmail,
          emailFromName: data.emailFromName,
          smtpHost: data.smtpHost,
          smtpPort: data.smtpPort,
          smtpUser: data.smtpUser,
          smtpPassword: data.smtpPassword,
          smsProvider: data.smsProvider,
          smsApiKey: data.smsApiKey,
          smsApiSecret: data.smsApiSecret,
          smsSenderId: data.smsSenderId,
          callProvider: data.callProvider,
          callApiKey: data.callApiKey,
          callApiSecret: data.callApiSecret,
          callCallerId: data.callCallerId,
          whatsappProvider: data.whatsappProvider,
          whatsappPhoneNumberId: data.whatsappPhoneNumberId,
          whatsappAccessToken: data.whatsappAccessToken,
          whatsappWebhookUrl: data.whatsappWebhookUrl,
          whatsappVerifyToken: data.whatsappVerifyToken,
          whatsappBusinessProfileId: data.whatsappBusinessProfileId,
          whatsappAIEnabled: data.whatsappAIEnabled,
        }
      });
    }
  } catch (error) {
    console.warn("Could not persist settings to PostgreSQL, held safely in cache:", error);
  }

  // Invalidate cache immediately on mutation
  await cacheService.invalidateTag(CacheTags.SETTINGS);

  return inMemorySettingsCache;
};