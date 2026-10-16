import prisma from "../../lib/prisma";
import { sendEmail, sendSMS, initiateCall, sendWhatsApp } from "../../lib/communication-providers";
import { CommunicationType } from "@prisma/client";

interface SendEmailInput {
  patientId: string;
  to: string;
  subject: string;
  body: string;
  sentById?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    contentType?: string;
  }>;
}

interface SendSMSInput {
  patientId: string;
  to: string;
  message: string;
  sentById?: string;
}

interface InitiateCallInput {
  patientId: string;
  to: string;
  notes?: string;
  sentById?: string;
}

interface SendWhatsAppInput {
  patientId: string;
  to: string;
  message: string;
  mediaUrl?: string;
  pdfBase64?: string;
  filename?: string;
  sentById?: string;
}

export const sendPatientEmail = async (data: SendEmailInput) => {
  // Verify patient exists by ID or UHID
  let patient = await prisma.patient.findUnique({
    where: { id: data.patientId },
  });

  if (!patient) {
    patient = await prisma.patient.findFirst({
      where: { uhid: data.patientId },
    });
  }

  if (!patient) {
    throw new Error("Patient record not found in system");
  }

  // Create communication log with PENDING status
  const communicationLog = await prisma.communicationLog.create({
    data: {
      patientId: patient.id,
      type: CommunicationType.EMAIL,
      status: "PENDING",
      recipientContact: data.to,
      subject: data.subject,
      message: data.body,
      sentById: data.sentById,
    },
  });

  try {
    // Send email using provider
    const result = await sendEmail({
      to: data.to,
      subject: data.subject,
      body: data.body,
      attachments: data.attachments,
    });

    // Update communication log with result
    const updatedLog = await prisma.communicationLog.update({
      where: { id: communicationLog.id },
      data: {
        status: result.success ? "SENT" : "FAILED",
        provider: result.provider,
        providerMessageId: result.messageId,
        errorReason: result.error,
        errorMessage: result.error ? result.error : null,
        sentAt: new Date(),
        failedAt: result.success ? null : new Date(),
      },
    });

    return updatedLog;
  } catch (error) {
    // Update communication log with failure
    await prisma.communicationLog.update({
      where: { id: communicationLog.id },
      data: {
        status: "FAILED",
        errorReason: "Provider error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        failedAt: new Date(),
      },
    });

    throw error;
  }
};

export const sendPatientSMS = async (data: SendSMSInput) => {
  // Verify patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: data.patientId },
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  // Create communication log with PENDING status
  const communicationLog = await prisma.communicationLog.create({
    data: {
      patientId: data.patientId,
      type: CommunicationType.SMS,
      status: "PENDING",
      recipientContact: data.to,
      message: data.message,
      sentById: data.sentById,
    },
  });

  try {
    // Send SMS using provider
    const result = await sendSMS({
      to: data.to,
      message: data.message,
    });

    // Update communication log with result
    const updatedLog = await prisma.communicationLog.update({
      where: { id: communicationLog.id },
      data: {
        status: result.success ? "SENT" : "FAILED",
        provider: result.provider,
        providerMessageId: result.messageId,
        errorReason: result.error,
        errorMessage: result.error ? result.error : null,
        sentAt: new Date(),
        failedAt: result.success ? null : new Date(),
      },
    });

    return updatedLog;
  } catch (error) {
    // Update communication log with failure
    await prisma.communicationLog.update({
      where: { id: communicationLog.id },
      data: {
        status: "FAILED",
        errorReason: "Provider error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        failedAt: new Date(),
      },
    });

    throw error;
  }
};

export const initiatePatientCall = async (data: InitiateCallInput) => {
  // Verify patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: data.patientId },
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  // Create communication log with PENDING status
  const communicationLog = await prisma.communicationLog.create({
    data: {
      patientId: data.patientId,
      type: CommunicationType.CALL,
      status: "PENDING",
      recipientContact: data.to,
      message: data.notes || "",
      sentById: data.sentById,
    },
  });

  try {
    // Initiate call using provider
    const result = await initiateCall({
      to: data.to,
      notes: data.notes,
    });

    // Update communication log with result
    const updatedLog = await prisma.communicationLog.update({
      where: { id: communicationLog.id },
      data: {
        status: result.success ? "SENT" : "FAILED",
        provider: result.provider,
        providerMessageId: result.callId,
        errorReason: result.error,
        errorMessage: result.error ? result.error : null,
        sentAt: new Date(),
        failedAt: result.success ? null : new Date(),
      },
    });

    return updatedLog;
  } catch (error) {
    // Update communication log with failure
    await prisma.communicationLog.update({
      where: { id: communicationLog.id },
      data: {
        status: "FAILED",
        errorReason: "Provider error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        failedAt: new Date(),
      },
    });

    throw error;
  }
};

export const getCommunicationHistory = async (
  patientId: string,
  page = 1,
  limit = 20
) => {
  const skip = (page - 1) * limit;

  const [communications, total] = await Promise.all([
    prisma.communicationLog.findMany({
      where: { patientId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        sentBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    }),
    prisma.communicationLog.count({
      where: { patientId },
    }),
  ]);

  return {
    communications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};

export const getCommunicationById = async (id: string) => {
  const communication = await prisma.communicationLog.findUnique({
    where: { id },
    include: {
      patient: true,
      sentBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!communication) {
    throw new Error("Communication not found");
  }

  return communication;
};

export const sendPatientWhatsApp = async (data: SendWhatsAppInput) => {
  // Verify patient exists by ID or UHID
  let patient = await prisma.patient.findUnique({
    where: { id: data.patientId },
  });

  if (!patient) {
    patient = await prisma.patient.findFirst({
      where: { uhid: data.patientId },
    });
  }

  if (!patient) {
    throw new Error("Patient not found");
  }

  // Create communication log with PENDING status
  const communicationLog = await prisma.communicationLog.create({
    data: {
      patientId: patient.id,
      type: "WHATSAPP" as any,
      status: "PENDING",
      recipientContact: data.to,
      message: data.message,
      sentById: data.sentById,
    },
  });

  try {
    // Send WhatsApp message using provider
    const result = await sendWhatsApp({
      to: data.to,
      message: data.message,
      mediaUrl: data.mediaUrl,
    });

    // Update communication log with result
    const updatedLog = await prisma.communicationLog.update({
      where: { id: communicationLog.id },
      data: {
        status: result.success ? "SENT" : "FAILED",
        provider: result.provider,
        providerMessageId: result.messageId,
        errorReason: result.error,
        errorMessage: result.error ? result.error : null,
        sentAt: new Date(),
        failedAt: result.success ? null : new Date(),
      },
    });

    return updatedLog;
  } catch (error) {
    // Update communication log with failure
    await prisma.communicationLog.update({
      where: { id: communicationLog.id },
      data: {
        status: "FAILED",
        errorReason: "Provider error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        failedAt: new Date(),
      },
    });

    throw error;
  }
};

/**
 * ISS-016: Get all communication logs with filtering and pagination
 */
export const getCommunicationLogs = async (params: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  patientId?: string;
}) => {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params.type) where.type = params.type;
  if (params.status) where.status = params.status;
  if (params.patientId) where.patientId = params.patientId;

  const [logs, total] = await Promise.all([
    prisma.communicationLog.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            uhid: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.communicationLog.count({ where }),
  ]);

  return {
    data: logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * ISS-016: Get aggregated communication statistics
 */
export const getCommunicationStats = async () => {
  const [total, sent, delivered, failed, pending] = await Promise.all([
    prisma.communicationLog.count(),
    prisma.communicationLog.count({ where: { status: "SENT" } }),
    prisma.communicationLog.count({ where: { status: "DELIVERED" } }),
    prisma.communicationLog.count({ where: { status: "FAILED" } }),
    prisma.communicationLog.count({ where: { status: "PENDING" } }),
  ]);

  return {
    total,
    sent,
    delivered,
    failed,
    pending,
    deliveryRate: total > 0 ? Number(((delivered + sent) / total * 100).toFixed(1)) : 100,
  };
};

/**
 * ISS-016: Get active SMS templates
 */
export const getSmsTemplates = async () => {
  return await prisma.notificationTemplate.findMany({
    where: { channel: "SMS", isActive: true },
    orderBy: { name: "asc" },
  });
};

/**
 * ISS-016: Get active Email templates
 */
export const getEmailTemplates = async () => {
  return await prisma.notificationTemplate.findMany({
    where: { channel: "EMAIL", isActive: true },
    orderBy: { name: "asc" },
  });
};

/**
 * ISS-016: Send bulk SMS to multiple recipients
 */
export const sendBulkSMS = async (
  recipients: Array<{ patientId: string; phone: string; message: string }>,
  sentById?: string
) => {
  const results: Array<{ patientId: string; phone: string; success: boolean; error?: string }> = [];

  for (const item of recipients) {
    try {
      await sendPatientSMS({
        patientId: item.patientId,
        to: item.phone,
        message: item.message,
        sentById,
      });
      results.push({ patientId: item.patientId, phone: item.phone, success: true });
    } catch (err) {
      results.push({
        patientId: item.patientId,
        phone: item.phone,
        success: false,
        error: err instanceof Error ? err.message : "Delivery failed",
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  return {
    total: recipients.length,
    sent: successCount,
    failed: recipients.length - successCount,
    results,
  };
};

/**
 * ISS-016: Retry a failed communication
 */
export const retryCommunication = async (communicationId: string) => {
  const log = await prisma.communicationLog.findUnique({
    where: { id: communicationId },
  });

  if (!log) {
    throw new Error("Communication log not found");
  }

  if (log.type === "EMAIL") {
    return await sendPatientEmail({
      patientId: log.patientId,
      to: log.recipientContact,
      subject: log.subject || "LabCore Notification",
      body: log.message,
      sentById: log.sentById ?? undefined,
    });
  } else if (log.type === "SMS") {
    return await sendPatientSMS({
      patientId: log.patientId,
      to: log.recipientContact,
      message: log.message,
      sentById: log.sentById ?? undefined,
    });
  } else if (log.type === "WHATSAPP") {
    return await sendPatientWhatsApp({
      patientId: log.patientId,
      to: log.recipientContact,
      message: log.message,
      sentById: log.sentById ?? undefined,
    });
  }

  throw new Error(`Unsupported retry for type: ${log.type}`);
};

/**
 * ISS-016: Mark a communication as read
 */
export const markCommunicationRead = async (communicationId: string) => {
  const log = await prisma.communicationLog.findUnique({
    where: { id: communicationId },
  });

  if (!log) {
    throw new Error("Communication log not found");
  }

  const existingMeta = (log.metadata as Record<string, any>) || {};
  return await prisma.communicationLog.update({
    where: { id: communicationId },
    data: {
      status: "DELIVERED",
      deliveredAt: log.deliveredAt || new Date(),
      metadata: {
        ...existingMeta,
        read: true,
        readAt: new Date().toISOString(),
      },
    },
  });
};

/**
 * ISS-016: Get DPDP communication consent for patient
 */
export const getPatientConsent = async (patientId: string) => {
  const patient = await prisma.patient.findFirst({
    where: { OR: [{ id: patientId }, { uhid: patientId }] },
    select: {
      id: true,
      uhid: true,
      communicationPreference: true,
      consentForTreatment: true,
      consentForDataSharing: true,
      consentForMarketing: true,
    },
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  const prefs = (patient.communicationPreference as Record<string, any>) || {};
  return {
    patientId: patient.id,
    uhid: patient.uhid,
    consent: {
      sms: prefs.sms ?? true,
      email: prefs.email ?? true,
      whatsapp: prefs.whatsapp ?? true,
      call: prefs.call ?? true,
    },
    consentForTreatment: patient.consentForTreatment,
    consentForDataSharing: patient.consentForDataSharing,
    consentForMarketing: patient.consentForMarketing,
  };
};

/**
 * ISS-016: Update DPDP communication consent for patient
 */
export const updatePatientConsent = async (
  patientId: string,
  consentData: { sms?: boolean; email?: boolean; whatsapp?: boolean; call?: boolean }
) => {
  const patient = await prisma.patient.findFirst({
    where: { OR: [{ id: patientId }, { uhid: patientId }] },
    select: { id: true, communicationPreference: true },
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  const currentPrefs = (patient.communicationPreference as Record<string, any>) || {};
  const updatedPrefs = { ...currentPrefs, ...consentData };

  await prisma.patient.update({
    where: { id: patient.id },
    data: {
      communicationPreference: updatedPrefs,
    },
  });

  return {
    patientId: patient.id,
    consent: updatedPrefs,
    updatedAt: new Date(),
  };
};