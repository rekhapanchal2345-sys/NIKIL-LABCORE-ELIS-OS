import { z } from "zod";

// =======================================================
// COMMON SCHEMAS
// =======================================================

export const analyzerIdSchema = z.object({
  id: z.string().min(1).max(100),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// =======================================================
// ANALYZER VALIDATION SCHEMAS
// =======================================================

export const createAnalyzerSchema = z.object({
  name: z.string().min(1).max(200),
  analyzerId: z.string().min(1).max(100),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  analyzerType: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  laboratorySection: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  installationDate: z.string().optional(),
  connectionType: z.enum([
    "NETWORK",
    "SERIAL",
    "USB",
    "BLUETOOTH",
    "MANUAL",
  ]).optional(),
  protocol: z.enum([
    "ASTM",
    "HL7",
    "HTTP_API",
    "TCP_IP",
    "SERIAL_RS232",
    "VENDOR_SPECIFIC",
  ]).optional(),
  host: z.string().max(255).optional(),
  port: z.coerce.number().int().min(1).max(65535).optional(),
  deviceIdentifier: z.string().max(100).optional(),
  connectionString: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateAnalyzerSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  analyzerType: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  laboratorySection: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  installationDate: z.string().optional(),
  connectionType: z.enum([
    "NETWORK",
    "SERIAL",
    "USB",
    "BLUETOOTH",
    "MANUAL",
  ]).optional(),
  protocol: z.enum([
    "ASTM",
    "HL7",
    "HTTP_API",
    "TCP_IP",
    "SERIAL_RS232",
    "VENDOR_SPECIFIC",
  ]).optional(),
  host: z.string().max(255).optional(),
  port: z.coerce.number().int().min(1).max(65535).optional(),
  deviceIdentifier: z.string().max(100).optional(),
  connectionString: z.string().max(1000).optional(),
  status: z.enum([
    "ONLINE",
    "OFFLINE",
    "IDLE",
    "BUSY",
    "ERROR",
    "MAINTENANCE",
    "CALIBRATION_REQUIRED",
  ]).optional(),
  notes: z.string().max(2000).optional(),
});

export const analyzerQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.enum([
    "ONLINE",
    "OFFLINE",
    "IDLE",
    "BUSY",
    "ERROR",
    "MAINTENANCE",
    "CALIBRATION_REQUIRED",
  ]).optional(),
  department: z.string().optional(),
  analyzerType: z.string().optional(),
});

// =======================================================
// STATUS MANAGEMENT
// =======================================================

export const updateStatusSchema = z.object({
  status: z.enum([
    "ONLINE",
    "OFFLINE",
    "IDLE",
    "BUSY",
    "ERROR",
    "MAINTENANCE",
    "CALIBRATION_REQUIRED",
  ]),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const heartbeatSchema = z.object({
  latency: z.coerce.number().int().min(0).optional(),
});

// =======================================================
// CALIBRATION VALIDATION SCHEMAS
// =======================================================

export const createCalibrationSchema = z.object({
  analyzerId: z.string().cuid(),
  calibrationDate: z.string(),
  performedBy: z.string().optional(),
  operator: z.string().max(100).optional(),
  status: z.enum([
    "VALID",
    "DUE",
    "OVERDUE",
    "FAILED",
    "IN_PROGRESS",
  ]).optional(),
  outcome: z.string().max(100).optional(),
  result: z.string().max(50).optional(),
  nextCalibrationDueDate: z.string().optional(),
  nextCalibrationReminderDate: z.string().optional(),
  calibrationType: z.string().max(100).optional(),
  reagentsUsed: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
});

export const calibrationQuerySchema = paginationSchema.extend({
  analyzerId: z.string().cuid().optional(),
  status: z.enum([
    "VALID",
    "DUE",
    "OVERDUE",
    "FAILED",
    "IN_PROGRESS",
  ]).optional(),
});

// =======================================================
// MAINTENANCE VALIDATION SCHEMAS
// =======================================================

export const createMaintenanceSchema = z.object({
  analyzerId: z.string().cuid(),
  maintenanceType: z.string().max(100).optional(),
  scheduledDate: z.string().optional(),
  description: z.string().min(1).max(2000),
  technician: z.string().max(100).optional(),
  partsReplaced: z.string().max(1000).optional(),
  cost: z.coerce.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateMaintenanceSchema = z.object({
  maintenanceType: z.string().max(100).optional(),
  scheduledDate: z.string().optional(),
  completedDate: z.string().optional(),
  description: z.string().max(2000).optional(),
  technician: z.string().max(100).optional(),
  partsReplaced: z.string().max(1000).optional(),
  cost: z.coerce.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum([
    "SCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
    "OVERDUE",
    "CANCELLED",
  ]).optional(),
});

export const maintenanceQuerySchema = paginationSchema.extend({
  analyzerId: z.string().cuid().optional(),
  status: z.enum([
    "SCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
    "OVERDUE",
    "CANCELLED",
  ]).optional(),
});

// =======================================================
// TEST MAPPING VALIDATION SCHEMAS
// =======================================================

export const createTestMappingSchema = z.object({
  analyzerId: z.string().cuid(),
  labCoreTestId: z.string().cuid(),
  labCoreTestCode: z.string().min(1).max(50),
  labCoreTestName: z.string().min(1).max(200),
  analyzerTestCode: z.string().min(1).max(100),
  analyzerTestName: z.string().max(200).optional(),
  unit: z.string().max(50).optional(),
  referenceRange: z.string().max(1000).optional(),
  sampleType: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

export const updateTestMappingSchema = z.object({
  analyzerTestName: z.string().max(200).optional(),
  unit: z.string().max(50).optional(),
  referenceRange: z.string().max(1000).optional(),
  sampleType: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  isValid: z.boolean().optional(),
});

export const testMappingQuerySchema = paginationSchema.extend({
  analyzerId: z.string().cuid().optional(),
  isActive: z.coerce.boolean().optional(),
});

// =======================================================
// ANALYZER JOB VALIDATION SCHEMAS
// =======================================================

export const createAnalyzerJobSchema = z.object({
  analyzerId: z.string().cuid(),
  jobId: z.string().min(1).max(100),
  orderId: z.string().cuid().optional(),
  orderNumber: z.string().max(100).optional(),
  sampleId: z.string().cuid().optional(),
  sampleNumber: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  testId: z.string().cuid().optional(),
  testCode: z.string().max(50).optional(),
  testName: z.string().max(200).optional(),
  analyzerTestCode: z.string().max(100).optional(),
  priority: z.enum(["NORMAL", "URGENT", "STAT"]).optional(),
});

export const updateAnalyzerJobSchema = z.object({
  status: z.enum([
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "CANCELLED",
    "RETRYING",
  ]).optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  progressPercentage: z.coerce.number().int().min(0).max(100).optional(),
  currentStep: z.string().max(200).optional(),
  errorMessage: z.string().max(2000).optional(),
  errorDetails: z.record(z.string(), z.any()).optional(),
  retryCount: z.coerce.number().int().min(0).optional(),
  resultId: z.string().cuid().optional(),
  resultReceived: z.boolean().optional(),
  resultReceivedAt: z.string().optional(),
});

export const analyzerJobQuerySchema = paginationSchema.extend({
  analyzerId: z.string().cuid().optional(),
  status: z.enum([
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "CANCELLED",
    "RETRYING",
  ]).optional(),
});

// =======================================================
// ALERT VALIDATION SCHEMAS
// =======================================================

export const createAlertSchema = z.object({
  analyzerId: z.string().cuid(),
  alertType: z.string().min(1).max(100),
  severity: z.enum([
    "INFO",
    "WARNING",
    "ERROR",
    "CRITICAL",
  ]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const resolveAlertSchema = z.object({
  resolutionNotes: z.string().max(2000).optional(),
});

export const alertQuerySchema = paginationSchema.extend({
  analyzerId: z.string().cuid().optional(),
  isResolved: z.coerce.boolean().optional(),
});

// =======================================================
// COMMUNICATION LOG VALIDATION SCHEMAS
// =======================================================

export const communicationLogQuerySchema = paginationSchema.extend({
  analyzerId: z.string().cuid().optional(),
  messageType: z.string().optional(),
});

// =======================================================
// LEGACY ANALYZER LOG VALIDATION SCHEMAS
// =======================================================

export const createAnalyzerLogSchema = z.object({
  machineName: z.string().min(1).max(200),
  machineCode: z.string().min(1).max(100),
  protocol: z.enum([
    "ASTM",
    "HL7",
  ]),
  orderNumber: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  rawMessage: z.string().min(1),
  parsedJson: z.record(z.string(), z.any()).optional(),
});

export const analyzerLogQuerySchema = paginationSchema.extend({
  machineCode: z.string().optional(),
  protocol: z.enum([
    "ASTM",
    "HL7",
  ]).optional(),
  barcode: z.string().optional(),
  isProcessed: z.enum([
    "true",
    "false",
  ]).optional(),
});

// =======================================================
// ADVANCED CONNECTIVITY VALIDATION SCHEMAS
// =======================================================

export const testConnectionSchema = z.object({
  timeout: z.coerce.number().int().min(1).max(30000).optional(),
  retries: z.coerce.number().int().min(0).max(5).optional(),
});

export const connectionMonitoringSchema = z.object({
  interval: z.coerce.number().int().min(1).max(3600).optional(),
  alertsEnabled: z.boolean().optional(),
  alertThresholds: z.object({
    latency: z.coerce.number().int().min(0).optional(),
    errorRate: z.coerce.number().min(0).max(1).optional(),
  }).optional(),
});

export const testMessageSchema = z.object({
  messageType: z.enum([
    "QUERY",
    "PATIENT",
    "ORDER",
    "RESULT",
    "HEARTBEAT",
  ]).optional(),
  testData: z.record(z.string(), z.any()).optional(),
});

// =======================================================
// PROTOCOL SUPPORT VALIDATION SCHEMAS
// =======================================================

export const parseASTMSchema = z.object({
  rawMessage: z.string().min(1),
  encoding: z.enum(["ASCII", "UTF-8", "EBCDIC"]).optional(),
});

export const parseHL7Schema = z.object({
  rawMessage: z.string().min(1),
  encoding: z.enum(["ASCII", "UTF-8"]).optional(),
  version: z.enum(["2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8"]).optional(),
});

export const generateASTMSchema = z.object({
  messageType: z.enum([
    "HEADER",
    "PATIENT",
    "ORDER",
    "RESULT",
    "TERMINATOR",
  ]),
  data: z.record(z.string(), z.any()),
  frameNumber: z.coerce.number().int().min(0).max(99).optional(),
  sequenceNumber: z.coerce.number().int().min(0).max(9999).optional(),
});

export const generateHL7Schema = z.object({
  messageType: z.enum([
    "ADT",
    "ORM",
    "ORU",
    "DFT",
    "MDM",
  ]),
  triggerEvent: z.string().min(1).max(3),
  data: z.record(z.string(), z.any()),
  version: z.enum(["2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8"]).optional(),
});

// =======================================================
// PORT MAPPING VALIDATION SCHEMAS
// =======================================================

export const createPortMappingSchema = z.object({
  analyzerId: z.string().cuid(),
  portName: z.string().min(1).max(100),
  portType: z.enum(["SERIAL_RS232", "TCP_IP", "UDP"]),
  direction: z.enum(["BIDIRECTIONAL", "INCOMING_ONLY", "OUTGOING_ONLY"]),
  baudRate: z.coerce.number().int().min(300).max(921600).optional(),
  dataBits: z.coerce.number().int().min(5).max(8).optional(),
  stopBits: z.coerce.number().int().min(1).max(2).optional(),
  parity: z.enum(["NONE", "ODD", "EVEN", "MARK", "SPACE"]).optional(),
  flowControl: z.enum(["NONE", "HARDWARE", "SOFTWARE"]).optional(),
  hostAddress: z.string().max(255).optional(),
  portNumber: z.coerce.number().int().min(1).max(65535).optional(),
  socketType: z.enum(["CLIENT", "SERVER"]).optional(),
  timeout: z.coerce.number().int().min(1).max(300000).optional(),
  description: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

// =======================================================
// QC RULES VALIDATION SCHEMAS
// =======================================================

export const createQCRuleSchema = z.object({
  analyzerId: z.string().cuid().optional(),
  testId: z.string().cuid().optional(),
  testParameterId: z.string().cuid().optional(),
  ruleName: z.string().min(1).max(200),
  ruleType: z.enum(["AUTO_APPROVAL", "QC_CHECK", "DELTA_CHECK", "RANGE_CHECK"]),
  ruleCondition: z.string().min(1).max(100),
  minValue: z.coerce.number().optional(),
  maxValue: z.coerce.number().optional(),
  criticalLowThreshold: z.coerce.number().optional(),
  criticalHighThreshold: z.coerce.number().optional(),
  deltaThreshold: z.coerce.number().optional(),
  requireQCPass: z.boolean().optional(),
  qcLevel: z.enum(["LEVEL_1", "LEVEL_2", "LEVEL_3"]).optional(),
  qcSampleType: z.enum(["NORMAL", "CONTROL", "PATHOLOGICAL"]).optional(),
  autoApprove: z.boolean().optional(),
  requirePathologistReview: z.boolean().optional(),
  requireTechnicianReview: z.boolean().optional(),
  priority: z.coerce.number().int().min(0).max(100).optional(),
  generateAlertOnFailure: z.boolean().optional(),
  alertSeverity: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]).optional(),
  description: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
});

// =======================================================
// WORKLIST VALIDATION SCHEMAS
// =======================================================

export const createWorklistEntrySchema = z.object({
  analyzerId: z.string().cuid(),
  orderId: z.string().cuid().optional(),
  orderNumber: z.string().max(100).optional(),
  sampleId: z.string().cuid().optional(),
  sampleNumber: z.string().max(100).optional(),
  barcode: z.string().min(1).max(100),
  testId: z.string().cuid().optional(),
  testCode: z.string().max(50).optional(),
  testName: z.string().max(200).optional(),
  priority: z.enum(["NORMAL", "URGENT", "STAT"]).optional(),
  protocol: z.enum(["ASTM", "HL7", "HTTP_API", "TCP_IP", "SERIAL_RS232", "VENDOR_SPECIFIC"]),
});

export const updateWorklistEntrySchema = z.object({
  status: z.enum(["PENDING", "SENT_TO_ANALYZER", "ACKNOWLEDGED", "PROCESSING", "COMPLETED", "FAILED"]).optional(),
  sentAt: z.string().optional(),
  acknowledgedAt: z.string().optional(),
  completedAt: z.string().optional(),
  resultReceived: z.boolean().optional(),
  resultReceivedAt: z.string().optional(),
  errorMessage: z.string().max(2000).optional(),
  retryCount: z.coerce.number().int().min(0).optional(),
});

// =======================================================
// VIRTUAL MACHINE SIMULATOR VALIDATION SCHEMA
// =======================================================

export const simulatorEventSchema = z.object({
  analyzerId: z.string().min(1).max(100),
  eventType: z.enum([
    "HEARTBEAT",
    "ONLINE",
    "OFFLINE",
    "RECONNECTED",
    "ERROR",
    "RESULT_FRAME",
    "MALFORMED_FRAME",
  ]),
  isSimulation: z.boolean(),
  simulationMode: z.literal("SIMULATION_MODE"),
  timestamp: z.string().optional(),
  latencyMs: z.coerce.number().nonnegative().optional(),
  payload: z.any().optional(),
  idempotencyKey: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  organizationId: z.string().optional(),
});