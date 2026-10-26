export interface ClassicalMlTrainingParams {
  modelName: string;
  algorithm: string;
  dataset: string;
  nEstimators: number;
  maxDepth: number;
  learningRate: number;
  testSplitRatio?: number;
  subsample?: number;
  kFold?: number;
  regularizationL1?: number;
  regularizationL2?: number;
  lossFunction?: "FOCAL_LOSS" | "WEIGHTED_CROSS_ENTROPY" | "BRIER_CALIBRATED" | "LOG_LOSS";
  quantization?: "FP32" | "FP16" | "INT8";
  earlyStoppingPatience?: number;
}

export interface TrainingEpochLog {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  trainAccuracy: number;
  valAccuracy: number;
  learningRate: number;
}

export interface ClassicalMlTrainingResult {
  modelId: string;
  modelName: string;
  algorithm: string;
  dataset: string;
  accuracy: number;
  rocAuc: number;
  f1Score: number;
  precision: number;
  recall: number;
  datasetSamples?: number;
  trainingTimeMs?: number;
  epochs: TrainingEpochLog[];
  confusionMatrix: {
    truePositive: number;
    falsePositive: number;
    trueNegative: number;
    falseNegative: number;
  };
  featureImportances: { feature: string; weight: number; impact: string }[];
  crossValidation?: { fold: number; trainAcc: number; valAcc: number; rocAuc: number; f1: number }[];
  rocCurve?: { fpr: number; tpr: number }[];
  prCurve?: { recall: number; precision: number }[];
  calibrationData?: { bin: number; predictedProb: number; trueFraction: number }[];
  brierScore?: number;
  expectedCalibrationError?: number;
  matthewsCorrelationCoefficient?: number;
  diagnosticOddsRatio?: number;
  sensitivity?: number;
  specificity?: number;
  positiveLikelihoodRatio?: number;
  negativeLikelihoodRatio?: number;
  numberNeededToDiagnose?: number;
  conformalCoverage95?: { lowerResidual: number; upperResidual: number; empiricalCoverage: number };
  decisionCurveAnalysis?: { threshold: number; netBenefitModel: number; netBenefitAll: number; netBenefitNone: number }[];
  faganNomogram?: { preTestProbability: number; postTestProbabilityPositive: number; postTestProbabilityNegative: number; positiveLr: number; negativeLr: number };
  hardwareTelemetry?: {
    vramUsedMb: number;
    totalVramMb: number;
    tensorOpsTflops: number;
    inferenceLatencyMs: number;
    throughputSamplesSec: number;
    batchSize: number;
    accelerator: string;
    temperatureC: number;
  };
  modelArtifact?: {
    weightsChecksum: string;
    format: string;
    quantization: string;
    nablApproved: boolean;
    sha256: string;
    sizeKb: number;
  };
    hyperparameterGrid?: { nEstimators: number; maxDepth: number; lr: number; rocAuc: number; latencyMs: number }[];
  astmFrames?: string[];
  leveyJenningsPoints?: { run: number; value: number; sd: number; status: "PASS" | "WARNING" | "VIOLATION" }[];
  gnnTopology?: {
    nodes: { id: string; label: string; organ: string; baselineRef: string; embeddingDim: number }[];
    edges: { source: string; target: string; mechanism: string; attentionWeight: number }[];
    summary: { layers: number; attentionHeads: number; homophilyRatio: number; pooling: string };
  };
  coxSurvivalAnalysis?: {
    hazardRatios: { covariate: string; hr: number; ciLower: number; ciUpper: number; pValue: number }[];
    concordanceIndex: number;
    kaplanMeierCurve: { timeDays: number; survivalProb: number; atRisk: number }[];
    eventRates: { day30: number; day90: number; year1: number };
  };
  michaelisMenten?: {
    vMax: number;
    km: number;
    kineticsEquation: string;
    kalmanStates: { timeSec: number; rawAbsorbance: number; filteredAbsorbance: number; residual: number }[];
  };
  causalGraph?: {
    dagConfounders: string[];
    averageTreatmentEffects: { intervention: string; baselineRisk: number; counterfactualRisk: number; ateAbsoluteReduction: number }[];
  };
  eqasProficiency?: {
    program: string;
    sdiScore: number;
    enRatio: number;
    zScore: number;
    traceabilityStandard: string;
    status: "EXEMPLARY" | "ACCEPTABLE" | "UNACCEPTABLE";
  };
  trainingLogs?: string[];
  trainedAt: string;
}

export interface DeepLearningTrainingParams {
  architecture: string;
  dataset?: string;
  epochs: number;
  batchSize: number;
  optimizer?: string;
  learningRate?: number;
  dropout?: number;
  layers?: number[];
  precision?: string;
  lrScheduler?: string;
  lossFunction?: "FOCAL_LOSS" | "WEIGHTED_CROSS_ENTROPY" | "BRIER_CALIBRATED" | "CONTRASTIVE_MULTITASK" | "LOG_LOSS";
  regularizationL1?: number;
  regularizationL2?: number;
  earlyStoppingPatience?: number;
}

export interface DeepLearningResult {
  modelId: string;
  architecture: string;
  dataset?: string;
  datasetSamples?: number;
  lossFunctionUsed?: string;
  totalParameters: number;
  epochsRun: number;
  finalLoss: number;
  valLoss: number;
  valAccuracy: number;
  history: TrainingEpochLog[];
  convergenceState: "CONVERGED_OPTIMAL" | "EARLY_STOPPED" | "STABLE";
  trainedAt: string;
  hardwareTelemetry?: {
    gpu: string;
    vramUsed: string;
    tflops: number;
    latencyMs: number;
    powerWatts: number;
    tempC: number;
  };
  metrics?: {
    rocAuc: number;
    f1Score: number;
    sensitivity: number;
    specificity: number;
    precision: number;
    npv: number;
    brierScore: number;
    auprc?: number;
    matthewsCorrelationCoefficient?: number;
    diagnosticOddsRatio?: number;
    expectedCalibrationError?: number;
  };
  confusionMatrix?: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
  layerTopology?: {
    name: string;
    type: string;
    neurons: string;
    activation: string;
    gradNorm: number;
    paramCount: string;
  }[];
  sha256Checksum?: string;
  nablValidationCertificate?: string;
  serializationFormat?: string;
  validationCasesCount?: number;
}

export interface MultiAnalytePredictionRequest {
  panel?: string;
  uhid?: string;
  patientName?: string;
  patientAge?: number;
  age?: number;
  patientGender?: "MALE" | "FEMALE" | "OTHER";
  gender?: string;
  hba1c?: number;
  fbs?: number;
  creatinine?: number;
  troponin?: number;
  potassium?: number;
  microalbumin?: number;
  wbc?: number;
  platelets?: number;
  crp?: number;
  ckmb?: number;
  ntprobnp?: number;
  hscrp?: number;
  egfr?: number;
  bun?: number;
  procalcitonin?: number;
  lactate?: number;
  ddimer?: number;
  alt?: number;
  ast?: number;
  bilirubin?: number;
  alp?: number;
  albumin?: number;
  myoglobin?: number;
  ldh?: number;
  cystatinC?: number;
  uricAcid?: number;
  directBilirubin?: number;
  ggt?: number;
  inr?: number;
  pt?: number;
  aptt?: number;
  fibrinogen?: number;
  amylase?: number;
  lipase?: number;
  calcium?: number;
  cholesterol?: number;
  triglycerides?: number;
  hdl?: number;
  ldl?: number;
  vldl?: number;
  map?: number;
  temp?: number;
  sofa?: number;
  qsofa?: number;
  glucose?: number;
  ketones?: number;
  ph?: number;
  tsh?: number;
  freeT4?: number;
  freeT3?: number;
  analyzerModel?: string;
  barcode?: string;
  tubeType?: string;
  algorithm?: string;
  [key: string]: any;
}

export interface PredictionResult {
  predictedClass: string;
  riskScore: number;
  confidence: number;
  urgency: "ROUTINE" | "ELEVATED" | "HIGH_RISK" | "CRITICAL_PANIC";
  diagnosticRecommendation: string;
  shapAttributions: {
    feature: string;
    value: string;
    impactPercentage: number;
    direction: "POSITIVE_RISK" | "NEGATIVE_RISK";
  }[];
  flags?: string[];
  differentialDiagnoses?: {
    condition: string;
    icd10: string;
    probability: number;
    urgency: "CRITICAL_PANIC" | "HIGH_RISK" | "ELEVATED" | "ROUTINE";
    evidence: string;
    category: string;
  }[];
  analyzerTelemetry?: {
    machineModel: string;
    serialNumber: string;
    methodology: string;
    lisInterface: string;
    reagentLot: string;
    reagentExpiry: string;
    calibrationStatus: "VALID" | "EXPIRED" | "RECAL_NEEDED";
    iqcWestgard: {
      rule1_2s: "PASS" | "WARNING";
      rule1_3s: "PASS" | "FAIL";
      rule2_2s: "PASS" | "FAIL";
      r_4s: "PASS" | "FAIL";
      overallStatus: "ACCEPTED" | "REJECTED";
      biasPercent: number;
      leveyJenningsSD: number;
    };
    sampleIntegrity: {
      hemolysisIndex: { value: number; unit: string; status: "NORMAL" | "BORDERLINE" | "INTERFERENCE"; ref: string };
      icterusIndex: { value: number; unit: string; status: "NORMAL" | "BORDERLINE" | "INTERFERENCE"; ref: string };
      lipemiaIndex: { value: number; unit: string; status: "NORMAL" | "BORDERLINE" | "INTERFERENCE"; ref: string };
      clotDetected: boolean;
      sampleVolumeAdequate: boolean;
    };
  };
  counterfactualSimulations?: {
    parameter: string;
    originalValue: number;
    simulatedValue: number;
    projectedRiskScore: number;
    deltaRisk: number;
    clinicalEffect: string;
  }[];
  clinicalActionPlan?: {
    immediateEmergencySteps: string[];
    medicationAlerts: { drugOrClass: string; warning: string; action: "WITHHOLD" | "CAUTION" | "ADMINISTER" }[];
    reflexTestingRecommended: { testName: string; rationale: string; stat: boolean }[];
    guidelineCitations: string[];
    pathologistReviewRequired: boolean;
    panicReadbackProtocolMandatory: boolean;
  };
  laboratoryCertificate?: {
    certificateId: string;
    sampleBarcode: string;
    hospitalName: string;
    nablAccreditationNo: string;
    collectionTime: string;
    receivedTime: string;
    reportedTime: string;
    specimenType: string;
    method: string;
    pathologistName: string;
    pathologistRegNo: string;
    digitalSignatureHash: string;
    qrVerificationUrl: string;
  };
  confidenceInterval?: { lower: number; upper: number };
  conformalPredictionInterval?: { lower: number; upper: number; coverage: string };
  uncertaintyDecomposition?: {
    aleatoricUncertainty: number;
    epistemicUncertainty: number;
    totalUncertainty: number;
    reliabilityConfidence: number;
  };
  faganNomogram?: {
    priorProbability: number;
    postProbabilityPos: number;
    postProbabilityNeg: number;
    positiveLr: number;
    negativeLr: number;
  };
  decisionCurveUtility?: {
    threshold: number;
    modelNetBenefit: number;
    treatAllNetBenefit: number;
    avoidedInterventionsPer100: number;
  };
  deltaCheckRcv?: {
    parameter: string;
    previousValue: number;
    currentValue: number;
    deltaPercent: number;
    rcvThreshold: number;
    isTrueBiologicalChange: boolean;
    alertLevel: "NORMAL" | "WARNING" | "CRITICAL_DELTA";
  };
  hl7FhirBundle?: any;
  reactionKinetics?: { timeSec: number; opticalDensity: number; deltaRate: number }[];
  astmTransmissionFrame?: string[];
  preAnalyticalInterference?: { hemolysis: string; icterus: string; lipemia: string; flag: string };
  biomarkerGnnInference?: {
    activeNodesCount: number;
    topInteractions: { pathway: string; source: string; target: string; weight: number }[];
    crossTalkIndex: number;
  };
  coxSurvivalEstimate?: {
    hazardMultiplier: number;
    eventProbability30Day: number;
    eventProbability90Day: number;
    eventProbability1Year: number;
    prognosisCategory: "LOW_RISK" | "INTERMEDIATE" | "HIGH_ACUTE" | "CRITICAL_MORTALITY";
  };
  michaelisMentenKinetics?: {
    observedVelocity: number;
    substrateSaturationPct: number;
    reactionOrder: "ZERO_ORDER_LINEAR" | "FIRST_ORDER_SUBSTRATE_DEPLETED";
    kalmanResidual: number;
  };
  causalCounterfactuals?: {
    intervention: string;
    baselineRisk: number;
    postInterventionRisk: number;
    absoluteRiskDelta: number;
    clinicalRationale: string;
  }[];
  eqasProficiencyAudit?: {
    sdi: number;
    enNumber: number;
    traceabilityNist: string;
    ptSurveyPass: boolean;
  };
  evaluatedAt: string;
}

export interface NlpAnalysisRequest {
  clinicalText: string;
}

export interface ExtractedEntity {
  name: string;
  entity?: string;
  text?: string;
  type: string;
  confidence: number;
  startIndex?: number;
  endIndex?: number;
  assertion?: "AFFIRMED" | "NEGATED" | "UNCERTAIN_HEDGED" | "FAMILY_HISTORY";
  assertionConfidence?: number;
  assertionTrigger?: string | null;
  temporalStatus?: string;
  quantitativeValue?: number | null;
  unit?: string;
  loincCode?: string;
  normalRange?: string;
  isPanic?: boolean;
  rxcui?: string;
  drugClass?: string;
  dosage?: string;
  frequency?: string;
  code?: string;
}

export interface Icd10Prediction {
  code: string;
  icd11?: string;
  description: string;
  hccCategory?: string;
  billable?: boolean;
  confidence: number;
  matchedKeywords?: string[];
}

export interface LoincPrediction {
  code: string;
  name: string;
  unit?: string;
  extractedValue?: number | null;
  normalRange?: string;
  panicThreshold?: string;
  isPanic?: boolean;
  confidence: number;
}

export interface SnomedPrediction {
  id: string;
  fsn: string;
  category: string;
  confidence: number;
}

export interface RxNormPrediction {
  rxcui: string;
  name: string;
  class: string;
  dosage?: string;
  frequency?: string;
  confidence: number;
}

export interface ClinicalSection {
  key: string;
  label: string;
  text: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  assertion?: string;
  confidence?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
  weight: number;
  clinicalSignificance: string;
}

export interface ClinicalKnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ClinicalPhenotype {
  id: string;
  name: string;
  status: "CONFIRMED" | "SUSPECTED" | "RULED_OUT";
  score: number;
  evidence: string[];
}

export interface ClinicalRiskScores {
  charlsonComorbidityIndex: number;
  estimated10YrSurvivalPct: number;
  timiRiskScore: number;
  kdigoCkdStage: string;
  sofaScoreEstimate: number;
}

export interface DeepLearningTelemetry {
  transformerArchitecture: string;
  crfViterbiScore: number;
  tokenAttentionEntropy: number;
  graphAttentionGatLayers: number;
  gnnEdgeCount: number;
  bayesianBrierCalibration: number;
  expectedCalibrationError: string;
  inferenceLatencyMs: number;
  precisionRecallAuc: number;
}

export interface NlpAnalysisResult {
  wordCount: number;
  extractedEntitiesCount?: number;
  entities: ExtractedEntity[];
  icd10Codes: Icd10Prediction[];
  suggestedICD10?: Icd10Prediction[];
  loincCodes?: LoincPrediction[];
  snomedCodes?: SnomedPrediction[];
  rxNormCodes?: RxNormPrediction[];
  sections?: ClinicalSection[];
  relations?: GraphEdge[];
  knowledgeGraph?: ClinicalKnowledgeGraph;
  phenotypes?: ClinicalPhenotype[];
  clinicalRiskScores?: ClinicalRiskScores;
  deepLearningTelemetry?: DeepLearningTelemetry;
  fhirR4Bundle?: any;
  clinicalImpression: string;
  urgency: any;
  keyBiomarkersIdentified: string[];
  recommendedAction: string;
  structuredSummary?: any;
  disclaimer?: string;
}

export interface DeltaCheckRequest {
  testCode: string;
  testName: string;
  currentValue: number;
  previousValue: number;
  timeGapHours: number;
}

export interface DeltaCheckResult {
  testName: string;
  previousValue: number;
  currentValue: number;
  absoluteDiff: number;
  percentageDiff: number;
  velocityPerHour: number;
  zScore: number;
  isSurge: boolean;
  status: "NORMAL_DRIFT" | "MODERATE_SHIFT" | "CRITICAL_DELTA_SURGE";
  clinicalInterpretation: string;
}

export interface TatForecastRequest {
  department: string;
  complexityScore: number;
  isStat: boolean;
  queueDepth: number;
  activeTechnicians: number;
}

export interface TatForecastResult {
  predictedMinutes: number;
  expectedTurnaroundFormatted: string;
  confidenceInterval: [number, number];
  potentialBottleneck: string;
  statAccelerationDiscountMinutes: number;
}

export interface RegisteredModel {
  id: string;
  name: string;
  version: string;
  framework: string;
  metric: string;
  status: "PRODUCTION" | "STAGING" | "ARCHIVED";
  latency: string;
  totalInferences: number;
  lastUpdated: string;
}

// =======================================================
// NEW ENGINE 1: CBC AUTO-ANALYZER
// =======================================================
export interface CbcAnalysisRequest {
  hb: number;           // Hemoglobin g/dL
  rbc: number;          // RBC x10^6/uL
  wbc: number;          // WBC x10^3/uL
  platelets: number;    // x10^3/uL
  hematocrit: number;   // %
  mcv: number;          // fL
  mch: number;          // pg
  mchc: number;         // g/dL
  neutrophils: number;  // %
  lymphocytes: number;  // %
  monocytes: number;    // %
  eosinophils: number;  // %
  basophils: number;    // %
  rdw: number;          // %
  patientAge?: number;
  patientGender?: "MALE" | "FEMALE";
}

export interface CbcFlag {
  parameter: string;
  value: string;
  referenceRange: string;
  flag: "CRITICAL_LOW" | "LOW" | "NORMAL" | "HIGH" | "CRITICAL_HIGH";
  interpretation: string;
}

export interface CbcAnalysisResult {
  overallImpression: string;
  urgency: "ROUTINE" | "ELEVATED" | "HIGH_RISK" | "CRITICAL_PANIC";
  flags: CbcFlag[];
  differentialDiagnosis: string[];
  morphologyPattern: string;
  recommendedFollowUp: string;
  analyzedAt: string;
}

// =======================================================
// NEW ENGINE 2: DRUG INTERACTION CHECKER
// =======================================================
export interface DrugInteractionRequest {
  medications: string[];
  patientAge?: number;
  renalFunction?: "NORMAL" | "MILD_IMPAIRMENT" | "MODERATE_IMPAIRMENT" | "SEVERE_IMPAIRMENT";
  hepaticFunction?: "NORMAL" | "MILD_IMPAIRMENT" | "SEVERE_IMPAIRMENT";
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: "MINOR" | "MODERATE" | "MAJOR" | "CONTRAINDICATED";
  mechanism: string;
  clinicalEffect: string;
  management: string;
}

export interface DrugInteractionResult {
  totalInteractions: number;
  contraindicated: number;
  majorInteractions: number;
  moderateInteractions: number;
  interactions: DrugInteraction[];
  overallRisk: "SAFE" | "CAUTION" | "HIGH_RISK" | "CONTRAINDICATED";
  pharmacistAlert: string;
  analyzedAt: string;
}

// =======================================================
// NEW ENGINE 3: ANTIBIOTIC SUSCEPTIBILITY PREDICTOR (AMR)
// =======================================================
export interface AmrPredictionRequest {
  organism: string;
  specimenType: "BLOOD" | "URINE" | "WOUND" | "SPUTUM" | "CSF" | "STOOL";
  gramStain?: "POSITIVE" | "NEGATIVE";
  patientHistory?: string[];
  mic?: { [antibiotic: string]: number };
}

export interface AntibioticSusceptibility {
  antibiotic: string;
  class: string;
  predictedResult: "SENSITIVE" | "INTERMEDIATE" | "RESISTANT";
  confidencePercent: number;
  mic?: string;
  clinicalNote?: string;
}

export interface AmrPredictionResult {
  organism: string;
  specimenType: string;
  riskProfile: "LOW_AMR_RISK" | "MODERATE_AMR_RISK" | "MDR_RISK" | "XDR_RISK" | "PDR_RISK";
  susceptibilityPanel: AntibioticSusceptibility[];
  recommendedEmpiric: string[];
  avoidList: string[];
  infectiologyAlert: string;
  isoStandard: string;
  analyzedAt: string;
}

// =======================================================
// NEW ENGINE 4: THYROID DISEASE CLASSIFIER
// =======================================================
export interface ThyroidAnalysisRequest {
  tsh: number;          // mIU/L
  ft4: number;          // pmol/L or ng/dL
  ft3: number;          // pmol/L or pg/mL
  tpoAntibody?: number; // IU/mL (anti-TPO)
  tgAntibody?: number;  // IU/mL (anti-Tg)
  tshUnits?: "mIU_L";
  ft4Units?: "pmol_L" | "ng_dL";
  patientAge?: number;
  patientGender?: "MALE" | "FEMALE";
  symptoms?: string[];
}

export interface ThyroidClassificationResult {
  classification: string;
  functionalStatus: "EUTHYROID" | "HYPOTHYROID" | "HYPERTHYROID" | "SUBCLINICAL_HYPO" | "SUBCLINICAL_HYPER";
  urgency: "ROUTINE" | "ELEVATED" | "HIGH_RISK" | "CRITICAL_PANIC";
  riskScore: number;
  autoimmunityRisk: "LOW" | "MODERATE" | "HIGH";
  shapAttributions: { parameter: string; value: string; interpretation: string; flag: string }[];
  icd10Code: string;
  clinicalRecommendation: string;
  repeatInterval: string;
  analyzedAt: string;
}

// =======================================================
// NEW ENGINE 5: COAGULATION RISK ENGINE
// =======================================================
export interface CoagulationRequest {
  pt: number;        // seconds
  inr: number;       // ratio
  aptt: number;      // seconds (activated partial thromboplastin time)
  fibrinogen?: number; // mg/dL
  dDimer?: number;   // ng/mL
  platelets?: number; // x10^3/uL
  antithrombinIII?: number; // %
  proteinC?: number; // %
  indication?: "ANTICOAG_MONITORING" | "BLEEDING_WORKUP" | "PRE_OP_SCREEN" | "DIC_ASSESSMENT";
}

export interface CoagulationRiskResult {
  overallHemostaticStatus: "NORMAL" | "MILD_COAGULOPATHY" | "MODERATE_COAGULOPATHY" | "SEVERE_COAGULOPATHY" | "DIC";
  urgency: "ROUTINE" | "ELEVATED" | "HIGH_RISK" | "CRITICAL_PANIC";
  ptInterpretation: string;
  inrInterpretation: string;
  apttInterpretation: string;
  dicScore?: number;
  bleedingRisk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  thrombosisRisk: "LOW" | "MODERATE" | "HIGH";
  clinicalFlags: string[];
  management: string;
  analyzedAt: string;
}

// =======================================================
// NEW ENGINE 6: SMART REPORT NARRATIVE GENERATOR
// =======================================================
export interface SmartReportRequest {
  patientName: string;
  patientAge: number;
  patientGender: "MALE" | "FEMALE" | "OTHER";
  uhid: string;
  referringDoctor?: string;
  department: string;
  testResults: { testName: string; value: string | number; unit: string; referenceRange: string; flag?: string }[];
  clinicalHistory?: string;
  specimenType?: string;
  collectionDateTime?: string;
}

export interface SmartReportResult {
  narrativeSummary: string;
  clinicalImpression: string;
  criticalFindings: string[];
  recommendations: string[];
  autoIcd10Codes: { code: string; description: string }[];
  pathologistNote: string;
  reportGrade: "NORMAL" | "MILD_ABNORMAL" | "SIGNIFICANT_ABNORMAL" | "CRITICAL";
  generatedAt: string;
}
