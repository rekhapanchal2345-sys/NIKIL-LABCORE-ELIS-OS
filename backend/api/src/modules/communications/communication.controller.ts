import {
  Request,
  Response,
  NextFunction,
} from "express";

import type { AuthRequest } from "../../../middleware/auth.middleware";
  
import {
  sendPatientEmail,
  sendPatientSMS,
  initiatePatientCall,
  sendPatientWhatsApp,
  getCommunicationHistory,
  getCommunicationById,
  getCommunicationLogs,
  getCommunicationStats,
  getSmsTemplates,
  getEmailTemplates,
  sendBulkSMS,
  retryCommunication,
  markCommunicationRead,
  getPatientConsent,
  updatePatientConsent,
} from "./communication.service";
  
import fs from "fs";
import path from "path";
import {
  successResponse,
  createdResponse,
} from "../../utils/response";
import { verifySMTPConnection, verifyWhatsAppConnection } from "../../lib/communication-providers";
import { updateLaboratorySettings } from "../settings/laboratory-settings.service";

const DOCUMENTS_DIR = path.join(process.cwd(), "uploads", "documents");
if (!fs.existsSync(DOCUMENTS_DIR)) {
  try {
    fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
  } catch (err) {
    console.warn("Could not create documents directory:", err);
  }
}

export const sendEmail = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    
    const result = await sendPatientEmail({
      patientId: body.patientId,
      to: body.to,
      subject: body.subject,
      body: body.body,
      sentById: req.user?.id,
      attachments: body.attachments,
    });

    if (result.status === "FAILED") {
      return res.status(400).json({
        success: false,
        message: result.errorMessage || result.errorReason || "Failed to send email via SMTP",
        data: result,
      });
    }

    return successResponse(
      res,
      result,
      "Email sent successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const sendSMS = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    
    const result = await sendPatientSMS({
      patientId: body.patientId,
      to: body.to,
      message: body.message,
      sentById: req.user?.id,
    });

    return successResponse(
      res,
      result,
      "SMS sent successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const initiateCall = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    
    const result = await initiatePatientCall({
      patientId: body.patientId,
      to: body.to,
      notes: body.notes,
      sentById: req.user?.id,
    });

    return successResponse(
      res,
      result,
      "Call initiated successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const sendWhatsApp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    let mediaUrl = body.mediaUrl;
    let messageText = body.message;

    // If base64 PDF is provided, host it automatically to get a real mediaUrl
    if (body.pdfBase64) {
      try {
        const safeName = (body.filename || `Registration_Form_${Date.now()}.pdf`).replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const fullFileName = `${fileId}_${safeName}`;
        const filePath = path.join(DOCUMENTS_DIR, fullFileName);
        const buffer = Buffer.from(body.pdfBase64, "base64");
        fs.writeFileSync(filePath, buffer);

        const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
        const host = req.get("host") || "localhost:5000";
        mediaUrl = `${protocol}://${host}/api/communications/documents/${fullFileName}`;

        // Append the direct PDF link to the message if not already included
        if (!messageText.includes(mediaUrl)) {
          messageText = `${messageText}\n\n📄 *Official Document PDF:* ${mediaUrl}`;
        }
      } catch (uploadErr) {
        console.warn("Could not host PDF attachment for WhatsApp:", uploadErr);
      }
    }

    const result = await sendPatientWhatsApp({
      patientId: body.patientId,
      to: body.to,
      message: messageText,
      mediaUrl: mediaUrl || undefined,
      pdfBase64: body.pdfBase64,
      filename: body.filename,
      sentById: req.user?.id,
    });

    let cleanNumber = body.to.replace(/\D/g, "");
    if (cleanNumber.length === 10) cleanNumber = `91${cleanNumber}`;
    const directLink = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(messageText)}`;

    if (result.status === "FAILED") {
      return res.status(400).json({
        success: false,
        message: result.errorMessage || result.errorReason || "WhatsApp sending failed via provider",
        data: {
          ...result,
          directLink,
          mediaUrl,
        },
      });
    }

    return successResponse(
      res,
      {
        ...result,
        directLink,
        mediaUrl,
      },
      "WhatsApp message dispatched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const query = (req as any).validated?.query || req.query;
    
    const patientId = params.patientId as string;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const result = await getCommunicationHistory(
      patientId,
      page,
      limit
    );

    return successResponse(
      res,
      result,
      "Communication history fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getOne = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    
    const communication = await getCommunicationById(
      params.id as string
    );

    return successResponse(
      res,
      communication,
      "Communication fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const testSmtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPassword } = req.body || {};
    const custom = (smtpHost || smtpUser || smtpPassword) ? {
      smtpHost: smtpHost || process.env.SMTP_HOST || "smtp.gmail.com",
      smtpPort: smtpPort ? parseInt(String(smtpPort)) : (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587),
      smtpUser: smtpUser || process.env.SMTP_USER,
      smtpPassword: smtpPassword || process.env.SMTP_PASSWORD,
    } : undefined;

    const result = await verifySMTPConnection(custom);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || "SMTP verification failed",
      });
    }

    return successResponse(res, { verified: true }, "SMTP connection verified successfully!");
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error?.message || "SMTP verification failed",
    });
  }
};

export const updateSmtpSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { smtpPassword, smtpUser, smtpHost, smtpPort, emailFromEmail, emailFromName } = req.body || {};

    if (smtpPassword) process.env.SMTP_PASSWORD = smtpPassword;
    if (smtpUser) process.env.SMTP_USER = smtpUser;
    if (smtpHost) process.env.SMTP_HOST = smtpHost;
    if (smtpPort) process.env.SMTP_PORT = String(smtpPort);
    if (emailFromEmail) process.env.EMAIL_FROM_EMAIL = emailFromEmail;
    if (emailFromName) process.env.EMAIL_FROM_NAME = emailFromName;

    await updateLaboratorySettings({
      smtpPassword,
      smtpUser,
      smtpHost,
      smtpPort: smtpPort ? parseInt(String(smtpPort)) : undefined,
      emailFromEmail,
      emailFromName,
      emailProvider: "smtp",
    });

    return successResponse(res, { updated: true }, "SMTP settings updated successfully");
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to update SMTP settings",
    });
  }
};

export const uploadPdf = async (req: Request, res: Response) => {
  try {
    const { filename, content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: "PDF base64 content is required" });
    }
    const safeName = (filename || `document_${Date.now()}.pdf`).replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const fullFileName = `${fileId}_${safeName}`;
    const filePath = path.join(DOCUMENTS_DIR, fullFileName);

    const buffer = Buffer.from(content, "base64");
    fs.writeFileSync(filePath, buffer);

    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.get("host") || "localhost:5000";
    const publicUrl = `${protocol}://${host}/api/communications/documents/${fullFileName}`;

    return successResponse(
      res,
      {
        fileId: fullFileName,
        filename: safeName,
        url: publicUrl,
        size: buffer.length,
      },
      "PDF uploaded and hosted successfully"
    );
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Failed to host PDF" });
  }
};

export const serveDocument = async (req: Request, res: Response) => {
  try {
    const fileIdParam = req.params.fileId;
    const fileId = Array.isArray(fileIdParam) ? fileIdParam[0] : fileIdParam;
    const safeFile = path.basename(fileId || "");
    const filePath = path.join(DOCUMENTS_DIR, safeFile);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${safeFile}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Failed to serve document" });
  }
};

export const testWhatsApp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { whatsappProvider, whatsappApiKey, whatsappApiSecret, whatsappSenderId } = req.body || {};
    const custom = (whatsappApiKey || whatsappApiSecret) ? {
      whatsappProvider: whatsappProvider || "twilio",
      whatsappApiKey,
      whatsappApiSecret,
      whatsappSenderId: whatsappSenderId || "whatsapp:+14155238886",
    } : undefined;

    const result = await verifyWhatsAppConnection(custom);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || "WhatsApp API verification failed",
      });
    }

    return successResponse(res, { verified: true }, "WhatsApp API verified successfully!");
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err?.message || "WhatsApp verification failed",
    });
  }
};

export const updateWhatsAppSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { whatsappProvider, whatsappApiKey, whatsappApiSecret, whatsappSenderId, whatsappBusinessNumber } = req.body || {};

    if (whatsappProvider) process.env.WHATSAPP_PROVIDER = whatsappProvider;
    if (whatsappApiKey) process.env.WHATSAPP_API_KEY = whatsappApiKey;
    if (whatsappApiSecret) process.env.WHATSAPP_API_SECRET = whatsappApiSecret;
    if (whatsappSenderId) process.env.WHATSAPP_SENDER_ID = whatsappSenderId;
    if (whatsappBusinessNumber) process.env.WHATSAPP_BUSINESS_NUMBER = whatsappBusinessNumber;

    return successResponse(res, { updated: true }, "WhatsApp settings updated successfully");
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Failed to update WhatsApp settings" });
  }
};

/**
 * ISS-016: Get all communication logs
 */
export const getLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, type, status, patientId } = req.query as any;
    const result = await getCommunicationLogs({ page, limit, type, status, patientId });
    return successResponse(res, result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Failed to fetch logs" });
  }
};

/**
 * ISS-016: Get communication stats
 */
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getCommunicationStats();
    return successResponse(res, stats);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Failed to fetch stats" });
  }
};

/**
 * ISS-016: Get SMS templates
 */
export const getSmsTemplatesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await getSmsTemplates();
    return successResponse(res, templates);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Failed to fetch SMS templates" });
  }
};

/**
 * ISS-016: Get Email templates
 */
export const getEmailTemplatesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await getEmailTemplates();
    return successResponse(res, templates);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Failed to fetch Email templates" });
  }
};

/**
 * ISS-016: Bulk SMS dispatch
 */
export const sendBulk = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { recipients } = req.body || {};
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ success: false, message: "Recipients array is required" });
    }
    const result = await sendBulkSMS(recipients, req.user?.id);
    return successResponse(res, result, "Bulk dispatch initiated");
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Failed to send bulk SMS" });
  }
};

/**
 * ISS-016: Retry failed communication
 */
export const retryOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await retryCommunication(id);
    return successResponse(res, result, "Communication retried successfully");
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Failed to retry communication" });
  }
};

/**
 * ISS-016: Mark communication as read
 */
export const markRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await markCommunicationRead(id);
    return successResponse(res, result, "Communication marked as read");
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Failed to update communication status" });
  }
};

/**
 * ISS-016: Get DPDP communication consent for patient
 */
export const getConsent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = Array.isArray(req.params.patientId) ? req.params.patientId[0] : req.params.patientId;
    const consent = await getPatientConsent(patientId);
    return successResponse(res, consent);
  } catch (err: any) {
    return res.status(404).json({ success: false, message: err?.message || "Patient consent record not found" });
  }
};

/**
 * ISS-016: Update DPDP communication consent for patient
 */
export const updateConsent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = Array.isArray(req.params.patientId) ? req.params.patientId[0] : req.params.patientId;
    const { sms, email, whatsapp, call } = req.body || {};
    const result = await updatePatientConsent(patientId, { sms, email, whatsapp, call });
    return successResponse(res, result, "Patient communication consent updated");
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Failed to update consent" });
  }
};