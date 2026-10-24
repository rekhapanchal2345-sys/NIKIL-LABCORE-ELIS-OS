/**
 * NIKIL-LABCORE-ELIS-OS // OMNISCIENT NEXUS
 * Module: virtualAnalyzerMath.ts
 * Pure Mathematical, Biophysical & Clinical Metrology Engines
 */

export type AnalyzerId = 'ROCHE_COBAS_C503' | 'SYSMEX_XN_1000' | 'ABBOTT_ARCHITECT_I2000SR';

export type AnalyzerDepartment = 'CLINICAL_CHEMISTRY' | 'HEMATOLOGY_5PART' | 'IMMUNOASSAY_CMIA';

export type WestgardRuleCode =
  | 'NOMINAL'
  | '1_2s_WARNING'
  | '1_3s_RANDOM_REJECT'
  | '2_2s_SYSTEMATIC_LOCK'
  | 'R_4s_RANGE_REJECT'
  | '4_1s_DRIFT_LOCK'
  | '10_x_BIAS_LOCK';

export type HardwareLockState =
  | 'OPERATIONAL_NOMINAL'
  | 'QC_WARNING_1_2S'
  | 'LOCKED_WESTGARD_VIOLATION'
  | 'PROBE_CLOT_RECOVERY_WASH'
  | 'THERMAL_ARRHENIUS_ALARM';

export interface HilIndices {
  hemolysisMgDl: number; // Normal < 20 mg/dL Free Hemoglobin
  icterusMgDl: number;   // Normal < 2.0 mg/dL Bilirubin
  lipemiaIndex: number;  // Normal < 50 Intralipid Turbidity Index
}

export interface ClsiEp07ParameterProfile {
  code: string;
  hemolysisLimitMgDl: number;
  icterusLimitMgDl: number;
  lipemiaLimitIndex: number;
  // Fractional bias per unit of interferent: Delta(%) = kH*H + kI*I + kL*L
  kHemolysisPctPerMgDl: number;
  kIcterusPctPerMgDl: number;
  kLipemiaPctPerIndex: number;
}

export interface HilInterferenceEvaluation {
  trueValue: number;
  observedValue: number;
  spectralBiasPct: number;
  gatedRejected: boolean;
  violatedInterferents: Array<'HEMOLYSIS' | 'ICTERUS' | 'LIPEMIA'>;
  clsiAnnotation: string;
}

export interface WestgardEvaluation {
  latestZScore: number;
  zScoreHistory: number[];
  violatedRule: WestgardRuleCode;
  lockState: HardwareLockState;
  isLocked: boolean;
  clinicalInterpretation: string;
}

export interface BullsAlgorithmState {
  batchSizeN: number;
  currentBatchValues: number[];
  historicalBatchesXb: number[];
  targetMean: number;
  latestXb: number;
  driftPct: number;
  outOfBounds: boolean;
}

export interface ArrheniusStabilityMetrics {
  temperatureCelsius: number;
  temperatureKelvin: number;
  rateConstantK: number;
  accelerationFactorVs4C: number;
  remainingShelfLifeHours: number;
  nominalShelfLifeHoursAt4C: number;
  coldChainBreached: boolean;
  degradationCurvePoints: Array<{ hour: number; potencyPct: number }>;
}

export interface WeibullWearMetrics {
  cyclesExecuted: number;
  shapeBeta: number;
  scaleEtaCycles: number;
  instantaneousHazardRate: number;
  survivalProbabilityPct: number;
  maintenanceRequired: boolean;
}

export interface ScattergramPoint {
  id: string;
  fsc: number; // Forward Scatter (Cell Size: 0 - 250)
  ssc: number; // Side Scatter / Fluorescence (Internal Complexity/RNA: 0 - 250)
  population: 'NEUT' | 'LYMPH' | 'MONO' | 'EO' | 'BASO' | 'DEBRIS';
  colorHex: string;
}

// Control character constants for ASTM E1381 / HL7 MLLP
export const CTRL_BYTES = {
  STX: 0x02,
  ETX: 0x03,
  EOT: 0x04,
  ENQ: 0x05,
  ACK: 0x06,
  LF: 0x0a,
  VT: 0x0b,
  CR: 0x0d,
  NAK: 0x15,
  ETB: 0x17,
  FS: 0x1c,
} as const;

/**
 * ASTM E1381 Modulo-256 Checksum Engine
 * Computes the 8-bit sum of all characters after <STX> (0x02) up to and including <ETX> (0x03) or <ETB> (0x17),
 * keeping the least significant 8 bits and formatting as a 2-character uppercase hexadecimal string.
 */
export function calculateAstmChecksum(frameBodyWithFrameNumber: string, includeEtx = true): string {
  let sum = 0;
  for (let i = 0; i < frameBodyWithFrameNumber.length; i += 1) {
    sum = (sum + frameBodyWithFrameNumber.charCodeAt(i)) & 0xff;
  }
  if (includeEtx) {
    sum = (sum + CTRL_BYTES.CR + CTRL_BYTES.ETX) & 0xff;
  }
  return sum.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * Verifies an incoming raw ASTM frame containing <STX>...<CR><ETX>[CS1][CS2]<CR><LF>
 */
export function verifyAstmChecksum(
  frameBodyWithFrameNumber: string,
  transmittedChecksumHex: string
): { valid: boolean; expected: string; actual: string } {
  const expected = calculateAstmChecksum(frameBodyWithFrameNumber, true);
  const actual = transmittedChecksumHex.trim().toUpperCase();
  return {
    valid: expected === actual,
    expected,
    actual,
  };
}

/**
 * Westgard Multi-Rule QC Evaluation Matrix
 * Evaluates a chronological series of QC measurements against:
 * 1_3s (Random Error), 2_2s (Systematic Error), R_4s (Range Error), 4_1s, 10_x, and 1_2s (Warning)
 */
export function evaluateWestgardMultiRules(
  values: number[],
  targetMean: number,
  targetSd: number
): WestgardEvaluation {
  const safeSd = targetSd <= 0 ? 1 : targetSd;
  const zScores = values.map((v) => Number(((v - targetMean) / safeSd).toFixed(2)));
  const len = zScores.length;

  if (len === 0) {
    return {
      latestZScore: 0,
      zScoreHistory: [],
      violatedRule: 'NOMINAL',
      lockState: 'OPERATIONAL_NOMINAL',
      isLocked: false,
      clinicalInterpretation: 'QC baseline nominal. Within +/- 2SD analytical bounds.',
    };
  }

  const z0 = zScores[len - 1];
  const z1 = len >= 2 ? zScores[len - 2] : 0;

  // 1. Rule 1_3s: Single control observation exceeds +/- 3SD (Random Imprecision Reject)
  if (Math.abs(z0) > 3.0) {
    return {
      latestZScore: z0,
      zScoreHistory: zScores,
      violatedRule: '1_3s_RANDOM_REJECT',
      lockState: 'LOCKED_WESTGARD_VIOLATION',
      isLocked: true,
      clinicalInterpretation: `CRITICAL 1_3s VIOLATION (Z = ${z0 > 0 ? '+' : ''}${z0} SD): Severe random analytical error detected. Hardware sample aspiration locked.`,
    };
  }

  // 2. Rule 2_2s: Two consecutive control observations exceed the same +2SD or -2SD limit (Systematic Bias Lock)
  if (len >= 2 && ((z0 > 2.0 && z1 > 2.0) || (z0 < -2.0 && z1 < -2.0))) {
    return {
      latestZScore: z0,
      zScoreHistory: zScores,
      violatedRule: '2_2s_SYSTEMATIC_LOCK',
      lockState: 'LOCKED_WESTGARD_VIOLATION',
      isLocked: true,
      clinicalInterpretation: `CRITICAL 2_2s VIOLATION (Z = ${z1} SD, ${z0} SD): Persistent systematic calibration drift detected. Analyzer locked.`,
    };
  }

  // 3. Rule R_4s: One observation exceeds +2SD and the immediate previous exceeds -2SD (or vice versa) with range >= 4SD
  if (len >= 2 && ((z0 > 2.0 && z1 < -2.0) || (z0 < -2.0 && z1 > 2.0)) && Math.abs(z0 - z1) >= 4.0) {
    return {
      latestZScore: z0,
      zScoreHistory: zScores,
      violatedRule: 'R_4s_RANGE_REJECT',
      lockState: 'LOCKED_WESTGARD_VIOLATION',
      isLocked: true,
      clinicalInterpretation: `CRITICAL R_4s VIOLATION (Delta Z = ${Math.abs(z0 - z1).toFixed(2)} SD): Extreme within-run random dispersion. Analyzer locked.`,
    };
  }

  // 4. Rule 4_1s: Four consecutive observations exceed the same +1SD or -1SD limit
  if (len >= 4) {
    const last4 = zScores.slice(len - 4);
    const allAbove1s = last4.every((z) => z > 1.0);
    const allBelowNeg1s = last4.every((z) => z < -1.0);
    if (allAbove1s || allBelowNeg1s) {
      return {
        latestZScore: z0,
        zScoreHistory: zScores,
        violatedRule: '4_1s_DRIFT_LOCK',
        lockState: 'LOCKED_WESTGARD_VIOLATION',
        isLocked: true,
        clinicalInterpretation: `CRITICAL 4_1s VIOLATION: Progressive calibration shift > 1SD across 4 consecutive runs. Recalibration required.`,
      };
    }
  }

  // 5. Rule 10_x: Ten consecutive observations fall on one side of the mean
  if (len >= 10) {
    const last10 = zScores.slice(len - 10);
    const allPositive = last10.every((z) => z > 0);
    const allNegative = last10.every((z) => z < 0);
    if (allPositive || allNegative) {
      return {
        latestZScore: z0,
        zScoreHistory: zScores,
        violatedRule: '10_x_BIAS_LOCK',
        lockState: 'LOCKED_WESTGARD_VIOLATION',
        isLocked: true,
        clinicalInterpretation: `CRITICAL 10_x VIOLATION: 10 consecutive QC points on one side of target mean. Reagent lot bias lock engaged.`,
      };
    }
  }

  // 6. Rule 1_2s: Warning rule (2.0 < |Z| <= 3.0)
  if (Math.abs(z0) > 2.0) {
    return {
      latestZScore: z0,
      zScoreHistory: zScores,
      violatedRule: '1_2s_WARNING',
      lockState: 'QC_WARNING_1_2S',
      isLocked: false,
      clinicalInterpretation: `WESTGARD 1_2s WARNING (Z = ${z0 > 0 ? '+' : ''}${z0} SD): Inspect consecutive run for 2_2s or R_4s cascade.`,
    };
  }

  return {
    latestZScore: z0,
    zScoreHistory: zScores,
    violatedRule: 'NOMINAL',
    lockState: 'OPERATIONAL_NOMINAL',
    isLocked: false,
    clinicalInterpretation: `Westgard QC Pass (Z = ${z0 > 0 ? '+' : ''}${z0} SD). Analytical precision verified.`,
  };
}

/**
 * CLSI EP07 3rd Edition HIL Spectral & Chemical Interference Calculator
 * Models intracellular release (e.g., K+, AST, LDH in hemolysis), spectral absorbance overlap
 * at 340nm-600nm (icterus), and volume displacement / light scatter (lipemia).
 */
export function calculateClsiEp07HilBias(
  trueValue: number,
  hil: HilIndices,
  profile: ClsiEp07ParameterProfile,
  decimals = 2
): HilInterferenceEvaluation {
  const violatedInterferents: Array<'HEMOLYSIS' | 'ICTERUS' | 'LIPEMIA'> = [];

  if (hil.hemolysisMgDl > profile.hemolysisLimitMgDl) {
    violatedInterferents.push('HEMOLYSIS');
  }
  if (hil.icterusMgDl > profile.icterusLimitMgDl) {
    violatedInterferents.push('ICTERUS');
  }
  if (hil.lipemiaIndex > profile.lipemiaLimitIndex) {
    violatedInterferents.push('LIPEMIA');
  }

  const effectiveH = Math.max(0, hil.hemolysisMgDl - 10);
  const effectiveI = Math.max(0, hil.icterusMgDl - 1.0);
  const effectiveL = Math.max(0, hil.lipemiaIndex - 25);

  const spectralBiasPct = Number(
    (
      effectiveH * profile.kHemolysisPctPerMgDl +
      effectiveI * profile.kIcterusPctPerMgDl +
      effectiveL * profile.kLipemiaPctPerIndex
    ).toFixed(2)
  );

  const rawObserved = trueValue * (1 + spectralBiasPct / 100);
  const observedValue = Number(rawObserved.toFixed(decimals));
  const gatedRejected = violatedInterferents.length > 0;

  const clsiAnnotation = gatedRejected
    ? `CLSI EP07 GATING REJECT [${violatedInterferents.join(', ')}]: Spectral bias ${
        spectralBiasPct >= 0 ? '+' : ''
      }${spectralBiasPct}% exceeds allowable total error (H=${hil.hemolysisMgDl} mg/dL, I=${hil.icterusMgDl} mg/dL, L=${hil.lipemiaIndex}).`
    : `CLSI EP07 HIL Clear (Bias ${spectralBiasPct >= 0 ? '+' : ''}${spectralBiasPct}%).`;

  return {
    trueValue,
    observedValue,
    spectralBiasPct,
    gatedRejected,
    violatedInterferents,
    clsiAnnotation,
  };
}

/**
 * Bull's Algorithm (X_B, N=20) Moving Average Drift Engine for Hematology
 * Uses Bull's square-root-of-signed-difference smoothing filter:
 * X_B(i) = X_B(i-1) + [ sum( sgn(x_j - X_B(i-1)) * sqrt(|x_j - X_B(i-1)|) ) / N ]^2 * sgn(...)
 */
export function updateBullsAlgorithmXb(
  previousXb: number,
  patientBatchValues: number[],
  targetMean: number,
  historicalBatches: number[]
): BullsAlgorithmState {
  const N = patientBatchValues.length > 0 ? patientBatchValues.length : 20;
  let signedRootSum = 0;

  for (let i = 0; i < patientBatchValues.length; i += 1) {
    const diff = patientBatchValues[i] - previousXb;
    const sign = diff >= 0 ? 1 : -1;
    signedRootSum += sign * Math.sqrt(Math.abs(diff));
  }

  const meanSignedRoot = signedRootSum / N;
  const deltaSign = meanSignedRoot >= 0 ? 1 : -1;
  const nextXb = Number((previousXb + deltaSign * Math.pow(meanSignedRoot, 2)).toFixed(2));
  const driftPct = Number((((nextXb - targetMean) / targetMean) * 100).toFixed(2));
  const updatedHistory = [...historicalBatches.slice(-19), nextXb];

  return {
    batchSizeN: 20,
    currentBatchValues: patientBatchValues,
    historicalBatchesXb: updatedHistory,
    targetMean,
    latestXb: nextXb,
    driftPct,
    outOfBounds: Math.abs(driftPct) > 3.0, // > 3% MCV/MCHC Bull's limit triggers optical/impedance drift alert
  };
}

/**
 * Arrhenius Chemical Kinetics Engine for Reagent & Specimen Thermal Stability
 * k(T) = A * exp(-Ea / (R * T))
 * Baseline refrigeration T0 = 277.15 K (4.0 °C)
 */
export function calculateArrheniusStability(
  temperatureCelsius: number,
  nominalShelfLifeHoursAt4C = 720
): ArrheniusStabilityMetrics {
  const R = 8.314462; // J/(mol*K)
  const Ea = 74500;   // Activation energy (J/mol) for diagnostic enzyme/antibody denaturation
  const T0 = 277.15;  // 4.0 °C reference in Kelvin
  const Tk = temperatureCelsius + 273.15;

  // Relative acceleration factor: k(T) / k(T0) = exp( (Ea / R) * (1/T0 - 1/Tk) )
  const exponent = (Ea / R) * (1 / T0 - 1 / Tk);
  const accelerationFactorVs4C = Number(Math.max(0.1, Math.exp(exponent)).toFixed(2));
  const rateConstantK = Number((0.00014 * accelerationFactorVs4C).toFixed(6));
  const remainingShelfLifeHours = Number(
    Math.max(1, nominalShelfLifeHoursAt4C / accelerationFactorVs4C).toFixed(1)
  );

  const curvePoints: Array<{ hour: number; potencyPct: number }> = [];
  for (let h = 0; h <= 72; h += 6) {
    // First-order decay: C(t) = 100 * exp(-k_eff * h)
    const potencyPct = Number((100 * Math.exp(-rateConstantK * h * 8)).toFixed(1));
    curvePoints.push({ hour: h, potencyPct: Math.max(0, potencyPct) });
  }

  return {
    temperatureCelsius: Number(temperatureCelsius.toFixed(1)),
    temperatureKelvin: Number(Tk.toFixed(2)),
    rateConstantK,
    accelerationFactorVs4C,
    remainingShelfLifeHours,
    nominalShelfLifeHoursAt4C,
    coldChainBreached: temperatureCelsius > 25.0 || temperatureCelsius > 8.0,
    degradationCurvePoints: curvePoints,
  };
}

/**
 * Weibull Mechanical Hazard Function for Robotic Probe & Syringe Plunger Seal
 * h(t) = (beta / eta) * (t / eta)^(beta - 1)
 */
export function calculateWeibullHardwareHazard(
  cyclesExecuted: number,
  shapeBeta = 2.6,
  scaleEtaCycles = 50000
): WeibullWearMetrics {
  const safeCycles = Math.max(1, cyclesExecuted);
  const ratio = safeCycles / scaleEtaCycles;
  const instantaneousHazardRate = Number(
    ((shapeBeta / scaleEtaCycles) * Math.pow(ratio, shapeBeta - 1) * 10000).toFixed(4)
  );
  const survivalProbabilityPct = Number(
    (Math.exp(-Math.pow(ratio, shapeBeta)) * 100).toFixed(2)
  );

  return {
    cyclesExecuted: safeCycles,
    shapeBeta,
    scaleEtaCycles,
    instantaneousHazardRate,
    survivalProbabilityPct,
    maintenanceRequired: survivalProbabilityPct < 75.0,
  };
}

/**
 * Generates deterministic + Gaussian-jittered 5-Part Differential Flow Cytometry Scattergram coordinates
 * for the Sysmex XN-1000 WDF/WNR optical detector channel.
 */
export function generateSysmexScattergram(seedOffset = 0, isAbnormalShift = false): ScattergramPoint[] {
  const clusters: Array<{
    population: ScattergramPoint['population'];
    count: number;
    meanFsc: number;
    meanSsc: number;
    spreadFsc: number;
    spreadSsc: number;
    colorHex: string;
  }> = [
    {
      population: 'LYMPH',
      count: 42,
      meanFsc: 52,
      meanSsc: 74,
      spreadFsc: 14,
      spreadSsc: 16,
      colorHex: '#a855f7', // Purple
    },
    {
      population: 'MONO',
      count: 24,
      meanFsc: 88,
      meanSsc: 145,
      spreadFsc: 18,
      spreadSsc: 20,
      colorHex: '#10b981', // Emerald
    },
    {
      population: 'NEUT',
      count: 68,
      meanFsc: isAbnormalShift ? 168 : 152,
      meanSsc: isAbnormalShift ? 142 : 112,
      spreadFsc: 24,
      spreadSsc: 22,
      colorHex: '#06b6d4', // Cyan
    },
    {
      population: 'EO',
      count: 18,
      meanFsc: 205,
      meanSsc: 86,
      spreadFsc: 14,
      spreadSsc: 15,
      colorHex: '#f43f5e', // Rose
    },
    {
      population: 'BASO',
      count: 10,
      meanFsc: 74,
      meanSsc: 42,
      spreadFsc: 10,
      spreadSsc: 10,
      colorHex: '#f59e0b', // Amber
    },
  ];

  const points: ScattergramPoint[] = [];
  let idx = 0;

  clusters.forEach((cluster) => {
    for (let i = 0; i < cluster.count; i += 1) {
      idx += 1;
      const angle1 = ((idx * 137.5 + seedOffset * 19) % 360) * (Math.PI / 180);
      const radius1 = (((idx * 73 + seedOffset * 11) % 100) / 100) * 0.95;
      const fsc = Math.min(
        245,
        Math.max(8, cluster.meanFsc + Math.cos(angle1) * cluster.spreadFsc * radius1)
      );
      const ssc = Math.min(
        245,
        Math.max(8, cluster.meanSsc + Math.sin(angle1) * cluster.spreadSsc * radius1)
      );
      points.push({
        id: `${cluster.population}-${idx}`,
        fsc: Number(fsc.toFixed(1)),
        ssc: Number(ssc.toFixed(1)),
        population: cluster.population,
        colorHex: cluster.colorHex,
      });
    }
  });

  return points;
}
