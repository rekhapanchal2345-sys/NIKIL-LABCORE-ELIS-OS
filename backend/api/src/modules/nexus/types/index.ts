// ==============================================================================
// FILE 1: backend/api/src/modules/nexus/types/index.ts
// FEATURE: OMNI-SENTINEL™ // NEXUS-BIO-TENSOR™ Strong Type Definitions
// TARGET PLATFORM: NIKIL-LABCORE-ELIS-OS (Node.js, Express 5.2.1, TypeScript 5.9, Prisma 7.9)
// REGULATORY COMPLIANCE: NABL ISO 15189:2022, CLSI C24-ED4, Sepsis-3, KDIGO 2024, India DPDP Act 2023
// ==============================================================================

/**
 * Canonical analyte codes monitored across the 12-dimensional Riemannian metabolic
 * manifold, cellular hematology lineages, and arterial blood-gas tensors.
 */
export type AnalyteCode =
  | 'NA'
  | 'K'
  | 'CL'
  | 'HCO3'
  | 'BUN'
  | 'CREAT'
  | 'GLU'
  | 'CA'
  | 'MG'
  | 'PO4'
  | 'ALB'
  | 'LAC'
  | 'ALP'
  | 'PH'
  | 'PCO2'
  | 'WBC'
  | 'RBC'
  | 'HGB'
  | 'PLT';

/**
 * Vacuum blood collection tube types subject to pre-analytical forensic verification.
 */
export type TubeContainerType =
  | 'SST_GOLD'
  | 'LITHIUM_HEPARIN_GREEN'
  | 'K2_EDTA_LAVENDER'
  | 'SODIUM_CITRATE_BLUE'
  | 'ARTERIAL_BLOOD_GAS';

/**
 * Anatomical specimen draw site used for hemodilution prior probability weighting.
 */
export type AnatomicalDrawSite =
  | 'PERIPHERAL_VENIPUNCTURE'
  | 'INDWELLING_IV_CATHETER'
  | 'CENTRAL_VENOUS_LINE'
  | 'ARTERIAL_LINE';

/**
 * Single analyte measurement point with population reference parameters.
 */
export interface TelemetryPoint {
  analyte: AnalyteCode;
  value: number;
  unit: string;
  referenceMin: number;
  referenceMax: number;
  mean: number;
  stdDev: number;
  timestamp: string;
}

/**
 * Pre-analytical spectrophotometric and container metadata for a laboratory specimen.
 */
export interface SpecimenMetadata {
  specimenId: string;
  patientId: string;
  tubeType: TubeContainerType;
  hemolysisIndexMgDl: number;
  lipemiaIndexMgDl: number;
  icterusIndexMgDl: number;
  collectionSite: AnatomicalDrawSite;
  collectedAt: string;
}

/**
 * Longitudinal 3-point physiological time series (t_-48h, t_-24h, t_0).
 */
export interface TimeSeriesTelemetry {
  tMinus48h: Partial<Record<AnalyteCode, number>>;
  tMinus24h: Partial<Record<AnalyteCode, number>>;
  tZero: Partial<Record<AnalyteCode, number>>;
  timestamps: {
    tMinus48h: string;
    tMinus24h: string;
    tZero: string;
  };
}

/**
 * High-dimensional Riemannian Mahalanobis manifold evaluation result.
 */
export interface MahalanobisResult {
  dSquared: number;
  degreesOfFreedom: number;
  chiSquareCritical001: number;
  pValue: number;
  wilsonHilfertyZ: number;
  regularizationEpsilon: number;
  conditionNumberEstimate: number;
  univariateNormalsCount: number;
  totalEvaluatedAnalytes: number;
  pathologyDiscordanceFlag:
    | 'HIGH_PATHOLOGY_DISCORDANCE'
    | 'CONCORDANT_EXTREME_PATHOLOGY'
    | 'EUHOMEOSTATIC_MANIFOLD';
  dominantEigenContributors: Array<{
    analyte: AnalyteCode;
    zScore: number;
    mahalanobisContribution: number;
  }>;
}

/**
 * Stewart-Fencl physicochemical acid-base classification categories.
 */
export type StewartAcidBaseClassification =
  | 'UNMEASURED_ANION_ACCUMULATION'
  | 'HYPERCHLOREMIC_ACIDOSIS'
  | 'LACTIC_ACIDOSIS'
  | 'NORMAL';

/**
 * Stewart-Fencl non-linear electroneutrality acid-base solver output.
 */
export interface StewartResult {
  sidApparentMeqL: number;
  sidEffectiveMeqL: number;
  strongIonGapMeqL: number;
  bicarbonateCalculatedMeqL: number;
  albuminChargeMeqL: number;
  phosphateChargeMeqL: number;
  freeWaterEffectMeqL: number;
  chlorideEffectMeqL: number;
  classification: StewartAcidBaseClassification;
  electroneutralityResidualMeqL: number;
  biophysicalInterpretation: string;
}

/**
 * Chelation stoichiometry and pre-analytical specimen artifact forensics result.
 */
export interface StoichiometryResult {
  edtaContamination: {
    detected: boolean;
    kfCaEdta: number;
    stoichiometricRatio: number;
    deltaKMeqL: number;
    deltaCaMmolL: number;
    currentCaMgDl: number;
    currentAlpIuL: number;
    posteriorProbability: number;
    flag: 'ARTIFACT_EDTA_CONTAMINATION' | 'NONE';
  };
  ivLineDilution: {
    detected: boolean;
    analyteRatios: Record<string, number>;
    meanDilutionFactorLambda: number;
    dilutionVarianceSigmaSq: number;
    estimatedFluidAdmixtureFraction: number;
    flag: 'ARTIFACT_IV_LINE_DILUTION' | 'NONE';
  };
  hemolysisCorrection: {
    hemolysisIndexMgDl: number;
    measuredPotassiumMeqL: number;
    expectedDeltaPotassiumLysisMeqL: number;
    correctedInVivoPotassiumMeqL: number;
    classification:
      | 'TRUE_IN_VIVO_HYPERKALEMIA'
      | 'PSEUDOHYPERKALEMIA_IN_VITRO_LYSIS'
      | 'MASKED_HYPOKALEMIA_BY_LYSIS'
      | 'NORMOKALEMIC_INVARIANT';
  };
  recommendedAction:
    | 'HARD_LOCK_REJECT_AND_REDRAW'
    | 'HOLD_PATHOLOGIST_AUDIT'
    | 'PASS_PREANALYTICAL_FORENSICS';
}

/**
 * Per-analyte stochastic kinematics along the Ornstein-Uhlenbeck trajectory.
 */
export interface AnalyteKinematics {
  analyte: AnalyteCode;
  xMinus48h: number;
  xMinus24h: number;
  xZero: number;
  homeostaticMeanMu: number;
  velocityPerHour: number;
  accelerationPerHourSq: number;
  meanReversionTheta: number;
  localLyapunovExponent: number;
  diffusionVolatilitySigma: number;
  estimatedHoursToCriticalBarrier: number | null;
}

/**
 * Ornstein-Uhlenbeck SDE trajectory and Lyapunov stability result.
 */
export interface TrajectoryResult {
  kinematicsTensor: AnalyteKinematics[];
  systemicMeanReversionTheta: number;
  maxLyapunovExponentLambdaL: number;
  isChaoticDecompensation: boolean;
  acuteDecompensationHorizonHours: number | null;
  predictedSyndromes: Array<
    | 'SEPTIC_SHOCK_TRAJECTORY'
    | 'KDIGO_ACUTE_KIDNEY_INJURY'
    | 'OVERT_DIC_COAGULOPATHY'
    | 'HEMODYNAMIC_STABILITY'
  >;
}

/**
 * Mutually exclusive clinical differential states evaluated by the Shannon entropy engine.
 */
export type DifferentialState =
  | 'SEPTIC_SHOCK'
  | 'ACUTE_KIDNEY_INJURY'
  | 'DISSEMINATED_INTRAVASCULAR_COAGULATION'
  | 'CARDIOGENIC_ISCHEMIA'
  | 'METABOLIC_ACIDEMIA'
  | 'PREANALYTICAL_SPURIOUS_ARTIFACT'
  | 'HOMEOSTATIC_BASELINE';

/**
 * Candidate reflex test evaluated for Mutual Information gain and Pareto efficiency.
 */
export interface ReflexTestCandidate {
  testCode: string;
  testName: string;
  cptCode: string;
  normalizedCost: number;
  tatHours: number;
  mutualInformationBits: number;
  expectedPosteriorEntropyBits: number;
  paretoEfficiencyEta: number;
  clinicalRationale: string;
}

/**
 * Shannon Information Entropy and Mutual Information reflex optimization output.
 */
export interface EntropyReflexResult {
  priorDistribution: Record<DifferentialState, number>;
  shannonEntropyBits: number;
  maxPossibleEntropyBits: number;
  normalizedUncertaintyRatio: number;
  rankedReflexCandidates: ReflexTestCandidate[];
  optimalParetoTest: ReflexTestCandidate | null;
}

/**
 * Final operational gate verdict for the laboratory specimen.
 */
export type NexusAuditVerdict =
  | 'AUTORELEASE_TO_DISPATCH'
  | 'HOLD_PATHOLOGIST_AUDIT'
  | 'HARD_LOCK_REJECT_AND_REDRAW';

/**
 * Structured executive briefing synthesized for the attending physician and FRCPath consultant.
 */
export interface ExecutiveBriefingSchema {
  clinicalHeadline: string;
  biophysicalSynthesis: string;
  preAnalyticalForensicNote: string;
  acidBaseAndManifoldNote: string;
  stochasticTrajectoryWarning: string;
  recommendedReflexProtocol: string;
}

/**
 * Complete persisted and returned payload for a NEXUS-BIO-TENSOR™ audit.
 */
export interface NexusAuditPayload {
  auditId: string;
  specimenId: string;
  patientId: string;
  evaluatedAt: string;
  verdict: NexusAuditVerdict;
  stoichiometry: StoichiometryResult;
  mahalanobis: MahalanobisResult;
  stewart: StewartResult;
  trajectory: TrajectoryResult;
  entropyReflex: EntropyReflexResult;
  executiveBriefing: ExecutiveBriefingSchema;
  regulatoryComplianceTags: string[];
}
