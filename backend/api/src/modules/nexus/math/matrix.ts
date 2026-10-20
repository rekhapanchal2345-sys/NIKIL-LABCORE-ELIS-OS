// ==============================================================================
// FILE 2: backend/api/src/modules/nexus/math/matrix.ts
// FEATURE: High-Dimensional Riemannian Mahalanobis Manifold (D_M^2) Solver
// TARGET PLATFORM: NIKIL-LABCORE-ELIS-OS (Pure TypeScript 5.9, Zero External Math Libs)
// ==============================================================================

import { AnalyteCode, MahalanobisResult, TelemetryPoint } from '../types/index';

/**
 * Ordered 12-analyte basis spanning the core metabolic covariance manifold.
 */
export const MANIFOLD_ANALYTE_BASIS: readonly AnalyteCode[] = [
  'NA',
  'K',
  'CL',
  'HCO3',
  'BUN',
  'CREAT',
  'GLU',
  'CA',
  'MG',
  'PO4',
  'ALB',
  'LAC',
] as const;

/**
 * Population physiological means (mu) and standard deviations (sigma) for the
 * 12-dimensional metabolic basis in standard clinical units.
 */
export const PHYSIOLOGICAL_BASIS_PRIORS: Record<
  AnalyteCode,
  { mean: number; stdDev: number; refMin: number; refMax: number; unit: string }
> = {
  NA: { mean: 140.0, stdDev: 2.5, refMin: 135.0, refMax: 145.0, unit: 'mEq/L' },
  K: { mean: 4.2, stdDev: 0.35, refMin: 3.5, refMax: 5.1, unit: 'mEq/L' },
  CL: { mean: 102.0, stdDev: 2.5, refMin: 98.0, refMax: 107.0, unit: 'mEq/L' },
  HCO3: { mean: 24.0, stdDev: 2.0, refMin: 22.0, refMax: 28.0, unit: 'mEq/L' },
  BUN: { mean: 14.0, stdDev: 3.5, refMin: 7.0, refMax: 20.0, unit: 'mg/dL' },
  CREAT: { mean: 0.9, stdDev: 0.18, refMin: 0.6, refMax: 1.2, unit: 'mg/dL' },
  GLU: { mean: 90.0, stdDev: 10.0, refMin: 70.0, refMax: 105.0, unit: 'mg/dL' },
  CA: { mean: 9.4, stdDev: 0.4, refMin: 8.5, refMax: 10.2, unit: 'mg/dL' },
  MG: { mean: 2.0, stdDev: 0.18, refMin: 1.7, refMax: 2.3, unit: 'mg/dL' },
  PO4: { mean: 3.5, stdDev: 0.45, refMin: 2.5, refMax: 4.5, unit: 'mg/dL' },
  ALB: { mean: 4.2, stdDev: 0.35, refMin: 3.5, refMax: 5.0, unit: 'g/dL' },
  LAC: { mean: 1.0, stdDev: 0.35, refMin: 0.5, refMax: 2.0, unit: 'mmol/L' },
  ALP: { mean: 75.0, stdDev: 20.0, refMin: 40.0, refMax: 129.0, unit: 'IU/L' },
  PH: { mean: 7.4, stdDev: 0.025, refMin: 7.35, refMax: 7.45, unit: 'pH' },
  PCO2: { mean: 40.0, stdDev: 2.5, refMin: 35.0, refMax: 45.0, unit: 'mmHg' },
  WBC: { mean: 7.2, stdDev: 1.8, refMin: 4.0, refMax: 11.0, unit: '10^3/uL' },
  RBC: { mean: 4.8, stdDev: 0.4, refMin: 4.2, refMax: 5.8, unit: '10^6/uL' },
  HGB: { mean: 14.5, stdDev: 1.2, refMin: 12.5, refMax: 17.0, unit: 'g/dL' },
  PLT: { mean: 260.0, stdDev: 55.0, refMin: 150.0, refMax: 450.0, unit: '10^3/uL' },
};

/**
 * Standard physiological correlation matrix R in R^{12 x 12}.
 * Captures coupled biophysical invariants:
 * - Strong positive coupling between NA and CL (extracellular osmotic electroneutrality)
 * - Strong negative coupling between HCO3 and CL / LAC (reciprocating anion buffering)
 * - Strong positive coupling between BUN and CREAT (glomerular filtration clearance)
 * - Positive coupling between CA and ALB (Gibbs-Donnan protein-bound calcium equilibrium)
 * - Positive coupling between K, PO4, and CREAT (renal tubular excretion & intracellular shift)
 */
export const STANDARD_PHYSIOLOGICAL_CORRELATION_MATRIX_12X12: readonly (readonly number[])[] = [
  //   NA     K     CL   HCO3    BUN  CREAT    GLU     CA     MG    PO4    ALB    LAC
  [  1.00, -0.12,  0.76,  0.18,  0.15,  0.10, -0.22,  0.08,  0.05, -0.04,  0.14, -0.08 ], // NA
  [ -0.12,  1.00,  0.08, -0.38,  0.42,  0.48,  0.15, -0.10,  0.28,  0.44, -0.06,  0.32 ], // K
  [  0.76,  0.08,  1.00, -0.54,  0.12,  0.14, -0.18, -0.05,  0.02,  0.06, -0.12, -0.24 ], // CL
  [  0.18, -0.38, -0.54,  1.00, -0.34, -0.38, -0.14,  0.16,  0.08, -0.36,  0.20, -0.68 ], // HCO3
  [  0.15,  0.42,  0.12, -0.34,  1.00,  0.82,  0.18, -0.18,  0.24,  0.58, -0.22,  0.26 ], // BUN
  [  0.10,  0.48,  0.14, -0.38,  0.82,  1.00,  0.12, -0.24,  0.26,  0.64, -0.25,  0.30 ], // CREAT
  [ -0.22,  0.15, -0.18, -0.14,  0.18,  0.12,  1.00, -0.04, -0.12, -0.08, -0.05,  0.35 ], // GLU
  [  0.08, -0.10, -0.05,  0.16, -0.18, -0.24, -0.04,  1.00,  0.34, -0.42,  0.66, -0.18 ], // CA
  [  0.05,  0.28,  0.02,  0.08,  0.24,  0.26, -0.12,  0.34,  1.00,  0.22,  0.25, -0.10 ], // MG
  [ -0.04,  0.44,  0.06, -0.36,  0.58,  0.64, -0.08, -0.42,  0.22,  1.00, -0.16,  0.28 ], // PO4
  [  0.14, -0.06, -0.12,  0.20, -0.22, -0.25, -0.05,  0.66,  0.25, -0.16,  1.00, -0.32 ], // ALB
  [ -0.08,  0.32, -0.24, -0.68,  0.26,  0.30,  0.35, -0.18, -0.10,  0.28, -0.32,  1.00 ], // LAC
] as const;

/**
 * Computes the infinity-norm (maximum absolute row sum) of a square matrix.
 */
function matrixInfinityNorm(matrix: number[][]): number {
  let maxRowSum = 0;
  for (let i = 0; i < matrix.length; i++) {
    let rowSum = 0;
    for (let j = 0; j < matrix[i].length; j++) {
      const val = matrix[i][j];
      if (Number.isFinite(val)) {
        rowSum += Math.abs(val);
      }
    }
    if (rowSum > maxRowSum) {
      maxRowSum = rowSum;
    }
  }
  return maxRowSum;
}

/**
 * Inverts a square matrix in R^{n x n} via Gauss-Jordan elimination with partial pivoting
 * and Tikhonov ridge regularization (Sigma_reg = Sigma + epsilon * I).
 *
 * @param matrix Input covariance matrix Sigma in R^{n x n}
 * @param epsilon Tikhonov ridge regularization parameter (default 1e-6)
 * @returns Inverted matrix Sigma_reg^{-1} and estimated condition number
 */
export function invertMatrixGaussJordan(
  matrix: number[][],
  epsilon: number = 1e-6
): { inverse: number[][]; conditionNumberEstimate: number } {
  const n = matrix.length;
  if (n === 0) {
    throw new Error('Cannot invert an empty matrix.');
  }

  // Construct regularized matrix Sigma_reg = Sigma + epsilon * I
  const regMatrix: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => {
      const raw = Number.isFinite(matrix[i]?.[j]) ? matrix[i][j] : 0;
      return i === j ? raw + epsilon : raw;
    })
  );

  const normOriginal = matrixInfinityNorm(regMatrix);

  // Build augmented matrix [Sigma_reg | I_n] in R^{n x 2n}
  const aug: number[][] = Array.from({ length: n }, (_, i) => {
    const row = new Array<number>(2 * n).fill(0);
    for (let j = 0; j < n; j++) {
      row[j] = regMatrix[i][j];
    }
    row[n + i] = 1.0;
    return row;
  });

  // Forward & backward elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot row with maximum absolute value in current column
    let pivotRow = col;
    let maxAbs = Math.abs(aug[col][col]);
    for (let row = col + 1; row < n; row++) {
      const candidateAbs = Math.abs(aug[row][col]);
      if (candidateAbs > maxAbs) {
        maxAbs = candidateAbs;
        pivotRow = row;
      }
    }

    // Guard against near-singular pivot even after Tikhonov regularization
    if (maxAbs < 1e-14) {
      aug[col][col] = epsilon > 0 ? epsilon : 1e-6;
      pivotRow = col;
    }

    // Swap rows if a better pivot was found
    if (pivotRow !== col) {
      const temp = aug[col];
      aug[col] = aug[pivotRow];
      aug[pivotRow] = temp;
    }

    // Normalize pivot row so aug[col][col] == 1
    const pivotVal = aug[col][col];
    for (let j = 0; j < 2 * n; j++) {
      aug[col][j] /= pivotVal;
    }

    // Eliminate all other entries in current column (rows != col)
    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = aug[row][col];
        if (Math.abs(factor) > 1e-16) {
          for (let j = 0; j < 2 * n; j++) {
            aug[row][j] -= factor * aug[col][j];
          }
        }
      }
    }
  }

  // Extract right-hand block as Sigma_reg^{-1}
  const inverse: number[][] = Array.from({ length: n }, (_, i) =>
    aug[i].slice(n, 2 * n)
  );

  const normInverse = matrixInfinityNorm(inverse);
  const conditionNumberEstimate = Math.max(1.0, normOriginal * normInverse);

  return { inverse, conditionNumberEstimate };
}

/**
 * Standard normal cumulative distribution function Phi(z) using Abramowitz & Stegun
 * formula 7.1.26 (maximum absolute error < 1.5e-7).
 */
export function standardNormalCdf(z: number): number {
  if (!Number.isFinite(z)) return 0.5;
  if (z < -8.0) return 0.0;
  if (z > 8.0) return 1.0;

  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;

  // Abramowitz & Stegun constants
  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const t = 1.0 / (1.0 + p * x);
  const poly =
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t;
  const erfApprox = sign * (1.0 - poly * Math.exp(-x * x));

  return 0.5 * (1.0 + erfApprox);
}

/**
 * Wilson-Hilferty transformation for Chi-Square cumulative distribution and p-value.
 * Transforms X ~ Chi^2(nu) into an approximately standard normal variate Z_WH:
 *   Z_WH = ((X / nu)^(1/3) - (1 - 2 / (9 * nu))) / sqrt(2 / (9 * nu))
 *
 * @param chiSquareValue Squared Mahalanobis distance D_M^2
 * @param degreesOfFreedom Dimension n of the physiological manifold
 */
export function wilsonHilfertyChiSquarePValue(
  chiSquareValue: number,
  degreesOfFreedom: number
): { pValue: number; wilsonHilfertyZ: number; chiSquareCritical001: number } {
  const nu = Math.max(1, degreesOfFreedom);
  const safeChiSq = Math.max(0, Number.isFinite(chiSquareValue) ? chiSquareValue : 0);

  const varianceTerm = 2.0 / (9.0 * nu);
  const meanTerm = 1.0 - varianceTerm;
  const cubeRootRatio = Math.cbrt(safeChiSq / nu);

  const wilsonHilfertyZ = (cubeRootRatio - meanTerm) / Math.sqrt(varianceTerm);
  const cdf = standardNormalCdf(wilsonHilfertyZ);
  const pValue = Math.max(0.0, Math.min(1.0, 1.0 - cdf));

  // Inverse Wilson-Hilferty for alpha = 0.001 (one-tailed Z_0.999 = 3.0902323)
  const zAlpha001 = 3.090232306167813;
  const criticalCube = meanTerm + zAlpha001 * Math.sqrt(varianceTerm);
  const chiSquareCritical001 = nu * Math.pow(criticalCube, 3);

  return {
    pValue,
    wilsonHilfertyZ,
    chiSquareCritical001,
  };
}

/**
 * Computes the High-Dimensional Riemannian Mahalanobis Distance D_M^2(x)
 * across the coupled physiological covariance manifold:
 *   D_M^2(x) = (x - mu)^T * (Sigma + epsilon * I)^{-1} * (x - mu)
 */
export function computeRiemannianMahalanobis(
  telemetryPoints: TelemetryPoint[],
  epsilon: number = 1e-6
): MahalanobisResult {
  const pointMap = new Map<AnalyteCode, TelemetryPoint>();
  for (const pt of telemetryPoints) {
    if (Number.isFinite(pt.value)) {
      pointMap.set(pt.analyte, pt);
    }
  }

  // Filter basis to analytes present in the specimen (or project onto the full 12-analyte manifold)
  const activeIndices: number[] = [];
  const activeAnalytes: AnalyteCode[] = [];

  for (let idx = 0; idx < MANIFOLD_ANALYTE_BASIS.length; idx++) {
    const code = MANIFOLD_ANALYTE_BASIS[idx];
    if (pointMap.has(code)) {
      activeIndices.push(idx);
      activeAnalytes.push(code);
    }
  }

  // If fewer than 2 basis analytes were provided, fill missing basis dimensions at homeostatic mean (delta = 0)
  const useFullBasis = activeIndices.length < 2;
  const indicesToUse = useFullBasis
    ? MANIFOLD_ANALYTE_BASIS.map((_, i) => i)
    : activeIndices;
  const n = indicesToUse.length;

  // Build residual vector delta = (x - mu) and standard deviation vector sigma
  const deltaVector: number[] = new Array<number>(n).fill(0);
  const sigmaVector: number[] = new Array<number>(n).fill(1);
  let univariateNormalsCount = 0;

  for (let i = 0; i < n; i++) {
    const basisIdx = indicesToUse[i];
    const code = MANIFOLD_ANALYTE_BASIS[basisIdx];
    const prior = PHYSIOLOGICAL_BASIS_PRIORS[code];
    const observedPoint = pointMap.get(code);

    const mu = observedPoint?.mean ?? prior.mean;
    const sigma =
      observedPoint?.stdDev && observedPoint.stdDev > 1e-6
        ? observedPoint.stdDev
        : prior.stdDev;
    const xVal = observedPoint ? observedPoint.value : mu;

    deltaVector[i] = xVal - mu;
    sigmaVector[i] = sigma;

    const refMin = observedPoint?.referenceMin ?? prior.refMin;
    const refMax = observedPoint?.referenceMax ?? prior.refMax;
    if (xVal >= refMin && xVal <= refMax) {
      univariateNormalsCount++;
    }
  }

  // Construct covariance matrix Sigma_ij = sigma_i * sigma_j * R_ij
  const covarianceMatrix: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => {
      const r_ij =
        STANDARD_PHYSIOLOGICAL_CORRELATION_MATRIX_12X12[indicesToUse[i]][
          indicesToUse[j]
        ];
      return sigmaVector[i] * sigmaVector[j] * r_ij;
    })
  );

  // Invert regularized covariance matrix via Gauss-Jordan with partial pivoting
  const { inverse: precisionMatrix, conditionNumberEstimate } =
    invertMatrixGaussJordan(covarianceMatrix, epsilon);

  // Compute quadratic form D_M^2 = (x - mu)^T * Sigma_reg^{-1} * (x - mu)
  let dSquared = 0.0;
  const dominantEigenContributors: Array<{
    analyte: AnalyteCode;
    zScore: number;
    mahalanobisContribution: number;
  }> = [];

  for (let i = 0; i < n; i++) {
    let innerProductRow = 0.0;
    for (let j = 0; j < n; j++) {
      innerProductRow += precisionMatrix[i][j] * deltaVector[j];
    }
    const termContribution = deltaVector[i] * innerProductRow;
    dSquared += termContribution;

    const code = MANIFOLD_ANALYTE_BASIS[indicesToUse[i]];
    const zScore = deltaVector[i] / sigmaVector[i];
    dominantEigenContributors.push({
      analyte: code,
      zScore: Number(zScore.toFixed(4)),
      mahalanobisContribution: Number(Math.abs(termContribution).toFixed(4)),
    });
  }

  dSquared = Math.max(0.0, dSquared);
  dominantEigenContributors.sort(
    (a, b) => b.mahalanobisContribution - a.mahalanobisContribution
  );

  // Evaluate Chi-Square tail probability via Wilson-Hilferty approximation
  const { pValue, wilsonHilfertyZ, chiSquareCritical001 } =
    wilsonHilfertyChiSquarePValue(dSquared, n);

  const univariateNormalFraction = n > 0 ? univariateNormalsCount / n : 1.0;
  let pathologyDiscordanceFlag: MahalanobisResult['pathologyDiscordanceFlag'] =
    'EUHOMEOSTATIC_MANIFOLD';

  if (dSquared > chiSquareCritical001) {
    if (univariateNormalFraction >= 0.7) {
      pathologyDiscordanceFlag = 'HIGH_PATHOLOGY_DISCORDANCE';
    } else {
      pathologyDiscordanceFlag = 'CONCORDANT_EXTREME_PATHOLOGY';
    }
  }

  return {
    dSquared: Number(dSquared.toFixed(4)),
    degreesOfFreedom: n,
    chiSquareCritical001: Number(chiSquareCritical001.toFixed(4)),
    pValue: Number(pValue.toExponential(6)),
    wilsonHilfertyZ: Number(wilsonHilfertyZ.toFixed(4)),
    regularizationEpsilon: epsilon,
    conditionNumberEstimate: Number(conditionNumberEstimate.toFixed(2)),
    univariateNormalsCount,
    totalEvaluatedAnalytes: n,
    pathologyDiscordanceFlag,
    dominantEigenContributors: dominantEigenContributors.slice(0, 5),
  };
}
