import { Router } from "express";
import { validate } from "../../../middleware/validate.middleware";
import { authenticate } from "../../../middleware/auth.middleware";
import {
  sendEmailSchema,
  sendSMSSchema,
  initiateCallSchema,
  sendWhatsAppSchema,
  communicationHistorySchema,
  communicationIdSchema,
} from "./communication.validation";
import {
  sendEmail,
  sendSMS,
  initiateCall,
  sendWhatsApp,
  getHistory,
  getOne,
  testSmtp,
  updateSmtpSettings,
  uploadPdf,
  serveDocument,
  testWhatsApp,
  updateWhatsAppSettings,
  getLogs,
  getStats,
  getSmsTemplates,
  getEmailTemplates,
  sendBulkSms,
  retryCommunication,
  markCommunicationRead,
  getPatientConsent,
} from "./communication.controller";

const router = Router();

// Public Document Serving (for WhatsApp / SMS / Patient Download Links)
router.get("/documents/:fileId", serveDocument);

// All other communication routes require authentication
router.use(authenticate);

// Upload & Host PDF document
router.post("/upload-pdf", uploadPdf);

// Send email to patient
router.post("/email", validate({ body: sendEmailSchema }), sendEmail);

// Test SMTP connection
router.post("/test-smtp", testSmtp);

// Update SMTP settings (App Password, etc.)
router.post("/smtp-settings", updateSmtpSettings);

// Send WhatsApp message to patient
router.post("/whatsapp", validate({ body: sendWhatsAppSchema }), sendWhatsApp);

// Test WhatsApp connection (Twilio, etc.)
router.post("/test-whatsapp", testWhatsApp);

// Update WhatsApp settings
router.post("/whatsapp-settings", updateWhatsAppSettings);

// Send SMS to patient
router.post("/sms", validate({ body: sendSMSSchema }), sendSMS);

// Initiate call to patient
router.post("/call", validate({ body: initiateCallSchema }), initiateCall);

// Get communication history for a patient
router.get("/history/:patientId", validate({ params: communicationHistorySchema }), getHistory);

// Get specific communication details
router.get("/:id", validate({ params: communicationIdSchema }), getOne);

// The following 8 endpoints are needed by the frontend lib/api.ts

router.get("/logs", getLogs);
router.get("/stats", getStats);
router.get("/sms/templates", getSmsTemplates);
router.get("/email/templates", getEmailTemplates);
router.post("/sms/bulk", sendBulkSms);
router.post("/:id/retry", retryCommunication);
router.post("/:id/read", markCommunicationRead);
router.get("/consent/:patientId", getPatientConsent);

export default router;