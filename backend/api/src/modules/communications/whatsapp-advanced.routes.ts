import { Router } from "express";
import { validate } from "../../../middleware/validate.middleware";
import { authenticate } from "../../../middleware/auth.middleware";
import {
  createTemplateSchema,
  updateTemplateSchema,
  scheduleMessageSchema,
  bulkMessageSchema,
  autoReplyRuleSchema,
  updateAutoReplyRuleSchema,
  notificationTriggerSchema,
  updateConversationSchema,
  idSchema,
  triggerNotificationRequestSchema,
  createCampaignSchema,
  updateCampaignSchema,
  scheduleCampaignSchema,
  sendMessageWithAISchema,
  processIncomingMessageWithAISchema,
  analyticsDateRangeSchema,
  generateReportSchema,
} from "./whatsapp-advanced.validation";
import {
  createTemplateController,
  getTemplatesController,
  getTemplateByIdController,
  updateTemplateController,
  deleteTemplateController,
  scheduleMessageController,
  getScheduledMessagesController,
  processScheduledMessagesController,
  cancelScheduledMessageController,
  sendBulkMessagesController,
  createAutoReplyRuleController,
  getAutoReplyRulesController,
  updateAutoReplyRuleController,
  deleteAutoReplyRuleController,
  createNotificationTriggerController,
  getNotificationTriggersController,
  triggerNotificationController,
  getConversationsController,
  updateConversationController,
  getIncomingMessagesController,
  markMessageAsProcessedController,
  sendMessageWithAIController,
  getConversationWithAIController,
  getSuggestedResponseController,
  getOptimalEngagementTimeController,
  getPersonalizedContentController,
  updateConversationWithBroadcastController,
  processIncomingMessageWithAIController,
  getDashboardOverviewController,
  createCampaignController,
  getCampaignsController,
  getCampaignController,
  updateCampaignController,
  scheduleCampaignController,
  sendCampaignController,
  cancelCampaignController,
  deleteCampaignController,
  getCampaignStatsController,
  duplicateCampaignController,
  getOverviewMetricsController,
  getTemplatePerformanceController,
  getHourlyMetricsController,
  getDailyMetricsController,
  getSentimentTrendsController,
  getCostAnalysisController,
  getConversationAnalyticsController,
  generateReportController,
  getRealTimeDashboardController,
} from "./whatsapp-advanced.controller";
import {
  verifyWebhook,
  handleWebhook,
} from "./whatsapp-webhook.controller";

const router = Router();

// Webhook endpoints (public, no authentication required)
router.get("/webhook", verifyWebhook);
router.post("/webhook", handleWebhook);

// All other advanced WhatsApp routes require authentication
router.use(authenticate);

// Template Management
router.post("/templates", validate({ body: createTemplateSchema }), createTemplateController);
router.get("/templates", getTemplatesController);
router.get("/templates/:id", validate({ params: idSchema }), getTemplateByIdController);
router.put("/templates/:id", validate({ params: idSchema, body: updateTemplateSchema }), updateTemplateController);
router.delete("/templates/:id", validate({ params: idSchema }), deleteTemplateController);

// Scheduled Messages
router.post("/schedule", validate({ body: scheduleMessageSchema }), scheduleMessageController);
router.get("/scheduled", getScheduledMessagesController);
router.post("/scheduled/process", processScheduledMessagesController);
router.delete("/scheduled/:id", validate({ params: idSchema }), cancelScheduledMessageController);

// Bulk Messaging
router.post("/bulk", validate({ body: bulkMessageSchema }), sendBulkMessagesController);

// Auto-Reply Rules
router.post("/auto-reply", validate({ body: autoReplyRuleSchema }), createAutoReplyRuleController);
router.get("/auto-reply", getAutoReplyRulesController);
router.put("/auto-reply/:id", validate({ params: idSchema, body: updateAutoReplyRuleSchema }), updateAutoReplyRuleController);
router.delete("/auto-reply/:id", validate({ params: idSchema }), deleteAutoReplyRuleController);

// Notification Triggers
router.post("/triggers", validate({ body: notificationTriggerSchema }), createNotificationTriggerController);
router.get("/triggers", getNotificationTriggersController);
router.post("/triggers/trigger", validate({ body: triggerNotificationRequestSchema }), triggerNotificationController);
router.post("/notification-triggers", validate({ body: notificationTriggerSchema }), createNotificationTriggerController);
router.get("/notification-triggers", getNotificationTriggersController);
router.put("/notification-triggers/:id", validate({ params: idSchema }), updateAutoReplyRuleController);
router.delete("/notification-triggers/:id", validate({ params: idSchema }), deleteAutoReplyRuleController);

// Conversation Management
router.get("/conversations", getConversationsController);
router.put("/conversations/:id", validate({ params: idSchema, body: updateConversationSchema }), updateConversationController);

// Incoming Messages
router.get("/incoming", getIncomingMessagesController);
router.put("/incoming/:id/process", validate({ params: idSchema }), markMessageAsProcessedController);

// Messages Direct Endpoints
router.post("/messages/send", sendMessageWithAIController);
router.post("/messages/send-report", sendMessageWithAIController);
router.post("/messages/send-receipt", sendMessageWithAIController);
router.get("/messages", getIncomingMessagesController);

// Premium AI-Powered Features
router.post("/send-with-ai", sendMessageWithAIController);
router.get("/conversations/:id/ai", validate({ params: idSchema }), getConversationWithAIController);
router.get("/conversations/:id/ai-insights", validate({ params: idSchema }), getConversationWithAIController);
router.get("/conversations/:id/suggest", validate({ params: idSchema }), getSuggestedResponseController);
router.get("/conversations/:id/suggested-response", validate({ params: idSchema }), getSuggestedResponseController);
router.get("/patients/:patientId/optimal-time", validate({ params: idSchema }), getOptimalEngagementTimeController);
router.get("/patients/:patientId/optimal-engagement-time", validate({ params: idSchema }), getOptimalEngagementTimeController);
router.get("/patients/:patientId/personalized", validate({ params: idSchema }), getPersonalizedContentController);
router.get("/patients/:patientId/personalized-content", validate({ params: idSchema }), getPersonalizedContentController);
router.put("/conversations/:id/broadcast", validate({ params: idSchema }), updateConversationWithBroadcastController);
router.post("/process-incoming-ai", processIncomingMessageWithAIController);
router.get("/dashboard/overview", getDashboardOverviewController);
router.get("/dashboard", getDashboardOverviewController);

// Campaign Management
router.post("/campaigns", createCampaignController);
router.get("/campaigns", getCampaignsController);
router.get("/campaigns/:id", validate({ params: idSchema }), getCampaignController);
router.put("/campaigns/:id", validate({ params: idSchema }), updateCampaignController);
router.post("/campaigns/:id/schedule", validate({ params: idSchema }), scheduleCampaignController);
router.post("/campaigns/:id/send", validate({ params: idSchema }), sendCampaignController);
router.post("/campaigns/:id/cancel", validate({ params: idSchema }), cancelCampaignController);
router.delete("/campaigns/:id", validate({ params: idSchema }), deleteCampaignController);
router.get("/campaigns/:id/stats", validate({ params: idSchema }), getCampaignStatsController);
router.post("/campaigns/:id/duplicate", validate({ params: idSchema }), duplicateCampaignController);

// Analytics
router.get("/analytics/overview", getOverviewMetricsController);
router.get("/analytics", getOverviewMetricsController);
router.get("/analytics/templates", getTemplatePerformanceController);
router.get("/analytics/hourly", getHourlyMetricsController);
router.get("/analytics/daily", getDailyMetricsController);
router.get("/analytics/sentiment", getSentimentTrendsController);
router.get("/analytics/cost", getCostAnalysisController);
router.get("/analytics/conversations", getConversationAnalyticsController);
router.get("/analytics/report", generateReportController);
router.get("/analytics/realtime", getRealTimeDashboardController);

export default router;