import { Router } from "express";
import {
  trainClassical,
  trainDeepLearning,
  predict,
  analyzeNlp,
  deltaCheck,
  forecastWorkloadTat,
  listRegistryModels,
  updateModelStatus,
  getAuditLogs,
  cbcAnalyze,
  drugInteractionCheck,
  amrPredict,
  thyroidClassify,
  coagulationAnalyze,
  smartReportGenerate,
  interpretOrderGemini,
  cbcGeminiAnalyze,
  thyroidGeminiAnalyze,
  getClinicalRiskCards,
  overrideAiDiagnosis,
  getOrderAiOverrides,
} from "./ai.controller";
import { authenticate } from "../../../middleware/auth";

const router = Router();

// Allow authenticated users to interact with AI Studio
router.use(authenticate);

// =====================================================
// EXISTING TRAINING & INFERENCE ENDPOINTS
// =====================================================
router.post("/train/classical", trainClassical);
router.post("/train/deep-learning", trainDeepLearning);

router.post("/predict", predict);
router.post("/nlp/analyze", analyzeNlp);
router.post("/anomaly/delta-check", deltaCheck);
router.post("/delta-check", deltaCheck);
router.post("/forecasting/tat", forecastWorkloadTat);
router.post("/tat/forecast", forecastWorkloadTat);

// Registry & Deployment
router.get("/models", listRegistryModels);
router.post("/models/deploy", updateModelStatus);
router.post("/models/:id/deploy", updateModelStatus);
router.get("/audit", getAuditLogs);

// =====================================================
// NEW CLINICAL DIAGNOSTIC ENGINE ENDPOINTS
// =====================================================

// Engine 1: CBC Auto-Analyzer with Morphology & Differential
router.post("/cbc/analyze", cbcAnalyze);

// Engine 2: Pharmaceutical Drug Interaction Checker
router.post("/drug/interactions", drugInteractionCheck);

// Engine 3: Antibiotic Susceptibility / AMR Predictor
router.post("/amr/predict", amrPredict);

// Engine 4: Thyroid Disease Classifier (TSH/FT3/FT4/Anti-TPO)
router.post("/thyroid/classify", thyroidClassify);

// Engine 5: Coagulation Risk Engine (PT/INR/aPTT/DIC)
router.post("/coagulation/analyze", coagulationAnalyze);

// Engine 6: Smart Report Narrative Generator (AI Auto-Report)
router.post("/report/generate", smartReportGenerate);

// Engine 7: Google Gemini AI Pathology Reasoning & Differential Diagnosis
router.post("/gemini/interpret", interpretOrderGemini);
router.get("/gemini/order/:orderId", interpretOrderGemini);
router.post("/gemini/cbc", cbcGeminiAnalyze);
router.post("/gemini/thyroid", thyroidGeminiAnalyze);
router.post("/gemini/risk-cards", getClinicalRiskCards);
router.get("/gemini/risk-cards/:orderId", getClinicalRiskCards);
router.post("/gemini/override", overrideAiDiagnosis);
router.get("/gemini/overrides/:orderId", getOrderAiOverrides);

export default router;
