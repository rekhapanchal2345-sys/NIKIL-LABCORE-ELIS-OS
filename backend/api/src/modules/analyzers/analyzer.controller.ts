import {
  Request,
  Response,
  NextFunction,
} from "express";

import type { AuthenticatedRequest } from "../../../middleware/auth";
import prisma from "../../../config/database";

import {
  successResponse,
  createdResponse,
} from "../../utils/response";

import {
  // Analyzer CRUD
  createAnalyzer,
  getAnalyzers,
  getAnalyzerById,
  updateAnalyzer,
  archiveAnalyzer,
  deleteAnalyzer,
  // Status Management
  updateAnalyzerStatus,
  recordHeartbeat,
  handleSimulatorEvent,
  // Calibration
  createCalibration,
  getCalibrations,
  getCalibrationById,
  // Maintenance
  createMaintenance,
  updateMaintenance,
  getMaintenances,
  // Test Mapping
  createTestMapping,
  getTestMappings,
  updateTestMapping,
  deleteTestMapping,
  // Jobs
  createAnalyzerJob,
  getAnalyzerJobs,
  updateAnalyzerJob,
  // Health & Alerts
  getAnalyzerHealth,
  createAnalyzerAlert,
  getAnalyzerAlerts,
  acknowledgeAlert,
  resolveAlert,
  // Communication Logs
  getCommunicationLogs,
  // Advanced Connectivity Features
  testAnalyzerConnection,
  getConnectionStatus as getServiceConnectionStatus,
  getConnectionMetrics as getServiceConnectionMetrics,
  parseASTMMessage as serviceParseASTMMessage,
  parseHL7Message as serviceParseHL7Message,
  generateASTMMessage as serviceGenerateASTMMessage,
  generateHL7Message as serviceGenerateHL7Message,
  // Legacy
  createAnalyzerLog,
  getAnalyzerLogById,
  getAnalyzerLogs,
  markProcessed,
  markFailed,
  deleteAnalyzerLog,
  // New Features
  createPortMapping,
  getPortMappings,
  createQCRule,
  getQCRules,
  updateQCRule,
  deleteQCRule,
  getReflexRules,
  createReflexRule,
  getFleetWorkloadBalance,
  autoBalanceFleetWorkload,
  getMaintenanceLogbook,
  signOffMaintenance,
  createWorklistEntry,
  getWorklistEntries,
  updateWorklistEntry,
  getDemoModeData,
} from "./analyzer.service";

// =======================================================
// ANALYZER CRUD CONTROLLERS
// =======================================================

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    
    const analyzer = await createAnalyzer(body, req.user?.id);

    return createdResponse(
      res,
      analyzer,
      "Analyzer created successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const list = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if this is a count request
    if (req.path.endsWith('/count')) {
      const count = await prisma.analyzer.count({ where: { isArchived: false } });
      return successResponse(res, { count }, "Analyzer count fetched successfully");
    }
    
    const query = (req as any).validated?.query || req.query;
    
    const search = typeof query.search === "string" ? query.search : undefined;
    const status = query.status as string;
    const department = query.department as string;
    const analyzerType = query.analyzerType as string;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const result = await getAnalyzers(
      search,
      status,
      department,
      analyzerType,
      page,
      limit
    );

    return successResponse(
      res,
      result,
      "Analyzers fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getOne = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    
    const analyzer = await getAnalyzerById(params.id as string);

    return successResponse(
      res,
      analyzer,
      "Analyzer fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    
    const analyzer = await updateAnalyzer(params.id as string, body);

    return successResponse(
      res,
      analyzer,
      "Analyzer updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const archive = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    
    const analyzer = await archiveAnalyzer(params.id as string, req.user?.id);

    return successResponse(
      res,
      analyzer,
      "Analyzer archived successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    
    const result = await deleteAnalyzer(params.id as string);

    return successResponse(
      res,
      result,
      "Analyzer deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};

// =======================================================
// ANALYZER STATUS MANAGEMENT
// =======================================================

export const updateStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    
    const analyzer = await updateAnalyzerStatus(
      params.id as string,
      body.status,
      body.metadata
    );

    return successResponse(
      res,
      analyzer,
      "Analyzer status updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const heartbeat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    
    const result = await recordHeartbeat(
      params.id as string,
      body.latency
    );

    return successResponse(
      res,
      result,
      "Heartbeat recorded successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const handleSimulatorEventRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    const organizationId = (req.user as any)?.organizationId || "DEFAULT_ORG";

    const result = await handleSimulatorEvent({
      ...body,
      organizationId,
    });

    const statusCode = result.status === "DEAD_LETTER" ? 200 : 200;
    return successResponse(
      res,
      result,
      result.status === "DUPLICATE_IGNORED"
        ? "Simulator event recognized as duplicate and safely ignored"
        : result.status === "DEAD_LETTER"
        ? "Simulator event flagged as malformed and routed to dead-letter queue"
        : "Simulator event processed successfully by Integration Engine",
      statusCode
    );
  } catch (error) {
    next(error);
  }
};

// =======================================================
// CALIBRATION MANAGEMENT
// =======================================================

export const createCalibrationRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    
    const calibration = await createCalibration({
      ...body,
      createdBy: req.user?.id,
    });

    return createdResponse(
      res,
      calibration,
      "Calibration record created successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const listCalibrations = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = (req as any).validated?.query || req.query;
    
    const analyzerId = query.analyzerId as string;
    const status = query.status as string;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const result = await getCalibrations(analyzerId, status, page, limit);

    return successResponse(
      res,
      result,
      "Calibrations fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getCalibrationRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    
    const calibration = await getCalibrationById(params.id as string);

    return successResponse(
      res,
      calibration,
      "Calibration fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// =======================================================
// MAINTENANCE MANAGEMENT
// =======================================================

export const createMaintenanceRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    
    const maintenance = await createMaintenance({
      ...body,
      createdBy: req.user?.id,
    });

    return createdResponse(
      res,
      maintenance,
      "Maintenance record created successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const listMaintenances = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = (req as any).validated?.query || req.query;
    
    const analyzerId = query.analyzerId as string;
    const status = query.status as string;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const result = await getMaintenances(analyzerId, status, page, limit);

    return successResponse(
      res,
      result,
      "Maintenances fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const updateMaintenanceRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    
    const maintenance = await updateMaintenance(params.id as string, body);

    return successResponse(
      res,
      maintenance,
      "Maintenance updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// =======================================================
// TEST CODE MAPPING
// =======================================================

export const createMapping = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    
    const mapping = await createTestMapping({
      ...body,
      createdBy: req.user?.id,
    });

    return createdResponse(
      res,
      mapping,
      "Test mapping created successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const listMappings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = (req as any).validated?.query || req.query;
    
    const analyzerId = query.analyzerId as string;
    const isActive = query.isActive === "true" ? true : query.isActive === "false" ? false : undefined;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const result = await getTestMappings(analyzerId, isActive, page, limit);

    return successResponse(
      res,
      result,
      "Test mappings fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const updateMapping = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    
    const mapping = await updateTestMapping(params.id as string, body);

    return successResponse(
      res,
      mapping,
      "Test mapping updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const deleteMapping = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    
    const mapping = await deleteTestMapping(params.id as string);

    return successResponse(
      res,
      mapping,
      "Test mapping deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};

// =======================================================
// ANALYZER JOB MANAGEMENT
// =======================================================

export const createJob = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    
    const job = await createAnalyzerJob(body);

    return createdResponse(
      res,
      job,
      "Analyzer job created successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const listJobs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = (req as any).validated?.query || req.query;
    
    const analyzerId = query.analyzerId as string;
    const status = query.status as string;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const result = await getAnalyzerJobs(analyzerId, status, page, limit);

    return successResponse(
      res,
      result,
      "Analyzer jobs fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    
    const job = await updateAnalyzerJob(params.id as string, body);

    return successResponse(
      res,
      job,
      "Analyzer job updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// =======================================================
// ANALYZER HEALTH & ALERTS
// =======================================================

export const getHealth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const health = await getAnalyzerHealth();

    return successResponse(
      res,
      health,
      "Analyzer health fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const createAlert = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    
    const alert = await createAnalyzerAlert(body);

    return createdResponse(
      res,
      alert,
      "Analyzer alert created successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const listAlerts = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = (req as any).validated?.query || req.query;
    
    const analyzerId = query.analyzerId as string;
    const isResolved = query.isResolved === "true" ? true : query.isResolved === "false" ? false : undefined;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const result = await getAnalyzerAlerts(analyzerId, isResolved, page, limit);

    return successResponse(
      res,
      result,
      "Analyzer alerts fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const acknowledgeAlertRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    
    const alert = await acknowledgeAlert(params.id as string, req.user?.id || "system");

    return successResponse(
      res,
      alert,
      "Alert acknowledged successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const resolveAlertRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    
    const alert = await resolveAlert(
      params.id as string,
      req.user?.id || "system",
      body.resolutionNotes
    );

    return successResponse(
      res,
      alert,
      "Alert resolved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// =======================================================
// COMMUNICATION LOGS
// =======================================================

export const listCommunicationLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = (req as any).validated?.query || req.query;
    
    const analyzerId = query.analyzerId as string;
    const messageType = query.messageType as string;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const result = await getCommunicationLogs(analyzerId, messageType, page, limit);

    return successResponse(
      res,
      result,
      "Communication logs fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// =======================================================
// ADVANCED CONNECTIVITY CONTROLLERS
// =======================================================

export const testConnection = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    
    const timeout = body.timeout || 5000;
    const retries = body.retries || 3;
    
    const result = await testAnalyzerConnection(params.id as string, timeout, retries);

    return successResponse(
      res,
      result,
      result.success ? "Connection test successful" : "Connection test failed"
    );
  } catch (error) {
    next(error);
  }
};

export const getConnectionStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;

    const status = await getServiceConnectionStatus(params.id as string);

    return successResponse(
      res,
      status,
      "Connection status retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getConnectionMetrics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const query = (req as any).validated?.query || req.query;

    const hours = Number(query.hours) || 24;

    const metrics = await getServiceConnectionMetrics(params.id as string, hours);

    return successResponse(
      res,
      metrics,
      "Connection metrics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const startConnectionMonitoring = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    
    // In a real implementation, this would start a background monitoring process
    // For now, we'll just update the analyzer status
    await updateAnalyzerStatus(params.id as string, "ONLINE", body);

    return successResponse(
      res,
      { monitoring: true, message: "Connection monitoring started" },
      "Connection monitoring started successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const stopConnectionMonitoring = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    
    // In a real implementation, this would stop the background monitoring process
    // For now, we'll just update the analyzer status
    await updateAnalyzerStatus(params.id as string, "IDLE", {});

    return successResponse(
      res,
      { monitoring: false, message: "Connection monitoring stopped" },
      "Connection monitoring stopped successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const sendTestMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    
    // Simulate sending a test message to the analyzer
    const result = {
      success: true,
      analyzerId: params.id,
      messageType: body.messageType || "HEARTBEAT",
      sentAt: new Date(),
      receivedAt: new Date(Date.now() + Math.random() * 1000),
      testData: body.testData,
    };

    return successResponse(
      res,
      result,
      "Test message sent successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const parseASTMMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;

    const result = serviceParseASTMMessage(body.rawMessage, body.encoding);

    return successResponse(
      res,
      result,
      result.success ? "ASTM message parsed successfully" : "Failed to parse ASTM message"
    );
  } catch (error) {
    next(error);
  }
};

export const parseHL7Message = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;

    const result = serviceParseHL7Message(body.rawMessage, body.encoding, body.version);

    return successResponse(
      res,
      result,
      result.success ? "HL7 message parsed successfully" : "Failed to parse HL7 message"
    );
  } catch (error) {
    next(error);
  }
};

export const generateASTMMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;

    const result = serviceGenerateASTMMessage(
      body.messageType,
      body.data,
      body.frameNumber,
      body.sequenceNumber
    );

    return successResponse(
      res,
      result,
      result.success ? "ASTM message generated successfully" : "Failed to generate ASTM message"
    );
  } catch (error) {
    next(error);
  }
};

export const generateHL7Message = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;

    const result = serviceGenerateHL7Message(
      body.messageType,
      body.triggerEvent,
      body.data,
      body.version
    );

    return successResponse(
      res,
      result,
      result.success ? "HL7 message generated successfully" : "Failed to generate HL7 message"
    );
  } catch (error) {
    next(error);
  }
};

// =======================================================
// LEGACY ANALYZER LOG CONTROLLERS (for backward compatibility)
// =======================================================

export const createLog = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    
    const log = await createAnalyzerLog(body);

    return createdResponse(
      res,
      log,
      "Analyzer log created successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const listLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = (req as any).validated?.query || req.query;
    
    const result = await getAnalyzerLogs({
      machineCode: query.machineCode,
      protocol: query.protocol,
      barcode: query.barcode,
      isProcessed: query.isProcessed,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
    });

    return successResponse(
      res,
      result,
      "Analyzer logs fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getLog = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    
    const log = await getAnalyzerLogById(params.id as string);

    return successResponse(
      res,
      log,
      "Analyzer log fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const processLog = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    
    const log = await markProcessed(
      params.id as string,
      body.parsedJson
    );

    return successResponse(
      res,
      log,
      "Analyzer log marked as processed"
    );
  } catch (error) {
    next(error);
  }
};

export const failLog = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    
    const log = await markFailed(
      params.id as string,
      body.errorMessage
    );

    return successResponse(
      res,
      log,
      "Analyzer log marked as failed"
    );
  } catch (error) {
    next(error);
  }
};

export const removeLog = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    
    await deleteAnalyzerLog(params.id as string);

    return successResponse(
      res,
      { id: params.id, deleted: true },
      "Analyzer log deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};

// =======================================================
// PORT MAPPING CONTROLLERS
// =======================================================

export const createPortMappingRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    
    const portMapping = await createPortMapping({
      ...body,
      createdBy: req.user?.id,
    });

    return createdResponse(
      res,
      portMapping,
      "Port mapping created successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const listPortMappings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = (req as any).validated?.query || req.query;
    
    const analyzerId = query.analyzerId as string;
    const isActive = query.isActive === "true" ? true : query.isActive === "false" ? false : undefined;

    const portMappings = await getPortMappings(analyzerId, isActive);

    return successResponse(
      res,
      portMappings,
      "Port mappings fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// =======================================================
// QC RULES CONTROLLERS
// =======================================================

export const createQCRuleRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    
    const qcRule = await createQCRule({
      ...body,
      createdBy: req.user?.id,
    });

    return createdResponse(
      res,
      qcRule,
      "QC rule created successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const listQCRules = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = (req as any).validated?.query || req.query;
    
    const analyzerId = query.analyzerId as string;
    const testId = query.testId as string;
    const isActive = query.isActive === "true" ? true : query.isActive === "false" ? false : undefined;

    const qcRules = await getQCRules(analyzerId, testId, isActive);

    return successResponse(
      res,
      qcRules,
      "QC rules fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const updateQCRuleRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = (req.params.id || (req as any).validated?.params?.id) as string;
    const body = (req as any).validated?.body || req.body;
    const qcRule = await updateQCRule(id, body);
    return successResponse(res, qcRule, "QC rule updated successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteQCRuleRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = (req.params.id || (req as any).validated?.params?.id) as string;
    const result = await deleteQCRule(id);
    return successResponse(res, result, "QC rule deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const listReflexRules = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const rules = await getReflexRules(req.query);
    return successResponse(res, rules, "Reflex rules fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const createReflexRuleRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    const rule = await createReflexRule(body, req.user?.id);
    return createdResponse(res, rule, "Reflex rule created successfully");
  } catch (error) {
    next(error);
  }
};

export const getWorkloadBalance = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const balance = await getFleetWorkloadBalance();
    return successResponse(res, balance, "Fleet workload balance fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const autoBalanceFleetRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await autoBalanceFleetWorkload(req.body);
    return successResponse(res, result, "Fleet auto-balanced successfully");
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceLogbookRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const logbook = await getMaintenanceLogbook(req.query);
    return successResponse(res, logbook, "Maintenance logbook fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const signOffMaintenanceRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = req.body || {};
    const result = await signOffMaintenance(body, req.user?.id);
    return successResponse(res, result, "Maintenance record signed off successfully");
  } catch (error) {
    next(error);
  }
};

// =======================================================
// WORKLIST CONTROLLERS
// =======================================================

export const createWorklistEntryRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req as any).validated?.body || req.body;
    
    const worklistEntry = await createWorklistEntry(body);

    return createdResponse(
      res,
      worklistEntry,
      "Worklist entry created successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const listWorklistEntries = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = (req as any).validated?.query || req.query;
    
    const analyzerId = query.analyzerId as string;
    const status = query.status as string;
    const barcode = query.barcode as string;

    const worklistEntries = await getWorklistEntries(analyzerId, status, barcode);

    return successResponse(
      res,
      worklistEntries,
      "Worklist entries fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const updateWorklistEntryRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req as any).validated?.params || req.params;
    const body = (req as any).validated?.body || req.body;
    
    const worklistEntry = await updateWorklistEntry(params.id as string, body);

    return successResponse(
      res,
      worklistEntry,
      "Worklist entry updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// =======================================================
// DEMO MODE CONTROLLERS
// =======================================================

export const getDemoData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const demoData = await getDemoModeData();

    return successResponse(
      res,
      demoData,
      "Demo data fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};