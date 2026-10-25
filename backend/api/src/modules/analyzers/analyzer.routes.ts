import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/rbac.middleware";
import { validate } from "../../../middleware/validate.middleware";

import {
  // Analyzer CRUD
  create,
  list,
  getOne,
  update,
  archive,
  remove,
  // Status Management
  updateStatus,
  heartbeat,
  handleSimulatorEventRecord,
  // Calibration
  createCalibrationRecord,
  listCalibrations,
  getCalibrationRecord,
  // Maintenance
  createMaintenanceRecord,
  listMaintenances,
  updateMaintenanceRecord,
  // Test Mapping
  createMapping,
  listMappings,
  updateMapping,
  deleteMapping,
  // Jobs
  createJob,
  listJobs,
  updateJob,
  // Health & Alerts
  getHealth,
  createAlert,
  listAlerts,
  acknowledgeAlertRecord,
  resolveAlertRecord,
  // Communication Logs
  listCommunicationLogs,
  // Advanced Connectivity Features
  testConnection,
  getConnectionStatus,
  getConnectionMetrics,
  startConnectionMonitoring,
  stopConnectionMonitoring,
  sendTestMessage,
  // Protocol Support
  parseASTMMessage,
  parseHL7Message,
  generateASTMMessage,
  generateHL7Message,
  // Legacy
  createLog,
  listLogs,
  getLog,
  processLog,
  failLog,
  removeLog,
  // New Features
  createPortMappingRecord,
  listPortMappings,
  createQCRuleRecord,
  listQCRules,
  updateQCRuleRecord,
  deleteQCRuleRecord,
  listReflexRules,
  createReflexRuleRecord,
  getWorkloadBalance,
  autoBalanceFleetRecord,
  getMaintenanceLogbookRecord,
  signOffMaintenanceRecord,
  createWorklistEntryRecord,
  listWorklistEntries,
  updateWorklistEntryRecord,
  getDemoData,
} from "./analyzer.controller";

import {
  analyzerIdSchema,
  createAnalyzerSchema,
  updateAnalyzerSchema,
  analyzerQuerySchema,
  updateStatusSchema,
  heartbeatSchema,
  createCalibrationSchema,
  calibrationQuerySchema,
  createMaintenanceSchema,
  updateMaintenanceSchema,
  maintenanceQuerySchema,
  createTestMappingSchema,
  updateTestMappingSchema,
  testMappingQuerySchema,
  createAnalyzerJobSchema,
  updateAnalyzerJobSchema,
  analyzerJobQuerySchema,
  createAlertSchema,
  resolveAlertSchema,
  alertQuerySchema,
  communicationLogQuerySchema,
  createAnalyzerLogSchema,
  analyzerLogQuerySchema,
  // Advanced Connectivity Validation
  testConnectionSchema,
  connectionMonitoringSchema,
  testMessageSchema,
  // Protocol Support Validation
  parseASTMSchema,
  parseHL7Schema,
  generateASTMSchema,
  generateHL7Schema,
  simulatorEventSchema,
} from "./analyzer.validation";

const router = Router();

// All analyzer routes require authentication
router.use(authenticate);

// =======================================================
// ANALYZER CRUD ROUTES
// =======================================================

// Create Analyzer - Admin and Lab Tech
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ body: createAnalyzerSchema }),
  create
);

// List Analyzers - All authenticated users
router.get(
  "/",
  validate({ query: analyzerQuerySchema }),
  list
);

// Count Analyzers - All authenticated users
router.get(
  "/count",
  list
);

// Update Analyzer - Admin and Lab Tech
router.patch(
  "/:id",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ params: analyzerIdSchema, body: updateAnalyzerSchema }),
  update
);

// Archive Analyzer - Admin only
router.post(
  "/:id/archive",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate({ params: analyzerIdSchema }),
  archive
);

// Delete Analyzer - Admin only (soft delete via archive)
router.delete(
  "/:id",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate({ params: analyzerIdSchema }),
  remove
);

// =======================================================
// ANALYZER STATUS MANAGEMENT
// =======================================================

// Update Status - Admin and Lab Tech
router.patch(
  "/:id/status",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ params: analyzerIdSchema, body: updateStatusSchema }),
  updateStatus
);

// Record Heartbeat - For analyzer integration (internal)
router.post(
  "/:id/heartbeat",
  validate({ params: analyzerIdSchema, body: heartbeatSchema }),
  heartbeat
);

// Virtual Machine Simulator Event Ingestion - Integration Engine
router.post(
  "/simulator/event",
  validate({ body: simulatorEventSchema }),
  handleSimulatorEventRecord
);

router.post(
  "/simulator-event",
  validate({ body: simulatorEventSchema }),
  handleSimulatorEventRecord
);

router.post(
  "/:id/simulator-event",
  validate({ body: simulatorEventSchema }),
  handleSimulatorEventRecord
);

// =======================================================
// CALIBRATION MANAGEMENT
// =======================================================

// Create Calibration - Admin and Lab Tech
router.post(
  "/calibrations",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ body: createCalibrationSchema }),
  createCalibrationRecord
);

// List Calibrations - All authenticated users
router.get(
  "/calibrations",
  validate({ query: calibrationQuerySchema }),
  listCalibrations
);

// Get Calibration - All authenticated users
router.get(
  "/calibrations/:id",
  validate({ params: analyzerIdSchema }),
  getCalibrationRecord
);

// =======================================================
// MAINTENANCE MANAGEMENT
// =======================================================

// Create Maintenance - Admin and Lab Tech
router.post(
  "/maintenances",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ body: createMaintenanceSchema }),
  createMaintenanceRecord
);

// List Maintenances - All authenticated users
router.get(
  "/maintenances",
  validate({ query: maintenanceQuerySchema }),
  listMaintenances
);

// Update Maintenance - Admin and Lab Tech
router.patch(
  "/maintenances/:id",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ params: analyzerIdSchema, body: updateMaintenanceSchema }),
  updateMaintenanceRecord
);

// =======================================================
// TEST CODE MAPPING
// =======================================================

// Create Test Mapping - Admin and Lab Tech
router.post(
  "/test-mappings",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ body: createTestMappingSchema }),
  createMapping
);

// List Test Mappings - All authenticated users
router.get(
  "/test-mappings",
  validate({ query: testMappingQuerySchema }),
  listMappings
);

// Update Test Mapping - Admin and Lab Tech
router.patch(
  "/test-mappings/:id",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ params: analyzerIdSchema, body: updateTestMappingSchema }),
  updateMapping
);

// Delete Test Mapping - Admin and Lab Tech
router.delete(
  "/test-mappings/:id",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ params: analyzerIdSchema }),
  deleteMapping
);

// =======================================================
// ANALYZER JOB MANAGEMENT
// =======================================================

// Create Analyzer Job - Admin and Lab Tech
router.post(
  "/jobs",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ body: createAnalyzerJobSchema }),
  createJob
);

// List Analyzer Jobs - All authenticated users
router.get(
  "/jobs",
  validate({ query: analyzerJobQuerySchema }),
  listJobs
);

// Update Analyzer Job - Admin and Lab Tech
router.patch(
  "/jobs/:id",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ params: analyzerIdSchema, body: updateAnalyzerJobSchema }),
  updateJob
);

// =======================================================
// ANALYZER HEALTH & ALERTS
// =======================================================

// Get Analyzer Health - All authenticated users
router.get(
  "/health",
  getHealth
);

// Create Alert - Admin and Lab Tech
router.post(
  "/alerts",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ body: createAlertSchema }),
  createAlert
);

// List Alerts - All authenticated users
router.get(
  "/alerts",
  validate({ query: alertQuerySchema }),
  listAlerts
);

// Acknowledge Alert - Admin and Lab Tech
router.post(
  "/alerts/:id/acknowledge",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ params: analyzerIdSchema }),
  acknowledgeAlertRecord
);

// Resolve Alert - Admin and Lab Tech
router.post(
  "/alerts/:id/resolve",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ params: analyzerIdSchema, body: resolveAlertSchema }),
  resolveAlertRecord
);

// =======================================================
// COMMUNICATION LOGS
// =======================================================

// List Communication Logs - All authenticated users
router.get(
  "/communication-logs",
  validate({ query: communicationLogQuerySchema }),
  listCommunicationLogs
);

// =======================================================
// ADVANCED CONNECTIVITY FEATURES
// =======================================================

// Test Connection - Admin and Lab Tech
router.post(
  "/:id/test-connection",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ params: analyzerIdSchema, body: testConnectionSchema }),
  testConnection
);

// Get Connection Status - All authenticated users
router.get(
  "/:id/connection-status",
  validate({ params: analyzerIdSchema }),
  getConnectionStatus
);

// Get Connection Metrics - All authenticated users
router.get(
  "/:id/connection-metrics",
  validate({ params: analyzerIdSchema }),
  getConnectionMetrics
);

// Start Connection Monitoring - Admin and Lab Tech
router.post(
  "/:id/start-monitoring",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ params: analyzerIdSchema, body: connectionMonitoringSchema }),
  startConnectionMonitoring
);

// Stop Connection Monitoring - Admin and Lab Tech
router.post(
  "/:id/stop-monitoring",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ params: analyzerIdSchema }),
  stopConnectionMonitoring
);

// Send Test Message - Admin and Lab Tech
router.post(
  "/:id/send-test-message",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ params: analyzerIdSchema, body: testMessageSchema }),
  sendTestMessage
);

// =======================================================
// PROTOCOL SUPPORT (ASTM/HL7)
// =======================================================

// Parse ASTM Message - Admin and Lab Tech
router.post(
  "/parse-astm",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ body: parseASTMSchema }),
  parseASTMMessage
);

// Alias for direct ASTM posting
router.post(
  "/astm",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ body: parseASTMSchema }),
  parseASTMMessage
);

// Parse HL7 Message - Admin and Lab Tech
router.post(
  "/parse-hl7",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ body: parseHL7Schema }),
  parseHL7Message
);

// Alias for direct HL7 posting
router.post(
  "/hl7",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ body: parseHL7Schema }),
  parseHL7Message
);

// Generate ASTM Message - Admin and Lab Tech
router.post(
  "/generate-astm",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ body: generateASTMSchema }),
  generateASTMMessage
);

// Generate HL7 Message - Admin and Lab Tech
router.post(
  "/generate-hl7",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ body: generateHL7Schema }),
  generateHL7Message
);

// =======================================================
// LEGACY ANALYZER LOG ROUTES (for backward compatibility)
// =======================================================

// Create Analyzer Log - Admin and Lab Tech
router.post(
  "/logs",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ body: createAnalyzerLogSchema }),
  createLog
);

// List Analyzer Logs - Admin, Lab Tech, and Pathologist
router.get(
  "/logs",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH, UserRole.PATHOLOGIST),
  validate({ query: analyzerLogQuerySchema }),
  listLogs
);

// Get Analyzer Log - Admin, Lab Tech, and Pathologist
router.get(
  "/logs/:id",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH, UserRole.PATHOLOGIST),
  validate({ params: analyzerIdSchema }),
  getLog
);

// Mark Processed - Admin and Lab Tech
router.post(
  "/logs/:id/process",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ params: analyzerIdSchema }),
  processLog
);

// Mark Failed - Admin and Lab Tech
router.post(
  "/logs/:id/fail",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  validate({ params: analyzerIdSchema }),
  failLog
);

// Delete Log - Admin only
router.delete(
  "/logs/:id",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate({ params: analyzerIdSchema }),
  removeLog
);

// =======================================================
// PORT MAPPING ROUTES
// =======================================================

// Create Port Mapping - Admin and Lab Tech
router.post(
  "/port-mappings",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  createPortMappingRecord
);

// List Port Mappings - All authenticated users
router.get(
  "/port-mappings",
  listPortMappings
);

// =======================================================
// QC RULES ROUTES
// =======================================================

// Create QC Rule - Admin and Lab Tech
router.post(
  "/qc-rules",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  createQCRuleRecord
);

// List QC Rules - All authenticated users
router.get(
  "/qc-rules",
  listQCRules
);

// Update QC Rule - Admin and Lab Tech
router.patch(
  "/qc-rules/:id",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  updateQCRuleRecord
);

// Delete QC Rule - Admin only
router.delete(
  "/qc-rules/:id",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  deleteQCRuleRecord
);

// =======================================================
// REFLEX & CASCADE TESTING
// =======================================================

router.get(
  "/reflex-rules",
  listReflexRules
);

router.post(
  "/reflex-rules",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  createReflexRuleRecord
);

// =======================================================
// SMART FLEET WORKLOAD BALANCER
// =======================================================

router.get(
  "/workload-balance",
  getWorkloadBalance
);

router.post(
  "/workload-balance",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  autoBalanceFleetRecord
);

router.post(
  "/workload-balance/auto-balance",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  autoBalanceFleetRecord
);

// =======================================================
// MAINTENANCE LOGBOOK & NABL COMPLIANCE
// =======================================================

router.get(
  "/maintenance-logbook",
  getMaintenanceLogbookRecord
);

router.post(
  "/maintenance-logbook/sign-off",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  signOffMaintenanceRecord
);

// =======================================================
// WORKLIST ROUTES
// =======================================================

// Create Worklist Entry - Admin and Lab Tech
router.post(
  "/worklist",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  createWorklistEntryRecord
);

// List Worklist Entries - All authenticated users
router.get(
  "/worklist",
  listWorklistEntries
);

// Update Worklist Entry - Admin and Lab Tech
router.patch(
  "/worklist/:id",
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECH),
  updateWorklistEntryRecord
);

// =======================================================
// DEMO MODE ROUTES
// =======================================================

// Get Demo Data - All authenticated users
router.get(
  "/demo-data",
  getDemoData
);

// Get Analyzer - All authenticated users.
// Keep this after static collection routes so paths such as /health and
// /communication-logs are not interpreted as analyzer IDs.
router.get(
  "/:id",
  validate({ params: analyzerIdSchema }),
  getOne
);

export default router;