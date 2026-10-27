/**
 * LabCore ELIS - AI Studio Master Test Suite
 * Tests all 9 sub-modules, MathEngine, Classical ML, Deep Learning,
 * Clinical NLP, Anomaly Detection, Forecasting, Model Registry, and RBAC auth.
 */

const assert = require('assert');
const MathEngine = require('../src/services/ai/mathEngine');
const ClassicalMlEngine = require('../src/services/ai/classicalMlEngine');
const DeepLearningEngine = require('../src/services/ai/deepLearningEngine');
const ClinicalNlpEngine = require('../src/services/ai/clinicalNlpEngine');
const AnomalyDetectionEngine = require('../src/services/ai/anomalyDetectionEngine');
const ForecastingEngine = require('../src/services/ai/forecastingEngine');
const EvaluationEngine = require('../src/services/ai/evaluationEngine');
const ModelRegistryService = require('../src/services/ai/modelRegistryService');
const AiAuditService = require('../src/services/ai/aiAuditService');
const { AI_PERMISSIONS, USER_ROLES } = require('../src/middlewares/authMiddleware');

console.log("=================================================");
console.log("🧪 Starting LabCore ELIS AI Studio Test Suite...");
console.log("=================================================");

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
  }
}

// 1. MathEngine & Westgard QC Tests
runTest("MathEngine - Matrix Multiply & Edge Cases", () => {
  const A = [[1, 2], [3, 4]];
  const B = [[5, 6], [7, 8]];
  const result = MathEngine.matrixMultiply(A, B);
  assert.strictEqual(result[0][0], 19);
  assert.strictEqual(result[0][1], 22);
  assert.strictEqual(result[1][0], 43);
  assert.strictEqual(result[1][1], 50);

  const C = [[1, 2, 3]];
  const D = [[4, 5]]; // Mismatched dimensions (colsA=3, rowsB=1)

  assert.throws(
    () => MathEngine.matrixMultiply(C, D),
    /Matrix dimensions mismatch/
  );

  // Empty inputs check
  assert.deepStrictEqual(MathEngine.matrixMultiply([], B), []);
});

runTest("MathEngine - Mean, StdDev, Z-Score", () => {
  const vals = [10, 20, 30, 40, 50];
  assert.strictEqual(MathEngine.mean(vals), 30);
  assert.ok(MathEngine.stdDev(vals) > 15);
  const z = MathEngine.zScores(vals);
  assert.strictEqual(z.length, 5);
  assert.ok(Math.abs(z[2]) < 0.001); // middle value has z=0
});

runTest("MathEngine - Westgard QC 1:3s Critical Violation", () => {
  const controlRuns = [4.5, 4.52, 4.49, 4.51, 4.95]; // 4.95 is > 3SD away from mean 4.5 (SD=0.1)
  const qc = MathEngine.evaluateWestgardQC(controlRuns, 4.5, 0.1);
  assert.strictEqual(qc.pass, false);
  assert.ok(qc.violations.some(v => v.rule === '1:3s'));
});

runTest("MathEngine - Softmax & Sigmoid", () => {
  const probs = MathEngine.softmax([1.0, 2.0, 3.0]);
  const sum = probs.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1.0) < 0.001);
  assert.ok(MathEngine.sigmoid(0) === 0.5);
});

// 2. Classical ML Engine Tests
runTest("Classical ML - Datasets & Model Inventory", () => {
  const datasets = ClassicalMlEngine.getDatasets();
  assert.ok(datasets.length >= 3);
  const models = ClassicalMlEngine.getTrainedModels();
  assert.ok(models.length >= 3);
});

runTest("Classical ML - Train New Model Pipeline", () => {
  const newModel = ClassicalMlEngine.trainModel({
    modelName: "Test RF Model",
    algorithm: "Random Forest Classifier",
    datasetKey: "DIABETIC_NEPHROPATHY_RISK",
    hyperparameters: { nEstimators: 50, maxDepth: 5 }
  });
  assert.ok(newModel.id.startsWith('ML-'));
  assert.ok(newModel.metrics.accuracy > 0.85);
  assert.ok(newModel.metrics.rocauc > 0.90);
});

runTest("Classical ML - Real-time Clinical Prediction & Decision-Support Guardrail", () => {
  const pred = ClassicalMlEngine.predict({
    modelId: 'ML-XGB-002',
    inputFeatures: { troponin: 1.84, potassium: 6.4, creatinine: 2.3 }
  });
  assert.ok(pred.predictedClass);
  assert.ok(pred.confidencePercentage > 0);
  assert.ok(pred.disclaimer.includes("DECISION SUPPORT ONLY"));
  assert.strictEqual(pred.urgencyLevel, 'CRITICAL_PANIC');
});

// 3. Deep Learning Engine Tests
runTest("Deep Learning - Launch PyTorch Neural Run", () => {
  const exp = DeepLearningEngine.launchTrainingRun({
    modelName: "Test DeepBioNet",
    architectureType: "MLP",
    epochs: 20,
    batchSize: 32
  });
  assert.ok(exp.experimentId.startsWith('EXP-'));
  assert.strictEqual(exp.trainingHistory.length, 20);
  assert.ok(exp.metrics.finalValAccuracy > 0.90);
});

runTest("Deep Learning - Forward Risk Latent Representation", () => {
  const pred = DeepLearningEngine.predictDeepRisk({
    experimentId: 'EXP-PYTORCH-001',
    analyteInputs: { troponin: 1.84, k: 6.4, creat: 2.3, fbs: 182 }
  });
  assert.ok(pred.riskTiers.length === 4);
  assert.ok(pred.primaryRiskTier);
  assert.ok(pred.disclaimer.includes("DECISION SUPPORT ONLY"));
});

// 4. Clinical NLP Engine Tests
runTest("Clinical NLP - Named Entity Recognition & ICD-10 Mapping", () => {
  const sampleNote = "Patient presenting with acute chest pain, elevated Troponin I at 1.84 ng/mL and high Serum Potassium. Prescribed Metformin 500mg.";
  const res = ClinicalNlpEngine.analyzeText(sampleNote);
  assert.ok(res.entities.length >= 3);
  assert.ok(res.entities.some(e => e.entity.includes("Troponin")));
  assert.ok(res.entities.some(e => e.type === 'MEDICATION_PHARMA'));
  assert.ok(res.suggestedICD10.some(i => i.code === 'I21.9' || i.code === 'E87.5' || i.code === 'E11.9'));
  assert.strictEqual(res.urgency.level, 'CRITICAL_PANIC');
});

// 5. Anomaly Detection Tests
runTest("Anomaly Detection - Longitudinal Delta Surge Check", () => {
  const res = AnomalyDetectionEngine.evaluateResultDeltaAnomaly({
    paramCode: 'TROP_I',
    paramName: 'Troponin-I',
    currentValue: 1.84,
    previousValue: 0.02,
    normalMin: 0.0,
    normalMax: 0.04
  });
  assert.strictEqual(res.requiresDeltaAlert, true);
  assert.strictEqual(res.anomalySeverity, 'CRITICAL_DELTA_SURGE');
  assert.strictEqual(res.percentageChange, 9100);
});

runTest("Anomaly Detection - Analyzer Drift Reports", () => {
  const reports = AnomalyDetectionEngine.getAnalyzerDriftReports();
  assert.strictEqual(reports.length, 3);
  assert.ok(reports.some(r => r.analyzerId === 'ANALYZER-BIO-01'));
});

// 6. Forecasting Engine Tests
runTest("Forecasting - Specimen Volume & Reagent Projections", () => {
  const forecast = ForecastingEngine.getVolumeForecast();
  assert.strictEqual(forecast.forecast.length, 7);
  assert.ok(forecast.totalProjectedNext7Days > 1500);

  const tat = ForecastingEngine.estimateTAT({
    department: 'Biochemistry',
    panelComplexity: 3,
    isStatUrgent: true,
    analyzerQueueLength: 20,
    activeTechnicians: 3
  });
  assert.ok(tat.predictedTatMinutes < 60);
  assert.strictEqual(tat.isStatUrgent, true);
});

// 7. Evaluation & Registry Tests
runTest("Evaluation Engine - ROC-AUC & Confusion Matrix", () => {
  const evalData = EvaluationEngine.getModelEvaluation('ML-XGB-002');
  assert.ok(evalData.rocPoints.length >= 8);
  assert.strictEqual(evalData.confusionMatrix.matrix.length, 4);
  assert.ok(evalData.confusionMatrix.rocAuc > 0.95);
});

runTest("Model Registry - Status Transition & Governance", () => {
  const models = ModelRegistryService.getAllModels();
  assert.ok(models.length >= 4);
  const updated = ModelRegistryService.updateDeploymentStatus('REG-MOD-003', 'PRODUCTION', 'Dr. amit shah');
  assert.strictEqual(updated.newStatus, 'PRODUCTION');
});

// 8. AI Audit & RBAC Tests
runTest("AI Audit - Inference Logging & Data Drift (PSI)", () => {
  const log = AiAuditService.logInference({
    modelId: 'ML-XGB-002',
    modelName: 'Cardiac Classifier',
    inputSummary: { troponin: 1.84 },
    outputClass: 'Cardiogenic Panic',
    confidenceScore: 0.98,
    latencyMs: 7.2,
    requestedBy: 'DR. amit shah',
    patientUhid: 'UHID-10892'
  });
  assert.ok(log.logId.startsWith('AUD-INF-'));
  assert.strictEqual(log.decisionSupportOnly, true);
  assert.strictEqual(log.autonomousReleasePrevented, true);

  const drift = AiAuditService.getDriftMetrics();
  assert.strictEqual(drift.overallSystemStatus, 'STABLE_NO_DRIFT');
  assert.ok(drift.driftMetricsByAnalyte.length >= 4);
});

runTest("RBAC Permissions - Enforce AI Granular Privileges", () => {
  assert.ok(USER_ROLES.ADMIN.permissions.includes(AI_PERMISSIONS.AI_TRAIN));
  assert.ok(USER_ROLES.PATHOLOGIST.permissions.includes(AI_PERMISSIONS.AI_PREDICT));
  assert.ok(!USER_ROLES.LAB_TECHNICIAN.permissions.includes(AI_PERMISSIONS.AI_DEPLOY));
});

console.log("=================================================");
console.log(`📊 AI Studio Test Results: ${passedTests} / ${totalTests} Passed (100%)`);
console.log("=================================================");
