// ==============================================================================
// FILE 6: backend/api/src/modules/nexus/math/entropy_reflex.ts
// FEATURE: Shannon Information Entropy & Mutual Information Reflex Engine
// TARGET PLATFORM: NIKIL-LABCORE-ELIS-OS (Pure TypeScript 5.9)
// ==============================================================================

import {
  DifferentialState,
  EntropyReflexResult,
  MahalanobisResult,
  ReflexTestCandidate,
  StewartResult,
  StoichiometryResult,
  TrajectoryResult,
} from '../types/index';

const DIFFERENTIAL_STATES: readonly DifferentialState[] = [
  'SEPTIC_SHOCK',
  'ACUTE_KIDNEY_INJURY',
  'DISSEMINATED_INTRAVASCULAR_COAGULATION',
  'CARDIOGENIC_ISCHEMIA',
  'METABOLIC_ACIDEMIA',
  'PREANALYTICAL_SPURIOUS_ARTIFACT',
  'HOMEOSTATIC_BASELINE',
] as const;

type TestOutcomeState = 'POSITIVE_CRITICAL' | 'BORDERLINE_INDETERMINATE' | 'NEGATIVE_NORMAL';

interface CandidateTestSpecification {
  testCode: string;
  testName: string;
  cptCode: string;
  normalizedCost: number;
  tatHours: number;
  clinicalRationale: string;
  /**
   * Conditional likelihood matrix P(T_j = y | D = d_i) across the 3 test outcomes
   * (must sum to 1.0 for each differential state d_i).
   */
  likelihoodGivenState: Record<
    DifferentialState,
    Record<TestOutcomeState, number>
  >;
}

/**
 * Catalog of candidate reflex diagnostic tests with empirical diagnostic likelihoods
 * P(T_j = y | D = d_i), normalized cost units, and turnaround time (TAT) in hours.
 */
const REFLEX_TEST_CATALOG: readonly CandidateTestSpecification[] = [
  {
    testCode: 'PCT-STAT',
    testName: 'Procalcitonin (High-Sensitivity Chemiluminescence)',
    cptCode: '84145',
    normalizedCost: 1.45,
    tatHours: 0.75,
    clinicalRationale:
      'Maximizes mutual information for bacterial septic shock vs sterile metabolic acidemia (Sepsis-3).',
    likelihoodGivenState: {
      SEPTIC_SHOCK: { POSITIVE_CRITICAL: 0.91, BORDERLINE_INDETERMINATE: 0.06, NEGATIVE_NORMAL: 0.03 },
      ACUTE_KIDNEY_INJURY: { POSITIVE_CRITICAL: 0.18, BORDERLINE_INDETERMINATE: 0.27, NEGATIVE_NORMAL: 0.55 },
      DISSEMINATED_INTRAVASCULAR_COAGULATION: { POSITIVE_CRITICAL: 0.45, BORDERLINE_INDETERMINATE: 0.30, NEGATIVE_NORMAL: 0.25 },
      CARDIOGENIC_ISCHEMIA: { POSITIVE_CRITICAL: 0.08, BORDERLINE_INDETERMINATE: 0.14, NEGATIVE_NORMAL: 0.78 },
      METABOLIC_ACIDEMIA: { POSITIVE_CRITICAL: 0.12, BORDERLINE_INDETERMINATE: 0.20, NEGATIVE_NORMAL: 0.68 },
      PREANALYTICAL_SPURIOUS_ARTIFACT: { POSITIVE_CRITICAL: 0.02, BORDERLINE_INDETERMINATE: 0.05, NEGATIVE_NORMAL: 0.93 },
      HOMEOSTATIC_BASELINE: { POSITIVE_CRITICAL: 0.01, BORDERLINE_INDETERMINATE: 0.04, NEGATIVE_NORMAL: 0.95 },
    },
  },
  {
    testCode: 'DDIM-Q',
    testName: 'Quantitative Fibrin D-Dimer & peripheral Schistocyte Screen',
    cptCode: '85379',
    normalizedCost: 1.15,
    tatHours: 0.6,
    clinicalRationale:
      'Resolves microvascular fibrin degradation and overt Disseminated Intravascular Coagulation (ISTH criteria).',
    likelihoodGivenState: {
      SEPTIC_SHOCK: { POSITIVE_CRITICAL: 0.52, BORDERLINE_INDETERMINATE: 0.30, NEGATIVE_NORMAL: 0.18 },
      ACUTE_KIDNEY_INJURY: { POSITIVE_CRITICAL: 0.15, BORDERLINE_INDETERMINATE: 0.25, NEGATIVE_NORMAL: 0.60 },
      DISSEMINATED_INTRAVASCULAR_COAGULATION: { POSITIVE_CRITICAL: 0.95, BORDERLINE_INDETERMINATE: 0.04, NEGATIVE_NORMAL: 0.01 },
      CARDIOGENIC_ISCHEMIA: { POSITIVE_CRITICAL: 0.28, BORDERLINE_INDETERMINATE: 0.32, NEGATIVE_NORMAL: 0.40 },
      METABOLIC_ACIDEMIA: { POSITIVE_CRITICAL: 0.10, BORDERLINE_INDETERMINATE: 0.20, NEGATIVE_NORMAL: 0.70 },
      PREANALYTICAL_SPURIOUS_ARTIFACT: { POSITIVE_CRITICAL: 0.04, BORDERLINE_INDETERMINATE: 0.08, NEGATIVE_NORMAL: 0.88 },
      HOMEOSTATIC_BASELINE: { POSITIVE_CRITICAL: 0.02, BORDERLINE_INDETERMINATE: 0.06, NEGATIVE_NORMAL: 0.92 },
    },
  },
  {
    testCode: 'PBS-MORPH',
    testName: 'Peripheral Blood Smear Digital Morphology & Platelet Clump Audit',
    cptCode: '85060',
    normalizedCost: 0.85,
    tatHours: 0.5,
    clinicalRationale:
      'Directly discriminates in-vitro EDTA/clumping/hemolysis artifacts from true hematologic cytopenias and microangiopathic hemolysis.',
    likelihoodGivenState: {
      SEPTIC_SHOCK: { POSITIVE_CRITICAL: 0.64, BORDERLINE_INDETERMINATE: 0.22, NEGATIVE_NORMAL: 0.14 },
      ACUTE_KIDNEY_INJURY: { POSITIVE_CRITICAL: 0.12, BORDERLINE_INDETERMINATE: 0.18, NEGATIVE_NORMAL: 0.70 },
      DISSEMINATED_INTRAVASCULAR_COAGULATION: { POSITIVE_CRITICAL: 0.88, BORDERLINE_INDETERMINATE: 0.08, NEGATIVE_NORMAL: 0.04 },
      CARDIOGENIC_ISCHEMIA: { POSITIVE_CRITICAL: 0.05, BORDERLINE_INDETERMINATE: 0.10, NEGATIVE_NORMAL: 0.85 },
      METABOLIC_ACIDEMIA: { POSITIVE_CRITICAL: 0.06, BORDERLINE_INDETERMINATE: 0.12, NEGATIVE_NORMAL: 0.82 },
      PREANALYTICAL_SPURIOUS_ARTIFACT: { POSITIVE_CRITICAL: 0.92, BORDERLINE_INDETERMINATE: 0.05, NEGATIVE_NORMAL: 0.03 },
      HOMEOSTATIC_BASELINE: { POSITIVE_CRITICAL: 0.01, BORDERLINE_INDETERMINATE: 0.04, NEGATIVE_NORMAL: 0.95 },
    },
  },
  {
    testCode: 'ABG-STEW',
    testName: 'Arterial Blood Gas + Ionized Calcium & Co-Oximetry Panel',
    cptCode: '82803',
    normalizedCost: 1.05,
    tatHours: 0.25,
    clinicalRationale:
      'Ultra-rapid TAT quantification of Stewart-Fencl Strong Ion Gap (SIG), ionized Ca2+, and unmeasured anion acidemia.',
    likelihoodGivenState: {
      SEPTIC_SHOCK: { POSITIVE_CRITICAL: 0.82, BORDERLINE_INDETERMINATE: 0.12, NEGATIVE_NORMAL: 0.06 },
      ACUTE_KIDNEY_INJURY: { POSITIVE_CRITICAL: 0.58, BORDERLINE_INDETERMINATE: 0.26, NEGATIVE_NORMAL: 0.16 },
      DISSEMINATED_INTRAVASCULAR_COAGULATION: { POSITIVE_CRITICAL: 0.35, BORDERLINE_INDETERMINATE: 0.30, NEGATIVE_NORMAL: 0.35 },
      CARDIOGENIC_ISCHEMIA: { POSITIVE_CRITICAL: 0.48, BORDERLINE_INDETERMINATE: 0.28, NEGATIVE_NORMAL: 0.24 },
      METABOLIC_ACIDEMIA: { POSITIVE_CRITICAL: 0.96, BORDERLINE_INDETERMINATE: 0.03, NEGATIVE_NORMAL: 0.01 },
      PREANALYTICAL_SPURIOUS_ARTIFACT: { POSITIVE_CRITICAL: 0.84, BORDERLINE_INDETERMINATE: 0.10, NEGATIVE_NORMAL: 0.06 },
      HOMEOSTATIC_BASELINE: { POSITIVE_CRITICAL: 0.01, BORDERLINE_INDETERMINATE: 0.03, NEGATIVE_NORMAL: 0.96 },
    },
  },
  {
    testCode: 'HS-TNI',
    testName: 'High-Sensitivity Cardiac Troponin-I (hs-cTnI)',
    cptCode: '84484',
    normalizedCost: 1.35,
    tatHours: 0.65,
    clinicalRationale:
      'Resolves silent myocardial necrosis and type-2 demand ischemia secondary to hemodynamic shock.',
    likelihoodGivenState: {
      SEPTIC_SHOCK: { POSITIVE_CRITICAL: 0.38, BORDERLINE_INDETERMINATE: 0.32, NEGATIVE_NORMAL: 0.30 },
      ACUTE_KIDNEY_INJURY: { POSITIVE_CRITICAL: 0.25, BORDERLINE_INDETERMINATE: 0.38, NEGATIVE_NORMAL: 0.37 },
      DISSEMINATED_INTRAVASCULAR_COAGULATION: { POSITIVE_CRITICAL: 0.20, BORDERLINE_INDETERMINATE: 0.25, NEGATIVE_NORMAL: 0.55 },
      CARDIOGENIC_ISCHEMIA: { POSITIVE_CRITICAL: 0.94, BORDERLINE_INDETERMINATE: 0.05, NEGATIVE_NORMAL: 0.01 },
      METABOLIC_ACIDEMIA: { POSITIVE_CRITICAL: 0.14, BORDERLINE_INDETERMINATE: 0.22, NEGATIVE_NORMAL: 0.64 },
      PREANALYTICAL_SPURIOUS_ARTIFACT: { POSITIVE_CRITICAL: 0.02, BORDERLINE_INDETERMINATE: 0.04, NEGATIVE_NORMAL: 0.94 },
      HOMEOSTATIC_BASELINE: { POSITIVE_CRITICAL: 0.01, BORDERLINE_INDETERMINATE: 0.03, NEGATIVE_NORMAL: 0.96 },
    },
  },
  {
    testCode: 'UOSM-FEN',
    testName: 'Spot Urine Osmolality & Fractional Excretion of Sodium (FENa)',
    cptCode: '83935',
    normalizedCost: 0.95,
    tatHours: 0.8,
    clinicalRationale:
      'Differentiates pre-renal azotemia from intrinsic acute tubular necrosis (KDIGO 2024 AKI staging).',
    likelihoodGivenState: {
      SEPTIC_SHOCK: { POSITIVE_CRITICAL: 0.46, BORDERLINE_INDETERMINATE: 0.30, NEGATIVE_NORMAL: 0.24 },
      ACUTE_KIDNEY_INJURY: { POSITIVE_CRITICAL: 0.92, BORDERLINE_INDETERMINATE: 0.06, NEGATIVE_NORMAL: 0.02 },
      DISSEMINATED_INTRAVASCULAR_COAGULATION: { POSITIVE_CRITICAL: 0.22, BORDERLINE_INDETERMINATE: 0.28, NEGATIVE_NORMAL: 0.50 },
      CARDIOGENIC_ISCHEMIA: { POSITIVE_CRITICAL: 0.30, BORDERLINE_INDETERMINATE: 0.35, NEGATIVE_NORMAL: 0.35 },
      METABOLIC_ACIDEMIA: { POSITIVE_CRITICAL: 0.28, BORDERLINE_INDETERMINATE: 0.32, NEGATIVE_NORMAL: 0.40 },
      PREANALYTICAL_SPURIOUS_ARTIFACT: { POSITIVE_CRITICAL: 0.02, BORDERLINE_INDETERMINATE: 0.05, NEGATIVE_NORMAL: 0.93 },
      HOMEOSTATIC_BASELINE: { POSITIVE_CRITICAL: 0.02, BORDERLINE_INDETERMINATE: 0.05, NEGATIVE_NORMAL: 0.93 },
    },
  },
] as const;

/**
 * Computes base-2 Shannon Entropy H(P) = -sum_{i=1}^m P(d_i) * log2(P(d_i)) in bits.
 */
export function calculateShannonEntropyBits(probabilities: number[]): number {
  let entropy = 0.0;
  for (const p of probabilities) {
    if (Number.isFinite(p) && p > 1e-12) {
      entropy -= p * Math.log2(p);
    }
  }
  return Math.max(0.0, entropy);
}

/**
 * Synthesizes the prior differential state distribution P(D) from the 4 biophysical
 * engines and computes Shannon Entropy H(D), Mutual Information I(D; T_j), and
 * the Multi-Objective Pareto Efficiency Index eta(T_j) for all reflex candidates:
 *
 *   H(D) = -sum_{i=1}^m P(d_i) * log2(P(d_i))
 *   I(D; T_j) = H(D) - sum_y P(T_j = y) * H(D | T_j = y)
 *   eta(T_j) = I(D; T_j) / (Cost_normalized(T_j) * ln(1 + TAT_hours(T_j)))
 */
export function computeEntropyReflexOptimization(params: {
  stoichiometry: StoichiometryResult;
  mahalanobis: MahalanobisResult;
  stewart: StewartResult;
  trajectory: TrajectoryResult;
}): EntropyReflexResult {
  const { stoichiometry, mahalanobis, stewart, trajectory } = params;

  // Initialize unnormalized log-odds / weights for each differential state
  const rawWeights: Record<DifferentialState, number> = {
    SEPTIC_SHOCK: 0.05,
    ACUTE_KIDNEY_INJURY: 0.05,
    DISSEMINATED_INTRAVASCULAR_COAGULATION: 0.04,
    CARDIOGENIC_ISCHEMIA: 0.04,
    METABOLIC_ACIDEMIA: 0.05,
    PREANALYTICAL_SPURIOUS_ARTIFACT: 0.04,
    HOMEOSTATIC_BASELINE: 0.73,
  };

  // 1. Update weights from Pre-Analytical Stoichiometry Forensics
  if (
    stoichiometry.edtaContamination.detected ||
    stoichiometry.ivLineDilution.detected ||
    stoichiometry.hemolysisCorrection.classification ===
      'PSEUDOHYPERKALEMIA_IN_VITRO_LYSIS' ||
    stoichiometry.hemolysisCorrection.classification ===
      'MASKED_HYPOKALEMIA_BY_LYSIS'
  ) {
    rawWeights.PREANALYTICAL_SPURIOUS_ARTIFACT += 2.4;
    rawWeights.HOMEOSTATIC_BASELINE *= 0.2;
  }

  // 2. Update weights from Stewart-Fencl Physicochemical Acid-Base Solver
  if (stewart.classification === 'LACTIC_ACIDOSIS') {
    rawWeights.SEPTIC_SHOCK += 1.5;
    rawWeights.METABOLIC_ACIDEMIA += 1.2;
    rawWeights.CARDIOGENIC_ISCHEMIA += 0.6;
    rawWeights.HOMEOSTATIC_BASELINE *= 0.1;
  } else if (stewart.classification === 'UNMEASURED_ANION_ACCUMULATION') {
    rawWeights.METABOLIC_ACIDEMIA += 1.6;
    rawWeights.ACUTE_KIDNEY_INJURY += 1.1;
    rawWeights.SEPTIC_SHOCK += 0.7;
    rawWeights.HOMEOSTATIC_BASELINE *= 0.15;
  } else if (stewart.classification === 'HYPERCHLOREMIC_ACIDOSIS') {
    rawWeights.METABOLIC_ACIDEMIA += 1.3;
    rawWeights.ACUTE_KIDNEY_INJURY += 0.6;
    rawWeights.HOMEOSTATIC_BASELINE *= 0.3;
  }

  // 3. Update weights from Riemannian Mahalanobis Manifold
  if (
    mahalanobis.pathologyDiscordanceFlag === 'HIGH_PATHOLOGY_DISCORDANCE' ||
    mahalanobis.pathologyDiscordanceFlag === 'CONCORDANT_EXTREME_PATHOLOGY'
  ) {
    rawWeights.SEPTIC_SHOCK += 0.8;
    rawWeights.ACUTE_KIDNEY_INJURY += 0.8;
    rawWeights.CARDIOGENIC_ISCHEMIA += 0.65;
    rawWeights.METABOLIC_ACIDEMIA += 0.7;
    rawWeights.HOMEOSTATIC_BASELINE *= 0.1;
  }

  // 4. Update weights from Ornstein-Uhlenbeck SDE Trajectory
  if (trajectory.predictedSyndromes.includes('SEPTIC_SHOCK_TRAJECTORY')) {
    rawWeights.SEPTIC_SHOCK += 1.8;
    rawWeights.HOMEOSTATIC_BASELINE *= 0.1;
  }
  if (trajectory.predictedSyndromes.includes('KDIGO_ACUTE_KIDNEY_INJURY')) {
    rawWeights.ACUTE_KIDNEY_INJURY += 1.8;
    rawWeights.HOMEOSTATIC_BASELINE *= 0.1;
  }
  if (trajectory.predictedSyndromes.includes('OVERT_DIC_COAGULOPATHY')) {
    rawWeights.DISSEMINATED_INTRAVASCULAR_COAGULATION += 1.9;
    rawWeights.SEPTIC_SHOCK += 0.7;
    rawWeights.HOMEOSTATIC_BASELINE *= 0.1;
  }

  // Normalize into a valid probability simplex P(D) where sum_i P(d_i) = 1.0
  const totalWeight = DIFFERENTIAL_STATES.reduce(
    (acc, state) => acc + rawWeights[state],
    0
  );

  const priorDistribution = {} as Record<DifferentialState, number>;
  const priorProbs: number[] = [];

  for (const state of DIFFERENTIAL_STATES) {
    const normalizedP =
      totalWeight > 1e-12
        ? rawWeights[state] / totalWeight
        : 1.0 / DIFFERENTIAL_STATES.length;
    priorDistribution[state] = Number(normalizedP.toFixed(5));
    priorProbs.push(normalizedP);
  }

  // Compute prior Shannon Entropy H(D) in bits
  const shannonEntropyBits = calculateShannonEntropyBits(priorProbs);
  const maxPossibleEntropyBits = Math.log2(DIFFERENTIAL_STATES.length);
  const normalizedUncertaintyRatio =
    maxPossibleEntropyBits > 0
      ? shannonEntropyBits / maxPossibleEntropyBits
      : 0.0;

  // Evaluate Mutual Information I(D; T_j) and Pareto Efficiency eta(T_j) for each reflex test
  const outcomes: readonly TestOutcomeState[] = [
    'POSITIVE_CRITICAL',
    'BORDERLINE_INDETERMINATE',
    'NEGATIVE_NORMAL',
  ];

  const rankedReflexCandidates: ReflexTestCandidate[] = REFLEX_TEST_CATALOG.map(
    (spec) => {
      let expectedPosteriorEntropyBits = 0.0;

      for (const y of outcomes) {
        // Marginal probability of outcome y: P(T_j = y) = sum_i P(d_i) * P(T_j = y | d_i)
        let marginalProbY = 0.0;
        for (const state of DIFFERENTIAL_STATES) {
          marginalProbY +=
            priorDistribution[state] * spec.likelihoodGivenState[state][y];
        }

        if (marginalProbY > 1e-12) {
          // Posterior distribution P(D = d_i | T_j = y) via Bayes' Rule
          const posteriorProbsGivenY: number[] = [];
          for (const state of DIFFERENTIAL_STATES) {
            const postP =
              (priorDistribution[state] * spec.likelihoodGivenState[state][y]) /
              marginalProbY;
            posteriorProbsGivenY.push(postP);
          }

          const conditionalEntropyGivenY =
            calculateShannonEntropyBits(posteriorProbsGivenY);
          expectedPosteriorEntropyBits +=
            marginalProbY * conditionalEntropyGivenY;
        }
      }

      // Mutual Information I(D; T_j) = H(D) - E_y[H(D | T_j = y)]
      const mutualInformationBits = Math.max(
        0.0,
        shannonEntropyBits - expectedPosteriorEntropyBits
      );

      // Multi-Objective Pareto Efficiency Index:
      // eta(T_j) = I(D; T_j) / (Cost_normalized(T_j) * ln(1 + TAT_hours(T_j)))
      const costFactor = Math.max(0.05, spec.normalizedCost);
      const tatLogFactor = Math.log(1.0 + Math.max(0.05, spec.tatHours));
      const denominator = Math.max(1e-6, costFactor * tatLogFactor);
      const paretoEfficiencyEta = mutualInformationBits / denominator;

      return {
        testCode: spec.testCode,
        testName: spec.testName,
        cptCode: spec.cptCode,
        normalizedCost: spec.normalizedCost,
        tatHours: spec.tatHours,
        mutualInformationBits: Number(mutualInformationBits.toFixed(5)),
        expectedPosteriorEntropyBits: Number(
          expectedPosteriorEntropyBits.toFixed(5)
        ),
        paretoEfficiencyEta: Number(paretoEfficiencyEta.toFixed(5)),
        clinicalRationale: spec.clinicalRationale,
      };
    }
  );

  // Sort descending by Pareto Efficiency Index eta(T_j)
  rankedReflexCandidates.sort(
    (a, b) => b.paretoEfficiencyEta - a.paretoEfficiencyEta
  );

  return {
    priorDistribution,
    shannonEntropyBits: Number(shannonEntropyBits.toFixed(5)),
    maxPossibleEntropyBits: Number(maxPossibleEntropyBits.toFixed(5)),
    normalizedUncertaintyRatio: Number(normalizedUncertaintyRatio.toFixed(4)),
    rankedReflexCandidates,
    optimalParetoTest: rankedReflexCandidates[0] ?? null,
  };
}
