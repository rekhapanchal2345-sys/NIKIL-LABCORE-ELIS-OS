import { Request, Response, NextFunction } from "express";
import {
  trainClassicalModel,
  trainDeepLearningModel,
  predictMultiAnalyte,
  analyzeClinicalNlp,
  computeDeltaCheck,
  forecastTat,
  getModelRegistry,
  deployModel,
  getAiAuditLogs,
  analyzeCbc,
  checkDrugInteractions,
  predictAmrSusceptibility,
  classifyThyroidDisease,
  analyzeCoagulation,
  generateSmartReport,
} from "./ai.service";
import { interpretOrderWithGemini } from "./gemini.service";

export const trainClassical = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await trainClassicalModel(req.body);
    res.status(200).json({
      success: true,
      message: "Classical ML model trained successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const trainDeepLearning = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await trainDeepLearningModel(req.body);
    res.status(200).json({
      success: true,
      message: "Deep Learning architecture trained successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const predict = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await predictMultiAnalyte(req.body);
    res.status(200).json({
      success: true,
      message: "Multi-analyte AI inference generated",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const analyzeNlp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await analyzeClinicalNlp(req.body);
    res.status(200).json({
      success: true,
      message: "Clinical NLP report structured successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deltaCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await computeDeltaCheck(req.body);
    res.status(200).json({
      success: true,
      message: "Longitudinal delta check computed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const forecastWorkloadTat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await forecastTat(req.body);
    res.status(200).json({
      success: true,
      message: "TAT workload forecast computed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const listRegistryModels = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const models = await getModelRegistry();
    res.status(200).json({
      success: true,
      message: "AI Model Registry fetched",
      data: models,
    });
  } catch (error) {
    next(error);
  }
};

export const updateModelStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const modelId = req.params.id || req.body.modelId;
    const status = req.body.status || "PRODUCTION";
    const model = await deployModel(modelId, status);
    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Model not found in registry",
      });
    }
    res.status(200).json({
      success: true,
      message: `Model ${modelId} deployed to ${status}`,
      data: model,
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const logs = await getAiAuditLogs();
    res.status(200).json({
      success: true,
      message: "AI Audit trail fetched",
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
// NEW CLINICAL ENGINE CONTROLLERS
// =======================================================

export const cbcAnalyze = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await analyzeCbc(req.body);
    res.status(200).json({
      success: true,
      message: "CBC auto-differential analysis complete",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const drugInteractionCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await checkDrugInteractions(req.body);
    res.status(200).json({
      success: true,
      message: "Drug interaction analysis complete",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const amrPredict = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await predictAmrSusceptibility(req.body);
    res.status(200).json({
      success: true,
      message: "AMR susceptibility prediction complete",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const thyroidClassify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await classifyThyroidDisease(req.body);
    res.status(200).json({
      success: true,
      message: "Thyroid disease classification complete",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const coagulationAnalyze = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await analyzeCoagulation(req.body);
    res.status(200).json({
      success: true,
      message: "Coagulation risk analysis complete",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const smartReportGenerate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await generateSmartReport(req.body);
    res.status(200).json({
      success: true,
      message: "Smart report narrative generated",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const interpretOrderGemini = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = (req.params.orderId || req.body.orderId) as string;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required for clinical AI interpretation",
      });
    }

    const result = await interpretOrderWithGemini(orderId);
    res.status(200).json({
      success: true,
      message: "Diagnostic interpretation generated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
