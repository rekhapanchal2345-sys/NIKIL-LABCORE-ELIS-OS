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
  getSmsTemplatesHandler,
  getEmailTemplatesHandler,
  sendBulk,
  retryOne,
  markRead,
  getConsent,
  updateConsent,
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

// Bulk SMS dispatch
router.post("/sms/bulk", sendBulk);

// SMS & Email Templates
router.get("/sms/templates", getSmsTemplatesHandler);
router.get("/email/templates", getEmailTemplatesHandler);

// Initiate call to patient
router.post("/call", validate({ body: initiateCallSchema }), initiateCall);

// Aggregated communication stats & logs
router.get("/stats", getStats);
router.get("/logs", getLogs);

// DPDP Communication Consent (specific patient)
router.get("/consent/:patientId", getConsent);
router.put("/consent/:patientId", updateConsent);

// Get communication history for a patient
router.get("/history/:patientId", validate({ params: communicationHistorySchema }), getHistory);

// Per-message actions (mounted before generic /:id lookup to prevent shadowing)
router.post("/:id/retry", retryOne);
router.patch("/:id/read", markRead);

// Get specific communication details
router.get("/:id", validate({ params: communicationIdSchema }), getOne);

export default router;