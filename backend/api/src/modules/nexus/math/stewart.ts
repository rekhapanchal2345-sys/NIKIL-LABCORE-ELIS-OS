// ==============================================================================
// FILE 3: backend/api/src/modules/nexus/math/stewart.ts
// FEATURE: Stewart-Fencl Physicochemical Acid-Base Electroneutrality Solver
// TARGET PLATFORM: NIKIL-LABCORE-ELIS-OS (Pure TypeScript 5.9)
// ==============================================================================

import { StewartAcidBaseClassification, StewartResult } from '../types/index';

/**
 * Input parameters for the Stewart-Fencl physicochemical acid-base solver.
 * Supports clinical chemistry values with automatic valence/unit normalization.
 */
export interface StewartAcidBaseInput {
  /** Serum Sodium [Na+] in mEq/L (normal ~140 mEq/L) */
  sodiumMeqL: number;
  /** Serum Potassium [K+] in mEq/L (normal ~4.2 mEq/L) */
  potassiumMeqL: number;
  /** Ionized or Strong Ion Calcium [Ca2+] in mEq/L (or total Ca in mg/dL if caUnit === 'mg/dL') */
  calciumValue: number;
  calciumUnit?: 'mEq/L' | 'mg/dL';
  /** Ionized or Strong Ion Magnesium [Mg2+] in mEq/L (or total Mg in mg/dL if mgUnit === 'mg/dL') */
  magnesiumValue: number;
  magnesiumUnit?: 'mEq/L' | 'mg/dL';
  /** Serum Chloride [Cl-] in mEq/L (normal ~102 mEq/L) */
  chlorideMeqL: number;
  /** Blood Lactate [Lactate-] in mEq/L (mmol/L) (normal ~1.0 mEq/L) */
  lactateMeqL: number;
  /** Arterial or venous blood pH (normal ~7.40) */
  pH: number;
  /** Partial pressure of carbon dioxide pCO2 in mmHg (normal ~40 mmHg) */
  pCO2MmHg: number;
  /** Serum Albumin in g/dL (normal ~4.2 g/dL) */
  albuminGDl: number;
  /** Inorganic Phosphate in mmol/L (or mg/dL if phosphateUnit === 'mg/dL') */
  phosphateValue: number;
  phosphateUnit?: 'mmol/L' | 'mg/dL';
}

/**
 * Solves the non-linear Stewart-Fencl physicochemical electroneutrality equations:
 *
 * 1. Apparent Strong Ion Difference (SID_a):
 *    SID_a = [Na+] + [K+] + [Ca2+] + [Mg2+] - [Cl-] - [Lactate-]  (mEq/L)
 *
 * 2. Effective Strong Ion Difference (SID_e):
 *    SID_e = 12.2 * (pCO2 / [H+])
 *            + 10 * [Albumin] * (0.123 * pH - 0.631)
 *            + [Phosphate] * (0.309 * pH - 0.469)
 *    where [H+] = 10^(9 - pH) in nmol/L (Henderson proton activity invariant).
 *
 * 3. Strong Ion Gap (SIG):
 *    SIG = SID_a - SID_e
 *
 * 4. Classifies derangement into:
 *    'UNMEASURED_ANION_ACCUMULATION' | 'HYPERCHLOREMIC_ACIDOSIS' | 'LACTIC_ACIDOSIS' | 'NORMAL'
 */
export function solveStewartAcidBase(input: StewartAcidBaseInput): StewartResult {
  // Guard and clamp inputs to physically realizable bounds to prevent NaN/zero-division
  const na = Number.isFinite(input.sodiumMeqL) ? input.sodiumMeqL : 140.0;
  const k = Number.isFinite(input.potassiumMeqL) ? input.potassiumMeqL : 4.2;
  const cl = Number.isFinite(input.chlorideMeqL) ? input.chlorideMeqL : 102.0;
  const lac = Number.isFinite(input.lactateMeqL) ? Math.max(0.1, input.lactateMeqL) : 1.0;
  const pH = Number.isFinite(input.pH) && input.pH > 6.0 && input.pH < 8.0 ? input.pH : 7.40;
  const pCO2 = Number.isFinite(input.pCO2MmHg) && input.pCO2MmHg > 5.0 ? input.pCO2MmHg : 40.0;
  const alb = Number.isFinite(input.albuminGDl) && input.albuminGDl >= 0 ? input.albuminGDl : 4.2;

  // Convert Calcium to mEq/L if supplied in mg/dL (Atomic weight 40.08, valence 2, ionized fraction ~0.5)
  const rawCa = Number.isFinite(input.calciumValue) ? input.calciumValue : 2.4;
  const caMeqL =
    input.calciumUnit === 'mg/dL'
      ? (rawCa / 4.008) * 0.5 // Ionized divalent activity in mEq/L
      : rawCa;

  // Convert Magnesium to mEq/L if supplied in mg/dL (Atomic weight 24.305, valence 2, ionized fraction ~0.7)
  const rawMg = Number.isFinite(input.magnesiumValue) ? input.magnesiumValue : 1.4;
  const mgMeqL =
    input.magnesiumUnit === 'mg/dL'
      ? (rawMg / 1.215) * 0.7
      : rawMg;

  // Convert Phosphate to mmol/L if supplied in mg/dL (Atomic weight of P = 30.97 g/mol -> divide mg/dL by 3.097)
  const rawPo4 = Number.isFinite(input.phosphateValue) ? input.phosphateValue : 1.15;
  const po4MmolL =
    input.phosphateUnit === 'mg/dL' ? rawPo4 / 3.097 : rawPo4;

  // 1. Apparent Strong Ion Difference (SID_a) in mEq/L
  const sidApparentMeqL = na + k + caMeqL + mgMeqL - cl - lac;

  // 2. Proton activity [H+] in nmol/L (at pH 7.40, [H+] = 10^(9 - 7.40) = 39.8107 nmol/L)
  // Note: To prevent zero division, [H+] is strictly positive for all finite pH
  const protonConcentrationNmolL = Math.max(1e-6, Math.pow(10, 9.0 - pH));

  // Bicarbonate term per Stewart-Fencl directive: 12.2 * (pCO2 / [H+])
  const bicarbonateCalculatedMeqL = 12.2 * (pCO2 / protonConcentrationNmolL);

  // Weak acid dissociation charge of Albumin: 10 * [Albumin (g/dL)] * (0.123 * pH - 0.631)
  const albuminChargeMeqL = 10.0 * alb * (0.123 * pH - 0.631);

  // Weak acid dissociation charge of Inorganic Phosphate: [Phosphate (mmol/L)] * (0.309 * pH - 0.469)
  const phosphateChargeMeqL = po4MmolL * (0.309 * pH - 0.469);

  // 3. Effective Strong Ion Difference (SID_e) in mEq/L
  const sidEffectiveMeqL =
    bicarbonateCalculatedMeqL + albuminChargeMeqL + phosphateChargeMeqL;

  // 4. Strong Ion Gap (SIG = SID_a - SID_e)
  const strongIonGapMeqL = sidApparentMeqL - sidEffectiveMeqL;

  // Fencl-Stewart Free Water Effect: 0.3 * ([Na+] - 140)
  const freeWaterEffectMeqL = 0.3 * (na - 140.0);

  // Fencl-Stewart Corrected Chloride Effect: 102 - ([Cl-] * 140 / [Na+])
  const correctedChloride = cl * (140.0 / Math.max(100.0, na));
  const chlorideEffectMeqL = 102.0 - correctedChloride;

  // Electroneutrality classification hierarchy
  let classification: StewartAcidBaseClassification = 'NORMAL';
  let biophysicalInterpretation =
    'Physicochemical electroneutrality is preserved within homeostatic Stewart-Fencl manifold bounds.';

  if (lac >= 2.5 && (pH < 7.36 || sidApparentMeqL < 38.0)) {
    classification = 'LACTIC_ACIDOSIS';
    biophysicalInterpretation = `Lactate accumulation (${lac.toFixed(
      2
    )} mEq/L) directly contracts Apparent Strong Ion Difference (SID_a = ${sidApparentMeqL.toFixed(
      2
    )} mEq/L), driving proton generation via water dissociation to preserve electrical neutrality.`;
  } else if (strongIonGapMeqL > 6.0) {
    classification = 'UNMEASURED_ANION_ACCUMULATION';
    biophysicalInterpretation = `Elevated Strong Ion Gap (SIG = +${strongIonGapMeqL.toFixed(
      2
    )} mEq/L) reveals unmeasured strong anions (ketoacids, uremic organic acids, salicylates, or toxic glycol metabolites) displacing weak buffer base (SID_e = ${sidEffectiveMeqL.toFixed(
      2
    )} mEq/L).`;
  } else if (correctedChloride > 107.0 || chlorideEffectMeqL < -4.0) {
    classification = 'HYPERCHLOREMIC_ACIDOSIS';
    biophysicalInterpretation = `Hyperchloremic strong ion compression (Na-corrected [Cl-] = ${correctedChloride.toFixed(
      1
    )} mEq/L, Chloride Effect = ${chlorideEffectMeqL.toFixed(
      2
    )} mEq/L) narrows SID_a (${sidApparentMeqL.toFixed(
      2
    )} mEq/L), consistent with 0.9% NaCl resuscitation acidosis or renal tubular acidosis.`;
  }

  return {
    sidApparentMeqL: Number(sidApparentMeqL.toFixed(4)),
    sidEffectiveMeqL: Number(sidEffectiveMeqL.toFixed(4)),
    strongIonGapMeqL: Number(strongIonGapMeqL.toFixed(4)),
    bicarbonateCalculatedMeqL: Number(bicarbonateCalculatedMeqL.toFixed(4)),
    albuminChargeMeqL: Number(albuminChargeMeqL.toFixed(4)),
    phosphateChargeMeqL: Number(phosphateChargeMeqL.toFixed(4)),
    freeWaterEffectMeqL: Number(freeWaterEffectMeqL.toFixed(4)),
    chlorideEffectMeqL: Number(chlorideEffectMeqL.toFixed(4)),
    classification,
    electroneutralityResidualMeqL: Number(strongIonGapMeqL.toFixed(4)),
    biophysicalInterpretation,
  };
}
