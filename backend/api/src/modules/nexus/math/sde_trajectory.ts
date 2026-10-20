// ==============================================================================
// FILE 5: backend/api/src/modules/nexus/math/sde_trajectory.ts
// FEATURE: Stochastic Trajectory Dynamics via Ornstein-Uhlenbeck SDE
// TARGET PLATFORM: NIKIL-LABCORE-ELIS-OS (Pure TypeScript 5.9)
// ==============================================================================

import {
  AnalyteCode,
  AnalyteKinematics,
  TimeSeriesTelemetry,
  TrajectoryResult,
} from '../types/index';
import { PHYSIOLOGICAL_BASIS_PRIORS } from './matrix';

/**
 * Critical life-threatening physiological barrier thresholds used to calculate
 * the acute decompensation horizon (in hours) when Lyapunov divergence is positive.
 */
const CRITICAL_DECOMPENSATION_BARRIERS: Partial<
  Record<AnalyteCode, { lower?: number; upper?: number }>
> = {
  LAC: { upper: 4.0 }, // Sepsis-3 septic shock lactate threshold (4.0 mmol/L)
  CREAT: { upper: 3.0 }, // KDIGO Stage 3 Acute Kidney Injury threshold (3.0 mg/dL)
  PLT: { lower: 50.0 }, // ISTH overt DIC severe thrombocytopenia threshold (50 x 10^3/uL)
  K: { lower: 2.5, upper: 6.5 }, // Lethal arrhythmia barrier
  NA: { lower: 120.0, upper: 160.0 }, // Osmotic encephalopathy barrier
  PH: { lower: 7.15, upper: 7.60 }, // Acidemic/alkalemic cardiovascular collapse barrier
  HCO3: { lower: 10.0 }, // Severe metabolic acidemia barrier
  WBC: { lower: 1.5, upper: 25.0 }, // Systemic leukopenia / leukemoid sepsis barrier
};

/**
 * Models homeostatic stability via the Ornstein-Uhlenbeck Stochastic Differential Equation:
 *   dX_t = theta * (mu - X_t) * dt + sigma * dW_t
 *
 * Across 3 longitudinal points (t_-48h, t_-24h, t_0), computes:
 * - First-order velocity tensor: v_i = dX_i / dt
 * - Second-order acceleration tensor: a_i = d^2 X_i / dt^2
 * - Finite difference numerical estimate of mean-reversion rate theta
 * - Maximum Lyapunov Exponent lambda_L measuring exponential trajectory divergence
 * - Acute decompensation horizon in hours when lambda_L > 0 and theta -> 0
 */
export function computeOrnsteinUhlenbeckTrajectory(
  series: TimeSeriesTelemetry
): TrajectoryResult {
  // Parse time intervals in hours (defaulting to 24h spacing if timestamps are invalid/equal)
  const t48Ms = Date.parse(series.timestamps.tMinus48h);
  const t24Ms = Date.parse(series.timestamps.tMinus24h);
  const t0Ms = Date.parse(series.timestamps.tZero);

  const dt1Hours =
    Number.isFinite(t48Ms) && Number.isFinite(t24Ms) && t24Ms > t48Ms
      ? (t24Ms - t48Ms) / (1000 * 3600)
      : 24.0;
  const dt2Hours =
    Number.isFinite(t24Ms) && Number.isFinite(t0Ms) && t0Ms > t24Ms
      ? (t0Ms - t24Ms) / (1000 * 3600)
      : 24.0;

  const kinematicsTensor: AnalyteKinematics[] = [];
  const allCandidateCodes = Object.keys(
    PHYSIOLOGICAL_BASIS_PRIORS
  ) as AnalyteCode[];

  let maxLyapunovExponentLambdaL = -Infinity;
  const thetaEstimates: number[] = [];
  let minDecompensationHorizonHours: number | null = null;

  for (const code of allCandidateCodes) {
    const x48 = series.tMinus48h[code];
    const x24 = series.tMinus24h[code];
    const x0 = series.tZero[code];

    if (
      x48 === undefined ||
      x24 === undefined ||
      x0 === undefined ||
      !Number.isFinite(x48) ||
      !Number.isFinite(x24) ||
      !Number.isFinite(x0)
    ) {
      continue;
    }

    const prior = PHYSIOLOGICAL_BASIS_PRIORS[code];
    const mu = prior.mean;

    // First-order velocity v_i = dX_i / dt over [t_-24h, t_0] and [t_-48h, t_-24h]
    const v1 = (x24 - x48) / Math.max(1e-3, dt1Hours);
    const v2 = (x0 - x24) / Math.max(1e-3, dt2Hours);

    // Second-order acceleration a_i = d^2 X_i / dt^2 via finite difference
    const meanDt = 0.5 * (dt1Hours + dt2Hours);
    const accelerationPerHourSq = (v2 - v1) / Math.max(1e-3, meanDt);

    // Ornstein-Uhlenbeck drift relation: E[dX_t / dt] = theta * (mu - X_t)
    // Finite difference estimate of mean-reversion rate theta_i:
    const dev48 = mu - x48;
    const dev24 = mu - x24;
    const dev0 = mu - x0;

    // Least-squares finite-difference estimator of theta across the two transitions
    const numTheta = dev48 * v1 + dev24 * v2;
    const denTheta = dev48 * dev48 + dev24 * dev24;
    const rawTheta =
      denTheta > 1e-6 ? numTheta / denTheta : 0.0;
    // Clamp theta to [-1, 1] h^-1; positive theta = homeostatic mean reversion, <= 0 = loss of reversion
    const meanReversionTheta = Math.max(-1.0, Math.min(1.0, rawTheta));
    thetaEstimates.push(meanReversionTheta);

    // Local Lyapunov Exponent lambda_i = (1 / dt) * ln(|X_0 - mu| / |X_-24h - mu|)
    // Quantifies rate of exponential divergence from the homeostatic attractor mu
    const absDev24 = Math.max(1e-4 * prior.stdDev, Math.abs(dev24));
    const absDev0 = Math.max(1e-4 * prior.stdDev, Math.abs(dev0));
    const localLyapunovExponent =
      Math.log(absDev0 / absDev24) / Math.max(1e-3, dt2Hours);

    if (localLyapunovExponent > maxLyapunovExponentLambdaL) {
      maxLyapunovExponentLambdaL = localLyapunovExponent;
    }

    // Empirical Ito diffusion volatility sigma from SDE residual: dX - theta*(mu - X)*dt
    const residual1 = x24 - x48 - meanReversionTheta * dev48 * dt1Hours;
    const residual2 = x0 - x24 - meanReversionTheta * dev24 * dt2Hours;
    const diffusionVolatilitySigma = Math.sqrt(
      (residual1 * residual1 / dt1Hours + residual2 * residual2 / dt2Hours) * 0.5
    );

    // Estimate hours to critical decompensation barrier when trajectory is diverging
    let estimatedHoursToCriticalBarrier: number | null = null;
    const barrier = CRITICAL_DECOMPENSATION_BARRIERS[code];

    if (barrier) {
      // Check upper critical barrier
      if (barrier.upper !== undefined && v2 > 1e-5) {
        const remainingDistance = barrier.upper - x0;
        if (remainingDistance <= 0) {
          estimatedHoursToCriticalBarrier = 0.0;
        } else if (accelerationPerHourSq > 1e-6) {
          // Solve 0.5 * a * t^2 + v * t - remainingDistance = 0
          const discriminant =
            v2 * v2 + 2.0 * accelerationPerHourSq * remainingDistance;
          estimatedHoursToCriticalBarrier =
            (-v2 + Math.sqrt(Math.max(0, discriminant))) /
            accelerationPerHourSq;
        } else {
          estimatedHoursToCriticalBarrier = remainingDistance / v2;
        }
      }

      // Check lower critical barrier
      if (barrier.lower !== undefined && v2 < -1e-5) {
        const remainingDistance = x0 - barrier.lower;
        if (remainingDistance <= 0) {
          estimatedHoursToCriticalBarrier = 0.0;
        } else if (accelerationPerHourSq < -1e-6) {
          const absA = Math.abs(accelerationPerHourSq);
          const absV = Math.abs(v2);
          const discriminant = absV * absV + 2.0 * absA * remainingDistance;
          const tLower = (-absV + Math.sqrt(Math.max(0, discriminant))) / absA;
          estimatedHoursToCriticalBarrier =
            estimatedHoursToCriticalBarrier !== null
              ? Math.min(estimatedHoursToCriticalBarrier, tLower)
              : tLower;
        } else {
          const tLower = remainingDistance / Math.abs(v2);
          estimatedHoursToCriticalBarrier =
            estimatedHoursToCriticalBarrier !== null
              ? Math.min(estimatedHoursToCriticalBarrier, tLower)
              : tLower;
        }
      }
    }

    if (
      estimatedHoursToCriticalBarrier !== null &&
      estimatedHoursToCriticalBarrier >= 0 &&
      estimatedHoursToCriticalBarrier <= 168
    ) {
      estimatedHoursToCriticalBarrier = Number(
        estimatedHoursToCriticalBarrier.toFixed(2)
      );
      if (
        localLyapunovExponent > 0 &&
        meanReversionTheta <= 0.02 &&
        (minDecompensationHorizonHours === null ||
          estimatedHoursToCriticalBarrier < minDecompensationHorizonHours)
      ) {
        minDecompensationHorizonHours = estimatedHoursToCriticalBarrier;
      }
    } else {
      estimatedHoursToCriticalBarrier = null;
    }

    kinematicsTensor.push({
      analyte: code,
      xMinus48h: x48,
      xMinus24h: x24,
      xZero: x0,
      homeostaticMeanMu: mu,
      velocityPerHour: Number(v2.toFixed(5)),
      accelerationPerHourSq: Number(accelerationPerHourSq.toFixed(6)),
      meanReversionTheta: Number(meanReversionTheta.toFixed(5)),
      localLyapunovExponent: Number(localLyapunovExponent.toFixed(5)),
      diffusionVolatilitySigma: Number(diffusionVolatilitySigma.toFixed(4)),
      estimatedHoursToCriticalBarrier,
    });
  }

  if (!Number.isFinite(maxLyapunovExponentLambdaL)) {
    maxLyapunovExponentLambdaL = 0.0;
  }

  const systemicMeanReversionTheta =
    thetaEstimates.length > 0
      ? thetaEstimates.reduce((a, b) => a + b, 0) / thetaEstimates.length
      : 0.05;

  // Chaotic decompensation occurs when lambda_L > 0 and theta -> 0 (<= 0.02)
  const isChaoticDecompensation =
    maxLyapunovExponentLambdaL > 0.0 && systemicMeanReversionTheta <= 0.02;

  // If chaotic decompensation is active but no single barrier crossing was below 168h,
  // compute characteristic Lyapunov e-folding horizon (1 / lambda_L)
  const acuteDecompensationHorizonHours = isChaoticDecompensation
    ? minDecompensationHorizonHours !== null
      ? minDecompensationHorizonHours
      : Number(
          Math.min(72.0, 1.0 / Math.max(0.01, maxLyapunovExponentLambdaL)).toFixed(
            2
          )
        )
    : null;

  // Syndrome trajectory recognition (Sepsis-3, KDIGO 2024, ISTH DIC)
  const predictedSyndromes: TrajectoryResult['predictedSyndromes'] = [];

  const lacKin = kinematicsTensor.find((k) => k.analyte === 'LAC');
  const wbcKin = kinematicsTensor.find((k) => k.analyte === 'WBC');
  if (
    (lacKin && lacKin.xZero >= 2.0 && lacKin.velocityPerHour > 0) ||
    (lacKin &&
      wbcKin &&
      lacKin.localLyapunovExponent > 0.01 &&
      wbcKin.localLyapunovExponent > 0.01)
  ) {
    predictedSyndromes.push('SEPTIC_SHOCK_TRAJECTORY');
  }

  const creatKin = kinematicsTensor.find((k) => k.analyte === 'CREAT');
  if (
    creatKin &&
    (creatKin.xZero - creatKin.xMinus48h >= 0.3 ||
      creatKin.xZero / Math.max(0.2, creatKin.xMinus48h) >= 1.5)
  ) {
    predictedSyndromes.push('KDIGO_ACUTE_KIDNEY_INJURY');
  }

  const pltKin = kinematicsTensor.find((k) => k.analyte === 'PLT');
  if (
    pltKin &&
    (pltKin.xZero < 100 ||
      (pltKin.xMinus48h - pltKin.xZero) / Math.max(1, pltKin.xMinus48h) >= 0.3)
  ) {
    predictedSyndromes.push('OVERT_DIC_COAGULOPATHY');
  }

  if (predictedSyndromes.length === 0) {
    predictedSyndromes.push('HEMODYNAMIC_STABILITY');
  }

  return {
    kinematicsTensor,
    systemicMeanReversionTheta: Number(systemicMeanReversionTheta.toFixed(5)),
    maxLyapunovExponentLambdaL: Number(maxLyapunovExponentLambdaL.toFixed(5)),
    isChaoticDecompensation,
    acuteDecompensationHorizonHours,
    predictedSyndromes,
  };
}
