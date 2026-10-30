/**
 * LABCORE CHRONOS-HEMODYNAMICS & QUANTUM-BIOFLUIDICS NEXUS™
 * Core TypeScript Type Definitions
 */

// ============================================================================
// 1. STEWART QUANTITATIVE ACID-BASE TYPES
// ============================================================================
export interface StewartABGInput {
    na: number;            // mmol/L (Normal: 135-145)
    k: number;             // mmol/L (Normal: 3.5-5.0)
    caIonized: number;     // mmol/L (Normal: 1.15-1.30)
    mgIonized: number;     // mmol/L (Normal: 0.70-1.00)
    cl: number;            // mmol/L (Normal: 98-106)
    lactate: number;       // mmol/L (Normal: 0.5-1.5)
    albuminGdl: number;    // g/dL   (Normal: 3.5-5.0)
    phosphateMgdl: number; // mg/dL (Normal: 2.5-4.5)
    pco2Mmhg: number;      // mmHg   (Normal: 35-45)
    measuredPh: number;    // pH     (Normal: 7.35-7.45)
}

export interface StewartABGResult {
    sidApparentMeqL: number;
    sidEffectiveMeqL: number;
    strongIonGapMeqL: number;
    bicarbonateMmolL: number;
    albuminIonicEffectMeqL: number;
    phosphateIonicEffectMeqL: number;
    newtonRaphsonSolvedPh: number;
    clinicalPartitionVerdicts: string[];
}

// ============================================================================
// 2. CLOSED-LOOP RK4 + BAYESIAN TDM TYPES
// ============================================================================
export interface BayesianTDMInput {
    patientId: string;
    patientWeightKg: number;
    creatinineClearanceMlMin: number;
    drugName: 'VANCOMYCIN' | 'MEROPENEM' | 'TACROLIMUS' | 'BUSULFAN';
    doseMg: number;
    infusionDurationHours: number;
    dosingIntervalHours: number;
    micMgL: number;
    observedSamples: Array<{ timeHours: number; concentrationMgL: number }>;
}

export interface BayesianTDMResult {
    posteriorClearanceLh: number;
    posteriorCentralVolumeL: number;
    steadyStateAuc24MgHL: number;
    aucToMicRatio: number;
    therapeuticWindowStatus:
        | 'OPTIMAL_BACTERICIDAL_TARGET_LOCKED'
        | 'SUBTHERAPEUTIC_SEPSIS_FAILURE_ESCALATE'
        | 'NEPHROTOXIC_AKI_DANGER_HOLD_INFUSION';
    recommendedAdjustedDoseMg: number;
    rk4TrajectoryPoints: Array<{ hour: number; centralMgL: number; peripheralMgL: number }>;
}

// ============================================================================
// 3. LIQUID BIOPSY cfDNA TISSUE-OF-ORIGIN CONVEX DECONVOLUTION TYPES
// ============================================================================
export interface LiquidBiopsyInput {
    patientId: string;
    plasmaVolumeMl: number;
    totalCfDnaConcentrationNgMl: number;
    fragmentLengthHistogram: number[]; // 100 to 220 bp (121 bins)
    observedCpGMethylationVector?: number[]; // Observed methylation beta values
}

export interface LiquidBiopsyResult {
    fragmentationAberrationScore: number;
    nucleosomePitchPeriodicityBp: number;
    tumorFractionEstimatePct: number;
    tissueOfOriginFractions: Array<{
        tissue: string;
        fractionPercentage: number;
        confidenceInterval95: [number, number];
        isPathologicalElevated: boolean;
    }>;
    primaryOrganSuspect: string;
    clinicalRelapseRisk: 'HIGH_MINIMAL_RESIDUAL_DISEASE' | 'MODERATE_SUSPICIOUS' | 'INDOLENT_LOW_RISK';
}

// ============================================================================
// 4. 5-PARAMETER LOGISTIC (5-PL) & HOOK-EFFECT INTERCEPTOR TYPES
// ============================================================================
export interface ImmunoassayHookInput {
    sampleId: string;
    analyte: 'BETA_HCG' | 'TOTAL_PSA' | 'FERRITIN' | 'AFP' | 'TROPONIN_I';
    measuredRluFinal: number; // Equilibrium RLU at t2 (e.g. 180s)
    kineticRluVelocityT1: number; // Early kinetic velocity dRLU/dt at t1 (e.g. 18s)
    initialNominalResult: number;
    unit: string;
}

export interface ImmunoassayHookResult {
    prozoneHookDetected: boolean;
    kineticRatio: number;
    thresholdApplied: number;
    trueEstimatedConcentration: number;
    dilutionRecommended: '1:100_AND_1:1000_REFLEX_SERIAL_DILUTION' | 'NONE_STANDARD_REPORTABLE';
    clinicalInterlockAction: 'HARD_BLOCK_FALSE_NEGATIVE_REPORT' | 'VALIDATED_NORMAL_VALUE';
    interlockWarningText: string;
}

// ============================================================================
// 5. PBRTQC GRAPH-LAPLACIAN MULTI-ANALYZER DRIFT TYPES
// ============================================================================
export interface AnalyzerStreamNode {
    analyzerId: string;
    analyzerModel: string;
    recentPatientValues: number[];
}

export interface PBRTQCInput {
    analyteName: string;
    targetMean: number;
    targetSd: number;
    boxCoxLambda: number;
    nodes: AnalyzerStreamNode[];
}

export interface PBRTQCResult {
    analyteName: string;
    globalNetworkMeanZ: number;
    consensusMatrix: Array<{
        analyzerId: string;
        analyzerModel: string;
        meanZScore: number;
        cusumPositive: number;
        cusumNegative: number;
        cusumBreached: boolean;
        laplacianResidual: number;
        interlockStatus:
            | 'SYNCHRONIZED_IN_CONTROL'
            | 'AUTO_QUARANTINE_INSTRUMENT_CALIBRATION_DRIFT'
            | 'POPULATION_EPIDEMIOLOGICAL_SHIFT_DETECTED';
        recommendedSlopeCorrection: number;
    }>;
    iso15189CryptographicSeal: string;
}
